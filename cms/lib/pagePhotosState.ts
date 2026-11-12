import type { Payload } from "payload";

/**
 * Has the one-time move of the experience pages' photographs into the media
 * library run against this database (cms/lib/pagePhotos.ts)?
 *
 * False when it has not, and false when that cannot be read (a database
 * without the column yet) — the safe answer, because "not moved" keeps the
 * code-held photographs on the page.
 *
 * A file of its own so the site (lib/experiences.ts) can ask without pulling
 * the move itself — file reads, the storage keys — into its bundle.
 */
export async function pagePhotosMoved(payload: Payload): Promise<boolean> {
  try {
    const state = (await payload.findGlobal({ slug: "system-state", depth: 0, overrideAccess: true })) as { pagePhotosMovedAt?: unknown };
    return Boolean(state?.pagePhotosMovedAt);
  } catch {
    return false;
  }
}
