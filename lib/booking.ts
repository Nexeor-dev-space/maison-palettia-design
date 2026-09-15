import { useSyncExternalStore } from "react";

import type { BookingDetails, CartLine } from "@/lib/cart";

export type { BookingDetails };

/**
 * The seam between this site and a business that can actually take a booking,
 * and the demo reservation that stands in until there is one.
 *
 * AUDITED, NOT ASSUMED. The project has no authentication, no database, no API
 * route, no server action, no mail service and no payment provider. Its entire
 * runtime dependency list is next, react, react-dom, framer-motion, lenis and
 * lucide-react. Nothing here is being replaced or worked around; there was
 * nothing to work around.
 *
 * WHAT CHANGED, AND WHY IT IS NOT THE THING THIS FILE USED TO FORBID. The
 * previous version refused to mint a reference at all, on the grounds that a
 * success screen over a booking that went nowhere is indistinguishable from a
 * working system. That reasoning still holds for anything claiming a payment.
 * The client has asked for a working demo of the journey — a reservation, a
 * confirmation page and a status lookup — so the line moves from "no outcome"
 * to "an outcome that never claims to be more than a demo":
 *
 *   - No money is taken and the interface never says any was. The reference is
 *     labelled a preview booking wherever it appears.
 *   - The reference is prefixed MP-D (D for demo) so a real one can never be
 *     confused with one of these, in this codebase or in the studio's inbox.
 *   - The record lives in the visitor's own browser and nowhere else. The
 *     studio is not notified, because there is nothing to notify it with, and
 *     every surface that shows a booking says so.
 *
 * Wiring the real thing up is `placeBooking` and the two flags below. The
 * demo store then becomes dead code and should be deleted with them.
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

/**
 * What came back from offering a code.
 *
 * Four outcomes, and only two of them reachable today. `invalid` and `applied`
 * are written now so that wiring a real ledger is a change to this file alone
 * and not to the interface that renders the answer.
 *
 * NOTE ON `applied`. It carries no amount, and that is deliberate rather than
 * unfinished: a discount that moves a total has to be calculated where the
 * price is, which is server-side, and inventing a subtraction in the browser
 * is exactly the fake discount this must never produce. When the ledger is
 * real, the re-priced total comes back from it and the totals here follow.
 */
export type PassCodeResult =
  /** Nothing was typed. */
  | { status: "empty" }
  /** No ledger to check against — see {@link PASS_CODES_CONFIGURED}. */
  | { status: "unavailable" }
  /** Checked, and no such code. Unreachable while the flag above is false. */
  | { status: "invalid" }
  /** Checked and genuine. Unreachable while the flag above is false. */
  | { status: "applied"; code: string; message: string };

/**
 * Offer a pass, loyalty or gift code against the booking in progress.
 *
 * Async because the real one will be, so nothing downstream changes shape when
 * it starts talking to a service: the field already renders a pending state
 * and already disables itself while a check is running.
 *
 * Deliberately does not touch the basket. Nothing in this function can alter a
 * price, and while `PASS_CODES_CONFIGURED` is false nothing in it can succeed
 * either — there are no codes to recognise, so there is no branch that could
 * quietly award one.
 *
 * TODO(client): replace the body with the ledger call. It must validate the
 * code, check it against this basket's sessions and this customer, and return
 * the re-priced total rather than a percentage for the browser to apply.
 */
export async function redeemPassCode(code: string): Promise<PassCodeResult> {
  const trimmed = code.trim();
  if (!trimmed) return { status: "empty" };

  if (!PASS_CODES_CONFIGURED) return { status: "unavailable" };

  // Unreachable while the flag is false, and left as the shape the real
  // implementation returns rather than as a throw, so the branch above is the
  // only thing standing between this and a working redemption.
  return { status: "invalid" };
}

/**
 * A booking's state.
 *
 * Four, because those are the four a visitor could meaningfully be told. Only
 * two are reachable without a backend and the reachable pair is derived from
 * data rather than invented: a demo reservation is `confirmed` until its event
 * has finished, and `completed` after. `pending` and `cancelled` are real
 * states of a real system — a payment awaiting settlement, a date the studio
 * called off — and nothing in the browser can know either, so nothing here
 * ever produces them. The status page renders all four so that wiring a
 * backend needs no change to the interface.
 */
export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed";

/** One reservation, as it is stored and as the confirmation reads it back. */
export interface BookingRecord {
  reference: string;
  /** Placed at, ISO 8601. */
  createdAt: string;
  status: BookingStatus;
  /** Whether money actually moved. Always false while PAYMENT_CONFIGURED is. */
  paid: boolean;
  details: BookingDetails;
  lines: CartLine[];
  subtotal: number;
  currency: string;
}

export type BookingResult =
  | { status: "ok"; record: BookingRecord }
  | { status: "empty" };

/* ==========================================================================
   The demo store.

   localStorage, not the sessionStorage the basket uses, and the difference is
   the whole point of the status page: a basket is abandoned when the tab
   closes, a booking reference has to still be there tomorrow when someone
   comes back to look it up.

   Every read is wrapped. Storage throws rather than returning null in a
   private window and in browsers set to block site data, and a booking
   confirmation that white-screens because of a browser setting is worse than
   one that quietly cannot find an old reference.
   ========================================================================== */

const STORE_KEY = "maison-palettia:bookings";

/** Demo references are visibly demo. See the note at the top of this file. */
const REFERENCE_PREFIX = "MP-D";

