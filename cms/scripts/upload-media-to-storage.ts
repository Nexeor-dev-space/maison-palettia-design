import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import config from "@payload-config";
import { getPayload } from "payload";

import { MEDIA_DIR } from "@/cms/lib/paths";
import { mediaKey, STORAGE_BUCKET, STORAGE_ENABLED, storageClient } from "@/cms/lib/storage";

/**
 * ==========================================================================
 * upload-media-to-storage — copy the media library from disk to the bucket
 * ==========================================================================
 *
 *   npx payload run cms/scripts/upload-media-to-storage.ts [--dry-run]
 *
 * Run once on the machine that has `media/` (the server, or a restored copy),
 * with STORAGE_ACCESS_KEY / STORAGE_SECRET_KEY set. For every row in the
 * library it takes the original and each generated size, and puts
 * `media/<filename>` in the bucket — the same name, so no row changes.
 *
 * Safe to run again: an object that is already there with the same size is
 * skipped. Nothing is deleted, on disk or in the bucket. Music tracks are not
 * part of the media collection and are left alone.
 *
 * It ends by listing every file the database names that exists in neither
 * place — those pictures are broken today and stay broken.
 */

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

type Row = {
  filename?: string | null;
  prefix?: string | null;
  sizes?: Record<string, { filename?: string | null } | null> | null;
};

async function remoteSize(key: string): Promise<number | null> {
  try {
    const head = await storageClient().send(new HeadObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }));
    return head.ContentLength ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!STORAGE_ENABLED) {
    console.error("upload-media: STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY must be set in .env.");
    process.exit(1);
  }

  const payload = await getPayload({ config });
  const wanted = new Map<string, string | null | undefined>(); // filename → row prefix
  for (let page = 1; ; page++) {
    const res = await payload.find({ collection: "media", limit: 200, page, depth: 0, overrideAccess: true, pagination: true });
    for (const row of res.docs as unknown as Row[]) {
      if (row.filename) wanted.set(row.filename, row.prefix);
      for (const size of Object.values(row.sizes ?? {})) if (size?.filename) wanted.set(size.filename, row.prefix);
    }
    if (!res.hasNextPage) break;
  }

  let uploaded = 0;
  let already = 0;
  let bytes = 0;
  const missing: string[] = [];
  const failed: string[] = [];

  for (const [filename, prefix] of wanted) {
    const file = path.join(MEDIA_DIR, path.basename(filename));
    const key = mediaKey(filename, prefix);
    const size = fs.existsSync(file) ? (await fsp.stat(file)).size : null;
    const there = await remoteSize(key);

    if (size === null) {
      if (there === null) missing.push(filename);
      else already++;
      continue;
    }
    if (there === size) {
      already++;
      continue;
    }
    if (!dryRun) {
      try {
        await storageClient().send(
          new PutObjectCommand({
            Bucket: STORAGE_BUCKET,
            Key: key,
            Body: await fsp.readFile(file),
            ContentType: TYPES[path.extname(filename).toLowerCase()] ?? "application/octet-stream",
          }),
        );
      } catch (err) {
        failed.push(`${filename} (${err instanceof Error ? err.message : String(err)})`);
        continue;
      }
    }
    uploaded++;
    bytes += size;
  }

  const verb = dryRun ? "would upload" : "uploaded";
  console.log(
    `upload-media: ${wanted.size} files named by the library — ${verb} ${uploaded} (${(bytes / 1048576).toFixed(1)} MB), ${already} already in the bucket, ${missing.length} on neither disk nor bucket, ${failed.length} failed.`,
  );
  if (missing.length) console.log(`upload-media: not found anywhere: ${missing.join(", ")}`);
  if (failed.length) console.log(`upload-media: failed: ${failed.join(", ")}`);
  process.exit(failed.length ? 1 : 0);
}

// Top-level await: `payload run` exits as soon as the module has evaluated.
try {
  await main();
} catch (err) {
  console.error("upload-media: failed —", err instanceof Error ? err.message : err);
  process.exit(1);
}
