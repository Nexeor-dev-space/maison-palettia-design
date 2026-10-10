import { rawRetentionDays } from "@/cms/lib/analytics";
import { dubaiDay } from "@/cms/lib/crypto";

import { cron, defineTask, reportSweepFailures, runSql, sql, type SweepOutput } from "../shared";

/**
 * ==========================================================================
 * purge-retention — forget what we promised to forget (SPEC §H.9)
 * ==========================================================================
 *
 * Nightly at 02:30 (server time). Five independent clean-ups, each its own
 * statement so one failing does not stop the others:
 *
 *   · raw page views older than Analytics & tracking → "Keep raw page views
 *     for (days)" — ONLY for days that already have their `total` summary
 *     row, so the daily numbers can never be lost to a purge that ran
 *     before a rollup (the rollup always writes that row, even for a quiet
 *     day);
 *   · email log content after 30 days: `variables`, `html`, `text` are
 *     cleared (the row itself stays — who was emailed what and when is
 *     still useful; the stored links and the message body are not). The
 *     log's Resend button turns into "Expired — use the order's Resend";
 *   · finished background jobs after 14 days (their log lines go with them
 *     by the foreign key's cascade); failed ones are kept for Retry;
 *   · webhook deliveries that never verified, after 30 days;
 *   · empty session drafts older than a day — no experience and no date,
 *     i.e. an "Add a session" page opened and left before sessions stopped
 *     creating a row on open (Sessions.ts `drafts.validate`). They showed
 *     as "<No Title> · Draft" in the list and in the dashboard's Drafts
 *     tile. Deleted through the Local API so their versions go too.
 *
 * The 30/14/30 periods are fixed by the SPEC rather than settings: they
 * are privacy and hygiene rules, not preferences.
 */

const EMAIL_CONTENT_DAYS = 30;
const JOB_DAYS = 14;
const UNVERIFIED_WEBHOOK_DAYS = 30;
const EMPTY_DRAFT_HOURS = 24;

type Count = { n: number | string };
const countOf = (rows: Count[]) => Number(rows[0]?.n ?? 0);

export const purgeRetentionTask = defineTask({
  slug: "purge-retention",
  label: "Clear out old records",
  retries: 0,
  concurrency: () => "purge-retention",
  schedule: cron("0 30 2 * * *"),
  alert: "task",
  run: async ({ req, job }) => {
    const failures: SweepOutput["failures"] = [];
    const result = { analyticsDays: 0, analyticsRows: 0, emailContentCleared: 0, jobsDeleted: 0, webhooksDeleted: 0, emptySessionDrafts: 0 };

    const step = async (id: string, fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ id, error: message });
        req.payload.logger.error({ msg: `purge-retention: ${id} failed`, error: message });
      }
    };

    await step("analytics", async () => {
      result.analyticsDays = await rawRetentionDays(req.payload);
      const cutoff = dubaiDay(new Date(Date.now() - result.analyticsDays * 86_400_000));
      result.analyticsRows = countOf(
        await runSql<Count>(
          req,
          sql`with gone as (
                delete from analytics_events e
                where e.day < ${cutoff}
                  and exists (select 1 from analytics_daily d where d.day = e.day and d.dimension = 'total')
                returning 1)
              select count(*)::int as n from gone`,
        ),
      );
    });

    await step("notification-log", async () => {
      result.emailContentCleared = countOf(
        await runSql<Count>(
          req,
          sql`with cleared as (
                update notification_log set variables = null, html = null, text = null
                where created_at < now() - make_interval(days => ${EMAIL_CONTENT_DAYS})
                  and (variables is not null or html is not null or text is not null)
                returning 1)
              select count(*)::int as n from cleared`,
        ),
      );
    });

    await step("payload-jobs", async () => {
      result.jobsDeleted = countOf(
        await runSql<Count>(
          req,
          sql`with gone as (
                delete from payload_jobs
                where completed_at is not null and completed_at < now() - make_interval(days => ${JOB_DAYS})
                returning 1)
              select count(*)::int as n from gone`,
        ),
      );
    });

    await step("payment-events", async () => {
      result.webhooksDeleted = countOf(
        await runSql<Count>(
          req,
          sql`with gone as (
                delete from payment_events
                where verified = false and created_at < now() - make_interval(days => ${UNVERIFIED_WEBHOOK_DAYS})
                returning 1)
              select count(*)::int as n from gone`,
        ),
      );
    });

    await step("empty-session-drafts", async () => {
      const { docs } = await req.payload.find({
        collection: "sessions",
        draft: true,
        depth: 0,
        limit: 100,
        pagination: false,
        overrideAccess: true,
        where: {
          and: [
            { _status: { equals: "draft" } },
            { experience: { exists: false } },
            { startsAt: { exists: false } },
            { createdAt: { less_than: new Date(Date.now() - EMPTY_DRAFT_HOURS * 3_600_000).toISOString() } },
          ],
        },
        req,
      });
      for (const doc of docs) {
        await req.payload.delete({ collection: "sessions", id: doc.id, overrideAccess: true, req });
        result.emptySessionDrafts += 1;
      }
    });

    await reportSweepFailures(req, "purge-retention", "Clear out old records", job, failures);
    return { ...result, failures };
  },
});
