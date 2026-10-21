import sharp from "sharp";

/**
 * ==========================================================================
 * The blurred stand-in a photograph shows while it loads
 * ==========================================================================
 *
 * A 16px WebP of the picture, as a data URL — a few hundred bytes, so it can
 * travel inside the page itself and be on screen with the first paint, before
 * a single image request has gone out. <Image> (components/ui/Image.tsx)
 * draws it behind the photograph through an SVG Gaussian blur, and the real
 * file fades in over it once decoded: a frame is never empty.
 *
 * ONLY FOR OPAQUE PICTURES. A logo or a cut-out on transparency would show
 * the blur through its clear parts for good, so anything with real
 * transparency gets none (`null`) and is drawn exactly as before.
 *
 * Stored on the media document (`blurDataURL`): made by a hook on every new
 * upload (cms/collections/system/Media.ts), and for files that predate the
 * field by cms/scripts/backfill-blur.ts and the startup restore.
 */

/** The upload types a placeholder is made for. SVG, video and fonts are not pictures to blur. */
export const BLURRABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function blurPlaceholder(input: Buffer | string): Promise<string | null> {
  const image = sharp(input, { failOn: "none", animated: false });
  const { isOpaque } = await image.clone().stats();
  if (!isOpaque) return null;
  const tiny = await image.resize(16, 16, { fit: "inside" }).webp({ quality: 50 }).toBuffer();
  return `data:image/webp;base64,${tiny.toString("base64")}`;
}
