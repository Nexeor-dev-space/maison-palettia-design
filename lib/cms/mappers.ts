import { resolveLink, type LinkValue } from "@/cms/fields/link";
import {
  DEFAULT_AUTHOR_NAME,
  headingsOf,
  JOURNAL_PLACEHOLDER,
  journalCategoryHref,
  journalPostHref,
  openingLines,
  readingMinutes,
  type JournalCategory,
  type JournalCategoryRef,
  type JournalPost,
  type JournalPostCard,
} from "@/lib/cms/journalShared";
import type { CreativeExperience } from "@/lib/experiences";
import type { PartnerRecord } from "@/lib/partners";
import type { Policy, PolicyBlock } from "@/lib/policies";
import { INK_MARK, type PrivateEventAudience } from "@/lib/privateEvents";
import type { Vibe, VibeSlug } from "@/lib/vibes";
import type {
  Experience as CmsExperience,
  Faq as CmsFaq,
  Media,
  Pass as CmsPass,
  Policy as CmsPolicy,
  Post as CmsPost,
  PostCategory as CmsPostCategory,
  Programme as CmsProgramme,
  Session as CmsSession,
  Testimonial as CmsTestimonial,
  Venue as CmsVenue,
  Vibe as CmsVibe,
} from "@/payload-types";
import type { FaqItem, ImageAsset, NavItem, Pass, Testimonial, Workshop, WorkshopStatus } from "@/types";

/**
 * ==========================================================================
 * CMS documents → the site's own types
 * ==========================================================================
 *
 * SPEC §G.1. The components were written against `CreativeExperience`,
 * `Workshop`, `PartnerRecord`, `Policy`, `Pass`, `FaqItem`, `NavItem` and
 * `ImageAsset`, and they stay the renderers: the CMS supplies data, these
 * functions turn it into exactly those shapes, and no component signature
 * changes. Pure functions only — no Local API, no Next APIs — so they can be
 * read (and tested) without a database.
 *
 * NULL-TOLERANT BY RULE (SPEC §D.1). An upload can be missing three ways: the
 * field was never set, the file was deleted (the relation comes back `null`),
 * or the read was too shallow and the value is a bare id. All three map to
 * "no image", and the caller decides what that means — omit the frame
 * (experiences, partners, passes) or, where the type insists on a picture
 * (`Workshop.image`), fall back along the chain session → experience →
 * {@link PLACEHOLDER_IMAGE}.
 */

/** The committed static stand-in for a missing photograph (`public/images/placeholder.svg`, seeded by 2B). */
export const PLACEHOLDER_IMAGE: ImageAsset = { src: "/images/placeholder.svg", alt: "" };

/** Studio currency. The CMS stores integer fils; the site's `Price` is in dirhams. */
const CURRENCY = "AED";
const FILS_PER_DIRHAM = 100;

/** The studio's zone, for sessions saved without one. */
const STUDIO_TIME_ZONE = "Asia/Dubai";

/* ────────────────────────────────────────────────────────────────────────── */
/* Images                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export type MediaSize = keyof NonNullable<Media["sizes"]>;

const populated = <T extends object>(value: string | T | null | undefined): T | undefined =>
  value && typeof value === "object" ? value : undefined;

/**
 * `object-position` from the focal point an editor clicked.
 *
 * Omitted at the exact centre, which is Payload's default and every
 * component's own fallback (`image.position ?? "50% 50%"`), so a photograph
 * nobody has adjusted renders the way it always has.
 */
