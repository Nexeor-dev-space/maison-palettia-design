import type { Block } from "payload";

import { cta } from "@/cms/fields";

import { count, eyebrow, heading, lead } from "./shared";

/**
 * `latestJournal` → components/blocks/LatestJournal.tsx: the newest
 * stories from the Journal as a row of cards, for the home page or any
 * landing page. Registered, not seeded (SPEC §E.2): an editor adds it
 * where they want it. The heading and the button fall back to the house
 * wording (components/journal/copy.ts) when left empty, so the block
 * reads as the site's the moment it is added.
 */
export const LatestJournalBlock: Block = {
  slug: "latestJournal",
  interfaceName: "LatestJournalBlock",
  labels: {
    singular: "Latest from the Journal",
    plural: "Latest from the Journal",
  },
  admin: { group: "Page sections" },
  fields: [
    eyebrow({ defaultValue: "Journal" }),
    heading({
      maxRows: 2,
      maxChars: 18,
      description:
        "Up to two lines, 18 characters each. Leave empty for “Latest from the Journal.”",
    }),
    lead(240),
    count("limit", "How many stories", { min: 1, max: 6, defaultValue: 3 }),
    {
      name: "category",
      type: "relationship",
      relationTo: "post-categories",
      label: "Only this category",
      admin: {
        description: "Leave empty for the newest stories from every category.",
      },
    },
    cta({
      name: "cta",
      label: "Button",
      description: "Leave empty for “Read the Journal”.",
      defaults: {
        label: "Read the Journal",
        link: { type: "internal", url: "/journal" },
      },
    }),
  ],
};
