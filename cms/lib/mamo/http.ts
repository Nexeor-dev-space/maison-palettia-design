import { createLocalReq, type PayloadRequest } from "payload";

import { getCms } from "@/lib/cms/payload";

import { clientIp, ipHash, rateLimit } from "../rateLimit";

/**
 * ==========================================================================
 * Shared plumbing for the booking route handlers under /api/site/**
 * ==========================================================================
 *
 * Every handler in app/(site)/api/site/{checkout,orders,availability,
 * webhooks,apple-domain-association} does the same three things before its
 * own work: rate-limit by hashed client IP (SPEC §H — limits per route,
 * client IP = the LAST X-Forwarded-For hop), answer with `no-store` JSON,
 * and get a Payload request to hand to the Local API. They live here so the
 * route files read as the SPEC's step lists.
 *
 * `siteRequest` builds an ANONYMOUS Payload request (no `user`) carrying
 * the incoming headers. Anonymous matters: these routes are public, and the
 * Local API calls they make pass `overrideAccess: true` explicitly where a
 * system write is intended, so nothing here runs with a staff member's
 * rights because a staff cookie happened to be present.
 */

export async function siteRequest(request: Request): Promise<PayloadRequest> {
  const payload = await getCms();
  return createLocalReq({ req: { headers: request.headers } as Partial<PayloadRequest> }, payload);
}

export function hashedClient(request: Request): string {
  return ipHash(clientIp(request.headers));
}

/** `true` = allowed. One call per request, before any work. */
export function allow(request: Request, bucket: string, limit: number, windowMs: number, extraKey = ""): boolean {
  return rateLimit(bucket, `${hashedClient(request)}${extraKey ? `:${extraKey}` : ""}`, { limit, windowMs });
}

const NO_STORE = { "cache-control": "no-store", "x-content-type-options": "nosniff" };

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(data, { status, headers: { ...NO_STORE, ...headers } });
}

export function tooMany(retryAfterSeconds = 60): Response {
  return json({ error: "Too many requests. Please wait a moment and try again." }, 429, { "retry-after": String(retryAfterSeconds) });
}

/**
 * A browser on another site posting to a booking endpoint is never us. The
 * public endpoints carry no cookie authority, but refusing cross-site
 * posts keeps drive-by forms from spending our rate limits and holds.
 */
export function isCrossSite(request: Request): boolean {
  return request.headers.get("sec-fetch-site") === "cross-site";
}

/** Reads a JSON body of at most `max` bytes; null for too large or not JSON. */
export async function readJson(request: Request, max = 16 * 1024): Promise<unknown | null> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > max) return null;
  const text = await request.text();
  if (text.length > max) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * One mapping from what checkout code throws to what the browser is told.
 * The customer-facing reasons are stable strings the checkout UI switches
 * on (components/booking, 3F); messages never include a stack, a query or
 * anything from Mamo beyond its own customer-safe text.
 */
export function checkoutErrorResponse(error: unknown, log: (message: string) => void): Response {
  const name = error instanceof Error ? error.name : "";
  if (name === "SoldOut") {
    const soldOut = error as Error & { sessionId?: string; wanted?: number; available?: number };
    return json({ reason: "sold_out", sessionId: soldOut.sessionId, wanted: soldOut.wanted, available: soldOut.available }, 409);
  }
  if (name === "AmountBelowMinimum") {
    return json({ reason: "amount_below_minimum", message: (error as Error).message }, 422);
  }
  if (name === "MamoApiError") {
    log(`Mamo refused or did not answer: ${(error as Error).message}`);
    return json({ reason: "payment_link_failed", retry: true, message: "We could not reach the payment page. Your seats are still held — please try again." }, 502);
  }
  if (name === "NotImplemented") {
    log((error as Error).message);
    return json({ reason: "not_ready", message: "Online booking is not available yet." }, 503);
  }
  const status = (error as { status?: unknown })?.status;
  const reason = (error as { reason?: unknown })?.reason;
  if (typeof reason === "string" && typeof status === "number" && status >= 400 && status < 600) {
    // cms/lib/orders.ts `CheckoutError(reason, message, status, extra)` — its
    // messages are written for customers. Only the reference is passed on
    // from `extra` (a link failure keeps the order for a retry).
    const reference = (error as { extra?: { reference?: unknown } }).extra?.reference;
    if (status >= 500) log(`${reason}: ${(error as Error).message}`);
    return json(
      {
        reason,
        message: (error as Error).message,
        ...(typeof reference === "string" ? { reference } : {}),
        ...(reason === "gateway_error" ? { retry: true } : {}),
      },
      status,
    );
  }
  if (typeof status === "number" && status >= 400 && status < 500) {
    return json({ reason: "invalid", message: (error as Error).message }, status);
  }
  log(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
  return json({ reason: "error", message: "Something went wrong. Nothing has been charged — please try again." }, 500);
}
