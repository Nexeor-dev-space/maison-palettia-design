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

/** The single primary call to action, reused in the header and footer. */
export const PRIMARY_CTA = {
  label: "Book a Workshop",
  href: "/workshops",
} as const;

export const LEGAL_NAV: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

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
