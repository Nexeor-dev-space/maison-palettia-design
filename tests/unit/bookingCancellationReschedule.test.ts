import { describe, expect, it } from "vitest";

import { displayStatus, parseOrderView, SETTLED } from "@/components/booking/orderView";
import {
  checkCancellationPolicy,
  checkReschedulePolicy,
  getNoticeHours,
  getNoticeWindow,
} from "@/lib/bookingPolicy";

describe("Cancellation Policy Validation", () => {
  const baseTime = new Date("2026-10-20T10:00:00.000Z");

  it("calculates notice hours accurately", () => {
    const sessionTime = new Date("2026-10-22T10:00:00.000Z"); // 48 hours ahead
    expect(getNoticeHours(sessionTime, baseTime)).toBeCloseTo(48, 5);
  });

  it("determines notice window categories correctly", () => {
    expect(getNoticeWindow(-1)).toBe("passed");
    expect(getNoticeWindow(0)).toBe("passed");
    expect(getNoticeWindow(12)).toBe("under_24h");
    expect(getNoticeWindow(23.9)).toBe("under_24h");
    expect(getNoticeWindow(24)).toBe("between_24h_48h");
    expect(getNoticeWindow(36)).toBe("between_24h_48h");
    expect(getNoticeWindow(48)).toBe("over_48h");
    expect(getNoticeWindow(72)).toBe("over_48h");
  });

  it("eligible for full refund when notice is 48+ hours", () => {
    const sessionTime = new Date("2026-10-22T12:00:00.000Z"); // 50h notice
    const res = checkCancellationPolicy(sessionTime, baseTime);

    expect(res.eligible).toBe(true);
    expect(res.refundEligible).toBe(true);
    expect(res.window).toBe("over_48h");
    expect(res.policyNote).toContain("48+ hours notice");
    expect(res.message).toContain("full refund");
  });

  it("eligible for refund when notice is between 24 and 48 hours", () => {
    const sessionTime = new Date("2026-10-21T16:00:00.000Z"); // 30h notice
    const res = checkCancellationPolicy(sessionTime, baseTime);

    expect(res.eligible).toBe(true);
    expect(res.refundEligible).toBe(true);
    expect(res.window).toBe("between_24h_48h");
    expect(res.policyNote).toContain("24–48 hours notice");
    expect(res.message).toContain("more than 24 hours before the session");
  });

  it("applies non-refundable outcome when notice is less than 24 hours", () => {
    const sessionTime = new Date("2026-10-20T20:00:00.000Z"); // 10h notice
    const res = checkCancellationPolicy(sessionTime, baseTime);

    expect(res.eligible).toBe(true);
    expect(res.refundEligible).toBe(false);
    expect(res.window).toBe("under_24h");
    expect(res.policyNote).toContain("Non-refundable");
    expect(res.message).toContain("non-refundable");
    expect(res.exceptionNote).toContain("management discretion");
  });

  it("rejects cancellation when session has already taken place", () => {
    const sessionTime = new Date("2026-10-19T10:00:00.000Z"); // -24h (past)
    const res = checkCancellationPolicy(sessionTime, baseTime);

    expect(res.eligible).toBe(false);
    expect(res.refundEligible).toBe(false);
    expect(res.window).toBe("passed");
    expect(res.message).toContain("already taken place");
  });
});

describe("Reschedule Policy Validation", () => {
  const baseTime = new Date("2026-10-20T10:00:00.000Z");

  it("allows rescheduling when notice is 48+ hours", () => {
    const sessionTime = new Date("2026-10-23T10:00:00.000Z"); // 72h notice
    const res = checkReschedulePolicy(sessionTime, baseTime);

    expect(res.eligible).toBe(true);
    expect(res.window).toBe("over_48h");
    expect(res.policyNote).toContain("48+ hours notice");
    expect(res.message).toContain("Rescheduling is free");
  });

  it("allows rescheduling when notice is between 24 and 48 hours with 48h preference notice", () => {
    const sessionTime = new Date("2026-10-21T18:00:00.000Z"); // 32h notice
    const res = checkReschedulePolicy(sessionTime, baseTime);

    expect(res.eligible).toBe(true);
    expect(res.window).toBe("between_24h_48h");
    expect(res.message).toContain("48 hours' notice");
    expect(res.policyNote).toContain("24–48 hours notice");
  });

  it("restricts rescheduling when notice is less than 24 hours", () => {
    const sessionTime = new Date("2026-10-20T18:00:00.000Z"); // 8h notice
    const res = checkReschedulePolicy(sessionTime, baseTime);

    expect(res.eligible).toBe(false);
    expect(res.window).toBe("under_24h");
    expect(res.message).toContain("at least 24 hours");
    expect(res.exceptionNote).toContain("management discretion");
  });

  it("restricts rescheduling when session has already taken place", () => {
    const sessionTime = new Date("2026-10-19T10:00:00.000Z"); // past
    const res = checkReschedulePolicy(sessionTime, baseTime);

    expect(res.eligible).toBe(false);
    expect(res.window).toBe("passed");
    expect(res.message).toContain("already taken place");
  });
});

describe("Display Status & Order View", () => {
  it("maps status confirmed without isRescheduled to confirmed", () => {
    expect(displayStatus("confirmed", false)).toBe("confirmed");
    expect(displayStatus("confirmed", undefined)).toBe("confirmed");
  });

  it("maps status confirmed with isRescheduled to rescheduled", () => {
    expect(displayStatus("confirmed", true)).toBe("rescheduled");
  });

  it("maps cancelled status to cancelled", () => {
    expect(displayStatus("cancelled")).toBe("cancelled");
  });

  it("considers confirmed, rescheduled, and cancelled as settled display statuses", () => {
    expect(SETTLED.has("confirmed")).toBe(true);
    expect(SETTLED.has("rescheduled")).toBe(true);
    expect(SETTLED.has("cancelled")).toBe(true);
  });

  it("parses isRescheduled in parseOrderView", () => {
    const raw = {
      reference: "MP-TEST01",
      status: "confirmed",
      isRescheduled: true,
      lines: [
        {
          kind: "session",
          title: "Pottery Throwing",
          startsAt: "2026-10-25T14:00:00.000Z",
          qty: 2,
          lineFils: 50000,
        },
      ],
      firstName: "Fatima",
      email: "fatima@example.com",
    };

    const parsed = parseOrderView(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.reference).toBe("MP-TEST01");
    expect(parsed?.status).toBe("confirmed");
    expect(parsed?.isRescheduled).toBe(true);
    expect(parsed?.detail?.guest.firstName).toBe("Fatima");
    expect(parsed?.detail?.guest.email).toBe("fatima@example.com");
  });

  it("parses cancelled booking view accurately", () => {
    const raw = {
      reference: "MP-TEST02",
      status: "cancelled",
      lines: [
        {
          kind: "session",
          title: "Candle Making",
          startsAt: "2026-10-28T10:00:00.000Z",
          qty: 1,
          lineFils: 25000,
        },
      ],
      firstName: "Sultan",
    };

    const parsed = parseOrderView(raw);
    expect(parsed?.status).toBe("cancelled");
    expect(displayStatus(parsed!.status)).toBe("cancelled");
  });
});
