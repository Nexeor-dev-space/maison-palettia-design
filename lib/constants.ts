import type { ContactDetails, NavItem, SocialLink } from "@/types";

/** Canonical brand + site-wide identity values. */
export const SITE = {
  name: "Maison Palettia",
  legalName: "Maison Palettia Events L.L.C.",
  /** Shown in the header wordmark and footer. */
  tagline: "Art, craft and pottery workshops in Dubai",
  locale: "en_AE",
  /** TODO(client): replace with the production domain before launch. */
  url: "https://www.maisonpalettia.com",
} as const;

/** Primary navigation. Keep this list short — it is the whole site map. */
export const MAIN_NAV: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Workshops", href: "/workshops" },
  { label: "Gallery", href: "/gallery" },
  { label: "Journal", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

/**
 * Routes whose hero is a saturated colour field. The header inverts to a light
 * treatment over these until the page scrolls. Add a route here when its hero
 * lands on a dark ground.
 */
export const DARK_HERO_ROUTES: readonly string[] = ["/"];

/** The single primary call to action, reused in the header and footer. */
export const PRIMARY_CTA = {
  label: "Book a Workshop",
  href: "/workshops",
} as const;

export const LEGAL_NAV: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

/**
 * Homepage hero — a three-part composition read left to right:
 * painting → making → object.
 *
 * The panels abut as one continuous frame rather than three cards, so each
 * entry carries its own `position` (the CSS object-position for its crop)
 * alongside the source. Adjust `position` to re-frame a panel; never swap in
 * a differently-shaped file without re-checking the crop at every breakpoint.
 */
export interface HeroPanel {
  src: string;
  alt: string;
  /** CSS object-position for the editorial crop. */
  position: string;
  /** First frame, for the video panel: it holds the layout while the file loads. */
  poster?: string;
}

export const HERO_TRIPTYCH: {
  painting: HeroPanel;
  making: HeroPanel;
  ceramic: HeroPanel;
} = {
  painting: {
    src: "/images/hero/img-2.jpg",
    alt: "A watercolour study of red blooms rising through washes of blue and green.",
    position: "50% 46%",
  },
  making: {
    // Web encode of the master at public/videos/bg-video.mp4. The master is a
    // 4K, 27 Mbps, 30 MB file — an order of magnitude too heavy to sit in the
    // first paint of the homepage — so it stays in the repository as the
    // source of truth and this 1000px H.264 derivative (~2.4 MB, no audio,
    // faststart) is what ships. Re-run the encode if the master changes.
    src: "/videos/bg-video-web.mp4",
    alt: "Hands drawing a vessel up on the potter's wheel.",
    position: "50% 50%",
    poster: "/images/hero/making-poster.jpg",
  },
  ceramic: {
    src: "/images/hero/img-1.jpg",
    alt: "A hand-glazed stoneware vase holding pale lilies, on a wooden table.",
    position: "50% 58%",
  },
};

/** TODO(client): awaiting real address, email and phone number. */
export const CONTACT: ContactDetails = {
  addressLines: ["Dubai", "United Arab Emirates"],
  email: null,
  phone: null,
};

/** TODO(client): awaiting live social profile URLs. */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: null },
  { label: "Facebook", href: null },
];

/**
 * Brand introduction (homepage section 02).
 *
 * A still lifted from the master wheel footage at public/videos/bg-video.mp4
 * rather than a second shoot: the hero shows the wheel turning, and this holds
 * one moment of it still — the same hands, the same clay, read slowly. Cropped
 * to a 4:5 plate at 1600px, which is the largest it is ever rendered.
 */
export const BRAND_INTRO_IMAGE: HeroPanel = {
  src: "/images/about/hands-at-the-wheel.jpg",
  alt: "Two clay-covered hands cradling a stoneware vessel as it turns on the potter's wheel.",
  position: "50% 42%",
};

/** A photograph together with the small wall label that sits under it. */
export interface CaptionedImage extends HeroPanel {
  caption: string;
}

/**
 * Homepage section 04 — the experience.
 *
 * Three scales, three subjects: the room, the making, the material. All three
 * are cut from assets already in the project rather than shot separately —
 * the first two from the master wheel footage at public/videos/bg-video.mp4
 * (its background carries the only studio atmosphere the project holds), the
 * third from the watercolour used in the hero.
 *
 * TODO(client): this section is the one that most wants real workshop
 * photography — people at a table together, tools, someone else's hands. When
 * it arrives, replace these three and keep the shapes: 3:2, 4:5 and 1:1.
 */
export const EXPERIENCE_IMAGES: {
  studio: CaptionedImage;
  making: CaptionedImage;
  pigment: CaptionedImage;
} = {
  studio: {
    src: "/images/experience/studio-shelf.jpg",
    alt: "Hand-thrown, blue-glazed cups on a studio shelf against a painted brick wall, a clay-covered forearm in the foreground.",
    position: "50% 50%",
    caption: "Finished pieces, studio shelf",
  },
  making: {
    src: "/images/experience/pressing-the-wall.jpg",
    alt: "Clay-slick fingers pressing into the wall of a vessel as it turns, throwing rings running across the wet surface.",
    position: "50% 50%",
    caption: "Pressing the wall out",
  },
  pigment: {
    src: "/images/experience/pigment-on-paper.jpg",
    alt: "A close view of watercolour pigment bleeding into the grain of the paper, red blooms over washes of blue and green.",
    position: "50% 50%",
    caption: "Pigment, still wet",
  },
};
