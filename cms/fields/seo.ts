import type { CheckboxField, Field } from "payload";

/**
 * ==========================================================================
 * seo() — what the site adds on top of @payloadcms/plugin-seo
 * ==========================================================================
 *
 * The SEO tab itself — `meta.title`, `meta.description`, `meta.image`, the
 * snippet preview and the generate buttons — comes from the plugin, which
 * 2A wires into payload.config.ts in Phase 2 for the five public-facing
 * collections (SPEC §A.4, §I). The one thing the plugin does not model is
 * "this page exists but must not be indexed": the booking surfaces, the
 * placeholder loyalty page, a draft landing page. That is `noindex`, and
 * `buildMetadata` (lib/seo.ts) turns it into `robots: noindex` per page.
 *
 * Two ways to use it: hand `seoFields` to the plugin's `fields` option so
 * the checkbox sits in the SEO tab under the plugin's own fields (the
 * intended wiring), or spread `seo()` into a collection that has no SEO tab.
 */

export const noindexField: CheckboxField = {
  name: "noindex",
  type: "checkbox",
  label: "Hide from search engines",
  defaultValue: false,
  admin: {
    description: "Adds a noindex tag. The page stays reachable by its address and from links.",
  },
};

/** For `seoPlugin({ fields: seoFields })` — keeps the plugin's defaults and appends ours. */
export const seoFields = ({ defaultFields }: { defaultFields: Field[] }): Field[] => [...defaultFields, noindexField];

export function seo(): Field[] {
  return [noindexField];
}
