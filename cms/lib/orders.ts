import { createHash } from "node:crypto";

import { sql } from "@payloadcms/db-postgres/drizzle";
import { APIError, type PayloadRequest } from "payload";

import type { Customer, Experience, Order, PassPurchase, Payment, Refund, Session, Ticket, Venue } from "@/payload-types";

import {
  getPaymentGateway,
  issueTickets,
  notifyStaff,
  publicUrl,
  safeRevalidate,
  sendTemplated,
  signedTicketPdfUrl,
  type Contact,
  type MamoPayment,
  type Mode,
  type OrderStatus,
  type PaymentGateway,
  type StartCheckoutInput,
  type StartCheckoutResult,
  type TemplateKey,
} from "./contracts";
import { acquireSeats, bestEffort, consumeSeats, queueJob, refundSeats, releaseSeats, runSql, SoldOut, withContext, withTransaction } from "./inventory";
import { issueCreditNote } from "./invoiceNumber";
import { gatewayForMode } from "./mamo";
import { createPaymentLink } from "./mamo/links";
import { parseMamoDate } from "./mamo/refunds";
import { mintReturnK } from "./mamo/returnToken";
import { formatAed, fromMamoAmount, MIN_REFUND_FILS } from "./money";
import { adminUrl } from "./notifyStaff";
import { appendTimeline, timelineEntry, timelineOf, transition } from "./orderState";
import { allocate, assertPayable, quote, reservePassSql, reservePromoSql, restorePassSql, restoreReservations } from "./pricing";
import { DEFAULT_REFERENCE_PREFIX, mintReference } from "./reference";
import { REPEAT_MAX, repeatDates } from "./sessionSeries";
import { cancelWaitlistFor, validWaitlistTokenFor } from "./waitlist";
import {
  customerOrderVars,
  mergeVars,
  orderCancelledVars,
  orderMovedVars,
  orderRefundedVars,
  postExpiryVars,
  refundAlertVars,
  sessionCancelledVars,
  sessionRescheduledVars,
  staffOrderVars,
} from "@/cms/email/callerVars";
import { sessionSlugFor } from "@/cms/hooks/sessionSlug";

/**
 * ==========================================================================
 * Orders — checkout, payment snapshots, refunds and the session operations
 * ==========================================================================
 *
 * The flows of SPEC §H.3, §H.5 step 7, §H.6 and §H.7, built on three
 * smaller modules: `inventory` (seats, as SQL), `pricing` (amounts, with
 * atomic credit and promo reservation) and `orderState` (the only door to
 * `orders.status`). Two rules shape every function here:
 *
 *   · THE DATABASE WORK IS ONE TRANSACTION. Seats, credits, promo uses, the
 *     order, its payment row and its timeline are written together or not
 *     at all (`withTransaction`, which joins a caller's transaction when
 *     there is one). A sold-out session halfway through a basket rolls back
 *     the seats already taken AND the pass credits spent on them.
 *   · SIDE EFFECTS COME AFTER THE COMMIT. Emails, staff alerts and Mamo
 *     calls that are not needed to decide the outcome run once the
 *     transaction has committed, each through `bestEffort`: a mail server
 *     that is down must not undo a refund, and a failed SQL statement inside
 *     a Postgres transaction would poison everything after it. Jobs that
 *     must happen with the change (finalize-order, process-refund,
 *     waitlist-notify) are QUEUED inside the transaction — the job row
 *     commits with the work or not at all.
 *
 * Mamo is reached only through `getPaymentGateway` (3B, via contracts), so
 * everything here runs identically against the mock gateway (no key set,
 * development) and the real one (keys entered in Settings → Payments).
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Small helpers                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/** A refusal the route handlers turn into `{ reason }` with the given HTTP status. */
export class CheckoutError extends APIError {
  constructor(
    public reason: string,
    message: string,
    status = 409,
    public extra: Record<string, unknown> = {},
  ) {
    super(message, status, { reason, ...extra }, true);
    this.name = "CheckoutError";
  }
}

const idOf = (value: unknown): string | undefined =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : undefined;

const lower = (email?: string | null) => (email ? email.trim().toLowerCase() : undefined);

const isGateway = (g: PaymentGateway | { isConfigured: false; reason: string }): g is PaymentGateway => g.isConfigured === true;

const HOLD_MINUTES_FALLBACK = 10;

/** A deterministic refund `idempotencyKey` (≤ 64 chars): the same action on the same rows can only ever make one refund. */
const refundKey = (kind: string, ...parts: string[]) => `${kind}:${createHash("sha256").update(parts.join("|")).digest("base64url").slice(0, 43)}`;

/**
 * The gateway an EXISTING order must be talked to through: the mode it was
 * created in, whatever Settings says today — a mock or sandbox link is never
 * sent to the live API after a mode switch (3B's `gatewayForMode`).
 */
async function gatewayOf(req: PayloadRequest, mode: Mode): Promise<PaymentGateway | null> {
  const g = await gatewayForMode(req, mode).catch(() => null);
  return g && isGateway(g) ? g : null;
}
const PAID_STATES: readonly OrderStatus[] = ["confirming", "confirmed", "completed"];
/** Payment-row states that mean "this attempt took the money" (refunds included). */
const CAPTURED_LIKE: readonly string[] = ["captured", "refund_pending", "partially_refunded", "refunded"];

/** `k` for the return page (SPEC §H.3 step 5) — one implementation, 3B's, so mint and verify never drift. */
export { mintReturnK };

type Settings = Record<string, unknown>;
async function settings(req: PayloadRequest, slug: "booking-settings" | "payment-settings"): Promise<Settings> {
  return ((await req.payload.findGlobal({ slug, depth: 0, overrideAccess: true, req }).catch(() => null)) ?? {}) as Settings;
}

/** Seats per session across the basket's lines: `{ sessionId: qty }`. */
export function seatsBySession(lines: Array<{ kind: string; session?: unknown; qty: number }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of lines) {
    const id = line.kind === "session" ? idOf(line.session) : undefined;
    if (id) out[id] = (out[id] ?? 0) + line.qty;
  }
  return out;
}

async function loadOrder(req: PayloadRequest, orderId: string, depth = 0): Promise<Order> {
  return (await req.payload.findByID({ collection: "orders", id: orderId, depth, overrideAccess: true, req })) as Order;
}

const lockOrder = (req: PayloadRequest, orderId: string) => runSql(req, sql`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`);

async function updateOrder(req: PayloadRequest, orderId: string, data: Record<string, unknown>): Promise<Order> {
  return (await withContext(req, { system: true }, (context) =>
    req.payload.update({ collection: "orders", id: orderId, data, depth: 0, overrideAccess: true, context, req }),
  )) as Order;
}

async function updateDoc(req: PayloadRequest, collection: "payments" | "refunds" | "tickets" | "seat-holds" | "pass-purchases" | "customers", id: string, data: Record<string, unknown>) {
  return withContext(req, { system: true }, (context) => req.payload.update({ collection, id, data, depth: 0, overrideAccess: true, context, req }));
}

async function createDoc<T>(req: PayloadRequest, collection: "payments" | "refunds" | "seat-holds" | "customers" | "orders", data: Record<string, unknown>): Promise<T> {
  return (await withContext(req, { system: true }, (context) =>
    req.payload.create({ collection, data: data as never, depth: 0, overrideAccess: true, context, req }),
  )) as T;
}

/** Signed link (3C, 30 days) to the order's tickets through its first live ticket; none when it has no tickets. */
async function ticketsUrl(req: PayloadRequest, orderId: string): Promise<string | undefined> {
  const first = await req.payload.find({
    collection: "tickets",
    where: { and: [{ order: { equals: orderId } }, { status: { in: ["valid", "checked_in"] } }] },
    sort: "seatNo",
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
    select: { code: true },
  });
  const code = (first.docs[0] as { code?: string } | undefined)?.code;
  return code ? signedTicketPdfUrl(req, code, { scope: "order" }) : undefined;
}

/**
 * Customer-facing variables shared by every order email, under the names
 * cms/email/variables.ts documents (built by cms/email/callerVars.ts, which
 * the template test renders from). `extra` is merged one level deep, so a
 * caller's `{ refund: { amount } }` adds to the defaults rather than
 * replacing them.
 */
export async function orderVars(req: PayloadRequest, order: Order, extra: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const base = await publicUrl(req);
  const k = mintReturnK(order.reference);
  const vars = customerOrderVars(order, {
    statusUrl: `${base}/payment-success?ref=${encodeURIComponent(order.reference)}&k=${encodeURIComponent(k)}`,
    retryUrl: `${base}/checkout?ref=${encodeURIComponent(order.reference)}&payment=failed`,
    myBookingsUrl: `${base}/my-bookings`,
    ticketsUrl: await ticketsUrl(req, order.id),
  });
  return mergeVars(vars, extra);
}

/**
 * Sends a customer email about an order, after the commit, never throwing.
 * `refs.refund` ties the log row to a refund — the mailer attaches THAT
 * refund's credit note instead of the order's Tax Invoice.
 */
async function emailCustomer(req: PayloadRequest, orderId: string, key: TemplateKey, extra: Record<string, unknown> = {}, refs: { refund?: string } = {}): Promise<void> {
  await bestEffort(req, `${key} email`, async () => {
    const order = await loadOrder(req, orderId);
    if (!order.contact.email) return;
    await sendTemplated(req, { key, to: order.contact.email, vars: await orderVars(req, order, extra), refs: { order: order.id, ...(refs.refund ? { refund: refs.refund } : {}) } });
  });
}

