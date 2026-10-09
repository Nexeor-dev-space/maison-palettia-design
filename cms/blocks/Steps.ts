import type { Block, Field } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { eyebrow, heading, pick, prose, text, whenIs } from "./shared";

/**
 * The `source` + `steps[]` pair, shared with `enquiryForm.sidebarSteps`
 * (SPEC §E.1 "reuses steps fields"). "Brand wording" draws the three
 * private-event steps that /private-events, every programme page and the
 * enquiry sidebar all print; "Custom" is for lists like the loyalty page's
 * four.
 */
export const stepsSourceFields = (): Field[] => [
  pick(
    "source",
    "Steps come from",
    [
      { label: "Brand wording — private event steps", value: "brandCopyPrivateEventSteps" },
      { label: "Written here", value: "custom" },
    ],
    { required: true, defaultValue: "brandCopyPrivateEventSteps" },
  ),
  brandCopyLink({
    path: "privateEventSteps",
    label: "Private event — how it works",
    condition: whenIs("source", "brandCopyPrivateEventSteps"),
  }),
  {
    name: "steps",
    type: "array",
    label: "Steps",
    labels: { singular: "Step", plural: "Steps" },
    maxRows: 6,
    admin: { condition: whenIs("source", "custom"), description: "Numbered in order, 01 upwards." },
    fields: [text("title", "Step title", 40, { required: true }), prose("detail", "Detail", 200)],
  },
];

/**
 * `steps` → components/sections/Steps.tsx. SPEC §E.1. "How it works" on
 * private-events, private-events-book and loyalty (and the programme
 * template). `variant` picks the two layouts the component already has.
 */
export const StepsBlock: Block = {
  slug: "steps",
  interfaceName: "StepsBlock",
  labels: { singular: "Steps (how it works)", plural: "Steps (how it works)" },
  admin: { group: "Page sections" },
  fields: [
    eyebrow({ defaultValue: "How it works" }),
    heading({ required: false }),
    ...stepsSourceFields(),
    pick(
      "variant",
      "Layout",
      [
        { label: "Cards", value: "cards" },
        { label: "List", value: "list" },
      ],
      { required: true, defaultValue: "cards" },
    ),
  ],
};
