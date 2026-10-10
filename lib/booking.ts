import { createLocalReq, type PayloadRequest, type Where } from "payload";

import type { OrderView, OrderViewTicket } from "@/components/booking/orderView";
import { applyReturnTransaction } from "@/cms/lib/mamo/orderView";
import { verifyReturnK } from "@/cms/lib/mamo/returnToken";
import { signPdf } from "@/cms/lib/pdf/links";
import { isProduction } from "@/cms/lib/publicUrl";
import { REFERENCE_PATTERN } from "@/cms/lib/reference";
import { makeSignedToken, parseSignedToken, sign, verifySig } from "@/cms/lib/signing";
import { TAGS } from "@/lib/cms/cache";
import { hrefOf } from "@/lib/cms/mappers";
import { getCms } from "@/lib/cms/payload";
import { contentReader, getGlobal } from "@/lib/cms/query";
import { BOOKING_REQUEST_TERMS, BOOKING_TERMS } from "@/lib/constants";
import type { Customer, Order } from "@/payload-types";

/**
 * ==========================================================================
 * lib/booking.ts — the server side of the booking journey (SPEC §H.3, §H.10)
 * ==========================================================================
 *
 * This file used to be the demo store: a reservation minted in the browser
 * (MP-D…), kept in localStorage, labelled a "preview booking" everywhere it
 * appeared. That store is gone. A booking is now an `orders` document,
 * created by `startCheckout` (cms/lib/orders.ts, through
 * `POST /api/site/checkout/start`) and paid on Mamo Pay's hosted page — or
 * the mock one at /dev/mamo-mock outside production when no key is set.
 *
 * SERVER ONLY. Everything here reads the Local API, the signing keys or the
 * request cookies, so it is imported by server components and route
 * handlers alone. Client components import TYPES from it at most (erased at
 * build); the browser half of the journey — the basket, the basketId, the
 * fetch to the checkout routes — is lib/cart.ts.
 *
 * WHAT LIVES HERE
 *
 *   gate ........ `getBookingGate`: is the site taking bookings right now
 *                 (`booking-settings.bookingsOpen`), and what every booking
 *                 surface says while it is not (`closedMessage` + Contact).
 *   checkout .... `getCheckoutSettings` (terms box, hold, the line under
 *                 Pay) and `getCheckoutCatalogue` (slug → CMS id, because
 *                 the basket remembers slugs and `startCheckout` takes ids).
 *   return ...... `verifyReturnKey` for `/payment-success?ref&k`, and
 *                 `applyReturnSnapshot` — the "Mamo appended transactionId"
 *                 fast path of SPEC §H.5.
 *   views ....... `orderViewOf` — an order as a customer may see it.
 *   guest access  magic-link tokens, the `mp_session` cookie, and the
 *                 customer's orders for /my-bookings (SPEC §H.10).
 *   downloads ... `signedPdfPath` — signed ticket and invoice links for the
 *                 customer's own pages (3C's `signPdf`, verified by the
 *                 download routes).
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* The gate                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export interface BookingGate {
  /** `booking-settings.bookingsOpen`. False when the CMS cannot be read: no booking without a backend. */
  open: boolean;
  /** What every Book surface shows while closed. */
  closed: { message: string; ctaLabel: string; ctaHref: string };
  /** The one "what a booking is" sentence. */
  terms: string;
  /** Status wording for the four states the admin words (confirmation, lookup, my-bookings). */
  statusCopy: Partial<Record<"confirmed" | "pending" | "completed" | "cancelled", { label?: string; note?: string }>>;
  /** Pass-only purchase note. */
  purchaseConfirmedNote: string;
  /** "MP-" — the start of every reference, for the lookup's hint. */
  referencePrefix: string;
}

const CLOSED_DEFAULTS = { message: "Online bookings open soon.", ctaLabel: "Enquire", ctaHref: "/contact" } as const;

type LinkLike = Parameters<typeof hrefOf>[0];

/**
 * The admin's "what a booking is" sentence — unless it is one of the two
 * demo-era sentences ("…saved only in this browser…"). Those described the
 * localStorage store this phase deleted, and the Phase 2 seed wrote one into
 * the field on databases seeded before launch. Printed under Pay they would
 * be false, so they fall back to the paid sentence (SPEC §F.6: the seed for
 * real bookings). Any sentence the owner writes is printed as written.
 */
