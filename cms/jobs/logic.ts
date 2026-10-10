/**
 * ==========================================================================
 * Background jobs — the decisions, without the database (SPEC §H.6, §H.9)
 * ==========================================================================
 *
 * Every rule a job applies that can be stated as "given these values, what
 * should happen?" lives here as a pure function: whether the payment checker
 * is due, whether the digest hour has come, whether a failure is the last
 * one, whether Mamo already holds the refund we are about to post, when an
 * order's last session ends. The task files (cms/jobs/tasks/*) do the
 * reading and writing and call these to decide.
 *
 * WHY A SEPARATE FILE WITH NO IMPORTS. These are the rules a reviewer most
 * wants to see tested, and the unit tests (cms/jobs/__tests__) must run
 * under a bare `npx vitest run` with no config, no `@/` alias and no
 * database. So nothing here imports anything: not Payload, not the
 * contracts, not the money helpers (the one fils conversion needed is
 * spelled out below and matches cms/lib/money.ts).
 *
 * TIME ZONE. The business runs on Dubai time (Asia/Dubai, UTC+4, no daylight
 * saving), whatever the server's own zone is. Everything that talks about "a
 * day" or "an hour" — the digest, the email wording — goes through the
 * helpers here, which use the fixed offset rather than the host's clock.
 */

/** Asia/Dubai is UTC+4 all year (the UAE has no daylight saving), so a fixed offset is exact. */
export const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

const pad = (n: number, width = 2): string => String(n).padStart(width, "0");

/** The Dubai calendar day ("YYYY-MM-DD") and hour (0–23) of an instant. */
export function dubaiParts(at: Date): { day: string; hour: number } {
  const shifted = new Date(at.getTime() + DUBAI_OFFSET_MS);
  return {
    day: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    hour: shifted.getUTCHours(),
  };
}

/** [start, end) of a Dubai calendar day, as UTC instants. */
export function dubaiDayBounds(day: string): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) throw new RangeError(`not a YYYY-MM-DD day: ${day}`);
  const startUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) - DUBAI_OFFSET_MS;
  return { start: new Date(startUtc), end: new Date(startUtc + 24 * 60 * 60 * 1000) };
}

