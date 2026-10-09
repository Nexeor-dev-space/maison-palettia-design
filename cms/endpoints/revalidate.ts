import type { Endpoint } from "payload";

/**
 * Admin-side revalidation helpers; the signed public loopback receiver is a site route, app/(site)/api/site/revalidate (SPEC §G.4).
 *
 * Phase 1 stub: the handlers land in Phase 3B (mamo-gateway). Every handler, when it arrives,
 * starts with `requireRole(req, [...])` from "./requireRole" (which also
 * rejects `Sec-Fetch-Site: cross-site`) and validates its body with zod
 * (SPEC §A.2 rule 2, §J). Paths are relative to `/api/` and live under
 * `/api/actions/**`.
 */
export const revalidateEndpoints: Endpoint[] = [];
