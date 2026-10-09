import { GalleryExperience, type GalleryCollection } from "@/components/gallery/GalleryExperience";
import { EVENT_PLATES } from "@/lib/brand";
import { EXPERIENCE_KIND_LABEL, getCreativeExperiences } from "@/lib/experiences";

/**
 * ==========================================================================
 * /gallery's collections — a walk through the Maison, not a photo grid
 * ==========================================================================
 *
 * The `galleryCollections` block (SPEC §E.1). The layout, the interactions
 * and the lightbox live in <GalleryExperience>, a client island; this server
 * component decides what goes in it. Moved from app/(site)/gallery/page.tsx
 * when the page became CMS blocks; with no collections handed in it builds
 * the three the page always had:
 *
 *   WHAT YOU CAN MAKE  lib/experiences.ts — the client's own activities,
 *                      one square photograph each, each captioned with its own
 *                      name and whether it runs any time or on a date.
 *   THE MAKING         Six process frames pulled from the Maison's own banner
 *                      footage and already used across the site.
 *   MADE TO KEEP       lib/brand.ts EVENT_PLATES — three photographs of finished
 *                      work from real sessions, hands and pieces only.
 *
 * NOTHING IS CAPTIONED THAT THE DATA DOES NOT NAME. The activities caption
 * themselves. The process frames and the finished pieces carry no title,
 * because a title would invent a memory — a date, an occasion, a person — that
 * the project does not record; the viewer shows their own factual `alt` as the
 * description instead.
 */
export async function GalleryBody({
  collections,
  beats,
}: {
  collections?: GalleryCollection[];
  beats?: readonly (string | null)[];
} = {}) {
  return <GalleryExperience collections={collections ?? (await launchCollections())} beats={beats} />;
}

/** The activities that have a photograph, as gallery tiles. */
export async function experienceItems(collection: string) {
  const experiences = await getCreativeExperiences();
  return experiences
    .filter((experience) => experience.image)
    .map((experience) => ({
      src: experience.image!.src,
      alt: experience.image!.alt,
      title: experience.name,
      meta: experience.status ?? EXPERIENCE_KIND_LABEL[experience.kind],
      collection,
    }));
}

async function launchCollections(): Promise<GalleryCollection[]> {
  const makeItems = await experienceItems("What you can make");

  const makingItems = PROCESS_FRAMES.map((frame) => ({ ...frame, collection: "The making" }));

  const keepItems = EVENT_PLATES.map((plate) => ({
    src: plate.src,
    alt: plate.alt,
    collection: "Made to keep",
  }));

  return [
    {
      id: "make",
      folio: "Collection 01",
      heading: "What you can make",
      /* NO COUNT, at the client's ask. It said "Seven ways…", which was the
         number of activities on the day it was written — the same kind of
         figure the client had taken off the homepage ("it can change in the
         future"), and they have since said the rule holds site-wide. The
         collection is built from the live list, so the words must not
         promise a size. */
      lede: "Plenty of ways to spend an afternoon, and the thing you carry out at the end of it.",
      ground: "surface",
      items: makeItems,
    },
    {
      id: "making",
      folio: "Collection 02",
      heading: "The making",
      lede: "Up close and mid-process: pigment, wax, marbled ink and a loaded brush.",
      ground: "cream",
      items: makingItems,
    },
    {
      id: "keep",
      folio: "Collection 03",
      heading: "Made to keep",
      lede: "Finished pieces from real sessions, made to take home.",
      ground: "sage",
      items: keepItems,
    },
  ];
}

/*
  The six process frames, described where they were first used — /about's hero,
  /contact's banner, the experience sections — so the same photograph is never
  described two different ways on the same site. All are the Maison's own
  footage, and all carry no C2PA web-source record (checked), unlike
  public/images/creative/.
*/
const PROCESS_FRAMES: readonly { src: string; alt: string }[] = [
  {
    src: "/images/studio/palette-brush.jpg",
    alt: "A hand painting a silver motif onto denim with a fine brush, a red palette of mixed colour beside it.",
  },
  {
    src: "/images/experience/painting.jpg",
    alt: "A hand drawing a brush across a small canvas on an easel, working a white bloom over a soft blue ground, a loaded palette below it.",
  },
  {
    src: "/images/experience/pigment-on-paper.jpg",
    alt: "Pigment sinking into damp paper: deep red blooms bleeding into blue and yellow-green washes.",
  },
  {
    src: "/images/studio/marbling.jpg",
    alt: "A close view of a marbling bath: a fine needle drawn down through floating orange, teal and red inks, pulling them into feathered swirls.",
  },
  {
    src: "/images/studio/plate-motif.jpg",
    alt: "A hand painting a teal flower motif onto a pale ceramic plate.",
  },
  {
    src: "/images/studio/candle-pour.jpg",
    alt: "Wax being poured from a jug into a row of glass candle jars on a workshop table.",
  },
];
