import type { Price, Venue, Workshop } from "@/types";

/**
 * Workshop content and the helpers that render it.
 *
 * This module is the seam between the site and whatever eventually supplies
 * workshop data. Every component reads workshops through `getUpcomingWorkshops`
 * and never touches the array below, so swapping in a CMS is a change to one
 * function body.
 *
 * The studio runs on Gulf Standard Time; every date is formatted in that zone
 * explicitly so a session never shifts by a day depending on where the page is
 * rendered.
 */
const STUDIO_TIME_ZONE = "Asia/Dubai";

/** Below this many seats the listing starts flagging scarcity. */
const LOW_SEAT_THRESHOLD = 4;

/* ==========================================================================
   TODO(client): PLACEHOLDER CONTENT — DEVELOPMENT ONLY.

   None of this is real. Titles, dates, times, VENUES, prices, seat counts and
   descriptions are invented so the section can be designed and reviewed
   against realistic shapes, and every one of them must be replaced before
   launch.

   TODO(client): THE THREE MALLS BELOW ARE PLACEHOLDERS. `venue` is a new and
   deliberately optional field — the schedule omits the location entirely for
   any session that has none, so blanking these three lines is all it takes to
   ship without inventing a location. They are filled in only so the section
   can be designed against the shape the business actually has. Supply the real
   malls, as they are signposted, with the city under them. Delete this
   array wholesale once the CMS is connected — `getUpcomingWorkshops` is the
   only thing that reads it.

   The photographs are stand-ins too, cropped from assets already in the
   project (the master wheel footage and the two hero stills) so the section
   can be judged with real, on-brand imagery rather than grey boxes:

     TODO(client): replace with process photography from the studio shoot —
     people mid-making, hands in the material. Two of the three crops below
     are of finished work rather than of the work happening, which is the
     opposite of what this section wants to show.
   ========================================================================== */
const PLACEHOLDER_WORKSHOPS: Workshop[] = [
  {
    slug: "throwing-on-the-wheel",
    title: "Throwing on the Wheel",
    category: "Pottery",
    startsAt: "2026-10-03T10:00:00+04:00",
    venue: { name: "The Dubai Mall", locality: "Downtown Dubai" },
    durationMinutes: 180,
    price: { amount: 320, currency: "AED" },
    seatsTotal: 10,
    seatsAvailable: 3,
    status: "open",
    excerpt:
      "Centre the clay, open the form and draw your first vessel up under your hands. An unhurried morning at the wheel, from wet lump to finished shape.",
    image: {
      src: "/images/experience/pottery.jpg",
      alt: "Two clay-slicked hands opening the centre of a small pot on the wheel, seen from directly above.",
    },
  },
  {
    slug: "watercolour-in-bloom",
    title: "Watercolour in Bloom",
    category: "Painting",
    startsAt: "2026-10-11T15:30:00+04:00",
    venue: { name: "Mall of the Emirates", locality: "Al Barsha" },
    durationMinutes: 120,
    price: { amount: 240, currency: "AED" },
    seatsTotal: 12,
    seatsAvailable: 9,
    status: "open",
    excerpt: "Loose washes, soft pigment and slow layers — an afternoon of colour worked from a single stem.",
    image: {
      src: "/images/workshops/watercolour-street.jpg",
      alt: "A watercolour of a cobbled hillside street — whitewashed houses under terracotta roofs, geraniums at a shuttered window, and a castle wall rising above the trees.",
      // The plate is 4:5 and the painting is taller than that, so `cover` takes
      // about a tenth off the height. Held a little high: the loss is spent on
      // the empty cobbles along the foot rather than on the roofline and the
      // castle, which is where the painting's detail is.
      position: "50% 45%",
    },
  },
  {
    slug: "glaze-and-finish",
    title: "Glaze & Finish",
    category: "Ceramics",
    startsAt: "2026-10-24T11:00:00+04:00",
    venue: { name: "City Centre Mirdif", locality: "Mirdif" },
    durationMinutes: 150,
    price: { amount: 280, currency: "AED" },
    seatsTotal: 8,
    seatsAvailable: 0,
    status: "fully-booked",
    excerpt: "Bring a bisque-fired piece back to colour — dipping, brushwork and the last decisions before the kiln.",
    image: {
      src: "/images/workshops/glazed-vessel.jpg",
      alt: "A cream stoneware vase carved and glazed with a pattern of blue, green and ochre scrollwork.",
    },
  },
];

/**
 * The next sessions, soonest first.
 *
 * Async on purpose: the placeholder resolves immediately, but the signature is
 * already the one a CMS fetch needs, so nothing downstream changes shape when
 * the data goes remote — at which point <WorkshopsSkeleton> and a <Suspense>
 * boundary are the pieces waiting to be put in.
 *
 * TODO(client): replace the body with the CMS query. It should filter to
 * sessions in the future and sort server-side — the deliberate absence of a
 * date filter here keeps the placeholders visible in development long after
 * their invented dates have passed.
 */
export async function getUpcomingWorkshops(limit = 3): Promise<Workshop[]> {
  return [...PLACEHOLDER_WORKSHOPS]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, limit);
}

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
 * What the call to action promises. A full session still links through to its
 * page — it just stops claiming there is something to book.
 */
export function workshopActionLabel(workshop: Workshop): string {
  return isFullyBooked(workshop) ? "View workshop" : "Explore workshop";
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

/**
 * Where "Book session" goes from a listing.
 *
 * The session's own page, which is where someone decides — not straight into
 * the booking form. A listing tile carries four facts; the page carries the
 * rest, and skipping it would be asking for a commitment before the question
 * has been answered.
 *
 * This used to resolve to the schedule route because `/workshops/{slug}` did
 * not exist and answered 404. It exists now.
 */
export function bookSessionHref(workshop: Workshop): string {
  return workshopHref(workshop);
}

/**
 * Every scheduled session, soonest first.
 *
 * The listing page's query, and the one `generateStaticParams` walks. It
 * differs from `getUpcomingWorkshops` only in not cutting the list short.
 *
 * TODO(client): becomes the CMS's collection query. Filter to future dates
 * server-side at that point — the deliberate absence of a date filter here is
 * what keeps the placeholders visible in development long after their invented
 * dates have passed.
 */
export async function getAllWorkshops(): Promise<Workshop[]> {
  return [...PLACEHOLDER_WORKSHOPS].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * One session by its slug, or null.
 *
 * Reads the same source as the listing so the two can never disagree, and
 * returns null rather than throwing so the route can answer with a proper 404
 * instead of a server error.
 */
export async function getWorkshopBySlug(slug: string): Promise<Workshop | null> {
  return PLACEHOLDER_WORKSHOPS.find((workshop) => workshop.slug === slug) ?? null;
}

/**
 * A few other dates to offer from a session's own page — never itself, and
 * never a session that cannot be booked.
 */
export async function getRelatedWorkshops(slug: string, limit = 2): Promise<Workshop[]> {
  const all = await getAllWorkshops();
  return all.filter((w) => w.slug !== slug && !isFullyBooked(w)).slice(0, limit);
}

/** The booking step for one session. */
export function bookingStepHref(workshop: Workshop): string {
  return `/events/${workshop.slug}/book`;
}
