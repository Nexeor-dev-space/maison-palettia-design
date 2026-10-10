import { describe, expect, it } from "vitest";

import {
  AlertThrottle,
  chunk,
  digestDue,
  dubaiDayBounds,
  dubaiParts,
  findPriorRefund,
  formatDubaiWhen,
  formatFils,
  inventoryDrift,
  isDefiniteRejection,
  isFinalFailure,
  mamoAmountToFils,
  orderEndsAt,
  parseMamoDate,
  previousDubaiDay,
  reconcileDue,
  reminderWindow,
  scrubError,
  settlementCurrency,
} from "@/cms/jobs/logic";

/**
 * Unit tests for the decisions the background jobs make (cms/jobs/logic.ts).
 * No database and no Payload: the module imports nothing, so this runs under
 * a bare `npx vitest run`.
 */

describe("Dubai time", () => {
  it("reads the Dubai day and hour of an instant (UTC+4, no DST)", () => {
    expect(dubaiParts(new Date("2026-10-10T19:59:00Z"))).toEqual({ day: "2026-10-10", hour: 23 });
    expect(dubaiParts(new Date("2026-10-10T20:00:00Z"))).toEqual({ day: "2026-10-11", hour: 0 });
    expect(dubaiParts(new Date("2026-06-30T04:00:00Z"))).toEqual({ day: "2026-06-30", hour: 8 });
  });

  it("bounds a Dubai day in UTC and steps back a day across month/year ends", () => {
    const { start, end } = dubaiDayBounds("2026-10-11");
    expect(start.toISOString()).toBe("2026-10-10T20:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-11T20:00:00.000Z");
    expect(previousDubaiDay("2026-03-01")).toBe("2026-02-28");
    expect(previousDubaiDay("2027-01-01")).toBe("2026-12-31");
    expect(() => dubaiDayBounds("10/10/2026")).toThrow();
  });

  it("writes a session time the way an email says it", () => {
    expect(formatDubaiWhen("2026-10-10T15:00:00Z")).toBe("Saturday 10 October, 7:00 pm");
    expect(formatDubaiWhen("2026-10-10T20:30:00Z")).toBe("Sunday 11 October, 12:30 am");
    expect(formatDubaiWhen(null)).toBe("");
    expect(formatDubaiWhen("not a date")).toBe("");
  });
});

describe("money", () => {
  it("formats fils as AED", () => {
    expect(formatFils(123450)).toBe("AED 1,234.50");
    expect(formatFils(5)).toBe("AED 0.05");
    expect(formatFils(-250)).toBe("-AED 2.50");
  });

  it("reads Mamo amounts (number or string) into fils without float drift", () => {
    expect(mamoAmountToFils(19.99)).toBe(1999);
    expect(mamoAmountToFils("1,250.10")).toBe(125010);
    expect(mamoAmountToFils(0.1 + 0.2)).toBe(30);
    expect(mamoAmountToFils(undefined)).toBeNull();
    expect(mamoAmountToFils("")).toBeNull();
  });

  it("takes the currency off a settlement string", () => {
    expect(settlementCurrency("AED 1.90")).toBe("AED");
    expect(settlementCurrency("1.90")).toBeNull();
    expect(settlementCurrency(null)).toBeNull();
  });
});

describe("reconcileDue — the fixed every-minute cron, gated by settings", () => {
  const now = new Date("2026-10-10T10:00:02Z");

  it("runs the first time and when switched on with no record", () => {
    expect(reconcileDue({ now, enabled: true, everyMinutes: 5, lastRunAt: null })).toBe(true);
    expect(reconcileDue({ now, enabled: undefined, everyMinutes: undefined, lastRunAt: undefined })).toBe(true);
  });

  it("never runs when switched off", () => {
    expect(reconcileDue({ now, enabled: false, everyMinutes: 1, lastRunAt: null })).toBe(false);
  });

  it("waits everyMinutes, with tolerance for tick jitter", () => {
    expect(reconcileDue({ now, enabled: true, everyMinutes: 5, lastRunAt: "2026-10-10T09:57:00Z" })).toBe(false);
    // 4 min 55 s after the last run, a 5-minute setting is due (the next tick would be 5:55 late otherwise).
    expect(reconcileDue({ now, enabled: true, everyMinutes: 5, lastRunAt: "2026-10-10T09:55:07Z" })).toBe(true);
    expect(reconcileDue({ now, enabled: true, everyMinutes: 5, lastRunAt: "2026-10-10T09:55:30Z" })).toBe(false);
  });

  it("clamps silly intervals to 1–60 minutes and treats junk as 5", () => {
    expect(reconcileDue({ now, enabled: true, everyMinutes: 0, lastRunAt: "2026-10-10T09:58:00Z" })).toBe(false);
    expect(reconcileDue({ now, enabled: true, everyMinutes: 500, lastRunAt: "2026-10-10T09:00:00Z" })).toBe(true);
    expect(reconcileDue({ now, enabled: true, everyMinutes: 1, lastRunAt: "garbage" })).toBe(true);
  });
});

