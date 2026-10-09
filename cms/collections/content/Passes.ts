import type { CollectionConfig } from "payload";

import { money, priceVirtual, slug } from "@/cms/fields";

import { revalidationHooks } from "./revalidation";
import { CONTENT_GROUP, contentDrafts, draftedContentAccess, image, orderField } from "./shared";

/**
 * ==========================================================================
 * passes — multi-session passes (SPEC §D.2; fields from 01 §4.8)
 * ==========================================================================
 *
 * A pass is bought rather than booked: a number of sessions and a validity,
 * redeemed later against dates in the programme (types/index.ts `Pass`).
 * The three on /loyalty today are placeholders, which is why `priceFils` is
 * optional — a pass with no price shows "not on sale online yet" — and why
 * `sellable` exists apart from publishing: a pass can be described before
 * the studio is ready to take money for it. Booking settings' "Passes are
 * final" switch governs the page-wide preview disclaimer.
 *
 * `validityDays` is the number the booking system counts with;
 * `validityLabel` is the sentence the visitor reads ("12 months from
 * purchase"). Both, because a printed sentence is not a calendar rule.
 *
 * Publishing purges /loyalty and /checkout (./revalidation.ts).
 */
export const Passes: CollectionConfig = {
  slug: "passes",
  labels: { singular: "Pass", plural: "Passes" },
  admin: {
    group: CONTENT_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "priceFils", "sessions", "sellable", "order", "_status"],
    description: "Multi-session passes sold on the Passes page. A pass without a price shows as not on sale yet.",
    listSearchableFields: ["name", "description", "slug"],
  },
  defaultSort: "order",
  versions: contentDrafts,
  access: draftedContentAccess,
  hooks: revalidationHooks("passes"),
  fields: [
    {
      name: "name",
      type: "text",
      label: "Pass name",
      required: true,
      maxLength: 24,
      admin: { description: "Set in capitals by the design." },
    },
    slug({ from: "name", admin: { position: "sidebar", description: "Internal name — visitors never see it. The basket refers to the pass by it, so leave it once the pass is on sale." } }),
    {
      name: "description",
      type: "textarea",
      label: "One sentence",
      required: true,
      maxLength: 120,
      admin: { description: "The benefits carry the detail." },
    },
    {
      type: "row",
      fields: [
        money("priceFils", { label: "Price", description: "In AED, e.g. 1400.00. Leave empty to show “not on sale yet”.", admin: { width: "50%" } }),
        {
          name: "sessions",
          type: "number",
          label: "Sessions included",
          min: 1,
          max: 100,
          admin: { width: "50%", step: 1, description: "How many session credits the pass holds." },
        },
      ],
    },
    priceVirtual("priceFils", "price"),
    {
      type: "row",
      fields: [
        {
          name: "validityDays",
          type: "number",
          label: "Validity (days)",
          min: 1,
          max: 3650,
          admin: { width: "50%", step: 1, description: "Counted from purchase by the booking system." },
        },
        {
          name: "validityLabel",
          type: "text",
          label: "Validity (printed)",
          maxLength: 40,
          admin: { width: "50%", description: "e.g. 12 months from purchase." },
        },
      ],
    },
    {
      name: "benefits",
      type: "array",
      label: "Benefits",
      labels: { singular: "Line", plural: "Lines" },
      minRows: 1,
      maxRows: 4,
      admin: { description: "Three or four short lines. Never paragraphs." },
      fields: [{ name: "line", type: "text", label: "Line", required: true, maxLength: 60 }],
    },
    image("image", "Photograph", "The plate beside the entry."),
    {
      name: "imageAlt",
      type: "text",
      label: "Photograph description on this pass",
      maxLength: 200,
      admin: {
        description:
          "Leave empty to use the description saved with the photograph in Media. Fill it only when this pass should describe the same photograph differently (screen readers read it aloud).",
      },
    },
    {
      name: "sellable",
      type: "checkbox",
      label: "On sale online",
      defaultValue: false,
      admin: { position: "sidebar", description: "Off: the pass is listed but cannot be added to a booking." },
    },
    orderField(),
  ],
};
