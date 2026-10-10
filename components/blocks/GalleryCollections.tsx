import type { GalleryCollection, GalleryItem } from "@/components/gallery/GalleryExperience";
import { experienceItems, GalleryBody } from "@/components/sections/gallery/GalleryBody";
import { cached, TAGS } from "@/lib/cms/cache";
import { getCms } from "@/lib/cms/payload";
import type { Media } from "@/payload-types";

import { imageOf, stored, text } from "./helpers";
import type { AdapterProps } from "./types";

/**
 * `galleryCollections` → <GalleryExperience> (SPEC §E.1).
 *
 * Each collection says where its pictures come from: the activities' own
 * photographs, every Media file carrying a tag (`gallery-making`, …), or a
 * hand-picked list. The two beats between collections are Brand wording's
 * opening-statement closer and community closer, as before.
 *
 * <GalleryExperience> composes three collections by hand (`make`, `making`,
 * `keep`); a collection takes the composition of its position, so the first
 * three read exactly as the launch page did and a fourth starts the set again.
 */
const COMPOSITIONS: GalleryCollection["id"][] = ["make", "making", "keep"];

/*
  Media by tag, newest-first is not what a gallery wants — the order files
  were added is the order the studio filed them. Media edits purge every tag
  (cms/hooks/mediaGuards.ts), so `collection:pages` is enough to refresh this.
*/
const mediaTagged = cached("media:by-tag", [TAGS.pages], async (tag: string) => {
  const payload = await getCms();
  const result = await payload.find({
    collection: "media",
    where: { tags: { in: [tag] } },
    sort: "createdAt",
    depth: 0,
    limit: 60,
    pagination: false,
    overrideAccess: false,
  });
  return result.docs;
});

export async function GalleryCollectionsAdapter({ block, ctx }: AdapterProps<"galleryCollections">) {
  const b = stored(block);
  if (!b) return <GalleryBody />;

  const collections: GalleryCollection[] = await Promise.all(
    (b.collections ?? []).map(async (collection, i): Promise<GalleryCollection> => {
      const name = collection.heading;
      let items: GalleryItem[];
      if (collection.source === "experiences") {
        items = await experienceItems(name);
      } else {
        const files: Array<string | Media> =
          collection.source === "mediaTag"
            ? collection.mediaTag
              ? await mediaTagged(collection.mediaTag).catch(() => [])
              : []
            : (collection.images ?? []);
        items = files
          .map((file) => imageOf(file))
          .filter((image): image is NonNullable<typeof image> => Boolean(image))
          .map((image) => ({ src: image.src, alt: image.alt, collection: name }));
      }
      return {
        id: COMPOSITIONS[i % COMPOSITIONS.length],
        folio: collection.folio,
        heading: collection.heading,
        lede: collection.lede ?? "",
        ground: collection.ground,
        items,
      };
    }),
  );

  const brand = ctx.brand;
  return (
    <GalleryBody
      collections={collections}
      beats={brand ? [text(brand.openingStatement?.closer), text(brand.community?.closer)] : undefined}
    />
  );
}
