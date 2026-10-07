import Image from "next/image";

import { GalleryExperience, type GalleryCollection } from "@/components/gallery/GalleryExperience";
import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { PeelNote } from "@/components/ui/PeelNote";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { EVENT_PLATES, OPENING_STATEMENT } from "@/lib/brand";
import { EXPERIENCE_KIND_LABEL, getCreativeExperiences } from "@/lib/experiences";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Gallery",
  description:
    "Step inside Maison Palettia: what gets made here, the hands that make it, and the pieces that go home.",
  path: "/gallery",
});

/**
 * /gallery — a walk through the Maison, not a photo grid.
 *
 * ==========================================================================
 * THE REVAMP, AND WHAT IT IS BUILT FROM
 * ==========================================================================
 *
 * The brief asked for the gallery to stop reading as "here are some pictures"
 * and start reading as "I am stepping into Maison Palettia's creative world":
 * a strong hero, art-directed collections rather than one uniform grid, beats
 * of copy between them, doodles at the seams, and a real image viewer.
 *
 * It is built ENTIRELY from imagery the project already holds and whose
 * provenance and alt text are already settled — the same rule the old wall
 * kept, and the reason there is no stock photography here:
 *
 *   WHAT YOU CAN MAKE  lib/experiences.ts — the client's own seven activities,
 *                      one square photograph each, each captioned with its own
 *                      name and whether it runs any time or on a date. The
 *                      pottery frame the client asked to keep off the site
 *                      (HAND_BUILDING) is never returned by the accessor and so
 *                      is never here.
 *   THE MAKING         Six process frames pulled from the Maison's own banner
 *                      footage and already used across the site — a loaded
 *                      brush, a marbling bath, wax being poured — so their
 *                      descriptions are settled rather than written for a wall.
 *   MADE TO KEEP       lib/brand.ts EVENT_PLATES — three photographs of finished
 *                      work from real sessions, hands and pieces only.
 *
 * NOTHING IS CAPTIONED THAT THE DATA DOES NOT NAME. The activities caption
 * themselves. The process frames and the finished pieces carry no title,
 * because a title would invent a memory — a date, an occasion, a person — that
 * the project does not record; the viewer shows their own factual `alt` as the
 * description instead. The copy between collections is approved brand copy,
 * verbatim.
 *
 * The layout, the interactions and the lightbox live in <GalleryExperience>,
 * which is a client island; the hero and the closing invitation are static and
 * stay here on the server.
 */
