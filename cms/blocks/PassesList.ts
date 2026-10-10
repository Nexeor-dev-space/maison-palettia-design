import type { Block } from "payload";

import { cta } from "@/cms/fields";

import { eyebrow, lead, prose, row, text } from "./shared";

/**
 * `passesList` → components/loyalty/PassOffer.tsx (loyalty; the component
 * stays in place for 3F). SPEC §E.1, fields from 01 §5.1. The passes
 * themselves are the `passes` collection; this block is every word around
 * them — terms, buttons, the preview disclaimer shown while Booking settings
 * says passes are not final, the empty state, and the closing sentence with
 * its two links.
 */
export const PassesListBlock: Block = {
  slug: "passesList",
  interfaceName: "PassesListBlock",
  labels: { singular: "Passes list", plural: "Passes lists" },
  admin: { group: "Page sections" },
  fields: [
    eyebrow({ defaultValue: "Loyalty" }),
    text("heading", "Heading (script)", 40, { required: true, defaultValue: "Come More Than Once." }),
    lead(400),
    text("listHeading", "List heading", 32, { defaultValue: "Choose Your Pass" }),
    prose("previewDisclaimer", "Preview disclaimer", 400, {
      description: "Shown under the list while Booking settings → “Passes are final” is off.",
    }),
    {
      type: "collapsible",
      label: "Row labels",
      admin: { initCollapsed: true },
      fields: [
        row([
          text("sessionsTerm", "“Sessions” term", 16, { defaultValue: "Sessions", width: "50%" }),
          text("validTerm", "“Valid for” term", 16, { defaultValue: "Valid for", width: "50%" }),
        ]),
        text("addLabel", "Add button", 24, { defaultValue: "Add to booking" }),
        text("notOnSale", "Not on sale — sentence", 80, { defaultValue: "This pass is not on sale online yet." }),
        text("askLabel", "Not on sale — link", 32, { defaultValue: "Ask the Maison about it" }),
        text("addedNote", "Added — note", 80, {
          defaultValue: "Added to your booking{count}.",
          description: "{count} becomes “ (3 in total)” when more than one is held.",
        }),
        text("viewBookingLabel", "Added — link", 24, { defaultValue: "View your booking" }),
        text("failedNote", "Could not add — note", 120),
      ],
    },
    {
      type: "collapsible",
      label: "Nothing on offer",
      admin: { initCollapsed: true },
      fields: [
        text("emptyTitle", "Title", 40),
        prose("emptyBody", "Body", 200),
        cta({ name: "emptyCta", label: "Button", maxLabel: 24 }),
      ],
    },
    // Flat, not a group: Postgres caps identifier names at 63 characters and a
    // button inside a group inside this block ("…_footer_sentence_first_link_link_type")
    // would overrun it. The renderer prints: {footerBefore} [first link]{footerBetween} [second link]{footerAfter}
    text("footerBefore", "Closing sentence — before the first link", 80, { defaultValue: "Already holding something?" }),
    cta({ name: "footerFirstLink", label: "Closing sentence — first link", maxLabel: 32, defaults: { label: "Go to your booking", link: { type: "internal", url: "/checkout" } } }),
    text("footerBetween", "Closing sentence — between the links", 24, { defaultValue: ", or" }),
    cta({ name: "footerSecondLink", label: "Closing sentence — second link", maxLabel: 32, defaults: { label: "see what is on", link: { type: "internal", url: "/events" } } }),
    text("footerAfter", "Closing sentence — after the second link", 24, { defaultValue: "." }),
  ],
};
