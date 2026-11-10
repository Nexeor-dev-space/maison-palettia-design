/**
 * ==========================================================================
 * Experience page photographs — the one rule the hand-over shares
 * ==========================================================================
 *
 * Until Nov 2026 each experience page's banner and About frames were held in
 * code and laid over whatever the CMS answered. They are CMS fields now
 * ("Page photograph" and "Gallery" on the experience). Two places still need
 * to know how the code-held frames sat over the CMS ones, and must agree:
 *
 *   · lib/experiences.ts — which keeps showing the in-file photographs until
 *     the library holds them, so no deploy order can blank a banner;
 *   · cms/lib/pagePhotos.ts — the one-time move that puts them there.
 *
 * Import-free on purpose: the site reader and the CMS script both load it.
 * When the move has run everywhere, this file, the move and the overlay in
 * lib/experiences.ts can all be deleted together.
 */

/**
 * How many leading About frames stayed the CMS's own while the rest were
 * held in code. Glass painting swapped only its third frame; every other
 * experience replaced the whole list.
 */
export const CMS_FRAMES_KEPT: Readonly<Record<string, number>> = { "glass-painting": 2 };

/** The About frames a page showed: the CMS's first few (where it kept any), then the held ones from that position on. */
export function pageGallery<T>(slug: string, stored: readonly T[], held: readonly T[]): T[] {
  const keep = CMS_FRAMES_KEPT[slug] ?? 0;
  return [...stored.slice(0, keep), ...held.slice(keep)];
}
