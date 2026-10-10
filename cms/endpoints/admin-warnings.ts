import type { Endpoint } from "payload";

import { loadWarnings } from "@/cms/components/admin/adminData";

import { json, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * The red warnings, for the slim bar on every admin page (SPEC §I)
 * ==========================================================================
 *
 *   GET /actions/admin/warnings   admin, editor, front-desk   → { red: Warning[] }
 *
 * The dashboard draws the full checks as a server component; every OTHER
 * page gets only what is broken right now (secret changed, background tasks
 * paused, webhook at an old address, open disputes, a burst of unverified
 * webhooks) through cms/components/admin/WarningsBar.tsx, a provider. Same
 * `loadWarnings` as the dashboard — the role filtering included — so the bar
 * and the dashboard can never disagree. Amber items stay on the dashboard:
 * "finish setting up" is not worth a strip on every page.
 */
export const adminWarningsEndpoints: Endpoint[] = [
  {
    path: "/actions/admin/warnings",
    method: "get",
    handler: async (req) => {
      requireRole(req, ["admin", "editor", "front-desk"]);
      const data = await loadWarnings(req.payload, req.user);
      return json({ red: data?.red ?? [] });
    },
  },
];
