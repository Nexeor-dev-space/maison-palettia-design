import type { PayloadRequest } from "payload";

import {
  applyPaymentSnapshot,
  completeRefund,
  getPaymentGateway,
  notifyStaff,
  processClaimedEvent,
  syncRefunds,
  type MamoPayment,
  type Mode,
  type Order,
  type PaymentGateway,
} from "@/cms/lib/contracts";
import { staffOrderVars } from "@/cms/email/callerVars";
import type { Payment, PaymentEvent, Refund } from "@/payload-types";

import { AlertThrottle, reconcileDue, scrubError, settlementCurrency } from "../logic";
import {
  adminLink,
  cron,
  defineTask,
  eachItem,
  enqueue,
  idOf,
  mamoErrorStatus,
  readSettings,
  reportSweepFailures,
  runSql,
  sql,
  type SweepOutput,
} from "../shared";

/**
 * ==========================================================================
 * reconcile-payments — the safety net under the webhook (SPEC §H.6)
 * ==========================================================================
 *
 * SCHEDULED EVERY MINUTE, RUNS WHEN DUE. Crons are fixed when the config is
 * built (Payload starts its `croner` jobs once per process), so the owner's
 * "every N minutes" cannot re-plan the schedule. Instead the task wakes
 * every minute and returns at once unless Settings → Payments → Automatic
 * checks is on and `everyMinutes` have passed since `lastRunAt`
 * (`reconcileDue`, logic.ts). `lastRunAt` and a one-line summary are
 * written back to the same panel, so the owner can see it working.
 *
 * WHAT A RUN DOES (active gateway mode only; exclusive):
 *
 *   1. Unpaid orders older than 90 s (`awaiting_payment`; also `failed`
 *      while the hold lasts, and `expired` in the last 30 min — a customer
 *      may have been on Mamo's page when the link died): GET the link and
 *      push every charge through `applyPaymentSnapshot`. A lost webhook
 *      becomes a few minutes' delay, never a lost sale. A charge Mamo says
 *      is `captured` whose order still is not paid afterwards is alerted to
 *      staff — money taken without a booking must never sit unnoticed.
 *   2. Verified `payment-events` left open by a failed attempt (received
 *      over 5 min ago, `processed_at` NULL): re-claimed with the webhook's
 *      own rule (a row being worked on right now is left alone), then
 *      steps 5–8 again — dispute flag, or verify-by-fetch → order → snapshot.
 *      A row Mamo answers 404 for, or still failing after 24 h, is closed
 *      with `needsReview` rather than retried for ever.
 *   3. Orders paid but not finalised for 10 min (`confirming`, or
 *      `confirmed` without an invoice): `finalize-order` is queued again
 *      unless one is pending or ran in the last hour (every step is
 *      idempotent).
 *   4. Refunds stuck `processing`: GET the payment, `syncRefunds`.
 *   4b. Refunds `succeeded` in the last 7 days with no credit note: the
 *      completion (tickets, seats, order status, credit note, email) did
 *      not finish — `completeRefund` resumes it from state. Needs no Mamo
 *      call, so it runs even with the gateway off (desk refunds too).
 *   5. Settlement figures for payments captured in the last 48 h (cap 20).
 *
 * WHAT MAMO DOES NOT TELL US (UNVERIFIED, research 02 §A5): its webhook
 * retry schedule and delivery timeout. This sweep plus the webhook claim's
 * 2-minute re-claim are the hedge, whatever those turn out to be.
 */

const PAYMENT_SETTINGS = "payment-settings";
const LIMIT = 50;
/** A stored delivery that still cannot be processed after a day is closed with needsReview instead of retried for ever. */
const GIVE_UP_AFTER_MS = 24 * 3_600_000;

/** The last run, in memory too — if the settings row cannot be written the checker still keeps its interval. */
let lastRunInProcess: string | null = null;
const unappliedAlerts = new AlertThrottle(60 * 60_000);

type Settings = { reconciliation?: { enabled?: boolean | null; everyMinutes?: number | null; lastRunAt?: string | null } };
type Summary = {
  ranAt: string;
  mode: Mode | null;
  linksChecked: number;
  chargesSeen: number;
  eventsReprocessed: number;
  eventsGivenUp: number;
  finalizeRequeued: number;
  refundsSynced: number;
  refundsCompleted: number;
  settlementsRefreshed: number;
  capturedNotApplied: number;
  failures: SweepOutput["failures"];
  skipped?: string;
};

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

