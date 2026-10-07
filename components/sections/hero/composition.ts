import type { DoodleName } from "@/components/sections/hero/doodles";

/**
 * Where the brand's cut-outs live — in the intro's flower around the logo, and
 * in the collage behind the banner's photograph. (The logo itself, and the
 * dots in its "P", come from the client's vector now — see ./logoArt.ts.)
 *
 * THE RING. The logo is the middle and the cut-outs sit around it, laid out in
 * widths of the logo from its own centre so the ring stays close at every
 * size. NINE of them, placed clockwise rather than scattered: the client's
 * note was that the scattering "doesn't look good or smooth", so every icon
 * has a point on the ring, a size that answers its neighbours, and a place in
 * one clockwise order — the order they burst out in, and the order they
 * scatter in.
 *
 * WHY NINE, AND NOT THE EIGHTEEN IT WAS. "Also let's dial down the brand icons
 * around the logo." Eighteen was tuned for a different entrance — one that ran
 * five seconds and invited a visitor to paint the ring in by hand, where the
 * job of the extra shapes was to give a hand something to keep reaching for.
 * The entrance is now a second and a half and nobody paints anything, so the
 * same eighteen read as a wreath around the mark rather than as a handful of
 * the brand's own shapes.
 *
 * Which nine is decided by `ring` on the plan below, by a rule and not by
 * taste — see the note on that field.
 *
 * WHAT IS KEPT FROM THE MEASUREMENT THAT PUT THE EIGHTEEN THERE. That pass
 * split the band between 0.30 and 1.05 logo widths into 10° sectors and
 * counted the ink in each, to find the holes the eye fell into. Its finding
 * still holds and is the reason `bow-ene` survives the cull: an empty sector
 * next to a full one reads as a fault. The difference now is that a sparse
 * ring is the brief, so only the one 80° quadrant is filled, and the seams
 * between neighbours are left alone.
 *
 * THE COLLAGE. Eight icons have a place behind the photograph, where they show
 * only past its edges, the way the brand deck lays its cut-outs under a
 * picture. The other ten have no business at rest: they are given a place
 * wholly behind the card, so they fly home out of sight rather than crowding
 * the banner — the collage the client has already seen is unchanged. Nine of
 * those ten no longer appear in the entrance either, which is the dialling
 * down; they are kept in the plan because the collage's own geometry is
 * measured against the whole set.
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

/*
  ==========================================================================
  THE RING IS EIGHT DIFFERENT ICONS, AND THAT IS WHY SOME OF THESE READ ODDLY
  ==========================================================================

  A plan's `name` and `color` no longer describe a drawing and a paint: the
  set is the client's ten brand icons in their own colours, so the colour
  picks which pair and the name picks the loose one or the one on a slab.
  See ../hero/doodles.ts.

  Which means two plans that ask for the same colour and the same kind get
  the SAME icon. The entrance is the one place on the site where that shows
  at a glance — nine marks in one ring, three of them lilac — so three plans
  here are set against their old names to spread it: the ring now draws eight
  of the ten, and the two it leaves out are the Light Sage pair, which cannot
  be seen on this page's pale green ground.

  BALANCED, AND COUNTED. Eighteen marks over eight icons plus the two dots is
  exactly two of each, and no icon's pair sits on the same side of the ring.
  The first pass was not: the Soft Lavender slab was on four marks and the
  Deep Lilac one on a single mark, which reads as a set with a favourite.
*/
export const INK = {
  lilac: "#9059A4",
  lavender: "#C4B5FD",
  whiteRock: "#EFE2CA",
  terracotta: "#D97757",
  charcoal: "#2D3748",
} as const;

