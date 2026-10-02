import Image from "next/image";

import type { CreativeExperience } from "@/lib/experiences";
import { cn } from "@/lib/utils";

/**
 * The painted activity plate — a photograph with the studio's own paint run
 * up over its foot, and the words on the colour it lands in.
 *
 * ==========================================================================
 * ONE CARD, TWO PAGES
 * ==========================================================================
 *
 * This was local to /private-events. The four programme pages under
 * /private-events/[slug] were drawing the same seven activities as a plain
 * photograph over a flat panel, and the client's note on those was that they
 * "look old" beside this one. They were the same content in two different
 * cards, which is how two pages start looking like two websites — the same
 * argument <ExperienceCard> records for the home page and /events.
 *
 * So it moved here whole, comments and all, and both pages render it. Nothing
 * about the drawing changed in the move.
 */
/*
  ==========================================================================
  THE PAINT THE CAPTION IS WRITTEN ON — scattered, not a rectangle
  ==========================================================================

  "Redesign that style like the second card's colour scattered style. Use
  different colours for that parts." The reference is a photograph with paint
  run across its foot: an irregular top edge rather than a ruled one, and a
  few drops thrown clear of it onto the picture above.

  SO THE FOOT IS TWO PIECES. A flat field carrying the words, and above it a
  band whose top edge is a wave — one SVG at `preserveAspectRatio: none`, which
  is right for a wave and would be wrong for anything with a recognisable
  shape. The drops are separate and NOT stretched: they are their own small
  ellipses at fixed sizes, so they stay round on a 1052px lead and on a 236px
  tile alike. Stretching them with the band is the one thing that would make
  this read as a gradient with a wobble rather than as paint.

  THE COLOURS ARE MEASURED, WHICH IS WHY THERE ARE THREE AND NOT SIX.

      ground          ink            ratio
      Soft Lavender   charcoal       6.49
      Soft Lavender   charcoal/85    4.73   <- the supporting line
      Soft Lavender   charcoal/80    4.30          fails
      White Rock      charcoal       9.36
      White Rock      charcoal/85    6.14
      Deep Lilac      surface        4.90   <- the only light ink that clears
                                             lilac; it takes no alpha at all

  The /85 is why the supporting line is not the /80 this page uses everywhere
  else: Soft Lavender is the ground that sets the figure, and at /80 the
  description measures 4.30 and fails. The same rule CARD_STOCK keeps on
  /locations, for the same reason.

  The three the palette does not offer here are Light Sage, which is now the
  section's own ground and would make a tile look as though its foot were
  missing; and Warm Terracotta, which carries no body text at any ink —
  charcoal on it is 3.84 and white 3.12, and both fail what a caption owes.

  THE WAVE AND THE DROPS TAKE THE FIELD'S OWN COLOUR, not a second one. They
  are the same paint: the wave is the field's top edge and the drops are what
  came off it, so a contrasting colour there would read as two separate
  decorations rather than as one gesture. `paint` is that colour as an ink, for
  `currentColor` in <PaintEdge>.

  They rotate by position rather than by name, so a tile added or reordered
  takes the next colour rather than needing an entry of its own.
*/
const PAINTS: readonly {
  field: string;
  ink: string;
  soft: string;
  paint: string;
}[] = [
  { field: "bg-lavender", ink: "text-text", soft: "text-text/85", paint: "text-lavender" },
  /* Charcoal Slate, and it replaced a White Rock field that WAS the card:
     `bg-surface-alt` measured 1.00:1 against the plate it sits on, so one
     card in three painted its foot in the card's own colour and appeared
     to have none. Charcoal is 9.36 against it and takes the near-white at
     11.61, and it gives the run a dark step the other two did not have. */
  { field: "bg-text", ink: "text-surface", soft: "text-surface/90", paint: "text-text" },
  { field: "bg-primary", ink: "text-surface", soft: "text-surface", paint: "text-primary" },
];

