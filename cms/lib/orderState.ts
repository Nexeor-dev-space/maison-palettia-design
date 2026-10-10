import { APIError, type PayloadRequest } from "payload";

import type { Order } from "@/payload-types";

import type { OrderStatus } from "./contracts";
import { withContext } from "./inventory";

/**
 * ==========================================================================
 * The order state machine — `transition()` is the only door (SPEC §H.1)
 * ==========================================================================
 *
 *   pending_payment ─(link created)─► awaiting_payment ─(captured)─► confirming ─► confirmed ─► completed
 *        │  └──────────(desk / pass-only)─────────────────────────────┘                │
 *        ▼                                                                             ├─► cancelled  (staff / session cancelled)
 *      failed ◄─(link error, payment.failed, payment.voided)── awaiting_payment         └─► refunded   (full refund)
 *        │  └─(retry: new link)─► awaiting_payment
 *        └──────(hold ran out)──► expired ─(late capture, seats re-acquired)─► confirming
 *
 * The table below IS the machine: an edge that is not listed throws, and the
 * unit tests walk every pair. The edges beyond the SPEC sentence are all
 * implied by it:
 *
 *   · `failed → awaiting_payment` — "/checkout?ref&payment=failed retries on
 *     the SAME order with a new link" (§H.5): the retry needs a way back.
 *   · `failed → confirming` / `pending_payment → confirming` — a capture
 *     that arrives for an order whose previous attempt failed (the customer
 *     retried on Mamo's page), and the desk / pass-only path that never had
 *     a link ("confirming … or desk/pass-only orders directly").
 *   · `expired → confirming` — the late-capture path re-acquires the seats
 *     and then runs the same finalize workflow as any capture, so it goes
 *     through `confirming` rather than straight to `confirmed`.
 *   · `confirming → cancelled | refunded` — a capture whose finalize cannot
 *     complete (the session was cancelled in the gap) is refunded from there.
 *   · `pending_payment → expired` — the hold ran out before a link was ever
 *     made (link creation kept failing); `completed → refunded` — a goodwill
 *     refund after the session took place.
 *
 * Every successful edge appends a `timeline` entry and stamps the `*At`
 * field that belongs to the target state. The write carries
 * `context.orderTransition`, which the orders `beforeChange` hook requires
 * for ANY status change — so REST, the admin form and stray server code
 * cannot move an order without passing through here.
 */

export const ORDER_EDGES: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending_payment: ["awaiting_payment", "confirming", "failed", "expired"],
  awaiting_payment: ["confirming", "failed", "expired"],
  confirming: ["confirmed", "cancelled", "refunded"],
  confirmed: ["completed", "cancelled", "refunded"],
  completed: ["refunded"],
  failed: ["awaiting_payment", "confirming", "expired"],
  expired: ["confirming"],
  cancelled: [],
  refunded: [],
};

/** The date field each target state stamps (null: the timeline entry is the record). */
export const STAMP_FOR: Readonly<Partial<Record<OrderStatus, "confirmedAt" | "cancelledAt" | "expiredAt">>> = {
  confirmed: "confirmedAt",
  cancelled: "cancelledAt",
  expired: "expiredAt",
};

/** Terminal for the customer: nothing they do changes these any more. */
export const TERMINAL: readonly OrderStatus[] = ["cancelled", "refunded"];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_EDGES[from]?.includes(to) ?? false;
}

export class InvalidTransition extends APIError {
  constructor(
    public from: OrderStatus,
    public to: OrderStatus,
  ) {
    super(`An order cannot go from “${from}” to “${to}”.`, 409, undefined, true);
    this.name = "InvalidTransition";
  }
}

/** Throws `InvalidTransition` unless the edge is in the table. Pure; the unit tests call it directly. */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransition(from, to);
}

export type TimelineEntry = { at: string; event: string; by: string; detail?: Record<string, unknown> | null };

/** "Ayesha (admin)" for a signed-in user, "system" for jobs, webhooks and the checkout. */
export function actorOf(req: PayloadRequest, by?: string): string {
  if (by) return by;
  const user = req.user as { email?: string; name?: string; role?: string } | null | undefined;
  if (!user) return "system";
  const who = user.name || user.email || "staff";
  return user.role ? `${who} (${user.role})` : who;
}

export function timelineEntry(req: PayloadRequest, event: string, detail?: Record<string, unknown> | null, by?: string, at: Date = new Date()): TimelineEntry {
  return { at: at.toISOString(), event: event.slice(0, 60), by: actorOf(req, by).slice(0, 120), detail: detail ?? null };
}

/** The stored timeline without the generated array-row ids Payload adds on read (they would be re-sent as stale keys). */
export function timelineOf(order: Pick<Order, "timeline">): TimelineEntry[] {
  return (order.timeline ?? []).map(({ at, event, by, detail }) => ({ at, event, by: by ?? "system", detail: (detail as Record<string, unknown> | null) ?? null }));
}

/**
 * Re-reads the order inside the caller's transaction (the caller's copy may
 * be stale — two webhooks for one order arrive within milliseconds), checks
 * the edge from the CURRENT state, and writes status + timeline + stamp in
 * one update. A transition to the state the order is already in is a no-op
 * that returns the fresh document, so retried jobs and duplicate webhooks
 * are harmless.
 */
export async function transition(
  req: PayloadRequest,
  order: Order,
  to: OrderStatus,
  detail?: { note?: string; by?: string; refs?: Record<string, string> },
): Promise<Order> {
  const fresh = (await req.payload.findByID({ collection: "orders", id: order.id, depth: 0, overrideAccess: true, req })) as Order;
  const from = fresh.status as OrderStatus;
  if (from === to) return fresh;
  assertTransition(from, to);

  const now = new Date();
  const entry = timelineEntry(req, to, { from, ...(detail?.note ? { note: detail.note } : {}), ...(detail?.refs ? { refs: detail.refs } : {}) }, detail?.by, now);
  const stamp = STAMP_FOR[to];
  const data: Record<string, unknown> = { status: to, timeline: [...timelineOf(fresh), entry] };
  if (stamp) data[stamp] = now.toISOString();

  return withContext(req, { orderTransition: true, system: true }, (context) =>
    req.payload.update({ collection: "orders", id: order.id, data, depth: 0, overrideAccess: true, context, req }),
  ) as Promise<Order>;
}

/**
 * Appends a timeline entry WITHOUT a state change — "moved", "contact
 * changed", "refund requested", "reminder sent". The status is untouched,
 * so the `beforeChange` guard has nothing to object to.
 */
export async function appendTimeline(
  req: PayloadRequest,
  orderId: string,
  event: string,
  detail?: Record<string, unknown> | null,
  extra: Record<string, unknown> = {},
): Promise<Order> {
  const fresh = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req })) as Order;
  return withContext(req, { system: true }, (context) =>
    req.payload.update({
      collection: "orders",
      id: orderId,
      data: { ...extra, timeline: [...timelineOf(fresh), timelineEntry(req, event, detail)] },
      depth: 0,
      overrideAccess: true,
      context,
      req,
    }),
  ) as Promise<Order>;
}
