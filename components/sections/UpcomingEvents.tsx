import Link from "next/link";

import { SessionShowcase } from "@/components/events/SessionShowcase";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { getUpcomingWorkshops, isFullyBooked } from "@/lib/workshops";

/**
 * The heading. A step below the brand statement above it: that section makes
 * the argument, this one opens the schedule.
 */
const HEADING_LINE =
  "block font-light uppercase leading-[0.98] tracking-[-0.02em] " +
  "text-[2rem] xs:text-[2.4rem] sm:text-[2.9rem] md:text-[2.6rem] lg:text-[3.25rem] xl:text-[3.75rem]";

/**
 * Homepage section 03 — the sessions you can book.
 *
 * A LEAD AND A LIST, which is the third arrangement this section has had and
 * the first with a hierarchy in it.
 *
 * It was a carousel — one session at a time behind arrows, a posture of
 * browsing that handed the visitor whichever date the component stopped on.
 * That was replaced by a grid of equal tiles, which fixed the real problem:
 * choosing a date is a comparison, and a comparison needs the options in view
 * at once. What the grid could not do is say which one matters. Three
 * identical tiles say "here are three things".
 *
 * Now the soonest session takes a large card and the rest are rows stacked
 * beside it — see <SessionShowcase>, and the note there on what that borrows
 * from the reference the client pointed at and what it deliberately does not.
 * Everything is still in view at once; the difference is that the next date
 * leads instead of merely coming first.
 *
 * THE GRID ADAPTS TO HOW MANY DATES THERE ARE, because today there are two.
 * Three columns holding two tiles is a hole in the page, and a layout that
 * only looks composed once the studio has published six sessions is a layout
 * that looks broken until then. Two dates set two half-width tiles; three or
 * more move to thirds. Same rule <MallPartners> follows for the same reason.
 *
 * THE HEAD SELLS AND THEN GETS OUT OF THE WAY. Three lines: the state, the
 * promise, and one sentence. The way out of the section sits up in that head
 * row rather than under the grid — a reader who wants the whole programme
 * rather than these dates should not have to scroll the dates first to find
 * out there are more.
 *
 * ONLY WHAT CAN BE BOOKED ONLINE IS HERE. The studio runs scheduled sessions
 * and walk-in DIY activities, and this section is for the first kind — see
 * `kind` on {@link Workshop}. The filter is here rather than in the data layer
 * on purpose: /events still lists everything, because a walk-in activity still
 * has a page worth reading.
 *
 * Server component throughout, and there is no client half any more: a grid of
 * links needs no state, so nothing in this section ships JavaScript.
 *
 * Awaited in place rather than wrapped in <Suspense>: a boundary streams its
 * content at the end of the document and swaps it in with a script, which
 * leaves a visitor without JavaScript holding the skeleton for good. The root
 * layout works hard to avoid exactly that.
 */
export async function UpcomingEvents() {
  const workshops = await getUpcomingWorkshops();
  const sessions = workshops.filter((workshop) => workshop.kind !== "diy");
  const bookable = sessions.some((workshop) => !isFullyBooked(workshop));

  return (
    <section
      aria-labelledby="upcoming-events-heading"
      className="bg-surface py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <SectionHead bookable={bookable} />

        {sessions.length === 0 ? (
          <NoSessions />
        ) : (
          <Reveal variant="fadeIn">
            <SessionShowcase sessions={sessions} />
          </Reveal>
        )}
      </Container>
    </section>
  );
}

/**
 * Three lines, and then the sessions.
 *
 * The eyebrow is a state rather than a boast, and it is only true while
 * something can actually be booked — a section of sold-out dates says
 * "Upcoming sessions" instead. The heading is the action and the reward, in
 * that order, because that is the order a headline sells in. The sentence
 * under it is one sentence: anything longer is a paragraph standing between a
 * visitor and the photograph that is doing the persuading.
 *
 * All three stack in one column. The sentence used to sit in its own column to
 * the right of the heading, which read as a caption on the heading rather than
 * as the line that follows it — and left the eye crossing a gap to find the
 * thing it was meant to read next.
 */
function SectionHead({ bookable }: { bookable: boolean }) {
  return (
    <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
      <div className="col-span-12 md:col-span-8 lg:col-span-7">
        <Reveal>
          <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
            <span
              aria-hidden
              className="h-px w-9 shrink-0 bg-terracotta md:w-12"
            />
            {bookable ? "Now booking" : "Upcoming sessions"}
          </p>
        </Reveal>

        <h2 id="upcoming-events-heading" className="mt-8 md:mt-11 lg:mt-14">
          {/*
            Two lines, one trigger, each rising from behind its own mask — the
            same device as the brand statement, at a smaller scale. The explicit
            space keeps the accessible name reading as a sentence.

            Both stay short enough to hold one line at every width: a wrap
            inside a masked line would double its height and break the run
            against the line beneath it.
          */}
          <Stagger>
            <HeadingLine>Make something.</HeadingLine>{" "}
            <HeadingLine>Take it home.</HeadingLine>
          </Stagger>
        </h2>

        <Reveal delay={0.2}>
          <p className="mt-7 max-w-[32rem] text-body leading-[1.85] text-text/80 md:mt-8">
            Join us for a hands-on creative session and make something worth
            taking home.
          </p>
        </Reveal>
      </div>

      {/*
        The way to the whole programme, level with the foot of the heading
        block rather than under the grid. This is the one thing the ticketing
        listings get unarguably right about a section head: "Show all" belongs
        beside the title, where someone who wants the full schedule finds it
        before they have scanned a partial one.
      */}
      <Reveal
        delay={0.3}
        className="col-span-12 md:col-span-4 md:col-start-9 md:justify-self-end md:pb-2"
      >
        <ViewAllLink />
      </Reveal>
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
 * Nothing scheduled. The section keeps its shape and says so plainly rather
 * than leaving the outline of a schedule with nothing in it.
 */
function NoSessions() {
  return (
    <Reveal className="mt-16 border-t border-line pt-12 md:mt-24 md:pt-16">
      <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em]">
        The next dates are being set.
      </p>
      <p className="mt-5 max-w-[32rem] text-body leading-[1.85] text-text/75">
        New sessions are announced as each mall is confirmed. The full programme
        stays open to browse in the meantime.
      </p>
      <ViewAllLink className="mt-10" />
    </Reveal>
  );
}

/**
 * The way out of the section — a line of type, not a second call to action
 * competing with the one on the slide.
 */
function ViewAllLink({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link
        href="/events"
        className="group inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
      >
        {/*
          Lilac, not terracotta, and measured rather than chosen. On this
          ground the rule was `terracotta/50` at 1.65:1 and the arrow was
          terracotta at 2.88:1 — an underline is what makes a label read as a
          link, so it owes 3:1, and neither cleared it. Terracotta does not
          clear 3:1 on any of the site's light grounds at any opacity; Deep
          Lilac does at full strength. Same substitution, same reason, as
          <AboutTeaser>.
        */}
        <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
          See all upcoming sessions
        </span>
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    </div>
  );
}
