import type { ArrayField, CollectionConfig, Field, NumberField, UploadField } from "payload";

import { anyone, isEditor, publishedOrEditor } from "@/cms/access/roles";
import { previewUrl } from "@/cms/lib/publicUrl";

/**
 * ==========================================================================
 * What every content collection shares (SPEC §D conventions, §D.2, §J)
 * ==========================================================================
 *
 * The twelve content collections are written one per file; the three things
 * they all repeat are fixed here so a reviewer can read each file against
 * the §D.2 table and find only what is particular to it.
 *
 *   · `CONTENT_GROUP` — the admin sidebar group.
 *   · `contentDrafts` — the versions config for every collection marked
 *     "drafts" in §D.2: autosave every 1.5 s, scheduled publishing, 25 kept
 *     versions per document. Collections without drafts (venues, vibes,
 *     redirects, session-inventory) do not use it.
 *   · the two access shapes. With drafts, anonymous readers get a row
 *     filter on `_status` (`publishedOrEditor`), editors see everything and
 *     may write; delete follows the §J matrix (editors may delete content;
 *     `pages` narrows that to admins in its own file, and hooks add the
 *     refusals for fixed pages and sessions with sold seats). Without
 *     drafts, anyone may read and content staff write AND delete — §J gives
 *     editors CRUD on venues, vibes and redirects too.
 *
 * Hooks (revalidation, slug redirects, publish gates, the session
 * inventory lifecycle) are wired in each collection file from
 * cms/hooks/* and ./revalidation.ts. The two admin helpers at the bottom
 * — `previewFor` and `withContentTab` — serve the five collections that
 * have a page on the site and an SEO tab (SPEC §G.5, §I).
 */

export const CONTENT_GROUP = "Content";

/** §D: `versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, maxPerDoc: 25 }`. */
export const contentDrafts = {
  drafts: { autosave: { interval: 1500 }, schedulePublish: true },
  maxPerDoc: 25,
} satisfies NonNullable<CollectionConfig["versions"]>;

/** Collections with drafts: published rows for the public, everything for content staff. */
export const draftedContentAccess: CollectionConfig["access"] = {
  read: publishedOrEditor,
  create: isEditor,
  update: isEditor,
  delete: isEditor,
};

/** Collections without drafts: readable by anyone, written by content staff. */
export const publicContentAccess: CollectionConfig["access"] = {
  read: anyone,
  create: isEditor,
  update: isEditor,
  delete: isEditor,
};

/**
 * `order` — the position in every list that shows the collection. A plain
 * number in the sidebar rather than Payload's drag-ordering, because the
 * same number is read by the site's getters (`defaultSort: "order"`) and
 * the seed writes it from the current array positions (SPEC §F).
 */
export const orderField = (description = "Position in lists: lower numbers come first."): NumberField => ({
  name: "order",
  type: "number",
  label: "Display order",
  required: true,
  defaultValue: 0,
  min: 0,
  admin: { position: "sidebar", step: 1, description },
});

/** `about[] { paragraph }` — long copy, one row per paragraph (experiences, sessions). */
export const paragraphs = (name: string, label: string, opts: { description?: string; maxRows?: number; maxChars?: number } = {}): ArrayField => ({
  name,
  type: "array",
  label,
  labels: { singular: "Paragraph", plural: "Paragraphs" },
  maxRows: opts.maxRows ?? 4,
  admin: { description: opts.description ?? "One row per paragraph; two is the house length." },
  fields: [
    {
      name: "paragraph",
      type: "textarea",
      label: "Paragraph",
      required: true,
      maxLength: opts.maxChars ?? 320,
    },
  ],
});

/** A single image from Media. */
export const image = (name: string, label: string, description?: string): UploadField => ({
  name,
  type: "upload",
  relationTo: "media",
  label,
  filterOptions: { mimeType: { contains: "image" } },
  admin: { description },
});

/** Several images from Media, capped. */
export const gallery = (name: string, label: string, maxRows: number, description?: string): UploadField => ({
  name,
  type: "upload",
  relationTo: "media",
  hasMany: true,
  maxRows,
  label,
  filterOptions: { mimeType: { contains: "image" } },
  admin: { description },
});

/**
 * `admin.preview` for the collections with a route of their own: the
 * Preview button opens `/preview?path=…` on the public origin, which turns
 * on draft mode for a signed-in staff member and redirects to the page
 * (SPEC §G.5; cms/lib/publicUrl.ts builds the URL).
 */
export const previewFor =
  (collectionSlug: string): NonNullable<NonNullable<CollectionConfig["admin"]>["preview"]> =>
  (doc, { req }) =>
    previewUrl({ collectionSlug, id: doc?.id as string | undefined, doc: doc as { slug?: string } }, req);

/**
 * The SEO plugin runs with `tabbedUI: true` (SPEC §A.4). When a
 * collection's first field is a `tabs` field the plugin appends an "SEO"
 * tab to it and leaves the remaining top-level fields alone; otherwise it
 * wraps EVERY field in a new "Content" tab — sidebar fields included, which
 * then lose their place in the sidebar. So the four collections that do
 * not already start with tabs are arranged here: the main-column fields go
 * into a "Content" tab, the sidebar fields stay top-level. Unnamed tabs
 * store nothing, so the database and the generated types do not change.
 */
export function withContentTab(fields: Field[], label = "Content"): Field[] {
  const inSidebar = (field: Field) => (field as { admin?: { position?: string } }).admin?.position === "sidebar";
  return [{ type: "tabs", tabs: [{ label, fields: fields.filter((field) => !inSidebar(field)) }] }, ...fields.filter(inSidebar)];
}