function focalPosition(media: Media): string | undefined {
  const x = media.focalX;
  const y = media.focalY;
  if (typeof x !== "number" || typeof y !== "number") return undefined;
  if (x === 50 && y === 50) return undefined;
  return `${round(x)}% ${round(y)}%`;
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * One upload as the site's `ImageAsset`, or `undefined` when there is none.
 *
 * `size` picks a generated rendition (SPEC §G.1 uses `plate`, 1200 px, as the
 * default; a full-bleed hero asks for `hero`). A rendition Payload did not
 * generate — the original was smaller than it — falls back to the original
 * file. A decorative image keeps an empty alt on purpose.
 */
export function imageOf(upload: string | Media | null | undefined, size: MediaSize = "plate"): ImageAsset | undefined {
  const media = populated(upload);
  if (!media) return undefined;
  const src = media.sizes?.[size]?.url || media.url;
  if (!src) return undefined;
  const alt = media.decorative ? "" : (media.alt ?? "");
  const position = focalPosition(media);
  return position ? { src, alt, position } : { src, alt };
}

/** Every populated image in a hasMany upload, in order, missing ones dropped. */
export function imagesOf(uploads: (string | Media)[] | null | undefined, size: MediaSize = "plate"): ImageAsset[] {
  return (uploads ?? []).map((upload) => imageOf(upload, size)).filter((image): image is ImageAsset => Boolean(image));
}

/**
 * A logo-style upload with its pixel box, for the few renderers that need
 * intrinsic dimensions (the header mark, the share cards). Always the
 * original file: a logo is never served from a cropped rendition.
 */
export function sizedImageOf(upload: string | Media | null | undefined): { src: string; width: number; height: number; alt: string } | undefined {
  const media = populated(upload);
  if (!media?.url || !media.width || !media.height) return undefined;
  return { src: media.url, width: media.width, height: media.height, alt: media.alt ?? "" };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Small shared conversions                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const paragraphsOf = (rows: { paragraph: string }[] | null | undefined): string[] =>
  (rows ?? []).map((row) => row.paragraph).filter(Boolean);

const priceOf = (fils: number | null | undefined) =>
  typeof fils === "number" ? { amount: fils / FILS_PER_DIRHAM, currency: CURRENCY } : undefined;

/**
 * An ISO instant written in the studio's own offset.
 *
 * Payload stores dates in UTC ("2026-10-11T11:30:00.000Z"). The site's data
 * has always carried the studio's offset ("2026-10-11T15:30:00+04:00"), and
 * every formatter pins `Asia/Dubai` anyway — but the raw string reaches
 * `<time dateTime>` attributes and the event filters' keys, so it is
 * rewritten in the session's zone rather than left in UTC. Same instant,
 * same markup as before. An unknown zone leaves the value untouched.
 */
export function studioIso(value: string, timeZone: string | null | undefined = STUDIO_TIME_ZONE): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || STUDIO_TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
    const local = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
    const offsetMinutes = Math.round((Date.parse(`${local}Z`) - Math.floor(date.getTime() / 1000) * 1000) / 60_000);
    const sign = offsetMinutes < 0 ? "-" : "+";
    const abs = Math.abs(offsetMinutes);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${local}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  } catch {
    return value;
  }
}

/** A `link()` group as an href; `fallback` when the editor left the address empty. */
export function hrefOf(link: LinkValue | null | undefined, fallback = "/"): string {
  return resolveLink(link) ?? fallback;
}

/**
 * Plain text from a Lexical rich-text value: text nodes joined, a line break
 * as "\n", paragraphs separated by a blank line. The FAQ accordion prints
 * its answer as text, so this is all it needs; formatting is not carried.
 */
