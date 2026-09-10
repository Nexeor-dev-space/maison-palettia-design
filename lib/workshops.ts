import type { Price, Workshop } from "@/types";

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

   None of this is real. Titles, dates, prices, seat counts and descriptions
   are invented so the section can be designed and reviewed against realistic
   shapes, and every one of them must be replaced before launch. Delete this
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
    durationMinutes: 120,
    price: { amount: 240, currency: "AED" },
    seatsTotal: 12,
    seatsAvailable: 9,
    status: "open",
    excerpt: "Loose washes, soft pigment and slow layers — an afternoon of colour worked from a single stem.",
    image: {
      src: "/images/workshops/watercolour-in-progress.jpg",
      alt: "A watercolour in progress: a crimson bloom bleeding into soft blue and yellow washes.",
    },
  },
  {
    slug: "glaze-and-finish",
    title: "Glaze & Finish",
    category: "Ceramics",
    startsAt: "2026-10-24T11:00:00+04:00",
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

/** Where a workshop's detail page lives. */
export function workshopHref(workshop: Workshop): string {
  return `/workshops/${workshop.slug}`;
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
