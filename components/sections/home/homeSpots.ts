import type { ShapePlan } from "@/components/motion/SectionShapes";
import { INK } from "@/components/sections/hero/composition";

/*
  ==========================================================================
  THE HOMEPAGE'S DOODLES, AS ONE SYSTEM — modelled on the closing band
  ==========================================================================

  Every section below the banner draws its marks from this file and nowhere
  else. The client picked "Let's Craft a Community Together" as the
  benchmark: its marks FRAME the content — down the outer edges, in the top
  and bottom padding — and leave the content and the gaps between its
  columns clear. Every section now follows the same rules.

  THE RULES
    frame ..... marks sit only where the content is not: the top padding,
                the outer edges beside a column that stops short, and the
                bottom padding. Never in the gap between two columns, never
                over type, images or buttons. A two-column header whose
                columns reach both edges gets its frame above and below it.
    size ...... two tiers, as on the benchmark: S 68px and M 96px (capped as
                a share, so a narrow screen scales them together).
    strength .. 72% on the pale grounds, 80% on Deep Lilac — the same
                visible weight, since lighter inks on a dark field need more.
    angle ..... 9-14 degrees, alternating direction.
    rhythm .... ~110-160px between neighbouring marks, rows staggered so a
                frame never reads as a grid.
    seams ..... where one section's bottom row meets the next one's top row,
                the two are interleaved — different x, different drawings —
                so the boundary never stacks two rows into a cluster.
    repeat .... no two neighbours the same drawing, inside a section or
                across a seam; no ink drawn on its own colour of ground.
    contrast .. Light Sage is too faint on cream to read as a mark — the
                client saw those spots as empty — so cream sections use
                lilac, terracotta and lavender only.

  TWO LAYOUTS
    lg ....... from 1024 up, where the section headers are two columns
               (`xl`/`below-xl` split at 1280 for the opening, whose
               paragraph still runs across the open half at 1024). Tops are
               px from the section's edge, measured against the content;
               lefts are shares of its width.
    compact .. below that everything stacks to one column, so each section
               gets two small marks in opposite corners of its padding —
               top-right and bottom-left — the frame in its smallest form.

  WHICH DRAWING IS WHICH — the colour picks the drawing, the word picks
  loose cut-out or slab tile:
    bow + lilac ........ lilac cut-out      bean + lilac ...... lilac tile
    splash + terracotta  terracotta splash  cutout + terracotta terracotta tile
    coral + lavender ... lavender coral     wave + lavender ... lavender tile
    zigzag + White Rock  cream splash       slabCoral + White Rock .. cream tile
    starleaf + sage .... sage leaf          starburst + sage .. sage tile
*/

const SAGE = "#D1E7BE";
const S = "min(5%, 68px)";
const M = "min(7.1%, 96px)";
const PALE = 0.72;
const DARK = 0.8;
/** Phone and tablet: two corners per section. */
const CS = "clamp(42px, 7.5vw, 68px)";

type Spot = Omit<ShapePlan, "drift" | "opacity"> & { drift?: number; opacity?: number };
const spot = (s: Spot, i: number): ShapePlan => ({
  drift: 12,
  float: 13,
  floatDelay: (i * 1.3) % 4,
  opacity: PALE,
  ...s,
});
const plan = (spots: Spot[]) => spots.map(spot);

/* ---- 02 · A Little Space for Big Creativity (sage) ------------------------ */
/*
  The words run down the left; the right half beside them is open, and the
  card below runs the full width. So: a row across the top padding, a
  column down the open right edge, a row in the padding under the card.
*/
export const OPENING_SPOTS: readonly ShapePlan[] = plan([
  // top row
  { show: "xl", name: "splash", color: INK.terracotta, width: S, left: "3.5%", top: "18px", rotate: -12 },
  { show: "xl", name: "wave", color: INK.lavender, width: S, left: "33%", top: "30px", rotate: 10 },
  { show: "xl", name: "bow", color: INK.lilac, width: S, left: "60%", top: "16px", rotate: -9 },
  // the open right edge
  { show: "xl", name: "cutout", color: INK.terracotta, width: M, left: "80%", top: "64px", rotate: 11 },
  { show: "xl", name: "coral", color: INK.lavender, width: S, left: "91%", top: "204px", rotate: -14 },
  { show: "xl", name: "slabCoral", color: INK.whiteRock, width: M, left: "72%", top: "282px", rotate: 9 },
  { show: "xl", name: "bow", color: INK.lilac, width: S, left: "88%", top: "404px", rotate: 13 },
  // under the card — interleaved with the next section's top row
  { show: "xl", name: "zigzag", color: INK.whiteRock, width: S, left: "22%", bottom: "18px", rotate: -10 },
  { show: "xl", name: "coral", color: INK.lavender, width: S, left: "68%", bottom: "24px", rotate: 12 },
  // compact
  { show: "below-xl", name: "bow", color: INK.lilac, width: CS, right: "5%", top: "8px", rotate: 14 },
  { show: "below-xl", name: "coral", color: INK.lavender, width: CS, left: "5%", bottom: "10px", rotate: -12 },
]);

