import type { Endpoint } from "payload";

/**
 * Email actions: verify the transport, send a test message (SPEC §H.8).
 *
 * Phase 1 stub: the handlers land in Phase 3C (email-and-pdf). Every handler, when it arrives,
 * starts with `requireRole(req, [...])` from "./requireRole" (which also
 * rejects `Sec-Fetch-Site: cross-site`) and validates its body with zod
 * (SPEC §A.2 rule 2, §J). Paths are relative to `/api/` and live under
 * `/api/actions/**`.
 */
export const emailEndpoints: Endpoint[] = [];
