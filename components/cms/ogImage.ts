import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { MEDIA_DIR } from "@/cms/lib/paths";

/**
 * ==========================================================================
 * A picture for a share card, as a data URI Satori can draw (SPEC §G.2)
 * ==========================================================================
 *
 * The three generated share cards (the brand card, an event's, a
 * programme's) draw with `next/og`, and Satori draws only what it is handed:
 * it cannot fetch a root-relative URL from a server that, at build time, is
 * not running — and it cannot decode WebP, which is what the Media
 * collection's generated sizes are. So the bytes are read from disk and
 * re-encoded here:
 *
 *   · `/api/media/file/<name>` (an upload) → `media/<name>` on the persistent
 *     disk (cms/lib/paths.ts — never the build output). Only the file's
 *     basename is used, so a crafted URL cannot reach outside `media/`.
 *   · any other root-relative path → `public/<path>`, the committed files the
 *     cards used before the CMS (and still use until the seed has run).
 *
 * Re-encoded as JPEG (or PNG when `keepAlpha`, for a logo on a coloured
 * card) at no more than `width` pixels, which also keeps a 6000-pixel
 * original out of the card's HTML.
 */
export async function imageDataUri(src: string, opts: { width?: number; keepAlpha?: boolean } = {}): Promise<string | null> {
  const { width = 900, keepAlpha = false } = opts;
  try {
    const clean = src.split(/[?#]/)[0];
    const file = clean.startsWith("/api/media/file/")
      ? path.join(MEDIA_DIR, path.basename(decodeURIComponent(clean)))
      : path.join(process.cwd(), "public", path.normalize(clean).replace(/^(\.\.[/\\])+/, ""));
    const bytes = await readFile(file);
    const image = sharp(bytes).resize({ width, withoutEnlargement: true });
    const out = keepAlpha ? await image.png().toBuffer() : await image.jpeg({ quality: 82 }).toBuffer();
    return `data:image/${keepAlpha ? "png" : "jpeg"};base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}
