import type { Price, Venue, Workshop } from "@/types";

/**
 * The helpers that render a workshop — dates, times, prices, seats, links.
 *
 * SPLIT FROM lib/workshops.ts in Phase 2, and the reason is the bundle, not
 * the content. Client components (the event cards, the search panel, the
 * Experiences menu) format sessions, and lib/workshops.ts now reads the CMS
 * through the Local API, which must never reach a browser bundle
 * (docs/cms/research/00-spike.md, G18). So everything here is pure and
 * client-safe, and lib/workshops.ts re-exports all of it: a server component
 * that imported a formatter from "@/lib/workshops" still does, and a client
 * component imports from here.
 *
 * The studio runs on Gulf Standard Time; every date is formatted in that zone
 * explicitly so a session never shifts by a day depending on where the page is
 * rendered.
 */
const STUDIO_TIME_ZONE = "Asia/Dubai";

/**
 * Below this many seats the listing starts flagging scarcity.
 *
 * TODO(phase2-cleanup): booking-settings carries the same number
 * (`lowSeatThreshold`, default 4). These helpers are synchronous and run in
 * the browser too, so the setting reaches them only once a server parent
 * passes it down; until then the default is the value both sides agree on.
 */
const LOW_SEAT_THRESHOLD = 4;

/**
 * Where an event's page lives.
 *
 * NAMING, DELIBERATELY SPLIT. The site says "event" to visitors; this module
 * and the `Workshop` type keep the studio's own word, because they mirror the
 * shape a CMS will supply and renaming a data model to match a piece of
 * front-of-house copy is how a schema ends up lying about itself. Everything
 * public — routes, headings, buttons, metadata — says event. /workshops still
 * resolves, via a permanent redirect in next.config.ts.
 */
export function workshopHref(workshop: Workshop): string {
  return `/events/${workshop.slug}`;
}

/**
 * Closed to new bookings. Checks both signals: the CMS can close a session
 * while seats remain, and a seat count can reach zero before anyone updates
 * the status.
 */
export function isFullyBooked(workshop: Workshop): boolean {
  return workshop.status === "fully-booked" || workshop.seatsAvailable <= 0;
}

/**
 * The server's clock, for a render that takes more than one date verdict.
 *
 * `hasSessionPassed` reads it for you when `now` is left out, and that is
 * right for a single verdict. A page that takes several — every card on
 * /events and the "Next" line beneath them, or the homepage's chain of dates
 * — takes this ONCE and passes it to each, so no two sessions are judged at
 * different instants and the number can be handed to a client component as
 * the verdict its HTML must hydrate against.
 *
 * A named function rather than `Date.now()` written in the component because
 * React's purity rule (react-hooks/purity) forbids a component reading the
 * clock while it renders, and rightly so for anything that re-renders. A
 * server component rendered once per request or revalidation is the
 * deliberate exception on this site, and this is where that exception lives,
 * documented, rather than as a suppression at each call site. Nothing that
 * runs in the browser should call it: a client component asks
 * components/booking/SessionClock.tsx instead, which knows how to hydrate.
 */
export function serverClock(): number {
  return Date.now();
}

/**
 * Whether the session has already begun — and with it, whether booking for it
 * has closed. A session closes at its START, not its end: there is no joining
 * a two-hour pour half an hour in.
 *
 * ==========================================================================
 * THIS IS THE SERVER'S ANSWER, AND IT GOES STALE. READ THIS BEFORE USING IT.
 * ==========================================================================
 *
 * Every page that calls this is prerendered, so `now` is the moment the page
 * was built or last revalidated — not the moment someone is looking at it. It
 * decides what the HTML says, which is right most of the time and is all a
 * visitor without JavaScript gets. It is never the last word: anything that
 * offers a booking also goes through <SessionGate> or `useSessionPassed`
 * (components/booking/SessionClock.tsx), which ask the same question against
 * the visitor's own clock, and checkout refuses a lapsed line outright.
 *
 * `now` is a parameter so a caller can pin it — one `serverClock()` for a whole
 * render keeps every verdict on a page in agreement — and so the rule can be
 * checked against a fixed instant. A date that will not parse never counts as
 * passed; the client hook makes the same call.
 */
export function hasSessionPassed(
  workshop: Pick<Workshop, "startsAt">,
  now: number = Date.now(),
): boolean {
  return Date.parse(workshop.startsAt) <= now;
}

/**
 * Open to a new booking right now, as far as the server can tell: seats left
 * and the date still ahead. See the warning on `hasSessionPassed` — this is
 * the HTML's verdict, and the browser re-checks the date half of it.
 */
export function isBookable(workshop: Workshop, now: number = Date.now()): boolean {
  return !isFullyBooked(workshop) && !hasSessionPassed(workshop, now);
}

/**
 * The one availability fact worth surfacing on the homepage, or null when
 * there is nothing notable to say. A comfortably open session says nothing —
 * scarcity only reads as scarcity when it is used sparingly.
 */
export function availabilityLabel(workshop: Workshop): string | null {
  if (isFullyBooked(workshop)) return "Fully booked";
  if (workshop.status === "waitlist") return "Waitlist only";
  if (workshop.seatsAvailable <= LOW_SEAT_THRESHOLD) {
    return `${workshop.seatsAvailable} ${workshop.seatsAvailable === 1 ? "seat" : "seats"} left`;
  }
  return null;
}

