/**
 * `notification-settings` — "Who gets notified" (SPEC §C.3 row 10). Admin only.
 *
 * Which staff email receives which alert. One row per person, each
 * subscribed to any of the staff events in `StaffEvent` (§O); `notifyStaff`
 * (Phase 3C) fans an event out to every row that lists it. Nothing here
 * sends mail by itself — the transport is Email sending — and the dashboard
 * warns when nobody is subscribed to `new_enquiry`, `failed_payment` or
 * `job_failed`, because those are the three an owner regrets missing.
 *
 * The event list below must stay in step with `StaffEvent` in
 * `cms/lib/contracts.ts`; the labels are the plain-language half of it.
 */

import type { GlobalConfig } from "payload";

import { isAdmin } from "@/cms/access/roles";

import { choice, copy, count, panel, rows, toggle } from "./copyFields";
import { settingsAfterChange } from "./settingsHooks";

export const NOTIFICATION_SETTINGS_SLUG = "notification-settings" as const;

/** `StaffEvent` (§O) with the wording an admin picks from. */
export const STAFF_EVENT_OPTIONS = [
  { label: "New order", value: "new_order" },
  { label: "Failed payment", value: "failed_payment" },
  { label: "Refund requested (needs approval)", value: "refund_requested" },
  { label: "Refund processed", value: "refund" },
  { label: "Dispute / chargeback", value: "dispute" },
  { label: "New enquiry", value: "new_enquiry" },
  { label: "Someone joined a waitlist", value: "waitlist_joined" },
  { label: "Background task failed", value: "job_failed" },
  { label: "Few seats left on a session", value: "low_seats" },
  { label: "Settings changed", value: "settings_changed" },
  { label: "Spike of unverified webhooks", value: "webhook_unverified_spike" },
  { label: "Daily digest", value: "daily_digest" },
] as const;

export const NotificationSettings: GlobalConfig = {
  slug: NOTIFICATION_SETTINGS_SLUG,
  label: "Who gets notified",
  admin: {
    group: "Settings (admin)",
    description: "Which staff email receives which alert.",
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    afterChange: [settingsAfterChange({ slug: NOTIFICATION_SETTINGS_SLUG })],
  },
  fields: [
    rows(
      "recipients",
      "Recipients",
      [
        {
          type: "row",
          fields: [
            copy("name", "Name", { max: 60, admin: { width: "40%" } }),
            { name: "email", type: "email", label: "Email", required: true, admin: { width: "60%" } },
          ],
        },
        choice("events", "Alerts", [...STAFF_EVENT_OPTIONS], {
          description: "Everything ticked is emailed to this address.",
          multiple: true,
        }),
      ],
      {
        description:
          "At least one person should receive New order, Failed payment, Refund requested, New enquiry and Background task failed.",
        maxRows: 20,
      },
    ),
    // Panels keep `lowSeatsOverride`, `dailyDigest`, `dailyDigestHour` and
    // `enquiryAutoReply` at the top level, where §C.3 and 3C/3D read them.
    panel("Alert details", [
      count("lowSeatsOverride", "Few-seats alert threshold", {
        description:
          "Leave blank to use the site threshold (Booking & checkout wording → “Few seats left” threshold).",
        min: 1,
        max: 50,
      }),
      toggle("enquiryAutoReply", "Auto-reply to enquiries", {
        description: "Sends the “enquiry received” email to the person who wrote in (Emails → Templates).",
      }),
    ]),
    panel("Daily digest", [
      {
        type: "row",
        fields: [
          toggle("dailyDigest", "Send a daily digest", {
            description: "Yesterday's orders, enquiries and problems in one email to everyone subscribed to Daily digest.",
            admin: { width: "50%" },
          }),
          count("dailyDigestHour", "Send at (hour, Dubai time)", {
            description: "0–23. 8 means 08:00 Gulf Standard Time.",
            min: 0,
            max: 23,
            defaultValue: 8,
            admin: { width: "50%" },
          }),
        ],
      },
    ]),
  ],
};
