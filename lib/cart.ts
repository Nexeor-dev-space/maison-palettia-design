"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { Pass, Workshop } from "@/types";

/**
 * The basket — the browser half of the booking journey.
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
 * therefore the price that was shown when the visitor chose, which is what a
 * basket should show. It is a convenience, never a source of truth: the
 * server re-prices every line from the database and re-checks the seats
 * inside the checkout transaction (`startCheckout`, SPEC §H.3), and the
 * amount Mamo charges is the server's.
 *
 * THE SECOND HALF OF THIS FILE talks to the server: the `basketId` that lets
 * a double-pressed Pay re-use one order instead of holding the seats twice,
 * `startCheckout` and `requestQuote` (the fetches behind checkout's Pay
 * button and code box), and the note of a payment in flight so the
 * confirmation knows which basket to clear.
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
  /**
   * The CMS document id (`sessions` or `passes`) — what `startCheckout` and
   * `quote` take. Optional: lines added before Phase 3 have none, and
   * checkout resolves those from the slug (`getCheckoutCatalogue`).
   */
  id?: string;
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

/** Turn a session into a basket line. The cap travels with it; so does the CMS id when the page knows it. */
export function toCartLine(workshop: Workshop, quantity: number, id?: string): SessionCartLine {
  return {
    kind: "session",
    slug: workshop.slug,
    ...(id ? { id } : {}),
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
 * and a number invented here would be a limit the studio never set. Any real
 * limit is the server's, applied when it re-prices the basket.
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

  const clear = useCallback(() => {
    write(EMPTY);
    // A new basket is a new booking: the next Pay must not re-use this order.
    forgetBasketId();
  }, []);

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

/**
 * The four required fields, in the order they sit down the page.
 *
 * One list for both steps, because "which field gets focus when the press
 * fails" is a promise about reading order: the first message a keyboard or
 * screen-reader visitor lands on must be the first one a sighted visitor
 * would read. Two copies of the order is two forms that can disagree about
 * where "first" is the moment either one is rearranged.
 */
export const BOOKING_FIELD_ORDER = ["firstName", "lastName", "email", "phone"] as const;

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

/**
 * Forget the details once the booking they were given for has been paid.
 *
 * They are kept only to carry a booking in progress between its steps — and
 * across the trip to the payment page and back, because a declined card
 * returns to checkout with the form still filled. Once the order is
 * confirmed, nothing reads them, and leaving them in the tab would hand the next
 * booking's form someone else's name, email and phone. This site is used on
 * shared studio tablets and on phones passed across a mall counter, so "the
 * next booking in this tab" is quite often the next person.
 */
export function clearBookingDetails() {
  details = null;
  detailsHydrated = true;
  try {
    window.sessionStorage.removeItem(DETAILS_KEY);
  } catch {
    // Storage unavailable: there was nothing persisted to remove, and the
    // in-memory copy is already gone.
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

/* ==========================================================================
   Talking to the server — the basketId, checkout, quotes
   ========================================================================== */

const BASKET_ID_KEY = "maison-palettia:basket-id";
const WAITLIST_KEY = "maison-palettia:waitlist-token";
const PENDING_KEY = "maison-palettia:pending-payment";

function storageGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the in-flight checkout still works; only the
    // re-use of its order across a reload is lost.
  }
}

/** RFC 4122 v4 — `crypto.randomUUID` where it exists (every secure context), bytes otherwise. */
function uuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** What the basket holds, as one comparable string: kind, slug and quantity of every line. */
export function basketFingerprint(lines: readonly CartLine[]): string {
  return lines
    .map((line) => `${line.kind}:${line.slug}:${line.quantity}`)
    .sort()
    .join("|");
}

/**
 * The basket's id for `startCheckout` (SPEC §H.3 "Basket reuse").
 *
 * The server re-uses an open order with the same basketId and email instead
 * of creating a second one — so a double-pressed Pay, a back button from the
 * payment page, or a retry after a declined card all land on ONE order
 * holding the seats once, rather than each press holding them again until
 * the hold expires (self-inflicted sell-outs).
 *
 * Bound to what the basket holds. Changing a quantity or a line after a
 * payment attempt mints a new id, because the old order was priced and held
 * for different seats and must not be paid for as though it were this one;
 * its hold simply lapses.
 */
export function basketIdFor(lines: readonly CartLine[]): string {
  const fingerprint = basketFingerprint(lines);
  const raw = storageGet(BASKET_ID_KEY);
  if (raw) {
    try {
      const stored = JSON.parse(raw) as { id?: unknown; fingerprint?: unknown };
      if (typeof stored.id === "string" && stored.fingerprint === fingerprint) return stored.id;
    } catch {
      // Unreadable: mint a fresh one below.
    }
  }
  const id = uuid();
  storageSet(BASKET_ID_KEY, JSON.stringify({ id, fingerprint }));
  return id;
}

function forgetBasketId() {
  storageSet(BASKET_ID_KEY, null);
}

/**
 * The waitlist offer token (`/events/{slug}/book?w=…`, SPEC §H.11). Carried
 * from the booking step to checkout so `startCheckout` may take a seat on a
 * session that is still marked waitlist. Kept with the session it was issued
 * for: it means nothing for any other line.
 */
export function saveWaitlistToken(sessionSlug: string, token: string | null) {
  storageSet(WAITLIST_KEY, token ? JSON.stringify({ slug: sessionSlug, token }) : null);
}

export function readWaitlistToken(lines: readonly CartLine[]): string | undefined {
  const raw = storageGet(WAITLIST_KEY);
  if (!raw) return undefined;
  try {
    const stored = JSON.parse(raw) as { slug?: unknown; token?: unknown };
    if (typeof stored.token !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(stored.token)) return undefined;
    return lines.some((line) => line.kind === "session" && line.slug === stored.slug) ? stored.token : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The order a payment is in flight for. Written just before the browser
 * leaves for the payment page, read by the confirmation: when that order is
 * confirmed, the basket it was made from is cleared — and only then, so a
 * declined card comes back to a basket that is still full.
 */
export function notePendingPayment(reference: string) {
  storageSet(PENDING_KEY, reference);
}

export function pendingPaymentReference(): string | null {
  return storageGet(PENDING_KEY);
}

/**
 * The booking is paid: forget everything this tab kept for it — the basket,
 * the details (the next booking on a shared tablet is often the next person),
 * the basketId, the waitlist token and the in-flight note.
 */
export function completeBooking() {
  write(EMPTY);
  details = null;
  detailsHydrated = true;
  storageSet(DETAILS_KEY, null);
  detailsListeners.forEach((listener) => listener());
  forgetBasketId();
  storageSet(WAITLIST_KEY, null);
  storageSet(PENDING_KEY, null);
}

/* -------------------------------------------------------------------------- */

/** One line as `startCheckout` and `quote` take it (`QuoteLineInput`, SPEC §O). */
export interface CheckoutLineInput {
  kind: "session" | "pass";
  id: string;
  qty: number;
}

/**
 * The body of `POST /api/site/checkout/start` — `StartCheckoutInput` minus
 * what only the server may say (`channel`, `source`, `desk`), plus the
 * booking step's optional note.
 */
export interface StartCheckoutBody {
  basketId: string;
  details: { firstName: string; lastName: string; email: string; phone: string; marketingOptIn?: boolean };
  /** "Anything we should know" — `orders.notes`. */
  notes?: string;
  lines: CheckoutLineInput[];
  codes: string[];
  consents: Array<{ policy: string; version: number }>;
  waitlistToken?: string;
}

export type StartCheckoutOutcome =
  /** Go and pay: `location.assign(paymentUrl)`. */
  | { status: "redirect"; reference: string; paymentUrl: string; holdExpiresAt: string }
  /** Nothing to pay (pass credits or a 100 % code): straight to the confirmation. */
  | { status: "paid"; reference: string; k: string }
  /** A session has fewer seats than asked for; `available` is the live count when the server gave it. */
  | { status: "sold_out"; available?: number; sessionId?: string }
  /** Bookings were switched off between the page loading and the press. */
  | { status: "closed" }
  /** No payment provider is set up (production without a key). */
  | { status: "gateway_disabled" }
  | { status: "rate_limited" }
  | { status: "invalid"; message?: string }
  /** The order exists and the seats are held, but the payment page could not be made. Pressing again retries. */
  | { status: "payment_link_failed" }
  | { status: "error" };

type Json = Record<string, unknown>;

async function postJson(url: string, body: unknown): Promise<{ response: Response; json: Json } | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    let json: Json = {};
    try {
      json = (await response.json()) as Json;
    } catch {
      // Not JSON (a proxy page): judged by the status alone.
    }
    return { response, json };
  } catch {
    return null;
  }
}

const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);

/**
 * Press Pay. Returns rather than throws, so checkout can say exactly what
 * happened. The response shapes are `StartCheckoutResult` (SPEC §O) on 200,
 * and `{ reason }` on the refusals SPEC §H.3 lists: 409 sold out, 503
 * bookings closed / gateway disabled, 502 payment link failed.
 */
export async function startCheckout(body: StartCheckoutBody): Promise<StartCheckoutOutcome> {
  const result = await postJson("/api/site/checkout/start", body);
  if (!result) return { status: "error" };
  const { response, json } = result;
  const reference = text(json.reference);

  if (response.ok && reference) {
    if (json.paid === true && text(json.k)) return { status: "paid", reference, k: text(json.k)! };
    const paymentUrl = text(json.paymentUrl);
    // Only ever an http(s) URL — a body is not trusted to choose a scheme.
    if (paymentUrl && /^https?:\/\//.test(paymentUrl)) {
      return { status: "redirect", reference, paymentUrl, holdExpiresAt: text(json.holdExpiresAt) ?? "" };
    }
    if (paymentUrl?.startsWith("/")) {
      return { status: "redirect", reference, paymentUrl, holdExpiresAt: text(json.holdExpiresAt) ?? "" };
    }
    return { status: "error" };
  }

  const reason = text(json.reason);
  if (response.status === 409 || reason === "sold_out") {
    return {
      status: "sold_out",
      available: typeof json.available === "number" ? json.available : undefined,
      sessionId: text(json.sessionId),
    };
  }
  if (reason === "bookings_closed") return { status: "closed" };
  // `not_ready`: a part of the booking machinery is not deployed yet — to the customer, the same as no gateway.
  if (reason === "gateway_disabled" || reason === "not_ready") return { status: "gateway_disabled" };
  if (response.status === 429) return { status: "rate_limited" };
  // 422 `amount_below_minimum`: under Mamo's AED 2 floor — the server's message says so.
  if (response.status === 400 || response.status === 422) return { status: "invalid", message: text(json.message) };
  if (response.status === 502) return { status: "payment_link_failed" };
  return { status: "error" };
}

export type RejectedCodeReason = "invalid" | "expired" | "exhausted" | "min_spend" | "not_applicable" | "one_promo_only";

/** What checkout shows of a server quote: totals in fils, and which codes did not apply and why. */
export interface QuoteView {
  totals: { subtotalFils: number; discountFils: number; grossFils: number; vatFils: number };
  rejectedCodes: Array<{ code: string; reason: RejectedCodeReason }>;
  /** The promo that applied, if any. */
  promo?: { code: string; discountFils: number };
  /** Session credits taken from a pass held by this email. */
  passCredits: number;
}

export type QuoteOutcome =
  | { status: "ok"; quote: QuoteView }
  | { status: "unavailable" }
  | { status: "rate_limited" }
  | { status: "error" };

const REASONS: ReadonlySet<string> = new Set(["invalid", "expired", "exhausted", "min_spend", "not_applicable", "one_promo_only"]);

/**
 * Ask the server what this basket costs with these codes (`POST
 * /api/site/checkout/quote` → `Quote`, SPEC §O). Nothing is reserved; the
 * same pricing runs again, atomically, when Pay is pressed. A route that is
 * not there yet answers `unavailable`, and the code box says codes cannot be
 * checked right now rather than calling a good code wrong.
 */
export async function requestQuote(body: { lines: CheckoutLineInput[]; codes: string[]; email?: string }): Promise<QuoteOutcome> {
  const result = await postJson("/api/site/checkout/quote", body);
  if (!result) return { status: "error" };
  const { response, json } = result;
  if (response.status === 429) return { status: "rate_limited" };
  if (response.status === 404 || response.status === 501 || response.status === 503) return { status: "unavailable" };
  if (!response.ok) return { status: "error" };

  const totals = (json.totals ?? {}) as Json;
  const fils = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0);
  if (typeof totals.grossFils !== "number") return { status: "error" };

  const rejected = Array.isArray(json.rejectedCodes) ? (json.rejectedCodes as Json[]) : [];
  const promo = (json.promo ?? null) as Json | null;
  // Pass credits per line (`lines[].passCredits`) — the quote route does not
  // return pass-purchase ids, so an anonymous quote cannot probe who holds a pass.
  const pricedLines = Array.isArray(json.lines) ? (json.lines as Json[]) : [];
  return {
    status: "ok",
    quote: {
      totals: {
        subtotalFils: fils(totals.subtotalFils),
        discountFils: fils(totals.discountFils),
        grossFils: fils(totals.grossFils),
        vatFils: fils(totals.vatFils),
      },
      rejectedCodes: rejected
        .filter((entry) => typeof entry.code === "string" && REASONS.has(String(entry.reason)))
        .map((entry) => ({ code: String(entry.code), reason: entry.reason as RejectedCodeReason })),
      promo: promo && typeof promo.code === "string" ? { code: promo.code, discountFils: fils(promo.discountFils) } : undefined,
      passCredits: pricedLines.reduce((sum, entry) => sum + fils(entry.passCredits), 0),
    },
  };
}