export interface Placement {
  /**
   * Which box the numbers are shares of — see `.window` in Hero.module.css.
   *
   *   card (the default) ... the resting photograph: left and width of its
   *                          width, top of its height. Its margins and edges.
   *   foot ................. everything under it, where the tagline, the
   *                          lines and the scroll cue sit: left and width of
   *                          the whole banner's width, top of the foot's
   *                          height. The words fill roughly its top 60% on a
   *                          desktop and 45% on a phone; the rest is air.
   */
  zone?: "card" | "foot";
  /** Left and width as a percentage of the zone's width; top of its height. */
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
  /**
   * Whether this shape takes part in the entrance's ring around the logo.
   *
   * DIALLED DOWN TO SIX, at the client's ask: match the storyboard frame
   * they supplied exactly, and use no shape that is not in it.
   *
   * THE SIX ARE ONE PER DRAWING, not one per placement, and that is what the
   * frame shows: a Deep Lilac bow above the mark, the White Rock slab out on
   * the left, the Terracotta slab top right, the Terracotta splash low left,
   * the Soft Lavender coral on the right and the Deep Lilac slab below. Five
   * of the set's colours, each used once, and no shape repeated.
   *
   * WHICH DRAWING A ROW GETS is the colour's business, not the shape word's:
   * `resolveIcon` reads the colour for the pair and the word only for loose
   * or slab. So `bow`+lilac is the lilac LOOSE icon and `wave`+lilac is the
   * lilac SLAB — the words here are historical and the colours are what to
   * read. See FAMILY in sections/hero/doodles.ts.
   *
   * The ring no longer rings: the frame's placement is deliberately uneven,
   * so the gaps are the composition rather than a quadrant that failed to
   * fill. The other twelve shapes keep their resting places in the banner's
   * collage and simply take no part in the entrance.
   */
  ring: boolean;
  /**
   * Only from 1200px. The two marks beside the copy sit in the band the
   * paragraph leaves either side of it, and below 1200 the paragraph runs
   * wide enough to fill that band.
   */
  wide?: boolean;
  /**
   * The shape's place in the entrance's ring: centre and width, in logo widths
   * from the logo's own centre. Only read when `ring` is true.
   *
   * Still called `flower` because that is what the ring was called when it had
   * eighteen petals and these numbers were measured; the numbers themselves are
   * unchanged.
   */
  flower: { x: number; y: number; width: number; rotate: number };
  /**
   * Whether this shape takes part in the ENTRANCE, as opposed to the banner's
   * resting collage.
   *
   * ==========================================================================
   * WHY THE TWO ARE NOW SEPARATE LISTS
   * ==========================================================================
   *
   * Every shape here does two jobs: it is a petal in the bouquet the intro
   * draws around the logo, and it is a piece of the collage that sits in the
   * margins around the photograph once the banner is at rest. Those used to be
   * the same eighteen, because the intro simply flew the whole collage into a
   * ring and back out again.
   *
   * The client asked to "dial down the brand icons around the logo". The
   * collage is not what they are looking at — it is measured against the
   * navigation, the tagline's own ink and the card's edges at four widths, and
   * taking shapes out of it would undo that. The BOUQUET is what crowds the
   * logo, so this marks the six that fly and leaves the other twelve where
   * they belong: at rest, behind the card, until the banner arrives.
   *
   * Six, and their places are chosen to ring the mark rather than fill the
   * screen — NW, N, E, SE, SW, W — across five of the guideline's six colours,
   * with Light Sage left out because it is the ground they stand on.
   */
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

  NOTHING BEHIND THE PHOTOGRAPH, at the client's ask (2026-10-07): the
  three marks placed against the card — top-left, top-right, right edge —
  used to cross its edges and were drawn under it, so the photo cut them
  off. They now sit wholly in the margin beside it (3.9% of the card's
  width, which fits the narrowest margin, 5% of the screen, with room for
  their turn), and the photograph's height floor keeps the two on the
  right apart.

  SPREAD OUT, AT THE CLIENT'S ASK — the doodles were cluttered. Seven
  marks at rest had gathered on the card's two short edges, while the band of
  open air between the words and the scroll cue had none; and on a phone the
  resting card is a strip about 50px tall, so every mark placed by a share of
  its height landed on it and over the tagline. The fix is the `foot` zone:

    desktop .. twelve, within ONE size range (4-6.5% of the card, 12-16%
               on a phone) so no mark outweighs the rest — the client's ask for
               uniformity, after an earlier pass at mixed sizes: three larger anchors (one peeking from behind the
               photograph's top-left, two low in the foot's corners), four
               medium marks on the edges and one in the foot, and five small
               accents between them. Every one sits in open air — the
               margins, the strips beside the copy, the band above the cue —
               so none covers the words, and none sits wholly behind the
               photograph, which on a short window is under 80px tall.
    phone .... seven — the six ring marks and one more — scattered under
               the copy at mixed sizes (a 21% anchor down to an 11% accent),
               clear of the cue and the bottom bar, and nothing at all on the
               photograph strip.

