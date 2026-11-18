import type { Block } from "payload";

import { pick, text } from "./shared";

/**
 * The three FAQ sections that were fixed in code until Nov 2026. They are FAQ
 * section documents now (cms/collections/content/FaqSections.ts); these values
 * remain as `faqs.group` and `faq-sections.legacyKey`, which tie older
 * questions to the sections that replaced them.
 */
export const FAQ_GROUPS = [
  { label: "Coming to an event", value: "coming" },
  { label: "Booking a place", value: "booking" },
  { label: "Groups and passes", value: "groups" },
] as const;

/**
 * `faqList` → components/faq/FaqList.tsx (faq). SPEC §E.1. The block places
 * the questions on the page; the sections, their headings and their order are
 * the FAQ sections collection now. `groups` is what named the sections before
 * that: kept, read-only, so nothing stored is dropped, and read once by the
 * move (cms/lib/faqSections.ts) for the headings the page was printing.
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
      maxRows: 3,
      admin: {
        readOnly: true,
        description: "No longer used: the FAQ page's sections and their headings are set in Content → FAQ sections.",
      },
      fields: [
        pick("key", "Questions filed under", [...FAQ_GROUPS], { required: true }),
        text("title", "Section heading", 40, { required: true }),
      ],
    },
  ],
};
