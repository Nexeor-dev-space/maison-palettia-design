import type { Block } from "payload";

import { link } from "@/cms/fields";

import { eyebrow, heading, lead, pick, picture, prose, text, whenIs } from "./shared";

/**
 * `waysToTakePart` → components/sections/home/WaysToExperience.tsx +
 * WaysTrail.tsx (home). SPEC §E.1.
 *
 * Four tinted cards (Create / Celebrate / Connect / Collaborate), each with a
 * photograph and a few "doors". A door's note can be typed, or derived — the
 * count of walk-in activities, the count of scheduled ones, or a programme's
 * own description — so "5 activities, no booking" stays true without anyone
 * retyping it. The tints are the renderer's four mixes; the editor only
 * picks which.
 */
export const WaysToTakePartBlock: Block = {
  slug: "waysToTakePart",
  interfaceName: "WaysToTakePartBlock",
  labels: { singular: "Ways to take part", plural: "Ways to take part" },
  admin: { group: "Home" },
  fields: [
    eyebrow({ defaultValue: "Ways to take part" }),
    heading(),
    lead(320),
    {
      name: "groups",
      type: "array",
      label: "Cards",
      labels: { singular: "Card", plural: "Cards" },
      minRows: 1,
      maxRows: 4,
      fields: [
        text("name", "Name", 16, { required: true, description: "One word, set in capitals: Create, Celebrate…" }),
        prose("lede", "Line under the name", 200, { required: true }),
        picture("photo", "Photograph"),
        pick(
          "tint",
          "Card tint",
          [
            { label: "Lilac", value: "lilac" },
            { label: "Terracotta", value: "terracotta" },
            { label: "Lavender", value: "lavender" },
            { label: "Sage", value: "sage" },
          ],
          { required: true, defaultValue: "lilac" },
        ),
        {
          name: "doors",
          type: "array",
          label: "Links in the card",
          labels: { singular: "Link", plural: "Links" },
          maxRows: 4,
          admin: { description: "The links inside the card, each with a label and a short note." },
          fields: [
            text("label", "Label", 32, { required: true }),
            pick(
              "noteSource",
              "Note comes from",
              [
                { label: "Typed below", value: "text" },
                { label: "Count of walk-in activities", value: "diyCount" },
                { label: "Count of scheduled sessions", value: "scheduledCount" },
                { label: "The programme's description", value: "programmeDescription" },
              ],
              { required: true, defaultValue: "text" },
            ),
            text("note", "Note", 72, { condition: whenIs("noteSource", "text") }),
            {
              name: "programme",
              type: "relationship",
              relationTo: "programmes",
              label: "Programme",
              admin: {
                condition: whenIs("noteSource", "programmeDescription"),
                description: "The door links to this programme's page and borrows its description.",
              },
            },
            link({ name: "link", label: "Destination", description: "Ignored when a programme is chosen above." }),
          ],
        },
      ],
    },
  ],
};
