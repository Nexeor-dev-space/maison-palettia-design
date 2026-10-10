import { APIError, type Endpoint } from "payload";
import { z } from "zod";

import { NotImplemented, rateLimit, renderSampleTicketPdf } from "@/cms/lib/contracts";
import { checkIn, isDubaiDate, dubaiDate, listAttendees, sessionsForDay, undoCheckIn } from "@/cms/lib/tickets";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Ticket actions — check-in, undo, attendee list, day sheet, sample PDF
 * ==========================================================================
 *
 * Paths are relative to `/api/` (so `/api/actions/tickets/check-in`). Every
 * handler's first statement is `requireRole` (SPEC §A.2 rule 2), which also
 * refuses `Sec-Fetch-Site: cross-site`; bodies are validated with zod.
 *
 *   POST /actions/tickets/check-in           admin, front-desk   { qr | code, device, force? } → verdict
 *   POST /actions/tickets/:id/undo-check-in  admin               { note } → back to "valid", timeline line
 *   GET  /actions/tickets/attendees?session= admin, front-desk   the attendee list as JSON
 *   GET  /actions/tickets/day?date=          admin, front-desk   a Dubai day's sessions with sold / arrived
 *   POST /actions/tickets/preview            admin, editor       { heading, instructions } → sample ticket PDF
 *
 * The check-in response is a projection of `checkIn()`: it never carries
 * the ticket's `qr` or `qrSig` (the lib strips them, and the response is
 * built field by field so a future field cannot leak by accident).
 *
 * The attendee CSV (`GET /actions/sessions/{id}/attendees.csv`) is a session
 * action and lives in admin-sessions.ts (3A-1); it calls `attendeesCsv()`
 * from cms/lib/tickets.ts.
 */

const checkInBody = z
  .object({
    qr: z.string().trim().min(1).max(200).optional(),
    code: z.string().trim().min(1).max(40).optional(),
    device: z.enum(["camera", "manual", "list"]),
    force: z.boolean().optional(),
  })
  .refine((b) => Boolean(b.qr || b.code), { message: "Scan a QR code or type a ticket code." });

const undoBody = z.object({
  note: z.string().trim().min(3, "Say why the check-in is being undone (at least 3 characters).").max(500),
});

const previewBody = z.object({
  heading: z.string().max(60).default(""),
  instructions: z.string().max(300).default(""),
});

const idParam = (value: unknown): string => {
  const id = typeof value === "string" ? value : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new APIError("Unknown ticket or session.", 404, undefined, true);
  return id;
};

export const ticketsEndpoints: Endpoint[] = [
  {
    path: "/actions/tickets/check-in",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      // Generous for a busy door, tight enough that a stolen session cannot walk the code space.
      if (!rateLimit("check-in", String(req.user.id), { limit: 240, windowMs: 60_000 })) {
        throw new APIError("Too many scans in a minute — wait a moment and try again.", 429, undefined, true);
      }
      const body = await parseBody(req, checkInBody);
      const r = await checkIn(req, { qr: body.qr, code: body.code, device: body.device, force: body.force });
      return json({
        verdict: r.verdict,
        forced: r.forced ?? false,
        forceable: r.forceable ?? false,
        code: r.code ?? null,
        ticketId: r.ticketId ?? null,
        orderId: r.orderId ?? null,
        orderReference: r.orderReference ?? null,
        sessionId: r.sessionId ?? null,
        sessionTitle: r.sessionTitle ?? null,
        sessionStartsAt: r.sessionStartsAt ?? null,
        window: r.window ?? null,
        holder: r.holder ?? null,
        seatNo: r.seatNo ?? null,
        qty: r.qty ?? null,
        remainingOnOrder: r.remainingOnOrder ?? null,
        checkedInAt: r.checkedInAt ?? null,
        checkedInByName: r.checkedInByName ?? null,
      });
    },
  },
  {
    path: "/actions/tickets/:id/undo-check-in",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const id = idParam(req.routeParams?.id);
      const { note } = await parseBody(req, undoBody);
      const undone = await undoCheckIn(req, id, note);
      return json({ undone });
    },
  },
  {
    path: "/actions/tickets/attendees",
    method: "get",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      const sessionId = idParam(req.searchParams.get("session"));
      const { session, rows } = await listAttendees(req, sessionId);
      if (!session) throw new APIError("Unknown session.", 404, undefined, true);
      return json({ sessionId, rows });
    },
  },
  {
    path: "/actions/tickets/day",
    method: "get",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      const date = req.searchParams.get("date");
      const day = isDubaiDate(date) ? date : dubaiDate();
      return json({ date: day, sessions: await sessionsForDay(req, day) });
    },
  },
  {
    path: "/actions/tickets/preview",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "editor"]);
      const body = await parseBody(req, previewBody);
      try {
        const pdf = await renderSampleTicketPdf(req, body);
        return new Response(new Uint8Array(pdf), {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": 'inline; filename="sample-ticket.pdf"',
            "cache-control": "no-store",
          },
        });
      } catch (error) {
        if (error instanceof NotImplemented) throw new APIError("The ticket PDF is not available yet.", 501, undefined, true);
        throw error;
      }
    },
  },
];
