import { randomUUID } from "node:crypto";

import type { Payload, PayloadRequest } from "payload";

import { applyPaymentSnapshot, notifyStaff } from "@/cms/lib/contracts";
import type { Order, PaymentEvent } from "@/payload-types";

import { dubaiDay } from "../crypto";
import { completeEvent } from "./claim";
import { gatewayForMode, PAYMENT_SETTINGS_SLUG } from "./index";
import { isDisabled, type MamoPayment, type Mode } from "./types";
import {
  EXCERPT_BYTES,
  parseDefensively,
  scrubSecrets,
  UNVERIFIED_ROWS_PER_DAY,
  UNVERIFIED_SPIKE_PER_HOUR,
  type DeliveryMatch,
} from "./verify";

/**
 * ==========================================================================
 * Webhook processing — the database half of SPEC §H.5
 * ==========================================================================
 *
 * The route (app/(site)/api/site/webhooks/mamo/route.ts) does steps 0–4:
 * rate limit, capped read, secret match, parse, claim. This module does
 * what needs the database and the gateway:
 *
 *   · `recordUnverified`    step 2 — the minimal row, the 500/day cap, the
 *                           50/hour spike alert;
 *   · `recordObservedHeader` the first verified delivery per mode stamps
 *                           which header carried the secret (TODO(mamo-verify));
 *   · `processClaimedEvent` steps 5–8 for a claimed row — dispute handling,
 *                           verify-by-fetch, order resolution, the snapshot.
 *                           Re-runnable by id, which is what the
 *                           `reconcile-payments` job (3D) calls for rows
 *                           left open by a failed attempt (§H.6) after
 *                           `reclaimById` (./claim.ts).
 *
 * THE BODY IS NEVER TRUSTED. For `payment.*` events only `id` is read from
 * it; the payment object acted on is the one `getPayment(id)` returns from
 * Mamo with our own key, in the mode whose secret matched. A forged
 * delivery with a stolen secret can therefore make us re-check a payment —
 * nothing more.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 2 — unverified deliveries                                             */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Per-process counters. One Node process serves the site (SPEC §A.5), so
 * in-memory is exact enough; after a restart the day's count is re-read from
 * the database before the first new row, so a restart does not reset the cap.
 */
const counters: {
  day: string;
  dayCount: number;
  dayLoaded: boolean;
  droppedToday: number;
  hour: string;
  hourCount: number;
  alertedHour: string | null;
} = { day: "", dayCount: 0, dayLoaded: false, droppedToday: 0, hour: "", hourCount: 0, alertedHour: null };

/** For the admin and tests: how many unverified deliveries this process has seen and dropped. */
export function unverifiedCounters() {
  return { ...counters };
}

async function activeMode(payload: Payload): Promise<Mode> {
  try {
    const settings = (await payload.findGlobal({
      slug: PAYMENT_SETTINGS_SLUG,
      depth: 0,
      overrideAccess: true,
      select: { mode: true },
    })) as { mode?: Mode };
    return settings.mode ?? "test";
  } catch {
    return "test";
  }
}

/**
 * Stores the minimal row (SPEC §H.5 step 2) unless today's 500 are used,
 * and raises the spike alert once per hour past 50. Never throws: an
 * unverified delivery is answered 401 whatever happens here.
 */
