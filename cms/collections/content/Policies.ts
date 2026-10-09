import type { Block, CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { neverField } from "@/cms/access/roles";
import { slug } from "@/cms/fields";
import { findLiveRow, guardSlugChange } from "@/cms/hooks/formatSlug";
import { slugRedirectHooks } from "@/cms/hooks/slugRedirect";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, orderField, previewFor, withContentTab } from "./shared";

/**
 * ==========================================================================
 * policies — the studio policies (SPEC §D.2; fields from 01 §4.6)
 * ==========================================================================
 *
 * Eight documents reproduced as written from the client's policy document
 * (lib/policies.ts explains at length why the prose is not paraphrased). A
 * policy is a title, a footer label, a one-line summary and a list of
 * sections; each section is a heading and a run of four kinds of block that
 * mirror `PolicyBlock` one for one — `text`, `list`, `ages`, `callout` — so
 * components/policies/PolicyBody.tsx renders them unchanged.
 *
 * THE AGE TABLE IS WRITTEN ONCE. Three policies print the same ages; an age
 * typed twice disagrees with itself the first time one copy is corrected.
 * An `ages` block set to "DIY" or "Workshop" draws its rows from the
 * experiences' `ageGuidance` field (by `kind`); "Custom" is for a table that
 * is not about the catalogue.
 *
 * `version` counts publishes (`countPublishes` below) so a checkout
 * consent can record which wording was agreed to; `requiresCheckoutConsent`
 * puts the policy behind the "I have read and agree" box.
 *
 * Publishing purges /policies, the policy's page, /faq, /checkout and the
 * layout — the footer's legal row lists policies (./revalidation.ts).
 */

const PolicyText: Block = {
  slug: "text",
  interfaceName: "PolicyTextBlock",
  labels: { singular: "Paragraph", plural: "Paragraphs" },
  fields: [{ name: "body", type: "textarea", label: "Paragraph", required: true, maxLength: 2000 }],
};

const PolicyList: Block = {
  slug: "list",
  interfaceName: "PolicyListBlock",
  labels: { singular: "Bullet list", plural: "Bullet lists" },
  fields: [
    {
      name: "items",
      type: "array",
      label: "Items",
      labels: { singular: "Item", plural: "Items" },
      minRows: 1,
      fields: [{ name: "text", type: "text", label: "Item", required: true, maxLength: 400 }],
    },
  ],
};

const PolicyAges: Block = {
  slug: "ages",
  interfaceName: "PolicyAgesBlock",
  labels: { singular: "Age table", plural: "Age tables" },
  fields: [
    {
      name: "source",
      type: "select",
      label: "Rows come from",
      required: true,
      defaultValue: "diy",
      options: [
        { label: "Create Anytime experiences (their Age guidance)", value: "diy" },
        { label: "Create Together experiences (their Age guidance)", value: "workshop" },
        { label: "Typed below", value: "custom" },
      ],
      admin: { description: "DIY and Workshop read each experience's Age guidance, so an age is edited once." },
    },
    {
      name: "rows",
      type: "array",
      label: "Rows",
      labels: { singular: "Row", plural: "Rows" },
      admin: { condition: (_, siblingData) => (siblingData as { source?: string })?.source === "custom" },
      fields: [
        {
          type: "row",
          fields: [
            { name: "activity", type: "text", label: "Activity", required: true, maxLength: 40, admin: { width: "40%" } },
            { name: "guidance", type: "text", label: "Guidance", required: true, maxLength: 160, admin: { width: "60%" } },
          ],
        },
      ],
    },
  ],
};

const PolicyCallout: Block = {
  slug: "callout",
  interfaceName: "PolicyCalloutBlock",
  labels: { singular: "Callout", plural: "Callouts" },
  fields: [
    { name: "title", type: "text", label: "Title", required: true, maxLength: 60 },
    { name: "body", type: "textarea", label: "Body", required: true, maxLength: 600 },
  ],
};

export const policyBlocks: Block[] = [PolicyText, PolicyList, PolicyAges, PolicyCallout];

/**
 * beforeChange: each publish after the first raises `version` by one; drafts
 * carry the live number. The live row (main table) is the last published
 * state — a draft save never writes it — so "has this policy been live
 * before?" is answered there, or by any published version for a policy
 * that has since been unpublished. Runs after field access has stripped
 * `version` from the request body, so nobody can type a number in.
 */
