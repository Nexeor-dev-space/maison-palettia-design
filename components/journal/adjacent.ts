import { getPostBySlug, listPostSlugs } from "@/lib/cms/journal";
import type { JournalPostCard } from "@/lib/cms/journalShared";

/**
 * The published story before and after `slug`, by date.
 *
 * `listPostSlugs` is newest first, so "next" (the newer story) sits one
 * place EARLIER in the list and "previous" one place later. Both reads are
 * cached under the Journal's tags, so a publish refreshes them with the
 * page. A draft being previewed is not in the published list and gets
 * neither neighbour, which is the honest answer until it is live.
 */
export async function getAdjacentPosts(
  slug: string,
): Promise<{ previous: JournalPostCard | null; next: JournalPostCard | null }> {
  const slugs = (await listPostSlugs()).map((row) => row.slug);
  const at = slugs.indexOf(slug);
  if (at === -1) return { previous: null, next: null };
  const [next, previous] = await Promise.all([
    at > 0 ? getPostBySlug(slugs[at - 1]) : null,
    at < slugs.length - 1 ? getPostBySlug(slugs[at + 1]) : null,
  ]);
  return { previous, next };
}
