import Link from "next/link";
import { notFound } from "next/navigation";

import { EventBookingBar } from "@/components/booking/EventBookingBar";
import { PageUtilityBar } from "@/components/layout/PageUtilityBar";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import { buildMetadata } from "@/lib/seo";
import {
  bookingStepHref,
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  formatVenueLine,
  getAllWorkshops,
  getRelatedWorkshops,
  getWorkshopBySlug,
  isFullyBooked,
  isScarce,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * One session — step two of the journey, and the page where someone decides.
 *
 * This route did not exist. `workshopHref()` has always returned
 * `/workshops/{slug}` and every session on the site linked to it, so every one
 * of those links answered 404.
 *
 * The page is built around the facts and nothing else: what it is, where, when,
 * how long, what it costs, how many places are left. There is no gallery and
 * no second description because THE DATA HAS NEITHER — the model carries one
 * `excerpt` of a sentence or two and a single image. The brief's "What you'll
 * create", "What to expect" and "What's included" sections are not here for
 * that reason: rendering empty headings, or writing the copy myself, would
 * both be worse than leaving them out until the studio writes them.
 *
 * Statically generated from the same seam as the listing, so connecting a CMS
 * lights up every session page without touching this file.
 */
export async function generateStaticParams() {
  const workshops = await getAllWorkshops();
  return workshops.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);

  if (!workshop) {
    return buildMetadata({ title: "Event not found", description: "", path: "/events" });
  }

  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const where = workshop.venue ? ` at ${formatVenueLine(workshop.venue)}` : "";

  return buildMetadata({
    title: workshop.title,
    // The facts a search result should carry, in the order someone scanning
    // results actually reads them.
    description: `${workshop.category} event on ${formatSessionDate(workshop.startsAt)}${where}. ${start} – ${end}, ${formatPrice(workshop.price)}.`,
    path: workshopHref(workshop),
    image: workshop.image.src,
  });
}

export default async function SessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);

  if (!workshop) notFound();

  const related = await getRelatedWorkshops(slug);
  const barTime = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);

  return (
    <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
      <Reveal>
        <Link
          href="/events"
          className="group inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
        >
          <span
            aria-hidden
            className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-x-1"
          >
            &#8592;
          </span>
          <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
            All events
          </span>
        </Link>
      </Reveal>

      <SessionHero workshop={workshop} />
      <About workshop={workshop} />
      <Gallery workshop={workshop} />
      {related.length > 0 ? <MoreEvents sessions={related} /> : null}

      {/*
        The bar's own height, given back to the page. Without it the last
        section sits under the bar for as long as the bar is up, which is the
        whole way down the page.
      */}
      <div aria-hidden className="h-24 md:h-28" />

      {/*
        The end of the content. <EventBookingBar> watches this and stands down
        when it arrives, so the bar is gone before the page starts uncovering
        the fixed footer behind it — see <FooterReveal>.
      */}
      <div id={CONTENT_END} aria-hidden />

      {/*
        Placed after the sentinel on purpose: by the time this is on screen the
        booking bar has already stood down, so the two can never be visible at
        once and nothing here competes with the page's one primary action.
        Every link is an existing route — see <PageUtilityBar>.
      */}
      <PageUtilityBar
        note="Everything is provided, and no experience is needed. If something is unclear, ask before you book."
        links={[
          { label: "All events", href: "/events" },
          { label: "Questions", href: "/faq" },
          { label: "Contact", href: "/contact" },
        ]}
      />

      {/*
        Every value resolved here, on the server, and handed down as strings.
        <EventBookingBar> is a client component and this module carries the
        session catalogue as well as the helpers — importing it there to borrow
        a formatter would ship the catalogue to the browser.
      */}
      <EventBookingBar
        title={workshop.title}
        bookingHref={bookingStepHref(workshop)}
        startsAt={workshop.startsAt}
        dateLabel={formatSessionDate(workshop.startsAt)}
        startLabel={barTime.start}
        endLabel={barTime.end}
        venueName={workshop.venue?.name}
        priceLabel={formatPrice(workshop.price)}
        spotsLabel={spotsLabel(workshop)}
        closed={isFullyBooked(workshop)}
        scarce={isScarce(workshop)}
        sentinelId={CONTENT_END}
      />
    </Container>
  );
}

