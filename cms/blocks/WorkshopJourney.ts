import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { eyebrow, heading, picture } from "./shared";

/**
 * `workshopJourney` → components/sections/home/WorkshopJourney.tsx. Dormant
 * (SPEC §E.2). The steps are Brand wording `journey[]`.
 */
export const WorkshopJourneyBlock: Block = {
  slug: "workshopJourney",
  interfaceName: "WorkshopJourneyBlock",
  labels: { singular: "Workshop journey", plural: "Workshop journeys" },
  admin: { group: "Reserved" },
  fields: [
    eyebrow({ defaultValue: "What we offer" }),
    heading(),
    brandCopyLink({ path: "journey", label: "How people experience the Maison" }),
    picture("image", "Photograph"),
  ],
};
