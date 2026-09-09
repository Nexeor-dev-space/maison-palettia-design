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

/**
 * A photograph as it is stored beside the content it belongs to.
 * `position` is the CSS object-position for the editorial crop; leave it out
 * and the image is centred.
 */
export interface ImageAsset {
  src: string;
  alt: string;
  position?: string;
}

/** A money amount, kept numeric so the currency can be formatted per locale. */
export interface Price {
  amount: number;
  /** ISO 4217, e.g. "AED". */
  currency: string;
}

/**
 * Booking state as the CMS reports it. Seat counts alone are not enough — a
 * session can be closed to new bookings while seats technically remain.
 */
export type WorkshopStatus = "open" | "waitlist" | "fully-booked";

/**
 * One scheduled workshop session.
 *
 * Shaped for a CMS: every field is data the studio would edit, nothing here
 * describes presentation. The components decide what to show and how.
 */
export interface Workshop {
  /** URL segment — the detail page lives at /workshops/{slug}. */
  slug: string;
  title: string;
  /**
   * Free text rather than a union: the studio adds new strands over time and
   * should not need a code change to do it.
   */
  category: string;
  /** ISO 8601 with the studio's offset, e.g. "2026-10-03T10:00:00+04:00". */
  startsAt: string;
  durationMinutes: number;
  price: Price;
  seatsTotal: number;
  seatsAvailable: number;
  status: WorkshopStatus;
  /** One or two sentences. Long-form copy belongs on the detail page. */
  excerpt: string;
  image: ImageAsset;
}
