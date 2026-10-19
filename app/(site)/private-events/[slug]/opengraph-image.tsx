import { renderItemCard, toneForSlug } from "@/components/cms/shareCard";
import { getPrivateEventAudience, getPrivateEventAudiences } from "@/lib/privateEvents.server";
import { SHARE_CARD_SIZE } from "@/lib/seo";

/**
 * ==========================================================================
 * /private-events/[slug] — the share card, from the programme's photograph
 * ==========================================================================
 *
 * The site's light share card (components/cms/shareCard.tsx, where the
 * composition and its reasons live), at 684x360 like every generated card:
 * the programme's photograph as a tilted print on the right; on the left the
 * logo, a "Private events" chip, the programme's name in the brand script,
 * its one-line description (clamped to two lines) and the pill "Plan your
 * event". The chip's colour and the print's tilt are fixed by the slug, so
 * the four programmes are four different cards.
 *
 * WHAT IS DIFFERENT HERE, AND WHY THIS FILE EXISTS AT ALL. These four pages
 * already had a share image: the page passed `audience.image.src` to
 * buildMetadata. But that is the full-size original — 1.4 to 2.4MB, four
 * times over WhatsApp's 600KB preview limit — and for Mall & Community
 * Activations a 4000x6000 PORTRAIT, which every platform's landscape card
 * crops to whatever happens to be in the middle. This draws the same
 * photograph at the share frame instead, cropped where the data says the
 * subject is (`image.position` — for the mall frame that is the hands and the
 * mug, 55% down, which the note on it in lib/privateEvents.ts explains).
 * Measured: 306–374KB for all four.
 *
 * The page no longer passes an `image`, and lib/seo.ts would leave
 * `openGraph.images` unset for every /private-events/<slug> path if it did —
 * see ROUTES_WITH_OWN_SHARE_IMAGE there — because Next only lets a file
 * supply the image when the page's metadata has not.
 */

export const alt = "A Maison Palettia private event: its photograph beside its name and what it is";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getPrivateEventAudiences()).map((audience) => ({ slug: audience.slug }));
}

/*
  The programme's photograph is a Media upload once the CMS has it, a
  committed /public file before — components/cms/ogImage.ts reads either and
  re-encodes the Media sizes' WebP into something Satori can draw.
*/
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const audience = await getPrivateEventAudience(slug);

  /* The page 404s for an unknown slug; its card does the same. */
  if (!audience) return new Response("Not found", { status: 404 });

  /* `image` is optional on a programme; without one the words take the card. */
  const photo = audience.pageImage ?? audience.image;

  return renderItemCard({
    seed: audience.slug,
    chip: { label: "Private events", tone: toneForSlug(audience.slug) },
    title: audience.name,
    lede: audience.description,
    photo: photo ? { src: photo.src, position: photo.position } : null,
    cta: "Plan your event",
  });
}
