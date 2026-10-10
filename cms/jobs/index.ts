import type { JobsConfig, PayloadRequest } from "payload";

import { roleOf } from "@/cms/access/roles";
import { hasGlobal } from "@/cms/lib/publicUrl";

import { jobsCollectionOverrides } from "./collectionOverrides";
import { completeOrdersTask } from "./tasks/completeOrders";
import { expireHoldsTask } from "./tasks/expireHolds";
import { notifyStaffTask } from "./tasks/notifyStaff";
import { generateInvoicePdfTask, issueInvoiceTask, issueTicketsTask } from "./tasks/orderSteps";
import { processRefundTask } from "./tasks/processRefund";
import { purgeRetentionTask } from "./tasks/purgeRetention";
import { reconcileInventoryTask } from "./tasks/reconcileInventory";
import { reconcilePaymentsTask } from "./tasks/reconcilePayments";
import { rollupAnalyticsTask } from "./tasks/rollupAnalytics";
import { sendDailyDigestTask } from "./tasks/sendDailyDigest";
import { sendEmailTask } from "./tasks/sendEmail";
import { sendRemindersTask } from "./tasks/sendReminders";
import { waitlistNotifyTask } from "./tasks/waitlistNotify";
import { finalizeOrderWorkflow } from "./workflows/finalizeOrder";

export { enqueue } from "./shared";

/**
 * ==========================================================================
 * Jobs Queue config (SPEC §H.9) — Phase 3 tasks on the Phase 1 skeleton
 * ==========================================================================
 *
 * Background work (confirmation emails, seat-hold expiry, payment checks,
 * reminders, refunds) runs in-process through Payload's queue, started
 * once per server by instrumentation.ts (`getPayload({ cron: true })`).
 * Payload itself never starts crons during `next build` (`isNextBuild()`
 * in BasePayload._initializeCrons), instrumentation returns early in the
 * build phase, and `shouldAutoRun` below refuses too — three locks on the
 * one door that must never open: a build worker running jobs against the
 * production database.
 *
 * TWO QUEUES, TWO TICKS:
 *
 *   · `email`   every 20 s — `send-email` (a customer is waiting for a
 *               ticket) and the hourly `send-daily-digest`;
 *   · `default` every minute — everything else.
 *
 * FIXED CRONS (the reality of §H.9). Each tick first queues the tasks
 * whose `schedule` is due (`handleSchedules`, at most one pending run per
 * task), then runs the queue. The crons are read once when Payload starts,
 * so no setting can re-plan them; settings that want another cadence gate
 * the task body instead — `reconcile-payments` is scheduled every minute
 * and runs when `everyMinutes` have passed, the digest is scheduled hourly
 * and sends in the owner's chosen hour.
 *
 *   task / workflow         schedule (s m h …)   queue    retries        concurrency key
 *   ─────────────────────   ──────────────────   ──────   ────────────   ──────────────────
 *   expire-holds            * * * * *            default  0              expire-holds
 *   reconcile-payments      * * * * * (gated)    default  0              reconcile-payments
 *   send-reminders          0 *\/15 * * * *      default  0              send-reminders
 *   complete-orders         0 0 1 * * *          default  0              complete-orders
 *   reconcile-inventory     0 15 1 * * *         default  0              reconcile-inventory
 *   send-daily-digest       0 0 * * * * (gated)  email    1              send-daily-digest
 *   rollup-analytics        0 7 * * * *          default  1              rollup-analytics
 *   purge-retention         0 30 2 * * *         default  0              purge-retention
 *   finalize-order (wf)     on capture/desk      default  3, exp 30 s    order:<orderId>
 *   issue-tickets           workflow / action    default  3              order:<orderId>
 *   issue-invoice           workflow / action    default  3              order:<orderId>
 *   generate-invoice-pdf    workflow / action    default  3              invoice:<invoiceId>
 *   send-email              sendTemplated        email    5, exp 30 s    email:<logId>
 *   notify-staff            hooks / workflow     default  3              notify:<event>
 *   process-refund          refund approved      default  0              payment:<paymentId>
 *   waitlist-notify         seats released       default  2              session:<sessionId>
 *
 * `runJobs` runs a picked batch in parallel and overlapping ticks can pick
 * new jobs, so EXCLUSIVITY COMES ONLY FROM CONCURRENCY KEYS: a sweep has a
 * fixed key (one at a time), per-entity work keys on the entity. Phase 4A
 * added `rollup-analytics` and `purge-retention` (cms/jobs/tasks/).
 *
 * WHY THE PHASE 1 KEYS ARE HERE:
 *
 *   · `enableConcurrencyControl: true` adds the indexed `concurrencyKey`
 *     column to `payload-jobs` (it landed in the initial migration).
 *   · `access`: Payload's defaults let any logged-in user run, queue and
 *     cancel jobs — an editor could cancel a refund. Admin only; server code
 *     queues through the Local API, which skips these checks.
 *   · `shouldAutoRun` reads `site-settings.jobsEnabled` on every tick — the
 *     owner's off switch (the dashboard shows a red warning while it is off).
 *   · `deleteJobOnComplete: false` keeps the log for the admin's Retry
 *     button and for debugging; `purge-retention` removes rows after 14 d.
 *
 * `noop` stays: it is the queue health check from Phase 1 ("queue a noop,
 * run the queue, see it complete") and costs nothing.
 *
 * MIGRATION NOTE (for the schema owner). Registering these tasks changes
 * the `payload-jobs` schema: new values in the `task_slug` enums (job,
 * log, log parent), a `workflow_slug` column + enum (the first workflow),
 * and — because tasks now have a `schedule` — a `meta` json column and the
 * `payload-jobs-stats` global table. Until the Phase 3 migration includes
 * them, the job runner cannot read or write `payload-jobs`.
 */

