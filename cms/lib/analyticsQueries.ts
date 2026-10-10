import { sql, type SQL } from "@payloadcms/db-postgres/drizzle";
import type { Payload } from "payload";

import {
  DIRECT_REFERRER,
  OTHER_PATH,
  UNKNOWN_COUNTRY,
  type Channel,
  type Device,
  type Dimension,
} from "@/cms/collections/analytics/shared";
import type { Fils, Role } from "@/cms/lib/contracts";
import { dubaiDay } from "@/cms/lib/crypto";

import { DIMENSION_SQL } from "./analytics";

/**
 * ==========================================================================
 * What the Analytics view asks — every number on /admin/analytics (SPEC §I)
 * ==========================================================================
 *
 * The view (cms/views/analytics.tsx, 4C) calls `getAnalyticsDashboard` once
 * per render, or the individual functions below when it wants one panel.
 * Everything is plain JSON (numbers, strings, arrays) so it can be handed to
 * client components as props without a mapper.
 *
 * PERIODS ARE DUBAI DAYS. A range is `{ from, to }` as YYYY-MM-DD, both
 * inclusive, in the studio's timezone — the day the owner reads on the
 * wall, not a UTC one. `resolveRange` turns the view's query string (7, 30,
 * 90 days, or a custom from/to) into one, plus the equal-length period
 * before it for the "vs previous period" arrows.
 *
 * TRAFFIC: finished days come from `analytics-daily` (rolled up hourly);
 * any day in the range without a summary — today, always, and any day the
 * rollup has not reached yet — is counted live from `analytics-events` with
 * the SAME expressions (`DIMENSION_SQL` in cms/lib/analytics.ts), so the
 * two sources cannot disagree about what a "view" is.
 *
 * "VISITORS" ARE DAILY VISITORS. The anonymous visitor id changes every day
 * (that is the privacy design), so a period's visitors are the sum of each
 * day's distinct visitors. Label them "daily visitors" or "visits", never
 * "people".
 *
 * SALES are read from the orders themselves, never from the beacon: an
 * order counts on the Dubai day it was CONFIRMED (paid, or confirmed at the
 * desk); refunds on the day they were requested and succeeded. Money is
 * integer fils; the view formats it (cms/lib/money.ts `formatAed`).
 *
 * TEST ORDERS. Orders carry the payment mode they were made in. While
 * Payments is Live, the sales numbers count live orders only; in Test or
 * Mock mode they count everything (otherwise a studio rehearsing its
 * checkout would see zeros). `salesModes` says which applies and the view
 * should say so ("Including test orders").
 *
 * ROLES (SPEC §J): admins get everything; editors get traffic only (the
 * dashboard function enforces it, so the view cannot leak by accident);
 * front-desk gets nothing — the view should not render for them at all.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

/** Inclusive Dubai days, YYYY-MM-DD. */
export interface DayRange {
  from: string;
  to: string;
}

export type RangePreset = "7" | "30" | "90";

export interface ResolvedRange extends DayRange {
  /** Number of days in the range (≥ 1). */
  days: number;
  /** The same number of days immediately before `from`. */
  previous: DayRange;
  /** The preset it came from, or "custom". */
  preset: RangePreset | "custom";
  /** "Last 30 days" / "1 Sep – 30 Sep 2026" — ready for a heading. */
  label: string;
}

export interface Delta {
  value: number;
  previous: number;
  /** (value − previous) / previous; null when previous is 0. */
  change: number | null;
}

export interface TrafficSummary {
  views: Delta;
  visitors: Delta;
  /** Views per daily visitor in the range (0 when no visitors). */
  viewsPerVisitor: number;
  /** Views of pages the collector could not match (`/other` — mostly 404s and scanners). */
  unmatchedViews: number;
}

export interface DayPoint {
  day: string;
  views: number;
  visitors: number;
}

export interface BreakdownRow {
  /** The stored key: a path, a host, "mobile", "Chrome", "AE"… */
  key: string;
  /** Human wording for the key ("Phone", "Direct / typed address", "United Arab Emirates"). */
  label: string;
  views: number;
  visitors: number;
  /** Share of the dimension's views in the range, 0–1. */
  share: number;
}

export type FunnelStepKey = "event_view" | "book_view" | "checkout_started" | "payment_redirect" | "paid";

export interface FunnelStep {
  key: FunnelStepKey;
  label: string;
  /** Daily visitors for the page steps, online orders for the checkout steps. */
  count: number;
  /** count / first step's count, 0–1 (1 for the first step). */
  ofFirst: number;
  /** count / previous step's count, 0–1 (1 for the first step). */
  ofPrevious: number;
  /** What the number counts, for a tooltip. */
  hint: string;
}

export type OrderMode = "live" | "test" | "mock";

