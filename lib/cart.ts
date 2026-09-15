"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { Pass, Workshop } from "@/types";

/**
 * The basket, for a booking journey that has no backend.
 *
 * A module-level store read through `useSyncExternalStore` rather than a React
 * context, and that is a deliberate choice: a provider would have to be mounted
 * in the root layout to span `/workshops/[slug]/book` and `/checkout`, which
 * means every page on the site — a marketing homepage included — paying for a
 * client boundary it never uses. This spans routes because the data lives
 * outside React entirely.
 *
 * Persisted to `sessionStorage`, not `localStorage`. A held place is a thing
 * you are in the middle of, not a thing you keep: surviving a refresh or a
 * step backwards is right, and finding a fortnight-old session still in the
 * basket — quite possibly a date that has since passed — is not.
 *
 * THE SNAPSHOT IS THE POINT. Each line stores what the session looked like
 * when it was added rather than a slug to look up later, because checkout is a
 * client tree with no access to the data layer. The price shown at checkout is
 * therefore the price that was shown when the visitor chose — which is the
 * behaviour you want anyway. TODO(client): when a real backend exists it must
 * re-price and re-check availability server-side before taking payment. A
 * client-held snapshot is a convenience, never a source of truth.
 */

const STORAGE_KEY = "maison-palettia:booking";
const DETAILS_KEY = "maison-palettia:details";

/**
 * What the customer told us at the booking step.
 *
 * It lives here rather than in lib/booking.ts because this module already owns
 * everything the journey keeps in the browser, and keeping the two halves of
 * that state in one place is what stops them drifting apart.
 */
export interface BookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Optional: anything the studio should know before the day. */
  notes?: string;
}

/**
 * What everything in the basket has in common.
 *
 * Two things are bought on this site — a place at a session, and a pass — and
 * they go through one basket, one checkout and one payment. What follows is
 * the smallest change that lets both live in the same list: the fields every
 * line has are here, and each kind adds only what it actually carries.
 */
interface CartLineBase {
  /**
   * Unique within the basket: `setLine`, `setQuantity` and `remove` all key on
   * it. A pass stores a prefixed one — see {@link passLineSlug} — so a pass and
   * a session can never collide and evict each other.
   */
  slug: string;
  title: string;
  /** The term printed above the title, e.g. "Painting", or "Loyalty pass". */
  category: string;
  priceAmount: number;
  priceCurrency: string;
  quantity: number;
}

/** One held session. Only the fields checkout has to render or send. */
export interface SessionCartLine extends CartLineBase {
  kind: "session";
  image: { src: string; alt: string };
  startsAt: string;
  durationMinutes: number;
  venueName?: string;
  venueLocality?: string;
  /** The cap on quantity, as it stood when the line was added. */
  seatsAvailable: number;
}

/**
 * One pass, bought rather than booked.
 *
 * No `startsAt`, no venue and no `seatsAvailable`, because a pass has none of
 * them: it is not a place at a table on a date, and there is no availability
 * model behind it to cap a quantity against. See `setQuantity` for what that
 * means for the stepper.
 */
export interface PassCartLine extends CartLineBase {
  kind: "pass";
  /**
   * A plate for the basket entry. Optional, because {@link Pass} allows a pass
   * with no photograph on file — the entry then shows none rather than a
   * stand-in borrowed from something else.
   */
  image?: { src: string; alt: string };
  /**
   * One line of what the pass carries, e.g. "5 sessions · valid 12 months from
   * purchase". Built from the pass's own data when it is added and absent when
   * the data says nothing — never assembled out of guesses.
   */
  summary?: string;
}

/**
 * A line in the basket.
 *
 * A discriminated union rather than one interface with everything made
 * optional, and that is the point of doing it this way: the compiler refuses
 * to let anything read `startsAt` without first establishing that the line is
 * a session, so a pass cannot silently render as "Invalid Date" anywhere.
 */
export type CartLine = SessionCartLine | PassCartLine;

export interface Cart {
  lines: CartLine[];
}

const EMPTY: Cart = { lines: [] };

let cart: Cart = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

