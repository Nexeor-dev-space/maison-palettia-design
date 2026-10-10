/**
 * ==========================================================================
 * THE BOOKING FLAGS — what the site's booking machinery is capable of
 * ==========================================================================
 *
 * A MODULE OF THEIR OWN, AND IT MUST STAY IMPORT-FREE. Server components
 * (lib/constants.server.ts, the FAQ answer) and client components
 * (lib/constants.ts, through <Checkout>) both read these, so they are plain
 * constants any module can import. A server component that imported them
 * from a "use client" module would get a client reference — a truthy object
 * where `false` should be.
 *
 * WHAT CHANGED IN PHASE 3, AND WHY THESE ARE NOW TRUE. They used to describe
 * a site with no backend: a booking was written to the visitor's own browser
 * (a "preview booking", reference MP-D…), nothing was charged, and the three
 * sentences in `BOOKING_TERMS` (lib/constants.ts) were chosen by how much of
 * a backend existed. There is one now — the CMS records every order, Mamo Pay
 * takes the money (or the mock gateway outside production), and codes are
 * checked server-side by `quote()` — so the flags state that capability and
 * the demo store they once guarded is gone.
 *
 * THE RUNTIME SWITCH IS NOT HERE. Whether the site is actually taking
 * bookings today is `booking-settings.bookingsOpen` (SPEC §C.3), read on the
 * server by lib/booking.ts (`getBookingGate`) — the owner turns it on in the
 * admin once email, payments and the site address are ready, without a
 * deploy. While it is off, every booking surface shows the admin's
 * `closedMessage` and a link to Contact; nothing reaches checkout. These
 * flags only decide which wording the fallbacks pick when the CMS cannot be
 * read at all.
 */

/**
 * Bookings are paid through the site (Mamo Pay; the mock gateway outside
 * production). Selects `BOOKING_TERMS.paid` — "Your booking is confirmed once
 * your payment has gone through." — wherever the admin's own sentence is not
 * available.
 */
export const PAYMENT_CONFIGURED = true;

/**
 * Bookings are recorded where the studio can see them: the `orders`
 * collection, with a confirmation email and tickets once paid.
 */
export const BOOKING_CONFIGURED = true;

/**
 * Pass and promo codes are checked against the real ledger: the checkout's
 * code box asks `POST /api/site/checkout/quote`, which re-prices the basket
 * on the server (promo rules, pass credits for that email) and answers with
 * the new totals or the reason a code was refused. The browser never
 * subtracts anything itself.
 */
export const PASS_CODES_CONFIGURED = true;
