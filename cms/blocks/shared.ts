import type { ArrayField, CheckboxField, Condition, Field, NumberField, SelectField, TextareaField, TextField, UploadField } from "payload";

import { headingLines, type HeadingLinesOptions } from "@/cms/fields/headingLines";

/**
 * ==========================================================================
 * The vocabulary every block is written in (SPEC §E "one spelling everywhere")
 * ==========================================================================
 *
 * Forty blocks, each a handful of short strings, a picture or two and a
 * button. Written longhand every field is ten lines of config, and the
 * labels, caps and help text drift between blocks the way the site's own
 * copy drifted before the CMS. These factories fix the shape once:
 *
 *   · `eyebrow()`, `lead()`, `standfirst()` — the three recurring slots,
 *     with the caps from SPEC §E (eyebrow ≤24) and the inventory;
 *   · `text()`, `prose()`, `picture()`, `pick()` — the plain field types with
 *     a label and one line of help, nothing else to remember;
 *   · `when*()` — the `admin.condition`s a "Use Brand wording" switch needs:
 *     override fields hidden while the switch is on, the link shown while it
 *     is (cms/fields/brandCopyLink.ts).
 *
 * Field NAMES are the contract with the renderer adapters
 * (components/blocks/*, 2D) and the seed (cms/seed/pages.ts, 2B), so the
 * ones that recur are spelled here and nowhere else: `eyebrow`,
 * `headingLines`, `lead`, `standfirst`, `primaryCta`, `secondaryCta`.
 * Decorative choices stay in the renderers; a block offers a `tone`/`ground`
 * select only where the component already has variants.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Plain fields with a label and help                                         */
/* ────────────────────────────────────────────────────────────────────────── */

type Common = {
  description?: string;
  required?: boolean;
  condition?: Condition;
  /** Starting wording where the block has one canonical instance on the site. */
  defaultValue?: string;
  width?: string;
};

const adminOf = (o: Common) => ({
  ...(o.description ? { description: o.description } : {}),
  ...(o.condition ? { condition: o.condition } : {}),
  ...(o.width ? { width: o.width } : {}),
});

/** A single line of copy. `max` is the cap for the slot it is printed in. */
export function text(name: string, label: string, max: number, o: Common = {}): TextField {
  return {
    name,
    type: "text",
    label,
    maxLength: max,
    ...(o.required ? { required: true } : {}),
    ...(o.defaultValue !== undefined ? { defaultValue: o.defaultValue } : {}),
    admin: adminOf(o),
  };
}

/** A paragraph or two. */
export function prose(name: string, label: string, max: number, o: Common = {}): TextareaField {
  return {
    name,
    type: "textarea",
    label,
    maxLength: max,
    ...(o.required ? { required: true } : {}),
    ...(o.defaultValue !== undefined ? { defaultValue: o.defaultValue } : {}),
    admin: adminOf(o),
  };
}

/** A yes/no switch. */
export function flag(name: string, label: string, defaultValue: boolean, o: Omit<Common, "defaultValue"> = {}): CheckboxField {
  return { name, type: "checkbox", label, defaultValue, admin: adminOf(o) };
}

/** A whole number within bounds. */
export function count(
  name: string,
  label: string,
  o: Omit<Common, "defaultValue"> & { min?: number; max?: number; defaultValue?: number } = {},
): NumberField {
  const { min, max, defaultValue, ...rest } = o;
  return {
    name,
    type: "number",
    label,
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(rest.required ? { required: true } : {}),
    admin: { step: 1, ...adminOf(rest) },
  };
}

/** A dropdown of human-labelled choices; the value is what the renderer switches on. */
export function pick(name: string, label: string, options: Array<{ label: string; value: string }>, o: Common = {}): SelectField {
  return {
    name,
    type: "select",
    label,
    options,
    hasMany: false,
    ...(o.required ? { required: true } : {}),
    ...(o.defaultValue !== undefined ? { defaultValue: o.defaultValue } : {}),
    admin: adminOf(o),
  };
}

/** One image from Media. Alt text, focal point and provenance travel with the file. */
export function picture(name: string, label: string, o: Omit<Common, "defaultValue"> = {}): UploadField {
  return {
    name,
    type: "upload",
    relationTo: "media",
    label,
    filterOptions: { mimeType: { contains: "image" } },
    ...(o.required ? { required: true } : {}),
    admin: adminOf(o),
  };
}

/** Several images from Media, in the order they are picked. */
export function pictures(name: string, label: string, o: Omit<Common, "defaultValue"> & { maxRows?: number } = {}): UploadField {
  const { maxRows, ...rest } = o;
  return {
    name,
    type: "upload",
    relationTo: "media",
    hasMany: true,
    ...(maxRows !== undefined ? { maxRows } : {}),
    label,
    filterOptions: { mimeType: { contains: "image" } },
    ...(rest.required ? { required: true } : {}),
    admin: adminOf(rest),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The recurring slots                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * The small capitals line above a heading. ≤24 characters (SPEC §E) unless a
 * block passes `max` — the few eyebrows the site already prints longer (the
 * home carousel's, the private-events intro's) get a cap that fits them.
 */
export const eyebrow = ({ max = 24, ...o }: Common & { max?: number } = {}): TextField =>
  text("eyebrow", "Eyebrow", max, { description: `The small line above the heading. Up to ${max} characters.`, ...o });

/** The paragraph under a heading. */
export const lead = (max = 320, o: Common = {}): TextareaField =>
  prose("lead", "Lead paragraph", max, { description: "One or two sentences under the heading.", ...o });

/** A standfirst — a lead printed at display size, so shorter. Labelled for editors as the intro sentence. */
export const standfirst = (max = 240, o: Common = {}): TextareaField =>
  prose("standfirst", "Intro sentence", max, { description: "One sentence, printed large under the heading.", ...o });

/** `headingLines[] { text }` — the display heading, one row per line (cms/fields/headingLines.ts). */
export function heading(o: HeadingLinesOptions & { condition?: Condition } = {}): ArrayField {
  const { condition, ...rest } = o;
  const field = headingLines(rest);
  return condition ? { ...field, admin: { ...field.admin, condition } } : field;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* "Use Brand wording" conditions                                             */
/* ────────────────────────────────────────────────────────────────────────── */

type Sibling = Record<string, unknown> | undefined;

/** Shown while the named switch is OFF — the block's own override fields. */
export const whenOff =
  (switchName: string): Condition =>
  (_, siblingData) =>
    !(siblingData as Sibling)?.[switchName];

/** Shown while the named switch is ON — the brandCopyLink() pointer. */
export const whenOn =
  (switchName: string): Condition =>
  (_, siblingData) =>
    (siblingData as Sibling)?.[switchName] === true;

/** Shown while a sibling select holds `value`. */
export const whenIs =
  (selectName: string, value: string): Condition =>
  (_, siblingData) =>
    (siblingData as Sibling)?.[selectName] === value;

/** The "Use Brand wording" switch itself, labelled for the sentence it borrows. */
export const brandCopySwitch = (name: string, what: string, defaultValue = true): CheckboxField =>
  flag(name, `Use Brand wording for ${what}`, defaultValue, {
    description: `On: ${what} comes from Settings → Brand wording and changes everywhere it is printed. Off: write this section's own.`,
  });

/** Pads a row of fields to equal widths. */
export const row = (fields: Field[]): Field => ({ type: "row", fields });
