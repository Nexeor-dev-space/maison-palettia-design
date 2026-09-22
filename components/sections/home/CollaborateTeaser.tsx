import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { INK } from "@/components/sections/hero/composition";
import styles from "@/components/sections/home/CollaborateTeaser.module.css";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading } from "@/components/ui/SectionHeader";
import { COLLABORATIONS } from "@/lib/brand";
import { PAINTS_ON_SAGE, paintAt } from "@/lib/paint";
import { cn } from "@/lib/utils";

/**
 * The partnership invitation — the one part of the homepage addressed to a
 * business rather than to a visitor.
 *
 * ==========================================================================
 * WHAT WAS WRONG WITH IT, WHICH WAS NOT THE CONTENT
 * ==========================================================================
 *
 * It was a wide sage sheet carrying an eyebrow, a script heading, a sentence,
 * three ruled rows and a button. Every word of that is right and all of it is
 * still here. The trouble was the shape, and three things about it:
 *
 *   IT WAS THE SECTION BELOW IT. <PrivateEventsTeaser> is a heading on the
 *   left, a ruled list of named things on the right and one filled button
 *   under it. This was the same skeleton with the list run full width. Two
 *   sections built the same way read as one long generic stretch however
 *   different their words are, and this is the pair the page ends on.
 *
 *   IT WAS A TABLE. Name in one column, description in the other, a rule
 *   between each — the arrangement a spreadsheet takes. Nothing in it said
 *   these are three different kinds of thing a mall could ask for.
 *
 *   IT WAS A CARD ON A CARD. A sheet inside a section inside a page, the
 *   content inset twice from the gutter. That is the typical-section look: a
 *   panel is what gets reached for when the composition has not been decided.
 *
 * ==========================================================================
 * WHAT IT IS NOW — A HAND OF SWATCH CARDS
 * ==========================================================================
 *
 * The sheet is gone and the section is open on White Rock, the way /locations
 * sets the same three models. The invitation stands on the left as plain type.
 * The three models are on the right as a fan of cards — each one a degree or
 * two off square, each tucked under the one before it, each carrying a dab of
 * paint above its name in one of the brand's colours.
 *
 * WHY SWATCHES. The studio is a palette — it is in the name, and the brand
 * line is "a palette of creativity for everyone". Three ways to work with a
 * mall, each with its own colour, is that idea rather than a decorated list of
 * features. The paint is the same loaded-brush edge the activity plates and
 * the workshop journey use (`--mask-brush`), at the size the journey settled
 * on: a dab reads as paint, and anything much wider reads as a highlighter.
 *
 * WHY A FAN AND NOT A ROW OF TILES. The cards are narrow, overlapping and set
 * at different heights, which is a hand of chips someone is holding out rather
 * than a three-up grid. It is also the one thing the brand deck does on every
 * page and the homepage did nowhere: paper laid on paper.
 *
 * THE CARDS ARE LIGHT SAGE ON WHITE ROCK, and what separates them is the
 * `plate` veil rather than an outline — the client's note was "don't use this
 * much hard stroke lines", and these two grounds are 1.03:1 apart in
 * lightness, which is the exact case `@utility plate` was written for.
 *
 * WHY NOT TINTED CARDS, which is the obvious way to carry three colours:
 * <WaysToExperience> is four tinted plates on White Rock, six sections above
 * this one. Repeating it here would trade one generic shape for a borrowed
 * one. The cards keep one ground and the colour arrives as paint laid on them,
 * which also means every word stays Charcoal on Light Sage at 9.07:1 and no
 * ink has to change to stay readable.
 *
 * TWO DOORS, WHICH IT WAS MISSING ONE OF. The models in full — with the
 * approach under them — are at /locations#collaborate, and the page comment
 * says this section's job is to send anyone it speaks to there. It had no link
 * to it. The enquiry still goes to /contact, for the reason set out on that
 * page: the private-events form asks for a guest count and a date, which are
 * the wrong questions to put to a mall's marketing team.
 *
 * NOTHING IS INVENTED. The three names and their descriptions are
 * `COLLABORATIONS` verbatim (deck p.10). No partner, logo, rate, footfall or
 * result appears anywhere in the section, because the studio has supplied
 * none.
 */

/**
 * How each card is held in the hand.
 *
 * `lane` is the card's width, how far it laps the one before it, and how far
 * down the fan it sits; `tilt` and `dab` are the two angles, fixed per card
 * for the reason the journey's swatches give — three objects at one angle read
 * as a template that has been knocked, and three set down differently read as
 * paper somebody put there. `z` keeps the left of the fan on top, so each card
 * tucks under its neighbour the way a held hand does.
 *
 * `lap` IS WHAT STOPS THE FAN EATING ITS OWN WORDS, and it is the fix for a
 * measured failure rather than a precaution: at a 4% overlap the first render
 * of this read "ETAIL & F&B COLLABORATIONS" and "o-branded workshops", because
 * the card on top covered the left edge of the text under it. The overlap is
 * now 3% — about 21px where the fan is 700px wide — and every lapped card
 * carries 40px of left padding, so what the neighbour covers is always padding
 * and never a letter. Anything added to these cards must stay inside it.
 *
 * THE FAN IS AN `xl` ARRANGEMENT, AND THAT IS ALSO MEASURED. Held out across
 * seven columns of a 1024 screen each card is about 200px wide, and the
 * longest description — the marketing-calendar one — fell to seven lines and
 * hung the third card a couple of hundred pixels below the first two. A hand
 * of cards has to be roughly a hand's width. So below 1280 the three simply
 * stack down the column, indented alternately, which is the same objects in
 * the same order with room to be read.
 *
 * Written as complete class strings because Tailwind reads source literally:
 * anything assembled at runtime never reaches the stylesheet. Every lane is
 * `lg:`-prefixed, so below that the three simply stack.
 */
