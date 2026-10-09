import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingForm } from "@/components/booking/BookingForm";
import { SessionGate } from "@/components/booking/SessionClock";
import { Steps } from "@/components/booking/Steps";
import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { getEventDetail } from "@/lib/eventDetail";
import { buildMetadata } from "@/lib/seo";
import {
  formatDuration,
  formatPrice,
  formatSessionDate,
  getAllWorkshops,
  getWorkshopBySlug,
  hasSessionPassed,
  isFullyBooked,
  isScarce,
  sessionDateParts,
  sessionTimeRange,
  workshopHref,
} from "@/lib/workshops";
import type { Workshop } from "@/types";

/**
 * Step one of two — your details.
 *
 * The session is already chosen, so the page is deliberately narrow: a
 * reminder of what was picked, how many places, and who is coming. Nothing
 * else competes for attention, which is why there is no related-sessions rail
 * and no second photograph.
 *
 * A full session never reaches this page: the route sends it back to the
 * session itself rather than rendering a form that cannot be honoured.
 *
 * A DATE THAT HAS GONE BY GETS A PAGE, NOT A 404 AND NOT A FORM. This route
 * used to check seats only, so a session past its start rendered a working
 * form and went on through checkout to a reference. Someone reaching it now —
 * from a bookmark, a shared link, or an event page that was open when they
 * last looked — is told plainly that the date has passed and pointed back to
 * the listing. A 404 would read as a broken link; a redirect would drop them on
 * the event page with no word about why.
 *
 * Decided twice, like every date check on the site: on the server for the
 * HTML (`hasSessionPassed`, as fresh as the `revalidate` below), and by
 * <SessionGate> against the visitor's clock once the page is live — so a form
 * rendered while the date was open still gives way the moment it is not, even
 * with the page left open on the form.
 *
 * THE PAGE STAYS ON THE SERVER. Everything that is a fact about the session —
 * the intro, the card's face, the phone's strip, whether it is nearly gone — is
 * drawn here and handed to <BookingForm> as rendered slots and values, the
 * interleaving pattern in node_modules/next/dist/docs/01-app/01-getting-started/
 * 05-server-and-client-components.md. The form is the only client tree, and it
 * never imports lib/workshops; see the note on <BookingForm>.
 */
export async function generateStaticParams() {
  const workshops = await getAllWorkshops();
  return workshops.filter((w) => !isFullyBooked(w)).map(({ slug }) => ({ slug }));
}

/*
  Re-rendered at most every ten minutes, for the reason set out on the event
  page beside this one: whether the date has passed is a fact about the clock,
  and a prerendered page otherwise keeps the build's answer for as long as the
  deployment lives. It keeps the HTML close to true; <SessionGate> is what
  actually closes the form. See node_modules/next/dist/docs/01-app/02-guides/
  incremental-static-regeneration.md.
*/
export const revalidate = 600;

/*
  The session this address books. Since the CMS, a session has its own dated
  slug (`candle-making-2026-10-11-1530`), so the activity's bare slug —
  /events/candle-making/book, the address every link carried before — is
  resolved the way the event page resolves it: to that activity's next
  session (lib/eventDetail.ts). Either address books the same date.
*/
async function bookableSession(slug: string): Promise<Workshop | null> {
  const session = await getWorkshopBySlug(slug);
  if (session) return session;
  const detail = await getEventDetail(slug);
  return detail?.kind === "scheduled" ? detail.workshop : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await bookableSession(slug);
  return buildMetadata({
    title: workshop ? `Book: ${workshop.title}` : "Book an event",
    description: "Book your place at a Maison Palettia event.",
    path: `/events/${slug}/book`,
    /* A step in a booking, not a page anyone searches for — and one of them
       per dated session that still has seats (`generateStaticParams` above),
       each saying the same thing. app/robots.ts disallows the path as well;
       this is the tag for any copy a crawler fetched before that line. */
    noindex: true,
  });
}

