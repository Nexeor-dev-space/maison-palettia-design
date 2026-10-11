import type { CollectionConfig } from "payload";

import { Experiences } from "./Experiences";
import { Faqs } from "./Faqs";
import { Pages } from "./Pages";
import { Passes } from "./Passes";
import { Policies } from "./Policies";
import { PostCategories } from "./PostCategories";
import { Posts } from "./Posts";
import { Programmes } from "./Programmes";
import { Redirects } from "./Redirects";
import { SessionInventory } from "./SessionInventory";
import { Sessions } from "./Sessions";
import { Testimonials } from "./Testimonials";
import { Venues } from "./Venues";
import { Vibes } from "./Vibes";

export { Experiences, EXPERIENCE_KINDS } from "./Experiences";
export { Faqs } from "./Faqs";
export { FIXED_PAGE_SLUGS, isFixedPageSlug, Pages, type FixedPageSlug } from "./Pages";
export { Passes } from "./Passes";
export { Policies, policyBlocks } from "./Policies";
export { PostCategories } from "./PostCategories";
export { journalEditor, Posts } from "./Posts";
export { DOODLE_NAMES, DOODLE_OPTIONS, MARK_INKS, PROGRAMME_TONES, Programmes } from "./Programmes";
export { REDIRECT_FROM, REDIRECT_TO, Redirects } from "./Redirects";
export { SessionInventory } from "./SessionInventory";
export { BOOKING_STATUSES, Sessions } from "./Sessions";
export { Testimonials } from "./Testimonials";
export { VENUE_STATUSES, Venues } from "./Venues";
export { Vibes } from "./Vibes";
export { CONTENT_REVALIDATION, revalidationHooks, type RevalidatedCollection } from "./revalidation";
export { readSeatCounts, type SeatCounts } from "./sessionInventory.hooks";

/**
 * Group "Content" (+ `session-inventory` under "Bookings"): the collections
 * the site is made of (SPEC §D.2), each carrying the hooks §D.2 and §D.7
 * list — revalidation (./revalidation.ts), slug guards and redirects,
 * publish gates (cms/hooks/*) and the inventory row's lifecycle
 * (./sessionInventory.hooks.ts). `payload.config.ts` spreads this array, so
 * adding a collection never touches the config file.
 */
export const contentCollections: CollectionConfig[] = [
  Pages,
  Experiences,
  Sessions,
  SessionInventory,
  Venues,
  Programmes,
  Policies,
  Faqs,
  Passes,
  Testimonials,
  Vibes,
  Posts,
  PostCategories,
  Redirects,
];