/** Editorial date, e.g. "Sat 3 Oct". */
export function formatWorkshopDate(startsAt: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: STUDIO_TIME_ZONE,
  }).format(new Date(startsAt));
}

/** Start time on a 24-hour clock, e.g. "10:00". */
export function formatWorkshopTime(startsAt: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: STUDIO_TIME_ZONE,
  }).format(new Date(startsAt));
}

/** "45 minutes" · "1 hour" · "2.5 hours" · "3 hours". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = minutes / 60;
  const value = Number.isInteger(hours) ? hours.toString() : hours.toFixed(1);
  return `${value} ${hours === 1 ? "hour" : "hours"}`;
}

/**
 * "AED 320" — the code rather than a symbol, which is how Dubai prices read.
 * Intl joins the two halves with a non-breaking space; that is deliberate and
 * left in place so a price never wraps mid-figure.
 */
export function formatPrice({ amount, currency }: Price): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ==========================================================================
   The schedule's own formatters.

   A scheduled-session business lives or dies on four facts being instantly
   readable — what, where, when, how much — so each of these returns the parts
   a component needs rather than one baked string. A component should never be
   pulling "Sat 3 Oct" apart again to set the numeral larger than the month.

   Times here are 12-hour, unlike `formatWorkshopTime` above, which the gallery
   label uses. That is not an oversight: this is signage for a walk-up audience
   choosing a Saturday morning in a mall, and "10:00 AM - 1:00 PM" is how that
   reader thinks about their day. The 24-hour formatter is left alone so the
   change is reversible in one place if the studio prefers otherwise.
   ========================================================================== */

/** The date in parts, for the schedule's stepped date block. */
export function sessionDateParts(startsAt: string): {
  weekday: string;
  day: string;
  month: string;
  year: string;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: STUDIO_TIME_ZONE,
  }).formatToParts(new Date(startsAt));

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: value("weekday"),
    day: value("day"),
    month: value("month"),
    year: value("year"),
  };
}

/** "3 October 2026" — the whole date on one line, for the compact rows. */
export function formatSessionDate(startsAt: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: STUDIO_TIME_ZONE,
  }).format(new Date(startsAt));
}

/**
 * Both ends of the session, as separate strings.
 *
 * Returned as a pair because the feature stacks them with a rule between and
 * the rows set them on one line — and because the end is derived from the
 * duration rather than stored, so the two can never contradict each other.
 */
export function sessionTimeRange(
  startsAt: string,
  durationMinutes: number,
): { start: string; end: string } {
  const startDate = new Date(startsAt);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: STUDIO_TIME_ZONE,
  });
  return { start: time.format(startDate), end: time.format(endDate) };
}

/** The duration as an ISO 8601 period for a `<time>` element: "PT2H30M". */
export function durationToIso(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `PT${hours ? `${hours}H` : ""}${rest ? `${rest}M` : ""}` || "PT0M";
}

/** "The Dubai Mall, Downtown Dubai" — for accessible labels and page titles. */
export function formatVenueLine(venue: Venue): string {
  return `${venue.name}, ${venue.locality}`;
}

/**
 * What is left, always said.
 *
 * `availabilityLabel` above stays as it is — it speaks only when a session is
 * scarce, which is right for a listing that does not want to nag. The schedule
 * needs the opposite: a visitor deciding between three dates wants to know
 * that the comfortable one is comfortable, and silence reads as missing
 * information rather than as reassurance.
 *
 * Every number here comes from `seatsAvailable`, which the data has always
 * carried. Nothing is estimated and nothing is invented.
 */
export function spotsLabel(workshop: Workshop): string {
  if (isFullyBooked(workshop)) return "Fully booked";
  if (workshop.status === "waitlist") return "Waitlist only";
  const spots = workshop.seatsAvailable;
  const noun = spots === 1 ? "spot" : "spots";
  return spots <= LOW_SEAT_THRESHOLD ? `${spots} ${noun} left` : `${spots} ${noun} available`;
}

/** True when the session is nearly gone — the one case that takes the accent. */
export function isScarce(workshop: Workshop): boolean {
  return (
    !isFullyBooked(workshop) &&
    workshop.status === "open" &&
    workshop.seatsAvailable <= LOW_SEAT_THRESHOLD
  );
}

/** The booking step for one session. */
export function bookingStepHref(workshop: Workshop): string {
  return `/events/${workshop.slug}/book`;
}

/**
 * The activity a session belongs to — the join between lib/workshops.ts and
 * lib/experiences.ts.
 *
 * The in-file sessions shared one slug with their activity ("candle-making"
 * was both), and every join compared the two slugs. Sessions from the CMS
 * have their own slugs (`candle-making-2026-10-11-1000`), so the mapper
 * carries the related activity's slug alongside (`experienceSlug`,
 * lib/cms/mappers.ts) and this reads it, falling back to the old rule.
 */
export function experienceSlugOf(workshop: Workshop): string {
  return (workshop as Workshop & { experienceSlug?: string }).experienceSlug ?? workshop.slug;
}
