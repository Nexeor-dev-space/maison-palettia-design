import type { Block } from "payload";

import { cta } from "@/cms/fields";

import { eyebrow, heading, prose } from "./shared";

/**
 * `closingCtaLilac` → components/sections/ClosingCta.tsx. SPEC §E.1. One
 * block, six instances (about, gallery, faq, policies, private-events,
 * contact), each with its own heading and body; the secondary button is the
 * sticky-note style one.
 */
export const ClosingCtaLilacBlock: Block = {
  slug: "closingCtaLilac",
  interfaceName: "ClosingCtaLilacBlock",
  labels: { singular: "Closing call to action (lilac)", plural: "Closing calls to action (lilac)" },
  admin: { group: "Page sections" },
  fields: [
    eyebrow(),
    heading(),
    prose("body", "Body", 240, { description: "One or two sentences under the heading." }),
    cta({ name: "primaryCta", label: "Primary button", maxLabel: 24, required: true }),
    cta({ name: "secondaryCta", label: "Secondary button (sticky note)", maxLabel: 24 }),
  ],
};
