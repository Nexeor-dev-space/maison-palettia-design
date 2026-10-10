import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { picture } from "./shared";

/**
 * `fullBleedStatement` → components/sections/home/CommunityMoment.tsx.
 * Dormant (SPEC §E.2): a parallax photograph behind Brand wording `community`.
 */
export const FullBleedStatementBlock: Block = {
  slug: "fullBleedStatement",
  interfaceName: "FullBleedStatementBlock",
  labels: { singular: "Full-bleed statement", plural: "Full-bleed statements" },
  admin: { group: "Reserved" },
  fields: [
    picture("image", "Background photograph", { required: true, description: "Large: it fills the width of the page." }),
    brandCopyLink({ path: "community", label: "Community statement" }),
  ],
};
