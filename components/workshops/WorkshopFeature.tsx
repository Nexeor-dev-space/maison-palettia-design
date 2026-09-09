import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { AvailabilityMarker, WorkshopSpec } from "@/components/workshops/WorkshopMeta";
import { WorkshopAction } from "@/components/workshops/WorkshopAction";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import { workshopActionLabel, workshopHref } from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * The title link, stretched across the whole entry by its `::after`.
 *
 * The hit area follows the photograph out past the measure at each breakpoint
 * rather than stopping at `inset-0`, so the bled edges of the image are
 * clickable instead of being a dead strip at the screen edge.
 */
const FEATURE_LINK =
  "transition-colors duration-300 ease-soft hover:text-primary " +
  "after:absolute after:inset-y-0 after:-left-gutter after:-right-gutter lg:after:right-0";

/**
 * The anchor of the collection — one workshop given the room of a plate on a
 * gallery wall, with its facts set beside it as the label.
 *
 * The photograph runs off the left edge of the measure at every width; below
 * `lg` it runs off both, and the label drops underneath it. That break is why
 * the two halves are not simply a two-column layout: at tablet width a
 * side-by-side split shrinks the photograph to the point where the text starts
 * to dominate, which inverts the whole point of the section.
 *
 * One link per workshop. The title is the anchor and its `::after` covers the
 * entry, so the photograph, the label and the arrow are all clickable while
 * the tab order gains a single, well-named stop.
 */
export function WorkshopFeature({ workshop }: { workshop: Workshop }) {
  return (
    <article className="group relative grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
      <figure className="col-span-12 -mx-gutter lg:col-span-8 lg:-ml-gutter lg:mr-0">
        <WorkshopPhoto
          image={workshop.image}
          aspect="aspect-[4/3] sm:aspect-[3/2]"
          sizes="(min-width: 1440px) 1000px, (min-width: 1024px) 70vw, 100vw"
        />
      </figure>

      <div className="col-span-12 mt-9 max-w-[34rem] md:ml-[8%] lg:col-span-4 lg:ml-0 lg:mt-0 lg:max-w-none lg:pb-1">
        <Reveal delay={0.1}>
          {/* Index, rule, and the section's one hand-written word. */}
          <p className="flex items-center gap-4">
            <span className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/70">
              01
            </span>
            <span aria-hidden className="h-px w-8 shrink-0 bg-terracotta" />
            {/* Set in caps rather than the script face: the script is reserved
                for the three display moments on the homepage, and a listing
                badge is not one of them. */}
            <span className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-primary">
              Featured
            </span>
          </p>

          <p className="mt-7 text-[0.66rem] font-medium uppercase tracking-eyebrow text-text/70">
            {workshop.category}
          </p>

          <h3 className="mt-3 text-[1.6rem] font-semibold leading-[1.15] tracking-[-0.015em] lg:text-[1.85rem] xl:text-[2rem]">
            <Link
              href={workshopHref(workshop)}
              aria-label={`${workshop.title} — ${workshopActionLabel(workshop).toLowerCase()}`}
              className={FEATURE_LINK}
            >
              {workshop.title}
            </Link>
          </h3>

          <p className="mt-5 text-[0.95rem] leading-[1.8] text-text/75">{workshop.excerpt}</p>
        </Reveal>

        <Reveal delay={0.25}>
          <WorkshopSpec workshop={workshop} className="mt-9" />
          <AvailabilityMarker workshop={workshop} className="mt-8" />
          <WorkshopAction
            label={workshopActionLabel(workshop)}
            tone="primary"
            className="mt-8"
          />
        </Reveal>
      </div>
    </article>
  );
}
