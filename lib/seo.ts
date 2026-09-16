import type { Metadata } from "next";

import { SITE } from "@/lib/constants";
import type { PageSeo } from "@/types";

/**
 * Fallback Open Graph image — deliberately absent, not merely unset.
 *
 * This pointed at "/images/brand/og-default.jpg", which does not exist:
 * public/images/brand/ holds a .gitkeep and nothing else. So every page on the
 * site advertised a share image that 404s, and every link shared to WhatsApp,
 * Instagram, Slack or iMessage rendered with a broken preview. A URL that
 * resolves to nothing is worse than no URL at all — the absent field lets a
 * platform fall back to its own heuristics, while a dead one does not.
 *
 * TODO(client): supply branded 1200x630 artwork, drop it at
 * public/images/brand/og-default.jpg, and set this back to that path. Every
 * page picks it up with no further change.
 */
const DEFAULT_OG_IMAGE: string | null = null;

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

  /*
    The image fields are OMITTED when there is no artwork, not set to null.

    `images: [{ url: null }]` serialises to an og:image tag pointing at
    nothing, which is the failure this is fixing rather than a smaller version
    of it. Spreading a conditional object leaves the key absent entirely, and
    a platform with no og:image falls back to its own heuristics — a page with
    a broken one has nothing to fall back to.
  */
  const imageFields = ogImage ? { images: [{ url: ogImage }] } : {};
  const twitterImageFields = ogImage ? { images: [ogImage] } : {};

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description,
      url: path,
      ...imageFields,
    },
    twitter: {
      title: `${title} · ${SITE.name}`,
      description,
      ...twitterImageFields,
    },
  };
}
