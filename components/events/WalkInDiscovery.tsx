"use client";

import { useMemo, useState } from "react";

import { FindYourVibe } from "@/components/layout/FindYourVibe";
import { Reveal } from "@/components/motion/Reveal";
import { ExperienceCard } from "@/components/events/ExperienceCard";
import type { CreativeExperience } from "@/lib/experiences";
import { experiencesByVibe, hasVibeTags, vibeCounts, type VibeSlug } from "@/lib/vibes";
import { cn } from "@/lib/utils";

/**
 * The walk-in half of /events — discovery, not a product grid.
 *
 * ==========================================================================
 * WHY THIS IS NOT FIVE EQUAL COLUMNS
 * ==========================================================================
 *
 * It was: `grid-cols-5` with one aspect ratio and one size, which is the
 * arrangement a shop uses for stock. These are not stock. They are five
 * things you can walk in and make, they are never booked and never bought
 * online, and a row of identical thumbnails says the opposite of all of that.
 *
 * So the plates run at three sizes on a twelve-column field, in a repeating
 * rhythm of five. The top edge moves, the shapes differ, and the eye reads a
 * spread rather than a shelf. The rhythm is keyed off the index, so filtering
 * down to two activities still produces a composition and not two orphans in
 * a five-wide row.
 *
 * DISCOVERY SITS OVER THE LISTING, NEVER INSTEAD OF IT. `vibe` is null until
 * a chip is pressed and null means every walk-in activity, in order. Choosing
 * a vibe narrows the same list rather than replacing it with a different
 * arrangement — the same rule the Experiences menu follows, so a visitor who
 * arrives by mood and one who arrives by browsing are reading one page.
 *
 * The chips only appear when the data can answer them: <FindYourVibe> is
 * rendered behind `hasVibeTags`, so an import that ships without vibe tags
 * degrades to the plain listing instead of three chips that all say zero.
 *
 * NOTHING HERE BOOKS ANYTHING. Every plate is a link to the activity's own
 * page. Walk-in experiences have no date, no seat count and no checkout, and
 * this component has no route to one.
 */
export function WalkInDiscovery({ experiences }: { experiences: CreativeExperience[] }) {
  const [vibe, setVibe] = useState<VibeSlug | null>(null);

  const offersVibes = useMemo(() => hasVibeTags(experiences), [experiences]);
  const counts = useMemo(() => {
    const out = {} as Record<VibeSlug, number>;
    for (const { vibe: v, count } of vibeCounts(experiences)) out[v.slug] = count;
    return out;
  }, [experiences]);

  const shown = useMemo(
    () => (vibe ? experiencesByVibe(experiences, vibe) : experiences),
    [experiences, vibe],
  );

  return (
    <>
      {offersVibes ? (
        <Reveal delay={0.1} className="mt-9 md:mt-11">
          <FindYourVibe counts={counts} selected={vibe} onSelect={setVibe} size="full" />
        </Reveal>
      ) : null}

      {/*
        `aria-live` on the count rather than on the list: a screen reader
        should hear "showing four" once, not five plate names re-announced
        every time a chip is pressed.
      */}
      <p aria-live="polite" className="sr-only">
        {shown.length} walk-in {shown.length === 1 ? "experience" : "experiences"} shown
      </p>

      <ul className="mt-10 grid grid-cols-12 gap-x-4 gap-y-10 sm:gap-x-6 md:mt-12 md:gap-y-14">
        {shown.map((experience, i) => {
          const beat = RHYTHM[i % RHYTHM.length];
          return (
            <Reveal
              as="li"
              key={experience.slug}
              variant="fadeIn"
              delay={Math.min(i, 5) * 0.05}
              className={cn(beat.span, beat.lift)}
            >
              {/*
                THE SAME CARD THE HOME PAGE SHOWS. This drew <ExperiencePlate>
                — its own frame, its own hover, its own caption — so the seven
                activities looked like two different products depending on
                whether you met them here or in the carousel. One component
                now; see <ExperienceCard>.
              */}
              <ExperienceCard
                experience={experience}
                index={i}
                aspect={beat.aspect}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 44vw, 46vw"
              />
            </Reveal>
          );
        })}
      </ul>

      {shown.length === 0 ? (
        <p className="mt-10 max-w-[34rem] text-body leading-[1.85] text-text/85">
          Nothing is tagged that way yet. Clear the filter to see every walk-in experience.
        </p>
      ) : null}
    </>
  );
}

/*
  The rhythm: five beats, four widths, four shapes, three of them dropped.

  THE SPANS TILE TO TWELVE IN PAIRS OF ROWS — 5+4+3, then 7+5. The first
  version ran 5+4+3 then 4+5, which is nine, and left a three-column hole
  beside the tallest plate at the end of the run. Editorial white space is
  space you placed; a hole left by arithmetic is not, and it read as the page
  having run out.

  The fourth beat is therefore the wide one. It is the largest image on the
  page and it lands at the start of the second row, which is where a spread
  wants its big picture — and it closes the row with the fifth.

  Below `lg` it settles to halves: a phone has no room for a five-part
  composition, and a 2-up of mixed aspects still reads as placed rather than
  as a grid. `lift` is what moves the top edge, and it is off on whichever
  beat opens a row so a row never starts mid-air.
*/
const RHYTHM = [
  { span: "col-span-6 lg:col-span-5", aspect: "aspect-[4/5]", lift: "" },
  { span: "col-span-6 lg:col-span-4", aspect: "aspect-square", lift: "lg:mt-10" },
  { span: "col-span-6 lg:col-span-3", aspect: "aspect-[3/4]", lift: "lg:mt-20" },
  { span: "col-span-6 lg:col-span-7", aspect: "aspect-[16/10]", lift: "" },
  { span: "col-span-6 lg:col-span-5", aspect: "aspect-[4/5]", lift: "lg:mt-8" },
] as const;