export default async function GalleryPage() {
  const experiences = await getCreativeExperiences();

  const makeItems = experiences
    .filter((experience) => experience.image)
    .map((experience) => ({
      src: experience.image!.src,
      alt: experience.image!.alt,
      title: experience.name,
      meta: experience.status ?? EXPERIENCE_KIND_LABEL[experience.kind],
      collection: "What you can make",
    }));

  const makingItems = PROCESS_FRAMES.map((frame) => ({ ...frame, collection: "The making" }));

  const keepItems = EVENT_PLATES.map((plate) => ({
    src: plate.src,
    alt: plate.alt,
    collection: "Made to keep",
  }));

  const collections: GalleryCollection[] = [
    {
      id: "make",
      folio: "Collection 01",
      heading: "What you can make",
      lede: "Seven ways to spend an afternoon, and the thing you carry out at the end of it.",
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

  return (
    <>
      {/* ---- the hero: an editorial opening, not the homepage banner ---- */}
      <section
        aria-labelledby="gallery-title"
        className="relative isolate overflow-clip bg-surface"
      >
        <SectionShapes plan={groundShapes("surface")} />
        <Container className="relative py-[3.5rem] md:py-[4.5rem] lg:py-[5.5rem]">
          <div className="grid grid-cols-12 items-center gap-x-6 gap-y-12 lg:gap-x-10">
            {/* the words */}
            <div className="col-span-12 lg:col-span-6">
              <Reveal>
                <Eyebrow>Gallery</Eyebrow>
              </Reveal>
              <DisplayHeading
                as="h1"
                id="gallery-title"
                className="mt-7 md:mt-9"
                lines={["A Little Space", "for Big Creativity."]}
              />
              <Reveal delay={0.16}>
                <p className="script-lede max-w-[34rem] text-lead text-text/85">
                  {OPENING_STATEMENT.body}
                </p>
              </Reveal>
            </div>

            {/* the layered opening image */}
            <div className="col-span-12 lg:col-span-6">
              <Reveal variant="imageReveal" delay={0.1}>
                <div className="relative mx-auto max-w-[32rem] lg:mr-0">
                  {/* the feature, a process frame — the creative world up close */}
                  <figure className="plate relative block aspect-[4/5] w-full overflow-clip rounded-[1.5rem] rotate-[1.2deg]">
                    <Image
                      src="/images/experiences/GLASS_PAINTING.jpg"
                      alt="A hand holding an arched glass panel painted with a dragonfly among red and pink flowers on green leaves, the sun throwing its colours onto the wall."
                      fill
                      priority
                      sizes="(min-width: 1024px) 40vw, 92vw"
                      className="object-cover"
                    />
                  </figure>

                  {/* a smaller overlapping square, a finished activity */}
                  <figure className="plate absolute -bottom-6 -left-5 hidden w-[42%] overflow-clip rounded-[1.1rem] rotate-[-3deg] sm:block">
                    <span className="relative block aspect-square w-full">
                      <Image
                        src="/images/experiences/CANDLE_MAKING.jpg"
                        alt="Two poured candles in glass jars on a white tray, one set with pink wax flowers and one with pink hearts, sprigs of gypsophila beside them."
                        fill
                        sizes="(min-width: 1024px) 18vw, 40vw"
                        className="object-cover"
                      />
                    </span>
                  </figure>

                  {/* the brand's cut-out, breaking the top-right corner */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-4 -top-6 w-[4.5rem] rotate-[8deg] md:-right-6 md:w-[5.75rem]"
                  >
                    <DoodleMark name="splash" color={INK.lilac} treatment="draw" delay={260} />
                  </span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-3 bottom-[18%] hidden w-[2.5rem] rotate-[-6deg] md:block"
                  >
                    <DoodleMark name="coral" color={INK.terracotta} treatment="draw" delay={420} />
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* ---- the collections, the beats between them, and the viewer ---- */}
      <GalleryExperience collections={collections} />

      {/* ---- the invitation out ---- */}
      <section aria-labelledby="gallery-close" className="relative isolate overflow-clip bg-primary">
        <SectionShapes plan={groundShapes("lilac")} />
        <Container className="relative py-[5rem] text-center md:py-section lg:py-[7rem]">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[7%] top-12 hidden w-[4.25rem] rotate-[-10deg] md:block"
          >
            <DoodleMark name="coral" color={INK.lavender} treatment="draw" delay={300} />
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-12 right-[8%] hidden w-[4.5rem] rotate-[8deg] md:block"
          >
            <DoodleMark name="splash" color={INK.whiteRock} treatment="draw" delay={420} />
          </span>

          <DisplayHeading
            id="gallery-close"
            ground="lilac"
            className="mx-auto max-w-[18ch]"
            lines={["Ready to make", "something of your own?"]}
          />

          <Reveal delay={0.08}>
            <p className="script-lede mx-auto max-w-[40ch] text-lead text-surface">
              Pick an activity, bring your people, or come on your own.
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
              <BlobButton href="/events" tone="cream" className="min-h-[3.25rem] px-8">
                Explore experiences
              </BlobButton>
              {/* The second action beside "Explore experiences": the site's
                  secondary, the sticky note — see <PeelNote>. */}
              {/* The sticky note, as in the homepage banner — see <PeelNote>. */}
              <PeelNote href="/private-events" className="min-h-[3.25rem] px-8">
                Plan a private event
              </PeelNote>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
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
