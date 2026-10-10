import type { PayloadRequest } from "payload";

import { applyPaymentSnapshot } from "@/cms/lib/contracts";
import type { Order, Payment } from "@/payload-types";

import { gatewayForMode } from "./index";
import { isDisabled } from "./types";

/**
 * ==========================================================================
 * What a customer may see of an order — two levels, nothing in between
 * ==========================================================================
 *
 * SPEC §H.5 (return page) and §H.10 (status lookup). The booking reference
 * is printed on emails and read out at the desk; it is not a secret. So:
 *
 *   · reference only           → `{ status, holdExpiresAt }` — enough for
 *                                the return page to poll "Processing…".
 *   · reference + a valid `k`  → the lines, totals, tickets and whether the
 *     (or reference + email)      invoice exists — what the confirmation
 *                                 page and the booking-status page render.
 *
 * Never returned at either level: email, phone, payment ids, the Mamo link,
 * card details beyond the decline text, internal notes, the timeline.
 */

export interface MinimalOrderStatus {
  status: Order["status"];
  holdExpiresAt: string | null;
}

export interface CustomerOrderView extends MinimalOrderStatus {
  reference: string;
  firstName: string;
  channel: Order["channel"];
  lines: Array<{
    kind: "session" | "pass";
    title: string;
    category: string | null;
    startsAt: string | null;
    durationMinutes: number | null;
    venueName: string | null;
    qty: number;
    unitFils: number;
    lineFils: number;
    passCredits: number;
  }>;
  totals: { subtotalFils: number; discountFils: number; grossFils: number; netFils: number; vatFils: number; currency: string };
  tickets: Array<{ code: string; holderName: string | null; seatNo: number | null; status: string; sessionTitle: string | null; startsAt: string | null }>;
  invoiceAvailable: boolean;
  /** Mamo's customer-facing decline text on a failed attempt (research 02 §A10), for "/checkout?payment=failed". */
  failureMessage: string | null;
  confirmedAt: string | null;
}

export async function findOrderByReference(req: PayloadRequest, reference: string): Promise<Order | null> {
  const result = await req.payload.find({
    collection: "orders",
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return (result.docs[0] as Order | undefined) ?? null;
}

export function minimalStatus(order: Order): MinimalOrderStatus {
  return { status: order.status, holdExpiresAt: order.hold?.expiresAt ?? null };
}

const idOf = (value: unknown): string | null =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : null;

export async function customerView(req: PayloadRequest, order: Order): Promise<CustomerOrderView> {
  const { payload } = req;
  const lines = (order.lines ?? []).map((line) => ({
    kind: line.kind,
    title: line.title,
    category: line.category ?? null,
    startsAt: line.startsAt ?? null,
    durationMinutes: line.durationMinutes ?? null,
    venueName: line.venueName ?? null,
    qty: line.qty,
    unitFils: line.unitFils,
    lineFils: line.lineFils,
    passCredits: line.passCredits ?? 0,
  }));

  // Tickets: by order. A session's title and time come from the order's own
  // line snapshot, so a later edit to the session does not rewrite history.
  let tickets: CustomerOrderView["tickets"] = [];
  try {
    const found = await payload.find({
      collection: "tickets",
      where: { order: { equals: order.id } },
      limit: 200,
      depth: 0,
      sort: "seatNo",
      overrideAccess: true,
    });
    tickets = found.docs.map((ticket) => {
      const line = (order.lines ?? []).find((l) => idOf(l.session) === idOf(ticket.session));
      return {
        code: ticket.code,
        holderName: ticket.holderName ?? null,
        seatNo: ticket.seatNo ?? null,
        status: String(ticket.status ?? ""),
        sessionTitle: line?.title ?? null,
        startsAt: line?.startsAt ?? null,
      };
    });
  } catch (error) {
    payload.logger.warn({ msg: "order view: tickets unavailable", err: error instanceof Error ? error.message : String(error) });
  }

  let failureMessage: string | null = null;
  const paymentId = idOf(order.payment);
  if (order.status === "failed" && paymentId) {
    const attempt = (await payload
      .findByID({ collection: "payments", id: paymentId, depth: 0, overrideAccess: true, disableErrors: true })
      .catch(() => null)) as Payment | null;
    failureMessage = attempt?.failureMessage ?? null;
  }

  return {
    ...minimalStatus(order),
    reference: order.reference,
    firstName: order.contact?.firstName ?? "",
    channel: order.channel,
    lines,
    totals: {
      subtotalFils: order.totals.subtotalFils,
      discountFils: order.totals.discountFils,
      grossFils: order.totals.grossFils,
      netFils: order.totals.netFils,
      vatFils: order.totals.vatFils,
      currency: order.totals.currency,
    },
    tickets,
    invoiceAvailable: Boolean(order.invoice),
    failureMessage,
    confirmedAt: order.confirmedAt ?? null,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The return-page fast path                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const lastAttempt = new Map<string, number>();
const RETURN_CHECK_EVERY_MS = 10_000;

/**
 * SPEC §H.5 "Return page": when the customer is back from Mamo before the
 * webhook (or the webhook never comes), Mamo's `transactionId` on the
 * return URL lets us ask Mamo directly — `GET /payments/{transactionId}` —
 * and apply the same snapshot the webhook would. The redirect itself is
 * unsigned (research 02 §A3), so the id is only a pointer: what is applied
 * is Mamo's own answer, and `applyPaymentSnapshot` refuses a payment whose
 * link is not this order's current one.
 *
 * Called only with a valid `k`, at most once per order per 10 seconds,
 * and never throws: failure just means the page keeps polling.
 */
export async function applyReturnTransaction(req: PayloadRequest, order: Order, transactionId: string): Promise<{ applied: boolean; reason?: string }> {
  if (!["pending_payment", "awaiting_payment", "failed", "expired"].includes(order.status)) return { applied: false, reason: "not_pending" };
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(transactionId)) return { applied: false, reason: "bad_id" };
  const now = Date.now();
  if ((lastAttempt.get(order.id) ?? 0) > now - RETURN_CHECK_EVERY_MS) return { applied: false, reason: "throttled" };
  lastAttempt.set(order.id, now);
  if (lastAttempt.size > 5_000) for (const [key, at] of lastAttempt) if (at < now - RETURN_CHECK_EVERY_MS) lastAttempt.delete(key);

  try {
    const gateway = await gatewayForMode(req, order.mode);
    if (isDisabled(gateway)) return { applied: false, reason: gateway.reason };
    const payment = await gateway.getPayment(transactionId);
    return await applyPaymentSnapshot(req, order, payment, { source: "return", mode: order.mode });
  } catch (error) {
    req.payload.logger.warn({
      msg: "return-page payment check failed; the page keeps polling",
      reference: order.reference,
      err: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
    return { applied: false, reason: "error" };
  }
}
