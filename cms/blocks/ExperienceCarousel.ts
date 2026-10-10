import type { Block } from "payload";

import { eyebrow, heading, pick, standfirst, text, whenIs } from "./shared";

/**
 * `experienceCarousel` → components/sections/home/ExperienceDiscovery.tsx +
 * ExperienceCarousel.tsx + components/events/ExperienceCard.tsx (home).
 * SPEC §E.1. Cards print the experience's name, photograph and status.
 */
export const ExperienceCarouselBlock: Block = {
  slug: "experienceCarousel",
  interfaceName: "ExperienceCarouselBlock",
  labels: { singular: "Experience carousel", plural: "Experience carousels" },
  admin: { group: "Home" },
  fields: [
    eyebrow({ max: 36, defaultValue: "The Maison Palettia experience" }),
    heading(),
    standfirst(320),
    pick(
      "source",
      "Which experiences",
      [
        { label: "All published experiences", value: "all" },
        { label: "Create Anytime (walk-in) only", value: "diy" },
        { label: "Create Together (scheduled) only", value: "scheduled" },
        { label: "Pick them by hand", value: "manual" },
      ],
      { required: true, defaultValue: "all" },
    ),
    {
      name: "experiences",
      type: "relationship",
      relationTo: "experiences",
      hasMany: true,
      label: "Experiences",
      admin: { condition: whenIs("source", "manual"), description: "In the order they should appear." },
    },
    text("cardCta", "Card button text", 24, { defaultValue: "View details" }),
  ],
};
