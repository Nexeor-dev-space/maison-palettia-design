import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import type { CollectionBeforeChangeHook, CollectionConfig, FieldHook } from "payload";

import { neverField } from "@/cms/access/roles";
import { slug } from "@/cms/fields";
import { guardSlugChange } from "@/cms/hooks/formatSlug";
import { imageryPublishGate } from "@/cms/hooks/publishGate";
import { slugRedirectHooks } from "@/cms/hooks/slugRedirect";
import { DEFAULT_AUTHOR_NAME, openingLines, readingMinutes } from "@/lib/cms/journalShared";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, image, previewFor, withContentTab } from "./shared";

/**
 * ==========================================================================
 * posts — the Journal (/journal, /journal/{slug})
 * ==========================================================================
 *
 * The studio's stories: a new season of workshops, a behind-the-scenes look
 * at a candle pour, a guide to planning a hen party. Each post is a cover
 * photograph, a title, a short excerpt for its card and a rich-text body;
 * the site prints them as cards on /journal (newest first, filterable by
 * category) and as a reading page at /journal/{slug}.
 *
 * Same conventions as every page-backed collection (SPEC §D.2): drafts with
 * autosave and scheduled publishing, live preview, the SEO tab (wired in
 * payload.config.ts), a published address changed by admins only with a
 * redirect from the old one, the imagery provenance gate on the cover, and
 * purge-on-publish (./revalidation.ts).
 *
 * WHAT IS COMPUTED. `publishedAt` is stamped on the first publish when the
 * editor left it empty (a scheduled publish stamps the moment it goes out);
 * it stays editable so an older story can be backdated. `excerpt` is only
 * ever what the editor typed: the fallback is `autoExcerpt`, a hidden field
 * RECOMPUTED from the opening lines of the body on every save (never copied
 * into `excerpt`, which would freeze it at the first save — or at a
 * half-written sentence under autosave). `readingTime` is recomputed the
 * same way. Both are stored, not virtual, so the listing can print them
 * without reading every body.
 *
 * FEATURED. Any number of posts may be ticked; the site shows the newest
 * featured one large at the top of /journal (lib/cms/journal.ts →
 * `getFeaturedPost`), so ticking a new one is all it takes to swap it.
 */

/** The body editor: prose, h2–h4, lists, quotes, links, photographs with captions, a divider. */
export const journalEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    LinkFeature({ enabledCollections: ["posts", "pages", "experiences"] }),
    UploadFeature({
      collections: {
        media: {
          fields: [
            { name: "caption", type: "text", label: "Caption", maxLength: 160, admin: { description: "Printed under the photograph. Leave empty for none." } },
            {
              name: "width",
              type: "select",
              label: "Width",
              defaultValue: "text",
              options: [
                { label: "Text width", value: "text" },
                { label: "Wide (breaks out of the text column)", value: "wide" },
              ],
            },
          ],
        },
      },
    }),
    HorizontalRuleFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
});

/** beforeChange: the first publish stamps `publishedAt` unless the editor chose a date. */
const stampPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (data.publishedAt) return data;
  if (originalDoc?.publishedAt) data.publishedAt = originalDoc.publishedAt;
  else if (data._status === "published") data.publishedAt = new Date().toISOString();
  return data;
};

/** Field beforeChange on `autoExcerpt`: always the opening lines of the current body (the card's fallback when `excerpt` is empty). */
const autoExcerptFromBody: FieldHook = ({ siblingData, value }) => (siblingData?.body ? openingLines(siblingData.body, 200) : (value ?? null));

/** Field beforeChange on `readingTime`: always recomputed from the body. */
const readingTimeFromBody: FieldHook = ({ siblingData, value }) => (siblingData?.body ? readingMinutes(siblingData.body) : (value ?? 1));

