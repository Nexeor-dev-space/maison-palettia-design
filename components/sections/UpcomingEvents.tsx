import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { FilledAction } from "@/components/ui/Action";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { EventCard } from "@/components/workshops/EventCard";
import {
  bookSessionHref,
  formatPrice,
  getUpcomingWorkshops,
  isFullyBooked,
  sessionDateParts,
  spotsLabel,
} from "@/lib/workshops";
import type { Workshop } from "@/types";

/** The heading's id. One value, handed to both <Section> and <SectionHead>. */
const HEADING_ID = "upcoming-events-heading";

/**
 * Homepage — the schedule, and the page's commercial core.
 *
 * WHAT THIS SECTION LOOKED LIKE BEFORE. Each date was a split block: a
 * photograph running off one edge of the page against a filled booking panel
 * running off the other, the panels alternating White Rock and Light Sage down
 * the run, and between every pair a full-bleed band of Charcoal Slate carrying
 * a line of brand script. Three grounds, two bleeds and an interlude for what
 * is, underneath, a picture and five facts. It was composed, and it was the
 * loudest thing on a page whose whole redesign is about taking the furniture
 * out from between the reader and the content.
 *
 * WHAT IT IS NOW. The client asked for the reference's HEADLINES arrangement,
 * and the section adopts it wholesale: a two-column grid of events, each one a
 * landscape plate with a compact meta row and a title under it, sitting
 * directly on the page ground. No cards, no borders, no fills, no alternating
 * panels, no interlude bands. The one hairline left in the section is the rule
 * over the booking strip. <EventCard> carries the arrangement; this file
 * carries the head, the strip and the grid.
 *
 * THE COMMERCIAL SPINE SURVIVES THE RESTYLE, WHICH IS THE POINT. Losing the
 * panels must not mean losing the selling. So the booking strip stays exactly
 * where it was — above the list, where a price, a date and a seat count are
 * gathered in one place instead of being hunted for across three blocks — and
 * every figure in it is still read off the sessions below. Nothing in this
 * file is a string a designer typed: the count, the price, the date, the venue
 * and the seats are all computed, so the strip cannot say anything the
 * schedule does not.
 *
 * The one real change to the strip is its button, and it is a bug fix rather
 * than a restyle. The hand-rolled control here was `text-on-dark` — White Rock
 * — on Deep Lilac, which measures 3.95:1 against the 4.5:1 a 12px control
 * label owes. The site's single most important button was failing AA on the
 * one screen it appears. <FilledAction> sets white on Deep Lilac at 5.06:1.
 *
 * SOLD-OUT DATES ARE EXCLUDED FROM THE PITCH. "From AED 240" quoted off a date
 * nobody can book is the oldest trick in the listing business and is not one
 * this studio should run: the price, the date and the seats in the strip all
 * come from the soonest session a visitor could actually take, and a closed
 * card downstream says so in its own words. See <EventCard>.
 *
 * <WorkshopFeature> is no longer used here and nothing else imports it. It is
 * parked rather than deleted — see the note at the top of that file.
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

  const bookable = workshops.filter((workshop) => !isFullyBooked(workshop));
  // Soonest first out of `getUpcomingWorkshops`, so the head of the bookable
  // list is the next date anyone could actually take.
  const next = bookable[0];
  const cheapest = bookable.reduce<Workshop | null>(
    (low, workshop) => (!low || workshop.price.amount < low.price.amount ? workshop : low),
    null,
  );

  return (
    <Section id={HEADING_ID} ground="surface">
      {/*
        `stacked`, not `spread`, and this is the one head on the page that
        needs it.

        Measured at 1440 with the spread layout: the title column stood 83px
        and the side column 178px, because this section carries both a
        two-line authored title AND the longest standfirst on the page, which
        wraps to four lines. The grid row takes the taller of the two, so 96px
        of nothing opened under the heading, and with the section gap and the
        strip's own top padding that put 176px of dead air immediately above
        the booking strip — the one part of this page with something to sell.

        Every other spread head here pairs a one-line title with a short
        standfirst, so the same mechanic costs them 40px and nobody notices.
        This section is the outlier, so it takes the other layout rather than
        the page taking a new rule.
      */}
      <SectionHead
        id={HEADING_ID}
        layout="stacked"
        /*
          A state, not a boast — and only true while something can be booked.
          Computed from the data every render: with nothing bookable the label
          falls back to naming the section rather than advertising a counter
          that would be lying.

          IT COUNTS `bookable`, NOT `workshops`. It counted the whole list,
          which with today's data rendered "Now booking · 2 dates" directly
          above a grid whose second card says FULLY BOOKED. That is the one
          direction this section refuses to be wrong in: its own note further
          down records that quoting a price off a date nobody can book is "the
          oldest trick in the listing business and it is not one this studio
          should run", and the three figures in the strip already honour that.
          The eyebrow was the last thing that did not.
        */
        eyebrow={
          bookable.length > 0
            ? `Now booking · ${bookable.length} ${bookable.length === 1 ? "date" : "dates"}`
            : "Upcoming events"
        }
        /*
          The action first and the reward second, which is the order a headline
          sells in. Authored as two lines: <SectionHead> sets them block-level
          from `md` and lets them run inline below it, where a 390px screen
          cannot hold either line in caps at a section-heading size.
        */
        title={["Book your place.", "Take something home."]}
        /*
          TODO(client): confirm — "Every material provided — bring nothing but
          yourself." This is an operational promise to a paying customer rather
          than a design placeholder, and it appears in three places on the
          site. The flagged instance is the HOME_FAQ answer to "Do I need to
          bring anything?" in lib/constants.ts, which carries the same
          TODO(client): confirm and the note that it is the one claim about
          what the studio actually supplies. <HowItWorks> carries the third.
          Confirm or amend all three together; do not let them drift.
        */
        standfirst="Hands-on creative events at selected malls, on scheduled dates and at fixed times. Every material provided — bring nothing but yourself."
        action={{ label: "See all events", href: "/events" }}
      />

      {next && cheapest ? <BookingStrip next={next} cheapest={cheapest} /> : null}

      <Schedule workshops={workshops} />
    </Section>
  );
}

