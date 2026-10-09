import type { CollectionConfig, TextFieldSingleValidation } from "payload";

import { anyone, isEditor, neverField } from "@/cms/access/roles";
import { HTTPS_URL } from "@/cms/fields";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP } from "./shared";

/**
 * ==========================================================================
 * redirects — old addresses that still land somewhere (SPEC §D.2)
 * ==========================================================================
 *
 * When a published page, experience, session, programme or policy changes
 * its slug, 2A-1's `slugRedirect` hook upserts a row here from the old
 * address to the new (`source: auto`); editors add their own for campaign
 * URLs and typos (`manual`). The site consults the list only on its way to
 * a 404 — `lib/cms/redirects.ts::redirectOr404(pathname)` in every dynamic
 * route — so a redirect can never shadow a live page. Rows are kept one hop
 * long when they are written (cms/hooks/slugRedirect.ts re-points chains),
 * and the reader still follows up to five hops so a hand-made chain lands on
 * the current address in one response. Permanent rows answer 308 (Next's
 * `permanentRedirect`), temporary ones 307. The three legacy `/workshops*`
 * rules stay in next.config.ts.
 *
 * `hits` is not counted yet — counting would turn every cached render into a
 * database write (lib/cms/redirects.ts says why) — so it is hidden until
 * something counts it.
 *
 * `from` is a path on this site; `to` is a path or an https URL. A row that
 * points at itself is refused at validation. Every save purges the
 * redirects tag and the `from` path, which until now served a cached 404
 * (./revalidation.ts).
 */

export const REDIRECT_FROM = /^\/[a-z0-9\-/]{1,200}$/;
export const REDIRECT_TO = /^\/[a-z0-9\-/?=&%.]{1,300}$/;

const validateFrom: TextFieldSingleValidation = (value) =>
  typeof value === "string" && REDIRECT_FROM.test(value) ? true : "A site path: lowercase letters, digits, hyphens and slashes, starting with /.";

const validateTo: TextFieldSingleValidation = (value, { siblingData }) => {
  if (typeof value !== "string" || !(REDIRECT_TO.test(value) || HTTPS_URL.test(value))) {
    return "A site path starting with /, or a full https:// address.";
  }
  if (value === (siblingData as { from?: string } | undefined)?.from) return "A redirect cannot point at its own address.";
  return true;
};

export const Redirects: CollectionConfig = {
  slug: "redirects",
  labels: { singular: "Redirect", plural: "Redirects" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "from",
    defaultColumns: ["from", "to", "permanent", "source", "updatedAt"],
    description: "Old addresses and where they go now. Created automatically when a published slug changes; add your own for campaign links.",
    listSearchableFields: ["from", "to"],
  },
  defaultSort: "from",
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  hooks: revalidationHooks("redirects"),
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "from",
          type: "text",
          label: "From",
          required: true,
          unique: true,
          index: true,
          validate: validateFrom,
          admin: { width: "50%", placeholder: "/old-address", description: "The address visitors still arrive at." },
        },
        {
          name: "to",
          type: "text",
          label: "To",
          required: true,
          validate: validateTo,
          admin: { width: "50%", placeholder: "/events  or  https://…", description: "Where they should land." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "permanent",
          type: "checkbox",
          label: "Permanent",
          defaultValue: true,
          admin: {
            width: "50%",
            description: "Search engines move their links to the new address. Untick for a temporary move, e.g. a page that is coming back.",
          },
        },
        {
          name: "source",
          type: "select",
          label: "Created",
          required: true,
          defaultValue: "manual",
          options: [
            { label: "By hand", value: "manual" },
            { label: "Automatically, on a slug change", value: "auto" },
          ],
          admin: { width: "50%", readOnly: true },
        },
      ],
    },
    {
      name: "hits",
      type: "number",
      label: "Times followed",
      defaultValue: 0,
      min: 0,
      access: { create: neverField, update: neverField },
      // Not counted yet (see above): hidden rather than showing a column of zeros as if it were data.
      admin: { position: "sidebar", readOnly: true, step: 1, hidden: true, description: "Not counted yet." },
    },
  ],
};