/** The Dubai day before `day`. */
export function previousDubaiDay(day: string): string {
  const { start } = dubaiDayBounds(day);
  return dubaiParts(new Date(start.getTime() - 1)).day;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * "Saturday 12 October, 7:00 pm" in Dubai time — how a session's start is
 * written in an email. Hand-rolled rather than `Intl` so the output is the
 * same on every Node build (small-ICU images format differently).
 */
export function formatDubaiWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const d = new Date(at.getTime() + DUBAI_OFFSET_MS);
  const hours = d.getUTCHours();
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const suffix = hours < 12 ? "am" : "pm";
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${h12}:${pad(d.getUTCMinutes())} ${suffix}`;
}

/** "AED 1,234.50" from integer fils — the digest and staff emails show money this way. */
export function formatFils(fils: number): string {
  const sign = fils < 0 ? "-" : "";
  const abs = Math.abs(Math.round(fils));
  const whole = Math.floor(abs / 100).toLocaleString("en-US");
  return `${sign}AED ${whole}.${pad(abs % 100)}`;
}

/** Mamo amounts are AED with two decimals (number or string); fils are integers. Same rule as cms/lib/money.ts. */
export function mamoAmountToFils(amount: number | string | null | undefined): number | null {
  if (amount === null || amount === undefined || amount === "") return null;
  const n = typeof amount === "number" ? amount : Number(String(amount).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Gates for the fixed crons (§H.9: crons cannot be re-planned at runtime)    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * The payment checker is SCHEDULED every minute (crons are fixed when the
 * config is built) and decides here whether this minute is a run minute:
 * enabled, and at least `everyMinutes` since the last run. The tolerance
 * absorbs the few seconds between a cron tick and the job being picked up —
 * without it a 5-minute setting would drift to every 6 minutes.
 */
export function reconcileDue(input: {
  now: Date;
  enabled: boolean | null | undefined;
  everyMinutes: number | null | undefined;
  lastRunAt: string | Date | null | undefined;
  toleranceMs?: number;
}): boolean {
  if (input.enabled === false) return false;
  const every = Number.isFinite(input.everyMinutes) && (input.everyMinutes ?? 0) >= 1 ? Math.min(60, Math.floor(input.everyMinutes as number)) : 5;
  if (!input.lastRunAt) return true;
  const last = new Date(input.lastRunAt).getTime();
  if (Number.isNaN(last)) return true;
  const tolerance = input.toleranceMs ?? 15_000;
  return input.now.getTime() - last >= every * 60_000 - tolerance;
}

/**
 * The digest is SCHEDULED hourly and sends only in the hour the owner chose
 * (Dubai time), once per Dubai day. Returns the day to stamp when it should
 * send, and which day the report covers (the day before).
 */
export function digestDue(input: {
  now: Date;
  enabled: boolean | null | undefined;
  hour: number | null | undefined;
  lastDigestDay: string | null | undefined;
}): { send: false } | { send: true; today: string; reportDay: string } {
  if (input.enabled !== true) return { send: false };
  const hour = Number.isInteger(input.hour) ? (input.hour as number) : 8;
  const { day, hour: nowHour } = dubaiParts(input.now);
  if (nowHour !== hour) return { send: false };
  if (input.lastDigestDay === day) return { send: false };
  return { send: true, today: day, reportDay: previousDubaiDay(day) };
}

/** Sessions starting between now + 23 h and now + 25 h get their 24-hour reminder (§H.8). */
export function reminderWindow(now: Date): { from: Date; to: Date } {
  return { from: new Date(now.getTime() + 23 * 3_600_000), to: new Date(now.getTime() + 25 * 3_600_000) };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Retries and failure alerts                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Was this the LAST attempt? Payload calls a task's `onFail` on every
 * failure, retries included, so the "email staff on final failure" rule
 * needs to know which failure is final. This mirrors Payload 3.90.2's own
 * decision (queues/errors/handleTaskError.js + getWorkflowRetryBehavior.js):
 *
 *   · the task's attempts are its own `retries`, else the workflow's, else 0;
 *   · the task is out of attempts when it has already been tried that many
 *     times before this failure;
 *   · inside a workflow, the job as a whole is also out of attempts when it
 *     has been tried `workflowRetries` times.
 */
export function isFinalFailure(input: {
  taskAttempts: number | undefined;
  workflowAttempts: number | undefined;
  taskTriedBefore: number;
  jobTriedBefore: number;
  inWorkflow: boolean;
}): boolean {
  const max = input.taskAttempts ?? input.workflowAttempts ?? 0;
  if (input.taskTriedBefore >= max) return true;
  if (input.inWorkflow && input.workflowAttempts !== undefined && input.jobTriedBefore >= input.workflowAttempts) return true;
  return false;
}

/**
 * Error text that is safe to store in a log row or put in a staff email:
 * one line, at most `max` characters, with anything that looks like a
 * credential removed (a Bearer token, a `key=…` pair, a long opaque run).
 * Errors from SMTP servers and HTTP clients sometimes echo what they were
 * sent; the hard rule is that secrets are never logged.
 */
export function scrubError(error: unknown, max = 400): string {
  const raw = error instanceof Error ? error.message || error.name : typeof error === "string" ? error : "Unknown error";
  const cleaned = raw
    .replace(/\s+/g, " ")
    .replace(/(bearer\s+)[^\s"',;]+/gi, "$1[redacted]")
    .replace(/((?:api[_-]?key|token|secret|password|pass|auth[a-z_-]*)\s*[=:]\s*)[^\s"',;&]+/gi, "$1[redacted]")
    .replace(/[A-Za-z0-9+/_=-]{32,}/g, "[redacted]")
    .trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned || "Unknown error";
}

/**
 * One alert per key per window. Money-path failures (a specific order or
 * refund) are keyed by job so each one is reported; high-volume failures
 * (every email failing because SMTP is down, a sweep failing every minute)
 * are keyed by task so staff get one email an hour, not hundreds.
 */
export class AlertThrottle {
  private readonly last = new Map<string, number>();
  constructor(private readonly windowMs: number) {}

  /** true = send now (and remember it); false = suppressed. */
  take(key: string, now = Date.now()): boolean {
    const previous = this.last.get(key);
    if (previous !== undefined && now - previous < this.windowMs) return false;
    this.last.set(key, now);
    if (this.last.size > 500) {
      for (const [k, at] of this.last) if (now - at >= this.windowMs) this.last.delete(k);
    }
    return true;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Refunds: never post twice (§H.7, Mamo has no Idempotency-Key)              */
/* ────────────────────────────────────────────────────────────────────────── */

export interface ProviderRefund {
  id: string;
  amount: number | string;
  created_date?: string | null;
}

/**
 * Mamo's `created_date`: "2026-10-10-14-38-53" (dashes throughout, read as
 * UTC — TODO(mamo-verify): the zone is undocumented; if it is Dubai time the
 * value reads four hours LATE, which only widens the "at or after" window
 * below, never narrows it). ISO strings are accepted too. NaN when unusable.
 */
export function parseMamoDate(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const dashed = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/.exec(value);
  if (dashed) {
    const [, y, mo, d, h, mi, sec] = dashed.map(Number);
    return Date.UTC(y, mo - 1, d, h, mi, sec);
  }
  return new Date(value).getTime();
}

/**
 * Before POSTing a refund, look for one Mamo already has: same amount,
 * created at or after `providerRequestAt − window`, and not already claimed
 * by another of our refund rows. A refund entry with no usable date counts
 * as a match — when unsure, NOT posting is the safe side (a missing refund
 * shows up in the reconciler and the order; a double refund is money gone).
 */
export function findPriorRefund(input: {
  refunds: ProviderRefund[] | null | undefined;
  amountFils: number;
  requestAt: string | Date;
  claimedIds: ReadonlySet<string>;
  windowMs?: number;
}): ProviderRefund | null {
  const since = new Date(input.requestAt).getTime() - (input.windowMs ?? 2 * 60_000);
  for (const refund of input.refunds ?? []) {
    if (!refund?.id || input.claimedIds.has(String(refund.id))) continue;
    if (mamoAmountToFils(refund.amount) !== input.amountFils) continue;
    const created = parseMamoDate(refund.created_date);
    if (Number.isNaN(created) || created >= since) return refund;
  }
  return null;
}

/** HTTP statuses from Mamo that mean "refused, nothing happened" — safe to mark the refund failed. */
export function isDefiniteRejection(status: number | undefined): boolean {
  return status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 409 && status !== 429;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Orders and inventory                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export interface LineTiming {
  kind?: string | null;
  startsAt?: string | null;
  durationMinutes?: number | null;
}

/**
 * When the last session on an order ends (start + duration), or null when
 * the order has no session lines (a pass-only order is never "completed":
 * the pass lives on, and a completed order can no longer be refunded).
 */
export function orderEndsAt(lines: LineTiming[] | null | undefined): Date | null {
  let last: number | null = null;
  for (const line of lines ?? []) {
    if (line?.kind !== "session" || !line.startsAt) continue;
    const start = new Date(line.startsAt).getTime();
    if (Number.isNaN(start)) continue;
    const end = start + Math.max(0, line.durationMinutes ?? 0) * 60_000;
    last = last === null ? end : Math.max(last, end);
  }
  return last === null ? null : new Date(last);
}

export interface InventoryRow {
  seatsSold: number;
  seatsHeld: number;
  ticketsSold: number;
  pendingSold: number;
  holdsHeld: number;
  liveOrders: number;
}

/**
 * What `session_inventory` should say, from the facts: sold = live tickets
 * (+ seats of paid orders not ticketed yet), held =
 * open seat holds. `correctable` is true only when nothing is in flight on
 * the session — a checkout, a payment or a finalize could otherwise be
 * between its two writes — so a correction can never fight a live sale.
 */
export function inventoryDrift(row: InventoryRow): { drift: boolean; expectedSold: number; expectedHeld: number; correctable: boolean } {
  const expectedSold = row.ticketsSold + row.pendingSold;
  const expectedHeld = row.holdsHeld;
  const drift = expectedSold !== row.seatsSold || expectedHeld !== row.seatsHeld;
  return { drift, expectedSold, expectedHeld, correctable: drift && row.liveOrders === 0 };
}

/** Postgres `numeric` and `count(*)` come back as strings; this reads them as numbers (0 when absent). */
export function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Splits `items` into pages of `size` (for batched Local API `in` queries). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** "AED 1.90" → { currency: "AED", text: "AED 1.90" } — settlement figures are stored as Mamo sends them. */
export function settlementCurrency(text: string | null | undefined): string | null {
  const match = /^\s*([A-Z]{3})\b/.exec(text ?? "");
  return match ? match[1] : null;
}
