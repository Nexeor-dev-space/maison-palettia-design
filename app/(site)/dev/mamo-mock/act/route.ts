import { randomBytes } from "node:crypto";

import {
  completeMockPayment,
  deliverMockWebhook,
  mockLink,
  mockPayment,
  returnUrlFor,
  voidMockPayment,
  webhookBodyFor,
} from "@/cms/lib/mamo/mock";
import { allow } from "@/cms/lib/mamo/http";

/**
 * ==========================================================================
 * POST /dev/mamo-mock/act — the mock plays Mamo's part
 * ==========================================================================
 *
 * Form posts from the mock hosted page and the webhook poster
 * (app/(site)/dev/mamo-mock). Whatever the button, the effect reaches the
 * order the way Mamo's would: through an HTTP POST to our real webhook
 * receiver carrying the mock secret, which then verifies by fetching the
 * payment from the mock gateway. Nothing here touches an order directly.
 *
 *   pay | fail   create the payment (captured / declined), deliver
 *                `payment.succeeded` / `payment.failed`, 303 to the link's
 *                return / failure URL with Mamo's parameters appended
 *   pay_lost     pay, but "lose" the webhook — only the return URL carries
 *                the news, which exercises the return page's transactionId
 *                fast path and the reconcile-payments poller (SPEC §H.5–H.6)
 *   abandon      303 to the failure URL untouched (the customer pressed back)
 *   resend       deliver `eventType` for an existing payment again
 *                (duplicates must answer "duplicate")
 *   void         mark the payment voided, deliver `payment.voided`
 *   dispute      deliver a `dispute.received` (shape UNVERIFIED, as stored)
 *   unverified   deliver with a wrong secret → expect 401 + a minimal row
 *
 * The webhook is posted to THIS server's origin (the request's own URL) —
 * the mock is development-only, where that is localhost. 404 in
 * production; cross-site posts refused.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const see = (url: string) => new Response(null, { status: 303, headers: { location: url, "cache-control": "no-store" } });

export async function POST(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") return new Response("Not found.", { status: 404 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response("Forbidden.", { status: 403 });
  if (!allow(request, "dev-mamo-mock", 120, 60_000)) return new Response("Too many requests.", { status: 429 });

  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const origin = new URL(request.url).origin;
  const poster = (result: string) => see(`${origin}/dev/mamo-mock?result=${encodeURIComponent(result)}`);

  try {
    if (action === "pay" || action === "pay_lost" || action === "fail" || action === "abandon") {
      const link = mockLink(String(form.get("linkId") ?? ""));
      if (!link) return new Response("Unknown mock link.", { status: 404 });
      if (action === "abandon") return see(link.failure_return_url);

      const payment = completeMockPayment(link.id, action === "fail" ? "failed" : "captured");
      if (action === "pay_lost") return see(returnUrlFor(link, payment));
      const delivery = await deliverMockWebhook(origin, webhookBodyFor(payment, action === "pay" ? "payment.succeeded" : "payment.failed"));
      if (delivery.status !== 200) console.warn(`[mamo-mock] webhook answered ${delivery.status}: ${delivery.text}`);
      return see(returnUrlFor(link, payment));
    }

    if (action === "resend" || action === "void") {
      const id = String(form.get("paymentId") ?? "");
      const payment = action === "void" ? voidMockPayment(id) : mockPayment(id);
      if (!payment) return poster("unknown payment");
      const eventType = action === "void" ? "payment.voided" : String(form.get("eventType") ?? "payment.succeeded");
      if (!/^payment\.[a-z_]{1,40}$/.test(eventType)) return poster("bad event type");
      const delivery = await deliverMockWebhook(origin, webhookBodyFor(payment, eventType));
      return poster(`${eventType} for ${id} → ${delivery.status} ${delivery.text}`);
    }

    if (action === "dispute") {
      const payment = mockPayment(String(form.get("paymentId") ?? ""));
      if (!payment) return poster("unknown payment");
      const body = {
        id: `DSP-MOCK${randomBytes(4).toString("hex").toUpperCase()}`,
        event_type: "dispute.received",
        status: "needs_response",
        payment_id: payment.id,
        external_id: payment.external_id,
        payment_link_id: payment.payment_link_id,
        amount: payment.amount,
        reason: "fraudulent",
      };
      const delivery = await deliverMockWebhook(origin, body);
      return poster(`dispute.received for ${payment.id} → ${delivery.status} ${delivery.text}`);
    }

    if (action === "unverified") {
      const delivery = await deliverMockWebhook(origin, { id: "MPB-CHRG-FORGED", event_type: "payment.succeeded", status: "captured" }, "wrong");
      return poster(`unverified delivery → ${delivery.status} (expected 401)`);
    }
  } catch (error) {
    return poster(error instanceof Error ? error.message : "failed");
  }
  return poster("unknown action");
}
