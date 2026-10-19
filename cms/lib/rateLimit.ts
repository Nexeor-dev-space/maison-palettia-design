export { ipHash } from "./crypto";

/**
 * ==========================================================================
 * Rate limiting — in-memory fixed windows, keyed by a hashed client IP
 * ==========================================================================
 *
 * Every public route under `/api/site/**` is limited per route (SPEC §H:
 * checkout 10/min, enquiries 5/h, the webhook 60/min, …). The site is one
 * Node process on one server (SPEC §A.5), so a `Map` in process memory is
 * the right store: no Redis to run, no network hop on the hot path, and the
 * counters die with the process, which is fine for limits measured in
 * minutes. If the site is ever scaled to several processes this is the
 * module to swap for a shared store — the signature is the contract
 * (cms/lib/contracts.ts), the storage is not.
 *
 * FIXED WINDOW, NOT A SLIDING ONE. A sliding log would be fairer at the
 * boundary, but the point of these limits is to stop scripts, not to meter
 * customers, and a fixed window is one integer per key. Buckets are pruned
 * lazily on write so an attack that rotates keys cannot grow the map without
 * bound between requests.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastPruneAt = 0;
const PRUNE_EVERY_MS = 60_000;

function prune(now: number) {
  if (now - lastPruneAt < PRUNE_EVERY_MS) return;
  lastPruneAt = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Records one hit for `key` in `bucket` and says whether it is still within
 * the limit. `true` means allowed. Call it once per request, before any work.
 *
 *   if (!rateLimit("checkout-start", ipHash(clientIp(req.headers)), { limit: 10, windowMs: 60_000 }))
 *     return new Response("Too many requests", { status: 429 });
 */
export function rateLimit(bucket: string, key: string, opts: { limit: number; windowMs: number }): boolean {
  const now = Date.now();
  prune(now);
  const id = `${bucket}:${key}`;
  let entry = buckets.get(id);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(id, entry);
  }
  entry.count += 1;
  return entry.count <= opts.limit;
}

/** For tests and for the admin's "reset limits" affordance if one is ever wanted. */
export function resetRateLimits(bucket?: string) {
  if (!bucket) return buckets.clear();
  for (const key of buckets.keys()) if (key.startsWith(`${bucket}:`)) buckets.delete(key);
}

/**
 * The client's IP as the reverse proxy saw it.
 *
 * The owner's proxy APPENDS the connecting address to `X-Forwarded-For`
 * (SPEC §A.5), so the trustworthy hop is the LAST one. Anything before it was
 * supplied by the client and can say whatever it likes — reading the first
 * hop, as most snippets do, would let a script pick its own rate-limit
 * bucket. With no proxy header at all (local dev) `x-real-ip` is tried, then
 * a constant, so limits still apply rather than silently vanishing.
 *
 * BEHIND CLOUDFLARE THE LAST HOP IS CLOUDFLARE, not the visitor, and every
 * visitor routed through the same edge would share one bucket — checkout
 * and enquiries answering "too many requests" to strangers. So when the
 * last hop is one of Cloudflare's own addresses, the visitor is read from
 * `CF-Connecting-IP`, which Cloudflare sets itself (overwriting anything a
 * client sent). From any other last hop that header is ignored: without the
 * CDN in front it is just a header a client can type.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length) {
      const last = hops[hops.length - 1];
      const visitor = headers.get("cf-connecting-ip")?.trim();
      return visitor && isCloudflare(last) ? visitor : last;
    }
  }
  const real = headers.get("x-real-ip")?.trim();
  return real || "0.0.0.0";
}

/* Cloudflare's published edge ranges (cloudflare.com/ips-v4, /ips-v6, as of
   2026-10-20). They change rarely; if one is added and missed here, those
   visitors fall back to sharing a bucket — the old behaviour, not a hole. */
const CLOUDFLARE_V4 = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
];
const CLOUDFLARE_V6 = [
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
  "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
];

function v4ToBits(ip: string): bigint | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = BigInt(0);
  for (const part of parts) {
    const octet = Number(part);
    if (!/^\d{1,3}$/.test(part) || octet > 255) return null;
    n = (n << BigInt(8)) | BigInt(octet);
  }
  return n;
}

function v6ToBits(ip: string): bigint | null {
  const [head, tail, extra] = ip.split("::");
  if (extra !== undefined) return null;
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = tail === undefined ? left : [...left, ...Array(8 - left.length - right.length).fill("0"), ...right];
  if (groups.length !== 8) return null;
  let n = BigInt(0);
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
    n = (n << BigInt(16)) | BigInt(parseInt(group, 16));
  }
  return n;
}

function inRanges(bits: bigint, size: number, ranges: string[], parse: (ip: string) => bigint | null): boolean {
  return ranges.some((range) => {
    const [base, prefix] = range.split("/");
    const start = parse(base);
    if (start === null) return false;
    const shift = BigInt(size - Number(prefix));
    return bits >> shift === start >> shift;
  });
}

function isCloudflare(ip: string): boolean {
  // A proxy may record an IPv4 peer in its IPv6-mapped form.
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  const asV4 = v4ToBits(v4);
  if (asV4 !== null) return inRanges(asV4, 32, CLOUDFLARE_V4, v4ToBits);
  const asV6 = v6ToBits(ip);
  return asV6 !== null && inRanges(asV6, 128, CLOUDFLARE_V6, v6ToBits);
}
