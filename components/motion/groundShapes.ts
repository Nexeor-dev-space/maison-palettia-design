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

  WHAT THIS IS. Six marks, at six sizes, in four drawings, on six anchors
  that sit in the margins and the corners rather than across the measure. A
  caller names its ground and every section gets the same WEIGHT of
  decoration, laid out the same way — see the table further down.

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

/** Six sizes, one per anchor — every section carries the full range. Held at
    30-40%, at the client's ask for marks a little stronger than they were. */
const GROUND_WIDTHS = ["8%", "4.5%", "10%", "5.5%", "6.5%", "3.5%"] as const;
const GROUND_OPACITY = [0.36, 0.3, 0.38, 0.32, 0.3, 0.4] as const;
const GROUND_DRIFT = [22, -18, 20, -16, 18, -20] as const;
const GROUND_FLOAT = [13, 15, 11, 14, 16, 12] as const;
const GROUND_ROTATE = [-12, 9, -6, 14, -9, 7] as const;
/*
  ==========================================================================
  WHICH DRAWING GOES WHERE — four shapes, and never the same one twice in a
  glance, inside a section or across the line between two
  ==========================================================================

  THE COLOUR IS THE DRAWING. `resolveIcon` answers a loose word with the
  cut-out of its ink, and the set holds exactly one loose cut-out per colour:
  a lilac bow, a terracotta splash, a lavender coral, a sage leaf and a
  White Rock open splash. So a section that passed one ink — the About
  page's purpose band passed Deep Lilac alone — drew the same bow six times,
  and two neighbouring sections that both led with lilac stacked the same
  bow either side of their boundary. The client's note: the same doodle,
  repeated, with neighbours alike.

  THE GROUND DECIDES INSTEAD. A caller names its ground, and gets the four
  cut-outs that can be seen on it — all five but the one drawn in the
  ground's own colour — in a fixed order, A B C D.

  THE ANCHORS TAKE THEM BY SLOT, NOT BY CYCLE:

      top-left A     top-middle C     top-right B
      bottom-left B  bottom-middle D  bottom-right A

  Each band of three is three different drawings. And because every ground
  puts the same A and B in the same corners, the foot of one section and
  the head of the next always meet as B over A on the left and A over B on
  the right — different on both sides, whatever the two grounds are. The
  orders below are arranged so that holds across the four grounds too: A is
  the bow and B the splash everywhere except Deep Lilac, which has no bow
  to show, and takes the coral as its A.
*/
const LILAC = "#9059A4";
const TERRACOTTA = "#D97757";
const LAVENDER = "#C4B5FD";
const SAGE = "#D1E7BE";
const WHITE_ROCK = "#EFE2CA";

/** The ground a section's marks sit on. `surface` is the near-white sage tint. */
export type Ground = "sage" | "cream" | "surface" | "lilac" | "lavender";

/** A B C D for each ground: every cut-out but the ground's own. */
const GROUND_INKS: Record<Ground, readonly [string, string, string, string]> = {
  sage: [LILAC, TERRACOTTA, LAVENDER, WHITE_ROCK],
  cream: [LILAC, TERRACOTTA, LAVENDER, SAGE],
  // Near-white: the White Rock splash vanishes on it, the sage leaf does not.
  surface: [LILAC, TERRACOTTA, LAVENDER, SAGE],
  lilac: [LAVENDER, TERRACOTTA, SAGE, WHITE_ROCK],
  lavender: [LILAC, TERRACOTTA, SAGE, WHITE_ROCK],
};

/** Which of A B C D each anchor takes — see the diagram above. */
const GROUND_SLOT = [0, 1, 1, 0, 2, 3] as const;

/**
 * A section's standard ground.
 *
 * @param ground what the section is painted, which decides the four
 *               cut-outs that can be seen on it.
 * @param count  fewer than six only where a section is genuinely too short
 *               to carry them.
 */
export function groundShapes(
  ground: Ground,
  { count = 6, desktopOnly = true }: { count?: number; desktopOnly?: boolean } = {},
): readonly ShapePlan[] {
  const n = Math.min(count, GROUND_ANCHORS.length);
  const inks = GROUND_INKS[ground];
  return Array.from({ length: n }, (_, i) => ({
    // Any loose word: the ink picks the cut-out. See `resolveIcon`.
    name: "splash" as DoodleName,
    color: inks[GROUND_SLOT[i]],
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
