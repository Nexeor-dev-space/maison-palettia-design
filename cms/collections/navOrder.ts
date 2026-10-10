import type { CollectionConfig, GlobalConfig } from "payload";

/**
 * ==========================================================================
 * The sidebar's order, in the DOM (4B review, SPEC §I)
 * ==========================================================================
 *
 * Payload builds the sidebar groups in the order it first meets each
 * `admin.group` — every collection first, then every global. The config
 * lists the collections by the folder that defines them (System first),
 * and custom.scss used to reshuffle the groups with CSS `order`, which put
 * keyboard focus and screen readers in a different order from the screen.
 *
 * Sorting the collections by the owner's order here makes the DOM order
 * the visual order: Content, Bookings, Inbox, Emails, then Settings (Staff
 * joins the settings pages there), Settings (admin) (opened by "Settings
 * changes", a collection, so the group exists before System does), and
 * last the admin-only System group of internal tables. A stable sort, so each
 * group keeps its own collections in the order they were listed.
 * Collection order has no effect on the database schema.
 *
 * Also here, for every collection and global: `hideAPIURL`, which removes
 * the "API" tab from each document — a developer's view the studio never
 * needs (developers have the REST API itself).
 */

const GROUP_RANK = ["Content", "Bookings", "Inbox", "Emails", "Settings", "Settings (admin)", "System"];

const rankOf = (group: unknown): number => {
  const i = typeof group === "string" ? GROUP_RANK.indexOf(group) : -1;
  return i === -1 ? GROUP_RANK.length : i;
};

export function inNavOrder(collections: CollectionConfig[]): CollectionConfig[] {
  return collections
    .map((collection, index) => ({ collection, index }))
    .sort((a, b) => rankOf(a.collection.admin?.group) - rankOf(b.collection.admin?.group) || a.index - b.index)
    .map(({ collection }) => ({ ...collection, admin: { ...collection.admin, hideAPIURL: true } }));
}

export const withoutApiTab = (globals: GlobalConfig[]): GlobalConfig[] => globals.map((g) => ({ ...g, admin: { ...g.admin, hideAPIURL: true } }));