export interface SalesKpis {
  /** Which order modes were counted (see "TEST ORDERS" above). */
  modes: OrderMode[];
  includesTestOrders: boolean;
  orders: Delta;
  grossFils: Delta;
  netFils: number;
  vatFils: number;
  discountFils: number;
  /** Seats sold on session lines of the counted orders. */
  tickets: Delta;
  /** Average order value: gross / orders (0 when none). */
  aovFils: number;
  refunds: { count: number; amountFils: Fils; pendingApproval: number };
  /** Gross minus succeeded refunds in the period. */
  grossAfterRefundsFils: number;
  promo: { orders: number; discountFils: number; topCodes: Array<{ code: string; orders: number; discountFils: number }> };
  /** Orders paid (at least partly) with pass credits, and the credits used. */
  passCredits: { orders: number; credits: number };
  channel: { online: { orders: number; grossFils: number }; desk: { orders: number; grossFils: number } };
  /** Online checkouts started in the period that never got paid (expired/failed/cancelled before payment). */
  abandonedCheckouts: number;
}

export interface SalesDayPoint {
  day: string;
  orders: number;
  grossFils: number;
  tickets: number;
}

export interface ExperienceSales {
  /** Experience id when the session line resolves to one, else the line title. */
  key: string;
  name: string;
  tickets: number;
  grossFils: number;
  orders: number;
}

export interface SessionFill {
  sessionId: string;
  title: string;
  startsAt: string | null;
  seatsTotal: number;
  seatsSold: number;
  seatsHeld: number;
  /** seatsSold / seatsTotal, 0–1. */
  fill: number;
  cancelled: boolean;
}

export interface VatSummary {
  range: DayRange;
  /** TRN from Invoices & VAT (for the heading), when set. */
  trn: string | null;
  invoices: { count: number; netFils: number; vatFils: number; grossFils: number; discountFils: number };
  creditNotes: { count: number; netFils: number; vatFils: number; grossFils: number };
  /** Invoices minus credit notes: what goes on the FTA return for these dates. */
  net: { netFils: number; vatFils: number; grossFils: number };
  /** One row per calendar month the range touches (YYYY-MM), same shape as `net` plus counts. */
  byMonth: Array<{ month: string; invoices: number; creditNotes: number; netFils: number; vatFils: number; grossFils: number }>;
  modes: OrderMode[];
}

export interface OpsSummary {
  failedNotifications: number;
  failedJobs: number;
  holds: { expired: number; converted: number; active: number };
  forcedCheckIns: number;
  /** Orders currently marked disputed (not limited to the range — a dispute is open until it is not). */
  openDisputes: number;
  /** Orders currently waiting for a person to look at them. */
  needsReview: number;
  newEnquiries: number;
}

export interface AnalyticsDashboard {
  range: ResolvedRange;
  role: Role;
  /** Is there any traffic data at all yet (for the "teaching" empty state)? */
  hasTraffic: boolean;
  traffic: {
    summary: TrafficSummary;
    series: DayPoint[];
    topPages: BreakdownRow[];
    referrers: BreakdownRow[];
    channels: BreakdownRow[];
    devices: BreakdownRow[];
    browsers: BreakdownRow[];
    countries: BreakdownRow[];
    funnel: FunnelStep[];
  };
  /** Admins only; `null` for editors. */
  sales: {
    kpis: SalesKpis;
    series: SalesDayPoint[];
    topExperiences: ExperienceSales[];
    sessionFill: SessionFill[];
    vat: VatSummary;
    ops: OpsSummary;
  } | null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Ranges                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const DAY_MS = 86_400_000;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
/** The longest custom range the view accepts (a little over a year, so "last tax year" fits). */
export const MAX_RANGE_DAYS = 400;

/** Calendar arithmetic on YYYY-MM-DD strings (noon UTC, so no DST edge can move the date). */
export function addDays(day: string, n: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / DAY_MS) + 1;
}

export const isDay = (value: unknown): value is string => typeof value === "string" && ISO_DAY.test(value) && !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime()) && new Date(`${value}T12:00:00Z`).toISOString().startsWith(value);

/** Every day from `from` to `to`, inclusive. */
export function eachDay({ from, to }: DayRange): string[] {
  const out: string[] = [];
  for (let day = from; day <= to && out.length <= MAX_RANGE_DAYS + 1; day = addDays(day, 1)) out.push(day);
  return out;
}

const dayLabel = (day: string, withYear: boolean) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

/**
 * The view's period from its query string: `?range=7|30|90` or
 * `?from=YYYY-MM-DD&to=YYYY-MM-DD`. Anything invalid falls back to
 * `fallback` (Analytics & tracking → Admin panel → Default period). A
 * custom range is put in order, clamped to today and to `MAX_RANGE_DAYS`.
 */
