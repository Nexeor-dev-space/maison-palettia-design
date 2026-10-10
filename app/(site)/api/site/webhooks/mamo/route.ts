import { allow, hashedClient, siteRequest } from "@/cms/lib/mamo/http";
import { claimEvent, finishClaimedInsert, releaseClaim } from "@/cms/lib/mamo/claim";
import { receiverSecrets } from "@/cms/lib/mamo/index";
import {
  classifyEvent,
  dedupeKeyFor,
  headerNamesOf,
  identifyDelivery,
  readBodyCapped,
  redactHeaders,
} from "@/cms/lib/mamo/verify";
import { errorText, processClaimedEvent, recordObservedHeader, recordUnverified } from "@/cms/lib/mamo/webhook";

/**
 * ==========================================================================
 * POST /api/site/webhooks/mamo — Mamo Pay's webhook receiver
 * ==========================================================================
 *
 * SPEC §H.5, step by step. Mamo signs nothing; what it sends back is the
 * `auth_header` string Register/Update webhook gave it (research 02 §A5),
 * so this route is built on three rules:
 *
 *   1. Nothing about an unauthenticated delivery is trusted or kept beyond
 *      a minimal record: no JSON parsing before the secret matches, no
 *      header values, the first kilobyte of body only, 500 rows a day.
 *   2. Even an authenticated delivery is only a hint: the payment is
 *      re-fetched from Mamo with our key before anything changes.
 *   3. Exactly-once processing comes from the claim (cms/lib/mamo/claim.ts),
 *      and our own failures answer 5xx so the delivery is retried — never a
 *      200 that silently drops a paid order.
 *
 * Status codes: 401 (empty body) for the rate limit and an unmatched
 * secret; 413 for an oversized body; 200 for anything understood —
 * processed, duplicate, ignored, no matching order (Mamo should stop
 * retrying those); 500 when WE failed (Mamo should retry).
 *
 * Node runtime (node:crypto); never cached; no CORS — this is server to
 * server.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const plain = (text: string, status: number) =>
  new Response(text, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

export async function POST(request: Request): Promise<Response> {
  // Step 0 — 60/min per hashed IP; an empty 401 gives a flood nothing to read.
  if (!allow(request, "webhooks-mamo", 60, 60_000)) return new Response(null, { status: 401 });
  const raw = await readBodyCapped(request);
  if (raw === null) return plain("payload too large", 413);

  const req = await siteRequest(request);
  const ip = hashedClient(request);

  // Step 1 — which secret (and so which environment) this carries.
  const secrets = await receiverSecrets(req);
  const secretValues = secrets.map((secret) => secret.value);
  const match = identifyDelivery(request.headers, secrets);

  // Step 2 — no match: minimal row, spike alert, 401.
  if (!match) {
    await recordUnverified(req, { headerNames: headerNamesOf(request.headers), raw, ipHash: ip, secretValues });
    return new Response(null, { status: 401 });
  }
  await recordObservedHeader(req, match);

  // Step 3 — authenticated: now, and only now, parse.
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return plain("ignored: not JSON", 200);
  }
  const kind = classifyEvent(body);
  if (!kind) return plain("ignored", 200);
  const event = body as Record<string, unknown>;

  // Step 4 — the claim.
  const claimed = await claimEvent(req.payload, {
    dedupeKey: dedupeKeyFor(event, kind.family),
    eventType: kind.eventType,
    mode: match.mode,
    providerPaymentId: kind.family === "payment" ? kind.id : null,
    providerLinkId: typeof event.payment_link_id === "string" ? event.payment_link_id.slice(0, 60) : null,
    headers: redactHeaders(request.headers, secretValues),
    payload: event,
    ipHash: ip,
  });
  if (!claimed) return plain("duplicate", 200);
  if (claimed.inserted) {
    await finishClaimedInsert(req.payload, claimed.id, headerNamesOf(request.headers)).catch((error: unknown) =>
      req.payload.logger.warn({ msg: "payment-events: could not record header names", err: errorText(error) }),
    );
  }

  // Steps 5–8.
  try {
    const result = await processClaimedEvent(req, claimed.id);
    return plain(result.outcome, 200);
  } catch (error) {
    const message = errorText(error);
    req.payload.logger.error({ msg: "Mamo webhook processing failed; left for retry", eventId: claimed.id, err: message });
    await releaseClaim(req.payload, claimed.id, message).catch(() => undefined);
    return plain("temporary failure", 500);
  }
}
