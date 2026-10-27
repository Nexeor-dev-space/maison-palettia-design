import { allow, isCrossSite, json, readJson, siteRequest, tooMany } from "@/cms/lib/mamo/http";
import { customerView, findOrderByReference } from "@/cms/lib/mamo/orderView";
import { verifyReturnK } from "@/cms/lib/mamo/returnToken";
import { constantTimeEquals } from "@/cms/lib/mamo/verify";
import { cancelOrder } from "@/cms/lib/orders";
import { checkCancellationPolicy } from "@/lib/bookingPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REF_RE = /^[A-Z0-9-]{4,20}$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
): Promise<Response> {
  if (!allow(request, "orders-cancel", 10, 3_600_000)) return tooMany();
  if (isCrossSite(request)) return json({ reason: "forbidden" }, 403);

  const reference = decodeURIComponent((await params).ref ?? "").toUpperCase();
  if (!REF_RE.test(reference)) return json({ reason: "not_found", message: "Invalid booking reference." }, 404);

  const raw = await readJson(request, 2048);
  const body = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}) as {
    email?: string;
    k?: string;
    reason?: string;
    note?: string;
  };

  const req = await siteRequest(request);
  const order = await findOrderByReference(req, reference);
  if (!order) return json({ reason: "not_found", message: "Booking not found." }, 404);

  // Authenticate ownership via valid return token `k` OR matching email
  const storedEmail = (order.contact?.email ?? "").trim().toLowerCase();
  const inputEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const tokenValid = typeof body.k === "string" && verifyReturnK(reference, body.k);
  const emailValid = Boolean(inputEmail && storedEmail && constantTimeEquals(storedEmail, inputEmail));

  if (!tokenValid && !emailValid) {
    return json({ reason: "unauthorized", message: "Unable to verify booking ownership." }, 401);
  }

  if (order.status !== "confirmed") {
    return json(
      {
        reason: "not_cancellable",
        message: `Only confirmed bookings can be cancelled (this booking is ${order.status}).`,
      },
      409,
    );
  }

  const sessionLines = (order.lines ?? []).filter((l) => l.kind === "session");
  if (sessionLines.length === 0) {
    return json(
      { reason: "no_session", message: "This booking does not contain any workshop sessions to cancel." },
      400,
    );
  }

  // Validate policy using the session start time
  const policy = checkCancellationPolicy(sessionLines[0].startsAt);
  if (!policy.eligible) {
    return json(
      {
        reason: "policy_restricted",
        message: policy.message,
        exceptionNote: policy.exceptionNote,
      },
      400,
    );
  }

  const isNonRefundable = !policy.refundEligible;
  const reasonText =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : isNonRefundable
        ? "Customer cancelled online (< 24h notice)"
        : "Customer cancelled online";
  const noteText = typeof body.note === "string" ? body.note.trim() : undefined;

  try {
    const result = await cancelOrder(req, order.id, {
      reason: reasonText,
      note: noteText,
      nonRefundable: isNonRefundable,
      actor: "customer",
    });

    const updatedOrder = await findOrderByReference(req, reference);
    const updatedView = updatedOrder ? await customerView(req, updatedOrder) : null;

    return json({
      ok: true,
      reference,
      status: "cancelled",
      refundStatus: isNonRefundable ? "non_refundable" : result.refundId ? "refunded" : "none",
      message: isNonRefundable
        ? "Your booking has been cancelled. As this request was made less than 24 hours before the session, it is non-refundable under our Cancellation & Rescheduling policy."
        : "Your booking has been cancelled and a full refund has been requested to your original payment method.",
      orderView: updatedView,
    });
  } catch (error) {
    return json(
      {
        reason: "error",
        message: error instanceof Error ? error.message : "We could not cancel your booking. Please try again.",
      },
      500,
    );
  }
}
