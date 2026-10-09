import type { MallPartner } from "@/types";

/**
 * The centres the Maison has agreements with, and the seam where they will
 * meet a CMS.
 *
 * Everything reads these through {@link getMallPartners}, so replacing the
 * array below with a query is a change to one function body — the same
 * arrangement lib/workshops.ts, lib/disciplines.ts and lib/passes.ts use.
 *
 * ONE ENTRY IS THE POINT, NOT A GAP. The client has confirmed exactly one
 * partnership, so exactly one is listed. <MallPartners> is built to read
 * properly at one and to take more without changing: entries stack, so a
 * second and a third extend the column instead of leaving holes in a grid
 * that was drawn for three. Adding a partner is appending to this array.
 *
 * NOTHING HERE IS A CLAIM THE CLIENT HAS NOT MADE. No count of destinations,
 * no years, no footfall, no "trusted by" — there are no statistics in this
 * module because the studio has supplied none, and a credibility section that
 * invents its own numbers is the opposite of credible.
 */

/* ==========================================================================
   TODO(client): ONE CONFIRMED PARTNER. EVERYTHING ELSE IS STILL MISSING.

   The name and the city are the client's own: Times Square Center, Dubai.
   What is *not* supplied, and is therefore not invented here:

     - `logo`. There is no approved Times Square Center asset in the project
       (public/images/brand/ holds a .gitkeep). The mark is not recreated,
       traced or approximated — the entry sets the name as type until the
       centre supplies its own file, at which point adding `logo` is enough.
     - `image`. There is no photograph of the centre in the project either. No
       studio photograph stands in for one: a picture of a pottery wheel
       captioned as a shopping centre would be the one fabrication a section
       about real partnerships must not contain.
     - `descriptor` and `eventDescriptor` are the client's own lines, one per
       surface (see the note on the entry). Neither is the centre's wording
       about itself; replace them with it once there is some.

   `locationHref` is a Google Maps *search* rather than a pinned coordinate.
   The project has no coordinates for anywhere — see the note in
   <LocationDiscovery> — and a search for the centre's name resolves to the
   real place without this file asserting an address it cannot verify. Replace
   it with the centre's own page or a pinned link when one is supplied.

   SEPARATELY, AND WORTH THE CLIENT'S ATTENTION: lib/workshops.ts still carries
   invented malls on its placeholder sessions, flagged in capitals at the top
   of that file. They are not partnerships and were never claimed to be, but a
   visitor who reads this section and then the events listing will see mall
   names the studio has no agreement with. Pointing those placeholder venues at
   the confirmed destination is the fix; it is out of this section's scope.
   ========================================================================== */
/**
 * A partner as this module holds it: everything {@link MallPartner} carries,
 * plus the line the client wrote for the experience pages.
 *
 * Optional, and declared beside the only data that sets it: a centre with no
 * event-page line of its own falls back to `descriptor` wherever this is read,
 * so a second partner can be added with one line and still render everywhere.
 * It can move onto {@link MallPartner} itself when the CMS shape is settled.
 */
export interface PartnerRecord extends MallPartner {
  /** The line under the plate on /events and /events/[slug] (PDF p19). */
  eventDescriptor?: string;
}

const MALL_PARTNERS: PartnerRecord[] = [
  {
    slug: "times-square-center",
    name: "Times Square Center",
    locality: "Dubai",
    /*
      TWO LINES, BECAUSE THE CLIENT WROTE TWO.

      This was one string serving every surface, and that is how it broke:
      the client supplied the p19 line for the event pages' location card
      (2026-10-08), then the p35 line for the "Our home" plate on
      /private-events (2026-10-09). The second was written into the shared
      string, so it replaced the first on every event page too — a request
      against one page silently rewrote another.

      So each surface reads the line written for it:

        descriptor ........ p35. The plate on /private-events, and the default
                            <PartnerPlate> prints — /locations, which the PDF
                            does not cover, reads it too.
        eventDescriptor ... p19. The plate on every /events/[slug] page, and
                            the destination line on /events. Passed to
                            <PartnerPlate> as `line`.

      Change either and only its own surfaces move.
    */
    descriptor:
      "Find us at Times Square Center, where the Maison comes to life with hands-on experiences, workshops and plenty of reasons to stop by and make something.",
    eventDescriptor:
      "Find us at Times Square Center, where creativity, community and a little time away from the everyday come together.",
    locationHref:
      "https://www.google.com/maps/search/?api=1&query=Times+Square+Center+Dubai",
  },
];

/**
 * The partner destinations, in the order they should be read.
 *
 * Async on purpose, for the reason `getUpcomingWorkshops` is: the array
 * resolves immediately but the signature is already the one a CMS fetch needs.
 *
 * Order is editorial rather than alphabetical — the studio decides which
 * destination leads — so a query replacing this body should preserve whatever
 * order it is given.
 *
 * TODO(client): replace the body with the CMS query.
 */
export async function getMallPartners(): Promise<PartnerRecord[]> {
  return MALL_PARTNERS;
}