/** A staff alert about an order: booking, customer, total, summary and the admin link, plus what the event adds. Never throws. */
async function alertStaff(req: PayloadRequest, event: "failed_payment" | "refund", order: Order, extra: Record<string, unknown>, refs: { refund?: string } = {}): Promise<void> {
  await bestEffort(req, `${event} staff alert`, async () =>
    notifyStaff(req, event, mergeVars(staffOrderVars(order, await adminUrl(req, "orders", order.id)), extra), { order: order.id, ...(refs.refund ? { refund: refs.refund } : {}) }),
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* §H.3 startCheckout                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/** Same basket = same lines (kind, id, qty) and same codes, regardless of order. */
function basketKey(lines: Array<{ kind: string; id?: string; qty: number }>, codes: string[]): string {
  const l = lines.map((x) => `${x.kind}:${x.id}:${x.qty}`).sort();
  const c = codes.map((x) => x.trim().toUpperCase()).filter(Boolean).sort();
  return JSON.stringify([l, c]);
}

async function upsertCustomer(req: PayloadRequest, details: Contact, email: string): Promise<Customer> {
  const found = await req.payload.find({ collection: "customers", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true, req });
  const patch: Record<string, unknown> = {
    firstName: details.firstName.slice(0, 60),
    lastName: details.lastName.slice(0, 60),
    lastOrderAt: new Date().toISOString(),
    ...(details.phone ? { phone: details.phone.slice(0, 32) } : {}),
    // A tick is consent; an untick at a later checkout is not a withdrawal (that is the unsubscribe link's job).
    ...(details.marketingOptIn ? { marketingOptIn: true } : {}),
  };
  if (found.docs[0]) return (await updateDoc(req, "customers", found.docs[0].id, patch)) as Customer;
  return createDoc<Customer>(req, "customers", { email, ...patch, sessionVersion: 1 });
}

async function uniqueReference(req: PayloadRequest, prefix: string): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const reference = mintReference(prefix);
    const taken = await req.payload.count({ collection: "orders", where: { reference: { equals: reference } }, overrideAccess: true, req });
    if (taken.totalDocs === 0) return reference;
  }
  throw new Error("could not mint a free booking reference");
}

/** Creates the Mamo link for an order and records the attempt; the order moves to `awaiting_payment`. */
async function issuePaymentLink(req: PayloadRequest, gateway: PaymentGateway, order: Order): Promise<{ paymentUrl: string }> {
  // 3B's builder owns the Mamo body rules (title ≤ 50 chars, AED 2 minimum,
  // inline-needs-names fallback, `k` on both return URLs — research 02 §B5).
  const { link } = await createPaymentLink(req, gateway, order);
  const row = await createDoc<Payment>(req, "payments", {
    order: order.id,
    provider: "mamo",
    status: "link_ready",
    amountFils: order.totals.grossFils,
    currency: "AED",
    providerLinkId: link.id,
    providerLinkUrl: link.payment_url,
    mode: gateway.mode,
  });
  await updateOrder(req, order.id, { payment: row.id });
  if (order.status !== "awaiting_payment") await transition(req, order, "awaiting_payment", { refs: { payment: row.id } });
  return { paymentUrl: link.payment_url };
}

/** Deactivates the current attempt's link (best effort — an expired or already-used link is fine). */
async function retireCurrentLink(req: PayloadRequest, gateway: PaymentGateway | null, order: Order, status: "expired" | "failed" = "expired"): Promise<void> {
  const paymentId = idOf(order.payment);
  if (!paymentId) return;
  const payment = (await req.payload.findByID({ collection: "payments", id: paymentId, depth: 0, overrideAccess: true, disableErrors: true, req })) as Payment | null;
  if (!payment || payment.provider !== "mamo" || payment.status === "captured" || payment.linkDeactivatedAt) return;
  if (gateway && payment.providerLinkId) await bestEffort(req, "deactivate Mamo link", () => gateway.deactivateLink(payment.providerLinkId as string));
  await updateDoc(req, "payments", payment.id, { status: payment.status === "link_ready" || payment.status === "created" ? status : payment.status, linkDeactivatedAt: new Date().toISOString() });
}

/**
 * §H.3 steps 1–5 (route-level zod validation and rate limiting are the
 * caller's). Online and desk share this path; the desk differs only in
 * skipping the hold (seats go straight to sold) and recording a desk
 * payment instead of creating a link.
 */
export async function startCheckout(req: PayloadRequest, input: StartCheckoutInput): Promise<StartCheckoutResult> {
  const online = input.channel === "online";
  const email = lower(input.details.email);
  if (online && !email) throw new CheckoutError("email_required", "An email address is needed for an online booking.", 400);

  const [booking, paymentSettings] = await Promise.all([settings(req, "booking-settings"), settings(req, "payment-settings")]);
  if (online && booking.bookingsOpen !== true) throw new CheckoutError("bookings_closed", String(booking.closedMessage ?? "Online bookings are closed."), 503);

  let gateway: PaymentGateway | null = null;
  if (online) {
    const g = await getPaymentGateway(req);
    if (!isGateway(g)) throw new CheckoutError("gateway_disabled", "Online payment is not available right now.", 503, { detail: g.reason });
    gateway = g;
  }
  const mode: Mode = gateway?.mode ?? ((paymentSettings.mode as Mode | undefined) ?? "test");

  // Basket reuse: a double-submit of the same basket re-uses the open order instead of holding seats twice.
  if (online && gateway && email && input.basketId) {
    const reused = await reuseOpenOrder(req, gateway, input, email);
    if (reused) return reused;
  }

  const holdMinutesRaw = Number((paymentSettings.checkout as { holdMinutes?: unknown } | undefined)?.holdMinutes);
  const holdMinutes = Number.isInteger(holdMinutesRaw) && holdMinutesRaw >= 5 && holdMinutesRaw <= 60 ? holdMinutesRaw : HOLD_MINUTES_FALLBACK;
  const prefix = typeof booking.referencePrefix === "string" && booking.referencePrefix ? booking.referencePrefix : DEFAULT_REFERENCE_PREFIX;

  // ── one transaction: customer, prices + reservations, order, seats, holds ──
  const created = await withTransaction(req, async () => {
    const customer = email ? await upsertCustomer(req, input.details, email) : null;
    const priced = await quote(req, { lines: input.lines, email, codes: input.codes, channel: input.channel, desk: input.desk }, { reserve: true });
    assertPayable(priced.totals, input.channel);

    const reference = await uniqueReference(req, prefix);
    const now = new Date();
    const expiresAt = online ? new Date(now.getTime() + holdMinutes * 60_000) : null;
    const bySession = seatsBySession(priced.lines);
    const consents = Object.fromEntries((input.consents ?? []).map((c) => [c.policy, c.version]));
    const deskPayment =
      input.channel === "desk" && input.desk
        ? { method: input.desk.method, amountFils: priced.totals.grossFils, note: input.desk.note?.slice(0, 200), takenBy: idOf(req.user) ?? null }
        : undefined;

    const order = await withContext(req, { system: true, orderTransition: true }, (context) =>
      req.payload.create({
        collection: "orders",
        data: {
          reference,
          status: "pending_payment",
          channel: input.channel,
          basketId: input.basketId || undefined,
          customer: customer?.id,
          contact: {
            firstName: input.details.firstName.slice(0, 60),
            lastName: input.details.lastName.slice(0, 60),
            email: email ?? null,
            phone: input.details.phone?.slice(0, 32) ?? null,
            marketingOptIn: input.details.marketingOptIn === true,
          },
          lines: priced.lines,
          codes: priced.applied.map((a) => ({ code: a.code, kind: a.kind, purchase: a.purchase, seatsCovered: a.seatsCovered, discountFils: a.discountFils })),
          promo: priced.promo ? { promoCode: priced.promo.promoCode, code: priced.promo.code, discountFils: priced.promo.discountFils } : undefined,
          passRedemptions: priced.passRedemptions,
          totals: priced.totals,
          deskPayment,
          hold: { expiresAt: expiresAt?.toISOString() ?? null, seatsBySession: bySession },
          source: { ipHash: input.source.ipHash.slice(0, 64), userAgent: input.source.userAgent.slice(0, 300), referrer: input.source.referrer?.slice(0, 300) },
          timeline: [
            timelineEntry(req, "created", {
              channel: input.channel,
              ...(priced.rejectedCodes.length ? { rejectedCodes: priced.rejectedCodes } : {}),
              ...(priced.deskAdjustmentFils ? { deskAdjustmentFils: priced.deskAdjustmentFils } : {}),
            }),
          ],
          consentedPolicyVersions: consents,
          mode,
        } as never,
        depth: 0,
        overrideAccess: true,
        context,
        req,
      }),
    ) as Order;

    // Credits spent: the pass purchase records which order used them (restored on expiry).
    for (const r of priced.passRedemptions) {
      const purchase = (await req.payload.findByID({ collection: "pass-purchases", id: r.passPurchase, depth: 0, overrideAccess: true, req })) as PassPurchase;
      const redemptions = (purchase.redemptions ?? []).map(({ forOrder, n, at, restored }) => ({ forOrder: idOf(forOrder), n, at, restored }));
      await updateDoc(req, "pass-purchases", purchase.id, { redemptions: [...redemptions, { forOrder: order.id, n: r.n, at: now.toISOString(), restored: false }] });
    }

    // Seats. Staff may book a waitlist-only session; online needs the offer token for that email.
    for (const [sessionId, qty] of Object.entries(bySession)) {
      const allowWaitlist = !online || (email ? await validWaitlistTokenFor(req, sessionId, email, input.waitlistToken) : false);
      await acquireSeats(req, sessionId, qty, { allowWaitlist });
      if (online) {
        await createDoc(req, "seat-holds", { order: order.id, session: sessionId, qty, status: "held", expiresAt: expiresAt?.toISOString() });
      } else {
        await consumeSeats(req, sessionId, qty);
      }
    }
    return { order, priced };
  });

  const { order, priced } = created;

  // ── paid without a link: desk, or fully covered by credits / a 100 % promo ──
  if (!online || priced.totals.grossFils === 0) {
    await withTransaction(req, async () => {
      if (!online) {
        const method = input.desk?.method ?? "cash";
        const payment = await createDoc<Payment>(req, "payments", {
          order: order.id,
          provider: "desk",
          status: "captured",
          amountFils: priced.totals.grossFils,
          currency: "AED",
          method: { type: method },
          mode,
          capturedAt: new Date().toISOString(),
        });
        await updateOrder(req, order.id, { payment: payment.id });
      } else {
        for (const [sessionId, qty] of Object.entries(seatsBySession(priced.lines))) await consumeSeats(req, sessionId, qty);
        await markHolds(req, order.id, "consumed");
      }
      await transition(req, order, "confirming", { note: online ? "covered by pass credits / promo" : `desk: ${input.desk?.method ?? "cash"}` });
      await queueJob(req, "finalize-order", { orderId: order.id }, { workflow: true });
    });
    return { reference: order.reference, paid: true, k: mintReturnK(order.reference) };
  }

  // ── online: the Mamo link ──
  try {
    const { paymentUrl } = await withTransaction(req, () => issuePaymentLink(req, gateway as PaymentGateway, order));
    return { reference: order.reference, paymentUrl, holdExpiresAt: String(order.hold?.expiresAt ?? "") };
  } catch (error) {
    // Keep the hold: the customer can retry within it (§H.1 failed).
    await bestEffort(req, "mark order failed after link error", () =>
      withTransaction(req, async () => transition(req, order, "failed", { note: `payment link could not be created: ${(error as Error)?.message ?? "error"}`.slice(0, 200) })),
    );
    throw new CheckoutError("gateway_error", "We could not reach the payment provider. Please try again in a moment.", 502, { reference: order.reference });
  }
}

