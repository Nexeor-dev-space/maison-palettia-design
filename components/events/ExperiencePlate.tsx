import Image from "next/image";
import Link from "next/link";

import styles from "@/components/events/ExperiencePlate.module.css";
import type { CreativeExperience } from "@/lib/experiences";
import { paintAt } from "@/lib/paint";
import { cn } from "@/lib/utils";

/**
 * One activity: the photograph, then its name and line beneath.
 *
 * Shared by the homepage's experience groups and the /events listing, so the
 * same activity never looks two different ways on two pages.
 *
 * WORDS UNDER THE PICTURE, NEVER ON IT. At this size a caption laid over a
 * photograph needs a scrim heavy enough to spoil the image before a 13px line
 * clears 4.5:1. Set beneath, the photograph stays whole and the type sits on
 * the page's own ground at full contrast.
 *
 * The studio's status flag ("Coming soon") is printed in words beside the
 * name. It has to be read, and it has to stop anyone walking to the mall for
 * something that is not running yet — a colour-coded badge would do neither
 * for a reader who cannot see the colour.
 *
 * ==========================================================================
 * THE HOVER: PAINT
 * ==========================================================================
 *
 * The client asked for the activity cards to be more playful, and this is the
 * one card on the site that carries it: a stroke of the plate's own colour is
 * brushed up over the foot of the photograph while the picture leans in and
 * the rule draws under its name. Three things, one gesture, ~600ms — see
 * ./ExperiencePlate.module.css for why the paint lands at the foot rather
 * than over the whole picture.
 *
 * The colour comes from `paintAt(index)`, so a row reads as a palette. It is
 * also what the pointer itself turns into over the photograph (`data-paint`;
 * see <CursorLayer>) — the dab in your hand is the colour about to be laid
 * down, which is the whole idea in one detail.
 *
 * Nothing here is the only way to read the card: the name, the line and the
 * status are all printed, and the rule answers focus as well as hover.
 */
export function ExperiencePlate({
  experience,
  aspect,
  sizes,
  large = false,
  index = 0,
}: {
  experience: CreativeExperience;
  aspect: string;
  sizes: string;
  large?: boolean;
  /** Position in its row, which picks the paint. */
  index?: number;
}) {
  const paint = paintAt(index);

  return (
    <Link href={`/events/${experience.slug}`} className="group press-in block">
      <div
        className={cn(styles.plate, aspect)}
        // The pointer becomes a dab of this plate's paint over the picture.
        data-paint
        style={{ "--paint": paint } as React.CSSProperties}
      >
        {experience.image ? (
          <Image
            src={experience.image.src}
            // The name is set in text directly beneath; the picture illustrates it.
            alt=""
            fill
            sizes={sizes}
            style={{ objectPosition: experience.image.position ?? "50% 50%" }}
            className={styles.image}
          />
        ) : null}
        <span aria-hidden className={styles.stroke} />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "font-medium leading-snug text-text",
              large ? "text-lead md:text-[1.4rem]" : "text-body",
            )}
          >
            {/* The rule is on the words, not on the block, so it is the width
                of the name rather than of the column. */}
            <span className="ink-rule" style={{ "--rule": paint } as React.CSSProperties}>
              {experience.name}
            </span>
          </p>
          {experience.description ? (
            <p
              className={cn(
                "mt-1.5 leading-[1.6] text-text/80",
                large ? "max-w-[30rem] text-body" : "text-fine",
              )}
            >
              {experience.description}
            </p>
          ) : null}
        </div>
        {experience.status ? (
          <span className="mt-0.5 shrink-0 border border-text/40 px-2 py-1 text-label font-semibold uppercase leading-none tracking-eyebrow text-text">
            {experience.status}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
