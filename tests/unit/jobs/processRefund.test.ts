import { PgDialect } from "@payloadcms/db-postgres/drizzle/pg-core";
import type { SQL } from "@payloadcms/db-postgres/drizzle";
import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `process-refund` (SPEC §H.7, §K "process-refund finds an existing refund
 * via GET and does not POST again"): the refund protocol against a fake
 * database and a fake gateway. The SQL the task sends is rendered with
 * drizzle's real Postgres dialect and answered by a tiny state machine for
 * the one refund row, so the claim / put-back / fail transitions are the
 * statements the task really issues.
 */

const contracts = vi.hoisted(() => ({
  gateway: null as unknown,
  syncRefunds: vi.fn(async () => undefined),
  notifyStaff: vi.fn(async () => ({ logIds: ["log-1"] })),
}));

vi.mock("@/cms/lib/contracts", () => ({
  getPaymentGateway: vi.fn(async () => contracts.gateway),
  syncRefunds: contracts.syncRefunds,
  notifyStaff: contracts.notifyStaff,
  publicUrl: vi.fn(async () => "http://localhost:3200"),
}));

const { processRefundTask } = await import("@/cms/jobs/tasks/processRefund");

class FakeMamoError extends Error {
  constructor(
    public status: number,
    public messages: string[],
  ) {
    super(messages.join("; "));
  }
}

type RefundState = { status: string; providerRequestAt: string | null };

function makeWorld(initial: Partial<RefundState> = {}, paymentOrder = "ord-1") {
  const refund: RefundState = { status: "approved", providerRequestAt: null, ...initial };
  const dialect = new PgDialect();
  const statements: string[] = [];
  const bound: unknown[][] = [];
  const updates: Array<{ collection: string; data: Record<string, unknown> }> = [];

  const execute = async ({ sql: query }: { sql: SQL }) => {
    const { sql: text, params } = dialect.sqlToQuery(query);
    statements.push(text);
    bound.push(params);
    if (text.includes("SET status = 'processing'")) {
      if (refund.status !== "approved") return { rows: [] };
      refund.status = "processing";
      refund.providerRequestAt = "2026-10-10T10:00:00.000Z";
      return { rows: [{ provider_request_at: refund.providerRequestAt }] };
    }
    for (const to of ["approved", "failed", "requested"]) {
      if (text.includes(`SET status = '${to}'`) && refund.status === "processing") {
        refund.status = to;
        return { rows: [] };
      }
    }
    return { rows: [] };
  };

  const docs: Record<string, Record<string, unknown>> = {
    refunds: { id: "ref-1", amountFils: 5000, status: "approved", payment: "pay-1", order: "ord-1", reason: "customer_request" },
    payments: { id: "pay-1", provider: "mamo", providerPaymentId: "PAY-MAMO-1", mode: "mock", order: paymentOrder },
    orders: { id: "ord-1", reference: "MP-ABC234", status: "confirmed" },
  };

  const payload = {
    db: { drizzle: {}, sessions: {}, execute },
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: { jobs: { workflows: [], tasks: [] } },
    findByID: vi.fn(async ({ collection }: { collection: string }) => docs[collection]),
    find: vi.fn(async () => ({ docs: [], totalDocs: 0 })),
    update: vi.fn(async (args: { collection: string; data: Record<string, unknown> }) => {
      updates.push({ collection: args.collection, data: args.data });
      return {};
    }),
  };
  const req = { payload, context: {}, transactionID: undefined } as unknown as PayloadRequest;
  return { refund, req, statements, bound, updates };
}

function makeGateway(payment: Record<string, unknown>, refund?: () => Promise<unknown>) {
  return {
    isConfigured: true,
    mode: "mock",
    getPayment: vi.fn(async () => payment),
    refund: vi.fn(refund ?? (async () => ({ refund_amount: 50, refund_status: "refund_initiated" }))),
  };
}

const run = (req: PayloadRequest) =>
  (processRefundTask.handler as (args: unknown) => Promise<{ output: Record<string, unknown> }>)({
    input: { refundId: "ref-1", paymentId: "pay-1", orderId: "ord-1" },
    req,
    job: { id: "job-1", totalTried: 0 },
    inlineTask: vi.fn(),
    tasks: {},
  });

beforeEach(() => {
  contracts.syncRefunds.mockClear();
  contracts.notifyStaff.mockClear();
});

describe("process-refund", () => {
  it("posts once, then lets syncRefunds record the outcome", async () => {
    const world = makeWorld();
    const gateway = makeGateway({ id: "PAY-MAMO-1", status: "captured", max_refund_amount: 100, refunds: [] });
    contracts.gateway = gateway;

    const { output } = await run(world.req);

    expect(output.outcome).toBe("posted");
    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect(gateway.refund).toHaveBeenCalledWith("PAY-MAMO-1", 50);
    expect(contracts.syncRefunds).toHaveBeenCalledTimes(1);
    expect(world.refund.status).toBe("processing"); // succeeded is syncRefunds' call, not ours
  });

  it("never posts twice: a second run (Retry, a duplicate job) exits at the claim", async () => {
    const world = makeWorld();
    const gateway = makeGateway({ id: "PAY-MAMO-1", status: "captured", max_refund_amount: 100, refunds: [] });
    contracts.gateway = gateway;

    await run(world.req);
    const second = await run(world.req);

    expect(second.output).toEqual({ outcome: "skipped", reason: "not_approved" });
    expect(gateway.refund).toHaveBeenCalledTimes(1);
  });

  it("finds a refund Mamo already has and records it without posting", async () => {
    const world = makeWorld();
    const gateway = makeGateway({
      id: "PAY-MAMO-1",
      status: "refund_initiated",
      max_refund_amount: 50,
      refunds: [{ id: "MAMO-REF-9", amount: 50, created_date: "2026-10-10-10-00-20" }],
    });
    contracts.gateway = gateway;

    const { output } = await run(world.req);

    expect(output).toEqual({ outcome: "found_existing", providerRefundId: "MAMO-REF-9" });
    expect(gateway.refund).not.toHaveBeenCalled();
    expect(contracts.syncRefunds).toHaveBeenCalledTimes(1);
    // Pinned with a column-scoped UPDATE (never a whole-row payload.update that could undo a concurrent completion).
    const pin = world.statements.findIndex((t) => t.includes("SET provider_refund_id"));
    expect(pin).toBeGreaterThanOrEqual(0);
    expect(world.statements[pin]).toContain("provider_refund_id IS NULL");
    expect(world.bound[pin]).toContain("MAMO-REF-9");
    expect(world.updates.filter((u) => u.collection === "refunds")).toHaveLength(0);
  });

  it("refuses more than Mamo says is refundable, without posting", async () => {
    const world = makeWorld();
    const gateway = makeGateway({ id: "PAY-MAMO-1", status: "captured", max_refund_amount: 20, refunds: [] });
    contracts.gateway = gateway;

    const { output } = await run(world.req);

    expect(output.outcome).toBe("refused");
    expect(gateway.refund).not.toHaveBeenCalled();
    expect(world.refund.status).toBe("failed");
    expect(contracts.notifyStaff).toHaveBeenCalledWith(expect.anything(), "refund", expect.objectContaining({ outcome: "failed" }), expect.anything());
  });

  it("a clear refusal from Mamo (4xx) marks the refund failed and tells staff", async () => {
    const world = makeWorld();
    contracts.gateway = makeGateway({ id: "PAY-MAMO-1", status: "captured", max_refund_amount: 100, refunds: [] }, async () => {
      throw new FakeMamoError(422, ["Can not refund this payment"]);
    });

    const { output } = await run(world.req);

    expect(output).toEqual({ outcome: "rejected", status: 422 });
    expect(world.refund.status).toBe("failed");
    expect(contracts.notifyStaff).toHaveBeenCalledTimes(1);
  });

  it("an ambiguous failure (5xx / timeout) leaves it processing for the reconciler and fails the job", async () => {
    const world = makeWorld();
    contracts.gateway = makeGateway({ id: "PAY-MAMO-1", status: "captured", max_refund_amount: 100, refunds: [] }, async () => {
      throw new FakeMamoError(502, ["Bad gateway"]);
    });

    await expect(run(world.req)).rejects.toThrow("Bad gateway");
    expect(world.refund.status).toBe("processing");
    expect(contracts.syncRefunds).not.toHaveBeenCalled();
  });

  it("puts the refund back to approved when nothing reached Mamo (gateway off)", async () => {
    const world = makeWorld();
    contracts.gateway = { isConfigured: false, reason: "no_test_key" };

    await expect(run(world.req)).rejects.toThrow(/not available/);
    expect(world.refund.status).toBe("approved");
  });

  it("does nothing for a refund that is not approved", async () => {
    const world = makeWorld({ status: "requested" });
    const gateway = makeGateway({ id: "PAY-MAMO-1", status: "captured" });
    contracts.gateway = gateway;

    const { output } = await run(world.req);

    expect(output).toEqual({ outcome: "skipped", reason: "not_approved" });
    expect(gateway.getPayment).not.toHaveBeenCalled();
  });
  it("refuses a refund whose payment belongs to another order, without asking Mamo", async () => {
    const world = makeWorld({}, "ord-OTHER");
    const gateway = makeGateway({ id: "PAY-MAMO-1", status: "captured", max_refund_amount: 100, refunds: [] });
    contracts.gateway = gateway;

    const { output } = await run(world.req);

    expect(output.outcome).toBe("refused");
    expect(world.refund.status).toBe("failed");
    expect(gateway.getPayment).not.toHaveBeenCalled();
    expect(gateway.refund).not.toHaveBeenCalled();
    expect(contracts.notifyStaff).toHaveBeenCalledTimes(1);
  });
});
