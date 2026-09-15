import type { Pass } from "@/types";

/**
 * The Maison's passes, and the seam where they will meet a CMS.
 *
 * Everything reads these through {@link getPasses}, so replacing the array
 * below with a query is a change to one function body — the same arrangement
 * lib/workshops.ts and lib/disciplines.ts already use.
 *
 * A pass is the only thing on this site that is bought rather than booked, and
 * it still goes through the one basket and the one checkout. The whole of that
 * integration is `toPassCartLine` in lib/cart.ts; there is no second cart, no
 * second checkout and no loyalty backend.
 *
 * SERVER SIDE ONLY, like the other two data modules. The loyalty page awaits
 * this and hands the resulting objects down as props — see <PassOffer>, which
 * is the client half and imports nothing from here. Importing this module into
 * a client component would pull the whole catalogue into the browser bundle,
 * which is the same trap the note at the foot of lib/utils.ts describes.
 */

/**
 * Whether the passes below are the studio's own.
 *
 * A constant rather than a runtime check, and the same device as
 * `PAYMENT_CONFIGURED` and `PASS_CODES_CONFIGURED` in lib/booking.ts: while it
 * is false the loyalty page says, in one line under the offer, that these are
 * placeholders for review. Nothing else in the flow reads it.
 *
 * IT MUST NOT BE FLIPPED WITHOUT REAL PASSES BEHIND IT. Setting this true over
 * the array below would turn an honest "not final yet" into three invented
 * prices presented as the Maison's own terms.
 *
 * TODO(client): supply the real passes, replace the array, then set this true.
 * There is still no payment provider — see `PAYMENT_CONFIGURED` — so a pass
 * bought here is recorded in the visitor's own browser and nowhere else.
 */
export const PASSES_CONFIGURED = false;

/* ==========================================================================
   TODO(client): PLACEHOLDER CONTENT — DEVELOPMENT ONLY.

   None of this is real. The names, the prices, the session counts and the
   validity periods are invented so the page can be designed and reviewed
   against realistic shapes, and every one of them must be replaced before
   launch. Nothing here has been agreed with the studio.

   WHAT IS DELIBERATELY ABSENT, because none of it can be invented honestly:

     - no discount is claimed against the cost of booking the same number of
       sessions one at a time, and no per-session figure is printed;
     - nothing is marked "best value", "most popular" or recommended;
     - no expiry date, no stock, no countdown and no "places remaining";
     - no benefit claims anything about the studio's facilities, materials,
       firing or refreshments.

   Every line in `benefits` describes the shape of the pass itself and nothing
   else, which is the only thing about a pass that can be stated before the
   studio has set its terms. None of them restates the session count or the
   validity either — those are already printed as facts beside the name, and a
   benefit that repeats the line above it is padding.

   The two larger passes carry the same two lines, and that is the truth of the
   offer rather than a gap: these are three sizes of one thing, and what
   actually differs between them — the sessions, the validity and the price —
   is the loudest part of each entry.

   The photographs are stand-ins, reused from the creative strands already in
   the project along with their verified alt text.
   ========================================================================== */
const PLACEHOLDER_PASSES: Pass[] = [
  {
    slug: "day-pass",
    name: "Day Pass",
    description: "One session, taken whenever you are ready for it.",
    price: { amount: 320, currency: "AED" },
    sessions: 1,
    validity: "3 months from purchase",
    benefits: ["Any strand — paint, craft or create", "Book any date in the programme"],
    image: {
      src: "/images/creative/painting.jpg",
      alt: "A painter at an easel, brush in hand, working into a canvas of coral and blush roses among deep teal leaves, a loaded palette at the edge of the frame.",
    },
  },
  {
    slug: "maison-pass",
    name: "Maison Pass",
    description: "Five sessions to spend across the programme at your own pace.",
    price: { amount: 1400, currency: "AED" },
    sessions: 5,
    validity: "12 months from purchase",
    benefits: [
      "Any strand — paint, craft or create",
      "Book each session as you go — no dates to choose now",
    ],
    image: {
      src: "/images/workshops/watercolour-street.jpg",
      alt: "A watercolour of a cobbled hillside street — whitewashed houses under terracotta roofs, geraniums at a shuttered window, and a castle wall rising above the trees.",
    },
  },
  {
    slug: "atelier-pass",
    name: "Atelier Pass",
    description: "Ten sessions for the year, for when making has become a habit.",
    price: { amount: 2600, currency: "AED" },
    sessions: 10,
    validity: "12 months from purchase",
    benefits: [
      "Any strand — paint, shape or craft",
      "Book each session as you go — no dates to choose now",
    ],
    image: {
      src: "/images/creative/craft.jpg",
      alt: "Two hands turning a small ceramic pot while a fine brush lays a block of yellow into a design of pastel blue, lilac, mint and coral.",
    },
  },
];

/**
 * The passes, in the order they should be read.
 *
 * Async on purpose, for the reason `getUpcomingWorkshops` is: the placeholder
 * resolves immediately but the signature is already the one a CMS fetch needs,
 * so nothing downstream changes shape when the data goes remote.
 *
 * Order is editorial — the page numbers what it renders — so a query replacing
 * this body should preserve whatever order the studio sets rather than sorting
 * by price, which would turn an offer into a price list.
 *
 * TODO(client): replace the body with the CMS query.
 */
export async function getPasses(): Promise<Pass[]> {
  return PLACEHOLDER_PASSES;
}
