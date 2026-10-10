import type { Block } from "payload";

import { eyebrow, heading, lead, text } from "./shared";

/**
 * `venueSpotlight` → components/sections/private-events/CreateWithUs.tsx
 * (private-events). SPEC §E.1. The "Our home" card: the venue's name,
 * locality and descriptor.
 */
export const VenueSpotlightBlock: Block = {
  slug: "venueSpotlight",
  interfaceName: "VenueSpotlightBlock",
  labels: { singular: "Venue spotlight", plural: "Venue spotlights" },
  admin: { group: "Private events" },
  fields: [
    eyebrow({ defaultValue: "Create with us" }),
    heading(),
    lead(240),
    text("cardLabel", "Card label", 16, { defaultValue: "Our home" }),
    {
      name: "venue",
      type: "relationship",
      relationTo: "venues",
      label: "Venue",
      admin: { description: "Leave empty to show the current venue." },
    },
  ],
};