async function writeLastRun(req: PayloadRequest, summary: Summary): Promise<void> {
  lastRunInProcess = summary.ranAt;
  const compact = { ...summary, failures: summary.failures.length, firstFailure: summary.failures[0]?.error ?? null };
  try {
    // Straight to the row: these two read-only fields are the job's, and a
    // Local API save would re-run the settings hooks (audit entry, the Live
    // preconditions) every few minutes for a timestamp.
    await runSql(
      req,
      sql`UPDATE payment_settings
             SET reconciliation_last_run_at = ${summary.ranAt}::timestamptz,
                 reconciliation_last_run_summary = ${JSON.stringify(compact)}::jsonb`,
    );
  } catch (error) {
    req.payload.logger.warn({ msg: "reconcile-payments: could not record the last run", error: scrubError(error) });
  }
}

/* ── 1. Unpaid orders: ask Mamo about their link ───────────────────────── */

async function checkLinks(req: PayloadRequest, gateway: PaymentGateway, summary: Summary): Promise<void> {
  const orders = await req.payload.find({
    collection: "orders",
    where: {
      and: [
        { mode: { equals: gateway.mode } },
        { channel: { equals: "online" } },
        {
          or: [
            { and: [{ status: { equals: "awaiting_payment" } }, { createdAt: { less_than: new Date(Date.now() - 90_000).toISOString() } }] },
            { and: [{ status: { equals: "failed" } }, { "hold.expiresAt": { greater_than: new Date().toISOString() } }] },
            { and: [{ status: { equals: "expired" } }, { expiredAt: { greater_than: minutesAgo(30) } }] },
          ],
        },
      ],
    },
    sort: "createdAt",
    limit: LIMIT,
    depth: 0,
    overrideAccess: true,
    req,
  });

  await eachItem(
    req,
    orders.docs as Order[],
    (o) => `order:${o.id}`,
    async (order) => {
      const paymentId = idOf(order.payment);
      if (!paymentId) return;
      const payment = (await req.payload.findByID({ collection: "payments", id: paymentId, depth: 0, overrideAccess: true, req })) as Payment;
      if (payment.provider !== "mamo" || !payment.providerLinkId) return;
      const link = await gateway.getLink(payment.providerLinkId);
      summary.linksChecked += 1;
      for (const charge of link.charges ?? []) {
        summary.chargesSeen += 1;
        // Re-read each time: the previous charge may have moved the order on.
        const current = (await req.payload.findByID({ collection: "orders", id: order.id, depth: 0, overrideAccess: true, req })) as Order;
        await applyPaymentSnapshot(req, current, charge, { source: "poller", mode: gateway.mode });
        if (String(charge.status) === "captured") await alertIfCapturedNotApplied(req, order.id, charge, summary);
      }
    },
    summary.failures,
  );
}

/** Mamo has the money; does the order show it? If not, a person must look (§H.6 "alert on any captured charge that could not be applied"). */
async function alertIfCapturedNotApplied(req: PayloadRequest, orderId: string, charge: MamoPayment, summary: Summary): Promise<void> {
  const after = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req })) as Order;
  if (["confirming", "confirmed", "completed", "refunded", "cancelled"].includes(after.status)) return;
  // An expired order whose late payment is being refunded is handled (needsReview + post_expiry refund), not lost.
  if (after.status === "expired" && after.needsReview) return;
  summary.capturedNotApplied += 1;
  if (!unappliedAlerts.take(`${orderId}:${charge.id}`)) return;
  await notifyStaff(
    req,
    "failed_payment",
    {
      // Booking, customer and total under the template's names (callerVars), then what went wrong.
      ...staffOrderVars(after),
      problem: "Mamo shows this payment as captured, but the booking could not be confirmed automatically. Please check the order.",
      reference: after.reference,
      orderStatus: after.status,
      mamoPaymentId: charge.id,
      links: { admin: await adminLink(req, `collections/orders/${orderId}`) },
    },
    { order: orderId },
  ).catch((error: unknown) => req.payload.logger.error({ msg: "reconcile-payments: could not alert staff", error: scrubError(error) }));
}

/* ── 2. Webhook deliveries our side failed to finish ───────────────────── */

async function closeEvent(req: PayloadRequest, id: string, fields: { order?: string; needsReview?: boolean; note?: string | null }): Promise<void> {
  await req.payload.update({
    collection: "payment-events",
    id,
    data: {
      processedAt: new Date().toISOString(),
      error: fields.note ?? null,
      ...(fields.order ? { order: fields.order } : {}),
      ...(fields.needsReview !== undefined ? { needsReview: fields.needsReview } : {}),
    },
    depth: 0,
    overrideAccess: true,
    req,
  });
}

