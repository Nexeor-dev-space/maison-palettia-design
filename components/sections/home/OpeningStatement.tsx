import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
import { DeckSheet } from "@/components/ui/deck/Deck";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { BRAND_STORY_SET } from "@/lib/brand";

/**
 * What Maison Palettia is — the first words after the banner.
 *
 * ==========================================================================
 * ONE SENTENCE, SET AS A SENTENCE
 * ==========================================================================
 *
 * The deck opens with a single line: "Maison Palettia is a creative lifestyle
 * brand inspired by the word Palette — a symbol of colour, expression, and
 * imagination." The previous pass broke that line into three objects and gave
 * each its own size and place: the first clause small at the top left, the
 * word alone at 17vw, and the last clause 800px away at the right with a rule
 * beside it. Read down the page it was three fragments; the client's word for
 * it was messy, and the word itself was so large its swash crossed the line
 * above it.
 *
 * It is one paragraph now. "Palette" is still the loudest thing in the
 * section — it is the brand's own origin — but it is loud *inside the
 * sentence*, set in the script at a size and a half and in Deep Lilac, so the
 * eye lands on it and then keeps reading. Nothing has to be re-joined by the
 * reader, and nothing overlaps.
 *
 * WHY THE SIZE CAME DOWN. At 17vw the word was 245px on a 1440 screen, which
 * is larger than the page's own banner tagline — a subordinate section
 * shouting over the top of the hero. Inline it tops out at about 66px, which
 * is still the largest mark on this sheet.
 *
 * THE OBJECT BELOW is the photograph and the colour field, flush, one height,
 * one radius — the part of the old composition that worked. Two changes: it
 * is held inside the measure rather than running off the right edge, so the
 * section has a shape instead of a crop; and the cut-out that straddled the
 * seam is gone, because a shape laid over a join reads as a sticker covering
 * a joint rather than as the join being made well.
 *
 * The words are `BRAND_STORY_SET`, the deck's own. Nothing here is written for
 * the website.
 */
export function OpeningStatement() {
  return (
    <DeckSheet labelledBy="opening-statement">
      <Container className="relative">
        {/*
          One cut-out, in the air the measure leaves to its right. The sentence
          is set to 34 characters because that is what it wants to be; this is
          what stands in the space that leaves, and it is the only shape on
          this half of the sheet.
        */}
        <Reveal
          delay={0.2}
          className="pointer-events-none absolute right-gutter top-16 hidden w-[7.5rem] xl:block"
        >
          <DoodleMark name="wave" color={INK.lavender} />
        </Reveal>

        <Reveal>
          <p className="flex items-center gap-3 text-label font-semibold uppercase tracking-eyebrow text-primary">
            <span aria-hidden className="block w-4 shrink-0">
              <DoodleMark name="starleaf" color={INK.terracotta} />
            </span>
            What this is
          </p>
        </Reveal>

        {/*
          The sentence. `leading-[1.5]` is not a preference: Hapsha's capitals
          stand 0.9em above their baseline, so at 1.5em inline the P reaches
          about 1.35em over the line it sits on. A tighter measure than this
          and the swash goes through the line above — which is exactly what the
          old 17vw setting did.
        */}
        <Reveal delay={0.08}>
          <h2
            id="opening-statement"
            className="mt-8 max-w-[34ch] text-[clamp(1.5rem,1.05rem+1.9vw,2.6rem)] font-light leading-[1.5] tracking-[-0.015em] text-text md:mt-10"
          >
            {BRAND_STORY_SET.leadIn}{" "}
            <span className="heading-script inline-block text-[1.5em] leading-[0.75] text-primary">
              {BRAND_STORY_SET.word}
            </span>
            {/* Non-breaking, so the dash never starts a line on a narrow
                screen — it belongs to the word it follows. */}
            {"\u00a0"}&mdash; {BRAND_STORY_SET.defines}
          </h2>
        </Reveal>
      </Container>

      {/*
        THE OBJECT. Photograph and field, flush, sharing one edge and one
        height: `items-stretch` and a minimum on the row, so the picture covers
        whatever height the copy turns out to need.
      */}
      <Container className="mt-12 md:mt-16">
        <Reveal variant="fadeIn">
          <div className="flex flex-col overflow-hidden rounded-[1.5rem] md:rounded-[2rem] lg:min-h-[22rem] lg:flex-row">
            {/*
              WIDER THAN THE PLATE THAT WAS HERE. The previous picture was one
              hand on one plate, which survives any crop; this is six children
              spread across the full width of a 16:9 frame, and at 38% of the
              row it lost the two on the ends. 48% keeps the group whole and
              still leaves the field the longer measure, which is the one the
              paragraph needs.
            */}
            <div
              className="relative aspect-[16/10] w-full lg:aspect-auto lg:w-[48%] lg:shrink-0"
              data-paint
              style={{ "--paint": "var(--color-terracotta)" } as React.CSSProperties}
            >
              <Image
                src="/images/about-img.png"
                alt="Six children in the studio, holding up the pictures they have coloured and their pots of colouring pencils."
                fill
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover"
                style={{ objectPosition: "50% 50%" }}
              />
            </div>

            <div className="flex flex-1 flex-col justify-center bg-primary px-7 py-11 text-surface md:px-12 md:py-14 lg:px-14">
              <p className="max-w-[48ch] text-[clamp(1rem,0.94rem+0.3vw,1.1875rem)] leading-[1.8]">
                {BRAND_STORY_SET.carries}
              </p>

              {/* The sign-off, in the sage that reads on Deep Lilac. */}
              <p className="mt-7 flex items-center gap-3 text-[1.0625rem] font-medium text-sage">
                <span aria-hidden className="block w-5 shrink-0">
                  <DoodleMark name="splash" color={INK.lavender} delay={220} />
                </span>
                Welcome to Maison Palettia.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </DeckSheet>
  );
}
