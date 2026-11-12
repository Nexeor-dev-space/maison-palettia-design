import fs from "node:fs/promises";
import path from "node:path";

import type { FlattenedField, Payload } from "payload";

import { pagePhotosMoved } from "@/cms/lib/pagePhotosState";
import { PROJECT_ROOT } from "@/cms/lib/paths";
import { STORAGE_ENABLED } from "@/cms/lib/storage";
import { storedFilename } from "@/cms/seed/media";
import { SEED_CONTEXT } from "@/cms/seed/upsert";
import { GALLERY_SLOTS, PAGE_PHOTOS, STOCK_PHOTOS, pageGallery, type PagePhoto } from "@/lib/experiencePagePhotos";
import type { ImageAsset } from "@/types";

/**
 * ==========================================================================
 * The experience pages' photographs, moved from the code into the CMS — once
 * ==========================================================================
 *
 * Issue #201: each experience page's banner and About frames were held in
 * code and laid over the CMS answer, so a photograph changed in the admin
 * never reached the page. The experience now has a "Page photograph" beside
 * its "Gallery", and this puts the code-held files (lib/experiencePagePhotos.ts)
 * into those fields, so the admin shows — and controls — what the page shows.
 *
 * FOR EACH EXPERIENCE THE CODE HELD PHOTOGRAPHS FOR:
 *   1. upload the files that are not in the media library yet (found by
 *      their stored filename; one already there is left exactly as it is);
 *   2. set the Page photograph, and the Gallery by the rule the site used
 *      (`pageGallery`: the code-held list, or the CMS list with single
 *      code-held frames laid over it).
 * Then stamp `system-state.pagePhotosMovedAt`.
 *
 * ONCE. After the stamp nothing here runs again, so an editor who later
 * empties a Page photograph is not overruled by the next restart. Before it,
 * lib/experiences.ts keeps the code-held photographs on the page, so the
 * site looks the same whether this has run yet or not. A run that fails
 * part-way leaves no stamp and is simply run again: an experience that
 * already has a Page photograph is skipped.
 *
 * WHAT IT LEAVES ALONE. An experience that already has a Page photograph.
 * An experience that is not in the database under that slug. Every other
 * field. And unpublished edits stay unpublished — see `write`.
 *
 * WHERE IT MAY RUN. Uploads land wherever this process keeps the library.
 * On a laptop pointed at a shared database with no storage keys that is the
 * laptop's own disk: rows the server would have no files for. So without
 * object storage it runs only in production.
 *
 * It runs at the end of cms/scripts/restore-media.ts (every `npm run
 * start:prod`, after migrations) and by hand with `npm run move:page-photos`.
 */

type Id = string | number;
type Doc = Record<string, unknown> & { id: Id; _status?: string | null };

export interface MoveOptions {
  /** Report what would happen; write nothing. */
  dryRun?: boolean;
  log?: (line: string) => void;
}

export interface MoveResult {
  state: "already-moved" | "refused" | "dry-run" | "moved";
  /** Why, when `refused`. */
  reason?: string;
  /** Photographs uploaded (or, in a dry run, that would be). */
  uploaded: number;
  /** Experiences whose photographs were set. */
  moved: string[];
  /** Experiences left alone because they already had a Page photograph. */
  kept: string[];
  /** Experiences the code held photographs for that are not in the database. */
  absent: string[];
}

const CONTEXT = { ...SEED_CONTEXT };
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

const idOf = (value: unknown): Id | undefined => {
  if (value && typeof value === "object" && "id" in value) return (value as { id: Id }).id;
  return typeof value === "string" || typeof value === "number" ? value : undefined;
};
const idsOf = (value: unknown): Id[] => (Array.isArray(value) ? value : []).map(idOf).filter((id): id is Id => id !== undefined);

