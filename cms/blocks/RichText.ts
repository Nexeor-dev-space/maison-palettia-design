import type { Block } from "payload";

import { pick } from "./shared";

/**
 * `richText` → components/blocks/RichText.tsx (new in 2D; prose styles from
 * globals.css). SPEC §E.1. The one free-form block: for a future landing
 * page or journal entry that none of the designed sections fits.
 */
export const RichTextBlock: Block = {
  slug: "richText",
  interfaceName: "RichTextBlock",
  labels: { singular: "Text", plural: "Text" },
  admin: { group: "Page sections" },
  fields: [
    { name: "body", type: "richText", label: "Text", required: true },
    pick(
      "width",
      "Text width",
      [
        { label: "Narrow (reading column)", value: "narrow" },
        { label: "Wide", value: "wide" },
      ],
      { required: true, defaultValue: "narrow" },
    ),
  ],
};