export default async function BookSessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workshop = await bookableSession(slug);

  if (!workshop) notFound();
  if (isFullyBooked(workshop)) notFound();

  // Resolved here, so the client form never needs lib/workshops. `isScarce`
  // is the site's one rule for when availability takes the accent; the form
  // repeats it rather than writing its own threshold.
  const scarce = isScarce(workshop);
  // The server's verdict on the date, as of this render — see the note above.
  const passed = hasSessionPassed(workshop);

  return (
    <div className="relative isolate overflow-clip">
      <SectionShapes plan={groundShapes("sage")} />
      <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
        <Reveal>
          {/* `-my-3 py-3` grows the hit area to 47px — over the 44px touch
              target — without moving the link or anything around it. */}
          <Link
            href={workshopHref(workshop)}
            className="group inline-flex items-center gap-3 -my-3 py-3 text-action font-medium uppercase tracking-eyebrow text-text"
          >
            <span
              aria-hidden
              className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:-translate-x-1"
            >
              &#8592;
            </span>
            <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
              Back to the event
            </span>
          </Link>
        </Reveal>

        {/*
          The steps go with the form: "1 Your details · 2 Checkout" over a page
          that cannot take either step would be a progress bar for a journey
          that is not happening.
        */}
        <SessionGate
          startsAt={workshop.startsAt}
          passedAtRender={passed}
          open={
            <>
              <Steps current={1} />

              <BookingForm
                workshop={workshop}
                intro={<Intro />}
                summary={<SessionSummary workshop={workshop} />}
                strip={<SessionStrip workshop={workshop} />}
                scarce={scarce}
              />
            </>
          }
          passed={<SessionPassed workshop={workshop} />}
        />
      </Container>
    </div>
  );
}

/**
 * The heading and its one sentence.
 *
 * "Two minutes and you are booked" is what this used to say, and at this step
 * it was not true: nothing is booked until the next page, and the line was
 * promising the visitor an outcome the button does not deliver. What replaces
 * it says what happens here and what happens next.
 *
 * "BOOK", NOT "HOLD". The heading was "Hold Your Place." — on the step
 * just before checkout and the confirmation print BOOKING_TERMS, which says
 * the booking is a request not yet confirmed, and while lib/booking.ts has
 * no backend nothing on the site holds a place. "Book" is the verb that line
 * itself starts with ("Booking here makes a request…") and the one the next
 * step's heading continues ("Complete Your Booking."), so the three read as
 * one sentence instead of a promise and its retraction.
 */
function Intro() {
  return (
    <Reveal>
      <h1 className="text-h1 font-light tracking-[-0.02em]">Book Your Place.</h1>
      <p className="mt-5 max-w-[32rem] text-body text-text/80">
        Choose your places and tell us who&rsquo;s coming. You&rsquo;ll see everything once more
        before you confirm.
      </p>
    </Reveal>
  );
}

/**
 * The date has gone by: what happened, and the one useful next step.
 *
 * It names the session and the date rather than saying "this session", so
 * someone who arrived from an old link can see at once which booking they
 * were trying to make. "Closed when the session began" rather than "has
 * ended": a two-hour session that started ten minutes ago has not ended, and
 * it is still not bookable.
 *
 * One door, to the whole listing — "Browse all experiences", the booking
 * sheet's own last option — and deliberately not "See what is open" into
 * the scheduled half. This page cannot see whether any other date is still
 * open, and the moment the placeholder dates have all gone by nothing is: the
 * event page says "nothing else is open just now" in that case, and a button
 * here promising otherwise would argue with it. The full listing is true
 * either way, and its walk-in half needs no date at all. No promise that new
 * dates are coming — the project holds no schedule beyond the placeholder
 * one, and lib/workshops.ts says so.
 */
function SessionPassed({ workshop }: { workshop: Workshop }) {
  const { weekday } = sessionDateParts(workshop.startsAt);

  return (
    <Reveal className="mt-12 md:mt-14">
      <h1 className="text-h1 font-light tracking-[-0.02em]">This Date Has Passed.</h1>
      <p className="mt-5 max-w-[34rem] text-body text-text/80">
        Booking for {workshop.title} on{" "}
        <time dateTime={workshop.startsAt}>
          {weekday} {formatSessionDate(workshop.startsAt)}
        </time>{" "}
        closed when the session began, so this date can no longer be reserved.
      </p>
      <BlobButton href="/events" className="mt-9 justify-center px-8 py-5">
        Browse all experiences
      </BlobButton>
    </Reveal>
  );
}

/**
 * What is being booked — the face of the place card on a desktop.
 *
 * Every fact here is one the visitor has already seen on the session's own
 * page. It repeats because a form is a moment of doubt, and the answer to "wait
 * — which Saturday was this?" should never be the back button.
 *
 * KEPT SHORT ENOUGH TO STICK. The card stays in view beside the form while it
 * is filled in (see `stickyCard` in PaintBooking.module.css), which only works
 * while the whole card fits the window: a 2:1 photograph rather than 3:2 —
 * capped at 10rem, so a wide column letterboxes it rather than growing it —
 * and When and Price side by side rather than stacked, are what buy that
 * height.
 *
 * No ground of its own: the card it sits in supplies the White Rock, and the
 * notches cut into it are the card's too.
 */
