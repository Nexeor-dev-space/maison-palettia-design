import type { CollectionSlug, GlobalSlug, PayloadRequest } from "payload";

import { hasGlobal } from "./publicUrl";

/**
 * ==========================================================================
 * "Where is this picture used?" — the reverse lookup behind the delete guard
 * ==========================================================================
 *
 * Payload deletes an upload without asking what points at it; the page that
 * used the photo then renders a broken image until someone notices. The
 * media collection's `beforeDelete` hook calls `findMediaReferences` and
 * refuses with a readable list ("Home page → Hero image; Candle Making →
 * Gallery", SPEC §D.1) when anything does.
 *
 * TWO KINDS OF REFERENCE. Relationship and upload fields are queried with a
 * `where` on the field — one indexed query per (collection, field). Page
 * builder blocks (SPEC §E) nest uploads arbitrarily deep inside a `blocks`
 * tree, so pages are walked as JSON instead. Globals are read whole and
 * checked by path.
 *
 * THE TABLES BELOW NAME COLLECTIONS THAT DO NOT EXIST YET. The content
 * collections land in Phase 2 and the invoice settings in Phase 1C; a lookup
 * against a collection the running config does not have is skipped, not
 * failed, so this file is complete now and simply starts finding more as the
 * schema grows. When a Phase 2+ agent adds a new upload field, it adds a row
 * here — that is the one maintenance rule.
 *
 * Reads use `draft: true` and `overrideAccess: true`: a draft that still
 * references the file is a reference, and the guard runs as the deleting
 * user, who may not be allowed to read every collection it has to check.
 */

export type MediaReference = { collection: string; id: string; where: string };

type FieldRef = { path: string; label: string };
type CollectionRefs = { slug: string; titleField: string; label: string; fields: FieldRef[]; walkBlocks?: boolean };
type GlobalRefs = { slug: string; label: string; fields: FieldRef[] };

const SEO_IMAGE: FieldRef = { path: "meta.image", label: "Search & sharing image" };

const COLLECTION_REFS: CollectionRefs[] = [
  { slug: "pages", titleField: "title", label: "page", fields: [SEO_IMAGE], walkBlocks: true },
  {
    slug: "experiences",
    titleField: "name",
    label: "experience",
    fields: [
      { path: "image", label: "Main photograph" },
      { path: "gallery", label: "Gallery" },
      SEO_IMAGE,
    ],
  },
  {
    slug: "sessions",
    titleField: "title",
    label: "session",
    fields: [
      { path: "image", label: "Main photograph" },
      { path: "gallery", label: "Gallery" },
      SEO_IMAGE,
    ],
  },
  { slug: "programmes", titleField: "name", label: "programme", fields: [{ path: "image", label: "Image" }, SEO_IMAGE] },
  {
    slug: "venues",
    titleField: "name",
    label: "venue",
    fields: [
      { path: "logo", label: "Logo" },
      { path: "image", label: "Photograph" },
    ],
  },
  { slug: "passes", titleField: "name", label: "pass", fields: [{ path: "image", label: "Image" }] },
  { slug: "policies", titleField: "title", label: "policy", fields: [SEO_IMAGE] },
];

const GLOBAL_REFS: GlobalRefs[] = [
  {
    slug: "site-settings",
    label: "Site details",
    fields: [
      { path: "logoOnDark", label: "Logo — light cut" },
      { path: "logoOnLight", label: "Logo — dark cut" },
      { path: "monogram", label: "Monogram" },
    ],
  },
  { slug: "seo-defaults", label: "Search & sharing defaults", fields: [{ path: "shareImage", label: "Default share image" }] },
  {
    slug: "invoice-settings",
    label: "Invoices & VAT",
    fields: [
      { path: "logo", label: "Invoice logo" },
      { path: "pdfFonts.regular", label: "PDF font (regular)" },
      { path: "pdfFonts.bold", label: "PDF font (bold)" },
    ],
  },
];

/** Reads `a.b.c` out of a plain object; arrays yield their items' values. */
export function getByPath(source: unknown, path: string | (number | string)[]): unknown {
  const segments = typeof path === "string" ? path.split(".") : path;
  let current: unknown = source;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[String(segment)];
  }
  return current;
}

