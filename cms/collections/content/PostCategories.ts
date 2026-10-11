import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig } from "payload";

import { anyone, isAdmin, isEditor } from "@/cms/access/roles";
import { slug } from "@/cms/fields";
import { slugRedirectHooks } from "@/cms/hooks/slugRedirect";
import { JOURNAL_CATEGORY_COLOURS } from "@/lib/cms/journalShared";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, orderField } from "./shared";

/**
 * ==========================================================================
 * post-categories — the Journal's sections (/journal/category/{slug})
 * ==========================================================================
 *
 * A handful of labels — "Studio news", "How-to", "Behind the scenes" — each
 * with a brand ink for its chip on the cards and the filter row. No drafts:
 * a category is a name and a colour, and it only shows on the site through
 * the published posts that use it (`listCategories` reports a `postCount`,
 * and the site leaves out the chips of categories with none).
 *
 * Access: anyone reads (names are public), content staff create and edit,
 * admins delete — and only once no post uses the category, so a published
 * post never loses its label without someone choosing a new one.
 * Renaming the address of a category creates a redirect from the old one
 * (cms/hooks/slugRedirect.ts); every change purges the Journal
 * (./revalidation.ts), and the posts' tag with it, since cards print the
 * category name.
 */

const refuseDeleteInUse: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (req.context?.system === true) return;
  const { totalDocs } = await req.payload.count({ collection: "posts", where: { category: { equals: id } }, overrideAccess: true, req });
  if (totalDocs > 0) {
    throw new APIError(
      `${totalDocs} journal ${totalDocs === 1 ? "post uses" : "posts use"} this category. Move ${totalDocs === 1 ? "it" : "them"} to another category first.`,
      409,
      undefined,
      true,
    );
  }
};

const revalidate = revalidationHooks("post-categories");

export const PostCategories: CollectionConfig = {
  slug: "post-categories",
  labels: { singular: "Journal category", plural: "Journal categories" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "colour", "order", "updatedAt"],
    description: "The sections of the Journal. Each post belongs to one; the colour is its label on the cards.",
    listSearchableFields: ["name", "slug", "description"],
  },
  defaultSort: "order",
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  hooks: {
    beforeChange: [slugRedirectHooks.beforeChange, ...revalidate.beforeChange],
    afterChange: [slugRedirectHooks.afterChange, ...revalidate.afterChange],
    beforeDelete: [refuseDeleteInUse],
    afterDelete: revalidate.afterDelete,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          label: "Name",
          required: true,
          maxLength: 32,
          admin: { width: "60%", description: "Short — it is a label on a card, e.g. Studio news." },
        },
        {
          name: "colour",
          type: "select",
          label: "Label colour",
          required: true,
          defaultValue: "lilac",
          options: JOURNAL_CATEGORY_COLOURS.map((option) => ({ ...option })),
          admin: { width: "40%", description: "From the brand palette." },
        },
      ],
    },
    {
      name: "description",
      type: "textarea",
      label: "Description (optional)",
      maxLength: 160,
      admin: { rows: 2, description: "One sentence shown at the top of this category's page." },
    },
    slug({ from: "name", admin: { position: "sidebar", description: "The address: /journal/category/{slug}. Leave empty to make it from the name." } }),
    orderField("Position in the Journal's filter row: lower numbers come first."),
  ],
};
