import type { Metadata } from "next";

import { SITE } from "@/lib/constants";
import type { PageSeo } from "@/types";

/** Fallback Open Graph image. TODO(client): supply branded 1200x630 artwork. */
const DEFAULT_OG_IMAGE = "/images/brand/og-default.jpg";

/**
 * Site-wide metadata defaults. Individual pages override title/description
 * and canonical URL through `buildMetadata`.
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.tagline,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: SITE.name,
    description: SITE.tagline,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

/** Build per-page metadata without repeating the shared defaults. */
export function buildMetadata({ title, description, path, image }: PageSeo): Metadata {
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description,
      url: path,
      images: [{ url: ogImage }],
    },
    twitter: {
      title: `${title} · ${SITE.name}`,
      description,
      images: [ogImage],
    },
  };
}
