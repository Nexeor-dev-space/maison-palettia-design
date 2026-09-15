import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { WorkshopFeature } from "@/components/workshops/WorkshopFeature";
import {
  formatPrice,
  getUpcomingWorkshops,
  isFullyBooked,
  sessionDateParts,
  spotsLabel,
} from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * The heading. A step below the brand statement above it: that section makes
 * the argument, this one opens the schedule.
 */
const HEADING_LINE =
  "block font-light uppercase leading-[0.98] tracking-[-0.02em] " +
  "text-[2rem] xs:text-[2.4rem] sm:text-[2.9rem] md:text-[2.6rem] lg:text-[3.25rem] xl:text-[3.75rem]";

/** "01", "02" — printed copy, so the padding happens once, here. */
const ordinal = (n: number) => String(n).padStart(2, "0");

/**
 * Homepage section 03 — the schedule.
 *
 * This section used to be a curated collection: a featured workshop given a
 * gallery wall, two more set at unequal sizes on unequal baselines, and copy
 * about slowing down. It said "Maison Palettia runs beautiful workshops",
 * which is true and is not what someone lands here to find out.
 *
 * The studio sets up in malls on fixed dates at fixed times, so every session
 * is now the same split block, answering four questions in the order they are
 * actually asked: the photograph on one side doing the work of making someone
 * want it, a White Rock field on the other carrying the venue, the date, the
 * fixed time, what is left and the price — then the one action. The two halves
 * meet on a single edge, with no gap and no border between them.
 *
 * What is deliberately kept from the old section: the plate, the whitespace,
 * the type, the restraint. What is dropped: paragraphs of description in a
 * listing, unequal sizes and baselines between sessions, and the idea that the
 * strongest thing on offer is "Explore workshop".
 *
 * There is no carousel and no filter. Three sessions do not need either, and
 * the controls would be furniture — the whole list is on the page already.
 *
 * Server component, awaited in place rather than wrapped in <Suspense>.
 *
 * A boundary here would be the obvious move once the data is remote, and
 * <WorkshopsSkeleton> is written and waiting for it — but it is not free. React
 * streams a suspended boundary's content at the end of the document and swaps
 * it in with an inline script, so a visitor or crawler without JavaScript is
 * left holding the skeleton for good. The root layout already carries a
 * <noscript> rule to keep the scroll reveals from hiding this page from that
 * audience; quietly reintroducing the same hole one section later would undo
 * it. Awaiting costs nothing while the data is local, and the trade is worth
 * making again deliberately when a real CMS call is on the other side.
 */
export async function UpcomingEvents() {
  const workshops = await getUpcomingWorkshops();

  return (
    <section
      aria-labelledby="upcoming-events-heading"
      className="bg-surface py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <SectionHead workshops={workshops} />
        <Schedule workshops={workshops} />
      </Container>
    </section>
  );
}

/**
 * The section head, pitched to sell.
 *
 * WHAT CHANGED AND WHY. This read "Upcoming events / Find your next creative
 * event." over a paragraph describing the model — accurate, and the register
 * of a programme note rather than of the one section on the homepage with
 * something to sell. The client asked for it to work harder commercially, so
 * it now leads with the action and the reward ("Book your place. / Take
 * something home."), states the three numbers a buyer actually weighs, and
 * carries a filled call to action instead of leaving the section's only
 * affordance to a line of underlined type at the foot of the list.
 *
 * EVERY NUMBER IS READ OFF THE DATA. The count, the price, the date and the
 * seats are computed from the sessions below, so the strip cannot say anything
 * the schedule does not. Nothing here invents scarcity: the seat line is the
 * same `spotsLabel` the listing and the event page use, which says "left" only
 * once a date is genuinely down to its last few and "available" otherwise.
 *
 * SOLD-OUT DATES ARE EXCLUDED FROM THE PITCH. "From AED 240" quoted off a date
 * nobody can book is the oldest trick in the listing business and it is not
 * one this studio should run — the price, the date and the seats all come from
 * the soonest session a visitor could actually take.
 */
