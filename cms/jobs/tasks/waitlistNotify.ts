import { notifyWaitlist } from "@/cms/lib/contracts";

import { defineTask } from "../shared";

/**
 * ==========================================================================
 * waitlist-notify — tell the next people in line that seats came back (§H.11)
 * ==========================================================================
 *
 * Queued when seats are released or refunded on a full / waitlist-only
 * session (cms/lib/inventory.ts) and by `expire-holds` when a notified
 * person's 24-hour token lapses while seats remain. `notifyWaitlist` (3A-1)
 * walks `waiting` rows first-come-first-served while their party fits in
 * the freed seats, mints each a token and emails `waitlist_seat_available`.
 * Seats are not reserved — the email says so.
 *
 * `session:<id>` makes notifications for one session strictly one at a
 * time: two releases a second apart must not both pick the same "next in
 * line" person.
 */

export const waitlistNotifyTask = defineTask({
  slug: "waitlist-notify",
  label: "Notify waitlist",
  retries: 2,
  concurrency: ({ input }) => `session:${input.sessionId}`,
  inputSchema: [
    { name: "sessionId", type: "text", required: true },
    { name: "freedSeats", type: "number", required: true },
  ],
  alert: "task",
  alertRefs: (input) => ({ session: input.sessionId }),
  run: async ({ input, req }) => {
    const freed = Math.max(0, Math.floor(Number(input.freedSeats) || 0));
    if (freed === 0) return { notified: 0 };
    return notifyWaitlist(req, input.sessionId, freed);
  },
});
