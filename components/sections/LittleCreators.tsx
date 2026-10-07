import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { groundShapes } from "@/components/motion/groundShapes";
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
    alt: "Punch-needle squares in wool laid out on cloth (a bear, a panda, a cow, a cactus and a crescent moon), with yarn and needles beside them.",
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
    alt: "Painted wooden rounds (a sun and moon, a cactus in bloom, tulips with a bee) beside tubes of acrylic paint.",
    aspect: "aspect-[3/4]",
    offset: "lg:mt-6",
    mark: { name: "bean", color: INK.terracotta } as const,
  },
] as const;

export function LittleCreators() {
  return (
    /*
      WHITE-ROCK-AND-SAGE NEITHER: this sits between <WhoItIsFor> on cream and
      <Experiences> on sage, and on its own Light Sage default it would have
      put two sage bands against each other. Surface is the site's own pale
      paper and the third ground the run needs to keep alternating.
    */
    <DeckSheet
      labelledBy="little-creators-heading"
      ground="bg-surface"
      className="overflow-x-clip"
    >
      <SectionShapes plan={KIDS_SHAPES} />

      <Container className="relative">
        {/*
          `gap-x-6 lg:gap-x-10`, NOT `gap-x-gutter`. This masthead had the
          right column class — `lg:col-span-5 lg:col-start-8` — and still did
          not line up with the other eleven, because the GUTTER decides where
          a grid line falls. `--spacing-gutter` is `max(0.75rem, 1.3889vw)`,
          which is 20px at 1440 against the 40px every other masthead grid
          uses, so this description started 12px to the left of all of them
          and ran 12px wider. The class was never the whole story.
        */}
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 lg:gap-x-10">
          <div className="relative col-span-12 lg:col-span-6">
            {/*
              Pinned above the label, hanging a little off the left margin.
              The deck never sets a cut-out down in clear paper — it puts them
              over the edge of something — and up here the only edge going is
              the page's own.
            */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-7 -top-[4.5rem] hidden w-[4.25rem] rotate-[-14deg] lg:block"
            >
              <DoodleMark name="coral" color={INK.lilac} delay={120} depth={12} />
            </span>

            <Reveal>
              <p className="flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-terracotta">
                <span aria-hidden className="block w-4 shrink-0">
                  <DoodleMark name="dot" color={INK.terracotta} />
                </span>
                Tailored kids activities
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <h2
                id="little-creators-heading"
                className="heading-script mt-5 text-script-section text-text"
              >
                {forScript("For Our Little Creators.")}
              </h2>
            </Reveal>

            {/* Past the end of the script, straddling its last line — which is
                the one edge this half of the header has to offer. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-5 right-[6%] hidden w-[3.5rem] rotate-[14deg] lg:block"
            >
              <DoodleMark name="starburst" color={INK.terracotta} delay={300} depth={10} />
            </span>
          </div>

          <Reveal
            delay={0.12}
            className="relative col-span-12 lg:col-span-5 lg:col-start-8 lg:pb-3"
          >
            {/* And one on the standfirst's top-left corner, so the right half
                of the header is punctuated like the left. It is held clear of
                the first letter: at -left-9 it sat on the "T" of "Three". */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-14 -top-11 hidden w-[3.25rem] rotate-[-10deg] lg:block"
            >
              <DoodleMark name="bow" color={INK.lilac} delay={420} depth={10} />
            </span>

            {/* The column is the measure; a `max-w-[36ch]` here capped it
                again at 380px inside a 560px slot. */}
            <p className="text-lead text-text/85">
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
          {/* `settle` is the collage's own arrival: each photograph comes in a
              degree off square and lands. See lib/motion.ts. */}
          {PLATES.map((plate, i) => (
            <Reveal
              as="li"
              variant="settle"
              key={plate.src}
              className={`group ${plate.offset}`}
            >
              <div className="relative">
                <span
                  className={`plate relative block ${plate.aspect} w-full overflow-clip rounded-[1.25rem] bg-cream`}
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

              <p className="mt-4 text-h4 font-bold uppercase tracking-[0.015em] text-text transition-colors duration-300 ease-soft [font-family:var(--font-deck)] [font-synthesis:none] group-hover:text-primary">
                {LITTLE_CREATORS[i]?.name}
              </p>
            </Reveal>
          ))}
        </Stagger>
      </Container>
    </DeckSheet>
  );
}

/*
  THE PAPER BEHIND THEM.

  This section is a script heading on half a line, a standfirst on the other
  half, and three photographs — which leaves two wide bands of bare Light Sage
  it never uses. Measured at 1440: 112px across the full width above the
  label, and 112px below the names, plus the channel between the heading and
  the standfirst. The field is placed into those and nowhere else.

  It is a WASH, not a set of cut-outs. These sit at `-z-10`, so the three
  plates cover whatever strays under them, and the marks meant to be read at
  full strength are the <DoodleMark>s above, on the edges of things.

  `color` HERE IS A HINT, NOT A TINT, and that is worth knowing before anyone
  tunes these. The doodles are the brand sheet's own icons and most of them
  are printed in more than one colour — <DoodleMark> walks `shape.parts` and
  gives each part the fill the sheet prints it in, taking the caller's colour
  only for the parts the sheet leaves as `currentColor`. So `wave` arrives
  carrying its own Deep Lilac whatever is asked for here, and setting White
  Rock on it changes one part of it and nothing else.

  What this plan actually controls, then, is placement, size, angle and how
  far down the paper each icon is pulled — not its hue. Chasing a colour
  through these values is wasted work; the sheet decides, and the sheet is
  right. The colours are still written out because they are what the parts
  that DO follow `color` take, and because they are what this file renders on
  the other branch, where <DoodleMark> is still one path filled with `color`.

  The opacities are set by eye against that: terracotta and White Rock
  icons sit low because they are quiet to begin with, and `wave` is held down
  at 0.45 because its lilac is the strongest thing the sheet prints and at
  two thirds it stopped being a ground and started being a mark.
*/
const KIDS_SHAPES: readonly ShapePlan[] = groundShapes("surface");
