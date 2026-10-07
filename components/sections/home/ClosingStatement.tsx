import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { PeelNote } from "@/components/ui/PeelNote";
import { forScript } from "@/components/ui/SectionHeader";
import { CLOSING, TAGLINE } from "@/lib/brand";
import { PRIVATE_EVENT_ENQUIRY_HREF } from "@/lib/privateEvents";
import { CLOSING_SPOTS } from "@/components/sections/home/homeSpots";

/**
 * The last page: one statement, framed by the brand's own shapes.
 *
 * ==========================================================================
 * THE FRAME — balanced, no longer mirrored
 * ==========================================================================
 *
 * This was framed by a mirror: one column of cut-outs, drawn again flipped
 * on the other side of the words, after the deck's closing page. With the
 * shared ground layer under it the band carried twelve marks that overlapped,
 * and the client asked for the homepage's doodles to read as one curated
 * system. The frame is now CLOSING_SPOTS in homeSpots.ts: four down each side
 * at staggered heights, different drawings left and right, two each in the
 * top and bottom padding — the same weight on both sides without being a
 * copy. Below `lg` the row of marks under the buttons, below, still carries it.
 *
 * WHY NO COLOUR FIELD HERE. Deep Lilac has already had two large moments on
 * this page — the opening field and the booking half of the split — and the
 * brief is explicit that the large areas belong to the softer colours. The
 * paper is enough; the shapes carry the colour.
 */