/**
 * One stored value, checked and brought up to date, or null.
 *
 * Storage is not a trusted input: it survives deploys and can be hand-edited,
 * so a half-written entry must not be able to crash checkout. It also survives
 * *this change* — a basket held in an open tab across the deploy that added
 * passes has lines with no `kind` on them at all. Those are sessions, because
 * sessions were the only thing there was, and back-filling them here is what
 * keeps that basket rendering instead of turning into an unrecognised item.
 */
function hydrateLine(value: unknown): CartLine | null {
  if (!value || typeof value !== "object") return null;
  // Read as a bag of unknowns rather than as a `CartLine`: this is the one
  // place where the value has not been checked yet, and typing it as the thing
  // it is being checked for would be assuming the answer.
  const line = value as Record<string, unknown>;
  if (typeof line.slug !== "string") return null;
  if (typeof line.quantity !== "number" || line.quantity <= 0) return null;

  if (line.kind === "pass") return line as unknown as PassCartLine;
  return { ...(line as unknown as SessionCartLine), kind: "session" };
}

function read(): Cart {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as { lines?: unknown };
    // Anything not shaped like a cart is treated as no cart.
    if (!parsed || !Array.isArray(parsed.lines)) return EMPTY;
    return {
      lines: parsed.lines
        .map(hydrateLine)
        .filter((line): line is CartLine => line !== null),
    };
  } catch {
    return EMPTY;
  }
}

