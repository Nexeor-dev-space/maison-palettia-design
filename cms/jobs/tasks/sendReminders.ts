import type { PayloadRequest } from "payload";

import { publicUrl, sendTemplated, signedTicketPdfUrl, type Order } from "@/cms/lib/contracts";

import { formatDubaiWhen, reminderWindow } from "../logic";
import { cron, defineTask, eachItem, idOf, reportSweepFailures, runSql, sql, type SweepOutput } from "../shared";

/**
 * ==========================================================================
 * send-reminders — "see you tomorrow", 24 hours before (SPEC §H.8)
 * ==========================================================================
 *
 * A sweep every 15 minutes rather than a delayed job queued at purchase:
 * an admin can Reschedule a session, and a job waiting since the purchase
 * would fire at the old time. Each run looks at sessions starting 23–25 h
 * from now; the two-hour window is wider than the 15-minute cadence, so a
 * restart or a missed tick still catches every session.
 *
 * IDEMPOTENT BY STAMP. Only tickets with no `reminderSentAt` are picked up,
 * and they are stamped as soon as the email is queued — one email per order
 * and session, however many runs see it. Reschedule (3A-1) clears the
 * stamps so the new time gets its own reminder. The order's
 * `remindersSentAt` and the session's `reminderSentAt` are stamped too, for
 * the admin; the session stamp is written straight to the published row so
 * it neither creates a version nor publishes an editor's pending draft.
 *
 * Only `confirmed` orders with an email address are reminded; the tickets
 * of an order without one are stamped anyway (there is no one to tell, and
 * re-checking them every 15 minutes would be pointless).
 */

type SessionDoc = { id: string; title?: string | null; startsAt: string; venue?: { name?: string | null } | string | null; experience?: { name?: string | null; title?: string | null } | string | null };
type TicketDoc = { id: string; order: unknown; session: unknown };

/** Signed link (3C, 30 days) to the order's tickets via one of the reminded seats; my-bookings if none is readable. */
async function remindedTicketsUrl(req: PayloadRequest, ticketIds: string[], base: string): Promise<string> {
  const ticket = ticketIds[0]
    ? ((await req.payload.findByID({ collection: "tickets", id: ticketIds[0], depth: 0, overrideAccess: true, disableErrors: true, req })) as { code?: string } | null)
    : null;
  return ticket?.code ? signedTicketPdfUrl(req, ticket.code, { scope: "order" }) : `${base}/my-bookings`;
}

export const sendRemindersTask = defineTask({
  slug: "send-reminders",
  label: "Send 24-hour reminders",
  retries: 0,
  concurrency: () => "send-reminders",
  schedule: cron("0 */15 * * * *"),
  alert: "task",
  run: async ({ req, job }) => {
    const failures: SweepOutput["failures"] = [];
    const { from, to } = reminderWindow(new Date());
    const sessions = await req.payload.find({
      collection: "sessions",
      where: {
        and: [
          { startsAt: { greater_than_equal: from.toISOString() } },
          { startsAt: { less_than: to.toISOString() } },
          // Cancelled is `cancelledAt`. `bookingStatus: closed` only stops sales (an owner closes a full or
          // imminent session by hand) — its ticket holders still need their reminder.
          { cancelledAt: { exists: false } },
        ],
      },
      limit: 100,
      depth: 1,
      overrideAccess: true,
      req,
    });
    if (sessions.docs.length === 0) return { sessions: 0, emails: 0, ticketsStamped: 0, failures };

    const base = (await publicUrl(req).catch(() => "")) || "";
    let emails = 0;
    let ticketsStamped = 0;

    await eachItem(
      req,
      sessions.docs as unknown as SessionDoc[],
      (s) => `session:${s.id}`,
      async (session) => {
        const tickets = await req.payload.find({
          collection: "tickets",
          where: { and: [{ session: { equals: session.id } }, { status: { equals: "valid" } }, { reminderSentAt: { exists: false } }] },
          limit: 1000,
          depth: 0,
          overrideAccess: true,
          req,
        });
        const byOrder = new Map<string, string[]>();
        for (const ticket of tickets.docs as unknown as TicketDoc[]) {
          const orderId = idOf(ticket.order);
          if (!orderId) continue;
          byOrder.set(orderId, [...(byOrder.get(orderId) ?? []), String(ticket.id)]);
        }

        const venue = typeof session.venue === "object" && session.venue ? (session.venue.name ?? "") : "";
        const experience = typeof session.experience === "object" && session.experience ? (session.experience.name ?? session.experience.title ?? "") : "";
        const title = session.title || experience || "Your session";

        await eachItem(
          req,
          [...byOrder.entries()],
          ([orderId]) => `order:${orderId}`,
          async ([orderId, ticketIds]) => {
            const order = (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req })) as Order;
            const email = order.contact?.email?.trim();
            if (order.status === "confirmed" && email) {
              await sendTemplated(req, {
                key: "ticket_reminder_24h",
                to: email,
                vars: {
                  customer: { firstName: order.contact.firstName, lastName: order.contact.lastName },
                  order: { reference: order.reference },
                  event: { title, when: formatDubaiWhen(session.startsAt), venue, startsAt: session.startsAt },
                  tickets: { count: ticketIds.length },
                  links: { tickets: await remindedTicketsUrl(req, ticketIds, base), myBookings: `${base}/my-bookings` },
                },
                refs: { order: orderId, session: session.id },
              });
              emails += 1;
            }
            const stampedAt = new Date().toISOString();
            await req.payload.update({
              collection: "tickets",
              where: { id: { in: ticketIds } },
              data: { reminderSentAt: stampedAt },
              depth: 0,
              overrideAccess: true,
              req,
              context: { system: true },
            });
            ticketsStamped += ticketIds.length;
            if (order.status === "confirmed" && email) {
              await req.payload.update({ collection: "orders", id: orderId, data: { remindersSentAt: stampedAt }, depth: 0, overrideAccess: true, req, context: { system: true } });
            }
          },
          failures,
        );
        await runSql(req, sql`UPDATE sessions SET reminder_sent_at = now() WHERE id = ${session.id} AND reminder_sent_at IS NULL`);
      },
      failures,
    );

    await reportSweepFailures(req, "send-reminders", "Send 24-hour reminders", job, failures);
    return { sessions: sessions.docs.length, emails, ticketsStamped, failures };
  },
});