/*
  Held in a module variable and mirrored to storage, exactly as the basket is
  in lib/cart.ts, and for a reason beyond consistency: the pages that read a
  booking do it through `useSyncExternalStore`, which compares snapshots with
  `Object.is` and spins forever if the getter builds a new array each call.
  Parsing storage on every render would do precisely that.
*/
const EMPTY: readonly BookingRecord[] = [];

let records: readonly BookingRecord[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function readAll(): readonly BookingRecord[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    // Storage is not a trusted input: it survives deploys and can be
    // hand-edited, and a malformed entry must not be able to crash a
    // confirmation screen.
    return parsed.filter(
      (r): r is BookingRecord =>
        !!r && typeof r.reference === "string" && Array.isArray(r.lines),
    );
  } catch {
    return EMPTY;
  }
}

function writeAll(next: readonly BookingRecord[]): void {
  records = next;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    /* Storage full or blocked. The confirmation still renders from the record
       it was handed; only the later lookup is lost. */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  if (!hydrated) {
    records = readAll();
    hydrated = true;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => records;
/** The server has no bookings. A stable empty list avoids a hydration mismatch. */
const getServerSnapshot = () => EMPTY;

/**
 * Every booking this browser holds, kept live.
 *
 * The hook the confirmation and the status page read through. It exists so
 * neither of them has to reach into storage from an effect — which is both a
 * cascading render and, on the first paint, a different answer on the server
 * than on the client.
 */
export function useBookings(): readonly BookingRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Six characters from an unambiguous alphabet.
 *
 * No I, O, 1 or 0: a reference is read off a screen and typed into the status
 * page by hand, and those four are the pairs people get wrong. `crypto` rather
 * than `Math.random` because it is available in every browser this ships to
 * and there is no reason to use the weaker one.
 */
function mintReference(): string {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${REFERENCE_PREFIX}${body}`;
}

/**
 * Place the booking.
 *
 * Returns rather than throws, so the checkout can render a specific outcome
 * instead of a generic failure. While the flags above are false this makes a
 * demo reservation: it mints a reference, stores it in this browser, and
 * reports `paid: false` — which every surface downstream is required to show.
 *
 * TODO(client): the real implementation must, server-side and in this order:
 * re-read each event from the source of truth, re-check availability and price
 * against the held lines (the basket is a client-side snapshot and must never
 * be trusted for either), take payment, record the booking, decrement seats,
 * then return the provider's own reference. Delete the demo store with it.
 */
export async function placeBooking(request: BookingRequest): Promise<BookingResult> {
  if (request.lines.length === 0) return { status: "empty" };

  const record: BookingRecord = {
    reference: mintReference(),
    createdAt: new Date().toISOString(),
    /*
      "confirmed" only once something has actually recorded it.

      This read "confirmed" unconditionally, and that was the most dangerous
      sentence on the site. Nothing here reaches a server: the record is
      written to this browser's own storage, so while BOOKING_CONFIGURED is
      false the studio has no idea anyone is coming. The confirmation page
      then told the customer their place was held and — in <BookingSummaryCard>
      — "come to the venue at the time below", which would send someone across
      Dubai to a table that was never set for them.

      `pending` is not a workaround; it is the accurate one of the four states
      this type already carries, and every surface downstream already renders
      it properly ("waiting on confirmation from the Maison", terracotta rule).
      The moment a real backend sets BOOKING_CONFIGURED, this becomes
      "confirmed" on its own.
    */
    status: BOOKING_CONFIGURED ? "confirmed" : "pending",
    paid: PAYMENT_CONFIGURED,
    details: request.details,
    lines: request.lines,
    subtotal: request.subtotal,
    currency: request.currency,
  };

  writeAll([record, ...readAll()].slice(0, 20));
  return { status: "ok", record };
}

/**
 * One booking by reference, or null.
 *
 * Case- and space-insensitive, because the reference is typed by hand off a
 * confirmation screen and "mp-d 4k7xy2" is the same booking as "MP-D4K7XY2".
 */
export function findBooking(
  all: readonly BookingRecord[],
  reference: string,
): BookingRecord | null {
  const wanted = reference.replace(/[\s-]/g, "").toUpperCase();
  if (!wanted) return null;
  return all.find((r) => r.reference.replace(/[\s-]/g, "").toUpperCase() === wanted) ?? null;
}

/**
 * The status to show for a record, derived at read time rather than trusted
 * from the stored field.
 *
 * A reservation written last month for an event that has since happened is
 * `completed`, and storing "confirmed" and never revisiting it would leave the
 * status page insisting a finished morning is still upcoming. Only the two
 * derivable states are produced here; see {@link BookingStatus}.
 */
export function resolveStatus(record: BookingRecord): BookingStatus {
  if (record.status === "cancelled" || record.status === "pending") return record.status;

  /*
    Only the sessions have an end. A pass line carries no `startsAt`, and
    including one here would put a NaN through `Math.max` and take the whole
    reduction with it — a booking with a pass in it would then never be
    reported as completed, however long ago its sessions finished.

    A record of passes alone leaves `last` at 0 and stays confirmed, which is
    right: a pass does not finish on a date.
  */
  const last = record.lines.reduce((latest, line) => {
    if (line.kind !== "session") return latest;
    const ends = new Date(line.startsAt).getTime() + line.durationMinutes * 60_000;
    return Math.max(latest, ends);
  }, 0);

  return last !== 0 && last < Date.now() ? "completed" : "confirmed";
}
