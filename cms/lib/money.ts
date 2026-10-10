import type { Price } from "@/types";

import type { Fils } from "./contracts";

/**
 * ==========================================================================
 * Money — integer fils everywhere, AED only at the edges
 * ==========================================================================
 *
 * Every amount the CMS stores is an integer number of fils (`priceFils`,
 * `amountFils`, `vatFils`, …). Floats never touch a stored amount: 0.1 + 0.2
 * is the whole argument, and a VAT split that is off by a fil on an invoice
 * is a tax-return problem, not a rounding curiosity.
 *
 * AED appears in exactly three places, and each has one function here:
 *
 *   · the admin, where staff type "240.00" and see "AED 240.00"
 *     (`aedToFils`, `formatAed` — used by the money() field component);
 *   · the site, whose `Price` type is `{ amount, currency }` (`toPrice`);
 *   · Mamo Pay, whose API takes decimal AED with two places (`toMamoAmount`,
 *     `fromMamoAmount`; SPEC §H: minimum link AED 2, minimum refund AED 1).
 *
 * UAE VAT is 5 %, expressed as basis points (500) so a future rate is a
 * number in Settings → Invoices & VAT, not a code change. Prices are VAT-
 * inclusive by default, so the split works backwards from the gross.
 */

export const CURRENCY = "AED" as const;
export const FILS_PER_AED = 100;
export const DEFAULT_VAT_RATE_BPS = 500;

/** Mamo refuses links under AED 2 and refunds under AED 1 (SPEC §H). */
export const MIN_PAYMENT_FILS = 200;
export const MIN_REFUND_FILS = 100;

export function isFils(value: unknown): value is Fils {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && Number.isSafeInteger(value);
}

export function assertFils(value: unknown, label = "amount"): asserts value is Fils {
  if (!isFils(value)) throw new TypeError(`${label} must be a non-negative integer number of fils, got ${String(value)}`);
}

/**
 * "240", "240.5", "1,240.00", " AED 240.00 " → 24000, 24050, 124000, 24000.
 * Parsed as text so "0.29" becomes 29 and never 28.999999. Returns `null`
 * for anything that is not an amount, so the field component can show a
 * validation message instead of guessing.
 */
export function aedToFils(input: number | string): Fils | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return null;
    return Math.round(input * FILS_PER_AED);
  }
  const cleaned = input.replace(/[\s,]/g, "").replace(/^AED/i, "");
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const fils = whole * FILS_PER_AED + fraction;
  return Number.isSafeInteger(fils) ? fils : null;
}

export function filsToAed(fils: Fils): number {
  return fils / FILS_PER_AED;
}

/** "AED 1,240.00" — the house format for the admin, emails and PDFs. */
export function formatAed(fils: Fils, { currency = true }: { currency?: boolean } = {}): string {
  const number = new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    filsToAed(fils),
  );
  return currency ? `${CURRENCY} ${number}` : number;
}

/** The site's `Price` shape (types/index.ts), produced by the `price` virtual on priced collections. */
export function toPrice(fils: Fils): Price {
  return { amount: filsToAed(fils), currency: CURRENCY };
}

/** Decimal AED with exactly two places, as Mamo's `amount` field wants it. */
export function toMamoAmount(fils: Fils): number {
  return Number((fils / FILS_PER_AED).toFixed(2));
}

/** Mamo returns amounts as numbers or decimal strings; either way, back to integer fils. */
export function fromMamoAmount(amount: number | string): Fils {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) throw new TypeError(`Mamo amount is not a number: ${String(amount)}`);
  return Math.round(value * FILS_PER_AED);
}

/**
 * Splits a gross amount into net and VAT. With inclusive pricing (the UAE
 * default and the site's), VAT = gross × r / (1 + r); otherwise gross is the
 * net and VAT is added. Rounded half-up per line, which is what the FTA
 * accepts on an invoice, and summed per line rather than per order so the
 * invoice lines add up to the totals printed under them.
 */
export function splitVat(
  grossFils: Fils,
  rateBps: number = DEFAULT_VAT_RATE_BPS,
  pricesIncludeVat = true,
): { netFils: Fils; vatFils: Fils; grossFils: Fils } {
  assertFils(grossFils, "grossFils");
  if (pricesIncludeVat) {
    const vatFils = Math.round((grossFils * rateBps) / (10_000 + rateBps));
    return { grossFils, vatFils, netFils: grossFils - vatFils };
  }
  const vatFils = Math.round((grossFils * rateBps) / 10_000);
  return { netFils: grossFils, vatFils, grossFils: grossFils + vatFils };
}
