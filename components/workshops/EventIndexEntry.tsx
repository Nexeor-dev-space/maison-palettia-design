import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import {
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  formatVenueLine,
  isFullyBooked,
  isScarce,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshops";
import { cn } from "@/lib/utils";
import type { Workshop } from "@/types";

/**
 * The proportions the index cycles through.
 *
 * Three plates at three shapes, repeating. A catalogue that sets every
 * photograph in the same frame reads as a product grid however much air is put
 * around it; varying the crop is what makes a run of sessions read as a
 * collection that was arranged rather than generated. The cycle is driven by
 * position in the list rather than by anything in the data, because it is
 * composition — the studio should not have to think about it when adding a
 * date.
 */
const PLATES = ["aspect-[4/3]", "aspect-[5/6]", "aspect-[3/2]"] as const;

/**
 * One event in the index.
 *
 * The listing's job is different from the homepage's. There, three dates are
 * given equal weight as blocks of colour because the section has to sell the
 * idea of booking at all. Here someone has already decided to look at the
 * programme, so the page can behave like a catalogue: photograph on one side,
 * the facts set as a wall label on the other, and the whole thing crossing
 * back and forth down the page rather than marching.
 *
 * The metadata column is the same four facts in the same order everywhere on
 * the site — where, when, how long, how much — so a reader who has seen the
 * homepage already knows how to read this.
 *
 * One link per session, stretched over the entry by its `::after`. The "View
 * session" affordance below is a span for that reason: a second anchor to the
 * same page would put every session in the tab order twice.
 */
export function EventIndexEntry({ workshop, index }: { workshop: Workshop; index: number }) {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const closed = isFullyBooked(workshop);
  const flip = index % 2 === 1;
  const ordinal = String(index + 1).padStart(2, "0");

  return (
    <Reveal
      as="article"
      className={cn("group relative grid grid-cols-12 items-center gap-x-6 lg:gap-x-10", closed && "opacity-70")}
    >
      <figure
        className={cn(
          "col-span-12 md:row-start-1",
          flip ? "md:col-span-7 md:col-start-6" : "md:col-span-7 md:col-start-1",
        )}
      >
        <WorkshopPhoto
          image={workshop.image}
          aspect={PLATES[index % PLATES.length]}
          sizes="(min-width: 768px) 56vw, 100vw"
        />
      </figure>

      <div
        className={cn(
          "col-span-12 mt-8 md:row-start-1 md:mt-0",
          flip ? "md:col-span-4 md:col-start-1" : "md:col-span-4 md:col-start-9",
        )}
      >
        <p className="flex items-center gap-3">
          <span className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/75">
            {ordinal}
          </span>
          <span aria-hidden className="h-px w-5 shrink-0 bg-terracotta" />
          <span className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/75">
            {workshop.category}
          </span>
        </p>

        <h2 className="mt-4 text-[1.5rem] font-light leading-[1.15] tracking-[-0.02em] lg:text-[1.75rem]">
          <Link
            href={workshopHref(workshop)}
            aria-label={`${workshop.title}, ${formatSessionDate(workshop.startsAt)}${workshop.venue ? ` at ${formatVenueLine(workshop.venue)}` : ""}`}
            className="transition-colors duration-300 ease-soft after:absolute after:inset-0 hover:text-primary"
          >
            {workshop.title}
          </Link>
        </h2>

        <dl className="mt-7 flex flex-col gap-5 border-t border-line pt-7">
          {workshop.venue ? (
            <Fact term="Where">
              {workshop.venue.name}
              <Sub>{workshop.venue.locality}</Sub>
            </Fact>
          ) : null}

          <Fact term="When">
            <time dateTime={workshop.startsAt}>
              {weekday} {formatSessionDate(workshop.startsAt)}
            </time>
            <Sub>
              <span className="tabular-nums">{start}</span>
              <span aria-hidden> &ndash; </span>
              <span className="sr-only">to</span>
              <span className="tabular-nums">{end}</span>
              <span aria-hidden className="px-1.5 text-text/35">&middot;</span>
              <time dateTime={durationToIso(workshop.durationMinutes)}>
                {formatDuration(workshop.durationMinutes)}
              </time>
            </Sub>
          </Fact>

          <Fact term="Price">
            {formatPrice(workshop.price)}
            <Sub>per person</Sub>
          </Fact>
        </dl>

        <p className="mt-7 flex items-center gap-2.5 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text">
          {isScarce(workshop) ? (
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-terracotta" />
          ) : null}
          {spotsLabel(workshop)}
        </p>

        {/*
          An affordance, not a link — the title above already covers the whole
          entry. See the note on <WorkshopAction>, which follows the same rule.
        */}
        <span
          aria-hidden
          className="mt-7 flex w-fit items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-eyebrow text-primary"
        >
          <span className="border-b border-primary/40 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-primary">
            {closed ? "View event" : "View event"}
          </span>
          <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
            &#8594;
          </span>
        </span>
      </div>
    </Reveal>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/75">{term}</dt>
      <dd className="mt-2 text-[0.95rem] font-medium leading-snug text-text">{children}</dd>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <span className="mt-1.5 block text-[0.82rem] font-normal text-text/75">{children}</span>;
}
