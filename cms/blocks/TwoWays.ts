import type { Block } from "payload";

import { cta } from "@/cms/fields";

import { eyebrow, lead, pick, text } from "./shared";

/**
 * `twoWays` → components/sections/home/TwoWaysToCreate.tsx (home). SPEC §E.1.
 *
 * Two "roads" — Create Anytime and Create Together — each with a short set
 * of facts. The current venue's name and the next session's date are derived
 * by the renderer (01 §5.1: "home" was hard-coded), so the facts here are
 * only the typed ones; the plates are the first walk-in and first scheduled
 * experience's photographs.
 */
export const TwoWaysBlock: Block = {
  slug: "twoWays",
  interfaceName: "TwoWaysBlock",
  labels: { singular: "Two ways to create", plural: "Two ways to create" },
  admin: { group: "Home" },
  fields: [
    eyebrow({ defaultValue: "How to take part" }),
    text("heading", "Heading (script)", 40, { required: true, defaultValue: "Make It Your Way." }),
    lead(200, { defaultValue: "Drop in and create, or book a seat for a scheduled session." }),
    {
      name: "roads",
      type: "array",
      label: "The two cards",
      labels: { singular: "Card", plural: "Cards" },
      minRows: 2,
      maxRows: 2,
      fields: [
        text("eyebrow", "Eyebrow", 24, { required: true }),
        text("title", "Title", 24, { required: true }),
        text("line", "Line", 80, { required: true }),
        {
          name: "facts",
          type: "array",
          label: "Facts",
          labels: { singular: "Fact", plural: "Facts" },
          maxRows: 3,
          admin: { description: "Short facts under the title. The venue and the next date are added automatically." },
          fields: [text("text", "Fact", 32, { required: true })],
        },
        cta({ name: "cta", label: "Button", maxLabel: 24 }),
        pick(
          "ground",
          "Background colour",
          [
            { label: "Terracotta", value: "terracotta" },
            { label: "Lilac", value: "lilac" },
          ],
          { required: true, defaultValue: "terracotta" },
        ),
      ],
    },
  ],
};
