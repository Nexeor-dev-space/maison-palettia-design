import type { PayloadRequest, RunInlineTaskFunction, WorkflowConfig } from "payload";

import { publicUrl, sendTemplated, signedInvoicePdfUrl, signedTicketPdfUrl, transition, type JobInputs, type Order } from "@/cms/lib/contracts";
import { staffOrderVars } from "@/cms/email/callerVars";
import { mintPassCode } from "@/cms/lib/reference";

import { formatDubaiWhen, formatFils, scrubError } from "../logic";
import { adminLink, alertFinalFailure, idOf, workflowAttempts, type JobLike } from "../shared";

/**
 * ==========================================================================
 * finalize-order — everything that happens once a booking is paid (§H.9)
 * ==========================================================================
 *
 * Queued when an order reaches `confirming`: a captured Mamo payment, a
 * desk booking, an order fully covered by pass credits or a 100 % promo.
 * Steps, in order — each idempotent, because a workflow retry re-runs any
 * step that did not record success and a crash can land between doing and
 * recording:
 *
 *   0. gate          only `confirming` / `confirmed` orders go on (a stale
 *                    re-queue of a cancelled or refunded order stops here);
 *   1. confirm       `confirming → confirmed`. First, because the paid
 *                    state is a fact the moment the money is captured, and
 *                    tickets are issued only for confirmed orders (3E's
 *                    `issueTickets` refuses anything else);
 *   2. issue-tickets one per seat (3E);
 *   3. issue-invoice the gapless number (3A-1);
 *   4. generate-invoice-pdf  stored in `invoice-files`;
 *   5. passes        a `pass-purchases` wallet per pass bought (code MPP-…);
 *   6. confirmation  `order_confirmation` to the customer (invoice and
 *                    tickets attached by `send-email` from the template's
 *                    switches), when there is an email address;
 *   7. notify-staff  `new_order`;
 *   8. bookkeeping   waitlist rows for this session + email → `converted`.
 *
 * A `confirmed` order with no invoice yet is therefore "finalize still
 * running (or failed)"; `reconcile-payments` re-queues finalize for such
 * orders after 10 minutes, as it does for ones stuck in `confirming`.
 *
 * Steps 2–4 and 7 are the registered tasks (also queueable alone); the
 * rest are inline steps. Payload restores a step that already succeeded
 * instead of running it again (`shouldRestore`), except the gate, which is
 * re-checked on every attempt.
 *
 * Retries: 3 for the workflow, exponential from 30 s. Concurrency
 * `order:<id>` (§H.9): one finalize per order at a time, shared with the
 * stand-alone ticket/invoice tasks so a re-issue cannot race it. A final
 * failure of any step emails staff once (`job_failed`, with the order).
 */

type Input = JobInputs["finalize-order"];
type StepTask = (taskID: string, args: { input: Record<string, unknown> }) => Promise<Record<string, unknown>>;

const WORKFLOW_SLUG = "finalize-order";
const RETRIES = { attempts: 3, backoff: { type: "exponential" as const, delay: 30_000 } };

/**
 * An inline step with the same final-failure alert as the registered tasks.
 * Payload gives inline tasks no `onFail`, so the wrapper catches, decides
 * whether this was the last attempt (the step's tries are on the job's task
 * status under "inline"), alerts, and rethrows for Payload's retry logic.
 */
function step(inlineTask: RunInlineTaskFunction, job: JobLike & { taskStatus?: unknown }, req: PayloadRequest, orderId: string) {
  return async <O extends object>(id: string, fn: () => Promise<O>, opts: { restore?: boolean } = {}): Promise<O> =>
    inlineTask<object, O>(id, {
      retries: { attempts: RETRIES.attempts, shouldRestore: opts.restore ?? true },
      task: async () => {
        try {
          return { output: await fn() };
        } catch (error) {
          const status = (job.taskStatus as Record<string, Record<string, { totalTried?: number }>> | undefined)?.inline?.[id];
          const attempts = workflowAttempts(req, job) ?? RETRIES.attempts;
          const final = (status?.totalTried ?? 0) >= attempts || (job.totalTried ?? 0) >= attempts;
          if (final) {
            await alertFinalFailure({ req, job, slug: `${WORKFLOW_SLUG}/${id}`, label: `Finalize booking — ${id}`, message: scrubError(error), scope: "job", refs: { order: orderId } });
          }
          throw error;
        }
      },
    });
}

