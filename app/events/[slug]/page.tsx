import Link from "next/link";
import { notFound } from "next/navigation";

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

  return (
    <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
      <Reveal>
        <Link
          href="/events"
          className="group inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text"
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
      <ReadyToJoin workshop={workshop} />
      {related.length > 0 ? <MoreEvents sessions={related} /> : null}
    </Container>
  );
}

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
  const closed = isFullyBooked(workshop);

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
          <p className="flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/75">
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
          <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-line pt-8">
            {workshop.venue ? (
              <Fact term="Where" wide>
                {workshop.venue.name}
                <Sub>{workshop.venue.locality}</Sub>
              </Fact>
            ) : null}

            <Fact term="Date">
              <time dateTime={workshop.startsAt}>{formatSessionDate(workshop.startsAt)}</time>
              <Sub>{weekday}</Sub>
            </Fact>

            <Fact term="Price">
              {formatPrice(workshop.price)}
              <Sub>per person</Sub>
            </Fact>
          </dl>

          {/*
            The fixed time, set larger than anything but the event's name.
            The studio's whole model is a table in a mall between two specific
            hours; this is the fact that says so.
          */}
          <div className="mt-8">
            <Term>Time</Term>
            <p className="mt-3 flex items-center gap-4 text-[1.6rem] font-light leading-none tracking-[-0.01em] text-text md:text-[1.9rem]">
              <span className="tabular-nums">{start}</span>
              <span aria-hidden className="h-px w-6 shrink-0 bg-text/30" />
              <span className="sr-only">to</span>
              <span className="tabular-nums">{end}</span>
            </p>
            <p className="mt-3 text-[0.85rem] text-text/75">
              <time dateTime={durationToIso(workshop.durationMinutes)}>
                {formatDuration(workshop.durationMinutes)}
              </time>
            </p>
          </div>

          <p className="mt-9 flex items-center gap-2.5 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text">
            {isScarce(workshop) ? (
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-terracotta" />
            ) : null}
            {spotsLabel(workshop)}
          </p>

          <BookCta workshop={workshop} closed={closed} />
        </Reveal>
      </div>
    </div>
  );
}

/**
 * The action, and the only filled block on the page.
 *
 * A full session gets a sentence and a way onward instead of a disabled
 * button. An action that cannot be taken is worse than an honest line, and a
 * visitor believing they have booked a closed date is the one unacceptable
 * outcome on this page.
 */
function BookCta({ workshop, closed }: { workshop: Workshop; closed: boolean }) {
  if (closed) {
    return (
      <div className="mt-9 border-t border-line pt-8">
        <p className="text-[0.95rem] leading-[1.8] text-text/80">
          This date is full. The other events below still have places.
        </p>
        <Link
          href="/events"
          className="group mt-6 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text"
        >
          <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
            See other dates
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

  return (
    <Link
      href={bookingStepHref(workshop)}
      className="group/cta mt-9 inline-flex w-full items-center justify-center gap-2.5 bg-primary px-8 py-5 text-[0.72rem] font-medium uppercase leading-none tracking-eyebrow text-white transition-colors duration-300 ease-soft hover:bg-primary/90 sm:w-auto"
    >
      Book this event
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover/cta:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
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
            className="text-[0.68rem] font-medium uppercase tracking-eyebrow text-text/75"
          >
            About the event
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
          <p className="max-w-[40rem] text-[1.05rem] font-light leading-[1.75] text-text md:text-[1.15rem]">
            {workshop.excerpt}
          </p>
          {workshop.venue ? (
            <p className="mt-8 max-w-[40rem] text-[0.95rem] leading-[1.85] text-text/80">
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
            className="text-[0.68rem] font-medium uppercase tracking-eyebrow text-text/75"
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

/**
 * The closing invitation.
 *
 * The facts are settled by the time anyone reaches the foot of this page, so
 * the last thing on it is one question and one action. Charcoal and full
 * measure, matching the way the About page ends — the two pages close the same
 * way because they are asking for the same thing.
 *
 * A full event closes with the honest version instead: there is nothing to
 * join, and saying so is better than a button that cannot be pressed.
 */
function ReadyToJoin({ workshop }: { workshop: Workshop }) {
  const closed = isFullyBooked(workshop);

  return (
    <section aria-labelledby="ready-to-join" className="mt-20 md:mt-28 lg:mt-32">
      <div className="-mx-gutter bg-text px-gutter py-14 text-cream md:py-20">
        <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <h2
              id="ready-to-join"
              className="text-[1.75rem] font-light uppercase leading-[1.05] tracking-[-0.02em] md:text-[2.4rem]"
            >
              {closed ? "This one is full." : "Ready to join us?"}
            </h2>
            <p className="mt-6 max-w-[30rem] text-[0.95rem] leading-[1.85] text-cream/80">
              {closed
                ? "Every place at this date has gone. The rest of the programme is open."
                : "Everything is provided. Bring nothing but yourself."}
            </p>
          </div>

          <div className="col-span-12 mt-9 lg:col-span-4 lg:col-start-9 lg:mt-0">
            {closed ? (
              <Link
                href="/events"
                className="group inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-cream"
              >
                <span className="border-b border-sage/60 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-sage">
                  See every upcoming event
                </span>
                <span
                  aria-hidden
                  className="text-sage transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                >
                  &#8594;
                </span>
              </Link>
            ) : (
              <Link
                href={bookingStepHref(workshop)}
                className="group inline-flex w-full items-center justify-center gap-2.5 bg-sage px-8 py-5 text-[0.72rem] font-medium uppercase leading-none tracking-eyebrow text-text transition-colors duration-300 ease-soft hover:bg-sage/85 sm:w-auto"
              >
                Book this event
                <span
                  aria-hidden
                  className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                >
                  &#8594;
                </span>
              </Link>
            )}
          </div>
        </div>
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
            className="text-[0.68rem] font-medium uppercase tracking-eyebrow text-text/75"
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
                  <p className="mt-5 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/75">
                    {session.category}
                  </p>
                  <h3 className="mt-2.5 text-[1.15rem] font-medium leading-snug tracking-[-0.01em]">
                    <Link
                      href={workshopHref(session)}
                      className="transition-colors duration-300 ease-soft after:absolute after:inset-0 hover:text-primary"
                    >
                      {session.title}
                    </Link>
                  </h3>
                  <p className="mt-2.5 text-[0.82rem] text-text/75">
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
    <span className="block text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/75">
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
      <div className="mt-3 text-[1.05rem] font-medium leading-snug text-text">{children}</div>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <span className="mt-1.5 block text-[0.85rem] font-normal text-text/75">{children}</span>;
}
