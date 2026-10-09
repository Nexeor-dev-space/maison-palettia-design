import type { Endpoint } from "payload";

/**
 * Staff invites and login links — no passwords over chat (SPEC §D.1).
 *
 * Phase 1 stub: the handlers land in Phase 4B (admin-ux). Every handler, when it arrives,
 * starts with `requireRole(req, [...])` from "./requireRole" (which also
 * rejects `Sec-Fetch-Site: cross-site`) and validates its body with zod
 * (SPEC §A.2 rule 2, §J). Paths are relative to `/api/` and live under
 * `/api/actions/**`.
 */
export const usersEndpoints: Endpoint[] = [];
