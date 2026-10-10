import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * applyPaymentSnapshot / syncRefunds / completeRefund / requestRefund
 * against an in-memory Payload (SPEC §K unit rows; the Phase 3 review
 * findings each have a case here):
 *
 *   · the poller replaying the same declined charge every run sends ONE
 *     payment_failed email and ONE staff alert, not one per run;
 *   · a decline replayed after the retry that paid (out-of-order webhooks,
 *     `charges[]` newest-first) leaves the row captured with the paying
 *     charge's id — no "payment failed" email to a customer who paid;
 *   · a second capture on the same link never overwrites the first: the
 *     order is flagged `double_capture`;
 *   · a capture for a session cancelled while the customer paid is refunded,
 *     never confirmed;
 *   · a Mamo refund entry is never matched onto an `approved` row nobody
 *     posted; a succeeded refund whose completion did not finish is resumed;
 *   · a refund request naming another order's ticket is refused, and the
 *     dialog's idempotency key is scoped to the order.
 *
 * The SQL statements (row locks, seat counters) answer with no rows: the
 * seat arithmetic has its own integration suite. What this checks is the
 * decision logic around them.
 */

// The return-page `k` is an HMAC under PAYLOAD_SECRET; a throwaway value for the test process only.
vi.hoisted(() => {
  process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-used-anywhere-else-000000";
});

const mocks = vi.hoisted(() => ({
  sendTemplated: vi.fn(async (_req: unknown, input: { key: string; vars?: Record<string, unknown>; refs?: Record<string, string> }) => ({ logId: `log-${input.key}`, status: "queued" })),
  notifyStaff: vi.fn(async () => ({ logIds: [] })),
  issueCreditNote: vi.fn(async () => ({ invoiceId: "inv-cn-1", number: "MP-CN-2026-000001" })),
}));

vi.mock("@/cms/lib/contracts", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  sendTemplated: mocks.sendTemplated,
  notifyStaff: mocks.notifyStaff,
  publicUrl: async () => "https://maison.test",
  signedTicketPdfUrl: async (_req: unknown, code: string) => `https://maison.test/t/${code}`,
  issueTickets: async () => ({ created: 0 }),
}));
vi.mock("@/cms/lib/invoiceNumber", () => ({ issueCreditNote: mocks.issueCreditNote, issueInvoice: vi.fn() }));
vi.mock("@/cms/lib/publicUrl", () => ({ publicUrl: async () => "https://maison.test" }));

const { applyPaymentSnapshot, completeRefund, requestRefund, syncRefunds } = await import("@/cms/lib/orders");

/* ── a tiny in-memory Payload ─────────────────────────────────────────── */

type Doc = Record<string, unknown> & { id: string };
type Where = Record<string, unknown>;

const idOf = (v: unknown) => (v && typeof v === "object" && "id" in v ? String((v as { id: unknown }).id) : v);
const at = (doc: Doc, path: string): unknown => path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), doc);

function matches(doc: Doc, where?: Where): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, cond]) => {
    if (key === "and") return (cond as Where[]).every((w) => matches(doc, w));
    if (key === "or") return (cond as Where[]).some((w) => matches(doc, w));
    const raw = key === "lines.session" ? ((doc.lines as Array<{ session?: unknown }>) ?? []).map((l) => l.session) : at(doc, key);
    const values = Array.isArray(raw) && key === "lines.session" ? raw.map(idOf) : [idOf(raw)];
    const c = cond as Record<string, unknown>;
    return values.some((value) => {
      if ("equals" in c) return value === c.equals;
      if ("not_equals" in c) return value !== c.not_equals;
      if ("in" in c) return (c.in as unknown[]).includes(value);
      if ("exists" in c) return c.exists ? value !== undefined && value !== null : value === undefined || value === null;
      if ("greater_than" in c) return String(value) > String(c.greater_than);
      if ("less_than" in c) return String(value) < String(c.less_than);
      return true;
    });
  });
}

