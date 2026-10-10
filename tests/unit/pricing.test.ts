import { describe, expect, it } from "vitest";

import { allocate, assertPayable, priceBasket, PricingError, vatSplit, type PricingLine, type PromoRule } from "../../cms/lib/pricing";

/**
 * Pricing (SPEC §K "pricing.quote — VAT split per line, pass credits, one
 * promo max, appliesTo/minSpend/window, rejected codes, min-amount
 * refusal"). The pure half: `priceBasket` and the arithmetic under it. The
 * window / max-uses / one-promo-only checks live in `quote()`'s lookups and
 * the atomic reservation SQL, which the Postgres integration suite covers.
 */

const session = (over: Partial<PricingLine> = {}): PricingLine => ({
  kind: "session",
  session: "s1",
  experience: "e1",
  title: "Candle Making",
  qty: 2,
  unitFils: 24_000,
  ...over,
});

const base = { vatRateBps: 500, pricesIncludeVat: true, credits: [] as never[] };

const promo = (over: Partial<PromoRule> = {}): PromoRule => ({
  id: "p1",
  code: "SUMMER10",
  type: "percent",
  value: 10,
  appliesTo: "all",
  experiences: [],
  sessions: [],
  ...over,
});

describe("vatSplit", () => {
  it("inclusive 5 %: net = round(gross × 10000 / 10500), VAT = gross − net", () => {
    expect(vatSplit(24_000, 500)).toEqual({ grossFils: 24_000, netFils: 22_857, vatFils: 1_143 });
    expect(vatSplit(10_500, 500)).toEqual({ grossFils: 10_500, netFils: 10_000, vatFils: 500 });
    expect(vatSplit(0, 500)).toEqual({ grossFils: 0, netFils: 0, vatFils: 0 });
  });

  it("always adds back up to the gross, for every amount up to AED 100", () => {
    for (let g = 0; g <= 10_000; g += 1) {
      const s = vatSplit(g, 500);
      expect(s.netFils + s.vatFils).toBe(g);
      expect(Number.isInteger(s.netFils) && Number.isInteger(s.vatFils)).toBe(true);
    }
  });

  it("rounds the net to the nearest fil (at 5 % a gross never lands on exactly half a fil)", () => {
    // 43 × 20/21 = 40.95… → 41; 22 × 20/21 = 20.95… → 21; 32 × 20/21 = 30.47… → 30
    expect(vatSplit(43, 500)).toEqual({ grossFils: 43, netFils: 41, vatFils: 2 });
    expect(vatSplit(22, 500)).toEqual({ grossFils: 22, netFils: 21, vatFils: 1 });
    expect(vatSplit(32, 500)).toEqual({ grossFils: 32, netFils: 30, vatFils: 2 });
  });

  it("exclusive pricing adds VAT on top", () => {
    expect(vatSplit(10_000, 500, false)).toEqual({ netFils: 10_000, vatFils: 500, grossFils: 10_500 });
  });

  it("refuses fractions and negatives", () => {
    expect(() => vatSplit(10.5, 500)).toThrow();
    expect(() => vatSplit(-1, 500)).toThrow();
  });
});

describe("allocate", () => {
  it("splits exactly, in proportion, with the remainder to the largest fractions", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(1000, [24_000, 12_000])).toEqual([667, 333]);
    const parts = allocate(997, [3, 7, 11, 13]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(997);
  });

  it("gives nothing when there is nothing to weigh", () => {
    expect(allocate(500, [0, 0])).toEqual([0, 0]);
    expect(allocate(0, [1, 2])).toEqual([0, 0]);
  });
});