function SectionHead({ workshops }: { workshops: Workshop[] }) {
  const count = workshops.length;
  const bookable = workshops.filter((workshop) => !isFullyBooked(workshop));
  // Soonest first, so the head of the bookable list is the next real date.
  const next = bookable[0];
  const cheapest = bookable.reduce<Workshop | null>(
    (low, workshop) => (!low || workshop.price.amount < low.price.amount ? workshop : low),
    null,
  );

  return (
    <div>
      <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
        <div className="col-span-12 md:col-span-6 lg:col-span-7">
          <Reveal>
            <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
              <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
              {/* "Now booking" is a state, not a boast — and it is only true
                  while something can be booked. */}
              {bookable.length > 0
                ? `Now booking · ${count} ${count === 1 ? "date" : "dates"}`
                : "Upcoming events"}
            </p>
          </Reveal>

          <h2 id="upcoming-events-heading" className="mt-8 md:mt-11 lg:mt-14">
            {/*
              Two lines, one trigger, each rising from behind its own mask —
              the same device as the brand statement, at a smaller scale. The
              explicit space keeps the accessible name reading as a sentence.

              The action first and the reward second, which is the order a
              headline sells in. Both stay short enough to hold one line at
              every width: a wrap inside a masked line would double its height
              and break the run against the line beneath it.
            */}
            <Stagger>
              <HeadingLine>Book your place.</HeadingLine>{" "}
              <HeadingLine>Take something home.</HeadingLine>
            </Stagger>
          </h2>
        </div>

        <Reveal
          delay={0.2}
          className="col-span-12 mt-8 md:col-span-5 md:col-start-8 md:mt-0 md:pb-2 lg:col-span-4 lg:col-start-9"
        >
          <p className="max-w-[26rem] text-body leading-[1.85] text-text/80">
            Hands-on creative events at selected malls, on scheduled dates and at fixed times.
            Every material provided — bring nothing but yourself.
          </p>
          {/*
            The objection this section actually has to answer. Both halves are
            plainly true: checkout is guest-only with four fields, and there is
            no account to make anywhere on the site.
          */}
          <p className="mt-5 max-w-[26rem] text-body font-medium leading-[1.85] text-text">
            No account needed — booking takes two minutes.
          </p>
        </Reveal>
      </div>

      {next && cheapest ? <BookingStrip next={next} cheapest={cheapest} /> : null}
    </div>
  );
}

/**
 * The three numbers, and the action.
 *
 * A price, a date and a seat count — the whole of what someone weighs before
 * deciding to look closer, gathered above the list instead of made them hunt
 * for it across three blocks.
 *
 * The figures stay in Charcoal Slate rather than taking the accent. Warm
 * Terracotta measures 3.07:1 on this ground, under the 4.5:1 body-sized text
 * owes, and urgency that only exists for readers who can see a colour is not
 * urgency. The words carry it: "3 spots left" is doing the work, not the ink.
 */
function BookingStrip({ next, cheapest }: { next: Workshop; cheapest: Workshop }) {
  const { weekday, day, month } = sessionDateParts(next.startsAt);

  return (
    <Reveal variant="fadeIn" delay={0.3}>
      <div className="mt-11 flex flex-col gap-8 border-t border-line pt-8 md:mt-14 md:flex-row md:items-end md:justify-between md:gap-10">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3 md:gap-x-12 lg:gap-x-16">
          <Stat term="From">
            {formatPrice(cheapest.price)}
            <span className="mt-1 block text-fine font-normal text-text/75">per person</span>
          </Stat>
          <Stat term="Next date">
            <time dateTime={next.startsAt}>
              {weekday} {day} {month}
            </time>
            {next.venue ? (
              <span className="mt-1 block text-fine font-normal text-text/75">
                {next.venue.name}
              </span>
            ) : null}
          </Stat>
          <Stat term="Places">
            {spotsLabel(next)}
            <span className="mt-1 block text-fine font-normal text-text/75">on the next date</span>
          </Stat>
        </dl>

        {/*
          The one filled control on the homepage, and the point of the change:
          the section's only affordance used to be a line of underlined type
          after the whole list, which is a way out of a section rather than a
          way into a booking. Deep Lilac with white on it clears 5.06:1 — the
          same button the booking flow ends on, so this is the site's own
          language spoken louder rather than a new one.
        */}
        <Link
          href="/events"
          className="group inline-flex w-full shrink-0 items-center justify-center gap-2.5 bg-primary px-8 py-5 text-action font-medium uppercase leading-none tracking-eyebrow text-on-dark transition-colors duration-300 ease-soft hover:bg-primary/90 sm:w-auto"
        >
          Book a place
          <span
            aria-hidden
            className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
          >
            &#8594;
          </span>
        </Link>
      </div>
    </Reveal>
  );
}

/** One figure in the strip: a quiet label over a value set at lead size. */
function Stat({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-label font-medium uppercase tracking-eyebrow text-text/75">{term}</dt>
      <dd className="mt-2 text-lead font-medium leading-snug text-text">{children}</dd>
    </div>
  );
}

