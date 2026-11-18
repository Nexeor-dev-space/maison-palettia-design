import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig, type Where } from "payload";

import { FAQ_GROUPS } from "@/cms/blocks/FaqList";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, orderField, publicContentAccess } from "./shared";

/**
 * ==========================================================================
 * faq-sections — the headings the FAQ page files its questions under
 * ==========================================================================
 *
 * Editors add, rename, reorder and remove sections here; each question picks
 * one (`faqs.section`). The page prints the sections in `order`, each with
 * its published questions, and leaves out a section that has none — so a new
 * section can be set up before its first question is published.
 *
 * Until Nov 2026 there were three sections fixed in code (`FAQ_GROUPS`) and
 * the headings were typed on the FAQ page's "FAQ list" block. Those three are
 * created here once per database by cms/lib/faqSections.ts, with the headings
 * the page was printing, and `legacyKey` records which old section each one
 * replaces: a question saved before the change still names its old section
 * (`faqs.group`) and is filed under the matching one until it is next saved.
 *
 * No drafts: a section is a heading, and it shows nothing until a published
 * question sits under it.
 */

/** A section's questions: those filed under it, and older ones still filed by its legacy key. */
export function questionsInSection(id: string | number, legacyKey: string | null | undefined): Where {
  const filed: Where = { section: { equals: id } };
  if (!legacyKey) return filed;
  return { or: [filed, { and: [{ section: { exists: false } }, { group: { equals: legacyKey } }] }] };
}

const refuseDeleteInUse: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (req.context?.system === true) return;
  const section = (await req.payload.findByID({ collection: "faq-sections", id, depth: 0, overrideAccess: true, req })) as { legacyKey?: string | null };
  const { totalDocs } = await req.payload.count({
    collection: "faqs",
    where: questionsInSection(id, section?.legacyKey),
    overrideAccess: true,
    req,
  });
  if (totalDocs > 0) {
    throw new APIError(
      `${totalDocs} ${totalDocs === 1 ? "question is" : "questions are"} filed under this section. Move ${totalDocs === 1 ? "it" : "them"} to another section first.`,
      409,
      undefined,
      true,
    );
  }
};

const revalidate = revalidationHooks("faq-sections");

export const FaqSections: CollectionConfig = {
  slug: "faq-sections",
  labels: { singular: "FAQ section", plural: "FAQ sections" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "title",
    defaultColumns: ["title", "order", "updatedAt"],
    description:
      "The headings on the FAQ page. Each question chooses one of these. A section only appears on the page once it has a published question.",
  },
  defaultSort: "order",
  access: publicContentAccess,
  hooks: {
    beforeChange: revalidate.beforeChange,
    afterChange: revalidate.afterChange,
    beforeDelete: [refuseDeleteInUse],
    afterDelete: revalidate.afterDelete,
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Section heading",
      required: true,
      maxLength: 40,
      admin: { description: "As it appears on the FAQ page, e.g. Booking a place." },
    },
    orderField("Position on the FAQ page: lower numbers come first."),
    {
      // Which of the three code-fixed sections this one replaced; set once by the move, never by hand.
      name: "legacyKey",
      type: "select",
      label: "Replaces",
      unique: true,
      options: [...FAQ_GROUPS],
      admin: { hidden: true },
    },
  ],
};
