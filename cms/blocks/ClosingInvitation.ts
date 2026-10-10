import type { Block } from "payload";

import { brandCopyLink, cta } from "@/cms/fields";

/**
 * `closingInvitation` → components/sections/home/ClosingStatement.tsx (home).
 * SPEC §E.1. The eyebrow prints the tagline and the heading and body print
 * Brand wording `closing` (also at the foot of About), so the block owns only
 * its two buttons.
 */
export const ClosingInvitationBlock: Block = {
  slug: "closingInvitation",
  interfaceName: "ClosingInvitationBlock",
  labels: { singular: "Closing invitation", plural: "Closing invitations" },
  admin: { group: "Home" },
  fields: [
    brandCopyLink({ name: "closingLink", path: "closing", label: "Closing invitation" }),
    brandCopyLink({ name: "taglineLink", path: "tagline", label: "Script tagline" }),
    cta({ name: "primaryCta", label: "Primary button", maxLabel: 24, defaults: { label: "Explore experiences", link: { type: "internal", url: "/events" } } }),
    cta({
      name: "secondaryCta",
      label: "Secondary button",
      maxLabel: 24,
      defaults: { label: "Plan a private event", link: { type: "internal", url: "/private-events/book" } },
    }),
  ],
};
