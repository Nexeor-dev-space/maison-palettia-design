import { renderItemCard, toneForSlug, type ShareDetail } from "@/components/cms/shareCard";
import {
  eventFlag,
  eventImage,
  eventIntro,
  eventTitle,
  getEventDetail,
  getEventSlugs,
  type EventDetail,
  type WalkInEvent,
} from "@/lib/eventDetail";
import { getMallPartners } from "@/lib/partners";
import { SHARE_CARD_SIZE } from "@/lib/seo";
import {
  formatPrice,
  formatVenueLine,
  formatWorkshopDate,
  hasSessionPassed,
  isFullyBooked,
  sessionTimeRange,
} from "@/lib/workshopHelpers";
import type { Workshop } from "@/types";

/**
 * ==========================================================================
 * /events/[slug] — the share card, from the event's own photograph
 * ==========================================================================
 *
 * A link to an activity used to unfurl with no picture at all: the page's
 * metadata passed no image, and the site default was null. This draws one per
 * slug from the photograph at the top of that page — `eventImage`, the same
 * accessor the page's header reads — so when the client's new hero for an
 * activity lands in lib/experiences.ts, its share card follows with no other
 * change.
 *
 * THE CARD. The site's light share card (components/cms/shareCard.tsx — the
 * composition and its reasons live there): the activity's photograph as a
 * tilted print on the right; on the left the logo, a chip, the name in the
 * brand script, and what a visitor needs to decide, each with a small icon —
 *
 *   a dated session, a format, an activity split into formats ..... chip
 *     "<category> workshop"; the next date and start time in Dubai time
 *     ("Next:" when there is more than one ahead), the venue, and the price
 *     ("AED 240 per person", or "From AED …" when the dates ahead differ);
 *     pill "Book your seat".
 *   a walk-in activity ..... chip "Walk in · any time"; its one line, "Drop
 *     in any time" and the studio's one confirmed destination (the rule the
 *     page's location section uses — see `partner` there); no price, because
 *     none is recorded. Pill "Just drop in". A flagged activity ("Coming
 *     soon") wears its flag as the chip and says "Find out more" instead.
 *
 * Every card is its own: its photograph, its name, its facts, and a chip
 * colour and print tilt fixed by its slug (`toneForSlug`), so two activities
 * shared side by side in a chat do not look like one card twice.
 *
 * ==========================================================================
 * WHY 684x360 AND NOT 1200x630 — WHATSAPP
 * ==========================================================================
 *
 * ImageResponse writes PNG and nothing else, and a photograph does not
 * compress as PNG. At 1200x630 these cards measured 0.98–1.22MB. Meta's
 * WhatsApp link-preview documentation asks for an og:image under 600KB (and
 * at least 300px wide), and WhatsApp is how most of this studio's links will
 * travel. So the card is drawn at
 * the same 1.9:1 proportion, smaller: 684x360 measured 339–448KB across all
 * seven activities (bedazzling, the busiest photograph, is the 448). That is
 * above every platform's floor for a LARGE card (Facebook's is 600x315, X's
 * 300x157, WhatsApp's 300px wide) and leaves a quarter of WhatsApp's limit
 * spare for a busier photograph than any supplied so far.
 *
 * Every measurement on the card is drawn at 1200x630 and scaled by `U`, so
 * the composition can go back up with one edit (SHARE_CARD_SIZE in
 * lib/seo.ts) if a JPEG pipeline ever makes the bytes stop mattering.
 *
 * The programme and journal cards are the same composition with their own
 * words; change the look in components/cms/shareCard.tsx, once.
 *
 * WHY THE PAGE ITSELF SAYS NOTHING ABOUT IMAGES. A file here only wins if the
 * page's metadata leaves `openGraph.images` unset, and lib/seo.ts does that
 * for every /events/<slug> path — see ROUTES_WITH_OWN_SHARE_IMAGE there.
 */

/*
  One alt for every slug: the `alt` export is static, and a per-slug one
  would need generateImageMetadata, which moves the URL under an id segment.
  The activity's name is on the card and in og:title beside it.
*/
export const alt = "A Maison Palettia activity: its photograph beside its name and when and where to join it";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

