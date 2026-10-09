/**
 * `seo-defaults` — "Search & sharing defaults" (SPEC §C.3 row 6; fields from
 * docs/cms/research/01-content-inventory.md §3.9).
 *
 * Per-page titles, descriptions and share images come from the SEO tab that
 * `@payloadcms/plugin-seo` adds to each content collection (Phase 2). This
 * global holds what is the same on every page: the title template, the share
 * image used when a page has none, and the paths search engines are asked to
 * skip. The default meta description is Site details → Search tagline and is
 * deliberately not duplicated here.
 *
 * `robotsDisallow` is the one field an editor could do real damage with (a
 * stray "/" de-indexes the site), so it is admin-only even though §J leaves
 * the rest of this global open to editors. `/admin` and `/api` are added by
 * `app/robots.ts` itself and need not be listed.
 */

import type { GlobalConfig } from "payload";

import { anyone, isEditor } from "@/cms/access/roles";
import { TAGS } from "@/lib/cms/cache";

import { choice, copy, pathList } from "./copyFields";
import { settingsAfterChange } from "./settingsHooks";

export const SEO_DEFAULTS_SLUG = "seo-defaults" as const;

export const SeoDefaults: GlobalConfig = {
  slug: SEO_DEFAULTS_SLUG,
  label: "Search & sharing defaults",
  admin: {
    group: "Settings",
    description: "Title template, default share image, robots rules.",
  },
  access: { read: anyone, update: isEditor },
  hooks: {
    afterChange: [settingsAfterChange({ slug: SEO_DEFAULTS_SLUG, revalidateTag: TAGS.seo })],
  },
  fields: [
    copy("titleTemplate", "Title template", {
      description: "%s is replaced with the page title, e.g. “%s · Maison Palettia”.",
      max: 60,
      required: true,
      defaultValue: "%s · Maison Palettia",
      validate: (value) =>
        typeof value === "string" && value.includes("%s") ? true : "Include %s where the page title should go.",
    }),
    {
      name: "shareImage",
      type: "upload",
      relationTo: "media",
      label: "Default share image",
      filterOptions: { mimeType: { in: ["image/jpeg", "image/png", "image/webp"] } },
      admin: {
        description:
          "1200×630, JPEG under 600 KB (WhatsApp drops larger previews). Leave empty to keep the generated logo card.",
      },
    },
    choice(
      "twitterCard",
      "X / Twitter card style",
      [
        { label: "Large image", value: "summary_large_image" },
        { label: "Small summary", value: "summary" },
      ],
      { defaultValue: "summary_large_image" },
    ),
    pathList("robotsDisallow", "Paths hidden from search engines", {
      description:
        "Written into robots.txt. Checkout, confirmation and account pages belong here; never add “/”.",
      lock: true,
      maxRows: 20,
      defaultValue: [
        "/checkout",
        "/payment-success",
        "/booking-status",
        "/my-bookings",
        "/events/*/book",
        "/button-preview",
        "/dev",
      ],
    }),
  ],
};
