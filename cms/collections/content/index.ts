import type { CollectionConfig } from "payload";

/**
 * Group "Content": pages, experiences, sessions, session-inventory, venues, programmes, policies, faqs, passes, testimonials, vibes, redirects (SPEC §D.2).
 *
 * Empty in Phase 1 — the collections land in Phase 2A-0/2A-1 and are appended here by
 * that phase's schema owner (SPEC §L). `payload.config.ts` spreads this
 * array, so adding a collection never touches the config file.
 */
export const contentCollections: CollectionConfig[] = [];