export function lexicalToText(value: unknown): string {
  const root = (value as { root?: { children?: unknown[] } } | null | undefined)?.root;
  if (!root?.children) return "";
  const textOf = (node: unknown): string => {
    const n = node as { type?: string; text?: string; children?: unknown[] };
    if (typeof n.text === "string") return n.text;
    if (n.type === "linebreak") return "\n";
    return (n.children ?? []).map(textOf).join("");
  };
  return root.children
    .map(textOf)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Collections                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/** `experiences` → `CreativeExperience` (lib/experiences.ts). */
export function toCreativeExperience(doc: CmsExperience): CreativeExperience {
  const about = paragraphsOf(doc.about);
  const gallery = imagesOf(doc.gallery);
  const vibes = (doc.vibes ?? [])
    .map((vibe) => populated(vibe)?.slug)
    .filter((slug): slug is string => Boolean(slug)) as VibeSlug[];
  const image = imageOf(doc.image);
  return {
    slug: doc.slug,
    name: doc.name,
    kind: doc.kind,
    ...(doc.description ? { description: doc.description } : {}),
    ...(about.length ? { about } : {}),
    ...(gallery.length ? { gallery } : {}),
    ...(doc.status ? { status: doc.status } : {}),
    ...(vibes.length ? { vibes } : {}),
    ...(image ? { image } : {}),
  };
}

/**
 * A session as the site's `Workshop`, plus the slug of the activity it
 * belongs to.
 *
 * `experienceSlug` is the join the old data made by sharing one slug between
 * a session and its activity ("candle-making" was both). CMS sessions get
 * their own slugs (`candle-making-2026-10-11-1000`, SPEC §F.4), so the
 * relationship is carried alongside — see `experienceSlugOf` in
 * lib/workshopHelpers.ts, which is what every join reads.
 */
export type SessionWorkshop = Workshop & { experienceSlug?: string };

/**
 * `bookingStatus` + live seats → the site's three-word status. "closed" has
 * no word of its own on the site: it reads as fully booked, which is what
 * `isFullyBooked` already means ("closed to new bookings").
 */
function workshopStatus(doc: CmsSession, seatsAvailable: number): WorkshopStatus {
  if (doc.isFullyBooked || seatsAvailable <= 0 || doc.bookingStatus === "closed") return "fully-booked";
  if (doc.bookingStatus === "waitlist") return "waitlist";
  return "open";
}

export function toWorkshop(doc: CmsSession): SessionWorkshop {
  const experience = populated(doc.experience);
  const venue = populated(doc.venue);
  // `seatsAvailable` is virtual, filled from the inventory row by the
  // collection's afterRead (2A-1). Before that exists, every seat is free.
  const seatsAvailable = typeof doc.seatsAvailable === "number" ? doc.seatsAvailable : doc.seatsTotal;
  const gallery = imagesOf(doc.gallery);
  return {
    slug: doc.slug,
    title: doc.title || experience?.name || doc.slug,
    category: doc.category,
    kind: "scheduled",
    startsAt: studioIso(doc.startsAt, doc.startsAt_tz),
    durationMinutes: doc.durationMinutes,
    ...(venue ? { venue: { name: venue.name, locality: venue.locality } } : {}),
    price: priceOf(doc.priceFils) ?? { amount: 0, currency: CURRENCY },
    seatsTotal: doc.seatsTotal,
    seatsAvailable,
    status: workshopStatus(doc, seatsAvailable),
    excerpt: doc.excerpt || experience?.description || "",
    image: imageOf(doc.image) ?? imageOf(experience?.image) ?? PLACEHOLDER_IMAGE,
    ...(gallery.length ? { gallery } : {}),
    ...(experience?.slug ? { experienceSlug: experience.slug } : {}),
  };
}

/** `venues` → `PartnerRecord` (lib/partners.ts). */
export function toPartner(doc: CmsVenue): PartnerRecord {
  const logo = imageOf(doc.logo, "card");
  const image = imageOf(doc.image);
  return {
    slug: doc.slug,
    name: doc.name,
    locality: doc.locality,
    descriptor: doc.descriptor,
    ...(doc.eventDescriptor ? { eventDescriptor: doc.eventDescriptor } : {}),
    ...(doc.locationHref ? { locationHref: doc.locationHref } : {}),
    ...(doc.mapQuery ? { mapQuery: doc.mapQuery } : {}),
    ...(logo ? { logo } : {}),
    ...(image ? { image } : {}),
  };
}

/** `programmes` → `PrivateEventAudience` (lib/privateEvents.ts). The ink key becomes the renderer's hex. */
export function toAudience(doc: CmsProgramme): PrivateEventAudience {
  const image = imageOf(doc.image);
  const mark = doc.mark?.name && doc.mark.color ? { name: doc.mark.name, color: INK_MARK[doc.mark.color] } : undefined;
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    ...(doc.lead ? { lead: doc.lead } : {}),
    ...(image ? { image } : {}),
    ...(mark ? { mark } : {}),
    inPrivateEventsMenu: doc.inPrivateEventsMenu ?? true,
    ...(doc.tone && doc.tone !== "default" ? { tone: doc.tone } : {}),
  };
}

