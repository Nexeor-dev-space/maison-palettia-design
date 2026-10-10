import type { CollectionConfig } from "payload";

import { isAdmin, never, roleOf } from "@/cms/access/roles";

import { ANALYTICS_GROUP, DIMENSIONS } from "./shared";

/**
 * ==========================================================================
 * analytics-daily — the summary rows the Analytics view reads (SPEC §D.6)
 * ==========================================================================
 *
 * One row per (Dubai day, dimension, key): "on 2026-10-09, page /events had
 * 412 views from 230 visitors". `rollup-analytics` rebuilds a day's rows
 * from the raw events in one transaction (delete the day, insert its
 * aggregates), so a rerun is harmless and a late beacon is picked up by the
 * next hourly run. Kept forever: a year of a small studio's traffic is a
 * few tens of thousands of rows.
 *
 * `visitors` is distinct visitors THAT DAY. The visitor id rotates daily by
 * design (privacy), so a period's "visitors" is the sum of its days — the
 * same convention as Plausible and every other cookieless counter; it is
 * labelled "daily visitors" in the admin so nobody reads it as people.
 *
 * Dimensions: `total` (key `all`), `page` (path), `referrer` (host or
 * "(direct)", first page of a visit only), `channel` (direct/search/…,
 * first page only), `device`, `browser`, `country`, `funnel`
 * (event_view, book_view, checkout_started, payment_redirect, order_paid).
 */
export const AnalyticsDaily: CollectionConfig = {
  slug: "analytics-daily",
  labels: { singular: "Daily summary", plural: "Daily summaries" },
  admin: {
    group: ANALYTICS_GROUP,
    useAsTitle: "key",
    defaultColumns: ["day", "dimension", "key", "views", "visitors"],
    description: "Page views summarised per day, kept for good. Built automatically every hour; the charts in Analytics read these.",
    hidden: ({ user }) => roleOf({ user } as never) !== "admin",
    listSearchableFields: ["key", "day"],
    pagination: { defaultLimit: 50 },
  },
  defaultSort: "-day",
  timestamps: false,
  access: {
    read: isAdmin,
    create: never,
    update: never,
    delete: never,
  },
  indexes: [{ fields: ["day", "dimension", "key"], unique: true }],
  fields: [
    { name: "day", type: "text", label: "Day (Dubai)", required: true, index: true },
    {
      name: "dimension",
      type: "select",
      label: "Grouped by",
      required: true,
      options: DIMENSIONS.map((value) => ({
        value,
        label: {
          total: "Whole site",
          page: "Page",
          referrer: "Referring site",
          channel: "Where from",
          device: "Device",
          browser: "Browser",
          country: "Country",
          funnel: "Booking funnel",
        }[value],
      })),
    },
    { name: "key", type: "text", label: "Value", required: true },
    { name: "views", type: "number", label: "Views", required: true, defaultValue: 0, min: 0 },
    { name: "visitors", type: "number", label: "Daily visitors", required: true, defaultValue: 0, min: 0 },
  ],
};
