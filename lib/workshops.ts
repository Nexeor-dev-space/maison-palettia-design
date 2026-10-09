import { findDocs, contentReader } from "@/lib/cms/query";
import { TAGS } from "@/lib/cms/cache";
import { toWorkshop } from "@/lib/cms/mappers";
import { isBookable } from "@/lib/workshopHelpers";
import type { Workshop } from "@/types";

/**
 * Workshop content: the scheduled sessions, read from the CMS.
 *
 * This module is the seam between the site and the `sessions` collection.
 * Every component reads sessions through the getters below and never touches
 * the data directly, which is what let the CMS arrive as a change to these
 * function bodies alone (SPEC §G.1): same names, same arguments, same
 * `Workshop` shape, now backed by the Local API through `cached` under the
 * sessions, experiences and venues tags, draft-aware in preview.
 *
 * SERVER ONLY since Phase 2. The formatters and verdicts that used to live
 * here (`formatPrice`, `isFullyBooked`, `hasSessionPassed`…) moved to
 * lib/workshopHelpers.ts so client components can keep importing them, and
 * are re-exported below so no server import had to change.
 */
export * from "@/lib/workshopHelpers";

/* ==========================================================================
   TODO(client): PLACEHOLDER CONTENT — DEVELOPMENT ONLY.

   None of this is real. Titles, dates, times, VENUES, prices, seat counts and
   descriptions are invented so the section can be designed and reviewed
   against realistic shapes, and every one of them must be replaced before
   launch.

   THE VENUES ARE NO LONGER INVENTED. They were "The Dubai Mall", "Mall of
   the Emirates" and "City Centre Mirdif" — three centres the studio has no
   agreement with, named on a public listing, which lib/partners.ts flagged as
   the one thing on the site that could actually cause trouble. Both sessions
   now sit at Times Square Center, the single destination the client has
   confirmed, so the schedule and the partner section tell one story and the
   homepage map has something true to point at.

   `venue` is still optional: the schedule omits the location entirely for any
   session that has none, so blanking these lines ships without inventing one.

   THE CMS IS CONNECTED, AND THIS ARRAY IS NOW ONLY THE FALLBACK
   `getAllWorkshops` uses when the `sessions` collection cannot be read at all
   (a build without the database). An empty CMS answer means "nothing
   scheduled" and is never replaced by it.

   TWO SESSIONS, AND THEY ARE THE TWO THE CLIENT SAYS ARE BOOKABLE. The studio
   runs two kinds of thing: DIY activities you walk in and do, and scheduled
   sessions you book online for a fixed time. The client has confirmed that the
   second list is Candle Making and Crocheting, so those are the two entries
   here; the DIY activities live in lib/experiences.ts, which carries the same
   split on its own `kind` field.

   THE DATES, TIMES, VENUE, PRICES AND SEAT COUNTS BELOW ARE STILL INVENTED.
   Only the names, the descriptions and the photographs are the studio's. Two
   earlier placeholder sessions — "Watercolour in Bloom" and a ceramic-painting
   date — were re-pointed onto these two activities at the client's direction,
   keeping their invented schedule rather than inventing a new one. So every
   number here is a shape to design against and none of it is a commitment.

     TODO(client): supply the real dates, times, prices and seat counts. Until
     then the second session reads as fully booked, which is a placeholder seat
     count rather than a statement about crochet.

     THE INVENTED DATES WILL LAPSE, AND THE SITE NOW SAYS SO WHEN THEY DO.
     Candle Making's is 11 October 2026 and Crocheting's 24 October. Past its
     start a session is no longer bookable anywhere — `hasSessionPassed` on the
     server, <SessionGate> against the visitor's clock — so once both have gone
     by there is nothing on the site that can be booked at all. That is the
     honest state for a schedule nobody has supplied; it is not a bug to "fix"
     by moving these dates forward. New dates come from the client.

     TODO(client): the programme has eight approved activities. The other six
     are DIY and are listed in lib/experiences.ts; none of them belongs here
     unless the studio starts selling a fixed date for it — see `kind` on
     {@link Workshop}, which is what the homepage carousel filters on.
   ========================================================================== */
