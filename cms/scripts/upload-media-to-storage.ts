import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import pg from "pg";
import sharp, { type ResizeOptions, type Sharp } from "sharp";

import { Media } from "@/cms/collections/system/Media";
import { MEDIA_DIR, PROJECT_ROOT } from "@/cms/lib/paths";
import { mediaKey, STORAGE_BUCKET, STORAGE_ENABLED, storageClient } from "@/cms/lib/storage";
import { storedFilename } from "@/cms/seed/media";
import { MEDIA } from "@/cms/seed/strings/media";

/**
 * ==========================================================================
 * upload-media-to-storage — put the media library in the bucket
 * ==========================================================================
 *
 *   npx payload run cms/scripts/upload-media-to-storage.ts   (DRY_RUN=1 to only report)
 *
 * Needs STORAGE_ACCESS_KEY / STORAGE_SECRET_KEY in .env. For every row in the
 * library it puts the original and each generated size at `media/<filename>`
 * — the same names the rows already hold, so no row changes. It READS the
 * database (plain SQL, so it runs before the storage migration) and never
 * writes to it.
 *
 * WHERE EACH FILE COMES FROM, first hit wins:
 *   1. `media/<filename>` on this disk (the server, or a restored copy);
 *   2. a seeded photo's original — `public/<path>` in the checkout, else the
 *      bucket's `public/<path>` copy (the committed originals were moved
 *      there), the same bytes cms/seed/strings/media.ts names;
 *   3. a size that is on neither is generated from the original with the
 *      collection's own `imageSizes` and Payload's resize rules (focal point
 *      included), then its width and height are checked against the row.
 *
 * Safe to run again: an object already in the bucket is skipped (originals
 * only when the size matches). Nothing is deleted, anywhere.
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

type SizeDef = {
  name: string;
  width?: number;
  height?: number;
  position?: string;
  fit?: string;
  withoutEnlargement?: boolean;
  formatOptions?: { format: Parameters<Sharp["toFormat"]>[0]; options?: Parameters<Sharp["toFormat"]>[1] };
};

type Row = {
  id: string;
  filename: string;
  mime_type: string | null;
  focal_x: number | null;
  focal_y: number | null;
  [column: string]: unknown;
};

const SIZE_DEFS = ((Media.upload as { imageSizes?: SizeDef[] }).imageSizes ?? []) as SizeDef[];
const SOURCES = new Map(MEDIA.map((seed) => [storedFilename(seed.path), seed.path]));

const contentType = (name: string) => TYPES[path.extname(name).toLowerCase()] ?? "application/octet-stream";

async function remoteSize(key: string): Promise<number | null> {
  try {
    const head = await storageClient().send(new HeadObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }));
    return head.ContentLength ?? null;
  } catch {
    return null;
  }
}

async function remoteBytes(key: string): Promise<Buffer | null> {
  try {
    const object = await storageClient().send(new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }));
    return object.Body ? Buffer.from(await object.Body.transformToByteArray()) : null;
  } catch {
    return null;
  }
}

/** The original's bytes: this disk, then the seed's source file, then its bucket copy. */
async function originalBytes(filename: string): Promise<Buffer | null> {
  const onDisk = path.join(MEDIA_DIR, filename);
  if (fs.existsSync(onDisk)) return fsp.readFile(onDisk);
  const source = SOURCES.get(filename);
  if (!source) return null;
  const inCheckout = path.join(PROJECT_ROOT, "public", source);
  if (fs.existsSync(inCheckout)) return fsp.readFile(inCheckout);
  return remoteBytes(path.posix.join("public", source));
}

/** Payload's decision (uploads/image-resizing/getImageResizeAction) for a size the config sets only as it is here. */
function action(original: { width: number; height: number }, def: SizeDef): "omit" | "resize" | "focal" {
  const { width: tw, height: th, withoutEnlargement, fit } = def;
  if (tw && th) {
    if (withoutEnlargement === undefined && original.width < tw && original.height < th) return "omit";
  } else if (withoutEnlargement === undefined) {
    if ((tw && original.width < tw) || (th && original.height < th)) return "omit";
  }
  if (fit === "contain" || fit === "inside") return "resize";
  if (!tw || !th) return "resize";
  if (original.width / original.height === tw / th) return "resize";
  const smaller = original.width < tw || original.height < th;
  if (withoutEnlargement && smaller) return "resize";
  return "focal";
}

