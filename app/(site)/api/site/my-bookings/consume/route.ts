import { sql } from "@payloadcms/db-postgres";
import { NextResponse } from "next/server";

import { drizzleOf } from "@/cms/lib/mamo/claim";
import { clientIp, ipHash, rateLimit } from "@/cms/lib/rateLimit";
import { mintSessionValue, readMagicLinkToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/booking";
import { getCms } from "@/lib/cms/payload";

/**
 * ==========================================================================
 * POST /api/site/my-bookings/consume — spend a magic link, set the session
 * ==========================================================================
 *
 * SPEC §H.10. The emailed link opens `GET /my-bookings?t=…`, which renders a
 * form that POSTs the token here (<MagicLinkContinue>) — a POST, because mail
 * scanners prefetch GETs and would burn a single-use token before the
 * customer clicked.
 *
 * The token must verify (`magic-link-v1`, unexpired) AND its issue time must
 * equal `customers.lastMagicLinkIssuedAt`; the stamp is then cleared, so the
 * link works once and only the newest link works at all. Compare and clear
 * are ONE conditional UPDATE: two POSTs of the same link in the same instant
 * (a double tap, a link scanner that submits forms) race for the row, and
 * only the one whose UPDATE still finds the stamp gets a session. Success sets
 * `__Host-mp_session` (`mp_session` outside production; HttpOnly,
 * SameSite=Lax, Path=/, 30 days, `session-v1`, carrying the customer's
 * `sessionVersion`) and answers 303 to /my-bookings, so the token leaves the
 * address bar and the history. Every failure answers 303 to
 * `/my-bookings?e=expired` — one answer for forged, used and lapsed alike.
 *
 * `signout=1` clears the cookie instead (the "Sign out" button on the list).
 *
 * 10 a minute per connection. Same-origin only: a cross-site form post is
 * refused before anything is read (the cookie is SameSite=Lax regardless).
 */

export const dynamic = "force-dynamic";

const LIMIT = { limit: 10, windowMs: 60_000 } as const;

/** A relative Location: correct behind any proxy, without trusting the Host header. */
function seeOther(location: string): NextResponse {
  return new NextResponse(null, { status: 303, headers: { location, "cache-control": "no-store" } });
}

async function readField(request: Request, name: string): Promise<string | null> {
  const type = (request.headers.get("content-type") ?? "").toLowerCase();
  try {
    if (type.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      return typeof body[name] === "string" ? (body[name] as string) : null;
    }
    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      const value = (await request.formData()).get(name);
      return typeof value === "string" ? value : null;
    }
  } catch {
    // unreadable body → treated as no token
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403 });
  if (!rateLimit("my-bookings-consume", ipHash(clientIp(request.headers)), LIMIT)) return seeOther("/my-bookings?e=busy");

  const body = request.clone();
  if ((await readField(body, "signout")) === "1") {
    const response = seeOther("/my-bookings");
    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  }

  const token = await readField(request, "t");
  const parsed = token ? readMagicLinkToken(token) : null;
  if (!parsed) return seeOther("/my-bookings?e=expired");

  try {
    const payload = await getCms();
    // Spend it atomically: the row comes back only to the request that cleared the stamp.
    const spent = await drizzleOf(payload).execute(sql`
      UPDATE customers
         SET last_magic_link_issued_at = NULL, updated_at = now()
       WHERE id = ${parsed.customerId}
         AND last_magic_link_issued_at = ${new Date(parsed.issuedAtMs).toISOString()}::timestamptz
   RETURNING id, session_version`);
    const customer = spent.rows[0] as { id: unknown; session_version: unknown } | undefined;
    if (!customer) return seeOther("/my-bookings?e=expired");

    const response = seeOther("/my-bookings");
    response.cookies.set(SESSION_COOKIE, mintSessionValue(String(customer.id), Number(customer.session_version ?? 0)), sessionCookieOptions());
    return response;
  } catch {
    console.error("[my-bookings] could not consume a sign-in link");
    return seeOther("/my-bookings?e=expired");
  }
}