async function reprocessEvents(req: PayloadRequest, summary: Summary): Promise<void> {
  const open = await req.payload.find({
    collection: "payment-events",
    where: { and: [{ verified: { equals: true } }, { processedAt: { exists: false } }, { receivedAt: { less_than: minutesAgo(5) } }] },
    sort: "receivedAt",
    limit: LIMIT,
    depth: 0,
    overrideAccess: true,
    req,
  });

  await eachItem(
    req,
    open.docs as PaymentEvent[],
    (e) => `event:${e.id}`,
    async (event) => {
      // The webhook's claim rule (§H.5 step 4): skip a row someone is processing right now.
      const claimed = await runSql(
        req,
        sql`UPDATE payment_events SET processing_started_at = now(), updated_at = now()
             WHERE id = ${event.id} AND verified = true AND processed_at IS NULL
               AND (processing_started_at IS NULL OR processing_started_at < now() - interval '2 minutes')
         RETURNING id`,
      );
      if (claimed.length === 0) return;
      try {
        await reprocessOne(req, event);
        summary.eventsReprocessed += 1;
      } catch (error) {
        // Not ours to retry for ever: Mamo says the payment does not exist (404), or the
        // delivery has failed for a whole day. Close it for a person to look at.
        const gaveUp = mamoErrorStatus(error) === 404 || (event.receivedAt && new Date(event.receivedAt).getTime() < Date.now() - GIVE_UP_AFTER_MS);
        if (gaveUp) {
          await closeEvent(req, event.id, { needsReview: true, note: `Gave up: ${scrubError(error, 500)}` });
          summary.eventsGivenUp += 1;
          return;
        }
        // Our failure again: record it and release the claim for the next run.
        await runSql(
          req,
          sql`UPDATE payment_events SET error = ${scrubError(error, 2000)}, processing_started_at = NULL, updated_at = now()
               WHERE id = ${event.id} AND processed_at IS NULL`,
        ).catch(() => undefined);
        throw error;
      }
    },
    summary.failures,
  );
}

/**
 * §H.5 steps 5–8 for one stored delivery: 3B's own processor, so the webhook
 * and this sweep cannot drift (dispute flagging, `connection_test`, order
 * lookup, `applyPaymentSnapshot`, closing the row). The stored body is only
 * a pointer; Mamo's GET is the truth. Throws on our failures, like the webhook.
 */
async function reprocessOne(req: PayloadRequest, event: PaymentEvent): Promise<void> {
  await processClaimedEvent(req, event.id);
}

/* ── 3. Orders paid but not finalised ──────────────────────────────────── */

async function requeueFinalize(req: PayloadRequest, summary: Summary): Promise<void> {
  const stuck = await req.payload.find({
    collection: "orders",
    // Paid but not finished: still `confirming`, or `confirmed` with no invoice yet
    // (finalize confirms first, then issues documents) — in the last week.
    where: {
      and: [
        { updatedAt: { less_than: minutesAgo(10) } },
        {
          or: [
            { status: { equals: "confirming" } },
            { and: [{ status: { equals: "confirmed" } }, { invoice: { exists: false } }, { confirmedAt: { greater_than: minutesAgo(7 * 24 * 60) } }] },
          ],
        },
      ],
    },
    limit: 20,
    depth: 0,
    overrideAccess: true,
    req,
    select: { status: true },
  });
  await eachItem(
    req,
    stuck.docs,
    (o) => `order:${o.id}`,
    async (order) => {
      const recent = await req.payload.count({
        collection: "payload-jobs",
        where: {
          and: [
            { concurrencyKey: { equals: `order:${order.id}` } },
            { workflowSlug: { equals: "finalize-order" } },
            { or: [{ createdAt: { greater_than: minutesAgo(60) } }, { and: [{ completedAt: { exists: false } }, { hasError: { not_equals: true } }] }] },
          ],
        },
        overrideAccess: true,
        req,
      });
      if (recent.totalDocs > 0) return;
      if (await enqueue(req, "finalize-order", { orderId: String(order.id) })) summary.finalizeRequeued += 1;
    },
    summary.failures,
  );
}

/* ── 4. Refunds waiting on Mamo ────────────────────────────────────────── */

async function syncOpenRefunds(req: PayloadRequest, gateway: PaymentGateway, summary: Summary): Promise<void> {
  const open = await req.payload.find({
    collection: "refunds",
    // A minute's grace so we never race the process-refund job that just posted.
    where: { and: [{ status: { equals: "processing" } }, { providerRequestAt: { less_than: minutesAgo(1) } }] },
    limit: 20,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const seen = new Set<string>();
  await eachItem(
    req,
    open.docs as Array<{ id: string; payment?: unknown; order?: unknown }>,
    (r) => `refund:${r.id}`,
    async (refund) => {
      const paymentId = idOf(refund.payment);
      const orderId = idOf(refund.order);
      if (!paymentId || !orderId || seen.has(paymentId)) return;
      seen.add(paymentId);
      const payment = (await req.payload.findByID({ collection: "payments", id: paymentId, depth: 0, overrideAccess: true, req })) as Payment;
      if (payment.provider !== "mamo" || payment.mode !== gateway.mode || !payment.providerPaymentId) return;
      const fetched = await gateway.getPayment(payment.providerPaymentId);
      const order = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req })) as Order;
      await syncRefunds(req, order, fetched);
      summary.refundsSynced += 1;
    },
    summary.failures,
  );
}

