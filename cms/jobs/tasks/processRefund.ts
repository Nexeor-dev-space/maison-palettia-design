import type { PayloadRequest } from "payload";

import { notifyStaff, syncRefunds, type MamoPayment, type Order, type Refund } from "@/cms/lib/contracts";
import type { Payment } from "@/payload-types";

import { findPriorRefund, formatFils, isDefiniteRejection, mamoAmountToFils, scrubError } from "../logic";
import { adminLink, defineTask, gatewayFor, idOf, mamoErrorStatus, runSql, sql } from "../shared";

/**
 * ==========================================================================
 * process-refund — send an approved refund to Mamo, at most once (§H.7)
 * ==========================================================================
 *
 * Mamo has no `Idempotency-Key` on refunds (research 02 §A10), so "never
 * refund twice" is built from three things, in this order:
 *
 *   (a) THE CLAIM. One guarded statement moves the row `approved →
 *       processing` and stamps `providerRequestAt`. If the row is not
 *       `approved` (already processing, done, failed, or a desk refund) the
 *       task exits. A `processing` row is NEVER re-posted — not by a retry,
 *       not by the Retry button: only `syncRefunds` (webhook or the
 *       reconciler) resolves it, from what Mamo reports.
 *   (b) LOOK BEFORE POSTING. GET the payment; a refund of the same amount
 *       created at or after `providerRequestAt − 2 min`, not already
 *       claimed by another of our rows, is recorded instead of posting.
 *   (c) POST once. A clear refusal (4xx: over the refundable amount, below
 *       AED 1, …) marks the row `failed` and tells staff. Anything ambiguous
 *       (timeout, 5xx) leaves it `processing`: Mamo may have done it, and the
 *       reconciler will see the refund on the payment if so.
 *
 * Then (d): GET the payment again and hand it to `syncRefunds` (3A-1),
 * which records success and does the consequences — credit note, tickets
 * void, seats back when `releaseSeats`, `order_refunded` email, staff alert.
 *
 * `retries: 0` on purpose (§H.9): a retry could only re-enter at (a) and
 * exit, so it would add nothing but noise. Exclusive per payment
 * (`payment:<id>`), so two refunds of one payment are never in flight
 * together — Mamo's `max_refund_amount` is only meaningful one at a time.
 *
 * When nothing has been sent to Mamo yet (gateway off, no payment id, GET
 * failed), the row is put back to `approved` so an admin can simply press
 * Retry on the job once the cause is fixed.
 */

type RefundRow = Pick<Refund, "id" | "amountFils" | "status" | "providerRefundId" | "reason"> & { payment?: unknown; order?: unknown };
type PaymentRow = Pick<Payment, "id" | "provider" | "providerPaymentId" | "mode" | "order">;

const json = (value: unknown) => sql`${JSON.stringify(value)}::jsonb`;

/**
 * Column-scoped writes on our refund row. NOT `payload.update`: that rewrites
 * the whole row from a read taken before it waits for the row lock, so while
 * a concurrent webhook completes the same refund (status, credit note link)
 * it would put the old values back — the credit-note link was lost exactly
 * this way in the Phase 3 e2e. These touch only the columns they name.
 */
async function noteResponse(req: PayloadRequest, refundId: string, response: Record<string, unknown>): Promise<void> {
  await runSql(req, sql`UPDATE refunds SET provider_response = ${json(response)}, updated_at = now() WHERE id = ${refundId}`);
}
async function pinProviderRefund(req: PayloadRequest, refundId: string, providerRefundId: string, response?: Record<string, unknown>): Promise<void> {
  await runSql(req, sql`
    UPDATE refunds
       SET provider_refund_id = ${providerRefundId},
           provider_response = COALESCE(${response ? json(response) : sql`NULL`}, provider_response),
           updated_at = now()
     WHERE id = ${refundId} AND provider_refund_id IS NULL`);
}

