import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";

import { ParallaxPlate } from "@/components/motion/ParallaxPlate";
import { Reveal } from "@/components/motion/Reveal";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { cn, slugify } from "@/lib/utils";
import type { EditorialPanel } from "@/types";

/**
 * The statement's type — the largest on the page after the hero's wordmark.
 *
 * Sized per breakpoint rather than with a viewport clamp, because what sets
 * the ceiling is a fixed number of characters, not a fraction of the window:
 * "CREATE WITH YOUR HANDS." is twenty-three of them, and in this face at this
 * weight it measures a little over sixteen ems. The steps are cut so that line
 * lands between eighty and ninety per cent of the measure at every width —
 * wide enough to be a statement, short enough that it never wraps, which it
 * must not do at any width from `sm` up.
 *
 * Below `sm` there is no size at which twenty-three characters of display type
 * both fits and is worth having, so the lines stop being lines: see the note
 * on the spans in <Statement>.
 */
const STATEMENT =
  "font-light uppercase leading-[1.05] tracking-[-0.02em] " +
  "text-[1.75rem] xs:text-[2rem] sm:text-[2.125rem] md:text-[2.375rem] " +
  "lg:text-[3rem] xl:text-[3.375rem] 2xl:text-[4rem]";

/**
 * The two spreads.
 *
 * This is art direction, and it stays in the component rather than in the
 * content: which spread a panel is set as is a decision about the rhythm of
 * the page and about the particular artwork behind it, and nothing in the copy
 * implies either. Each entry carries the whole treatment — where the caption
 * sits, which way the type reads, and what if anything is laid over the
 * picture to let it read — because those three are one decision and splitting
 * them into a matrix would invite combinations that were never designed.
 *
 * The pair is meant to read as one system inverted. The first is a dark
 * painting with the caption settled into its foot in cream; the second is a
 * pale photograph with the caption standing at its head in charcoal. Same
 * measure, same rule, same arrow — opposite ground, opposite end of the page.
 */
