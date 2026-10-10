import Image from "next/image";

import type { ImageAsset } from "@/types";

import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { groundShapes } from "@/components/motion/groundShapes";
import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
import { DeckSheet } from "@/components/ui/deck/Deck";
import { DoodleMark } from "@/components/ui/DoodleMark";

/**
 * ==========================================================================
 * TWO PICTURES, AND NO WORDS
 * ==========================================================================
 *
 * This is the slot <WorkshopJourney> held, at the client's ask: take that
 * section off and put these two photographs here instead, with the doodles.
 *
 * NOTHING IS LOST FROM THE SITE, which is what makes it a safe removal. The
 * five ways a visit can go — WORKSHOP_JOURNEY — are set in full on /about, in
 * <Community>, with the same five names and the same five sentences. The
 * homepage was the second copy and the weaker one: five paint dabs in a row
 * under a rule, which is a list wearing a costume. The component and its
 * stylesheet stay in the tree, the way <CommunityMoment> and
 * <SeasonalExperiences> are kept — removing a section is not the same
 * decision as throwing the work away.
 *
 * AND THE PAGE WANTED A BREATH HERE. Above this is <WaysToExperience>, four
 * ways in, all type. Below it is <TwoWaysToCreate>, two full panels of colour
 * with a heading and a button in each. Three sections of reading in a row met
 * a wall of colour. A wordless picture beat between them is the rest the
 * scroll needed, and it is why this carries no heading of its own: a heading
 * would make it a fourth thing to read rather than the pause between them.
 *
 * It is a <section> with no accessible name on purpose. An unnamed section is
 * not exposed as a landmark, which is right — this is an interlude, not a
 * region somebody would want to skip to. The pictures carry their own meaning
 * in their alt text.
 *
 * THE COMPOSITION IS THE DECK'S, not a gallery's. Two plates of different
 * shapes at different heights, each turned a degree or so off square, on the
 * one Light Sage ground — cut paper laid down, which is how every page of the
 * deck is built. They do NOT overlap each other: a one-column overlap ate the
 * left edge of the crochet frame, and the ball of yarn with it. The doodles do
 * the overlapping instead, which is the deck's actual rule — a cut-out always
 * breaks an edge, and never floats in clear space.
 *
 * WHY EACH PICTURE IS THE SHAPE IT IS. The painting is cropped tall: its
 * subject stacks vertically — apron, hands, brush, bowl — so a 4:5 frame
 * tightens onto all four and only loses the palette at the far left. The
 * crochet is the opposite, a wide picture of a wide thing: the ball of yarn
 * sits in the left third and the hands in the right half, and any crop
 * squarer than about 16:10 cuts one of them off. So the tall one leads and the
 * wide one answers it, lower and to the right.
 *
 * PROVENANCE. Both files were supplied by the client on 2026-09-30. Neither
 * carries C2PA credentials, XMP, or any other embedded origin — which proves
 * nothing either way, so neither may be captioned as the studio's own
 * photograph or as its own guests. The alt text below describes what is in
 * the frame and claims nothing about whose hands they are.
 */
