
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { forScript } from "@/components/ui/SectionHeader";
import { CLOSING, TAGLINE } from "@/lib/brand";
import { PRIVATE_EVENT_ENQUIRY_HREF } from "@/lib/privateEvents";
import { cn } from "@/lib/utils";

/**
 * The last page: one statement, framed by the brand's own shapes.
 *
 * ==========================================================================
 * THE MIRROR
 * ==========================================================================
 *
 * The deck's closing page has the one idea in the whole document that is pure
 * composition rather than layout: a tall symmetrical totem of cut-outs, paper
 * shapes mirrored on a vertical axis like a stained-glass window. It is the
 * most striking thing in fourteen pages and it was the thing the old closing
 * section had none of — that was a centred White Rock panel on a striped band,
 * which is a generic "final CTA" wearing the brand's colours.
 *
 * So the statement is framed by a mirror. One column of the studio's own
 * cut-outs is built, and then drawn again flipped on the other side of the
 * words — the same shapes, the same order, reflected. Nothing is copied from
 * the deck's artwork; it is assembled from the same vectors the rest of the
 * site uses, which is the difference between referencing a composition and
 * reproducing one.
 *
 * The columns arrive from the outside in as the section comes up, so the frame
 * closes around the sentence rather than appearing already shut.
 *
 * WHY NO COLOUR FIELD HERE. Deep Lilac has already had two large moments on
 * this page — the opening field and the booking half of the split — and the
 * brief is explicit that the large areas belong to the softer colours. The
 * paper is enough; the shapes carry the colour.
 */

/*
  The column, top to bottom.

  ==========================================================================
  THE WIDTHS ARE SET FROM EACH SHAPE'S OWN PROPORTIONS, NOT FROM THE COLUMN
  ==========================================================================

  They used to be shares of the column — 80%, 100%, 64% — which is the obvious
  way to write it and is wrong twice over.

  IT WAS ENORMOUS. The page has no maximum width (see <Container>), so a
  two-column share keeps growing: 240px a shape at 1440 and 420px at 2560, next
  to a sentence whose own type stops at 80px. The frame was louder than the
  words it was framing.

  AND IT READ AS SCATTER RATHER THAN AS A COLUMN, which is the part that
  actually looked broken. These three cut-outs have very different proportions
  — the starburst is square, the cutout is landscape, the coral is tall — so
  one width setting gives three wildly different heights: at 80/100/64 they
  came out 208, 172 and 239 pixels tall. Three marks of one apparent size read
  as a totem; three of three sizes read as clutter someone left there.

  So each width is chosen to land its shape at about the same height as its
  neighbours — the starburst's 299x324 needs less width than the cutout's
  362x259 to stand as tall — and each is a clamp, so the totem is a fixed
  ornament beside the words at every screen instead of a share of an unbounded
  column.

  THE COLOURS MOVED WITH THE GROUND. The totem read Deep Lilac, White Rock,
  Soft Lavender while the section was Light Sage. The section is Deep Lilac
  now, so the first of those is the ground itself and the mark carrying it
  disappeared entirely — the same trap the About page's close documents.

  What is left is the three brand colours the field does show: Soft Lavender
  at the top, White Rock in the middle, Light Sage at the foot. None of them
  is the field, and the widths are untouched, so the totem is the same object
  in the colours this ground can carry.
*/
const TOTEM: readonly { name: DoodleName; color: string; width: string }[] = [
  { name: "starburst", color: INK.lavender, width: "w-[clamp(3.25rem,5vw,5rem)]" },
  { name: "cutout", color: INK.whiteRock, width: "w-[clamp(5.5rem,8.4vw,8.5rem)]" },
  { name: "coral", color: "var(--color-sage)", width: "w-[clamp(2.25rem,3.4vw,3.5rem)]" },
];

function Totem({ flipped = false }: { flipped?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-col items-center gap-7 lg:gap-9",
        /* The reflection: the same column, drawn the other way round. */
        flipped ? "-scale-x-100" : null,
      )}
    >
      {TOTEM.map((shape, i) => (
        <span key={shape.name} className={cn("block", shape.width)}>
          <DoodleMark
            name={shape.name}
            color={shape.color}
            /* Outside in: the frame closes around the words. */
            delay={200 + (TOTEM.length - 1 - i) * 110}
          />
        </span>
      ))}
    </div>
  );
}

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
      <Container>
        <div className="grid grid-cols-12 items-center gap-x-gutter">
          <Reveal variant="settle" className="col-span-2 hidden lg:flex lg:justify-center">
            <Totem />
          </Reveal>

          <div className="col-span-12 text-center lg:col-span-8">
            <Reveal>
              {/* FULL STRENGTH, NOT `/75`. The near-white `surface` is the one
                  light ink that clears 4.5:1 on Deep Lilac — it measures
                  4.67 — and holding it back a quarter drops a 12px semibold
                  label to 3.38:1, which is under what a label of that size
                  owes. The design system makes the same call in `inkFor`. */}
              <p className="text-label font-semibold uppercase tracking-eyebrow text-surface">
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
                className="heading-script mt-7 text-script-section leading-[1.06] text-surface"
              >
                {forScript(CLOSING.heading)}
              </h2>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mx-auto mt-8 max-w-[44ch] text-lead leading-[1.75] text-surface">
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
                <BlobButton
                  href={PRIVATE_EVENT_ENQUIRY_HREF}
                  tone="secondaryInverse"
                  className="min-h-[3.25rem] px-7"
                >
                  Plan a private event
                </BlobButton>
              </div>
            </Reveal>
          </div>

          <Reveal variant="settle" delay={0.06} className="col-span-2 hidden lg:flex lg:justify-center">
            <Totem flipped />
          </Reveal>
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