const SPREADS = {
  /**
   * A caption settled into the foot of a dark artwork, flush to the left of
   * the measure, with the upper two thirds left to the painting. The folio
   * sits opposite the link on the same band, the way a page number does.
   *
   * The scrim rises from the foot only, and is out well before the top — it
   * exists to hold the caption, not to darken the picture.
   *
   * It was carried at 62/26 while the artwork behind it was a smooth
   * watercolour wash, where a light scrim was all a caption needed. The
   * client's mural replaced it, and a mural is the opposite kind of picture:
   * painted flowers over brick, busy edge to edge, with light petals and dark
   * stems inside the space of a single word. Averaged it looked fine; sampled
   * locally across the caption band it was not — 31% of that band sat under
   * 4.5:1 for cream type and 5% under 3:1, which is legible in places and
   * broken in others.
   *
   * These numbers are the lightest that fix it. At this strength, and on the
   * crop the panel is set to, the statement and the link clear their bars
   * across their whole area; the eyebrow still has about 7% of its own under
   * 4.5:1, because it sits highest in the block where the scrim has nearly
   * gone, and closing that last 7% means darkening half the panel. See the
   * note on the plate in lib/constants.ts.
   */
  foot: {
    section: "min-h-[max(34rem,80svh)] md:min-h-[88vh] lg:min-h-[94vh]",
    ground: "bg-text [--color-focus:var(--color-cream)]",
    body: "justify-end",
    text: "text-cream",
    folio: "text-cream",
    rule: "bg-sage",
    edge: "border-cream/45 group-hover:border-cream",
    arrow: "text-sage",
    scrim: "bg-gradient-to-t from-text/85 via-text/68 via-50% to-transparent to-86%",
    folioAtHead: false,
  },
  /**
   * A caption standing in the open field at the head of a pale artwork,
   * stepped in off the left edge so it reads as a different page rather than
   * the same one twice, and set in charcoal because the picture is light. The
   * folio goes up beside it, at the opposite end of the panel from the first
   * spread's.
   *
   * The scrim descends from the head, and it is cream rather than charcoal —
   * this spread lightens where the other one darkens, which is what keeps the
   * pair reading as one system inverted rather than as the same treatment
   * twice. It clears entirely by three fifths of the way down, so the lower
   * half of the picture is untouched.
   *
   * It carried no scrim at all while the plate was a wall of soft light with
   * the flowers low in the frame; the caption was laid straight on the wall,
   * where it already had seven or eight stops. The client's shelved pots
   * replaced it, and that picture has no quiet field anywhere in it — charcoal
   * type measured 1.0 to 1.8:1 against it, unreadable at every crop tried,
   * with 70 to 100% of each element under its bar. These figures are the
   * lightest that clear every bar with the caption where it sits: nothing
   * under 5.3:1 anywhere in it.
   *
   * The caption stays at the head rather than the middle for the same reason
   * it always did — the scrim is strongest there, and a caption centred in the
   * frame would drop its last line into the shelves.
   */
  field: {
    section: "min-h-[max(32rem,78svh)] md:min-h-[78vh] lg:min-h-[84vh]",
    ground: "bg-surface-alt [--color-focus:var(--color-primary)]",
    // Two notes on this line. The extra head padding is the sticky header's
    // clearance — the caption is the first thing in the panel and the bar
    // would otherwise cross it as the panel arrives. And the step in from the
    // left edge is padding on the column rather than a margin on the caption:
    // a margin shifts a full-width block sideways and pushes it off the
    // screen, where padding takes the width out first.
    body: "justify-start pt-6 md:pt-8 md:pl-[6%] lg:pl-[9%]",
    text: "text-text",
    folio: "text-text",
    rule: "bg-terracotta",
    edge: "border-terracotta/50 group-hover:border-terracotta",
    arrow: "text-terracotta",
    /*
      A wash of the page's own paper, falling from the head — the inverse of
      the other spread's, and for the inverse reason. The ink here is charcoal,
      so the ground has to be lifted rather than dropped, and it is lifted with
      White Rock rather than with white: it is the colour the rest of the page
      is printed on, and over a warm stoneware still life it reads as the
      picture being lit rather than veiled.

      This spread carried no overlay at all until the plate behind it changed.
      That was right for the photograph it was drawn against — a wall of soft
      light with the subject low in the frame, which left the whole head of the
      picture open for a caption. Every plate since has filled the frame, and
      charcoal laid straight onto the drying-pots photograph measures 1.0:1 at
      its worst under the statement, with 85% of the link's own ink under
      4.5:1. Something has to lift it.

      Stops are measured on the composite, against the caption's letterforms
      rather than the blocks holding them. That distinction is what keeps the
      wash short: the statement's box runs the full width of the measure but
      its ink stops at 59% of the frame, and sampling boxes instead had the
      wash reaching the foot of the panel and flattening the photograph into a
      sheet of cream.

      Only the stop positions move between the two shapes the panel takes, and
      they have to. On a phone the panel is a tall slice and the caption spans
      it almost edge to edge, with the link sitting 64% of the way down; on a
      desktop window the caption is a column in the top half and the same line
      lands at 54%. A single pair of stops cannot serve both — the desktop
      pair, short enough to spare the picture, left 78% of the link's ink under
      4.5:1 on a phone.

      It falls from the head at both, rather than running left to right on
      desktop where the caption is a left-hand column. A sideways wash keeps
      more of the photograph — the pots and the raking light are on the right —
      but it leaves the folio stranded outside it, and the folio measured
      1.0:1 there against a dark pot with no objectPosition able to help: the
      whole right edge of this picture is dark, the best crop reaching 2.3:1.
      Falling from the head covers the folio and the caption in one gesture and
      leaves the bottom third of the photograph at full strength.

      Nothing falls under its bar at 390, 1440 or 1990. The worst point
      anywhere is the link at 5.0:1 against 4.5; the statement holds 6.7:1
      against the 3:1 display type owes, and the folio 9.4:1.
    */
    scrim:
      "bg-gradient-to-b from-surface-alt/92 via-surface-alt/84 via-68% to-transparent to-84% " +
      "md:via-50% md:to-66%",
    folioAtHead: true,
  },
} as const;

interface EditorialStatementProps {
  panel: EditorialPanel;
  /** Which of the two spreads this panel is set as. */
  spread: keyof typeof SPREADS;
}

/**
 * A full-bleed editorial panel — one artwork at the width of the window with
 * a caption laid on it.
 *
 * It is a pause, not a section. Nothing here is a card, a column or a claim:
 * the artwork is the content and the words are what a gallery would print on
 * the wall beside it. The order of importance is meant to be visible in the
 * markup — the picture fills the frame, three lines of type sit in one corner
 * of it, and the whole interface is a hairline rule and an arrow.
 *
 * Two things move, both tied to the scroll rather than played at it. The
 * artwork drifts against the page at about 0.93 of its speed, so it reads as
 * something the panel is passing over rather than a picture printed on it; and
 * the caption rises the last of its distance a beat behind the page. Scroll
 * back up and both run backwards. See <ParallaxPlate> and <ScrollReveal>.
 *
 * There is no pinning and nothing is fixed. An earlier version held the plate
 * to the viewport and clipped it to the panel, which is a stronger effect and
 * the wrong one: it stops the artwork dead while everything else on the page
 * is still moving, and it cannot be done on a phone at all.
 *
 * Server component; every animation lives in the client components it
 * composes.
 */
