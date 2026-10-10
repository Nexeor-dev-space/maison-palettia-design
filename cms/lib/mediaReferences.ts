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

/** `href` is the admin page to fix it on (4B review: the refusal and the "Used on" panel link there). */
export type MediaReference = { collection: string; id: string; where: string; href?: string };

type FieldRef = { path: string; label: string };
/** `richText`: Lexical fields whose upload nodes (inline photographs) are walked as JSON. */
type CollectionRefs = { slug: string; titleField: string; label: string; fields: FieldRef[]; walkBlocks?: boolean; richText?: FieldRef[] };
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
  {
    slug: "posts",
    titleField: "title",
    label: "journal post",
    fields: [
      { path: "coverImage", label: "Cover photograph" },
      { path: "author.photo", label: "Author photo" },
      SEO_IMAGE,
    ],
    richText: [{ path: "body", label: "Photograph in the post" }],
  },
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

type AnyField = { name?: string; label?: unknown; type?: string; fields?: AnyField[]; tabs?: AnyField[]; blocks?: AnyBlock[]; blockReferences?: Array<string | AnyBlock> };
type AnyBlock = { slug: string; labels?: { singular?: unknown }; fields?: AnyField[] };

const plain = (label: unknown, fallback: string): string => (typeof label === "string" && label.trim() ? label : fallback.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase()));

/**
 * The admin's own words for the block trail (4B review: the refusal read
 * "Home → hero → imageDesktop"). Block slugs become the block's label
 * ("Hero") and field names the field's label ("Photograph — desktop"),
 * read from the running config so a renamed label is never out of date.
 */
function blockLabels(payload: PayloadRequest["payload"], collection: string): { block: Map<string, string>; field: Map<string, Map<string, string>> } {
  const block = new Map<string, string>();
  const field = new Map<string, Map<string, string>>();
  const globalBlocks = ((payload.config as { blocks?: AnyBlock[] }).blocks ?? []) as AnyBlock[];
  const collect = (fields: AnyField[] | undefined, into: Map<string, string>) => {
    for (const f of fields ?? []) {
      if (f.name && !into.has(f.name)) into.set(f.name, plain(f.label, f.name));
      if (f.fields) collect(f.fields, into);
      if (f.tabs) collect(f.tabs, into);
    }
  };
  const visit = (fields: AnyField[] | undefined) => {
    for (const f of fields ?? []) {
      if (f.type === "blocks") {
        const list = [...(f.blocks ?? []), ...((f.blockReferences ?? []).map((ref) => (typeof ref === "string" ? globalBlocks.find((b) => b.slug === ref) : ref)).filter(Boolean) as AnyBlock[])];
        for (const b of list) {
          if (block.has(b.slug)) continue;
          block.set(b.slug, plain(b.labels?.singular, b.slug));
          const names = new Map<string, string>();
          collect(b.fields, names);
          field.set(b.slug, names);
          visit(b.fields);
        }
      }
      if (f.fields) visit(f.fields);
      if (f.tabs) visit(f.tabs);
    }
  };
  const config = (payload.collections as Record<string, { config?: { fields?: AnyField[] } }>)[collection]?.config;
  visit(config?.fields);
  return { block, field };
}

