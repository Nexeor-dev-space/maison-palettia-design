import type { Block } from "payload";

import { brandCopyLink, cta } from "@/cms/fields";

import { eyebrow, heading, lead } from "./shared";

/**
 * `collaborateTeaser` → components/sections/home/CollaborateTeaser.tsx.
 * Dormant (SPEC §E.2), kept for a future partners page; the collaboration
 * models are Brand wording `collaborations[]`.
 */
export const CollaborateTeaserBlock: Block = {
  slug: "collaborateTeaser",
  interfaceName: "CollaborateTeaserBlock",
  labels: { singular: "Collaborate teaser", plural: "Collaborate teasers" },
  admin: { group: "Reserved" },
  fields: [
    eyebrow({ defaultValue: "Collaborative approach" }),
    heading(),
    lead(240),
    brandCopyLink({ path: "collaborations", label: "Collaboration models" }),
    cta({ name: "primaryCta", label: "Primary button", maxLabel: 24, defaults: { label: "Partner with us", link: { type: "internal", url: "/contact" } } }),
    cta({ name: "secondaryCta", label: "Secondary button", maxLabel: 30 }),
  ],
};
