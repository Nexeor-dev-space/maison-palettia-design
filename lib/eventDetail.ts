import {
  getCreativeExperiences,
  type CreativeExperience,
} from "@/lib/experiences";
import { getAllWorkshops, getWorkshopBySlug } from "@/lib/workshops";
import type { ImageAsset, Workshop } from "@/types";

/**
 * What `/events/[slug]` is looking at, resolved from the data that already
 * exists.
 *
 * ==========================================================================
 * THIS IS A JOIN, NOT A NEW DATA SYSTEM
 * ==========================================================================
 *
 * The brief was explicit that the event architecture must be reused rather
 * than replaced, and nothing here stores content. Both sources are the
 * project's own and both are read through their own existing accessors:
 *
 *   lib/workshops.ts ...... scheduled sessions — a date, a time, a venue, a
 *                           price, a seat count. Two of them today.
 *   lib/experiences.ts .... the studio's approved activity list, each with its
 *                           own `kind` and its own optional photograph. Seven
 *                           today, five of them walk-in.
 *
 * WHY THE ROUTE NEEDED THIS AT ALL. `/events/[slug]` resolved through
 * `getWorkshopBySlug` alone, so the only pages that existed were the two
 * scheduled sessions. Tote bag painting, ceramic painting, bedazzling, mandala
 * painting and glass painting had no page anywhere on the site — the homepage
 * index names them but links none of them — so there was nowhere for the
 * walk-in behaviour the brief describes to live.
 *
 * A SCHEDULED SESSION ALWAYS WINS A SLUG. "candle-making" and "crocheting"
 * appear in both files, deliberately: the experiences list is the menu and the
 * workshops list is a date for one of them. The richer record answers, so
 * those two keep the bookable page they already had and nothing about the
 * existing booking flow changes.
 */

/** A session with a date, sold online. */
export interface ScheduledEvent {
  kind: "scheduled";
  slug: string;
  workshop: Workshop;
  /*
    THE SAME ACTIVITY IN lib/experiences.ts, matched on slug.

    The two records were always two halves of one thing — the workshops file
    says so itself, that "the shared slug keeps the two findable together" —
    but only the session half ever reached the page, so a scheduled event
    could not see its own activity's `description` or `about`. Optional
    because a session is not required to have an activity entry.
  */
  experience?: CreativeExperience;
}

/**
 * A walk-in activity. It has a name and, if the studio has written one, a line
 * and a photograph — and nothing else, because nothing else is recorded.
 *
 * NO DATE, NO TIME, NO PRICE, NO VENUE, NO CAPACITY. Not omitted from this
 * shape by oversight: `CreativeExperience` carries none of them, and a walk-in
 * activity genuinely has no fixed date. Every one of those is a field the page
 * must leave out rather than fill.
 */
export interface WalkInEvent {
  kind: "diy";
  slug: string;
  experience: CreativeExperience;
}

export type EventDetail = ScheduledEvent | WalkInEvent;

/**
 * Every slug that should have a page, scheduled first.
 *
 * Used by `generateStaticParams`, so the five walk-in activities are
 * prerendered alongside the two sessions.
 */
export async function getEventSlugs(): Promise<string[]> {
  const [workshops, experiences] = await Promise.all([
    getAllWorkshops(),
    getCreativeExperiences(),
  ]);
  const seen = new Set(workshops.map((w) => w.slug));
  for (const experience of experiences) seen.add(experience.slug);
  return [...seen];
}

/**
 * Resolve one slug, or `null` when nothing answers to it.
 *
 * Async and returning a plain value, like every other content seam in this
 * project, so pointing either half at a CMS is a change to the two functions
 * it already calls rather than to anything here.
 */
export async function getEventDetail(
  slug: string,
): Promise<EventDetail | null> {
  const [workshop, experiences] = await Promise.all([
    getWorkshopBySlug(slug),
    getCreativeExperiences(),
  ]);
  const experience = experiences.find((item) => item.slug === slug);

  if (workshop) return { kind: "scheduled", slug, workshop, experience };
  if (experience) return { kind: "diy", slug, experience };

  return null;
}

/**
 * The name to print, whichever kind this is.
 *
 * A session stores `title` and an activity stores `name`; they are the same
 * idea under two keys because the two files were written months apart. One
 * accessor here means the page never branches just to read a heading.
 */
export function eventTitle(detail: EventDetail): string {
  return detail.kind === "scheduled"
    ? detail.workshop.title
    : detail.experience.name;
}

/**
 * The one line under the title, or null.
 *
 * A session's `excerpt` is always set; an activity's `description` is optional
 * and two of the seven have none. Null means the page prints nothing there —
 * see the note on `description` in lib/experiences.ts for why those two were
 * left blank rather than filled in.
 */
export function eventIntro(detail: EventDetail): string | null {
  return detail.kind === "scheduled"
    ? detail.workshop.excerpt
    : (detail.experience.description ?? null);
}

