import type { Condition, UIField } from "payload";

/**
 * ==========================================================================
 * brandCopyLink() — "this text comes from Brand wording" (SPEC §E)
 * ==========================================================================
 *
 * Several page-builder blocks print a sentence that lives in the `brand-copy`
 * global — the hero's tagline, the opening statement, the "find us" line,
 * the private-event steps — because that sentence is shared with other pages
 * and must be edited once. The block carries a switch ("Use Brand wording",
 * default on); while it is on, the block's own override fields are hidden by
 * `admin.condition` and THIS field takes their place. It stores nothing. It
 * is a `ui` field whose only job is to tell the editor where the words are
 * and offer the deep link: "This text comes from **Brand wording → Script
 * tagline**. Edit it there →", or "Turn off 'Use Brand wording' to write your
 * own". Click-to-edit (§G.5) uses the same `global` + `path` pair, so a click
 * on the live preview lands on the global's field, not on an inert override.
 *
 * `path` is the field path INSIDE the global, dotted for groups
 * (`openingStatement.heading`); the component turns it into Payload's id
 * (`field-openingStatement__heading`). `label` is the global field's label
 * as the editor sees it — spell it as cms/globals/BrandCopy.ts does.
 *
 * The component is cms/components/fields/BrandCopyLink.tsx (a client
 * component; `admin.custom` reaches the client config, field `custom`
 * would not). Everything it needs is in `admin.custom.brandCopy`.
 */

export const BRAND_COPY_LINK_COMPONENT = "@/cms/components/fields/BrandCopyLink#BrandCopyLink";

export type BrandCopyLinkOptions = {
  /** Field name; only needed when one block shows two links. Default `brandCopyLink`. */
  name?: string;
  /** Dotted path of the field inside `brand-copy`, e.g. `openingStatement.heading`. */
  path: string;
  /** The label that field carries in Brand wording, e.g. "Script tagline". */
  label: string;
  /** Show only while the block's "Use Brand wording" switch is on. */
  condition?: Condition;
  /** Which switch turns the link off — named so the component can say "Turn off '…'". */
  toggleLabel?: string;
};

export type BrandCopyLinkCustom = { global: "brand-copy"; path: string; label: string; toggleLabel?: string };

export function brandCopyLink(opts: BrandCopyLinkOptions): UIField {
  const { name = "brandCopyLink", path, label, condition, toggleLabel } = opts;
  const brandCopy: BrandCopyLinkCustom = { global: "brand-copy", path, label, ...(toggleLabel ? { toggleLabel } : {}) };
  return {
    name,
    type: "ui",
    label: `From Brand wording → ${label}`,
    admin: {
      condition,
      disableListColumn: true,
      custom: { brandCopy },
      components: { Field: BRAND_COPY_LINK_COMPONENT },
    },
  };
}
