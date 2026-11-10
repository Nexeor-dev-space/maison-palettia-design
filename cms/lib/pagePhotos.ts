import type { FlattenedField, Payload } from "payload";

import { pagePhotosMoved } from "@/cms/lib/pagePhotosState";
import { STORAGE_ENABLED } from "@/cms/lib/storage";
import { seedMedia } from "@/cms/seed/media";
import { EXPERIENCES } from "@/cms/seed/strings/experiences";
import { SEED_CONTEXT, Tally } from "@/cms/seed/upsert";
import { CMS_FRAMES_KEPT, pageGallery } from "@/lib/pagePhotosTransition";

/**
 * ==========================================================================
 * The experience pages' photographs, moved from the code into the CMS — once
 * ==========================================================================
 *
 * Until Nov 2026 each experience page's banner and About frames were held in
 * lib/experiences.ts and laid over the CMS answer, so a photograph changed in
 * the admin never reached the page. The experience now has a "Page
 * photograph" field beside its "Gallery", and this puts the code-held files
 * there, so the admin shows — and controls — exactly what the page shows.
 *
 * WHAT IT DOES, for the seven experiences the seed names:
 *   1. uploads the photographs that are not in the library yet (26 files
 *      under public/images/experiences/<slug>/, listed with their alt text,
 *      focal point and origin in cms/seed/strings/media.ts). A file already
 *      there is left exactly as it is;
 *   2. sets the experience's Page photograph and Gallery to them — the
 *      gallery by the same rule the site used (lib/pagePhotosTransition.ts:
 *      glass painting keeps the CMS's first two frames);
 *   3. stamps `system-state.pagePhotosMovedAt`.
 *
 * ONCE, AND THE STAMP IS WHY. After the stamp nothing here runs again, so an
 * editor who later clears a Page photograph to fall back to the main one is
 * not overruled by the next restart. Before it, lib/experiences.ts keeps
 * laying the in-file photographs over the CMS answer, so the site looks the
 * same whether this has run yet or not — no deploy order can blank a banner.
 * A run that fails part-way leaves no stamp and is simply repeated: an
 * experience that already has a Page photograph is skipped.
 *
 * WHAT IT WILL NOT TOUCH. An experience that already has a Page photograph
 * (an editor's choice, or an earlier run). An experience the seed does not
 * name, or one whose slug is gone. The main photograph, the copy, and every
 * other field. Unpublished edits stay unpublished: Payload's update starts
 * from the LATEST version, so writing the photographs onto a live experience
 * with a draft on top would publish that draft. The live row is therefore
 * written from the live row's own values, and the draft is saved again on
 * top of it with the photographs added.
 *
 * WHERE IT MAY RUN. Uploads land wherever this process keeps the library.
 * On a laptop pointed at the shared database with no storage keys that is
 * the laptop's own disk — rows the live site would have no files for (the
 * failure cms/scripts/restore-media.ts was written to repair). So without
 * object storage it runs only in production, where the disk is the
 * library; `force` is for a database that really is local.
 *
 * It runs from `npm run start:prod` (cms/scripts/restore-media.ts, after
 * migrations) and by hand with cms/scripts/move-page-photos.ts.
 */

type Doc = Record<string, unknown> & { id: number | string; _status?: string | null };

export interface MoveOptions {
  /** Report what would happen; write nothing. */
  dryRun?: boolean;
  /** Run without object storage outside production (a database that is local to this machine). */
  force?: boolean;
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
  /** Seeded experiences that are not in the database under that slug. */
  absent: string[];
}

const SYSTEM_STATE = "system-state" as const;
const CONTEXT = { ...SEED_CONTEXT };

const idOf = (value: unknown): string | number | undefined => {
  if (value && typeof value === "object" && "id" in value) return (value as { id: string | number }).id;
  return typeof value === "string" || typeof value === "number" ? value : undefined;
};

const idsOf = (value: unknown): Array<string | number> =>
  (Array.isArray(value) ? value : []).map(idOf).filter((id): id is string | number => id !== undefined);