/**
 * The paragraphs the "About" section prints, or an empty list.
 *
 * TWO SOURCES, AND NEITHER IS INVENTED. `experience.about` is the real field
 * and it is what the client will fill; until they do, a SCHEDULED event still
 * has one sentence going spare, because its lead prints the session's
 * `excerpt` and the activity's own `description` is never shown on the page
 * at all. That sentence is the client's wording and it is about the activity,
 * so it is worth the paragraph — but only where it is genuinely unused, which
 * is why a DIY event (whose lead IS the description) gets nothing back.
 *
 * The section hides itself on an empty list, so five of the seven activities
 * show no "About" until somebody writes one.
 */
export function eventAbout(detail: EventDetail): readonly string[] {
  const written = detail.experience?.about;
  if (written && written.length > 0) return written;

  if (detail.kind === "scheduled") {
    const spare = detail.experience?.description;
    if (spare && spare !== eventIntro(detail)) return [spare];
  }

  return [];
}

/*
  ==========================================================================
  THE STUDIO FRAMES — a stand-in, and they must not stay
  ==========================================================================

  TODO(client): two photographs per activity for candle making, mandala
  painting, glass painting; one more for bedazzling and tote bag painting.
  Each one that lands in `gallery` pushes one of these out, and when an
  activity has three of its own none of these is drawn at all. Nothing else
  has to change.

  WHY THEY EXIST. The client asked for the About section to show three
  pictures on every activity, having been told that the project holds one
  photograph of most of them. This is that decision carried out.

  WHAT THEY MAY BE, AND WHY THESE THREE. A stand-in on a page headed "About
  This Experience" must not look like the thing you will make, or the page
  promises a craft the studio may not be running. So none of these is a
  finished object: one is a table with a palette on it, and two are colour
  behaving on a surface. They read as the studio, which is true of every
  activity, rather than as an outcome, which would be true of only one.

  WHAT THEY MAY NOT BE. The pool holds several photographs that would fill
  the slot and lie: a machine-printed tote, ceramic trinket dishes, a child
  colouring with crayons, and the birdhouse table the client has already
  ruled out as "not part of our activities". None of them is here.

  ALT TEXT DESCRIBES THE FRAME AND NEVER THE OCCASION, which is the rule
  lib/privateEvents.ts sets out at length for its own stand-ins.
*/
const STUDIO_FRAMES: readonly ImageAsset[] = [
  {
    src: "/images/experience/community-table.jpg",
    alt: "A hand resting over a watercolour palette and a sheet of paper at a shared table, brushes and a bag beside it.",
  },
  {
    src: "/images/studio/marbling.jpg",
    alt: "Marbling colour drawn across the surface of the water in orange, teal and red.",
  },
  {
    src: "/images/experience/pigment-on-paper.jpg",
    alt: "Pigment blooming into damp paper, soft pinks and greens running together.",
  },
];

/** How many frames the About cluster lays out. */
const GALLERY_SLOTS = 3;

/**
 * The extra frames the "About" section lays out beside its copy.
 *
 * Never `experience.image` — that is the photograph the page already opens
 * on, and the collage exists to show what else there is.
 *
 * TOPPED UP TO THREE. It used to return whatever an activity had and let the
 * cluster render one, two or none; the client has asked for three everywhere.
 * An activity's own photographs always come first and in their own order, and
 * the studio frames only fill what is left — see the note above them, and the
 * TODO in it.
 */
export function eventGallery(detail: EventDetail): readonly ImageAsset[] {
  const own = detail.experience?.gallery ?? [];
  if (own.length >= GALLERY_SLOTS) return own.slice(0, GALLERY_SLOTS);

  /* By `src`, so an activity that already shows one of the studio frames in
     its own list is never handed the same picture twice. */
  const taken = new Set(own.map((frame) => frame.src));
  const fill = STUDIO_FRAMES.filter((frame) => !taken.has(frame.src));
  return [...own, ...fill].slice(0, GALLERY_SLOTS);
}

/**
 * The studio's own flag, shown verbatim, or null.
 *
 * Only `CreativeExperience` carries one and only glass painting sets it
 * ("Coming soon"). It is the whole reason the action area can refuse to offer
 * anything: a flagged activity is not walk-in-today either.
 */
export function eventFlag(detail: EventDetail): string | null {
  return detail.kind === "diy" ? (detail.experience.status ?? null) : null;
}

/**
 * True when the studio has flagged this as not yet running.
 *
 * Deliberately a presence check rather than a match on the word "coming":
 * `status` is free text the studio controls, and any flag on it means the
 * activity is not something to send someone to the mall for today.
 */
export function isUpcoming(detail: EventDetail): boolean {
  return eventFlag(detail) !== null;
}

/** The photograph, where one exists. Two activities have none. */
export function eventImage(detail: EventDetail) {
  return detail.kind === "scheduled"
    ? detail.workshop.image
    : detail.experience.image;
}
