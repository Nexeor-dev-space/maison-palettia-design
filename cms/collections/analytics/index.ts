import type { CollectionConfig } from "payload";

/**
 * Group "System" (admin only): analytics-events, analytics-daily (SPEC §D.6).
 *
 * Empty in Phase 1 — the collections land in Phase 4A and are appended here by
 * that phase's schema owner (SPEC §L). `payload.config.ts` spreads this
 * array, so adding a collection never touches the config file.
 */
export const analyticsCollections: CollectionConfig[] = [];
