"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { Workshop } from "@/types";

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

/** One held session. Only the fields checkout has to render or send. */
export interface CartLine {
  slug: string;
  title: string;
  category: string;
  startsAt: string;
  durationMinutes: number;
  venueName?: string;
  venueLocality?: string;
  priceAmount: number;
  priceCurrency: string;
  image: { src: string; alt: string };
  /** The cap on quantity, as it stood when the line was added. */
  seatsAvailable: number;
  quantity: number;
}

export interface Cart {
  lines: CartLine[];
}

const EMPTY: Cart = { lines: [] };

let cart: Cart = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): Cart {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Cart;
    // Anything not shaped like a cart is treated as no cart. Storage is not a
    // trusted input: it survives deploys, and a half-written or hand-edited
    // value must not be able to crash checkout.
    if (!parsed || !Array.isArray(parsed.lines)) return EMPTY;
    return { lines: parsed.lines.filter((l) => l && typeof l.slug === "string" && l.quantity > 0) };
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
export function toCartLine(workshop: Workshop, quantity: number): CartLine {
  return {
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

export function useCart() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLine = useCallback((line: CartLine) => {
    const rest = read().lines.filter((l) => l.slug !== line.slug);
    write({ lines: [...rest, line] });
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    const lines = read()
      .lines.map((l) =>
        l.slug === slug
          ? { ...l, quantity: Math.max(1, Math.min(quantity, l.seatsAvailable)) }
          : l,
      );
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
