import type { Block } from "payload";

import { link } from "@/cms/fields";

import { prose, text } from "./shared";

/**
 * `utilityBar` → components/layout/PageUtilityBar.tsx. SPEC §E.1. The "More
 * from the Maison" strip: a note and a few links. The template routes (event
 * page, checkout) configure theirs in Booking settings → utility bars; this
 * block is the same strip for a page-builder page. Its heading comes from
 * Navigation.
 */
export const UtilityBarBlock: Block = {
  slug: "utilityBar",
  interfaceName: "UtilityBarBlock",
  labels: { singular: "Utility bar", plural: "Utility bars" },
  admin: { group: "Page sections" },
  fields: [
    prose("note", "Note", 200, { description: "Optional sentence beside the links." }),
    {
      name: "links",
      type: "array",
      label: "Links",
      labels: { singular: "Link", plural: "Links" },
      minRows: 1,
      maxRows: 4,
      fields: [text("label", "Label", 24, { required: true }), link({ name: "link", label: "Destination", required: true })],
    },
  ],
};
