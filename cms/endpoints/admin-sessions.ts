import type { Endpoint } from "payload";

/**
 * Session actions: repeat, reschedule, cancel & refund all, attendee list CSV (SPEC §H.7, §I).
 *
 * Phase 1 stub: the handlers land in Phase 3A-1 (commerce-model). Every handler, when it arrives,
 * starts with `requireRole(req, [...])` from "./requireRole" (which also
 * rejects `Sec-Fetch-Site: cross-site`) and validates its body with zod
 * (SPEC §A.2 rule 2, §J). Paths are relative to `/api/` and live under
 * `/api/actions/**`.
 */
export const adminSessionsEndpoints: Endpoint[] = [];