/** One masked line of the heading. The mask needs its own overflow parent. */
function HeadingLine({ children }: { children: string }) {
  return (
    <span className="block overflow-hidden pb-[0.12em] [&+span]:-mt-[0.12em]">
      <Reveal as="span" variant="maskUp" className={HEADING_LINE}>
        {children}
      </Reveal>
    </span>
  );
}

/**
 * The schedule — every date as the same split block.
 *
 * An ordered list, because soonest-first is the curation and the order is the
 * only thing telling a reader what "upcoming" means.
 */
function Schedule({ workshops }: { workshops: Workshop[] }) {
  if (workshops.length === 0) return <NoSessions />;

  return (
    <>
      {/*
        Every session gets the same block — photograph one side, booking panel
        the other, meeting on a single edge — and then the schedule is woven so
        that no two neighbours look alike.

        Three things do the weaving, and none of them is decoration for its own
        sake. The photograph changes sides, so the eye crosses the page instead
        of running straight down one column. The panel alternates between the
        two pale brand grounds, White Rock and Light Sage, which charcoal clears
        at better than 9:1 on either. And the blocks abut: the dead white bands
        between them are gone, replaced by a line of the Maison's own signage on
        Deep Lilac, which is the one saturated colour on the page and earns its
        place by appearing twice and nowhere else.

        The run reads cream / lilac / sage / lilac / cream — a rhythm rather
        than a list, which is what stops three equally weighted sessions
        feeling like a template.
      */}
      <ol className="mt-14 md:mt-20 lg:mt-24">
        {workshops.map((workshop, i) => (
          <li key={workshop.slug}>
            {i > 0 ? <Interlude>{INTERLUDES[(i - 1) % INTERLUDES.length]}</Interlude> : null}
            <WorkshopFeature
              workshop={workshop}
              index={ordinal(i + 1)}
              flip={i % 2 === 1}
              tone={i % 2 === 1 ? "sage" : "cream"}
            />
          </li>
        ))}
      </ol>

      <ViewAllLink className="mt-14 md:mt-20 md:flex md:justify-end" />
    </>
  );
}

/**
 * The lines between the events.
 *
 * Signage, not copy: they promise nothing the studio would have to honour and
 * state no fact the data does not already carry. Both are the section head's
 * own sentence said shorter, which is why they sound like the rest of the page
 * rather than like a slogan dropped between two listings.
 */
const INTERLUDES = ["come and make something", "bring only yourself"] as const;

/**
 * A full-bleed band of Charcoal Slate between two events.
 *
 * It exists because the alternative was a stripe of empty page. Three blocks
 * separated by white read as three things that happen to be near each other;
 * the same three separated by a solid ground read as one run.
 *
 * Charcoal rather than Deep Lilac, and rather than the watercolours that briefly
 * sat here. Both of those were working against the type: Light Sage on Deep
 * Lilac is 3.83:1 with nothing spare, and putting a painting underneath meant
 * a wash heavy enough to keep the words legible, tuned per breakpoint, for a
 * picture reduced to a 133px slice. Flat Charcoal gives the same words 9.07:1 and
 * gives the section a beat of silence between two pale blocks — which is what
 * an interlude is for.
 *
 * Nothing is laid over the ground, so there is no scrim to measure and no
 * crop that can drift.
 */
function Interlude({ children }: { children: string }) {
  return (
    <Reveal variant="fadeIn">
      <div className="-mx-gutter flex items-center justify-center bg-text px-gutter py-9 md:py-11 lg:py-12">
        <Signature ground="ink" className="text-center">
          {children}
        </Signature>
      </div>
    </Reveal>
  );
}

/**
 * Nothing scheduled. The section keeps its shape and says so plainly rather
 * than leaving the outline of a schedule with nothing in it.
 */
function NoSessions() {
  return (
    <Reveal className="mt-16 border-t border-line pt-12 md:mt-24 md:pt-16">
      <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em] md:text-[1.75rem]">
        The next dates are being set.
      </p>
      <p className="mt-5 max-w-[32rem] text-body leading-[1.85] text-text/75">
        New events are announced as each mall is confirmed. The full programme stays open to
        browse in the meantime.
      </p>
      <ViewAllLink className="mt-10" />
    </Reveal>
  );
}

/**
 * The way out of the section — a line of type, not a third call to action
 * competing with the ones on each session.
 */
function ViewAllLink({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link
        href="/events"
        className="group inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
      >
        <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
          See all upcoming events
        </span>
        <span
          aria-hidden
          className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    </div>
  );
}
