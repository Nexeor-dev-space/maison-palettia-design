import type { Block } from "payload";

import { picture } from "./shared";

/**
 * `imagePair` → components/sections/home/StudioInterlude.tsx. Dormant
 * (SPEC §E.2): two plates side by side, nothing else.
 */
export const ImagePairBlock: Block = {
  slug: "imagePair",
  interfaceName: "ImagePairBlock",
  labels: { singular: "Image pair", plural: "Image pairs" },
  admin: { group: "Reserved" },
  fields: [picture("first", "Left plate", { required: true }), picture("second", "Right plate", { required: true })],
};