/**
 * Every field of `doc`, as data for an update — with an explicit `null`
 * where the document holds nothing. Explicit, because Payload merges update
 * data over the latest version: a key left out would take that version's
 * value, which is how an unpublished edit would leak into the live row.
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
  const { dryRun = false, force = false, log = () => {} } = options;
  const result: MoveResult = { state: dryRun ? "dry-run" : "moved", uploaded: 0, moved: [], kept: [], absent: [] };

  if (await pagePhotosMoved(payload)) return { ...result, state: "already-moved" };

  if (!dryRun && !force && !STORAGE_ENABLED && process.env.NODE_ENV !== "production") {
    return {
      ...result,
      state: "refused",
      reason:
        "this process has no object-storage keys and is not the production server, so the photographs would be uploaded to this machine's disk while their rows went to the database. Run it on the server.",
    };
  }

  const targets = EXPERIENCES.filter((seed) => seed.pageImage);
  /** The frames the code held, by experience: the seed's gallery from the first frame it did not leave to the CMS. */
  const heldFrames = (seed: (typeof targets)[number]) => seed.gallery.slice(CMS_FRAMES_KEPT[seed.slug] ?? 0);

  /* 1. the files */
  const wanted = new Set(targets.flatMap((seed) => [seed.pageImage as string, ...heldFrames(seed)]));
  const tally = new Tally();
  const media = await seedMedia(payload, tally, log, { only: wanted, createOnly: true, dryRun });
  result.uploaded = tally.get("media")?.created ?? 0;
  if (tally.get("media")?.skipped) {
    // seedMedia has logged which. Half a set would show as a page missing frames, so stop before writing any experience.
    throw new Error("some of the photographs are not in this checkout's public/ folder — nothing was changed on the experiences.");
  }

  /* 2. the experiences */
  const collection = payload.collections.experiences.config;
  for (const seed of targets) {
    const found = await payload.find({
      collection: "experiences",
      where: { slug: { equals: seed.slug } },
      limit: 1,
      depth: 0,
      draft: false,
      overrideAccess: true,
      pagination: false,
      context: CONTEXT,
    });
    let live = found.docs[0] as unknown as Doc | undefined;
    if (!live) {
      const draftFound = await payload.find({
        collection: "experiences",
        where: { slug: { equals: seed.slug } },
        limit: 1,
        depth: 0,
        draft: true,
        overrideAccess: true,
        pagination: false,
        context: CONTEXT,
      });
      live = draftFound.docs[0] as unknown as Doc | undefined;
    }
    if (!live) {
      result.absent.push(seed.slug);
      continue;
    }
    // The newest version: the same as `live` unless someone has unpublished edits on top of it.
    const latest = (await payload.findByID({ collection: "experiences", id: live.id, depth: 0, draft: true, overrideAccess: true, context: CONTEXT })) as unknown as Doc;

    if (idOf(live.pageImage) !== undefined && idOf(latest.pageImage) !== undefined) {
      result.kept.push(seed.slug);
      continue;
    }
    result.moved.push(seed.slug);
    if (dryRun) continue;

    const hero = media.get(seed.pageImage as string);
    // By position, as `pageGallery` reads them: the leading frames the CMS kept are never looked at, so they need no id.
    const kept = CMS_FRAMES_KEPT[seed.slug] ?? 0;
    const frames = seed.gallery.map((path, i) => (i < kept ? undefined : media.get(path)));
    if (hero === undefined || frames.some((id, i) => i >= kept && id === undefined)) throw new Error(`${seed.slug}: a photograph was not imported.`);

    /** A document's own Page photograph where it has one; otherwise the code-held banner and frames. */
    const withPhotos = (doc: Doc) =>
      idOf(doc.pageImage) !== undefined
        ? {}
        : { pageImage: hero, gallery: pageGallery(seed.slug, idsOf(doc.gallery), frames as Array<string | number>) };

    const published = live._status === "published";
    const pendingDraft = published && latest._status === "draft";

    if (published) {
      await payload.update({
        collection: "experiences",
        id: live.id,
        data: { ...fieldsOf(collection.flattenedFields, live), ...withPhotos(live), _status: "published" } as never,
        draft: false,
        depth: 0,
        overrideAccess: true,
        context: CONTEXT,
      });
    }
    if (!published || pendingDraft) {
      // A draft-only experience, or the unpublished edits put back on top of the row just written.
      await payload.update({
        collection: "experiences",
        id: live.id,
        data: { ...fieldsOf(collection.flattenedFields, latest), ...withPhotos(latest), _status: "draft" } as never,
        draft: true,
        depth: 0,
        overrideAccess: true,
        context: CONTEXT,
      });
    }
  }

  /* 3. the stamp */
  if (!dryRun) {
    await payload.updateGlobal({ slug: SYSTEM_STATE, data: { pagePhotosMovedAt: new Date().toISOString() } as never, depth: 0, overrideAccess: true, context: CONTEXT });
  }
  return result;
}

/** One line for a start log or a terminal. */
export function describeMove(result: MoveResult): string {
  if (result.state === "already-moved") return "the experience pages' photographs are already in the library.";
  if (result.state === "refused") return `not run — ${result.reason}`;
  const would = result.state === "dry-run";
  const parts = [
    `${would ? "would upload" : "uploaded"} ${result.uploaded} photograph${result.uploaded === 1 ? "" : "s"}`,
    `${would ? "would set" : "set"} the page photographs on ${result.moved.length} experience${result.moved.length === 1 ? "" : "s"}${result.moved.length ? ` (${result.moved.join(", ")})` : ""}`,
  ];
  if (result.kept.length) parts.push(`left ${result.kept.join(", ")} as set in the admin`);
  if (result.absent.length) parts.push(`found no experience called ${result.absent.join(", ")}`);
  return `${parts.join("; ")}.`;
}
