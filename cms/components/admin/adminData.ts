import type { Payload, TypedUser, Where } from "payload";

import { roleOf } from "@/cms/access/roles";
import { hasAnyTraffic, resolveRange, salesKpis, salesModes, trafficSummary, type SalesKpis } from "@/cms/lib/analyticsQueries";
import { bootStatus } from "@/cms/lib/crypto";
import type { Role } from "@/cms/lib/contracts";
import { UNVERIFIED_SPIKE_PER_HOUR } from "@/cms/lib/mamo/verify";
import { unverifiedCounters } from "@/cms/lib/mamo/webhook";
import { formatAed } from "@/cms/lib/money";
import { isAcceptablePublicUrl } from "@/cms/lib/publicUrl";
import { dubaiDate, dubaiDayBounds, DUBAI_TZ, sessionTitleOf } from "@/cms/lib/tickets";
import type { Enquiry, Order, PaymentSetting, Session, SiteSetting } from "@/payload-types";

/**
 * ==========================================================================
 * The dashboard's and the warnings strip's reads (SPEC §I, 4B)
 * ==========================================================================
 *
 * Both components are React Server Components mounted through
 * `admin.components.beforeDashboard`, so they get `payload` and `user` but
 * no request. Every read here goes through the Local API AS THAT USER
 * (`user`, `overrideAccess: false`) wherever a role rule exists, so an
 * editor's dashboard never contains an order and the front desk never sees a
 * setting it could not open — the §J matrix decides what the dashboard
 * shows, not a second list kept here. The few admin-only globals are read
 * with `overrideAccess: true` after an explicit role check, because their
 * `access.read` would simply return nothing for anyone else.
 *
 * Nothing here may throw: a dashboard that fails to render takes the whole
 * admin home with it. `safe()` turns every failure into a logged fallback,
 * so a missing table (fresh database) or a slow gateway degrades one tile,
 * not the page.
 */

export type Tone = "ok" | "lilac" | "warn" | "bad" | "muted";

export type DashSession = {
  id: string;
  title: string;
  startsAt: string;
  venue: string;
  status: "draft" | "published" | "cancelled";
  seatsTotal: number;
  sold: number | null;
  held: number | null;
  available: number | null;
  bookingStatus: Session["bookingStatus"];
};

export type DashOrder = {
  id: string;
  reference: string;
  status: Order["status"];
  channel: Order["channel"];
  who: string;
  what: string;
  gross: string;
  createdAt: string;
  needsReview: boolean;
};

export type DashEnquiry = { id: string; name: string; topic: string; createdAt: string; snippet: string };

export type DashDraft = { href: string; label: string; kind: string; when?: string; scheduled?: boolean };

export type Kpi = {
  key: string;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  href?: string;
  tone?: "attention" | "muted";
};

export type DashboardData = {
  role: Role;
  studioName: string;
  firstName: string;
  greeting: string;
  todayLabel: string;
  todaySessions: DashSession[];
  upcoming: DashSession[];
  upcomingCount: number;
  kpis: Kpi[];
  recentOrders: DashOrder[];
  enquiries: DashEnquiry[];
  enquiriesNew: number;
  drafts: DashDraft[];
  homePageId: string | null;
  refundsAwaiting: number;
  summary: string;
};

export type Warning = {
  level: "red" | "amber" | "info";
  text: string;
  href?: string;
  cta?: string;
};

export type WarningsData = {
  red: Warning[];
  amber: Warning[];
  badges: Array<{ label: string; tone: Tone; href?: string; title?: string }>;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Small helpers                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

async function safe<T>(payload: Payload, what: string, fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    payload.logger.warn({ err: error }, `dashboard: ${what} unavailable`);
    return fallback;
  }
}

const has = (payload: Payload, slug: string): boolean => Boolean(payload.collections[slug as keyof typeof payload.collections]);

const hasGlobal = (payload: Payload, slug: string): boolean => payload.globals.config.some((g) => g.slug === slug);

