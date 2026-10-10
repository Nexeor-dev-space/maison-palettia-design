import type { CollectionConfig, FieldHook, NumberFieldSingleValidation } from "payload";

import { isAdmin, isStaff } from "@/cms/access/roles";
import { money } from "@/cms/fields";

import { BOOKINGS_GROUP, sidebarFor, systemField } from "./shared";

/**
 * ==========================================================================
 * promo-codes — a discount the customer types at checkout (SPEC §D.3, §H.3)
 * ==========================================================================
 *
 * The one commerce collection admins create by hand. A code is a percentage
 * or a fixed AED amount, limited to everything, chosen experiences or chosen
 * sessions, inside a date window, with an optional cap on uses and a
 * minimum spend. At most one promo code applies per order.
 *
 * `uses` IS NOT A FIELD YOU EDIT. The checkout reserves a use with an
 * atomic `UPDATE promo_codes SET uses = uses + 1 WHERE … uses < max_uses`
 * inside its transaction, and `expire-holds` gives it back when an order
 * dies — so two customers racing for the last use of a code cannot both get
 * it, and an abandoned basket does not burn a use.
 *
 * `code` is uppercased and trimmed as it is saved (field hook) so
 * "summer10" and "SUMMER10 " are the same code; uniqueness is on the stored
 * form. The front desk may read codes (to tell a caller whether one is
 * valid), admins manage them.
 */

export const PROMO_TYPES = [
  { label: "Percentage off", value: "percent" },
  { label: "Fixed amount off (AED)", value: "fixed" },
] as const;

export const PROMO_APPLIES_TO = [
  { label: "Everything", value: "all" },
  { label: "Chosen experiences", value: "experiences" },
  { label: "Chosen sessions", value: "sessions" },
] as const;

/** Uppercase + trim before validation, so uniqueness and lookups see one spelling. */
const normaliseCode: FieldHook = ({ value }) =>
  typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : value;

/** `value` means percent (1–100) or fils (≥ 1) depending on `type`. */
const validateValue: NumberFieldSingleValidation = (value, { siblingData, required }) => {
  if (value === undefined || value === null) return required ? "Enter a value." : true;
  if (typeof value !== "number" || !Number.isInteger(value)) return "Whole numbers only.";
  const type = (siblingData as { type?: string } | undefined)?.type;
  if (type === "percent") return value >= 1 && value <= 100 ? true : "A percentage between 1 and 100.";
  return value >= 1 ? true : "An amount in fils (AED 25 = 2500).";
};

export const PromoCodes: CollectionConfig = {
  slug: "promo-codes",
  labels: { singular: "Promo code", plural: "Promo codes" },
  admin: {
    group: BOOKINGS_GROUP,
    useAsTitle: "code",
    defaultColumns: ["code", "label", "type", "value", "uses", "maxUses", "active", "endsAt"],
    description: "Discount codes customers enter at checkout. One code per order; uses are counted as orders are placed.",
    hidden: sidebarFor("admin", "front-desk"),
    listSearchableFields: ["code", "label"],
    components: {
      beforeListTable: [
        { path: "@/cms/components/admin/ListIntro#ListIntro", clientProps: { icon: "star", heading: "No promo codes yet", body: "A code gives a percentage or a fixed amount off at checkout — for everything, for certain experiences or only certain dates, with an optional start, end, minimum spend and use limit. One code per order.", actions: [{ label: "Create a promo code", href: "/collections/promo-codes/create", primary: true }] } },
      ],
    },
  },
  defaultSort: "-createdAt",
  access: {
    read: isStaff,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "code",
          type: "text",
          label: "Code",
          required: true,
          unique: true,
          index: true,
          minLength: 3,
          maxLength: 40,
          hooks: { beforeValidate: [normaliseCode] },
          admin: { width: "40%", description: "Letters and numbers; saved in capitals." },
        },
        { name: "label", type: "text", label: "Label", required: true, maxLength: 80, admin: { width: "60%", description: "For the team and the analytics view, e.g. “Summer newsletter 10 %”." } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "type", type: "select", label: "Discount type", required: true, hasMany: false, defaultValue: "percent", options: [...PROMO_TYPES], admin: { width: "50%" } },
        {
          name: "value",
          type: "number",
          label: "Value",
          required: true,
          min: 1,
          validate: validateValue,
          admin: {
            width: "50%",
            step: 1,
            description: "Percentage: 1–100. Fixed amount: in fils, so AED 25 is 2500.",
          },
        },
      ],
    },
    {
      type: "group",
      label: "Where it applies",
      fields: [
        { name: "appliesTo", type: "select", label: "Applies to", required: true, hasMany: false, defaultValue: "all", options: [...PROMO_APPLIES_TO] },
        {
          name: "experiences",
          type: "relationship",
          relationTo: "experiences",
          hasMany: true,
          label: "Experiences",
          admin: { condition: (data) => data?.appliesTo === "experiences", description: "Any session of these experiences." },
        },
        {
          name: "sessions",
          type: "relationship",
          relationTo: "sessions",
          hasMany: true,
          label: "Sessions",
          admin: { condition: (data) => data?.appliesTo === "sessions", description: "Only these dates." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "startsAt", type: "date", label: "Valid from", admin: { width: "50%", date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" }, description: "Blank: immediately." } },
        { name: "endsAt", type: "date", label: "Valid until", index: true, admin: { width: "50%", date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" }, description: "Blank: no end date." } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "maxUses", type: "number", label: "Maximum uses", min: 1, admin: { width: "34%", step: 1, description: "Blank: unlimited." } },
        systemField({
          name: "uses",
          type: "number",
          label: "Uses so far",
          required: true,
          defaultValue: 0,
          min: 0,
          admin: { width: "33%", step: 1, description: "Counted by the checkout; given back when an order expires." },
        }),
        money("minSpendFils", { label: "Minimum spend", description: "In AED. Blank: none.", admin: { width: "33%" } }),
      ],
    },
    { name: "notes", type: "textarea", label: "Notes", maxLength: 1000 },
    // ── sidebar ──
    { name: "active", type: "checkbox", label: "Active", defaultValue: true, index: true, admin: { position: "sidebar", description: "Off: the code is refused at checkout, whatever its dates." } },
  ],
};
