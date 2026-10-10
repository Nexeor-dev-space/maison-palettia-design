import { allow, siteRequest } from "@/cms/lib/mamo/http";

/**
 * ==========================================================================
 * GET /.well-known/apple-developer-merchantid-domain-association
 * ==========================================================================
 *
 * Apple Pay on the web needs this file on our domain (research 02 §A8). It
 * is certainly required for Mamo's inline/modal checkout and UNVERIFIED for
 * the standalone hosted page we use (TODO(mamo-verify), SPEC §M.11), so the
 * owner pastes it into Settings → Payments → "Apple Pay domain file" only if
 * Mamo asks — no file in the repo, no redeploy.
 *
 * Reached through a rewrite in next.config.ts (`/.well-known/…` →
 * `/api/site/apple-domain-association`), because an app segment cannot
 * start with a dot (SPEC §A.2 rule 7). Plain text, exactly as pasted; 404
 * while the field is empty so Apple's checker sees "not configured" rather
 * than an empty file. 30/min per hashed IP; a short public cache, since
 * Apple fetches it rarely and the content is not secret.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!allow(request, "apple-domain", 30, 60_000)) return new Response("Too many requests.", { status: 429 });
  const { payload } = await siteRequest(request);
  const settings = (await payload.findGlobal({
    slug: "payment-settings",
    depth: 0,
    overrideAccess: true,
    select: { appleDomainAssociation: true },
  })) as { appleDomainAssociation?: string | null };

  const body = settings.appleDomainAssociation?.trim();
  if (!body) return new Response("Not found.", { status: 404, headers: { "cache-control": "no-store" } });
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
