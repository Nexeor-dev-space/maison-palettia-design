import type { CollectionConfig } from "payload";

import { slug } from "@/cms/fields";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, orderField, publicContentAccess } from "./shared";

/**
 * ==========================================================================
 * vibes — moods to filter the programme by (SPEC §D.2; 01 §4.10)
 * ==========================================================================
 *
 * "Messy & Expressive", "Mindful & Chill", "Quick 30-Min Crafts": a mood,
 * never a fact about the programme. Experiences carry zero or more; the
 * "Find your vibe" filter appears only once something is tagged
 * (lib/vibes.ts), which is why none of the seven is tagged at launch. No
 * drafts: a vibe is a label, and every save purges /events and /.
 */
export const Vibes: CollectionConfig = {
  slug: "vibes",
  labels: { singular: "Vibe", plural: "Vibes" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "label",
    defaultColumns: ["label", "blurb", "order", "updatedAt"],
    description: "Moods an experience can be tagged with. The filter on the Experiences page appears once anything is tagged.",
    listSearchableFields: ["label", "blurb"],
  },
  defaultSort: "order",
  access: publicContentAccess,
  hooks: revalidationHooks("vibes"),
  fields: [
    {
      name: "label",
      type: "text",
      label: "Vibe",
      required: true,
      maxLength: 24,
      admin: { description: "Set in capitals by the design." },
    },
    slug({ from: "label", admin: { position: "sidebar", description: "Internal name — visitors never see it. The Events filter uses it." } }),
    {
      name: "blurb",
      type: "text",
      label: "One line (tooltip)",
      required: true,
      maxLength: 60,
      admin: { description: "A mood, never a fact about the programme." },
    },
    orderField(),
  ],
};
