import type { CollectionConfig } from "payload";

import { AnalyticsDaily } from "./AnalyticsDaily";
import { AnalyticsEvents } from "./AnalyticsEvents";

/**
 * Group "System" (admin only): analytics-events, analytics-daily (SPEC §D.6).
 *
 * Landed by Phase 4A. `payload.config.ts` spreads this array, so adding a
 * collection never touches the config file. The admin's charts live in the
 * custom view at /admin/analytics (4C), which reads these through
 * cms/lib/analyticsQueries.ts — the lists here are for looking underneath.
 */
export const analyticsCollections: CollectionConfig[] = [AnalyticsEvents, AnalyticsDaily];
