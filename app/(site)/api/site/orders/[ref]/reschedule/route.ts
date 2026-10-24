import { allow, isCrossSite, json, readJson, siteRequest, tooMany } from "@/cms/lib/mamo/http";
import { customerView, findOrderByReference } from "@/cms/lib/mamo/orderView";
import { verifyReturnK } from "@/cms/lib/mamo/returnToken";
import { constantTimeEquals } from "@/cms/lib/mamo/verify";
import { SoldOut } from "@/cms/lib/inventory";
import { CheckoutError, moveOrder } from "@/cms/lib/orders";
import { checkReschedulePolicy } from "@/lib/bookingPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REF_RE = /^[A-Z0-9-]{4,20}$/;
const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
): Promise<Response> {
  if (!allow(request, "orders-reschedule", 10, 3_600_000)) return tooMany();
  if (isCrossSite(request)) return json({ reason: "forbidden" }, 403);

  const reference = decodeURIComponent((await params).ref ?? "").toUpperCase();
  if (!REF_RE.test(reference)) return json({ reason: "not_found", message: "Invalid booking reference." }, 404);

  const raw = await readJson(request, 2048);
  const body = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}) as {
    email?: string;
    k?: string;
    targetSessionId?: string;
    note?: string;
  };

  const targetSessionId = typeof body.targetSessionId === "string" ? body.targetSessionId.trim() : "";
  if (!UUID_RE.test(targetSessionId)) {
    return json({ reason: "invalid_session", message: "Please select a valid new session date." }, 400);
  }

  const req = await siteRequest(request);
  const order = await findOrderByReference(req, reference);
  if (!order) return json({ reason: "not_found", message: "Booking not found." }, 404);

  // Authenticate ownership
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
        message: `Only confirmed bookings can be rescheduled (this booking is ${order.status}).`,
      },
      409,
    );
  }

  const sessionLines = (order.lines ?? []).filter((l) => l.kind === "session");
  if (sessionLines.length !== 1) {
    return json(
      {
        reason: "multiple_sessions",
        message: "This booking covers several sessions. Please contact our team to reschedule individual sessions.",
      },
      400,
    );
  }

  // Validate policy notice
  const policy = checkReschedulePolicy(sessionLines[0].startsAt);
  if (!policy.eligible) {
    return json(
      {
        reason: "policy_restricted",
        message: policy.message,
        exceptionNote: policy.exceptionNote,
      },
      409,
    );
  }

  try {
    const updatedOrder = await moveOrder(req, order.id, {
      targetSessionId,
      priceDifference: "no_charge",
      note: body.note ? `Customer reschedule: ${body.note}` : "Customer self-service reschedule",
      actor: "customer",
    });

    const updatedView = await customerView(req, updatedOrder);
    return json({
      ok: true,
      reference,
      status: "confirmed",
      isRescheduled: true,
      message: "Your booking has been successfully rescheduled.",
      orderView: updatedView,
    });
  } catch (error) {
    if (error instanceof SoldOut) {
      return json(
        {
          reason: "sold_out",
          message: "The selected session no longer has enough seats available. Please select another date and time.",
        },
        409,
      );
    }
    if (error instanceof CheckoutError) {
      return json({ reason: error.reason, message: error.message }, error.status);
    }
    return json(
      {
        reason: "error",
        message: error instanceof Error ? error.message : "We could not reschedule your booking. Please try again.",
      },
      500,
    );
  }
}
