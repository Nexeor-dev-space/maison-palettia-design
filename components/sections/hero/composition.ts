import type { DoodleName } from "@/components/sections/hero/doodles";

/**
 * Where the brand's cut-outs live — in the intro's flower around the logo, and
 * in the collage behind the banner's photograph. (The logo itself, and the
 * dots in its "P", come from the client's vector now — see ./logoArt.ts.)
 *
 * THE FLOWER. The logo is the middle and the cut-outs are its petals, laid out
 * in widths of the logo from its own centre so the ring stays close at every
 * size. Eighteen of them, placed clockwise rather than scattered: the client's
 * note was that the scattering "doesn't look good or smooth", so every petal
 * has a point on the ring, a size that answers its neighbours, and a place in
 * one clockwise order — the order they are drawn in, and the order they leave
 * in.
 *
 * WHY EIGHTEEN, AND HOW THE FIVE WERE PLACED. Thirteen closed the ring but did
 * not fill it: the client asked for a few more icons around the logo, and the
 * question was where.
 *
 * The first answer was the widest angular gaps between petal centres, and it
 * was the wrong one — an angle says nothing about how much of a sector a shape
 * actually covers. Placed that way, three of the five landed on top of
 * neighbours that were simply large: the new star-leaf merged into the coral
 * branch, and the ring gained mass where it already had some.
 *
 * So the holes were measured instead. A frame of the finished bouquet, split
 * into 10° sectors of the band between 0.30 and 1.05 logo widths, counting the
 * pixels in each that are not the Light Sage ground:
 *
 *     20°–40°  under 3%     — one 16px dot between two big shapes
 *     60°      1.4%         — the small bean, alone
 *     130°–140% under 2%    — the small dot at the foot of the zigzag
 *     240°     2.6%         — the small bean on the left
 *
 * Those four sectors, plus the thin seam at 330°–340°, are where these five
 * sit, and each is sized to fill rather than to decorate. The same measurement
 * after: the sectors holding almost nothing fell from twelve of thirty-six to
 * five, and the median sector went from 6.4% ink to 14.5%. The five that
 * remain thin are the seams between neighbouring shapes rather than the holes
 * the eye was falling into, and closing those too would make a wreath of it.
 *
 * THE COLLAGE. Nine petals have a place behind the photograph, where they show
 * only past its edges, the way the brand deck lays its cut-outs under a
 * picture. The other nine have no business at rest: they are given a place
 * wholly behind the card, so they fly home out of sight rather than crowding
 * the banner — the collage the client has already seen is unchanged, and the
 * five new shapes exist for the intro alone.
 *
 * The script leaves two corners of its box empty — above the end of "Maison"
 * and below its start — and the petals there tuck into them.
 *
 * UNITS. Collage positions are percentages of the photograph's resting card —
 * `left` and `width` of its width, `top` of its height. Flower positions are
 * in logo widths from the logo's centre.
 *
 * COLOUR. The deck's shapes on the six approved colours, for a Light Sage
 * ground: the lilac family carries the collage, White Rock balances it, Warm
 * Terracotta appears twice and small, and Charcoal Slate is kept for the one
 * line-like shape, the zigzag.
 */

export const INK = {
  lilac: "#9059A4",
  lavender: "#C4B5FD",
  whiteRock: "#EFE2CA",
  terracotta: "#D97757",
  charcoal: "#2D3748",
} as const;

export interface Placement {
  /** Left and width as a percentage of the card's width; top of its height. */
  left: number;
  top: number;
  width: number;
  /** Resting rotation, in degrees. */
  rotate: number;
}

export interface DoodlePlan {
  /** Unique: a shape may take more than one place in the flower. */
  id: string;
  name: DoodleName;
  color: string;
  /** How far the shape follows the pointer, in pixels at the banner's edge. */
  depth: number;
  desktop: Placement;
  /** Omitted where a phone's narrow margins are better without the shape. */
  mobile?: Placement;
  /** In the intro's flower: centre and width, in logo widths from its centre. */
  flower: { x: number; y: number; width: number; rotate: number };
  /** Ambient float period, in seconds. Distinct per shape so none move in step. */
  float: number;
}