const countPublishes: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation === "create") {
    data.version = 1;
    return data;
  }
  const live = await findLiveRow(req, "policies", originalDoc?.id);
  const current = typeof live?.version === "number" && live.version > 0 ? live.version : 1;
  if (data._status !== "published") {
    data.version = current;
    return data;
  }
  let everPublished = live?._status === "published";
  if (!everPublished && originalDoc?.id) {
    const { totalDocs } = await req.payload.countVersions({
      collection: "policies",
      where: { and: [{ parent: { equals: originalDoc.id } }, { "version._status": { equals: "published" } }] },
      req,
    });
    everPublished = totalDocs > 0;
  }
  data.version = everPublished ? current + 1 : current;
  return data;
};

const revalidate = revalidationHooks("policies");

export const Policies: CollectionConfig = {
  slug: "policies",
  labels: { singular: "Policy", plural: "Policies" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "title",
    defaultColumns: ["title", "navLabel", "order", "version", "_status", "updatedAt"],
    description: "The studio policies, reproduced as written. Do not paraphrase: a policy restated in nicer words is a different policy.",
    listSearchableFields: ["title", "navLabel", "summary", "slug"],
    preview: previewFor("policies"),
  },
  defaultSort: "order",
  versions: contentDrafts,
  access: draftedContentAccess,
  hooks: {
    beforeChange: [guardSlugChange({ noun: "policy" }), countPublishes, slugRedirectHooks.beforeChange, ...revalidate.beforeChange],
    afterChange: [slugRedirectHooks.afterChange, ...revalidate.afterChange],
    afterDelete: revalidate.afterDelete,
  },
  fields: withContentTab([
    {
      type: "row",
      fields: [
        {
          name: "title",
          type: "text",
          label: "Title",
          required: true,
          maxLength: 40,
          admin: { width: "60%", description: "The page title and the list entry. In the large heading the words after “ & ” (or else the last word) are set in the script face." },
        },
        {
          name: "navLabel",
          type: "text",
          label: "Short label (footer)",
          required: true,
          maxLength: 32,
          admin: { width: "40%" },
        },
      ],
    },
    slug({ from: "title", admin: { position: "sidebar", description: "The address: /policies/{slug}. A change on a published policy creates a redirect." } }),
    {
      name: "summary",
      type: "textarea",
      label: "Summary",
      required: true,
      maxLength: 120,
      admin: { description: "One line on the Policies page and the standfirst on the policy's own. Describes the page; never adds a rule to it." },
    },
    {
      name: "sections",
      type: "array",
      label: "Sections",
      labels: { singular: "Section", plural: "Sections" },
      minRows: 1,
      admin: { description: "Each section has a heading and one or more paragraphs, lists, age tables or callouts." },
      fields: [
        { name: "heading", type: "text", label: "Heading", required: true, maxLength: 48, admin: { description: "A label, never a claim." } },
        {
          name: "blocks",
          type: "blocks",
          label: "Content",
          labels: { singular: "Block", plural: "Blocks" },
          blocks: policyBlocks,
          minRows: 1,
        },
      ],
    },
    {
      name: "effectiveDate",
      type: "date",
      label: "Effective from",
      admin: { position: "sidebar", date: { displayFormat: "d MMM yyyy" }, description: "Optional. Printed as “Effective from …” when set." },
    },
    {
      name: "showInLegalRow",
      type: "checkbox",
      label: "Show in footer legal row",
      defaultValue: false,
      admin: { position: "sidebar", description: "For Privacy and Terms when written; the other policies live in the footer's Policies column." },
    },
    {
      name: "requiresCheckoutConsent",
      type: "checkbox",
      label: "Require agreement at checkout",
      defaultValue: false,
      admin: { position: "sidebar", description: "Adds the policy to the “I have read and agree” box; the agreed version is stored on the order." },
    },
    {
      name: "version",
      type: "number",
      label: "Version",
      defaultValue: 1,
      min: 1,
      access: { create: neverField, update: neverField },
      admin: { position: "sidebar", readOnly: true, step: 1, description: "Counts publishes. Orders record the version agreed to." },
    },
    orderField(),
  ]),
};
