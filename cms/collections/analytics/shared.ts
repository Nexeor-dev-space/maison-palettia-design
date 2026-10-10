/**
 * ==========================================================================
 * The analytics vocabulary — shared by the collections, the collector, the
 * rollup and the queries (SPEC §D.6)
 * ==========================================================================
 *
 * Plain constants with no imports, so the beacon's server code, the jobs
 * and the admin view can all agree on the same strings without any of them
 * loading the Payload config. A value added here must be added to the
 * select options in AnalyticsEvents.ts / AnalyticsDaily.ts in the same
 * change, and that change needs a migration (they are Postgres enums).
 */

/** What one row of `analytics-events` records. Only `pv` comes from the browser. */
export const EVENT_KINDS = ["pv", "checkout_started", "payment_redirect", "order_paid"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const DEVICES = ["desktop", "mobile", "tablet", "other"] as const;
export type Device = (typeof DEVICES)[number];

/**
 * Where a visit came from, in words the owner uses. Decided once, when the
 * visit's first page view arrives (internal navigation has no channel).
 */
export const CHANNELS = ["direct", "search", "social", "email", "referral"] as const;
export type Channel = (typeof CHANNELS)[number];

/** The cuts `rollup-analytics` stores per day. */
export const DIMENSIONS = ["total", "page", "referrer", "channel", "device", "browser", "country", "funnel"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

/** `analytics-daily` keys under the `funnel` dimension, in funnel order. */
export const FUNNEL_KEYS = ["event_view", "book_view", "checkout_started", "payment_redirect", "order_paid"] as const;
export type FunnelKey = (typeof FUNNEL_KEYS)[number];

/** The bucket every path the collector cannot match to a real page goes into. */
export const OTHER_PATH = "/other";
/** The referrer key for a visit with no referrer at all (typed address, bookmark, app). */
export const DIRECT_REFERRER = "(direct)";
/** The country key when the proxy sends no country header. */
export const UNKNOWN_COUNTRY = "--";

export const ANALYTICS_GROUP = "System";

/* ────────────────────────────────────────────────────────────────────────── */
/* Client-safe pieces (the beacon, the consent banner and the tags import     */
/* these, so nothing below may import anything)                               */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * The booking surfaces. Third-party tags are never mounted on them (SPEC
 * §G.2, §H.10) whatever `excludePaths` says, and the first-party beacon
 * skips them too: a payment flow is nobody's business to chart. `/dev` is
 * the mock gateway.
 */
export const SENSITIVE_PATHS = ["/checkout", "/payment-success", "/my-bookings", "/booking-status", "/dev"] as const;

/** `localStorage` key holding the visitor's consent choice ("granted" | "denied"), SPEC §C.3. */
export const CONSENT_STORAGE_KEY = "mp_consent";
/** The window event the banner fires when the choice changes, so the tags load without a reload. */
export const CONSENT_EVENT = "mp:consent";
export type ConsentChoice = "granted" | "denied";

/** The collector's address (app/(site)/api/site/analytics/collect/route.ts). */
export const COLLECT_URL = "/api/site/analytics/collect";

/** Same path rule as the collector (SPEC §D.6): lowercase letters, digits, hyphens and slashes, ≤ 161 chars. */
export const PATH_PATTERN = /^\/[a-z0-9\-/]{0,160}$/;

/**
 * A pathname as the analytics see it: no query, no fragment, lowercase, no
 * repeated or trailing slash ("/Events/candle-making/?x=1#y" →
 * "/events/candle-making"). `null` when what is left is not a plain site
 * path — the collector stores nothing for it.
 */
export function normalisePath(raw: string): string | null {
  if (typeof raw !== "string") return null;
  let path = raw.split(/[?#]/, 1)[0] ?? "";
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  path = path.toLowerCase().replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (!path.startsWith("/")) return null;
  return PATH_PATTERN.test(path) ? path : null;
}

/**
 * Whether `path` falls under one of `patterns`. An entry matches itself and
 * everything beneath it ("/dev" covers "/dev/mamo-mock/pay/1"); a trailing
 * `*` matches any continuation ("/events/candle*").
 */
export function isExcludedPath(path: string, patterns: readonly string[]): boolean {
  const p = path.toLowerCase();
  return patterns.some((raw) => {
    const pattern = raw.trim().toLowerCase().replace(/\/+$/, "");
    if (!pattern) return false;
    if (pattern.endsWith("*")) return p.startsWith(pattern.slice(0, -1));
    return p === pattern || p.startsWith(`${pattern}/`);
  });
}

export type ExternalProvider = "none" | "ga4" | "plausible" | "umami";

/**
 * What the public site needs from `analytics-settings` — and nothing more.
 * The global itself is admin-only; the layout reads it on the server and
 * hands only this down to the three client components. Every id here is
 * public by nature (it is in the page source of any site that uses it).
 */
export interface SiteAnalyticsConfig {
  /** First-party cookieless beacon. */
  beacon: { enabled: boolean; respectDoNotTrack: boolean; excludePaths: string[] };
  external: {
    provider: ExternalProvider;
    measurementId: string | null;
    plausibleDomain: string | null;
    umamiScriptUrl: string | null;
    umamiWebsiteId: string | null;
    metaPixelId: string | null;
  };
  consent: {
    required: boolean;
    bannerText: string;
    acceptLabel: string;
    declineLabel: string;
    policyHref: string;
  };
}

/** True when any third-party tag is configured (otherwise there is nothing to ask consent for). */
export const hasExternalTags = (config: SiteAnalyticsConfig): boolean =>
  config.external.provider !== "none" || Boolean(config.external.metaPixelId);

export const DEFAULT_SITE_ANALYTICS: SiteAnalyticsConfig = {
  beacon: { enabled: true, respectDoNotTrack: true, excludePaths: [...SENSITIVE_PATHS] },
  external: { provider: "none", measurementId: null, plausibleDomain: null, umamiScriptUrl: null, umamiWebsiteId: null, metaPixelId: null },
  consent: {
    required: true,
    bannerText: "We use analytics cookies to understand how the site is used. Nothing is loaded until you accept.",
    acceptLabel: "Accept",
    declineLabel: "Decline",
    policyHref: "/policies",
  },
};
