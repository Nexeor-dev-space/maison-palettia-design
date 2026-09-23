import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
import { DeckSheet } from "@/components/ui/deck/Deck";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { forScript } from "@/components/ui/SectionHeader";
import { LITTLE_CREATORS } from "@/lib/brand";

/**
 * The three activities made for children — as a collage, not a row of tiles.
 *
 * ==========================================================================
 * WHAT WAS WRONG WITH IT
 * ==========================================================================
 *
 * A centred script heading, a centred label under it, and three identical
 * tiles in a row with a name pill under each. That is the deck's p.8 redrawn
 * in a browser — and the client's word for it was ditto. Three equal boxes on
 * a centre line is what a page that cannot scroll does with three things.
 *
 * It is a collage now. The heading holds the left, the three plates are three
 * different shapes at three different heights, and each name sits under its
 * own picture in the deck's condensed face rather than inside a lozenge. The
 * arrangement is the point: children's work is pinned to a board, not filed
 * in a grid.
 *
 * THE PHOTOGRAPHS ARE REAL WORK, AND THEY ARE THE RIGHT ONES. This section
 * used to carry three flat colour plates because the deck's own images for
 * this page were recorded as web inspiration, too small and too uncertain to
 * publish. Full-resolution files named for these exact three activities have
 * since been added to `public/images/creative`, and they show finished craft
 * and nothing else — no faces, no children, which is the bar every other
 * photograph on this site has had to clear. See the note in the section
 * report about their content credentials.
 *
 * Alt text describes what is in the frame and never asserts who made it.
 *
 * The three names are `LITTLE_CREATORS`; there are three because the deck
 * names three.
 */

/*
  Shape, offset and mark per plate. The aspect ratios differ on purpose — a
  tall one, a squarer one, a tall one — and the middle plate hangs lower than
  its neighbours, which is what stops three pictures reading as a row.
*/
const PLATES = [
  {
    src: "/images/creative/tissue-art.jpg",
    alt: "Punch-needle squares in wool laid out on cloth — a bear, a panda, a cow, a cactus and a crescent moon — with yarn and needles beside them.",
    aspect: "aspect-[3/4]",
    offset: "lg:mt-0",
    mark: { name: "starleaf", color: INK.lilac } as const,
  },
  {
    src: "/images/creative/coffee-painting.jpg",
    alt: "Two koi painted in coffee across a sketchbook page, the brush resting on the paper.",
    aspect: "aspect-[4/5]",
    offset: "lg:mt-16",
    mark: undefined,
  },
  {
    src: "/images/creative/wooden-painting.jpg",
    alt: "Painted wooden rounds — a sun and moon, a cactus in bloom, tulips with a bee — beside tubes of acrylic paint.",
    aspect: "aspect-[3/4]",
    offset: "lg:mt-6",
    mark: { name: "bean", color: INK.terracotta } as const,
  },
] as const;

export function LittleCreators() {
  return (
    <DeckSheet labelledBy="little-creators-heading" className="overflow-x-clip">
      <Container className="relative">
        <div className="grid grid-cols-12 items-end gap-x-gutter gap-y-6">
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <p className="flex items-center gap-3 text-label font-bold uppercase tracking-eyebrow text-terracotta">
                <span aria-hidden className="block w-4 shrink-0">
                  <DoodleMark name="dot" color={INK.terracotta} />
                </span>
                Tailored kids activities
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <h2
                id="little-creators-heading"
                className="heading-script mt-5 text-[clamp(2.25rem,1.35rem+3.2vw,3.75rem)] leading-[1.14] text-text"
              >
                {forScript("For our little creators.")}
              </h2>
            </Reveal>
          </div>

          <Reveal delay={0.12} className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pb-3">
            <p className="max-w-[36ch] text-[1.0625rem] leading-[1.75] text-text/85">
              Three activities cut to a smaller pair of hands, so a child and a parent can sit at
              the same table and both come away with something.
            </p>
          </Reveal>
        </div>

        {/*
          The collage. `items-start` rather than a stretched row, so each plate
          keeps its own proportion and the offsets above are free to do their
          work — with `items-stretch` every picture would be forced to one
          height and the arrangement would collapse back into a row.
        */}
        <Stagger
          as="ul"
          className="mt-12 grid grid-cols-1 items-start gap-x-7 gap-y-10 sm:grid-cols-3 md:mt-16 lg:gap-x-10"
        >
          {PLATES.map((plate, i) => (
            <Reveal as="li" key={plate.src} className={`group ${plate.offset}`}>
              <div className="relative">
                <span
                  className={`plate relative block ${plate.aspect} w-full overflow-hidden rounded-[1.25rem] bg-cream`}
                >
                  <Image
                    src={plate.src}
                    alt={plate.alt}
                    fill
                    sizes="(min-width: 640px) 30vw, 100vw"
                    className="object-cover transition-transform duration-[900ms] ease-editorial motion-safe:group-hover:scale-[1.04]"
                  />
                </span>

                {/* Two of the three carry a cut-out, so the set is punctuated
                    rather than decorated — the deck's own habit. */}
                {plate.mark ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-4 -top-5 hidden w-14 rotate-[-8deg] rounded-[0.35rem] bg-cream p-2.5 sm:block"
                  >
                    <DoodleMark name={plate.mark.name} color={plate.mark.color} treatment="stamp" />
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-[1.0625rem] font-bold uppercase leading-[1.1] tracking-[0.015em] text-text transition-colors duration-300 ease-soft [font-family:var(--font-deck)] [font-synthesis:none] group-hover:text-primary md:text-[1.375rem]">
                {LITTLE_CREATORS[i]?.name}
              </p>
            </Reveal>
          ))}
        </Stagger>
      </Container>
    </DeckSheet>
  );
}
