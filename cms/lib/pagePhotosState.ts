import type { Payload } from "payload";

/**
 * Has the one-time move of the experience pages' photographs run against
 * this database (cms/lib/pagePhotos.ts)? False when that cannot be read.
 *
 * A file of its own because the site reads it on every experiences load
 * (lib/experiences.ts) and must not pull the move — the seed lists, the
 * storage client — into its bundle to do so.
 */
export async function pagePhotosMoved(payload: Payload): Promise<boolean> {
  try {
    const state = (await payload.findGlobal({ slug: "system-state", depth: 0, overrideAccess: true })) as { pagePhotosMovedAt?: unknown };
    return Boolean(state?.pagePhotosMovedAt);
  } catch {
    return false;
  }
}
