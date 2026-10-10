import { notifyStaff } from "@/cms/lib/contracts";

import { formatDubaiWhen, inventoryDrift, num, scrubError } from "../logic";
import { adminLink, cron, defineTask, eachItem, reportSweepFailures, runSql, sql, type SweepOutput } from "../shared";

/**
 * ==========================================================================
 * reconcile-inventory — do the seat counters still match reality? (§H.9)
 * ==========================================================================
 *
 * Nightly at 01:15. `session_inventory.seats_sold / seats_held` are fast
 * counters moved by four guarded statements (cms/lib/inventory.ts); this
 * recomputes them from the facts for every session that has not ended
 * more than two days ago, and reports any difference to staff:
 *
 *   sold = tickets that are `valid` or `checked_in`
 *        + seats of paid orders (`confirming`, or `confirmed` with no
 *          ticket at all) that `finalize-order` has not ticketed yet
 *   held = seat holds still `held`
 *
 * CORRECTING WITHOUT FIGHTING A SALE. A drifted row is corrected only when
 * nothing is in flight on that session (no order pending payment, awaiting
 * payment, failed-but-holding, or paid but not yet ticketed), and then with an optimistic
 * guard — the UPDATE matches only if the counters are still the values that
 * were read. A checkout that touched the row in between makes the UPDATE a
 * no-op, and the drift is reported instead of overwritten. Anything not
 * corrected is listed in the staff email for a person to look at.
 *
 * The alert goes out as `job_failed` with `kind: "inventory_drift"`: the
 * StaffEvent list (§O) has no dedicated event for it.
 */

type Row = {
  inventory_id: string;
  session_id: string;
  title: string | null;
  starts_at: string | null;
  seats_total: unknown;
  seats_sold: unknown;
  seats_held: unknown;
  tickets_sold: unknown;
  pending_sold: unknown;
  holds_held: unknown;
  live_orders: unknown;
};

const factsSql = sql`
  SELECT i.id AS inventory_id, s.id AS session_id, s.title AS title, s.starts_at AS starts_at, s.seats_total AS seats_total,
         i.seats_sold AS seats_sold, i.seats_held AS seats_held,
         (SELECT count(*) FROM tickets t
           WHERE t.session_id = s.id AND t.status IN ('valid', 'checked_in')) AS tickets_sold,
         (SELECT coalesce(sum(l.qty), 0) FROM orders_lines l JOIN orders o ON o.id = l._parent_id
           WHERE l.session_id = s.id AND o.status IN ('confirming', 'confirmed')
             AND NOT EXISTS (SELECT 1 FROM tickets t2 WHERE t2.order_id = o.id)) AS pending_sold,
         (SELECT coalesce(sum(h.qty), 0) FROM seat_holds h
           WHERE h.session_id = s.id AND h.status = 'held') AS holds_held,
         (SELECT count(*) FROM orders_lines l2 JOIN orders o2 ON o2.id = l2._parent_id
           WHERE l2.session_id = s.id
             AND (o2.status IN ('pending_payment', 'awaiting_payment', 'failed', 'confirming')
                  OR (o2.status = 'confirmed' AND NOT EXISTS (SELECT 1 FROM tickets t3 WHERE t3.order_id = o2.id)))) AS live_orders
    FROM session_inventory i JOIN sessions s ON s.id = i.session_id
   WHERE s.starts_at > now() - interval '2 days'
   ORDER BY s.starts_at`;

export const reconcileInventoryTask = defineTask({
  slug: "reconcile-inventory",
  label: "Check seat counts",
  retries: 0,
  concurrency: () => "reconcile-inventory",
  schedule: cron("0 15 1 * * *"),
  alert: "task",
  run: async ({ req, job }) => {
    const failures: SweepOutput["failures"] = [];
    const rows = await runSql<Row>(req, factsSql);
    const drifted: Array<Record<string, unknown>> = [];
    let corrected = 0;

    await eachItem(
      req,
      rows,
      (r) => `session:${r.session_id}`,
      async (row) => {
        const seatsSold = num(row.seats_sold);
        const seatsHeld = num(row.seats_held);
        const verdict = inventoryDrift({
          seatsSold,
          seatsHeld,
          ticketsSold: num(row.tickets_sold),
          pendingSold: num(row.pending_sold),
          holdsHeld: num(row.holds_held),
          liveOrders: num(row.live_orders),
        });
        if (!verdict.drift) return;

        let fixed = false;
        if (verdict.correctable) {
          const updated = await runSql(
            req,
            sql`UPDATE session_inventory
                   SET seats_sold = ${verdict.expectedSold}, seats_held = ${verdict.expectedHeld}, updated_at = now()
                 WHERE id = ${row.inventory_id} AND seats_sold = ${seatsSold} AND seats_held = ${seatsHeld}
             RETURNING id`,
          );
          fixed = updated.length > 0;
          if (fixed) corrected += 1;
        }
        drifted.push({
          session: row.title ?? row.session_id,
          when: formatDubaiWhen(row.starts_at ? new Date(String(row.starts_at)).toISOString() : null),
          capacity: num(row.seats_total),
          counters: { sold: seatsSold, held: seatsHeld },
          actual: { sold: verdict.expectedSold, held: verdict.expectedHeld },
          corrected: fixed,
          links: { admin: await adminLink(req, `collections/sessions/${row.session_id}`) },
        });
      },
      failures,
    );

    await runSql(req, sql`UPDATE system_state SET last_inventory_reconcile_at = now(), updated_at = now()`).catch((error: unknown) =>
      req.payload.logger.warn({ msg: "reconcile-inventory: could not stamp system-state", error: scrubError(error) }),
    );

    if (drifted.length > 0) {
      await notifyStaff(req, "job_failed", {
        kind: "inventory_drift",
        task: "Check seat counts",
        taskSlug: "reconcile-inventory",
        jobId: String(job.id),
        error: `${drifted.length} session(s) had seat counts that did not match tickets and holds; ${corrected} corrected automatically.`,
        sessions: drifted.slice(0, 20),
      }).catch((error: unknown) => req.payload.logger.error({ msg: "reconcile-inventory: could not alert staff", error: scrubError(error) }));
    }

    await reportSweepFailures(req, "reconcile-inventory", "Check seat counts", job, failures);
    return { sessions: rows.length, drifted: drifted.length, corrected, details: drifted.slice(0, 20), failures };
  },
});
