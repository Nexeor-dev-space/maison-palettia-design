import { describe, expect, it } from "vitest";

import { invoiceLinesFor } from "@/cms/lib/invoiceNumber";
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

describe("Rescheduled Booking Invoice Reflection", () => {
  it("updates line description from 22 November to 5 December upon rescheduling", () => {
    const originalOrder = {
      lines: [
        {
          kind: "session" as const,
          session: "session-1",
          title: "Art Class",
          startsAt: "2026-11-22T14:30:00.000Z", // 22 Nov 2026, 18:30 Dubai
          durationMinutes: 120,
          venueName: "Alserkal Avenue",
          qty: 2,
          unitFils: 20_000,
          lineFils: 40_000,
          passCredits: 0,
        },
      ],
      totals: {
        subtotalFils: 40_000,
        discountFils: 0,
        grossFils: 40_000,
        netFils: 38_095,
        vatFils: 1_905,
        vatRateBps: 500,
        currency: "AED",
      },
    };

    const originalLines = invoiceLinesFor(originalOrder);
    expect(originalLines[0].description).toContain("Art Class");
    expect(originalLines[0].description).toContain("22 Nov 2026");
    expect(originalLines[0].description).toContain("Alserkal Avenue");

    // Customer reschedules to Saturday, 5 December
    const rescheduledOrder = {
      ...originalOrder,
      lines: [
        {
          ...originalOrder.lines[0],
          session: "session-2",
          startsAt: "2026-12-05T14:30:00.000Z", // 5 Dec 2026, 18:30 Dubai
          venueName: "Dubai Mall Studio",
        },
      ],
    };

    const updatedLines = invoiceLinesFor(rescheduledOrder);
    expect(updatedLines[0].description).toContain("Art Class");
    expect(updatedLines[0].description).toContain("5 Dec 2026");
    expect(updatedLines[0].description).toContain("Dubai Mall Studio");
    expect(updatedLines[0].description).not.toContain("22 Nov 2026");
    // Totals remain unchanged
    expect(updatedLines[0].grossFils).toBe(originalLines[0].grossFils);
    expect(updatedLines[0].netFils).toBe(originalLines[0].netFils);
    expect(updatedLines[0].vatFils).toBe(originalLines[0].vatFils);
  });

  it("loadInvoiceView derives updated lines when order has moved event", async () => {
    const { loadInvoiceView } = await import("@/cms/lib/pdf/invoice");
    const mockOrder = {
      id: "order-1",
      reference: "MP-NOV2DEC",
      timeline: [
        {
          event: "moved",
          at: "2026-10-25T12:00:00.000Z",
          detail: { fromStartsAt: "2026-11-22T14:30:00.000Z", toStartsAt: "2026-12-05T14:30:00.000Z" },
        },
      ],
      lines: [
        {
          kind: "session",
          title: "Art Class",
          startsAt: "2026-12-05T14:30:00.000Z",
          venueName: "Dubai Mall Studio",
          qty: 1,
          lineFils: 20000,
        },
      ],
      totals: {
        subtotalFils: 20000,
        discountFils: 0,
        grossFils: 20000,
        netFils: 19048,
        vatFils: 952,
        vatRateBps: 500,
      },
    };

    const mockInvoice = {
      id: "inv-1",
      kind: "invoice",
      number: "MP-INV-2026-000001",
      order: "order-1",
      issuedAt: "2026-10-20T10:00:00.000Z",
      // Stale lines on invoice document
      lines: [
        {
          description: "Art Class · 22 Nov 2026, 18:30 · Alserkal Avenue",
          qty: 1,
          unitNetFils: 19048,
          netFils: 19048,
          vatFils: 952,
          grossFils: 20000,
        },
      ],
      totals: mockOrder.totals,
    };

    const mockReq = {
      payload: {
        findByID: async ({ collection }: { collection: string }) => {
          if (collection === "invoices") return mockInvoice;
          if (collection === "orders") return mockOrder;
          return null;
        },
        findGlobal: async () => ({}),
      },
    } as any;

    const { view } = await loadInvoiceView(mockReq, "inv-1");
    expect(view.lines[0].description).toContain("5 Dec 2026");
    expect(view.lines[0].description).not.toContain("22 Nov 2026");
  });

  it("readStoredInvoicePdf returns null (invalidating stale PDF) when order moved after generation", async () => {
    const { readStoredInvoicePdf } = await import("@/cms/lib/pdf/invoice");
    const mockOrder = {
      id: "order-1",
      timeline: [
        {
          event: "moved",
          at: "2026-10-25T12:00:00.000Z",
        },
      ],
    };

    const mockInvoice = {
      id: "inv-1",
      file: "file-1",
      order: "order-1",
      generatedAt: "2026-10-20T10:00:00.000Z", // generated before move
    };

    const mockReq = {
      payload: {
        findByID: async ({ collection }: { collection: string }) => {
          if (collection === "orders") return mockOrder;
          return { filename: "inv-1.pdf" };
        },
      },
    } as any;

    const result = await readStoredInvoicePdf(mockReq, mockInvoice as any);
    expect(result).toBeNull();
  });

  it("parses rescheduled booking with updated ticket startsAt, ticket pdfUrl, and invoice pdfUrl", () => {
    const rawRescheduledResponse = {
      reference: "MP-RESCHED1",
      status: "confirmed",
      isRescheduled: true,
      confirmedAt: "2026-10-20T10:00:00.000Z",
      firstName: "Fatima",
      email: "fatima@example.com",
      lines: [
        {
          kind: "session",
          title: "Art Class",
          startsAt: "2026-12-05T14:30:00.000Z", // Saturday, 5 Dec 2026
          durationMinutes: 120,
          venueName: "Dubai Mall Studio",
          qty: 2,
          lineFils: 40000,
        },
      ],
      totals: {
        subtotalFils: 40000,
        discountFils: 0,
        grossFils: 40000,
        vatFils: 1905,
        currency: "AED",
      },
      tickets: [
        {
          code: "MPT-RESCHED01",
          seatNo: 1,
          status: "valid",
          sessionTitle: "Art Class",
          startsAt: "2026-12-05T14:30:00.000Z",
          pdfUrl: "/api/site/tickets/MPT-RESCHED01/pdf?exp=1790000000&sig=valid-sig",
        },
        {
          code: "MPT-RESCHED02",
          seatNo: 2,
          status: "valid",
          sessionTitle: "Art Class",
          startsAt: "2026-12-05T14:30:00.000Z",
          pdfUrl: "/api/site/tickets/MPT-RESCHED02/pdf?exp=1790000000&sig=valid-sig",
        },
      ],
      invoice: {
        number: "MP-INV-2026-000042",
        pdfUrl: "/api/site/invoices/inv-42/pdf?exp=1790000000&sig=valid-sig",
      },
    };

    const parsed = parseOrderView(rawRescheduledResponse);
    expect(parsed).not.toBeNull();
    expect(parsed?.status).toBe("confirmed");
    expect(parsed?.isRescheduled).toBe(true);
    expect(displayStatus(parsed!.status, parsed?.isRescheduled)).toBe("rescheduled");

    const detail = parsed?.detail;
    expect(detail).toBeDefined();
    expect(detail?.lines[0].startsAt).toBe("2026-12-05T14:30:00.000Z");
    expect(detail?.lines[0].venueName).toBe("Dubai Mall Studio");

    // Tickets have updated startsAt and download PDF links
    expect(detail?.tickets).toHaveLength(2);
    expect(detail?.tickets[0].startsAt).toBe("2026-12-05T14:30:00.000Z");
    expect(detail?.tickets[0].pdfUrl).toBe("/api/site/tickets/MPT-RESCHED01/pdf?exp=1790000000&sig=valid-sig");
    expect(detail?.tickets[1].pdfUrl).toBe("/api/site/tickets/MPT-RESCHED02/pdf?exp=1790000000&sig=valid-sig");

    // Invoice has number and download PDF link
    expect(detail?.invoice?.number).toBe("MP-INV-2026-000042");
    expect(detail?.invoice?.pdfUrl).toBe("/api/site/invoices/inv-42/pdf?exp=1790000000&sig=valid-sig");
  });
});
