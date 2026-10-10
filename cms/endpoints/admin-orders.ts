import { randomUUID } from "node:crypto";

import { APIError, type Endpoint, type PayloadRequest } from "payload";
import { z } from "zod";

import { clientIp, ipHash, moveOrder, NotImplemented, quote, rateLimit, SoldOut, startCheckout, type Order } from "@/cms/lib/contracts";
import { queueJob } from "@/cms/lib/inventory";
import { issueInvoice } from "@/cms/lib/invoiceNumber";
import { approveRefund, cancelOrder, markRepaid, refundableFils, requestRefund, resendOrderEmail, resolveReview, signOutEverywhere } from "@/cms/lib/orders";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Order actions — desk booking, move, refunds, cancel, resend, invoice (§H.7)
 * ==========================================================================
 *
 * Paths are relative to `/api/` and live under `/api/actions/**`. Every
 * handler's FIRST statement is `requireRole` (SPEC §A.2 rule 2, §J), which
 * also refuses `Sec-Fetch-Site: cross-site`; every body is a zod schema. The
 * handlers are thin: the work (and its single transaction) is in
 * cms/lib/orders.ts, so the order buttons, the jobs and the tests all run
 * the same code.
 *
 *   POST /actions/orders/quote                               admin, front-desk   desk price preview (nothing reserved)
 *   POST /actions/orders/manual                              admin, front-desk   desk booking → confirmed (amount override: admin)
 *   GET  /actions/orders/:id/refundable                      admin, front-desk   what may still be refunded
 *   POST /actions/orders/:id/move                            admin, front-desk   another date of the same experience
 *   POST /actions/orders/:id/refund                          admin, front-desk   request (admin may approve in the same call)
 *   POST /actions/orders/:id/resend-confirmation             admin, front-desk
 *   POST /actions/orders/:id/resend-tickets                  admin, front-desk
 *   POST /actions/orders/:id/refunds/:refundId/approve       admin               → process-refund job
 *   POST /actions/orders/:id/refunds/:refundId/mark-repaid   admin               desk refunds
 *   POST /actions/orders/:id/cancel                          admin               cancel with full refund
 *   POST /actions/orders/:id/regenerate-invoice              admin               (issues the invoice if missing) → PDF job
 *   POST /actions/orders/:id/resolve-review                  admin               clears "needs review"
 *   POST /actions/customers/:id/sign-out-everywhere          admin               bumps sessionVersion (§H.10)
 *
 * Refusals come back as `{ errors: [{ message, data: { reason } }] }` with a
 * meaningful status (409 sold out / wrong state, 400 bad input), which is
 * what the admin dialogs print.
 */

const uuid = z.string().regex(/^[0-9a-f-]{36}$/i, "Unknown id.");
const fils = z.number().int().min(0).max(100_000_000);
const deskMethod = z.enum(["cash", "card_terminal", "complimentary", "bank_transfer"]);

const idParam = (value: unknown, what = "order"): string => {
  const id = typeof value === "string" ? value : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new APIError(`Unknown ${what}.`, 404, undefined, true);
  return id;
};

const deskQuoteBody = z.object({
  sessionId: uuid,
  qty: z.number().int().min(1).max(50),
  method: deskMethod,
  amountFils: fils.optional(),
  codes: z.array(z.string().trim().max(40)).max(3).default([]),
  email: z.string().trim().email().max(254).optional(),
});

const manualBody = deskQuoteBody.extend({
  customer: z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().email().max(254).optional().or(z.literal("").transform(() => undefined)),
    phone: z.string().trim().max(32).optional(),
  }),
  note: z.string().trim().max(200).optional(),
});

const moveBody = z.object({
  targetSessionId: uuid,
  priceDifference: z.enum(["no_charge", "collect_at_venue", "refund_difference"]),
  note: z.string().trim().max(500).optional(),
});

const refundBody = z.object({
  amountFils: z.number().int().min(100, "The smallest refund is AED 1.00.").max(100_000_000),
  reason: z.enum(["customer_request", "session_cancelled", "post_expiry_payment", "duplicate", "goodwill", "other"]),
  note: z.string().trim().max(1000).optional(),
  releaseSeats: z.boolean().optional(),
  ticketIds: z.array(uuid).max(200).optional(),
  idempotencyKey: z.string().trim().min(8).max(64).optional(),
  approve: z.boolean().optional(),
});

const cancelBody = z.object({ reason: z.string().trim().min(3, "Say why (at least 3 characters).").max(200), note: z.string().trim().max(1000).optional() });
const noteBody = z.object({ note: z.string().trim().max(500).optional() });

/** SoldOut and the checkout's own refusals → a JSON 409 the dialog can show. */
async function mapCheckoutErrors<T>(run: () => Promise<T>): Promise<T | Response> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof SoldOut) {
      return json({ errors: [{ message: `Only ${error.available} ${error.available === 1 ? "seat is" : "seats are"} left on that session.`, data: { reason: "sold_out", available: error.available } }] }, { status: 409 });
    }
    if (error instanceof NotImplemented) throw new APIError(`${error.message} — this part of the booking system is still being installed.`, 501, undefined, true);
    throw error;
  }
}

const orderRef = async (req: PayloadRequest, id: string): Promise<Order> => {
  const order = (await req.payload.findByID({ collection: "orders", id, depth: 0, overrideAccess: true, disableErrors: true, req })) as Order | null;
  if (!order) throw new APIError("Unknown order.", 404, undefined, true);
  return order;
};

