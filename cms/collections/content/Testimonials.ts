import type { CollectionConfig } from "payload";

import { testimonialPermissionGate } from "@/cms/hooks/publishGate";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess } from "./shared";

/**
 * ==========================================================================
 * testimonials — quotes with permission (SPEC §D.2; 01 §4.9)
 * ==========================================================================
 *
 * Empty at launch, on purpose: the two quotes in lib/testimonials.ts are
 * invented and marked "MUST NOT SHIP". The collection exists for the day the
 * studio has real ones, and `permissionOnFile` is the gate — `publishGate`
 * refuses to publish a quote without it, and the `testimonials` block
 * prints nothing else. Publishing purges / and /events (./revalidation.ts).
 */
const revalidate = revalidationHooks("testimonials");

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  labels: { singular: "Testimonial", plural: "Testimonials" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "attribution",
    defaultColumns: ["attribution", "experience", "permissionOnFile", "_status", "updatedAt"],
    description: "Quotes from visitors. Only quotes with written permission on file can be published.",
    listSearchableFields: ["quote", "attribution"],
    components: {
      beforeListTable: [
        { path: "@/cms/components/admin/ListIntro#ListIntro", clientProps: { icon: "text", heading: "No testimonials yet", body: "Short quotes from guests, shown on the site where a page asks for them. Tick “permission on file” once the person has agreed to be quoted — only those are published.", actions: [{ label: "Add a testimonial", href: "/collections/testimonials/create", primary: true }] } },
      ],
    },
  },
  defaultSort: "-createdAt",
  versions: contentDrafts,
  access: draftedContentAccess,
  hooks: {
    beforeValidate: [testimonialPermissionGate],
    beforeChange: revalidate.beforeChange,
    afterChange: revalidate.afterChange,
    afterDelete: revalidate.afterDelete,
  },
  fields: [
    {
      name: "quote",
      type: "textarea",
      label: "Quote",
      required: true,
      maxLength: 280,
      admin: { description: "One or two sentences. Anything longer stops being a quote." },
    },
    {
      name: "attribution",
      type: "text",
      label: "Who said it",
      required: true,
      maxLength: 60,
      admin: { description: "A first name with permission, or the session they came to." },
    },
    {
      name: "experience",
      type: "relationship",
      relationTo: "experiences",
      label: "Experience",
      admin: { position: "sidebar" },
    },
    {
      name: "permissionOnFile",
      type: "checkbox",
      label: "Written permission to publish",
      defaultValue: false,
      admin: { position: "sidebar", description: "Required before the quote can be published." },
    },
  ],
};
