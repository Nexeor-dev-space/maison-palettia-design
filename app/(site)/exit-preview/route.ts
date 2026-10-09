import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { safePreviewPath } from "@/components/cms/previewPath";

/**
 * GET /exit-preview?path=/about — draft preview off (SPEC §G.5).
 *
 * Clears Next's draft-mode cookie and returns to `path` (validated exactly as
 * /preview validates it — this route redirects too), or to the homepage when
 * none is given. Needs no sign-in: turning drafts OFF is safe for anyone.
 */
export async function GET(request: Request): Promise<Response> {
  const raw = new URL(request.url).searchParams.get("path");
  const path = raw === null ? "/" : safePreviewPath(raw);
  if (!path) return new Response("Invalid path.", { status: 400 });

  (await draftMode()).disable();
  redirect(path);
}
