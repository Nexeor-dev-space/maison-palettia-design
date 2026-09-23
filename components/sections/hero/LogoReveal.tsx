import { useId } from "react";

import styles from "@/components/sections/hero/Hero.module.css";
import { LOGO_BOX, LOGO_DOTS, LOGO_GLYPHS, PEN_MOVES } from "@/components/sections/hero/logoArt";

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

interface LogoRevealProps {
  /** The whole writing, first stroke to last dot, in milliseconds. */
  writeMs: number;
  /** The gap between one palette dot and the next. */
  dotStepMs: number;
}

/*
  THE PEN'S PACE. A hand does not write every letter in the same time: it
  spends longer on the M than on an i. So the writing is paced by length —
  every stroke gets the share of `writeMs` that its length is of the whole —
  with a short hold at each pen lift and a dab's worth of time for each dot.
  These are the fixed costs, in milliseconds.
*/
const LIFT_MS = 28;
const DAB_MS = 30;
/** No stroke is quicker than this, however short — a mark takes a moment. */
const MIN_STROKE_MS = 12;
/** The pen's first touch. */
const LEAD_MS = 60;
/** The dots start this long after the last letter, then arrive one by one. */
const DOTS_AFTER_MS = 60;

/**
 * Where the dots come from: the middle of the palette, inside the bowl of the P.
 *
 * The six dots are the palette's paint wells, so their own centroid IS the
 * middle of the palette — computed rather than written down, so it follows the
 * artwork if logoArt.ts is ever re-exported from a new file. Measured against
 * the glyph it sits in: the "P" spans x 68.3–128.0 and y 43.3–96.5 in the
 * logo's units, and this lands at 114.70, 62.31 — well inside it.
 */
const DOT_ORIGIN = {
  x: LOGO_DOTS.reduce((sum, d) => sum + d.cx, 0) / LOGO_DOTS.length,
  y: LOGO_DOTS.reduce((sum, d) => sum + d.cy, 0) / LOGO_DOTS.length,
};

/**
 * The order the wells fill in: down the palette, the top one first.
 *
 * `LOGO_DOTS` is in the artwork's own order, which is the order the paths
 * happen to sit in the supplied file — 110.04, 119.11, 114.47, 116.28, 110.39,
 * 117.93 across and 70.78, 60.26, 69.39, 55.08, 52.66, 65.68 down. Stepping
 * the delay by the array index therefore lit them in no order anyone watching
 * could name: bottom, top-right, bottom, upper, top, middle.
 *
 * This is a RANK, NOT A RE-SORT OF THE ARTWORK. The paths stay in the file's
 * order in the markup — reordering them would change SVG paint order, which is
 * the artwork's business and not the choreography's — and only the delay is
 * taken from the rank. `DOT_ORDER[i]` is the position of dot `i` when the six
 * are sorted top to bottom, so with these wells it reads 5, 2, 4, 1, 0, 3:
 * the dot the file lists first is the lowest and so arrives last.
 *
 * Sorted on `cy` with `cx` breaking a tie, so two wells at the same height
 * still resolve left to right rather than by whichever the sort happened to
 * keep. `y` is down in the logo's units, so ascending `cy` IS top first.
 */
const DOT_ORDER: readonly number[] = LOGO_DOTS.map((dot, i) => ({ i, cx: dot.cx, cy: dot.cy }))
  .sort((a, b) => a.cy - b.cy || a.cx - b.cx)
  .reduce<number[]>((rank, entry, position) => {
    rank[entry.i] = position;
    return rank;
  }, []);

/**
 * The mark, written.
 *
 * WHAT IS ON SCREEN IS THE FILE. The lettering is the outline from the
 * client's Illustrator artwork, painted exactly as the file paints it (see
 * ./logoArt.ts), and it is never redrawn, retyped or approximated. What
 * animates is a mask over it: for each letter, the path a pen would take —
 * traced from the letter's own skeleton — stroked in white and revealed along
 * its length, so the letter is uncovered in the order a hand lays it down,
 * with a round pen tip leading. The letters arrive in writing order, M to a,
 * and the six dots of the palette in the "P" come last, one at a time.
 *
 * NOT A FADE, NOT A TYPEWRITER. Nothing here crossfades, and no letter pops
 * in whole: every letter is uncovered stroke by stroke, and a stroke that a
 * hand retraces — the point of the M, the stem of a t — is uncovered on the
 * way out, as it would be.
 *
 * THE COVER UNDER IT ALL. The pen paths are traced, and a trace can miss a
 * sliver at a corner. So once a letter's last stroke is done, the letter's
 * own outline is added to the mask in white — at that moment the mask is the
 * artwork itself, and the rendered mark is the file, whole, with nothing
 * depending on how well a skeleton was followed.
 *
 * With reduced motion, or in any state but `play` and `draw`, the mask is
 * fully white and the mark simply is.
 */
/** Each move's start and duration, in writing order, for a writing of `writeMs`. */
function schedule(writeMs: number, dotStepMs: number) {
  const strokes = PEN_MOVES.filter((m) => !m.dab);
  const totalLength = strokes.reduce((sum, m) => sum + m.length, 0);
  const lifts = PEN_MOVES.filter((m, i) => i > 0 && m.glyph !== PEN_MOVES[i - 1].glyph).length;
  const dabs = PEN_MOVES.length - strokes.length;
  const dotsMs = DOTS_AFTER_MS + LOGO_DOTS.length * dotStepMs;
  const inkMs = Math.max(200, writeMs - LEAD_MS - lifts * LIFT_MS - dabs * DAB_MS - dotsMs);
  const perUnit = inkMs / totalLength;

  const timed: { start: number; duration: number }[] = [];
  const glyphEnd = new Map<number, number>();
  let clock = LEAD_MS;
  for (let i = 0; i < PEN_MOVES.length; i++) {
    const move = PEN_MOVES[i];
    if (i > 0 && move.glyph !== PEN_MOVES[i - 1].glyph) clock += LIFT_MS;
    const duration = move.dab ? DAB_MS : Math.max(MIN_STROKE_MS, move.length * perUnit);
    timed.push({ start: clock, duration });
    clock += duration;
    glyphEnd.set(move.glyph, clock);
  }
  return { timed, glyphEnd, lettersDone: clock };
}

