import type { CollectionConfig } from "payload";

import { isAdmin, isStaff, never, systemOnly } from "@/cms/access/roles";

import { BOOKINGS_GROUP, sidebarFor, systemDate, systemField } from "./shared";
import { mintPassPurchaseCode } from "./hooks";

/**
 * ==========================================================================
 * pass-purchases — a bought pass: a wallet of session credits (SPEC §D.3)
 * ==========================================================================
 *
 * Created by `finalize-order` when an order with a `pass` line confirms.
 * `code` (`MPP-` + 8) is what the customer types at checkout to pay for
 * seats with credits; `sessionsRemaining` is decremented by the atomic
 * UPDATE in `pricing.quote` (§H.3 — credits are treated exactly like seats,
 * reserved inside the checkout transaction) and restored by `expire-holds`
 * when the order dies, with the redemption marked `restored`.
 *
 * `active → exhausted` when the last credit is spent, `→ expired` after
 * `expiresAt`, `→ void` by an admin (e.g. a refunded pass). Staff read;
 * only admins change anything, and the counters are the system's.
 */

export const PASS_PURCHASE_STATUSES = [
  { label: "Active", value: "active" },
  { label: "Exhausted — all credits used", value: "exhausted" },
  { label: "Expired", value: "expired" },
  { label: "Void", value: "void" },
] as const;

export const PassPurchases: CollectionConfig = {
  slug: "pass-purchases",
  labels: { singular: "Pass purchase", plural: "Pass purchases" },
  admin: {
    group: BOOKINGS_GROUP,
    useAsTitle: "code",
    defaultColumns: ["code", "customer", "pass", "sessionsRemaining", "sessionsTotal", "status", "expiresAt"],
    description: "Passes customers have bought and how many sessions each has left. Credits are spent at checkout by entering the code.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["code"],
    components: {
      beforeListTable: [
        { path: "@/cms/components/admin/ListIntro#ListIntro", clientProps: { icon: "ticket", heading: "No passes bought yet", body: "When a customer buys a pass they get a code; entering it at checkout spends one credit per seat. Each purchase shows how many sessions are left and when it expires.", actions: [{ label: "Edit the passes on sale", href: "/collections/passes" }] } },
      ],
    },
  },
  defaultSort: "-createdAt",
  access: {
    read: isStaff,
    create: systemOnly,
    update: isAdmin,
    delete: never,
  },
  hooks: { beforeValidate: [mintPassPurchaseCode] },
  fields: [
    {
      type: "row",
      fields: [
        systemField({ name: "code", type: "text", label: "Code", required: true, unique: true, index: true, maxLength: 12, admin: { width: "40%" } }),
        {
          name: "status",
          type: "select",
          label: "Status",
          required: true,
          hasMany: false,
          defaultValue: "active",
          index: true,
          options: [...PASS_PURCHASE_STATUSES],
          admin: { width: "60%", description: "Exhausted and Expired are set automatically; Void is yours." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        systemField({ name: "customer", type: "relationship", relationTo: "customers", label: "Customer", required: true, index: true, admin: { width: "34%" } }),
        systemField({ name: "order", type: "relationship", relationTo: "orders", label: "Bought in order", required: true, index: true, admin: { width: "33%" } }),
        systemField({ name: "pass", type: "relationship", relationTo: "passes", label: "Pass", required: true, admin: { width: "33%" } }),
      ],
    },
    {
      type: "row",
      fields: [
        systemField({ name: "sessionsTotal", type: "number", label: "Sessions in the pass", required: true, min: 1, admin: { width: "50%", step: 1 } }),
        systemField({
          name: "sessionsRemaining",
          type: "number",
          label: "Sessions remaining",
          required: true,
          min: 0,
          admin: { width: "50%", step: 1, description: "Reserved at checkout, given back if the order expires." },
        }),
      ],
    },
    systemField({
      name: "redemptions",
      type: "array",
      label: "Redemptions",
      labels: { singular: "Redemption", plural: "Redemptions" },
      admin: { description: "Each checkout that spent credits from this pass." },
      fields: [
        {
          type: "row",
          fields: [
            // Not `order`: inside an array table that name's index (`…_order_idx`) collides with
            // Payload's own row-ordering index, and `migrate:create` refuses the schema.
            { name: "forOrder", type: "relationship", relationTo: "orders", label: "Order", required: true, admin: { width: "40%" } },
            { name: "n", type: "number", label: "Credits", required: true, min: 1, admin: { width: "20%", step: 1 } },
            { name: "at", type: "date", label: "When", required: true, admin: { width: "25%", date: { displayFormat: "d MMM yyyy, HH:mm" } } },
            { name: "restored", type: "checkbox", label: "Restored", defaultValue: false, admin: { width: "15%", description: "The order expired or failed; the credits came back." } },
          ],
        },
      ],
    }),
    {
      name: "expiresAt",
      type: "date",
      label: "Expires",
      index: true,
      admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" }, description: "From the pass's validity at purchase. An admin may extend it." },
    },
    systemDate("exhaustedAt", "Exhausted", { sidebar: true }),
  ],
};
