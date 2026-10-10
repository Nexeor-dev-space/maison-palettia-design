import { expireOrder, releaseSeats } from "@/cms/lib/contracts";

import { num } from "../logic";
import { cron, defineTask, eachItem, enqueue, inTransaction, reportSweepFailures, runSql, sql, type SweepOutput } from "../shared";

/**
 * ==========================================================================
 * expire-holds — give back seats nobody paid for (SPEC §H.6)
 * ==========================================================================
 *
 * Every minute, exclusive (`concurrency: "expire-holds"`). Three passes:
 *
 *  1. ORDERS whose hold ran out without a capture (`pending_payment`,
 *     `awaiting_payment`, `failed` past `hold.expiresAt`, or with an expired
 *     `held` seat-hold) go through `expireOrder` (3A-1): → `expired`, Mamo
 *     link deactivated, pass credits and promo use restored, holds released.
 *
 *  2. STRAGGLER HOLDS — `held` rows past `expiresAt` that pass 1 did not
 *     settle. The order's state decides, because releasing a hold whose
 *     order is still payable would let a late capture consume seats that
 *     were already handed to someone else:
 *       · order `expired` → release: one guarded statement flips the hold
 *         `held → released` and only then `releaseSeats` runs, in the same
 *         transaction — a hold can be released once, never twice (so
 *         `seats_held` cannot be decremented for somebody else's hold);
 *       · order already captured (`confirming`, `confirmed`, `completed`,
 *         `cancelled`, `refunded`) → the seats were consumed at capture;
 *         the row is only relabelled `consumed`, the counters are untouched;
 *       · order still payable → left for pass 1 on the next minute
 *         (`expireOrder` failed this time, e.g. Mamo did not answer).
 *
 *  3. WAITLIST TOKENS — `notified` rows past `tokenExpiresAt` become
 *     `expired`; when that session still has seats and people waiting,
 *     `waitlist-notify` is queued for the next in line (§H.11). Seats freed
 *     by passes 1–2 need no queueing here: `releaseSeats` (3A-1) queues
 *     `waitlist-notify` itself when a full or waitlist-only session gets
 *     seats back.
 *
 * One item failing never stops the sweep; failures are listed in the job's
 * output and reported to staff (at most hourly).
 */

const PAYABLE = ["pending_payment", "awaiting_payment", "failed"] as const;
const BATCH = 100;

export const expireHoldsTask = defineTask({
  slug: "expire-holds",
  label: "Expire unpaid holds",
  retries: 0,
  concurrency: () => "expire-holds",
  schedule: cron("* * * * *"),
  alert: "task",
  run: async ({ req, job }) => {
    const failures: SweepOutput["failures"] = [];
    const now = new Date().toISOString();

    // ── 1. Orders past their hold ───────────────────────────────────────
    const byTimer = await req.payload.find({
      collection: "orders",
      where: { and: [{ status: { in: [...PAYABLE] } }, { "hold.expiresAt": { less_than: now } }] },
      limit: BATCH,
      depth: 0,
      overrideAccess: true,
      req,
      select: { status: true },
    });
    const byHold = await runSql<{ order_id: string }>(
      req,
      sql`SELECT DISTINCT h.order_id AS order_id
            FROM seat_holds h JOIN orders o ON o.id = h.order_id
           WHERE h.status = 'held' AND h.expires_at < now()
             AND o.status IN ('pending_payment', 'awaiting_payment', 'failed')
           LIMIT ${BATCH}`,
    );
    const orderIds = [...new Set([...byTimer.docs.map((d) => String(d.id)), ...byHold.map((r) => String(r.order_id))])];
    const ordersExpired = await eachItem(req, orderIds, (id) => `order:${id}`, (id) => expireOrder(req, id), failures);

    // ── 2. Straggler holds ──────────────────────────────────────────────
    const stragglers = await runSql<{ id: string; order_status: string }>(
      req,
      sql`SELECT h.id AS id, o.status AS order_status
            FROM seat_holds h JOIN orders o ON o.id = h.order_id
           WHERE h.status = 'held' AND h.expires_at < now()
             AND o.status NOT IN ('pending_payment', 'awaiting_payment', 'failed')
           LIMIT ${BATCH * 2}`,
    );
    let holdsReleased = 0;
    let holdsRelabelled = 0;
    await eachItem(
      req,
      stragglers,
      (h) => `hold:${h.id}`,
      async (hold) => {
        if (hold.order_status === "expired") {
          await inTransaction(req, async () => {
            const claimed = await runSql<{ session_id: string; qty: unknown }>(
              req,
              sql`UPDATE seat_holds SET status = 'released', updated_at = now()
                   WHERE id = ${hold.id} AND status = 'held'
               RETURNING session_id, qty`,
            );
            if (claimed[0] && num(claimed[0].qty) > 0) {
              await releaseSeats(req, String(claimed[0].session_id), num(claimed[0].qty));
              holdsReleased += 1;
            }
          });
        } else {
          const relabelled = await runSql(req, sql`UPDATE seat_holds SET status = 'consumed', updated_at = now() WHERE id = ${hold.id} AND status = 'held' RETURNING id`);
          holdsRelabelled += relabelled.length;
        }
      },
      failures,
    );

    // ── 3. Waitlist tokens ──────────────────────────────────────────────
    const lapsed = await req.payload.find({
      collection: "waitlist",
      where: { and: [{ status: { equals: "notified" } }, { tokenExpiresAt: { less_than: now } }] },
      limit: BATCH * 2,
      depth: 0,
      overrideAccess: true,
      req,
      select: { session: true },
    });
    const sessions = new Set<string>();
    const waitlistExpired = await eachItem(
      req,
      lapsed.docs as Array<{ id: string; session?: unknown }>,
      (w) => `waitlist:${w.id}`,
      async (row) => {
        await req.payload.update({ collection: "waitlist", id: row.id, data: { status: "expired" }, overrideAccess: true, req, context: { system: true } });
        const sessionId = typeof row.session === "object" && row.session ? String((row.session as { id: unknown }).id) : String(row.session ?? "");
        if (sessionId) sessions.add(sessionId);
      },
      failures,
    );
    let waitlistRequeued = 0;
    await eachItem(
      req,
      [...sessions],
      (id) => `session:${id}`,
      async (sessionId) => {
        const [row] = await runSql<{ remaining: unknown; has_waiting: boolean }>(
          req,
          sql`SELECT greatest(0, s.seats_total - i.seats_sold - i.seats_held) AS remaining,
                     EXISTS (SELECT 1 FROM waitlist w WHERE w.session_id = s.id AND w.status = 'waiting') AS has_waiting
                FROM sessions s JOIN session_inventory i ON i.session_id = s.id
               WHERE s.id = ${sessionId} AND s.booking_status <> 'closed' AND s.starts_at > now()`,
        );
        const remaining = num(row?.remaining);
        if (row?.has_waiting && remaining > 0 && (await enqueue(req, "waitlist-notify", { sessionId, freedSeats: remaining }))) waitlistRequeued += 1;
      },
      failures,
    );

    await reportSweepFailures(req, "expire-holds", "Expire unpaid holds", job, failures);
    return {
      ordersExpired,
      holdsReleased,
      holdsRelabelled,
      waitlistExpired,
      waitlistRequeued,
      failures,
    } satisfies SweepOutput;
  },
});