describe("digestDue — the hourly cron, gated to the owner's hour once a day", () => {
  it("sends in the chosen Dubai hour, reporting the day before", () => {
    // 04:10 UTC = 08:10 Dubai
    expect(digestDue({ now: new Date("2026-10-10T04:10:00Z"), enabled: true, hour: 8, lastDigestDay: "2026-10-09" })).toEqual({
      send: true,
      today: "2026-10-10",
      reportDay: "2026-10-09",
    });
  });

  it("does not send twice the same day, outside the hour, or when off", () => {
    expect(digestDue({ now: new Date("2026-10-10T04:10:00Z"), enabled: true, hour: 8, lastDigestDay: "2026-10-10" })).toEqual({ send: false });
    expect(digestDue({ now: new Date("2026-10-10T05:10:00Z"), enabled: true, hour: 8, lastDigestDay: null })).toEqual({ send: false });
    expect(digestDue({ now: new Date("2026-10-10T04:10:00Z"), enabled: false, hour: 8, lastDigestDay: null })).toEqual({ send: false });
    expect(digestDue({ now: new Date("2026-10-10T04:10:00Z"), enabled: null, hour: 8, lastDigestDay: null })).toEqual({ send: false });
  });

  it("defaults to 08:00 when no hour is set", () => {
    expect(digestDue({ now: new Date("2026-10-10T04:00:00Z"), enabled: true, hour: null, lastDigestDay: null }).send).toBe(true);
  });
});

describe("reminderWindow", () => {
  it("is 23–25 hours ahead", () => {
    const { from, to } = reminderWindow(new Date("2026-10-10T00:00:00Z"));
    expect(from.toISOString()).toBe("2026-10-10T23:00:00.000Z");
    expect(to.toISOString()).toBe("2026-10-11T01:00:00.000Z");
  });
});

describe("isFinalFailure — mirrors Payload 3.90.2's retry decision", () => {
  it("a stand-alone task with retries 0 fails for good the first time", () => {
    expect(isFinalFailure({ taskAttempts: 0, workflowAttempts: undefined, taskTriedBefore: 0, jobTriedBefore: 0, inWorkflow: false })).toBe(true);
  });

  it("send-email (5 retries) is final on the sixth failure only", () => {
    for (let tried = 0; tried < 5; tried += 1) {
      expect(isFinalFailure({ taskAttempts: 5, workflowAttempts: undefined, taskTriedBefore: tried, jobTriedBefore: tried, inWorkflow: false })).toBe(false);
    }
    expect(isFinalFailure({ taskAttempts: 5, workflowAttempts: undefined, taskTriedBefore: 5, jobTriedBefore: 5, inWorkflow: false })).toBe(true);
  });

  it("a workflow step without its own retries inherits the workflow's", () => {
    expect(isFinalFailure({ taskAttempts: undefined, workflowAttempts: 3, taskTriedBefore: 2, jobTriedBefore: 2, inWorkflow: true })).toBe(false);
    expect(isFinalFailure({ taskAttempts: undefined, workflowAttempts: 3, taskTriedBefore: 3, jobTriedBefore: 3, inWorkflow: true })).toBe(true);
  });

  it("the workflow running out of attempts is final even when the step has tries left", () => {
    expect(isFinalFailure({ taskAttempts: 3, workflowAttempts: 3, taskTriedBefore: 0, jobTriedBefore: 3, inWorkflow: true })).toBe(true);
  });
});

describe("scrubError — nothing secret reaches a log row or a staff email", () => {
  it("removes bearer tokens, key=value secrets and long opaque runs", () => {
    const message = scrubError(new Error("401 from https://x: Authorization: Bearer sk_test_abcdefghijklmnop; api_key=XYZ123 token: abc pass=hunter2"));
    expect(message).not.toMatch(/sk_test|XYZ123|hunter2/);
    expect(message).toContain("[redacted]");
    expect(scrubError(`opaque ${"A".repeat(40)} end`)).toBe("opaque [redacted] end");
  });

  it("keeps the message short and on one line", () => {
    const message = scrubError(new Error(`line one\nline two ${"word ".repeat(200)}`), 50);
    expect(message.length).toBeLessThanOrEqual(50);
    expect(message).not.toContain("\n");
    expect(scrubError(undefined)).toBe("Unknown error");
  });
});

