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

      {/* The six dots of the palette, one by one, once the letters are written. */}
      <g className={styles.logoInk}>
        {LOGO_DOTS.map((dot, i) => (
          <path
            key={i}
            d={dot.d}
            className={styles.pDot}
            style={
              {
                "--delay": `${Math.round(lettersDone + DOTS_AFTER_MS + i * dotStepMs)}ms`,
                transformOrigin: `${dot.cx}px ${dot.cy}px`,
              } as Vars
            }
          />
        ))}
      </g>
    </svg>
  );
}
