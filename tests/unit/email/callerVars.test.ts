import { describe, expect, it } from "vitest";

import { normalizeVars } from "@/cms/email/aliases";
import {
  customerOrderVars,
  mergeVars,
  orderCancelledVars,
  orderMovedVars,
  orderRefundedVars,
  postExpiryVars,
  REFUND_AT_STUDIO,
  REFUND_TO_CARD,
  refundAlertVars,
  sessionCancelledVars,
  sessionRescheduledVars,
  staffOrderVars,
  type OrderForVars,
} from "@/cms/email/callerVars";
import { DEFAULT_TEMPLATE_BY_KEY, toLexical } from "@/cms/email/defaults";
import { findVariables, findVariablesInString, interpolate, interpolateLexical, lexicalToEmailHtml, lookup, stringifyValue } from "@/cms/email/render";
import type { EmailTemplateKey } from "@/cms/email/variables";

/**
 * Every default template rendered from the variables its REAL caller
 * builds — not the Preview samples, which always fill every name. The
 * Phase 3 review found mail going out as "Any refund due ()", "moved from
 * to …" and a tickets button with `href=""`, because the senders passed
 * names neither the templates nor aliases.ts knew. This fails on any blank.
 *
 * The customer emails go through cms/email/callerVars.ts exactly as
 * cms/lib/orders.ts calls it (`orderVars` = `customerOrderVars` merged with
 * the per-email builder). The staff alerts built inline (the refund hook,
 * the low-seats check, the dispute webhook, the waitlist offer) are mirrored
 * here literally.
 */

/** Filled by the renderer (Site details) or by notifyStaff, never by the caller; or optional by design (an empty paragraph is dropped). */
const NOT_THE_CALLERS = /^(site\.|recipient\.)/;
const OPTIONAL = new Set(["note", "message", "session.directions"]);

const session1 = "11111111-1111-4111-8111-111111111111";
const session2 = "22222222-2222-4222-8222-222222222222";

const order = (channel: "online" | "desk" = "online"): OrderForVars => ({
  id: "o-1",
  reference: "MP-JT74KW",
  channel,
  contact: { firstName: "Layla", lastName: "Haddad", email: "layla@example.com" },
  lines: [
    { kind: "session", session: session1, title: "Candle Making", startsAt: "2026-10-24T06:00:00.000Z", venueName: "Times Square Center", qty: 2, lineFils: 48000 },
    { kind: "session", session: session2, title: "Crochet", startsAt: "2026-10-25T11:30:00.000Z", venueName: "Studio", qty: 1, lineFils: 18000 },
  ],
  totals: { grossFils: 66000, vatFils: 3143 },
  hold: { expiresAt: "2026-10-10T05:25:00.000Z" },
});

/** What `orderVars(req, order, extra)` returns, with the links it computes. */
const orderVars = (o: OrderForVars, extra: Record<string, unknown> = {}) =>
  mergeVars(
    customerOrderVars(o, {
      statusUrl: "https://maison.test/payment-success?ref=MP-JT74KW&k=k",
      retryUrl: "https://maison.test/checkout?ref=MP-JT74KW&payment=failed",
      myBookingsUrl: "https://maison.test/my-bookings",
      ticketsUrl: "https://maison.test/api/site/tickets/MPT-AB12CD34/pdf?scope=order&exp=1&sig=s",
    }),
    extra,
  );

/** The staff alert base notifyStaff sends (links.admin added by `alertStaff`). */
const staffVars = (o: OrderForVars, extra: Record<string, unknown>) => mergeVars(staffOrderVars(o, "https://maison.test/admin/collections/orders/o-1"), extra);

function blanks(key: EmailTemplateKey, vars: Record<string, unknown>): string[] {
  const template = DEFAULT_TEMPLATE_BY_KEY[key];
  const normalized = normalizeVars(key, vars);
  const used = findVariables(toLexical(template.paragraphs), findVariablesInString(`${template.subject} ${template.preheader ?? ""}`));
  return [...used].filter((name) => !NOT_THE_CALLERS.test(name) && !OPTIONAL.has(name) && stringifyValue(lookup(normalized, name)) === "");
}

function render(key: EmailTemplateKey, vars: Record<string, unknown>): string {
  const template = DEFAULT_TEMPLATE_BY_KEY[key];
  const normalized = normalizeVars(key, { ...vars, site: { name: "Maison Palettia" }, recipient: { name: "Nadia" } });
  return `${interpolate(template.subject, normalized)}\n${lexicalToEmailHtml(interpolateLexical(toLexical(template.paragraphs) as never, normalized))}`;
}

