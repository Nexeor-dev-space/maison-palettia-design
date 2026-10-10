/**
 * ==========================================================================
 * Analytics formatting — numbers the way the owner reads them (4C)
 * ==========================================================================
 *
 * Client-safe (no Payload, nothing from cms/lib) so the interactive charts
 * and the server panels format the same way. Money arrives as integer fils
 * from cms/lib/analyticsQueries.ts; days as Dubai YYYY-MM-DD strings, which
 * are formatted at noon UTC so no timezone can move them to the next day.
 */

const NUM = new Intl.NumberFormat("en-GB");
const COMPACT = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });

/** 1,284 */
export const fmtNum = (n: number): string => NUM.format(Math.round(n));

/** 1,284 below ten thousand, then 12.9K / 1.2M — for tiles and axis ticks. */
export const fmtCompact = (n: number): string => (Math.abs(n) < 10_000 ? fmtNum(n) : COMPACT.format(n));

/** Fils → "1,240.00" (no currency; the tile shows "AED" as its unit). */
export const aedPlain = (fils: number): string => (fils / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Fils → "AED 1,240.00". */
export const aed = (fils: number): string => `AED ${aedPlain(fils)}`;

/** Fils → "AED 1.2K" / "AED 340" — axis ticks and tight labels, never totals. */
export const aedShort = (fils: number): string => {
  const value = fils / 100;
  return `AED ${Math.abs(value) < 10_000 ? NUM.format(Math.round(value)) : COMPACT.format(value)}`;
};

/** 0.1234 → "12%" (one decimal below 10%, so "4.5%" is not rounded to "5%"). */
export function fmtPct(share: number): string {
  const pct = share * 100;
  if (pct > 0 && pct < 0.5) return "<1%";
  return `${pct < 10 && pct % 1 !== 0 ? pct.toFixed(1).replace(/\.0$/, "") : Math.round(pct)}%`;
}

const at = (day: string) => new Date(`${day}T12:00:00Z`);
const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const LONG = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** "9 Oct" */
export const dayShort = (day: string): string => SHORT.format(at(day));
/** "Fri, 9 Oct 2026" */
export const dayLong = (day: string): string => LONG.format(at(day));
/** "2026-10" → "October 2026" */
export const monthLong = (month: string): string => MONTH.format(at(`${month}-01`));

/** An ISO instant → Dubai wall time, "Sat 10 Oct, 18:30". */
export const fmtWhen = (iso: string | null): string =>
  iso ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "";

/**
 * Round an axis maximum up to a clean number and give the ticks under it:
 * 0 / 250 / 500 / 750 / 1,000 rather than 0 / 237 / 474. Always at least
 * one step above zero so an all-zero series still draws a baseline.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const rough = max / count;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.0001; v += step) ticks.push(Math.round(v * 1000) / 1000);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

/** Which day labels to print under a time axis: about `want` of them, evenly spaced, last day always included. */
export function labelDays(days: string[], want: number): Set<number> {
  const n = days.length;
  const out = new Set<number>();
  if (n === 0) return out;
  const every = Math.max(1, Math.ceil(n / Math.max(1, want)));
  for (let i = n - 1; i >= 0; i -= every) out.add(i);
  return out;
}
