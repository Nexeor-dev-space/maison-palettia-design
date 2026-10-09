import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { brandCopySwitch, eyebrow, heading, lead, text, whenOff, whenOn } from "./shared";

/**
 * `whereWeCreate` → components/sections/home/WhereWeCreate.tsx (home).
 * SPEC §E.1. The lead is the shared "find us" line by default (01 §7: the
 * same sentence is on /locations and the FAQ). No venue chosen = the first
 * venue with status "current".
 */
export const WhereWeCreateBlock: Block = {
  slug: "whereWeCreate",
  interfaceName: "WhereWeCreateBlock",
  labels: { singular: "Where we create", plural: "Where we create" },
  admin: { group: "Home" },
  fields: [
    eyebrow({ defaultValue: "Find us" }),
    heading(),
    brandCopySwitch("useFindUsLine", "the lead"),
    brandCopyLink({ path: "findUsLine", label: "“Find us” line", condition: whenOn("useFindUsLine"), toggleLabel: "Use Brand wording for the lead" }),
    lead(200, { condition: whenOff("useFindUsLine") }),
    text("findUsNowLabel", "Map card button", 24, { defaultValue: "Find us now" }),
    {
      name: "venue",
      type: "relationship",
      relationTo: "venues",
      label: "Venue",
      admin: { description: "Leave empty to show the current venue." },
    },
  ],
};
