import type { Block } from "payload";

import { cta } from "@/cms/fields";

import { eyebrow, heading } from "./shared";

/**
 * `privateEventsTeaser` → components/sections/home/PrivateEventsTeaser.tsx.
 * Dormant (SPEC §E.2). Lists the programmes in the Private events menu.
 */
export const PrivateEventsTeaserBlock: Block = {
  slug: "privateEventsTeaser",
  // Postgres caps identifiers at 63 characters and this slug's version-table
  // index ("_pages_v_blocks_private_events_teaser_heading_lines_parent_id_idx") would be
  // silently truncated. The table name is shortened; the block slug stays.
  dbName: ({ tableName }) => `${tableName}_blocks_pe_teaser`,
  interfaceName: "PrivateEventsTeaserBlock",
  labels: { singular: "Private events teaser", plural: "Private events teasers" },
  admin: { group: "Reserved" },
  fields: [
    eyebrow(),
    heading({ maxRows: 3 }),
    cta({ name: "cta", label: "Button", maxLabel: 24, defaults: { label: "Plan a private event", link: { type: "internal", url: "/private-events" } } }),
  ],
};
