import type { CollectionConfig } from "payload";

import { isAdmin, isAdminField, isStaff } from "@/cms/access/roles";
import { money } from "@/cms/fields";

import { BOOKINGS_GROUP, lockExcept, sidebarFor, systemDate, systemField, systemJson } from "./shared";
import { guardRefund, prepareRefund, refundSideEffects } from "./hooks";

/**
 * ==========================================================================
 * refunds — a request, an approval, and what Mamo did about it (§D.3, §H.7)
 * ==========================================================================
 *
 * `requested → approved → processing → succeeded | failed`. The front desk
 * may request (the Refund action on an order); only an admin approves, and
 * approval queues `process-refund`, which moves the row to `processing`
 * with `providerRequestAt` before it talks to Mamo. Because Mamo has no
 * idempotency key, that timestamp is the guard: the job first GETs the
 * payment and, finding a refund of the same amount created at or after
 * `providerRequestAt − 2 min`, records it without posting again. A stuck
 * `processing` row is resolved only by `syncRefunds`, never by re-posting.
 *
 * `status` CANNOT BE TYPED. Field access refuses every human write (REST,
 * admin form); the approve / mark-repaid actions and the jobs change it
 * through the Local API. `idempotencyKey` is minted by the Refund action
 * before anything else happens, so a double-click cannot create two rows.
 * Desk-channel refunds carry `providerRefundId: "desk"` and are closed by
 * **Mark repaid** after the money is handed back.
 *
 * Success issues a credit note (`creditNote`), voids the tickets listed in
 * `ticketsVoided`, and gives the seats back when `releaseSeats` is on.
 */

export const REFUND_REASONS = [
  { label: "Customer asked", value: "customer_request" },
  { label: "Session cancelled by the studio", value: "session_cancelled" },
  { label: "Paid after the hold had expired", value: "post_expiry_payment" },
  { label: "Duplicate payment", value: "duplicate" },
  { label: "Goodwill", value: "goodwill" },
  { label: "Other (see note)", value: "other" },
] as const;

export const REFUND_STATUSES = [
  { label: "Requested — awaiting approval", value: "requested" },
  { label: "Approved — queued", value: "approved" },
  { label: "Processing — sent to Mamo", value: "processing" },
  { label: "Succeeded", value: "succeeded" },
  { label: "Failed", value: "failed" },
] as const;

export const Refunds: CollectionConfig = {
  slug: "refunds",
  labels: { singular: "Refund", plural: "Refunds" },
  admin: {
    group: BOOKINGS_GROUP,
    useAsTitle: "id",
    defaultColumns: ["order", "amountFils", "reason", "status", "requestedBy", "createdAt"],
    description: "Refund requests and their outcome. Request from an order; an admin approves; Mamo Pay does the rest.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["providerRefundId", "idempotencyKey"],
    components: {
      beforeListTable: [
        { path: "@/cms/components/admin/ListIntro#ListIntro", clientProps: { icon: "refund", heading: "No refunds yet", body: "Refunds are started from an order (Actions → Refund). The front desk can request one; an admin approves it here or on the order, and Mamo Pay returns the money. Desk bookings are repaid at the studio and marked repaid.", actions: [{ label: "Go to orders", href: "/collections/orders" }] } },
      ],
    },
  },
  defaultSort: "-createdAt",
  access: {
    read: isStaff,
    create: isStaff,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: { beforeValidate: [prepareRefund], beforeChange: [guardRefund], afterChange: [refundSideEffects] },
  fields: lockExcept(
    [
      {
        type: "row",
        fields: [
          { name: "order", type: "relationship", relationTo: "orders", label: "Order", required: true, index: true, admin: { width: "50%" } },
          { name: "payment", type: "relationship", relationTo: "payments", label: "Payment being refunded", index: true, admin: { width: "50%" } },
        ],
      },
      {
        type: "row",
        fields: [
          money("amountFils", { label: "Amount", required: true, description: "In AED. At most what Mamo still allows on this payment; at least AED 1.", admin: { width: "50%" } }),
          { name: "reason", type: "select", label: "Reason", required: true, hasMany: false, options: [...REFUND_REASONS], admin: { width: "50%" } },
        ],
      },
      { name: "note", type: "textarea", label: "Note", maxLength: 1000, admin: { description: "For the team and, if you choose, quoted in the customer's email." } },
      {
        name: "releaseSeats",
        type: "checkbox",
        label: "Give the seats back",
        defaultValue: true,
        admin: { description: "On: the refunded seats become available again. Off: keep them reserved (e.g. a goodwill refund where the customer still attends)." },
      },
      systemField({
        name: "status",
        type: "select",
        label: "Status",
        required: true,
        hasMany: false,
        defaultValue: "requested",
        index: true,
        options: [...REFUND_STATUSES],
        admin: {
          description: "Moves on its own: Approve on the order, then the refund job.",
          components: { Cell: { path: "@/cms/components/admin/StatusCell#StatusCell", clientProps: { labels: Object.fromEntries(REFUND_STATUSES.map((o) => [o.value, o.label])), tones: { requested: "warn", approved: "lilac", processing: "lilac", succeeded: "ok", failed: "bad" } } } },
        },
      }),
      {
        type: "row",
        fields: [
          systemField({ name: "requestedBy", type: "relationship", relationTo: "users", label: "Requested by", admin: { width: "50%" } }),
          systemField({ name: "approvedBy", type: "relationship", relationTo: "users", label: "Approved by", admin: { width: "50%" } }),
        ],
      },
      {
        type: "collapsible",
        label: "Mamo Pay",
        admin: { initCollapsed: true },
        fields: [
          {
            type: "row",
            fields: [
              systemField({
                name: "providerRefundId",
                type: "text",
                label: "Mamo refund id",
                maxLength: 60,
                admin: { width: "50%", description: "“desk” for a refund repaid at the venue." },
              }),
              systemField({
                name: "idempotencyKey",
                type: "text",
                label: "Idempotency key",
                required: true,
                unique: true,
                index: true,
                maxLength: 64,
                admin: { width: "50%", description: "Minted when the request is made; a repeat click reuses this row." },
              }),
            ],
          },
          systemDate("providerRequestAt", "Sent to Mamo", { description: "Set the moment the job moves to Processing, before the request leaves." }),
          systemJson("providerResponse", "Mamo's response", { read: isAdminField, description: "Admin only." }),
        ],
      },
      {
        type: "row",
        fields: [
          systemField({ name: "creditNote", type: "relationship", relationTo: "invoices", label: "Credit note", admin: { width: "50%" } }),
          systemField({ name: "ticketsVoided", type: "relationship", relationTo: "tickets", hasMany: true, label: "Tickets voided", admin: { width: "50%" } }),
        ],
      },
    ],
    {
      // Staff may edit the human parts of a request until it is approved; 3A-1's hooks refuse later edits.
      note: () => true,
      releaseSeats: isAdminField,
      amountFils: isAdminField,
      reason: isAdminField,
    },
  ),
};