const revalidate = revalidationHooks("posts");

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "Journal post", plural: "Journal" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "title",
    defaultColumns: ["coverImage", "title", "category", "_status", "publishedAt"],
    description: "Stories for the Journal page. The newest featured post is shown large at the top; the rest are cards, newest first.",
    listSearchableFields: ["title", "excerpt", "slug"],
    components: {
      beforeListTable: [
        {
          path: "@/cms/components/admin/ListIntro#ListIntro",
          clientProps: {
            icon: "pen",
            heading: "No journal posts yet",
            body: "Write about a new season, a behind-the-scenes moment or a how-to. Each post needs a title, a cover photograph and some text; it appears on the Journal page as soon as it is published.",
            actions: [{ label: "Write a journal post", href: "/collections/posts/create", primary: true }],
          },
        },
      ],
    },
    preview: previewFor("posts"),
  },
  defaultSort: "-publishedAt",
  versions: contentDrafts,
  access: draftedContentAccess,
  hooks: {
    beforeValidate: [imageryPublishGate([{ field: "coverImage", noun: "The cover photograph" }])],
    beforeChange: [guardSlugChange({ noun: "journal post" }), stampPublishedAt, slugRedirectHooks.beforeChange, ...revalidate.beforeChange],
    afterChange: [slugRedirectHooks.afterChange, ...revalidate.afterChange],
    afterDelete: revalidate.afterDelete,
  },
  fields: withContentTab([
    {
      name: "title",
      type: "text",
      label: "Title",
      required: true,
      maxLength: 90,
      admin: { description: "The headline, up to 90 characters. Shorter reads better on the cards." },
    },
    {
      name: "excerpt",
      type: "textarea",
      label: "Short summary",
      maxLength: 220,
      admin: {
        rows: 3,
        description: "One or two sentences for the card and for search results. Leave empty to use the opening lines of the post.",
      },
    },
    {
      name: "autoExcerpt",
      type: "textarea",
      label: "Opening lines (automatic)",
      access: { create: neverField, update: neverField },
      hooks: { beforeChange: [autoExcerptFromBody] },
      admin: { hidden: true, disableListColumn: true, disableListFilter: true },
    },
    {
      ...image("coverImage", "Cover photograph", "Shown on the card and across the top of the post. Landscape works best, at least 1600 px wide. Click the photo in Media to set its focal point."),
      required: true,
    },
    {
      name: "body",
      type: "richText",
      label: "Post",
      required: true,
      editor: journalEditor,
      admin: {
        description: "Use Heading 2 for sections. Add photographs with the + button or by typing /upload; each can have a caption.",
      },
    },
    {
      name: "relatedPosts",
      type: "relationship",
      relationTo: "posts",
      hasMany: true,
      maxRows: 3,
      label: "Read next (optional)",
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: {
        description: "Up to three posts suggested at the end. Leave empty to suggest the newest posts in the same category.",
      },
    },
    slug({ from: "title", admin: { position: "sidebar", description: "The address: /journal/{slug}. Leave empty to make it from the title." } }),
    {
      name: "publishedAt",
      type: "date",
      label: "Publish date",
      index: true,
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" },
        description: "Printed on the post. Filled in when you first publish; change it to backdate a story.",
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "post-categories",
      label: "Category",
      admin: { position: "sidebar", description: "One category; it becomes the coloured label on the card and a filter on the Journal page." },
    },
    {
      name: "featured",
      type: "checkbox",
      label: "Feature at the top of the Journal",
      defaultValue: false,
      admin: { position: "sidebar", description: "If several are ticked, the newest one is shown." },
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
      maxRows: 8,
      maxLength: 32,
      label: "Tags (optional)",
      admin: { position: "sidebar", description: "Short words, e.g. candles, kids, behind the scenes. Press Enter after each." },
    },
    {
      name: "author",
      type: "group",
      label: "Written by",
      admin: { position: "sidebar" },
      fields: [
        { name: "name", type: "text", label: "Name", maxLength: 60, defaultValue: DEFAULT_AUTHOR_NAME, admin: { description: "Leave as Maison Palettia for a studio post." } },
        { name: "role", type: "text", label: "Role (optional)", maxLength: 60, admin: { description: "e.g. Founder, Workshop host." } },
        image("photo", "Photo (optional)", "A small round portrait beside the name."),
      ],
    },
    {
      name: "readingTime",
      type: "number",
      label: "Reading time (minutes)",
      min: 1,
      access: { create: neverField, update: neverField },
      hooks: { beforeChange: [readingTimeFromBody] },
      admin: { position: "sidebar", readOnly: true, description: "Worked out from the length of the post when you save." },
    },
  ]),
};
