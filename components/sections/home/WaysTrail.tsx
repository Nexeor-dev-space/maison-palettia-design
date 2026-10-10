"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { useHydratedReducedMotion } from "@/components/motion/useHydratedReducedMotion";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { ModeMark } from "@/components/ui/ModeMark";
import { PaintStroke } from "@/components/layout/PaintStroke";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { cn } from "@/lib/utils";

export interface TrailDoor {
  label: string;
  href: string;
  mode?: "diy" | "scheduled";
}

export interface TrailItem {
  name: string;
  lede: string;
  doors: TrailDoor[];
  /** The brand cut-out for this way in. */
  mark: DoodleName;
  /** A second, smaller one — the node on the trail and the box's foot. */
  trailMark: DoodleName;
  /** The panel's ground — a measured tint, see the note in WaysToExperience. */
  tint: string;
  /** The same colour undiluted: the cut-out, the trail and the node take it. */
  paint: string;
  photo: string;
}

/**
 * ==========================================================================
 * THE FOUR WAYS IN, HUNG OFF A PAINTED TRAIL
 * ==========================================================================
 *
 * The client asked for this section to be more artistic: the cards arriving
 * along a path, and the path filling with colour as the page scrolls.
 *
 * WHAT IT IS. One line runs down the section. The four ways in hang off it,
 * alternating sides on a wide screen, and the line is UNDRAWN until you reach
 * it — each length of it inks in as its own card comes up the window, in that
 * card's own colour, so the trail changes hue as you go down: lilac, then
 * terracotta, then lavender, then sage. Where the line reaches a card, a node
 * fills and the card swings in from the line rather than from nowhere.
 *
 * ==========================================================================
 * WHY IT IS FOUR SEGMENTS AND NOT ONE PATH
 * ==========================================================================
 *
 * The obvious build is a single SVG behind the whole list with one long path.
 * It is also the one that cannot survive this site: the list is four columns
 * at lg, one below it, the cards are different heights at every width, and a
 * path drawn to fit one of those is wrong at all the others. Keeping it right
 * would mean measuring the DOM and regenerating `d` on every resize.
 *
 * So each ROW owns its own segment. The segment is an SVG that fills its
 * cell, enters at the top edge and leaves at the bottom edge at the same x,
 * so consecutive rows join wherever the rows happen to fall. The trail is
 * continuous because the geometry is relative, not because anything measured
 * it. `preserveAspectRatio="none"` lets the cell be 3.5rem wide on a phone
 * and 7rem on a desktop with the bow compressing to match.
 *
 * THE STROKE SCALES WITH THE CELL, and it has to — see the note on the path
 * itself. `vector-effect: non-scaling-stroke` held it to one weight and, in
 * the same breath, stopped the line reaching the next card on any screen
 * wider than the viewBox.
 *
 * ==========================================================================
 * IT DEGRADES TO THE FINISHED STATE, NOT TO NOTHING
 * ==========================================================================
 *
 * Under reduced motion the trail is drawn in full and the cards sit where
 * they land — the composition is the point, the travel is the decoration, and
 * the decoration is the part that goes. `data-reveal` marks every element the
 * no-JavaScript catch in app/layout.tsx strips transforms from, for the same
 * reason: a card that never arrives has to already be there.
 */
export function WaysTrail({ items }: { items: readonly TrailItem[] }) {
  return (
    /*
      `isolate` IS LOAD-BEARING. Each link is `-z-10` so it paints behind the
      cards; without a stacking context on the list that -10 escapes to the
      nearest ancestor that has one and goes behind the SECTION instead, where
      it cannot be seen at all. Isolating here keeps every link above the
      ground and below every card.
    */
    <ol className="relative isolate mt-12 md:mt-16">
      {items.map((item, i) => (
        <TrailRow
          key={item.name}
          item={item}
          next={items[i + 1]}
          index={i}
          last={i === items.length - 1}
        />
      ))}
    </ol>
  );
}