export async function recordUnverified(
  req: PayloadRequest,
  input: { headerNames: string[]; raw: string; ipHash: string; secretValues: string[] },
): Promise<{ stored: boolean }> {
  const { payload } = req;
  const now = new Date();
  const day = dubaiDay(now);
  const hour = now.toISOString().slice(0, 13);

  if (counters.hour !== hour) {
    counters.hour = hour;
    counters.hourCount = 0;
  }
  counters.hourCount += 1;
  if (counters.hourCount > UNVERIFIED_SPIKE_PER_HOUR && counters.alertedHour !== hour) {
    counters.alertedHour = hour;
    // Both an abuse signal and the sign that Mamo sends the secret under a
    // header we do not check (TODO(mamo-verify) in ./verify.ts).
    void notifyStaff(
      req,
      "webhook_unverified_spike",
      { count: counters.hourCount, hour: `${hour}:00Z`, threshold: UNVERIFIED_SPIKE_PER_HOUR },
      {},
    ).catch((error: unknown) => payload.logger.warn({ msg: "notifyStaff(webhook_unverified_spike) failed", err: errorText(error) }));
  }

  try {
    if (counters.day !== day) {
      counters.day = day;
      counters.dayCount = 0;
      counters.dayLoaded = false;
      counters.droppedToday = 0;
    }
    if (!counters.dayLoaded) {
      const since = new Date(`${day}T00:00:00+04:00`).toISOString();
      const { totalDocs } = await payload.count({
        collection: "payment-events",
        where: { and: [{ verified: { equals: false } }, { receivedAt: { greater_than_equal: since } }] },
        overrideAccess: true,
      });
      counters.dayCount = totalDocs;
      counters.dayLoaded = true;
    }
    if (counters.dayCount >= UNVERIFIED_ROWS_PER_DAY) {
      counters.droppedToday += 1;
      return { stored: false };
    }
    counters.dayCount += 1;

    const excerpt = scrubSecrets(input.raw.slice(0, EXCERPT_BYTES), input.secretValues);
    const { eventType, providerPaymentId } = parseDefensively(excerpt);
    await payload.create({
      collection: "payment-events",
      data: {
        provider: "mamo",
        verified: false,
        needsReview: false,
        dedupeKey: `unverified:${randomUUID()}`,
        eventType: eventType ?? null,
        providerPaymentId: providerPaymentId ?? null,
        headerNames: input.headerNames.slice(0, 60),
        bodyExcerpt: excerpt,
        ipHash: input.ipHash,
        mode: await activeMode(payload),
        receivedAt: now.toISOString(),
      },
      depth: 0,
      overrideAccess: true,
      context: { skipRevalidate: true },
    });
    return { stored: true };
  } catch (error) {
    payload.logger.warn({ msg: "payment-events: could not store an unverified delivery", err: errorText(error) });
    return { stored: false };
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Discovery of the real header name                                          */
/* ────────────────────────────────────────────────────────────────────────── */

const observedThisProcess = new Set<string>();

/**
 * TODO(mamo-verify) discovery: on the first verified delivery per mode,
 * write the header name that carried the secret to Settings → Payments →
 * Connection details → "Observed auth header name". Skipped for the mock
 * (its header is ours) and once recorded. Best effort — a failure here never
 * fails the delivery.
 */
export async function recordObservedHeader(req: PayloadRequest, match: DeliveryMatch): Promise<void> {
  if (match.mode === "mock") return;
  const key = `${match.mode}:${match.headerName}`;
  if (observedThisProcess.has(key)) return;
  observedThisProcess.add(key);
  try {
    const current = (await req.payload.findGlobal({
      slug: PAYMENT_SETTINGS_SLUG,
      depth: 0,
      overrideAccess: true,
      select: { [match.mode]: { observedAuthHeaderName: true } },
    })) as unknown as Record<string, { observedAuthHeaderName?: string | null } | undefined>;
    if (current[match.mode]?.observedAuthHeaderName === match.headerName) return;
    await req.payload.updateGlobal({
      slug: PAYMENT_SETTINGS_SLUG,
      data: { [match.mode]: { observedAuthHeaderName: match.headerName } },
      depth: 0,
      overrideAccess: true,
      context: { skipAudit: true },
    });
  } catch (error) {
    observedThisProcess.delete(key);
    req.payload.logger.warn({ msg: "payment-settings: could not record the observed webhook header", err: errorText(error) });
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Steps 5–8                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export type ProcessOutcome =
  | { outcome: "applied" | "not_applied"; orderId: string; reason?: string }
  | { outcome: "no_order" | "connection_test" | "dispute_recorded" | "dispute_no_order" };

const str = (value: unknown): string | undefined => (typeof value === "string" && value.length > 0 ? value : undefined);

/** `external_id` (our reference) → `custom_data.orderId` → the payment link we recorded (SPEC §H.5 step 6). */
export async function findOrderForPayment(
  req: PayloadRequest,
  hint: { externalId?: string | null; orderId?: string | null; linkId?: string | null; paymentId?: string | null },
): Promise<Order | null> {
  const { payload } = req;
  if (hint.externalId) {
    const byRef = await payload.find({
      collection: "orders",
      where: { reference: { equals: hint.externalId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    });
    if (byRef.docs[0]) return byRef.docs[0] as Order;
  }
  if (hint.orderId && /^[0-9a-f-]{36}$/i.test(hint.orderId)) {
    const byId = await payload
      .findByID({ collection: "orders", id: hint.orderId, depth: 0, overrideAccess: true, disableErrors: true, req })
      .catch(() => null);
    if (byId) return byId as Order;
  }
  for (const [field, value] of [
    ["providerLinkId", hint.linkId],
    ["providerPaymentId", hint.paymentId],
  ] as const) {
    if (!value) continue;
    const attempt = await payload.find({
      collection: "payments",
      where: { [field]: { equals: value } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    });
    const orderRef = attempt.docs[0]?.order;
    const orderId = typeof orderRef === "string" ? orderRef : orderRef?.id;
    if (orderId) {
      const order = await payload
        .findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, disableErrors: true, req })
        .catch(() => null);
      if (order) return order as Order;
    }
  }
  return null;
}

/**
 * A `dispute.*` event (SPEC §H.5 step 5). The payload shape is UNVERIFIED
 * (research 02 §A5), so it is stored raw on the event row and the order is
 * resolved from whichever of the plausible fields is present. The order is
 * flagged — `disputed`, `disputeStatus`, needs review — never changed in
 * status: a chargeback is a conversation with the bank, not a refund.
 */
async function handleDispute(req: PayloadRequest, eventId: string, body: Record<string, unknown>): Promise<ProcessOutcome> {
  const nested = (body.payment ?? body.charge) as Record<string, unknown> | undefined;
  const paymentId = str(body.payment_id) ?? str(body.charge_id) ?? str(nested?.id);
  const order = await findOrderForPayment(req, {
    externalId: str(body.external_id) ?? str(nested?.external_id),
    orderId: str((body.custom_data as Record<string, unknown> | undefined)?.orderId),
    linkId: str(body.payment_link_id) ?? str(nested?.payment_link_id),
    paymentId,
  });
  const eventType = String(body.event_type);
  if (!order) {
    await completeEvent(req.payload, eventId, { needsReview: true, note: "Dispute: no matching order found — check the payload." });
    return { outcome: "dispute_no_order" };
  }
  await req.payload.update({
    collection: "orders",
    id: order.id,
    data: { disputed: true, disputeStatus: eventType, needsReview: true, reviewReason: "dispute" },
    depth: 0,
    overrideAccess: true,
    req,
  });
  await notifyStaff(req, "dispute", { reference: order.reference, eventType, paymentId: paymentId ?? "not given in the event" }, { order: order.id }).catch((error: unknown) =>
    req.payload.logger.warn({ msg: "notifyStaff(dispute) failed", err: errorText(error) }),
  );
  await completeEvent(req.payload, eventId, { order: order.id, needsReview: true });
  return { outcome: "dispute_recorded" };
}

/**
 * Steps 5–8 for a claimed, verified `payment-events` row. Throws on OUR
 * failures (Mamo unreachable, a database error, a not-yet-implemented
 * dependency) — the caller records the message, releases the claim and
 * answers 5xx so the delivery is retried. Every other ending closes the row.
 */
export async function processClaimedEvent(req: PayloadRequest, eventId: string): Promise<ProcessOutcome> {
  const event = (await req.payload.findByID({
    collection: "payment-events",
    id: eventId,
    depth: 0,
    overrideAccess: true,
  })) as PaymentEvent;
  const body = (event.payload ?? {}) as Record<string, unknown>;
  const eventType = String(body.event_type ?? event.eventType ?? "");
  const mode = event.mode;

  if (eventType.startsWith("dispute.")) return handleDispute(req, eventId, body);

  // Step 6 — verify by fetch, in the environment whose secret matched.
  const gateway = await gatewayForMode(req, mode);
  if (isDisabled(gateway)) throw new Error(`Payments gateway for ${mode} is not available (${gateway.reason}).`);
  const payment: MamoPayment = await gateway.getPayment(String(body.id));
  if (payment.id !== body.id) throw new Error("Mamo returned a different payment than the one requested.");

  const customData = (payment.custom_data ?? {}) as Record<string, unknown>;
  if (customData.kind === "connection_test") {
    // The admin's AED 2 "Send test order": proof that deliveries arrive and
    // verify. There is no order to touch.
    await completeEvent(req.payload, eventId, { note: null });
    return { outcome: "connection_test" };
  }

  const order = await findOrderForPayment(req, {
    externalId: payment.external_id ?? null,
    orderId: str(customData.orderId),
    linkId: payment.payment_link_id ?? null,
    paymentId: payment.id,
  });
  if (!order) {
    await completeEvent(req.payload, eventId, { needsReview: true, note: "No matching order (external_id, custom_data.orderId, link id)." });
    return { outcome: "no_order" };
  }

  // Step 7 — the order's own lock, mode/link assertion, amount check and
  // state changes all live in applyPaymentSnapshot (cms/lib/orders.ts).
  const result = await applyPaymentSnapshot(req, order, payment, { source: "webhook", mode, eventId });
  const review = !result.applied && /mismatch|review/i.test(result.reason ?? "");

  // Step 8.
  await completeEvent(req.payload, eventId, {
    order: order.id,
    needsReview: review,
    note: result.applied ? null : result.reason ? `Not applied: ${result.reason}` : null,
  });
  return { outcome: result.applied ? "applied" : "not_applied", orderId: order.id, reason: result.reason };
}

/** An error's message without its stack or any attached request (MamoApiError carries none by construction). */
export function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 500);
  return String(error).slice(0, 500);
}
