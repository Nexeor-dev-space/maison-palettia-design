import type { FieldHook, TextField, TextFieldSingleValidation } from "payload";

/**
 * ==========================================================================
 * slug() — the URL segment of a document, generated once, guarded always
 * ==========================================================================
 *
 * The same shape everywhere: lowercase letters, digits and hyphens, at most
 * 64 characters. That pattern is also what app/(site)/[...slug]/page.tsx
 * tests BEFORE touching the database, so the two must agree — hence it is
 * exported from here and imported there, never retyped.
 *
 * Generation happens in `beforeValidate` (so `required` is satisfied by the
 * time validation runs): an empty slug is filled from the source field
 * (`title` or `name`), a typed slug is normalised. What this field does NOT
 * do is refuse a change on a published document — that needs the document's
 * `_status` and the user's role, and it belongs to the collection hooks
 * (cms/hooks/*, Phase 2A-1), which also create the redirect from the old
 * address (SPEC §D.2 `slugRedirect`). Sessions use their own generator
 * (`{experience}-{yyyy-mm-dd}-{HHmm}`) on top of this field.
 */

export const SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;
export const SLUG_RULE = "Lowercase letters, digits and hyphens only, up to 64 characters.";

/** "Candle Making & Tea!" → "candle-making-tea". Diacritics folded, the rest dropped. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}

/** beforeValidate: normalise what was typed, or derive from `from` when empty. */
export const formatSlug =
  (from: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === "string" && value.trim()) return slugify(value);
    const source = (data as Record<string, unknown> | undefined)?.[from] ?? (originalDoc as Record<string, unknown> | undefined)?.[from];
    if (typeof source === "string" && source.trim()) return slugify(source);
    return value;
  };

/**
 * The overrides a collection may pass. Listed explicitly rather than as
 * `Partial<TextField>` because TextField is a union on `hasMany`, and a slug
 * is always a single value.
 */
export type SlugOptions = Pick<TextField, "access" | "label" | "localized" | "required" | "unique" | "index" | "custom" | "admin"> & {
  hooks?: TextField["hooks"];
  /** The field the slug is generated from when left empty. */
  from?: string;
};

const validateSlug: TextFieldSingleValidation = (value) =>
  typeof value === "string" && SLUG_PATTERN.test(value) ? true : SLUG_RULE;

export function slug(opts: SlugOptions = {}): TextField {
  const { from = "title", admin, hooks, ...rest } = opts;
  return {
    name: "slug",
    type: "text",
    label: "URL slug",
    unique: true,
    index: true,
    required: true,
    ...rest,
    validate: validateSlug,
    hooks: { ...hooks, beforeValidate: [formatSlug(from), ...(hooks?.beforeValidate ?? [])] },
    admin: {
      position: "sidebar",
      description: "The address of this page. Leave empty to generate it from the title. Changing it on a published page creates a redirect from the old address.",
      ...admin,
    },
  };
}
