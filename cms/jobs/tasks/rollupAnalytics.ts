import { ANALYTICS_DIMENSIONS, DIMENSION_SQL } from "@/cms/lib/analytics";
import { dubaiDay } from "@/cms/lib/crypto";

import { cron, defineTask, eachItem, inTransaction, reportSweepFailures, runSql, sql, type SweepOutput } from "../shared";

/**
 * ==========================================================================
 * rollup-analytics — raw page views → daily summaries (SPEC §D.6, §H.9)
 * ==========================================================================
 *
 * Hourly at :07. Rebuilds `analytics-daily` for every FINISHED Dubai day
 * that either has no summary yet (first run, catch-up after an outage) or
 * is one of the last two days (a beacon that arrived after midnight, or a
 * server event recorded late). Today is never rolled up: the Analytics view
 * reads today live from the raw rows (cms/lib/analyticsQueries.ts), so the
 * owner always sees the current count and the summary never holds a
 * half-day.
 *
 * Each day is one transaction: delete its summary rows, insert them again
 * from `analytics_events` with the shared `DIMENSION_SQL` expressions (the
 * same ones the live read uses). A rerun is therefore harmless, and the
 * `total` row is ALWAYS written — even for a day with no page views — so
 * `purge-retention` can tell "rolled up" from "not yet" by that row alone.
 *
 * Every key expression is non-null by construction (coalesce, or the
 * funnel's filter), so no row ever lands with an empty key.
 *
 * At most 31 days per run, oldest first; a longer backlog finishes over the
 * next hours. `GROUP BY 1, 3` (ordinals) because a key expression that
 * carries a bind parameter ("(direct)") would otherwise not match its own
 * GROUP BY copy, which Postgres numbers as a different parameter.
 */

const MAX_DAYS_PER_RUN = 31;
const RECENT_DAYS = 2;

export async function rollupDay(req: Parameters<typeof runSql>[0], day: string): Promise<void> {
  await inTransaction(req, async () => {
    await runSql(req, sql`delete from analytics_daily where day = ${day}`);
    await runSql(
      req,
      sql`insert into analytics_daily (day, dimension, key, views, visitors)
          select ${day}, 'total'::enum_analytics_daily_dimension, 'all',
                 count(*) filter (where e.kind = 'pv'),
                 count(distinct e.visitor) filter (where e.kind = 'pv')
          from analytics_events e where e.day = ${day}`,
    );
    for (const dimension of ANALYTICS_DIMENSIONS) {
      if (dimension === "total") continue;
      const { key, where } = DIMENSION_SQL[dimension];
      await runSql(
        req,
        sql`insert into analytics_daily (day, dimension, key, views, visitors)
            select e.day, ${sql.raw(`'${dimension}'`)}::enum_analytics_daily_dimension, ${key}, count(*), count(distinct e.visitor)
            from analytics_events e
            where e.day = ${day} and ${where}
            group by 1, 3`,
      );
    }
  });
}

export const rollupAnalyticsTask = defineTask({
  slug: "rollup-analytics",
  label: "Summarise page views",
  retries: 1,
  concurrency: () => "rollup-analytics",
  schedule: cron("0 7 * * * *"),
  alert: "task",
  run: async ({ req, job }) => {
    const failures: SweepOutput["failures"] = [];
    const today = dubaiDay();
    const recentFrom = dubaiDay(new Date(Date.now() - RECENT_DAYS * 86_400_000));
    const due = await runSql<{ day: string }>(
      req,
      sql`select distinct e.day from analytics_events e
          where e.day < ${today}
            and (e.day >= ${recentFrom}
                 or not exists (select 1 from analytics_daily d where d.day = e.day and d.dimension = 'total'))
          order by e.day
          limit ${MAX_DAYS_PER_RUN}`,
    );
    const days = due.map((row) => String(row.day));
    const rolled = await eachItem(req, days, (day) => `day:${day}`, (day) => rollupDay(req, day), failures);
    await reportSweepFailures(req, "rollup-analytics", "Summarise page views", job, failures);
    return { days, rolled, failures };
  },
});