/*
  Clockwise from twelve. The ones along the collage's top edge rise only a
  little into the gap above the card — they are sized by its width, so a tall
  card lifts them further, and measured at every width they stop at least 16px
  short of the navigation. The two along its foot sit in the corners, outside
  the tagline's width.

  THE NINE THAT SHOW AT REST ARE PLACED BY THE ROOM THERE IS, which is the
  answer to the client's note about their placement and sizing. The margins
  around the card are not the same size, and putting the same shapes in all of
  them is what made the collage look like things sliding off the screen:

    the sides ..... 5% of the card, 72px at 1440. Anything wider than that
                    cannot be seen whole — the shape either runs under the
                    photograph or off the screen, which is what the biggest
                    ones were doing. So the two side shapes are 4.4% and 4.2%
                    (57px and 54px), placed against the card's edge and sitting
                    entirely in the gutter.
    the top ....... barely 44px of usable strip between the bar and the card,
                    so only a dot and the tip of one starburst go there.
    the foot ...... the deepest margin, but the tagline runs across the middle
                    of it — measured at 1440, its ink spans x 260 to 1180 and
                    the supporting line x 502 to 938. So the shapes there sit
                    in the two clear strips outside that: the splash at the
                    left corner (x 53–169), the wave at the right (x 1264–
                    1374), the bean tucked below the splash (x 195–234). The
                    bean was between them at first and landed straight on the
                    "A" of the tagline, which is what measuring the words'
                    real ink rather than their full-width box caught.

  THE CLEAR STRIPS NARROW AS THE SCREEN DOES, which is the trap in the foot:
  the tagline is sized in vw, so at 1440 its ink runs x 260 to 1180 and leaves
  260px either side, while at 768 it runs x 84 to 684 of a 768-wide screen and
  leaves 84px. A splash and a wave placed to clear the words at 1440 clipped
  them at 768. Both are now sized and placed against that tightest case — and
  the bean, which had no strip wide enough at every width, has gone behind the
  photograph instead.

  Nothing is cropped by the screen and nothing touches the words, measured at
  768, 1024, 1280 and 1440.

  `tucked` in a comment marks a petal with no place at rest: its collage
  position is wholly behind the photograph.
*/
export const DOODLE_PLAN: readonly DoodlePlan[] = [
  {
    id: "starburst-n",
    name: "starburst",
    color: INK.terracotta,
    depth: 16,
    desktop: { left: 91, top: -7, width: 6, rotate: 12 },
    mobile: { left: 83, top: 0, width: 23, rotate: 12 },
    flower: { x: 0.03, y: -0.42, width: 0.28, rotate: -8 },
    float: 7,
  },
  {
    /* tucked — one of the five that fill the ring's measured holes. */
    id: "starleaf-nne",
    name: "starleaf",
    color: INK.lilac,
    depth: 14,
    desktop: { left: 52, top: 34, width: 10, rotate: 18 },
    mobile: { left: 52, top: 34, width: 16, rotate: 18 },
    flower: { x: 0.31, y: -0.54, width: 0.22, rotate: 18 },
    float: 8.2,
  },
  {
    id: "dot-ne",
    name: "dot",
    color: INK.terracotta,
    depth: 24,
    desktop: { left: 46, top: -4.5, width: 1.6, rotate: 0 },
    mobile: { left: 56, top: -2, width: 4.5, rotate: 0 },
    flower: { x: 0.26, y: -0.4, width: 0.05, rotate: 0 },
    float: 5,
  },
  {
    /* tucked — it had no clear strip in the foot at every width; see below. */
    id: "bean-ne",
    name: "bean",
    color: INK.lavender,
    depth: 20,
    desktop: { left: 30, top: 40, width: 3, rotate: 18 },
    mobile: { left: 10, top: 90, width: 8, rotate: 18 },
    flower: { x: 0.4, y: -0.26, width: 0.12, rotate: 35 },
    float: 6,
  },
  {
    /* tucked */
    id: "bow-ene",
    name: "bow",
    color: INK.lavender,
    depth: 16,
    desktop: { left: 40, top: 55, width: 7, rotate: -10 },
    mobile: { left: 40, top: 55, width: 12, rotate: -10 },
    flower: { x: 0.62, y: -0.36, width: 0.18, rotate: -10 },
    float: 7.8,
  },
  {
    /* tucked — the deck's one rectangular cut-out, kept for the flower. */
    id: "cutout-e",
    name: "cutout",
    color: INK.whiteRock,
    depth: 10,
    desktop: { left: 34, top: 30, width: 14, rotate: -18 },
    mobile: { left: 34, top: 30, width: 20, rotate: -18 },
    flower: { x: 0.63, y: -0.16, width: 0.16, rotate: -18 },
    float: 9.5,
  },
  {
    id: "coral-e",
    name: "coral",
    color: INK.lilac,
    depth: 12,
    desktop: { left: 100.2, top: 18, width: 4.2, rotate: 10 },
    mobile: { left: 89, top: 38, width: 18, rotate: 10 },
    flower: { x: 0.76, y: 0.03, width: 0.26, rotate: 14 },
    float: 8,
  },
  {
    id: "zigzag-se",
    name: "zigzag",
    color: INK.charcoal,
    depth: 18,
    desktop: { left: 100.4, top: 52, width: 3.2, rotate: -12 },
    mobile: { left: -5, top: 55, width: 9, rotate: -12 },
    flower: { x: 0.52, y: 0.34, width: 0.13, rotate: 24 },
    float: 6.5,
  },
  {
    /* tucked */
    id: "starburst-sse",
    name: "starburst",
    color: INK.lilac,
    depth: 12,
    desktop: { left: 28, top: 42, width: 8, rotate: 14 },
    mobile: { left: 28, top: 42, width: 13, rotate: 14 },
    flower: { x: 0.455, y: 0.505, width: 0.2, rotate: 14 },
    float: 9.2,
  },
  {
    /* tucked */
    id: "dot-s",
    name: "dot",
    color: INK.lilac,
    depth: 22,
    desktop: { left: 62, top: 46, width: 2, rotate: 0 },
    mobile: { left: 62, top: 46, width: 4, rotate: 0 },
    flower: { x: 0.3, y: 0.42, width: 0.04, rotate: 0 },
    float: 5.5,
  },
  {
    id: "wave-s",
    name: "wave",
    color: INK.lavender,
    depth: 14,
    desktop: { left: 93.5, top: 104, width: 8.5, rotate: 3 },
    mobile: { left: 80, top: 72, width: 30, rotate: 3 },
    flower: { x: 0.02, y: 0.4, width: 0.3, rotate: -4 },
    float: 8.5,
  },
  {
    id: "starleaf-sw",
    name: "starleaf",
    color: INK.whiteRock,
    depth: 8,
    desktop: { left: -4.8, top: 62, width: 4.4, rotate: -8 },
    /*
    On a phone its place is wholly behind the photograph: the margins there are
    too narrow to show it, but it still has to exist to be a petal of the intro's
    flower, and it flies home out of sight.
    */
    mobile: { left: 56, top: 52, width: 22, rotate: -8 },
    flower: { x: -0.36, y: 0.36, width: 0.32, rotate: 16 },
    float: 10,
  },
  {
    /* tucked */
    id: "wave-wsw",
    name: "wave",
    color: INK.lavender,
    depth: 14,
    desktop: { left: 56, top: 62, width: 11, rotate: 8 },
    mobile: { left: 56, top: 62, width: 18, rotate: 8 },
    flower: { x: -0.64, y: 0.37, width: 0.2, rotate: 8 },
    float: 8.8,
  },
  {
    /* tucked */
    id: "bean-w",
    name: "bean",
    color: INK.terracotta,
    depth: 18,
    desktop: { left: 24, top: 62, width: 3.4, rotate: -20 },
    mobile: { left: 24, top: 62, width: 7, rotate: -20 },
    flower: { x: -0.62, y: 0.2, width: 0.1, rotate: -20 },
    float: 6.8,
  },
  {
    id: "bow-w",
    name: "bow",
    color: INK.lilac,
    depth: 14,
    desktop: { left: -4.8, top: 28, width: 4.4, rotate: -14 },
    /*
    Behind the photograph on a phone, for the same reason as the starleaf.
    */
    mobile: { left: 30, top: 38, width: 16, rotate: -14 },
    flower: { x: -0.7, y: -0.02, width: 0.2, rotate: -12 },
    float: 7.5,
  },
  {
    id: "splash-nw",
    name: "splash",
    color: INK.lavender,
    depth: 10,
    desktop: { left: -1.5, top: 103, width: 7.5, rotate: -10 },
    mobile: { left: -10, top: 0.5, width: 34, rotate: -10 },
    flower: { x: -0.5, y: -0.4, width: 0.44, rotate: -20 },
    float: 9,
  },
  {
    /* tucked — White Rock at the top left, answering the star-leaf below it. */
    id: "cutout-nnw",
    name: "cutout",
    color: INK.whiteRock,
    depth: 10,
    desktop: { left: 64, top: 28, width: 9, rotate: -22 },
    mobile: { left: 64, top: 28, width: 15, rotate: -22 },
    flower: { x: -0.27, y: -0.58, width: 0.18, rotate: -22 },
    float: 6.2,
  },
  {
    /* tucked */
    id: "starburst-nw",
    name: "starburst",
    color: INK.lavender,
    depth: 16,
    desktop: { left: 46, top: 24, width: 8, rotate: 16 },
    mobile: { left: 46, top: 24, width: 14, rotate: 16 },
    flower: { x: -0.18, y: -0.46, width: 0.13, rotate: 16 },
    float: 7.2,
  },
];

/** The ring's order: drawn clockwise from twelve, and it leaves the same way. */
export const DRAW_ORDER: readonly string[] = DOODLE_PLAN.map((plan) => plan.id);