function makeWorld() {
  const store: Record<string, Map<string, Doc>> = {};
  const table = (c: string) => (store[c] ??= new Map());
  let n = 0;
  const clone = <T>(v: T): T => structuredClone(v);
  const payload = {
    db: { drizzle: {}, sessions: {}, execute: async () => ({ rows: [] }) },
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    config: { jobs: { tasks: [{ slug: "notify-staff" }, { slug: "process-refund" }, { slug: "waitlist-notify" }], workflows: [{ slug: "finalize-order" }] } },
    jobs: { queue: vi.fn(async () => ({})) },
    findGlobal: async () => ({}),
    findByID: async ({ collection, id, disableErrors }: { collection: string; id: string; disableErrors?: boolean }) => {
      const doc = table(collection).get(id);
      if (!doc && !disableErrors) throw new Error(`${collection} ${id} not found`);
      return doc ? clone(doc) : null;
    },
    find: async ({ collection, where, limit }: { collection: string; where?: Where; limit?: number }) => {
      const docs = [...table(collection).values()].filter((d) => matches(d, where)).slice(0, limit ?? 100);
      return { docs: clone(docs), totalDocs: docs.length };
    },
    count: async ({ collection, where }: { collection: string; where?: Where }) => ({ totalDocs: [...table(collection).values()].filter((d) => matches(d, where)).length }),
    update: async ({ collection, id, data }: { collection: string; id: string; data: Record<string, unknown> }) => {
      const doc = table(collection).get(id);
      if (!doc) throw new Error(`${collection} ${id} not found`);
      Object.assign(doc, clone(data), { updatedAt: new Date().toISOString() });
      return clone(doc);
    },
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      const doc = { id: `${collection}-${++n}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...clone(data) } as Doc;
      table(collection).set(doc.id, doc);
      return clone(doc);
    },
  };
  const req = { payload, context: {}, transactionID: undefined, user: null } as unknown as PayloadRequest;
  const put = (collection: string, doc: Doc) => table(collection).set(doc.id, doc);
  const get = (collection: string, id: string) => table(collection).get(id) as Doc;
  return { req, put, get, table };
}

const LINK = "MB-LINK-1";
const SESSION = "11111111-1111-4111-8111-111111111111";

/** An online order of AED 240 awaiting payment on link MB-LINK-1, hold live. */
function seed(world: ReturnType<typeof makeWorld>, opts: { status?: string; paymentStatus?: string; providerPaymentId?: string } = {}) {
  world.put("sessions", { id: SESSION, title: "Candle Making", startsAt: "2026-10-24T06:00:00.000Z" });
  world.put("payments", { id: "pay-1", order: "ord-1", provider: "mamo", status: opts.paymentStatus ?? "link_ready", providerLinkId: LINK, providerPaymentId: opts.providerPaymentId, mode: "mock" });
  world.put("orders", {
    id: "ord-1",
    reference: "MP-TEST01",
    status: opts.status ?? "awaiting_payment",
    channel: "online",
    mode: "mock",
    payment: "pay-1",
    contact: { firstName: "Layla", lastName: "Haddad", email: "layla@example.com" },
    lines: [{ kind: "session", session: SESSION, title: "Candle Making", startsAt: "2026-10-24T06:00:00.000Z", venueName: "TSC", qty: 2, unitFils: 12000, lineFils: 24000 }],
    totals: { grossFils: 24000, vatFils: 1143, subtotalFils: 24000, discountFils: 0 },
    hold: { expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(), seatsBySession: { [SESSION]: 2 } },
    timeline: [],
  });
}

const charge = (id: string, status: string, extra: Record<string, unknown> = {}) =>
  ({ id, status, amount: 240, amount_currency: "AED", payment_link_id: LINK, error_code: status === "failed" ? "card_declined" : undefined, error_message: status === "failed" ? "Card declined" : undefined, ...extra }) as never;

const emailsOf = (key: string) => mocks.sendTemplated.mock.calls.filter(([, input]) => input.key === key);
const ctx = { source: "poller" as const, mode: "mock" as const };

beforeEach(() => {
  mocks.sendTemplated.mockClear();
  mocks.notifyStaff.mockClear();
  mocks.issueCreditNote.mockClear();
});

describe("applyPaymentSnapshot — failed charges are idempotent", () => {
  it("reconciling the same declined charge on every run emails the customer once", async () => {
    const w = makeWorld();
    seed(w);
    for (let run = 0; run < 3; run++) await applyPaymentSnapshot(w.req, w.get("orders", "ord-1") as never, charge("CHRG-FAIL-1", "failed"), ctx);
    expect(emailsOf("payment_failed")).toHaveLength(1);
    expect(mocks.notifyStaff).toHaveBeenCalledTimes(1);
    expect(w.get("orders", "ord-1").status).toBe("failed");
  });

  it("two declines on one link, replayed in turn, still email once each", async () => {
    const w = makeWorld();
    seed(w);
    for (let run = 0; run < 3; run++) {
      for (const id of ["CHRG-FAIL-1", "CHRG-FAIL-2"]) await applyPaymentSnapshot(w.req, w.get("orders", "ord-1") as never, charge(id, "failed"), ctx);
    }
    expect(emailsOf("payment_failed")).toHaveLength(2);
  });

  it("a decline seen after the retry that paid leaves the row captured with the paying charge", async () => {
    const w = makeWorld();
    seed(w);
    // charges[] newest-first: the capture, then the decline that preceded it.
    await applyPaymentSnapshot(w.req, w.get("orders", "ord-1") as never, charge("CHRG-PAID-2", "captured"), ctx);
    const out = await applyPaymentSnapshot(w.req, w.get("orders", "ord-1") as never, charge("CHRG-FAIL-1", "failed"), ctx);
    expect(out).toEqual({ applied: false, reason: "stale_charge" });
    expect(w.get("payments", "pay-1")).toMatchObject({ status: "captured", providerPaymentId: "CHRG-PAID-2" });
    expect(w.get("orders", "ord-1").status).toBe("confirming");
    expect(emailsOf("payment_failed")).toHaveLength(0);
  });

  it("a second capture on the same link is flagged, never written over the first", async () => {
    const w = makeWorld();
    seed(w);
    await applyPaymentSnapshot(w.req, w.get("orders", "ord-1") as never, charge("CHRG-PAID-1", "captured"), ctx);
    const out = await applyPaymentSnapshot(w.req, w.get("orders", "ord-1") as never, charge("CHRG-PAID-2", "captured"), ctx);
    await applyPaymentSnapshot(w.req, w.get("orders", "ord-1") as never, charge("CHRG-PAID-2", "captured"), ctx);
    expect(out.reason).toBe("double_capture");
    expect(w.get("payments", "pay-1").providerPaymentId).toBe("CHRG-PAID-1");
    expect(w.get("orders", "ord-1")).toMatchObject({ needsReview: true, reviewReason: "double_capture" });
    expect(mocks.notifyStaff).toHaveBeenCalledTimes(1); // the replay does not alert again
  });
});

describe("applyPaymentSnapshot — a cancelled session is never sold", () => {
  it("money for a session cancelled mid-payment is refunded in full and the order expires", async () => {
    const w = makeWorld();
    seed(w);
    Object.assign(w.get("sessions", SESSION), { cancelledAt: new Date().toISOString() });
    const out = await applyPaymentSnapshot(w.req, w.get("orders", "ord-1") as never, charge("CHRG-PAID-1", "captured"), ctx);
    expect(out.reason).toBe("refunded_cancelled_session");
    expect(w.get("orders", "ord-1")).toMatchObject({ status: "expired", reviewReason: "paid_cancelled_session" });
    const refunds = [...w.table("refunds").values()];
    expect(refunds).toHaveLength(1);
    expect(refunds[0]).toMatchObject({ status: "approved", amountFils: 24000, reason: "session_cancelled" });
    expect(String(refunds[0].idempotencyKey).length).toBeLessThanOrEqual(64); // the column's maxLength
    expect(emailsOf("session_cancelled")).toHaveLength(1);
    expect(emailsOf("session_cancelled")[0][1].refs).toMatchObject({ order: "ord-1", refund: refunds[0].id });
  });
});

describe("syncRefunds / completeRefund", () => {
  it("never pins an unposted `approved` row; an unknown refund is flagged once", async () => {
    const w = makeWorld();
    seed(w, { status: "confirmed", paymentStatus: "captured", providerPaymentId: "CHRG-PAID-1" });
    w.put("refunds", { id: "r-1", order: "ord-1", payment: "pay-1", amountFils: 5000, status: "approved", reason: "goodwill", releaseSeats: false, ticketsVoided: [] });
    const mamo = charge("CHRG-PAID-1", "refunded", { refunds: [{ id: "REFUND-DASH", amount: 50, created_date: "2026-10-10-01-00-00" }] });
    await syncRefunds(w.req, w.get("orders", "ord-1") as never, mamo);
    await syncRefunds(w.req, w.get("orders", "ord-1") as never, mamo);
    expect(w.get("refunds", "r-1").status).toBe("approved");
    expect(w.get("orders", "ord-1").reviewReason).toBe("unknown_refund");
    expect(mocks.notifyStaff).toHaveBeenCalledTimes(1);
  });

  it("matches a posted `processing` row and completes it with the credit note and the refund on the email", async () => {
    const w = makeWorld();
    seed(w, { status: "confirmed", paymentStatus: "captured", providerPaymentId: "CHRG-PAID-1" });
    w.put("refunds", { id: "r-1", order: "ord-1", payment: "pay-1", amountFils: 5000, status: "processing", providerRequestAt: new Date(Date.now() - 30_000).toISOString(), reason: "goodwill", ticketsVoided: [] });
    await syncRefunds(w.req, w.get("orders", "ord-1") as never, charge("CHRG-PAID-1", "refund_initiated", { refunds: [{ id: "REFUND-1", amount: 50 }] }));
    expect(w.get("refunds", "r-1")).toMatchObject({ status: "succeeded", providerRefundId: "REFUND-1" });
    const sent = emailsOf("order_refunded");
    expect(sent).toHaveLength(1);
    expect(sent[0][1].refs).toEqual({ order: "ord-1", refund: "r-1" });
    expect(lookupVar(sent[0][1], "creditNote.number")).toBe("MP-CN-2026-000001");
  });

  it("resumes a completion that stopped before the credit note, and emails only once", async () => {
    const w = makeWorld();
    seed(w, { status: "confirmed", paymentStatus: "partially_refunded", providerPaymentId: "CHRG-PAID-1" });
    w.put("refunds", { id: "r-1", order: "ord-1", payment: "pay-1", amountFils: 5000, status: "succeeded", providerRefundId: "REFUND-1", reason: "goodwill", ticketsVoided: [] });
    mocks.issueCreditNote.mockRejectedValueOnce(new Error("db timeout"));
    await completeRefund(w.req, "r-1"); // state done, credit note failed → no customer email yet
    expect(emailsOf("order_refunded")).toHaveLength(0);
    // The webhook retry / reconciler: the row is succeeded with no credit note → resumed.
    await syncRefunds(w.req, w.get("orders", "ord-1") as never, charge("CHRG-PAID-1", "refunded", { refunds: [{ id: "REFUND-1", amount: 50 }] }));
    expect(emailsOf("order_refunded")).toHaveLength(1);
    w.table("notification-log").set("log-1", { id: "log-1", refund: "r-1", templateKey: "order_refunded" });
    await completeRefund(w.req, "r-1");
    expect(emailsOf("order_refunded")).toHaveLength(1);
  });

  it("never refunds a ticket of another order, whatever the row lists", async () => {
    const w = makeWorld();
    seed(w, { status: "confirmed", paymentStatus: "captured", providerPaymentId: "CHRG-PAID-1" });
    w.put("tickets", { id: "t-other", order: "ord-OTHER", session: SESSION, status: "valid" });
    w.put("refunds", { id: "r-1", order: "ord-1", payment: "pay-1", amountFils: 5000, status: "succeeded", providerRefundId: "REFUND-1", reason: "goodwill", ticketsVoided: ["t-other"] });
    await completeRefund(w.req, "r-1");
    expect(w.get("tickets", "t-other").status).toBe("valid");
  });
});

describe("requestRefund — tickets and keys belong to the order", () => {
  it("refuses a ticket of another order", async () => {
    const w = makeWorld();
    seed(w, { status: "confirmed", paymentStatus: "captured" }); // no providerPaymentId → our own sums cap it
    w.put("tickets", { id: "t-other", order: "ord-OTHER", session: SESSION, status: "valid" });
    await expect(requestRefund(w.req, "ord-1", { amountFils: 1000, reason: "goodwill", ticketIds: ["t-other"] })).rejects.toMatchObject({ reason: "bad_tickets" });
  });

  it("does not hand back another order's refund for a colliding dialog key", async () => {
    const w = makeWorld();
    seed(w, { status: "confirmed", paymentStatus: "captured" });
    w.put("refunds", { id: "r-other", order: "ord-OTHER", amountFils: 9999, status: "requested", idempotencyKey: "dialog-key-123" });
    const refund = await requestRefund(w.req, "ord-1", { amountFils: 1000, reason: "goodwill", idempotencyKey: "dialog-key-123" });
    expect(refund.id).not.toBe("r-other");
    expect(idOf(refund.order)).toBe("ord-1");
    const again = await requestRefund(w.req, "ord-1", { amountFils: 1000, reason: "goodwill", idempotencyKey: "dialog-key-123" });
    expect(again.id).toBe(refund.id);
  });
});

function lookupVar(input: { vars?: Record<string, unknown> }, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), input.vars);
}
