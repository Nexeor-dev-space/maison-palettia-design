import { formatAed } from "@/cms/lib/money";

import { formatDubai } from "./render";

/**
 * ==========================================================================
 * Caller variables — what the order code hands each email, by documented name
 * ==========================================================================
 *
 * cms/email/variables.ts lists the names each template may use; the
 * functions here BUILD those names from an order, so the senders in
 * cms/lib/orders.ts, the finalize workflow and the hooks pass
 * `{ refund: { amount } }` rather than a spelling only aliases.ts happens to
 * know. They are pure (no database, no request) so the unit test can render
 * every default template from exactly what its real caller builds and fail
 * on a blank — the Phase 3 review found "Any refund due ()" and "moved from
 * to …" in sent mail because nothing checked that.
 *
 * Links that need the request (signed PDFs, the public base URL) are
 * computed by the caller and passed in.
 */

/** The slice of an order the builders read (the generated `Order` satisfies it). */
export interface OrderForVars {
  id: string;
  reference: string;
  channel?: string | null;
  contact: { firstName: string; lastName: string; email?: string | null };
  lines?: Array<{ kind: string; title: string; startsAt?: string | null; venueName?: string | null; qty: number; lineFils: number; session?: unknown }> | null;
  totals: { grossFils: number; vatFils?: number | null };
  hold?: { expiresAt?: string | null } | null;
}

/** Where the money goes back, in the customer's words: the card online, the studio for desk bookings (cash, bank transfer). */
export const REFUND_TO_CARD = "to the card you paid with";
export const REFUND_AT_STUDIO = "at the studio — we'll be in touch to arrange it";

const idOf = (value: unknown): string | undefined =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : undefined;

const fullName = (order: OrderForVars) => `${order.contact.firstName} ${order.contact.lastName}`.trim();

/** "Sun 11 Oct 2026, 10:00" (Dubai), or "" for no date. */
export const when = (iso: string | null | undefined): string => (iso ? formatDubai(iso) : "");

/** One `{ title, when, venue, qty }` per line — the shape `order.summary` is built from (aliases.ts). */
export function lineVars(order: OrderForVars): Array<{ title: string; when: string; venue: string; qty: number; lineTotal: string }> {
  return (order.lines ?? []).map((l) => ({ title: l.title, when: l.kind === "session" ? when(l.startsAt) : "", venue: l.venueName ?? "", qty: l.qty, lineTotal: formatAed(l.lineFils) }));
}

/** `session.*` for one session line: the given session, else the order's first session line. */
export function sessionVars(order: OrderForVars, sessionId?: string): { title: string; when: string; venue: string } {
  const lines = order.lines ?? [];
  const line = (sessionId ? lines.find((l) => l.kind === "session" && idOf(l.session) === sessionId) : undefined) ?? lines.find((l) => l.kind === "session") ?? lines[0];
  return { title: line?.title ?? "", when: when(line?.startsAt), venue: line?.venueName ?? "" };
}

/** Every customer email about an order: who, which booking, what, and the links that need no extra lookup. */
export function customerOrderVars(
  order: OrderForVars,
  links: { statusUrl: string; retryUrl: string; myBookingsUrl: string; ticketsUrl?: string },
): Record<string, unknown> {
  const session = sessionVars(order);
  return {
    customer: { firstName: order.contact.firstName, lastName: order.contact.lastName, name: fullName(order), email: order.contact.email ?? "" },
    order: { reference: order.reference, total: formatAed(order.totals.grossFils), channel: order.channel ?? "" },
    session,
    lines: lineVars(order),
    hold: { until: when(order.hold?.expiresAt) },
    links: { status: links.statusUrl, retry: links.retryUrl, myBookings: links.myBookingsUrl, tickets: links.ticketsUrl ?? links.myBookingsUrl },
    // The flat spellings earlier callers and edited templates may still read (aliases.ts maps them too).
    reference: order.reference,
    firstName: order.contact.firstName,
    lastName: order.contact.lastName,
    customerName: fullName(order),
    email: order.contact.email ?? "",
    sessionTitle: session.title,
    total: formatAed(order.totals.grossFils),
    totalFils: order.totals.grossFils,
    statusUrl: links.statusUrl,
    retryUrl: links.retryUrl,
    myBookingsUrl: links.myBookingsUrl,
  };
}

