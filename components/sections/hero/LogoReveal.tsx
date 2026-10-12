import { useId } from "react";

import styles from "@/components/sections/hero/Hero.module.css";
import { LOGO_BOX, LOGO_DOTS, LOGO_GLYPHS, PEN_MOVES } from "@/components/sections/hero/logoArt";

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

/*
  THE PEN'S PACE. A hand does not write every letter in the same time: it
  spends longer on the M than on an i. So the writing is paced by length —
  every stroke gets the share of the ink time that its length is of the
  whole — with a short hold at each pen lift and a dab's worth for each dot
  on an i. These are the fixed costs, in milliseconds; they are tighter than
  the original opening's (28 / 30 / 60), because the whole name now has to
  be written in under a second rather than in two and a half.
*/
const LIFT_MS = 14;
const DAB_MS = 24;
const MIN_STROKE_MS = 10;
const LEAD_MS = 40;

/**
 * When every pen stroke starts and how long it takes, for the letters to be
 * written in `writeMs` from the first frame — and when each letter is done,
 * which is when its whole outline joins the mask (see `.penCover`).
 */
function schedule(writeMs: number) {
  const strokes = PEN_MOVES.filter((m) => !m.dab);
  const totalLength = strokes.reduce((sum, m) => sum + m.length, 0);
  const lifts = PEN_MOVES.filter((m, i) => i > 0 && m.glyph !== PEN_MOVES[i - 1].glyph).length;
  const dabs = PEN_MOVES.length - strokes.length;
  const inkMs = Math.max(200, writeMs - LEAD_MS - lifts * LIFT_MS - dabs * DAB_MS);
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
 * The mark, written letter by letter, then the six paint wells that fill its "P".
 *
 * ==========================================================================
 * THE PEN IS BACK, AT THE CLIENT'S ASK
 * ==========================================================================
 *
 * The opening used to write the mark stroke by stroke, and that was replaced
 * by a fade because it took two and a half seconds on its own. The client has
 * asked for the writing back. It returns as it was — the same pen paths, the
 * same masking, the same artwork — only quicker: the whole name in `writeMs`
 * (under a second), so the entrance grows by about two thirds of a second
 * rather than by the two and a half it used to cost.
 *
 * WHAT IS ON SCREEN IS STILL THE FILE. The lettering is the outline from the
 * client's Illustrator artwork, painted exactly as the file paints it (see
 * ./logoArt.ts) — never redrawn, retyped or set in a font. The writing is a
 * MASK over it: for every letter, the path a pen would take (`PEN_MOVES`) is
 * stroked in white inside the mask and drawn along its length, so the real
 * outline is uncovered in writing order, M-a-i-s-o-n then P-a-l-e-t-t-i-a.
 * When a letter's last stroke finishes, its whole outline joins the mask
 * (`.penCover`), so no hairline the pen's centre line missed is left out.
 *
 * EVERY PEN IS CLIPPED TO ITS OWN LETTER. In a script face the letters
 * interleave — the M's box runs into the P's bowl — and a pen as wide as the
 * M's stroke would uncover a hook of the P while "Maison" was still being
 * written. Clipping each letter's pens to that letter's outline makes it
 * impossible: a pen can only ever reveal the glyph it belongs to.
 *
 * IT RUNS ON THE `play` STATE, FROM THE FIRST FRAME. The script in <head>
 * (./intro.ts) sets `play` before the first paint, so the writing starts with
 * the page rather than waiting for React; <HeroIntro> starts its own clock
 * only after that paint, and the dots follow the writing on that clock. The
 * writing therefore always finishes before the dots begin, however long the
 * page takes to hydrate. Nothing here re-renders during it: the schedule is
 * pure, and the animation is CSS on stable markup.
 *
 * Then the dots, as before: thrown out one at a time from the middle of the
 * palette, top well first — see DOT_ORIGIN and DOT_ORDER.
 */
export function LogoReveal({ writeMs, dotStepMs }: { writeMs: number; dotStepMs: number }) {
  const maskId = useId();
  const { timed, glyphEnd, lettersDone } = schedule(writeMs);

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
        {/* One clip per letter — see "every pen is clipped to its own letter" above. */}
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

      {/* The lettering: fill and 0.5-unit stroke in the one colour, as the
          file has it — uncovered by the mask above, never altered. */}
      <g mask={`url(#${maskId})`} className={styles.logoInk}>
        {LOGO_GLYPHS.map((glyph, i) => (
          <path key={glyph.name + i} d={glyph.d} fillRule={glyph.evenodd ? "evenodd" : "nonzero"} />
        ))}
      </g>

      {/*
        The six wells of the palette, one by one, once the mark is up — each
        thrown out from the middle of the palette rather than appearing where
        it lands, and arriving top well first down to the bottom one. See
        DOT_ORIGIN for where they come from and DOT_ORDER for the order.
      */}
      <g className={styles.logoInk}>
        {LOGO_DOTS.map((dot, i) => (
          <path
            key={i}
            d={dot.d}
            className={styles.pDot}
            style={
              {
                /* The rank, not the index — see DOT_ORDER. */
                "--delay": `${DOT_ORDER[i] * dotStepMs}ms`,
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
