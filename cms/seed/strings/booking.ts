/**
 * ==========================================================================
 * Booking & checkout wording (global `booking-settings`) — SPEC §F.6
 * ==========================================================================
 *
 * What the seed writes on top of the global's own defaults
 * (cms/globals/BookingSettings.ts):
 *
 *   · the switches SPEC §F.6 fixes: bookings CLOSED until Phase 3 has a
 *     working checkout, the real reference prefix `MP-` (the demo `MP-D`
 *     belonged to browser-only bookings), and the pass-code label;
 *   · the event page's booking-bar wording, verbatim from
 *     app/(site)/events/[slug]/page.tsx — Phase 2 wires that page to this
 *     global, so these must be today's words, not the inventory's;
 *   · the two "More from…" bars (event page, checkout), links included.
 *
 * Checkout, basket, booking step, confirmation and status-lookup copy keep
 * the global's defaults: those surfaces are rebuilt in Phase 3 (3F) around
 * real orders, and today's wording describes the browser-only preview
 * ("Preview bookings are held in the browser they were made in…").
 */

/** The FAQ / checkout sentence for the mode the site is in TODAY (request; no reference channel set). */
export const BOOKING_TERMS_TODAY =
  // lib/constants.ts:1001 — bookingTerms() returns BOOKING_TERMS.request while
  // PAYMENT_CONFIGURED and BOOKING_CONFIGURED are false (lib/bookingFlags.ts),
  // and the no-channel variant because CONTACT.email/phone are null.
  "Booking here makes a request that is not yet confirmed. No payment is taken and the request is saved only in this browser, so keep the reference you are given.";

/** SPEC §F.6: `bookingTerms ← BOOKING_TERMS.paid`, the sentence for real, paid bookings (launch mode). */
export const BOOKING_TERMS_PAID = "Your booking is confirmed once your payment has gone through."; // lib/constants.ts:1004

export const BOOKING_SETTINGS = {
  bookingsOpen: false, // SPEC §F.6 — closed until Phase 3's checkout exists
  referencePrefix: "MP-", // SPEC §F.6 (lib/booking.ts:158 had the demo "MP-D")
  lowSeatThreshold: 4, // lib/workshops.ts:18 LOW_SEAT_THRESHOLD
  passCodeCopy: { label: "Pass or promo code" }, // SPEC §F.6
  eventPage: {
    bookLabel: "Book this experience", // app/(site)/events/[slug]/page.tsx:787
    passedLabel: "Date passed", // app/(site)/events/[slug]/page.tsx:642
    perPersonLabel: "per person", // app/(site)/events/[slug]/page.tsx:1470
    closedFullFact: "This date is full", // app/(site)/events/[slug]/page.tsx:932
    closedPassedFact: "This date has passed", // app/(site)/events/[slug]/page.tsx:932
    noneOpenSuffix: ", and nothing else is open just now.", // app/(site)/events/[slug]/page.tsx:937 (`${fact}, and nothing else…`)
    othersOpenSuffix: ". Other sessions are open.", // app/(site)/events/[slug]/page.tsx:950 (`${fact}. Other sessions…`)
    seeOpenLabel: "See what is open", // app/(site)/events/[slug]/page.tsx:956
    diyTitle: "Come on a day we are there.", // app/(site)/events/[slug]/page.tsx:870
    diyBody: "Just drop in when the experience is available and start creating.", // app/(site)/events/[slug]/page.tsx:873
    diyCta: "See where we are set up", // app/(site)/events/[slug]/page.tsx:879
    comingSoonNote: "Not running yet. It will appear in the programme when it opens.", // app/(site)/events/[slug]/page.tsx:811
    readyHeading: "Ready to Create?", // app/(site)/events/[slug]/page.tsx:1750
    readyBody: "Everything is laid out before you arrive. You bring nothing but yourself.", // app/(site)/events/[slug]/page.tsx:1763-1764
    utilityNote: "Everything you need is waiting for you. Just bring yourself, pick a project and start creating.", // app/(site)/events/[slug]/page.tsx:289
  },
  utilityBars: {
    eventDetail: {
      note: "Everything you need is waiting for you. Just bring yourself, pick a project and start creating.", // app/(site)/events/[slug]/page.tsx:289
      links: [
        { label: "All events", link: { type: "internal", url: "/events" } }, // app/(site)/events/[slug]/page.tsx:291
        { label: "Questions", link: { type: "internal", url: "/faq" } }, // app/(site)/events/[slug]/page.tsx:292
        { label: "Contact", link: { type: "internal", url: "/contact" } }, // app/(site)/events/[slug]/page.tsx:293
      ],
    },
    checkout: {
      links: [
        { label: "Check a booking", link: { type: "internal", url: "/booking-status" } }, // app/(site)/checkout/page.tsx:84
        { label: "Questions", link: { type: "internal", url: "/faq" } }, // app/(site)/checkout/page.tsx:85
        { label: "Contact", link: { type: "internal", url: "/contact" } }, // app/(site)/checkout/page.tsx:86
      ],
    },
  },
};