export type AgeRow = { activity: string; guidance: string };
export type AgeTables = { diy: readonly AgeRow[]; workshop: readonly AgeRow[] };

/** `policies` → `Policy` (lib/policies.ts). `ages` blocks that point at a shared table read it from `ageTables`. */
export function toPolicy(doc: CmsPolicy, ageTables: AgeTables): Policy {
  const block = (raw: NonNullable<NonNullable<CmsPolicy["sections"]>[number]["blocks"]>[number]): PolicyBlock => {
    switch (raw.blockType) {
      case "text":
        return { type: "text", body: raw.body };
      case "list":
        return { type: "list", items: (raw.items ?? []).map((item) => item.text) };
      case "callout":
        return { type: "callout", title: raw.title, body: raw.body };
      case "ages":
        return {
          type: "ages",
          rows:
            raw.source === "custom"
              ? (raw.rows ?? []).map(({ activity, guidance }) => ({ activity, guidance }))
              : ageTables[raw.source],
        };
    }
  };
  return {
    slug: doc.slug,
    title: doc.title,
    navLabel: doc.navLabel,
    summary: doc.summary,
    sections: (doc.sections ?? []).map((section) => ({
      heading: section.heading,
      blocks: (section.blocks ?? []).map(block),
    })),
  };
}

/**
 * "Ceramic Painting" → "Ceramic painting": the age tables have always named
 * activities in sentence case, while the activity's own name is title case.
 */
export const sentenceCase = (name: string) => (name ? name[0] + name.slice(1).toLowerCase() : name);

/** One activity's row in a policy age table, when it has guidance. */
export function ageRowOf(doc: Pick<CmsExperience, "name" | "ageGuidance">): AgeRow | undefined {
  return doc.ageGuidance ? { activity: sentenceCase(doc.name), guidance: doc.ageGuidance } : undefined;
}

/**
 * `faqs` → `FaqItem`. An answer set to "use the booking terms" prints the
 * one sentence the checkout and the confirmation print (`bookingTerms`).
 */
export function toFaqItem(doc: CmsFaq, bookingTerms: string): FaqItem {
  return {
    question: doc.question,
    answer: doc.answerSource === "bookingTerms" ? bookingTerms : lexicalToText(doc.answer),
  };
}

/** `passes` → `Pass` (types/index.ts). No price means "not on sale online yet" — the renderer's own branch. */
export function toPass(doc: CmsPass): Pass {
  const price = priceOf(doc.priceFils);
  const image = imageOf(doc.image);
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    ...(price ? { price } : {}),
    benefits: (doc.benefits ?? []).map((row) => row.line),
    ...(typeof doc.sessions === "number" ? { sessions: doc.sessions } : {}),
    ...(doc.validityLabel ? { validity: doc.validityLabel } : {}),
    // A per-pass description wins over the Media record's: one file, two pages, two wordings.
    ...(image ? { image: doc.imageAlt ? { ...image, alt: doc.imageAlt } : image } : {}),
  };
}

/** `testimonials` → `Testimonial`. */
export function toTestimonial(doc: CmsTestimonial): Testimonial {
  return { id: doc.id, quote: doc.quote, attribution: doc.attribution };
}

