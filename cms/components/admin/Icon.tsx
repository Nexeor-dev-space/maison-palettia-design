import Image from "next/image";
import type { ServerProps } from "payload";
import React from "react";

import { brandImage, FALLBACK_ICON } from "./Logo";

/**
 * The small square mark at the top of the admin navigation. Reads
 * `site-settings.monogram` (the P-mark) and falls back to the SVG in
 * public/brand/. See ./Logo.tsx for the reasoning on server rendering.
 */
export async function Icon({ payload }: ServerProps) {
  const image = await brandImage(payload, "monogram", FALLBACK_ICON);
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      unoptimized
      className="mp-admin-icon"
      style={{ width: 28, height: 28, objectFit: "contain" }}
    />
  );
}