function TrailRow({
  item,
  next,
  index,
  last,
}: {
  item: TrailItem;
  next?: TrailItem;
  index: number;
  last: boolean;
}) {
  const row = useRef<HTMLLIElement>(null);
  /* False while hydrating, so the first client render draws the server's
     moving trail and not a finished one — the mismatch React used to log
     under reduced motion. See components/motion/useHydratedReducedMotion.ts. */
  const reduced = useHydratedReducedMotion();

  /* Even cards sit LEFT, odd ones RIGHT — so every link crosses the measure. */
  const leftSide = index % 2 === 0;

  /*
    THE LINK INKS IN OVER THE ROW'S OWN PASS. The cards no longer arrive one
    after another — the client asked for that to stop — so this is the only
    thing left that answers the scroll, and it runs the length of the row it
    belongs to rather than a band between two of them.
  */
  const { scrollYProgress } = useScroll({
    target: row,
    /*
      IT HAS TO BE CLOSED BY THE TIME THE JOIN IS LOOKED AT. At "end 45%" the
      line only reached 100% once the row's foot was near the top of the
      window — measured at 1440x900, the next card's top had to be 20% down
      the screen before the path finished, and at the natural reading position
      (that card's top around 40%) the stroke was 80% drawn and stopped in
      clear paper. The client's note was that the first path does not touch,
      and this was most of why: it does touch, several hundred pixels of
      scrolling after you have stopped looking.

      "end 72%" finishes it with the next card's top between 44% and 53% of
      the window across 800-1200px of viewport height — in view, mid-screen,
      which is when the join has to be made. The draw still runs the length of
      a card, so nothing about the pace changes.
    */
    offset: ["start 85%", "end 72%"],
  });
  const draw = useTransform(scrollYProgress, [0, 1], [0.001, 1]);
  const nodeIn = useTransform(scrollYProgress, [0.55, 0.85], [0, 1]);

  /*
    THE PHONE'S CONNECTOR KEEPS ITS OWN CLOCK, and that is the whole of why it
    used to look painted-on rather than drawn.

    The desktop arc runs the width of the row, so the row's own progress is the
    right clock for it — you watch it ink while the card it belongs to crosses
    the window. The phone's connector is not in the row: it hangs in the 6rem
    gap BELOW it, at `top-full`. Against the row's offsets the progress reaches
    1 as the row's foot passes 72% of the window — which is the moment the
    connector first appears. Every phone therefore met a line that had finished
    drawing before it was on screen.

    So it measures itself. `start 95% / end 60%` is the band a 96px-tall object
    needs to ink across the lower half of a phone's window rather than in a
    frame or two.
  */
  return (
    <li
      ref={row}
      className={cn(
        /*
          `pointer-events-none` ON THE ROW, RESTORED ON THE CARD, and this is a
          bug the overlap created rather than a nicety. Rows now start 14rem
          before the previous one ends, so row 2's box covers the bottom half
          of row 1's card — and although nothing in it PAINTS there (the link
          is `-z-10`), an empty positioned box still swallows clicks. Hit-tested
          at three scroll positions, row 1's two door links were underneath it.

          The row stops taking pointer events and the card takes them back, so
          the only thing that can be clicked in a row is the card itself, which
          is the only thing in it that was ever meant to be.
        */
        "pointer-events-none relative",
        /*
          THE NEXT CARD STARTS BEFORE THIS ONE ENDS, at the client's ask, and
          -14rem is what puts it where they marked.

          Measured: a card is 568px tall at 1440 and 678 at 1920 — the picture
          scales with the width but the box of words under it does not, so the
          card's proportion is not constant and a percentage pull would be
          right at one width and wrong at the other. A fixed 224px lands the
          next card 61% down this one at 1440 and 67% at 1920, which is the
          band the client drew either side of.
        */
        /*
          AND A GAP BELOW `lg`, WHICH THERE WAS NOT ONE OF. The pull above is
          `lg:`-only, so at every width under it the rows simply stacked and
          the cards met edge to edge — the client's note.

          6REM, NOT 3.5. At 3.5rem the connector had 56px to wander down and
          what showed between two cards was a short kink — the client's second
          note, that the path line cannot be seen. 96px is room for the line to
          turn twice and for the two marks that now sit on it, and it is still
          a gap rather than a break in the page.

          It is also the box the mobile link is drawn in, so the two figures
          have to stay together: see `h-24` below.
        */
        index > 0 && "mt-24 lg:-mt-56",
      )}
    >
      {/*
        THE LINK IS DRAWN OVER THE WHOLE ROW, not in a gap between rows — there
        is no gap any more. It leaves the TOP of this card, wanders out through
        the open half of the measure and comes back down into the top of the
        next one, which is the long doodling line the client asked for. The svg
        is `overflow-visible` so the tail can reach below this row into where
        the next card actually starts.
      */}
      {/*
        NO TAIL ON THE LAST ROW. One was tried — the flow carrying on past the
        final card and ending on a cut-out — and it overflowed the section,
        trailing down into the band below. The links connect cards; with no
        card left to reach, there is nothing for a line to be doing.
      */}
      {!last && next ? (
        <span
          aria-hidden
          /*
            THE WHOLE LINK LAYER SITS BEHIND THE CARDS, and this is the fix for
            a line that was crossing them. Rows overlap by 14rem now, so a
            row's box reaches up over the previous row's card — and being later
            in the DOM it painted on top of it. The link drew straight across
            the photograph above it.

            `-z-10` against the list's own stacking context puts every link
            under every card, whichever row it belongs to, without any row
            needing to know about its neighbours.
          */
          /*
            NOT BELOW lg, because below lg there is no flow to draw. The cards
            take the full measure there and stack, so the arc — which lives
            between 43% and 91% of the width — is entirely behind them; all
            that showed was the fragment clearing the top of the first card,
            which reads as a stray mark rather than as a path.
          */
          className="pointer-events-none absolute inset-0 -z-10 hidden lg:block"
        >
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 1400 600"
          preserveAspectRatio="none"
          fill="none"
        >
          <motion.path
            data-reveal=""
            d={linkPath(index)}
            stroke={item.paint}
            strokeWidth={6}
            strokeLinecap="round"
            /*
              ================================================================
              NO `vector-effect`, AND THAT IS THE BUG THE CLIENT SAW
              ================================================================

              It was `vectorEffect="non-scaling-stroke"`, to hold the line to
              one weight through `preserveAspectRatio="none"`. It also stops
              the line ever reaching the next card.

              `pathLength` draws by normalising the path to 1 and animating a
              `stroke-dasharray` against it — but under non-scaling-stroke
              Chrome measures the dash in SCREEN space while the
              normalisation is in USER space, and `preserveAspectRatio="none"`
              makes those two differ by the cell's stretch. The ink covers
              1/stretch of the path, however finished the animation says it is.

              Measured at 1920x1000 with the draw reported complete
              (stroke-dasharray 1px, stroke-dashoffset 0): the path's own
              rendered box reached y 474 and the next card's top edge was at
              399 — but the last inked pixel was at 304. Ninety-five pixels of
              geometry with no paint on it. Removing the attribute and
              re-measuring the same frame put the last inked pixel at 398, on
              the card's edge.

              THE SCALE IS WHY IT LOOKED FINE ON SOME SCREENS. The svg is
              1400 user units wide, so at a 1400px-wide container the stretch
              is 1.0 and nothing is lost; at 1920 it is 1.33 and a fifth of
              every line goes missing. That is the whole of "the first path is
              not touching" — it was never a scroll position or a coordinate,
              it was the viewport.

              WHAT IT COSTS. The stroke now scales with the cell, so 6 units
              is about 4.3px at 1024 and 8px at 1920, and it is a little
              wider where the curve runs flat than where it runs steep. On a
              line that is meant to read as drawn by hand that is a brush, not
              a defect — and it is the cheaper of the two, by a long way,
              against a connector that does not connect.
            */
            style={reduced ? { pathLength: 1 } : { pathLength: draw }}
          />
        </svg>

        {TRAIL_MARKS_BY_LINK[index] ? (
          <motion.span
            data-reveal=""
            className="absolute block"
            style={{
              left: `${TRAIL_MARKS_BY_LINK[index].x}%`,
              top: `${TRAIL_MARKS_BY_LINK[index].y}%`,
              width: `${TRAIL_MARKS_BY_LINK[index].w}%`,
              scale: reduced ? 1 : nodeIn,
              opacity: reduced ? 1 : nodeIn,
            }}
          >
            <DoodleMark
              name={item.trailMark}
              color={item.paint}
              treatment="stamp"
              depth={0}
            />
          </motion.span>
        ) : null}
        </span>
      ) : null}

      {/*
        ==================================================================
        THE SAME FLOW, ON A PHONE — at the client's ask
        ==================================================================

        The arc above is `lg:`-only for a good reason: it lives between 43%
        and 91% of the measure, and below `lg` the cards take the whole of
        it, so all that ever showed was the fragment clearing the top of a
        card — a stray mark rather than a path. The answer is not to show
        that one; it is to draw a different line where there is now room for
        it.

        So this is the small-screen link: a short doodling run down the
        6rem gap the rows have just been given, from the foot of this card
        to the head of the next, in this card's own paint. It inks on the
        same scroll progress as its desktop sibling, so the flow still
        arrives as you read rather than being there from the start.

        `h-24` IS THE GAP. The row above pays `mt-24`; this fills exactly
        that, so the line touches both cards and nothing has to be nudged
        if the gap is ever changed — change both.

        No `preserveAspectRatio="none"` here: the desktop path is stretched
        across a row and wants it, an 80x96 curve in an 80x96 box does not,
        and stretching it would flatten the wander out of it.
      */}
      {!last && next ? (
        <MobileLink
          paint={item.paint}
          mark={item.trailMark}
          /* The card this link is travelling TO, so the run between them
             carries a mark from each end rather than two of the same. */
          nextPaint={next.paint}
          nextMark={next.trailMark}
          reduced={reduced}
        />
      ) : null}

      <div
        className={cn(
          "pointer-events-auto relative min-w-0 lg:w-[47%]",
          leftSide ? null : "lg:ml-auto",
        )}
      >
        <TrailCard item={item} index={index} />
      </div>
    </li>
  );
}

