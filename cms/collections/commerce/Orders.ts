import type { CollectionConfig, Field } from "payload";

import { isAdminField, isStaff, never, systemOnly } from "@/cms/access/roles";
import { money } from "@/cms/fields";
import type { Channel, DeskMethod, OrderStatus } from "@/cms/lib/contracts";
import { CURRENCY, DEFAULT_VAT_RATE_BPS } from "@/cms/lib/money";

import { BOOKINGS_GROUP, lockExcept, modeField, sidebarFor, systemDate, systemField, systemJson } from "./shared";
import { guardOrderStatus, mintOrderReference, refreshCustomerStats, syncContactChange } from "./hooks";

/**
 * ==========================================================================
 * orders — one booking, from basket to completed (SPEC §D.3, §H.1, §H.3)
 * ==========================================================================
 *
 * The centre of the Bookings group. An order is created by `startCheckout`
 * (online, or `channel: "desk"` from the Create booking dialog), holds its
 * seats while the customer pays, and walks the §H.1 state machine:
 *
 *   pending_payment → awaiting_payment → confirming → confirmed → completed
 *   with side exits to failed, expired, cancelled and refunded.
 *
 * ONLY `transition()` CHANGES `status`. The select below refuses human
 * writes at field level, and 3A-1's `beforeChange` refuses any write that
 * lacks `context.orderTransition`, so neither the admin form nor REST can
 * skip a state. Every edge appends a `timeline` row and stamps the matching
 * `*At` date — the timeline is the order's history, read bottom-up.
 *
 * SNAPSHOTS, NOT LOOKUPS. `contact`, `lines[]` (title, start time, venue
 * name, price) and `totals` are copied at purchase: what the customer saw
 * and paid is what the invoice and the ticket print, even if the session is
 * renamed or re-priced later. `customer`, `session`, `pass`, `payment` and
 * `invoice` stay as relationships for navigation.
 *
 * WHO MAY EDIT WHAT (§J): nobody creates an order by hand, nobody deletes
 * one (Cancel with refund is the action). Admins may correct `internalNotes`
 * and every `contact.*` field; the front desk `internalNotes`,
 * `contact.email` and `contact.phone`. 3A-1's `afterChange` appends
 * "Contact changed by …" to the timeline and syncs the customer row.
 * Everything else is written by the system, through the Local API.
 */

