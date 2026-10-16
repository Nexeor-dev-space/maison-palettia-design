/**
 * The studio's clock. Every session time on the site is stated in Dubai time
 * (UTC+4, no daylight saving), whoever reads it and wherever the server runs.
 *
 * No imports, so the pure builders (lib/jsonLd.ts) and the CMS mappers can
 * both use it without either pulling in the other.
 */

/** The studio's zone, for sessions saved without one. */
export const STUDIO_TIME_ZONE = "Asia/Dubai";

/**
 * An ISO instant written in the studio's own offset.
 *
 * Payload stores dates in UTC ("2026-10-11T11:30:00.000Z"). The site's data
 * has always carried the studio's offset ("2026-10-11T15:30:00+04:00"), and
 * every formatter pins `Asia/Dubai` anyway — but the raw string reaches
 * `<time dateTime>` attributes and the event filters' keys, so it is
 * rewritten in the session's zone rather than left in UTC. Same instant,
 * same markup as before. An unknown zone leaves the value untouched.
 */
export function studioIso(value: string, timeZone: string | null | undefined = STUDIO_TIME_ZONE): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || STUDIO_TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
    const local = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
    const offsetMinutes = Math.round((Date.parse(`${local}Z`) - Math.floor(date.getTime() / 1000) * 1000) / 60_000);
    const sign = offsetMinutes < 0 ? "-" : "+";
    const abs = Math.abs(offsetMinutes);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${local}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  } catch {
    return value;
  }
}
