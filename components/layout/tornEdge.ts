/**
 * A torn-paper bottom edge, as a `clip-path` polygon.
 *
 * ==========================================================================
 * WHY IT IS GENERATED AND NOT DRAWN
 * ==========================================================================
 *
 * The client's reference is a set of colour blocks with deckled edges — the
 * look of paper torn by hand rather than cut. Two ways to get it:
 *
 *   AN SVG FILTER (feTurbulence + feDisplacementMap) is the usual answer and
 *   is wrong here. A filter displaces the element's whole rendering, so the
 *   type and the thumbnails inside the panel would wobble along with its
 *   edge. It is also the most expensive thing you can put under a 1440px
 *   surface that animates open.
 *
 *   A POLYGON clips only the shape. The contents are untouched, it composites,
 *   and the cost is paid once.
 *
 * ==========================================================================
 * ONLY THE BOTTOM IS TORN, AND THAT IS NOT A SHORTCUT
 * ==========================================================================
 *
 * These panels are full-bleed: they run `inset-x-0`, so their left and right
 * edges are off the side of the screen, and their top sits flush under the
 * header bar. The bottom is the only edge anybody can see. Tearing the other
 * three would cost points in the polygon for shapes nobody ever looks at.
 *
 * ==========================================================================
 * THE SAME TEAR EVERY TIME
 * ==========================================================================
 *
 * The offsets come from a small deterministic generator with a fixed seed,
 * not from `Math.random()`. Three reasons, and the first is the one that
 * actually breaks things: this renders on the server and again on the client,
 * and two different tears would be a hydration mismatch. The second is that a
 * tear that changes on every paint reads as the page twitching. The third is
 * that the menus should agree — a visitor who opens both sees one sheet of
 * paper, torn the same way.
 */

/** How many points along the bottom. Enough to read as fibrous, not as saw teeth. */
const TEETH = 72;

/** How deep the tear bites, in pixels. Paper, not bunting. */
const DEPTH = 18;

/**
 * A tear is not noise.
 *
 * Pure per-point randomness gives a fuzzy band, which reads as a bad antialias
 * rather than as paper. Real torn paper has a slow wander with small fibres on
 * top of it, so this sums two frequencies: a long wave carrying most of the
 * depth, and a fine one roughening it.
 */
function depthAt(i: number, rnd: () => number, depth: number): number {
  const wander = Math.sin((i / TEETH) * Math.PI * 9.1 + 0.7) * 0.5 + 0.5;
  // More fibre, less wave than the first pass: at 0.62 smooth it came out as
  // a gentle ripple, which is a torn-LOOKING edge rather than a torn one.
  return (wander * 0.45 + rnd() * 0.55) * depth;
}

function makeTorn(depth: number, startSeed: number): string {
  // A linear congruential generator — tiny, and identical on every engine.
  // `Math.random()` is not, and this value ships in the HTML.
  let seed = startSeed;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const points: string[] = ["0% 0%", "100% 0%"];
  // Right to left, so the polygon winds correctly back to the origin.
  for (let i = TEETH; i >= 0; i--) {
    const x = ((i / TEETH) * 100).toFixed(3);
    const y = depthAt(i, rnd, depth).toFixed(2);
    points.push(`${x}% calc(100% - ${y}px)`);
  }
  return `polygon(${points.join(", ")})`;
}

/**
 * The panel's torn bottom edge — the front sheet.
 *
 * Computed once at module load and shared, so the two menus tear identically
 * and neither pays for it on open.
 */
export const TORN_BOTTOM = makeTorn(DEPTH, 20260923);

/**
 * A second, shallower tear for the sheet BEHIND the front one.
 *
 * ==========================================================================
 * WHY THERE ARE TWO SHEETS AT ALL
 * ==========================================================================
 *
 * A torn edge is only an edge if you can see where it stops. The panel's
 * ground is Light Sage and most of this site is printed on Light Sage, so on
 * those pages the tear was cutting sage away to reveal — sage. Verified on
 * the rendered panel: the clip-path was applied, 73 points of it, and the
 * foot still looked ruler-straight because there was nothing behind it.
 *
 * So there is a second sheet under the first, in another brand colour, torn
 * a different amount with a different seed. Where the front sheet is torn
 * away the back one shows through, and the foot of the panel reads as two
 * layers of torn paper rather than as one straight line. It is also how the
 * client's reference is built: blocks of colour layered, each with its own
 * ragged edge.
 *
 * MUCH SHALLOWER, and that gap is the whole effect. Depth here means how much
 * is bitten AWAY, so the shallower sheet reaches lower: at 5px against the
 * front sheet's 18, up to 13px of ragged lavender shows below the sage. The
 * first attempt ran 7 against 13 and left a 6px sliver that read as a wavy
 * line rather than as a second sheet of paper.
 */
export const TORN_UNDER = makeTorn(5, 98765431);

/**
 * How much room the tear needs at the foot of a panel, in pixels.
 *
 * Anything laid out inside the panel has to clear this or the tear will bite
 * into it. Exported rather than written twice, so the padding and the polygon
 * can never drift apart.
 */
export const TORN_DEPTH = DEPTH;
