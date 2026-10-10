import { fromMamoAmount, MIN_REFUND_FILS, toMamoAmount } from "../money";
import { MamoApiError, type MamoPayment, type PaymentGateway } from "./types";

/**
 * ==========================================================================
 * Refunds at the gateway — "look before you post"
 * ==========================================================================
 *
 * Mamo has no `Idempotency-Key` (research 02 §A10, UNVERIFIED that one is
 * planned), so a refund POST that timed out may or may not have happened,
 * and posting again could refund twice. SPEC §H.7 fixes the protocol the
 * `process-refund` job (3D) follows; steps (b) and (c) are gateway work and
 * live here so the job and any admin tool share one implementation:
 *
 *   (b) GET /payments/{id}; if `refunds[]` already holds an entry created at
 *       or after `providerRequestAt − 2 min` for the same amount, that IS
 *       our refund — return it, do not post;
 *   (c) otherwise POST /payments/{id}/refunds { amount } — once.
 *
 * `providerRequestAt` is stamped by the job BEFORE calling this, in its own
 * transaction (step a), which is what makes (b) meaningful on a retry.
 *
 * `created_date` is `YYYY-MM-DD-HH-MM-SS` with an UNVERIFIED timezone
 * (research 02 §A4). It is read as UTC; if Mamo turns out to send Dubai
 * time (UTC+4) the window below still contains it because the match is
 * "at or after start − 2 min", and a Dubai timestamp reads four hours LATER
 * than UTC, never earlier. TODO(mamo-verify): tighten once confirmed.
 */

export const REFUND_LOOKBACK_MS = 2 * 60_000;

/** `2026-10-10-14-38-53` → epoch ms (as UTC), or NaN. */
export function parseMamoDate(value: string | undefined | null): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return Number.NaN;
  const [, y, mo, d, h, mi, s] = match.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, s);
}

/** The refund on `payment` that a request made at `requestedAt` for `amountFils` produced, if Mamo already has it. */
export function findExistingRefund(
  payment: MamoPayment,
  amountFils: number,
  requestedAt: Date,
): { id: string; amount: number } | null {
  const since = requestedAt.getTime() - REFUND_LOOKBACK_MS;
  for (const refund of payment.refunds ?? []) {
    if (fromMamoAmount(refund.amount) !== amountFils) continue;
    const at = parseMamoDate(refund.created_date);
    // No usable date: an equal-amount refund we cannot place in time is
    // treated as ours — refusing to double-refund is the safe side.
    if (Number.isNaN(at) || at >= since) return { id: refund.id, amount: refund.amount };
  }
  return null;
}

export type RefundAttempt =
  | { kind: "already_posted"; providerRefundId: string; payment: MamoPayment }
  | { kind: "posted"; refundAmount: number; refundStatus: string; payment: MamoPayment };

/**
 * Steps (b) + (c). Throws `MamoApiError` for Mamo's refusals (422 "Can not
 * refund this payment", amount over `max_refund_amount`) and for network
 * failures — the job records them on the refund row; it never retries a
 * POST by itself (`retries: 0`, SPEC §H.9).
 */
export async function postRefundOnce(
  gateway: PaymentGateway,
  input: { providerPaymentId: string; amountFils: number; providerRequestAt: Date },
): Promise<RefundAttempt> {
  if (!Number.isInteger(input.amountFils) || input.amountFils < MIN_REFUND_FILS) {
    throw new MamoApiError(422, "VALIDATION_FAILED", ["Refunds must be at least AED 1.00."]);
  }
  const before = await gateway.getPayment(input.providerPaymentId);
  const existing = findExistingRefund(before, input.amountFils, input.providerRequestAt);
  if (existing) return { kind: "already_posted", providerRefundId: existing.id, payment: before };

  const max = before.max_refund_amount === undefined ? Number.POSITIVE_INFINITY : fromMamoAmount(before.max_refund_amount);
  if (input.amountFils > max) {
    throw new MamoApiError(422, "UNPROCESSABLE ENTITY", [`At most AED ${(max / 100).toFixed(2)} can still be refunded on this payment.`]);
  }
  const result = await gateway.refund(input.providerPaymentId, toMamoAmount(input.amountFils));
  return { kind: "posted", refundAmount: result.refund_amount, refundStatus: result.refund_status, payment: before };
}

/** What can still be refunded, in fils — the ceiling the Refund dialog shows (SPEC §H.7: "amount ≤ live max_refund_amount"). */
export async function refundableFils(gateway: PaymentGateway, providerPaymentId: string): Promise<{ maxRefundFils: number; refundedFils: number; status: string; payment: MamoPayment }> {
  const payment = await gateway.getPayment(providerPaymentId);
  return {
    maxRefundFils: payment.max_refund_amount === undefined ? 0 : fromMamoAmount(payment.max_refund_amount),
    refundedFils: payment.refund_amount === undefined ? 0 : fromMamoAmount(payment.refund_amount),
    status: String(payment.status),
    payment,
  };
}
