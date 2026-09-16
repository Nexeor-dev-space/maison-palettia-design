import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { RuledLink } from "@/components/ui/Action";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import { cn } from "@/lib/utils";
import type { Discipline } from "@/types";

/**
 * The index: one strand per row, each with a photograph big enough to be the
 * reason you look at the row.
 *
 * WHAT THIS REPLACED, AND WHY ALL OF IT WENT AT ONCE. The strands used to run
 * down the left as a numbered list while a single arched window held at the
 * right and cross-faded through their photographs as each row came level. The
 * client's note on this section was three things — take the divider lines out,
 * take the background colour out, make the images taller — following the
 * reference's EXHIBITIONS AND FAIRS pattern, where each item is a compact
 * block of text at the top of one half and one very large picture filling the
 * other. Every one of those three is a load-bearing removal here:
 *
 *   - THE DIVIDERS. Each row opened with a `border-t border-text/20`. Gone, as
 *     asked. Space is doing that work now, which is why the rows are set a
 *     full `section-gap` apart rather than the reference's 20px: the reference
 *     keeps every picture on the same side, so its rows separate on a shared
 *     left edge. Ours alternate, so two neighbouring plates land on opposite
 *     sides and need real vertical air or the run reads as a staircase.
 *
 *   - THE ACTIVE BAND. The Soft Lavender field, the lilac rule that wiped
 *     across the top of the active row, and the `-mx-3 px-3` bleed that
 *     existed only so that band could come out past the measure. The band was
 *     answering a question this composition no longer asks — "which of these
 *     rows owns the one photograph on screen" — because every row now owns its
 *     own. With the band gone the bleed had nothing to carry and went with it.
 *     That also takes Soft Lavender off the homepage, which is what the
 *     one-accent rule wanted anyway.
 *
 *   - THE DOORWAY, AND THE CLIENT COMPONENT WITH IT. The sticky arch and the
 *     IntersectionObserver that drove it were the only reason this file was
 *     `"use client"`: two pieces of state (the row in the middle band, the row
 *     being pointed at), a ref array over the rows, and an observer to keep
 *     them true. None of it has anything to do now, so the directive, the
 *     `useState`, the `useRef` and the `useEffect` are all deleted and this is
 *     a server component again. The motion is still here — <Reveal> is a
 *     client component and a server parent can render it — but the section no
 *     longer ships any logic of its own to the browser.
 *
 * THE `arch` UTILITY NOW RENDERS EXACTLY ONCE. The window was one of the two
 * places the Maison's entrance was drawn; the footer is the other. Read the
 * note above `@utility arch` in app/globals.css — the motif is a language, not
 * a texture — and treat the footer as the whole of it. (<BrandIntro> also
 * carries one, but it is parked: nothing imports it.)
 */

interface StrandIndexProps {
  disciplines: Discipline[];
  /** Placement only. The section owns the head-to-content gap, not this. */
  className?: string;
}

export function StrandIndex({ disciplines, className }: StrandIndexProps) {
  return (
    /*
      `flex flex-col gap-*` rather than `space-y-*`: the gap belongs to the
      list, not to "every child except the first", so adding a fourth strand
      cannot land it against the third.
    */
    <ol className={cn("flex flex-col gap-section-gap", className)}>
      {disciplines.map((discipline, i) => (
        <Strand
          key={discipline.slug}
          discipline={discipline}
          index={i + 1}
          // Right, left, right. Derived from position rather than stored on
          // the strand, so the rhythm survives a strand being added, removed
          // or reordered in the CMS.
          flip={i % 2 === 1}
        />
      ))}
    </ol>
  );
}

