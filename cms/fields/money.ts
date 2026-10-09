import type { JSONField, NumberField, NumberFieldSingleValidation } from "payload";

import { toPrice } from "@/cms/lib/money";

/**
 * ==========================================================================
 * money() — an amount stored as integer fils, edited as AED
 * ==========================================================================
 *
 * Every price in the CMS is an integer number of fils (SPEC §D conventions):
 * `priceFils`, `amountFils`, `discountFils`. Staff do not think in fils, so
 * the admin shows and accepts "240.00" and the field component converts
 * (cms/components/fields/MoneyField.tsx); the list view formats the same way
 * through `MoneyCell`. The database never sees a decimal.
 *
 * The site's components take a `Price { amount, currency }` (types/index.ts).
 * `priceVirtual()` adds a read-only virtual field next to a fils field that
 * renders exactly that shape on read, so mappers can pass `doc.price`
 * straight through without a conversion of their own.
 */

/**
 * The overrides a collection may pass. Listed explicitly rather than as
 * `Partial<NumberField>` because NumberField is a union on `hasMany`, and an
 * amount is always a single value.
 */
export type MoneyOptions = Pick<NumberField, "access" | "localized" | "index" | "unique" | "custom" | "hooks" | "defaultValue" | "max" | "admin"> & {
  label?: string;
  description?: string;
  required?: boolean;
};

const validateFils: NumberFieldSingleValidation = (value, { required }) => {
  if (value === undefined || value === null) return required ? "Enter an amount." : true;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) return "Amounts are stored as whole fils.";
  return true;
};

export function money(name: string, opts: MoneyOptions = {}): NumberField {
  const { label, description, required, admin, ...rest } = opts;
  return {
    name,
    type: "number",
    label: label ?? name,
    required,
    min: 0,
    ...rest,
    validate: validateFils,
    admin: {
      description: description ?? "In AED, e.g. 240.00",
      ...admin,
      components: {
        Field: "@/cms/components/fields/MoneyField#MoneyField",
        Cell: "@/cms/components/fields/MoneyField#MoneyCell",
        ...admin?.components,
      },
    },
  };
}

/**
 * `{ amount, currency: "AED" }` computed from a sibling fils field on every
 * read. Virtual: no column, nothing to migrate, never writable. Hidden in
 * the admin because the money() field already shows the amount in AED.
 */
export function priceVirtual(filsField = "priceFils", name = "price"): JSONField {
  return {
    name,
    type: "json",
    virtual: true,
    admin: { hidden: true },
    access: { create: () => false, update: () => false },
    hooks: {
      afterRead: [
        ({ siblingData }) => {
          const fils = siblingData?.[filsField];
          return typeof fils === "number" && Number.isInteger(fils) ? toPrice(fils) : null;
        },
      ],
    },
  };
}
