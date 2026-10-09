import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { DoodleMark } from "@/components/ui/DoodleMark";
import styles from "@/components/gallery/GalleryWall.module.css";
import { cn } from "@/lib/utils";

export interface WallItem {
  src: string;
  alt: string;
}

/**
 * The gallery wall — a packed mosaic, not a scattered hang.
 *
 * ==========================================================================
 * WHAT THIS REPLACES, AND WHY IT COULD NOT BE NUDGED INTO SHAPE
 * ==========================================================================
 *
 * It was twelve pictures on a twelve-column field, each with its own aspect
 * ratio, a 48px vertical gutter between them and a `lift` margin pushing every
 * other one down — a wall hung by hand, in principle. On screen it read as the
 * client's word for it: weird. Aspect ratios and lifts decide their own
 * heights, so no two pictures in a row ever came to the same baseline, the
 * gutters opened into bands of empty Light Sage, and nothing lined up with
 * anything. The page was more paper than photograph.
 *
 * The client's reference is the opposite and is what a picture spread in their
 * own deck looks like: pictures of several sizes packed tight into one clean
 * rectangle, a tall portrait holding one side, landscapes stacked against it,
 * edges flush all the way round.
 *
 * SO THE GRID OWNS THE GEOMETRY. Twelve columns and rows of one fixed height;
 * every picture spans a whole number of both and fills its cell (`h-full`)
 * rather than carrying an aspect of its own. That is what lets the block close
 * flush on every side at every width — the thing aspect ratios can never do,
 * because two independent columns of fixed-ratio pictures only line up by
 * coincidence and the coincidence breaks at the next breakpoint.
 *
 * THE UNIT IS FIVE PICTURES OVER TWENTY-FOUR CELLS: 4x2 + 4 + 4 + 5 + 3, which
 * is exactly twelve columns by two rows, and it is the reference's own
 * arrangement. It alternates left-handed and right-handed so the tall one
 * changes sides every unit and the wall does not read as a repeating stamp.
 *
 * AND THE TAIL IS CLOSED RATHER THAN LEFT OPEN. Twelve pictures is two units
 * and two over; a leftover that does not tile would leave a hole in the last
 * row, which on a mosaic is the most visible fault there is. `TAIL` gives
 * every possible remainder a set of spans that fills a row exactly, so the
 * block is flush whatever the gallery grows to.
 *
 * THE CROP IS THE EDITING. Every source here is square or portrait, and a wall
 * of squares is a contact sheet however you size it — so the cells are
 * landscape, panorama and portrait, and `object-cover` takes the crop. The
 * same photograph reads differently at 3:2 than at 1:1, and choosing which is
 * the work.
 *
 * NO NAME ON THE PICTURE, at the client's ask. A figure here used to carry a
 * `<figcaption>` that arrived on hover — the activity's own name, under a wash
 * of Ink dark enough to read against — and that is gone: the wall is
 * photographs, and a visitor moving a pointer across it does not want a label
 * on each one.
 *
 * THE WASH WENT WITH IT, and had to. It existed for one reason, to make the
 * caption legible, so with no caption it is a dark scrim sliding over a
 * photograph on hover — which is the exact effect the client asked to have
 * taken off the activity cards ("we dont need that dark effect").
 *
 * What is left is the lift: the picture rises a little and settles back. The
 * name a screen reader needs was never the caption anyway — it is `alt`, on
 * the image, and that is untouched.
 */
