import type { DoodleName } from "@/components/sections/hero/doodles";
import type { ShapePlan } from "@/components/motion/SectionShapes";

/*
  NOT A CLIENT MODULE, and that is the whole reason this file exists apart
  from <SectionShapes>. The component is `"use client"` because it runs a
  scroll timeline; a function exported from a client module cannot be CALLED
  from a server component, only rendered or passed as a prop — React answers
  "Attempted to call groundShapes() from the server". Every page that builds
  a ground is a server component, so the table lives here and the component
  stays there. The `ShapePlan` type crosses the line freely: types are erased.
*/
/*
  ==========================================================================
  THE STANDARD GROUND — one plan, so every section is decorated the same way
  ==========================================================================

  WHAT WAS WRONG WITH IT. Every section wrote its own `ShapePlan[]` by hand,
  and measured across the twelve that could be parsed they used TEN different
  opacities (0.14 through 0.24, plus two at 0.55), SIXTEEN different widths
  from 3.5% to 22%, and between two and four marks each. Nothing was shared
  but the type. The client's note was that the doodles are not placed
  uniformly and that there are not enough of them, and both halves of that
  are this table's fault: a section with two marks at 0.14 next to one with
  four at 0.22 reads as decoration that was forgotten in places.

  WHAT THIS IS. Six marks, at three sizes, in two inks, on six anchors that
  sit in the margins and the corners rather than across the measure. A
  caller passes its colours and a seed; the seed rotates which shape and
  which colour lands on which anchor, so no two sections in a row are the
  same picture while every section has the same WEIGHT of decoration.

  LOOSE CUTS ONLY. The set's slab icons carry a filled tile behind the
  drawing, and a filled tile at 18% over a pale ground is not a faint mark,
  it is a dirty rectangle. The slabs are strong enough to be used at full
  strength over a photograph, which is where they are.
*/

/** The six anchors, in the order a plan fills them. All in the margins. */
const GROUND_ANCHORS: readonly Partial<Record<"top" | "bottom" | "left" | "right", string>>[] = [
  { left: "3%", top: "14%" },
  { right: "4.5%", top: "9%" },
  { left: "9%", bottom: "10%" },
  { right: "7%", bottom: "15%" },
  { left: "31%", top: "5%" },
  { right: "28%", bottom: "6%" },
];

/** Three sizes and two inks, and nothing between them. */
const GROUND_WIDTHS = ["6.5%", "4%", "9%", "4%", "6.5%", "4%"] as const;
const GROUND_OPACITY = [0.2, 0.16, 0.18, 0.22, 0.16, 0.18] as const;
const GROUND_DRIFT = [22, -18, 20, -16, 18, -20] as const;
const GROUND_FLOAT = [13, 15, 11, 14, 16, 12] as const;
const GROUND_ROTATE = [-12, 9, -6, 14, -9, 7] as const;
const GROUND_MARKS: readonly DoodleName[] = ["splash", "coral", "bow", "starleaf", "zigzag", "dot"];

/**
 * A section's standard ground.
 *
 * @param colors the section's own inks, in the order it wants them used.
 * @param seed   rotates the shapes and the colours, so neighbouring sections
 *               get the same weight of decoration and a different picture.
 * @param count  fewer than six only where a section is genuinely too short
 *               to carry them.
 */
export function groundShapes(
  colors: readonly string[],
  { seed = 0, count = 6, desktopOnly = true }: { seed?: number; count?: number; desktopOnly?: boolean } = {},
): readonly ShapePlan[] {
  const n = Math.min(count, GROUND_ANCHORS.length);
  return Array.from({ length: n }, (_, i) => ({
    name: GROUND_MARKS[(i + seed) % GROUND_MARKS.length],
    color: colors[(i + seed) % Math.max(colors.length, 1)] ?? colors[0],
    width: GROUND_WIDTHS[i],
    ...GROUND_ANCHORS[i],
    rotate: GROUND_ROTATE[i],
    drift: GROUND_DRIFT[i],
    opacity: GROUND_OPACITY[i],
    float: GROUND_FLOAT[i],
    floatDelay: (i * 7) % 5 * 0.6,
    desktopOnly,
  }));
}
