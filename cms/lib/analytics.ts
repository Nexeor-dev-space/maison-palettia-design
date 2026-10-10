import { sql, type SQL } from "@payloadcms/db-postgres/drizzle";
import Bowser from "bowser";
import type { Payload } from "payload";
import { z } from "zod";

import {
  CHANNELS,
  DEFAULT_SITE_ANALYTICS,
  DIRECT_REFERRER,
  isExcludedPath,
  normalisePath,
  OTHER_PATH,
  SENSITIVE_PATHS,
  UNKNOWN_COUNTRY,
  type Channel,
  type Device,
  type Dimension,
  type EventKind,
  type ExternalProvider,
  type SiteAnalyticsConfig,
} from "@/cms/collections/analytics/shared";
import { resolveLink, type LinkValue } from "@/cms/fields/link";
// Straight from the 1A modules (re-exported by cms/lib/contracts.ts) so the site layout,
// which imports this file for its config getter, does not load the whole commerce layer.
import { deriveKey, dubaiDay, hmacSha256, ipHash } from "@/cms/lib/crypto";
import { clientIp, rateLimit } from "@/cms/lib/rateLimit";

/**
 * ==========================================================================
 * First-party analytics — the collector, its privacy rules, and the SQL the
 * rollup and the admin view share (SPEC §D.6, §I)
 * ==========================================================================
 *
 * WHAT THE OWNER GETS. "How many people looked at the site, which pages,
 * where they came from, on what, and how many of them went on to book" —
 * without a cookie, a consent banner or a third party. The numbers live in
 * this database and nowhere else.
 *
 * HOW A PAGE VIEW TRAVELS:
 *
 *   1. <AnalyticsBeacon> (components/cms) fires `navigator.sendBeacon` on
 *      every route change with `{ p, r?, e }`: the pathname (query string and
 *      #fragment already gone), the referring HOSTNAME only on the first page
 *      of a visit, and whether this is that first page. Nothing else leaves
 *      the browser — no cookie, no storage, no screen size, no fingerprint.
 *   2. `handleCollect` (this file, mounted at POST /api/site/analytics/collect)
 *      refuses cross-site posts and bodies over 1 KB, rate-limits 120/min per
 *      hashed IP, drops bots, honours Do-Not-Track/GPC when the setting says
 *      so, drops excluded paths, then normalises the path and maps it to a
 *      KNOWN route of this site (static routes + published slugs, cached
 *      five minutes); anything else is recorded as `/other`, so a scanner
 *      probing `/wp-admin` cannot fill the "Top pages" list with junk.
 *   3. The row keeps: Dubai day, path, referrer host (never our own),
 *      channel, device class, browser family, the proxy's country code when
 *      it sends one, and `visitor` — an HMAC of IP + user agent under a key
 *      HKDF-derived from PAYLOAD_SECRET and today's date (`analytics-<day>`,
 *      the same never-stored daily salt the rate limiter uses). The raw IP
 *      and user agent are never written anywhere.
 *   4. Rows are buffered in memory for up to two seconds (or 50 rows) and
 *      inserted in one statement — one Node process on one server (§A.5),
 *      so a small buffer saves a transaction per page view; a crash loses at
 *      most two seconds of page views, which is an acceptable price for
 *      analytics and never for anything else. (On Vercel this becomes a
 *      direct insert — SPEC §A.5.)
 *   5. `rollup-analytics` (hourly) turns finished days into
 *      `analytics-daily` rows; today is always read live from the raw rows
 *      (cms/lib/analyticsQueries.ts). `purge-retention` deletes raw rows
 *      older than `rawRetentionDays` once their day is rolled up.
 *
 * Server only. The browser-side pieces (path normalisation, exclusions, the
 * consent key) are in cms/collections/analytics/shared.ts, which imports
 * nothing, so the client components never pull this file in.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Request parsing — pure, unit-tested                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/** SPEC §D.6: body ≤ 1 KB, 120/min per ipHash. */
export const COLLECT_MAX_BYTES = 1024;
export const COLLECT_RATE_LIMIT = { limit: 120, windowMs: 60_000 } as const;

