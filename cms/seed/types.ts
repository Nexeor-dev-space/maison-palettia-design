/**
 * ==========================================================================
 * Seed record shapes — what cms/seed/strings/* hold before they are written
 * ==========================================================================
 *
 * Close to the CMS documents, with two differences: pictures are given as a
 * path under `public/` ("images/experiences/CANDLE_MAKING.jpg") and related
 * documents by slug ("times-square-center"). The writers in
 * cms/seed/content.ts resolve both to ids once media and the referenced
 * documents exist, which keeps the strings files readable and diffable
 * against lib/*.ts.
 */

/** A file under public/, e.g. "images/logo.png". */
export type PublicPath = string;

export interface ExperienceSeed {
  name: string;
  slug: string;
  kind: "diy" | "scheduled";
  description?: string;
  about: string[];
  image?: PublicPath;
  gallery: PublicPath[];
  status?: string;
  privateEventEligible: boolean;
  order: number;
}

export interface SessionSeed {
  /** Experience slug. */
  experience: string;
  title: string;
  category: string;
  /** ISO 8601 with the studio's +04:00 offset, as lib/workshops.ts wrote it. */
  startsAt: string;
  durationMinutes: number;
  /** Venue slug. */
  venue?: string;
  priceFils: number;
  seatsTotal: number;
  /** The old workshop status: open | waitlist | fully-booked. */
  status: string;
  excerpt?: string;
  image?: PublicPath;
}

export interface VenueSeed {
  name: string;
  slug: string;
  locality: string;
  status: "current" | "upcoming" | "past";
  descriptor: string;
  eventDescriptor?: string;
  locationHref?: string;
  order: number;
}

export interface VibeSeed {
  label: string;
  slug: string;
  blurb: string;
  order: number;
}

export interface ProgrammeSeed {
  name: string;
  slug: string;
  description: string;
  lead?: string;
  image?: PublicPath;
  mark?: { name: string; color?: string };
  inPrivateEventsMenu: boolean;
  tone: string;
  order: number;
}

export type PolicyBlockSeed =
  | { blockType: "text"; body: string }
  | { blockType: "list"; items: Array<{ text: string }> }
  | { blockType: "ages"; source: "diy" | "workshop" | "custom"; rows: Array<{ activity: string; guidance: string }> }
  | { blockType: "callout"; title: string; body: string };

export interface PolicySeed {
  title: string;
  navLabel: string;
  slug: string;
  summary: string;
  sections: Array<{ heading: string; blocks: PolicyBlockSeed[] }>;
  order: number;
}

export interface FaqSeed {
  question: string;
  group: "coming" | "booking" | "groups";
  answerSource: "text" | "bookingTerms";
  /** Plain text; wrapped in one Lexical paragraph when written. */
  answer?: string;
  showOnHomepage: boolean;
  order: number;
}

export interface PassSeed {
  name: string;
  slug: string;
  description: string;
  priceFils?: number;
  sessions?: number;
  validityDays?: number;
  validityLabel?: string;
  benefits: string[];
  image?: PublicPath;
  /** The pass's own wording for the photograph, when it differs from the Media record's alt. */
  imageAlt?: string;
  order: number;
}

/** A button as the blocks and globals store it (cms/fields/cta.ts). */
export interface CtaSeed {
  label: string;
  link: LinkSeed;
}

/** cms/fields/link.ts — internal paths keep their anchor apart. */
export interface LinkSeed {
  type: "internal" | "external";
  url: string;
  anchor?: string;
  newTab?: boolean;
}

/** SEO for one page, in the shape lib/seo.ts buildMetadata() takes today. */
export interface SeoSeed {
  title?: string;
  description?: string;
  noindex?: boolean;
}