export function GalleryWall({ items }: { items: readonly WallItem[] }) {
  const spans = layout(items.length);

  return (
    <ul
      /*
        ==================================================================
        THE ROW HEIGHT IS THE PICTURE HEIGHT — raised, at the client's ask
        ==================================================================

        The grid owns the geometry here (see the note above), so a picture is
        exactly as tall as the row it spans and nothing else decides it. The
        old figures made every landscape cell about 2.1:1 — a letterbox strip
        rather than a photograph, which is what the client is seeing.

        THE CAP WAS THE REAL FAULT, not the vw. <Container> has no ceiling:
        the page runs the full width of the display. So the columns keep
        growing while `13.5rem` held the rows still, and the wider the screen
        the flatter the pictures got — 2.1:1 at 1440 and worse beyond it. The
        cap is now high enough to be out of the way on ordinary displays and
        the vw does the work, so a cell keeps its proportion instead of
        stretching.

        MEASURED AGAINST THE FOUR-COLUMN CELL, which is the wall's commonest
        size. At 1440 the container is 1400, a column is 105.7 and a 4-column
        cell is 459 wide; 19.8vw puts the row at 285, which is 1.61:1 — near
        enough 3:2, the proportion these photographs were taken at. At 1024 it
        is 320 by 203, or 1.58:1. The same picture, the same shape, at both.

        The tall cell spans two rows and a gap, so it grows with them: 459 by
        582 at 1440, a true portrait rather than a slightly tall square.
      */
      className={cn(
        "grid gap-2.5 md:gap-3",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-12",
        "auto-rows-[clamp(14rem,64vw,20rem)]",
        "sm:auto-rows-[clamp(12rem,32vw,20rem)]",
        "lg:auto-rows-[clamp(12rem,19.8vw,24rem)]",
      )}
    >
      {items.map((item, i) => {
        const span = spans[i];
        const mark = i % 4 === 2 ? MARKS[((i / 4) | 0) % MARKS.length] : null;

        return (
          <Reveal
            as="li"
            key={item.src + i}
            variant="fadeIn"
            delay={Math.min(i % 5, 4) * 0.05}
            className={cn("relative", span.col, span.row)}
          >
            <figure className={cn(styles.frame, "h-full")}>
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 34vw, (min-width: 640px) 48vw, 92vw"
                className={styles.image}
              />
            </figure>

            {mark ? (
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-3 deco-mark w-[3.25rem] rotate-[-8deg] lg:-right-4 lg:-top-4 lg:w-[4rem]"
              >
                <DoodleMark name={mark.name} color={mark.color} treatment="stamp" delay={200} />
              </span>
            ) : null}
          </Reveal>
        );
      })}
    </ul>
  );
}

interface Span {
  col: string;
  row: string;
}

/*
  THE TWO HANDS OF THE UNIT. Five pictures, twelve columns by two rows, and
  the only difference is where the tall one sits — auto-placement does the
  rest in source order, so the arrangement is in these spans and nowhere else.

    left-handed        right-handed
    +----+----+----+   +----+----+----+
    |    | B  | C  |   | A  | B  |    |
    | A  +---++----+   +---++----+ C  |
    |    | D    | E |  | D    | E |    |

  Both fill twenty-four cells exactly, so a unit never leaves a hole for the
  next one to start in.
*/
const UNIT_LEFT: readonly Span[] = [
  { col: "lg:col-span-4", row: "lg:row-span-2" },
  { col: "lg:col-span-4", row: "" },
  { col: "lg:col-span-4", row: "" },
  { col: "lg:col-span-5", row: "" },
  { col: "lg:col-span-3", row: "" },
];

const UNIT_RIGHT: readonly Span[] = [
  { col: "lg:col-span-4", row: "" },
  { col: "lg:col-span-4", row: "" },
  { col: "lg:col-span-4", row: "lg:row-span-2" },
  { col: "lg:col-span-5", row: "" },
  { col: "lg:col-span-3", row: "" },
];

/*
  What to do with the pictures a whole number of units does not use. Each of
  these fills one twelve-column row exactly, so the block closes flush however
  many pictures the gallery ends up holding.
*/
const TAIL: Record<number, readonly string[]> = {
  1: ["lg:col-span-12"],
  2: ["lg:col-span-7", "lg:col-span-5"],
  3: ["lg:col-span-4", "lg:col-span-4", "lg:col-span-4"],
  4: ["lg:col-span-3", "lg:col-span-3", "lg:col-span-3", "lg:col-span-3"],
};

/** The span for every picture, units first and then whatever is left over. */
function layout(count: number): Span[] {
  const units = Math.floor(count / 5);
  const out: Span[] = [];
  for (let u = 0; u < units; u++) {
    out.push(...(u % 2 === 0 ? UNIT_LEFT : UNIT_RIGHT));
  }
  for (const col of TAIL[count % 5] ?? []) out.push({ col, row: "" });
  return out;
}

/*
  White Rock is not in this list on purpose: these marks sit on photographs
  and on the page's Light Sage paper, and a pale cut-out on either is an empty
  square. Terracotta is the accent the brand guide describes as a highlight,
  so it appears least.
*/
const MARKS: readonly { name: DoodleName; color: string }[] = [
  { name: "splash", color: INK.lilac },
  { name: "starburst", color: INK.lavender },
  { name: "starleaf", color: INK.terracotta },
  { name: "wave", color: INK.lilac },
];
