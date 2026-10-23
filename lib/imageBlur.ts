import type { CSSProperties } from "react";

import type { ImageBlur } from "@/types";

/**
 * A media document's blurred stand-in as the site's `ImageBlur`, or nothing
 * when it has none (a transparent logo, or a file from before the field).
 */
export function blurOf(media: { blurDataURL?: string | null; width?: number | null; height?: number | null }): ImageBlur | undefined {
  if (!media.blurDataURL || !media.width || !media.height) return undefined;
  return { src: media.blurDataURL, aspect: media.width / media.height };
}

/*
  THE GAUSSIAN BLUR IS DRAWN BY SVG, NOT BY CSS `filter`. A CSS blur
  feathers the element's own edges into whatever is behind it; this filter
  (the one next/image uses for its own placeholder) blurs the picture and
  then restores full opacity right up to the edge, so the stand-in fills its
  frame as solidly as the photograph that replaces it. The 16px source is
  stretched to the picture's aspect and blurred across it, which reads as a
  soft wash of the photograph's own colours rather than a grid of pixels.
*/
const VIEW_WIDTH = 400;
const DEVIATION = 18;

function blurSvg(blur: ImageBlur): string {
  const height = Math.max(1, Math.round(VIEW_WIDTH / blur.aspect));
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${VIEW_WIDTH} ${height}'>` +
    `<filter id='b' color-interpolation-filters='sRGB'>` +
    `<feGaussianBlur stdDeviation='${DEVIATION}'/>` +
    `<feColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/>` +
    `<feFlood x='0' y='0' width='100%' height='100%'/>` +
    `<feComposite operator='out' in='s'/>` +
    `<feComposite in2='SourceGraphic'/>` +
    `<feGaussianBlur stdDeviation='${DEVIATION}'/>` +
    `</filter>` +
    `<image width='100%' height='100%' x='0' y='0' preserveAspectRatio='none' style='filter:url(#b)' href='${blur.src}'/>` +
    `</svg>`
  );
}

/** The stand-in as a CSS background `url(…)`, ready for `background-image`. */
export function blurImage(blur: ImageBlur): string {
  return `url("data:image/svg+xml,${encodeURIComponent(blurSvg(blur))}")`;
}

/** Styles for an element that shows the stand-in, cropped like an `object-fit: cover` photograph. */
export function blurBackground(blur: ImageBlur, position = "50% 50%"): CSSProperties {
  return {
    backgroundImage: blurImage(blur),
    backgroundSize: "cover",
    backgroundPosition: position,
    backgroundRepeat: "no-repeat",
  };
}