/** processing → approved, when nothing reached Mamo. */
async function putBack(req: PayloadRequest, refundId: string): Promise<void> {
  await runSql(req, sql`
    UPDATE refunds SET status = 'approved', provider_request_at = NULL, updated_at = now()
     WHERE id = ${refundId} AND status = 'processing'`);
}

/** processing → failed, with what Mamo (or our guard) said. */
async function markFailed(req: PayloadRequest, refundId: string, response: Record<string, unknown>): Promise<void> {
  await runSql(req, sql`
    UPDATE refunds SET status = 'failed', provider_response = ${json(response)}, updated_at = now()
     WHERE id = ${refundId} AND status = 'processing'`);
}

async function tellStaffFailed(req: PayloadRequest, refund: RefundRow, order: Pick<Order, "id" | "reference">, reason: string): Promise<void> {
  try {
    await notifyStaff(
      req,
      "refund",
      {
        outcome: "failed",
        reference: order.reference,
        amount: formatFils(refund.amountFils),
        reason,
        creditNoteNumber: "none — the refund did not go through",
        links: { admin: await adminLink(req, `collections/refunds/${refund.id}`) },
      },
      { order: String(order.id), refund: String(refund.id) },
    );
  } catch (error) {
    req.payload.logger.error({ msg: "process-refund: could not alert staff", error: scrubError(error) });
  }
}

