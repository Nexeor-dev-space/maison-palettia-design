import { describe, expect, it } from "vitest";

import type { Order } from "../../cms/lib/contracts";
import { creditNoteLinesFor, dubaiYear, formatInvoiceNumber, invoiceLinesFor, paymentLabel, pricesIncludedVat } from "../../cms/lib/invoiceNumber";
import { repeatDates, seatsBySession, sessionShareFils } from "../../cms/lib/orders";
import { allRepeatDates, dubaiDay, REPEAT_BATCH, REPEAT_MAX } from "../../cms/lib/sessionSeries";

/**
 * Invoice numbering and the invoice snapshot (SPEC §H.7), plus the pure
 * helpers of the session operations. The gapless-under-concurrency half of
 * numbering needs Postgres and lives in tests/integration/commerce.test.ts.
 */

const order = (over: Partial<Order> = {}): Pick<Order, "lines" | "totals" | "reference" | "channel" | "deskPayment"> => ({
  reference: "MP-ABC234",
  channel: "online",
  lines: [
    { kind: "session", session: "s1", title: "Candle Making", startsAt: "2026-10-11T11:30:00.000Z", venueName: "Alserkal", qty: 2, unitFils: 24_000, lineFils: 48_000, passCredits: 0 },
    { kind: "session", session: "s2", title: "Clay", qty: 1, unitFils: 15_050, lineFils: 15_050, passCredits: 0 },
  ],
  totals: { subtotalFils: 63_050, discountFils: 0, grossFils: 63_050, netFils: 60_048, vatFils: 3_002, vatRateBps: 500, currency: "AED" },
  ...over,
});

describe("invoice numbers", () => {
  it("formats prefix-year-sequence with six digits", () => {
    expect(formatInvoiceNumber("MP-INV", 2026, 123)).toBe("MP-INV-2026-000123");
    expect(formatInvoiceNumber("MP-CN-", 2027, 1)).toBe("MP-CN-2027-000001");
  });

  it("uses the Dubai calendar year: 31 Dec 21:00 UTC is already next year", () => {
    expect(dubaiYear(new Date("2026-12-31T19:59:59Z"))).toBe(2026);
    expect(dubaiYear(new Date("2026-12-31T20:00:00Z"))).toBe(2027);
  });
});

describe("invoice snapshot", () => {
  it("one line per order line at list price, VAT split per line, adding up to the order", () => {
    const lines = invoiceLinesFor(order());
    expect(lines).toHaveLength(2);
    expect(lines[0].description).toContain("Candle Making");
    expect(lines[0].description).toContain("Alserkal");
    expect(lines.reduce((s, l) => s + l.grossFils, 0)).toBe(63_050);
    for (const l of lines) expect(l.netFils + l.vatFils).toBe(l.grossFils);
  });

  it("recognises inclusive pricing from the totals", () => {
    expect(pricesIncludedVat(order().totals)).toBe(true);
    expect(pricesIncludedVat({ ...order().totals, grossFils: 66_203 })).toBe(false);
  });

  it("a full refund mirrors the invoice; a partial refund is one Refund line", () => {
    expect(creditNoteLinesFor(order(), 63_050)).toEqual(invoiceLinesFor(order()));
    const partial = creditNoteLinesFor(order(), 10_500);
    expect(partial).toHaveLength(1);
    expect(partial[0]).toMatchObject({ description: "Refund — order MP-ABC234", grossFils: 10_500, netFils: 10_000, vatFils: 500 });
  });

  it("prints how it was paid", () => {
    expect(paymentLabel(order(), { provider: "mamo", method: { type: "card", cardLast4: "1157" }, providerPaymentId: "PAY-1" })).toBe("Mamo Pay · card ****1157 · ref PAY-1");
    expect(paymentLabel(order({ channel: "desk", deskPayment: { method: "cash" } }), null)).toBe("Paid at venue (cash)");
    expect(paymentLabel(order({ channel: "desk", deskPayment: { method: "complimentary" } }), null)).toBe("Complimentary");
    expect(paymentLabel(order({ totals: { ...order().totals, grossFils: 0 } }), null)).toBe("Paid with pass credits");
  });
});

describe("session operations (pure parts)", () => {
  it("seats per session across lines", () => {
    expect(seatsBySession([
      { kind: "session", session: "a", qty: 2 },
      { kind: "pass", qty: 1 },
      { kind: "session", session: { id: "a" }, qty: 1 },
      { kind: "session", session: "b", qty: 4 },
    ])).toEqual({ a: 3, b: 4 });
  });

  it("a session's share of the order gross follows the lines it paid for", () => {
    const o = order({ totals: { ...order().totals, discountFils: 6_305, grossFils: 56_745 } });
    const a = sessionShareFils(o, "s1");
    const b = sessionShareFils(o, "s2");
    expect(a + b).toBe(56_745);
    expect(a).toBeGreaterThan(b);
  });

  it("weekly repeats land on the chosen Dubai weekdays at the same wall-clock time, capped at 26", () => {
    // Sunday 11 Oct 2026, 15:30 Dubai = 11:30Z
    const dates = repeatDates("2026-10-11T11:30:00.000Z", "2026-10-31", [0, 3]);
    expect(dates.map((d) => d.toISOString())).toEqual([
      "2026-10-14T11:30:00.000Z",
      "2026-10-18T11:30:00.000Z",
      "2026-10-21T11:30:00.000Z",
      "2026-10-25T11:30:00.000Z",
      "2026-10-28T11:30:00.000Z",
    ]);
    expect(repeatDates("2026-10-11T11:30:00.000Z", "2028-01-01", [0, 1, 2, 3, 4, 5, 6])).toHaveLength(26);
    expect(repeatDates("2026-10-11T11:30:00.000Z", "2026-10-12", [3])).toEqual([]);
  });

  it("a late-evening session keeps its Dubai weekday even though UTC is a day behind", () => {
    // Monday 12 Oct 2026, 02:00 Dubai = Sunday 22:00Z; weekly on Mondays (1)
    const dates = repeatDates("2026-10-11T22:00:00.000Z", "2026-10-27", [1]);
    expect(dates.map((d) => d.toISOString())).toEqual(["2026-10-18T22:00:00.000Z", "2026-10-25T22:00:00.000Z"]);
  });

  it("the dialog's batches (after → until) add up to exactly the capped series, and the preview shares the cap", () => {
    const source = "2026-10-11T11:30:00.000Z";
    const full = repeatDates(source, "2027-02-11", [1, 3]); // Mon + Wed for four months: 34 dates, capped
    expect(allRepeatDates(source, "2027-02-11", [1, 3]).length).toBeGreaterThan(REPEAT_MAX);
    expect(full).toHaveLength(REPEAT_MAX);
    const batched: string[] = [];
    for (let i = 0; i < full.length; i += REPEAT_BATCH) {
      const batch = full.slice(i, i + REPEAT_BATCH);
      const after = i > 0 ? full[i - 1].toISOString() : undefined;
      batched.push(...repeatDates(source, dubaiDay(batch[batch.length - 1]), [1, 3], REPEAT_MAX, after).map((d) => d.toISOString()));
    }
    expect(batched).toEqual(full.map((d) => d.toISOString()));
  });
});