/* ---- 03 · Pick a Colour, Pick a Table (sage) ------------------------------ */
/*
  The header's two columns reach both edges and the card track runs the
  full width beneath it, so the frame here is the top padding and the strip
  under the cards. The gap between heading and paragraph stays clear.
*/
export const EXPERIENCE_SPOTS: readonly ShapePlan[] = plan([
  { show: "lg", name: "bow", color: INK.lilac, width: S, left: "44%", top: "6px", rotate: -10 },
  { show: "lg", name: "cutout", color: INK.terracotta, width: S, left: "88%", top: "4px", rotate: 12 },
  { show: "lg", name: "wave", color: INK.lavender, width: S, left: "12%", bottom: "10px", rotate: 9 },
  { show: "lg", name: "splash", color: INK.terracotta, width: S, left: "58%", bottom: "8px", rotate: -12 },
  // compact
  { show: "compact", name: "wave", color: INK.lavender, width: CS, right: "6%", top: "6px", rotate: 9 },
  { show: "compact", name: "splash", color: INK.terracotta, width: CS, left: "6%", bottom: "8px", rotate: -12 },
]);

/* ---- 04 · There Is More Than One Way In (cream) --------------------------- */
/*
  A header, then four cards alternating left and right. The frame follows
  the alternation: the top padding, then the open edge OPPOSITE each card —
  right beside the first, left beside the second, and so on — then the
  padding under the last. The trail's own marks stay on the cards.
*/
export const WAYS_SPOTS: readonly ShapePlan[] = plan([
  // top row
  { show: "lg", name: "bean", color: INK.lilac, width: M, left: "30%", top: "22px", rotate: 10 },
  { show: "lg", name: "cutout", color: INK.terracotta, width: S, left: "70%", top: "40px", rotate: -14 },
  { show: "lg", name: "coral", color: INK.lavender, width: S, left: "92%", top: "70px", rotate: 11 },
  // Down the card trail, in the open side opposite each card. Tops are
  // SHARES of the section here, not px: the cards scale with the width, so
  // their gaps sit at the same share at 1024 and at 1920 (measured), where
  // a px top drifted onto a card or left a hole.
  { show: "lg", name: "splash", color: INK.terracotta, width: M, left: "76%", top: "19%", rotate: -9 },
  { show: "lg", name: "bow", color: INK.lilac, width: S, left: "92%", top: "27%", rotate: 12 },
  { show: "lg", name: "wave", color: INK.lavender, width: S, left: "20%", top: "46.8%", rotate: -10 },
  { show: "lg", name: "cutout", color: INK.terracotta, width: S, left: "80%", top: "62.6%", rotate: 9 },
  { show: "lg", name: "bow", color: INK.lilac, width: M, left: "7%", top: "79%", rotate: -12 },
  { show: "lg", name: "coral", color: INK.lavender, width: S, left: "26%", top: "86%", rotate: 14 },
  // under the last card
  { show: "lg", name: "wave", color: INK.lavender, width: M, left: "48%", bottom: "34px", rotate: -9 },
  { show: "lg", name: "bow", color: INK.lilac, width: S, left: "88%", bottom: "40px", rotate: 11 },
  // compact
  { show: "compact", name: "bean", color: INK.lilac, width: CS, right: "6%", top: "10px", rotate: 8 },
  { show: "compact", name: "cutout", color: INK.terracotta, width: CS, left: "6%", bottom: "8px", rotate: 10 },
]);

/* ---- 05 · Create Anytime, or Create Together (cream band) ----------------- */
/*
  Heading and lede on the left; the right of the band is open, so a short
  row over the eyebrow and a column down the right edge.
*/
export const TWO_WAYS_SPOTS: readonly ShapePlan[] = plan([
  { show: "lg", name: "cutout", color: INK.terracotta, width: S, left: "30%", top: "20px", rotate: 12 },
  { show: "lg", name: "bean", color: INK.lilac, width: M, left: "68%", top: "40px", rotate: -9 },
  { show: "lg", name: "coral", color: INK.lavender, width: S, left: "88%", top: "128px", rotate: 14 },
  { show: "lg", name: "splash", color: INK.terracotta, width: S, left: "76%", top: "252px", rotate: -11 },
  { show: "lg", name: "bow", color: INK.lilac, width: S, left: "92%", top: "340px", rotate: 10 },
  // compact
  { show: "compact", name: "coral", color: INK.lavender, width: CS, right: "6%", top: "8px", rotate: -12 },
]);

