import type { Block } from "payload";

import { count, text } from "./shared";

/**
 * `upcomingSessions` → components/events/SessionShowcase.tsx. Dormant on
 * page-builder pages (SPEC §E.2); the same renderer lists a scheduled
 * experience's dates on its template page (§E.3).
 */
export const UpcomingSessionsBlock: Block = {
  slug: "upcomingSessions",
  interfaceName: "UpcomingSessionsBlock",
  labels: { singular: "Upcoming sessions", plural: "Upcoming sessions" },
  admin: { group: "Reserved" },
  fields: [
    text("heading", "Heading", 40, { defaultValue: "Upcoming sessions" }),
    count("limit", "How many", { min: 1, max: 12, defaultValue: 4 }),
    {
      name: "experience",
      type: "relationship",
      relationTo: "experiences",
      label: "Only this experience",
      filterOptions: { kind: { equals: "scheduled" } },
      admin: { description: "Leave empty for every scheduled session." },
    },
  ],
};