export function EditorialStatement({ panel, spread }: EditorialStatementProps) {
  const { eyebrow, statement, linkLabel, linkHref, index, image } = panel;
  const s = SPREADS[spread];
  const headingId = `editorial-${slugify(eyebrow)}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        // The ground is what the panel is until the plate has loaded, so the
        // caption never lands on the page's own cream for a frame. The focus
        // ring is re-pointed with it, for the reason the hero re-points its
        // own: Deep Lilac disappears into a dark artwork.
        "relative isolate flex w-full flex-col",
        s.ground,
        s.section,
      )}
    >
      {/*
        The artwork. `sizes` is honest — the panel is the full width of the
        window at every breakpoint — and there is no `priority`: both panels
        are far below the fold, and asking for them early would come out of
        the hero's budget.
      */}
      <ParallaxPlate>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="100vw"
          style={{ objectPosition: image.position }}
          className="object-cover"
        />
      </ParallaxPlate>

      {/*
        The scrim, where a spread asks for one. It sits on the frame rather
        than on the plate, so it stays with the panel's own edge while the
        artwork travels underneath it.
      */}
      {s.scrim ? (
        <div aria-hidden className={cn("pointer-events-none absolute inset-0", s.scrim)} />
      ) : null}

      <Container className="relative flex flex-1 flex-col py-14 md:py-16 lg:py-20">
        {s.folioAtHead ? <Folio className={s.folio}>{index}</Folio> : null}

        <div className={cn("flex flex-1 flex-col items-start", s.body)}>
          {/*
            The caption rises as one block rather than as three entrances in
            sequence. A scrubbed reveal is being driven by the reader, and
            staggering it would mean the eyebrow, the statement and the link
            were each at a different point in the same gesture — which reads
            as three things arriving late, not as one thing arriving.
          */}
          <ScrollReveal className="w-full">
            <p
              className={cn(
                "flex items-center gap-4 text-[0.65rem] font-medium uppercase tracking-eyebrow xs:text-[0.7rem] md:text-xs",
                s.text,
              )}
            >
              <span aria-hidden className={cn("h-px w-9 shrink-0 md:w-12", s.rule)} />
              {eyebrow}
            </p>

            <h2 id={headingId} className={cn("mt-7 md:mt-9", STATEMENT, s.text)}>
              <Statement lines={statement} />
            </h2>

            <Link
              href={linkHref}
              className={cn(
                "group mt-9 inline-flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-eyebrow md:mt-11 md:text-xs",
                s.text,
              )}
            >
              <span
                className={cn("border-b pb-1.5 transition-colors duration-300 ease-soft", s.edge)}
              >
                {linkLabel}
              </span>
              <span
                aria-hidden
                className={cn(
                  "transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1",
                  s.arrow,
                )}
              >
                &#8594;
              </span>
            </Link>
          </ScrollReveal>
        </div>

        {s.folioAtHead ? null : <Folio className={s.folio}>{index}</Folio>}
      </Container>
    </section>
  );
}

/**
 * The statement.
 *
 * Each authored line is its own block from `sm` up, which is what makes the
 * break land between the sentences rather than wherever the measure runs out.
 * Below that the spans go back to being inline and the sentences simply flow,
 * because a phone is too narrow to hold any of these lines whole and forcing
 * it would either shrink the type to nothing or break every line twice. The
 * explicit spaces are what the inline case reads on, and they collapse to
 * nothing once the spans are blocks again.
 */
function Statement({ lines }: { lines: string[] }) {
  return lines.map((line, i) => (
    <Fragment key={line}>
      {i > 0 ? " " : null}
      <span className="sm:block">{line}</span>
    </Fragment>
  ));
}

/**
 * The panel's place in the run of two, set as small as it will read.
 *
 * A plain entrance rather than the scrubbed reveal the caption gets, and not
 * for consistency's sake — a scrubbed rise is measured against the element's
 * own position in the window, and this one sits hard against the foot of its
 * panel. Its travel would still be running when the panel is squarely in view,
 * which for a mark this small reads as a folio that has slipped rather than as
 * motion. It arrives, and then it is a page number.
 */
function Folio({ children, className }: { children: string; className: string }) {
  return (
    <Reveal variant="fadeIn" className="self-end">
      <p className={cn("text-[0.65rem] font-medium uppercase tracking-eyebrow", className)}>
        {children}
      </p>
    </Reveal>
  );
}
