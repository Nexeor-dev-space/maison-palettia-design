import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { EventHeadline } from "@/components/workshops/EventHeadline";
import { getUpcomingWorkshops, isFullyBooked } from "@/lib/workshops";

/**
 * The heading. A step below the brand statement above it: that section makes
 * the argument, this one opens the schedule.
 */
const HEADING_LINE =
  "block font-light uppercase leading-[0.98] tracking-[-0.02em] " +
  "text-[2rem] xs:text-[2.4rem] sm:text-[2.9rem] md:text-[2.6rem] lg:text-[3.25rem] xl:text-[3.75rem]";

/**
 * Rendered width of one item at each breakpoint, so the browser fetches one
 * size and not three.
 *
 * Honest at both ends. Above `md` the grid is two columns inside the site
 * gutter, which lands each item at a touch under half the window — 48vw. Below
 * it there is one column and the item is the measure itself, 94vw at 390px
 * once `--spacing-gutter` has taken its 12px off each side.
 *
 * Spelled out in full rather than assembled, because <ParallaxPlate> cuts the
 * picture 16% taller than its frame: the extra height is covered by scaling
 * the same width up, so an under-stated `sizes` here shows as a soft
 * photograph rather than as a layout fault.
 */
const ITEM_SIZES = "(min-width: 768px) 48vw, 94vw";

/**
 * Homepage section 03 — the sessions you can book.
 *
 * ==========================================================================
 * REDESIGNED ON THE REFERENCE'S "HEADLINES" SECTION, LAYOUT AND MOTION BOTH
 * ==========================================================================
 *
 * The client asked for this section to take the arrangement AND the scrolling
 * animation of goodman-gallery.com's Headlines block. That block is a
 * two-column grid of 690px items, each a landscape photograph over a 12px meta
 * row and a title, sitting directly on the page ground — no card, no border,
 * no fill, no shadow — with the images drifting against the page as it
 * scrolls. Both halves of that are here: the arrangement in <EventHeadline>,
 * the drift in <ParallaxPlate>, which the site already ran on the editorial
 * spreads and the experience index.
 *
 * WHAT IT REPLACES. The previous pass ran <SessionShowcase> — one large lead
 * session with the remaining dates stacked beside it as small rows, the lead's
 * type set on a Light Sage panel. That composition answered a different
 * question ("which of these matters?") and answered it with furniture: a
 * coloured panel under one item and a rule between the others. The client's
 * note is that the weight of this section should be the photograph plus air,
 * and a panel is neither. So every date now gets the same frame at the same
 * size, and the hierarchy it loses is the hierarchy the reference deliberately
 * does without — a schedule is a set of alternatives, not a lead story.
 * <SessionShowcase> is left in the tree, unimported, rather than deleted; it
 * is the /events listing's nearest relative if that page ever wants it.
 *
 * THE GRID IS TWO COLUMNS FROM `md` AND ONE BELOW, AND IT DOES NOT ADAPT TO
 * THE COUNT. That is a reversal of what this file used to do, and it is the
 * right reversal here. The old grid widened its tiles when there were only two
 * dates, because a tile was a coloured block and a half-empty row of blocks
 * reads as a fault. An item in this arrangement is a photograph at a fixed
 * proportion, and widening it to the full measure would stand it 864px tall on
 * a 1440 window — one session filling a screen and a half, which is the same
 * mistake the events index already corrected when it cut its portrait plate.
 * So one date sits in the left column at its designed size with air beside it,
 * and three fill a row and start a second. The reference's own Exhibitions
 * block makes exactly this argument: the empty half IS the effect.
 *
 * ONLY WHAT CAN BE BOOKED ONLINE IS HERE. The studio runs scheduled sessions
 * and walk-in DIY activities, and this section is for the first kind — see
 * `kind` on {@link Workshop}. The filter is here rather than in the data layer
 * on purpose: /events still lists everything, because a walk-in activity still
 * has a page worth reading.
 *
 * NOTHING IN THIS SECTION IS A LITERAL. Every date, time, duration and price
 * comes out of `lib/workshops.ts`, and so does the eyebrow: the section says
 * "Now booking" only while something in it can actually be booked, and a
 * schedule of sold-out dates says "Upcoming sessions" instead. There is
 * deliberately no "from AED x" or "next date" line in the head — the only way
 * to write one honestly is to exclude the full dates from it, and a summary
 * that has to be audited against the grid beneath it is a summary waiting to
 * lie. The grid states every price itself.
 *
 * Server component throughout. The only JavaScript the section ships is the
 * head's reveals and one <ParallaxPlate> per photograph.
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
          /*
            A list, and typed as one: these are dates in date order, which is
            what `<ol>` means, and it gives a screen reader the count before
            the first item rather than after the last.

            NO <Reveal> AROUND ANY OF IT, WHICH IS A CHANGE. The grid used to
            sit inside a `fadeIn`, so the whole schedule started at `opacity:
            0` on the server and waited for an IntersectionObserver to raise
            it. <WorkshopPhoto> carries the note on what that costs when the
            observer does not fire — and the thing at stake here is not a
            flourish, it is every bookable date on the homepage. The parallax
            is the section's motion now, and it is tied to scroll position:
            there is no state in which it can leave content invisible.

            The vertical gap is the generous one the reference uses; the
            horizontal gap is the site's own grid gutter, so the two columns
            line up with every other grid on the page.
          */
          <ol className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 md:mt-20 md:grid-cols-2 md:gap-y-20 lg:gap-x-10">
            {sessions.map((workshop) => (
              <li key={workshop.slug}>
                <EventHeadline workshop={workshop} sizes={ITEM_SIZES} />
              </li>
            ))}
          </ol>
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
 *
 * THE WAY OUT SITS ON THE FIRST LINE, NOT THE LAST. The reference hangs a
 * small "See All" at the top right of the section, level with the head, and
 * that is the one thing every listing gets unarguably right: someone who wants
 * the whole programme rather than these dates should find that out before they
 * have scanned a partial schedule. It used to sit level with the FOOT of the
 * heading block, which is the bottom of a three-line stack — most of a
 * viewport below the line it is meant to answer. `items-start` puts the two on
 * the same 12px line; the `-mt-1.5` takes back the link's own vertical padding
 * so the two baselines agree rather than the two boxes.
 */
