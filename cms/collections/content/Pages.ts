import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { isAdmin } from "@/cms/access/roles";
import { blocks } from "@/cms/blocks";
import { slug } from "@/cms/fields";
import { guardSlugChange, refuseFixedPageDelete } from "@/cms/hooks/formatSlug";
import { slugRedirectHooks } from "@/cms/hooks/slugRedirect";

import { revalidateLayoutOnFirstPublish, revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, previewFor, withContentTab } from "./shared";

/**
 * ==========================================================================
 * pages — the page builder (SPEC §D.2, §E)
 * ==========================================================================
 *
 * A page is a title, a slug and an ordered list of blocks (§E); the blocks
 * supply data and the existing components render it. Eleven pages are part
 * of the site's structure — they have routes of their own under
 * app/(site)/ and the navigation points at them — so their slugs are fixed:
 * `FIXED_PAGE_SLUGS` below is THE list, used by the delete-refusal and
 * slug-change hooks (2A-1), the seed (§F.7), the `[...slug]` catch-all's
 * exclusions (2D) and the `FixedPageBadge` (cms/components/fields/
 * FixedPageBadge.tsx, handed the list through `admin.custom` so the admin's
 * browser bundle never imports this file). On a fixed page the address
 * field is also read-only (field `access.update`), so the editor sees the
 * rule instead of discovering it from a refused save. Nothing else may
 * carry a second copy of the list. Any other slug is a free landing page
 * served by the catch-all.
 *
 * Drafts and live preview (`contentDrafts`; live preview opens by default
 * here, §I); the SEO tab comes from @payloadcms/plugin-seo, wired in
 * payload.config.ts, so there are no `meta` fields here. `publishedAt` is
 * stamped on the first publish (below) and shown read-only.
 *
 * Hooks: the fixed pages cannot be deleted or renamed by anyone
 * (cms/hooks/formatSlug.ts); a published page's address is changed by
 * admins only, and the old address then redirects (cms/hooks/slugRedirect.ts);
 * publishing purges the page's route, and a page's first publish also the
 * layout (./revalidation.ts).
 */

export const FIXED_PAGE_SLUGS = [
  "home",
  "about",
  "locations",
  "gallery",
  "faq",
  "contact",
  "policies",
  "loyalty",
  "events",
  "private-events",
  "private-events-book",
] as const;

export type FixedPageSlug = (typeof FIXED_PAGE_SLUGS)[number];

export const isFixedPageSlug = (value: unknown): value is FixedPageSlug =>
  typeof value === "string" && (FIXED_PAGE_SLUGS as readonly string[]).includes(value);

/** beforeChange: the first publish stamps `publishedAt`; every later version carries it. */
const stampFirstPublish: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (data._status === "published" && !data.publishedAt && !originalDoc?.publishedAt) {
    data.publishedAt = new Date().toISOString();
  } else if (!data.publishedAt && originalDoc?.publishedAt) {
    data.publishedAt = originalDoc.publishedAt;
  }
  return data;
};

const revalidate = revalidationHooks("pages");

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Page", plural: "Pages" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description:
      "Each page is a list of sections. The eleven pages that make up the site cannot be deleted or renamed; add new pages for landing pages.",
    listSearchableFields: ["title", "slug"],
    preview: previewFor("pages"),
    livePreview: { openByDefault: true },
  },
  defaultSort: "title",
  versions: contentDrafts,
  access: { ...draftedContentAccess, delete: isAdmin },
  hooks: {
    beforeChange: [guardSlugChange({ fixedSlugs: FIXED_PAGE_SLUGS }), stampFirstPublish, slugRedirectHooks.beforeChange, ...revalidate.beforeChange],
    afterChange: [slugRedirectHooks.afterChange, ...revalidate.afterChange, revalidateLayoutOnFirstPublish],
    beforeDelete: [refuseFixedPageDelete(FIXED_PAGE_SLUGS)],
    afterDelete: revalidate.afterDelete,
  },
  fields: withContentTab([
    {
      name: "title",
      type: "text",
      label: "Page title",
      required: true,
      maxLength: 80,
      admin: { description: "Used in the admin and as the fallback search title." },
    },
    {
      name: "fixedPageBadge",
      type: "ui",
      admin: {
        position: "sidebar",
        components: { Field: "@/cms/components/fields/FixedPageBadge#FixedPageBadge" },
        custom: { fixedSlugs: FIXED_PAGE_SLUGS },
      },
    },
    slug({
      from: "title",
      // Read-only on the eleven fixed pages, for everyone; the formatSlug.ts
      // hook is still the guarantee for anything that skips the admin.
      access: { update: ({ doc }) => !isFixedPageSlug((doc as { slug?: unknown } | undefined)?.slug) },
      admin: {
        position: "sidebar",
        description:
          "The page's address, e.g. about → /about. Home is /. The eleven fixed pages keep theirs; on other published pages a change creates a redirect from the old address.",
      },
    }),
    {
      name: "blocks",
      type: "blocks",
      label: "Sections",
      labels: { singular: "Section", plural: "Sections" },
      blocks,
      admin: { initCollapsed: true, description: "Top to bottom, as the page reads. Drag to reorder." },
    },
    {
      name: "publishedAt",
      type: "date",
      label: "First published",
      admin: { position: "sidebar", readOnly: true, date: { displayFormat: "d MMM yyyy, HH:mm" } },
    },
  ]),
};
