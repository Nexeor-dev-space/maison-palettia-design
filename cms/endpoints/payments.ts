import { APIError, type Endpoint, type PayloadRequest } from "payload";

import { applyPaymentSnapshot } from "@/cms/lib/contracts";
import { gatewayForMode, isDisabled, MamoApiError, type MamoPayment, type PaymentGateway } from "@/cms/lib/mamo/index";
import { refundableFils } from "@/cms/lib/mamo/refunds";
import type { Order, Payment } from "@/payload-types";

import { json, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Payment actions on one payment attempt (SPEC §H.4–H.7, §J)
 * ==========================================================================
 *
 * Paths are relative to `/api/`; `:id` is our `payments` row id, never a
 * Mamo id (so a guessed Mamo id is useless here). Every handler starts with
 * `requireRole` (which also refuses `Sec-Fetch-Site: cross-site`).
 *
 *   GET  /actions/payments/:id/refundable       admin, front-desk   live `max_refund_amount` in fils — the ceiling
 *                                                                    the Refund dialog and the refund request enforce
 *   POST /actions/payments/:id/recheck          admin, front-desk   ask Mamo now and apply what it says — the
 *                                                                    poller's work for one order, on demand
 *   POST /actions/payments/:id/deactivate-link  admin               kill the payment link (abandoned basket, fraud)
 *
 * Refund REQUESTS and APPROVALS are order actions (`orders/{id}/refund`,
 * `…/refunds/{id}/approve` in admin-orders.ts, 3A-1) and the POST to Mamo
 * is the `process-refund` job's (3D), through `postRefundOnce` in
 * cms/lib/mamo/refunds.ts. These endpoints are the gateway side those
 * screens need: what can still be refunded, and "re-check with Mamo".
 *
 * Each payment is talked to in the mode it was created in (`payments.mode`),
 * whatever Settings → Payments says today.
 */

const idParam = (value: unknown): string => {
  const id = typeof value === "string" ? value : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new APIError("Unknown payment.", 404, undefined, true);
  return id;
};

async function loadAttempt(req: PayloadRequest): Promise<{ attempt: Payment; gateway: PaymentGateway }> {
  const id = idParam(req.routeParams?.id);
  const attempt = (await req.payload
    .findByID({ collection: "payments", id, depth: 0, overrideAccess: true, disableErrors: true })
    .catch(() => null)) as Payment | null;
  if (!attempt) throw new APIError("Unknown payment.", 404, undefined, true);
  if (attempt.provider !== "mamo") throw new APIError("This is a desk payment; there is nothing to check with Mamo.", 400, undefined, true);
  const gateway = await gatewayForMode(req, attempt.mode);
  if (isDisabled(gateway)) throw new APIError(`The ${attempt.mode} gateway is not available (${gateway.reason}).`, 409, undefined, true);
  return { attempt, gateway };
}

const mamoFailure = (error: unknown): never => {
  if (error instanceof MamoApiError) {
    throw new APIError(`Mamo answered ${error.status || "nothing"}: ${error.messages.join("; ")}`, 502, undefined, true);
  }
  throw error;
};

async function refundable(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin", "front-desk"]);
  const { attempt, gateway } = await loadAttempt(req);
  if (!attempt.providerPaymentId) throw new APIError("This attempt was never paid, so there is nothing to refund.", 400, undefined, true);
  const live = await refundableFils(gateway, attempt.providerPaymentId).catch(mamoFailure);
  return json({
    ok: true,
    paymentId: attempt.id,
    status: live.status,
    maxRefundFils: live.maxRefundFils,
    refundedFils: live.refundedFils,
    refunds: (live.payment.refunds ?? []).map((r) => ({ id: r.id, amount: r.amount, createdDate: r.created_date ?? null })),
  });
}

async function recheck(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin", "front-desk"]);
  const { attempt, gateway } = await loadAttempt(req);
  const orderId = typeof attempt.order === "string" ? attempt.order : attempt.order.id;
  const order = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true })) as Order;

  // The payment itself when we know it; otherwise every charge made through
  // the link — the same primitive the poller uses for a lost webhook (§H.6).
  let payments: MamoPayment[] = [];
  try {
    if (attempt.providerPaymentId) payments = [await gateway.getPayment(attempt.providerPaymentId)];
    else if (attempt.providerLinkId) payments = (await gateway.getLink(attempt.providerLinkId)).charges;
  } catch (error) {
    mamoFailure(error);
  }
  if (!payments.length) return json({ ok: true, message: "Mamo has no payment on this link yet.", results: [] });

  const results: Array<{ paymentId: string; status: string; applied: boolean; reason?: string }> = [];
  for (const payment of payments) {
    const outcome = await applyPaymentSnapshot(req, order, payment, { source: "poller", mode: attempt.mode });
    results.push({ paymentId: payment.id, status: String(payment.status), ...outcome });
  }
  const applied = results.filter((r) => r.applied).length;
  return json({
    ok: true,
    message: applied ? `Applied ${applied} update(s) from Mamo.` : "Checked with Mamo: nothing new to apply.",
    results,
  });
}

async function deactivateLink(req: PayloadRequest): Promise<Response> {
  requireRole(req, ["admin"]);
  const { attempt, gateway } = await loadAttempt(req);
  if (!attempt.providerLinkId) throw new APIError("This attempt has no payment link.", 400, undefined, true);
  await gateway.deactivateLink(attempt.providerLinkId).catch(mamoFailure);
  await req.payload.update({
    collection: "payments",
    id: attempt.id,
    data: { linkDeactivatedAt: new Date().toISOString() },
    depth: 0,
    overrideAccess: true,
    req,
  });
  return json({ ok: true, message: "Payment link deactivated. The customer can no longer pay through it." });
}

export const paymentsEndpoints: Endpoint[] = [
  { path: "/actions/payments/:id/refundable", method: "get", handler: refundable },
  { path: "/actions/payments/:id/recheck", method: "post", handler: recheck },
  { path: "/actions/payments/:id/deactivate-link", method: "post", handler: deactivateLink },
];