const CARDS = [
  {
    tilt: "-2.6deg",
    dab: "-7deg",
    lane: "lg:mr-[8%] xl:mr-0 xl:mt-7 xl:w-[35%]",
    z: "z-30",
    lap: "",
  },
  {
    tilt: "1.7deg",
    dab: "5deg",
    lane: "lg:ml-[8%] xl:-ml-[3%] xl:mt-0 xl:w-[35%]",
    z: "z-20",
    lap: "xl:pl-10",
  },
  {
    tilt: "-1.1deg",
    dab: "-4deg",
    lane: "lg:mr-[3%] xl:mr-0 xl:-ml-[3%] xl:mt-12 xl:w-[35%]",
    z: "z-10",
    lap: "xl:pl-10",
  },
] as const;

export function CollaborateTeaser() {
  return (
    <section
      aria-labelledby="collaborate-teaser"
      /*
        `overflow-x-clip` because the fan is tilted and laps its own column, and
        a shape reaching past the gutter on a narrow screen gives the whole page
        a horizontal scrollbar. The section this replaced learned that the hard
        way and the note is kept.
      */
      className="relative overflow-x-clip bg-cream py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <Container>
        <div className="grid grid-cols-12 items-start gap-x-gutter gap-y-14 lg:items-center">
          {/* ---- the invitation, as plain type on the page --------------- */}
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <p className="flex items-center gap-3 text-label font-semibold uppercase tracking-eyebrow text-text">
                {/*
                  Charcoal, not Deep Lilac. The label was lilac on White Rock,
                  which measures 3.95:1 — under what a 12px line owes. The
                  colour moves to the mark beside it, which is decorative and
                  `aria-hidden` and owes no ratio.
                */}
                <span aria-hidden className="block w-4 shrink-0">
                  <DoodleMark name="dot" color={INK.lilac} />
                </span>
                Collaborative approach
              </p>
            </Reveal>

            {/*
              The house heading rather than an `h2` with the script set on it by
              hand: this one gets the masked line reveal every other section
              statement on the page has, and where the two lines break is a
              decision rather than whatever the measure does.
            */}
            <DisplayHeading
              id="collaborate-teaser"
              size="section"
              tone="accent"
              className="mt-6 md:mt-7"
              lines={["Let’s create", "together."]}
            />

            <Reveal delay={0.12}>
              {/* `script-lede` rather than a margin — the gap under a script
                  heading is a token, because Hapsha's descenders hang into it. */}
              <p className="script-lede max-w-[34ch] text-body leading-[1.8] text-text/85">
                For malls, retailers and F&amp;B partners: creative activations built around your
                space and your calendar.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5 md:mt-10">
                {/* White Rock ground, so the Light Sage flood — dE 15.6, and
                    the sheet it stands on is not the one sage disappears into. */}
                <BlobButton href="/contact" tone="sage" className="min-h-[3.25rem] px-8">
                  Partner with us
                </BlobButton>

                {/*
                  The second door, which this section did not have. The three
                  models in full live on /locations, and sending a mall there is
                  the whole reason the homepage keeps a teaser.
                */}
                <Link
                  href="/locations#collaborate"
                  className="group -my-1.5 inline-flex items-baseline gap-3 py-1.5 text-action font-semibold uppercase tracking-eyebrow text-text"
                >
                  <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
                    How we work with malls
                  </span>
                  <span
                    aria-hidden
                    className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                  >
                    &#8594;
                  </span>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* ---- the three ways, held out as a hand ---------------------- */}
          <Stagger
            as="ul"
            className="col-span-12 flex flex-col gap-y-5 lg:col-span-7 lg:col-start-6 xl:flex-row xl:items-start xl:gap-y-0"
          >
            {COLLABORATIONS.map((model, i) => {
              const card = CARDS[i % CARDS.length];

              return (
                <Reveal
                  as="li"
                  key={model.slug}
                  delay={i * 0.08}
                  className={cn("relative", card.z, card.lane)}
                >
                  <div
                    className={cn(
                      styles.card,
                      "plate rounded-[1.25rem] bg-sage px-5 pb-7 pt-6 md:px-6 md:pb-8 md:pt-7",
                      card.lap,
                    )}
                    style={{ "--tilt": card.tilt } as React.CSSProperties}
                  >
                    {/*
                      The dab, at the size the workshop journey settled on. It
                      is the only thing in the section that carries the colour,
                      and it is decorative and `aria-hidden`: nothing here is
                      told apart by colour alone.
                    */}
                    <span
                      aria-hidden
                      className={cn(styles.dab, "h-9 w-[3.5rem] md:h-10 md:w-[4.25rem]")}
                      style={
                        {
                          "--paint": paintAt(i, PAINTS_ON_SAGE),
                          "--tilt": card.dab,
                        } as React.CSSProperties
                      }
                    />

                    {/*
                      The deck's condensed face in caps, which is what every
                      named thing taken straight off the deck is set in. One
                      weight only, so `font-synthesis: none`: a browser faking a
                      bold out of a condensed face thickens it unevenly.
                    */}
                    <h3 className="mt-5 text-[1.0625rem] font-bold uppercase leading-[1.12] tracking-[0.015em] text-text [font-family:var(--font-deck)] [font-synthesis:none] md:text-[1.25rem]">
                      {model.name}
                    </h3>

                    <p className="mt-2.5 text-[0.9375rem] leading-[1.65] text-text/85 md:text-body">
                      {model.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </Stagger>
        </div>
      </Container>
    </section>
  );
}