/** True when `value` is the media id, a populated media doc with that id, or an array containing either. */
function refersTo(value: unknown, mediaId: string): boolean {
  if (Array.isArray(value)) return value.some((item) => refersTo(item, mediaId));
  if (value === null || value === undefined) return false;
  if (typeof value === "string" || typeof value === "number") return String(value) === mediaId;
  if (typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    return id !== undefined && id !== null && String(id) === mediaId;
  }
  return false;
}

/**
 * Walks a blocks tree and reports every field (by block type and field name)
 * whose value is the media id. `id` and `blockType` keys are skipped: a
 * block's own id is a random string that is not a media id, and skipping it
 * keeps the walk honest if ids ever share a format.
 */
function walkBlocks(value: unknown, mediaId: string, trail: string[], out: string[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkBlocks(item, mediaId, trail, out));
    return;
  }
  if (value === null || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const blockType = typeof record.blockType === "string" ? record.blockType : undefined;
  const nextTrail = blockType ? [...trail, blockType] : trail;
  for (const [key, child] of Object.entries(record)) {
    if (key === "id" || key === "blockType" || key === "blockName") continue;
    if (refersTo(child, mediaId) && (typeof child !== "object" || Array.isArray(child) || "id" in (child as object))) {
      out.push([...nextTrail, key].join(" → "));
      continue;
    }
    if (typeof child === "object") walkBlocks(child, mediaId, nextTrail, out);
  }
}

export async function findMediaReferences(req: PayloadRequest, mediaId: string): Promise<MediaReference[]> {
  const { payload } = req;
  const refs: MediaReference[] = [];
  const id = String(mediaId);

  for (const collection of COLLECTION_REFS) {
    // The registry names collections from later phases; a slug the running config lacks is skipped.
    if (!(payload.collections as Record<string, unknown>)[collection.slug]) continue;
    const slug = collection.slug as CollectionSlug;
    const titleOf = (doc: Record<string, unknown>) =>
      typeof doc[collection.titleField] === "string" && (doc[collection.titleField] as string).trim()
        ? (doc[collection.titleField] as string)
        : `${collection.label} ${String(doc.id)}`;

    for (const field of collection.fields) {
      const result = await payload.find({
        collection: slug,
        where: { [field.path]: { equals: id } },
        depth: 0,
        limit: 100,
        pagination: false,
        draft: true,
        overrideAccess: true,
        req,
      });
      for (const doc of result.docs as unknown as Record<string, unknown>[]) {
        refs.push({ collection: collection.slug, id: String(doc.id), where: `${titleOf(doc)} → ${field.label}` });
      }
    }

    if (collection.walkBlocks) {
      const result = await payload.find({
        collection: slug,
        depth: 0,
        limit: 500,
        pagination: false,
        draft: true,
        overrideAccess: true,
        req,
      });
      for (const doc of result.docs as unknown as Record<string, unknown>[]) {
        const hits: string[] = [];
        walkBlocks(doc.blocks, id, [], hits);
        for (const hit of hits) refs.push({ collection: collection.slug, id: String(doc.id), where: `${titleOf(doc)} → ${hit}` });
      }
    }
  }

  for (const global of GLOBAL_REFS) {
    if (!hasGlobal(payload, global.slug)) continue;
    const doc = (await payload.findGlobal({ slug: global.slug as GlobalSlug, depth: 0, overrideAccess: true, req })) as unknown as Record<
      string,
      unknown
    >;
    for (const field of global.fields) {
      if (refersTo(getByPath(doc, field.path), id)) {
        refs.push({ collection: `global:${global.slug}`, id: global.slug, where: `${global.label} → ${field.label}` });
      }
    }
  }

  // The same document can reference a file twice (hero + gallery); list each place once.
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.collection}:${ref.id}:${ref.where}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The sentence the admin reads when a delete is refused (SPEC §D.1). */
export function describeMediaReferences(refs: MediaReference[], max = 6): string {
  const shown = refs.slice(0, max).map((ref) => ref.where);
  const more = refs.length > max ? ` (+${refs.length - max} more)` : "";
  return `This file is still used — remove it from: ${shown.join("; ")}${more}.`;
}
