import { beforeAll, beforeEach, describe, expect, it } from "vitest";

/**
 * Analytics (4A) unit suite — no database, no config.
 *
 * Covers the privacy rules (SPEC §K: "visitor hash rotates daily, `path`
 * normalisation to known routes"), the collector's refusals end to end with
 * an injected Payload, the public-config filter that stands between the
 * admin's ids and the page's scripts, the period arithmetic the Analytics
 * view relies on, and the CSV cell rules.
 */

beforeAll(() => {
  process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-for-production";
});

const shared = await import("@/cms/collections/analytics/shared");
const analytics = await import("@/cms/lib/analytics");
const queries = await import("@/cms/lib/analyticsQueries");
const exportsLib = await import("@/cms/lib/exports");
const { resetRateLimits } = await import("@/cms/lib/rateLimit");

const ROUTES = {
  events: new Set(["candle-making", "candle-making-2026-10-11-1000"]),
  programmes: new Set(["corporate"]),
  policies: new Set(["privacy"]),
  pages: new Set(["summer-camp"]),
};

describe("normalisePath", () => {
  it("drops query, fragment, case, repeated and trailing slashes", () => {
    expect(shared.normalisePath("/Events/Candle-Making/?utm_source=ig#book")).toBe("/events/candle-making");
    expect(shared.normalisePath("//about//")).toBe("/about");
    expect(shared.normalisePath("/")).toBe("/");
  });
  it("refuses anything that is not a plain site path", () => {
    expect(shared.normalisePath("https://evil.example/")).toBeNull();
    expect(shared.normalisePath("/wp-admin/setup.php")).toBeNull();
    expect(shared.normalisePath("/%E0%A4%A")).toBeNull();
    expect(shared.normalisePath(`/${"a".repeat(200)}`)).toBeNull();
    expect(shared.normalisePath("/a b")).toBeNull();
  });
});

describe("isExcludedPath", () => {
  it("matches a path and everything beneath it, and trailing-* prefixes", () => {
    expect(shared.isExcludedPath("/dev/mamo-mock/pay/1", ["/dev"])).toBe(true);
    expect(shared.isExcludedPath("/developers", ["/dev"])).toBe(false);
    expect(shared.isExcludedPath("/checkout", ["/checkout/"])).toBe(true);
    expect(shared.isExcludedPath("/events/candle-x", ["/events/candle*"])).toBe(true);
    expect(shared.isExcludedPath("/events", ["/events/candle*"])).toBe(false);
  });
});

describe("routeFor", () => {
  it("keeps static routes and published slugs, maps everything else to /other", () => {
    expect(analytics.routeFor("/", ROUTES)).toBe("/");
    expect(analytics.routeFor("/events/candle-making", ROUTES)).toBe("/events/candle-making");
    expect(analytics.routeFor("/events/candle-making/book", ROUTES)).toBe("/events/candle-making/book");
    expect(analytics.routeFor("/events/candle-making/other", ROUTES)).toBe("/other");
    expect(analytics.routeFor("/events/unknown", ROUTES)).toBe("/other");
    expect(analytics.routeFor("/private-events/corporate", ROUTES)).toBe("/private-events/corporate");
    expect(analytics.routeFor("/policies/privacy", ROUTES)).toBe("/policies/privacy");
    expect(analytics.routeFor("/summer-camp", ROUTES)).toBe("/summer-camp");
    expect(analytics.routeFor("/wp-login", ROUTES)).toBe("/other");
  });
});

describe("referrers and channels", () => {
  it("reduces a referrer to a bare host and drops our own", () => {
    expect(analytics.referrerHostOf("https://www.Google.com/search?q=candles", ["maison.test"])).toBe("google.com");
    expect(analytics.referrerHostOf("l.instagram.com", [])).toBe("l.instagram.com");
    expect(analytics.referrerHostOf("https://www.maison.test/events", ["maison.test"])).toBeNull();
    expect(analytics.referrerHostOf("not a host", [])).toBeNull();
    expect(analytics.referrerHostOf("localhost", [])).toBeNull();
    expect(analytics.referrerHostOf("android-app://com.instagram.android", [])).toBe("com.instagram.android");
  });
  it("names the channel in the owner's words", () => {
    expect(analytics.channelOf(null)).toBe("direct");
    expect(analytics.channelOf("google.ae")).toBe("search");
    expect(analytics.channelOf("duckduckgo.com")).toBe("search");
    expect(analytics.channelOf("l.instagram.com")).toBe("social");
    expect(analytics.channelOf("com.instagram.android")).toBe("social");
    expect(analytics.channelOf("t.co")).toBe("social");
    expect(analytics.channelOf("mail.google.com")).toBe("email");
    expect(analytics.channelOf("timeoutdubai.com")).toBe("referral");
  });
});

