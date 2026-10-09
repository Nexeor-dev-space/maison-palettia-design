/**
 * `analytics-settings` — "Analytics & tracking" (SPEC §C.3 row 11). Admin only.
 *
 * Two different things, kept apart on purpose:
 *
 *   - THE FIRST-PARTY PANEL. A cookieless beacon (§D.6) that never leaves
 *     the owner's server and feeds `/admin/analytics`. It needs no consent
 *     (no cookie, no cross-site identifier, visitor hash rotates daily) and
 *     so runs whenever `enabled` is on — minus the paths listed in
 *     `excludePaths`, which are seeded with the checkout and account routes
 *     because a payment flow is nobody's business to chart.
 *
 *   - OPTIONAL THIRD-PARTY TAGS. GA4, Plausible, Umami or a Meta Pixel. These
 *     ids are public (they are in every page's HTML by design), not secrets,
 *     so they are plain text fields — but each is validated to its own shape
 *     and rendered into scripts through `JSON.stringify`, never string
 *     concatenation, so a pasted id can only ever be an id. They load only
 *     after the visitor accepts the consent banner while `consent.required`
 *     is on (UAE PDPL). `umamiScriptUrl` is pinned to Umami's hosts or the
 *     site's own, because a script URL is the one field here that *could*
 *     load arbitrary code.
 *
 * Every `external.*` field is `isAdminField` as §J requires; the global is
 * admin-only anyway, the field lock is the belt to that brace.
 */

import type { GlobalBeforeValidateHook, GlobalConfig } from "payload";

import { isAdmin, isAdminField } from "@/cms/access/roles";
import { link } from "@/cms/fields/link";
import { TAGS } from "@/lib/cms/cache";

import { choice, copy, count, matches, panel, pathList, prose, section, toggle } from "./copyFields";
import { readGlobal, settingsAfterChange, settingsError, type SiteSettingsLike } from "./settingsHooks";

export const ANALYTICS_SETTINGS_SLUG = "analytics-settings" as const;

const UMAMI_HOSTS = new Set(["analytics.umami.is", "cloud.umami.is"]);

interface ExternalLike {
  provider?: "none" | "ga4" | "plausible" | "umami";
  measurementId?: string | null;
  plausibleDomain?: string | null;
  umamiScriptUrl?: string | null;
  umamiWebsiteId?: string | null;
}

/**
 * A provider is only "set up" when its id is present, and the Umami script
 * must come from a known host. Field-level validators cover the id shapes;
 * this hook covers the cross-field "required for this provider" rule and the
 * one check that needs another global (the site's own host).
 */
const requireProviderIds: GlobalBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const external: ExternalLike = { ...originalDoc?.external, ...data?.external };
  const refuse = (path: string, message: string) => settingsError(req, ANALYTICS_SETTINGS_SLUG, path, message);

  switch (external.provider) {
    case "ga4":
      if (!external.measurementId) throw refuse("external.measurementId", "Enter the GA4 measurement ID (G-XXXXXXXX).");
      break;
    case "plausible":
      if (!external.plausibleDomain) throw refuse("external.plausibleDomain", "Enter the domain as registered in Plausible.");
      break;
    case "umami": {
      if (!external.umamiWebsiteId) throw refuse("external.umamiWebsiteId", "Enter the Umami website ID.");
      if (!external.umamiScriptUrl) throw refuse("external.umamiScriptUrl", "Enter the Umami script URL.");
      let host = "";
      try {
        host = new URL(external.umamiScriptUrl).host;
      } catch {
        throw refuse("external.umamiScriptUrl", "Enter a full https:// URL.");
      }
      const site = await readGlobal<SiteSettingsLike>(req, "site-settings");
      let ownHost = "";
      try {
        ownHost = site.publicUrl ? new URL(site.publicUrl).host : "";
      } catch {
        ownHost = "";
      }
      if (!UMAMI_HOSTS.has(host) && host !== ownHost) {
        throw refuse(
          "external.umamiScriptUrl",
          "The script must be served from analytics.umami.is, cloud.umami.is or this site's own address.",
        );
      }
      break;
    }
    default:
      break;
  }
  return data;
};

