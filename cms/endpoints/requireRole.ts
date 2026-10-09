import { APIError, type PayloadRequest } from "payload";

import { roleOf } from "@/cms/access/roles";
import type { Role } from "@/cms/lib/contracts";

/**
 * ==========================================================================
 * requireRole — the first line of every custom endpoint handler
 * ==========================================================================
 *
 * Payload root `endpoints` have no built-in authentication or access control
 * at all (verified in 3.90.2: `Endpoint` is `{ path, method, handler }`), so
 * a handler under `/api/actions/**` is public until it checks. This function
 * is that check, and SPEC §A.2 rule 2 makes it the FIRST statement of every
 * handler so a reviewer can grep for it.
 *
 * Two refusals, in this order:
 *
 *   · `Sec-Fetch-Site: cross-site` → 403. Browsers send this header on every
 *     request they make; a page on another origin that manages to carry the
 *     admin's cookie (CSRF) is refused before the user is even looked up.
 *     Same-origin, same-site and `none` (typed URL, bookmark) pass; so do
 *     non-browser clients that send no header, which is why the cookie
 *     allowlist in `payload.config.ts` (`csrf`) remains the second layer.
 *   · no user / wrong role → 401 / 403 with a message the admin UI can show.
 *
 * The `asserts` return type narrows `req.user` for the rest of the handler,
 * so `req.user.role` needs no optional chaining after the call.
 */
export function requireRole(req: PayloadRequest, roles: Role[]): asserts req is PayloadRequest & { user: { role: Role } } {
  if (req.headers.get("sec-fetch-site") === "cross-site") {
    throw new APIError("Cross-site requests are not allowed.", 403, undefined, true);
  }
  const role = roleOf(req);
  if (!req.user || !role) {
    throw new APIError("You need to be signed in to do this.", 401, undefined, true);
  }
  if (!roles.includes(role)) {
    throw new APIError("Your role does not allow this action.", 403, undefined, true);
  }
}

/**
 * Reads and validates a JSON body with a zod-style schema (`safeParse`).
 * Returns 400 with the first issue's message rather than Payload's generic
 * error, so the admin's action buttons can show "holdMinutes must be between
 * 5 and 60" instead of "Something went wrong".
 */
export async function parseBody<T>(
  req: PayloadRequest,
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: { issues: Array<{ message: string; path: PropertyKey[] }> } } },
): Promise<T> {
  let raw: unknown;
  try {
    raw = typeof req.json === "function" ? await req.json() : {};
  } catch {
    throw new APIError("The request body is not valid JSON.", 400, undefined, true);
  }
  const result = schema.safeParse(raw ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path?.length ? `${issue.path.map(String).join(".")}: ` : "";
    throw new APIError(`${where}${issue?.message ?? "Invalid request."}`, 400, undefined, true);
  }
  return result.data;
}

/** `Response.json` with the headers Payload expects on its own responses. */
export function json(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, { ...init, headers: { "cache-control": "no-store", ...init.headers } });
}
