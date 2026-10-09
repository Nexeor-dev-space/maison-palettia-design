import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { eyebrow } from "./shared";

/**
 * `communityJourney` → components/sections/about/Community.tsx (about).
 * SPEC §E.1. Heading, body and closer are Brand wording `community`; the
 * list is `journey[]`.
 */
export const CommunityJourneyBlock: Block = {
  slug: "communityJourney",
  interfaceName: "CommunityJourneyBlock",
  labels: { singular: "Community & journey", plural: "Community & journey" },
  admin: { group: "About" },
  fields: [
    eyebrow({ defaultValue: "The Maison experience" }),
    brandCopyLink({ name: "communityLink", path: "community", label: "Community statement" }),
    brandCopyLink({ name: "journeyLink", path: "journey", label: "How people experience the Maison" }),
  ],
};
