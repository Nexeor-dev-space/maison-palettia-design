import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import config from "@payload-config";
import { getPayload } from "payload";
import sharp from "sharp";

import { MEDIA_DIR, PROJECT_ROOT } from "@/cms/lib/paths";
import { storedFilename } from "@/cms/seed/media";
import { MEDIA } from "@/cms/seed/strings/media";

/**
 * ==========================================================================
 * restore-media — put back any library file whose bytes are missing on disk
 * ==========================================================================
 *
 *   npx payload run cms/scripts/restore-media.ts [--dry-run]
 *
 * Runs after migrations during production startup, and can also be run
 * explicitly with `npm run restore:media`. The start command is best-effort:
 * the standalone server still starts if image processing is killed by a
 * container memory limit. The media library is split between rows in
 * Postgres and files in `media/` beside the code. The seed ran on a developer
 * machine against the shared database, so the rows reached the server and
 * the files did not: every `/api/media/file/…` was a 404 and `/_next/image`
 * answered 400 for the whole site. The same happens whenever a container
 * starts on an empty `media/` (a new server, a lost volume).
 *
 * WHAT IT CAN RESTORE: every photo the seed imported, because its original
 * is in git under `public/` (cms/seed/strings/media.ts names it). It copies
 * each missing original and generates missing renditions one at a time,
 * avoiding a Payload re-upload that would process all sizes at once.
 * Document ids, metadata and references stay unchanged.
 *
 * WHAT IT CANNOT: a photo the owner uploaded through the admin exists only on
 * the server's disk. Those are listed as "missing, no source" so the gap is
 * visible in the start log — which is why `/app/media` must be a persistent
 * volume (docs/cms-runbook.md, "Deploying with Coolify").
 *
 * Cheap when nothing is missing: one query and one `existsSync` per document.
 */

const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

/** stored filename → path under public/, for every seeded photo. */
const SOURCES = new Map(MEDIA.map((seed) => [storedFilename(seed.path), seed.path]));

const PARKED = "__restoring-";

type MediaRow = {
  id: number | string;
  filename?: string | null;
  sizes?: Record<string, { filename?: string | null; width?: number | null; height?: number | null } | null> | null;
};

/**
 * The real name of a row this script parked and never got back to (the
 * process was killed mid-update — on the first server run, resizing the
 * 26–30 MP originals took the container down). The generated sizes keep the
 * original stem (`workshop-journey-96x96.webp`), so strip the `-WxH.ext`
 * suffix and match it against the seeded names to recover the extension.
 */
function originalNameOf(row: MediaRow): string | undefined {
  for (const size of Object.values(row.sizes ?? {})) {
    const stem = size?.filename?.replace(/-\d+x\d+\.[a-z0-9]+$/i, "");
    if (!stem) continue;
    for (const name of SOURCES.keys()) {
      if (name.slice(0, name.length - path.extname(name).length) === stem) return name;
    }
  }
  return undefined;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  // Keep each decode bounded and process one missing rendition at a time.
  sharp.concurrency(1);
  sharp.cache(false);
  const payload = await getPayload({ config });

  await fsp.mkdir(MEDIA_DIR, { recursive: true });

  const rows: MediaRow[] = [];
  for (let page = 1; ; page++) {
    const res = await payload.find({ collection: "media", limit: 200, page, depth: 0, overrideAccess: true, pagination: true });
    rows.push(...(res.docs as unknown as MediaRow[]));
    if (!res.hasNextPage) break;
  }

  let present = 0;
  let originalsRestored = 0;
  let renditionsRestored = 0;
  const unrecoverable: string[] = [];

  for (const row of rows) {
    let filename = row.filename;
    const wasParked = Boolean(filename?.startsWith(PARKED));
    if (wasParked) {
      const original = originalNameOf(row);
      if (!original) {
        unrecoverable.push(filename ?? "unknown parked media");
        continue;
      }
      filename = original;
    }
    if (!filename) continue;

    const source = SOURCES.get(filename);
    const absolute = source ? path.join(PUBLIC_DIR, source) : undefined;
    if (!absolute || !fs.existsSync(absolute)) {
      unrecoverable.push(filename);
      continue;
    }

    const originalPath = path.join(MEDIA_DIR, filename);
    const originalExists = fs.existsSync(originalPath);
    if (originalExists) present++;

    if (dryRun) {
      if (!originalExists) originalsRestored++;
      for (const size of Object.values(row.sizes ?? {})) {
        if (size?.filename && !fs.existsSync(path.join(MEDIA_DIR, size.filename))) renditionsRestored++;
      }
      continue;
    }

    if (!originalExists) {
      const tempPath = path.join(MEDIA_DIR, `.${filename}.${randomUUID()}.tmp${path.extname(filename)}`);
      await fsp.copyFile(absolute, tempPath);
      await fsp.rename(tempPath, originalPath);
      originalsRestored++;
    }

    for (const size of Object.values(row.sizes ?? {})) {
      const sizeFilename = size?.filename;
      if (!sizeFilename || fs.existsSync(path.join(MEDIA_DIR, sizeFilename))) continue;

      const dimensions = sizeFilename.match(/-(\d+)x(\d+)\.[^.]+$/);
      const width = size.width ?? (dimensions ? Number(dimensions[1]) : undefined);
      const height = size.height ?? (dimensions ? Number(dimensions[2]) : undefined);
      if (!width && !height) {
        unrecoverable.push(`${sizeFilename} (rendition dimensions are unavailable)`);
        continue;
      }

      const tempPath = path.join(MEDIA_DIR, `.${sizeFilename}.${randomUUID()}.tmp${path.extname(sizeFilename)}`);
      try {
        await sharp(absolute)
          .resize({
            ...(width ? { width } : {}),
            ...(height ? { height } : {}),
            fit: width && height ? "cover" : "inside",
            position: "centre",
            withoutEnlargement: true,
          })
          .toFile(tempPath);
        await fsp.rename(tempPath, path.join(MEDIA_DIR, sizeFilename));
        renditionsRestored++;
      } catch (err) {
        unrecoverable.push(`${sizeFilename} (${err instanceof Error ? err.message : String(err)})`);
        continue;
      }
    }

    if (wasParked) {
      await payload.db.updateOne({ collection: "media", id: row.id, data: { filename }, returning: false });
    }
  }

  const verb = dryRun ? "would restore" : "restored";
  console.log(
    `restore-media: ${rows.length} in library, ${present} originals on disk, ${verb} ${originalsRestored} originals and ${renditionsRestored} renditions, ${unrecoverable.length} missing or incomplete.`,
  );
  if (unrecoverable.length) {
    console.log(`restore-media: check these missing or incomplete files: ${unrecoverable.join(", ")}`);
  }
  process.exit(0);
}

// Top-level await: `payload run` exits as soon as the module has evaluated,
// so a bare `main()` would be cut off before its first query.
try {
  await main();
} catch (err) {
  // Let the start command report a failed restore and continue to the server.
  console.error("restore-media: failed —", err instanceof Error ? err.message : err);
  process.exit(1);
}