const loadOrder = async (req: PayloadRequest, id: string): Promise<Order> =>
  (await req.payload.findByID({ collection: "orders", id, depth: 0, overrideAccess: true, req })) as Order;

/** 4. One wallet per pass bought (qty 2 = two codes); counts what exists so a retry adds only what is missing. */
async function createPassPurchases(req: PayloadRequest, order: Order): Promise<{ created: number; codes: string[] }> {
  const passLines = (order.lines ?? []).filter((line) => line.kind === "pass" && idOf(line.pass));
  if (passLines.length === 0) return { created: 0, codes: [] };
  const customerId = idOf(order.customer);
  if (!customerId) throw new Error("A pass was bought but the order has no customer to hold it.");

  let created = 0;
  const codes: string[] = [];
  for (const line of passLines) {
    const passId = idOf(line.pass)!;
    const pass = (await req.payload.findByID({ collection: "passes", id: passId, depth: 0, overrideAccess: true, req })) as { sessions?: number | null; validityDays?: number | null };
    const existing = await req.payload.find({
      collection: "pass-purchases",
      where: { and: [{ order: { equals: order.id } }, { pass: { equals: passId } }] },
      limit: 100,
      depth: 0,
      overrideAccess: true,
      req,
    });
    codes.push(...(existing.docs as Array<{ code: string }>).map((d) => d.code));
    const sessions = Math.max(1, pass.sessions ?? 1);
    const expiresAt = pass.validityDays ? new Date(Date.now() + pass.validityDays * 86_400_000).toISOString() : null;
    for (let n = existing.totalDocs; n < line.qty; n += 1) {
      // The unique index on `code` catches the (1-in-a-trillion) collision; try a fresh code once.
      for (let attempt = 0; ; attempt += 1) {
        const code = mintPassCode();
        try {
          await req.payload.create({
            collection: "pass-purchases",
            data: { code, status: "active", customer: customerId, order: order.id, pass: passId, sessionsTotal: sessions, sessionsRemaining: sessions, expiresAt },
            overrideAccess: true,
            req,
            context: { system: true },
          });
          codes.push(code);
          created += 1;
          break;
        } catch (error) {
          if (attempt >= 1) throw error;
        }
      }
    }
  }
  return { created, codes };
}

/** The variables the `order_confirmation` template is written against (research 03 §8.3). */
async function confirmationVars(
  req: PayloadRequest,
  order: Order,
  invoice: { number?: string | null; invoiceId?: string | null },
  passCodes: string[],
): Promise<Record<string, unknown>> {
  const base = (await publicUrl(req).catch(() => "")) || "";
  // Signed PDF links (3C, valid 30 days): the whole order's tickets through
  // its first valid ticket, and the invoice. Fall back to my-bookings when a
  // document does not exist (a pass-only order has no tickets).
  const first = await req.payload.find({
    collection: "tickets",
    where: { and: [{ order: { equals: order.id } }, { status: { in: ["valid", "checked_in"] } }] },
    sort: "seatNo",
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
    select: { code: true },
  });
  const code = (first.docs[0] as { code?: string } | undefined)?.code;
  const ticketsUrl = code ? await signedTicketPdfUrl(req, code, { scope: "order" }) : `${base}/my-bookings`;
  const invoiceUrl = invoice.invoiceId ? await signedInvoicePdfUrl(req, invoice.invoiceId) : `${base}/my-bookings`;
  return {
    customer: { firstName: order.contact.firstName, lastName: order.contact.lastName },
    order: { reference: order.reference, channel: order.channel },
    lines: (order.lines ?? []).map((line) => ({
      title: line.title,
      when: line.kind === "session" ? formatDubaiWhen(line.startsAt) : "",
      venue: line.venueName ?? "",
      qty: line.qty,
      total: formatFils(line.lineFils),
    })),
    totals: {
      subtotal: formatFils(order.totals.subtotalFils),
      discount: formatFils(order.totals.discountFils),
      gross: formatFils(order.totals.grossFils),
      vat: formatFils(order.totals.vatFils),
    },
    invoice: { number: invoice.number ?? "" },
    passes: passCodes.map((code) => ({ code })),
    links: { myBookings: `${base}/my-bookings`, tickets: ticketsUrl, invoice: invoiceUrl, bookingStatus: `${base}/booking-status` },
  };
}

