import { z } from "zod";

import { NotImplemented, publicUrl, sendTemplated } from "@/cms/lib/contracts";
import { sha256Hex } from "@/cms/lib/crypto";
import { clientIp, ipHash, rateLimit } from "@/cms/lib/rateLimit";
import { localRequest, MAGIC_LINK_TTL_S, mintMagicLinkToken } from "@/lib/booking";
import { getCms } from "@/lib/cms/payload";
import type { Customer } from "@/payload-types";

/**
 * ==========================================================================
 * POST /api/site/my-bookings/request — email me a link to my bookings
 * ==========================================================================
 *
 * SPEC §H.10. `{ email }` → ALWAYS `200 { status: "ok" }`, whether or not
 * that address has ever booked, so the form cannot be used to find out who
 * has. Only the rate limit answers differently (429), and it is keyed on the
 * connection AND on the address — 3 per 15 minutes each — so neither one
 * connection nor a botnet can bury one inbox in links.
 *
 * When a customer exists: `lastMagicLinkIssuedAt = now` (which also retires
 * every earlier link — consumption requires the stamp to match), a 30-minute
 * single-use token (`magic-link-v1`, lib/booking.ts) and the `magic_link`
 * email with `{publicUrl}/my-bookings?t=<token>` through `sendTemplated`
 * (3C). The token never appears in a log line, a response or the
 * notification log's variables (3C redacts `links.*`).
 */

export const dynamic = "force-dynamic";

const WINDOW = { limit: 3, windowMs: 15 * 60 * 1000 } as const;

const RequestBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  website: z.string().max(500).optional(),
});

const ok = () => Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });

export async function POST(request: Request): Promise<Response> {
  const headers = request.headers;
  if (headers.get("sec-fetch-site") === "cross-site") return Response.json({ status: "forbidden" }, { status: 403 });
  if (!(headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    return Response.json({ status: "invalid" }, { status: 415 });
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > 2048) return Response.json({ status: "invalid" }, { status: 413 });
    raw = JSON.parse(text);
  } catch {
    return Response.json({ status: "invalid" }, { status: 400 });
  }
  const parsed = RequestBody.safeParse(raw);
  if (!parsed.success) return Response.json({ status: "invalid", message: "Please check this email address." }, { status: 400 });
  const { email, website } = parsed.data;

  // Both buckets are charged on every request, so alternating addresses from
  // one connection, or one address from many, each run out.
  const byIp = rateLimit("my-bookings-request:ip", ipHash(clientIp(headers)), WINDOW);
  const byEmail = rateLimit("my-bookings-request:email", sha256Hex(email), WINDOW);
  if (!byIp || !byEmail) {
    return Response.json({ status: "rate_limited" }, { status: 429, headers: { "retry-after": "900" } });
  }

  if (website?.trim()) return ok();

  try {
    const payload = await getCms();
    const found = await payload.find({ collection: "customers", where: { email: { equals: email } }, depth: 0, limit: 1 });
    const customer = found.docs[0] as Customer | undefined;
    if (!customer) return ok();

    const issuedAtMs = Date.now();
    await payload.update({
      collection: "customers",
      id: customer.id,
      depth: 0,
      data: { lastMagicLinkIssuedAt: new Date(issuedAtMs).toISOString() },
    });

    const req = await localRequest();
    const link = `${await publicUrl(req)}/my-bookings?t=${mintMagicLinkToken(customer.id, issuedAtMs)}`;
    await sendTemplated(req, {
      key: "magic_link",
      to: customer.email,
      vars: {
        customer: { firstName: customer.firstName ?? "" },
        links: { myBookings: link },
        expiresMinutes: String(Math.round(MAGIC_LINK_TTL_S / 60)),
      },
    });
  } catch (error) {
    // Same answer either way; the log says only that it failed, never to whom or with what link.
    if (!(error instanceof NotImplemented)) console.error("[my-bookings] could not send a sign-in link");
    else console.warn("[my-bookings] the magic_link email is not available yet (sendTemplated not implemented)");
  }
  return ok();
}