/**
 * The phone's connector, and the reason it is a component rather than markup.
 *
 * It owns the ref `useScroll` measures. Inside <TrailRow> that hook ran for
 * every row including the last — which renders no connector at all — so the
 * ref it was handed never attached to anything and Motion threw "Target ref is
 * defined but not hydrated" on every page load. A hook cannot be conditional,
 * but a component can: this mounts only where there is a next card to reach,
 * so the ref and the node are born and die together.
 */
function MobileLink({
  paint,
  mark,
  nextPaint,
  nextMark,
  reduced,
}: {
  paint: string;
  mark: DoodleName;
  nextPaint: string;
  nextMark: DoodleName;
  reduced: boolean;
}) {
  const link = useRef<HTMLSpanElement>(null);
  /*
    ITS OWN CLOCK, not the row's. The desktop arc runs the width of the row so
    the row's progress is right for it; this hangs in the gap BELOW the row at
    `top-full`, where the row's progress has already reached 1 by the time the
    connector is on screen — which is why it used to arrive fully drawn and
    read as static. `start 95% / end 60%` is the band a 96px object needs to
    ink across the lower half of a phone's window.
  */
  const { scrollYProgress } = useScroll({
    target: link,
    offset: ["start 95%", "end 60%"],
  });
  const draw = useTransform(scrollYProgress, [0, 1], [0.001, 1]);
  const nodeIn = useTransform(scrollYProgress, [0.3, 0.7], [0, 1]);
  /* The second mark sits further down the run, so it arrives later — the two
     land in the order the stroke reaches them. */
  const nextIn = useTransform(scrollYProgress, [0.6, 0.95], [0, 1]);

  return (
    <span
      ref={link}
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-full -z-10 block h-24 w-20 -translate-x-1/2 lg:hidden"
    >
      {/*
        REDRAWN FOR THE TALLER GAP, not stretched into it. The box was 64x56
        and the curve turned once; scaling that to 96px would just have made a
        long shallow kink. This is 80x96 with two turns, so the line reads as
        something doodled between the cards rather than as a joint.
      */}
      <svg className="h-full w-full overflow-visible" viewBox="0 0 80 96" fill="none">
        <motion.path
          data-reveal=""
          d="M40 0C40 14 18 22 18 36C18 50 62 54 62 68C62 82 40 86 40 96"
          stroke={paint}
          strokeWidth={3}
          strokeLinecap="round"
          /* `pathLength` normalises the path to 1 so the draw is the same
             gesture whatever the curve measures. No `vector-effect:
             non-scaling-stroke`: it silently inks only 1/scale of a pathLength
             draw, which is what stopped the desktop line short on wide
             screens. */
          pathLength={1}
          strokeDasharray={1}
          style={reduced ? { pathLength: 1 } : { pathLength: draw }}
        />
      </svg>

      {/*
        A MARK AT EACH TURN, at the client's ask for doodles between the cards.

        There was one, 16px, at the single turn of the old curve. The run has
        two turns now and carries one on each: this card's on the first and
        the next card's on the second, each in its own card's paint. The line
        is then a handover between two cards rather than a decorated edge of
        the upper one.

        THE PAINT IS WHAT MAKES THEM TWO DIFFERENT DRAWINGS, not the shape
        word — see `resolveIcon` in hero/doodles.ts. The brand sheet holds two
        icons per colour, so the colour picks the pair and the word only picks
        loose or slab; every word used on this trail is a loose one. Measured
        on the phone: the upper mark draws as the lilac bow and the lower as
        the terracotta splash, because the four cards alternate those two
        paints. `mark`/`nextMark` still travel with them so the pair follows
        the card if the palette ever grows past two colours — and so this
        matches the desktop arc above, which passes the same word.

        They arrive on the same clock as the line, a beat apart, so the lower
        one lands as the stroke reaches it rather than before.
      */}
      <motion.span
        className="absolute left-[14%] top-[33%] block w-5 -rotate-12"
        style={{ scale: reduced ? 1 : nodeIn, opacity: reduced ? 1 : nodeIn }}
      >
        <DoodleMark name={mark} color={paint} treatment="stamp" depth={0} />
      </motion.span>

      <motion.span
        className="absolute left-[64%] top-[62%] block w-4 rotate-[14deg]"
        style={{ scale: reduced ? 1 : nextIn, opacity: reduced ? 1 : nextIn }}
      >
        <DoodleMark name={nextMark} color={nextPaint} treatment="stamp" depth={0} />
      </motion.span>
    </span>
  );
}

