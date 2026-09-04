/** A single entry in the primary or footer navigation. */
export interface NavItem {
  label: string;
  href: string;
  /** Set for links that leave the site so the UI can flag them. */
  external?: boolean;
}

/** A grouped column of links in the footer. */
export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * A social profile. `href` stays null until the client supplies real accounts.
 * No icon field: lucide-react v1 removed brand marks, so official Instagram /
 * Facebook glyphs need to be added as dedicated SVG assets during polish.
 */
export interface SocialLink {
  label: string;
  href: string | null;
}

/** Business contact details supplied by the client. */
export interface ContactDetails {
  addressLines: string[];
  email: string | null;
  phone: string | null;
}

/** Per-page SEO overrides passed to `buildMetadata`. */
export interface PageSeo {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/workshops". */
  path: string;
  /** Path to an Open Graph image inside /public. */
  image?: string;
}
