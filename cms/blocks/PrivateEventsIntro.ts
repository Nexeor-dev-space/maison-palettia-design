import type { Block } from "payload";

import { eyebrow, heading, lead, picture } from "./shared";

/**
 * `privateEventsIntro` → components/sections/private-events/Introduction.tsx
 * (private-events). SPEC §E.1. The one heading on the site allowed three
 * lines ("Memories / Made by / Hand.").
 */
export const PrivateEventsIntroBlock: Block = {
  slug: "privateEventsIntro",
  // Postgres caps identifiers at 63 characters and this slug's version-table
  // index ("_pages_v_blocks_private_events_intro_heading_lines_parent_id_idx") would be
  // silently truncated. The table name is shortened; the block slug stays.
  dbName: ({ tableName }) => `${tableName}_blocks_pe_intro`,
  interfaceName: "PrivateEventsIntroBlock",
  labels: { singular: "Private events — introduction", plural: "Private events — introductions" },
  admin: { group: "Private events" },
  fields: [
    eyebrow({ max: 48, defaultValue: "Creative experiences, made for your moment" }),
    heading({ maxRows: 3 }),
    lead(400),
    picture("image", "Photograph"),
  ],
};