export const processRefundTask = defineTask({
  slug: "process-refund",
  label: "Process refund",
  retries: 0,
  concurrency: ({ input }) => `payment:${input.paymentId}`,
  inputSchema: [
    { name: "refundId", type: "text", required: true },
    { name: "paymentId", type: "text", required: true },
    { name: "orderId", type: "text", required: true },
  ],
  alert: "job",
  alertRefs: (input) => ({ order: input.orderId, refund: input.refundId }),
  run: async ({ input, req }) => {
    // (a) The claim — the only statement that may start a refund.
    const claimed = await runSql<{ provider_request_at: unknown }>(
      req,
      sql`UPDATE refunds SET status = 'processing', provider_request_at = now(), updated_at = now()
           WHERE id = ${input.refundId} AND status = 'approved'
       RETURNING provider_request_at`,
    );
    if (claimed.length === 0) return { outcome: "skipped", reason: "not_approved" };
    const requestAt = new Date(String(claimed[0].provider_request_at));

    const refund = (await req.payload.findByID({ collection: "refunds", id: input.refundId, depth: 0, overrideAccess: true, req })) as RefundRow;
    const paymentId = input.paymentId || idOf(refund.payment);
    const orderId = input.orderId || idOf(refund.order);
    if (!paymentId || !orderId) {
      await putBack(req, input.refundId);
      throw new Error("The refund has no payment or order; nothing was sent to Mamo.");
    }
    const payment = (await req.payload.findByID({ collection: "payments", id: paymentId, depth: 0, overrideAccess: true, req })) as PaymentRow;
    const order = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req })) as Order;

    // The refund must come out of its OWN order's payment. A row pointing at another order's payment
    // (written by a bug or a hand-made request) would move a different customer's money: refused for good.
    if (idOf(payment.order) !== orderId || idOf(refund.order) !== orderId) {
      const reason = "This refund points at a payment of another booking; nothing was sent to Mamo.";
      await markFailed(req, refund.id, { refused: "payment_order_mismatch", reason, paymentOrder: idOf(payment.order) ?? null });
      await tellStaffFailed(req, refund, order, reason);
      return { outcome: "refused", reason };
    }

    // Desk money is handed back at the desk and closed with "Mark repaid" — never through Mamo.
    if (payment.provider === "desk" || refund.providerRefundId === "desk") {
      await runSql(req, sql`UPDATE refunds SET status = 'requested', provider_request_at = NULL, updated_at = now() WHERE id = ${refund.id} AND status = 'processing'`);
      return { outcome: "skipped", reason: "desk_refund" };
    }
    if (!payment.providerPaymentId) {
      await putBack(req, refund.id);
      throw new Error("The payment has no Mamo payment id; nothing was sent to Mamo.");
    }
    const gateway = await gatewayFor(req, payment.mode);
    if (!gateway) {
      await putBack(req, refund.id);
      throw new Error(`Payments in ${payment.mode} mode are not available right now (Settings → Payments); nothing was sent to Mamo.`);
    }

    // (b) Look before posting.
    let before: MamoPayment;
    try {
      before = await gateway.getPayment(payment.providerPaymentId);
    } catch (error) {
      await putBack(req, refund.id);
      throw error;
    }
    const others = await req.payload.find({
      collection: "refunds",
      where: { and: [{ payment: { equals: payment.id } }, { id: { not_equals: refund.id } }, { providerRefundId: { exists: true } }] },
      limit: 100,
      depth: 0,
      overrideAccess: true,
      req,
    });
    const claimedIds = new Set((others.docs as RefundRow[]).map((r) => String(r.providerRefundId ?? "")).filter(Boolean));
    const prior = findPriorRefund({ refunds: before.refunds, amountFils: refund.amountFils, requestAt, claimedIds });
    if (prior) {
      await pinProviderRefund(req, refund.id, String(prior.id), { foundExisting: true, refund: prior });
      await syncRefunds(req, order, before);
      return { outcome: "found_existing", providerRefundId: String(prior.id) };
    }

    // Our own guards, with the live figure from Mamo (§H.7: ≤ max_refund_amount, ≥ AED 1).
    const maxFils = mamoAmountToFils(before.max_refund_amount);
    if (refund.amountFils < 100 || (maxFils !== null && refund.amountFils > maxFils)) {
      const reason =
        refund.amountFils < 100
          ? "Mamo cannot refund less than AED 1."
          : `Only ${formatFils(maxFils ?? 0)} of this payment can still be refunded.`;
      await markFailed(req, refund.id, { refused: "guard", reason, maxRefundFils: maxFils });
      await tellStaffFailed(req, refund, order, reason);
      return { outcome: "refused", reason };
    }

    // (c) Post once.
    const amountAed = Number((refund.amountFils / 100).toFixed(2));
    try {
      const response = await gateway.refund(payment.providerPaymentId, amountAed);
      await noteResponse(req, refund.id, { refund_amount: response.refund_amount, refund_status: response.refund_status, at: new Date().toISOString() });
    } catch (error) {
      const status = mamoErrorStatus(error);
      const messages = (error as { messages?: string[] }).messages ?? [];
      if (isDefiniteRejection(status)) {
        const reason = messages.join("; ") || `Mamo refused the refund (${status}).`;
        await markFailed(req, refund.id, { status, errorCode: (error as { errorCode?: string }).errorCode, messages });
        await tellStaffFailed(req, refund, order, reason);
        return { outcome: "rejected", status };
      }
      // Ambiguous: Mamo may have done it. Stay `processing`; syncRefunds settles it from Mamo's record.
      await noteResponse(req, refund.id, { ambiguous: true, status: status ?? null, error: scrubError(error), at: new Date().toISOString() }).catch(() => undefined);
      throw error;
    }

    // (d) Let syncRefunds record what Mamo now says; the reconciler repeats this if it fails here.
    // Mamo's POST answers without a refund id, so the new entry is identified here (same rule as
    // (b)) and pinned on our row first — syncRefunds then matches it by id, not by amount and time.
    try {
      const after = await gateway.getPayment(payment.providerPaymentId);
      const posted = findPriorRefund({ refunds: after.refunds, amountFils: refund.amountFils, requestAt, claimedIds });
      if (posted) {
        await pinProviderRefund(req, refund.id, String(posted.id));
      }
      await syncRefunds(req, order, after);
    } catch (error) {
      req.payload.logger.warn({ msg: "process-refund: posted; sync deferred to the reconciler", refundId: refund.id, error: scrubError(error) });
    }
    return { outcome: "posted", amountAed };
  },
});
