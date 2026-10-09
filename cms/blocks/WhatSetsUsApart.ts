import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { eyebrow, heading } from "./shared";

/**
 * `whatSetsUsApart` → components/sections/about/Apart.tsx (about). SPEC §E.1.
 * The four cards are Brand wording `whatSetsUsApart[]`.
 */
export const WhatSetsUsApartBlock: Block = {
  slug: "whatSetsUsApart",
  interfaceName: "WhatSetsUsApartBlock",
  labels: { singular: "What sets us apart", plural: "What sets us apart" },
  admin: { group: "About" },
  fields: [
    eyebrow({ defaultValue: "What sets us apart" }),
    heading(),
    brandCopyLink({ path: "whatSetsUsApart", label: "What sets us apart" }),
  ],
};