/* ── 4b. Refunds that succeeded but never finished ─────────────────────── */

async function finishSucceededRefunds(req: PayloadRequest, summary: Summary): Promise<void> {
  const unfinished = await req.payload.find({
    collection: "refunds",
    // A minute's grace so we never race the completion that is running right now.
    where: {
      and: [
        { status: { equals: "succeeded" } },
        { creditNote: { exists: false } },
        { updatedAt: { greater_than: minutesAgo(7 * 24 * 60) } },
        { updatedAt: { less_than: minutesAgo(1) } },
      ],
    },
    limit: 20,
    depth: 0,
    overrideAccess: true,
    req,
    select: { status: true },
  });
  await eachItem(
    req,
    unfinished.docs as Array<Pick<Refund, "id">>,
    (r) => `refund:${r.id}`,
    async (refund) => {
      await completeRefund(req, String(refund.id));
      summary.refundsCompleted += 1;
    },
    summary.failures,
  );
}

/* ── 5. Settlement figures ─────────────────────────────────────────────── */

async function refreshSettlements(req: PayloadRequest, gateway: PaymentGateway, summary: Summary): Promise<void> {
  const recent = await req.payload.find({
    collection: "payments",
    where: {
      and: [
        { provider: { equals: "mamo" } },
        { mode: { equals: gateway.mode } },
        { status: { in: ["captured", "partially_refunded", "refunded", "refund_pending"] } },
        { capturedAt: { greater_than: new Date(Date.now() - 48 * 3_600_000).toISOString() } },
        { "settlement.date": { exists: false } },
      ],
    },
    limit: 20,
    depth: 0,
    overrideAccess: true,
    req,
  });
  await eachItem(
    req,
    recent.docs as Payment[],
    (p) => `payment:${p.id}`,
    async (payment) => {
      if (!payment.providerPaymentId) return;
      const fetched = await gateway.getPayment(payment.providerPaymentId);
      if (!fetched.settlement_date && !fetched.settlement_amount) return;
      await req.payload.update({
        collection: "payments",
        id: payment.id,
        data: {
          settlement: {
            amount: fetched.settlement_amount ?? null,
            fee: fetched.settlement_fee ?? null,
            vat: fetched.settlement_vat ?? null,
            currency: settlementCurrency(fetched.settlement_amount) ?? "AED",
            date: fetched.settlement_date ?? null,
          },
        },
        depth: 0,
        overrideAccess: true,
        req,
      });
      summary.settlementsRefreshed += 1;
    },
    summary.failures,
  );
}

/* ── The task ──────────────────────────────────────────────────────────── */

export const reconcilePaymentsTask = defineTask({
  slug: "reconcile-payments",
  label: "Re-check payments with Mamo",
  retries: 0,
  concurrency: () => "reconcile-payments",
  schedule: cron("* * * * *"),
  alert: "task",
  run: async ({ req, job }) => {
    const settings = await readSettings<Settings>(req, PAYMENT_SETTINGS);
    const rec = settings.reconciliation ?? {};
    const lastRunAt = [rec.lastRunAt, lastRunInProcess].filter(Boolean).sort().pop() ?? null;
    if (!reconcileDue({ now: new Date(), enabled: rec.enabled ?? true, everyMinutes: rec.everyMinutes, lastRunAt })) {
      return { ran: false };
    }

    const summary: Summary = {
      ranAt: new Date().toISOString(),
      mode: null,
      linksChecked: 0,
      chargesSeen: 0,
      eventsReprocessed: 0,
      eventsGivenUp: 0,
      finalizeRequeued: 0,
      refundsSynced: 0,
      refundsCompleted: 0,
      settlementsRefreshed: 0,
      capturedNotApplied: 0,
      failures: [],
    };

    try {
      // Stored deliveries are replayed in their own mode, and finalize does not need Mamo — both run even when the active gateway is off.
      await reprocessEvents(req, summary);
      await requeueFinalize(req, summary);
      await finishSucceededRefunds(req, summary);

      const gateway = await getPaymentGateway(req);
      if (!gateway.isConfigured) {
        summary.skipped = `gateway disabled: ${gateway.reason}`;
      } else {
        summary.mode = gateway.mode;
        await checkLinks(req, gateway, summary);
        await syncOpenRefunds(req, gateway, summary);
        await refreshSettlements(req, gateway, summary);
      }
    } finally {
      await writeLastRun(req, summary);
    }

    await reportSweepFailures(req, "reconcile-payments", "Re-check payments with Mamo", job, summary.failures);
    return { ran: true, ...summary };
  },
});