/*
  The page's own window (see `revalidate` in page.tsx): the card now prints
  the next date, which moves on as dates pass, so it is re-drawn as often as
  the page that names it rather than living as long as the deployment.
  A literal, not `60 * 10`: the value has to be statically analysable.
*/
export const revalidate = 600;

/*
  Prerender a card for every slug the page prerenders, from the same list.
  Without this the cards are drawn on first request instead of at build.
*/
export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

/** The dates still ahead, soonest first, that this page sells. */
function datesAhead(detail: Exclude<EventDetail, WalkInEvent>, now: number): Workshop[] {
  const dates = detail.kind === "scheduled" ? [detail.workshop] : detail.sessions;
  return dates.filter((session) => !hasSessionPassed(session, now));
}

/** "AED 240 per person", or "From AED 240" when the dates ahead are not all one price. */
function priceLine(sessions: readonly Workshop[]): string | null {
  if (!sessions.length) return null;
  const cheapest = sessions.reduce((low, session) => (session.price.amount < low.price.amount ? session : low));
  const same = sessions.every(
    (session) => session.price.amount === cheapest.price.amount && session.price.currency === cheapest.price.currency,
  );
  return same ? `${formatPrice(cheapest.price)} per person` : `From ${formatPrice(cheapest.price)}`;
}

/** "Sat 24 Oct · 3:30 PM" — the start, in the studio's time zone. */
const whenLine = (session: Workshop) =>
  `${formatWorkshopDate(session.startsAt)} \u00b7 ${sessionTimeRange(session.startsAt, session.durationMinutes).start}`;

/** "Craft workshop" from the session's free-text category; "Workshop" without one. */
function workshopChip(category: string | undefined): string {
  const clean = category?.trim();
  if (!clean) return "Workshop";
  return /workshop/i.test(clean) ? clean : `${clean} workshop`;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const now = Date.now();
  const detail = await getEventDetail(slug, now);

  /* The page 404s for an unknown slug; its card does the same. */
  if (!detail) return new Response("Not found", { status: 404 });

  const photo = eventImage(detail);
  const common = {
    title: eventTitle(detail),
    /* An activity without a photograph gets the same card with the print left out. */
    photo: photo ? { src: photo.src, position: photo.position } : null,
  };

  if (detail.kind === "diy") {
    const partners = await getMallPartners();
    const venue = partners.length === 1 ? partners[0] : undefined;
    const flag = eventFlag(detail);
    const details: ShareDetail[] = [];
    if (!flag) details.push({ icon: "walk", text: "Drop in any time" });
    if (venue) details.push({ icon: "pin", text: formatVenueLine(venue) });
    return renderItemCard({
      ...common,
      seed: detail.slug,
      chip: { label: flag ?? "Walk in \u00b7 any time", tone: toneForSlug(detail.slug) },
      lede: eventIntro(detail),
      details,
      cta: flag ? "Find out more" : "Just drop in",
    });
  }

  const ahead = datesAhead(detail, now);
  const next = ahead[0];
  const shown = next ?? (detail.kind === "scheduled" ? detail.workshop : undefined);
  const details: ShareDetail[] = [
    {
      icon: "calendar",
      text: next ? `${ahead.length > 1 && detail.kind !== "scheduled" ? "Next: " : ""}${whenLine(next)}` : "New dates coming soon",
    },
  ];
  if (shown?.venue) details.push({ icon: "pin", text: formatVenueLine(shown.venue) });
  const price = priceLine(ahead.length ? ahead : shown ? [shown] : []);
  if (price) details.push({ icon: "price", text: price });

  /* A dated session shares its format's colour and tilt, so its card and the format's agree. */
  const seed = detail.kind === "scheduled" ? detail.canonicalSlug : detail.slug;
  const soldOut = detail.kind === "scheduled" && next !== undefined && isFullyBooked(next);
  return renderItemCard({
    ...common,
    seed,
    chip: { label: workshopChip(shown?.category), tone: toneForSlug(seed) },
    details,
    cta: !next ? "See what\u2019s on" : soldOut ? "See other dates" : "Book your seat",
  });
}
