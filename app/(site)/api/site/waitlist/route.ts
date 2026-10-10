import { z } from "zod";

import { joinWaitlist, NotImplemented } from "@/cms/lib/contracts";
import { clientIp, ipHash, rateLimit } from "@/cms/lib/rateLimit";
import { getBookingGate, localRequest } from "@/lib/booking";
import { getCms } from "@/lib/cms/payload";

/**
 * ==========================================================================
 * POST /api/site/waitlist — join the queue for a full session (SPEC §H.11)
 * ==========================================================================
 *
 * `{ sessionSlug, name, email, phone?, qty, website? }` from <WaitlistForm>.
 *
 * In order, each step refusing before the next costs anything:
 *   1. `Sec-Fetch-Site: cross-site` → 403; anything but JSON → 415 (a plain
 *      HTML form on another site cannot send JSON).
 *   2. 5 per hour per hashed IP → 429 (SPEC §H rate table).
 *   3. Body ≤ 8 KB, then zod.
 *   4. The honeypot (`website`) filled → the same 200 a person gets, and
 *      nothing stored: a waitlist row is an email promise, and a script has
 *      no inbox to keep it to.
 *   5. Bookings must be open, and the session published, not started, not
 *      closed by its editor, and actually full or on waitlist — otherwise
 *      there is nothing to queue for.
 *   6. `joinWaitlist` (cms/lib/waitlist.ts, 3A-1) under
 *      `context.viaWaitlistEndpoint` — the only way an anonymous create
 *      passes `waitlist.access.create`. One row per session + email; a
 *      repeat updates `qty`; the answer is the position in the queue. The
 *      customer acknowledgement and the staff alert are its hooks'.
 *
 * Responses: `{ status: "ok", position }` · `{ status: "invalid", field?,
 * message }` · `{ status: "closed" }` · `{ status: "rate_limited" }` ·
 * `{ status: "unavailable" | "error" }`. Nothing stored is echoed back.
 */

export const dynamic = "force-dynamic";

const LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 } as const;
const MAX_BODY_BYTES = 8 * 1024;

const singleLine = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(z.string().max(max));

const WaitlistBody = z.object({
  sessionSlug: z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/, "Unknown session."),
  name: singleLine(120).pipe(z.string().min(1, "Please tell us your name.")),
  email: z.string().trim().toLowerCase().pipe(z.email("Please check this email address.").max(254)),
  phone: singleLine(32)
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || (value.match(/\d/g)?.length ?? 0) >= 7, "Please check this number, or leave it blank."),
  qty: z.coerce.number().int().min(1, "Choose at least one place.").max(12, "Choose up to 12 places."),
  website: z.string().max(500).optional(),
});

const reply = (status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

export async function POST(request: Request): Promise<Response> {
  const headers = request.headers;
  if (headers.get("sec-fetch-site") === "cross-site") return reply(403, { status: "forbidden" });
  if (!(headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    return reply(415, { status: "invalid", message: "Send the form as JSON." });
  }

  const hashedIp = ipHash(clientIp(headers));
  if (!rateLimit("waitlist", hashedIp, LIMIT)) {
    return reply(429, { status: "rate_limited" }, { "retry-after": "3600" });
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return reply(413, { status: "invalid", message: "That request is too long." });
    raw = JSON.parse(text);
  } catch {
    return reply(400, { status: "invalid", message: "The form could not be read. Please try again." });
  }
  const parsed = WaitlistBody.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return reply(400, { status: "invalid", field: issue?.path?.map(String).join(".") || undefined, message: issue?.message ?? "Please check the form." });
  }
  const body = parsed.data;

  // A script filled the hidden field: answered like a person, nothing kept.
  if (body.website?.trim()) return reply(200, { status: "ok" });

  try {
    const gate = await getBookingGate();
    if (!gate.open) return reply(409, { status: "closed" });

    const payload = await getCms();
    const found = await payload.find({
      collection: "sessions",
      where: { and: [{ slug: { equals: body.sessionSlug } }, { _status: { equals: "published" } }] },
      depth: 0,
      limit: 1,
    });
    const session = found.docs[0];
    const closesAt = session ? Date.parse(session.salesCloseAt ?? session.startsAt) : NaN;
    if (!session || !(closesAt > Date.now()) || session.bookingStatus === "closed") {
      return reply(409, { status: "closed" });
    }
    const seatsAvailable = typeof session.seatsAvailable === "number" ? session.seatsAvailable : session.seatsTotal;
    if (session.bookingStatus !== "waitlist" && seatsAvailable > 0) {
      return reply(409, { status: "invalid", message: "This date has places again — reload the page to book one." });
    }

    const req = await localRequest({ viaWaitlistEndpoint: true });
    const { position } = await joinWaitlist(req, {
      sessionId: session.id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      qty: body.qty,
      meta: { ipHash: hashedIp, userAgent: (headers.get("user-agent") ?? "").slice(0, 300) },
    });
    return reply(200, { status: "ok", position });
  } catch (error) {
    if (error instanceof NotImplemented) return reply(503, { status: "unavailable" });
    // No body fields, no email: only that it failed.
    console.error("[waitlist] could not add to the waitlist");
    return reply(500, { status: "error" });
  }
}