export const finalizeOrderWorkflow: WorkflowConfig<Input> = {
  slug: WORKFLOW_SLUG,
  label: "Finalize booking",
  queue: "default",
  retries: RETRIES,
  concurrency: ({ input }) => `order:${input.orderId}`,
  inputSchema: [{ name: "orderId", type: "text", required: true }],
  handler: async ({ job, req, inlineTask, tasks }) => {
    const orderId = String(job.input.orderId);
    const run = step(inlineTask, job as unknown as JobLike & { taskStatus?: unknown }, req, orderId);
    // `tasks` is typed from the generated TypedJobs; these slugs are registered in cms/jobs/index.ts.
    const task = tasks as unknown as Record<"issue-tickets" | "issue-invoice" | "generate-invoice-pdf" | "notify-staff", StepTask>;

    // 0. Gate — re-checked on every attempt.
    const gate = await run(
      "gate",
      async () => {
        const order = await loadOrder(req, orderId);
        return { proceed: order.status === "confirming" || order.status === "confirmed", status: order.status };
      },
      { restore: false },
    );
    if (!gate.proceed) {
      req.payload.logger.info({ msg: "finalize-order: nothing to do", orderId, status: gate.status });
      return;
    }

    await run("confirm", async () => {
      const order = await loadOrder(req, orderId);
      if (order.status === "confirming") await transition(req, order, "confirmed", { note: "Payment complete — booking confirmed.", by: "system" });
      return { confirmed: true };
    });

    await task["issue-tickets"]("tickets", { input: { orderId } });
    const invoice = (await task["issue-invoice"]("invoice", { input: { orderId } })) as { invoiceId?: string; number?: string };
    if (invoice.invoiceId) await task["generate-invoice-pdf"]("invoice-pdf", { input: { invoiceId: invoice.invoiceId } });

    const passes = await run("passes", async () => createPassPurchases(req, await loadOrder(req, orderId)));

    await run("confirmation-email", async () => {
      const order = await loadOrder(req, orderId);
      const to = order.contact?.email?.trim();
      if (!to) return { sent: false, reason: "no email address" };
      const result = await sendTemplated(req, {
        key: "order_confirmation",
        to,
        vars: await confirmationVars(req, order, invoice, passes.codes),
        refs: { order: orderId },
      });
      // `invoices.emailedAt` is stamped by send-email when the message (with the invoice) actually leaves.
      return { sent: result.status === "queued", logId: result.logId };
    });

    const order = await loadOrder(req, orderId);
    await task["notify-staff"]("notify-new-order", {
      input: {
        event: "new_order",
        vars: {
          // The documented names (cms/email/variables.ts): `customer` as { name, email } and the lines
          // as objects, so `order.summary` is built — strings left the alert's booking summary blank.
          ...staffOrderVars(order, await adminLink(req, `collections/orders/${orderId}`)),
        },
        refs: { order: orderId },
      },
    });

    await run("bookkeeping", async () => {
      const fresh = await loadOrder(req, orderId);
      const email = fresh.contact?.email?.trim().toLowerCase();
      const sessionIds = [...new Set((fresh.lines ?? []).map((line) => idOf(line.session)).filter((id): id is string => Boolean(id)))];
      if (!email || sessionIds.length === 0) return { converted: 0 };
      const rows = await req.payload.find({
        collection: "waitlist",
        where: { and: [{ session: { in: sessionIds } }, { email: { equals: email } }, { status: { in: ["waiting", "notified"] } }] },
        limit: 20,
        depth: 0,
        overrideAccess: true,
        req,
      });
      for (const row of rows.docs) {
        await req.payload.update({ collection: "waitlist", id: row.id, data: { status: "converted", convertedOrder: orderId }, overrideAccess: true, req, context: { system: true } });
      }
      return { converted: rows.docs.length };
    });
  },
};
