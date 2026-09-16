import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { GALLERY_TILES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { GalleryTile } from "@/types";

/**
 * Where each tile sits, and what shape it is cut to.
 *
 * ONE ENTRY PER TILE RATHER THAN ONE RULE FOR ALL OF THEM, because the point
 * of this composition is that no two cells are the same. The index into this
 * list is the index into {@link GALLERY_TILES}, so re-ordering the data
 * re-shapes the section — see the note there.
 *
 * READ THE THREE BREAKPOINTS AS THREE LAYOUTS, not as one layout shrinking:
 *
 *   base   two columns, tiles sized by their own aspect. The copy runs full
 *          width at the head, because a phone has no room for a heading set
 *          beside a photograph and squeezing one in is how a mosaic turns
 *          into a list of thumbnails.
 *
 *   md     the copy moves into the grid as a tile, and the rows become a
 *          fixed height so cells can span them. `aspect-auto` cancels the
 *          base aspects here — a cell cannot be told its height twice.
 *
 *   lg     the asymmetric arrangement proper: a tall 7-column plate holding
 *          the left of two rows, the copy and one tile stacked to its right,
 *          then a short band of 4 and 8 underneath.
 *
 *          ┌───────────────────┬───────────┐
 *          │                   │   COPY    │
 *          │    01  (7 x 2)    ├───────────┤
 *          │                   │  02 (5)   │
 *          ├──────────┬────────┴───────────┤
 *          │  03 (4)  │      04 (8)        │
 *          └──────────┴────────────────────┘
 */
const COPY_CELL = "col-span-2 md:col-span-5 md:col-start-8 md:row-start-1 lg:col-span-5 lg:col-start-8";

const TILE_CELLS = [
  "col-span-2 aspect-[4/3] md:col-span-7 md:col-start-1 md:row-span-2 md:row-start-1 md:aspect-auto lg:col-span-7",
  "col-span-1 aspect-[4/5] md:col-span-5 md:col-start-8 md:row-start-2 md:aspect-auto lg:col-span-5 lg:col-start-8",
  "col-span-1 aspect-[4/5] md:col-span-5 md:col-start-1 md:row-start-3 md:aspect-auto lg:col-span-4",
  "col-span-2 aspect-[16/10] md:col-span-7 md:col-start-6 md:row-start-3 md:aspect-auto lg:col-span-8 lg:col-start-5",
] as const;

/**
 * Homepage — the gallery, as a flush mosaic.
 *
 * WHAT CHANGED AND WHY. This was four plates in a 12-column grid with gutters
 * between them, bottom-aligned and ragged along the top. Four rectangles in a
 * row with air around each one reads as a contact sheet — "here is our
 * photography" — which is the opposite of what the section is for, and the
 * ragged tops never resolved into a composition.
 *
 * It is now the arrangement the client pointed at: cells butted flush against
 * one another with no gutter at all, cut to different shapes and different
 * sizes, running the full width of the window, with the section's own words
 * taking one of the cells instead of sitting above the grid as a masthead.
 * The words are part of the wall rather than a label on it.
 *
 * NO GUTTERS IS THE WHOLE EFFECT. `gap-0` is load-bearing: the moment there is
 * space between the cells they read as cards, and the thing that makes a
 * mosaic is edges meeting. It bleeds to the window edges for the same reason —
 * a mosaic held inside the page's measure has a margin around it, which is a
 * frame, which is a card again.
 *
 * THE HEADING IS INSIDE THE MOSAIC. There is still exactly one `<h2>` and it
 * still labels the section; it simply lives in a cell. Nothing is duplicated
 * for the small layout — the same block moves from the head of the grid into
 * the grid, which is a change of placement rather than of content.
 *
 * IMAGES OR FOOTAGE, INTERCHANGEABLY. Tiles are a union — see {@link
 * GalleryTile} — so a clip drops into any cell without touching this file.
 * Everything ships as a still today because the project holds no footage.
 *
 * Server component: the video arm needs no state, and the reveals are the
 * client components.
 */
export function Gallery() {
  if (GALLERY_TILES.length === 0) return null;

  return (
    <section aria-labelledby="gallery-heading" className="py-[4.5rem] md:py-section">
      {/*
        Full bleed, and by cancelling the gutter rather than by `w-screen`.
        100vw includes the scrollbar, so a full-bleed block built that way is
        wider than the page on every platform that reserves one and gains a
        horizontal scroll for its trouble. `-mx-gutter` is the project's own
        idiom for this — <Container> has no ceiling, so cancelling its padding
        reaches the window edge exactly, and the two can never drift because
        they are the same token.
      */}
      <Container>
        <div
          className={cn(
            "-mx-gutter grid grid-cols-2 gap-0",
            /*
              MINMAX, NOT A FIXED HEIGHT. Rows have to be a known size for a
              cell to span two of them and land exactly twice as tall — but a
              row pinned to a viewport fraction clips the copy cell, whose
              content does not shrink at the same rate the viewport does: at
              1024 the text needs 281px and 19vw gives 195. `minmax(_,auto)`
              keeps the floor that makes the spanning work and lets the row
              grow when the words need it, which is the one thing a mosaic
              must never break for.
            */
            "md:grid-cols-12 md:auto-rows-[minmax(26vw,auto)] lg:auto-rows-[minmax(19vw,auto)]",
          )}
        >
          <CopyTile />

          {GALLERY_TILES.map((tile, i) => (
            <Tile
              key={tile.src}
              tile={tile}
              className={TILE_CELLS[i % TILE_CELLS.length]}
              delay={i * 0.06}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

/**
 * The words, as a cell.
 *
 * White Rock rather than the page ground, so the cell reads as a piece of
 * paper set into the wall of pictures rather than as a hole in it. Charcoal on
 * White Rock measures 9.4:1, so nothing here needs checking against a
 * photograph the way type over one does.
 *
 * Content is centred vertically and set in from the cell's left edge by the
 * page's own gutter at base, so the first character still lines up with the
 * copy in the sections above and below even though the mosaic itself has
 * broken out of the measure.
 */
function CopyTile() {
  return (
    <Reveal
      variant="fadeIn"
      className={cn(
        COPY_CELL,
        "flex flex-col justify-center bg-cream",
        "px-gutter py-12 md:px-9 md:py-10 lg:px-12 lg:py-12",
      )}
    >
      <p className="flex items-center gap-4 text-label font-medium uppercase tracking-eyebrow text-text">
        <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
        In the room
      </p>

      <h2
        id="gallery-heading"
        className="mt-6 text-h2 font-light uppercase leading-[1.05] tracking-[-0.02em] text-text"
      >
        What an afternoon looks like.
      </h2>

      <p className="mt-5 max-w-[24rem] text-body leading-[1.8] text-text/80 md:mt-6">
        Ordinary hands and wet paint. Nobody here has done it before either.
      </p>
    </Reveal>
  );
}

/**
 * One cell of the wall.
 *
 * The reveal wrapper is the grid item and the picture fills it absolutely, so
 * the cell keeps its size whatever is inside it — which is what lets a clip
 * and a still occupy the same cell interchangeably.
 *
 * `overflow-hidden` on the cell is what makes the hover safe: the picture
 * grows inside its own edges rather than over its neighbours, and in a grid
 * with no gutters that is the difference between a lift and a collision.
 *
 * SQUARE CORNERS, DELIBERATELY. A `rounded-sm` crept in here and it is the one
 * radius this component cannot have: the cells butt flush, so a radius on each
 * of them cuts a little four-pointed hole out of the page ground at every
 * junction where four corners meet, and the wall stops being a wall. The
 * rounding is not wrong elsewhere on the site — buttons and standalone plates
 * keep it — it is wrong wherever edges are supposed to meet.
 */
function Tile({ tile, className, delay }: { tile: GalleryTile; className: string; delay: number }) {
  return (
    <Reveal
      variant="fadeIn"
      delay={delay}
      className={cn("group relative overflow-hidden bg-surface-alt", className)}
    >
      {tile.kind === "image" ? (
        <Image
          src={tile.src}
          alt={tile.alt}
          fill
          /*
            The cells are half the window at base and between a third and seven
            twelfths of it from `md`. 60vw covers the widest of those with a
            little in hand rather than asking for a file per cell.
          */
          sizes="(min-width: 768px) 60vw, 50vw"
          style={{ objectPosition: tile.position ?? "50% 50%" }}
          className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.035]"
        />
      ) : (
        /*
          Scenery, not a media player: muted, looping, out of the tab order and
          with no controls. `preload="metadata"` fetches the header and nothing
          else, so a tile below the fold costs a few kilobytes rather than a
          file. Under reduced motion the element is hidden and the cell falls
          back to the poster behind it, which is what that field is for as much
          as buffering.
        */
        <>
          <Image
            src={tile.poster}
            alt={tile.label}
            fill
            sizes="(min-width: 768px) 60vw, 50vw"
            style={{ objectPosition: tile.position ?? "50% 50%" }}
            className="object-cover"
          />
          <video
            src={tile.src}
            poster={tile.poster}
            aria-hidden
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            tabIndex={-1}
            style={{ objectPosition: tile.position ?? "50% 50%" }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.035] motion-reduce:hidden"
          />
        </>
      )}
    </Reveal>
  );
}