export function ClosingStatement() {
  return (
    <section
      aria-labelledby="closing-heading"
      /*
        DEEP LILAC, AT THE CLIENT'S ASK — the About page's own closing field.

        This closed on Light Sage with the statement in Deep Lilac, which made
        it the fourth sage section in the last third of the page: the same
        paper the seasonal band, the little-creators stripe and the
        collaboration teaser are printed on. The About page ends on the
        opposite — the ink and the ground swapped, the lilac becoming the
        field — and the client has asked for this page to end the same way.

        It costs nothing structurally and it earns the page its one focal
        field: Deep Lilac is spent once on the homepage, and this is now the
        place it is spent.
      */
      className="relative isolate overflow-clip bg-primary py-[5rem] md:py-[7rem] lg:py-[8.5rem]"
    >
      {/* Balanced, not mirrored — see CLOSING_SPOTS in homeSpots.ts. */}
      <SectionShapes plan={CLOSING_SPOTS} />
      <Container>
        <div className="grid grid-cols-12 items-center gap-x-gutter">
          <div aria-hidden className="col-span-2 hidden lg:block" />

          <div className="col-span-12 text-center lg:col-span-8">
            <Reveal>
              {/* FULL STRENGTH, NOT `/75`. The near-white `surface` is the one
                  light ink that clears 4.5:1 on Deep Lilac — it measures
                  4.67 — and holding it back a quarter drops a 12px semibold
                  label to 3.38:1, which is under what a label of that size
                  owes. The design system makes the same call in `inkFor`. */}
              <p className="text-label font-medium uppercase tracking-eyebrow text-surface">
                {TAGLINE}
              </p>
            </Reveal>

            {/*
              `forScript` straightens the curly apostrophe in "Let's": Hapsha
              has no curly quote and the browser substitutes a glyph from the
              fallback stack mid-word, which shows as a different face for one
              character in the middle of the biggest line on the page.
            */}
            <Reveal delay={0.08}>
              <h2
                id="closing-heading"
                className="heading-script mt-7 text-script-section text-surface"
              >
                {forScript(CLOSING.heading)}
              </h2>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mx-auto mt-8 max-w-[44ch] text-lead text-surface">
                {CLOSING.body}
              </p>
            </Reveal>

            {/*
              Two ways on, and only two — the brief asked for the last section
              to be minimal but meaningful. One is what you can make; the other
              is bringing the studio to you.
            */}
            <Reveal delay={0.2}>
              {/* Wider than the 16px two pills had: a link has no ground of its own,
    so the space around it is the only thing separating it from the
    pill — the banner gives the same pair the same room. */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-9 gap-y-4">
                {/* `cream` is the tone for a button standing ON Deep Lilac —
                    a lilac one cannot be seen at all, which is the same call
                    the About page's close makes. See <BlobButton>. */}
                <BlobButton href="/events" tone="cream" className="min-h-[3.25rem] px-8">
                  Explore experiences
                </BlobButton>
                {/*
                  NOT A SECOND PILL. These are the banner's two actions, word
                  for word, so they keep the banner's own treatment: one
                  filled, and the other as a link under the hand-drawn rule
                  that wipes in on hover.

                  The reasoning survives the ground changing under it. A
                  quieter pill needs a quieter ground than the field it sits
                  on, and on Deep Lilac there is not one: White Rock and Light
                  Sage are both within a hair of the cream pill beside it, so
                  a second pill is either as loud as the first or a smudge. A
                  link has no ground to lose.
                */}
                {/* The sticky note, as in the banner above — see <PeelNote>. */}
                <PeelNote href={PRIVATE_EVENT_ENQUIRY_HREF} className="min-h-[3.25rem] px-8">
                  Plan a private event
                </PeelNote>
              </div>
            </Reveal>
          </div>

          <div aria-hidden className="col-span-2 hidden lg:block" />
        </div>

        {/*
          Below `lg` the two columns would squeeze the sentence into a gutter,
          so the mirror lies down instead: one pair, side by side, under the
          words. The reflection survives; only its axis changes.
        */}
        {/* White Rock, following the totem's own cutout rather than its own
            old colour: Soft Lavender on Light Sage was a clear mark and on
            Deep Lilac it is the ground's own family, two shades apart. */}
        {/*
          FOUR, NOT TWO. The lying-down pair read as a pair of brackets and
          left the foot of the phone's screen as flat Deep Lilac. The run is
          now the totem's own shapes — a starleaf and a coral between the two
          cut-outs — which is the same vocabulary the desktop columns use,
          laid along one line instead of down two.

          INK ON DEEP LILAC IS MEASURED: White Rock is 3.95:1 here and Light
          Sage 3.83, both over the 3:1 a decorative mark owes. Soft Lavender is
          2.74 and is the one brand colour this ground cannot carry, so it is
          absent rather than faded.
        */}
        <Reveal
          delay={0.24}
          className="mt-14 flex flex-wrap items-end justify-center gap-x-7 gap-y-5 lg:hidden"
        >
          <span className="block w-[clamp(3.5rem,15vw,4.75rem)]">
            <DoodleMark name="cutout" color={INK.whiteRock} delay={260} />
          </span>
          <span className="block w-[clamp(2rem,8vw,2.75rem)]">
            <DoodleMark name="coral" color="var(--color-sage)" delay={320} />
          </span>
          <span className="block w-[clamp(2.25rem,9vw,3rem)]">
            <DoodleMark name="starleaf" color={INK.whiteRock} delay={380} />
          </span>
          <span className="block w-[clamp(3.5rem,15vw,4.75rem)] -scale-x-100">
            <DoodleMark name="cutout" color={INK.whiteRock} delay={440} />
          </span>
        </Reveal>

        {/*
          Two more off in the field, so the band has depth as well as a row.

          PLACED OFF MEASURED GROUND, not by eye. On a 375px phone the words
          run the full measure from 11% to 49% and again from 54% to 72%, so
          there is no free margin beside them: the only clear ground is the
          band ABOVE the eyebrow (0-11%) and the two 83px gutters either side
          of "Plan a private event", which spans 83-292 of 375. These sit in
          exactly those two places. At 8% and 14% they sat on the eyebrow and
          the heading.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[4%] top-[1%] block w-12 rotate-[12deg] sm:w-16 lg:hidden"
        >
          <DoodleMark name="splash" color="var(--color-sage)" treatment="draw" delay={480} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-[3%] top-[64%] block w-10 -rotate-12 sm:w-12 lg:hidden"
        >
          <DoodleMark name="bow" color={INK.whiteRock} treatment="draw" delay={560} />
        </span>
      </Container>
    </section>
  );
}
