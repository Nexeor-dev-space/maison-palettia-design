import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The house rule every task gets from `defineTask` (cms/jobs/shared.ts):
 * staff are emailed about a failure only when it is the LAST attempt, at
 * most once an hour per task (or per job for money paths), and never about
 * a failure that is itself a staff email.
 */

const notifyStaff = vi.hoisted(() => vi.fn(async () => ({ logIds: ["log-1"] })));

vi.mock("@/cms/lib/contracts", () => ({
  notifyStaff,
  publicUrl: vi.fn(async () => "http://localhost:3200"),
  getPaymentGateway: vi.fn(),
}));

const { defineTask, logOnly } = await import("../shared");

const req = {
  payload: { logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }, config: { jobs: { workflows: [] } } },
  context: {},
} as unknown as PayloadRequest;

type Handler = (args: unknown) => Promise<unknown>;
type OnFail = (args: unknown) => Promise<void>;

async function failOnce(task: ReturnType<typeof defineTask>, jobId: string, triedBefore: number) {
  const job = { id: jobId, totalTried: triedBefore };
  await expect((task.handler as Handler)({ input: { logId: "l" }, req, job, inlineTask: vi.fn(), tasks: {} })).rejects.toThrow();
  await (task.onFail as unknown as OnFail)({ input: { logId: "l" }, job, req, taskStatus: triedBefore ? { totalTried: triedBefore } : null });
}

beforeEach(() => notifyStaff.mockClear());

describe("final-failure alerts", () => {
  it("alerts only on the last of five retries, with the scrubbed error", async () => {
    const task = defineTask({
      slug: "send-email",
      label: "Send email",
      retries: { attempts: 5, backoff: { type: "exponential", delay: 30_000 } },
      concurrency: () => "k",
      alert: "task",
      run: async () => {
        throw new Error("SMTP said no: auth password=hunter2");
      },
    });
    for (let tried = 0; tried < 5; tried += 1) await failOnce(task, "job-a", tried);
    expect(notifyStaff).not.toHaveBeenCalled();

    await failOnce(task, "job-a", 5);
    expect(notifyStaff).toHaveBeenCalledTimes(1);
    const [, event, vars] = notifyStaff.mock.calls[0] as unknown as [unknown, string, { error: string; taskSlug: string }];
    expect(event).toBe("job_failed");
    expect(vars.taskSlug).toBe("send-email");
    expect(vars.error).not.toContain("hunter2");

    // Same task, another job, same hour: suppressed (an outage is one email, not hundreds).
    await failOnce(task, "job-b", 5);
    expect(notifyStaff).toHaveBeenCalledTimes(1);
  });

  it("money paths alert per job", async () => {
    const task = defineTask({
      slug: "process-refund",
      label: "Process refund",
      retries: 0,
      concurrency: () => "k",
      alert: "job",
      alertRefs: () => ({ refund: "r" }),
      run: async () => {
        throw new Error("boom");
      },
    });
    await failOnce(task, "job-1", 0);
    await failOnce(task, "job-2", 0);
    expect(notifyStaff).toHaveBeenCalledTimes(2);
    expect(notifyStaff.mock.calls[0]?.[3 as never]).toEqual({ refund: "r" });
  });

  it("never alerts about a failed staff email (it would fail the same way)", async () => {
    const task = defineTask({
      slug: "notify-staff",
      label: "Notify staff",
      retries: 0,
      concurrency: () => "k",
      alert: "task",
      run: async () => {
        throw logOnly(new Error("admin_new_order could not be sent"));
      },
    });
    await failOnce(task, "job-x", 0);
    expect(notifyStaff).not.toHaveBeenCalled();
  });

  it("a failing alert does not make the failure handler throw", async () => {
    notifyStaff.mockRejectedValueOnce(new Error("email down"));
    const task = defineTask({
      slug: "issue-invoice",
      label: "Issue invoice",
      retries: 0,
      concurrency: () => "k",
      alert: "job",
      run: async () => {
        throw new Error("db down");
      },
    });
    await expect(failOnce(task, "job-z", 0)).resolves.toBeUndefined();
  });
});