export const AnalyticsSettings: GlobalConfig = {
  slug: ANALYTICS_SETTINGS_SLUG,
  label: "Analytics & tracking",
  admin: {
    group: "Settings (admin)",
    description: "First-party panel, optional GA4/Plausible/Umami/Meta, cookie consent.",
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeValidate: [requireProviderIds],
    afterChange: [
      settingsAfterChange({
        slug: ANALYTICS_SETTINGS_SLUG,
        revalidateTag: TAGS.analytics,
        watch: [{ path: "enabled" }, { path: "external.provider" }, { path: "consent.required" }],
      }),
    ],
  },
  fields: [
    // A panel, not a named group: `enabled`, `respectDoNotTrack`,
    // `rawRetentionDays` and `excludePaths` are top-level in §C.3 and the
    // beacon/collector (§D.6) read them there.
    panel("First-party panel", [
      {
        type: "row",
        fields: [
          toggle("enabled", "Collect page views for the admin panel", {
            description: "Cookieless and on this server only. Powers Analytics in the admin.",
            defaultValue: true,
            admin: { width: "50%" },
          }),
          toggle("respectDoNotTrack", "Honour Do-Not-Track", {
            description: "Skip visitors whose browser sends DNT.",
            defaultValue: true,
            admin: { width: "50%" },
          }),
        ],
      },
      count("rawRetentionDays", "Keep raw page views for (days)", {
        description: "Daily totals are kept forever; raw rows are purged after this many days.",
        min: 7,
        max: 730,
        defaultValue: 90,
      }),
      pathList("excludePaths", "Paths never recorded", {
        description: "Checkout and account pages stay out of every chart. Query strings and #fragments are never sent anyway.",
        maxRows: 30,
        defaultValue: ["/checkout", "/payment-success", "/my-bookings", "/booking-status", "/dev"],
      }),
    ]),
    {
      ...section(
        "external",
        "Third-party analytics",
        [
          choice(
            "provider",
            "Provider",
            [
              { label: "None", value: "none" },
              { label: "Google Analytics 4", value: "ga4" },
              { label: "Plausible", value: "plausible" },
              { label: "Umami", value: "umami" },
            ],
            { defaultValue: "none" },
          ),
          copy("measurementId", "GA4 measurement ID", {
            description: "Looks like G-XXXXXXXXXX.",
            max: 20,
            validate: matches(/^G-[A-Z0-9]{4,16}$/, "A GA4 measurement ID looks like G-XXXXXXXXXX."),
            admin: { condition: (data) => data?.external?.provider === "ga4" },
          }),
          copy("plausibleDomain", "Plausible domain", {
            description: "The site as registered in Plausible, e.g. maisonpalettia.com.",
            max: 100,
            validate: matches(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Enter a bare hostname, e.g. maisonpalettia.com."),
            admin: { condition: (data) => data?.external?.provider === "plausible" },
          }),
          copy("umamiScriptUrl", "Umami script URL", {
            description: "https://… on analytics.umami.is, cloud.umami.is or this site's own address.",
            max: 300,
            validate: matches(/^https:\/\/[^\s]+$/i, "Enter a full https:// URL."),
            admin: { condition: (data) => data?.external?.provider === "umami" },
          }),
          copy("umamiWebsiteId", "Umami website ID", {
            max: 36,
            validate: matches(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
              "An Umami website ID is a UUID.",
            ),
            admin: { condition: (data) => data?.external?.provider === "umami" },
          }),
          copy("metaPixelId", "Meta Pixel ID", {
            description: "Digits only. Leave empty for no pixel. Loads only after consent, like the provider above.",
            max: 20,
            validate: matches(/^\d{5,20}$/, "A Meta Pixel ID is 5 to 20 digits."),
          }),
        ],
        { description: "Public ids, not secrets. Scripts load only after the visitor accepts the consent banner." },
      ),
      access: { read: isAdminField, update: isAdminField },
    },
    section(
      "consent",
      "Cookie consent",
      [
        toggle("required", "Ask before loading third-party scripts", {
          description: "Required under UAE data protection rules. The first-party panel never needs consent.",
          defaultValue: true,
        }),
        prose("bannerText", "Banner text", {
          max: 300,
          defaultValue:
            "We use analytics cookies to understand how the site is used. Nothing is loaded until you accept.",
        }),
        {
          type: "row",
          fields: [
            copy("acceptLabel", "Accept button", { max: 20, defaultValue: "Accept", admin: { width: "50%" } }),
            copy("declineLabel", "Decline button", { max: 20, defaultValue: "Decline", admin: { width: "50%" } }),
          ],
        },
        link({ name: "policyLink", label: "Privacy policy link" }),
      ],
      { description: "Shown once; the choice is remembered in the visitor's browser." },
    ),
    section("dashboard", "Admin panel", [
      choice(
        "defaultRange",
        "Default period",
        [
          { label: "Last 7 days", value: "7" },
          { label: "Last 30 days", value: "30" },
          { label: "Last 90 days", value: "90" },
        ],
        { defaultValue: "30" },
      ),
    ]),
  ],
};
