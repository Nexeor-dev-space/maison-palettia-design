import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { brandCopySwitch, eyebrow, picture, prose, text, whenOff, whenOn } from "./shared";

/**
 * `openingStatement` → components/sections/home/OpeningStatement.tsx →
 * BrandStory.tsx (home section 02). SPEC §E.1.
 *
 * The statement, its closer and the lilac panel are Brand wording
 * (`openingStatement.*`) because the Gallery page opens with the same
 * heading. The overrides mirror the global's shape one for one, so a block
 * that turns the switch off loses nothing but the sharing.
 */
export const OpeningStatementBlock: Block = {
  slug: "openingStatement",
  interfaceName: "OpeningStatementBlock",
  labels: { singular: "Opening statement", plural: "Opening statements" },
  admin: { group: "Home" },
  fields: [
    eyebrow({ defaultValue: "What this is" }),
    brandCopySwitch("useBrandCopy", "the statement"),
    brandCopyLink({
      path: "openingStatement",
      label: "“What this is” statement",
      condition: whenOn("useBrandCopy"),
      toggleLabel: "Use Brand wording for the statement",
    }),
    text("heading", "Heading (script)", 40, { condition: whenOff("useBrandCopy") }),
    prose("body", "Body", 300, { condition: whenOff("useBrandCopy") }),
    text("closer", "Closer", 40, { condition: whenOff("useBrandCopy") }),
    {
      name: "panel",
      type: "group",
      label: "Lilac panel",
      admin: { condition: whenOff("useBrandCopy") },
      fields: [text("heading", "Heading", 24), prose("body", "Body", 240), text("signOff", "Sign-off", 32)],
    },
    picture("panelImage", "Panel photograph"),
  ],
};
