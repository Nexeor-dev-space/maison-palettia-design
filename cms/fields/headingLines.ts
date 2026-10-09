import type { ArrayField } from "payload";

/**
 * ==========================================================================
 * headingLines() — a display heading, one row per line
 * ==========================================================================
 *
 * The site's big headings are set in the brand script face and broken by
 * hand (`DisplayHeading lines={["This page has", "wandered off."]}`), because
 * where the line breaks is a design decision, not a browser's. The field
 * mirrors that: an array of short `text` rows, with a cap on rows and on
 * characters per row so an editor cannot type a line the face cannot fit.
 *
 * Defaults follow SPEC §E: two lines of 18 characters. The home hero takes
 * three lines of 16 (`headingLines({ maxRows: 3, maxChars: 16 })`), the
 * private-events intro three. `{ text }` is the one spelling every block,
 * renderer adapter and seed file must use.
 */

export type HeadingLinesOptions = {
  name?: string;
  label?: string;
  maxRows?: number;
  maxChars?: number;
  required?: boolean;
  description?: string;
};

export function headingLines(opts: HeadingLinesOptions = {}): ArrayField {
  const { name = "headingLines", label = "Heading", maxRows = 2, maxChars = 18, required = true, description } = opts;
  return {
    name,
    type: "array",
    label,
    required,
    minRows: required ? 1 : 0,
    maxRows,
    labels: { singular: "Line", plural: "Lines" },
    admin: {
      description: description ?? `One row per line of the heading — up to ${maxRows} lines of ${maxChars} characters each.`,
      initCollapsed: false,
    },
    fields: [
      {
        name: "text",
        type: "text",
        label: "Line",
        required: true,
        maxLength: maxChars,
      },
    ],
  };
}

/** Flattens the stored rows back to the `string[]` the renderers take. */
export function headingLinesToStrings(rows: Array<{ text?: string | null }> | null | undefined): string[] {
  return (rows ?? []).map((row) => row.text?.trim() ?? "").filter(Boolean);
}