/*
  One mark per link, placed on the visible arc between cards.
  Coordinates are percentages of the row's bounding box.
*/
const TRAIL_MARKS_BY_LINK: readonly { x: number; y: number; w: number }[] = [
  /*
    5.5% RATHER THAN 3.2, at the client's ask. At 3.2 these are about 45px on
    a 1400px row — small enough that the eye reads the line and never the mark
    sitting on it, which is the opposite of what a punctuation mark is for.
    5.5 is roughly 77px: a shape you see, still narrow enough that the curve
    carries through it rather than being interrupted.

    The x/y stay where they were. They were placed against each curve's own
    apex, and growing a mark about its top-left corner would have walked all
    three off the line — <DoodleMark> fills the box it is given, and the box
    is positioned by its corner.
  */
  { x: 66, y: 28, w: 5.5 },
  { x: 43, y: 55, w: 5.5 },
  { x: 48, y: 93, w: 5.5 },
];

/*
  A CONTINUOUS FLOW THROUGH ALL FOUR CARDS.

  Each segment starts INSIDE the current card (hidden behind it at -z-10),
  crosses the visible gap, and ends INSIDE the next card (hidden again).
  The card hides the junction, so consecutive segments read as one
  unbroken line.

  In the 1400x600 viewBox, left cards span x 0–658, right cards x 742–1400.
  The -14rem overlap puts the next card's top near y 350 of this row.

    0  Create (left) → Celebrate (right):
       Big sweeping arc from the card's top, up and right, then down
       into card 2. Matches the reference's dramatic opening curve.

    1  Celebrate (right) → Connect (left):
       Exits card 2's left side going down-left in a diagonal, arrives
       at card 3. The entry angle continues the line that path 0 brought
       into card 2 from above.

    2  Connect (left) → Collaborate (right):
       Exits card 3's right side curving gently right, arrives at card 4.
       Continues the trajectory that path 1 brought into card 3.
*/
function linkPath(index: number): string {
  switch (index) {
    case 0:
      /*
        IT ENDED 9px INSIDE CARD 2 and that is not a tuck, it is a graze. The
        tail has to finish far enough under the next card that the junction is
        hidden at every width, and how far down the card's top edge falls is
        not fixed: the -14rem pull is 224 CONSTANT pixels against a row whose
        height scales, so in this 600-unit viewBox the next card's top lands
        at 331 on a short row and 402 on a tall one. An end at y 380 is inside
        the card at 1440 by nine pixels and OUTSIDE it on anything taller.

        470 clears the deepest of those by 68 and the shallowest by 139. The
        two control points are moved with it so the visible arc is unchanged —
        its midpoint was (921, 188) and is now (927, 188) — and the start goes
        from 640 to 600 for the same reason as the tail: 640 is 18 units inside
        the left card's edge, which is under the card but with nothing to
        spare.
      */
      return "M 600 300 C 855 108, 1080 138, 1010 470";
    case 1:
      /*
        The straight tail is the cubic's own tangent carried on — (-200, +50)
        at the end, and (140, 470) is (-160, +40) from it, the same 4:1 — so
        the curve is not changed by a pixel, it just keeps going under the
        card. Measured, this one entered card 3 only 35px below its top edge
        at 1920 and would have missed it outright around 2500.
      */
      return "M 900 250 C 700 340, 500 380, 300 430 L 140 470";
    case 2:
      /*
        This one is hidden by card 4's LEFT edge rather than its top — the
        swoop crosses x 742 at about y 600, well inside the card vertically —
        so only the very tip was at risk, poking out above the card's top on a
        very wide screen. The end moves 20 right and 50 down; the visible part
        of the swoop drops seven units, which is under a pixel on the page.
      */
      return "M 350 545 C 480 700, 700 640, 840 480";
    default:
      return "";
  }
}