describe("priceBasket", () => {
  it("prices from list price with the VAT split per line, summed", () => {
    const r = priceBasket([session(), session({ session: "s2", qty: 1, unitFils: 15_050 })], base);
    expect(r.totals.subtotalFils).toBe(48_000 + 15_050);
    expect(r.totals.grossFils).toBe(63_050);
    expect(r.totals.discountFils).toBe(0);
    expect(r.totals.netFils + r.totals.vatFils).toBe(r.totals.grossFils);
    // per-line, then summed — not one split of the total
    expect(r.totals.vatFils).toBe(vatSplit(48_000, 500).vatFils + vatSplit(15_050, 500).vatFils);
    expect(r.lines.map((l) => l.passCredits)).toEqual([0, 0]);
  });

  it("pass credits cover seats on session lines only, line by line, and record the redemption", () => {
    const r = priceBasket([{ kind: "pass", pass: "pa", title: "Five-pass", qty: 1, unitFils: 90_000 }, session({ qty: 3 })], {
      ...base,
      credits: [{ passPurchase: "pp1", code: "MPP-ABCDEFGH", available: 2 }],
    });
    expect(r.lines[0].passCredits).toBe(0);
    expect(r.lines[1].passCredits).toBe(2);
    expect(r.passRedemptions).toEqual([{ passPurchase: "pp1", n: 2 }]);
    expect(r.totals.grossFils).toBe(90_000 + 24_000);
    expect(r.applied).toEqual([{ code: "MPP-ABCDEFGH", kind: "pass", purchase: "pp1", seatsCovered: 2, discountFils: 48_000 }]);
  });

  it("a basket fully covered by credits is free", () => {
    const r = priceBasket([session()], { ...base, credits: [{ passPurchase: "pp1", code: "MPP-ABCDEFGH", available: 5 }] });
    expect(r.totals.grossFils).toBe(0);
    expect(r.totals.vatFils).toBe(0);
    expect(r.passRedemptions).toEqual([{ passPurchase: "pp1", n: 2 }]);
  });

  it("a percentage promo applies after credits, spread over the lines", () => {
    const r = priceBasket([session({ qty: 2 }), session({ session: "s2", qty: 1, unitFils: 10_000 })], { ...base, promo: promo() });
    expect(r.promo).toEqual({ promoCode: "p1", code: "SUMMER10", discountFils: 5_800 });
    expect(r.totals.grossFils).toBe(58_000 - 5_800);
    expect(r.lines[0].promoFils + r.lines[1].promoFils).toBe(5_800);
  });

  it("a fixed promo never exceeds the eligible amount", () => {
    const r = priceBasket([session({ qty: 1, unitFils: 3_000 })], { ...base, promo: promo({ type: "fixed", value: 50_000 }) });
    expect(r.promo?.discountFils).toBe(3_000);
    expect(r.totals.grossFils).toBe(0);
  });

  it("appliesTo sessions / experiences limits the discount to matching lines", () => {
    const lines = [session({ session: "s1", experience: "e1" }), session({ session: "s2", experience: "e2", qty: 1, unitFils: 10_000 })];
    const bySession = priceBasket(lines, { ...base, promo: promo({ appliesTo: "sessions", sessions: ["s2"] }) });
    expect(bySession.promo?.discountFils).toBe(1_000);
    expect(bySession.lines[0].promoFils).toBe(0);
    const byExperience = priceBasket(lines, { ...base, promo: promo({ appliesTo: "experiences", experiences: ["e1"] }) });
    expect(byExperience.promo?.discountFils).toBe(4_800);
  });

  it("a promo with nothing to apply to, or under its minimum spend, is rejected and changes nothing", () => {
    const none = priceBasket([session()], { ...base, promo: promo({ appliesTo: "sessions", sessions: ["other"] }) });
    expect(none.promoRejected).toBe("not_applicable");
    expect(none.totals.discountFils).toBe(0);
    const min = priceBasket([session({ qty: 1 })], { ...base, promo: promo({ minSpendFils: 30_000 }) });
    expect(min.promoRejected).toBe("min_spend");
    expect(min.totals.grossFils).toBe(24_000);
  });

  it("desk complimentary zeroes every line and records it", () => {
    const r = priceBasket([session()], { ...base, desk: { method: "complimentary" } });
    expect(r.totals.grossFils).toBe(0);
    expect(r.complimentaryFils).toBe(48_000);
  });

  it("an admin's desk amount becomes a desk adjustment discount", () => {
    const r = priceBasket([session()], { ...base, desk: { method: "cash", amountFils: 40_000 } });
    expect(r.totals.grossFils).toBe(40_000);
    expect(r.deskAdjustmentFils).toBe(8_000);
    expect(() => priceBasket([session()], { ...base, desk: { method: "cash", amountFils: 50_000 } })).toThrow(PricingError);
  });

  it("refuses silly quantities", () => {
    expect(() => priceBasket([session({ qty: 0 })], base)).toThrow(PricingError);
    expect(() => priceBasket([session({ qty: 51 })], base)).toThrow(PricingError);
  });

  it("net + VAT = gross on every line, whatever the discounts", () => {
    const r = priceBasket([session({ qty: 3, unitFils: 13_337 }), session({ session: "s2", qty: 2, unitFils: 999 })], {
      ...base,
      credits: [{ passPurchase: "pp1", code: "MPP-ABCDEFGH", available: 1 }],
      promo: promo({ value: 17 }),
    });
    for (const line of r.lines) expect(line.netFils + line.vatFils).toBe(line.grossFils);
    expect(r.totals.subtotalFils - r.totals.discountFils).toBe(r.totals.grossFils);
  });
});

describe("assertPayable (Mamo minimum AED 2)", () => {
  const totals = (grossFils: number) => ({ subtotalFils: grossFils, discountFils: 0, grossFils, netFils: 0, vatFils: 0, vatRateBps: 500, currency: "AED" as const });
  it("refuses an online basket between AED 0.01 and AED 1.99", () => {
    expect(() => assertPayable(totals(199), "online")).toThrow(PricingError);
    expect(() => assertPayable(totals(1), "online")).toThrow(PricingError);
  });
  it("accepts free baskets, AED 2 and up, and anything at the desk", () => {
    expect(() => assertPayable(totals(0), "online")).not.toThrow();
    expect(() => assertPayable(totals(200), "online")).not.toThrow();
    expect(() => assertPayable(totals(50), "desk")).not.toThrow();
  });
});
