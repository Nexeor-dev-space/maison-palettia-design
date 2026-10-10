import type { CollectionConfig } from "payload";

import { isAdminField, isStaff, never, systemOnly } from "@/cms/access/roles";
import { money } from "@/cms/fields";
import { CURRENCY } from "@/cms/lib/money";

import { BOOKINGS_GROUP, sidebarFor, systemDate, systemField } from "./shared";
import { freezeIssuedInvoice } from "./hooks";

/**
 * ==========================================================================
 * invoices — tax invoices and credit notes, numbered without gaps (§D.3, §H.7)
 * ==========================================================================
 *
 * One row per document: an `invoice` when an order is confirmed, a
 * `credit_note` when a refund succeeds. `number` is `MP-INV-2026-000123` /
 * `MP-CN-2026-000045` — the prefixes from Settings → Invoices & VAT, the
 * year in Dubai time, and a sequence that `invoice-counters` hands out
 * atomically so the FTA sees no gaps.
 *
 * EVERYTHING IS A SNAPSHOT. `seller` is copied from `invoice-settings` and
 * `buyer` from the order at issue; `lines[]` and `totals` are the figures
 * printed. Once `issuedAt` is set the document is immutable except for
 * `file`, `generatedAt` and `emailedAt` (3A-1's `beforeChange`): a PDF may
 * be regenerated from the same figures, the figures never change. A
 * mistake is corrected by a credit note, as the tax rules require.
 *
 * The PDF lives in `invoice-files` (private disk, staff-only REST read);
 * customers download through the signed route only (§H.7). The front desk
 * sees everything but the buyer's phone (§J R*).
 */

export const INVOICE_KINDS = [
  { label: "Invoice", value: "invoice" },
  { label: "Credit note", value: "credit_note" },
] as const;

