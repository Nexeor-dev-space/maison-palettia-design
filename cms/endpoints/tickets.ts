import type { Endpoint } from "payload";

/**
 * Ticket actions: check-in verdicts and the sample-ticket preview PDF (SPEC §H.7).
 *
 * Phase 1 stub: the handlers land in Phase 3E (tickets-and-checkin). Every handler, when it arrives,
 * starts with `requireRole(req, [...])` from "./requireRole" (which also
 * rejects `Sec-Fetch-Site: cross-site`) and validates its body with zod
 * (SPEC §A.2 rule 2, §J). Paths are relative to `/api/` and live under
 * `/api/actions/**`.
 */
export const ticketsEndpoints: Endpoint[] = [];