/** "/images/experiences/x/x-hero.jpg" → "images/experiences/x/x-hero.jpg", the path under public/. */
const publicPath = (src: string) => src.replace(/^\//, "");

/** "45% 50%" → the library's focal point. */
function focalOf(position: string | undefined): { focalX: number; focalY: number } | Record<string, never> {
  const match = position?.match(/^(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  return match ? { focalX: Number(match[1]), focalY: Number(match[2]) } : {};
}

/**
 * Every field of `doc` as update data, with an explicit `null` where the
 * document holds nothing. Explicit, because Payload merges update data over
 * the LATEST version: a key left out would take that version's value, which
 * is how an unpublished edit would leak into the live row.
 */
function fieldsOf(fields: FlattenedField[], doc: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    if (["id", "createdAt", "updatedAt", "_status"].includes(field.name)) continue;
    const value = doc[field.name];
    if (field.type === "group" || field.type === "tab") {
      data[field.name] = fieldsOf(field.flattenedFields, value && typeof value === "object" ? (value as Record<string, unknown>) : {});
    } else {
      data[field.name] = value ?? null;
    }
  }
  return data;
}

export async function movePagePhotos(payload: Payload, options: MoveOptions = {}): Promise<MoveResult> {
  const { dryRun = false, log = () => {} } = options;
  const result: MoveResult = { state: dryRun ? "dry-run" : "moved", uploaded: 0, moved: [], kept: [], absent: [] };

  if (await pagePhotosMoved(payload)) return { ...result, state: "already-moved" };

  if (!dryRun && !STORAGE_ENABLED && process.env.NODE_ENV !== "production") {
    return {
      ...result,
      state: "refused",
      reason:
        "this process has no object-storage keys and is not the production server, so the photographs would be uploaded to this machine's disk while their rows went to the database. Run it on the server.",
    };
  }

  /** The library id of a code-held photograph, uploading it first when the library does not have it. */
  const ensure = async (photo: ImageAsset | PagePhoto, tag: "hero" | "experience-gallery"): Promise<Id | undefined> => {
    const source = publicPath(photo.src);
    const filename = storedFilename(source);
    const found = await payload.find({ collection: "media", where: { filename: { equals: filename } }, limit: 1, depth: 0, overrideAccess: true, context: CONTEXT });
    const existing = found.docs[0] as unknown as { id: Id } | undefined;
    if (existing) return existing.id;

    result.uploaded++;
    if (dryRun) return undefined;

    const mimetype = MIME[path.extname(source).toLowerCase()];
    if (!mimetype) throw new Error(`no MIME type known for ${source}`);
    let buffer: Buffer;
    try {
      buffer = await fs.readFile(path.join(PUBLIC_DIR, source));
    } catch {
      throw new Error(`${source} is not in this checkout's public/ folder`);
    }
    const created = (await payload.create({
      collection: "media",
      data: {
        alt: photo.alt,
        decorative: false,
        provenance: STOCK_PHOTOS.has(photo.src) ? "stock" : "client-supplied",
        tags: [tag],
        ...focalOf("position" in photo ? photo.position : undefined),
      } as never,
      file: { data: buffer, mimetype, name: filename, size: buffer.length },
      depth: 0,
      overrideAccess: true,
      context: CONTEXT,
    })) as unknown as { id: Id; filename?: string };
    if (created.filename && created.filename !== filename) log(`${source} was stored as ${created.filename} (a stray ${filename} is already in the library's folder).`);
    return created.id;
  };

  const fields = payload.collections.experiences.config.flattenedFields;
  const slugs = [...new Set([...Object.keys(PAGE_PHOTOS), ...Object.keys(GALLERY_SLOTS)])];

  for (const slug of slugs) {
    const photos = PAGE_PHOTOS[slug];
    if (!photos?.pageImage) continue; // every entry has a banner; one without is not a page this move knows how to set

    // The row the site reads (the published one, or a never-published draft)…
    const found = await payload.find({ collection: "experiences", where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: false, overrideAccess: true, pagination: false, context: CONTEXT });
    const live = found.docs[0] as unknown as Doc | undefined;
    if (!live) {
      result.absent.push(slug);
      continue;
    }
    if (idOf(live.pageImage) !== undefined) {
      result.kept.push(slug);
      continue;
    }
    // …and the newest version: the same, unless someone has unpublished edits on top of it.
    const latest = (await payload.findByID({ collection: "experiences", id: live.id, depth: 0, draft: true, overrideAccess: true, context: CONTEXT })) as unknown as Doc;

    const hero = await ensure(photos.pageImage, "hero");
    const whole = photos.gallery ? await Promise.all(photos.gallery.map((frame) => ensure(frame, "experience-gallery"))) : undefined;
    const slots: Record<number, Id | undefined> = {};
    for (const [index, frame] of Object.entries(GALLERY_SLOTS[slug] ?? {})) slots[Number(index)] = await ensure(frame, "experience-gallery");

    result.moved.push(slug);
    if (dryRun) continue;

    /** A document's own Page photograph where it has one; otherwise the code-held banner and frames over its gallery. */
    const withPhotos = (doc: Doc) =>
      idOf(doc.pageImage) !== undefined
        ? {}
        : { pageImage: hero as Id, gallery: pageGallery(idsOf(doc.gallery), whole as Id[] | undefined, GALLERY_SLOTS[slug] ? (slots as Record<number, Id>) : undefined) };

    /*
      Payload's update starts from the LATEST version, so writing only the
      photographs onto a published experience that has a draft on top would
      publish that draft. The live row is therefore written from the live
      row's own values, and the draft is saved again on top of it.
    */
    const write = (doc: Doc, status: "published" | "draft") =>
      payload.update({
        collection: "experiences",
        id: live.id,
        data: { ...fieldsOf(fields, doc), ...withPhotos(doc), _status: status } as never,
        draft: status === "draft",
        depth: 0,
        overrideAccess: true,
        context: CONTEXT,
      });

    const published = live._status === "published";
    if (published) await write(live, "published");
    if (!published || latest._status === "draft") await write(latest, "draft");
  }

  if (!dryRun) {
    await payload.updateGlobal({ slug: "system-state", data: { pagePhotosMovedAt: new Date().toISOString() } as never, depth: 0, overrideAccess: true, context: CONTEXT });
  }
  return result;
}

/** One line for a start log or a terminal. */
export function describeMove(result: MoveResult): string {
  if (result.state === "already-moved") return "the experience pages' photographs are already in the library.";
  if (result.state === "refused") return `not run — ${result.reason}`;
  const would = result.state === "dry-run";
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const parts = [
    `${would ? "would upload" : "uploaded"} ${plural(result.uploaded, "photograph")}`,
    `${would ? "would set" : "set"} the page photographs on ${plural(result.moved.length, "experience")}${result.moved.length ? ` (${result.moved.join(", ")})` : ""}`,
  ];
  if (result.kept.length) parts.push(`left ${result.kept.join(", ")} as set in the admin`);
  if (result.absent.length) parts.push(`found no experience called ${result.absent.join(", ")}`);
  return `${parts.join("; ")}.`;
}
