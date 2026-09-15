import type { ClassValue } from "@/types/utils";

/**
 * Join conditional class names. Deliberately dependency-free — we only need
 * concatenation, not Tailwind conflict resolution.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a Date for UAE-facing copy, e.g. "14 March 2026". */
export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

/** Turn a title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* --------------------------------------------------------------------------
   Session and money formatting, for the booking journey.

   Here rather than imported from lib/workshops.ts, which exports the same
   three shapes: that module also holds the data layer, and pulling it into a
   client component to borrow a formatter risks dragging the session list into
   the browser bundle with it. This file is already dependency-free and already
   crosses the client boundary for `cn`.

   TODO(client): once the sessions come from a CMS and lib/workshops.ts is a
   thin fetch, collapse the two sets back into one.
   -------------------------------------------------------------------------- */

/**
 * The studio's time zone.
 *
 * Every session time on this site is stated in it, and stated explicitly
 * rather than left to the visitor's own: a Saturday morning at The Dubai Mall
 * is 10am in Dubai whether it is read there or from London.
 */
const STUDIO_TIME_ZONE = "Asia/Dubai";

/** "AED 320" — the code rather than a symbol, matching the rest of the site. */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "Sat, 3 October 2026" — the weekday first, because that is what people plan against. */
export function formatSessionDay(startsAt: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: STUDIO_TIME_ZONE,
  }).format(new Date(startsAt));
}

/** "10:00 AM – 1:00 PM". The end is derived from the duration, never stored. */
export function formatSessionTimeRange(startsAt: string, durationMinutes: number): string {
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: STUDIO_TIME_ZONE,
  });
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return `${time.format(start)} – ${time.format(end)}`;
}