export function resolveRange(
  input: { range?: string | null; from?: string | null; to?: string | null } = {},
  options: { fallback?: RangePreset; now?: Date } = {},
): ResolvedRange {
  const today = dubaiDay(options.now ?? new Date());
  let from: string;
  let to: string;
  let preset: ResolvedRange["preset"];

  if (isDay(input.from) && isDay(input.to)) {
    [from, to] = input.from <= input.to ? [input.from, input.to] : [input.to, input.from];
    if (to > today) to = today;
    if (from > to) from = to;
    if (daysBetween(from, to) > MAX_RANGE_DAYS) from = addDays(to, -(MAX_RANGE_DAYS - 1));
    preset = "custom";
  } else {
    const chosen = (["7", "30", "90"] as const).find((p) => p === input.range) ?? options.fallback ?? "30";
    to = today;
    from = addDays(today, -(Number(chosen) - 1));
    preset = chosen;
  }
  const days = daysBetween(from, to);
  const previous = { from: addDays(from, -days), to: addDays(from, -1) };
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const label = preset === "custom" ? (from === to ? dayLabel(from, true) : `${dayLabel(from, !sameYear)} – ${dayLabel(to, true)}`) : `Last ${preset} days`;
  return { from, to, days, previous, preset, label };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* SQL plumbing                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

type Executor = { execute: (query: SQL) => Promise<unknown> };

async function rows<T extends Record<string, unknown>>(payload: Payload, query: SQL): Promise<T[]> {
  const db = (payload.db as unknown as { drizzle: Executor }).drizzle;
  const result = (await db.execute(query)) as { rows?: T[] } | T[] | undefined;
  return Array.isArray(result) ? result : (result?.rows ?? []);
}

const num = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const delta = (value: number, previous: number): Delta => ({ value, previous, change: previous > 0 ? (value - previous) / previous : null });

/** A timestamptz column as a Dubai date, for `between` against YYYY-MM-DD. */
const dubaiDate = (column: SQL) => sql`(${column} at time zone 'Asia/Dubai')::date`;
const inRange = (column: SQL, range: DayRange) => sql`${dubaiDate(column)} between ${range.from}::date and ${range.to}::date`;

const modeList = (modes: OrderMode[]) => sql.join(modes.map((m) => sql`${m}`), sql`, `);

/* ────────────────────────────────────────────────────────────────────────── */
/* Traffic                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Per-day totals of one dimension over the range: summary rows where a day
 * is rolled up, live raw rows where it is not. Returns `(day, key, views,
 * visitors)` rows.
 */
async function dimensionByDay(payload: Payload, dimension: Dimension, range: DayRange): Promise<Array<{ day: string; key: string; views: number; visitors: number }>> {
  const { key, where } = DIMENSION_SQL[dimension];
  const result = await rows<{ day: string; key: string; views: unknown; visitors: unknown }>(
    payload,
    sql`with rolled as (
          select distinct day from analytics_daily
          where dimension = 'total' and day between ${range.from} and ${range.to}
        )
        select d.day, d.key, d.views, d.visitors from analytics_daily d
        where d.dimension = ${sql.raw(`'${dimension}'`)} and d.day between ${range.from} and ${range.to}
        union all
        select e.day, ${key} as key, count(*) as views, count(distinct e.visitor) as visitors
        from analytics_events e
        where e.day between ${range.from} and ${range.to}
          and e.day not in (select day from rolled)
          and ${where}
        group by 1, 2`,
  );
  return result.map((r) => ({ day: String(r.day), key: String(r.key), views: num(r.views), visitors: num(r.visitors) }));
}

/** Sum per key across the range, biggest first. */
async function dimensionTotals(payload: Payload, dimension: Dimension, range: DayRange) {
  const totals = new Map<string, { views: number; visitors: number }>();
  for (const row of await dimensionByDay(payload, dimension, range)) {
    const t = totals.get(row.key) ?? { views: 0, visitors: 0 };
    t.views += row.views;
    t.visitors += row.visitors;
    totals.set(row.key, t);
  }
  return [...totals.entries()].map(([key, t]) => ({ key, ...t })).sort((a, b) => b.views - a.views || a.key.localeCompare(b.key));
}

/** Views and daily visitors for the range and the period before it. */
export async function trafficSummary(payload: Payload, range: ResolvedRange): Promise<TrafficSummary> {
  const [now, before, pages] = await Promise.all([
    dimensionTotals(payload, "total", range),
    dimensionTotals(payload, "total", range.previous),
    dimensionTotals(payload, "page", range),
  ]);
  const views = now[0]?.views ?? 0;
  const visitors = now[0]?.visitors ?? 0;
  return {
    views: delta(views, before[0]?.views ?? 0),
    visitors: delta(visitors, before[0]?.visitors ?? 0),
    viewsPerVisitor: visitors > 0 ? Math.round((views / visitors) * 10) / 10 : 0,
    unmatchedViews: pages.find((p) => p.key === OTHER_PATH)?.views ?? 0,
  };
}

/** One point per day of the range (zero-filled), for the line chart. */
export async function trafficSeries(payload: Payload, range: DayRange): Promise<DayPoint[]> {
  const byDay = new Map((await dimensionByDay(payload, "total", range)).map((r) => [r.day, r]));
  return eachDay(range).map((day) => ({ day, views: byDay.get(day)?.views ?? 0, visitors: byDay.get(day)?.visitors ?? 0 }));
}

const DEVICE_LABELS: Record<Device, string> = { desktop: "Computer", mobile: "Phone", tablet: "Tablet", other: "Other" };
const CHANNEL_LABELS: Record<Channel, string> = {
  direct: "Direct / typed address",
  search: "Search engines",
  social: "Social media",
  email: "Email",
  referral: "Other websites",
};

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string): string {
  if (code === UNKNOWN_COUNTRY) return "Unknown";
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Plain-language names for the pages the owner knows ("/" → "Home"). */
function pageLabel(path: string): string {
  if (path === "/") return "Home";
  if (path === OTHER_PATH) return "Other (pages that don't exist)";
  const parts = path.split("/").filter(Boolean);
  const title = (s: string) => s.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  if (parts[0] === "events" && parts[2] === "book") return `Booking: ${title(parts[1] ?? "")}`;
  if (parts[0] === "events" && parts[1]) return `Event: ${title(parts[1])}`;
  if (parts[0] === "private-events" && parts[1] === "book") return "Private events: enquiry";
  if (parts[0] === "private-events" && parts[1]) return `Private events: ${title(parts[1])}`;
  if (parts[0] === "policies" && parts[1]) return `Policy: ${title(parts[1])}`;
  return title(parts.join(" / "));
}

function labelFor(dimension: Dimension, key: string): string {
  switch (dimension) {
    case "page":
      return pageLabel(key);
    case "referrer":
      return key === DIRECT_REFERRER ? "Direct / typed address" : key;
    case "channel":
      return CHANNEL_LABELS[key as Channel] ?? key;
    case "device":
      return DEVICE_LABELS[key as Device] ?? key;
    case "country":
      return countryName(key);
    default:
      return key;
  }
}

/**
 * The top `limit` keys of a traffic dimension for the range, with labels
 * and shares. `page` → Top pages; `referrer` → referring sites (first page
 * of a visit only); `channel`, `device`, `browser`, `country`.
 */
export async function breakdown(
  payload: Payload,
  dimension: Exclude<Dimension, "total" | "funnel">,
  range: DayRange,
  limit = 10,
): Promise<BreakdownRow[]> {
  const totals = await dimensionTotals(payload, dimension, range);
  const all = totals.reduce((sum, t) => sum + t.views, 0);
  return totals.slice(0, limit).map((t) => ({ ...t, label: labelFor(dimension, t.key), share: all > 0 ? t.views / all : 0 }));
}

export const topPages = (payload: Payload, range: DayRange, limit = 10) => breakdown(payload, "page", range, limit);
export const topReferrers = (payload: Payload, range: DayRange, limit = 10) => breakdown(payload, "referrer", range, limit);
export const channelSplit = (payload: Payload, range: DayRange) => breakdown(payload, "channel", range, 10);
export const deviceSplit = (payload: Payload, range: DayRange) => breakdown(payload, "device", range, 10);
export const browserSplit = (payload: Payload, range: DayRange, limit = 8) => breakdown(payload, "browser", range, limit);
export const countrySplit = (payload: Payload, range: DayRange, limit = 10) => breakdown(payload, "country", range, limit);

/**
 * The booking funnel for the range: people who looked at an event → opened
 * its booking page → started checkout → were sent to the payment page →
 * paid. The first two are daily visitors (beacon); the last three are
 * ONLINE orders created in the range (the order table is the truth — no
 * beacon can miss a payment), so the steps are comparable but not the same
 * unit, which the hints say.
 */
export async function funnel(payload: Payload, range: DayRange, modes?: OrderMode[]): Promise<FunnelStep[]> {
  const useModes = modes ?? (await salesModes(payload));
  const [pages, orderRows] = await Promise.all([
    dimensionTotals(payload, "funnel", range),
    rows<{ started: unknown; redirected: unknown; paid: unknown }>(
      payload,
      sql`select
            count(*) as started,
            count(*) filter (where exists (select 1 from payments p where p.order_id = o.id and p.provider = 'mamo')) as redirected,
            count(*) filter (where o.confirmed_at is not null) as paid
          from orders o
          where o.channel = 'online'
            and o.mode::text in (${modeList(useModes)})
            and ${inRange(sql`o.created_at`, range)}`,
    ),
  ]);
  const visitorsOf = (key: string) => pages.find((p) => p.key === key)?.visitors ?? 0;
  const o = orderRows[0] ?? { started: 0, redirected: 0, paid: 0 };
  const raw: Array<Omit<FunnelStep, "ofFirst" | "ofPrevious">> = [
    { key: "event_view", label: "Looked at an event", count: visitorsOf("event_view"), hint: "Daily visitors who opened any event page." },
    { key: "book_view", label: "Opened the booking page", count: visitorsOf("book_view"), hint: "Daily visitors who opened an event's Book page." },
    { key: "checkout_started", label: "Started checkout", count: num(o.started), hint: "Online orders created (details entered, seats held)." },
    { key: "payment_redirect", label: "Went to payment", count: num(o.redirected), hint: "Online orders that reached the Mamo Pay page." },
    { key: "paid", label: "Paid", count: num(o.paid), hint: "Online orders that were paid and confirmed." },
  ];
  const first = raw[0].count;
  return raw.map((step, i) => ({
    ...step,
    ofFirst: i === 0 ? 1 : first > 0 ? Math.min(1, step.count / first) : 0,
    ofPrevious: i === 0 ? 1 : raw[i - 1].count > 0 ? Math.min(1, step.count / raw[i - 1].count) : 0,
  }));
}

/** True once a single page view has ever been recorded (drives the view's first-run empty state). */
export async function hasAnyTraffic(payload: Payload): Promise<boolean> {
  const result = await rows<{ any: boolean }>(
    payload,
    sql`select (exists (select 1 from analytics_events) or exists (select 1 from analytics_daily where views > 0)) as any`,
  );
  return result[0]?.any === true;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Sales                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

/** Live orders only while Payments is Live; every mode otherwise (see "TEST ORDERS"). */
export async function salesModes(payload: Payload): Promise<OrderMode[]> {
  try {
    const settings = (await payload.findGlobal({ slug: "payment-settings", depth: 0, overrideAccess: true, select: { mode: true } as never })) as { mode?: string | null };
    return settings?.mode === "live" ? ["live"] : ["live", "test", "mock"];
  } catch {
    return ["live", "test", "mock"];
  }
}

/** Orders that count as sales: confirmed at some point (confirmed, completed, or later refunded/cancelled after payment). */
const paidIn = (range: DayRange, modes: OrderMode[]) =>
  sql`o.confirmed_at is not null and o.mode::text in (${modeList(modes)}) and ${inRange(sql`o.confirmed_at`, range)}`;

async function salesTotals(payload: Payload, range: DayRange, modes: OrderMode[]) {
  const [row] = await rows<Record<string, unknown>>(
    payload,
    sql`select
          count(*) as orders,
          coalesce(sum(o.totals_gross_fils), 0) as gross,
          coalesce(sum(o.totals_net_fils), 0) as net,
          coalesce(sum(o.totals_vat_fils), 0) as vat,
          coalesce(sum(o.totals_discount_fils), 0) as discount,
          coalesce(sum((select coalesce(sum(l.qty), 0) from orders_lines l where l._parent_id = o.id and l.kind = 'session')), 0) as tickets,
          count(*) filter (where o.channel = 'online') as online_orders,
          coalesce(sum(o.totals_gross_fils) filter (where o.channel = 'online'), 0) as online_gross,
          count(*) filter (where o.channel = 'desk') as desk_orders,
          coalesce(sum(o.totals_gross_fils) filter (where o.channel = 'desk'), 0) as desk_gross,
          count(*) filter (where o.promo_code is not null and o.promo_code <> '') as promo_orders,
          coalesce(sum(o.promo_discount_fils) filter (where o.promo_code is not null and o.promo_code <> ''), 0) as promo_discount,
          count(*) filter (where exists (select 1 from orders_pass_redemptions r where r._parent_id = o.id)) as pass_orders,
          coalesce(sum((select coalesce(sum(r.n), 0) from orders_pass_redemptions r where r._parent_id = o.id)), 0) as pass_credits
        from orders o
        where ${paidIn(range, modes)}`,
  );
  return row ?? {};
}

/** The sales tiles: orders, revenue (gross/net/VAT), tickets, AOV, refunds, promos, passes, channel split. */
export async function salesKpis(payload: Payload, range: ResolvedRange, modes?: OrderMode[]): Promise<SalesKpis> {
  const useModes = modes ?? (await salesModes(payload));
  const [now, before, refundRow, codes, abandoned] = await Promise.all([
    salesTotals(payload, range, useModes),
    salesTotals(payload, range.previous, useModes),
    rows<Record<string, unknown>>(
      payload,
      sql`select
            count(*) filter (where r.status = 'succeeded') as count,
            coalesce(sum(r.amount_fils) filter (where r.status = 'succeeded'), 0) as amount,
            count(*) filter (where r.status = 'requested') as pending
          from refunds r join orders o on o.id = r.order_id
          where o.mode::text in (${modeList(useModes)}) and ${inRange(sql`r.created_at`, range)}`,
    ),
    rows<{ code: string; orders: unknown; discount: unknown }>(
      payload,
      sql`select upper(o.promo_code) as code, count(*) as orders, coalesce(sum(o.promo_discount_fils), 0) as discount
          from orders o
          where ${paidIn(range, useModes)} and o.promo_code is not null and o.promo_code <> ''
          group by 1 order by 2 desc, 1 limit 5`,
    ),
    rows<{ n: unknown }>(
      payload,
      sql`select count(*) as n from orders o
          where o.channel = 'online' and o.confirmed_at is null
            and o.status in ('expired', 'failed', 'cancelled')
            and o.mode::text in (${modeList(useModes)})
            and ${inRange(sql`o.created_at`, range)}`,
    ),
  ]);
  const orders = num(now.orders);
  const gross = num(now.gross);
  const refundAmount = num(refundRow[0]?.amount);
  return {
    modes: useModes,
    includesTestOrders: useModes.length > 1,
    orders: delta(orders, num(before.orders)),
    grossFils: delta(gross, num(before.gross)),
    netFils: num(now.net),
    vatFils: num(now.vat),
    discountFils: num(now.discount),
    tickets: delta(num(now.tickets), num(before.tickets)),
    aovFils: orders > 0 ? Math.round(gross / orders) : 0,
    refunds: { count: num(refundRow[0]?.count), amountFils: refundAmount, pendingApproval: num(refundRow[0]?.pending) },
    grossAfterRefundsFils: gross - refundAmount,
    promo: {
      orders: num(now.promo_orders),
      discountFils: num(now.promo_discount),
      topCodes: codes.map((c) => ({ code: String(c.code), orders: num(c.orders), discountFils: num(c.discount) })),
    },
    passCredits: { orders: num(now.pass_orders), credits: num(now.pass_credits) },
    channel: {
      online: { orders: num(now.online_orders), grossFils: num(now.online_gross) },
      desk: { orders: num(now.desk_orders), grossFils: num(now.desk_gross) },
    },
    abandonedCheckouts: num(abandoned[0]?.n),
  };
}

/** Orders, revenue and tickets per day of the range (zero-filled), for the sales chart. */
export async function salesSeries(payload: Payload, range: DayRange, modes?: OrderMode[]): Promise<SalesDayPoint[]> {
  const useModes = modes ?? (await salesModes(payload));
  const result = await rows<{ day: string; orders: unknown; gross: unknown; tickets: unknown }>(
    payload,
    sql`select to_char(${dubaiDate(sql`o.confirmed_at`)}, 'YYYY-MM-DD') as day,
               count(*) as orders,
               coalesce(sum(o.totals_gross_fils), 0) as gross,
               coalesce(sum((select coalesce(sum(l.qty), 0) from orders_lines l where l._parent_id = o.id and l.kind = 'session')), 0) as tickets
        from orders o
        where ${paidIn(range, useModes)}
        group by 1`,
  );
  const byDay = new Map(result.map((r) => [String(r.day), r]));
  return eachDay(range).map((day) => {
    const r = byDay.get(day);
    return { day, orders: num(r?.orders), grossFils: num(r?.gross), tickets: num(r?.tickets) };
  });
}

/**
 * Best-selling activities in the range, by seats sold on session lines.
 * `grossFils` is the money actually taken for them: each line's SHARE of
 * its order's gross (after promo and desk discounts, VAT included), not the
 * line's list price — so a complimentary desk booking adds seats but no
 * money, and the experiences add up to the Revenue tile instead of
 * exceeding it (4B review: Candle Making AED 3,840 beside Revenue 3,360).
 */
export async function topExperiences(payload: Payload, range: DayRange, limit = 8, modes?: OrderMode[]): Promise<ExperienceSales[]> {
  const useModes = modes ?? (await salesModes(payload));
  const result = await rows<{ key: string; name: string; tickets: unknown; gross: unknown; orders: unknown }>(
    payload,
    sql`select coalesce(x.id::text, l.title) as key,
               coalesce(max(x.name), max(l.title)) as name,
               coalesce(sum(l.qty), 0) as tickets,
               coalesce(sum(round(
                 o.totals_gross_fils::numeric * l.line_fils
                 / nullif((select sum(l2.line_fils) from orders_lines l2 where l2._parent_id = o.id), 0)
               )), 0) as gross,
               count(distinct o.id) as orders
        from orders o
        join orders_lines l on l._parent_id = o.id and l.kind = 'session'
        left join sessions s on s.id = l.session_id
        left join experiences x on x.id = s.experience_id
        where ${paidIn(range, useModes)}
        group by 1
        order by 4 desc, 3 desc
        limit ${limit}`,
  );
  return result.map((r) => ({ key: String(r.key), name: String(r.name ?? "Untitled"), tickets: num(r.tickets), grossFils: num(r.gross), orders: num(r.orders) }));
}

/**
 * Seats sold vs available for every published session that starts in the
 * range, soonest first (`limit` rows). From `session_inventory`, the same
 * numbers the booking page uses.
 */
export async function sessionFill(payload: Payload, range: DayRange, limit = 20): Promise<SessionFill[]> {
  const result = await rows<Record<string, unknown>>(
    payload,
    sql`select s.id, coalesce(s.title, x.name, s.slug) as title, s.starts_at, s.seats_total, s.cancelled_at,
               coalesce(i.seats_sold, 0) as sold, coalesce(i.seats_held, 0) as held
        from sessions s
        left join experiences x on x.id = s.experience_id
        left join session_inventory i on i.session_id = s.id
        where s._status = 'published' and ${inRange(sql`s.starts_at`, range)}
        order by s.starts_at asc
        limit ${limit}`,
  );
  return result.map((r) => {
    const total = num(r.seats_total);
    const sold = num(r.sold);
    return {
      sessionId: String(r.id),
      title: String(r.title ?? "Untitled session"),
      startsAt: r.starts_at ? new Date(String(r.starts_at)).toISOString() : null,
      seatsTotal: total,
      seatsSold: sold,
      seatsHeld: num(r.held),
      fill: total > 0 ? Math.min(1, sold / total) : 0,
      cancelled: Boolean(r.cancelled_at),
    };
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* VAT                                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * "VAT summary for period" (SPEC §H.12) for the accountant and the FTA
 * return: invoices and credit notes ISSUED between `from` and `to` (Dubai
 * dates, inclusive), their net/VAT/gross, and the difference. Test-mode
 * orders' invoices follow the same rule as the sales tiles.
 */
export async function vatSummary(payload: Payload, from: string, to: string, modes?: OrderMode[]): Promise<VatSummary> {
  const range = { from, to };
  const useModes = modes ?? (await salesModes(payload));
  const issued = sql`coalesce(i.issued_at, i.created_at)`;
  const [totals, months, settings] = await Promise.all([
    rows<Record<string, unknown>>(
      payload,
      sql`select i.kind::text as kind, count(*) as count,
                 coalesce(sum(i.totals_net_fils), 0) as net, coalesce(sum(i.totals_vat_fils), 0) as vat,
                 coalesce(sum(i.totals_gross_fils), 0) as gross, coalesce(sum(i.totals_discount_fils), 0) as discount
          from invoices i join orders o on o.id = i.order_id
          where o.mode::text in (${modeList(useModes)}) and ${inRange(issued, range)}
          group by 1`,
    ),
    rows<Record<string, unknown>>(
      payload,
      sql`select to_char(${dubaiDate(issued)}, 'YYYY-MM') as month,
                 count(*) filter (where i.kind = 'invoice') as invoices,
                 count(*) filter (where i.kind = 'credit_note') as credit_notes,
                 coalesce(sum(case when i.kind = 'credit_note' then -i.totals_net_fils else i.totals_net_fils end), 0) as net,
                 coalesce(sum(case when i.kind = 'credit_note' then -i.totals_vat_fils else i.totals_vat_fils end), 0) as vat,
                 coalesce(sum(case when i.kind = 'credit_note' then -i.totals_gross_fils else i.totals_gross_fils end), 0) as gross
          from invoices i join orders o on o.id = i.order_id
          where o.mode::text in (${modeList(useModes)}) and ${inRange(issued, range)}
          group by 1 order by 1`,
    ),
    payload.findGlobal({ slug: "invoice-settings", depth: 0, overrideAccess: true }).catch(() => null) as Promise<{ trn?: string | null } | null>,
  ]);
  const pick = (kind: string) => totals.find((t) => t.kind === kind) ?? {};
  const inv = pick("invoice");
  const cn = pick("credit_note");
  const invoices = { count: num(inv.count), netFils: num(inv.net), vatFils: num(inv.vat), grossFils: num(inv.gross), discountFils: num(inv.discount) };
  const creditNotes = { count: num(cn.count), netFils: num(cn.net), vatFils: num(cn.vat), grossFils: num(cn.gross) };
  return {
    range,
    trn: settings?.trn?.trim() || null,
    invoices,
    creditNotes,
    net: {
      netFils: invoices.netFils - creditNotes.netFils,
      vatFils: invoices.vatFils - creditNotes.vatFils,
      grossFils: invoices.grossFils - creditNotes.grossFils,
    },
    byMonth: months.map((m) => ({
      month: String(m.month),
      invoices: num(m.invoices),
      creditNotes: num(m.credit_notes),
      netFils: num(m.net),
      vatFils: num(m.vat),
      grossFils: num(m.gross),
    })),
    modes: useModes,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Operations                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/** The "is anything going wrong" strip: failures, holds, forced check-ins, disputes. */
export async function opsSummary(payload: Payload, range: DayRange): Promise<OpsSummary> {
  const [row] = await rows<Record<string, unknown>>(
    payload,
    sql`select
          (select count(*) from notification_log n where n.status = 'failed' and ${inRange(sql`n.created_at`, range)}) as failed_notifications,
          (select count(*) from payload_jobs j where j.has_error = true and ${inRange(sql`j.created_at`, range)}) as failed_jobs,
          (select count(*) from seat_holds h where h.status = 'released' and ${inRange(sql`h.created_at`, range)}) as holds_expired,
          (select count(*) from seat_holds h where h.status = 'consumed' and ${inRange(sql`h.created_at`, range)}) as holds_converted,
          (select count(*) from seat_holds h where h.status = 'held') as holds_active,
          (select count(*) from tickets t where t.check_in_forced = true and ${inRange(sql`t.checked_in_at`, range)}) as forced,
          (select count(*) from orders o where o.disputed = true) as disputes,
          (select count(*) from orders o where o.needs_review = true) as review,
          (select count(*) from enquiries q where q.status = 'new' and coalesce(q.meta_honeypot_tripped, false) = false) as enquiries`,
  );
  const r = row ?? {};
  return {
    failedNotifications: num(r.failed_notifications),
    failedJobs: num(r.failed_jobs),
    holds: { expired: num(r.holds_expired), converted: num(r.holds_converted), active: num(r.holds_active) },
    forcedCheckIns: num(r.forced),
    openDisputes: num(r.disputes),
    needsReview: num(r.review),
    newEnquiries: num(r.enquiries),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Everything at once                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/** `analytics-settings.dashboard.defaultRange`, for `resolveRange`'s fallback. */
export async function defaultRangePreset(payload: Payload): Promise<RangePreset> {
  try {
    const doc = (await payload.findGlobal({ slug: "analytics-settings", depth: 0, overrideAccess: true })) as { dashboard?: { defaultRange?: string | null } | null };
    const value = doc?.dashboard?.defaultRange;
    return value === "7" || value === "30" || value === "90" ? value : "30";
  } catch {
    return "30";
  }
}

/**
 * The whole Analytics page in one call. Admin → traffic + sales + VAT + ops;
 * editor → traffic only (`sales: null`); any other role is refused (throws),
 * so the view can render a polite "not available for your role" instead.
 */
export async function getAnalyticsDashboard(payload: Payload, range: ResolvedRange, role: Role | undefined): Promise<AnalyticsDashboard> {
  if (role !== "admin" && role !== "editor") throw new Error("Analytics is available to admins and editors only.");
  const modesPromise = role === "admin" ? salesModes(payload) : Promise.resolve<OrderMode[]>(["live"]);
  const modes = await modesPromise;
  const [hasTraffic, summary, series, pages, referrers, channels, devices, browsers, countries, funnelSteps] = await Promise.all([
    hasAnyTraffic(payload),
    trafficSummary(payload, range),
    trafficSeries(payload, range),
    topPages(payload, range, 10),
    topReferrers(payload, range, 10),
    channelSplit(payload, range),
    deviceSplit(payload, range),
    browserSplit(payload, range),
    countrySplit(payload, range),
    funnel(payload, range, modes),
  ]);
  const traffic = { summary, series, topPages: pages, referrers, channels, devices, browsers, countries, funnel: funnelSteps };
  if (role !== "admin") {
    // Editors see the page funnel, never order counts.
    traffic.funnel = funnelSteps.slice(0, 2);
    return { range, role, hasTraffic, traffic, sales: null };
  }
  const [kpis, sSeries, experiences, fill, vat, ops] = await Promise.all([
    salesKpis(payload, range, modes),
    salesSeries(payload, range, modes),
    topExperiences(payload, range, 8, modes),
    sessionFill(payload, range, 20),
    vatSummary(payload, range.from, range.to, modes),
    opsSummary(payload, range),
  ]);
  return { range, role, hasTraffic, traffic, sales: { kpis, series: sSeries, topExperiences: experiences, sessionFill: fill, vat, ops } };
}
