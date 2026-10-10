import type { CollectionConfig } from "payload";

import { isAdmin, never, roleOf } from "@/cms/access/roles";

import { ANALYTICS_GROUP, CHANNELS, DEVICES, EVENT_KINDS } from "./shared";

/**
 * ==========================================================================
 * analytics-events — one row per page view, raw and short-lived (SPEC §D.6)
 * ==========================================================================
 *
 * Written by the cookieless beacon (`POST /api/site/analytics/collect`,
 * cms/lib/analytics.ts) in small batches, rolled up into `analytics-daily`
 * every hour by `rollup-analytics`, and deleted after
 * `analytics-settings.rawRetentionDays` by `purge-retention` — but only once
 * the day has a rollup, so a purge can never lose a day's totals.
 *
 * WHAT IS NOT HERE, ON PURPOSE. No IP address, no user agent string, no
 * query string, no full referrer URL, no cookie id. `visitor` is an HMAC of
 * IP + user agent under a key derived from PAYLOAD_SECRET and the Dubai
 * date, so it identifies "the same browser, today" and nothing else: it
 * cannot be reversed, and the same person tomorrow is a different value.
 * `path` is a known route of this site (anything else is `/other`), the
 * referrer is a bare hostname, `browser` is a family name ("Chrome"), and
 * `country` is the two-letter code the proxy already knows, when it says.
 *
 * Admin only and read-only for everyone: rows are the output of a process,
 * never typed in. Hidden from the sidebar entirely for other roles.
 * `timestamps: false` — `ts` is the only time that matters, and two extra
 * timestamp columns on the busiest table in the database buy nothing.
 */
export const AnalyticsEvents: CollectionConfig = {
  slug: "analytics-events",
  labels: { singular: "Page view (raw)", plural: "Page views (raw)" },
  admin: {
    group: ANALYTICS_GROUP,
    useAsTitle: "path",
    defaultColumns: ["ts", "path", "channel", "referrerHost", "device", "browser", "country"],
    description:
      "The last few weeks of individual page views, before they are summarised. No names, no IP addresses, no cookies. For the charts, open Analytics.",
    hidden: ({ user }) => roleOf({ user } as never) !== "admin",
    listSearchableFields: ["path", "referrerHost", "browser", "country"],
    pagination: { defaultLimit: 50 },
  },
  defaultSort: "-ts",
  timestamps: false,
  access: {
    read: isAdmin,
    create: never,
    update: never,
    delete: never,
  },
  fields: [
    { name: "ts", type: "date", label: "When", required: true, index: true, admin: { date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" } } },
    { name: "day", type: "text", label: "Day (Dubai)", required: true, index: true, admin: { description: "YYYY-MM-DD in the studio's timezone." } },
    {
      name: "kind",
      type: "select",
      label: "What happened",
      required: true,
      defaultValue: "pv",
      options: EVENT_KINDS.map((value) => ({
        value,
        label: { pv: "Page view", checkout_started: "Checkout started", payment_redirect: "Sent to payment", order_paid: "Order paid" }[value],
      })),
    },
    { name: "path", type: "text", label: "Page", required: true, index: true },
    { name: "entry", type: "checkbox", label: "First page of a visit", defaultValue: false },
    { name: "referrerHost", type: "text", label: "Referring site", admin: { description: "Only on the first page of a visit, and only the site name — never the full address." } },
    {
      name: "channel",
      type: "select",
      label: "Came from",
      options: CHANNELS.map((value) => ({
        value,
        label: { direct: "Direct", search: "Search engine", social: "Social media", email: "Email", referral: "Another website" }[value],
      })),
    },
    {
      name: "device",
      type: "select",
      label: "Device",
      options: DEVICES.map((value) => ({ value, label: { desktop: "Computer", mobile: "Phone", tablet: "Tablet", other: "Other" }[value] })),
    },
    { name: "browser", type: "text", label: "Browser" },
    { name: "country", type: "text", label: "Country", admin: { description: "Two-letter code, when the server's proxy provides one." } },
    { name: "visitor", type: "text", label: "Visitor (anonymous, today only)", required: true, index: true },
  ],
};
