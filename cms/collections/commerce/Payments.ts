import type { CollectionConfig } from "payload";

import { isAdminField, isStaff, never, systemOnly } from "@/cms/access/roles";
import { money } from "@/cms/fields";
import { CURRENCY } from "@/cms/lib/money";

import { BOOKINGS_GROUP, modeField, sidebarFor, systemDate, systemField, systemJson } from "./shared";

/**
 * ==========================================================================
 * payments — one row per payment attempt (SPEC §D.3, §H.2)
 * ==========================================================================
 *
 * An order can be paid for more than once (a declined card, then a retry),
 * so attempts are rows of their own and `orders.payment` points at the
 * current one. Online rows are Mamo Pay links (`provider: "mamo"`): created
 * `link_ready`, then whatever the verified payment object says. Desk rows
 * (`provider: "desk"`) are created directly as `captured` with the method
 * the staff member chose.
 *
 * The states (§H.2): created → link_ready → captured → refund_pending →
 * refunded | partially_refunded; link_ready → failed | expired | voided;
 * Mamo's `processing` / `confirmation_required` both map to `processing`.
 *
 * 🔐 FIELDS. `providerLinkUrl`, `raw` and the settlement figures are
 * admin-only to read: the link URL would let anyone pay for someone else's
 * basket, the raw object carries the cardholder's name, and settlement is
 * the studio's margin. The front desk sees the status, the amount, the
 * card type and last four digits, and when it was captured (§J R*).
 *
 * Nobody edits a payment: the webhook, the poller and the return page write
 * through `applyPaymentSnapshot`.
 */

export const PAYMENT_PROVIDERS = [
  { label: "Mamo Pay", value: "mamo" },
  { label: "Desk", value: "desk" },
] as const;

export const PAYMENT_STATUSES = [
  { label: "Created", value: "created" },
  { label: "Link ready — awaiting the customer", value: "link_ready" },
  { label: "Processing — Mamo is still confirming", value: "processing" },
  { label: "Captured — paid", value: "captured" },
  { label: "Refund pending", value: "refund_pending" },
  { label: "Partially refunded", value: "partially_refunded" },
  { label: "Refunded", value: "refunded" },
  { label: "Failed", value: "failed" },
  { label: "Expired — link deactivated", value: "expired" },
  { label: "Voided", value: "voided" },
] as const;

export const PAYMENT_METHOD_TYPES = [
  { label: "Card", value: "card" },
  { label: "Apple Pay / Google Pay", value: "wallet" },
  { label: "Cash", value: "cash" },
  { label: "Card terminal", value: "card_terminal" },
  { label: "Complimentary", value: "complimentary" },
  { label: "Bank transfer", value: "bank_transfer" },
] as const;

