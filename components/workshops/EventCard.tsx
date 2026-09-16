import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { RuledLink } from "@/components/ui/Action";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import {
  bookSessionHref,
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  formatVenueLine,
  formatWorkshopDate,
  isFullyBooked,
  isScarce,
  sessionTimeRange,
  spotsLabel,
} from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * One event, in the reference's HEADLINES arrangement.
 *
 * WHAT THIS REPLACES. Every date on the homepage used to be a <WorkshopFeature>:
 * a split block, photograph against a filled panel, the two halves running off
 * opposite edges of the page, with the panels alternating White Rock and Light
 * Sage and a full-bleed Charcoal band of script between each pair. Three
 * sessions, three grounds, two bleeds and an interlude — a great deal of
 * furniture around what is, in the end, a picture and five facts.
 *
 * The client asked for the reference's HEADLINES arrangement instead, and this
 * is it: landscape plate on top, a compact meta row under it, then the title.
 * Nothing is drawn around any of it. No card, no border, no fill, no shadow,
 * no alternation — the photograph and the type sit directly on the page ground
 * and the whole hierarchy is made of picture, hairline and air. The reference's
 * WHAT'S ON section is the same arrangement carrying more metadata, which is
 * what our events need, so the facts run as three quiet lines under the title
 * rather than as a panel beside it.
 *
 * WHAT DID NOT GET DROPPED IN THE RESTYLE. This is the one section on the
 * homepage with something to sell, so the commercial content survives the
 * change of clothes intact: venue, date, the fixed start and finish, the
 * duration, the price, and what is left of the seats. Every one of those is
 * computed by a helper in lib/workshops.ts from the session's own data — there
 * is not a formatted string in this file, and there is nothing here that the
 * schedule does not say.
 *
 * ONE ANCHOR. The title is a stretched link covering the whole entry; the
 * "Book event" line beneath is a <RuledLink asSpan>, an aria-hidden picture of
 * an action rather than a second route to the same page. Two anchors per card
 * would put every event in the tab order twice and read it out twice in a list
 * of links, for nothing. See the note on <FilledAction> in components/ui/Action.tsx.
 *
 * Server component. Nothing here holds state; the hover behaviour is `group-*`
 * CSS and the reveal is the shared client primitive.
 */
export function EventCard({ workshop }: { workshop: Workshop }) {
  const closed = isFullyBooked(workshop);
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const on = formatSessionDate(workshop.startsAt);
  const where = workshop.venue ? ` at ${formatVenueLine(workshop.venue)}` : "";

  /*
    The accessible name, and the one thing in this component that must never
    be got wrong.

    A closed date still links through to its own page — see `bookSessionHref`
    — but the announcement must not promise a booking, because a visitor
    believing they have a seat on a date that has none is the single
    unacceptable outcome in this section. So the verb changes with the state,
    and "fully booked" is carried in the name itself rather than left to the
    marker further down the card, which a screen reader reaches only after
    following or passing the link.

    Both forms open with the session's own title, so the accessible name
    contains the visible label (WCAG 2.5.3) and voice control still works on
    the words a visitor can actually see.
  */
  const label = closed
    ? `${workshop.title}${where} on ${on} — fully booked`
    : `Book ${workshop.title}${where} on ${on}`;

  return (
    <Reveal as="article" className="group relative flex flex-col">
      {/*
        THE PLATE HAS A DEFINITE PROPORTION, AND THAT IS LOAD-BEARING RATHER
        THAN DECORATIVE.

        The block this replaces set `lg:aspect-auto lg:h-full` and took the
        photograph's height from the booking panel beside it through
        `items-stretch`. It looked identical and it was broken: a box whose
        height comes from a sibling has no definite size of its own when the
        browser first evaluates it, so next/image's lazy loader never fetched
        the file and the scroll observer never reported the element on screen.
        The plate stayed parked at the reveal variant's `opacity: 0` over a
        White Rock placeholder — the same colour as the panel next to it — and
        the result read as a deliberately empty half rather than as a missing
        picture, which is why it went unnoticed twice. The full account is in
        components/workshops/WorkshopFeature.tsx and in WorkshopPhoto.tsx.

        `aspect-[5/3]` at every width, so the size is definite before anything
        loads and neither the loader nor an observer has a sibling to wait on.
        5:3 is the reference's own crop (690x412 at 1440) and it is landscape
        at every breakpoint, which matters on a phone: the photograph sits
        directly between the heading and the first thing anyone can act on, and
        the client was specific that the booking information must not be behind
        a screenful of imagery.

        <WorkshopPhoto> is frozen and already correct — square corners, no
        border, nothing laid over it, and deliberately no reveal of its own.
      */}
      <figure>
        <WorkshopPhoto
          image={workshop.image}
          aspect="aspect-[5/3]"
          /*
            Two columns from `md`, one below. The gutter is `max(1.25rem, 2vw)`
            and the grid gap is 24px rising to 40px, which puts a column at
            45.8vw at 768 and 46.6vw at 1440 — 47vw covers both without ever
            asking for a file smaller than the slot.
          */
          sizes="(min-width: 768px) 47vw, 100vw"
        />
      </figure>

      {/*
        The meta row: category, a divider, the date. 16px under the plate,
        which is the reference's own gap between picture and type.

        The divider is a rule rather than a bullet or a pipe character. A "|"
        is a glyph and gets announced; this is a 1px mark that exists only to
        stop two unrelated labels reading as one phrase, so it is aria-hidden
        and the comma-free pair is separated for a screen reader by being two
        elements rather than by punctuation.
      */}
      <p className="mt-4 flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-text/75">
        <span>{workshop.category}</span>
        <span aria-hidden className="h-3.5 w-px shrink-0 bg-text/25" />
        {/* "Sun 11 Oct" — `formatWorkshopDate`, not assembled here. */}
        <time dateTime={workshop.startsAt}>{formatWorkshopDate(workshop.startsAt)}</time>
      </p>

      {/*
        The title, and the section's only anchor per card.

        `text-h3` at weight 500 in sentence case, per the type scale — the
        block this replaces set `text-[1.75rem] md:text-[2.1rem] lg:text-[2.25rem]`
        of its own, which is exactly the drift the shared scale exists to stop.
        The heading level is h3: the section's own h2 is the <SectionHead>.

        `after:absolute after:inset-0` stretches the link over the whole
        article — the photograph included, which is what makes the entry behave
        like the reference's single <a>. It works because the article is
        `relative`, and it covers the plate because a later positioned element
        paints above an earlier one. The affordance below is the exception, and
        it is the primitive's `pointer-events-none` that keeps it from becoming
        the one dead spot on the card.
      */}
      <h3 className="mt-3 text-h3 font-medium text-text">
        <Link
          href={bookSessionHref(workshop)}
          aria-label={label}
          className="transition-colors duration-300 ease-soft after:absolute after:inset-0 hover:text-primary group-focus-within:text-primary"
        >
          {workshop.title}
        </Link>
      </h3>

      {/*
        The facts, as three quiet lines rather than a labelled table.

        This is the WHAT'S ON extension of the HEADLINES pattern: place, then
        when, then what it costs, each on its own 13px line. A <dl> with
        "Where / When / Price" terms — which is what the split panel used, and
        what the listing page still uses — needs roughly twice the vertical
        space and turns a glanceable stack into a form. Here the values are
        self-describing: a mall name, a clock range and a price in AED are not
        ambiguous without a label over them.

        The venue is optional in the data and the line is simply absent when
        there is none. `lib/workshops.ts` makes that promise explicitly — the
        studio can ship without inventing a location — and this card keeps it
        rather than printing an empty row.
      */}
      <div className="mt-4 flex flex-col gap-1.5 text-fine text-text/75">
        {workshop.venue ? <p>{formatVenueLine(workshop.venue)}</p> : null}

        <p>
          <span className="tabular-nums">{start}</span>
          <span aria-hidden> &ndash; </span>
          <span className="sr-only">to</span>
          <span className="tabular-nums">{end}</span>
          <span aria-hidden className="px-1.5 text-text/35">
            &middot;
          </span>
          <time dateTime={durationToIso(workshop.durationMinutes)}>
            {formatDuration(workshop.durationMinutes)}
          </time>
        </p>

        <p>{formatPrice(workshop.price)} per person</p>
      </div>

      <Availability workshop={workshop} closed={closed} />
      <Affordance closed={closed} />
    </Reveal>
  );
}

