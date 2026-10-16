import { allow, json, siteRequest, tooMany } from "@/cms/lib/mamo/http";
import { findOrderByReference } from "@/cms/lib/mamo/orderView";
import { verifyReturnK } from "@/cms/lib/mamo/returnToken";
import { constantTimeEquals } from "@/cms/lib/mamo/verify";
import { checkReschedulePolicy } from "@/lib/bookingPolicy";
import type { Session } from "@/payload-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REF_RE = /^[A-Z0-9-]{4,20}$/;

const idOf = (value: unknown): string | null =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : null;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
): Promise<Response> {
  if (!allow(request, "orders-reschedule-options", 60, 60_000)) return tooMany();

  const reference = decodeURIComponent((await params).ref ?? "").toUpperCase();
  if (!REF_RE.test(reference)) return json({ reason: "not_found", message: "Invalid booking reference." }, 404);

  const url = new URL(request.url);
  const k = url.searchParams.get("k");
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();

  const req = await siteRequest(request);
  const order = await findOrderByReference(req, reference);
  if (!order) return json({ reason: "not_found", message: "Booking not found." }, 404);

  // Authenticate ownership
  const storedEmail = (order.contact?.email ?? "").trim().toLowerCase();
  const tokenValid = typeof k === "string" && verifyReturnK(reference, k);
  const emailValid = Boolean(email && storedEmail && constantTimeEquals(storedEmail, email));

  if (!tokenValid && !emailValid) {
    return json({ reason: "unauthorized", message: "Unable to verify booking ownership." }, 401);
  }

  if (order.status !== "confirmed") {
    return json(
      {
        eligible: false,
        reason: "not_confirmed",
        message: `Only confirmed bookings can be rescheduled (this booking is ${order.status}).`,
      },
      409,
    );
  }

  const sessionLines = (order.lines ?? []).filter((l) => l.kind === "session");
  if (sessionLines.length !== 1) {
    return json(
      {
        eligible: false,
        reason: "multiple_sessions",
        message: "This booking covers several sessions. Please contact our team to reschedule individual sessions.",
      },
      400,
    );
  }

  const currentLine = sessionLines[0];
  const currentSessionId = idOf(currentLine.session);
  if (!currentSessionId) {
    return json({ eligible: false, reason: "invalid_session", message: "Could not identify the booked session." }, 400);
  }

  // Check policy
  const policy = checkReschedulePolicy(currentLine.startsAt);
  if (!policy.eligible) {
    return json({
      eligible: false,
      reason: "policy_restricted",
      message: policy.message,
      policyNote: policy.policyNote,
      exceptionNote: policy.exceptionNote,
      noticeHours: policy.noticeHours,
    });
  }

  // Load current session to find experience
  const currentSession = (await req.payload.findByID({
    collection: "sessions",
    id: currentSessionId,
    depth: 1,
    overrideAccess: true,
    req,
  })) as Session | null;

  if (!currentSession) {
    return json({ eligible: false, reason: "session_not_found", message: "Session record not found." }, 404);
  }

  const experienceId = idOf(currentSession.experience);
  if (!experienceId) {
    return json({ eligible: false, reason: "experience_not_found", message: "Workshop details not found." }, 400);
  }

  // Query eligible sessions of the same experience
  const sessionsResult = await req.payload.find({
    collection: "sessions",
    where: {
      and: [
        { experience: { equals: experienceId } },
        { id: { not_equals: currentSessionId } },
        { _status: { equals: "published" } },
        { startsAt: { greater_than: new Date().toISOString() } },
        { cancelledAt: { exists: false } },
        { bookingStatus: { equals: "open" } },
      ],
    },
    depth: 1,
    sort: "startsAt",
    limit: 50,
    overrideAccess: true,
    req,
  });

  const seatsNeeded = currentLine.qty;
  // Requirement 2: Display only eligible sessions with available seats.
  const eligibleSessions = (sessionsResult.docs as Session[])
    .filter((s) => {
      const avail = typeof s.seatsAvailable === "number" ? s.seatsAvailable : 0;
      return avail >= seatsNeeded;
    })
    .map((s) => {
      const venueObj = s.venue && typeof s.venue === "object" ? (s.venue as { name?: string }) : null;
      return {
        id: s.id,
        title: s.title || currentSession.title,
        startsAt: s.startsAt,
        durationMinutes: s.durationMinutes,
        venueName: venueObj?.name ?? null,
        availableSeats: typeof s.seatsAvailable === "number" ? s.seatsAvailable : 0,
        priceFils: s.priceFils,
      };
    });

  return json({
    eligible: true,
    noticeHours: policy.noticeHours,
    isPreferredNotice: policy.noticeHours >= 48,
    policyMessage: policy.message,
    policyNote: policy.policyNote,
    seatsNeeded,
    currentSession: {
      id: currentSessionId,
      title: currentLine.title,
      startsAt: currentLine.startsAt,
      durationMinutes: currentLine.durationMinutes,
      venueName: currentLine.venueName,
    },
    sessions: eligibleSessions,
  });
}
