import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

/**
 * `missionVision` → components/sections/about/Purpose.tsx (about). SPEC §E.1.
 * No fields of its own: the two cards print Brand wording `mission`, `vision`
 * and `purposeLabels`. The block exists so the section can be placed and
 * reordered like any other.
 */
export const MissionVisionBlock: Block = {
  slug: "missionVision",
  interfaceName: "MissionVisionBlock",
  labels: { singular: "Mission & vision", plural: "Mission & vision" },
  admin: { group: "About" },
  fields: [
    brandCopyLink({ name: "missionLink", path: "mission", label: "Mission" }),
    brandCopyLink({ name: "visionLink", path: "vision", label: "Vision" }),
    brandCopyLink({ name: "labelsLink", path: "purposeLabels", label: "Purpose card labels" }),
  ],
};
