import { renderItemCard } from "@/components/cms/shareCard";
import { formatJournalDate, getPostBySlug, JOURNAL_PLACEHOLDER, listPostSlugs } from "@/lib/cms/journal";
import { SHARE_CARD_SIZE } from "@/lib/seo";

/**
 * ==========================================================================
 * /journal/[slug] — the share card, from the story's cover
 * ==========================================================================
 *
 * The site's light share card (components/cms/shareCard.tsx, where the
 * composition and its reasons live), drawn for a story at the same 684x360 —
 * WhatsApp's 600KB ceiling on a PNG photograph (SHARE_CARD_SIZE in
 * lib/seo.ts). The cover as a tilted print on the right; on the left the
 * logo, the story's category as a chip in the category's own colour (the
 * admin's `post-categories.colour`, as the journal's chips draw it), the
 * title, the excerpt clamped to two lines, "N min read · <date>", and the
 * pill "Read the story".
 *
 * THE TITLE'S FACE IS DECIDED PER STORY. A headline with no digit is set in
 * the script, as an event's name is; one that carries a number ("5
 * things…") is set in Montserrat SemiBold, because Hapsha's 7, 8 and 9 are
 * placeholder marks. Every glyph on the card is covered by a font handed to
 * Satori explicitly — a glyph no supplied font has makes it reach out to the
 * network at render time, which a share card must never do — so the text is
 * filtered to what the fonts carry. A long title steps down a size and is
 * clamped so the rest of the card keeps its place.
 *
 * A story whose cover is missing gets the card without the print: the
 * placeholder the listing draws in its place is not a photograph.
 */

export const alt = "A Maison Palettia journal story: its cover photograph beside its title";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  const rows = await listPostSlugs();
  return rows.map(({ slug }) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return new Response("Not found", { status: 404 });

  const photo = post.seo.image ?? post.coverImage;
  const date = formatJournalDate(post.publishedAt);

  return renderItemCard({
    seed: post.slug,
    chip: post.category
      ? { label: post.category.name, tone: post.category.colour }
      : { label: "Journal", tone: "lilac" },
    title: post.title,
    lede: post.excerpt,
    ledeLines: 2,
    details: [{ icon: "book", text: `${post.readingTime} min read${date ? ` \u00b7 ${date}` : ""}` }],
    photo: photo.src && photo.src !== JOURNAL_PLACEHOLDER.src ? { src: photo.src, position: photo.position } : null,
    cta: "Read the story",
  });
}