export const ORDER_STATUSES = [
  { label: "Pending payment — basket created, no link yet", value: "pending_payment" },
  { label: "Awaiting payment — on Mamo Pay", value: "awaiting_payment" },
  { label: "Confirming — paid, tickets and invoice being issued", value: "confirming" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed — the sessions have taken place", value: "completed" },
  { label: "Failed — payment declined, may retry", value: "failed" },
  { label: "Expired — hold ran out without payment", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded in full", value: "refunded" },
] as const satisfies ReadonlyArray<{ label: string; value: OrderStatus }>;

export const CHANNELS = [
  { label: "Online — the website checkout", value: "online" },
  { label: "Desk — taken by staff", value: "desk" },
] as const satisfies ReadonlyArray<{ label: string; value: Channel }>;

export const DESK_METHODS = [
  { label: "Cash", value: "cash" },
  { label: "Card terminal", value: "card_terminal" },
  { label: "Complimentary", value: "complimentary" },
  { label: "Bank transfer", value: "bank_transfer" },
] as const satisfies ReadonlyArray<{ label: string; value: DeskMethod }>;

export const REVIEW_REASONS = [
  { label: "Amount paid differs from the order total", value: "amount_mismatch" },
  { label: "Payment received for no known order", value: "no_order" },
  { label: "Payment arrived after the hold expired", value: "post_expiry" },
  { label: "Gateway mode or payment link does not match", value: "mode_or_link_mismatch" },
  { label: "Dispute opened by the cardholder", value: "dispute" },
  { label: "Payment voided after it was captured", value: "voided_after_capture" },
  { label: "Payment reported failed after it was captured", value: "failed_after_capture" },
  { label: "Paid twice through one payment link", value: "double_capture" },
  { label: "Paid for a session that had been cancelled", value: "paid_cancelled_session" },
  { label: "A refund we recorded was reported failed by Mamo Pay", value: "refund_failed" },
  { label: "A refund at Mamo Pay matches no refund in the admin", value: "unknown_refund" },
] as const;

export const LINE_KINDS = [
  { label: "Session seats", value: "session" },
  { label: "Pass", value: "pass" },
] as const;

/** `lines[]` — what was bought, as the customer saw it. */
const lines: Field = {
  name: "lines",
  type: "array",
  label: "What was booked",
  labels: { singular: "Line", plural: "Lines" },
  admin: {
    description: "What was bought, priced from the database at checkout. Titles and times are copies from that moment.",
    // 4B review: a compact read-only table instead of every snapshot column as a disabled input.
    components: { Field: "@/cms/components/orders/OrderLines#OrderLines" },
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "kind", type: "select", label: "Kind", required: true, hasMany: false, options: [...LINE_KINDS], admin: { width: "20%" } },
        {
          name: "session",
          type: "relationship",
          relationTo: "sessions",
          label: "Session",
          admin: { width: "40%", condition: (_, siblingData) => siblingData?.kind === "session" },
        },
        {
          name: "pass",
          type: "relationship",
          relationTo: "passes",
          label: "Pass",
          admin: { width: "40%", condition: (_, siblingData) => siblingData?.kind === "pass" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "title", type: "text", label: "Title", required: true, maxLength: 120, admin: { width: "60%" } },
        { name: "category", type: "text", label: "Category", maxLength: 60, admin: { width: "40%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "startsAt", type: "date", label: "Starts", admin: { width: "34%", date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" } } },
        { name: "durationMinutes", type: "number", label: "Duration (min)", min: 0, admin: { width: "33%", step: 15 } },
        { name: "venueName", type: "text", label: "Venue", maxLength: 80, admin: { width: "33%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "qty", type: "number", label: "Qty", required: true, min: 1, admin: { width: "25%", step: 1 } },
        money("unitFils", { label: "Unit price", required: true, admin: { width: "25%" } }),
        money("lineFils", { label: "Line total", required: true, admin: { width: "25%" } }),
        {
          name: "passCredits",
          type: "number",
          label: "Paid with pass credits",
          defaultValue: 0,
          min: 0,
          admin: { width: "25%", step: 1, description: "Seats on this line covered by a pass rather than money." },
        },
      ],
    },
  ],
};

/** `totals` — the VAT split the invoice prints. All fils; `vatRateBps` is 500 for 5 %. */
const totals: Field = {
  type: "group",
  name: "totals",
  label: "Totals",
  admin: { description: "Prices include VAT. Net and VAT are split per line and summed, so the invoice adds up." },
  fields: [
    {
      type: "row",
      fields: [
        money("subtotalFils", { label: "Subtotal", required: true, admin: { width: "33%" } }),
        money("discountFils", { label: "Discounts", required: true, defaultValue: 0, admin: { width: "33%" } }),
        // PlainLabel: the list column reads "Total charged", not "Totals > Total charged".
        money("grossFils", { label: "Total charged", required: true, admin: { width: "33%", components: { Label: { path: "@/cms/components/fields/PlainLabel#PlainLabel" } } } }),
      ],
    },
    {
      type: "row",
      fields: [
        money("netFils", { label: "Net of VAT", required: true, admin: { width: "33%" } }),
        money("vatFils", { label: "VAT", required: true, admin: { width: "33%" } }),
        { name: "vatRateBps", type: "number", label: "VAT rate (basis points)", required: true, defaultValue: DEFAULT_VAT_RATE_BPS, min: 0, max: 10_000, admin: { width: "33%", step: 1 } },
      ],
    },
    { name: "currency", type: "text", label: "Currency", required: true, defaultValue: CURRENCY, maxLength: 3, admin: { hidden: true } },
  ],
};

const fields: Field[] = [
  systemField({
    name: "reference",
    type: "text",
    label: "Reference",
    required: true,
    unique: true,
    index: true,
    maxLength: 9,
    admin: { description: "MP- and six characters. Minted when the order is created; printed on tickets and invoices." },
  }),
  systemField({
    name: "status",
    type: "select",
    label: "Status",
    required: true,
    hasMany: false,
    index: true,
    defaultValue: "pending_payment",
    options: [...ORDER_STATUSES],
    admin: {
      description: "Changed only by the booking system and the order actions, never by hand.",
      components: { Cell: { path: "@/cms/components/admin/StatusCell#StatusCell", clientProps: { labels: Object.fromEntries(ORDER_STATUSES.map((o) => [o.value, o.label])), tones: { confirmed: "ok", completed: "ok", confirming: "lilac", awaiting_payment: "lilac", pending_payment: "lilac", failed: "warn", expired: "warn", cancelled: "muted", refunded: "muted" } } } },
    },
  }),
  {
    type: "row",
    fields: [
      systemField({
        name: "channel",
        type: "select",
        label: "Channel",
        required: true,
        hasMany: false,
        index: true,
        defaultValue: "online",
        options: [...CHANNELS],
        admin: {
          width: "50%",
          components: { Cell: { path: "@/cms/components/admin/StatusCell#StatusCell", clientProps: { labels: { online: "Online", desk: "Desk" }, tones: { online: "lilac", desk: "muted" } } } },
        },
      }),
    ],
  },
  systemField({
    name: "customer",
    type: "relationship",
    relationTo: "customers",
    label: "Customer",
    index: true,
  }),
  {
    type: "group",
    name: "contact",
    label: "Contact details (as booked)",
    admin: { description: "A copy of what the customer typed. Correcting the email or phone here is logged in the timeline and updates the customer record." },
    fields: [
      {
        type: "row",
        fields: [
          { name: "firstName", type: "text", label: "First name", required: true, maxLength: 60, admin: { width: "50%" } },
          { name: "lastName", type: "text", label: "Last name", required: true, maxLength: 60, admin: { width: "50%" } },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "email", type: "email", label: "Email", admin: { width: "50%", description: "Blank only on a desk booking without an email.", components: { Label: { path: "@/cms/components/fields/PlainLabel#PlainLabel" } } } },
          { name: "phone", type: "text", label: "Phone", maxLength: 32, admin: { width: "50%" } },
        ],
      },
      { name: "marketingOptIn", type: "checkbox", label: "Agreed to marketing emails", defaultValue: false },
    ],
  },
  { name: "notes", type: "textarea", label: "Customer's note", maxLength: 1000, admin: { readOnly: true, description: "Typed by the customer at the booking step." } },
  lines,
  {
    name: "codes",
    type: "array",
    label: "Codes entered",
    labels: { singular: "Code", plural: "Codes" },
    admin: { description: "Promo and pass codes the customer typed, and what each one did." },
    fields: [
      {
        type: "row",
        fields: [
          { name: "code", type: "text", label: "Code", required: true, maxLength: 40, admin: { width: "30%" } },
          {
            name: "kind",
            type: "select",
            label: "Kind",
            hasMany: false,
            options: [
              { label: "Promo code", value: "promo" },
              { label: "Pass", value: "pass" },
            ],
            admin: { width: "20%" },
          },
          { name: "purchase", type: "relationship", relationTo: "pass-purchases", label: "Pass purchase", admin: { width: "50%" } },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "seatsCovered", type: "number", label: "Seats covered", min: 0, admin: { width: "50%", step: 1 } },
          money("discountFils", { label: "Discount", admin: { width: "50%" } }),
        ],
      },
    ],
  },
  {
    type: "group",
    name: "promo",
    label: "Promo code applied",
    admin: { description: "At most one promo code per order.", condition: (data) => Boolean(data?.promo?.code || data?.promo?.promoCode) },
    fields: [
      {
        type: "row",
        fields: [
          { name: "promoCode", type: "relationship", relationTo: "promo-codes", label: "Promo code", admin: { width: "40%" } },
          { name: "code", type: "text", label: "Code", maxLength: 40, admin: { width: "30%" } },
          money("discountFils", { label: "Discount", admin: { width: "30%" } }),
        ],
      },
    ],
  },
  {
    name: "passRedemptions",
    type: "array",
    label: "Pass credits used",
    labels: { singular: "Redemption", plural: "Redemptions" },
    admin: { description: "Credits taken from each pass at checkout; restored if the order expires or fails." },
    fields: [
      {
        type: "row",
        fields: [
          { name: "passPurchase", type: "relationship", relationTo: "pass-purchases", label: "Pass purchase", required: true, admin: { width: "70%" } },
          { name: "n", type: "number", label: "Credits", required: true, min: 1, admin: { width: "30%", step: 1 } },
        ],
      },
    ],
  },
  totals,
  {
    type: "group",
    name: "deskPayment",
    label: "Desk payment",
    admin: {
      condition: (data) => data?.channel === "desk",
      description: "How the money was taken at the venue. Online orders have a Mamo Pay payment instead.",
    },
    fields: [
      {
        type: "row",
        fields: [
          { name: "method", type: "select", label: "Method", hasMany: false, options: [...DESK_METHODS], admin: { width: "50%" } },
          money("amountFils", { label: "Amount taken", admin: { width: "50%" } }),
        ],
      },
      {
        type: "row",
        fields: [
          { name: "note", type: "text", label: "Note", maxLength: 200, admin: { width: "60%" } },
          { name: "takenBy", type: "relationship", relationTo: "users", label: "Taken by", admin: { width: "40%" } },
        ],
      },
    ],
  },
  { name: "invoice", type: "relationship", relationTo: "invoices", label: "Invoice", admin: { readOnly: true } },
  {
    name: "tickets",
    type: "join",
    collection: "tickets",
    on: "order",
    label: "Tickets",
    admin: { allowCreate: false, defaultColumns: ["code", "holderName", "seatNo", "status", "checkedInAt"] },
  },
  {
    name: "paymentAttempts",
    type: "join",
    collection: "payments",
    on: "order",
    label: "Payment attempts",
    admin: { allowCreate: false, defaultColumns: ["provider", "status", "amountFils", "capturedAt"] },
  },
  {
    name: "refunds",
    type: "join",
    collection: "refunds",
    on: "order",
    label: "Refunds",
    admin: { allowCreate: false, defaultColumns: ["amountFils", "reason", "status", "createdAt"] },
  },
  {
    name: "timeline",
    type: "array",
    label: "History",
    labels: { singular: "Entry", plural: "Entries" },
    admin: {
      readOnly: true,
      description: "Every state change and staff action, oldest first. Written by the system.",
      // SPEC §I "timeline rendered as a list": plain dated sentences, not array rows with a JSON editor.
      components: { Field: "@/cms/components/orders/OrderTimeline#OrderTimeline" },
    },
    fields: [
      {
        type: "row",
        fields: [
          { name: "at", type: "date", label: "When", required: true, admin: { width: "30%", date: { displayFormat: "d MMM yyyy, HH:mm" } } },
          { name: "event", type: "text", label: "Event", required: true, maxLength: 60, admin: { width: "35%" } },
          { name: "by", type: "text", label: "By", maxLength: 120, admin: { width: "35%", description: "A staff member, or “system”." } },
        ],
      },
      { name: "detail", type: "json", label: "Detail" },
    ],
  },
  {
    name: "internalNotes",
    type: "textarea",
    label: "Internal notes",
    maxLength: 4000,
    admin: { description: "For staff. “Collect AED 40 at the venue”, “Spoke to customer about the move”. Never shown to the customer." },
  },
  /*
   * TECHNICAL DETAILS (4B review). The ids and bookkeeping the booking
   * system keeps for itself — basket, current payment attempt, seat hold,
   * where the booking came from, policy versions — collapsed at the bottom
   * and shown to admins only, so the front desk's page is the booking, not
   * the plumbing. A collapsible is presentation only: no column moves.
   */
  {
    type: "collapsible",
    label: "Technical details",
    admin: {
      initCollapsed: true,
      description: "Ids and bookkeeping the booking system keeps. Nothing here needs editing.",
      condition: (_data, _sibling, { user }) => (user as { role?: string } | null | undefined)?.role === "admin",
    },
    fields: [
      {
        type: "row",
        fields: [
          systemField({
            name: "basketId",
            type: "text",
            label: "Basket",
            index: true,
            admin: { width: "50%", description: "The browser's basket id. A double-submit of the same basket reuses this order instead of holding seats twice." },
          }),
          { name: "payment", type: "relationship", relationTo: "payments", label: "Current payment attempt", admin: { width: "50%", readOnly: true } },
        ],
      },
      {
        type: "group",
        name: "hold",
        label: "Seat hold",
        admin: { description: "Seats are held while the customer pays and released when this runs out." },
        fields: [
          systemDate("expiresAt", "Hold expires", { index: true }),
          {
            ...systemJson("seatsBySession", "Seats held per session"),
            admin: { readOnly: true, components: { Field: { path: "@/cms/components/orders/KeyValueField#KeyValueField", clientProps: { empty: "No seats held." } } } },
          },
        ],
      },
      {
        type: "group",
        name: "source",
        label: "Where the booking came from",
        fields: [
          systemField({ name: "ipHash", type: "text", label: "IP (hashed)", maxLength: 64 }),
          systemField({ name: "userAgent", type: "text", label: "Browser", maxLength: 300 }),
          systemField({ name: "referrer", type: "text", label: "Referrer", maxLength: 300 }),
        ],
      },
      {
        ...systemJson("consentedPolicyVersions", "Policies accepted at checkout", {
          description: "Which wording of each policy the customer agreed to.",
        }),
        admin: {
          readOnly: true,
          description: "Which wording of each policy the customer agreed to.",
          components: { Field: { path: "@/cms/components/orders/KeyValueField#KeyValueField", clientProps: { empty: "None recorded (desk bookings skip the checkbox).", valuePrefix: "version" } } },
        },
      },
    ],
  },
  // ── sidebar ──
  modeField(),
  systemDate("confirmedAt", "Confirmed", { sidebar: true, index: true }),
  systemDate("cancelledAt", "Cancelled", { sidebar: true }),
  systemDate("expiredAt", "Expired", { sidebar: true }),
  systemDate("remindersSentAt", "Reminders sent", { sidebar: true }),
  systemField({
    name: "needsReview",
    type: "checkbox",
    label: "Needs review",
    defaultValue: false,
    index: true,
    admin: { position: "sidebar", description: "Something did not add up. The reason is below; “Mark resolved” on the order clears it." },
  }),
  systemField({
    name: "reviewReason",
    type: "select",
    label: "Review reason",
    hasMany: false,
    options: [...REVIEW_REASONS],
    admin: { position: "sidebar", condition: (data) => data?.needsReview === true },
  }),
  systemField({
    name: "disputed",
    type: "checkbox",
    label: "Disputed",
    defaultValue: false,
    index: true,
    admin: { position: "sidebar", description: "The cardholder opened a dispute with their bank. Set by Mamo's dispute webhooks." },
  }),
  systemField({
    name: "disputeStatus",
    type: "text",
    label: "Dispute status",
    maxLength: 60,
    admin: { position: "sidebar", condition: (data) => data?.disputed === true, description: "The last dispute event received, e.g. dispute.received, dispute.won." },
  }),
];

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: { singular: "Order", plural: "Orders" },
  admin: {
    group: BOOKINGS_GROUP,
    useAsTitle: "reference",
    defaultColumns: ["reference", "status", "channel", "contact.email", "totals.grossFils", "createdAt"],
    description: "Every booking, online or at the desk. Use the actions on an order to refund, move or cancel; statuses change on their own.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["reference", "contact.email", "contact.lastName", "contact.firstName", "contact.phone"],
    components: {
      // 4B (SPEC §I "Orders UX"): the status chip + Actions menu beside Save
      // (refund, move, cancel, resends, invoice, review) and, above the list,
      // the one-click views, "Create desk booking" and the teaching empty state.
      edit: { beforeDocumentControls: ["@/cms/components/orders/OrderActions#OrderActions"] },
      beforeListTable: ["@/cms/components/orders/OrdersToolbar#OrdersToolbar"],
    },
  },
  defaultSort: "-createdAt",
  access: {
    read: isStaff,
    create: systemOnly,
    update: isStaff,
    delete: never,
  },
  hooks: {
    beforeValidate: [mintOrderReference],
    beforeChange: [guardOrderStatus],
    afterChange: [syncContactChange, refreshCustomerStats],
  },
  fields: lockExcept(fields, {
    // §J: admin U:internalNotes,contact.* · front-desk U:internalNotes, contact.email, contact.phone
    internalNotes: () => true,
    "contact.email": () => true,
    "contact.phone": () => true,
    "contact.firstName": isAdminField,
    "contact.lastName": isAdminField,
    "contact.marketingOptIn": isAdminField,
  }),
};
