/**
 * ==========================================================================
 * Weekly series — the dates "Repeat weekly…" lands on (SPEC §H.7)
 * ==========================================================================
 *
 * Pure and dependency-free so the SAME function runs in two places: the
 * server's `repeatSession` (cms/lib/orders.ts), which creates the drafts,
 * and the browser's RepeatDialog, which previews them and labels the
 * button "Create N drafts". One function and one cap means the preview can
 * never promise a date the server will not create.
 *
 * The dialog sends a long series in batches (`after` = the last date of the
 * previous batch, `until` = the last date of this one) so the owner sees
 * "Created 10 of 26…" instead of a minute of a silent spinner, and a failure
 * part-way keeps — and lists — the drafts already made.
 */

/** Most drafts one "Repeat weekly…" creates (§H.7: "up to 26" — half a year of one weekday). */
export const REPEAT_MAX = 26;

/** Drafts per request when the dialog sends a long series in batches. */
export const REPEAT_BATCH = 5;

/** Weekday (0 = Sunday … 6 = Saturday) of an instant in Dubai (UTC+4, no daylight saving). */
export const dubaiWeekday = (at: Date): number => new Date(at.getTime() + 4 * 3_600_000).getUTCDay();

/**
 * The dates a weekly series lands on: every day after the source up to and
 * including `until` whose Dubai weekday is in `weekdays`, at the source's
 * wall-clock time, capped at `max`. Dubai has no daylight saving, so "same
 * wall-clock time" is exactly +24 h per day. `after` (an instant) skips the
 * dates a previous batch already created.
 */
export function repeatDates(sourceStartsAt: string, until: string, weekdays: number[], max = REPEAT_MAX, after?: string): Date[] {
  const start = new Date(sourceStartsAt);
  const end = new Date(until);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  // `until` as a date means "through the end of that Dubai day".
  const endMs = /^\d{4}-\d{2}-\d{2}$/.test(until) ? new Date(`${until}T23:59:59+04:00`).getTime() : end.getTime();
  const afterMs = after ? new Date(after).getTime() : Number.NEGATIVE_INFINITY;
  const wanted = new Set(weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6));
  const out: Date[] = [];
  for (let day = 1; day <= 366 && out.length < max; day += 1) {
    const at = new Date(start.getTime() + day * 86_400_000);
    if (at.getTime() > endMs) break;
    if (at.getTime() <= afterMs) continue;
    if (wanted.has(dubaiWeekday(at))) out.push(at);
  }
  return out;
}

/**
 * Every date the series WOULD land on with no cap (to 366 days), so the
 * dialog can say "34 dates — only the first 26 will be created".
 */
export const allRepeatDates = (sourceStartsAt: string, until: string, weekdays: number[]): Date[] => repeatDates(sourceStartsAt, until, weekdays, 366);

/** The YYYY-MM-DD Dubai date of an instant (the `until` of a batch). */
export const dubaiDay = (at: Date): string => new Date(at.getTime() + 4 * 3_600_000).toISOString().slice(0, 10);
