import { APIError, type Endpoint } from "payload";
import { z } from "zod";

import { cancelSession, repeatSession, rescheduleSession } from "@/cms/lib/contracts";
import { attendeesCsv } from "@/cms/lib/tickets";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Session actions — repeat, reschedule, cancel & refund all, attendees (§H.7)
 * ==========================================================================
 *
 * The buttons on a session (`SessionActions`). Every handler starts with
 * `requireRole` (which also refuses `Sec-Fetch-Site: cross-site`) and
 * validates its body with zod; the work is in cms/lib/orders.ts.
 *
 *   POST /actions/sessions/:id/repeat          admin, editor       { every: "weekly", until, weekdays[] } → drafts for review
 *   POST /actions/sessions/:id/reschedule      admin               { startsAt, venueId?, message? } → holders emailed, old URL redirected
 *   POST /actions/sessions/:id/cancel          admin               { reason, message? } → refunds queued, tickets void, emails
 *   GET  /actions/sessions/:id/attendees.csv   admin, front-desk   printable list (3E builds the rows)
 *
 * Reschedule is the only way to move a date once seats are sold (the
 * sessions `beforeChange` refuses a direct edit and points here), because
 * it is the path that also tells the ticket holders.
 */

const uuid = z.string().regex(/^[0-9a-f-]{36}$/i, "Unknown id.");
const isoDate = z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), "Not a date.");

const repeatBody = z.object({
  every: z.literal("weekly"),
  until: isoDate,
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one weekday.").max(7),
});

const rescheduleBody = z.object({
  startsAt: isoDate,
  venueId: uuid.optional(),
  message: z.string().trim().max(1000).optional(),
});

const cancelBody = z.object({
  reason: z.string().trim().min(3, "Say why the session is cancelled (customers see it).").max(200),
  message: z.string().trim().max(1000).optional(),
});

const idParam = (value: unknown): string => {
  const id = typeof value === "string" ? value : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new APIError("Unknown session.", 404, undefined, true);
  return id;
};

export const adminSessionsEndpoints: Endpoint[] = [
  {
    path: "/actions/sessions/:id/repeat",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "editor"]);
      const id = idParam(req.routeParams?.id);
      const body = await parseBody(req, repeatBody);
      return json(await repeatSession(req, id, body));
    },
  },
  {
    path: "/actions/sessions/:id/reschedule",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const id = idParam(req.routeParams?.id);
      const body = await parseBody(req, rescheduleBody);
      return json(await rescheduleSession(req, id, body));
    },
  },
  {
    path: "/actions/sessions/:id/cancel",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const id = idParam(req.routeParams?.id);
      const body = await parseBody(req, cancelBody);
      return json(await cancelSession(req, id, body));
    },
  },
  {
    path: "/actions/sessions/:id/attendees.csv",
    method: "get",
    handler: async (req) => {
      requireRole(req, ["admin", "front-desk"]);
      const csv = await attendeesCsv(req, idParam(req.routeParams?.id));
      if (!csv) throw new APIError("Unknown session.", 404, undefined, true);
      return new Response(csv.body, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${csv.filename.replace(/[^A-Za-z0-9._-]/g, "_")}"`,
          "cache-control": "no-store",
        },
      });
    },
  },
];
