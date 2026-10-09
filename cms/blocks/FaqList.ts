import type { Block } from "payload";

import { pick, text } from "./shared";

/** The three FAQ sections. The `faqs` collection's `group` select uses the same values. */
export const FAQ_GROUPS = [
  { label: "Coming to an event", value: "coming" },
  { label: "Booking a place", value: "booking" },
  { label: "Groups and passes", value: "groups" },
] as const;

/**
 * `faqList` → components/faq/FaqList.tsx (faq). SPEC §E.1. The block names
 * and orders the sections; the questions come from the `faqs` collection by
 * `group`, in their `order`.
 */
export const FaqListBlock: Block = {
  slug: "faqList",
  interfaceName: "FaqListBlock",
  labels: { singular: "FAQ list", plural: "FAQ lists" },
  admin: { group: "Page sections" },
  fields: [
    {
      name: "groups",
      type: "array",
      label: "Sections",
      labels: { singular: "Section", plural: "Sections" },
      minRows: 1,
      maxRows: 3,
      admin: { description: "Each section lists the questions filed under it, in order." },
      fields: [
        pick("key", "Questions filed under", [...FAQ_GROUPS], { required: true }),
        text("title", "Section heading", 40, { required: true }),
      ],
    },
  ],
};