/** An open order for the same basket + email with a live hold gets a fresh link; a changed basket releases it instead. */
async function reuseOpenOrder(req: PayloadRequest, gateway: PaymentGateway, input: StartCheckoutInput, email: string): Promise<StartCheckoutResult | null> {
  const found = await req.payload.find({
    collection: "orders",
    where: {
      and: [
        { basketId: { equals: input.basketId } },
        { "contact.email": { equals: email } },
        { status: { in: ["pending_payment", "awaiting_payment", "failed"] } },
        { "hold.expiresAt": { greater_than: new Date().toISOString() } },
      ],
    },
    sort: "-createdAt",
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const open = found.docs[0] as Order | undefined;
  if (!open) return null;
  if (open.mode !== gateway.mode) {
    // Settings switched gateway since this basket was opened: never reuse a link from the other environment.
    await expireOrder(req, open.id, { force: true, note: "replaced after a payment-mode change" });
    return null;
  }
  const openLines = (open.lines ?? []).map((l) => ({ kind: l.kind, id: idOf(l.kind === "session" ? l.session : l.pass), qty: l.qty }));
  if (basketKey(openLines, (open.codes ?? []).map((c) => c.code)) !== basketKey(input.lines, input.codes)) {
    // The basket changed under the same id: give the old seats and credits back, then price afresh.
    await expireOrder(req, open.id, { force: true, note: "replaced by a changed basket" });
    return null;
  }
  return withTransaction(req, async () => {
    await lockOrder(req, open.id);
    const fresh = await loadOrder(req, open.id);
    await retireCurrentLink(req, gateway, fresh, "expired");
    const { paymentUrl } = await issuePaymentLink(req, gateway, fresh);
    await appendTimeline(req, open.id, "link_reissued", { reason: "same basket submitted again" });
    return { reference: fresh.reference, reused: true as const, paymentUrl, holdExpiresAt: String(fresh.hold?.expiresAt ?? "") };
  });
}

async function markHolds(req: PayloadRequest, orderId: string, status: "consumed" | "released"): Promise<Array<{ session: string; qty: number }>> {
  const holds = await req.payload.find({
    collection: "seat-holds",
    where: { and: [{ order: { equals: orderId } }, { status: { equals: "held" } }] },
    limit: 100,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const out: Array<{ session: string; qty: number }> = [];
  for (const hold of holds.docs) {
    await updateDoc(req, "seat-holds", hold.id, { status });
    out.push({ session: idOf(hold.session) as string, qty: hold.qty });
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* §H.5 step 7 — applyPaymentSnapshot                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/** Copies what Mamo told us onto our payment row (card, settlement, raw); never the status logic. */
function paymentFields(payment: MamoPayment, source: "webhook" | "poller" | "return"): Record<string, unknown> {
  const now = new Date().toISOString();
  const method = payment.payment_method ?? {};
  const type = method.type && /wallet|apple|google/i.test(method.type) ? "wallet" : "card";
  return {
    providerPaymentId: payment.id,
    method: { type, cardLast4: method.card_last4 ?? null, cardOrigin: method.origin ?? null },
    raw: payment as unknown as Record<string, unknown>,
    settlement: {
      amount: payment.settlement_amount ?? null,
      fee: payment.settlement_fee ?? null,
      vat: payment.settlement_vat ?? null,
      currency: payment.amount_currency ?? null,
      date: payment.settlement_date ?? null,
    },
    verifiedAt: now,
    ...(source === "webhook" ? { webhookSeenAt: now } : {}),
  };
}

/** §H.5 step 7 — applies a VERIFIED Mamo payment object to an order inside a locked transaction; refuses mode/link mismatches. */
export async function applyPaymentSnapshot(
  req: PayloadRequest,
  orderIn: Order,
  payment: MamoPayment,
  ctx: { source: "webhook" | "poller" | "return"; mode: Mode; eventId?: string },
): Promise<{ applied: boolean; reason?: string }> {
  const after: Array<() => Promise<unknown>> = [];
  const result = await withTransaction(req, async (): Promise<{ applied: boolean; reason?: string }> => {
    await lockOrder(req, orderIn.id);
    const order = await loadOrder(req, orderIn.id);
    const currentId = idOf(order.payment);
    const current = currentId
      ? ((await req.payload.findByID({ collection: "payments", id: currentId, depth: 0, overrideAccess: true, disableErrors: true, req })) as Payment | null)
      : null;

    // First line (SPEC §H.5): a sandbox event never touches a live order, an old link never the current attempt.
    if (order.mode !== ctx.mode || !current || payment.payment_link_id !== current.providerLinkId) {
      await flagReview(req, order, "mode_or_link_mismatch", { paymentId: payment.id, linkId: payment.payment_link_id ?? null, mode: ctx.mode, eventId: ctx.eventId ?? null });
      after.push(() => alertStaff(req, "failed_payment", order, { reason: "mode_or_link_mismatch" }));
      return { applied: false, reason: "mode_or_link_mismatch" };
    }

    const status = String(payment.status);
    const fields = paymentFields(payment, ctx.source);
    // One link can carry several charges (a decline, then the retry that paid), and Mamo's
    // webhook order is UNVERIFIED (research 02 §A5): the poller replays `charges[]` in whatever
    // order the link lists them. Once a charge is recorded as the capture, a snapshot of ANOTHER
    // charge never rewrites the row — that would point refunds at a declined charge.
    const capturedByOther = CAPTURED_LIKE.includes(current.status) && Boolean(current.providerPaymentId) && current.providerPaymentId !== payment.id;

    if (status === "captured") {
      if (current.status === "captured" && current.providerPaymentId === payment.id) return { applied: false, reason: "already_applied" };
      if (capturedByOther) {
        // Paid twice through one link. The booking stands on the first capture; the second is a person's to refund.
        if (!reviewedFor(order, "double_capture", payment.id)) {
          await flagReview(req, order, "double_capture", { paymentId: payment.id, recorded: current.providerPaymentId ?? null });
          after.push(() =>
            alertStaff(req, "failed_payment", order, {
              problem: `A second payment (${payment.id}) was taken on this booking's payment link, which was already paid by ${current.providerPaymentId}. Refund the duplicate from the Mamo Pay dashboard.`,
            }),
          );
        }
        return { applied: false, reason: "double_capture" };
      }
      const paid = fromMamoAmount(payment.amount);
      if (payment.amount_currency !== "AED" || paid !== order.totals.grossFils) {
        await updateDoc(req, "payments", current.id, { ...fields, status: "failed", failureCode: "amount_mismatch", failureMessage: `paid ${payment.amount_currency} ${payment.amount}`, failedAt: new Date().toISOString() });
        await flagReview(req, order, "amount_mismatch", { paid: `${payment.amount_currency} ${payment.amount}`, expectedFils: order.totals.grossFils });
        after.push(() => alertStaff(req, "failed_payment", order, { reason: "amount_mismatch" }));
        return { applied: false, reason: "amount_mismatch" };
      }
      await updateDoc(req, "payments", current.id, { ...fields, status: "captured", capturedAt: new Date().toISOString() });

      if (order.status === "expired") return capturedAfterExpiry(req, order, current, after);
      if (!(["pending_payment", "awaiting_payment", "failed"] as OrderStatus[]).includes(order.status as OrderStatus)) {
        await appendTimeline(req, order.id, "capture_ignored", { status: order.status, paymentId: payment.id });
        return { applied: false, reason: `order_${order.status}` };
      }
      // The session was cancelled while the customer was on Mamo's page: confirming would sell a seat
      // on a date that will not happen. The hold goes back and the money is refunded in full.
      const gone = await cancelledSessionIds(req, order);
      if (gone.length) return capturedForCancelledSession(req, order, current, gone, after, { releaseHold: true });
      for (const [sessionId, qty] of Object.entries(heldSeats(order))) await consumeSeats(req, sessionId, qty);
      await markHolds(req, order.id, "consumed");
      await transition(req, order, "confirming", { refs: { payment: current.id }, note: `captured via ${ctx.source}` });
      await queueJob(req, "finalize-order", { orderId: order.id }, { workflow: true });
      return { applied: true };
    }

    if (status === "failed" || status === "voided") {
      const target = status === "voided" ? "voided" : "failed";
      // Idempotent: the poller re-reads the link every few minutes while the hold lasts, and every
      // run used to push the same decline through again (another email, another staff alert).
      const seen = timelineOf(order).some((e) => {
        const d = (e.detail ?? {}) as { paymentId?: unknown; status?: unknown };
        return e.event === "charge_failed" && d.paymentId === payment.id && d.status === target;
      });
      if (seen || (current.providerPaymentId === payment.id && current.status === target)) return { applied: false, reason: "already_applied" };
      if (capturedByOther) {
        // A decline replayed after the retry that paid: noted, nothing else — the customer has paid.
        await appendTimeline(req, order.id, "charge_failed", { paymentId: payment.id, status: target, stale: true, captured: current.providerPaymentId ?? null });
        return { applied: false, reason: "stale_charge" };
      }
      const wasCaptured = CAPTURED_LIKE.includes(current.status);
      await updateDoc(req, "payments", current.id, {
        ...fields,
        status: target,
        failureCode: payment.error_code ?? null,
        failureMessage: payment.error_message ?? null,
        failedAt: new Date().toISOString(),
      });
      await appendTimeline(req, order.id, "charge_failed", { paymentId: payment.id, status: target, code: payment.error_code ?? null });
      if (wasCaptured) {
        // The charge that paid is now reported voided or failed: the money may have gone back with no refund row. A person looks; the customer is not told "payment failed".
        const reason = status === "voided" ? "voided_after_capture" : "failed_after_capture";
        await flagReview(req, order, reason, { paymentId: payment.id });
        after.push(() => alertStaff(req, "failed_payment", order, { reason }));
        return { applied: true };
      }
      const live = (["pending_payment", "awaiting_payment", "failed"] as OrderStatus[]).includes(order.status as OrderStatus);
      if ((["pending_payment", "awaiting_payment"] as OrderStatus[]).includes(order.status as OrderStatus)) {
        await transition(req, order, "failed", { note: payment.error_message ?? status });
      }
      // Only while the hold lasts is "try again" true; a decline seen after expiry is history.
      if (status === "failed" && live) {
        after.push(() => emailCustomer(req, order.id, "payment_failed", { failureMessage: payment.error_message ?? "" }));
        after.push(() => alertStaff(req, "failed_payment", order, { reason: payment.error_message || payment.error_code || "failed" }));
      }
      return { applied: true };
    }

    if (status === "refund_initiated" || status === "refunded" || status === "refund_failed" || status === "partially_refunded") {
      await updateDoc(req, "payments", current.id, fields);
      await syncRefunds(req, order, payment);
      return { applied: true };
    }

    if (status === "processing" || status === "confirmation_required") {
      if (current.status !== "captured") await updateDoc(req, "payments", current.id, { ...fields, status: "processing" });
      return { applied: false, reason: "processing" };
    }

    await updateDoc(req, "payments", current.id, fields);
    return { applied: false, reason: `unhandled_status_${status}` };
  });
  for (const run of after) await bestEffort(req, "post-payment side effect", run);
  return result;
}

/** Seats this order holds right now: the hold snapshot, else its session lines. */
function heldSeats(order: Order): Record<string, number> {
  const snap = order.hold?.seatsBySession;
  if (snap && typeof snap === "object" && !Array.isArray(snap)) {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(snap)) if (typeof v === "number" && v > 0) out[k] = v;
    if (Object.keys(out).length) return out;
  }
  return seatsBySession(order.lines ?? []);
}

async function flagReview(req: PayloadRequest, order: Order, reason: NonNullable<Order["reviewReason"]>, detail: Record<string, unknown>): Promise<void> {
  const fresh = await loadOrder(req, order.id);
  await updateOrder(req, order.id, { needsReview: true, reviewReason: reason, timeline: [...timelineOf(fresh), timelineEntry(req, "needs_review", { reason, ...detail })] });
}

/** True when the order was already flagged for `reason` about this payment / refund id (so a replay does not alert twice). */
function reviewedFor(order: Order, reason: string, id: string): boolean {
  return timelineOf(order).some((e) => {
    const d = (e.detail ?? {}) as { reason?: unknown; paymentId?: unknown; providerRefundId?: unknown };
    return e.event === "needs_review" && d.reason === reason && (d.paymentId === id || d.providerRefundId === id);
  });
}

/** The order's sessions that have been cancelled since it was created. */
async function cancelledSessionIds(req: PayloadRequest, order: Order): Promise<string[]> {
  const ids = Object.keys(seatsBySession(order.lines ?? []));
  if (ids.length === 0) return [];
  const found = await req.payload.find({
    collection: "sessions",
    where: { and: [{ id: { in: ids } }, { cancelledAt: { exists: true } }] },
    limit: ids.length,
    depth: 0,
    overrideAccess: true,
    req,
    select: { cancelledAt: true },
  });
  return found.docs.map((d) => String(d.id));
}

/** Seats held, credits and the promo use go back (expiry, and a payment for a cancelled session). */
async function releaseOrderHold(req: PayloadRequest, order: Order): Promise<void> {
  for (const hold of await markHolds(req, order.id, "released")) await releaseSeats(req, hold.session, hold.qty);
  await restoreReservations(req, { passRedemptions: (order.passRedemptions ?? []).map((r) => ({ passPurchase: idOf(r.passPurchase) as string, n: r.n })), promoCodeId: idOf(order.promo?.promoCode) ?? null });
  for (const r of order.passRedemptions ?? []) await markRedemptionRestored(req, idOf(r.passPurchase) as string, order.id);
}

/**
 * Money arrived for a session that has been cancelled (while the customer
 * was paying, or after the hold expired): never confirmed — flagged, and
 * refunded in full with the `session_cancelled` email. An order still
 * holding seats gives them back and expires first.
 */
async function capturedForCancelledSession(
  req: PayloadRequest,
  order: Order,
  payment: Payment,
  cancelled: string[],
  after: Array<() => Promise<unknown>>,
  opts: { releaseHold: boolean },
): Promise<{ applied: boolean; reason?: string }> {
  if (opts.releaseHold) {
    await releaseOrderHold(req, order);
    await transition(req, order, "expired", { note: "paid for a session that had been cancelled" });
  }
  await flagReview(req, order, "paid_cancelled_session", { paymentId: payment.providerPaymentId ?? null, sessions: cancelled });
  const refund = await createDoc<Refund>(req, "refunds", {
    order: order.id,
    payment: payment.id,
    amountFils: order.totals.grossFils,
    reason: "session_cancelled",
    note: "Paid for a session that had already been cancelled.",
    releaseSeats: false,
    status: "approved",
    idempotencyKey: refundKey("paid-cancelled", payment.id),
  });
  const amount = order.totals.grossFils;
  after.push(() => emailCustomer(req, order.id, "session_cancelled", sessionCancelledVars(order, cancelled[0], { refundFils: amount }), { refund: refund.id }));
  after.push(() =>
    alertStaff(
      req,
      "refund",
      order,
      refundAlertVars({ amountFils: amount, status: "approved — being sent to Mamo Pay", reason: "session_cancelled", creditNoteNumber: "issued when the refund completes" }),
      { refund: refund.id },
    ),
  );
  return { applied: true, reason: "refunded_cancelled_session" };
}

/**
 * Money arrived after the hold ran out (research 03 §4.4): seats AND the
 * credits/promo that were given back at expiry are re-taken; all of it
 * succeeds → confirm as normal; anything missing → full refund
 * (`post_expiry_payment`), the order stays expired and is flagged.
 */
async function capturedAfterExpiry(req: PayloadRequest, order: Order, payment: Payment, after: Array<() => Promise<unknown>>): Promise<{ applied: boolean; reason?: string }> {
  // Expired because its session was cancelled (cancelSession expires in-flight orders): refund, never re-acquire.
  const gone = await cancelledSessionIds(req, order);
  if (gone.length) return capturedForCancelledSession(req, order, payment, gone, after, { releaseHold: false });
  const taken: Array<[string, number]> = [];
  let ok = true;
  for (const [sessionId, qty] of Object.entries(heldSeats(order))) {
    try {
      await acquireSeats(req, sessionId, qty, { allowWaitlist: true });
      taken.push([sessionId, qty]);
    } catch (error) {
      if (!(error instanceof SoldOut)) throw error;
      ok = false;
      break;
    }
  }
  const credits: Array<{ passPurchase: string; n: number }> = [];
  if (ok) {
    for (const r of order.passRedemptions ?? []) {
      const id = idOf(r.passPurchase) as string;
      if ((await runSql(req, reservePassSql(id, r.n))).length === 0) {
        ok = false;
        break;
      }
      credits.push({ passPurchase: id, n: r.n });
    }
  }
  const promoId = idOf(order.promo?.promoCode);
  if (ok && promoId && (await runSql(req, reservePromoSql(promoId))).length === 0) ok = false;

  if (ok) {
    for (const [sessionId, qty] of taken) await consumeSeats(req, sessionId, qty);
    await transition(req, order, "confirming", { note: "late capture: seats re-acquired", refs: { payment: payment.id } });
    await queueJob(req, "finalize-order", { orderId: order.id }, { workflow: true });
    return { applied: true, reason: "confirmed_after_expiry" };
  }

  // Undo the partial re-acquisition, refund in full, tell everyone.
  for (const [sessionId, qty] of taken) await releaseSeats(req, sessionId, qty);
  await restoreReservations(req, { passRedemptions: credits });
  await flagReview(req, order, "post_expiry", { paymentId: payment.providerPaymentId ?? null });
  const refund = await createDoc<Refund>(req, "refunds", {
    order: order.id,
    payment: payment.id,
    amountFils: order.totals.grossFils,
    reason: "post_expiry_payment",
    note: "Paid after the seat hold expired and the seats were no longer available.",
    releaseSeats: false,
    status: "approved",
    idempotencyKey: refundKey("post-expiry", payment.id),
  });
  after.push(() => emailCustomer(req, order.id, "post_expiry_payment", postExpiryVars(order), { refund: refund.id }));
  after.push(() =>
    alertStaff(
      req,
      "refund",
      order,
      refundAlertVars({ amountFils: order.totals.grossFils, status: "approved — being sent to Mamo Pay", reason: "post_expiry_payment", creditNoteNumber: "issued when the refund completes" }),
      { refund: refund.id },
    ),
  );
  return { applied: true, reason: "refunded_post_expiry" };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* syncRefunds + completing a refund                                          */
/* ────────────────────────────────────────────────────────────────────────── */

// TODO(mamo-verify): Mamo documents no refund idempotency key and no refund-entry timestamp semantics
// (research 02 §A10). We match an un-id'd `refunds[]` entry to our `processing` row by amount and by
// `created_date` ≥ providerRequestAt − this window (SPEC §H.7). The status words `refund_failed` /
// `partially_refunded` are read defensively below; only `refund_initiated` and `refunded` are documented.
const REFUND_MATCH_WINDOW_MS = 2 * 60_000;
// TODO(mamo-verify): `refunds[]` entries carry no status of their own (research 02 §A4, §A10), so an
// entry's presence is treated as SUCCESS — credit note, tickets refunded, "We've refunded" email —
// as soon as `refund_initiated` shows it. If Mamo later reports `refund_failed` for the payment, every
// refund on it completed within this many days is flagged for a person (`refund_failed`) and staff are
// alerted; nothing is reverted automatically. Revisit once the refund status vocabulary is confirmed
// (completing only on `refunded` / `partially_refunded` may then be the better rule).
const REFUND_FAILED_LOOKBACK_MS = 14 * 24 * 3_600_000;

/**
 * Reconciles `refunds[]` on the payment object with our `refunds` rows
 * (success → credit note, tickets refunded, seats back). Re-entrant: a
 * succeeded row whose completion never finished (no credit note yet) is
 * completed again, so a webhook retry or the reconciler repairs it.
 */
export async function syncRefunds(req: PayloadRequest, orderIn: Order, payment: MamoPayment): Promise<void> {
  const completed: string[] = [];
  const alerts: Array<() => Promise<unknown>> = [];
  await withTransaction(req, async () => {
    // The webhook and the process-refund job can both report the same refund at
    // once: the order lock serialises them, so the second reads the first's
    // committed rows (and finds nothing to do) instead of re-writing them.
    await lockOrder(req, orderIn.id);
    const order = await loadOrder(req, orderIn.id);
    const rows = (
      await req.payload.find({ collection: "refunds", where: { order: { equals: order.id } }, limit: 200, depth: 0, overrideAccess: true, req })
    ).docs as Refund[];
    const known = new Set(rows.map((r) => r.providerRefundId).filter(Boolean));
    const entries = payment.refunds ?? [];
    const paymentRowId = idOf(order.payment);

    for (const entry of entries) {
      const refundId = String(entry.id);
      const amountFils = fromMamoAmount(entry.amount);
      const done = rows.find((r) => r.providerRefundId === refundId);
      if (done) {
        if (done.status !== "succeeded") {
          await updateDoc(req, "refunds", done.id, { status: "succeeded" });
          completed.push(done.id);
        } else if (!done.creditNote) {
          completed.push(done.id); // completion did not finish last time; completeRefund resumes from state
        }
        continue;
      }
      // An entry we have no id for yet: the `processing` row of the same amount POSTed just before it.
      // Only `processing` rows qualify — they carry `providerRequestAt`, stamped before the POST — so
      // a same-amount refund made elsewhere is never pinned onto an `approved` row nobody sent.
      // Mamo dates are `YYYY-MM-DD-HH-MM-SS` (3B's parser); an unreadable one counts as "just now".
      const parsed = parseMamoDate(entry.created_date);
      const created = Number.isFinite(parsed) ? parsed : Date.now();
      const match = rows.find(
        (r) =>
          r.status === "processing" &&
          !r.providerRefundId &&
          Boolean(r.providerRequestAt) &&
          r.amountFils === amountFils &&
          created >= new Date(r.providerRequestAt as string).getTime() - REFUND_MATCH_WINDOW_MS,
      );
      if (match && !known.has(refundId)) {
        await updateDoc(req, "refunds", match.id, { status: "succeeded", providerRefundId: refundId, providerResponse: entry as unknown as Record<string, unknown> });
        known.add(refundId);
        completed.push(match.id);
        continue;
      }
      // A refund none of our rows asked for (the Mamo dashboard, or one we could not match): a person looks, once.
      if (!known.has(refundId) && !reviewedFor(order, "unknown_refund", refundId)) {
        await flagReview(req, order, "unknown_refund", { providerRefundId: refundId, amount: formatAed(amountFils) });
        alerts.push(() =>
          alertStaff(
            req,
            "refund",
            order,
            refundAlertVars({ amountFils, status: `found at Mamo Pay (${refundId}) with no matching refund in the admin — please check`, creditNoteNumber: "none issued" }),
          ),
        );
      }
    }

    if (String(payment.status) === "refund_failed") {
      for (const r of rows.filter((x) => x.status === "processing" && !x.providerRefundId)) await updateDoc(req, "refunds", r.id, { status: "failed" });
      // Refunds we already completed (credit note, email) that Mamo now says failed: flagged, never silently ignored.
      const since = Date.now() - REFUND_FAILED_LOOKBACK_MS;
      const suspect = rows.filter(
        (r) => r.status === "succeeded" && r.providerRefundId && r.providerRefundId !== "desk" && idOf(r.payment) === paymentRowId && new Date(r.updatedAt).getTime() >= since,
      );
      if (suspect.length && !reviewedFor(order, "refund_failed", String(payment.id))) {
        await flagReview(req, order, "refund_failed", { paymentId: payment.id, refunds: suspect.map((r) => r.id) });
        const total = suspect.reduce((sum, r) => sum + r.amountFils, 0);
        alerts.push(() =>
          alertStaff(
            req,
            "refund",
            order,
            refundAlertVars({ amountFils: total, status: "reported FAILED by Mamo Pay after it was recorded as refunded — check the Mamo dashboard", creditNoteNumber: "already issued; review it" }),
          ),
        );
      }
    }

    // The payment row mirrors Mamo's view of how much went back.
    if (paymentRowId) {
      const refunded = entries.reduce((sum, e) => sum + fromMamoAmount(e.amount), 0);
      const status =
        String(payment.status) === "refund_initiated" && refunded === 0
          ? "refund_pending"
          : refunded >= order.totals.grossFils && refunded > 0
            ? "refunded"
            : refunded > 0
              ? "partially_refunded"
              : undefined;
      if (status) await updateDoc(req, "payments", paymentRowId, { status });
    }
  });
  for (const refundId of completed) await completeRefund(req, refundId);
  for (const run of alerts) await bestEffort(req, "refund sync alert", run);
}

/**
 * A refund that has SUCCEEDED (Mamo confirmed it, or an admin clicked Mark
 * repaid on a desk refund). Two halves:
 *
 *   · STATE, once, in one transaction under the order lock: tickets named
 *     on the refund (of THIS order only) become `refunded`, their seats come
 *     back when asked, the order moves to `refunded` or gets a timeline
 *     entry. That entry is the "done" marker.
 *   · FOLLOW-UPS, re-entrant from state: the credit note (issueCreditNote
 *     returns the existing one), then the customer email unless the log
 *     already has one for this refund. A crash between the two halves, or a
 *     failed credit note, is repaired by the next call — syncRefunds and the
 *     reconcile-payments sweep both call this for a succeeded refund that
 *     has no credit note yet.
 */
export async function completeRefund(req: PayloadRequest, refundId: string): Promise<void> {
  let firstTime = false;
  let orderId: string | undefined;
  await withTransaction(req, async () => {
    const refund = (await req.payload.findByID({ collection: "refunds", id: refundId, depth: 0, overrideAccess: true, req })) as Refund;
    if (refund.status !== "succeeded") return;
    orderId = idOf(refund.order) as string;
    await lockOrder(req, orderId);
    const order = await loadOrder(req, orderId);
    // Already completed (a webhook and the poller both saw it): the timeline says so, and nothing runs twice.
    const seen = timelineOf(order).some((e) => {
      const d = (e.detail ?? {}) as { refund?: unknown; refs?: { refund?: unknown } };
      return (e.event === "refund_succeeded" || e.event === "refunded") && (d.refund === refundId || d.refs?.refund === refundId);
    });
    if (seen) return;
    firstTime = true;

    // Tickets named on the refund become `refunded`; their seats come back if asked. A ticket of
    // another order is never touched, whatever the row says (defence in depth behind requestRefund).
    const ticketIds = (refund.ticketsVoided ?? []).map(idOf).filter((x): x is string => Boolean(x));
    const back: Record<string, number> = {};
    for (const id of ticketIds) {
      const ticket = (await req.payload.findByID({ collection: "tickets", id, depth: 0, overrideAccess: true, disableErrors: true, req })) as Ticket | null;
      if (!ticket || idOf(ticket.order) !== orderId || ticket.status === "refunded" || ticket.status === "void") continue;
      await updateDoc(req, "tickets", id, { status: "refunded" });
      const s = idOf(ticket.session) as string;
      back[s] = (back[s] ?? 0) + 1;
    }
    if (refund.releaseSeats !== false) for (const [s, n] of Object.entries(back)) await refundSeats(req, s, n);

    // Fully refunded → `refunded` (unless already cancelled, which carried its own refund).
    const all = (
      await req.payload.find({ collection: "refunds", where: { and: [{ order: { equals: orderId } }, { status: { equals: "succeeded" } }] }, limit: 200, depth: 0, overrideAccess: true, req })
    ).docs as Refund[];
    const refundedFils = all.reduce((sum, r) => sum + r.amountFils, 0);
    if (refundedFils >= order.totals.grossFils && (["confirming", "confirmed", "completed"] as OrderStatus[]).includes(order.status as OrderStatus)) {
      await transition(req, order, "refunded", { note: `refunded ${formatAed(refundedFils)}`, refs: { refund: refundId } });
    } else {
      await appendTimeline(req, orderId, "refund_succeeded", { amount: formatAed(refund.amountFils), refund: refundId, partial: refundedFils < order.totals.grossFils });
    }
  });
  if (orderId) await completeRefundFollowUps(req, refundId, orderId, firstTime);
}

/** completeRefund's second half: credit note, then the emails — each only if not done yet. */
async function completeRefundFollowUps(req: PayloadRequest, refundId: string, orderId: string, firstTime: boolean): Promise<void> {
  let creditNote: { number: string } | null = null;
  await bestEffort(req, "issue credit note", async () => {
    creditNote = await issueCreditNote(req, refundId);
  });
  const cn = creditNote as { number: string } | null;
  const [refund, order] = await Promise.all([
    req.payload.findByID({ collection: "refunds", id: refundId, depth: 0, overrideAccess: true, req }) as Promise<Refund>,
    loadOrder(req, orderId),
  ]);
  if (firstTime) {
    await alertStaff(
      req,
      "refund",
      order,
      refundAlertVars({ amountFils: refund.amountFils, status: "succeeded", reason: refund.reason, creditNoteNumber: cn?.number ?? "not issued yet — the system will retry" }),
      { refund: refundId },
    );
  }
  // The customer email promises the credit note as an attachment: it waits until there is one.
  if (!cn) return;
  const logged = await req.payload.count({
    collection: "notification-log",
    where: { and: [{ refund: { equals: refundId } }, { templateKey: { equals: "order_refunded" } }] },
    overrideAccess: true,
    req,
  });
  if (logged.totalDocs > 0) return;
  await emailCustomer(req, orderId, "order_refunded", orderRefundedVars(order, refund, cn.number), { refund: refundId });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Expiry                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/** Hold ran out: release seats, deactivate the link, restore pass credits and promo use, `expired`. */
export async function expireOrder(req: PayloadRequest, orderId: string, opts: { force?: boolean; note?: string } = {}): Promise<void> {
  let expired: Order | null = null;
  await withTransaction(req, async () => {
    await lockOrder(req, orderId);
    const order = await loadOrder(req, orderId);
    if (!(["pending_payment", "awaiting_payment", "failed"] as OrderStatus[]).includes(order.status as OrderStatus)) return;
    const expiresAt = order.hold?.expiresAt ? new Date(order.hold.expiresAt).getTime() : 0;
    if (!opts.force && expiresAt > Date.now()) return;

    // Seats, credits and the promo use go back, and the pass records say so.
    await releaseOrderHold(req, order);

    expired = await transition(req, order, "expired", { note: opts.note ?? "hold expired without payment" });
  });
  if (expired) {
    const order = expired as Order;
    await bestEffort(req, "retire link on expiry", async () => retireCurrentLink(req, await gatewayOf(req, order.mode), order, "expired"));
  }
}

async function markRedemptionRestored(req: PayloadRequest, passPurchaseId: string, orderId: string): Promise<void> {
  const purchase = (await req.payload.findByID({ collection: "pass-purchases", id: passPurchaseId, depth: 0, overrideAccess: true, disableErrors: true, req })) as PassPurchase | null;
  if (!purchase) return;
  const redemptions = (purchase.redemptions ?? []).map(({ forOrder, n, at, restored }) => ({ forOrder: idOf(forOrder), n, at, restored: restored || idOf(forOrder) === orderId }));
  await updateDoc(req, "pass-purchases", passPurchaseId, { redemptions });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Refund requests (order actions)                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/** What may still be refunded on an order: Mamo's live `max_refund_amount` online, our own sums at the desk. */
export async function refundableFils(req: PayloadRequest, order: Order): Promise<number> {
  const rows = (
    await req.payload.find({ collection: "refunds", where: { and: [{ order: { equals: order.id } }, { status: { not_equals: "failed" } }] }, limit: 200, depth: 0, overrideAccess: true, req })
  ).docs as Refund[];
  const ours = Math.max(0, order.totals.grossFils - rows.reduce((sum, r) => sum + r.amountFils, 0));
  if (order.channel === "desk") return ours;
  const paymentId = idOf(order.payment);
  const payment = paymentId ? ((await req.payload.findByID({ collection: "payments", id: paymentId, depth: 0, overrideAccess: true, disableErrors: true, req })) as Payment | null) : null;
  if (!payment?.providerPaymentId) return ours;
  const gateway = await gatewayOf(req, order.mode);
  if (!gateway) return ours;
  const live = await gateway.getPayment(payment.providerPaymentId).catch(() => null);
  return typeof live?.max_refund_amount === "number" ? Math.min(ours, fromMamoAmount(live.max_refund_amount)) : ours;
}

/**
 * The Refund action (front desk may request, §J). The row is written FIRST,
 * keyed by `idempotencyKey` (the dialog mints one per opening; without one,
 * a 60-second bucket of order + amount), so a double click finds the row it
 * already made instead of asking for the money twice.
 */
export async function requestRefund(
  req: PayloadRequest,
  orderId: string,
  input: { amountFils: number; reason: Refund["reason"]; note?: string; releaseSeats?: boolean; ticketIds?: string[]; idempotencyKey?: string; approve?: boolean },
): Promise<Refund> {
  // The dialog's key is scoped to THIS order (hashed with its id): a key that happens to match a
  // refund on another order can neither return that refund nor collide with it.
  const key = input.idempotencyKey ? refundKey("request", orderId, input.idempotencyKey) : `${orderId}:${input.amountFils}:${Math.floor(Date.now() / 60_000)}`.slice(0, 64);
  const existing = await req.payload.find({
    collection: "refunds",
    where: { and: [{ idempotencyKey: { equals: key } }, { order: { equals: orderId } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  if (existing.docs[0]) return existing.docs[0] as Refund;

  const order = await loadOrder(req, orderId);
  if (!PAID_STATES.includes(order.status as OrderStatus)) throw new CheckoutError("not_refundable", `Order ${order.reference} is ${order.status}; only paid orders can be refunded.`);
  if (!Number.isInteger(input.amountFils) || input.amountFils < MIN_REFUND_FILS) throw new CheckoutError("refund_too_small", "The smallest refund is AED 1.00.", 400);
  const max = await refundableFils(req, order);
  if (input.amountFils > max) throw new CheckoutError("refund_too_large", `At most ${formatAed(max)} can still be refunded on this order.`, 400);

  // Named tickets must be live tickets of THIS order: completion marks them refunded and gives their
  // seats back, so a stray id would void another customer's booking.
  if (input.ticketIds?.length) {
    const ids = [...new Set(input.ticketIds)];
    const found = (
      await req.payload.find({ collection: "tickets", where: { id: { in: ids } }, limit: ids.length, depth: 0, overrideAccess: true, req, select: { order: true, status: true } })
    ).docs as Array<Pick<Ticket, "id" | "order" | "status">>;
    const ok = found.filter((t) => idOf(t.order) === orderId && (t.status === "valid" || t.status === "checked_in"));
    if (ok.length !== ids.length) throw new CheckoutError("bad_tickets", "Some of those tickets are not live tickets of this booking.", 400);
  }

  // Default tickets: a refund of everything that is left voids every valid ticket.
  let ticketIds = input.ticketIds ? [...new Set(input.ticketIds)] : [];
  if (!input.ticketIds && input.amountFils >= max) {
    const tickets = await req.payload.find({ collection: "tickets", where: { and: [{ order: { equals: orderId } }, { status: { equals: "valid" } }] }, limit: 500, depth: 0, overrideAccess: true, req });
    ticketIds = tickets.docs.map((t) => t.id);
  }

  return withTransaction(req, async () => {
    const desk = order.channel === "desk";
    const refund = await createDoc<Refund>(req, "refunds", {
      order: orderId,
      payment: idOf(order.payment),
      amountFils: input.amountFils,
      reason: input.reason,
      note: input.note?.slice(0, 1000),
      releaseSeats: input.releaseSeats !== false,
      status: input.approve && !desk ? "approved" : "requested",
      requestedBy: idOf(req.user),
      ...(input.approve && !desk ? { approvedBy: idOf(req.user) } : {}),
      ...(desk ? { providerRefundId: "desk" } : {}),
      idempotencyKey: key,
      ticketsVoided: ticketIds,
    });
    await appendTimeline(req, orderId, input.approve ? "refund_approved" : "refund_requested", { amount: formatAed(input.amountFils), reason: input.reason, refund: refund.id });
    return refund;
  });
}

/** Admin approval: `requested → approved`; the refunds `afterChange` queues `process-refund`. */
export async function approveRefund(req: PayloadRequest, orderId: string, refundId: string): Promise<Refund> {
  return withTransaction(req, async () => {
    const refund = (await req.payload.findByID({ collection: "refunds", id: refundId, depth: 0, overrideAccess: true, req })) as Refund;
    if (idOf(refund.order) !== orderId) throw new CheckoutError("not_found", "That refund belongs to another order.", 404);
    if (refund.status === "approved" || refund.status === "processing" || refund.status === "succeeded") return refund;
    if (refund.status !== "requested") throw new CheckoutError("not_approvable", `This refund is ${refund.status}.`);
    if (refund.providerRefundId === "desk") throw new CheckoutError("desk_refund", "A desk refund is repaid at the studio — use Mark repaid.");
    const updated = (await updateDoc(req, "refunds", refundId, { status: "approved", approvedBy: idOf(req.user) })) as Refund;
    await appendTimeline(req, orderId, "refund_approved", { refund: refundId, amount: formatAed(refund.amountFils) });
    return updated;
  });
}

/** Desk refunds: the money was handed back at the studio. */
export async function markRepaid(req: PayloadRequest, orderId: string, refundId: string): Promise<void> {
  await withTransaction(req, async () => {
    const refund = (await req.payload.findByID({ collection: "refunds", id: refundId, depth: 0, overrideAccess: true, req })) as Refund;
    if (idOf(refund.order) !== orderId) throw new CheckoutError("not_found", "That refund belongs to another order.", 404);
    if (refund.providerRefundId !== "desk") throw new CheckoutError("not_desk", "Only desk refunds are marked repaid; Mamo refunds complete on their own.");
    if (refund.status === "succeeded") return;
    await updateDoc(req, "refunds", refundId, { status: "succeeded", approvedBy: idOf(req.user) });
  });
  await completeRefund(req, refundId);
}

/** Cancel with refund (admin): seats back now, tickets void, a full refund approved on the spot. */
export async function cancelOrder(req: PayloadRequest, orderId: string, input: { reason: string; note?: string }): Promise<{ refundId?: string }> {
  const after: Array<() => Promise<unknown>> = [];
  const out = await withTransaction(req, async () => {
    await lockOrder(req, orderId);
    const order = await loadOrder(req, orderId);
    if (!(["confirming", "confirmed"] as OrderStatus[]).includes(order.status as OrderStatus)) throw new CheckoutError("not_cancellable", `Order ${order.reference} is ${order.status}.`);
    const tickets = (await req.payload.find({ collection: "tickets", where: { and: [{ order: { equals: orderId } }, { status: { in: ["valid", "checked_in"] } }] }, limit: 500, depth: 0, overrideAccess: true, req })).docs as Ticket[];
    for (const t of tickets) await updateDoc(req, "tickets", t.id, { status: "void" });
    for (const [s, n] of Object.entries(seatsBySession(order.lines ?? []))) await refundSeats(req, s, n);
    await restoreCreditsForLines(req, order, () => true);

    const max = await refundableFils(req, order);
    let refundId: string | undefined;
    if (max >= MIN_REFUND_FILS) {
      const desk = order.channel === "desk";
      const refund = await createDoc<Refund>(req, "refunds", {
        order: orderId,
        payment: idOf(order.payment),
        amountFils: max,
        reason: "customer_request",
        note: [input.reason, input.note].filter(Boolean).join(" — ").slice(0, 1000),
        releaseSeats: false, // seats already returned above
        status: desk ? "requested" : "approved",
        requestedBy: idOf(req.user),
        approvedBy: desk ? undefined : idOf(req.user),
        ...(desk ? { providerRefundId: "desk" } : {}),
        idempotencyKey: refundKey("cancel", orderId),
        ticketsVoided: [],
      });
      refundId = refund.id;
    }
    await transition(req, order, "cancelled", { note: input.reason.slice(0, 200), ...(refundId ? { refs: { refund: refundId } } : {}) });
    const refundFils = refundId ? max : 0;
    after.push(() => emailCustomer(req, orderId, "order_cancelled", orderCancelledVars(order, { reason: input.reason, note: input.note, refundFils }), { refund: refundId }));
    return { refundId };
  });
  for (const run of after) await bestEffort(req, "cancel side effect", run);
  return out;
}

/** Gives back pass credits that paid for the lines matching `which` (cancel / session cancelled). */
async function restoreCreditsForLines(req: PayloadRequest, order: Order, which: (line: NonNullable<Order["lines"]>[number]) => boolean): Promise<number> {
  let credits = (order.lines ?? []).filter(which).reduce((sum, l) => sum + (l.passCredits ?? 0), 0);
  let restored = 0;
  for (const r of order.passRedemptions ?? []) {
    if (credits <= 0) break;
    const n = Math.min(credits, r.n);
    await runSql(req, restorePassSql(idOf(r.passPurchase) as string, n));
    credits -= n;
    restored += n;
  }
  return restored;
}

/** Clears the review flag with a note (admin). */
export async function resolveReview(req: PayloadRequest, orderId: string, note?: string): Promise<Order> {
  return withTransaction(req, async () => {
    const order = await loadOrder(req, orderId);
    return updateOrder(req, orderId, {
      needsReview: false,
      reviewReason: null,
      timeline: [...timelineOf(order), timelineEntry(req, "review_resolved", { reason: order.reviewReason ?? null, note: note ?? null })],
    });
  });
}

/** Resend confirmation / tickets: renders afresh (the log's Resend re-sends stored HTML instead). */
export async function resendOrderEmail(req: PayloadRequest, orderId: string, what: "confirmation" | "tickets"): Promise<{ status: string }> {
  const order = await loadOrder(req, orderId);
  if (!order.contact.email) throw new CheckoutError("no_email", "This booking has no email address. Add one under Contact details first.", 400);
  if (!(["confirmed", "completed"] as OrderStatus[]).includes(order.status as OrderStatus)) throw new CheckoutError("not_confirmed", `Order ${order.reference} is ${order.status}.`);
  const result = await sendTemplated(req, {
    key: "order_confirmation",
    to: order.contact.email,
    vars: await orderVars(req, order, { resend: what }),
    refs: { order: order.id },
  });
  await appendTimeline(req, orderId, what === "tickets" ? "tickets_resent" : "confirmation_resent", { logId: result.logId });
  return { status: result.status };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* §H.7 Move to another session                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/** Move to another session of the same experience (§H.7): seats, tickets, lines, email, timeline. */
export async function moveOrder(
  req: PayloadRequest,
  orderId: string,
  input: { targetSessionId: string; priceDifference: "no_charge" | "collect_at_venue" | "refund_difference"; note?: string },
): Promise<Order> {
  const after: Array<() => Promise<unknown>> = [];
  const moved = await withTransaction(req, async () => {
    await lockOrder(req, orderId);
    const order = await loadOrder(req, orderId);
    if (order.status !== "confirmed") throw new CheckoutError("not_movable", `Only confirmed bookings can be moved (this one is ${order.status}).`);
    const sessionLines = (order.lines ?? []).map((l, i) => ({ l, i })).filter(({ l }) => l.kind === "session");
    if (sessionLines.length !== 1) throw new CheckoutError("not_movable", "This booking covers several sessions; move each with a separate booking.");
    const { l: line, i: lineIndex } = sessionLines[0];
    const sourceId = idOf(line.session) as string;
    if (sourceId === input.targetSessionId) throw new CheckoutError("same_session", "The booking is already on that session.", 400);

    const [source, target] = (await Promise.all(
      [sourceId, input.targetSessionId].map((id) => req.payload.findByID({ collection: "sessions", id, depth: 1, overrideAccess: true, disableErrors: true, req })),
    )) as Array<(Session & { _status?: string }) | null>;
    if (!target || target._status !== "published") throw new CheckoutError("target_unavailable", "That session is not published.", 400);
    if (!source || idOf(source.experience) !== idOf(target.experience)) throw new CheckoutError("other_experience", "A booking can only move to another date of the same experience.", 400);

    // Only the LIVE seats move: a seat refunded on its own already went back to the source and is not
    // re-minted on the target (issueTickets skips a refunded (line, seat) on every session).
    const refundedSeats = (
      await req.payload.find({
        collection: "tickets",
        where: { and: [{ order: { equals: orderId } }, { lineIndex: { equals: lineIndex } }, { status: { equals: "refunded" } }] },
        limit: 500,
        depth: 0,
        overrideAccess: true,
        req,
        select: { seatNo: true },
      })
    ).docs as Array<Pick<Ticket, "seatNo">>;
    const seats = line.qty - new Set(refundedSeats.map((t) => t.seatNo)).size;
    if (seats < 1) throw new CheckoutError("not_movable", "Every seat on this booking has been refunded; there is nothing to move.");

    // Seats: take on the target (staff may use a waitlist-only date), give back on the source.
    await acquireSeats(req, target.id, seats, { allowWaitlist: true });
    await consumeSeats(req, target.id, seats);
    await refundSeats(req, sourceId, seats);

    // Old tickets void; 3E's issueTickets mints the new ones for the new (line, seat, session) after commit.
    const old = await req.payload.find({
      collection: "tickets",
      where: { and: [{ order: { equals: orderId } }, { session: { equals: sourceId } }, { status: { in: ["valid", "checked_in"] } }] },
      limit: 200,
      depth: 0,
      overrideAccess: true,
      req,
    });
    for (const t of old.docs) await updateDoc(req, "tickets", t.id, { status: "void" });

    const venue = target.venue && typeof target.venue === "object" ? (target.venue as Venue) : null;
    const lines = (order.lines ?? []).map(({ id: _id, ...l }, i) => {
      void _id;
      const base = { ...l, session: idOf(l.session), pass: idOf(l.pass) };
      return i === lineIndex ? { ...base, session: target.id, title: (target.title || l.title).slice(0, 120), startsAt: target.startsAt, durationMinutes: target.durationMinutes, venueName: venue?.name ?? null } : base;
    });

    const diffFils = (target.priceFils - line.unitFils) * Math.max(0, seats - (line.passCredits ?? 0));
    const detail: Record<string, unknown> = { from: sourceId, to: target.id, seats, fromStartsAt: line.startsAt, toStartsAt: target.startsAt, priceDifference: input.priceDifference, diff: formatAed(Math.abs(diffFils)), note: input.note ?? null };
    let internalNotes = order.internalNotes ?? "";
    if (input.priceDifference === "collect_at_venue" && diffFils > 0) {
      internalNotes = `${internalNotes ? `${internalNotes}\n` : ""}Collect ${formatAed(diffFils)} at the venue (moved to ${target.title ?? "new date"}).`.slice(0, 4000);
    }
    const updated = await updateOrder(req, orderId, { lines, internalNotes, timeline: [...timelineOf(order), timelineEntry(req, "moved", detail)] });

    if (input.priceDifference === "refund_difference" && diffFils < 0 && -diffFils >= MIN_REFUND_FILS) {
      await createDoc<Refund>(req, "refunds", {
        order: orderId,
        payment: idOf(order.payment),
        amountFils: -diffFils,
        reason: "other",
        note: `Price difference after moving to ${target.title ?? "another date"}.`,
        releaseSeats: false,
        status: "requested",
        requestedBy: idOf(req.user),
        ...(order.channel === "desk" ? { providerRefundId: "desk" } : {}),
        idempotencyKey: refundKey("move", orderId, target.id),
        ticketsVoided: [],
      });
    }
    // In this order: the new tickets exist before the email builds `links.tickets` and attaches them.
    after.push(() => issueTickets(req, orderId));
    after.push(() => emailCustomer(req, orderId, "order_moved", orderMovedVars(line.startsAt, input.note)));
    return updated;
  });
  for (const run of after) await bestEffort(req, "move side effect", run);
  return moved;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* §H.7 Session operations                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

async function ordersOnSession(req: PayloadRequest, sessionId: string, statuses: OrderStatus[]): Promise<Order[]> {
  const found = await req.payload.find({
    collection: "orders",
    where: { and: [{ "lines.session": { equals: sessionId } }, { status: { in: statuses } }] },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    req,
  });
  return found.docs as Order[];
}

/** What the lines on `sessionId` cost the customer: their share of the order's gross, in whole fils. */
export function sessionShareFils(order: Pick<Order, "lines" | "totals">, sessionId: string): number {
  const lines = order.lines ?? [];
  const shares = allocate(order.totals.grossFils, lines.map((l) => Math.max(0, l.lineFils - (l.passCredits ?? 0) * l.unitFils)));
  return lines.reduce((sum, l, i) => (l.kind === "session" && idOf(l.session) === sessionId ? sum + shares[i] : sum), 0);
}

/** Cancel session & refund all (§H.7): closes the session, queues refunds, voids tickets, emails every customer. */
export async function cancelSession(req: PayloadRequest, sessionId: string, input: { reason: string; message?: string }): Promise<{ orders: number; refundsQueued: number }> {
  const notify: Array<{ orderId: string; vars: Record<string, unknown>; refund?: string }> = [];
  let inFlight: string[] = [];
  const result = await withTransaction(req, async () => {
    const session = (await req.payload.findByID({ collection: "sessions", id: sessionId, depth: 0, overrideAccess: true, req })) as Session;
    if (session.cancelledAt) throw new CheckoutError("already_cancelled", "This session is already cancelled.");
    await withContext(req, { system: true, reschedule: true }, (context) =>
      req.payload.update({
        collection: "sessions",
        id: sessionId,
        data: { bookingStatus: "closed", cancelledAt: new Date().toISOString(), cancelReason: input.reason.slice(0, 200) },
        depth: 0,
        overrideAccess: true,
        context,
        req,
      }),
    );

    let refundsQueued = 0;
    const orders = await ordersOnSession(req, sessionId, ["confirming", "confirmed"]);
    for (const order of orders) {
      await lockOrder(req, order.id);
      const qty = seatsBySession(order.lines ?? [])[sessionId] ?? 0;
      const tickets = await req.payload.find({ collection: "tickets", where: { and: [{ order: { equals: order.id } }, { session: { equals: sessionId } }, { status: { in: ["valid", "checked_in"] } }] }, limit: 500, depth: 0, overrideAccess: true, req });
      for (const t of tickets.docs) await updateDoc(req, "tickets", t.id, { status: "void" });
      if (qty > 0) await refundSeats(req, sessionId, qty);
      await restoreCreditsForLines(req, order, (l) => l.kind === "session" && idOf(l.session) === sessionId);

      const amount = Math.min(sessionShareFils(order, sessionId), await refundableFils(req, order));
      let refundId: string | undefined;
      if (amount >= MIN_REFUND_FILS) {
        const desk = order.channel === "desk";
        const refund = await createDoc<Refund>(req, "refunds", {
          order: order.id,
          payment: idOf(order.payment),
          amountFils: amount,
          reason: "session_cancelled",
          note: input.reason.slice(0, 1000),
          releaseSeats: false, // returned above
          status: desk ? "requested" : "approved",
          requestedBy: idOf(req.user),
          approvedBy: desk ? undefined : idOf(req.user),
          ...(desk ? { providerRefundId: "desk" } : {}),
          idempotencyKey: refundKey("session-cancel", sessionId, order.id),
          ticketsVoided: [],
        });
        refundId = refund.id;
        if (!desk) refundsQueued += 1;
      }
      const onlyThisSession = (order.lines ?? []).every((l) => l.kind !== "session" || idOf(l.session) === sessionId);
      if (onlyThisSession) await transition(req, order, "cancelled", { note: `session cancelled: ${input.reason}`.slice(0, 200) });
      else await appendTimeline(req, order.id, "session_cancelled", { session: sessionId, reason: input.reason });
      notify.push({
        orderId: order.id,
        refund: refundId,
        vars: sessionCancelledVars(order, sessionId, { reason: input.reason, message: input.message, refundFils: amount >= MIN_REFUND_FILS ? amount : 0 }),
      });
    }
    // Customers still paying for this session (seats held, Mamo link live) must not be able to complete:
    // their orders expire after the commit (link deactivated, seats/credits/promo back). A payment
    // that slips through anyway is refunded by applyPaymentSnapshot (it checks `cancelledAt`).
    inFlight = (await ordersOnSession(req, sessionId, ["pending_payment", "awaiting_payment", "failed"])).map((o) => o.id);
    await cancelWaitlistFor(req, sessionId);
    return { orders: orders.length, refundsQueued };
  });
  for (const orderId of inFlight) await bestEffort(req, "expire in-flight order", () => expireOrder(req, orderId, { force: true, note: "session cancelled" }));
  for (const n of notify) await emailCustomer(req, n.orderId, "session_cancelled", n.vars, { refund: n.refund });
  return result;
}

/** Reschedule (§H.7): the one path past the §D.2 guard; new slug + redirect, reminders reset, holders emailed. */
export async function rescheduleSession(req: PayloadRequest, sessionId: string, input: { startsAt: string; venueId?: string; message?: string }): Promise<{ notified: number; newSlug: string }> {
  const when = new Date(input.startsAt);
  if (Number.isNaN(when.getTime())) throw new CheckoutError("bad_date", "That start time is not a date.", 400);
  if (when.getTime() <= Date.now()) throw new CheckoutError("past_date", "The new start time is in the past.", 400);

  const notify: Array<{ orderId: string; vars: Record<string, unknown> }> = [];
  let newSlug = "";
  await withTransaction(req, async () => {
    const session = (await req.payload.findByID({ collection: "sessions", id: sessionId, depth: 1, overrideAccess: true, req })) as Session & { _status?: string; slug?: string };
    if (session.cancelledAt) throw new CheckoutError("cancelled", "A cancelled session cannot be rescheduled.");
    const experience = session.experience && typeof session.experience === "object" ? (session.experience as Experience) : null;
    const base = experience?.slug ? sessionSlugFor(experience.slug, when, session.startsAt_tz || "Asia/Dubai") : undefined;
    newSlug = session.slug ?? "";
    if (base) {
      newSlug = base;
      for (let n = 2; n <= 20; n += 1) {
        const clash = await req.payload.db.findOne({ collection: "sessions", req, where: { and: [{ slug: { equals: newSlug } }, { id: { not_equals: sessionId } }] } });
        if (!clash) break;
        newSlug = `${base}-${n}`;
      }
    }
    const venue = input.venueId ?? idOf(session.venue);
    await withContext(req, { system: true, reschedule: true }, (context) =>
      req.payload.update({
        collection: "sessions",
        id: sessionId,
        data: { startsAt: when.toISOString(), ...(input.venueId ? { venue: input.venueId } : {}), slug: newSlug, reminderSentAt: null, ...(session._status === "published" ? { _status: "published" } : {}) },
        depth: 0,
        overrideAccess: true,
        context,
        req,
      }),
    );
    // Reminders go out again for the new date.
    await withContext(req, { system: true }, (context) =>
      req.payload.update({ collection: "tickets", where: { session: { equals: sessionId } }, data: { reminderSentAt: null }, depth: 0, overrideAccess: true, context, req }),
    );

    const venueDoc = venue ? ((await req.payload.findByID({ collection: "venues", id: venue, depth: 0, overrideAccess: true, disableErrors: true, req })) as Venue | null) : null;
    // Paid orders are emailed; orders still being paid get the new date too, so their confirmation is right.
    const paid = new Set((await ordersOnSession(req, sessionId, ["confirming", "confirmed"])).map((o) => o.id));
    for (const order of await ordersOnSession(req, sessionId, ["pending_payment", "awaiting_payment", "failed", "confirming", "confirmed"])) {
      const lines = (order.lines ?? []).map(({ id: _id, ...l }) => {
        void _id;
        const base2 = { ...l, session: idOf(l.session), pass: idOf(l.pass) };
        return idOf(l.session) === sessionId ? { ...base2, startsAt: when.toISOString(), venueName: venueDoc?.name ?? l.venueName ?? null } : base2;
      });
      await updateOrder(req, order.id, {
        lines,
        timeline: [...timelineOf(order), timelineEntry(req, "rescheduled", { session: sessionId, from: session.startsAt, to: when.toISOString(), venue: venueDoc?.name ?? null, message: input.message ?? null })],
      });
      if (!paid.has(order.id)) continue;
      notify.push({
        orderId: order.id,
        vars: sessionRescheduledVars({ ...order, lines: lines as Order["lines"] }, sessionId, session.startsAt, input.message),
      });
    }
  });
  for (const n of notify) await emailCustomer(req, n.orderId, "session_rescheduled", n.vars);
  return { notified: notify.length, newSlug };
}

// The weekly-series date rule and its cap live in ./sessionSeries.ts so the
// RepeatDialog previews exactly what this creates; re-exported for callers.
export { REPEAT_MAX, repeatDates };

/**
 * Repeat… (§H.7): up to REPEAT_MAX drafts on the matching weekdays until
 * `until`, inventory rows at zero. `after` (optional) skips dates up to that
 * instant — the dialog's batches; the cap applies per call, and the dialog
 * never asks for more than REPEAT_MAX in all.
 */
export async function repeatSession(
  req: PayloadRequest,
  sessionId: string,
  input: { every: "weekly"; until: string; weekdays: number[]; after?: string },
): Promise<{ created: Array<{ id: string; startsAt: string; slug: string }> }> {
  const source = (await req.payload.findByID({ collection: "sessions", id: sessionId, depth: 0, overrideAccess: true, draft: true, req })) as Session & { slug?: string };
  const dates = repeatDates(source.startsAt, input.until, input.weekdays, REPEAT_MAX, input.after);
  if (dates.length === 0) throw new CheckoutError("no_dates", "No dates match those weekdays before the end date.", 400);
  const offset = (date: Date) => date.getTime() - new Date(source.startsAt).getTime();

  const created: Array<{ id: string; startsAt: string; slug: string }> = [];
  await withTransaction(req, async () => {
    for (const at of dates) {
      const salesCloseAt = source.salesCloseAt ? new Date(new Date(source.salesCloseAt).getTime() + offset(at)).toISOString() : null;
      const doc = (await req.payload.create({
        collection: "sessions",
        draft: true,
        data: {
          experience: idOf(source.experience) as string,
          title: source.title ?? undefined,
          category: source.category,
          startsAt: at.toISOString(),
          startsAt_tz: source.startsAt_tz,
          durationMinutes: source.durationMinutes,
          venue: idOf(source.venue) ?? null,
          priceFils: source.priceFils,
          seatsTotal: source.seatsTotal,
          excerpt: source.excerpt ?? null,
          image: idOf(source.image) ?? null,
          gallery: (source.gallery ?? []).map(idOf).filter((x): x is string => Boolean(x)),
          about: (source.about ?? []).map(({ paragraph }) => ({ paragraph })),
          includes: source.includes ?? null,
          minAge: source.minAge ?? null,
          instructor: source.instructor ?? null,
          bookingStatus: source.bookingStatus === "closed" ? "open" : source.bookingStatus,
          salesCloseAt,
          checkInWindow: source.checkInWindow ?? undefined,
          internalNotes: source.internalNotes ?? null,
          _status: "draft",
        } as never,
        depth: 0,
        overrideAccess: true,
        context: { ...(req.context ?? {}), skipRevalidate: true },
        req,
      })) as Session & { slug?: string };
      created.push({ id: doc.id, startsAt: doc.startsAt, slug: doc.slug ?? "" });
    }
  });
  safeRevalidate(req, [], []);
  return { created };
}

/** Admin: every "my bookings" cookie minted before now stops working (§H.10). */
export async function signOutEverywhere(req: PayloadRequest, customerId: string): Promise<{ sessionVersion: number }> {
  const customer = (await req.payload.findByID({ collection: "customers", id: customerId, depth: 0, overrideAccess: true, req })) as Customer;
  const next = (customer.sessionVersion ?? 1) + 1;
  await updateDoc(req, "customers", customerId, { sessionVersion: next });
  return { sessionVersion: next };
}

/** Recomputes a customer's totals from their orders (orders `afterChange`, after a confirm / refund / cancel). */
export async function recomputeCustomerStats(req: PayloadRequest, customerId: string): Promise<void> {
  const rows = await runSql<{ orders: unknown; lifetime: unknown; last: unknown }>(
    req,
    sql`SELECT count(*) AS orders, coalesce(sum(totals_gross_fils), 0) AS lifetime, max(created_at) AS last
          FROM orders WHERE customer_id = ${customerId} AND status IN ('confirmed', 'completed')`,
  );
  const tickets = await runSql<{ n: unknown }>(
    req,
    sql`SELECT count(*) AS n FROM tickets t JOIN orders o ON o.id = t.order_id WHERE o.customer_id = ${customerId} AND t.status IN ('valid', 'checked_in')`,
  );
  await updateDoc(req, "customers", customerId, {
    stats: { ordersCount: Number(rows[0]?.orders ?? 0), ticketsCount: Number(tickets[0]?.n ?? 0), lifetimeFils: Number(rows[0]?.lifetime ?? 0) },
    ...(rows[0]?.last ? { lastOrderAt: new Date(String(rows[0].last)).toISOString() } : {}),
  });
}
