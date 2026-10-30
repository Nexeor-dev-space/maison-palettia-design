import { readFile } from "node:fs/promises";
import path from "node:path";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { MEDIA_DIR } from "@/cms/lib/paths";

/**
 * ==========================================================================
 * Object storage for the media library (MinIO, S3-compatible)
 * ==========================================================================
 *
 * The `media` collection's files — originals and every generated size —
 * live in a MinIO bucket instead of `<repo>/media/`. Payload still serves
 * them at `/api/media/file/<filename>` (the storage plugin's handler streams
 * the object), so URLs in the database, the mappers and `next/image` do not
 * change. Only the bytes moved.
 *
 * The endpoint and bucket are not secrets and sit here, as the bucket host
 * does in next.config.ts. The two credentials are `STORAGE_ACCESS_KEY` and
 * `STORAGE_SECRET_KEY` in `.env`: the storage plugin is built when the config
 * loads, before the database is reachable, so they cannot be admin settings.
 * Without both keys the plugin is off and the collection falls back to the
 * disk folder, which keeps `next build` and CI working with no credentials.
 */

export const STORAGE_ENDPOINT = "https://api.staging-obj-blob.client2.nexeor.com";
export const STORAGE_BUCKET = "maison-palettia";
/** Folder inside the bucket, so uploads sit beside — not among — the committed `public/images/…` copies. */
export const MEDIA_PREFIX = "media";

const accessKeyId = process.env.STORAGE_ACCESS_KEY ?? "";
const secretAccessKey = process.env.STORAGE_SECRET_KEY ?? "";

export const STORAGE_ENABLED = Boolean(accessKeyId && secretAccessKey);

export const S3_CLIENT_CONFIG = {
  endpoint: STORAGE_ENDPOINT,
  region: "us-east-1", // MinIO ignores it; the SDK insists on one
  forcePathStyle: true, // MinIO is addressed as host/bucket/key, not bucket.host
  credentials: { accessKeyId, secretAccessKey },
} as const;

let client: S3Client | undefined;
export function storageClient(): S3Client {
  client ??= new S3Client(S3_CLIENT_CONFIG);
  return client;
}

/** The object key of a media file: `media/<filename>`, or under the row's own `prefix` when it has one. */
export function mediaKey(filename: string, prefix?: string | null): string {
  return path.posix.join(prefix || MEDIA_PREFIX, path.posix.basename(filename));
}

/**
 * The bytes of a library file, or null when it cannot be read. Disk first
 * (a checkout that still has `media/`, and storage switched off), then the
 * bucket. Only the file's basename is used, so a crafted name cannot reach
 * outside the folder or the prefix.
 */
export async function readMediaFile(filename: string, prefix?: string | null): Promise<Buffer | null> {
  const name = path.basename(filename);
  try {
    return await readFile(path.join(MEDIA_DIR, name));
  } catch {
    // not on disk — fall through to the bucket
  }
  if (!STORAGE_ENABLED) return null;
  try {
    const object = await storageClient().send(new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: mediaKey(name, prefix) }));
    return object.Body ? Buffer.from(await object.Body.transformToByteArray()) : null;
  } catch {
    return null;
  }
}
