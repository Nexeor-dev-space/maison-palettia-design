import {
  getCreativeExperiences,
  type CreativeExperience,
} from "@/lib/experiences";
import { getAllWorkshops, getWorkshopBySlug } from "@/lib/workshops";
import type { Workshop } from "@/types";

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
  const workshop = await getWorkshopBySlug(slug);
  if (workshop) return { kind: "scheduled", slug, workshop };

  const experiences = await getCreativeExperiences();
  const experience = experiences.find((item) => item.slug === slug);
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
