import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingForm } from "@/components/booking/BookingForm";
import { Steps } from "@/components/booking/Steps";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import {
  formatDuration,
  formatPrice,
  formatSessionDate,
  getAllWorkshops,
  getWorkshopBySlug,
  isFullyBooked,
  sessionDateParts,
  sessionTimeRange,
  workshopHref,
} from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * Step three — reserve.
 *
 * The session is already chosen, so the page is deliberately narrow: a
 * reminder of what was picked, how many places, and who is coming. Nothing
 * else competes for attention, which is why there is no related-sessions rail
 * and no second photograph.
 *
 * A full session never reaches this page: the route sends it back to the
 * session itself rather than rendering a form that cannot be honoured.
 */
export async function generateStaticParams() {
  const workshops = await getAllWorkshops();
  return workshops.filter((w) => !isFullyBooked(w)).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);
  return buildMetadata({
    title: workshop ? `Book — ${workshop.title}` : "Book an event",
    description: "Reserve your place at a Maison Palettia event.",
    path: `/workshops/${slug}/book`,
  });
}

export default async function BookSessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);

  if (!workshop) notFound();
  if (isFullyBooked(workshop)) notFound();

  return (
    <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
      <Reveal>
        <Link
          href={workshopHref(workshop)}
          className="group inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-text"
        >
          <span
            aria-hidden
            className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-x-1"
          >
            &#8592;
          </span>
          <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
            Back to the session
          </span>
        </Link>
      </Reveal>

      <Steps current={1} />

      <div className="mt-12 grid grid-cols-12 gap-x-6 md:mt-16 lg:gap-x-10">
        {/*
          The summary sits first in the DOM so a phone shows what is being
          booked before asking for anything, and moves to the right-hand column
          at `lg` where a form reads better on the left.
        */}
        <aside className="col-span-12 lg:col-span-4 lg:col-start-9 lg:row-start-1">
          <SessionSummary workshop={workshop} />
        </aside>

        <div className="col-span-12 mt-12 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:mt-0">
          <Reveal>
            <h1 className="text-[1.75rem] font-light leading-[1.1] tracking-[-0.02em] md:text-[2.25rem]">
              Hold your place.
            </h1>
            <p className="mt-5 max-w-[32rem] text-[0.95rem] leading-[1.85] text-text/80">
              Two minutes and you are booked. We only ask for what the studio needs on the day.
            </p>
          </Reveal>

          <BookingForm workshop={workshop} />
        </div>
      </div>
    </Container>
  );
}

/**
 * What is being booked, kept compact.
 *
 * Every fact here is one the visitor has already seen on the session's own
 * page. It repeats because a form is a moment of doubt, and the answer to "wait
 * — which Saturday was this?" should never be the back button.
 */
function SessionSummary({ workshop }: { workshop: Workshop }) {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);

  return (
    <Reveal variant="fadeIn">
      <div className="bg-cream">
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <Image
            src={workshop.image.src}
            alt={workshop.image.alt}
            fill
            sizes="(min-width: 1024px) 32vw, 100vw"
            style={{ objectPosition: workshop.image.position ?? "50% 50%" }}
            className="object-cover"
          />
        </div>

        <div className="p-7 md:p-8">
          <p className="text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/75">
            {workshop.category}
          </p>
          <h2 className="mt-3 text-[1.2rem] font-medium leading-snug tracking-[-0.01em]">
            {workshop.title}
          </h2>

          <dl className="mt-7 flex flex-col gap-5 border-t border-text/15 pt-6">
            {workshop.venue ? (
              <Row term="Where">
                {workshop.venue.name}
                <span className="mt-1 block text-[0.8rem] font-normal text-text/75">
                  {workshop.venue.locality}
                </span>
              </Row>
            ) : null}
            <Row term="When">
              <time dateTime={workshop.startsAt}>
                {weekday} {formatSessionDate(workshop.startsAt)}
              </time>
              <span className="mt-1 block text-[0.8rem] font-normal text-text/75">
                <span className="tabular-nums">{start}</span>
                <span aria-hidden> &ndash; </span>
                <span className="sr-only">to</span>
                <span className="tabular-nums">{end}</span>
                <span aria-hidden className="px-1.5 text-text/35">
                  &middot;
                </span>
                {formatDuration(workshop.durationMinutes)}
              </span>
            </Row>
            <Row term="Price">
              {formatPrice(workshop.price)}
              <span className="mt-1 block text-[0.8rem] font-normal text-text/75">per person</span>
            </Row>
          </dl>
        </div>
      </div>
    </Reveal>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.6rem] font-medium uppercase tracking-eyebrow text-text/75">{term}</dt>
      <dd className="mt-2 text-[0.95rem] font-medium leading-snug text-text">{children}</dd>
    </div>
  );
}