  Where a drawing appears twice, the two sit on opposite sides. Checked at
  375x667, 390x844, 430x932, 768x1024, 1024x768, 1280x720, 1440x900 and
  1920x1080.

  `tucked` in a comment marks a petal with no place at rest: its collage
  position is wholly behind the photograph.
*/
export const DOODLE_PLAN: readonly DoodlePlan[] = [
  {
    id: "starburst-n",
    name: "starburst",
    color: INK.terracotta,
    depth: 16,
    desktop: { left: 100.9, top: 6, width: 3.9, rotate: 12 },
    mobile: { zone: "foot", left: 44, top: 55, width: 12, rotate: 12 },
    ring: true,
    flower: { x: 0.28, y: -0.28, width: 0.19, rotate: 10 },
    float: 7,
  },
  {
    /* tucked — one of the five that fill the ring's measured holes. */
    id: "starleaf-nne",
    name: "starleaf",
    color: INK.lilac,
    depth: 14,
    desktop: { zone: "foot", left: 93.5, top: 40, width: 4.8, rotate: 16 },
    ring: false,
    flower: { x: 0.31, y: -0.54, width: 0.22, rotate: 18 },
    float: 8.2,
  },
  {
    /* tucked */
    id: "bow-ene",
    name: "bow",
    color: INK.lavender,
    depth: 16,
    desktop: { zone: "foot", left: 34, top: 72, width: 4.1, rotate: -10 },
    mobile: { zone: "foot", left: 79, top: 51, width: 14, rotate: -10 },
    ring: true,
    /*
      0.69 OUT, NOT 0.6, at the client's ask for space between this and the
      logo. Measured at 1440: the mark is 480 wide, so a ring unit is about
      493px, this icon's box is 108 across, and at 0.6 its left edge landed on
      1006 against the mark's right edge at 1004 — two pixels, which is why it
      read as stuck to the end of "Palettia" rather than placed beside it.
      0.09 of a unit is 44px of clear green, and because the figure is in logo
      widths the gap holds at every size the ring is drawn at.
    */
    flower: { x: 0.69, y: 0.14, width: 0.18, rotate: 8 },
    float: 7.8,
  },
  {
    /* A SLAB WORD RATHER THAN A LOOSE ONE, at lilac — see the note on the
       ring's spread below. */
    id: "coral-e",
    name: "bean",
    color: INK.lilac,
    depth: 12,
    desktop: { left: 100.9, top: 58, width: 3.9, rotate: 10 },
    ring: false,
    flower: { x: 0.76, y: 0.03, width: 0.26, rotate: 14 },
    float: 8,
  },
  {
    /* Terracotta rather than Charcoal Slate: the set has no charcoal icon —
       it uses charcoal once, as the waves on the lavender slab — so a
       charcoal mark resolves to the lilac pair, and there were already two
       of those in the ring. */
    id: "zigzag-se",
    name: "zigzag",
    color: INK.terracotta,
    depth: 18,
    desktop: { zone: "foot", left: 95, top: 70, width: 4.1, rotate: -12 },
    mobile: { zone: "foot", left: 58, top: 68, width: 13.6, rotate: -12 },
    ring: true,
    flower: { x: -0.47, y: 0.22, width: 0.27, rotate: 0 },
    float: 6.5,
  },
  {
    /* Lilac rather than lavender: the lavender slab was on four of the
       eighteen marks and the lilac one on a single mark — see the note on
       the spread above. */
    id: "wave-s",
    name: "wave",
    color: INK.lilac,
    depth: 14,
    desktop: { zone: "foot", left: 82, top: 70, width: 6.5, rotate: 8 },
    mobile: { zone: "foot", left: 18, top: 70, width: 12.4, rotate: 8 },
    ring: true,
    /* 40 at the client's ask. */
    flower: { x: 0.1, y: 0.39, width: 0.21, rotate: 40 },
    float: 8.5,
  },
  {
    /* tucked */
    id: "wave-wsw",
    name: "wave",
    color: INK.lavender,
    depth: 14,
    desktop: { zone: "foot", left: 70, top: 72, width: 4.2, rotate: 8 },
    mobile: { zone: "foot", left: 4, top: 78, width: 12.8, rotate: 8 },
    ring: false,
    flower: { x: -0.64, y: 0.37, width: 0.2, rotate: 8 },
    float: 8.8,
  },
  {
    /* tucked */
    id: "bean-w",
    name: "bean",
    color: INK.terracotta,
    depth: 18,
    desktop: { zone: "foot", left: 5, top: 70, width: 6.3, rotate: -16 },
    ring: false,
    flower: { x: -0.62, y: 0.2, width: 0.1, rotate: -20 },
    float: 6.8,
  },
  {
    id: "bow-w",
    name: "bow",
    color: INK.lilac,
    depth: 14,
    desktop: { left: -4.9, top: 6, width: 3.9, rotate: -14 },
    mobile: { zone: "foot", left: 3, top: 52, width: 16, rotate: -14 },
    ring: true,
    flower: { x: -0.23, y: -0.45, width: 0.18, rotate: -15 },
    float: 7.5,
  },
  {
    /*
      SMALLER IN THE RING, BECAUSE IT WAS NOT SHOWING ITS OWN SHAPE.

      At 0.44 of the ring's box this was nearly half as wide again as the
      next mark, and at that size the top-left corner of the ring is off the
      section: the coral was cut by the edge and overlapped by the wordmark,
      so what a visitor saw was a lavender mass rather than the client's
      coral. It is the mark they circled, and the fault was the size and the
      placement, not the drawing.

      0.24 is in the range the rest of the ring sits in (0.13 to 0.32), and
      the whole outline clears the edge.
    */
    id: "splash-nw",
    name: "splash",
    color: INK.lavender,
    depth: 10,
    desktop: { zone: "foot", left: 1, top: 36, width: 4.8, rotate: -10 },
    ring: false,
    flower: { x: -0.46, y: -0.34, width: 0.24, rotate: -20 },
    float: 9,
  },
  {
    /* tucked — White Rock at the top left, answering the star-leaf below it. */
    id: "cutout-nnw",
    name: "cutout",
    color: INK.whiteRock,
    depth: 10,
    desktop: { zone: "foot", left: 58, top: 74, width: 5, rotate: -16 },
    mobile: { zone: "foot", left: 76, top: 74, width: 15.2, rotate: -16 },
    ring: true,
    /* 70 at the client's ask. */
    flower: { x: -0.69, y: -0.25, width: 0.2, rotate: 70 },
    float: 6.2,
  },
  {
    /* tucked */
    /* A loose terracotta mark, for the same reason as `wave-s`. */
    id: "starburst-nw",
    name: "zigzag",
    color: INK.terracotta,
    depth: 16,
    desktop: { zone: "foot", left: 20, top: 76, width: 4, rotate: 16 },
    ring: false,
    flower: { x: -0.18, y: -0.46, width: 0.13, rotate: 16 },
    float: 7.2,
  },
  /*
    THE TWO BESIDE THE COPY, at the client's ask: the band either side of the
    supporting lines read as empty. A lilac tile on the left, where the
    nearest marks are a lavender coral and a terracotta tile; a cream
    splash on the right, where everything near it is lilac — not a third
    lavender coral. Wide screens only.
  */
  {
    id: "beside-copy-w",
    name: "bean",
    color: INK.lilac,
    depth: 12,
    desktop: { zone: "foot", left: 11.5, top: 40, width: 4.8, rotate: -9 },
    ring: false,
    wide: true,
    flower: { x: -0.5, y: 0.1, width: 0.12, rotate: -9 },
    float: 8.6,
  },
  {
    id: "beside-copy-e",
    name: "zigzag",
    color: INK.whiteRock,
    depth: 12,
    desktop: { zone: "foot", left: 81.5, top: 40, width: 4.8, rotate: 12 },
    ring: false,
    wide: true,
    flower: { x: 0.5, y: 0.1, width: 0.12, rotate: 12 },
    float: 9.4,
  },
];

/** Every shape, clockwise from twelve — the collage's own order. */
export const DRAW_ORDER: readonly string[] = DOODLE_PLAN.map((plan) => plan.id);

/**
 * The entrance's ring, clockwise from twelve.
 *
 * It bursts out of the logo in this order and scatters in the same one, so the
 * two movements read as one gesture reversed rather than as two shuffles.
 */
export const RING_ORDER: readonly string[] = DOODLE_PLAN.filter((plan) => plan.ring).map(
  (plan) => plan.id,
);
