import { randomUUID } from "node:crypto";

import type { Payload, PayloadRequest } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import type { Invoice, Order, Payment, Refund, Ticket } from "@/payload-types";

import { bootPayload, hasDb, integrationDb, inventory, localReq, makeSession, query, runQueues, sql, staff, SYSTEM } from "../setup/payload";

/**
 * ==========================================================================
 * A booking from basket to refund, mock gateway, real webhook route
 * ==========================================================================
 *
 * SPEC §K integration rows: "webhook route: unverified → minimal row + 401,
 * duplicate claim → 200, verified + mock capture → order confirmed, tickets
 * issued, invoice numbered, notification-log row"; "a serialised
 * payment-events row contains no secret substring"; "process-refund finds
 * an existing refund via GET and does not POST again"; invoice numbering
 * and the VAT split; check-in verdicts (ok, duplicate, forced wrong-day,
 * refunded not forceable).
 *
 * The webhook is delivered to the real route handler
 * (app/(site)/api/site/webhooks/mamo/route.ts) as a `Request`, exactly as
 * Next would hand it over, carrying the mock gateway's delivery secret —
 * so verification, the claim, processing and the response codes are the
 * production code path. Only the card is fake.
 *
 * Throwaway database; payments are switched to mock and bookings opened by
 * SQL there (the admin's switch-on checks need a verified mailer and a
 * registered webhook — tested elsewhere, not the point here).
 */

let payload: Payload;
let POST: (request: Request) => Promise<Response>;
let mock: typeof import("@/cms/lib/mamo/mock");
let orders: typeof import("@/cms/lib/orders");
let tickets: typeof import("@/cms/lib/tickets");
let MOCK_HEADER: string;

beforeAll(async () => {
  if (!hasDb) return;
  payload = await bootPayload();
  await query(payload, sql`UPDATE payment_settings SET mode = 'mock'`);
  await query(payload, sql`UPDATE booking_settings SET bookings_open = true`);
  ({ POST } = await import("@/app/(site)/api/site/webhooks/mamo/route"));
  mock = await import("@/cms/lib/mamo/mock");
  orders = await import("@/cms/lib/orders");
  tickets = await import("@/cms/lib/tickets");
  MOCK_HEADER = (await import("@/cms/lib/mamo/verify")).MOCK_DELIVERY_HEADER;
});

const deliver = (body: Record<string, unknown>, secret: string | null) =>
  POST(
    new Request("http://127.0.0.1:9/api/site/webhooks/mamo", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "MamoPay-Mock/1.0", ...(secret === null ? {} : { [MOCK_HEADER]: secret }) },
      body: JSON.stringify(body),
    }),
  );