/** The beacon's body. Short keys because it is sent on every page view. */
export const BeaconSchema = z.object({
  /** Pathname; the browser already dropped the query and fragment, the server drops them again. */
  p: z.string().min(1).max(300),
  /** Referring hostname (first page of a visit only). A full URL is tolerated and cut to its host. */
  r: z.string().max(300).optional(),
  /** First page view of this page load (a landing), as opposed to in-site navigation. */
  e: z.boolean().optional(),
});
export type BeaconBody = z.infer<typeof BeaconSchema>;

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|curl|wget|python-|httpclient|axios|node-fetch|go-http|java\/|monitor|uptime|pingdom|scan/i;

export interface ParsedAgent {
  device: Device;
  browser: string;
  isBot: boolean;
}

/** Device class and browser family from a user agent. The string itself is never stored. */
export function parseUserAgent(userAgent: string | null | undefined): ParsedAgent {
  const ua = (userAgent ?? "").slice(0, 512);
  if (!ua || BOT_UA.test(ua)) return { device: "other", browser: "Bot", isBot: true };
  let parsed: ReturnType<typeof Bowser.parse>;
  try {
    parsed = Bowser.parse(ua);
  } catch {
    return { device: "other", browser: "Other", isBot: false };
  }
  const type = parsed.platform?.type;
  if (type === "bot") return { device: "other", browser: "Bot", isBot: true };
  const device: Device = type === "mobile" ? "mobile" : type === "tablet" ? "tablet" : type === "desktop" ? "desktop" : "other";
  const name = (parsed.browser?.name ?? "").trim();
  return { device, browser: browserFamily(name), isBot: false };
}

/** Bowser's names folded into the handful the owner would recognise. */
function browserFamily(name: string): string {
  if (!name) return "Other";
  if (/chrom/i.test(name) && !/edge|opera|samsung/i.test(name)) return "Chrome";
  if (/safari/i.test(name)) return "Safari";
  if (/firefox/i.test(name)) return "Firefox";
  if (/edge/i.test(name)) return "Edge";
  if (/samsung/i.test(name)) return "Samsung Internet";
  if (/opera/i.test(name)) return "Opera";
  if (/instagram|facebook|whatsapp|snapchat|tiktok|linkedin/i.test(name)) return `${name.split(" ")[0]} (in-app)`;
  return name.slice(0, 40);
}

/**
 * The referrer as a bare, lowercase hostname without `www.` — or `null` for
 * none, for anything that does not parse as a host, and for our own site
 * (in-site navigation is not a referral).
 */
export function referrerHostOf(raw: string | null | undefined, ownHosts: readonly string[]): string | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  let host = "";
  try {
    host = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(value) ? value : `https://${value}`).hostname;
  } catch {
    return null;
  }
  host = host.replace(/^www\./, "").replace(/\.$/, "");
  // Android apps send "android-app://com.instagram.android"; its "host" is the app id, which is what we want.
  if (!/^(?=.{1,253}$)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null;
  const own = ownHosts.map((h) => h.toLowerCase().replace(/^www\./, ""));
  return own.includes(host) ? null : host;
}

const EMAIL = /^(mail|webmail|outlook|email)\.|(^|\.)(outlook\.live\.com|mailchimp\.com|list-manage\.com|sendgrid\.net|klaviyo\.com)$/;
const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex|startpage|qwant|search\.brave|naver)\.[a-z.]+$/;
const SOCIAL = /(^|\.)(instagram|facebook|fb|messenger|twitter|x|linkedin|lnkd|pinterest|tiktok|youtube|youtu|whatsapp|snapchat|reddit|threads|telegram)\.[a-z.]+$|^(t\.co|wa\.me|t\.me|pin\.it)$|^com\.(instagram|facebook|whatsapp|linkedin|twitter|zhiliaoapp)\./;

