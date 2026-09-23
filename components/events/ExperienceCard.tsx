import Image from "next/image";
import Link from "next/link";
import type { ElementType } from "react";

import styles from "@/components/events/ExperienceCard.module.css";
import { INK } from "@/components/sections/hero/composition";
import { EXPERIENCE_KIND_LABEL, type CreativeExperience } from "@/lib/experiences";
import { cn } from "@/lib/utils";

/**
 * One creative experience, as a card.
 *
 * ==========================================================================
 * ONE CARD, BOTH PLACES
 * ==========================================================================
 *
 * The home page's carousel and the walk-in listing on /events show the same
 * seven activities, and until this component they drew them differently: the
 * carousel had the tilted frame, the paint flood and the numeral; /events had
 * a plain plate with a rule under its name. Same photograph, same slug, two
 * different products depending on which page you arrived from.
 *
 * So the card is a component and both pages render it. Not a copy of the
 * styling — a copy stays identical exactly until the next edit.
 *
 * ==========================================================================
 * WHAT THE CALLER OWNS AND WHAT THE CARD OWNS
 * ==========================================================================
 *
 * The caller owns WHERE: the element type, the width, the snap and span
 * classes, the row it sits in. The card owns everything about how it looks
 * and behaves — the angle, the paint, the hover, the numeral, the caption.
 *
 * `as` exists because the carousel's deal animation selects
 * `[data-armed] > [data-card]`, a direct-child rule, so in the track the card
 * has to BE the list item rather than sit inside one. Everywhere else a div
 * is right.
 *
 * ==========================================================================
 * THE ANGLE IS DERIVED, NEVER RANDOM
 * ==========================================================================
 *
 * The tilt and the paint both come from `index`. That keeps a row stable
 * between renders and identical on the server and the client — a random tilt
 * would be a hydration mismatch and, worse, would change on every paint,
 * which is the "constant floating" the brief rules out. Under two degrees,
 * and it straightens as you reach the card.
 */
export function ExperienceCard({
  experience,
  index,
  sizes,
  aspect = "aspect-[3/4]",
  as: Tag = "div",
  className,
}: {
  experience: CreativeExperience;
  /** Place in the row. Drives the angle, the paint and the numeral. */
  index: number;
  /** Rendered width per breakpoint, so the browser fetches one size only. */
  sizes: string;
  /** The frame's shape. One aspect per row reads better than several. */
  aspect?: string;
  as?: ElementType;
  className?: string;
}) {
  const paint = WASH[index % WASH.length];
  const tilt = (index % 2 === 0 ? -1 : 1) * (1.1 + (index % 3) * 0.35);

  return (
    <Tag
      /*
        `data-card` is the handle the carousel's stylesheet uses for its deal.
        It is an attribute rather than a class because that file is a
        different CSS module and cannot name this one's hashed classes.
      */
      data-card
      className={cn(styles.card, "group", className)}
      style={{ "--tilt": `${tilt}deg`, "--i": index } as React.CSSProperties}
    >
      <Link href={`/events/${experience.slug}`} className="block focus-visible:outline-none">
        <span
          className={cn(
            styles.frame,
            aspect,
            "w-full rounded-[1.25rem] bg-cream",
            "group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-sage",
          )}
          /*
            THE BRUSH. `data-paint` tells <CursorLayer> this is paintable and
            `--paint` loads it with this card's own colour — the same colour
            the flood is about to open in, so the brush in your hand is the
            paint you are applying.
          */
          data-paint
          style={{ "--paint": paint } as React.CSSProperties}
        >
          {experience.image ? (
            <Image
              src={experience.image.src}
              alt={experience.image.alt}
              fill
              sizes={sizes}
              style={{ objectPosition: experience.image.position ?? "50% 50%" }}
              className={styles.base}
            />
          ) : null}

          {/* The card's own colour thrown up over the lower half, torn along
              the top with dabs scattered off it. One masked layer. */}
          <span aria-hidden className={styles.flood} />

          {/* Rides in on the paint. A span, not a link — the card is already
              one anchor to this page, and the name below is what a screen
              reader announces. */}
          <span
            aria-hidden
            className={cn(
              styles.action,
              "inline-flex items-center gap-2 whitespace-nowrap rounded-pill",
              "bg-cream px-5 py-2.5 text-label font-semibold uppercase tracking-eyebrow text-text",
            )}
          >
            View details
            <span className="text-[0.9em] leading-none">&#8594;</span>
          </span>

          <span
            aria-hidden
            className={cn(
              styles.numeral,
              "absolute left-4 top-3 z-10 text-[2.25rem] font-bold leading-none tabular-nums",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </span>

        {/* Left-aligned, to the picture's own edge: a centred caption under a
            centred plate is a slide, this is an entry in a list. */}
        <span className="mt-4 block text-[1.0625rem] font-semibold leading-snug text-text transition-colors duration-300 ease-soft group-hover:text-primary">
          {experience.name}
        </span>

        <span className="mt-1.5 flex items-center gap-2 text-fine text-text/75">
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-pill"
            style={{ backgroundColor: paint }}
          />
          {experience.status ?? EXPERIENCE_KIND_LABEL[experience.kind]}
        </span>
      </Link>
    </Tag>
  );
}

/*
  The paints, cycled by position. Three rather than one so a row is not a
  single colour repeated, and White Rock is not among them: it is the frame's
  own ground, and a wash of it over a photograph is a fog rather than paint.
*/
const WASH = [INK.lilac, INK.terracotta, INK.lavender] as const;