const cases: Array<[EmailTemplateKey, () => Record<string, unknown>]> = [
  // ── customers (cms/lib/orders.ts) ──
  ["payment_failed", () => orderVars(order(), { failureMessage: "Card declined" })],
  ["order_cancelled", () => orderVars(order(), orderCancelledVars(order(), { reason: "The instructor is unwell.", refundFils: 66000 }))],
  ["session_cancelled", () => orderVars(order(), sessionCancelledVars(order(), session2, { reason: "Venue closed", refundFils: 18000 }))],
  ["post_expiry_payment", () => orderVars(order(), postExpiryVars(order()))],
  ["order_refunded", () => orderVars(order(), orderRefundedVars(order(), { amountFils: 24000, reason: "customer_request" }, "MP-CN-2026-000005"))],
  ["order_moved", () => orderVars(order(), orderMovedVars("2026-10-17T06:00:00.000Z", ""))],
  ["session_rescheduled", () => orderVars(order(), sessionRescheduledVars(order(), session2, "2026-10-18T11:30:00.000Z", ""))],
  // cms/lib/waitlist.ts notifyWaitlist
  [
    "waitlist_seat_available",
    () => ({ name: "Sam", sessionTitle: "Candle Making", startsAt: "2026-10-24T06:00:00.000Z", venueName: "Times Square Center", qty: 2, bookUrl: "https://maison.test/events/x/book?w=t", expiresAt: new Date(Date.now() + 86_400_000).toISOString() }),
  ],
  // ── staff ──
  ["admin_new_order", () => staffVars(order(), {})], // finalize-order
  ["admin_failed_payment", () => staffVars(order(), { reason: "Card declined" })], // applyPaymentSnapshot
  ["admin_refund", () => staffVars(order(), refundAlertVars({ amountFils: 24000, status: "succeeded", reason: "customer_request", creditNoteNumber: "MP-CN-2026-000005" }))], // completeRefund
  // the refunds afterChange hook (cms/collections/commerce/hooks.ts)
  ["admin_refund_requested", () => ({ reference: "MP-JT74KW", refund: { amount: "AED 240.00" }, reason: "customer_request", requestedByName: "Sara", note: "", links: { admin: "https://maison.test/admin" } })],
  // consumeSeats (cms/lib/inventory.ts)
  ["admin_low_seats", () => ({ sessionTitle: "Candle Making", startsAt: "2026-10-24T06:00:00.000Z", seatsLeft: 2, seatsTotal: 12, threshold: 4, links: { admin: "https://maison.test/admin" } })],
  // the dispute branch of the webhook (cms/lib/mamo/webhook.ts)
  ["admin_dispute", () => ({ reference: "MP-JT74KW", eventType: "dispute.received", paymentId: "PAY-1A2B3C", links: { admin: "https://maison.test/admin" } })],
];

describe("every default template, rendered from its real caller's variables", () => {
  it.each(cases)("%s has no blank variable", (key, build) => {
    expect(blanks(key, build())).toEqual([]);
  });

  it("puts the right session, amount and destination in a cancellation of the SECOND session of a booking", () => {
    const html = render("session_cancelled", orderVars(order(), sessionCancelledVars(order(), session2, { refundFils: 18000 })));
    expect(html).toContain("Crochet");
    expect(html).toContain("AED 180.00");
    expect(html).toContain(REFUND_TO_CARD);
  });

  it("tells a desk customer the refund is arranged at the studio, not on a card", () => {
    const desk = order("desk");
    const html = render("order_cancelled", orderVars(desk, orderCancelledVars(desk, { reason: "Cancelled at your request.", refundFils: 66000 })));
    expect(html).toContain(REFUND_AT_STUDIO.replace("'", "&#39;"));
    expect(html).not.toContain(REFUND_TO_CARD);
  });

  it("gives the moved and rescheduled emails a real tickets link and the previous time", () => {
    const moved = render("order_moved", orderVars(order(), orderMovedVars("2026-10-17T06:00:00.000Z")));
    expect(moved).not.toContain('href=""');
    expect(moved).toContain("Sat 17 Oct 2026, 10:00");
  });

  it("words a refund reason for staff in the staff's voice", () => {
    const html = render("admin_refund_requested", { reference: "MP-1", refund: { amount: "AED 1.00" }, reason: "customer_request", requestedByName: "Sara" });
    expect(html).toContain("customer asked");
    expect(html).not.toContain("Requested by you");
  });

  it("says the seats are still held after a failed payment, until when", () => {
    const html = render("payment_failed", orderVars(order()));
    expect(html).not.toMatch(/seats have been released/);
    expect(html).toContain("Sat 10 Oct 2026, 09:25");
  });
});
