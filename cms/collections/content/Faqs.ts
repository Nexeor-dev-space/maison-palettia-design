import type { CollectionConfig, FieldHook, RelationshipFieldSingleValidation } from "payload";

import { FAQ_GROUPS } from "@/cms/blocks/FaqList";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, orderField } from "./shared";

/**
 * ==========================================================================
 * faqs — questions and answers (SPEC §D.2; fields from 01 §4.7)
 * ==========================================================================
 *
 * Each question is filed under a section (`section`, the `faq-sections`
 * collection), which editors add, rename and order themselves. One answer —
 * "Am I charged when I book?" — is not written here at all: it prints Booking
 * settings' terms for the current payment mode, so it can never disagree with
 * the checkout.
 * That is `answerSource: bookingTerms`.
 *
 * BEFORE SECTIONS WERE EDITABLE (Nov 2026) a question named one of three
 * sections fixed in code (`group`). That field stays, hidden, so nothing is
 * dropped: a question that has not been saved since keeps its `group`, and
 * `section` reads as the section that replaced it (`legacyKey`) until the
 * question is next saved with a section of its own. No question had to be
 * rewritten for the change.
 *
 * Publishing purges /faq and / (./revalidation.ts).
 */

/** An older question with no section yet: the section that replaced its old one. Looked up once per request. */
const sectionFromGroup: FieldHook = async ({ value, siblingData, req }) => {
  if (value !== null && value !== undefined) return value;
  const group = (siblingData as { group?: string } | undefined)?.group;
  if (!group) return value;
  const cache = (req.context.faqLegacySections as Map<string, Promise<unknown>> | undefined) ?? new Map<string, Promise<unknown>>();
  req.context.faqLegacySections = cache;
  if (!cache.has(group)) {
    cache.set(
      group,
      req.payload
        .find({ collection: "faq-sections", where: { legacyKey: { equals: group } }, limit: 1, depth: 0, overrideAccess: true, req })
        .then((found) => found.docs[0]?.id ?? null)
        .catch(() => null),
    );
  }
  return (await cache.get(group)) ?? value;
};

/**
 * Required of editors. The seed is let through: it writes questions before the
 * FAQ page that names the sections exists, files them by `group`, and makes
 * the sections afterwards (cms/lib/faqSections.ts).
 */
const sectionChosen: RelationshipFieldSingleValidation = (value, { req }) =>
  (value !== null && value !== undefined && value !== "") || req?.context?.seed === true ? true : "Choose the section this question sits under.";

export const Faqs: CollectionConfig = {
  slug: "faqs",
  labels: { singular: "Question", plural: "FAQ" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "question",
    defaultColumns: ["question", "section", "order", "_status"],
    description: "Questions on the FAQ page. Each is filed under a section; add, rename or reorder sections in FAQ sections.",
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
      name: "section",
      type: "relationship",
      relationTo: "faq-sections",
      label: "Section",
      required: true,
      validate: sectionChosen,
      admin: { position: "sidebar", description: "Which heading this question sits under. Manage the list in FAQ sections." },
      hooks: { afterRead: [sectionFromGroup] },
    },
    {
      // Superseded by `section` (Nov 2026); kept, hidden, so older questions still know where they belong.
      name: "group",
      type: "select",
      label: "Section (before sections were editable)",
      required: true,
      defaultValue: "coming",
      options: [...FAQ_GROUPS],
      admin: { hidden: true },
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