const isAdminReq = ({ req }: { req: PayloadRequest }) => roleOf(req) === "admin";

export const jobsConfig: JobsConfig = {
  tasks: [
    {
      slug: "noop",
      label: "No-op (queue health check)",
      retries: 0,
      concurrency: () => "noop",
      handler: async () => ({ output: {} }),
    },
    // Sweeps on fixed crons.
    expireHoldsTask,
    reconcilePaymentsTask,
    sendRemindersTask,
    completeOrdersTask,
    reconcileInventoryTask,
    sendDailyDigestTask,
    // Phase 4A (analytics): hourly page-view summaries, nightly retention purge.
    rollupAnalyticsTask,
    purgeRetentionTask,
    // Per-order / per-entity work.
    issueTicketsTask,
    issueInvoiceTask,
    generateInvoicePdfTask,
    sendEmailTask,
    notifyStaffTask,
    processRefundTask,
    waitlistNotifyTask,
  ],
  workflows: [finalizeOrderWorkflow],
  autoRun: [
    { cron: "*/20 * * * * *", queue: "email", limit: 20 },
    { cron: "* * * * *", queue: "default", limit: 25 },
  ],
  shouldAutoRun: async (payload) => {
    if (process.env.NEXT_PHASE === "phase-production-build") return false;
    // Until the settings globals exist (Phase 1C lands them) there is no switch to read.
    if (!hasGlobal(payload, "site-settings")) return true;
    try {
      const settings = (await payload.findGlobal({
        slug: "site-settings",
        depth: 0,
        overrideAccess: true,
        select: { jobsEnabled: true },
      })) as { jobsEnabled?: unknown };
      return settings?.jobsEnabled !== false;
    } catch (error) {
      payload.logger.warn({ err: error }, "jobs: could not read site-settings.jobsEnabled; skipping this tick");
      return false;
    }
  },
  jobsCollectionOverrides,
  enableConcurrencyControl: true,
  deleteJobOnComplete: false,
  addParentToTaskLog: true,
  access: { run: isAdminReq, queue: isAdminReq, cancel: isAdminReq },
};