/** "Where from", in the owner's words. Only meaningful for the first page of a visit. Email is checked first: mail.google.com is not a search. */
export function channelOf(host: string | null): Channel {
  if (!host) return "direct";
  if (EMAIL.test(host)) return "email";
  if (SEARCH.test(host)) return "search";
  if (SOCIAL.test(host)) return "social";
  return "referral";
}

/** The two-letter country the proxy/CDN already determined, if it says. We never look an IP up ourselves. */
export function countryOf(headers: Headers): string {
  for (const name of ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code", "x-geo-country"]) {
    const value = headers.get(name)?.trim().toUpperCase();
    if (value && /^[A-Z]{2}$/.test(value) && value !== "XX" && value !== "T1") return value;
  }
  return UNKNOWN_COUNTRY;
}

/** Do-Not-Track or Global Privacy Control. */
export const sendsDoNotTrack = (headers: Headers): boolean => headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";

/**
 * The daily visitor id: HMAC(IP ‖ user agent) under the `analytics-<day>`
 * key. Same browser + same connection + same Dubai day → same value; any
 * other day → unrelated value. 32 hex characters.
 */
export function visitorId(ip: string, userAgent: string, day: string = dubaiDay()): string {
  return hmacSha256(deriveKey(`analytics-${day}`), `${ip.trim()}\n${userAgent.slice(0, 512)}`).toString("hex").slice(0, 32);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Known routes — what a path may be recorded as                              */
/* ────────────────────────────────────────────────────────────────────────── */

/** Every parameter-free page the site serves (app/(site)/**), booking surfaces included so they map, then get excluded. */
export const STATIC_ROUTES: readonly string[] = [
  "/",
  "/events",
  "/private-events",
  "/private-events/book",
  "/about",
  "/locations",
  "/gallery",
  "/contact",
  "/faq",
  "/policies",
  "/loyalty",
  "/blog",
  ...SENSITIVE_PATHS,
];

export interface KnownRoutes {
  /** Session and activity slugs — `/events/{slug}` and `/events/{slug}/book`. */
  events: ReadonlySet<string>;
  /** Programme slugs — `/private-events/{slug}`. */
  programmes: ReadonlySet<string>;
  /** Policy slugs — `/policies/{slug}`. */
  policies: ReadonlySet<string>;
  /** Landing-page slugs served by the catch-all — `/{slug}`. */
  pages: ReadonlySet<string>;
}

export const EMPTY_ROUTES: KnownRoutes = { events: new Set(), programmes: new Set(), policies: new Set(), pages: new Set() };

/**
 * The route a normalised path is recorded under: itself when the site
 * really serves it, otherwise `/other` (404s, scanners, retired slugs).
 */
export function routeFor(path: string, known: KnownRoutes): string {
  if (STATIC_ROUTES.includes(path)) return path;
  const parts = path.split("/").slice(1);
  const [first, second, third] = parts;
  if (first === "events" && second && known.events.has(second)) {
    if (parts.length === 2) return path;
    if (parts.length === 3 && third === "book") return path;
  }
  if (parts.length === 2 && first === "private-events" && second && known.programmes.has(second)) return path;
  if (parts.length === 2 && first === "policies" && second && known.policies.has(second)) return path;
  if (parts.length === 1 && first && known.pages.has(first)) return path;
  return OTHER_PATH;
}

const ROUTES_TTL_MS = 5 * 60_000;
let routesCache: { at: number; value: KnownRoutes; loading?: Promise<KnownRoutes> } | null = null;

async function publishedSlugs(payload: Payload, collection: "sessions" | "experiences" | "programmes" | "policies" | "pages"): Promise<Set<string>> {
  try {
    const result = await payload.find({
      collection,
      where: { _status: { equals: "published" } },
      select: { slug: true } as never,
      depth: 0,
      limit: 5000,
      pagination: false,
      overrideAccess: true,
    });
    return new Set((result.docs as Array<{ slug?: string | null }>).map((d) => d.slug ?? "").filter(Boolean));
  } catch {
    return new Set();
  }
}

/** Published slugs, cached for five minutes per process (a new page shows as `/other` for at most that long). */
export async function knownRoutes(payload: Payload): Promise<KnownRoutes> {
  const now = Date.now();
  if (routesCache && now - routesCache.at < ROUTES_TTL_MS) return routesCache.value;
  if (routesCache?.loading) return routesCache.loading;
  const loading = (async () => {
    const [sessions, experiences, programmes, policies, pages] = await Promise.all([
      publishedSlugs(payload, "sessions"),
      publishedSlugs(payload, "experiences"),
      publishedSlugs(payload, "programmes"),
      publishedSlugs(payload, "policies"),
      publishedSlugs(payload, "pages"),
    ]);
    return { events: new Set([...sessions, ...experiences]), programmes, policies, pages } satisfies KnownRoutes;
  })();
  routesCache = { at: routesCache?.at ?? 0, value: routesCache?.value ?? EMPTY_ROUTES, loading };
  try {
    const value = await loading;
    routesCache = { at: Date.now(), value };
    return value;
  } catch {
    routesCache = null;
    return EMPTY_ROUTES;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Settings                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

interface AnalyticsSettingsDoc {
  enabled?: boolean | null;
  respectDoNotTrack?: boolean | null;
  rawRetentionDays?: number | null;
  excludePaths?: Array<{ path?: string | null }> | null;
  external?: {
    provider?: ExternalProvider | null;
    measurementId?: string | null;
    plausibleDomain?: string | null;
    umamiScriptUrl?: string | null;
    umamiWebsiteId?: string | null;
    metaPixelId?: string | null;
  } | null;
  consent?: {
    required?: boolean | null;
    bannerText?: string | null;
    acceptLabel?: string | null;
    declineLabel?: string | null;
    policyLink?: LinkValue | null;
  } | null;
}

/**
 * The global → the public subset the site may know (`SiteAnalyticsConfig`).
 * Ids are re-checked against their shapes here too, so a value that somehow
 * bypassed validation (a direct SQL edit, an old row) is dropped rather
 * than rendered into a script.
 */
export function toSiteAnalyticsConfig(doc: AnalyticsSettingsDoc | null | undefined): SiteAnalyticsConfig {
  const d = DEFAULT_SITE_ANALYTICS;
  if (!doc) return d;
  const ext = doc.external ?? {};
  const ok = (value: string | null | undefined, re: RegExp) => (value && re.test(value) ? value : null);
  const provider: ExternalProvider = ext.provider === "ga4" || ext.provider === "plausible" || ext.provider === "umami" ? ext.provider : "none";
  const external = {
    provider,
    measurementId: ok(ext.measurementId, /^G-[A-Z0-9]{4,16}$/),
    plausibleDomain: ok(ext.plausibleDomain, /^[a-z0-9.-]+\.[a-z]{2,}$/i),
    umamiScriptUrl: ok(ext.umamiScriptUrl, /^https:\/\/[^\s"'<>]+$/i),
    umamiWebsiteId: ok(ext.umamiWebsiteId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    metaPixelId: ok(ext.metaPixelId, /^\d{5,20}$/),
  };
  // A provider without its id is "none": the tags component never has to guess.
  const complete =
    (provider === "ga4" && external.measurementId) ||
    (provider === "plausible" && external.plausibleDomain) ||
    (provider === "umami" && external.umamiScriptUrl && external.umamiWebsiteId);
  if (!complete) external.provider = "none";

  const exclude = (doc.excludePaths ?? []).map((row) => row?.path?.trim() ?? "").filter((p) => p.startsWith("/"));
  const consent = doc.consent ?? {};
  return {
    beacon: {
      enabled: doc.enabled !== false,
      respectDoNotTrack: doc.respectDoNotTrack !== false,
      excludePaths: [...new Set([...SENSITIVE_PATHS, ...exclude])],
    },
    external,
    consent: {
      required: consent.required !== false,
      bannerText: consent.bannerText?.trim() || d.consent.bannerText,
      acceptLabel: consent.acceptLabel?.trim() || d.consent.acceptLabel,
      declineLabel: consent.declineLabel?.trim() || d.consent.declineLabel,
      policyHref: resolveLink(consent.policyLink) || d.consent.policyHref,
    },
  };
}

async function readAnalyticsSettings(payload: Payload): Promise<AnalyticsSettingsDoc | null> {
  try {
    return (await payload.findGlobal({ slug: "analytics-settings", depth: 0, overrideAccess: true })) as AnalyticsSettingsDoc;
  } catch {
    return null;
  }
}

/**
 * For app/(site)/layout.tsx: the public analytics config, cached under the
 * `global:analytics-settings` tag (the global's afterChange purges it and
 * the layout), and the defaults whenever the CMS cannot answer — so a build
 * without a database still renders, with the first-party beacon on and no
 * third-party tags.
 */
export async function getSiteAnalyticsConfig(): Promise<SiteAnalyticsConfig> {
  try {
    const [{ cached, TAGS }, { getCms }] = await Promise.all([import("@/lib/cms/cache"), import("@/lib/cms/payload")]);
    const read = cached("cms:analytics-public", [TAGS.analytics], async () => toSiteAnalyticsConfig(await readAnalyticsSettings(await getCms())));
    return await read();
  } catch {
    return DEFAULT_SITE_ANALYTICS;
  }
}

/** The collector's view of the settings, re-read at most once a minute per process. */
let collectorSettings: { at: number; value: SiteAnalyticsConfig["beacon"] } | null = null;
async function beaconSettings(payload: Payload): Promise<SiteAnalyticsConfig["beacon"]> {
  if (collectorSettings && Date.now() - collectorSettings.at < 60_000) return collectorSettings.value;
  const value = toSiteAnalyticsConfig(await readAnalyticsSettings(payload)).beacon;
  collectorSettings = { at: Date.now(), value };
  return value;
}

/** `rawRetentionDays` (7–730, default 90) for `purge-retention`. */
export async function rawRetentionDays(payload: Payload): Promise<number> {
  const doc = await readAnalyticsSettings(payload);
  const days = Number(doc?.rawRetentionDays);
  return Number.isFinite(days) && days >= 7 ? Math.min(Math.floor(days), 730) : 90;
}

/** The hosts that count as "this site" for referrers: the request's own and Site details' public address. */
async function ownHosts(payload: Payload, headers: Headers): Promise<string[]> {
  const hosts = [headers.get("x-forwarded-host"), headers.get("host")]
    .flatMap((h) => (h ?? "").split(","))
    .map((h) => h.trim().replace(/:\d+$/, ""))
    .filter(Boolean);
  try {
    const site = (await payload.findGlobal({ slug: "site-settings", depth: 0, overrideAccess: true, select: { publicUrl: true } as never })) as { publicUrl?: string | null };
    if (site?.publicUrl) hosts.push(new URL(site.publicUrl).hostname);
  } catch {
    // no site settings yet — the request's host is enough
  }
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    try {
      hosts.push(new URL(process.env.NEXT_PUBLIC_SERVER_URL).hostname);
    } catch {
      // ignore a malformed value
    }
  }
  return hosts;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Writing — a two-second buffer                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export interface EventRow {
  ts: Date;
  day: string;
  kind: EventKind;
  path: string;
  entry: boolean;
  referrerHost: string | null;
  channel: Channel | null;
  device: Device | null;
  browser: string | null;
  country: string | null;
  visitor: string;
}

const FLUSH_AFTER_MS = 2_000;
const FLUSH_AT_ROWS = 50;
/** If the database is down, keep at most this many rows waiting rather than growing without bound. */
const MAX_PENDING = 2_000;

const buffer: { rows: EventRow[]; timer: ReturnType<typeof setTimeout> | null; payload: Payload | null } = { rows: [], timer: null, payload: null };

type DrizzleInsert = { insert: (table: unknown) => { values: (rows: unknown[]) => Promise<unknown> } };

async function insertRows(payload: Payload, rows: EventRow[]): Promise<void> {
  const adapter = payload.db as unknown as { drizzle: DrizzleInsert; tables: Record<string, unknown> };
  const table = adapter.tables?.analytics_events;
  if (!table) throw new Error("analytics_events table is not in the schema (run the analytics migration)");
  await adapter.drizzle.insert(table).values(rows.map((r) => ({ ...r, ts: r.ts.toISOString() })));
}

/** Writes whatever is buffered. Exported for tests and for a graceful shutdown hook. */
export async function flushAnalytics(): Promise<number> {
  if (buffer.timer) clearTimeout(buffer.timer);
  buffer.timer = null;
  const payload = buffer.payload;
  const rows = buffer.rows.splice(0, buffer.rows.length);
  if (!payload || rows.length === 0) return 0;
  try {
    await insertRows(payload, rows);
    return rows.length;
  } catch (error) {
    payload.logger.warn({ msg: "analytics: could not write page views; dropped", rows: rows.length, error: error instanceof Error ? error.message : String(error) });
    return 0;
  }
}

function enqueueRow(payload: Payload, row: EventRow) {
  buffer.payload = payload;
  if (buffer.rows.length >= MAX_PENDING) return;
  buffer.rows.push(row);
  if (buffer.rows.length >= FLUSH_AT_ROWS) {
    void flushAnalytics();
    return;
  }
  if (!buffer.timer) {
    buffer.timer = setTimeout(() => void flushAnalytics(), FLUSH_AFTER_MS);
    // Never keep a CLI process (payload run, migrate) alive for a pending flush.
    (buffer.timer as { unref?: () => void }).unref?.();
  }
}

/**
 * Records a server-side funnel step (`checkout_started`, `payment_redirect`,
 * `order_paid`) against the visitor who caused it. Optional: the funnel
 * falls back to the orders themselves for those steps (analyticsQueries),
 * so a caller that never records them loses nothing. Never throws.
 */
export function recordServerEvent(payload: Payload, kind: Exclude<EventKind, "pv">, from: { headers: Headers; path?: string }): void {
  try {
    const ua = from.headers.get("user-agent") ?? "";
    const day = dubaiDay();
    const agent = parseUserAgent(ua);
    const path = (from.path && normalisePath(from.path)) || OTHER_PATH;
    enqueueRow(payload, {
      ts: new Date(),
      day,
      kind,
      path,
      entry: false,
      referrerHost: null,
      channel: null,
      device: agent.device,
      browser: agent.browser,
      country: countryOf(from.headers),
      visitor: visitorId(clientIp(from.headers), ua, day),
    });
  } catch {
    // analytics never breaks a checkout
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The collector                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export interface CollectDeps {
  /** The Local API. Injectable so the unit suite needs no database. */
  getPayload: () => Promise<Payload>;
  /** Defaults to the cached `knownRoutes`. */
  routes?: (payload: Payload) => Promise<KnownRoutes>;
  /** Defaults to the buffered writer. */
  write?: (payload: Payload, row: EventRow) => void | Promise<void>;
  now?: () => Date;
}

const defaultDeps: CollectDeps = {
  // Imported lazily: a static import of lib/cms/payload.ts would pull the whole config into this module (and its tests).
  getPayload: () => import("@/lib/cms/payload").then(({ getCms }) => getCms()),
};

/** Every outcome but a malformed request is a silent 204: the beacon never needs an answer, and a bot learns nothing. */
const done = (status = 204, headers: Record<string, string> = {}) => new Response(null, { status, headers: { "cache-control": "no-store", ...headers } });

/**
 * The body of `POST /api/site/analytics/collect`. Never throws.
 * Returns what it decided in the `x-mp-analytics` header (dev aid; no data).
 */
export async function handleCollect(request: Request, deps: CollectDeps = defaultDeps): Promise<Response> {
  const headers = request.headers;
  if (headers.get("sec-fetch-site") === "cross-site") return done(403);

  const ip = clientIp(headers);
  if (!rateLimit("analytics-collect", ipHash(ip), COLLECT_RATE_LIMIT)) return done(429, { "retry-after": "60" });

  const declared = Number(headers.get("content-length") ?? 0);
  if (declared > COLLECT_MAX_BYTES) return done(413);
  let body: BeaconBody;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > COLLECT_MAX_BYTES) return done(413);
    const parsed = BeaconSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return done(400);
    body = parsed.data;
  } catch {
    return done(400);
  }

  const ua = headers.get("user-agent") ?? "";
  const agent = parseUserAgent(ua);
  if (agent.isBot) return done(204, { "x-mp-analytics": "bot" });

  const normalised = normalisePath(body.p);
  if (!normalised) return done(204, { "x-mp-analytics": "invalid-path" });

  let payload: Payload;
  try {
    payload = await deps.getPayload();
  } catch {
    return done(204, { "x-mp-analytics": "unavailable" });
  }

  const settings = await beaconSettings(payload);
  if (!settings.enabled) return done(204, { "x-mp-analytics": "disabled" });
  if (settings.respectDoNotTrack && sendsDoNotTrack(headers)) return done(204, { "x-mp-analytics": "dnt" });
  if (isExcludedPath(normalised, settings.excludePaths)) return done(204, { "x-mp-analytics": "excluded" });

  const path = routeFor(normalised, await (deps.routes ?? knownRoutes)(payload));
  const now = deps.now?.() ?? new Date();
  const day = dubaiDay(now);
  const anyHost = body.e ? referrerHostOf(body.r, []) : null;
  const referrerHost = anyHost ? referrerHostOf(body.r, await ownHosts(payload, headers)) : null;
  // A "landing" whose referrer was our own site (a full reload, a plain <a>) is navigation, not a visit.
  const entry = Boolean(body.e) && !(anyHost !== null && referrerHost === null);

  const row: EventRow = {
    ts: now,
    day,
    kind: "pv",
    path,
    entry,
    referrerHost: entry ? referrerHost : null,
    channel: entry ? channelOf(referrerHost) : null,
    device: agent.device,
    browser: agent.browser,
    country: countryOf(headers),
    visitor: visitorId(ip, ua, day),
  };
  try {
    await (deps.write ?? enqueueRow)(payload, row);
  } catch {
    return done(204, { "x-mp-analytics": "write-failed" });
  }
  return done(204, { "x-mp-analytics": path === OTHER_PATH ? "other" : "ok" });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* SQL shared by the rollup and the live queries                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * For each `analytics-daily` dimension: the key expression and the filter,
 * over `analytics_events` aliased `e`. The rollup (cms/jobs/tasks/
 * rollupAnalytics.ts) and the live "today" read (analyticsQueries.ts) both
 * use these, so a rolled-up day and a live day can never be counted two
 * different ways.
 */
export const DIMENSION_SQL: Record<Dimension, { key: SQL; where: SQL }> = {
  total: { key: sql`'all'`, where: sql`e.kind = 'pv'` },
  page: { key: sql`e.path`, where: sql`e.kind = 'pv'` },
  referrer: { key: sql`coalesce(e.referrer_host, ${DIRECT_REFERRER})`, where: sql`e.kind = 'pv' and e.entry = true` },
  channel: { key: sql`coalesce(e.channel::text, 'direct')`, where: sql`e.kind = 'pv' and e.entry = true` },
  device: { key: sql`coalesce(e.device::text, 'other')`, where: sql`e.kind = 'pv'` },
  browser: { key: sql`coalesce(e.browser, 'Other')`, where: sql`e.kind = 'pv'` },
  country: { key: sql`coalesce(e.country, ${UNKNOWN_COUNTRY})`, where: sql`e.kind = 'pv'` },
  funnel: {
    key: sql`(case
      when e.kind = 'pv' and e.path ~ '^/events/[a-z0-9-]+/book$' then 'book_view'
      when e.kind = 'pv' and e.path ~ '^/events/[a-z0-9-]+$' then 'event_view'
      when e.kind <> 'pv' then e.kind::text
    end)`,
    where: sql`(e.kind <> 'pv' or e.path ~ '^/events/[a-z0-9-]+(/book)?$')`,
  },
};

export const ANALYTICS_DIMENSIONS = Object.keys(DIMENSION_SQL) as Dimension[];
export { CHANNELS };