describe("AlertThrottle", () => {
  it("lets one alert per key through per window", () => {
    const throttle = new AlertThrottle(60_000);
    expect(throttle.take("send-email", 0)).toBe(true);
    expect(throttle.take("send-email", 30_000)).toBe(false);
    expect(throttle.take("process-refund:1", 30_000)).toBe(true);
    expect(throttle.take("send-email", 60_000)).toBe(true);
  });
});

describe("findPriorRefund — never post a refund Mamo already has", () => {
  const requestAt = "2026-10-10T10:00:00Z";

  it("finds a same-amount refund created after the request (Mamo's dashed date format)", () => {
    const found = findPriorRefund({
      refunds: [{ id: "R1", amount: 50, created_date: "2026-10-10-10-00-30" }],
      amountFils: 5000,
      requestAt,
      claimedIds: new Set(),
    });
    expect(found?.id).toBe("R1");
  });

  it("accepts refunds up to 2 minutes before the request, not earlier", () => {
    const refunds = [{ id: "OLD", amount: 50, created_date: "2026-10-10-09-55-00" }];
    expect(findPriorRefund({ refunds, amountFils: 5000, requestAt, claimedIds: new Set() })).toBeNull();
    const recent = [{ id: "NEAR", amount: "50.00", created_date: "2026-10-10T09:58:30Z" }];
    expect(findPriorRefund({ refunds: recent, amountFils: 5000, requestAt, claimedIds: new Set() })?.id).toBe("NEAR");
  });

  it("ignores a different amount and refunds already recorded on another row", () => {
    const refunds = [
      { id: "R1", amount: 50, created_date: "2026-10-10-10-00-30" },
      { id: "R2", amount: 25, created_date: "2026-10-10-10-00-30" },
    ];
    expect(findPriorRefund({ refunds, amountFils: 5000, requestAt, claimedIds: new Set(["R1"]) })).toBeNull();
  });

  it("treats an undated same-amount refund as ours (not posting is the safe side)", () => {
    expect(findPriorRefund({ refunds: [{ id: "X", amount: 50 }], amountFils: 5000, requestAt, claimedIds: new Set() })?.id).toBe("X");
    expect(findPriorRefund({ refunds: undefined, amountFils: 5000, requestAt, claimedIds: new Set() })).toBeNull();
  });

  it("parses both date formats", () => {
    expect(parseMamoDate("2026-10-10-14-38-53")).toBe(Date.UTC(2026, 9, 10, 14, 38, 53));
    expect(parseMamoDate("2026-10-10T14:38:53Z")).toBe(Date.UTC(2026, 9, 10, 14, 38, 53));
    expect(Number.isNaN(parseMamoDate(null))).toBe(true);
  });
});

describe("isDefiniteRejection", () => {
  it("only plain 4xx means 'refused, nothing happened'", () => {
    expect(isDefiniteRejection(422)).toBe(true);
    expect(isDefiniteRejection(400)).toBe(true);
    expect(isDefiniteRejection(429)).toBe(false);
    expect(isDefiniteRejection(408)).toBe(false);
    expect(isDefiniteRejection(500)).toBe(false);
    expect(isDefiniteRejection(undefined)).toBe(false);
  });
});

describe("orderEndsAt — when complete-orders may close a booking", () => {
  it("is the end of the latest session line", () => {
    const ends = orderEndsAt([
      { kind: "session", startsAt: "2026-10-10T15:00:00Z", durationMinutes: 120 },
      { kind: "session", startsAt: "2026-10-12T15:00:00Z", durationMinutes: 90 },
      { kind: "pass", startsAt: null },
    ]);
    expect(ends?.toISOString()).toBe("2026-10-12T16:30:00.000Z");
  });

  it("is null for a pass-only order (never auto-completed)", () => {
    expect(orderEndsAt([{ kind: "pass" }])).toBeNull();
    expect(orderEndsAt(null)).toBeNull();
  });
});

describe("inventoryDrift — what the nightly check may correct", () => {
  const base = { seatsSold: 5, seatsHeld: 2, ticketsSold: 5, pendingSold: 0, holdsHeld: 2, liveOrders: 0 };

  it("no drift when counters match tickets and holds", () => {
    expect(inventoryDrift(base)).toMatchObject({ drift: false, correctable: false });
  });

  it("counts seats of confirming orders without tickets as sold", () => {
    expect(inventoryDrift({ ...base, seatsSold: 7, ticketsSold: 5, pendingSold: 2 }).drift).toBe(false);
  });

  it("corrects only when nothing is in flight on the session", () => {
    expect(inventoryDrift({ ...base, seatsHeld: 4 })).toMatchObject({ drift: true, expectedHeld: 2, correctable: true });
    expect(inventoryDrift({ ...base, seatsHeld: 4, liveOrders: 1 })).toMatchObject({ drift: true, correctable: false });
  });
});

describe("chunk", () => {
  it("splits into pages", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});