export const Invoices: CollectionConfig = {
  slug: "invoices",
  labels: { singular: "Invoice", plural: "Invoices" },
  admin: {
    group: BOOKINGS_GROUP,
    useAsTitle: "number",
    defaultColumns: ["number", "kind", "order", "totals.grossFils", "issuedAt", "emailedAt"],
    description: "Tax invoices and credit notes, numbered without gaps. Figures never change after issue; regenerate the PDF from the order if needed.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["number", "buyer.name", "buyer.email"],
    components: {
      beforeListTable: [
        { path: "@/cms/components/admin/ListIntro#ListIntro", clientProps: { icon: "page", heading: "No invoices yet", body: "A tax invoice is numbered and issued automatically when an order is confirmed, and a credit note when a refund completes. Numbers never have gaps and figures never change after issue. Set the legal name and TRN under Settings → Invoices & VAT so they print as tax invoices rather than receipts.", actions: [{ label: "Invoice settings", href: "/globals/invoice-settings" }] } },
      ],
    },
  },
  defaultSort: "-issuedAt",
  access: {
    read: isStaff,
    create: systemOnly,
    update: systemOnly,
    delete: never,
  },
  hooks: { beforeChange: [freezeIssuedInvoice] },
  fields: [
    {
      type: "row",
      fields: [
        systemField({ name: "number", type: "text", label: "Number", required: true, unique: true, index: true, maxLength: 30, admin: { width: "40%" } }),
        systemField({ name: "kind", type: "select", label: "Kind", required: true, hasMany: false, defaultValue: "invoice", index: true, options: [...INVOICE_KINDS], admin: { width: "20%" } }),
        systemField({ name: "year", type: "number", label: "Year", required: true, min: 2020, max: 2100, admin: { width: "20%", step: 1 } }),
        systemField({ name: "sequence", type: "number", label: "Sequence", required: true, min: 1, admin: { width: "20%", step: 1 } }),
      ],
    },
    {
      type: "row",
      fields: [
        systemField({ name: "order", type: "relationship", relationTo: "orders", label: "Order", required: true, index: true, admin: { width: "50%" } }),
        systemField({
          name: "refund",
          type: "relationship",
          relationTo: "refunds",
          label: "Refund",
          index: true,
          admin: { width: "50%", condition: (data) => data?.kind === "credit_note", description: "The refund this credit note settles." },
        }),
      ],
    },
    {
      type: "group",
      name: "seller",
      label: "Seller (as printed)",
      admin: { description: "Copied from Settings → Invoices & VAT when the document was issued." },
      fields: [
        systemField({ name: "legalName", type: "text", label: "Legal name", maxLength: 80 }),
        {
          type: "row",
          fields: [
            systemField({ name: "trn", type: "text", label: "TRN", maxLength: 15, admin: { width: "34%", description: "Blank: the document is a Receipt, not a Tax Invoice." } }),
            systemField({ name: "tradeLicenceNumber", type: "text", label: "Trade licence", maxLength: 40, admin: { width: "33%" } }),
            systemField({ name: "vatRateBps", type: "number", label: "VAT rate (bps)", min: 0, max: 10_000, admin: { width: "33%", step: 1 } }),
          ],
        },
        systemField({
          name: "addressLines",
          type: "array",
          label: "Address",
          maxRows: 6,
          fields: [{ name: "line", type: "text", label: "Line", required: true, maxLength: 80 }],
        }),
        {
          type: "row",
          fields: [
            systemField({ name: "email", type: "email", label: "Email", admin: { width: "50%" } }),
            systemField({ name: "phone", type: "text", label: "Phone", maxLength: 32, admin: { width: "50%" } }),
          ],
        },
      ],
    },
    {
      type: "group",
      name: "buyer",
      label: "Buyer (as printed)",
      fields: [
        {
          type: "row",
          fields: [
            systemField({ name: "name", type: "text", label: "Name", maxLength: 120, admin: { width: "40%" } }),
            systemField({ name: "email", type: "email", label: "Email", admin: { width: "30%" } }),
            systemField({ name: "phone", type: "text", label: "Phone", maxLength: 32, access: { read: isAdminField }, admin: { width: "30%" } }),
          ],
        },
      ],
    },
    systemField({
      name: "lines",
      type: "array",
      label: "Lines",
      labels: { singular: "Line", plural: "Lines" },
      fields: [
        { name: "description", type: "text", label: "Description", required: true, maxLength: 200 },
        {
          type: "row",
          fields: [
            { name: "qty", type: "number", label: "Qty", required: true, min: 0, admin: { width: "20%", step: 1 } },
            money("unitNetFils", { label: "Unit (net)", required: true, admin: { width: "20%" } }),
            money("netFils", { label: "Net", required: true, admin: { width: "20%" } }),
            money("vatFils", { label: "VAT", required: true, admin: { width: "20%" } }),
            money("grossFils", { label: "Gross", required: true, admin: { width: "20%" } }),
          ],
        },
      ],
    }),
    {
      type: "group",
      name: "totals",
      label: "Totals",
      fields: [
        {
          type: "row",
          fields: [
            systemField(money("netFils", { label: "Net", required: true, admin: { width: "25%" } })),
            systemField(money("vatFils", { label: "VAT", required: true, admin: { width: "25%" } })),
            systemField(money("grossFils", { label: "Gross", required: true, admin: { width: "25%", components: { Label: { path: "@/cms/components/fields/PlainLabel#PlainLabel", clientProps: { text: "Total" } } } } })),
            systemField(money("discountFils", { label: "Discounts", defaultValue: 0, admin: { width: "25%" } })),
          ],
        },
      ],
    },
    systemField({ name: "currency", type: "text", label: "Currency", required: true, defaultValue: CURRENCY, maxLength: 3, admin: { hidden: true } }),
    systemField({
      name: "paymentLabel",
      type: "text",
      label: "Paid by",
      maxLength: 120,
      admin: { description: "As printed: “Mamo Pay · card ****1157”, “Paid at venue (cash)”, “Complimentary”." },
    }),
    // ── sidebar ──
    systemDate("issuedAt", "Issued", { sidebar: true, index: true, description: "Figures are frozen from this moment." }),
    systemField({ name: "file", type: "relationship", relationTo: "invoice-files", label: "PDF", admin: { position: "sidebar" } }),
    systemDate("generatedAt", "PDF generated", { sidebar: true }),
    systemDate("emailedAt", "Emailed to customer", { sidebar: true }),
  ],
};
