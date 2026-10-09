import type { Block } from "payload";

import { brandCopyLink } from "@/cms/fields";

import { eyebrow, picture } from "./shared";

/**
 * `aboutWelcome` → components/sections/about/Welcome.tsx (about). SPEC §E.1.
 * The H1 is the tagline and the paragraphs are the brand story, both Brand
 * wording; the block owns the eyebrow and the photograph.
 */
export const AboutWelcomeBlock: Block = {
  slug: "aboutWelcome",
  interfaceName: "AboutWelcomeBlock",
  labels: { singular: "About — welcome", plural: "About — welcome" },
  admin: { group: "About" },
  fields: [
    eyebrow({ defaultValue: "About the Maison" }),
    brandCopyLink({ name: "taglineLink", path: "tagline", label: "Script tagline" }),
    brandCopyLink({ name: "storyLink", path: "brandStory", label: "Brand story" }),
    picture("image", "Photograph"),
  ],
};
