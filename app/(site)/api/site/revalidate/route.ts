import { purge } from "@/cms/hooks/revalidate";
import { sha256Hex } from "@/cms/lib/crypto";
import { clientIp, ipHash, rateLimit } from "@/cms/lib/rateLimit";
import { verifySig } from "@/cms/lib/signing";
import { TAGS } from "@/lib/cms/cache";

/**
 * ==========================================================================
 * POST /api/site/revalidate — the signed purge for callers with no request
 * ==========================================================================
 *
 * SPEC §G.4. A Payload hook purges inside `after()`, which needs a request
 * to defer behind. Scheduled publishing runs in the jobs runner and has
 * none, so cms/hooks/revalidate.ts (`postSignedRevalidate`) POSTs the same
 * purge here on the loopback interface; `scripts/deploy.sh` will use it
 * after a restart (`{ layout: true }`). Without this route a page scheduled
 * to go live — or to come down — changed in the database while the cached
 * page kept serving the old copy for up to a day.
 *
 * THE SIGNATURE. `Authorization: Bearer <unix>.<sha256(body)>.<hmac>`, with
 * `hmac = sign("revalidate-v1", "<unix>.<sha256>")` (cms/lib/signing.ts —
 * a key no other token shares). Accepted within ±60 s of this server's
 * clock, and each (unix, sha256) pair once: a captured request cannot be
 * replayed inside its minute. The nonce set lives in process memory, which
 * is the right store for one Node process (SPEC §A.5) and is pruned as it
 * goes.
 *
 * THE BODY is validated before anything runs: `tags` must be tags the site
 * actually uses (`TAGS`), `paths` site-relative and plain. 30 requests a
 * minute per client (SPEC §H rate table) — a real caller sends one per
 * scheduled publish.
 *
 * Phase 3B owns `/api/site/**` and may fold this into its own handlers; the
 * contract above is the SPEC's, so nothing that calls it has to change.
 */

const WINDOW_SECONDS = 60;
const MAX_BODY_BYTES = 16 * 1024;
const PATH_RE = /^\/[a-z0-9\-/.]{0,200}$/;
const KNOWN_TAGS = new Set<string>(Object.values(TAGS));

/** (unix.sha256) → when it may be forgotten (ms). */
const seen = new Map<string, number>();

function firstUse(nonce: string, now: number): boolean {
  for (const [key, expires] of seen) if (expires <= now) seen.delete(key);
  if (seen.has(nonce)) return false;
  seen.set(nonce, now + 5 * 60_000);
  return true;
}

const deny = (status: number, message: string) => Response.json({ error: message }, { status });

const isList = (value: unknown, test: (item: string) => boolean): value is string[] =>
  Array.isArray(value) && value.length <= 200 && value.every((item) => typeof item === "string" && test(item));

export async function POST(request: Request): Promise<Response> {
  if (!rateLimit("revalidate", ipHash(clientIp(request.headers)), { limit: 30, windowMs: 60_000 })) {
    return deny(429, "Too many requests.");
  }

  const match = /^Bearer (\d{1,12})\.([0-9a-f]{64})\.([A-Za-z0-9_-]{1,128})$/.exec(request.headers.get("authorization") ?? "");
  if (!match) return deny(401, "Missing or malformed signature.");
  const [, unixRaw, hash, sig] = match;

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return deny(413, "Body too large.");

  const now = Date.now();
  if (Math.abs(now / 1000 - Number(unixRaw)) > WINDOW_SECONDS) return deny(401, "Signature expired.");
  if (sha256Hex(raw) !== hash || !verifySig("revalidate-v1", `${unixRaw}.${hash}`, sig)) {
    return deny(401, "Bad signature.");
  }
  if (!firstUse(`${unixRaw}.${hash}`, now)) return deny(409, "Already used.");

  let body: { tags?: unknown; paths?: unknown; layout?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return deny(400, "Body is not JSON.");
  }
  const tags = body.tags ?? [];
  const paths = body.paths ?? [];
  if (!isList(tags, (tag) => KNOWN_TAGS.has(tag))) return deny(400, "Unknown tag.");
  if (!isList(paths, (path) => PATH_RE.test(path) && !path.includes(".."))) return deny(400, "Bad path.");
  if (body.layout !== undefined && typeof body.layout !== "boolean") return deny(400, "Bad layout flag.");

  purge(tags, paths, body.layout === true);
  return Response.json({ revalidated: true, tags: tags.length, paths: paths.length, layout: body.layout === true });
}