export function LogoReveal({ writeMs, dotStepMs }: LogoRevealProps) {
  const maskId = useId();
  const { timed, glyphEnd, lettersDone } = schedule(writeMs, dotStepMs);

  return (
    <svg
      className={styles.logoArt}
      viewBox={`0 0 ${LOGO_BOX.width} ${LOGO_BOX.height}`}
      width={LOGO_BOX.width}
      height={LOGO_BOX.height}
      aria-hidden
      focusable="false"
    >
      <defs>
        {/*
          EVERY PEN IS CLIPPED TO ITS OWN LETTER, and it has to be.

          The mask uncovers the artwork wherever a pen path passes, and a pen is
          as wide as the letter it is writing — the M's is 7.6 units. In a script
          face the letters interleave: the M's box runs to x 88.4 and the P's
          bowl starts at x 68.3, so the two overlap across a 20-unit strip. The
          M's last stroke ends inside that strip, and its round tip was
          uncovering a hook of the P — the client saw a piece of the "P" arrive
          while "Maison" was still being written.

          Clipping each letter's pens to that letter's own outline makes it
          impossible: a pen can only ever reveal the glyph it belongs to,
          whatever it passes over on the way.
        */}
        {LOGO_GLYPHS.map((glyph, i) => (
          <clipPath key={`clip-${i}`} id={`${maskId}-g${i}`} clipPathUnits="userSpaceOnUse">
            <path d={glyph.d} fillRule={glyph.evenodd ? "evenodd" : "nonzero"} />
          </clipPath>
        ))}

        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={LOGO_BOX.width}
          height={LOGO_BOX.height}
        >
          {LOGO_GLYPHS.map((glyph, gi) => (
            <g key={`pens-${gi}`} clipPath={`url(#${maskId}-g${gi})`}>
              {PEN_MOVES.map((move, i) =>
                move.glyph !== gi ? null : (
                  <path
                    key={i}
                    d={move.d}
                    className={styles.pen}
                    strokeWidth={move.width}
                    style={
                      {
                        // A hair over the true length, so a dash of this size
                        // hides the whole path and nothing peeks at the far end.
                        "--len": (move.length + 1).toFixed(2),
                        "--delay": `${Math.round(timed[i].start)}ms`,
                        "--dur": `${Math.round(timed[i].duration)}ms`,
                      } as Vars
                    }
                  />
                ),
              )}
            </g>
          ))}
          {LOGO_GLYPHS.map((glyph, i) => (
            <path
              key={glyph.name + i}
              d={glyph.d}
              fillRule={glyph.evenodd ? "evenodd" : "nonzero"}
              className={styles.penCover}
              style={{ "--delay": `${Math.round(glyphEnd.get(i) ?? lettersDone)}ms` } as Vars}
            />
          ))}
        </mask>
      </defs>

      {/* The artwork: fill and 0.5-unit stroke in the one colour, as the file has it. */}
      <g mask={`url(#${maskId})`} className={styles.logoInk}>
        {LOGO_GLYPHS.map((glyph, i) => (
          <path key={glyph.name + i} d={glyph.d} fillRule={glyph.evenodd ? "evenodd" : "nonzero"} />
        ))}
      </g>

      {/*
        The six dots of the palette, one by one, once the letters are written —
        each thrown out from the middle of the palette rather than appearing
        where it lands, and arriving top well first down to the bottom one.
        See DOT_ORIGIN for where they come from and DOT_ORDER for the order.
      */}
      <g className={styles.logoInk}>
        {LOGO_DOTS.map((dot, i) => (
          <path
            key={i}
            d={dot.d}
            className={styles.pDot}
            style={
              {
                /* The rank, not the index — see DOT_ORDER. The set of delays
                   is unchanged, so `schedule()`'s total still holds; only
                   which dot takes which one has moved. */
                "--delay": `${Math.round(lettersDone + DOTS_AFTER_MS + DOT_ORDER[i] * dotStepMs)}ms`,
                /*
                  HOW FAR THIS DOT HAS TO TRAVEL, and in which direction: the
                  offset from where it belongs back to the middle of the
                  palette. The keyframes start it there and bring it home, so
                  all six leave one point inside the P and fan out to their
                  wells. Lengths are the logo's own user units, which is what
                  a `translate()` on an SVG element takes.
                */
                "--dx": `${(DOT_ORIGIN.x - dot.cx).toFixed(2)}px`,
                "--dy": `${(DOT_ORIGIN.y - dot.cy).toFixed(2)}px`,
                /*
                  CENTRE, NOT THE DOT'S OWN COORDINATES, AND THAT IS A FIX.
                  This read `${dot.cx}px ${dot.cy}px`, which looks right and is
                  not: `transform-box: fill-box` in Hero.module.css makes the
                  origin relative to THIS PATH'S OWN bounding box, and that box
                  is about 2.7 units across. An origin of 110, 70 inside it is
                  a point far down and to the right of the dot, so `scale(0)`
                  collapsed each dot toward open space off the mark — which is
                  why they never looked like they came out of the P.
                */
                transformOrigin: "center",
              } as Vars
            }
          />
        ))}
      </g>
    </svg>
  );
}