/** `vibes` → `Vibe` (lib/vibes.ts). The slug is the CMS's; the union type is the taxonomy the code knows. */
export function toVibe(doc: CmsVibe): Vibe {
  return { slug: doc.slug as VibeSlug, label: doc.label, blurb: doc.blurb };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The Journal                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/** `post-categories` → the chip a card or a post carries. */
export function toJournalCategoryRef(doc: CmsPostCategory): JournalCategoryRef {
  return { slug: doc.slug, name: doc.name, colour: doc.colour, href: journalCategoryHref(doc.slug) };
}

/** `post-categories` → the filter row's entry, with its published-post count. */
export function toJournalCategory(doc: CmsPostCategory, postCount: number): JournalCategory {
  return { ...toJournalCategoryRef(doc), ...(doc.description ? { description: doc.description } : {}), postCount };
}

/**
 * `posts` → a card. `size` picks the cover rendition: `card` (640) for the
 * grid, `plate` (1200) for the featured slot. Posts saved before their
 * first publish have no date; they only reach the site in draft mode, where
 * `updatedAt` stands in.
 */
export function toJournalPostCard(doc: CmsPost, size: MediaSize = "card"): JournalPostCard {
  const category = populated(doc.category);
  const photo = imageOf(doc.author?.photo, "thumb");
  const role = doc.author?.role?.trim();
  return {
    id: doc.id,
    slug: doc.slug,
    href: journalPostHref(doc.slug),
    title: doc.title,
    excerpt: doc.excerpt?.trim() || doc.autoExcerpt?.trim() || (doc.body ? openingLines(doc.body, 200) : ""),
    coverImage: imageOf(doc.coverImage, size) ?? JOURNAL_PLACEHOLDER,
    ...(category ? { category: toJournalCategoryRef(category) } : {}),
    tags: (doc.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    author: {
      name: doc.author?.name?.trim() || DEFAULT_AUTHOR_NAME,
      ...(role ? { role } : {}),
      ...(photo ? { photo } : {}),
    },
    publishedAt: studioIso(doc.publishedAt || doc.updatedAt),
    readingTime: typeof doc.readingTime === "number" && doc.readingTime > 0 ? doc.readingTime : doc.body ? readingMinutes(doc.body) : 1,
    featured: doc.featured === true,
  };
}

/** `posts` → the reading page. SEO falls back to the title and excerpt, the share image to the cover. */
export function toJournalPost(doc: CmsPost): JournalPost {
  const card = toJournalPostCard(doc, "plate");
  const shareImage = imageOf(doc.meta?.image, "og") ?? imageOf(doc.coverImage, "og");
  return {
    ...card,
    body: doc.body,
    headings: headingsOf(doc.body),
    updatedAt: doc.updatedAt,
    heroImage: imageOf(doc.coverImage, "hero") ?? card.coverImage,
    seo: {
      title: doc.meta?.title?.trim() || doc.title,
      description: doc.meta?.description?.trim() || card.excerpt,
      ...(shareImage ? { image: shareImage } : {}),
      noindex: doc.meta?.noindex === true,
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Navigation                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

interface NavRow {
  label: string;
  link: LinkValue;
  menu?: "none" | NavItem["menu"] | null;
  mobileSurface?: "none" | NavItem["mobileSurface"] | null;
  secondary?: boolean | null;
  utility?: boolean | null;
}

/**
 * One `navigation.primary` row (or a footer/legal link) as a `NavItem`.
 * Flags that are off are left off rather than written as `false`, which is
 * how `MAIN_NAV` has always been spelled.
 */
export function toNavItem(row: NavRow): NavItem {
  const external = row.link?.type === "external";
  const menu = row.menu && row.menu !== "none" ? row.menu : undefined;
  const mobileSurface = row.mobileSurface && row.mobileSurface !== "none" ? row.mobileSurface : undefined;
  return {
    label: row.label,
    href: hrefOf(row.link),
    ...(external ? { external } : {}),
    ...(menu ? { menu } : {}),
    ...(mobileSurface ? { mobileSurface } : {}),
    ...(row.secondary ? { secondary: true } : {}),
    ...(row.utility ? { utility: true } : {}),
  };
}
