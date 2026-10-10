import { draftMode, headers } from "next/headers";
import { redirect } from "next/navigation";

import { safePreviewPath } from "@/components/cms/previewPath";
import { getCms } from "@/lib/cms/payload";

/**
 * ==========================================================================
 * GET /preview?path=/about&collection=pages&id=… — draft preview on (SPEC §G.5)
 * ==========================================================================
 *
 * The admin's "Preview" button and its live-preview iframe both land here
 * (`admin.preview` / `admin.livePreview.url`, wired by 2A-1). Payload runs in
 * this same Next process, so the admin's `payload-token` cookie is a
 * same-origin cookie on this request and `payload.auth` reads the signed-in
 * user from it — there is no shared secret to leak in a URL.
 *
 * Only the roles that can read drafts get draft mode: admins and editors
 * (`publishedOrEditor`, cms/access/roles.ts). Anyone else — signed out, or
 * front-desk — gets a 401 and no cookie, so a draft is never one forwarded
 * link away from the public.
 *
 * Draft mode is Next's own: a signed `__prerender_bypass` cookie that makes
 * every route render per request and lets the getters read drafts (see
 * lib/cms/draft.ts). It lasts for the browser session; /exit-preview ends it.
 *
 * `path` is validated before anything else (components/cms/previewPath.ts) —
 * it is attacker-controlled and this route ends in a redirect.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = safePreviewPath(url.searchParams.get("path"));
  if (!path) return new Response("Invalid preview path.", { status: 400 });

  const payload = await getCms();
  const { user } = await payload.auth({ headers: await headers() });
  const role = (user as { role?: string } | null)?.role;
  if (!user || (role !== "admin" && role !== "editor")) {
    return new Response("Sign in to the admin as an editor to preview drafts.", { status: 401 });
  }

  (await draftMode()).enable();
  redirect(addressOf(path));
}

/*
  Every page's preview path is `/{slug}` (cms/lib/publicUrl.ts `routeFor`),
  and page slugs are one segment — so the enquiry page, whose slug is
  `private-events-book`, would preview at an address that is a 404. Its
  route is `/private-events/book`.
*/
function addressOf(path: string): string {
  return path === "/private-events-book" || path.startsWith("/private-events-book?")
    ? path.replace("/private-events-book", "/private-events/book")
    : path;
}
