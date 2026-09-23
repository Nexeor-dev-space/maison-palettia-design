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
  /**
   * The line shown on hover, and optional on purpose.
   *
   * A caption is content. Where the source data names the thing — the seven
   * activities each carry a `name` — that name is the caption. Where it does
   * not, there is no caption, because the alternative is writing one, and a
   * line invented to fill a hover is exactly the kind of copy the brief rules
   * out. Those pictures simply lift.
   */
  caption?: string;
}

/**
 * The gallery wall — a hung wall, not a contact sheet.
 *
 * ==========================================================================
 * WHY THIS IS NOT A MASONRY OF EQUAL THUMBNAILS
 * ==========================================================================
 *
 * A masonry grid says "here is everything, at the same value". A wall says
 * someone chose the order and the sizes, which is what a room of finished
 * work looks like and what the brief asks for. So the pictures run at five
 * widths and five shapes on a twelve-column field, in a rhythm that tiles to
 * twelve so no row ends in a hole left by arithmetic.
 *
 * THE CROP IS THE EDITING. Every source here is square or portrait, and a
 * wall of squares is a contact sheet however you size it — so the rhythm puts
 * real landscape and panorama shapes in, and `object-cover` takes the crop.
 * That is the "editorial cropping" the brief means: the same photograph reads
 * differently at 16:10 than it does at 1:1, and choosing which is the work.
 *
 * THE HOVER REVEALS RATHER THAN DECORATES. The caption is not printed under
 * the picture — it arrives on it, under a wash of the brand's own colour,
 * wiped up from the foot. Nothing moves until a pointer is on it and nothing
 * moves at all under `prefers-reduced-motion`, where the caption is simply
 * always there. See ./GalleryWall.module.css.
 *
 * DOODLE ANNOTATIONS, AT INTERVALS. Every fourth picture carries a mark on a
 * corner, breaking its edge the way the deck lays a cut-out over a plate.
 * Fixed by position rather than scattered, so the wall has a rhythm of marks
 * instead of a sprinkle of them.
 */
export function GalleryWall({ items }: { items: readonly WallItem[] }) {
  return (
    <ul className="grid grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 md:gap-y-12">
      {items.map((item, i) => {
        const beat = RHYTHM[i % RHYTHM.length];
        const mark = i % 4 === 2 ? MARKS[(i / 4) % MARKS.length | 0] : null;

        return (
          <Reveal
            as="li"
            key={item.src + i}
            variant="fadeIn"
            delay={Math.min(i % RHYTHM.length, 4) * 0.05}
            className={cn("relative", beat.span, beat.lift)}
          >
            <figure className={cn(styles.frame, beat.aspect)}>
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 92vw"
                className={styles.image}
              />

              {/* The wash and the caption travel together, and neither is
                  drawn at all where the data does not name the picture. */}
              {item.caption ? (
                <figcaption className={styles.caption}>
                  <span className={styles.wash} aria-hidden />
                  <span className={styles.line}>{item.caption}</span>
                </figcaption>
              ) : null}
            </figure>

            {mark ? (
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-3 hidden w-[3.25rem] rotate-[-8deg] md:block lg:-right-4 lg:-top-4 lg:w-[4rem]"
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

/*
  The rhythm: six beats that tile to twelve twice over — 7+5, then 4+4+4,
  then 5+7 — so the wall has two wide rows and one even one, and the pattern
  does not read as a repeating unit until you go looking for it.

  Below `lg` it settles to halves, with the two widest beats going full width:
  a panorama at half a phone's screen is a letterbox 40px tall.
*/
const RHYTHM = [
  { span: "col-span-12 lg:col-span-7", aspect: "aspect-[16/10]", lift: "" },
  { span: "col-span-6 lg:col-span-5", aspect: "aspect-[4/5]", lift: "lg:mt-10" },
  { span: "col-span-6 lg:col-span-4", aspect: "aspect-square", lift: "" },
  { span: "col-span-6 lg:col-span-4", aspect: "aspect-[3/4]", lift: "lg:mt-12" },
  { span: "col-span-6 lg:col-span-4", aspect: "aspect-square", lift: "lg:mt-4" },
  { span: "col-span-12 lg:col-span-5", aspect: "aspect-[4/5]", lift: "" },
] as const;

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
