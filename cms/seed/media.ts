import fs from "node:fs/promises";
import path from "node:path";

import type { Payload } from "payload";

import { PROJECT_ROOT } from "@/cms/lib/paths";

import { MEDIA, type MediaSeed } from "./strings/media";
import { differs, SEED_CONTEXT, type Tally } from "./upsert";

/**
 * ==========================================================================
 * Media (SPEC §F.1) — public/ files into the `media` collection, once each
 * ==========================================================================
 *
 * THE KEY IS THE STORED FILENAME, derived from the public path so it is
 * unique and readable: the folder under images/ joined to the file name
 * with a hyphen ("images/experiences/CANDLE_MAKING.jpg" →
 * "experiences-CANDLE_MAKING.jpg"; "images/logo.png" → "logo.png";
 * "videos/maison-film.mp4" → "videos-maison-film.mp4"). Two reasons it is
 * not the bare name: public/ has `experience/painting.jpg` and
 * `creative/painting.jpg`, and `hero-carousel/crocheting.jpg` beside
 * `experiences/CROCHETING.jpg` — the same name on a case-insensitive disk
 * (macOS), which Payload would silently rename to "-1" on the second upload,
 * breaking the lookup on every later run.
 *
 * A file already imported is never uploaded again; only its metadata (alt,
 * focal point, provenance, tags, caption, consent) is brought back in line
 * when it differs. Payload itself writes the six renditions (cms/collections/
 * system/Media.ts) on the first upload.
 *
 * Returns path → media id, which every later step uses to resolve the
 * `image: "images/…"` references in cms/seed/strings/*.
 */

const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
};

/** "images/experiences/CANDLE_MAKING.jpg" → "experiences-CANDLE_MAKING.jpg". */
export function storedFilename(publicPath: string): string {
  const parts = publicPath.split("/");
  if (parts[0] === "images") parts.shift();
  return parts.join("-");
}

export type MediaIds = Map<string, number | string>;

function metadataOf(seed: MediaSeed): Record<string, unknown> {
  return {
    alt: seed.alt,
    decorative: seed.decorative ?? false,
    provenance: seed.provenance,
    tags: seed.tags,
    ...(seed.caption ? { caption: seed.caption } : {}),
    ...(seed.consent !== undefined ? { consent: seed.consent } : {}),
    ...(seed.focal ? { focalX: seed.focal[0], focalY: seed.focal[1] } : {}),
  };
}

export async function seedMedia(payload: Payload, tally: Tally, log: (line: string) => void): Promise<MediaIds> {
  const ids: MediaIds = new Map();

  for (const seed of MEDIA) {
    const filename = storedFilename(seed.path);
    const absolute = path.join(PUBLIC_DIR, seed.path);
    const data = metadataOf(seed);

    const { docs } = await payload.find({
      collection: "media",
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      context: { ...SEED_CONTEXT },
    });
    const existing = docs[0] as unknown as (Record<string, unknown> & { id: number | string }) | undefined;

    if (existing) {
      ids.set(seed.path, existing.id);
      if (differs(data, existing)) {
        await payload.update({
          collection: "media",
          id: existing.id,
          data: data as never,
          depth: 0,
          overrideAccess: true,
          context: { ...SEED_CONTEXT },
        });
        tally.add("media", "updated");
      } else {
        tally.add("media", "unchanged");
      }
      continue;
    }

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(absolute);
    } catch {
      log(`media: ${seed.path} is not on disk — skipped (nothing will reference it).`);
      tally.add("media", "skipped");
      continue;
    }

    const mimetype = MIME[path.extname(seed.path).toLowerCase()];
    if (!mimetype) throw new Error(`media: no MIME type known for ${seed.path}`);

    const created = (await payload.create({
      collection: "media",
      data: data as never,
      file: { data: buffer, mimetype, name: filename, size: buffer.length },
      depth: 0,
      overrideAccess: true,
      context: { ...SEED_CONTEXT },
    })) as unknown as { id: number | string; filename?: string };

    if (created.filename && created.filename !== filename) {
      // Payload renamed it because a file of that name was already on disk
      // without a document (a half-finished earlier run). Say so: the next run
      // would not find it under the expected name.
      log(`media: ${seed.path} was stored as ${created.filename} (a stray ${filename} is in the media folder).`);
    }
    ids.set(seed.path, created.id);
    tally.add("media", "created");
  }

  return ids;
}

/** Resolves a public path to its media id; an unknown path is a seed bug, so it throws. */
export function mediaId(ids: MediaIds, publicPath: string | undefined): number | string | undefined {
  if (!publicPath) return undefined;
  const id = ids.get(publicPath);
  if (id === undefined) throw new Error(`seed: ${publicPath} is referenced but was not imported (add it to cms/seed/strings/media.ts).`);
  return id;
}
