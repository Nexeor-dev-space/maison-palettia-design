import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { eyebrow, pick, picture, prose, text, whenIs } from "./shared";

/**
 * `seasonal` → components/sections/home/SeasonalExperiences.tsx. Dormant
 * (SPEC §E.2): registered, not seeded. The moments can be the Brand wording
 * `seasonalMoments` list or typed here.
 */
export const SeasonalBlock: Block = {
  slug: "seasonal",
  interfaceName: "SeasonalBlock",
  labels: { singular: "Seasonal experiences", plural: "Seasonal experiences" },
  admin: { group: "Reserved" },
  fields: [
    eyebrow({ defaultValue: "Limited time" }),
    text("heading", "Heading (script)", 40, { required: true, defaultValue: "A different season, every season." }),
    prose("intro", "Intro", 300),
    pick(
      "source",
      "Moments come from",
      [
        { label: "Brand wording — seasonal examples", value: "brandCopy" },
        { label: "Written here", value: "manual" },
      ],
      { required: true, defaultValue: "brandCopy" },
    ),
    brandCopyLink({ path: "seasonalMoments", label: "Seasonal examples", condition: whenIs("source", "brandCopy") }),
    {
      name: "moments",
      type: "array",
      label: "Moments",
      labels: { singular: "Moment", plural: "Moments" },
      maxRows: 6,
      admin: { condition: whenIs("source", "manual") },
      fields: [text("occasion", "Occasion", 40, { required: true }), text("experience", "Experience", 80), picture("image", "Image")],
    },
  ],
};