describe("parseUserAgent", () => {
  it("classes devices and browser families, and spots bots", () => {
    const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
    expect(analytics.parseUserAgent(iphone)).toEqual({ device: "mobile", browser: "Safari", isBot: false });
    expect(analytics.parseUserAgent(mac)).toEqual({ device: "desktop", browser: "Chrome", isBot: false });
    expect(analytics.parseUserAgent("Googlebot/2.1 (+http://www.google.com/bot.html)").isBot).toBe(true);
    expect(analytics.parseUserAgent("Mozilla/5.0 HeadlessChrome/140.0").isBot).toBe(true);
    expect(analytics.parseUserAgent("").isBot).toBe(true);
  });
});

describe("visitorId", () => {
  it("is stable within a day, different across days, and never the raw input", () => {
    const a = analytics.visitorId("203.0.113.9", "UA", "2026-10-09");
    expect(analytics.visitorId("203.0.113.9", "UA", "2026-10-09")).toBe(a);
    expect(analytics.visitorId("203.0.113.9", "UA", "2026-10-10")).not.toBe(a);
    expect(analytics.visitorId("203.0.113.9", "Other UA", "2026-10-09")).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toContain("203");
  });
});

describe("toSiteAnalyticsConfig", () => {
  it("passes only well-formed public ids and always keeps the booking pages excluded", () => {
    const config = analytics.toSiteAnalyticsConfig({
      excludePaths: [{ path: "/private" }],
      external: { provider: "ga4", measurementId: "G-ABC123", metaPixelId: "123'); alert(1);//" },
      consent: { required: true, policyLink: { type: "internal", url: "/policies/privacy" } },
    });
    expect(config.external.provider).toBe("ga4");
    expect(config.external.measurementId).toBe("G-ABC123");
    expect(config.external.metaPixelId).toBeNull();
    expect(config.beacon.excludePaths).toEqual(expect.arrayContaining(["/checkout", "/payment-success", "/my-bookings", "/booking-status", "/dev", "/private"]));
    expect(config.consent.policyHref).toBe("/policies/privacy");
    expect(shared.hasExternalTags(config)).toBe(true);
  });
  it("turns a provider with a missing or malformed id into none", () => {
    const config = analytics.toSiteAnalyticsConfig({ external: { provider: "umami", umamiScriptUrl: "javascript:alert(1)", umamiWebsiteId: "x" } });
    expect(config.external.provider).toBe("none");
    expect(shared.hasExternalTags(config)).toBe(false);
  });
});

/* ─── the collector, end to end with an injected Local API ───────────────── */

type Row = import("@/cms/lib/analytics").EventRow;

function fakePayload(settings: Record<string, unknown> = {}) {
  return {
    findGlobal: async ({ slug }: { slug: string }) => (slug === "analytics-settings" ? settings : { publicUrl: "https://maison.test" }),
    find: async () => ({ docs: [] }),
    logger: { warn: () => undefined, error: () => undefined },
  } as never;
}

const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

function beacon(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://maison.test/api/site/analytics/collect", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "text/plain;charset=UTF-8", "user-agent": CHROME, "x-forwarded-for": "198.51.100.7", host: "maison.test", "sec-fetch-site": "same-origin", ...headers },
  });
}

describe("handleCollect", () => {
  let written: Row[];
  const deps = (settings?: Record<string, unknown>) => ({
    getPayload: async () => fakePayload(settings),
    routes: async () => ROUTES,
    write: (_: unknown, row: Row) => {
      written.push(row);
    },
    now: () => new Date("2026-10-09T10:00:00Z"),
  });

  beforeEach(() => {
    written = [];
    resetRateLimits();
  });

  it("records a landing with its referrer, channel and a daily visitor hash — and nothing identifying", async () => {
    const res = await analytics.handleCollect(beacon({ p: "/events/candle-making?ref=x", r: "l.instagram.com", e: true }, { "cf-ipcountry": "ae" }), deps());
    expect(res.status).toBe(204);
    expect(written).toHaveLength(1);
    const row = written[0];
    expect(row).toMatchObject({ kind: "pv", path: "/events/candle-making", entry: true, referrerHost: "l.instagram.com", channel: "social", device: "desktop", browser: "Chrome", country: "AE", day: "2026-10-09" });
    expect(JSON.stringify(row)).not.toContain("198.51.100.7");
    expect(JSON.stringify(row)).not.toContain("Macintosh");
  });

  it("treats in-site navigation and our own referrer as not a visit", async () => {
    await analytics.handleCollect(beacon({ p: "/about", e: false, r: "google.com" }), deps());
    await analytics.handleCollect(beacon({ p: "/about", e: true, r: "maison.test" }), deps());
    expect(written.map((r) => [r.entry, r.referrerHost, r.channel])).toEqual([
      [false, null, null],
      [false, null, null],
    ]);
  });

  it("maps unknown pages to /other", async () => {
    await analytics.handleCollect(beacon({ p: "/no-such-page", e: true }), deps());
    expect(written[0].path).toBe("/other");
  });

  it("refuses cross-site posts, oversized and malformed bodies", async () => {
    expect((await analytics.handleCollect(beacon({ p: "/" }, { "sec-fetch-site": "cross-site" }), deps())).status).toBe(403);
    expect((await analytics.handleCollect(beacon(JSON.stringify({ p: "/", r: "x".repeat(2000) })), deps())).status).toBe(413);
    expect((await analytics.handleCollect(beacon("{not json"), deps())).status).toBe(400);
    expect((await analytics.handleCollect(beacon({ path: "/" }), deps())).status).toBe(400);
    expect(written).toHaveLength(0);
  });

  it("drops bots, Do-Not-Track, excluded paths and a disabled panel silently", async () => {
    await analytics.handleCollect(beacon({ p: "/" }, { "user-agent": "Googlebot/2.1" }), deps());
    await analytics.handleCollect(beacon({ p: "/" }, { dnt: "1" }), deps());
    await analytics.handleCollect(beacon({ p: "/checkout" }), deps());
    await analytics.handleCollect(beacon({ p: "/my-bookings" }), deps());
    expect(written).toHaveLength(0);
    // A fresh process would re-read settings; the collector caches them for a minute, so the off-switch is tested through the config filter instead.
    expect(analytics.toSiteAnalyticsConfig({ enabled: false }).beacon.enabled).toBe(false);
  });

  it("rate-limits at 120 a minute per connection", async () => {
    let last = 0;
    for (let i = 0; i < 121; i += 1) last = (await analytics.handleCollect(beacon({ p: "/" }), deps())).status;
    expect(last).toBe(429);
    expect(written).toHaveLength(120);
  });
});

