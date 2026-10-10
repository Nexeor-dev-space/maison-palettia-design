import { allow, json, siteRequest, tooMany } from "@/cms/lib/mamo/http";
import { applyReturnTransaction, customerView, findOrderByReference, minimalStatus } from "@/cms/lib/mamo/orderView";
import { verifyReturnK } from "@/cms/lib/mamo/returnToken";

/**
 * ==========================================================================
 * GET /api/site/orders/{ref}/status[?k=…][&transactionId=…]
 * ==========================================================================
 *
 * What /payment-success (and /checkout?payment=failed) poll every 3 s for
 * up to 3 minutes after the customer comes back from Mamo (SPEC §H.5):
 *
 *   · without `k`           `{ status, holdExpiresAt }` and nothing else —
 *                           a reference alone is not proof of anything;
 *   · with a valid `k`      the full customer view (lines, totals, tickets,
 *                           `invoiceAvailable`, the decline text on a
 *                           failed attempt) — cms/lib/mamo/orderView.ts;
 *   · `k` + `transactionId` (Mamo appends it to the return URL) and the
 *                           order still unpaid: ask Mamo about that payment
 *                           directly and apply the verified answer, so the
 *                           page confirms without waiting for the webhook.
 *
 * An invalid or expired `k` is answered like no `k` (the page then shows
 * the minimal state and a "check your email" note) rather than 401, so a
 * stale link degrades instead of breaking. 120/min per hashed IP — the
 * poller needs 20. Unknown references are 404 with no detail.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REF_RE = /^[A-Z0-9-]{4,20}$/;

export async function GET(request: Request, { params }: { params: Promise<{ ref: string }> }): Promise<Response> {
  if (!allow(request, "orders-status", 120, 60_000)) return tooMany();
  const reference = decodeURIComponent((await params).ref ?? "").toUpperCase();
  if (!REF_RE.test(reference)) return json({ reason: "not_found" }, 404);

  const url = new URL(request.url);
  const k = url.searchParams.get("k");
  const transactionId = url.searchParams.get("transactionId");

  const req = await siteRequest(request);
  let order = await findOrderByReference(req, reference);
  if (!order) return json({ reason: "not_found" }, 404);

  if (!verifyReturnK(reference, k)) return json(minimalStatus(order));

  if (transactionId && order.status !== "confirmed" && order.status !== "confirming") {
    const result = await applyReturnTransaction(req, order, transactionId);
    if (result.applied) order = (await findOrderByReference(req, reference)) ?? order;
  }
  return json(await customerView(req, order));
}
