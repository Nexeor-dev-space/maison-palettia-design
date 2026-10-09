/**
 * Small field factories for the settings globals.
 *
 * NOT A GLOBAL — see the note at the top of `settingsHooks.ts`; do not
 * re-export from `cms/globals/index.ts`.
 *
 * The content globals carry a few hundred short strings (menu labels, button
 * text, status wording). Written longhand each one is ten lines of config
 * for one sentence of meaning, and the label/help/limit/default would drift
 * between them. These factories fix the shape once:
 *
 *   - every copy field has a label editors recognise, a one-line description
 *     when the label alone is ambiguous, and a `maxLength` taken from the
 *     content inventory (docs/cms/research/01-content-inventory.md §3) so a
 *     heading cannot grow past the slot it is printed in;
 *   - defaults carry the site's current wording where the inventory recorded
 *     it, so `onInit`'s "ensure every global exists with defaults" (SPEC §F.0)
 *     yields a site that reads exactly as it does today, before the full seed
 *     (§F.6) runs — and so a cleared field has something sensible to fall
 *     back to;
 *   - `lock: true` adds `access.update: isAdminField` (the 🔒 mark in §C.3).
 *
 * `required` is deliberately rare. The seed creates each global by saving its
 * defaults; a required field with no default would make that first save fail,
 * so "required" here means "required *and* defaulted".
 */

import type {
  ArrayField,
  ArrayFieldValidation,
  CheckboxField,
  CollapsibleField,
  Field,
  GroupField,
  NumberField,
  NumberFieldSingleValidation,
  SelectField,
  TextareaField,
  TextField,
  TextFieldSingleValidation,
} from "payload";

import { isAdminField } from "@/cms/access/roles";

/**
 * Payload types `TextField["validate"]` as a union over `hasMany`, which
 * stops TypeScript inferring the parameters of an inline validator (every
 * `(value) =>` becomes an implicit `any`). The single-value variants are what
 * every field here is, so they are the contextual type throughout.
 */
export type TextValidate = TextFieldSingleValidation;
export type NumberValidate = NumberFieldSingleValidation;
export type RowsValidate = ArrayFieldValidation;

interface CopyOptions {
  /** One line of help under the field. Omit when the label says it all. */
  description?: string;
  /** Character cap; the inventory's per-slot limit. */
  max?: number;
  /** Starting wording — the site's current literal where one exists. */
  defaultValue?: string;
  /** 🔒 — editors see it, only admins may change it. */
  lock?: boolean;
  /** `required` only makes sense together with a default (see file note). */
  required?: boolean;
  /** Extra `admin` props (e.g. `readOnly`, `condition`, `width`). */
  admin?: TextField["admin"];
  validate?: TextValidate;
}

const lockAccess = (lock?: boolean) => (lock ? { access: { update: isAdminField } } : {});

