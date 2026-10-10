import type { Block } from "payload";

import { brandCopyLink, cta } from "@/cms/fields";

import { brandCopySwitch, eyebrow, lead, text, whenOff, whenOn } from "./shared";

/**
 * `whereWeSetUp` → components/events/WhereWeSetUp.tsx (foot of events).
 * SPEC §E.1. Lists the venues with an upcoming session and the next date at
 * each. The lead is the shared "find us" line by default.
 */
export const WhereWeSetUpBlock: Block = {
  slug: "whereWeSetUp",
  interfaceName: "WhereWeSetUpBlock",
  labels: { singular: "Where we set up", plural: "Where we set up" },
  admin: { group: "Events" },
  fields: [
    eyebrow({ defaultValue: "Find us" }),
    text("heading", "Heading (script)", 40, { required: true, defaultValue: "Your Next Creative Stop." }),
    brandCopySwitch("useFindUsLine", "the lead"),
    brandCopyLink({ path: "findUsLine", label: "“Find us” line", condition: whenOn("useFindUsLine"), toggleLabel: "Use Brand wording for the lead" }),
    lead(200, { condition: whenOff("useFindUsLine") }),
    text("nextLabelTemplate", "Next date label", 40, {
      defaultValue: "Next {weekday} {date}",
      description: "{weekday} and {date} are filled from the next session at that venue.",
    }),
    cta({ name: "cta", label: "Button", maxLabel: 24, defaults: { label: "Find the studio", link: { type: "internal", url: "/locations" } } }),
  ],
};
