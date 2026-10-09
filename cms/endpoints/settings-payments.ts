import type { Endpoint } from "payload";

/**
 * Settings → Payments buttons: test connection, register/update webhook, rotate secret, list webhooks, AED 2 test order (SPEC §C.3).
 *
 * Phase 1 stub: the handlers land in Phase 3B (mamo-gateway). Every handler, when it arrives,
 * starts with `requireRole(req, [...])` from "./requireRole" (which also
 * rejects `Sec-Fetch-Site: cross-site`) and validates its body with zod
 * (SPEC §A.2 rule 2, §J). Paths are relative to `/api/` and live under
 * `/api/actions/**`.
 */
export const settingsPaymentsEndpoints: Endpoint[] = [];
