import type { PayloadRequest, Where } from "payload";

import { notifyStaff } from "@/cms/lib/contracts";

import { digestDue, dubaiDayBounds, formatDubaiWhen, formatFils } from "../logic";
import { adminLink, cron, defineTask, readSettings, runSql, sql } from "../shared";

/**
 * ==========================================================================
 * send-daily-digest — yesterday in one email (SPEC §H.8, §H.9)
 * ==========================================================================
 *
 * SCHEDULED HOURLY, SENDS ONCE A DAY. The owner picks the hour (Settings →
 * Notifications → Daily digest, Dubai time) but crons are fixed at build
 * time, so the task wakes every hour on the `email` queue and sends only
 * when the Dubai hour matches and `system-state.lastDigestDay` is not
 * today (`digestDue`, logic.ts).
 *
 * ONCE, EVEN WITH TWO SERVERS. The day is CLAIMED before anything is sent:
 * one guarded UPDATE moves `lastDigestDay` to today only if it was not
 * already today. A failure while building or sending puts the previous
 * value back, so the single retry (§H.9: retries 1) — or the next hour if
 * the setting allows — can try again.
 *
 * What it reports, for the Dubai day before: confirmed orders and revenue
 * (online / desk), refunds paid, new enquiries and waitlist sign-ups,
 * failed emails and background tasks; and, as of now: orders needing review,
 * open disputes, today's sessions with seats sold.
 */

type DigestSettings = { dailyDigest?: boolean | null; dailyDigestHour?: number | null };

async function count(req: PayloadRequest, collection: string, where: Where): Promise<number> {
  const result = await req.payload.count({ collection: collection as never, where, overrideAccess: true, req });
  return result.totalDocs;
}

async function buildDigest(req: PayloadRequest, reportDay: string, today: string): Promise<Record<string, unknown>> {
  const { start, end } = dubaiDayBounds(reportDay);
  const range = (field: string): Where => ({ and: [{ [field]: { greater_than_equal: start.toISOString() } }, { [field]: { less_than: end.toISOString() } }] });

  const confirmed = await req.payload.find({
    collection: "orders",
    where: range("confirmedAt"),
    limit: 2000,
    depth: 0,
    overrideAccess: true,
    req,
    select: { channel: true, totals: true },
  });
  const revenue = { online: 0, desk: 0 };
  for (const order of confirmed.docs as Array<{ channel?: string; totals?: { grossFils?: number } }>) {
    revenue[order.channel === "desk" ? "desk" : "online"] += order.totals?.grossFils ?? 0;
  }

  const refunds = await req.payload.find({
    collection: "refunds",
    where: { and: [{ status: { equals: "succeeded" } }, range("updatedAt")] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
    req,
    select: { amountFils: true },
  });
  const refundedFils = (refunds.docs as Array<{ amountFils?: number }>).reduce((sum, r) => sum + (r.amountFils ?? 0), 0);

  const todayBounds = dubaiDayBounds(today);
  const sessionsToday = await req.payload.find({
    collection: "sessions",
    where: { and: [{ startsAt: { greater_than_equal: todayBounds.start.toISOString() } }, { startsAt: { less_than: todayBounds.end.toISOString() } }] },
    sort: "startsAt",
    limit: 50,
    depth: 0,
    overrideAccess: true,
    req,
  });

  return {
    day: reportDay,
    orders: {
      count: confirmed.totalDocs,
      online: (confirmed.docs as Array<{ channel?: string }>).filter((o) => o.channel !== "desk").length,
      desk: (confirmed.docs as Array<{ channel?: string }>).filter((o) => o.channel === "desk").length,
    },
    revenue: { online: formatFils(revenue.online), desk: formatFils(revenue.desk), total: formatFils(revenue.online + revenue.desk) },
    refunds: { count: refunds.totalDocs, total: formatFils(refundedFils) },
    enquiries: { count: await count(req, "enquiries", range("createdAt")) },
    waitlist: { count: await count(req, "waitlist", range("createdAt")) },
    problems: {
      failedEmails: await count(req, "notification-log", { and: [{ status: { equals: "failed" } }, range("updatedAt")] }),
      failedJobs: await count(req, "payload-jobs", { and: [{ hasError: { equals: true } }, range("updatedAt")] }),
      needsReview: await count(req, "orders", { needsReview: { equals: true } }),
      disputes: await count(req, "orders", { disputed: { equals: true } }),
    },
    today: (sessionsToday.docs as Array<{ title?: string | null; startsAt: string; seatsTotal?: number; seatsSold?: number | null }>).map((s) => ({
      title: s.title ?? "Session",
      when: formatDubaiWhen(s.startsAt),
      sold: s.seatsSold ?? null,
      capacity: s.seatsTotal ?? null,
    })),
    links: { admin: await adminLink(req, "") },
  };
}

export const sendDailyDigestTask = defineTask({
  slug: "send-daily-digest",
  label: "Send daily digest",
  retries: 1,
  concurrency: () => "send-daily-digest",
  schedule: cron("0 0 * * * *", "email"),
  alert: "never",
  run: async ({ req }) => {
    const settings = await readSettings<DigestSettings>(req, "notification-settings");
    const state = await runSql<{ last_digest_day: string | null }>(req, sql`SELECT last_digest_day FROM system_state LIMIT 1`);
    const previous = state[0]?.last_digest_day ?? null;
    const due = digestDue({ now: new Date(), enabled: settings.dailyDigest, hour: settings.dailyDigestHour, lastDigestDay: previous });
    if (!due.send) return { sent: false };
    if (state.length === 0) return { sent: false, reason: "system-state not initialised yet" };

    // Claim the day: exactly one run gets a row back.
    const claimed = await runSql(
      req,
      sql`UPDATE system_state SET last_digest_day = ${due.today}, updated_at = now()
           WHERE last_digest_day IS DISTINCT FROM ${due.today}
       RETURNING id`,
    );
    if (claimed.length === 0) return { sent: false, reason: "already sent today" };

    try {
      const vars = await buildDigest(req, due.reportDay, due.today);
      const { logIds } = await notifyStaff(req, "daily_digest", vars);
      return { sent: true, day: due.reportDay, recipients: logIds.length };
    } catch (error) {
      await runSql(req, sql`UPDATE system_state SET last_digest_day = ${previous} WHERE last_digest_day = ${due.today}`).catch(() => undefined);
      throw error;
    }
  },
});