/* ---- 06 · Where We Set Up (cream) ----------------------------------------- */
/*
  The words on the left, the map on the right reaching the top. The frame:
  a row over the left column, two in the gap beside the map, a row in the
  padding under both. NOTHING ON THE MAP: the two marks that sat on its
  frame were moved into the gap and the row below, at the client's ask.
*/
export const WHERE_SPOTS: readonly ShapePlan[] = plan([
  // over the left column
  { show: "lg", name: "bow", color: INK.lilac, width: S, left: "6%", top: "38px", rotate: -12 },
  { show: "lg", name: "splash", color: INK.terracotta, width: S, left: "28%", top: "62px", rotate: 10 },
  { show: "lg", name: "wave", color: INK.lavender, width: S, left: "49%", top: "24px", rotate: -9 },
  // The gap between the words and the map — which runs 40% to 59-60% at
  // every lg width (measured). These stop at 53-54%, clear of the map.
  { show: "lg", name: "bean", color: INK.lilac, width: M, left: "46%", top: "190px", rotate: 11 },
  { show: "lg", name: "cutout", color: INK.terracotta, width: S, left: "48.5%", top: "400px", rotate: -10 },
  // under both columns
  { show: "lg", name: "coral", color: INK.lavender, width: S, left: "5%", bottom: "58px", rotate: 12 },
  { show: "lg", name: "bow", color: INK.lilac, width: M, left: "30%", bottom: "28px", rotate: -10 },
  { show: "lg", name: "splash", color: INK.terracotta, width: S, left: "66%", bottom: "14px", rotate: 9 },
  { show: "lg", name: "wave", color: INK.lavender, width: S, left: "90%", bottom: "22px", rotate: -13 },
  // compact
  { show: "compact", name: "wave", color: INK.lavender, width: CS, right: "6%", top: "8px", rotate: -12 },
  { show: "compact", name: "splash", color: INK.terracotta, width: CS, left: "6%", bottom: "10px", rotate: 10 },
]);

/* ---- 07 · Let's Craft a Community Together (Deep Lilac) — the benchmark --- */
/*
  Twelve, balanced rather than mirrored: four down each side of the words,
  at staggered heights and different drawings left and right, and two each
  in the top and bottom padding — the bottom pair held above the footer's
  wave, which rises over the band's last ~50px. Inks the field can carry —
  White Rock, Light Sage, Terracotta, and Soft Lavender only as its tile,
  whose dark drawing is what reads. Phones keep the row under the buttons
  the section already draws.
*/
export const CLOSING_SPOTS: readonly ShapePlan[] = plan([
  // left
  { show: "lg", name: "slabCoral", color: INK.whiteRock, width: M, left: "4.5%", top: "48px", rotate: -10, opacity: DARK },
  { show: "lg", name: "starleaf", color: SAGE, width: S, left: "9.5%", top: "192px", rotate: 12, opacity: DARK },
  { show: "lg", name: "splash", color: INK.terracotta, width: S, left: "3.5%", top: "318px", rotate: -14, opacity: DARK },
  { show: "lg", name: "wave", color: INK.lavender, width: M, left: "11%", top: "430px", rotate: 9, opacity: DARK },
  // right
  { show: "lg", name: "zigzag", color: INK.whiteRock, width: S, left: "86%", top: "70px", rotate: 11, opacity: DARK },
  { show: "lg", name: "cutout", color: INK.terracotta, width: M, left: "90%", top: "196px", rotate: -9, opacity: DARK },
  { show: "lg", name: "starburst", color: SAGE, width: S, left: "84.5%", top: "352px", rotate: 14, opacity: DARK },
  { show: "lg", name: "slabCoral", color: INK.whiteRock, width: S, left: "92%", top: "468px", rotate: -12, opacity: DARK },
  // top and bottom padding
  { show: "lg", name: "splash", color: INK.terracotta, width: S, left: "30%", top: "18px", rotate: 10, opacity: DARK },
  { show: "lg", name: "starleaf", color: SAGE, width: S, left: "66%", top: "26px", rotate: -11, opacity: DARK },
  { show: "lg", name: "zigzag", color: INK.whiteRock, width: S, left: "27%", bottom: "64px", rotate: -8, opacity: DARK },
  { show: "lg", name: "wave", color: INK.lavender, width: S, left: "69%", bottom: "70px", rotate: 13, opacity: DARK },
]);