/**
 * What is left, said only when it is worth saying.
 *
 * A comfortably open date stays silent. Scarcity reads as scarcity precisely
 * because it is rare on the page, and "9 spots available" printed under every
 * entry is a listing nagging at a reader who has not yet decided to care. A
 * closed date is the other end of the same rule: it always speaks, because
 * silence there would leave the card looking bookable.
 *
 * Full-strength charcoal in both cases — 11.61:1 on the page ground. The words
 * carry the meaning; nothing here is legible only to a reader who can
 * distinguish a colour.
 *
 * The dot is the one place Warm Terracotta survives on this homepage. It is a
 * 6px graphical mark owing 3:1 and it measures 3.02:1 on the page ground,
 * which it clears — and only here, because it is 2.44:1 on White Rock and
 * 2.36:1 on Light Sage, which is why THE ONE-ACCENT RULE at the top of
 * app/globals.css takes it off every other surface. This section is `surface`
 * and cannot move to another ground without this mark moving with it.
 */
function Availability({ workshop, closed }: { workshop: Workshop; closed: boolean }) {
  const scarce = isScarce(workshop);
  if (!scarce && !closed) return null;

  return (
    <p className="mt-5 flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text">
      {scarce ? (
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-terracotta" />
      ) : null}
      {spotsLabel(workshop)}
    </p>
  );
}

/**
 * The picture of the action — never the action itself.
 *
 * A <RuledLink asSpan>: the same charcoal label over the same Deep Lilac rule
 * as every other ruled link on the page, rendered as an aria-hidden <span>
 * with no destination and no hit area. The destination is the title above it,
 * stretched over the entire card.
 *
 * `self-start` is not optional. Neither action primitive sets a width, so
 * inside this `flex flex-col` the span would stretch to the full column and
 * hang its rule across the whole card.
 *
 * THE WORD CHANGES WHEN THE DATE CLOSES, and the reason is the same one that
 * governs the aria-label. A closed session still has a page worth reading — the
 * full description, the venue, the other dates — so the card keeps its link;
 * what it must not keep is anything that says "book". Offering "Book event" on
 * a date with no seats is the failure this section is least allowed to have,
 * so the affordance states what pressing it actually does. "View event" is the
 * site's own existing wording for this, from <EventIndexEntry> on the listing
 * page. (`workshopActionLabel` in lib/workshops.ts returns the same idea but
 * spelled "workshop"; everything visitor-facing on this site says event — see
 * the NAMING note on `workshopHref` — so the public word is used here.)
 */
function Affordance({ closed }: { closed: boolean }) {
  return (
    <RuledLink asSpan label={closed ? "View event" : "Book event"} className="mt-6 self-start" />
  );
}