/** Ties the sentinel to the bar that observes it. */
const CONTENT_END = "event-content-end";

/**
 * The split that carries the decision: the making on one side, everything
 * needed to act on it on the other.
 *
 * The same anatomy as the homepage block, at the scale of a page — which is
 * the point. Someone arriving here from the homepage or the index is reading
 * their third variation of one layout, and should not have to learn it again.
 */
function SessionHero({ workshop }: { workshop: Workshop }) {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);

  return (
    <div className="mt-10 grid grid-cols-12 items-start gap-x-6 md:mt-14 lg:mt-16 lg:gap-x-10">
      <figure className="col-span-12 -mx-gutter lg:col-span-7 lg:-ml-gutter lg:mr-0">
        <WorkshopPhoto
          image={workshop.image}
          aspect="aspect-[4/3] sm:aspect-[3/2]"
          sizes="(min-width: 1024px) 60vw, 100vw"
        />
      </figure>

      <div className="col-span-12 mt-10 lg:col-span-5 lg:mt-0">
        <Reveal>
          <p className="flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-text/75">
            <span aria-hidden className="h-px w-6 shrink-0 bg-terracotta" />
            {workshop.category}
          </p>
        </Reveal>

        <h1 className="mt-5">
          <Stagger>
            <Reveal
              as="span"
              variant="maskUp"
              className="block pb-[0.08em] text-[2rem] font-light leading-[1.08] tracking-[-0.02em] sm:text-[2.5rem] lg:text-[2.9rem]"
            >
              {workshop.title}
            </Reveal>
          </Stagger>
        </h1>

        <Reveal delay={0.15}>
          {/*
            When, first and largest. The order is the order someone decides in
            — what it is, then whether they are free, then where it is and what
            it costs — and it was not that before: the venue led, the date sat
            in a column beside the price, and the time, which is the fact the
            studio's whole model turns on, came after all of them.
          */}
          <div className="mt-9 border-t border-line pt-8">
            <Term>When</Term>
            <p className="mt-3 text-lead font-medium leading-snug text-text">
              <time dateTime={workshop.startsAt}>{formatSessionDate(workshop.startsAt)}</time>
              <Sub>{weekday}</Sub>
            </p>
            <p className="mt-4 flex items-center gap-4 text-[1.6rem] font-light leading-none tracking-[-0.01em] text-text md:text-[1.9rem]">
              <span className="tabular-nums">{start}</span>
              <span aria-hidden className="h-px w-6 shrink-0 bg-text/30" />
              <span className="sr-only">to</span>
              <span className="tabular-nums">{end}</span>
            </p>
            <p className="mt-3 text-fine text-text/75">
              <time dateTime={durationToIso(workshop.durationMinutes)}>
                {formatDuration(workshop.durationMinutes)}
              </time>
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-line pt-8">
            {workshop.venue ? (
              <Fact term="Where">
                {workshop.venue.name}
                <Sub>{workshop.venue.locality}</Sub>
              </Fact>
            ) : null}

            <Fact term="Price">
              {formatPrice(workshop.price)}
              <Sub>per person</Sub>
            </Fact>
          </dl>

          {/*
            Availability as the existing data states it, and only as it states
            it. `spotsLabel` and `isScarce` are the listing's own reading of
            `seatsAvailable`; nothing here counts down, and nothing is dressed
            up as urgency the data does not support.
          */}
          <p className="mt-8 flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text">
            {isScarce(workshop) ? (
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-terracotta" />
            ) : null}
            {spotsLabel(workshop)}
          </p>

        </Reveal>
      </div>
    </div>
  );
}

/**
 * What the session is.
 *
 * One section, because the data holds one paragraph. The location repeats here
 * in prose rather than being a second panel of the same facts — a visitor deep
 * in the page should not have to scroll back up to remember which mall.
 */