function currentTerms(stored: unknown): string {
  const text = typeof stored === "string" ? stored.trim() : "";
  const demoEra: readonly string[] = [BOOKING_REQUEST_TERMS.withChannel, BOOKING_REQUEST_TERMS.withoutChannel];
  return text && !demoEra.includes(text) ? text : BOOKING_TERMS.paid;
}

/**
 * The booking switch and its wording, cached under `global:booking-settings`
 * — the tag the global's afterChange purges, so flipping "Bookings open" in
 * the admin reaches every prerendered booking page without a deploy.
 */
export async function getBookingGate(): Promise<BookingGate> {
  const settings = await getGlobal("booking-settings", 1);
  const copy = (value: unknown, fallback: string) => (typeof value === "string" && value.trim() ? value.trim() : fallback);
  return {
    open: settings?.bookingsOpen === true,
    closed: {
      message: copy(settings?.closedMessage, CLOSED_DEFAULTS.message),
      ctaLabel: copy(settings?.closedCtaLabel, CLOSED_DEFAULTS.ctaLabel),
      ctaHref: settings?.closedCtaLink ? hrefOf(settings.closedCtaLink as LinkLike, CLOSED_DEFAULTS.ctaHref) : CLOSED_DEFAULTS.ctaHref,
    },
    terms: currentTerms(settings?.bookingTerms),
    statusCopy: (settings?.statusCopy ?? {}) as BookingGate["statusCopy"],
    purchaseConfirmedNote: copy(settings?.purchaseConfirmedNote, "Your purchase is confirmed."),
    referencePrefix: copy(settings?.referencePrefix, "MP-"),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Checkout                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export interface ConsentPolicy {
  /** The policy's slug — what `StartCheckoutInput.consents[].policy` carries. */
  policy: string;
  version: number;
  title: string;
  href: string;
}

export interface CheckoutSettings {
  /** `payment-settings.checkout.requireTerms`: show the "I have read and agree" box. */
  requireTerms: boolean;
  /** Policies flagged "Require agreement at checkout", with the version agreed to. */
  consents: ConsentPolicy[];
  /** The line under the Pay button ("You will be taken to Mamo Pay…"). */
  captureNote: string;
  holdMinutes: number;
}

/**
 * The wording-only part of `payment-settings` (an admin-only global: read
 * here with the Local API's default override, and narrowed with `select` so
 * no key, sealed or not, is ever loaded into this render) plus the consent
 * policies. Not cached: checkout is a dynamic route and the terms version a
 * customer agrees to must be the one published at that moment.
 */
export async function getCheckoutSettings(): Promise<CheckoutSettings> {
  const fallback: CheckoutSettings = {
    requireTerms: true,
    consents: [],
    captureNote: "You will be taken to Mamo Pay to complete payment securely.",
    holdMinutes: 15,
  };
  try {
    const payload = await getCms();
    const payment = (await payload.findGlobal({ slug: "payment-settings", depth: 0, select: { checkout: true } })) as {
      checkout?: { requireTerms?: boolean | null; captureNote?: string | null; holdMinutes?: number | null };
    };
    const checkout = payment?.checkout ?? {};
    const requireTerms = checkout.requireTerms !== false;
    const policies = requireTerms
      ? await payload.find({
          collection: "policies",
          where: { and: [{ requiresCheckoutConsent: { equals: true } }, { _status: { equals: "published" } }] },
          depth: 0,
          pagination: false,
          select: { slug: true, title: true, navLabel: true, version: true },
        })
      : { docs: [] };
    return {
      requireTerms,
      captureNote: checkout.captureNote?.trim() || fallback.captureNote,
      holdMinutes: typeof checkout.holdMinutes === "number" ? checkout.holdMinutes : fallback.holdMinutes,
      consents: policies.docs
        .filter((doc) => typeof doc.slug === "string" && doc.slug)
        .map((doc) => ({
          policy: doc.slug as string,
          version: typeof doc.version === "number" && doc.version > 0 ? doc.version : 1,
          title: (doc.navLabel || doc.title || doc.slug) as string,
          href: `/policies/${doc.slug}`,
        })),
    };
  } catch {
    return fallback;
  }
}

export interface CheckoutCatalogue {
  /** Session slug → CMS id, for every published session that has not started. */
  sessions: Record<string, string>;
  /** Pass slug → CMS id, for every published pass with a price. */
  passes: Record<string, string>;
}

/**
 * Slugs → ids for what can be bought right now.
 *
 * THE BASKET REMEMBERS SLUGS, `startCheckout` TAKES IDS. A basket line is a
 * snapshot made on the event or loyalty page (lib/cart.ts) and the URL-facing
 * slug is what those pages know; `QuoteLineInput.id` is the document id. New
 * lines carry the id from the booking step, so this map is the fallback for
 * a basket filled before that — and it doubles as the "is this still on
 * sale" check: a slug missing here is a line the server would refuse.
 */
export async function getCheckoutCatalogue(): Promise<CheckoutCatalogue> {
  try {
    const payload = await getCms();
    const [sessions, passes] = await Promise.all([
      payload.find({
        collection: "sessions",
        where: { and: [{ _status: { equals: "published" } }, { startsAt: { greater_than: new Date().toISOString() } }] },
        depth: 0,
        pagination: false,
        select: { slug: true },
      }),
      payload.find({
        collection: "passes",
        where: { and: [{ _status: { equals: "published" } }, { priceFils: { exists: true } }] },
        depth: 0,
        pagination: false,
        select: { slug: true },
      }),
    ]);
    const map = (docs: Array<{ id: string; slug?: string | null }>) =>
      Object.fromEntries(docs.filter((doc) => doc.slug).map((doc) => [doc.slug as string, doc.id]));
    return { sessions: map(sessions.docs), passes: map(passes.docs) };
  } catch {
    return { sessions: {}, passes: {} };
  }
}

export interface SessionBookingRef {
  id: string;
  /** The editor's switch: `closed` is "no more bookings for this date", whatever the seats say. */
  bookingStatus: "open" | "waitlist" | "closed";
}

const readSessionRef = contentReader("booking:session-ref", [TAGS.sessions], async (draft, slug: string) => {
  const payload = await getCms();
  const result = await payload.find({
    collection: "sessions",
    where: draft ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
    depth: 0,
    limit: 1,
    draft,
    overrideAccess: draft,
    select: { bookingStatus: true },
  });
  const doc = result.docs[0];
  if (!doc) return null;
  const status = doc.bookingStatus;
  return { id: doc.id, bookingStatus: status === "waitlist" || status === "closed" ? status : "open" } satisfies SessionBookingRef;
});

/** The id and booking switch for a session slug (book page, waitlist route). */
export async function getSessionBookingRef(slug: string): Promise<SessionBookingRef | null> {
  return (await readSessionRef(slug)) ?? null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The payment return                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * `k` on `/payment-success?ref&k` (SPEC §H.3 step 5):
 * `k = <exp>.<b64url(hmac("return-v1", "<ref>|<exp>"))>`, unix seconds, 24 h.
 * Minted by `startCheckout` and by the reference + email lookup; checked
 * with its expiry, constant-time, by 3B's `verifyReturnK` — one verifier for
 * the page and the status route, so they can never disagree about a key.
 */
export function verifyReturnKey(reference: string, k: string | null | undefined): boolean {
  return verifyReturnK(reference, k);
}

/** A Local API request for calling the cross-agent contracts outside an HTTP handler. */
export async function localRequest(context: Record<string, unknown> = {}): Promise<PayloadRequest> {
  const payload = await getCms();
  return createLocalReq({ context }, payload);
}

/**
 * The return page's fast path (SPEC §H.5, "Return page"): the customer is
 * back from the hosted page before the webhook, and Mamo appended the
 * payment id. 3B's `applyReturnTransaction` asks the gateway for that
 * payment in the order's own mode and applies Mamo's answer exactly as the
 * webhook would (`applyPaymentSnapshot` — idempotent, refuses a payment
 * whose link is not this order's current one), throttled per order. The id
 * on the URL is only a pointer; nothing is trusted from the redirect itself.
 *
 * Never throws: a gateway that is down or a contract not landed leaves the
 * order to the webhook and the poller, and the page polls the status.
 */
export async function applyReturnSnapshot(order: Order, transactionId: string | null | undefined): Promise<void> {
  if (!transactionId) return;
  try {
    await applyReturnTransaction(await localRequest(), order, transactionId);
  } catch {
    // The page keeps polling; the webhook and reconcile-payments are the backstop.
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Orders as a customer sees them                                             */
/* ────────────────────────────────────────────────────────────────────────── */

/** "mp-4k7xy2", "MP 4K7XY2" → "MP-4K7XY2" — a reference typed by hand off an email. */
export function normaliseReference(input: string): string {
  const compact = input.replace(/[\s-]/g, "").toUpperCase();
  const match = /^([A-Z]{2,4})([ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6})$/.exec(compact);
  return match ? `${match[1]}-${match[2]}` : compact;
}

/** One order by reference, with its lines' sessions, payment and invoice populated. */
export async function findOrderByReference(reference: string): Promise<Order | null> {
  const wanted = normaliseReference(reference);
  // Junk never reaches a query (cms/lib/reference.ts).
  if (!REFERENCE_PATTERN.test(wanted)) return null;
  try {
    const payload = await getCms();
    const result = await payload.find({ collection: "orders", where: { reference: { equals: wanted } }, depth: 1, limit: 1 });
    return (result.docs[0] as Order | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * An order → `OrderView` (components/booking/orderView.ts). `detail: false`
 * is the reference, state and hold only; `detail: true` reads the tickets
 * and signs their download links. Exported for 3B's status and lookup
 * routes, so every customer surface renders the same shape.
 */
export async function orderViewOf(order: Order, { detail }: { detail: boolean }): Promise<OrderView> {
  const view: OrderView = { reference: order.reference, status: order.status, holdExpiresAt: order.hold?.expiresAt ?? null };
  if (!detail) return view;

  let tickets: OrderViewTicket[] = [];
  try {
    const payload = await getCms();
    const result = await payload.find({
      collection: "tickets",
      where: { order: { equals: order.id } },
      depth: 1,
      pagination: false,
      sort: "seatNo",
      select: { code: true, status: true, seatNo: true, holderName: true, session: true },
    });
    tickets = result.docs.map((ticket) => ({
      code: ticket.code,
      status: ticket.status,
      seatNo: ticket.seatNo,
      holderName: ticket.holderName ?? undefined,
      sessionTitle: typeof ticket.session === "object" && ticket.session ? (ticket.session.title ?? undefined) : undefined,
      pdfUrl: signedPdfPath("ticket", ticket.code),
    }));
  } catch {
    // No tickets yet (or the table is not there): the card says they are on their way.
  }

  const payment = typeof order.payment === "object" ? order.payment : null;
  const invoice = typeof order.invoice === "object" ? order.invoice : null;
  const paid = ["confirming", "confirmed", "completed", "refunded"].includes(order.status) || order.totals.grossFils === 0;

  view.detail = {
    createdAt: order.createdAt,
    guest: { firstName: order.contact.firstName, lastName: order.contact.lastName, email: order.contact.email ?? undefined },
    lines: (order.lines ?? []).map((line) => {
      const session = typeof line.session === "object" ? line.session : null;
      return {
        kind: line.kind,
        title: line.title,
        category: line.category ?? undefined,
        startsAt: line.startsAt ?? undefined,
        durationMinutes: line.durationMinutes ?? undefined,
        venueName: line.venueName ?? undefined,
        href: line.kind === "session" ? (session?.slug ? `/events/${session.slug}` : undefined) : "/loyalty",
        qty: line.qty,
        lineFils: line.lineFils,
      };
    }),
    totals: {
      subtotalFils: order.totals.subtotalFils,
      discountFils: order.totals.discountFils,
      grossFils: order.totals.grossFils,
      vatFils: order.totals.vatFils,
      currency: order.totals.currency || "AED",
    },
    paid,
    tickets,
    invoice: invoice?.number ? { number: invoice.number, pdfUrl: signedPdfPath("invoice", invoice.id) } : null,
    // Mamo's customer-facing decline text, only while the attempt is the failed one.
    failureMessage: order.status === "failed" ? (payment?.failureMessage ?? null) : null,
  };
  return view;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Signed downloads                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/** Seven days: long enough to open from the page at the venue; every page view mints fresh ones. */
export const PDF_LINK_TTL_S = 7 * 24 * 60 * 60;

/**
 * `/api/site/tickets/{code}/pdf?exp&sig` and `/api/site/invoices/{id}/pdf?exp&sig`
 * — site-relative, signed by 3C's `signPdf` (cms/lib/pdf/links.ts), which
 * the two download routes verify. Relative so the page works on whichever
 * origin served it.
 */
export function signedPdfPath(kind: "ticket" | "invoice", id: string, ttlSeconds = PDF_LINK_TTL_S): string {
  const { exp, sig } = signPdf(kind, id, { ttlSeconds });
  const base = kind === "ticket" ? `/api/site/tickets/${encodeURIComponent(id)}/pdf` : `/api/site/invoices/${encodeURIComponent(id)}/pdf`;
  return `${base}?exp=${exp}&sig=${sig}`;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Guest access — magic links and the session cookie (SPEC §H.10)            */
/* ────────────────────────────────────────────────────────────────────────── */

export const MAGIC_LINK_TTL_S = 30 * 60;
export const SESSION_TTL_S = 30 * 24 * 60 * 60;

/**
 * `__Host-` in production: the browser then refuses the cookie unless it is
 * Secure, Path=/ and host-only, so no subdomain can plant or read it. Plain
 * `mp_session` without Secure only outside production, where the dev origin
 * is http.
 */
export const SESSION_COOKIE = isProduction() ? "__Host-mp_session" : "mp_session";

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_S,
});

/**
 * The emailed token: `b64url("<customerId>.<issuedAtMs>").<exp>.<hmac>` under
 * `magic-link-v1`, 30 minutes. `issuedAtMs` is also written to
 * `customers.lastMagicLinkIssuedAt`; consumption requires the two to match
 * and then clears the stamp — so a link works once, and only the newest one
 * sent works at all.
 */
export function mintMagicLinkToken(customerId: string, issuedAtMs: number): string {
  const inner = Buffer.from(`${customerId}.${issuedAtMs}`, "utf8").toString("base64url");
  return makeSignedToken("magic-link-v1", inner, MAGIC_LINK_TTL_S);
}

export function readMagicLinkToken(token: string): { customerId: string; issuedAtMs: number } | null {
  if (typeof token !== "string" || token.length > 512) return null;
  const parsed = parseSignedToken("magic-link-v1", token);
  if (!parsed) return null;
  const [customerId, issued] = Buffer.from(parsed.payload, "base64url").toString("utf8").split(".");
  const issuedAtMs = Number(issued);
  if (!customerId || !Number.isSafeInteger(issuedAtMs)) return null;
  return { customerId, issuedAtMs };
}

/** `<customerId>.<exp>.<sessionVersion>.<hmac>` under `session-v1`. */
export function mintSessionValue(customerId: string, sessionVersion: number): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  const body = `${customerId}.${exp}.${sessionVersion}`;
  return `${body}.${sign("session-v1", body)}`;
}

function readSessionValue(value: string | undefined): { customerId: string; sessionVersion: number } | null {
  if (!value || value.length > 256) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [customerId, expRaw, versionRaw, sig] = parts;
  const exp = Number(expRaw);
  const sessionVersion = Number(versionRaw);
  if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000) || !Number.isInteger(sessionVersion)) return null;
  if (!verifySig("session-v1", `${customerId}.${expRaw}.${versionRaw}`, sig)) return null;
  return { customerId, sessionVersion };
}

/**
 * The signed-in customer, or null. Every read re-checks `sessionVersion`
 * against the customer row, so the admin's "Sign out everywhere" (which
 * bumps it) ends every outstanding cookie at once.
 */
export async function customerFromSession(value: string | undefined): Promise<Customer | null> {
  const session = readSessionValue(value);
  if (!session) return null;
  try {
    const payload = await getCms();
    const customer = (await payload.findByID({
      collection: "customers",
      id: session.customerId,
      depth: 0,
      disableErrors: true,
    })) as Customer | null;
    if (!customer || (customer.sessionVersion ?? 0) !== session.sessionVersion) return null;
    return customer;
  } catch {
    return null;
  }
}

/** States a customer would not recognise as a booking: an abandoned basket, a lapsed hold. */
const HIDDEN_FROM_GUESTS: Order["status"][] = ["pending_payment", "expired"];

/** The customer's orders, newest first, as full views (they are signed in). */
export async function ordersForCustomer(customer: Customer): Promise<OrderView[]> {
  const payload = await getCms();
  const mine: Where = { or: [{ customer: { equals: customer.id } }, { "contact.email": { equals: customer.email.toLowerCase() } }] };
  const result = await payload.find({
    collection: "orders",
    where: { and: [mine, { status: { not_in: HIDDEN_FROM_GUESTS } }] },
    depth: 1,
    limit: 50,
    sort: "-createdAt",
  });
  return Promise.all((result.docs as Order[]).map((order) => orderViewOf(order, { detail: true })));
}
