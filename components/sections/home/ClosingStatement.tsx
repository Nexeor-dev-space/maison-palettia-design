import Link from "next/link";

import { NavLabel } from "@/components/layout/NavLabel";
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

  The colours are unchanged: the palette's two purples with White Rock breaking
  them up, which is the deck's own arrangement.
*/
const TOTEM: readonly { name: DoodleName; color: string; width: string }[] = [
  { name: "starburst", color: INK.lilac, width: "w-[clamp(3.25rem,5vw,5rem)]" },
  { name: "cutout", color: INK.whiteRock, width: "w-[clamp(5.5rem,8.4vw,8.5rem)]" },
  { name: "coral", color: INK.lavender, width: "w-[clamp(2.25rem,3.4vw,3.5rem)]" },
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
      className="relative isolate overflow-clip bg-sage py-[5rem] md:py-[7rem] lg:py-[8.5rem]"
    >
      <Container>
        <div className="grid grid-cols-12 items-center gap-x-gutter">
          <Reveal variant="settle" className="col-span-2 hidden lg:flex lg:justify-center">
            <Totem />
          </Reveal>

          <div className="col-span-12 text-center lg:col-span-8">
            <Reveal>
              <p className="text-label font-semibold uppercase tracking-eyebrow text-text/60">
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
                className="heading-script mt-7 text-[clamp(2.5rem,1.1rem+5.4vw,5rem)] leading-[1.06] text-primary"
              >
                {forScript(CLOSING.heading)}
              </h2>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mx-auto mt-8 max-w-[44ch] text-[1.0625rem] leading-[1.75] text-text/85 md:text-[1.1875rem]">
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
                {/* Light Sage sheet, so the flood deepens instead — a sage
                    flood here is the paper itself (dE 1.1). */}
                <BlobButton href="/events" tone="deep" className="min-h-[3.25rem] px-8">
                  Explore experiences
                </BlobButton>
                {/*
                  NOT A SECOND PILL. These are the banner's two actions, word
                  for word, on the banner's own Light Sage — so they are given
                  the banner's own treatment: one filled, and the other as a
                  link under the hand-drawn rule that wipes in on hover.

                  It is also the only honest way out of the outline here. A
                  quieter pill needs a ground quieter than Deep Lilac, and
                  there is not one: White Rock on Light Sage is 1.03:1 and
                  Soft Lavender 1.40:1, so a second pill is either as loud as
                  the first or invisible. A link has no ground to lose.
                */}
                <Link
                  href={PRIVATE_EVENT_ENQUIRY_HREF}
                  className="group/nav inline-flex min-h-[3.25rem] items-center text-action font-bold uppercase tracking-eyebrow text-text"
                >
                  <NavLabel isActive={false}>Plan a private event</NavLabel>
                </Link>
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
        <Reveal delay={0.24} className="mt-14 flex items-end justify-center gap-10 lg:hidden">
          <span className="block w-[clamp(4rem,18vw,5.5rem)]">
            <DoodleMark name="cutout" color={INK.lavender} delay={260} />
          </span>
          <span className="block w-[clamp(4rem,18vw,5.5rem)] -scale-x-100">
            <DoodleMark name="cutout" color={INK.lavender} delay={340} />
          </span>
        </Reveal>
      </Container>
    </section>
  );
}