function SessionSummary({ workshop }: { workshop: Workshop }) {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);

  return (
    <div>
      <div className="relative aspect-[2/1] max-h-[10rem] w-full overflow-hidden rounded-t-[1.5rem]">
        <Image
          src={workshop.image.src}
          alt={workshop.image.alt}
          fill
          sizes="(min-width: 1024px) 31vw, 100vw"
          style={{ objectPosition: workshop.image.position ?? "50% 50%" }}
          className="object-cover"
        />
      </div>

      <div className="px-6 pb-5 pt-5">
        <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
          {workshop.category}
        </p>
        <h2 className="mt-2 text-lead font-medium leading-snug tracking-[-0.01em]">
          {workshop.title}
        </h2>

        <dl className="mt-4 grid grid-cols-[1.25fr_1fr] gap-x-5 gap-y-3.5 border-t border-text/15 pt-4">
          <Row term="When">
            <time dateTime={workshop.startsAt}>
              {weekday} {formatSessionDate(workshop.startsAt)}
            </time>
            <span className="mt-1 block whitespace-nowrap text-fine font-normal text-text/75">
              <span className="tabular-nums">{start}</span>
              <span aria-hidden> &ndash; </span>
              <span className="sr-only">to</span>
              <span className="tabular-nums">{end}</span>
            </span>
          </Row>
          <Row term="Price">
            {formatPrice(workshop.price)}
            <span className="mt-1 block text-fine font-normal text-text/75">
              per person &middot; {formatDuration(workshop.durationMinutes)}
            </span>
          </Row>
          {workshop.venue ? (
            <Row term="Where" className="col-span-2">
              {workshop.venue.name}
              <span className="font-normal text-text/75">, {workshop.venue.locality}</span>
            </Row>
          ) : null}
        </dl>
      </div>
    </div>
  );
}

/**
 * What is being booked, on a phone — a strip rather than a card.
 *
 * The desktop card leads with a photograph, and a full-width photograph first
 * on a phone pushes the form's first question below the fold. This is the
 * same facts in a 72px thumbnail's height, so the visitor sees what they are
 * booking and the places they are choosing on one screen.
 *
 * The thumbnail's alt is empty on purpose: it is a reminder beside the title,
 * which says what it shows, and a long description read ahead of the title
 * would be the first thing a screen reader met on the page.
 */
function SessionStrip({ workshop }: { workshop: Workshop }) {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);

  return (
    <Reveal variant="fadeIn">
      <section
        aria-label="What you're booking"
        className="blob plate flex items-center gap-4 bg-cream p-3 pr-5"
        style={{ "--blob": "1.25rem 1.5rem 1.25rem 1.375rem / 1.375rem 1.25rem 1.5rem 1.25rem" } as React.CSSProperties}
      >
        <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[0.875rem]">
          <Image
            src={workshop.image.src}
            alt=""
            fill
            sizes="72px"
            style={{ objectPosition: workshop.image.position ?? "50% 50%" }}
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
            {workshop.category}
          </p>
          <p className="mt-0.5 text-body font-medium leading-snug text-text">{workshop.title}</p>
          <p className="mt-1 text-fine text-text/75">
            <time dateTime={workshop.startsAt}>
              {weekday} {formatSessionDate(workshop.startsAt)}
            </time>
            <span aria-hidden> &middot; </span>
            <span className="sr-only">, </span>
            {/* One unit, so a narrow phone breaks before the range, not in it. */}
            <span className="whitespace-nowrap">
              <span className="tabular-nums">{start}</span>
              <span aria-hidden> &ndash; </span>
              <span className="sr-only">to</span>
              <span className="tabular-nums">{end}</span>
            </span>
          </p>
          {workshop.venue ? (
            <p className="text-fine text-text/75">{workshop.venue.name}</p>
          ) : null}
        </div>
      </section>
    </Reveal>
  );
}

function Row({
  term,
  children,
  className,
}: {
  term: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-label font-medium uppercase tracking-eyebrow text-text/75">{term}</dt>
      <dd className="mt-1.5 text-body font-medium leading-snug text-text">{children}</dd>
    </div>
  );
}
