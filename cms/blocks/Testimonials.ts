import type { Block } from "payload";

import { count, pick, text, whenIs } from "./shared";

/**
 * `testimonials` → a small new renderer (2D). Dormant (SPEC §E.2). Only
 * quotes with written permission on file are ever printed, whatever is
 * picked here.
 */
export const TestimonialsBlock: Block = {
  slug: "testimonials",
  interfaceName: "TestimonialsBlock",
  labels: { singular: "Testimonials", plural: "Testimonials" },
  admin: { group: "Reserved" },
  fields: [
    text("heading", "Heading", 40),
    pick(
      "source",
      "Which quotes",
      [
        { label: "The latest with permission on file", value: "latest" },
        { label: "Picked by hand", value: "manual" },
      ],
      { required: true, defaultValue: "latest" },
    ),
    count("limit", "How many", { min: 1, max: 6, defaultValue: 3, condition: whenIs("source", "latest") }),
    {
      name: "items",
      type: "relationship",
      relationTo: "testimonials",
      hasMany: true,
      label: "Quotes",
      admin: { condition: whenIs("source", "manual") },
    },
  ],
};