const orderOf = async (reference: string) =>
  (await payload.find({ collection: "orders", where: { reference: { equals: reference } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as Order;
const ticketsOf = async (orderId: string) =>
  (await payload.find({ collection: "tickets", where: { order: { equals: orderId } }, depth: 0, limit: 50, overrideAccess: true })).docs as Ticket[];
const invoicesOf = async (orderId: string) =>
  (await payload.find({ collection: "invoices", where: { order: { equals: orderId } }, depth: 0, limit: 50, overrideAccess: true, sort: "createdAt" })).docs as Invoice[];
const logsOf = async (orderId: string, templateKey: string) =>
  (await payload.find({ collection: "notification-log", where: { and: [{ order: { equals: orderId } }, { templateKey: { equals: templateKey } }] }, depth: 0, limit: 50, overrideAccess: true })).docs;

describe.skipIf(!hasDb)("checkout → Mamo (mock) → webhook → confirmed → refund", () => {
  let req: PayloadRequest;
  let session: { id: string; slug: string };
  let reference: string;
  let order: Order;
  let capture: Record<string, unknown>;

  it("starts checkout: an order awaiting payment, two seats held, a payment link", async () => {
    req = await localReq(payload);
    session = await makeSession(payload, { seats: 6, priceFils: 25_000 });
    const started = await orders.startCheckout(req, {
      basketId: randomUUID(),
      channel: "online",
      details: { firstName: "Ivy", lastName: "Integration", email: "ivy@example.test" },
      lines: [{ kind: "session", id: session.id, qty: 2 }],
      codes: [],
      consents: [],
      source: { ipHash: "it", userAgent: "vitest" },
    });
    expect(started).toHaveProperty("paymentUrl");
    reference = started.reference;
    order = await orderOf(reference);
    expect(order.status).toBe("awaiting_payment");
    expect(order.totals.grossFils).toBe(50_000);
    expect(await inventory(payload, session.id)).toEqual({ sold: 0, held: 2 });
  });

  it("an unverified delivery gets an empty 401, a minimal row, and changes nothing", async () => {
    const payment = (await payload.findByID({ collection: "payments", id: String(order.payment), depth: 0, overrideAccess: true })) as Payment;
    capture = mock.completeMockPayment(String(payment.providerLinkId), "captured");
    const body = mock.webhookBodyFor(capture as never, "payment.captured");

    const response = await deliver(body, "not-the-secret");
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("");
    expect((await orderOf(reference)).status).toBe("awaiting_payment");

    const rows = await query<{ verified: boolean; payload: unknown }>(payload, sql`SELECT verified, payload FROM payment_events ORDER BY created_at DESC LIMIT 1`);
    expect(rows[0]?.verified).toBe(false);
  });

  it("the verified delivery confirms the order: seats sold, tickets issued, invoice numbered with VAT, email logged", async () => {
    const response = await deliver(mock.webhookBodyFor(capture as never, "payment.captured"), mock.mockWebhookSecret());
    expect(response.status).toBe(200);
    await runQueues(payload);

    order = await orderOf(reference);
    expect(order.status).toBe("confirmed");
    expect(await inventory(payload, session.id)).toEqual({ sold: 2, held: 0 });

    const live = (await ticketsOf(order.id)).filter((t) => t.status === "valid");
    expect(live).toHaveLength(2);
    for (const t of live) expect(t.code).toMatch(/^MPT-[0-9A-HJKMNP-TV-Z]{8}$/);

    const [invoice] = await invoicesOf(order.id);
    const db = integrationDb()!;
    const year = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric" }).format(new Date()));
    expect(invoice.kind).toBe("invoice");
    expect(invoice.number).toBe(`${db.invoicePrefix}-${year}-000001`);
    // 5 % VAT included in AED 500.00: net = round(50000 × 10000 / 10500) = 47619, VAT = 2381.
    expect(invoice.totals).toMatchObject({ grossFils: 50_000, netFils: 47_619, vatFils: 2_381 });
    for (const line of invoice.lines ?? []) expect(line.netFils + line.vatFils).toBe(line.grossFils);
    expect(invoice.file).toBeTruthy(); // the PDF exists (private/invoices, removed by the global teardown)

    expect(await logsOf(order.id, "order_confirmation")).toHaveLength(1);
  });

  it("a duplicate delivery answers 200 'duplicate' and issues nothing twice", async () => {
    const response = await deliver(mock.webhookBodyFor(capture as never, "payment.captured"), mock.mockWebhookSecret());
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("duplicate");
    await runQueues(payload);
    expect(await ticketsOf(order.id)).toHaveLength(2);
    expect(await invoicesOf(order.id)).toHaveLength(1);
    expect(await logsOf(order.id, "order_confirmation")).toHaveLength(1);
  });

  it("no stored payment-events row contains the webhook secret, in any column", async () => {
    const secret = mock.mockWebhookSecret();
    const rows = await query(payload, sql`SELECT * FROM payment_events`);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(rows)).not.toContain(secret);
    expect(JSON.stringify(rows)).not.toContain("not-the-secret");
  });

  it("check-in: outside the window is wrong_day (forceable), forced is ok, again is already checked in", async () => {
    const desk = await localReq(payload, await staff(payload, "front-desk"));
    const [ticket] = (await ticketsOf(order.id)).filter((t) => t.status === "valid");
    const first = await tickets.checkIn(desk, { code: ticket.code, device: "manual" });
    expect(first.verdict).toBe("wrong_day"); // the session is three days away
    const forced = await tickets.checkIn(desk, { code: ticket.code, device: "manual", force: true });
    expect(forced.verdict).toBe("ok");
    const again = await tickets.checkIn(desk, { qr: ticket.qr ?? undefined, device: "camera" });
    expect(again.verdict).toBe("already_checked_in");
    const nonsense = await tickets.checkIn(desk, { code: "MPT-00000000", device: "manual" });
    expect(nonsense.verdict).toBe("not_found");
  });

  it("a full refund is posted to Mamo exactly once, even when process-refund runs again", async () => {
    const admin = await localReq(payload, await staff(payload, "admin"));
    const refund = await orders.requestRefund(admin, order.id, { amountFils: 50_000, reason: "customer_request", approve: true, idempotencyKey: `it-${randomUUID()}` });
    await runQueues(payload);

    // A Retry / duplicate job for the same refund: must find the refund Mamo already has.
    await payload.jobs.queue({ task: "process-refund", input: { refundId: refund.id, paymentId: String(order.payment), orderId: order.id } } as never);
    await runQueues(payload);

    const done = (await payload.findByID({ collection: "refunds", id: refund.id, depth: 0, overrideAccess: true })) as Refund;
    expect(done.status).toBe("succeeded");
    expect(mock.mockPayment(String(capture.id))?.refunds ?? []).toHaveLength(1);

    const notes = (await invoicesOf(order.id)).filter((i) => i.kind === "credit_note");
    expect(notes).toHaveLength(1);
    expect(notes[0].number).toMatch(new RegExp(`^${integrationDb()!.creditNotePrefix}-\\d{4}-000001$`));
    expect(notes[0].totals.grossFils).toBe(50_000);

    order = await orderOf(reference);
    expect(order.status).toBe("refunded");
    // The unused ticket's seat goes back on sale; the one checked in above was used and stays sold.
    expect(await inventory(payload, session.id)).toEqual({ sold: 1, held: 0 });
    const after = await ticketsOf(order.id);
    expect(after.map((t) => t.status).sort()).toEqual(["checked_in", "refunded"]);
    expect(await logsOf(order.id, "order_refunded")).toHaveLength(1);
  });

  it("a refunded ticket is refused at the door and cannot be forced in", async () => {
    const desk = await localReq(payload, await staff(payload, "front-desk"));
    const all = await ticketsOf(order.id);
    const unused = all.find((t) => t.status !== "checked_in") ?? all[0];
    const verdict = await tickets.checkIn(desk, { code: unused.code, device: "manual", force: true });
    expect(["refunded", "void"]).toContain(verdict.verdict);
  });

  it("invoice numbers stay contiguous across orders (next order gets 000002)", async () => {
    const deskReq = await localReq(payload, await staff(payload, "front-desk"));
    const started = await orders.startCheckout(deskReq, {
      basketId: randomUUID(),
      channel: "desk",
      details: { firstName: "Dana", lastName: "Desk", email: "dana@example.test" },
      lines: [{ kind: "session", id: session.id, qty: 1 }],
      codes: [],
      consents: [],
      desk: { method: "cash" },
      source: { ipHash: "it", userAgent: "vitest" },
    });
    await runQueues(payload);
    const deskOrder = await orderOf(started.reference);
    expect(deskOrder.status).toBe("confirmed");
    const [invoice] = await invoicesOf(deskOrder.id);
    expect(invoice.number).toMatch(/-000002$/);
    expect(invoice.paymentLabel).toBe("Paid at venue (cash)");
  });
});

describe.skipIf(!hasDb)("the booking switch", () => {
  it("online checkout is refused while bookings are closed; the desk can still sell", async () => {
    await query(payload, sql`UPDATE booking_settings SET bookings_open = false`);
    try {
      const session = await makeSession(payload, { seats: 3 });
      const req = await localReq(payload);
      await expect(
        orders.startCheckout(req, {
          basketId: randomUUID(),
          channel: "online",
          details: { firstName: "Closed", lastName: "Shop", email: "closed@example.test" },
          lines: [{ kind: "session", id: session.id, qty: 1 }],
          codes: [],
          consents: [],
          source: { ipHash: "it", userAgent: "vitest" },
        }),
      ).rejects.toMatchObject({ status: 503 });
      expect(await inventory(payload, session.id)).toEqual({ sold: 0, held: 0 });
    } finally {
      await query(payload, sql`UPDATE booking_settings SET bookings_open = true`);
    }
  });

  it("a draft session cannot be booked, whatever the basket says", async () => {
    const draft = await makeSession(payload, { status: "draft", seats: 5, context: SYSTEM });
    const req = await localReq(payload);
    await expect(
      orders.startCheckout(req, {
        basketId: randomUUID(),
        channel: "online",
        details: { firstName: "Draft", lastName: "Sneak", email: "sneak@example.test" },
        lines: [{ kind: "session", id: draft.id, qty: 1 }],
        codes: [],
        consents: [],
        source: { ipHash: "it", userAgent: "vitest" },
      }),
    ).rejects.toThrow();
    expect(await inventory(payload, draft.id)).toEqual({ sold: 0, held: 0 });
  });
});