/**
 * The three numbers, and the action.
 *
 * A price, a date and a seat count — the whole of what someone weighs before
 * deciding to look closer, gathered above the list. It is the section's
 * commercial spine and it is deliberately the one piece of the old composition
 * that came through the redesign unchanged in substance.
 *
 * THE FIGURES ARE PLAIN CHARCOAL, AND THAT IS A MEASUREMENT. Warm Terracotta
 * is 3.02:1 on this ground — a graphical mark clears 3:1 there, but body-sized
 * text owes 4.5:1, so these numbers cannot take it. (The figure recorded here
 * before was 3.07:1 and was simply wrong; 3.02:1 is the measured value, and it
 * is the number THE ONE-ACCENT RULE at the top of app/globals.css is written
 * against.) Urgency that only exists for readers who can see a colour is not
 * urgency: "3 spots left" is doing the work, not the ink.
 *
 * THE REASSURANCE LINE MOVED HERE, and it is worth saying why. It was the
 * second paragraph of the section's standfirst. <SectionHead> carries one
 * standfirst, and rather than fold two paragraphs into one or rebuild the
 * head's grid by hand to slot a second one in, the sentence moved to the place
 * it actually does its work — directly under the button, which is the last
 * thing read before a click. Both objections it answers are plainly true:
 * checkout is guest-only with four fields, and there is no account to make
 * anywhere on the site. It also now correctly disappears along with the strip
 * when nothing is bookable, which is the only state in which a line about how
 * quick booking is would be beside the point.
 */