/**
 * The photograph's proportion, and the floor that actually decides its height
 * at every desktop width anyone is reading this on.
 *
 * MEASURED, because the reference gives a number and a number is checkable.
 * EXHIBITIONS AND FAIRS runs its plates at 694x518 on a 1440 screen. Our half
 * of the site's twelve columns is narrower than the reference's: at 1440 the
 * gutter is 2vw a side, leaving 1382.4px of measure, and six columns of twelve
 * with the house `lg:gap-x-10` between them come to 671.2px. A clean 4:3 of
 * that is 503px — under the reference, and under the 540px the old sticky arch
 * reached at 1440x900. "Increase the height of the images" cannot end with a
 * smaller picture than the one it replaced.
 *
 * So the ratio sets the shape and the `min-h` sets the presence:
 *
 *   1024   471.7 wide   4:3 gives 354   ->  min-h 30rem  =  480px
 *   1280   594.4 wide   4:3 gives 446   ->  min-h 36rem  =  576px
 *   1440   671.2 wide   4:3 gives 503   ->  min-h 36rem  =  576px
 *   1920   901.4 wide   4:3 gives 676   ->  the ratio leads again
 *
 * Every line of that was then measured in the browser and came back exact.
 * The half is `0.48 * viewport - 20` once the gutter and the eleven gaps are
 * taken out, so the floor leads from `lg` up to 1642px — the whole of where
 * this page is actually read — and the ratio takes back over above it, so the
 * plate keeps growing with the display instead of parking at 576.
 *
 * BELOW `lg` THE PROPORTION IS UNCHANGED FROM WHAT SHIPPED — 4:3 on a phone,
 * 3:2 from `xs`. The spec sketched 3:2 throughout, which at 390px would be
 * 233px against the 262px rendering today: 29px shorter, in a section whose
 * whole instruction was "taller". A narrow screen already gave every strand
 * its own plate, so there was nothing to fix there; the client's note is about
 * the desktop, where three strands were sharing one window.
 */
const PLATE = "aspect-[4/3] xs:aspect-[3/2] lg:aspect-[4/3]";
const PLATE_FLOOR = "lg:min-h-[30rem] xl:min-h-[36rem]";

/**
 * Rendered width at each breakpoint, so the browser fetches one file size.
 * 47vw is the six-column half measured across the range — 46% at 1024, 46.6%
 * at 1440, 47% at 1920 — and below `lg` the row is one column, so the plate is
 * the full measure and the expression is the gutter token restated.
 */
const PLATE_SIZES = "(min-width: 64rem) 47vw, calc(100vw - 2 * max(1.25rem, 2vw))";

interface StrandProps {
  discipline: Discipline;
  index: number;
  /** Puts the photograph on the left at `lg`. Alternated down the run. */
  flip: boolean;
}

/**
 * One strand: a compact block of type at the top of one half, one very large
 * photograph filling the other, and nothing else. The empty space under the
 * text is the composition rather than a gap in it — it is the effect the
 * reference gets, and the reason the rows can carry no rule between them.
 *
 * WHICH SIDE THE PICTURE TAKES IS SET IN THE GRID, NEVER IN THE MARKUP ORDER.
 * The text always comes first in the DOM and only its column changes, so a
 * flipped row reads in the same order to a screen reader and stacks in the
 * same order on a phone — text, then the plate it belongs to — whichever way
 * round it is drawn.
 *
 * `lg:row-start-1` on both halves is load-bearing and not decoration. Grid
 * placement is sparse: it never backtracks. With the text first in the DOM and
 * pinned to column 7 on a flipped row, the photograph that follows cannot be
 * placed to its left in the same row and drops to a second one — see the same
 * note, and the same fix, in <WorkshopFeature>. Naming the row for both keeps
 * them side by side either way.
 */
