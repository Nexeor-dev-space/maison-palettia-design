import type { BookingDetails, CartLine } from "@/lib/cart";

export type { BookingDetails };

/**
 * The two seams between this site and a business that can actually take a
 * booking — and an honest account of the fact that neither is connected.
 *
 * AUDITED, NOT ASSUMED. The project has no authentication, no database, no API
 * route, no server action, no mail service and no payment provider. Its entire
 * runtime dependency list is next, react, react-dom, framer-motion, lenis and
 * lucide-react. Nothing here is being replaced or worked around; there was
 * nothing to work around.
 *
 * So the booking journey is built complete and truthful up to the moment money
 * or a commitment would change hands, and stops there deliberately. The
 * alternative — a success screen, an invented reference number, a form that
 * swallows a customer's details — is the one thing that must never ship,
 * because it is indistinguishable from a working system to the person using it
 * and to the studio reviewing it.
 *
 * Wiring this up is two functions and their configuration flags. Nothing else
 * on any page has to change.
 */

export interface BookingRequest {
  lines: CartLine[];
  details: BookingDetails;
  subtotal: number;
  currency: string;
}

/**
 * Whether a payment provider is configured.
 *
 * A constant rather than a runtime check because there is nothing to check:
 * there is no provider SDK, no account and no key. It is read by the checkout
 * so that the moment a provider is wired the interface changes with it rather
 * than needing a second edit.
 *
 * TODO(client): choose a provider and set this true once its client is
 * initialised. For AED in the UAE the usual candidates are Stripe, Checkout.com,
 * Telr and Network International. Keys belong in environment variables, never
 * in this file and never in the repository.
 */
export const PAYMENT_CONFIGURED = false;

/**
 * Whether a booking can be recorded anywhere.
 *
 * Separate from payment on purpose: a studio might take enquiries by email long
 * before it takes cards, and the checkout should be able to say which of the
 * two it can honestly do.
 *
 * TODO(client): set true once there is somewhere for a booking to go — a
 * database, a server action writing to the CMS, or a mail service. The studio's
 * own email address is still `null` in lib/constants.ts.
 */
export const BOOKING_CONFIGURED = false;

export type BookingResult =
  | { status: "unconfigured"; missing: ("payment" | "recording")[] }
  | { status: "ok"; reference: string };

/**
 * Place the booking.
 *
 * Returns rather than throws, so the checkout can render a specific, honest
 * explanation instead of a generic failure — and so the caller cannot mistake
 * silence for success.
 *
 * There is no `catch` that quietly resolves, no optimistic state and no
 * fallback that pretends. While the flags above are false this always reports
 * what is missing, and the interface says so in plain words.
 *
 * TODO(client): the real implementation must, server-side and in this order:
 * re-read each session from the source of truth, re-check availability and
 * price against the held lines (the basket is a client-side snapshot and must
 * never be trusted for either), take payment, record the booking, decrement
 * seats, then return the provider's own reference. Never mint a reference here.
 */
export async function placeBooking(request: BookingRequest): Promise<BookingResult> {
  void request;

  const missing: ("payment" | "recording")[] = [];
  if (!PAYMENT_CONFIGURED) missing.push("payment");
  if (!BOOKING_CONFIGURED) missing.push("recording");

  if (missing.length > 0) return { status: "unconfigured", missing };

  // Unreachable while the flags above are false. Left as the shape the real
  // integration returns rather than as a stub that could be mistaken for one.
  throw new Error(
    "placeBooking: payment and recording are marked configured but no integration is implemented.",
  );
}
