import type { Endpoint } from "payload";

/**
 * Mamo Pay payment actions: re-check a payment, deactivate a link (SPEC §H.4–H.6).
 *
 * Phase 1 stub: the handlers land in Phase 3B (mamo-gateway). Every handler, when it arrives,
 * starts with `requireRole(req, [...])` from "./requireRole" (which also
 * rejects `Sec-Fetch-Site: cross-site`) and validates its body with zod
 * (SPEC §A.2 rule 2, §J). Paths are relative to `/api/` and live under
 * `/api/actions/**`.
 */
export const paymentsEndpoints: Endpoint[] = [];
