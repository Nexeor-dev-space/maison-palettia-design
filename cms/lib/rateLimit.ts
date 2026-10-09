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
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  const real = headers.get("x-real-ip")?.trim();
  return real || "0.0.0.0";
}