export const Payments: CollectionConfig = {
  slug: "payments",
  labels: { singular: "Payment", plural: "Payments" },
  admin: {
    group: BOOKINGS_GROUP,
    useAsTitle: "id",
    defaultColumns: ["order", "provider", "status", "amountFils", "method.type", "capturedAt"],
    description: "Every payment attempt, online and at the desk. Written by the payment system; read-only here.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["providerPaymentId", "providerLinkId"],
  },
  defaultSort: "-createdAt",
  access: {
    read: isStaff,
    create: systemOnly,
    update: systemOnly,
    delete: never,
  },
  fields: [
    systemField({ name: "order", type: "relationship", relationTo: "orders", label: "Order", required: true, index: true }),
    {
      type: "row",
      fields: [
        systemField({
          name: "provider",
          type: "select",
          label: "Provider",
          required: true,
          hasMany: false,
          defaultValue: "mamo",
          options: [...PAYMENT_PROVIDERS],
          access: { read: isAdminField },
          admin: { width: "50%" },
        }),
        systemField({
          name: "status",
          type: "select",
          label: "Status",
          required: true,
          hasMany: false,
          defaultValue: "created",
          index: true,
          options: [...PAYMENT_STATUSES],
          admin: {
            width: "50%",
            components: { Cell: { path: "@/cms/components/admin/StatusCell#StatusCell", clientProps: { labels: Object.fromEntries(PAYMENT_STATUSES.map((o) => [o.value, o.label])), tones: { captured: "ok", processing: "lilac", link_ready: "lilac", created: "muted", refund_pending: "warn", partially_refunded: "warn", refunded: "muted", failed: "bad", expired: "muted", voided: "bad" } } } },
          },
        }),
      ],
    },
    {
      type: "row",
      fields: [
        systemField(money("amountFils", { label: "Amount", required: true, admin: { width: "50%" } })),
        systemField({
          name: "currency",
          type: "text",
          label: "Currency",
          required: true,
          defaultValue: CURRENCY,
          maxLength: 3,
          access: { read: isAdminField },
          admin: { width: "50%" },
        }),
      ],
    },
    {
      type: "group",
      name: "method",
      label: "Payment method",
      fields: [
        {
          type: "row",
          fields: [
            systemField({ name: "type", type: "select", label: "Type", hasMany: false, options: [...PAYMENT_METHOD_TYPES], admin: { width: "34%", components: { Label: { path: "@/cms/components/fields/PlainLabel#PlainLabel", clientProps: { text: "Paid with" } } } } }),
            systemField({ name: "cardLast4", type: "text", label: "Card ends in", maxLength: 4, admin: { width: "33%" } }),
            systemField({
              name: "cardOrigin",
              type: "text",
              label: "Card origin",
              maxLength: 40,
              access: { read: isAdminField },
              admin: { width: "33%", description: "As Mamo reports it, e.g. “International card”." },
            }),
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Mamo Pay references",
      admin: { initCollapsed: true, condition: (data) => data?.provider !== "desk" },
      fields: [
        {
          type: "row",
          fields: [
            systemField({
              name: "providerLinkId",
              type: "text",
              label: "Payment link id",
              index: true,
              maxLength: 60,
              access: { read: isAdminField },
              admin: { width: "50%" },
            }),
            systemField({
              name: "providerPaymentId",
              type: "text",
              label: "Payment id",
              unique: true,
              index: true,
              maxLength: 60,
              access: { read: isAdminField },
              admin: { width: "50%", description: "Mamo's MPB-CHRG-… id. Quote it to Mamo support." },
            }),
          ],
        },
        systemField({
          name: "providerLinkUrl",
          type: "text",
          label: "Payment link URL",
          maxLength: 500,
          access: { read: isAdminField },
          admin: { description: "Admin only: anyone with this URL can pay for the basket." },
        }),
        {
          type: "row",
          fields: [
            systemField({ name: "failureCode", type: "text", label: "Failure code", maxLength: 60, access: { read: isAdminField }, admin: { width: "40%" } }),
            systemField({ name: "failureMessage", type: "text", label: "Failure message", maxLength: 300, access: { read: isAdminField }, admin: { width: "60%" } }),
          ],
        },
        systemJson("raw", "Last payment object from Mamo", { read: isAdminField, description: "Admin only. The verified object the last snapshot was taken from." }),
      ],
    },
    {
      type: "collapsible",
      label: "Settlement (admin only)",
      admin: { initCollapsed: true, condition: (data) => data?.provider !== "desk" },
      fields: [
        {
          type: "group",
          name: "settlement",
          label: "Settlement",
          access: { read: isAdminField },
          admin: { description: "What Mamo pays out for this payment, as reported — text, exactly as Mamo formats it." },
          fields: [
            {
              type: "row",
              fields: [
                systemField({ name: "amount", type: "text", label: "Settled amount", maxLength: 40, admin: { width: "25%" } }),
                systemField({ name: "fee", type: "text", label: "Fee", maxLength: 40, admin: { width: "25%" } }),
                systemField({ name: "vat", type: "text", label: "VAT on fee", maxLength: 40, admin: { width: "25%" } }),
                systemField({ name: "currency", type: "text", label: "Currency", maxLength: 3, admin: { width: "25%" } }),
              ],
            },
            systemField({ name: "date", type: "text", label: "Settlement date", maxLength: 20, admin: { description: "YYYY-MM-DD as Mamo sends it." } }),
          ],
        },
      ],
    },
    // ── sidebar ──
    modeField(),
    systemDate("capturedAt", "Captured", { sidebar: true, index: true }),
    systemDate("failedAt", "Failed", { sidebar: true }),
    systemDate("webhookSeenAt", "Webhook received", { sidebar: true, read: isAdminField }),
    systemDate("verifiedAt", "Verified with Mamo", { sidebar: true, read: isAdminField, description: "When the payment object was last fetched from Mamo's API." }),
    systemDate("linkDeactivatedAt", "Link deactivated", { sidebar: true, read: isAdminField }),
  ],
};