export const adminOrdersEndpoints: Endpoint[] = [
  {
    path: "/actions/orders/quote",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      const body = await parseBody(req, deskQuoteBody);
      if (body.amountFils !== undefined && req.user.role !== "admin") throw new APIError("Only an admin can change the amount taken.", 403, undefined, true);
      const q = await quote(req, {
        lines: [{ kind: "session", id: body.sessionId, qty: body.qty }],
        email: body.email,
        codes: body.codes,
        channel: "desk",
        desk: { method: body.method, amountFils: body.amountFils },
      });
      return json({ lines: q.lines, totals: q.totals, promo: q.promo ?? null, passRedemptions: q.passRedemptions, rejectedCodes: q.rejectedCodes });
    },
  },
  {
    path: "/actions/orders/manual",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      if (!rateLimit("desk-booking", String(req.user.id), { limit: 30, windowMs: 60_000 })) throw new APIError("Too many bookings in a minute.", 429, undefined, true);
      const body = await parseBody(req, manualBody);
      if (body.amountFils !== undefined && req.user.role !== "admin") throw new APIError("Only an admin can change the amount taken.", 403, undefined, true);
      return mapCheckoutErrors(async () => {
        const result = await startCheckout(req, {
          basketId: randomUUID(),
          channel: "desk",
          details: { firstName: body.customer.firstName, lastName: body.customer.lastName, email: body.customer.email, phone: body.customer.phone },
          lines: [{ kind: "session", id: body.sessionId, qty: body.qty }],
          codes: body.codes,
          consents: [],
          desk: { method: body.method, amountFils: body.amountFils, note: body.note },
          source: { ipHash: ipHash(clientIp(req.headers)), userAgent: (req.headers.get("user-agent") ?? "admin").slice(0, 300), referrer: "admin" },
        });
        const order = await req.payload.find({ collection: "orders", where: { reference: { equals: result.reference } }, limit: 1, depth: 0, overrideAccess: true, req });
        return json({ reference: result.reference, orderId: order.docs[0]?.id ?? null });
      });
    },
  },
  {
    path: "/actions/orders/:id/refundable",
    method: "get",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      const order = await orderRef(req, idParam(req.routeParams?.id));
      return json({ refundableFils: await refundableFils(req, order), grossFils: order.totals.grossFils, channel: order.channel });
    },
  },
  {
    path: "/actions/orders/:id/move",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      const id = idParam(req.routeParams?.id);
      const body = await parseBody(req, moveBody);
      return mapCheckoutErrors(async () => {
        const order = await moveOrder(req, id, body);
        return json({ ok: true, reference: order.reference });
      });
    },
  },
  {
    path: "/actions/orders/:id/refund",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      const id = idParam(req.routeParams?.id);
      const body = await parseBody(req, refundBody);
      if (body.approve && req.user.role !== "admin") throw new APIError("Only an admin can approve a refund.", 403, undefined, true);
      const refund = await mapCheckoutErrors(() => requestRefund(req, id, body));
      if (refund instanceof Response) return refund;
      return json({ refundId: refund.id, status: refund.status });
    },
  },
  {
    path: "/actions/orders/:id/resend-confirmation",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      const id = idParam(req.routeParams?.id);
      return mapCheckoutErrors(async () => json(await resendOrderEmail(req, id, "confirmation")));
    },
  },
  {
    path: "/actions/orders/:id/resend-tickets",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      const id = idParam(req.routeParams?.id);
      return mapCheckoutErrors(async () => json(await resendOrderEmail(req, id, "tickets")));
    },
  },
  {
    path: "/actions/orders/:id/refunds/:refundId/approve",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const refund = await approveRefund(req, idParam(req.routeParams?.id), idParam(req.routeParams?.refundId, "refund"));
      return json({ refundId: refund.id, status: refund.status });
    },
  },
  {
    path: "/actions/orders/:id/refunds/:refundId/mark-repaid",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      await markRepaid(req, idParam(req.routeParams?.id), idParam(req.routeParams?.refundId, "refund"));
      return json({ ok: true });
    },
  },
  {
    path: "/actions/orders/:id/cancel",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const id = idParam(req.routeParams?.id);
      const body = await parseBody(req, cancelBody);
      return json(await cancelOrder(req, id, body));
    },
  },
  {
    path: "/actions/orders/:id/regenerate-invoice",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const order = await orderRef(req, idParam(req.routeParams?.id));
      if (!["confirmed", "completed", "refunded", "cancelled"].includes(order.status)) {
        throw new APIError(`Order ${order.reference} is ${order.status}; invoices are issued once it is confirmed.`, 409, undefined, true);
      }
      const { invoiceId, number } = await issueInvoice(req, order.id);
      const queued = await queueJob(req, "generate-invoice-pdf", { invoiceId });
      return json({ invoiceId, number, pdfQueued: queued });
    },
  },
  {
    path: "/actions/orders/:id/resolve-review",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const id = idParam(req.routeParams?.id);
      const { note } = await parseBody(req, noteBody);
      const order = await resolveReview(req, id, note);
      return json({ ok: true, needsReview: order.needsReview ?? false });
    },
  },
  {
    path: "/actions/customers/:id/sign-out-everywhere",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      return json(await signOutEverywhere(req, idParam(req.routeParams?.id, "customer")));
    },
  },
];