function Strand({ discipline, index, flip }: StrandProps) {
  return (
    <li>
      {/*
        `isolate` is here for the stretched link below. Everything the row
        needs to do — the name's overlay, the hover on the plate — happens
        inside this element, and a stacking context keeps the one z-index in
        the row from meaning anything outside it.
      */}
      <article className="group relative isolate grid grid-cols-12 items-start gap-x-6 gap-y-10 lg:gap-x-10 lg:gap-y-0">
        {/* --- The strand, at the top of its half ------------------------ */}
        {/*
          TWO CLASSES ON THIS BLOCK EXIST ONLY TO KEEP THE ROW CLICKABLE.

          `fadeIn` rather than the house `fadeUp`, because of the link inside
          it. A transform — any transform, including the 16px rise `fadeUp`
          animates through — makes an element a containing block for its
          absolutely positioned descendants, which would resolve the name's
          `inset-0` overlay against this text block instead of against the
          row. The picture would stop being part of the target for as long as
          the entrance was playing, and on any browser that leaves a settled
          `transform` in place, for good.

          `z-10`, on a grid item that is deliberately NOT positioned. The
          plate opposite is `relative` — it has to be, it crops a `fill`
          image — and it is the later sibling, so at the default `z-index:
          auto` it paints over the overlay and swallows every click on the
          half of the row that looks most clickable. z-index applies to a grid
          item whether or not it is positioned, so this lifts the whole text
          block, overlay included, above the plate without making it the
          overlay's containing block. Putting the z-index on the pseudo-
          element instead looks equivalent and is not: `fadeIn` is an opacity
          animation, opacity below 1 is itself a stacking context, and the
          lift would be trapped inside it for exactly as long as the row was
          mid-entrance — or permanently, if the observer never fired.
        */}
        <Reveal
          variant="fadeIn"
          className={cn(
            "z-10 col-span-12 lg:col-span-6 lg:row-start-1",
            flip ? "lg:col-start-7" : "lg:col-start-1",
          )}
        >
          {/*
            A folio, not content: the <ol> already carries the position, and
            the numerals are the index's spine on the page rather than
            something anyone needs read out as "zero one".

            Deep Lilac, which it could not be before. On the Light Sage this
            section used to sit on, the accent measures 3.83:1 — fine for a
            mark, under the 4.5:1 an 11px line of text owes — so the numeral
            was charcoal and the colour stayed on the rules. Removing the
            background colour is what pays for it: on the page ground Deep
            Lilac is 4.90:1, and the one-accent rule lists numerals among the
            things the accent is for.
          */}
          <p
            aria-hidden
            className="text-label font-medium uppercase tracking-eyebrow text-primary"
          >
            {String(index).padStart(2, "0")}
          </p>

          <h3 className="mt-6 text-h2 font-light uppercase tracking-[-0.02em] text-text">
            <Link
              href={discipline.href}
              aria-label={`${discipline.name} — explore ${discipline.name.toLowerCase()} experiences`}
              /*
                The row's one anchor, stretched across all of it — the
                photograph included, which is half the row and the half that
                looks most clickable. The overlay resolves against the
                <article>, which is the nearest positioned ancestor, and the
                `z-10` on the block above is what gets it over the plate; see
                the note there.
              */
              className="after:absolute after:inset-0 after:content-['']"
            >
              {discipline.name}
            </Link>
          </h3>

          <p className="mt-6 max-w-[26rem] text-body text-text/80">{discipline.description}</p>

          {/*
            An affordance, not a link. The row already has one, stretched
            across it, and a second anchor to the same place would put every
            strand in the tab order twice for nothing. <RuledLink asSpan> is
            aria-hidden and `pointer-events-none`, so it cannot become the one
            dead spot in the middle of the target either.
          */}
          <RuledLink asSpan label={`Explore ${discipline.name}`} className="mt-8" />
        </Reveal>

        {/* --- The photograph, filling the other half --------------------- */}
        <div
          className={cn(
            "col-span-12 lg:col-span-6 lg:row-start-1",
            flip ? "lg:col-start-1" : "lg:col-start-7",
          )}
        >
          {/*
            <WorkshopPhoto> rather than an <Image> of our own. It is named for
            the section it was written in and it takes a plain ImageAsset, so
            it fits a strand exactly as well as a session: square edges, a
            definite proportion, the shared hover scale off the row's `group`
            — and, the part that matters here, no scroll reveal. Read its
            header: a photograph wrapped in an observer-gated fade is a
            photograph that can stay invisible, and these three are now the
            largest things in the section.
          */}
          <WorkshopPhoto
            image={discipline.image}
            aspect={PLATE}
            sizes={PLATE_SIZES}
            className={PLATE_FLOOR}
          />
        </div>
      </article>
    </li>
  );
}
