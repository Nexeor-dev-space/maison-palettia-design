import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import config from "@payload-config";
import { getPayload } from "payload";
import sharp from "sharp";

import { MEDIA_DIR, PROJECT_ROOT } from "@/cms/lib/paths";
import { storedFilename } from "@/cms/seed/media";
import { MEDIA } from "@/cms/seed/strings/media";
import { SEED_CONTEXT } from "@/cms/seed/upsert";

/**
 * ==========================================================================
 * restore-media — put back any library file whose bytes are missing on disk
 * ==========================================================================
 *
 *   npx payload run cms/scripts/restore-media.ts [--dry-run]
 *
 * Runs on every production start (package.json `start:prod`, after
 * migrations). WHY: the media library is two halves — rows in Postgres and
 * files in `media/` beside the code. The seed ran on a developer machine
 * against the shared database, so the rows reached the server and the files
 * did not: every `/api/media/file/…` was a 404 and `/_next/image` answered
 * 400 for the whole site. The same happens whenever a container starts on an
 * empty `media/` (a new server, a lost volume).
 *
 * WHAT IT CAN RESTORE: every photo the seed imported, because its original
 * is in git under `public/` (cms/seed/strings/media.ts names it). It
 * re-uploads that original into the SAME document (`payload.update` with a
 * file), so Payload rewrites the file and regenerates every size — ids,
 * alt text, focal points and every page that references it stay as they are.
 *
 * WHAT IT CANNOT: a photo the owner uploaded through the admin exists only on
 * the server's disk. Those are listed as "missing, no source" so the gap is
 * visible in the start log — which is why `/app/media` must be a persistent
 * volume (docs/cms-runbook.md, "Deploying with Coolify").
 *
 * Cheap when nothing is missing: one query and one `existsSync` per document.
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

/** stored filename → path under public/, for every seeded photo. */
const SOURCES = new Map(MEDIA.map((seed) => [storedFilename(seed.path), seed.path]));

const PARKED = "__restoring-";

type MediaRow = {
  id: number | string;
  filename?: string | null;
  sizes?: Record<string, { filename?: string | null } | null> | null;
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
  // One image at a time, no pixel cache: this runs beside nothing else at
  // boot, but on a small container the default (one thread per core plus a
  // 50 MB cache) resizing a 30 MP original was enough to get it killed.
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
  let restored = 0;
  const unrecoverable: string[] = [];

  for (const row of rows) {
    let filename = row.filename;
    if (filename?.startsWith(PARKED)) {
      // Left parked by an interrupted run: give the row its name back first.
      const original = originalNameOf(row);
      if (!original) {
        unrecoverable.push(filename);
        continue;
      }
      if (!dryRun) {
        await payload.db.updateOne({ collection: "media", id: row.id, data: { filename: original }, returning: false });
      }
      filename = original;
    }
    if (!filename) continue;
    if (fs.existsSync(path.join(MEDIA_DIR, filename))) {
      present++;
      continue;
    }

    const source = SOURCES.get(filename);
    const absolute = source ? path.join(PUBLIC_DIR, source) : undefined;
    if (!absolute || !fs.existsSync(absolute)) {
      unrecoverable.push(filename);
      continue;
    }

    if (dryRun) {
      restored++;
      continue;
    }

    const buffer = await fsp.readFile(absolute);
    const mimetype = MIME[path.extname(absolute).toLowerCase()] ?? "application/octet-stream";
    // Free the name first. Payload's upload step treats a filename already
    // held by ANY row — this row included — as taken and stores the new file
    // as `name-1.ext`, which would rename every restored photo. Parking the
    // row's own filename for the length of the update keeps the original.
    await payload.db.updateOne({
      collection: "media",
      id: row.id,
      data: { filename: `__restoring-${row.id}${path.extname(filename)}` },
      returning: false,
    });
    try {
      await payload.update({
        collection: "media",
        id: row.id,
        data: {} as never,
        file: { data: buffer, mimetype, name: filename, size: buffer.length },
        depth: 0,
        overrideAccess: true,
        context: { ...SEED_CONTEXT },
      });
      restored++;
    } catch (err) {
      // Never leave a row parked: put its name back and carry on.
      await payload.db.updateOne({ collection: "media", id: row.id, data: { filename }, returning: false });
      unrecoverable.push(`${filename} (${err instanceof Error ? err.message : String(err)})`);
    }
  }

  const verb = dryRun ? "would restore" : "restored";
  console.log(`restore-media: ${rows.length} in library, ${present} on disk, ${verb} ${restored} from public/, ${unrecoverable.length} missing with no source.`);
  if (unrecoverable.length) {
    console.log(`restore-media: re-upload these in the admin (Media): ${unrecoverable.join(", ")}`);
  }
  process.exit(0);
}

// Top-level await: `payload run` exits as soon as the module has evaluated,
// so a bare `main()` would be cut off before its first query.
try {
  await main();
} catch (err) {
  // Never block the site from starting over missing photos: log and go on.
  console.error("restore-media: failed —", err instanceof Error ? err.message : err);
  process.exit(0);
}
