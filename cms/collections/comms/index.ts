import type { CollectionConfig } from "payload";

/**
 * Group "Emails": email-templates, notification-log (SPEC §D.5).
 *
 * Empty in Phase 1 — the collections land in Phase 3A-0/3C and are appended here by
 * that phase's schema owner (SPEC §L). `payload.config.ts` spreads this
 * array, so adding a collection never touches the config file.
 */
export const commsCollections: CollectionConfig[] = [];