/** `refund.*` for a customer email: the amount and where it goes back. */
export function refundVars(order: Pick<OrderForVars, "channel">, amountFils: number, more: { reason?: string } = {}): { refund: Record<string, string> } {
  return {
    refund: {
      amount: formatAed(Math.max(0, amountFils)),
      where: order.channel === "desk" ? REFUND_AT_STUDIO : REFUND_TO_CARD,
      ...(more.reason ? { reason: more.reason } : {}),
    },
  };
}

/** Every staff alert about an order: the booking, the customer as `{ name, email }`, the total and the summary lines. */
export function staffOrderVars(order: OrderForVars, adminUrl?: string): Record<string, unknown> {
  return {
    reference: order.reference,
    order: { reference: order.reference, total: formatAed(order.totals.grossFils), channel: order.channel === "desk" ? "at the desk" : "online" },
    customer: { name: fullName(order), email: order.contact.email ?? "" },
    total: formatAed(order.totals.grossFils),
    lines: lineVars(order).map(({ title, when: at, venue, qty }) => ({ title, when: at, venue, qty })),
    ...(adminUrl ? { links: { admin: adminUrl } } : {}),
  };
}

/**
 * `{ ...a, ...b }`, except that plain-object values present in both are
 * merged one level down — `{ refund: { where } }` plus `{ refund: { amount } }`
 * keeps both, where a spread would drop one.
 */
export function mergeVars(...parts: Array<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const plain = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      out[key] = plain(out[key]) && plain(value) ? { ...(out[key] as Record<string, unknown>), ...value } : value;
    }
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Per-email extras — one builder per call site in cms/lib/orders.ts          */
/* ────────────────────────────────────────────────────────────────────────── */

/** order_cancelled (cancelOrder): the staff's reason, an optional note, and what comes back. */
export const orderCancelledVars = (order: OrderForVars, input: { reason: string; note?: string; refundFils: number }) => ({
  reason: input.reason,
  note: input.note ?? "",
  ...refundVars(order, input.refundFils),
});

/** session_cancelled (cancelSession, and a payment that arrived for a cancelled session): THAT session, and its share back. */
export const sessionCancelledVars = (order: OrderForVars, sessionId: string, input: { reason?: string; message?: string; refundFils: number }) => ({
  session: sessionVars(order, sessionId),
  reason: input.reason ?? "",
  message: input.message ?? "",
  ...refundVars(order, input.refundFils),
});

/** post_expiry_payment (capturedAfterExpiry): the whole amount goes back. */
export const postExpiryVars = (order: OrderForVars) => refundVars(order, order.totals.grossFils);

/** order_refunded (completeRefund): amount, reason (a code; aliases.ts words it for the customer) and the credit note. */
export const orderRefundedVars = (order: OrderForVars, refund: { amountFils: number; reason?: string | null }, creditNoteNumber: string) => ({
  ...refundVars(order, refund.amountFils),
  reason: refund.reason ?? "",
  creditNote: { number: creditNoteNumber },
});

/** order_moved (moveOrder): where it was; `session.*` and `links.tickets` come from the moved order itself. */
export const orderMovedVars = (previousStartsAt: string | null | undefined, note?: string) => ({ previous: { when: when(previousStartsAt) }, note: note ?? "" });

/** session_rescheduled (rescheduleSession): old and new time of THAT session (`order` carries the updated lines). */
export const sessionRescheduledVars = (order: OrderForVars, sessionId: string, previousStartsAt: string | null | undefined, message?: string) => ({
  previous: { when: when(previousStartsAt) },
  session: sessionVars(order, sessionId),
  message: message ?? "",
});

/** admin_refund: the amount, what happened, the credit note (or why there is none). */
export const refundAlertVars = (input: { amountFils: number; status: string; reason?: string | null; creditNoteNumber: string }) => ({
  refund: { amount: formatAed(input.amountFils), status: input.status },
  reason: input.reason ?? "",
  creditNoteNumber: input.creditNoteNumber,
});
