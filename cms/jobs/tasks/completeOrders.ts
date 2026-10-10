import { transition, type Order } from "@/cms/lib/contracts";

import { orderEndsAt } from "../logic";
import { cron, defineTask, eachItem, reportSweepFailures, type SweepOutput } from "../shared";

/**
 * ==========================================================================
 * complete-orders — close bookings whose sessions are over (SPEC §H.1)
 * ==========================================================================
 *
 * Nightly at 01:00 (server time). A `confirmed` order becomes `completed`
 * once the LAST of its sessions has ended (start + duration). `completed`
 * is what the status page and my-bookings show for past visits, and it
 * takes the order out of the "today / upcoming" views.
 *
 * Pass-only orders are left `confirmed`: there is no session to finish,
 * and the pass itself lives on in `pass-purchases`. Orders are paged so a
 * backlog (the first run after launch, a long outage) is cleared in one
 * night without loading every order at once.
 */

const PAGE = 100;
const MAX_PAGES = 50;

export const completeOrdersTask = defineTask({
  slug: "complete-orders",
  label: "Complete past orders",
  retries: 0,
  concurrency: () => "complete-orders",
  schedule: cron("0 0 1 * * *"),
  alert: "task",
  run: async ({ req, job }) => {
    const failures: SweepOutput["failures"] = [];
    const now = new Date();
    let completed = 0;
    let checked = 0;
    const skipped = new Set<string>();

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const batch = await req.payload.find({
        collection: "orders",
        // Any session line already started is a cheap pre-filter; `orderEndsAt` decides.
        where: { and: [{ status: { equals: "confirmed" } }, { "lines.startsAt": { less_than: now.toISOString() } }, ...(skipped.size ? [{ id: { not_in: [...skipped] } }] : [])] },
        sort: "createdAt",
        limit: PAGE,
        depth: 0,
        overrideAccess: true,
        req,
      });
      if (batch.docs.length === 0) break;
      for (const order of batch.docs as Order[]) {
        checked += 1;
        const ends = orderEndsAt(order.lines);
        if (!ends || ends > now) skipped.add(String(order.id));
      }
      const due = (batch.docs as Order[]).filter((o) => !skipped.has(String(o.id)));
      const before = failures.length;
      completed += await eachItem(
        req,
        due,
        (o) => `order:${o.id}`,
        async (order) => {
          await transition(req, order, "completed", { note: "All sessions on this booking have taken place.", by: "system" });
        },
        failures,
      );
      // Failed ones would be found again on the next page query; skip them for the rest of this run.
      for (const failure of failures.slice(before)) skipped.add(failure.id.replace(/^order:/, ""));
      if (batch.docs.length < PAGE) break;
    }

    await reportSweepFailures(req, "complete-orders", "Complete past orders", job, failures);
    return { checked, completed, failures };
  },
});
