import type { Block } from "payload";

import { flag, prose, text } from "./shared";

/**
 * `locationsHero` → components/sections/LocationsBody.tsx (locations).
 * SPEC §E.1. The plate + map for the current venue(s); the header above it is
 * a `pageHeader` block. `showPastDestinations` turns on the "where we have
 * been" list the page imports but has never printed (01 §5.1).
 */
export const LocationsHeroBlock: Block = {
  slug: "locationsHero",
  interfaceName: "LocationsHeroBlock",
  labels: { singular: "Locations — venues and map", plural: "Locations — venues and map" },
  admin: { group: "Page sections" },
  fields: [
    text("findUsNowLabel", "Map button", 24, { defaultValue: "Find us now" }),
    prose("emptyNote", "No current venue — note", 120, { defaultValue: "The next destination is being confirmed." }),
    {
      name: "venues",
      type: "relationship",
      relationTo: "venues",
      hasMany: true,
      label: "Venues",
      admin: { description: "Leave empty to show every venue with status “Current”." },
    },
    flag("showPastDestinations", "List past destinations", false, {
      description: "Adds a “Where we have been” list of venues with status “Past”.",
    }),
  ],
};
