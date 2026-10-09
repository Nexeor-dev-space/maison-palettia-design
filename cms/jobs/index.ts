import type { JobsConfig, PayloadRequest } from "payload";

import { roleOf } from "@/cms/access/roles";
import { hasGlobal } from "@/cms/lib/publicUrl";

/**
 * ==========================================================================
 * Jobs Queue config — the skeleton Phase 3D fills with tasks (SPEC §H.9)
 * ==========================================================================
 *
 * Background work (confirmation emails, seat-hold expiry, payment checks,
 * reminders, rollups) runs in-process through Payload's queue, started once
 * per server by instrumentation.ts. Two queues:
 *
 *   · `email`   polled every 20 s — a customer is waiting for a ticket;
 *   · `default` polled every minute — everything else.
 *
 * Crons are fixed at build time (Payload reads them once at init), so no
 * setting re-plans them; settings that want a different cadence gate the
 * task body instead (reconciliation's `everyMinutes`, the digest hour).
 *
 * WHY THESE FOUR KEYS ARE HERE FROM PHASE 1:
 *
 *   · `enableConcurrencyControl: true` adds an indexed `concurrencyKey`
 *     column to `payload-jobs`, and columns belong in the initial migration,
 *     not a later additive one. Exclusivity between overlapping cron ticks
 *     comes ONLY from concurrency keys (`runJobs` runs a batch in parallel),
 *     so every Phase 3 task declares one.
 *   · `access`: Payload's defaults let any logged-in user run, queue and
 *     cancel jobs — an editor could cancel a refund. Admin only; server code
 *     queues through the Local API with `overrideAccess`.
 *   · `shouldAutoRun` reads `site-settings.jobsEnabled` on every tick, which
 *     is the owner's off switch (dashboard warning when off).
 *   · `deleteJobOnComplete: false` keeps the log for the admin's Retry
 *     button and for debugging; `purge-retention` removes rows after 14 d.
 *
 * `jobsCollectionOverrides` (Retry button, "System" group) is 3D's.
 *
 * WHY THERE IS ONE TASK IN A "NO TASKS" STUB. Payload only creates the
 * `payload-jobs` collection when the config has at least one task or
 * workflow (config/sanitize.js: `jobs.enabled = tasks.length ||
 * workflows.length`, verified in 3.90.2) — with an empty list there is no
 * table at all, and the whole point of setting `enableConcurrencyControl`
 * now is that `concurrency_key` lands in the INITIAL migration rather than
 * in a later additive one. `noop` is the smallest possible task: it does
 * nothing, succeeds, and doubles as the smoke test that the queue runs
 * ("queue a noop, run the queue, see it complete") for the Phase 1 reviewer
 * and the Phase 5 suite. 3D adds the real tasks beside it.
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
  ],
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
  enableConcurrencyControl: true,
  deleteJobOnComplete: false,
  addParentToTaskLog: true,
  access: { run: isAdminReq, queue: isAdminReq, cancel: isAdminReq },
};
