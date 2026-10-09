import type { CollectionConfig } from "payload";

/**
 * Group "Bookings": customers, orders, seat-holds, payments, payment-events, refunds, invoices, invoice-files, invoice-counters, tickets, pass-purchases, promo-codes, waitlist (SPEC §D.3).
 *
 * Empty in Phase 1 — the collections land in Phase 3A-0/3A-1 and are appended here by
 * that phase's schema owner (SPEC §L). `payload.config.ts` spreads this
 * array, so adding a collection never touches the config file.
 */
export const commerceCollections: CollectionConfig[] = [];
