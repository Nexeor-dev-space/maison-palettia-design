import type { GroupField, TextFieldSingleValidation } from "payload";

/**
 * ==========================================================================
 * link() — one destination shape for every button, menu item and door
 * ==========================================================================
 *
 * `{ type, url, anchor, newTab }`:
 *
 *   · `type: "internal"` — a path on this site, typed as it appears in the
 *     address bar ("/events", "/private-events/book"). Validated to start
 *     with one slash and contain nothing a browser would treat as a scheme
 *     or a protocol-relative host, so a link can never leave the site by
 *     accident.
 *   · `type: "external"` — an https URL to another site; may open in a new tab.
 *   · `anchor` — a section id, kept apart from the path so a renamed page
 *     keeps its anchors and the mapper can print `/events#scheduled`.
 *
 * WHY NO `page` RELATIONSHIP YET. SPEC §E describes `link` as
 * `{ type, page rel, url, anchor }`. Payload validates every `relationTo`
 * against the collection list when the config is built
 * (fields/config/sanitize.js → InvalidFieldRelationship), and `pages` does
 * not exist until Phase 2A-0. The settings globals written in Phase 1C use
 * `link()` today (`booking-settings.closedCtaLink`,
 * `analytics-settings.consent.policyLink`), so a `pages` relationship here
 * would stop the Phase 1 config from loading at all. Internal links are
 * therefore paths for now, which the `redirects` collection keeps valid
 * across slug renames (SPEC §D.2). Phase 2 adds, additively and without a
 * data rewrite:
 *
 *     { name: "page", type: "relationship", relationTo: "pages",
 *       admin: { condition: (_, s) => s?.type === "internal" } }
 *
 * and lets the mapper prefer `page` over `url` when both are set. Nothing
 * stored under the Phase 1 shape changes meaning.
 */

/** A site path: one leading slash, no "//", no scheme, optional query. */
export const INTERNAL_PATH = /^\/(?!\/)[A-Za-z0-9\-._~/]*(\?[A-Za-z0-9\-._~/=&%+]*)?$/;
/** https only: an http:// link from a Dubai studio's site is a mixed-content warning waiting to happen. */
export const HTTPS_URL = /^https:\/\/[A-Za-z0-9.-]+(:\d+)?(\/\S*)?$/;
export const ANCHOR_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

export type LinkValue = {
  type?: "internal" | "external" | null;
  url?: string | null;
  anchor?: string | null;
  newTab?: boolean | null;
};

export type LinkOptions = {
  name?: string;
  label?: string;
  description?: string;
  required?: boolean;
  /** Pre-filled values — e.g. `{ url: "/contact" }` for the closed-bookings button. */
  defaultValue?: LinkValue;
  admin?: GroupField["admin"];
};

/** Internal → a site path; external → https. Which rule applies is decided by the sibling `type`. */
const validateUrl: TextFieldSingleValidation = (value, { siblingData, required }) => {
  if (!value) return required ? "Enter an address." : true;
  if (typeof value !== "string") return "Enter an address.";
  const type = (siblingData as LinkValue | undefined)?.type ?? "internal";
  if (type === "external") return HTTPS_URL.test(value) ? true : "External links must start with https://";
  return INTERNAL_PATH.test(value) ? true : "Site addresses start with a single slash, e.g. /events";
};

const validateAnchor: TextFieldSingleValidation = (value) =>
  !value || (typeof value === "string" && ANCHOR_ID.test(value)) ? true : "Section ids are lowercase letters, digits and hyphens.";

export function link(opts: LinkOptions = {}): GroupField {
  const { name = "link", label = "Link", description, required = false, defaultValue, admin } = opts;
  return {
    name,
    type: "group",
    label,
    admin: { description, ...admin },
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "type",
            type: "radio",
            label: "Goes to",
            required: true,
            defaultValue: defaultValue?.type ?? "internal",
            options: [
              { label: "A page on this site", value: "internal" },
              { label: "Another website", value: "external" },
            ],
            admin: { layout: "horizontal", width: "40%" },
          },
          {
            name: "url",
            type: "text",
            label: "Address",
            required,
            defaultValue: defaultValue?.url ?? undefined,
            admin: {
              width: "60%",
              placeholder: "/events  or  https://…",
            },
            validate: validateUrl,
          },
        ],
      },
      {
        name: "anchor",
        type: "text",
        label: "Section on the page (optional)",
        defaultValue: defaultValue?.anchor ?? undefined,
        validate: validateAnchor,
        admin: {
          description: "Scrolls to a section, e.g. scheduled → /events#scheduled",
          condition: (_, siblingData) => (siblingData as LinkValue | undefined)?.type !== "external",
        },
      },
      {
        name: "newTab",
        type: "checkbox",
        label: "Open in a new tab",
        defaultValue: defaultValue?.newTab ?? false,
        admin: { condition: (_, siblingData) => (siblingData as LinkValue | undefined)?.type === "external" },
      },
    ],
  };
}

/** The href a renderer should print, or null when the link is empty. */
export function resolveLink(value: LinkValue | null | undefined): string | null {
  if (!value?.url) return null;
  if (value.type === "external") return value.url;
  return value.anchor ? `${value.url}#${value.anchor}` : value.url;
}
