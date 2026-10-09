import type { Block } from "payload";

import { MEDIA_TAG_OPTIONS } from "@/cms/collections/system/Media";

import { pick, pictures, prose, text, whenIs } from "./shared";

/**
 * `galleryCollections` → components/gallery/GalleryExperience.tsx (gallery).
 * SPEC §E.1. Three numbered collections. A collection's pictures come from
 * the experiences' main photographs, from every media file carrying a tag,
 * or from a hand-picked list — today 01 is the experiences, 02 the studio
 * stills tagged `gallery-making`, 03 the finished pieces tagged
 * `gallery-keep`. The divider cards print Brand wording closers.
 */
export const GalleryCollectionsBlock: Block = {
  slug: "galleryCollections",
  interfaceName: "GalleryCollectionsBlock",
  labels: { singular: "Gallery collections", plural: "Gallery collections" },
  admin: { group: "Page sections" },
  fields: [
    {
      name: "collections",
      type: "array",
      label: "Collections",
      labels: { singular: "Collection", plural: "Collections" },
      minRows: 1,
      maxRows: 3,
      fields: [
        text("folio", "Small line above the heading", 16, { required: true, description: "e.g. Collection 01." }),
        text("heading", "Heading", 40, { required: true }),
        prose("lede", "Intro line", 200, { description: "One or two sentences under the heading." }),
        pick(
          "ground",
          "Background colour",
          [
            { label: "Surface", value: "surface" },
            { label: "Cream", value: "cream" },
            { label: "Sage", value: "sage" },
          ],
          { required: true, defaultValue: "surface" },
        ),
        pick(
          "source",
          "Pictures come from",
          [
            { label: "The experiences' main photographs", value: "experiences" },
            { label: "Every media file with a tag", value: "mediaTag" },
            { label: "Picked by hand", value: "manual" },
          ],
          { required: true, defaultValue: "manual" },
        ),
        pick(
          "mediaTag",
          "Tag",
          MEDIA_TAG_OPTIONS,
          { condition: whenIs("source", "mediaTag"), description: "Set on each file in Media → “Where it may be used”." },
        ),
        pictures("images", "Pictures", { condition: whenIs("source", "manual"), maxRows: 24 }),
      ],
    },
  ],
};