/*
  The `imagePair` block (SPEC §E.2, dormant) hands in its two photographs;
  left out, the two the client supplied for this slot.
*/
export function StudioInterlude({
  first = {
    src: "/images/i-1.jpg",
    alt: "Someone in a denim apron painting a small ceramic bowl in bands of orange, blue and yellow, a loaded palette and open paint tubes on the table beside them.",
  },
  second = {
    src: "/images/1-2.jpg",
    alt: "A pair of hands crocheting a panel of cream cotton with a yellow hook, a wound ball of the same yarn on the table alongside.",
  },
}: { first?: ImageAsset; second?: ImageAsset } = {}) {
  return (
    <DeckSheet>
      <SectionShapes plan={INTERLUDE_SHAPES} />

      <Container className="relative">
        {/*
          `items-start`, so the two plates hang from one top line and the
          second is dropped from it by its own margin. Centring them would
          have made the offset a by-product of the height difference, which
          changes every time either crop changes.
        */}
        <div className="grid grid-cols-12 gap-x-gutter gap-y-8">
          <Reveal
            variant="imageReveal"
            className="relative z-20 col-span-12 lg:col-span-5 lg:col-start-1"
          >
            {/* Riding the corner, not sitting beside it. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-7 -top-8 z-10 deco-mark w-[5.5rem] rotate-[-10deg]"
            >
              <DoodleMark name="coral" color={INK.lavender} delay={120} depth={12} />
            </span>

            <figure
              className="group plate relative overflow-hidden rounded-[var(--radius-lg)] bg-cream rotate-[-1.5deg] aspect-[4/5]"
              data-paint
              style={{ "--paint": "var(--color-terracotta)" } as React.CSSProperties}
            >
              <Image
                src={first.src}
                alt={first.alt}
                fill
                /*
                  MUCH LARGER THAN THE BOX, and it has to be. This is a 3:2
                  photograph in a 4:5 frame, so `cover` scales it to the box's
                  HEIGHT and throws away the sides: the file has to be about
                  1.5 × the frame's height wide before a single pixel of it is
                  sharp. At the element's own width — 42vw at 1440 — Next asked
                  for w=640 to fill a box needing 1046, and the picture came up
                  soft. These are that width, not the element's.
                */
                sizes="(min-width: 1024px) 73vw, 170vw"
                className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-editorial)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </figure>

            {/*
              The bridge. It breaks the tall plate's bottom-right corner and
              lands in the channel under the wide one, which is the only mark
              that touches both frames — it is what makes them a pair rather
              than two pictures that happen to be near each other.

              `stamp`, not the default `draw`. A drawn mark fills off its own
              travel through the window, and a mark this low in a tall section
              has barely started by the time the section is being looked at —
              it reads as a wireframe and only finishes once it is off the top
              of the screen. Every mark below the fold of its own section has
              this problem; the two up at the plates' shoulders do not.
            */}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -right-7 z-10 deco-mark w-[4.5rem] rotate-[14deg]"
            >
              <DoodleMark name="starleaf" color={INK.lilac} treatment="stamp" depth={10} />
            </span>
          </Reveal>

          <Reveal
            variant="imageReveal"
            delay={0.1}
            className="relative z-10 col-span-12 lg:col-span-7 lg:col-start-6 lg:mt-[5.5rem]"
          >
            <figure
              className="group plate relative overflow-hidden rounded-[var(--radius-lg)] bg-cream rotate-[1.2deg] aspect-[16/10]"
              data-paint
              style={{ "--paint": "var(--color-primary)" } as React.CSSProperties}
            >
              <Image
                src={second.src}
                alt={second.alt}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-editorial)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </figure>

            {/* Top-right: the one mark that is allowed to sit above the fold
                of this plate, closing the staircase the two frames make. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-7 z-10 deco-mark w-[4.75rem] rotate-[18deg]"
            >
              <DoodleMark name="splash" color={INK.terracotta} delay={220} depth={12} />
            </span>

            {/*
              The only mark kept below `lg`. Stacked, the two pictures are two
              rectangles with a gap between them and nothing to say the gap is
              deliberate; one cut-out breaking the lower edge is what makes it
              read as a composition rather than as a column.

              DEEP LILAC, NOT SOFT LAVENDER. This one lands almost entirely on
              the Light Sage rather than on the photograph — lavender on sage
              is 1.40:1, which is the measurement `@utility plate` exists for,
              and a 60px mark at that step is a smudge. The two that sit over
              a picture can be lavender because the picture is what they are
              read against. `stamp` for the same reason as the bridge above.
            */}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-7 right-[12%] z-10 w-[3.75rem] rotate-[-12deg] lg:right-[22%] lg:w-[4.5rem]"
            >
              <DoodleMark name="bow" color={INK.lilac} treatment="stamp" depth={10} />
            </span>
          </Reveal>
        </div>
      </Container>
    </DeckSheet>
  );
}

/*
  THE GROUND BEHIND THEM.

  Higher opacity than the fields that sit behind type — there is no type here
  to compete with, and at the 0.12–0.16 those sections use, marks on a band
  this tall simply disappear. They are still behind both plates (`-z-10` on
  <SectionShapes>), so nothing here lands on a photograph; that is the
  DoodleMarks' job above.

  Light Sage is a mid-light green, so Deep Lilac and terracotta carry on it and
  White Rock is the one that only whispers — which is why it is the biggest
  and the furthest out.
*/
const INTERLUDE_SHAPES: readonly ShapePlan[] = groundShapes("sage");