/** A single-line copy string. */
export function copy(name: string, label: string, options: CopyOptions = {}): TextField {
  const { description, max, defaultValue, lock, required, admin, validate } = options;
  return {
    name,
    type: "text",
    label,
    ...(max ? { maxLength: max } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(required ? { required: true } : {}),
    ...(validate ? { validate } : {}),
    ...lockAccess(lock),
    admin: { ...(description ? { description } : {}), ...admin },
  };
}

/** A multi-line copy string (sentences, notes, blurbs). */
export function prose(
  name: string,
  label: string,
  options: Omit<CopyOptions, "admin" | "validate"> & { admin?: TextareaField["admin"] } = {},
): TextareaField {
  const { description, max, defaultValue, lock, required, admin } = options;
  return {
    name,
    type: "textarea",
    label,
    ...(max ? { maxLength: max } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(required ? { required: true } : {}),
    ...lockAccess(lock),
    admin: { ...(description ? { description } : {}), ...admin },
  };
}

/** A yes/no switch. */
export function toggle(
  name: string,
  label: string,
  options: { description?: string; defaultValue?: boolean; lock?: boolean; admin?: CheckboxField["admin"] } = {},
): CheckboxField {
  const { description, defaultValue = false, lock, admin } = options;
  return {
    name,
    type: "checkbox",
    label,
    defaultValue,
    ...lockAccess(lock),
    admin: { ...(description ? { description } : {}), ...admin },
  };
}

/** A bounded whole number. */
export function count(
  name: string,
  label: string,
  options: {
    description?: string;
    min?: number;
    max?: number;
    defaultValue?: number;
    lock?: boolean;
    required?: boolean;
    admin?: NumberField["admin"];
    validate?: NumberValidate;
  } = {},
): NumberField {
  const { description, min, max, defaultValue, lock, required, admin, validate } = options;
  return {
    name,
    type: "number",
    label,
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(required ? { required: true } : {}),
    ...(validate ? { validate } : {}),
    ...lockAccess(lock),
    admin: { step: 1, ...(description ? { description } : {}), ...admin },
  };
}

/** A dropdown with human labels; `multiple: true` makes it a multi-select. */
export function choice(
  name: string,
  label: string,
  options: Array<{ label: string; value: string }>,
  extra: {
    description?: string;
    defaultValue?: string | string[];
    lock?: boolean;
    required?: boolean;
    multiple?: boolean;
    admin?: SelectField["admin"];
  } = {},
): SelectField {
  const { description, defaultValue, lock, required, multiple = false, admin } = extra;
  const base = {
    name,
    type: "select" as const,
    label,
    options,
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(required ? { required: true } : {}),
    ...lockAccess(lock),
    admin: { ...(description ? { description } : {}), ...admin },
  };
  // Spelt out as two literals so each matches its `hasMany` variant of the union.
  return multiple ? { ...base, hasMany: true } : { ...base, hasMany: false };
}

/** A named group: nests its fields under `name` in the data and in the UI. */
export function section(
  name: string,
  label: string,
  fields: Field[],
  options: { description?: string; lock?: boolean; admin?: GroupField["admin"] } = {},
): GroupField {
  const { description, lock, admin } = options;
  return {
    name,
    type: "group",
    label,
    fields,
    ...lockAccess(lock),
    admin: { ...(description ? { description } : {}), ...admin },
  };
}

/**
 * A labelled box that changes nothing about the data shape (an unnamed
 * group). Use it to group fields SPEC §C.3 names at the top level — e.g.
 * `invoice-settings.vatRateBps` — so other agents' reads keep their paths.
 */
export function panel(
  label: string,
  fields: Field[],
  options: { description?: string; admin?: GroupField["admin"] } = {},
): GroupField {
  const { description, admin } = options;
  return { type: "group", label, fields, admin: { ...(description ? { description } : {}), ...admin } };
}

/** A fold-away section that changes nothing about the data shape. */
export function fold(
  label: string,
  fields: Field[],
  options: { description?: string; initCollapsed?: boolean; admin?: CollapsibleField["admin"] } = {},
): CollapsibleField {
  const { description, initCollapsed = false, admin } = options;
  return {
    type: "collapsible",
    label,
    fields,
    admin: { initCollapsed, ...(description ? { description } : {}), ...admin },
  };
}

/** A repeatable list of rows. */
export function rows(
  name: string,
  label: string,
  fields: Field[],
  options: {
    description?: string;
    maxRows?: number;
    minRows?: number;
    lock?: boolean;
    defaultValue?: Array<Record<string, unknown>>;
    admin?: ArrayField["admin"];
    validate?: RowsValidate;
  } = {},
): ArrayField {
  const { description, maxRows, minRows, lock, defaultValue, admin, validate } = options;
  return {
    name,
    type: "array",
    label,
    fields,
    ...(maxRows !== undefined ? { maxRows } : {}),
    ...(minRows !== undefined ? { minRows } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(validate ? { validate } : {}),
    ...lockAccess(lock),
    admin: { ...(description ? { description } : {}), ...admin },
  };
}

/** `array{ path }` rows that must each be a site-relative path. */
export function pathList(
  name: string,
  label: string,
  options: { description?: string; defaultValue?: string[]; lock?: boolean; maxRows?: number } = {},
): ArrayField {
  const { description, defaultValue, lock, maxRows } = options;
  return rows(
    name,
    label,
    [
      copy("path", "Path", {
        description: "Starts with a slash, e.g. /checkout. A trailing * matches everything beneath.",
        max: 160,
        required: true,
        validate: (value) =>
          typeof value === "string" && /^\/[A-Za-z0-9\-_/.*%]*$/.test(value)
            ? true
            : "Enter a site path that starts with /, e.g. /checkout.",
      }),
    ],
    {
      description,
      lock,
      maxRows,
      ...(defaultValue ? { defaultValue: defaultValue.map((path) => ({ path })) } : {}),
    },
  );
}

/** A `validate` for optional text that must match `re` when present. */
export const matches =
  (re: RegExp, message: string): TextValidate =>
  (value) =>
    value === null || value === undefined || value === "" || (typeof value === "string" && re.test(value))
      ? true
      : message;

/** A `validate` for optional text that must be an absolute https URL. */
export const httpsUrl = (message = "Enter a full https:// address."): TextValidate =>
  matches(/^https:\/\/[^\s]+$/i, message);
