import { draftMode } from "next/headers";

/**
 * Whether the current request is in Next draft mode (SPEC §G.5).
 *
 * Staff enter it through `/preview` (Phase 2), which checks the admin's
 * same-origin `payload-token` cookie before enabling it. Getters take
 * `{ draft }` and, when true, bypass `cached` and read drafts through the
 * Local API; draft mode also makes the route dynamic per request, so a
 * preview never lands in the static cache.
 *
 * `draftMode()` throws outside a request scope (a Payload hook, a job, the
 * CLI). There is no draft to preview there, so the answer is simply "no".
 */
export async function isDraft(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}
