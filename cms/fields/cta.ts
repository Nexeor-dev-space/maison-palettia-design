import type { GroupField, TextFieldSingleValidation } from "payload";

import { link, type LinkOptions } from "./link";

/**
 * ==========================================================================
 * cta() — a button: a label and a link()
 * ==========================================================================
 *
 * `{ label, link: { type, url, anchor, newTab } }` — the shape every block's
 * `primaryCta` / `secondaryCta` and the navigation's primary action share
 * (SPEC §E). The label cap of 30 characters is the widest the BlobButton
 * renders on a phone without wrapping; a block that needs shorter (the
 * header's 18) passes `maxLabel`.
 *
 * An optional CTA is "optional" as a whole: a label without a destination
 * is refused, and a destination without a label is treated as absent by the
 * renderer (`ctaHref` returns null), so a half-filled button never ships.
 */

export type CtaOptions = {
  name?: string;
  label?: string;
  required?: boolean;
  maxLabel?: number;
  description?: string;
  defaults?: { label?: string; link?: LinkOptions["defaultValue"] };
};

/** A label is required whenever a destination has been entered, so a half-filled button never ships. */
const validateLabel: TextFieldSingleValidation = (value, { siblingData, required }) => {
  const hasLink = Boolean((siblingData as { link?: { url?: string | null } } | undefined)?.link?.url);
  if (!value) return required || hasLink ? "Give the button a label." : true;
  return true;
};

export function cta(opts: CtaOptions = {}): GroupField {
  const { name = "cta", label = "Button", required = false, maxLabel = 30, description, defaults } = opts;
  return {
    name,
    type: "group",
    label,
    admin: { description },
    fields: [
      {
        name: "label",
        type: "text",
        label: "Button text",
        required,
        maxLength: maxLabel,
        defaultValue: defaults?.label,
        validate: validateLabel,
      },
      link({ name: "link", label: "Destination", required, defaultValue: defaults?.link }),
    ],
  };
}

export type CtaValue = { label?: string | null; link?: { type?: string | null; url?: string | null; anchor?: string | null } | null };

/** `{ label, href }` for a renderer, or null when either half is missing. */
export function ctaProps(value: CtaValue | null | undefined): { label: string; href: string } | null {
  const text = value?.label?.trim();
  const url = value?.link?.url;
  if (!text || !url) return null;
  const href = value.link?.type === "external" || !value.link?.anchor ? url : `${url}#${value.link.anchor}`;
  return { label: text, href };
}
