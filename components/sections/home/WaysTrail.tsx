"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

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
 * and 7rem on a desktop with the bow compressing to match, and
 * `vector-effect: non-scaling-stroke` keeps the line one weight through it.
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
  const reduced = useReducedMotion();

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
    offset: ["start 80%", "end 45%"],
  });
  const draw = useTransform(scrollYProgress, [0, 1], [0.001, 1]);
  const nodeIn = useTransform(scrollYProgress, [0.55, 0.85], [0, 1]);

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
        index > 0 && "lg:-mt-56",
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
            vectorEffect="non-scaling-stroke"
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

/*
  One mark per link, placed on the visible arc between cards.
  Coordinates are percentages of the row's bounding box.
*/
const TRAIL_MARKS_BY_LINK: readonly { x: number; y: number; w: number }[] = [
  { x: 66, y: 28, w: 3.2 },
  { x: 43, y: 55, w: 3.2 },
  { x: 48, y: 93, w: 3.2 },
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
      return "M 640 280 C 850 120, 1060 160, 1000 380";
    case 1:
      return "M 900 250 C 700 340, 500 380, 300 430";
    case 2:
      return "M 350 545 C 480 700, 700 640, 820 430";
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
          <p className="mt-3 max-w-[46ch] text-body leading-[1.75] text-text/85">
            {item.lede}
          </p>

          <ul className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
            {item.doors.map((door) => (
              <li key={door.label}>
                <Link
                  href={door.href}
                  className="group/door relative isolate inline-flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-text focus-visible:outline-none"
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
                  <span className="relative text-action font-semibold uppercase tracking-eyebrow">
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
