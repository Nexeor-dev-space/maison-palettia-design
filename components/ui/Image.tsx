import NextImage, { type ImageProps } from "next/image";

import { blurBackground } from "@/lib/imageBlur";
import type { ImageBlur } from "@/types";

/**
 * ==========================================================================
 * `next/image` with a blurred stand-in — a frame is never empty
 * ==========================================================================
 *
 * Every photograph on the site goes through here instead of `next/image`.
 * Given the picture's `blur` (see cms/lib/blurPlaceholder.ts):
 *
 *   `fill` .... the usual case: a photograph filling a frame. A layer is
 *               laid down first, inside the same frame, with the blur drawn
 *               across it — it is in the page's own HTML, so it is there with
 *               the first paint, clipped and rounded exactly like the photo.
 *               The photograph sits over it, transparent until it has loaded
 *               AND decoded, then fades in (`data-blur` + the script in the
 *               site layout + globals.css). On a fast connection that can be
 *               almost at once; on a slow one the blur holds the space.
 *
 *   sized ..... an image with its own width and height has no frame to lay
 *               a layer in, so it takes next/image's own blur placeholder:
 *               the same stand-in, swapped for the photo when it arrives.
 *
 * Without a `blur` it is next/image, untouched. A server component can use it
 * as freely as a client one: it holds no state and passes no functions.
 */
export type { ImageProps };

export default function Image({ blur, ...props }: ImageProps & { blur?: ImageBlur | null }) {
  if (!blur) return <NextImage {...props} />;
  if (!props.fill) return <NextImage placeholder="blur" blurDataURL={blur.src} {...props} />;

  const position = typeof props.style?.objectPosition === "string" ? props.style.objectPosition : undefined;
  return (
    <>
      <span aria-hidden data-blur-layer="" className="pointer-events-none absolute inset-0" style={blurBackground(blur, position)} />
      {/* `key` so a new picture in the same slot fades in too, not just the first. */}
      <NextImage key={String(props.src)} data-blur="" suppressHydrationWarning {...props} />
    </>
  );
}