/* ─── periods ──────────────────────────────────────────────────────────── */

describe("resolveRange", () => {
  const now = new Date("2026-10-09T21:30:00Z"); // 01:30 on the 10th in Dubai

  it("counts presets back from today in Dubai, with the equal previous period", () => {
    const r = queries.resolveRange({ range: "7" }, { now });
    expect(r).toMatchObject({ from: "2026-10-04", to: "2026-10-10", days: 7, preset: "7", label: "Last 7 days" });
    expect(r.previous).toEqual({ from: "2026-09-27", to: "2026-10-03" });
  });

  it("orders, clamps and labels a custom range; falls back on junk", () => {
    const r = queries.resolveRange({ from: "2026-10-31", to: "2026-09-01" }, { now });
    expect(r).toMatchObject({ from: "2026-09-01", to: "2026-10-10", preset: "custom" });
    expect(r.label).toMatch(/^1 Sept? – 10 Oct 2026$/);
    expect(queries.resolveRange({ from: "2026-02-30", to: "x" }, { now, fallback: "90" }).days).toBe(90);
    expect(queries.resolveRange({ from: "2024-01-01", to: "2026-10-10" }, { now }).days).toBe(queries.MAX_RANGE_DAYS);
  });

  it("walks every day of a range", () => {
    expect(queries.eachDay({ from: "2026-02-27", to: "2026-03-02" })).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
  });
});

/* ─── CSV ──────────────────────────────────────────────────────────────── */

describe("CSV helpers", () => {
  it("neutralises formulas and quotes what needs quoting", () => {
    expect(exportsLib.csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(exportsLib.csvCell("-x")).toBe("'-x");
    expect(exportsLib.csvCell("+971501234567")).toBe("'+971501234567");
    expect(exportsLib.csvCell("-1+cmd|' /C calc'!A0")).toBe("'-1+cmd|' /C calc'!A0");
    expect(exportsLib.csvCell("a,b")).toBe('"a,b"');
    expect(exportsLib.csvCell(null)).toBe("");
  });
  it("keeps a credit note's negative money a number a spreadsheet can sum", () => {
    // A credit-note row: every money cell is negative and must not gain a ' prefix.
    const line = exportsLib.csvLine(["MP-CN-2026-000001", "Credit note", exportsLib.aed(-3810), exportsLib.aed(-190), exportsLib.aed(-4000), "-5"]);
    expect(line).toBe("MP-CN-2026-000001,Credit note,-38.10,-1.90,-40.00,-5\r\n");
    expect(exportsLib.csvCell(-2500)).toBe("-2500");
  });
  it("renders fils as plain AED and times in Dubai", () => {
    expect(exportsLib.aed(124050)).toBe("1240.50");
    expect(exportsLib.aed("5")).toBe("0.05");
    expect(exportsLib.aed(-2500)).toBe("-25.00");
    expect(exportsLib.aed(null)).toBe("");
    expect(exportsLib.dubaiDateTime("2026-10-09T20:15:00Z")).toBe("2026-10-10 00:15");
  });
  it("names files after the kind and the dates", () => {
    expect(exportsLib.exportFilename("invoices", { from: "2026-09-01", to: "2026-09-30" })).toBe("maison-palettia-invoices-2026-09-01-to-2026-09-30.csv");
    expect(exportsLib.isExportKind("orders")).toBe(true);
    expect(exportsLib.isExportKind("users")).toBe(false);
  });
});
