/**
 * ==========================================================================
 * THE BOOKING FLAGS — the three switches lib/booking.ts is wired by
 * ==========================================================================
 *
 * A MODULE OF THEIR OWN, AND IT MUST STAY IMPORT-FREE. They were declared in
 * lib/booking.ts, which imports `useSyncExternalStore` for its store with no
 * "use client" boundary — so no server component could read them: importing
 * that module from one fails the build. Three surfaces that print what a
 * booking is are server-rendered (the FAQ answer in lib/constants.ts, the
 * checkout page, /payment-success), and the FAQ had to pin its sentence by
 * hand and be remembered when a flag flipped. Here they are plain constants
 * any module can import, server or client. lib/booking.ts re-exports all
 * three, so `import { PAYMENT_CONFIGURED } from "@/lib/booking"` still works
 * and every note that says the flags are "in lib/booking.ts" still leads
 * here.
 *
 * Adding "use client" to lib/booking.ts instead would not have done it: a
 * server component that imports from a client module gets a client reference
 * in place of each export, not its value — a truthy object where `false`
 * should be.
 */

/**
 * Whether a payment provider is configured.
 *
 * A constant rather than a runtime check because there is nothing to check:
 * there is no provider SDK, no account and no key. Read by the checkout and
 * the confirmation so that the moment a provider is wired, every surface that
 * currently says "no payment was taken" stops saying it.
 *
 * TODO(client): choose a provider and set this true once its client is
 * initialised. For AED in the UAE the usual candidates are Stripe, Checkout.com,
 * Telr and Network International. Keys belong in environment variables, never
 * in this file and never in the repository.
 */
export const PAYMENT_CONFIGURED = false;

/**
 * Whether a booking can be recorded anywhere the studio can see.
 *
 * Separate from payment on purpose: a studio might take enquiries by email long
 * before it takes cards. While this is false, `placeBooking` writes to the
 * browser only and the confirmation says as much.
 *
 * TODO(client): set true once there is somewhere for a booking to go — a
 * database, a server action writing to the CMS, or a mail service. The studio's
 * own email address is still `null` in lib/constants.ts.
 */
export const BOOKING_CONFIGURED = false;

/**
 * Whether pass and loyalty codes can actually be checked against anything.
 *
 * The client asked for a code box at checkout. There is nothing behind it: no
 * codes exist, no ledger of them exists, and there is no service that could
 * say whether one is genuine. This flag is what keeps that honest — while it
 * is false the field is offered, accepts what is typed, and comes back saying
 * codes are not live yet.
 *
 * IT MUST NOT BE FLIPPED WITHOUT A REAL CHECK BEHIND IT. Setting this true
 * with `redeemPassCode` still stubbed would turn an honest "not yet" into a
 * false "that code is invalid" — accusing customers of mistyping a code that
 * was never going to work.
 *
 * TODO(client): implement `redeemPassCode` against the real ledger, then set
 * this true. The check has to happen server-side for the same reason pricing
 * does — see the note on `placeBooking`.
 */
export const PASS_CODES_CONFIGURED = false;