function SectionHead({ bookable }: { bookable: boolean }) {
  return (
    <div className="grid grid-cols-12 items-start gap-x-6 gap-y-8 lg:gap-x-10">
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

      <Reveal
        delay={0.3}
        className="col-span-12 md:col-span-4 md:col-start-9 md:-mt-1.5 md:justify-self-end"
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
    <Reveal className="mt-16 md:mt-24">
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
 * competing with the dates.
 *
 * NOT THE REFERENCE'S BORDERED PILL, and that is a contrast decision rather
 * than a stylistic one. A border around a label is a graphical mark and owes
 * 3:1, which `border-line` does not clear on this ground; drawing it in Deep
 * Lilac to make it legal would put the only outlined box in a section whose
 * whole brief is that nothing is boxed. The rule under the label does the same
 * work — it is what makes a label read as a link — at a fraction of the weight.
 *
 * The colour is measured, not chosen. This was `terracotta/50` at 1.65:1 with a
 * terracotta arrow at 2.88:1, and neither cleared the 3:1 an underline owes.
 * Terracotta clears it on none of the site's light grounds at any opacity; Deep
 * Lilac does at full strength. Same substitution, same reason, as <AboutTeaser>.
 */
function ViewAllLink({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link
        href="/events"
        /*
          The pseudo-element is how this codebase buys a 44px target without
          disturbing the layout: the label's own box is about 32px tall, and
          `-inset-y-3` takes it to 56 without moving a pixel of type. It needs
          the `relative` on the anchor to resolve against, and nothing else in
          the head is positioned, so it cannot swallow a neighbour.
        */
        className="group relative -my-1.5 inline-flex items-center gap-3 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
      >
        <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
          See all events
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
