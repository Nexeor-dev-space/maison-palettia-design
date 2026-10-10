import { notifyStaff, type StaffEvent } from "@/cms/lib/contracts";

import { defineTask } from "../shared";

/**
 * ==========================================================================
 * notify-staff — a staff alert, sent from the queue (SPEC §H.8, §H.9)
 * ==========================================================================
 *
 * Code that must not wait for (or fail because of) email — a checkout
 * transaction crossing the low-seats threshold, the `finalize-order` step
 * "tell staff about the new order" — queues this instead of calling
 * `notifyStaff` (3C) directly. `notifyStaff` renders one `admin_*` email per
 * subscribed recipient and queues a `send-email` for each, so this task is
 * quick; its three retries cover a database hiccup while rendering.
 *
 * It never raises a "background task failed" alert about itself: that
 * alert is a staff notification too, and would fail the same way.
 */

const STAFF_EVENTS = [
  "new_order",
  "failed_payment",
  "refund_requested",
  "refund",
  "dispute",
  "new_enquiry",
  "waitlist_joined",
  "job_failed",
  "low_seats",
  "settings_changed",
  "webhook_unverified_spike",
  "daily_digest",
] as const satisfies readonly StaffEvent[];

export const notifyStaffTask = defineTask({
  slug: "notify-staff",
  label: "Notify staff",
  retries: 3,
  // Per event, so two different alerts never wait on each other but a burst of one kind is sent in order.
  concurrency: ({ input }) => `notify:${input.event}`,
  inputSchema: [
    { name: "event", type: "select", options: [...STAFF_EVENTS], required: true },
    { name: "vars", type: "json", required: true },
    { name: "refs", type: "json" },
  ],
  alert: "never",
  run: async ({ input, req }) => {
    const { logIds } = await notifyStaff(req, input.event, input.vars ?? {}, input.refs ?? undefined);
    return { queued: logIds.length };
  },
});