/** One rendition, built the way Payload builds it (uploads/image-resizing/createImageSizes). */
async function rendition(original: Buffer, def: SizeDef, focal: { x: number; y: number }): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  const base = sharp(original, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const flipped = [5, 6, 7, 8].includes(meta.orientation ?? 1);
  const dims = { width: (flipped ? meta.height : meta.width) ?? 0, height: (flipped ? meta.width : meta.height) ?? 0 };
  const how = action(dims, def);
  if (how === "omit") return null;

  let out = base.clone();
  if (how === "focal") {
    let rh = def.height;
    let rw = def.width;
    const ratio = dims.width / dims.height;
    if (rh && !rw) rw = Math.round(rh * ratio);
    if (rw && !rh) rh = Math.round(rw / ratio);
    rh ||= meta.height;
    rw ||= meta.width;
    const prioritizeHeight = rw! / rh! < ratio;
    out = out.resize({ fastShrinkOnLoad: false, height: prioritizeHeight ? rh : undefined, width: prioritizeHeight ? undefined : rw });
    const { info } = await out.toBuffer({ resolveWithObject: true });
    const left = Math.max(0, Math.min(info.width - rw!, info.width * (focal.x / 100) - rw! / 2));
    const top = Math.max(0, Math.min(info.height - rh!, info.height * (focal.y / 100) - rh! / 2));
    out = out.extract({ height: rh!, left: Math.floor(left), top: Math.floor(top), width: rw! });
  } else {
    out = out.resize({ width: def.width, height: def.height, position: def.position, fit: def.fit, withoutEnlargement: def.withoutEnlargement } as ResizeOptions);
  }
  if (def.formatOptions) out = out.toFormat(def.formatOptions.format, def.formatOptions.options);
  const { data, info } = await out.toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

async function main() {
  // `payload run` does not pass flags through to the script, so DRY_RUN=1 is the reliable switch.
  const dryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";
  if (!STORAGE_ENABLED) {
    console.error("upload-media: STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY must be set in .env.");
    process.exit(1);
  }
  // 26–30 MP originals: one decode at a time, nothing cached (see restore-media).
  sharp.concurrency(1);
  sharp.cache(false);

  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const { rows } = await db.query<Row>("select * from media order by created_at");
  await db.end();

  let uploaded = 0;
  let already = 0;
  let bytes = 0;
  const missing: string[] = [];
  const failed: string[] = [];
  const mismatched: string[] = [];

  const put = async (key: string, name: string, body: Buffer) => {
    if (!dryRun) await storageClient().send(new PutObjectCommand({ Bucket: STORAGE_BUCKET, Key: key, Body: body, ContentType: contentType(name) }));
    uploaded++;
    bytes += body.length;
  };

  for (const row of rows) {
    const original = row.filename;
    let source: Buffer | null | undefined; // loaded once, only if something has to be uploaded or generated
    try {
      const key = mediaKey(original);
      const there = await remoteSize(key);
      const diskPath = path.join(MEDIA_DIR, original);
      const diskSize = fs.existsSync(diskPath) ? (await fsp.stat(diskPath)).size : null;
      if (there !== null && (diskSize === null || there === diskSize)) already++;
      else {
        source = await originalBytes(original);
        if (!source) {
          missing.push(original);
          continue;
        }
        await put(key, original, source);
      }

      for (const def of SIZE_DEFS) {
        const name = row[`sizes_${def.name}_filename`];
        if (typeof name !== "string" || !name) continue;
        const sizeKey = mediaKey(name);
        if ((await remoteSize(sizeKey)) !== null) {
          already++;
          continue;
        }
        const onDisk = path.join(MEDIA_DIR, name);
        if (fs.existsSync(onDisk)) {
          await put(sizeKey, name, await fsp.readFile(onDisk));
          continue;
        }
        source ??= await originalBytes(original);
        if (!source) {
          missing.push(name);
          continue;
        }
        const made = await rendition(source, def, { x: Number(row.focal_x ?? 50), y: Number(row.focal_y ?? 50) });
        if (!made) {
          missing.push(`${name} (config now omits this size)`);
          continue;
        }
        const wantW = Number(row[`sizes_${def.name}_width`]);
        const wantH = Number(row[`sizes_${def.name}_height`]);
        if (made.width !== wantW || made.height !== wantH) mismatched.push(`${name}: made ${made.width}×${made.height}, row says ${wantW}×${wantH}`);
        await put(sizeKey, name, made.buffer);
      }
    } catch (err) {
      failed.push(`${original} (${err instanceof Error ? err.message : String(err)})`);
    }
  }

  const verb = dryRun ? "would upload" : "uploaded";
  console.log(
    `upload-media: ${rows.length} library rows — ${verb} ${uploaded} files (${(bytes / 1048576).toFixed(1)} MB), ${already} already in the bucket, ${missing.length} with no source, ${mismatched.length} with different dimensions, ${failed.length} failed.`,
  );
  if (missing.length) console.log(`upload-media: no source for: ${missing.join(", ")}`);
  if (mismatched.length) console.log(`upload-media: dimensions differ from the row:\n  ${mismatched.join("\n  ")}`);
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