function About({ workshop }: { workshop: Workshop }) {
  return (
    <section aria-labelledby="about-event" className="mt-20 md:mt-28 lg:mt-32">
      <div className="grid grid-cols-12 gap-x-6 border-t border-line pt-10 md:pt-14 lg:gap-x-10">
        <Reveal className="col-span-12 md:col-span-3">
          <h2
            id="about-event"
            className="text-label font-medium uppercase tracking-eyebrow text-text/75"
          >
            About the event
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
          <p className="max-w-[40rem] text-lead font-light leading-[1.75] text-text md:text-lead">
            {workshop.excerpt}
          </p>
          {workshop.venue ? (
            <p className="mt-8 max-w-[40rem] text-body leading-[1.85] text-text/80">
              We set up at {workshop.venue.name} in {workshop.venue.locality}. Everything you
              need is on the table when you arrive.
            </p>
          ) : null}
          {/*
            TODO(client): the model carries one `excerpt` and nothing longer.
            A full description, what you will make, what is provided and who is
            leading the event are all worth adding — each becomes a section
            here, and each stays out until there is something real to put in it.
          */}
        </Reveal>
      </div>
    </section>
  );
}

/**
 * The atmosphere, where there is any to show.
 *
 * Renders nothing at all unless the event carries extra photographs. An empty
 * "Gallery" heading, or one filled with images borrowed from another event, is
 * worse than no section — see `gallery` on the Workshop type.
 */
function Gallery({ workshop }: { workshop: Workshop }) {
  const plates = workshop.gallery ?? [];
  if (plates.length === 0) return null;

  return (
    <section aria-labelledby="event-gallery" className="mt-20 md:mt-28 lg:mt-32">
      <div className="border-t border-line pt-10 md:pt-14">
        <Reveal>
          <h2
            id="event-gallery"
            className="text-label font-medium uppercase tracking-eyebrow text-text/75"
          >
            From the studio
          </h2>
        </Reveal>

        <ul className="mt-10 grid grid-cols-12 gap-x-6 gap-y-10 lg:gap-x-10">
          {plates.map((plate, i) => (
            <li
              key={plate.src}
              className={i === 0 ? "col-span-12 lg:col-span-7" : "col-span-12 sm:col-span-6 lg:col-span-5 lg:mt-16"}
            >
              <Reveal>
                <WorkshopPhoto
                  image={plate}
                  aspect={i === 0 ? "aspect-[3/2]" : "aspect-[4/5]"}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** A restrained way onward — two other dates, not a second listing. */
function MoreEvents({ sessions }: { sessions: Workshop[] }) {
  return (
    <section aria-labelledby="more-events" className="mt-20 md:mt-28 lg:mt-32">
      <div className="border-t border-line pt-10 md:pt-14">
        <Reveal>
          <h2
            id="more-events"
            className="text-label font-medium uppercase tracking-eyebrow text-text/75"
          >
            More events
          </h2>
        </Reveal>

        <ul className="mt-10 grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          {sessions.map((session) => {
            const { start } = sessionTimeRange(session.startsAt, session.durationMinutes);
            return (
              <li key={session.slug} className="group col-span-12 md:col-span-6 lg:col-span-5">
                <article className="relative">
                  <WorkshopPhoto
                    image={session.image}
                    aspect="aspect-[3/2]"
                    sizes="(min-width: 1024px) 40vw, (min-width: 768px) 46vw, 100vw"
                  />
                  <p className="mt-5 text-label font-medium uppercase tracking-eyebrow text-text/75">
                    {session.category}
                  </p>
                  <h3 className="mt-2.5 text-lead font-medium leading-snug tracking-[-0.01em]">
                    <Link
                      href={workshopHref(session)}
                      className="transition-colors duration-300 ease-soft after:absolute after:inset-0 hover:text-primary"
                    >
                      {session.title}
                    </Link>
                  </h3>
                  <p className="mt-2.5 text-fine text-text/75">
                    {session.venue ? `${session.venue.name} · ` : ""}
                    <time dateTime={session.startsAt}>
                      {formatSessionDate(session.startsAt)}
                    </time>
                    , {start}
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Term({ children }: { children: string }) {
  return (
    <span className="block text-label font-medium uppercase tracking-eyebrow text-text/75">
      {children}
    </span>
  );
}

function Fact({
  term,
  children,
  wide = false,
}: {
  term: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <Term>{term}</Term>
      <div className="mt-3 text-lead font-medium leading-snug text-text">{children}</div>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <span className="mt-1.5 block text-fine font-normal text-text/75">{children}</span>;
}