function BookingStrip({ next, cheapest }: { next: Workshop; cheapest: Workshop }) {
  const { weekday, day, month } = sessionDateParts(next.startsAt);

  return (
    <Reveal variant="fadeIn" className="mt-section-gap border-t border-line pt-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-10">
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
          The one filled action on the homepage, and the only one this section
          gets. It is wrapped rather than given its width directly for a
          reason: <FilledAction> ships `inline-flex`, and this row is a flex
          column below `md`, so the primitive would be stretched by the
          container's default `align-items: stretch` however its width utility
          was written — and `md:items-end` then makes any `self-*` correction
          wrong again at the next breakpoint. A plain block wrapper is the flex
          item, the button is inline-level inside it, and `w-full sm:w-auto`
          means what it says at every width with nothing to fight.
        */}
        <div className="shrink-0 sm:max-w-[18rem]">
          {/*
            THE BUTTON GOES TO THE DATE THE STRIP JUST DESCRIBED, not to the
            listing.

            It pointed at /events, which is where "See all events" above it
            goes and where the header's own action goes. That is the wrong
            promise in the wrong place: the three figures beside it name one
            specific session — its price, its date, its remaining seats — so
            someone clicking here has already chosen. Sending them back to a
            list to find it again asks them to make the same decision twice,
            at the exact point in the page where intent is highest.

            `next` is the soonest session anyone can actually book — the strip
            takes it from `bookable`, never from the whole list — so this can
            never open a closed date.
          */}
          <FilledAction
            label="Book a place"
            href={bookSessionHref(next)}
            className="w-full sm:w-auto"
          />
          <p className="mt-4 text-fine font-medium text-text">
            No account needed — booking takes two minutes.
          </p>
        </div>
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

/**
 * The schedule — the reference's two-column HEADLINES grid.
 *
 * An ordered list, because soonest-first is the curation and the order is the
 * only thing telling a reader what "upcoming" means. It also gives a screen
 * reader the count, which is the fact the eyebrow above is stating in words.
 *
 * TWO COLUMNS FROM `md`, ONE BELOW, AND NO COUNT-DEPENDENT ARRANGEMENT. The
 * grid is the same whether there are one, two or three dates, and each of the
 * three reads correctly:
 *
 *   one   — a single entry in the left column, half the measure, with air to
 *           its right. This is the reference's own behaviour and it reads as
 *           composition rather than as a gap, because the head and the booking
 *           strip above both run the full width and anchor the block.
 *   two   — the honest current count, and the arrangement the grid is drawn
 *           for: one row, two equal columns.
 *   three — two in the first row, one in the second, again flush left.
 *
 * The rejected alternative was widening a lone entry to the full measure. It
 * makes one date look like a featured item rather than like the whole
 * programme, and it means the section has two layouts to keep right instead of
 * one — for a state that only exists while the studio has a single date on
 * sale, which is exactly when it can least afford a layout bug.
 *
 * `getUpcomingWorkshops` caps at three, so the grid is never asked for a
 * fourth row; it would simply take one if the cap changed.
 *
 * One <Stagger> over the whole list rather than one per entry: the cards run
 * in sequence from a single trigger, and a <Reveal> inside each <EventCard>
 * detects the surrounding context through React context and stays passive. The
 * plain <li> in between is not a break in that chain.
 */
function Schedule({ workshops }: { workshops: Workshop[] }) {
  if (workshops.length === 0) return <NoSessions />;

  return (
    <Stagger
      as="ol"
      className="mt-section-gap grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 md:gap-y-16 lg:gap-x-10 lg:gap-y-20"
    >
      {workshops.map((workshop) => (
        <li key={workshop.slug}>
          <EventCard workshop={workshop} />
        </li>
      ))}
    </Stagger>
  );
}

/**
 * Nothing scheduled. The section keeps its shape and says so plainly rather
 * than leaving the outline of a schedule with nothing in it — the house
 * contract is to render nothing rather than to render a hole.
 *
 * No link out of this block. It used to carry its own "See all upcoming
 * events" line, which was the section's only route to /events; the section
 * head now carries "See all events" in every state, and a second anchor with
 * the same destination a few centimetres below it would be read out twice in a
 * list of links for no gain. The statement takes `text-h3` rather than the
 * hand-tuned `text-[1.5rem] md:text-[1.75rem]` it set before — see the note on
 * the shared type scale in <SectionHead>.
 */
function NoSessions() {
  return (
    <Reveal className="mt-section-gap border-t border-line pt-12">
      <p className="max-w-[30rem] text-h3 font-light text-text">The next dates are being set.</p>
      <p className="mt-5 max-w-[32rem] text-body text-text/75">
        New events are announced as each mall is confirmed. The full programme stays open to
        browse in the meantime.
      </p>
    </Reveal>
  );
}
