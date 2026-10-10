import { deliverNotification } from "@/cms/lib/contracts";

import { defineTask, logOnly } from "../shared";

/**
 * ==========================================================================
 * send-email — deliver one notification-log row (SPEC §H.8)
 * ==========================================================================
 *
 * `sendTemplated` (3C) renders a message NOW — subject, HTML, text — stores
 * it on a `notification-log` row as `queued` and queues this task with the
 * row id (job inputs carry ids only). This task hands the row to the
 * mailer's `deliverNotification` (cms/lib/mailer.ts), which applies the
 * current Email settings (SMTP / Resend / log-only, from-address, reply-to,
 * bcc) on every send and owns the delivery rules:
 *
 *   · Idempotent: a row already `sent` (or `skipped`) is left alone, so a
 *     retry after "sent, but the status write failed" does not email the
 *     customer twice. A Resend from the admin therefore creates a NEW row.
 *   · Attachments are rebuilt from ids, because a Buffer cannot travel
 *     through the queue: the template's `attachInvoice` / `attachTickets`
 *     switches decide, and the row's `order` / `refund` / `session` refs say
 *     which documents (a refund email attaches the credit note).
 *   · `invoices.emailedAt` is stamped only when the invoice actually left.
 *   · A failure stamps the row `failed` with the scrubbed error and rethrows.
 *
 * Here: five retries, exponential from 30 s (30 s, 1, 2, 4, 8 min) — long
 * enough to ride out a provider blip, short enough that a customer gets
 * tickets the same quarter-hour. The final failure emails staff
 * (`job_failed`) — unless the message IS a staff alert (`admin_*`), which
 * only logs, so an SMTP outage cannot turn into a loop of "the alert about
 * the alert failed".
 *
 * Runs on the `email` queue (polled every 20 s); callers queue it there
 * (cms/jobs/shared.ts `enqueue` does).
 */

const isStaffTemplate = (key: string | null | undefined): boolean => typeof key === "string" && key.startsWith("admin_");

export const sendEmailTask = defineTask({
  slug: "send-email",
  label: "Send email",
  retries: { attempts: 5, backoff: { type: "exponential", delay: 30_000 } },
  concurrency: ({ input }) => `email:${input.logId}`,
  inputSchema: [{ name: "logId", type: "text", required: true }],
  // Per task, not per job: when the provider is down every email fails at once; one alert an hour says so.
  alert: "task",
  run: async ({ input, req }) => {
    try {
      return await deliverNotification(req, input.logId);
    } catch (error) {
      const row = (await req.payload
        .findByID({ collection: "notification-log", id: input.logId, depth: 0, overrideAccess: true, req })
        .catch(() => null)) as { templateKey?: string | null } | null;
      throw isStaffTemplate(row?.templateKey) ? logOnly(error) : error;
    }
  },
});
