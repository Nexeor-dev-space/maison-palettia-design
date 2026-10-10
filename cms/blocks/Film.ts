import type { Block } from "payload";

import { picture, text } from "./shared";

/**
 * `film` → components/sections/StudioFilm.tsx + FilmStage. Dormant
 * (SPEC §E.2). The studio film from Media (MP4), its poster frame, a label and
 * a printed duration.
 */
export const FilmBlock: Block = {
  slug: "film",
  interfaceName: "FilmBlock",
  labels: { singular: "Film", plural: "Films" },
  admin: { group: "Reserved" },
  fields: [
    {
      name: "video",
      type: "upload",
      relationTo: "media",
      label: "Film (MP4)",
      required: true,
      filterOptions: { mimeType: { equals: "video/mp4" } },
      admin: { description: "A web encode, not a master." },
    },
    picture("poster", "Poster frame", { required: true, description: "Holds the stage while the film loads, and stands in under reduced motion." }),
    text("label", "Label", 40, { defaultValue: "A short film" }),
    text("duration", "Duration (printed)", 8, { defaultValue: "1:01" }),
  ],
};
