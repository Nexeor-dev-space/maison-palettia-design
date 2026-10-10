import type { CollectionConfig } from "payload";

import { isAdmin, systemOnly } from "@/cms/access/roles";

import { modeField, sidebarFor, systemDate, systemField, systemJson } from "./shared";

/**
 * ==========================================================================
 * payment-events — the append-only webhook log and idempotency table (§D.3, §H.5)
 * ==========================================================================
 *
 * Every delivery to `/api/site/webhooks/mamo` leaves a row — but how much of
 * a row depends on whether the auth header matched:
 *
 *   · UNVERIFIED (no header matched): a minimal row — `receivedAt`, the
 *     hashed IP, the NAMES of the headers presented, and the first 1 KB of
 *     the body as `bodyExcerpt`. Nothing else, capped at 500 rows a day.
 *     These rows are how the owner discovers that Mamo sends the secret
 *     under a header name we did not expect (TODO(mamo-verify), §H.5 step
 *     1), and how an abuse spike is noticed.
 *   · VERIFIED: the parsed `payload`, and `headers` with every value that
 *     matched a secret — plus `authorization`, `cookie`, `x-auth-header` —
 *     replaced by "[redacted]". A serialised row never contains a secret
 *     (unit test, §K).
 *
 * `dedupeKey` is the idempotency claim (§H.5 step 4): `{paymentId}:
 * {eventType}:{status}:{refund_amount}` for payment events, `{disputeId}:
 * {eventType}` for disputes. The webhook route INSERTs … ON CONFLICT on it;
 * a row that comes back is ours to process, no row means a duplicate.
 * `processingStartedAt` lets a retry re-claim a row whose first attempt died
 * mid-way (after 2 minutes); `processedAt` closes it; `error` says why it is
 * still open. `reconcile-payments` revisits open rows older than 5 minutes.
 *
 * Admin read-only. Rows are created by SQL and finished by the Local API;
 * `purge-retention` deletes unverified rows after 30 days.
 */

export const PaymentEvents: CollectionConfig = {
  slug: "payment-events",
  labels: { singular: "Payment event", plural: "Payment events" },
  admin: {
    // 4B review: internal bookkeeping lives in the admin-only "System" group, last in the sidebar.
    group: "System",
    useAsTitle: "dedupeKey",
    defaultColumns: ["receivedAt", "eventType", "providerPaymentId", "verified", "processedAt", "needsReview"],
    description: "Every webhook delivery from Mamo Pay, verified or not. Read-only; the booking system processes them.",
    hidden: sidebarFor("admin"),
    listSearchableFields: ["providerPaymentId", "providerLinkId", "eventType", "dedupeKey"],
  },
  defaultSort: "-receivedAt",
  access: {
    read: isAdmin,
    create: systemOnly,
    update: systemOnly,
    delete: systemOnly,
  },
  fields: [
    {
      type: "row",
      fields: [
        systemField({ name: "provider", type: "text", label: "Provider", required: true, defaultValue: "mamo", maxLength: 20, admin: { width: "25%" } }),
        systemField({ name: "eventType", type: "text", label: "Event", index: true, maxLength: 60, admin: { width: "35%", description: "payment.succeeded, payment.refunded, dispute.received…" } }),
        systemField({
          name: "verified",
          type: "checkbox",
          label: "Verified",
          required: true,
          defaultValue: false,
          index: true,
          admin: { width: "20%", description: "The delivery carried our webhook secret." },
        }),
        systemField({ name: "needsReview", type: "checkbox", label: "Needs review", defaultValue: false, index: true, admin: { width: "20%" } }),
      ],
    },
    {
      type: "row",
      fields: [
        systemField({ name: "providerPaymentId", type: "text", label: "Payment id", index: true, maxLength: 60, admin: { width: "50%" } }),
        systemField({ name: "providerLinkId", type: "text", label: "Payment link id", index: true, maxLength: 60, admin: { width: "50%" } }),
      ],
    },
    systemField({ name: "order", type: "relationship", relationTo: "orders", label: "Order", index: true, admin: { description: "Resolved from the payment's external_id, custom_data or link id." } }),
    systemField({
      name: "dedupeKey",
      type: "text",
      label: "Deduplication key",
      required: true,
      unique: true,
      index: true,
      maxLength: 200,
      admin: { description: "One row per payment × event × status × refunded amount. A second delivery of the same thing is answered 200 and ignored." },
    }),
    {
      type: "collapsible",
      label: "Delivery",
      admin: { initCollapsed: true },
      fields: [
        systemField({
          name: "headerNames",
          type: "text",
          label: "Header names presented",
          hasMany: true,
          admin: { description: "Names only, always recorded — this is how a different auth header name shows up." },
        }),
        systemJson("headers", "Headers (verified only, secrets redacted)"),
        systemJson("payload", "Payload (verified only)"),
        systemField({
          name: "bodyExcerpt",
          type: "textarea",
          label: "Body excerpt (unverified only)",
          maxLength: 1024,
          admin: { description: "The first kilobyte of an unverified delivery, for diagnosis." },
        }),
        systemField({ name: "ipHash", type: "text", label: "IP (hashed)", maxLength: 64 }),
      ],
    },
    systemField({ name: "error", type: "textarea", label: "Last processing error", maxLength: 2000, admin: { description: "Blank once processed. A row with an error and no “Processed” time will be retried." } }),
    // ── sidebar ──
    modeField("Which set of webhook secrets matched: test or live."),
    systemDate("receivedAt", "Received", { sidebar: true, index: true }),
    systemDate("processingStartedAt", "Processing started", { sidebar: true, description: "A claim older than 2 minutes with no “Processed” time can be re-claimed by a retry." }),
    systemDate("processedAt", "Processed", { sidebar: true, index: true }),
  ],
};
