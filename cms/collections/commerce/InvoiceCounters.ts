import type { CollectionConfig } from "payload";

import { isAdmin, never, systemOnly } from "@/cms/access/roles";

import { sidebarFor, systemField } from "./shared";
import { INVOICE_KINDS } from "./Invoices";

/**
 * ==========================================================================
 * invoice-counters — the gapless sequence per kind and year (§D.3, §H.7)
 * ==========================================================================
 *
 * One row per (kind, year), holding the last number handed out. It exists
 * as a collection so that `migrate:create` emits the table and its unique
 * composite index — but it is TOUCHED ONLY BY SQL:
 *
 *   INSERT INTO invoice_counters (…) VALUES (…)
 *   ON CONFLICT (kind, year) DO UPDATE SET last = last + 1 RETURNING last
 *
 * inside the invoice's own transaction (cms/lib/invoiceNumber.ts), which is
 * what makes the numbering gapless under concurrency and rolled back with a
 * failed invoice. `update: never` for everyone, including admins and the
 * Local API, so no code path can hand out a number without the lock.
 *
 * Admin read-only, for the "where are we up to this year" question.
 */
export const InvoiceCounters: CollectionConfig = {
  slug: "invoice-counters",
  labels: { singular: "Invoice counter", plural: "Invoice counters" },
  admin: {
    // 4B review: internal bookkeeping lives in the admin-only "System" group, last in the sidebar.
    group: "System",
    useAsTitle: "id",
    defaultColumns: ["kind", "year", "last", "updatedAt"],
    description: "The last invoice and credit-note number issued each year. Maintained by the numbering SQL; read-only.",
    hidden: sidebarFor("admin"),
    listSearchableFields: [],
  },
  indexes: [{ fields: ["kind", "year"], unique: true }],
  access: {
    read: isAdmin,
    create: systemOnly,
    update: never,
    delete: never,
  },
  fields: [
    {
      type: "row",
      fields: [
        systemField({ name: "kind", type: "select", label: "Kind", required: true, hasMany: false, options: [...INVOICE_KINDS], admin: { width: "34%" } }),
        systemField({ name: "year", type: "number", label: "Year", required: true, min: 2020, max: 2100, admin: { width: "33%", step: 1 } }),
        systemField({ name: "last", type: "number", label: "Last number issued", required: true, defaultValue: 0, min: 0, admin: { width: "33%", step: 1 } }),
      ],
    },
  ],
};