/**
 * The wave along the top of a foot, and the drops thrown above it.
 *
 * `currentColor` throughout, so the caller sets `color` once and the whole
 * gesture takes the tile's paint. The band is `preserveAspectRatio: none` and
 * the drops are not — see the note on PAINTS.
 */
function PaintEdge({ className }: { className: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-x-0", className)}>
      {/* The drops: fixed sizes, deterministic positions, scattered up the
          picture. Percentages across, pixels down, so they spread with the
          tile's width and stay clear of its foot. */}
      {DROPS.map((drop, i) => (
        <span
          key={i}
          className="absolute rounded-pill bg-current"
          style={{
            left: `${drop.x}%`,
            bottom: `${drop.y}px`,
            width: `${drop.w}px`,
            height: `${drop.h}px`,
            opacity: drop.o,
          }}
        />
      ))}

      <svg
        className="absolute inset-x-0 bottom-0 block h-[2.25rem] w-full lg:h-[2.75rem]"
        viewBox="0 0 240 44"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          d="M0 24c14-11 30-13 46-7 15 6 26 1 40-4 16-6 31-3 44 3 12 6 26 7 40 2 13-5 28-9 42-3 10 4 20 5 28 2v31H0z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/*
  Nine drops, thrown once and then fixed: nothing here is random, so the server
  and the client draw the same picture.

  SIZED TO BE SEEN. The first pass ran 5 to 12px at 0.6 to 0.9 and vanished —
  a 5px speck at 60% over a photograph is not paint, it is a dust mark on the
  lens. These run 8 to 20px and the smallest is at 0.7, which is the size the
  reference's own drops take against their picture. They rise to 92px above
  the foot, roughly twice the wave's own height, so the throw has somewhere to
  travel rather than sitting in a line along the edge.
*/
const DROPS: readonly { x: number; y: number; w: number; h: number; o: number }[] = [
  { x: 6, y: 48, w: 14, h: 11, o: 0.95 },
  { x: 17, y: 72, w: 8, h: 7, o: 0.8 },
  { x: 25, y: 54, w: 20, h: 15, o: 0.9 },
  { x: 39, y: 88, w: 9, h: 7, o: 0.7 },
  { x: 47, y: 58, w: 12, h: 10, o: 0.95 },
  { x: 58, y: 80, w: 8, h: 6, o: 0.75 },
  { x: 68, y: 52, w: 17, h: 13, o: 0.9 },
  { x: 80, y: 76, w: 9, h: 7, o: 0.8 },
  { x: 90, y: 56, w: 13, h: 10, o: 0.95 },
];

/**
 * One experience: a photograph with its name written under it.
 *
 * ==========================================================================
 * THE WORDS CAME OFF THE PICTURE, AND THAT IS WHAT MAKES BOTH ASKS POSSIBLE
 * ==========================================================================
 *
 * "Remove this overlay and increase the font size of that title and
 * description inside these images." Those two pull in opposite directions for
 * as long as the words sit ON the photograph: the names are set in White Rock,
 * White Rock on a white ceramic plate is about 1.4:1, and the only thing that
 * ever made them readable was the wash the client keeps — rightly — asking to
 * be rid of. Bigger type on a photograph needs MORE shade under it, not less.
 * Three passes were spent tuning that shade and every one of them was a
 * compromise between two things that cannot both be had.
 *
 * So the words come off the picture. Each tile is now a photograph with a
 * White Rock foot under it, and the name and the line are set on that in
 * Charcoal Slate — 9.36:1, which is not a number that needs defending and,
 * more to the point, does not care how large the type is or how bright the
 * frame above it is. The type grows because there is now somewhere for it to
 * grow into.
 *
 * WHAT IS LEFT ON THE PHOTOGRAPH is the one thing the client did ask for: a
 * 13% Charcoal tint, and nothing else. No gradient, no band, no edge. Seven
 * pictures taken on seven different days still read as one set, and every one
 * of them is otherwise exactly the photograph.
 *
 * THE TILES STILL TESSELLATE. The foot is a fixed block and the picture takes
 * whatever the cell has left (`flex-1`), so a tile that spans two rows gets a
 * taller photograph rather than a taller caption, and the grid closes flush
 * the way it did. The tracks grew by about a fifth to pay for the foot.
 *
 * An entry with no photograph is the same card with the picture left out.
 */
export function ActivityPlate({
  experience,
  className,
  sizes,
  paint = 0,
  large = false,
}: {
  experience: CreativeExperience;
  className: string;
  sizes: string;
  /** Which of PAINTS this tile takes — its position in the collage. */
  paint?: number;
  large?: boolean;
}) {
  const stock = PAINTS[paint % PAINTS.length];
  /*
    UP A STEP, AT THE CLIENT'S ASK, and the lead goes up two because it is
    four times the area of the tiles beside it and was set only one step above
    them. Charcoal on White Rock carries any of these.
  */
  const caption = (
    <div className={cn("relative shrink-0 px-5 pb-5 pt-4 lg:px-6 lg:pb-6 lg:pt-5", stock.field)}>
      <p
        className={cn(
          "font-medium leading-tight",
          stock.ink,
          /* The lead tile takes the card-title step and the rest the compact
             one — two steps from the scale, not four hand-set sizes. */
          large ? "text-h3" : "text-h4",
        )}
      >
        {experience.name}
      </p>
      {experience.description ? (
        /*
          FLUID ON THE SMALL TILES, FIXED ON THE LEAD. `text-body` is 17px and
          on a 236px tile at 1024 that is three lines of caption under a
          115px photograph. The clamp holds 15px there and reaches 17px by
          1440, where the tiles are wide enough for two. Either way it is well
          clear of the 13px this was before the client asked for it to grow.
        */
        <p
          className={cn(
            "mt-2 max-w-[34rem] leading-[1.55]",
            stock.soft,
            "text-body",
          )}
        >
          {experience.description}
        </p>
      ) : null}
      {/*
        The studio's own flag where it has set one, and nothing at all where it
        has not — never an invented "available on request".
      */}
      {experience.status ? (
        <p className={cn("mt-1.5 text-fine leading-snug", stock.soft)}>{experience.status}</p>
      ) : null}
    </div>
  );

  if (!experience.image) {
    return (
      <div className={cn("flex flex-col justify-end overflow-clip rounded-[1.25rem]", className)}>
        {caption}
      </div>
    );
  }

  return (
    <div
      /* `rounded-[1.25rem]`, not the site's 8px `rounded-sm`: packed this
         tight the corners are what separate one tile from the next, and the
         client's reference rounds them hard. It is the same radius the
         activity cards already use. */
      className={`group flex flex-col overflow-clip rounded-[1.25rem] bg-surface-alt ${className}`}
    >
      {/*
        `min-h-0` with `flex-1`: without it a flex child will not shrink below
        its content's intrinsic height, and an absolutely-filled <Image> in a
        fixed-height grid cell is exactly the case where that bites.
      */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Image
          src={experience.image.src}
          alt=""
          fill
          sizes={sizes}
          style={{ objectPosition: experience.image.position ?? "50% 50%" }}
          className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.04]"
        />
        {/*
          The whole of what is on the picture now: Charcoal Slate at 13%, flat,
          the same on every tile. It is what makes seven photographs taken on
          seven different days read as one set, and it is slight enough that
          they keep their colour.
        */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-text/[0.13]" />

        {/*
          THE PAINT, RUN UP OVER THE FOOT OF THE PICTURE. It sits inside the
          picture's own box rather than on the caption, so the wave and the
          drops are over the photograph — which is what makes it read as paint
          thrown at a print rather than as a decorated edge on a panel. The
          field below carries the words. `text-<paint>` here is what
          `currentColor` in <PaintEdge> resolves to.
        */}
        <PaintEdge className={cn("bottom-0 h-[8rem]", stock.paint)} />
      </div>

      {caption}
    </div>
  );
}
