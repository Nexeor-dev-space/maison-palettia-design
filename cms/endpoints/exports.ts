import { APIError, type Endpoint } from "payload";
import { z } from "zod";

import { addDays, isDay, MAX_RANGE_DAYS, daysBetween } from "@/cms/lib/analyticsQueries";
import { dubaiDay } from "@/cms/lib/crypto";
import { exportFilename, exportStream, isExportKind, EXPORT_KINDS } from "@/cms/lib/exports";

import { requireRole } from "./requireRole";

/**
 * ==========================================================================
 * CSV exports (SPEC §H.12, §J) — admin only
 * ==========================================================================
 *
 *   GET /api/actions/exports/{orders|invoices|customers|tickets|enquiries}.csv
 *       ?from=YYYY-MM-DD&to=YYYY-MM-DD        (Dubai days, inclusive)
 *
 * `requireRole(req, ["admin"])` first (it also refuses `Sec-Fetch-Site:
 * cross-site`), then the query is validated with zod. With no dates the
 * export covers the last 30 days; a range is put in order and capped at
 * `MAX_RANGE_DAYS` (a little over a year). The file is streamed by
 * cms/lib/exports.ts — no export ever holds the whole table in memory.
 *
 * GET, not POST, so the Analytics view's Export button can be a plain link
 * (the browser downloads it with the admin's cookie; `Content-Disposition:
 * attachment` names the file). It changes nothing, so a GET is honest.
 */

const query = z.object({
  from: z.string().refine(isDay, "from must be a date (YYYY-MM-DD).").optional(),
  to: z.string().refine(isDay, "to must be a date (YYYY-MM-DD).").optional(),
});

export const exportsEndpoints: Endpoint[] = [
  {
    path: "/actions/exports/:file",
    method: "get",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const file = typeof req.routeParams?.file === "string" ? req.routeParams.file : "";
      const kind = file.replace(/\.csv$/i, "");
      if (!file.toLowerCase().endsWith(".csv") || !isExportKind(kind)) {
        throw new APIError(`Unknown export. Choose one of: ${EXPORT_KINDS.map((k) => `${k}.csv`).join(", ")}.`, 404, undefined, true);
      }

      const url = new URL(req.url ?? "http://localhost/", "http://localhost");
      const parsed = query.safeParse({ from: url.searchParams.get("from") || undefined, to: url.searchParams.get("to") || undefined });
      if (!parsed.success) throw new APIError(parsed.error.issues[0]?.message ?? "Invalid dates.", 400, undefined, true);

      const today = dubaiDay();
      let to = parsed.data.to ?? today;
      let from = parsed.data.from ?? addDays(to, -29);
      if (from > to) [from, to] = [to, from];
      if (daysBetween(from, to) > MAX_RANGE_DAYS) from = addDays(to, -(MAX_RANGE_DAYS - 1));
      const range = { from, to };

      return new Response(exportStream(req.payload, kind, range), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${exportFilename(kind, range)}"`,
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    },
  },
];
