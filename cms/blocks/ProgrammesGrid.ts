import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { eyebrow, heading, lead, text } from "./shared";

/**
 * `programmesGrid` → components/sections/private-events/WhoItIsFor.tsx
 * (private-events). SPEC §E.1. The cards are every published programme in
 * `order`; the note under them is Brand wording `programmesNote`.
 */
export const ProgrammesGridBlock: Block = {
  slug: "programmesGrid",
  interfaceName: "ProgrammesGridBlock",
  labels: { singular: "Programmes grid", plural: "Programmes grids" },
  admin: { group: "Private events" },
  fields: [
    eyebrow({ defaultValue: "Who it is for" }),
    heading(),
    lead(240),
    brandCopyLink({ path: "programmesNote", label: "Programmes note" }),
    text("cardCta", "Card button text", 24, { defaultValue: "See the programme" }),
  ],
};
