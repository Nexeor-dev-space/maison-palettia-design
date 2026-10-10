import Image from "next/image";
import type { Payload, ServerProps } from "payload";
import React from "react";

import { hasGlobal } from "@/cms/lib/publicUrl";

/**
 * ==========================================================================
 * Admin Logo — the brand mark on the login screen (SPEC §I "Branding")
 * ==========================================================================
 *
 * Reads the logo an admin uploaded in Settings → Site details so the admin
 * wears the same mark as the site, and falls back to the file shipped in
 * public/ until then (the lilac cut: the admin theme is light, SPEC §A.4).
 * Server component: `payload` arrives as a prop, no client fetch, no flash
 * of the wrong logo. Rendered `unoptimized` because uploads are served by
 * Payload at `/api/media/file/*` and the optimizer adds nothing for a
 * 220 px mark shown once.
 *
 * The companion `Icon` (./Icon.tsx) is the small square mark in the nav.
 */

export type BrandImage = { src: string; width: number; height: number; alt: string };

const FALLBACK_LOGO: BrandImage = { src: "/images/scroll-logo.png", width: 1120, height: 466, alt: "Maison Palettia" };
const FALLBACK_ICON: BrandImage = { src: "/brand/p-mark.svg", width: 64, height: 64, alt: "Maison Palettia" };

type UploadDoc = { url?: string | null; width?: number | null; height?: number | null; alt?: string | null } | string | null | undefined;

/**
 * Resolves `site-settings.<field>` to a renderable image, or the fallback.
 * Tolerant of every early state: no global yet (1C still writing), no table
 * yet (not migrated), no row yet (nothing saved), an id without population.
 */
export async function brandImage(payload: Payload, field: "logoOnLight" | "logoOnDark" | "monogram", fallback: BrandImage): Promise<BrandImage> {
  if (!hasGlobal(payload, "site-settings")) return fallback;
  try {
    const settings = (await payload.findGlobal({
      slug: "site-settings",
      depth: 1,
      overrideAccess: true,
      select: { [field]: true },
    })) as unknown as Record<string, UploadDoc>;
    const upload = settings?.[field];
    if (!upload || typeof upload === "string" || !upload.url) return fallback;
    return {
      src: upload.url,
      width: upload.width ?? fallback.width,
      height: upload.height ?? fallback.height,
      alt: upload.alt?.trim() || fallback.alt,
    };
  } catch {
    return fallback;
  }
}

export { FALLBACK_ICON, FALLBACK_LOGO };

export async function Logo({ payload }: ServerProps) {
  const image = await brandImage(payload, "logoOnLight", FALLBACK_LOGO);
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      unoptimized
      priority
      className="mp-admin-logo"
      style={{ width: "min(220px, 70vw)", height: "auto" }}
    />
  );
}
