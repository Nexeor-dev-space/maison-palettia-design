import { constantTimeEquals } from "@/cms/lib/mamo/verify";
import { allow, isCrossSite, json, readJson, siteRequest, tooMany } from "@/cms/lib/mamo/http";
import { customerView, findOrderByReference } from "@/cms/lib/mamo/orderView";
import { mintReturnK } from "@/cms/lib/mamo/returnToken";
import { firstIssue, orderLookupSchema } from "@/cms/lib/mamo/schemas";

/**
 * ==========================================================================
 * POST /api/site/orders/lookup — "find my booking" by reference AND email
 * ==========================================================================
 *
 * SPEC §H.10. There are no customer accounts; /booking-status asks for the
 * reference printed on the confirmation and the email it was sent to. Both
 * must match — the email compared in constant time, after lower-casing —
 * and every miss gets the same 404, so the endpoint cannot be used to learn
 * whether a reference exists.
 *
 * Limits: 10 an hour per hashed IP + email (SPEC §H), and 60 an hour per IP
 * across all emails so one client cannot walk an address list.
 *
 * On a match: the customer view (cms/lib/mamo/orderView.ts) plus a fresh
 * 24-hour `k`, so the page can keep polling `/orders/{ref}/status?k=` (e.g.
 * while a payment is still processing) without asking for the email again.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOT_FOUND = { reason: "not_found", message: "We could not find a booking with that reference and email." };

export async function POST(request: Request): Promise<Response> {
  if (!allow(request, "orders-lookup-ip", 60, 3_600_000)) return tooMany(600);
  if (isCrossSite(request)) return json({ reason: "forbidden" }, 403);

  const raw = await readJson(request, 2048);
  if (raw === null) return json({ reason: "invalid", message: "The request body is not valid JSON." }, 400);
  const parsed = orderLookupSchema.safeParse(raw);
  if (!parsed.success) return json({ reason: "invalid", message: firstIssue(parsed.error) }, 400);
  const { reference, email } = parsed.data;

  if (!allow(request, "orders-lookup", 10, 3_600_000, email)) return tooMany(600);

  const req = await siteRequest(request);
  const order = await findOrderByReference(req, reference);
  const stored = (order?.contact?.email ?? "").trim().toLowerCase();
  // Compared even when there is no order, so a miss takes as long as a hit.
  const emailMatches = constantTimeEquals(stored || "\u0000no-order", email);
  if (!order || !stored || !emailMatches) return json(NOT_FOUND, 404);

  return json({ ...(await customerView(req, order)), k: mintReturnK(order.reference) });
}