function write(next: Cart) {
  cart = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode, or storage disabled. The basket still works for this page
    // view; it simply will not survive a refresh. Losing persistence is not a
    // reason to lose the booking in progress.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    cart = read();
    hydrated = true;
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => cart;
/** The server has no basket. Returning a stable empty cart avoids a mismatch. */
const getServerSnapshot = () => EMPTY;

/** Turn a session into a basket line. The cap travels with it. */
export function toCartLine(workshop: Workshop, quantity: number): SessionCartLine {
  return {
    kind: "session",
    slug: workshop.slug,
    title: workshop.title,
    category: workshop.category,
    startsAt: workshop.startsAt,
    durationMinutes: workshop.durationMinutes,
    venueName: workshop.venue?.name,
    venueLocality: workshop.venue?.locality,
    priceAmount: workshop.price.amount,
    priceCurrency: workshop.price.currency,
    image: { src: workshop.image.src, alt: workshop.image.alt },
    seatsAvailable: workshop.seatsAvailable,
    quantity: Math.max(1, Math.min(quantity, workshop.seatsAvailable)),
  };
}

/**
 * The basket key a pass is stored under.
 *
 * Prefixed, because the basket keys on `slug` alone and a pass named after a
 * strand could otherwise share a key with a session and quietly replace it.
 * The prefix never reaches a URL: nothing builds an `/events/{slug}` href for
 * a pass line — see <CartSummary>.
 */
export function passLineSlug(slug: string): string {
  return `pass:${slug}`;
}

/**
 * Turn a pass into a basket line, or null if it cannot be bought.
 *
 * Null rather than a thrown error or an invented price: a pass the studio has
 * written but not yet priced is a real state of the data (see {@link Pass}),
 * and the one honest answer to "add this to the basket" is that there is
 * nothing to charge for it yet. The loyalty page renders that as a sentence
 * rather than a dead button.
 *
 * NO CAP ON QUANTITY, and deliberately. A session's cap is `seatsAvailable`,
 * which is real data about a real table; there is no equivalent for a pass,
 * and a number invented here would be a limit the studio never set. The real
 * one belongs server-side with the re-pricing — see the note on `placeBooking`.
 */
export function toPassCartLine(pass: Pass, quantity: number): PassCartLine | null {
  if (!pass.price) return null;

  // Only what the pass itself states. Neither half is guessed at, and with
  // neither present the line simply carries no summary.
  const terms: string[] = [];
  if (typeof pass.sessions === "number") {
    terms.push(`${pass.sessions} ${pass.sessions === 1 ? "session" : "sessions"}`);
  }
  if (pass.validity) terms.push(`valid ${pass.validity}`);

  return {
    kind: "pass",
    slug: passLineSlug(pass.slug),
    title: pass.name,
    category: "Loyalty pass",
    priceAmount: pass.price.amount,
    priceCurrency: pass.price.currency,
    image: pass.image,
    summary: terms.length > 0 ? terms.join(" · ") : undefined,
    quantity: Math.max(1, quantity),
  };
}

export function useCart() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLine = useCallback((line: CartLine) => {
    const rest = read().lines.filter((l) => l.slug !== line.slug);
    write({ lines: [...rest, line] });
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    const lines = read().lines.map((l) => {
      if (l.slug !== slug) return l;
      // A session is capped by the seats that were free when it was held. A
      // pass has no such number and is not given an invented one — see
      // {@link toPassCartLine}.
      const next =
        l.kind === "session"
          ? Math.max(1, Math.min(quantity, l.seatsAvailable))
          : Math.max(1, quantity);
      return { ...l, quantity: next };
    });
    write({ lines });
  }, []);

  const remove = useCallback((slug: string) => {
    write({ lines: read().lines.filter((l) => l.slug !== slug) });
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  const subtotal = value.lines.reduce((sum, l) => sum + l.priceAmount * l.quantity, 0);
  const places = value.lines.reduce((sum, l) => sum + l.quantity, 0);
  const currency = value.lines[0]?.priceCurrency ?? "AED";

  return { ...value, setLine, setQuantity, remove, clear, subtotal, places, currency };
}

/**
 * Whether the basket has been read out of storage yet.
 *
 * The server has no basket and neither does the first client render — the
 * store is only filled when `subscribe` runs, on commit. Without this, a
 * visitor with two places held sees "nothing held yet" for a frame before the
 * real basket replaces it, which is the one message a checkout must never
 * flash. Checkout waits on this and shows a loading state instead.
 *
 * It rides the same `subscribe` as the basket rather than a store of its own,
 * so the flag and the lines can never report different things.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}

/* --------------------------------------------------------------------------
   The customer's details, carried from the booking step to checkout.

   Read through the same external store as the basket rather than with an
   effect that calls setState on mount. An effect would work and would also be
   a cascading render on every visit to checkout, and — more to the point —
   reading browser storage during render is exactly the mismatch
   `useSyncExternalStore` exists to prevent: the server has no storage, so it
   must be told so explicitly rather than left to guess.
   -------------------------------------------------------------------------- */

let details: BookingDetails | null = null;
let detailsHydrated = false;
const detailsListeners = new Set<() => void>();

function readDetails(): BookingDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DETAILS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookingDetails;
    return parsed && typeof parsed.email === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function subscribeDetails(listener: () => void) {
  if (!detailsHydrated) {
    details = readDetails();
    detailsHydrated = true;
  }
  detailsListeners.add(listener);
  return () => detailsListeners.delete(listener);
}

/** Keep what the visitor typed at the booking step, so checkout can prefill. */
export function saveBookingDetails(next: BookingDetails) {
  details = next;
  detailsHydrated = true;
  try {
    window.sessionStorage.setItem(DETAILS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — checkout asks for the details again rather than
    // losing the booking. See the note on `write` above.
  }
  detailsListeners.forEach((listener) => listener());
}

export function useBookingDetails(): BookingDetails | null {
  return useSyncExternalStore(
    subscribeDetails,
    () => details,
    () => null,
  );
}

/**
 * The rules a set of details has to pass before a booking can be placed.
 *
 * Returns a map of field name to message, empty when everything is in order,
 * so a form can render each message beside the field it belongs to rather than
 * as a list at the top that leaves the visitor hunting.
 *
 * Here rather than inside a component because two screens ask for the same
 * four facts — the booking step and checkout — and two copies of "what counts
 * as an email address" is two copies that drift. The messages are the
 * customer's, not the developer's: they say what to do, never what failed.
 *
 * TODO(client): the booking step still carries its own copy of these rules
 * (components/booking/BookingForm.tsx). It should read them from here the next
 * time that form is touched; it is left alone in this phase because the
 * booking form is out of its scope.
 */
export function validateBookingDetails(input: BookingDetails): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.firstName.trim()) errors.firstName = "Please tell us your first name.";
  if (!input.lastName.trim()) errors.lastName = "Please tell us your last name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = "Please check this email address.";
  }
  if (input.phone.replace(/[^\d]/g, "").length < 7) {
    errors.phone = "Please add a number we can reach you on.";
  }

  return errors;
}