/**
 * One way in: a photograph, and the words in a box under it.
 *
 * ==========================================================================
 * THE PICTURE IS THE CARD; THE WORDS ARE A THING ON IT
 * ==========================================================================
 *
 * It was a horizontal plate — picture one half, words the other. The client
 * has asked for the picture to lead and the copy to sit under it as a box of
 * its own, and that is the better object: a photograph cropped to half a card
 * is a thumbnail, and at this width it was showing about a third of what was
 * in it.
 *
 * So the photograph takes the full width at 16:9, and the words sit below on
 * White Rock — a lighter cut inset on the card's own tint, with cut-outs
 * breaking two of its corners. The tint stops being the thing you read on and
 * becomes the frame around it, which is what lets Charcoal go from 6.6:1 on
 * the darkest of the four tints to 9.4:1 on White Rock for every one of them.
 *
 * ==========================================================================
 * THE DOORS ARE PAINTED, AT THE CLIENT'S ASK
 * ==========================================================================
 *
 * Each one sits on a <PaintStroke> blot — the treatment the header gives the
 * nav item you are on, and the one the FAQ group labels took. `shape="blot"`
 * for the reason those did: the default brush is drawn at 200x44 for an
 * underline and goes lumpy stretched into a label's proportion.
 *
 * `isolate` on each door is load-bearing. The paint sits at `z-index: -1`,
 * and without a stacking context on the door that -1 escapes to the nearest
 * ancestor that has one and paints behind the box, where it cannot be seen.
 */