export const fmtTime = (iso: string): string => new Intl.DateTimeFormat("en-GB", { timeZone: DUBAI_TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const fmtDay = (iso: string): string => new Intl.DateTimeFormat("en-GB", { timeZone: DUBAI_TZ, weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
export const fmtDayTime = (iso: string): string => `${fmtDay(iso)}, ${fmtTime(iso)}`;

/** "2 hours ago", "yesterday", or the date — for the small grey stamps. */
export function fmtAgo(iso: string, now = Date.now()): string {
  const ms = now - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return fmtDay(iso);
}

/** Start of the current Dubai week (Monday 00:00 GST) as an ISO instant. */
function dubaiWeekStart(now = new Date()): string {
  const today = dubaiDate(now);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: DUBAI_TZ, weekday: "short" }).format(now);
  const back = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  const monday = new Date(`${today}T00:00:00+04:00`);
  monday.setUTCDate(monday.getUTCDate() - Math.max(0, back));
  return monday.toISOString();
}

/**
 * Same scheme + host + port. A string prefix would call
 * "https://maisonpalettia.com.old-host.net/…" current for
 * "https://maisonpalettia.com"; comparing origins does not.
 */
export function sameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

const idOf = (value: unknown): string | null => (typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : null);

const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

function toDashSession(doc: Session & { _status?: string | null }): DashSession {
  const venue = doc.venue && typeof doc.venue === "object" ? (doc.venue as { name?: string }).name ?? "" : "";
  return {
    id: doc.id,
    title: sessionTitleOf(doc) || "Untitled session",
    startsAt: doc.startsAt,
    venue,
    status: doc.cancelledAt ? "cancelled" : doc._status === "draft" ? "draft" : "published",
    seatsTotal: doc.seatsTotal,
    sold: num(doc.seatsSold),
    held: num(doc.seatsHeld),
    available: num(doc.seatsAvailable),
    bookingStatus: doc.bookingStatus,
  };
}

const ORDER_LABEL: Record<Order["status"], string> = {
  pending_payment: "Pending",
  awaiting_payment: "Awaiting payment",
  confirming: "Confirming",
  confirmed: "Confirmed",
  completed: "Completed",
  failed: "Failed",
  expired: "Expired",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const orderStatusLabel = (status: Order["status"]): string => ORDER_LABEL[status] ?? status;

export function orderTone(status: Order["status"]): Tone {
  switch (status) {
    case "confirmed":
    case "completed":
      return "ok";
    case "confirming":
    case "awaiting_payment":
    case "pending_payment":
      return "lilac";
    case "failed":
    case "expired":
      return "warn";
    case "cancelled":
    case "refunded":
      return "muted";
    default:
      return "muted";
  }
}

function toDashOrder(doc: Order): DashOrder {
  const line = doc.lines?.[0];
  const qty = (doc.lines ?? []).reduce((sum, l) => sum + (l.qty ?? 0), 0);
  const name = [doc.contact?.firstName, doc.contact?.lastName].filter(Boolean).join(" ") || doc.contact?.email || "—";
  return {
    id: doc.id,
    reference: doc.reference,
    status: doc.status,
    channel: doc.channel,
    who: name,
    what: line ? `${qty} × ${line.title}${doc.lines && doc.lines.length > 1 ? ` +${doc.lines.length - 1}` : ""}` : "",
    gross: formatAed(doc.totals?.grossFils ?? 0),
    createdAt: doc.createdAt,
    needsReview: doc.needsReview === true,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Dashboard                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export async function loadDashboard(payload: Payload, user: TypedUser | null | undefined): Promise<DashboardData | null> {
  const role = roleOf({ user } as never);
  if (!user || !role) return null;
  const now = new Date();
  const today = dubaiDate(now);
  const { from: dayFrom, to: dayTo } = dubaiDayBounds(today);
  // Monday of this Dubai week as a day (the sales tiles' range start).
  const weekStartDay = dubaiDate(new Date(dubaiWeekStart(now)));
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000).toISOString();
  const staff = role === "admin" || role === "front-desk";
  const content = role === "admin" || role === "editor";

  const [site, todaySessions, upcoming, upcomingCount, enquiriesNew, enquiries, homePageId] = await Promise.all([
    safe(payload, "site-settings", null as SiteSetting | null, async () =>
      hasGlobal(payload, "site-settings") ? ((await payload.findGlobal({ slug: "site-settings", depth: 0, overrideAccess: true, select: { name: true } })) as SiteSetting) : null,
    ),
    safe(payload, "today's sessions", [] as DashSession[], async () => {
      const res = await payload.find({
        collection: "sessions",
        where: { and: [{ startsAt: { greater_than_equal: dayFrom } }, { startsAt: { less_than: dayTo } }] },
        sort: "startsAt",
        depth: 1,
        limit: 20,
        draft: true,
        user,
        overrideAccess: false,
      });
      return (res.docs as Session[]).map(toDashSession);
    }),
    safe(payload, "upcoming sessions", [] as DashSession[], async () => {
      const res = await payload.find({
        collection: "sessions",
        where: { and: [{ startsAt: { greater_than_equal: dayTo } }, { startsAt: { less_than: weekAhead } }] },
        sort: "startsAt",
        depth: 1,
        limit: 5,
        draft: true,
        user,
        overrideAccess: false,
      });
      return (res.docs as Session[]).map(toDashSession);
    }),
    safe(payload, "upcoming count", 0, async () => {
      const res = await payload.count({
        collection: "sessions",
        where: { and: [{ startsAt: { greater_than_equal: dayTo } }, { startsAt: { less_than: weekAhead } }] },
        user,
        overrideAccess: false,
      });
      return res.totalDocs;
    }),
    safe(payload, "new enquiries", 0, async () => (await payload.count({ collection: "enquiries", where: { status: { equals: "new" } }, user, overrideAccess: false })).totalDocs),
    safe(payload, "enquiries", [] as DashEnquiry[], async () => {
      const res = await payload.find({
        collection: "enquiries",
        where: { status: { not_equals: "closed" } },
        sort: "-createdAt",
        limit: 5,
        depth: 0,
        user,
        overrideAccess: false,
      });
      return (res.docs as Enquiry[]).map((e) => ({ id: e.id, name: e.name, topic: e.topic, createdAt: e.createdAt, snippet: (e.message ?? "").replace(/\s+/g, " ").slice(0, 90) }));
    }),
    safe(payload, "home page", null as string | null, async () => {
      if (!content) return null;
      const res = await payload.find({ collection: "pages", where: { slug: { equals: "home" } }, limit: 1, depth: 0, select: { slug: true }, user, overrideAccess: false });
      return res.docs[0]?.id ?? null;
    }),
  ]);

  // Commerce reads: admin and front desk only (editors cannot read orders, §J).
  //
  // The sales tiles use Analytics' own `salesKpis` (4B review): an order
  // counts on the Dubai day it was CONFIRMED, refunded-after-payment orders
  // still count as sales, and test orders drop out once Payments is Live —
  // so "Bookings this week" here and Analytics for the same days can never
  // show two different numbers for the same thing.
  let week: SalesKpis | null = null;
  let today_: SalesKpis | null = null;
  let recentOrders: DashOrder[] = [];
  let refundsAwaiting = 0;
  if (staff) {
    const modes = await safe(payload, "sales modes", ["live", "test", "mock"] as SalesKpis["modes"], () => salesModes(payload));
    [week, today_, recentOrders, refundsAwaiting] = await Promise.all([
      safe(payload, "week's sales", null as SalesKpis | null, () => salesKpis(payload, resolveRange({ from: weekStartDay, to: today }, { now }), modes)),
      safe(payload, "today's sales", null as SalesKpis | null, () => salesKpis(payload, resolveRange({ from: today, to: today }, { now }), modes)),
      safe(payload, "recent orders", [] as DashOrder[], async () => {
        const res = await payload.find({ collection: "orders", sort: "-createdAt", limit: 6, depth: 0, user, overrideAccess: false });
        return (res.docs as Order[]).map(toDashOrder);
      }),
      safe(payload, "refunds awaiting", 0, async () => (await payload.count({ collection: "refunds", where: { status: { equals: "requested" } }, user, overrideAccess: false })).totalDocs),
    ]);
  }

  // Content reads: drafts and scheduled publishes (admin and editor).
  let drafts: DashDraft[] = [];
  if (content) {
    drafts = await safe(payload, "drafts", [] as DashDraft[], async () => {
      const out: DashDraft[] = [];
      const kinds: Array<{ slug: "sessions" | "pages" | "experiences"; label: string; title: (d: Record<string, unknown>) => string }> = [
        { slug: "sessions", label: "Session", title: (d) => sessionTitleOf(d as unknown as Session) || String(d.slug ?? "") },
        { slug: "pages", label: "Page", title: (d) => String(d.title ?? d.slug ?? "") },
        { slug: "experiences", label: "Experience", title: (d) => String(d.name ?? d.slug ?? "") },
      ];
      for (const kind of kinds) {
        const res = await payload.find({
          collection: kind.slug,
          where: { _status: { equals: "draft" } },
          draft: true,
          sort: "-updatedAt",
          limit: 4,
          depth: 1,
          user,
          overrideAccess: false,
        });
        for (const doc of res.docs as unknown as Array<Record<string, unknown>>) {
          out.push({
            href: `/admin/collections/${kind.slug}/${String(doc.id)}`,
            label: kind.title(doc) || "Untitled",
            kind: kind.label,
            when: kind.slug === "sessions" && typeof doc.startsAt === "string" ? fmtDayTime(doc.startsAt) : undefined,
          });
        }
      }
      // Scheduled publishes live in the jobs queue (Payload's schedulePublish task).
      if (has(payload, "payload-jobs")) {
        const jobs = await payload.find({
          collection: "payload-jobs",
          where: { and: [{ taskSlug: { equals: "schedulePublish" } }, { completedAt: { exists: false } }, { hasError: { not_equals: true } }] },
          limit: 5,
          depth: 0,
          overrideAccess: true,
        });
        for (const job of jobs.docs as Array<{ input?: unknown; waitUntil?: string | null }>) {
          const input = (job.input ?? {}) as { doc?: { relationTo?: string; value?: unknown }; global?: string; type?: string };
          const slug = input.doc?.relationTo;
          const id = idOf(input.doc?.value);
          if (!slug || !id) continue;
          out.push({ href: `/admin/collections/${slug}/${id}`, label: `${input.type === "unpublish" ? "Unpublish" : "Publish"} scheduled`, kind: slug, when: job.waitUntil ? fmtDayTime(job.waitUntil) : undefined, scheduled: true });
        }
      }
      return out.slice(0, 8);
    });
  }

  // Visitors (P4 4C wired this placeholder): the same numbers as
  // /admin/analytics' "Last 7 days" — `trafficSummary` reads 4A's daily
  // rollup for finished days and counts today live from the raw events, so
  // the tile and the analytics page can never disagree. "Daily visitors":
  // the anonymous id resets every day, so the week is the sum of its days.
  const visitors = await safe(payload, "visitors", null as { value: number; change: number | null; any: boolean } | null, async () => {
    if (role !== "admin" || !has(payload, "analytics-daily")) return null;
    const [summary, any] = await Promise.all([trafficSummary(payload, resolveRange({ range: "7" }, { now })), hasAnyTraffic(payload)]);
    return { value: summary.visitors.value, change: summary.visitors.change, any };
  });

  const weekCount = week?.orders.value ?? 0;
  const weekGross = week?.grossFils.value ?? 0;
  const todayCount = today_?.orders.value ?? 0;
  const todayGross = today_?.grossFils.value ?? 0;
  const onlineToday = today_?.channel.online.orders ?? 0;
  // Same words as Analytics: "Including test orders" until Payments is Live.
  const testNote = week?.includesTestOrders ? " · incl. test orders" : "";
  // The Analytics page for exactly these days (Monday → today).
  const weekHref = `/admin/analytics?from=${weekStartDay}&to=${today}`;

  const kpis: Kpi[] = [];
  if (staff) {
    kpis.push(
      { key: "bookings", label: "Bookings this week", value: String(weekCount), hint: `${todayCount} today${todayCount ? ` · ${onlineToday} online, ${todayCount - onlineToday} desk` : ""}${testNote}`, href: role === "admin" ? weekHref : "/admin/collections/orders?where[status][in]=confirmed,completed" },
      {
        key: "revenue",
        label: "Revenue this week",
        value: formatAed(weekGross, { currency: false }),
        unit: "AED",
        hint: `${todayGross ? `${formatAed(todayGross)} today` : "Nothing taken yet today"}${week?.refunds.amountFils ? ` · ${formatAed(week.grossAfterRefundsFils)} after refunds` : ""}`,
        href: role === "admin" ? weekHref : "/admin/collections/orders",
      },
    );
  } else {
    kpis.push({ key: "sessions", label: "Sessions in the next 7 days", value: String(upcomingCount), hint: `${todaySessions.length} today`, href: "/admin/collections/sessions" });
  }
  kpis.push({ key: "enquiries", label: "New enquiries", value: String(enquiriesNew), hint: enquiriesNew ? "Waiting for a reply" : "Inbox is clear", href: "/admin/collections/enquiries?where[status][equals]=new", tone: enquiriesNew ? "attention" : undefined });
  if (role === "admin") {
    kpis.push(
      visitors === null || !visitors.any
        ? { key: "visitors", label: "Daily visitors, last 7 days", value: "—", hint: visitors === null ? "Open Analytics for the website's numbers" : "Counts start with the site's first visit", href: "/admin/analytics", tone: "muted" }
        : {
            key: "visitors",
            label: "Daily visitors, last 7 days",
            value: visitors.value.toLocaleString("en-GB"),
            hint: visitors.change === null ? "Each visitor counted once a day" : `${visitors.change >= 0 ? "▲" : "▼"} ${Math.round(Math.abs(visitors.change) * 100)}% vs the week before`,
            href: "/admin/analytics",
          },
    );
  } else if (staff) {
    kpis.push({ key: "sessions", label: "Sessions in the next 7 days", value: String(upcomingCount), hint: `${todaySessions.length} today`, href: "/admin/collections/sessions" });
  } else {
    kpis.push({ key: "drafts", label: "Drafts in progress", value: String(drafts.filter((d) => !d.scheduled).length), hint: "Unpublished pages, sessions and experiences", href: "/admin/collections/sessions?where[_status][equals]=draft" });
  }

  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: DUBAI_TZ, hour: "numeric", hour12: false }).format(now));
  const greeting = hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = String((user as { name?: string }).name ?? "").trim().split(/\s+/)[0] || "there";

  // One sentence that says what today holds, so the owner knows before scrolling.
  const bits: string[] = [];
  if (todaySessions.length) {
    const first = todaySessions[0];
    const left = first.available !== null ? `${first.available} seat${first.available === 1 ? "" : "s"} left` : "";
    bits.push(`${todaySessions.length === 1 ? "One session" : `${todaySessions.length} sessions`} today — ${first.title} at ${fmtTime(first.startsAt)}${left ? ` with ${left}` : ""}`);
  } else {
    bits.push("No sessions today");
  }
  if (enquiriesNew) bits.push(`${enquiriesNew} new enquir${enquiriesNew === 1 ? "y" : "ies"} waiting`);
  if (refundsAwaiting && role === "admin") bits.push(`${refundsAwaiting} refund${refundsAwaiting === 1 ? "" : "s"} to approve`);

  return {
    role,
    studioName: site?.name?.trim() || "Maison Palettia",
    firstName,
    greeting,
    todayLabel: new Intl.DateTimeFormat("en-GB", { timeZone: DUBAI_TZ, weekday: "long", day: "numeric", month: "long" }).format(now),
    todaySessions,
    upcoming,
    upcomingCount,
    kpis,
    recentOrders,
    enquiries,
    enquiriesNew,
    drafts,
    homePageId,
    refundsAwaiting,
    summary: `${bits.join(". ")}.`,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Warnings                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * The plain-language setup checks (SPEC §I "Dashboard warnings"), each with
 * the link that fixes it. Admin sees everything; editors the content checks;
 * the front desk only what changes their day (bookings closed, gateway mode).
 */
export async function loadWarnings(payload: Payload, user: TypedUser | null | undefined): Promise<WarningsData | null> {
  const role = roleOf({ user } as never);
  if (!user || !role) return null;
  const red: Warning[] = [];
  const amber: Warning[] = [];
  const badges: WarningsData["badges"] = [];
  const admin = role === "admin";
  const content = admin || role === "editor";

  type SiteBits = Pick<SiteSetting, "publicUrl" | "jobsEnabled" | "allowAiImagery" | "enquiriesEnabled">;
  const [site, booking, state] = await Promise.all([
    safe(payload, "site-settings", null as SiteBits | null, async () =>
      hasGlobal(payload, "site-settings")
        ? ((await payload.findGlobal({ slug: "site-settings", depth: 0, overrideAccess: true, select: { publicUrl: true, jobsEnabled: true, allowAiImagery: true, enquiriesEnabled: true } })) as SiteBits)
        : null,
    ),
    safe(payload, "booking-settings", null as { bookingsOpen?: boolean | null; closedMessage?: string | null } | null, async () =>
      hasGlobal(payload, "booking-settings") ? ((await payload.findGlobal({ slug: "booking-settings", depth: 0, overrideAccess: true, select: { bookingsOpen: true, closedMessage: true } })) as { bookingsOpen?: boolean | null; closedMessage?: string | null }) : null,
    ),
    safe(payload, "system-state", null as { publicUrlConfirmedAt?: string | null } | null, async () =>
      hasGlobal(payload, "system-state") ? ((await payload.findGlobal({ slug: "system-state", depth: 0, overrideAccess: true, select: { publicUrlConfirmedAt: true } })) as { publicUrlConfirmedAt?: string | null }) : null,
    ),
  ]);

  if (admin && bootStatus.secretChanged) {
    red.push({
      level: "red",
      text: "Encrypted settings cannot be read — the server secret changed. Payment keys and email passwords are unreadable until the secrets are resealed (docs/cms-runbook.md).",
    });
  }
  if (admin && site?.jobsEnabled === false) {
    red.push({ level: "red", text: "Background tasks are paused — emails and payments will not be processed.", href: "/admin/globals/site-settings#field-jobsEnabled", cta: "Switch on" });
  }

  const placeholderUrl = !isAcceptablePublicUrl(site?.publicUrl) || !state?.publicUrlConfirmedAt;

  if (admin) {
    type PayBits = Pick<PaymentSetting, "mode" | "test" | "live">;
    const [pay, email, invoice, notify, counts] = await Promise.all([
      safe(payload, "payment-settings", null as PayBits | null, async () =>
        hasGlobal(payload, "payment-settings") ? ((await payload.findGlobal({ slug: "payment-settings", depth: 0, overrideAccess: true, select: { mode: true, test: true, live: true } })) as PayBits) : null,
      ),
      safe(payload, "email-settings", null as { provider?: string | null; lastVerify?: { ok?: boolean } | null } | null, async () =>
        hasGlobal(payload, "email-settings") ? ((await payload.findGlobal({ slug: "email-settings", depth: 0, overrideAccess: true, select: { provider: true, lastVerify: true } })) as { provider?: string | null; lastVerify?: { ok?: boolean } | null }) : null,
      ),
      safe(payload, "invoice-settings", null as { trn?: string | null; legalName?: string | null } | null, async () =>
        hasGlobal(payload, "invoice-settings") ? ((await payload.findGlobal({ slug: "invoice-settings", depth: 0, overrideAccess: true, select: { trn: true, legalName: true } })) as { trn?: string | null; legalName?: string | null }) : null,
      ),
      safe(payload, "notification-settings", null as { recipients?: Array<{ events?: string[] | null }> | null } | null, async () =>
        hasGlobal(payload, "notification-settings") ? ((await payload.findGlobal({ slug: "notification-settings", depth: 0, overrideAccess: true, select: { recipients: true } })) as { recipients?: Array<{ events?: string[] | null }> | null }) : null,
      ),
      safe(payload, "counts", { review: 0, disputed: 0, failedJobs: 0, failedMail: 0, refunds: 0, unverifiedHour: 0 }, async () => {
        const count = async (collection: string, where: Where) => (has(payload, collection) ? (await payload.count({ collection: collection as never, where, overrideAccess: true })).totalDocs : 0);
        const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
        const [review, disputed, failedJobs, failedMail, refunds, unverifiedHour] = await Promise.all([
          count("orders", { needsReview: { equals: true } }),
          count("orders", { disputed: { equals: true } }),
          count("payload-jobs", { hasError: { equals: true } }),
          count("notification-log", { status: { equals: "failed" } }),
          count("refunds", { status: { equals: "requested" } }),
          // Webhook deliveries that failed the signature check in the last hour
          // (SPEC §H.5 step 2 — the same 50/h threshold that emails staff).
          count("payment-events", { and: [{ verified: { equals: false } }, { createdAt: { greater_than: hourAgo } }] }),
        ]);
        return { review, disputed, failedJobs, failedMail, refunds, unverifiedHour };
      }),
    ]);

    const mode = pay?.mode ?? "test";
    const env = mode === "live" ? pay?.live : pay?.test;
    if (mode !== "mock" && env?.webhookUrl && site?.publicUrl && !sameOrigin(env.webhookUrl, site.publicUrl)) {
      red.push({ level: "red", text: `The Mamo Pay webhook points at an old address (${env.webhookUrl}). Register it again so payments are confirmed.`, href: "/admin/globals/payment-settings", cta: "Re-register" });
    }
    // Rows stored in the last hour, or this process's own counter for the
    // current clock hour (past 500 a day only the counter moves, §H.5).
    const live = unverifiedCounters();
    const unverified = Math.max(counts.unverifiedHour, live.hour === new Date().toISOString().slice(0, 13) ? live.hourCount : 0);
    if (unverified > UNVERIFIED_SPIKE_PER_HOUR) {
      red.push({
        level: "red",
        text: `${unverified} payment notifications in the last hour failed the security check. Either someone is sending fake ones, or Mamo Pay's signing secret changed — check the webhook on the Payments page.`,
        href: "/admin/collections/payment-events?where[verified][equals]=false",
        cta: "See them",
      });
    }
    if (counts.disputed) {
      red.push({ level: "red", text: `${counts.disputed} order${counts.disputed === 1 ? " has" : "s have"} an open card dispute.`, href: "/admin/collections/orders?where[disputed][equals]=true", cta: "Open" });
    }

    const emailOk = email?.provider && email.provider !== "log-only" && email.lastVerify?.ok === true;
    if (!emailOk) {
      amber.push({
        level: "amber",
        text: "Email is not set up — customers will not receive confirmations, tickets or invoices, and staff cannot reset passwords.",
        href: "/admin/globals/email-settings",
        cta: "Set up email",
      });
    }
    if (placeholderUrl) {
      amber.push({ level: "amber", text: "The site address is not confirmed yet. Payment returns, emails and the webhook all depend on it.", href: "/admin/globals/site-settings#field-publicUrl", cta: "Confirm address" });
    }
    const subscribed = (event: string) => (notify?.recipients ?? []).some((r) => (r.events ?? []).includes(event));
    const missing = ["new_enquiry", "failed_payment", "new_order"].filter((e) => !subscribed(e));
    if (missing.length) {
      const words: Record<string, string> = { new_enquiry: "new enquiries", failed_payment: "failed payments", new_order: "new bookings" };
      amber.push({ level: "amber", text: `Nobody is emailed about ${missing.map((m) => words[m]).join(", ")}.`, href: "/admin/globals/notification-settings", cta: "Choose who" });
    }
    if (!invoice?.trn?.trim()) {
      amber.push({ level: "amber", text: "The VAT registration number (TRN) is missing — invoices print as receipts until it is set.", href: "/admin/globals/invoice-settings#field-trn", cta: "Add TRN" });
    }
    if (counts.review) {
      amber.push({ level: "amber", text: `${counts.review} order${counts.review === 1 ? " needs" : "s need"} a look — something did not add up with the payment.`, href: "/admin/collections/orders?where[needsReview][equals]=true", cta: "Review" });
    }
    if (counts.refunds) {
      amber.push({ level: "amber", text: `${counts.refunds} refund request${counts.refunds === 1 ? " is" : "s are"} waiting for your approval.`, href: "/admin/collections/refunds?where[status][equals]=requested", cta: "Approve" });
    }
    if (counts.failedJobs) {
      amber.push({ level: "amber", text: `${counts.failedJobs} background task${counts.failedJobs === 1 ? "" : "s"} failed. Each can be retried from its page.`, href: "/admin/collections/payload-jobs?where[hasError][equals]=true", cta: "See tasks" });
    }
    if (counts.failedMail) {
      amber.push({ level: "amber", text: `${counts.failedMail} email${counts.failedMail === 1 ? "" : "s"} could not be sent.`, href: "/admin/collections/notification-log?where[status][equals]=failed", cta: "See emails" });
    }

    badges.push({
      label: mode === "live" ? "Payments: LIVE" : mode === "mock" ? "Payments: MOCK" : "Payments: TEST",
      tone: mode === "live" ? "ok" : mode === "mock" ? "bad" : "warn",
      href: "/admin/globals/payment-settings",
      title: mode === "live" ? "Real cards, real money." : mode === "mock" ? "Built-in fake gateway: every checkout succeeds." : "Mamo sandbox: test cards only, no money moves.",
    });
  } else if (role === "front-desk") {
    const pay = await safe(payload, "payment mode", null as { mode?: string } | null, async () =>
      hasGlobal(payload, "payment-settings") ? ((await payload.findGlobal({ slug: "payment-settings", depth: 0, overrideAccess: true, select: { mode: true } })) as { mode?: string }) : null,
    );
    if (pay?.mode && pay.mode !== "live") {
      badges.push({ label: `Payments: ${pay.mode.toUpperCase()}`, tone: pay.mode === "mock" ? "bad" : "warn", title: "Online payments are not live yet — desk bookings still work." });
    }
  }

  if (content) {
    const flagged = await safe(payload, "AI-flagged media", 0, async () =>
      site?.allowAiImagery ? 0 : (await payload.count({ collection: "media", where: { provenance: { in: ["ai-generated", "unknown"] } }, overrideAccess: true })).totalDocs,
    );
    if (flagged) {
      amber.push({
        level: "amber",
        text: `${flagged} photo${flagged === 1 ? " is" : "s are"} marked AI-generated or of unknown origin and cannot go in hero or card slots. Replace them, or allow AI imagery under Site details → Advanced.`,
        href: "/admin/collections/media?where[provenance][in]=ai-generated,unknown",
        cta: "See photos",
      });
    }
  }

  if (booking && booking.bookingsOpen !== true) {
    badges.push({
      label: "Online bookings closed",
      tone: "warn",
      href: admin ? "/admin/globals/booking-settings#field-bookingsOpen" : undefined,
      title: `Book buttons show “${booking.closedMessage || "Online bookings open soon."}” and link to Contact. Staff can still take desk bookings.`,
    });
  }
  if (site?.enquiriesEnabled === false && content) {
    badges.push({ label: "Contact forms off", tone: "muted", href: admin ? "/admin/globals/site-settings#field-enquiriesEnabled" : undefined });
  }

  return { red, amber, badges };
}
