import type { Block } from "payload";

import { brandCopyLink, cta } from "@/cms/fields";

import { brandCopySwitch, count, heading, picture, prose, text, whenOff, whenOn } from "./shared";

/**
 * `hero` → components/sections/Hero.tsx (home). SPEC §E.1.
 *
 * The three-line script heading is, by default, the brand tagline broken
 * into lines by the renderer ("A Palette of / Creativity / for Everyone."),
 * because the hero re-typing the tagline is exactly the drift the CMS exists
 * to end (01 §7). `useTagline` off lets the page write its own three lines of
 * 16 characters; `accentLineIndex` says which one is set in the accent ink.
 */
export const HeroBlock: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
  labels: { singular: "Hero", plural: "Heroes" },
  admin: { group: "Home" },
  fields: [
    brandCopySwitch("useTagline", "the heading"),
    brandCopyLink({ path: "tagline", label: "Script tagline", condition: whenOn("useTagline"), toggleLabel: "Use Brand wording for the heading" }),
    heading({
      maxRows: 3,
      maxChars: 16,
      required: false,
      label: "Heading lines (own wording)",
      description: "Three lines of up to 16 characters in the script face.",
      condition: whenOff("useTagline"),
    }),
    {
      // Stored as the renderer's zero-based index; the admin shows First / Second / Third line.
      ...count("accentLineIndex", "Line in the accent colour", { min: 0, max: 2, defaultValue: 1 }),
      admin: {
        step: 1,
        description: "Which heading line is set in the accent colour when you write your own lines.",
        components: { Field: "@/cms/components/fields/LineChoiceField#LineChoiceField" },
        custom: { lines: 3 },
      },
    },
    text("sub", "Line under the heading", 60, { defaultValue: "There’s no wrong shade of creativity." }),
    prose("lead", "Lead paragraph", 200, {
      defaultValue: "Pick your palette, get your hands busy and make something that’s completely yours.",
    }),
    cta({ name: "primaryCta", label: "Primary button", maxLabel: 24, defaults: { label: "Explore experiences", link: { type: "internal", url: "/events" } } }),
    cta({ name: "secondaryCta", label: "Secondary button", maxLabel: 24, defaults: { label: "Plan a private event", link: { type: "internal", url: "/private-events" } } }),
    picture("imageDesktop", "Photograph — desktop", { description: "Landscape, at least 1920 px wide." }),
    picture("imageMobile", "Photograph — phone", { description: "Portrait, at least 768 px wide. Falls back to the desktop photograph." }),
    text("scrollCueLabel", "Scroll arrow wording", 24, { defaultValue: "Scroll down" }),
    text("scrollCueTarget", "Scroll arrow goes to", 64, {
      defaultValue: "experience-discovery",
      description:
        "Leave as it is unless a developer asks: the internal name of the section the arrow scrolls to (“experience-discovery” is the section straight after this one).",
    }),
  ],
};