const PLACEHOLDER_WORKSHOPS: Workshop[] = [
  {
    slug: "candle-making",
    title: "Candle Making",
    category: "Craft",
    startsAt: "2026-10-11T15:30:00+04:00",
    venue: { name: "Times Square Center", locality: "Dubai" },
    durationMinutes: 120,
    price: { amount: 240, currency: "AED" },
    seatsTotal: 12,
    seatsAvailable: 9,
    status: "open",
    // The client's own wording for this session, supplied with the carousel brief.
    excerpt: "Choose your scent, pour your candle and create something that's uniquely yours.",
    image: {
      // The client's own candle-making picture, the same file and the same
      // alt text `lib/experiences.ts` carries — one photograph is never
      // described two ways, and the shared slug keeps the two findable
      // together.
      src: "/images/experiences/CANDLE_MAKING.jpg",
      alt:
        "Two poured candles in glass jars on a white tray, one set with pink wax flowers and one with pink hearts, sprigs of gypsophila beside them.",
    },
  },
  {
    slug: "crocheting",
    title: "Crocheting",
    category: "Craft",
    startsAt: "2026-10-24T11:00:00+04:00",
    venue: { name: "Times Square Center", locality: "Dubai" },
    durationMinutes: 150,
    price: { amount: 280, currency: "AED" },
    seatsTotal: 8,
    seatsAvailable: 0,
    status: "fully-booked",
    // Opens on the studio's own line from lib/experiences.ts, so the menu and
    // the schedule cannot describe the same activity two different ways.
    excerpt: "A hook, a ball of yarn and one stitch to start from, worked into something you take with you.",
    image: {
      src: "/images/experiences/CROCHETING.jpg",
      alt:
        "A crocheted blanket of granny squares in forest green, cream, mustard and rust, each worked with a sun or a moon.",
    },
  },
];


/**
 * Every published session, soonest first, mapped to `Workshop`.
 *
 * Depth 2: session → activity → its photograph, which is the fallback when
 * the session has none of its own. Cancelled sessions are never listed.
 * Past ones are, exactly as before — visible is not bookable, and a listed
 * session past its start shows as passed and offers nothing (see
 * `hasSessionPassed`). If the schedule grows long enough for that to
 * matter, a date floor belongs in this `where`.
 */
const readSessions = contentReader("sessions", [TAGS.sessions, TAGS.experiences, TAGS.venues], async (draft) => {
  const docs = await findDocs("sessions", draft, {
    drafts: true,
    sort: "startsAt",
    depth: 2,
    where: { cancelledAt: { exists: false } },
  });
  return docs.map(toWorkshop);
});

/**
 * Every scheduled session, soonest first.
 *
 * The listing page's query, and the one `generateStaticParams` walks; every
 * other getter here is a view of it, so the listing, the event page and the
 * menus can never disagree about what exists.
 */
export async function getAllWorkshops(): Promise<Workshop[]> {
  const fromCms = await readSessions();
  // The placeholders only when the CMS could not be read (null); an empty
  // answer means "nothing scheduled".
  const sessions: readonly Workshop[] = fromCms ?? PLACEHOLDER_WORKSHOPS;
  return [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * The next sessions, soonest first.
 *
 * No date filter, on purpose and as before: a listed session whose date has
 * passed is still never offered for booking — see `hasSessionPassed` and
 * <SessionGate>.
 */
export async function getUpcomingWorkshops(limit = 3): Promise<Workshop[]> {
  return (await getAllWorkshops()).slice(0, limit);
}

/**
 * One session by its slug, or null.
 *
 * Reads the same list as the listing so the two can never disagree, and
 * returns null rather than throwing so the route can answer with
 * `redirectOr404` (lib/cms/redirects.ts) — a renamed session leaves a
 * redirect behind — instead of a server error.
 */
export async function getWorkshopBySlug(slug: string): Promise<Workshop | null> {
  return (await getAllWorkshops()).find((workshop) => workshop.slug === slug) ?? null;
}

/**
 * A few other dates to offer from a session's own page — never itself, and
 * never a session that cannot be booked: not a full one, and not one whose
 * date has already gone by.
 *
 * The date half is the server's verdict (see `hasSessionPassed`), so on a
 * prerendered page it is as fresh as the last revalidation. The card each
 * one is drawn as re-checks its own date in the browser.
 */
export async function getRelatedWorkshops(slug: string, limit = 2): Promise<Workshop[]> {
  const all = await getAllWorkshops();
  const now = Date.now();
  return all.filter((w) => w.slug !== slug && isBookable(w, now)).slice(0, limit);
}
