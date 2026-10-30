import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { readMediaFile } from "@/cms/lib/storage";

/** The file behind a card's `src`, or null when it cannot be read. */
async function readSource(src: string): Promise<Buffer | null> {
  try {
    const clean = src.split(/[?#]/)[0];
    if (clean.startsWith("/api/media/file/")) return await readMediaFile(decodeURIComponent(clean));
    return await readFile(path.join(process.cwd(), "public", path.normalize(clean).replace(/^(\.\.[/\\])+/, "")));
  } catch {
    return null;
  }
}

/**
 * ==========================================================================
 * A picture for a share card, as a data URI Satori can draw (SPEC §G.2)
 * ==========================================================================
 *
 * The generated share cards (the brand card, an event's, a programme's, a
 * journal story's) draw with `next/og`, and Satori draws only what it is handed:
 * it cannot fetch a root-relative URL from a server that, at build time, is
 * not running — and it cannot decode WebP, which is what the Media
 * collection's generated sizes are. So the bytes are read directly and
 * re-encoded here:
 *
 *   · `/api/media/file/<name>` (an upload) → the media bucket, or `media/<name>`
 *     on the persistent disk when storage is off (cms/lib/storage.ts). Only
 *     the file's basename is used, so a crafted URL cannot reach outside it.
 *   · any other root-relative path → `public/<path>`, the committed files the
 *     cards used before the CMS (and still use until the seed has run).
 *
 * Re-encoded as JPEG (or PNG when `keepAlpha`, for a logo on a coloured
 * card) at no more than `width` pixels, which also keeps a 6000-pixel
 * original out of the card's HTML.
 */
export async function imageDataUri(src: string, opts: { width?: number; keepAlpha?: boolean } = {}): Promise<string | null> {
  const { width = 900, keepAlpha = false } = opts;
  const bytes = await readSource(src);
  if (!bytes) return null;
  try {
    const image = sharp(bytes).resize({ width, withoutEnlargement: true });
    const out = keepAlpha ? await image.png().toBuffer() : await image.jpeg({ quality: 82 }).toBuffer();
    return `data:image/${keepAlpha ? "png" : "jpeg"};base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

/** A mark recoloured to one ink, trimmed to its lettering — see {@link tintedImageDataUri}. */
export interface TintedImage {
  src: string;
  width: number;
  height: number;
}

/*
  Keyed by the SHA-1 of the source bytes plus the ink and height, so the
  cache can never serve a replaced logo: a new upload is new bytes. Small and
  bounded — there are two logo cuts and a handful of sizes, not a stream.
*/
const tinted = new Map<string, TintedImage>();

/**
 * The logo for the light share cards: the file's alpha channel, filled with
 * one ink (`colour`, a #rrggbb hex) and trimmed to the lettering, as a PNG
 * data URI `height` pixels tall.
 *
 * WHY TINT RATHER THAN USE THE FILE AS IT IS. The cards are drawn on White
 * Rock, and the mark must read as Deep Lilac there whichever cut Site details
 * holds — the admin can replace either file, and only the alpha (the shape of
 * the lettering) is the client's artwork; the ink is the ground's decision
 * (see BRAND_LOGO in lib/constants.ts). Trimmed so the card can place the
 * letters themselves rather than the file's transparent margin.
 *
 * Read per render, as `imageDataUri` is, so a replaced logo reaches the card
 * on its next revalidation; the work is cached by the bytes' hash.
 */
export async function tintedImageDataUri(src: string, colour: string, height: number): Promise<TintedImage | null> {
  const bytes = await readSource(src);
  if (!bytes) return null;
  const key = `${createHash("sha1").update(bytes).digest("hex")}:${colour}:${height}`;
  const hit = tinted.get(key);
  if (hit) return hit;
  try {
    const { data: alpha, info } = await sharp(bytes)
      .ensureAlpha()
      .trim({ threshold: 1 })
      .resize({ height, withoutEnlargement: false })
      .extractChannel("alpha")
      .raw()
      .toBuffer({ resolveWithObject: true });
    const png = await sharp({ create: { width: info.width, height: info.height, channels: 3, background: colour } })
      .joinChannel(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
      .png()
      .toBuffer();
    const out = { src: `data:image/png;base64,${png.toString("base64")}`, width: info.width, height: info.height };
    if (tinted.size > 16) tinted.clear();
    tinted.set(key, out);
    return out;
  } catch {
    return null;
  }
}
