import type { Block } from "payload";

import { eyebrow, heading, lead, pick } from "./shared";

/**
 * `activitiesGrid` → components/private-events/ActivityPlate.tsx
 * (private-events and the programme template). SPEC §E.1. Plates for every
 * published experience ticked "Offer for private events"; each prints name,
 * description and status.
 *
 * `linkTo: "none"` is today's page: the plates are pictures, not links (no
 * tab stops, no hover zoom), the same as on every programme page. The two
 * link targets are there for when the studio wants the plates to lead
 * somewhere.
 */
export const ActivitiesGridBlock: Block = {
  slug: "activitiesGrid",
  interfaceName: "ActivitiesGridBlock",
  labels: { singular: "Activities grid", plural: "Activities grids" },
  admin: { group: "Private events" },
  fields: [
    eyebrow({ defaultValue: "The experiences" }),
    heading(),
    lead(240),
    pick(
      "linkTo",
      "Plates link to",
      [
        { label: "Nothing — the plates are not links", value: "none" },
        { label: "The experience's own page", value: "experiencePage" },
        { label: "The private-event enquiry", value: "enquiry" },
      ],
      { required: true, defaultValue: "none" },
    ),
  ],
};
