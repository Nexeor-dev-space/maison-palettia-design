import type { Block } from "payload";

/**
 * `policiesIndex` → components/sections/PoliciesIndex.tsx (policies).
 * SPEC §E.1. No fields: it lists every published policy in `order`. The one
 * ui field is the sentence that says so in the editor.
 */
export const PoliciesIndexBlock: Block = {
  slug: "policiesIndex",
  interfaceName: "PoliciesIndexBlock",
  labels: { singular: "Policies index", plural: "Policies indexes" },
  admin: { group: "Page sections" },
  fields: [
    {
      name: "note",
      type: "ui",
      label: "Lists every published policy, in the order set on each policy. Nothing to fill in here.",
      admin: { disableListColumn: true },
    },
  ],
};