/** "hero → imageDesktop" → "Hero → Photograph — desktop". */
function readableTrail(trail: string, labels: ReturnType<typeof blockLabels>): string {
  const parts = trail.split(" → ");
  let lastBlock: string | undefined;
  return parts
    .map((part) => {
      if (labels.block.has(part)) {
        lastBlock = part;
        return labels.block.get(part)!;
      }
      return (lastBlock && labels.field.get(lastBlock)?.get(part)) || plain(undefined, part);
    })
    .join(" → ");
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

/** True when a Lexical value has an upload node pointing at the media id, at any depth. */
function lexicalUsesMedia(value: unknown, mediaId: string): boolean {
  if (Array.isArray(value)) return value.some((item) => lexicalUsesMedia(item, mediaId));
  if (value === null || typeof value !== "object") return false;
  const node = value as Record<string, unknown>;
  if (node.type === "upload" && node.relationTo === "media" && refersTo(node.value, mediaId)) return true;
  return Object.entries(node).some(([key, child]) => key !== "value" && typeof child === "object" && lexicalUsesMedia(child, mediaId));
}

export async function findMediaReferences(req: PayloadRequest, mediaId: string): Promise<MediaReference[]> {
  const { payload } = req;
  const id = String(mediaId);
  const admin = payload.config.routes.admin;

  // Every lookup is independent, so they run together (4B review: a refused
  // delete sat on "Deleting…" for 3 s while the queries ran one by one).
  const lookups: Array<Promise<MediaReference[]>> = [];

  for (const collection of COLLECTION_REFS) {
    // The registry names collections from later phases; a slug the running config lacks is skipped.
    if (!(payload.collections as Record<string, unknown>)[collection.slug]) continue;
    const slug = collection.slug as CollectionSlug;
    // Pages read as "Home page", everything else by its own name.
    const titleOf = (doc: Record<string, unknown>) => {
      const title = typeof doc[collection.titleField] === "string" ? (doc[collection.titleField] as string).trim() : "";
      if (!title) return `${collection.label} ${String(doc.id)}`;
      return collection.slug === "pages" ? `${title} page` : title;
    };
    const hrefOf = (doc: Record<string, unknown>) => `${admin}/collections/${collection.slug}/${String(doc.id)}`;

    for (const field of collection.fields) {
      lookups.push(
        payload
          .find({ collection: slug, where: { [field.path]: { equals: id } }, depth: 0, limit: 100, pagination: false, draft: true, overrideAccess: true, req })
          .then((result) =>
            (result.docs as unknown as Record<string, unknown>[]).map((doc) => ({ collection: collection.slug, id: String(doc.id), where: `${titleOf(doc)} → ${field.label}`, href: hrefOf(doc) })),
          ),
      );
    }

    if (collection.richText?.length) {
      const richText = collection.richText;
      lookups.push(
        payload.find({ collection: slug, depth: 0, limit: 500, pagination: false, draft: true, overrideAccess: true, req }).then((result) => {
          const found: MediaReference[] = [];
          for (const doc of result.docs as unknown as Record<string, unknown>[]) {
            for (const field of richText) {
              if (lexicalUsesMedia(getByPath(doc, field.path), id)) found.push({ collection: collection.slug, id: String(doc.id), where: `${titleOf(doc)} → ${field.label}`, href: hrefOf(doc) });
            }
          }
          return found;
        }),
      );
    }

    if (collection.walkBlocks) {
      const labels = blockLabels(payload, collection.slug);
      lookups.push(
        payload.find({ collection: slug, depth: 0, limit: 500, pagination: false, draft: true, overrideAccess: true, req }).then((result) => {
          const found: MediaReference[] = [];
          for (const doc of result.docs as unknown as Record<string, unknown>[]) {
            const hits: string[] = [];
            walkBlocks(doc.blocks, id, [], hits);
            for (const hit of hits) found.push({ collection: collection.slug, id: String(doc.id), where: `${titleOf(doc)} → ${readableTrail(hit, labels)}`, href: hrefOf(doc) });
          }
          return found;
        }),
      );
    }
  }

  for (const global of GLOBAL_REFS) {
    if (!hasGlobal(payload, global.slug)) continue;
    lookups.push(
      payload.findGlobal({ slug: global.slug as GlobalSlug, depth: 0, overrideAccess: true, req }).then((raw) => {
        const doc = raw as unknown as Record<string, unknown>;
        return global.fields
          .filter((field) => refersTo(getByPath(doc, field.path), id))
          .map((field) => ({ collection: `global:${global.slug}`, id: global.slug, where: `${global.label} → ${field.label}`, href: `${admin}/globals/${global.slug}` }));
      }),
    );
  }

  const refs = (await Promise.all(lookups)).flat();

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
  return `This photo is still used, so it was not deleted. Remove it from ${shown.join("; ")}${more} first — or replace the file instead, which updates every place at once.`;
}
