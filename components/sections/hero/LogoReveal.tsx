import styles from "@/components/sections/hero/Hero.module.css";
import { LOGO_BOX, LOGO_DOTS, LOGO_GLYPHS } from "@/components/sections/hero/logoArt";

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

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
 * The mark, and the six paint wells that fill its "P".
 *
 * ==========================================================================
 * TWO BEATS, AND THE ORDER OF THEM IS THE CLIENT'S
 * ==========================================================================
 *
 * The lettering fades up first (frame 1 of the storyboard: "the background is
 * clean, and the Maison Palettia logo fades in at the centre"), and then the
 * dots arrive one at a time — each thrown out from the middle of the palette
 * rather than appearing where it lands. Only once they are all in does the
 * ring of icons burst out from behind the mark.
 *
 * The dots were part of the original opening and were lost when the writing
 * was replaced by a fade; the client has asked for them back, and for the
 * doodles to follow them rather than run alongside. So the mark is two groups
 * now — `logoInk` for the glyphs, which the container fades, and the wells,
 * which animate themselves on their own delays.
 *
 * WHAT IS NOT BACK. The pen. The letters are not written stroke by stroke any
 * more; that was two and a half seconds on its own and the entrance is under
 * two. Only the dots return.
 *
 * WHAT IS ON SCREEN IS STILL THE FILE. The lettering and the wells are the
 * outlines from the client's Illustrator artwork, painted exactly as the file
 * paints them (see ./logoArt.ts) — never redrawn, retyped or approximated.
 *
 * `PEN_MOVES` in ./logoArt.ts still has no consumer. It is left in place: it
 * is a derivation of the client's own artwork that took real work to trace,
 * and putting the writing back is an import and a mask rather than a re-trace.
 */
export function LogoReveal({ dotStepMs }: { dotStepMs: number }) {
  return (
    <svg
      className={styles.logoArt}
      viewBox={`0 0 ${LOGO_BOX.width} ${LOGO_BOX.height}`}
      width={LOGO_BOX.width}
      height={LOGO_BOX.height}
      aria-hidden
      focusable="false"
    >
      {/* The lettering: fill and 0.5-unit stroke in the one colour, as the
          file has it. `.introLogo` fades this up; nothing here animates. */}
      <g className={styles.logoInk}>
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
