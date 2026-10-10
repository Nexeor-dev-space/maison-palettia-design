import type { CollectionConfig } from "payload";

import { FAQ_GROUPS } from "@/cms/blocks/FaqList";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, orderField } from "./shared";

/**
 * ==========================================================================
 * faqs — questions and answers (SPEC §D.2; fields from 01 §4.7)
 * ==========================================================================
 *
 * Ten questions in three sections today. The `faqList` block on the FAQ page
 * names and orders the sections; each question says which it is filed under
 * (`group`, the same three values). One answer — "Am I charged when I
 * book?" — is not written here at all: it prints Booking settings' terms for
 * the current payment mode, so it can never disagree with the checkout.
 * That is `answerSource: bookingTerms`.
 *
 * Publishing purges /faq and / (./revalidation.ts).
 */
export const Faqs: CollectionConfig = {
  slug: "faqs",
  labels: { singular: "Question", plural: "FAQ" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "question",
    defaultColumns: ["question", "group", "order", "_status"],
    description: "Questions on the FAQ page, filed under three sections. The sections' headings are set on the FAQ page itself.",
    listSearchableFields: ["question"],
  },
  defaultSort: "order",
  versions: contentDrafts,
  access: draftedContentAccess,
  hooks: revalidationHooks("faqs"),
  fields: [
    { name: "question", type: "text", label: "Question", required: true, maxLength: 90 },
    {
      name: "answerSource",
      type: "select",
      label: "Answer comes from",
      required: true,
      defaultValue: "text",
      options: [
        { label: "Written below", value: "text" },
        { label: "Booking settings → booking terms (for the current payment mode)", value: "bookingTerms" },
      ],
    },
    {
      name: "answer",
      type: "richText",
      label: "Answer",
      admin: {
        condition: (_, siblingData) => (siblingData as { answerSource?: string })?.answerSource !== "bookingTerms",
        description: "A paragraph or two. Keep it under about 600 characters.",
      },
    },
    {
      name: "group",
      type: "select",
      label: "Section",
      required: true,
      defaultValue: "coming",
      options: [...FAQ_GROUPS],
      admin: { position: "sidebar" },
    },
    {
      name: "showOnHomepage",
      type: "checkbox",
      label: "Also show on a homepage FAQ section",
      defaultValue: false,
      // Reserved: no homepage FAQ section exists yet, so the switch is hidden until one does.
      admin: { position: "sidebar", hidden: true, description: "Reserved: no homepage FAQ section exists yet." },
    },
    orderField("Position within its section."),
  ],
};