function TrailCard({ item, index }: { item: TrailItem; index: number }) {
  return (
    <article
      className="plate overflow-clip rounded-[1.5rem]"
      style={{ backgroundColor: item.tint }}
    >
      {/* 2:1, not 16:9. At 740px across, a 16:9 picture is 416px tall and the
          box of words under it reads as a caption on a photograph rather than
          as the half of the card that does the work. */}
      <span className="relative block aspect-[2/1] w-full">
        <Image
          src={item.photo}
          alt=""
          fill
          sizes="(min-width: 1024px) 56vw, 92vw"
          className="object-cover"
        />
      </span>

      <div className="p-4 md:p-5">
        {/*
          `isolate` here as well as on each door: this box is what the doors'
          paint has to stay inside, and a `relative` with `z-index: auto` does
          not create the context that keeps it there.
        */}
        <div className="relative isolate rounded-[1.25rem] bg-cream px-6 py-6 text-text md:px-7 md:py-7">
          {/*
            TWO CUT-OUTS ON THE BOX'S OWN EDGES, in the card's colour, because
            the deck's rule is that a mark crosses an edge rather than floating
            in clear ground. The top-right is the one corner the name never
            reaches and the bottom-left is below the last door.
          */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-3 -top-4 block w-12 rotate-[10deg] md:w-14"
          >
            <DoodleMark
              name={item.mark}
              color={item.paint}
              treatment="draw"
              delay={index * 110}
            />
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-5 -left-4 block w-10 -rotate-12 md:w-12"
          >
            <DoodleMark
              name={item.trailMark}
              color={item.paint}
              treatment="draw"
              delay={index * 110 + 160}
            />
          </span>

          {/* `font-medium`, not `font-light`. The name is the one word that
              has to carry a whole card, and at the light weight it was the
              faintest thing on a box whose job is to be read. */}
          <h3 className="text-h3 font-medium tracking-[-0.02em]">{item.name}</h3>

          {/* `text-body`, not `text-fine`. 13px is the step for a caption or a
              legal note; this is the sentence that says what the way in IS,
              and it sits under a 28px name with nothing between them. */}
          <p className="mt-3 max-w-[46ch] text-body text-text/85">
            {item.lede}
          </p>

          <ul className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
            {item.doors.map((door) => (
              <li key={door.label}>
                <Link
                  href={door.href}
                  /*
                    THE BLOT IS 36px TALL AND THE TARGET IS NOT. Measured on a
                    375 phone: the painted pill sets a 36px box, under the 44 a
                    finger wants, and these six doors wrap into rows where the
                    neighbour is a DIFFERENT page — "Corporate events" sits
                    beside "School programmes". A near miss there is not a miss,
                    it is the wrong destination.

                    Extended with a pseudo-element rather than padding, which is
                    the device <BackToTop> already uses and for the same reason:
                    more `py` would grow <PaintStroke> with it, and the blot's
                    proportions are the drawing. `-inset-y-1` adds 4px either
                    side for 44 exactly. The row gap is 10px, so two stacked
                    rows still clear each other by 2.
                  */
                  className="group/door relative isolate inline-flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-text after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] focus-visible:outline-none"
                  /*
                    ONE ALPHA FOR BOTH DOORS, AND IT IS MEASURED. They were
                    0.5 and 0.62 for a little variety, and the heavier of the
                    two put "Scheduled sessions" at 4.27:1 — under the 4.5 a
                    13px label owes. <PaintStroke>'s own note is blunt about
                    this being the control rather than a taste setting, and
                    Deep Lilac is the darkest of the four card colours, so it
                    is what the figure has to clear.
                  */
                  style={{ "--swell": 1, "--wet": 0.44 } as React.CSSProperties}
                >
                  <PaintStroke paint={item.paint} shape="blot" />
                  {door.mode ? <ModeMark mode={door.mode} /> : null}
                  <span className="relative text-action font-medium uppercase tracking-eyebrow">
                    {door.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
