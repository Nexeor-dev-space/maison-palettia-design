import Link from "next/link";
import { notFound } from "next/navigation";

import { EventBookingBar } from "@/components/booking/EventBookingBar";
import { EventCard } from "@/components/events/EventCard";
import { PageUtilityBar } from "@/components/layout/PageUtilityBar";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { INK } from "@/components/sections/hero/composition";
import { LocationMap } from "@/components/sections/LocationMap";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Container } from "@/components/ui/Container";
import { ScriptTitle } from "@/components/ui/SectionHeader";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import {
  eventFlag,
  eventImage,
  eventIntro,
  eventTitle,
  getEventDetail,
  getEventSlugs,
  isUpcoming,
  type EventDetail,
} from "@/lib/eventDetail";
import { getMallPartners } from "@/lib/partners";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import {
  bookingStepHref,
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  getRelatedWorkshops,
  workshopHref,
  isFullyBooked,
  isScarce,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
} from "@/lib/workshops";
import type { MallPartner, Workshop } from "@/types";

/** Ties the sentinel to the bar that observes it. */
const CONTENT_END = "event-content-end";

/** The small-caps label used on every field on the page. One class, one look. */
const TERM =
  "block text-label font-medium uppercase tracking-eyebrow text-text/75";

export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getEventDetail(slug);
  return buildMetadata({
    title: detail ? eventTitle(detail) : "Event",
    description:
      (detail && eventIntro(detail)) ??
      "A Maison Palettia creative experience — art, craft and community in Dubai.",
    path: `/events/${slug}`,
  });
}

/**
 * ==========================================================================
 * /events/[slug] — the event detail page
 * ==========================================================================
 *
 * WHAT WAS TAKEN FROM THE REFERENCE, AND WHAT WAS NOT. The brief named a
 * ticketing page as the model for information architecture only, and the part
 * worth taking is its answer order: what is this, when, where, what does it
 * cost, can I book it — all settled in the first screen, before a word of
 * description. This page used to open with a photograph and a heading and make
 * the visitor scroll to find a date. It now answers all five in the header and
 * repeats them as a scannable strip directly under it.
 *
 * None of the marketplace's surface came with it: no rating, no "selling
 * fast", no discount, no tier list, no policy accordions. Most of those are
 * claims this project has no data for; the rest are furniture.
 *
 * TWO KINDS OF PAGE, ONE ROUTE. See lib/eventDetail.ts. A scheduled session
 * has a date and is sold online; a walk-in activity has neither and must never
 * offer a booking control. The difference is carried by the data's own `kind`
 * and decides the header, the strip, the action area, and whether the sticky
 * bar mounts at all.
 *
 * ==========================================================================
 * SECTIONS THAT ARE DELIBERATELY ABSENT
 * ==========================================================================
 *
 * The brief asked for several sections "only if the existing data supports
 * meaningful content", and listed the fields each would need. Measured against
 * types/index.ts, this project has none of them:
 *
 *   What to expect ...... no inclusions field, no "what you'll create"
 *   Good to know ........ no age limit, no what-to-bring, no cancellation
 *                         terms, no accessibility note, no arrival note
 *   How to find us ...... `Venue` is `{ name, locality }` and nothing more —
 *                         no address, floor, unit, landmark or parking
 *
 * So none of them render, and none of them exist as an empty component waiting
 * to be filled either. A section built to hold a policy is a section somebody
 * eventually writes a policy into.
 *
 * WHAT DOES RENDER IS EVERY FIELD THAT EXISTS: title, category, kind, excerpt
 * or description, photograph, date, time, duration, venue, price, seat count
 * and status flag — each omitted individually when absent rather than printed
 * as a gap.
 */
export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getEventDetail(slug);

  if (!detail) notFound();

  const [related, partners] = await Promise.all([
    getRelatedWorkshops(slug),
    getMallPartners(),
  ]);

  /*
    The centre this event happens at, matched by name against the studio's own
    confirmed partnerships.

    A scheduled session stores a `venue` — a name and a locality — and
    lib/partners.ts stores the same centre with a description and a map link.
    Matching them is what lets the location section show a map at all; a
    session at a centre with no partnership record shows its venue line with no
    map, rather than a map of somewhere approximate.
  */
  const venueName =
    detail.kind === "scheduled" ? detail.workshop.venue?.name : undefined;
  const partner = venueName
    ? partners.find((p) => p.name.toLowerCase() === venueName.toLowerCase())
    : /*
        A WALK-IN PAGE STILL HAS TO ANSWER "WHERE DO I WALK IN TO?".

        It is the most important question on the page, and the one a date-less
        activity cannot answer from its own record — `CreativeExperience` has
        no venue field. What the project does hold is lib/partners.ts: the
        studio's confirmed destinations, and there is exactly one.

        So the single partner is shown, under a heading that says what is true
        — where the Maison sets up — with the centre's own descriptor carrying
        the framing. Nothing here claims this particular activity runs there;
        the data does not say so, and neither does the page.

        Guarded on there being exactly one. The moment the studio confirms a
        second centre, picking one of them for an activity that names neither
        would be a guess, so the section stands down and waits for the data.
      */
      partners.length === 1
      ? partners[0]
      : undefined;

  const bookable =
    detail.kind === "scheduled" && !isFullyBooked(detail.workshop);

  return (
    /*
      ==================================================================
      THE PAPER, AND ONE SECTION THAT CAME OFF
      ==================================================================

      This page sat on the body's near-white `surface` with its sections
      separated by hairlines — the arrangement the whole site has moved off.
      Light Sage is the ground now, the way it is everywhere else, and the
      facts column is an object laid on it rather than a column of text with
      rules between the parts.

      <AboutExperience /> IS GONE, and it was a duplication rather than a
      design problem. It rendered `eventIntro(detail)`, which is the exact
      string <EventHeader> has already shown as the lead — checked in
      lib/eventDetail.ts, that function is the only descriptive text on an
      EventDetail at all: `workshop.excerpt` for a scheduled session and
      `experience.description` for a walk-in, and nothing longer exists.
      So the page printed one sentence twice, the second time at 1.6rem
      under a heading promising more.

      The honest fix is to say it once. If a longer body is added to the data
      later, this section comes back to carry it — it is the heading with
      nothing behind it that had to go, not the idea of an "about".
    */
    /*
      `overflow-x-clip`, not `overflow-hidden`. The cut-out on the facts field
      below is positioned past the measure's right edge on purpose — that is
      the deck's device — and without clipping it pushed the document 4px wide
      at 1440 and 12px at 768. Measured.

      `clip` rather than `hidden` because `hidden` makes this a scroll
      container, which would break the sticky booking bar inside it; and the
      x-axis only, so nothing interferes with the page scrolling normally.
    */
    <div className="overflow-x-clip bg-sage">
      <Container className="relative py-[2.5rem] md:py-[3.5rem] lg:py-[4.5rem]">
        <Breadcrumb detail={detail} />

        <EventHeader detail={detail} bookable={bookable} />
        <QuickInfo detail={detail} />
        <LocationSection detail={detail} partner={partner} />
        <ActionArea detail={detail} bookable={bookable} />

        {related.length > 0 ? (
          <MoreEvents sessions={related} currentSlug={slug} />
        ) : null}

        {/* The bar's own height, given back to the page — only where a bar mounts. */}
        {bookable ? <div aria-hidden className="h-24 md:h-28" /> : null}

        <div id={CONTENT_END} aria-hidden />

        <PageUtilityBar
          note="Everything is provided, and no experience is needed. If something is unclear, ask before you book."
          links={[
            { label: "All events", href: "/events" },
            { label: "Questions", href: "/faq" },
            { label: "Contact", href: "/contact" },
          ]}
        />

        {/*
          THE STICKY BAR MOUNTS FOR ONE CASE ONLY.

          A walk-in activity has nothing to book, so a persistent booking bar on
          its page would be an offer the studio cannot honour — and a sold-out
          date has the same problem. `bookable` is the single gate, so neither
          can reach it. Below `lg` only: the header's own column is the desktop
          affordance and this is the phone's.

          Every value is resolved here, on the server, and handed down as
          strings. <EventBookingBar> is a client component and lib/workshops.ts
          carries the session catalogue as well as the formatters, so importing
          it there to borrow one would ship the catalogue to the browser.
        */}
        {bookable ? (
          <div className="lg:hidden">
            <StickyBar workshop={detail.workshop} />
          </div>
        ) : null}
      </Container>
    </div>
  );
}

/* ==========================================================================
   BREADCRUMB
   ========================================================================== */

/**
 * Home, the programme, the strand, this event.
 *
 * Someone arriving from a search engine lands here with no idea what else
 * exists; a back arrow says there is a way out, a breadcrumb says what the
 * page is part of. The category step is a plain span rather than a link —
 * there is no filtered listing behind it yet, and a crumb that goes nowhere is
 * worse than a crumb that is a label.
 */
function Breadcrumb({ detail }: { detail: EventDetail }) {
  const category =
    detail.kind === "scheduled"
      ? detail.workshop.category
      : "Creative experiences";

  return (
    <Reveal>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-label font-medium uppercase tracking-eyebrow text-text/75">
          <Crumb href="/">Home</Crumb>
          <Crumb href="/events">Events</Crumb>
          <Crumb>{category}</Crumb>
          <li className="text-text" aria-current="page">
            {eventTitle(detail)}
          </li>
        </ol>
      </nav>
    </Reveal>
  );
}

function Crumb({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      {href ? (
        <Link
          href={href}
          // `-my-1.5 py-1.5` grows the target without moving the trail. At this
          // size the label sets a 16px box, under the 24px a control owes, and
          // the negative margin cancels the padding so the row still measures
          // as a row of labels. Same device as every other action on the site.
          className="-my-1.5 py-1.5 transition-colors duration-300 ease-soft hover:text-text focus-visible:text-text"
        >
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      )}
      {/* /70, not /40: the slashes are what make a row of labels read as a
          trail rather than as a sentence, so they are structural. */}
      <span aria-hidden className="text-text/70">
        /
      </span>
    </li>
  );
}

/* ==========================================================================
   SECTION 01 — EVENT HEADER
   ========================================================================== */

/**
 * The first screen, and it has to settle five questions.
 *
 * Photograph on the left at seven columns, the whole decision on the right at
 * five: type, name, the studio's own line, then the facts as a description
 * list, then the action. On a phone the order is photograph, type, name, line,
 * facts, action — the same order stacked, with nothing reordered by CSS that a
 * screen reader would then hear out of sequence.
 *
 * NO PANEL, NO CARD, NO SHADOW. The brief ruled those out and the house
 * language has none. What separates the right-hand column from the page is a
 * hairline above each field group and the space around them.
 *
 * An activity with no photograph gets no empty plate: the column simply runs
 * wider. Two of the seven have none, and a grey rectangle where a picture
 * should be is worse than a page that never promised one.
 */
function EventHeader({
  detail,
  bookable,
}: {
  detail: EventDetail;
  bookable: boolean;
}) {
  const image = eventImage(detail);
  const intro = eventIntro(detail);
  const typeLabel =
    detail.kind === "scheduled"
      ? detail.workshop.category
      : "Walk-in experience";

  return (
    <section aria-labelledby="event-title" className="mt-9 md:mt-12">
      <div className="grid grid-cols-12 items-start gap-x-6 gap-y-10 lg:gap-x-10">
        {image ? (
          <figure className="col-span-12 -mx-gutter lg:col-span-7 lg:mx-0">
            <WorkshopPhoto
              image={image}
              aspect="aspect-[4/3] sm:aspect-[3/2]"
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          </figure>
        ) : null}

        <div
          className={cn(
            "col-span-12",
            image ? "lg:col-span-5" : "lg:col-span-8",
          )}
        >
          <Reveal>
            <p className="flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-text/75">
              <span aria-hidden className="h-px w-6 shrink-0 bg-terracotta" />
              {typeLabel}
            </p>
          </Reveal>

          <h1 id="event-title" className="mt-5">
            <Stagger>
              {/*
                The brand's script, as every other page title on the site is
                set. `pb-[0.3em]` and not the 0.08em a sans needed: Hapsha's
                capitals and swashes stand about 0.9em above the baseline
                against a 0.8em line box, and the clearance has to sit on the
                element carrying the font-size or it resolves against 16px and
                the descender of the line above is cut.

                <ScriptTitle> rather than the raw string: the face draws its I
                like a J and has no alternate, so a run of capitals — "DIY" —
                is set in the sans on the script's baseline instead of coming
                out as "DJY". Activity names mostly have none, but the titles
                come from data and this one cannot be checked by eye.
              */}
              <Reveal
                as="span"
                variant="maskUp"
                className="heading-script block pb-[0.3em] text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)] leading-[1.14]"
              >
                <ScriptTitle>{eventTitle(detail)}</ScriptTitle>
              </Reveal>
            </Stagger>
          </h1>

          {intro ? (
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-[34rem] text-lead leading-[1.7] text-text/85">
                {intro}
              </p>
            </Reveal>
          ) : null}

          {/*
            THE FACTS AND THE ACTION ARE ONE OBJECT, laid on the paper.

            They used to run down the column as loose text with a hairline
            above them — the arrangement the rest of the site has moved off,
            and the one that reads worst here, because these are the things a
            visitor is actually deciding on: how it runs, when, and what
            pressing the button does. A White Rock field groups them and
            separates them from the description above without a rule.

            It is the deck's own device rather than a "card": one field, one
            radius, no border and no shadow. `relative` because the cut-out
            below breaks its corner.
          */}
          <Reveal delay={0.18}>
            <div className="relative mt-9 rounded-[1.25rem] bg-cream px-6 py-7 md:rounded-[1.5rem] md:px-8 md:py-8">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-5 w-[4.5rem] rotate-[-10deg] md:w-[5.5rem]"
              >
                <DoodleMark
                  name={detail.kind === "scheduled" ? "starburst" : "starleaf"}
                  color={detail.kind === "scheduled" ? INK.lavender : INK.terracotta}
                  treatment="stamp"
                  delay={280}
                />
              </span>

              {detail.kind === "scheduled" ? (
                <ScheduledFacts workshop={detail.workshop} />
              ) : (
                <WalkInFacts detail={detail} />
              )}

              <div className="mt-8">
                <PrimaryAction detail={detail} bookable={bookable} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * When, where and how much — the three facts a date is chosen on.
 *
 * The time is set largest because the studio's whole model turns on it: these
 * run at a mall on a fixed afternoon, and "am I free then" is the question that
 * decides everything after it.
 */
function ScheduledFacts({ workshop }: { workshop: Workshop }) {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(
    workshop.startsAt,
    workshop.durationMinutes,
  );

  return (
    <>
      {/* No top rule — the field's own edge separates this from the lead. */}
      <div>
        <span className={TERM}>When</span>
        <p className="mt-3 text-lead font-medium leading-snug text-text">
          <time dateTime={workshop.startsAt}>
            {formatSessionDate(workshop.startsAt)}
          </time>
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

      <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-line pt-7">
        {workshop.venue ? (
          <div>
            <dt className={TERM}>Where</dt>
            <dd className="mt-3 text-lead font-medium leading-snug text-text">
              {workshop.venue.name}
              <Sub>{workshop.venue.locality}</Sub>
            </dd>
          </div>
        ) : null}

        <div>
          <dt className={TERM}>Price</dt>
          <dd className="mt-3 text-lead font-medium leading-snug text-text">
            {formatPrice(workshop.price)}
            <Sub>per person</Sub>
          </dd>
        </div>
      </dl>

      {/*
        Availability as the existing data states it, and only as it states it.
        `spotsLabel` and `isScarce` are the listing's own reading of
        `seatsAvailable`; nothing counts down and nothing is dressed up as
        urgency the data does not support.

        The dot is an accent beside a label that already says the same thing in
        words, so nothing here is carried by colour alone.
      */}
      <p className="mt-7 flex items-center gap-2.5 border-t border-line pt-7 text-label font-medium uppercase tracking-eyebrow text-text">
        {isScarce(workshop) ? (
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-pill bg-primary"
          />
        ) : null}
        {spotsLabel(workshop)}
      </p>
    </>
  );
}

/**
 * What a walk-in activity can truthfully say about itself.
 *
 * TWO FIELDS, BECAUSE THERE ARE TWO. `CreativeExperience` carries a name, an
 * optional line, an optional photograph, its `kind` and an optional status
 * flag. It has no date, no time, no duration, no price, no venue and no
 * capacity — a walk-in activity genuinely has none of those — so this prints
 * how it runs and the studio's flag where there is one, and nothing else.
 *
 * It does not say where. The studio has one confirmed centre, in
 * lib/partners.ts, but nothing in the data ties a *particular activity* to it,
 * and "ceramic painting is at Times Square Center" is an inference rather than
 * a fact this project holds. The location section says what is true — where
 * the Maison sets up — and leaves the inference unmade.
 */
function WalkInFacts({ detail }: { detail: EventDetail }) {
  const flag = eventFlag(detail);

  return (
    /* No top rule: this sits inside the White Rock field now, and the
       field's edge is the separation. The rule between the two halves of
       the list below stays — that one divides content, not sections. */
    <dl className="grid grid-cols-2 gap-x-8 gap-y-7">
      <div>
        <dt className={TERM}>How it runs</dt>
        <dd className="mt-3 text-lead font-medium leading-snug text-text">
          Walk in
          <Sub>No booking needed</Sub>
        </dd>
      </div>

      {flag ? (
        <div>
          <dt className={TERM}>Status</dt>
          <dd className="mt-3 text-lead font-medium leading-snug text-text">
            {/* The studio's own wording, carried through rather than
                paraphrased into something that sounds more certain. */}
            {flag}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

/** The quiet second line under a fact. */
function Sub({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1.5 block text-fine font-normal text-text/75">
      {children}
    </span>
  );
}

/* ==========================================================================
   THE ACTION
   ========================================================================== */

/**
 * The one control, and what it is allowed to be.
 *
 *   scheduled, open ......... a filled button into the existing booking route
 *   scheduled, full ......... no control; the state, in words
 *   walk-in, running ........ no control; walk in and create
 *   walk-in, flagged ........ no control; the studio's flag
 *
 * `bookingStepHref` is the project's own resolver and the booking flow behind
 * it is untouched — this page decides whether to offer the door, never what is
 * behind it.
 */
function PrimaryAction({
  detail,
  bookable,
}: {
  detail: EventDetail;
  bookable: boolean;
}) {
  if (bookable && detail.kind === "scheduled") {
    return (
      <Link
        href={bookingStepHref(detail.workshop)}
        className="group inline-flex w-full items-center justify-center gap-3 rounded-sm bg-primary px-8 py-5 text-fine font-medium uppercase leading-none tracking-eyebrow text-on-primary press-in transition-colors duration-300 ease-soft hover:bg-primary/90 sm:w-auto"
      >
        Book this experience
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    );
  }

  if (detail.kind === "scheduled") {
    return (
      <p className="max-w-[30rem] text-body leading-[1.8] text-text/85">
        This date is full. The programme has other dates.
      </p>
    );
  }

  if (isUpcoming(detail)) {
    return (
      <p className="max-w-[30rem] text-body leading-[1.8] text-text/85">
        Not running yet. It will appear in the programme when it opens.
      </p>
    );
  }

  /*
    A statement, not a button. There is nothing to press: the activity is a
    walk-in, so the honest affordance is the sentence plus a way to the
    programme for anyone who wanted a date instead.
  */
  return (
    <div>
      <p className="text-h3 font-light tracking-[-0.015em] text-text">
        Walk in and create.
      </p>
      <p className="mt-3 max-w-[30rem] text-body leading-[1.8] text-text/85">
        This one runs as a walk-in activity — there is no date to book and
        nothing to reserve.
      </p>
      <Link
        href="/events"
        className="group -my-1.5 mt-6 inline-flex items-baseline gap-3 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
      >
        <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
          See what is scheduled
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

/* ==========================================================================
   SECTION 02 — QUICK INFORMATION
   ========================================================================== */

/**
 * The header's facts again, as a strip, and only the ones that exist.
 *
 * WHY REPEAT THEM. The header sets the date at display size beside a
 * photograph, which is composition; this is the same information as a
 * scannable row, which is reference. Someone comparing two dates in two tabs
 * reads the strip, not the hero. It is the one thing a ticketing page does
 * that an editorial page usually forgets.
 *
 * It renders nothing at all for a walk-in activity, where the only field that
 * exists is "walk in" — a one-row strip under a header that has just said the
 * same thing is furniture.
 */
function QuickInfo({ detail }: { detail: EventDetail }) {
  if (detail.kind !== "scheduled") return null;

  const workshop = detail.workshop;
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start, end } = sessionTimeRange(
    workshop.startsAt,
    workshop.durationMinutes,
  );

  const fields: { term: string; value: React.ReactNode }[] = [
    {
      term: "Date",
      value: (
        <time dateTime={workshop.startsAt}>
          {weekday} {formatSessionDate(workshop.startsAt)}
        </time>
      ),
    },
    {
      term: "Time",
      value: (
        <>
          <span className="tabular-nums">{start}</span>
          <span aria-hidden> &ndash; </span>
          <span className="sr-only">to</span>
          <span className="tabular-nums">{end}</span>
        </>
      ),
    },
    {
      term: "Duration",
      value: (
        <time dateTime={durationToIso(workshop.durationMinutes)}>
          {formatDuration(workshop.durationMinutes)}
        </time>
      ),
    },
    ...(workshop.venue
      ? [
          {
            term: "Location",
            value: `${workshop.venue.name}, ${workshop.venue.locality}`,
          },
        ]
      : []),
    { term: "Price", value: `${formatPrice(workshop.price)} per person` },
    { term: "Experience", value: workshop.category },
  ];

  return (
    <section
      aria-labelledby="event-quick-info"
      className="mt-16 md:mt-20 lg:mt-24"
    >
      <h2 id="event-quick-info" className="sr-only">
        Event information
      </h2>
      {/*
        A rule above and the fields hanging from it — the index grammar the
        rest of the site uses, not a bordered specification table. Two columns
        on a phone so six short fields do not become six screens of scrolling.
      */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-x-10">
        {fields.map(({ term, value }, i) => (
          <Reveal key={term} delay={i * 0.05}>
            <dt className={TERM}>{term}</dt>
            <dd className="mt-3 text-body font-medium leading-snug text-text">
              {value}
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

/* ==========================================================================
   SECTION 05 — (REMOVED) ABOUT THE EXPERIENCE
   ==========================================================================

   <AboutExperience> stood here and printed `eventIntro(detail)` under the
   heading "About the experience". <EventHeader> already shows that string as
   the page's lead, and lib/eventDetail.ts confirms it is the only descriptive
   text an EventDetail has — `workshop.excerpt` for a scheduled session,
   `experience.description` for a walk-in, and nothing longer behind either.
   So the section restated the sentence above it at 1.6rem and added a heading
   that promised detail the project does not hold.

   Deleted rather than hidden. If the CMS grows a real body field, this comes
   back to carry it; padding the page with the same sentence twice in the
   meantime is the thing to avoid.
   ========================================================================== */

/* ==========================================================================
   SECTION 06 — LOCATION
   ========================================================================== */

/**
 * Where it happens, and it matters more here than on most sites.
 *
 * The Maison has no studio door. It sets up inside a mall on fixed dates, so
 * the centre is a deciding fact rather than a footnote — someone is matching a
 * date, a time and "can I get there" against their own week.
 *
 * THE MAP IS THE PROJECT'S OWN, REUSED. <LocationMap> already renders the
 * keyless Google embed from a search query plus the centre's own link; it
 * takes an array of partners, so one match is passed as a single-entry array
 * and it composes itself. No coordinates are invented, because there are none
 * anywhere in this project — see the note at the head of that component.
 *
 * THREE CASES, AND EACH IS HONEST:
 *
 *   venue matches a partner ... the centre, its own line, and the map
 *   venue with no partner ..... the venue line alone, no map
 *   walk-in activity .......... the Maison's confirmed destination, framed as
 *                               where the studio sets up — never as a claim
 *                               that this particular activity runs there,
 *                               which the data does not say
 */
function LocationSection({
  detail,
  partner,
}: {
  detail: EventDetail;
  partner?: MallPartner;
}) {
  const venue = detail.kind === "scheduled" ? detail.workshop.venue : undefined;
  if (!venue && !partner) return null;

  const heading =
    detail.kind === "scheduled"
      ? "Where it happens"
      : "Where the Maison sets up";

  return (
    <section
      aria-labelledby="event-location"
      className="mt-20 md:mt-28 lg:mt-32"
    >
      <div className="border-t border-line pt-10 md:pt-14">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 lg:gap-x-10">
          <Reveal className="col-span-12 md:col-span-7">
            <p className={TERM}>Location</p>
            <h2
              id="event-location"
              className="mt-4 heading-script text-script-compact"
            >
              {heading}
            </h2>
          </Reveal>

          <Reveal delay={0.12} className="col-span-12 md:col-span-5 md:pb-2">
            <p className="text-lead font-medium leading-snug text-text">
              {venue?.name ?? partner?.name}
              <Sub>{venue?.locality ?? partner?.locality}</Sub>
            </p>
            {/* The centre's own line, where the studio has written one. */}
            {partner?.descriptor ? (
              <p className="mt-4 max-w-[30rem] text-body leading-[1.8] text-text/80">
                {partner.descriptor}
              </p>
            ) : null}
          </Reveal>
        </div>

        {partner ? (
          <LocationMap partners={[partner]} className="mt-12 md:mt-14" />
        ) : (
          /*
            No partnership record for this venue, so no map. Said plainly
            rather than left as a gap where a map obviously belongs.
          */
          <Reveal className="mt-10">
            <p className="max-w-[34rem] text-fine leading-[1.75] text-text/75">
              Full directions for this centre are confirmed with your booking.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
   SECTION 08 — THE CLOSE
   ========================================================================== */

/**
 * The action, restated at the foot for someone who has read the whole page.
 *
 * It renders for a bookable date only. A walk-in activity and a sold-out date
 * both said everything they can in the header, and repeating "there is nothing
 * to book" at the bottom of the page is the site apologising twice.
 */
function ActionArea({
  detail,
  bookable,
}: {
  detail: EventDetail;
  bookable: boolean;
}) {
  if (!bookable || detail.kind !== "scheduled") return null;

  return (
    <section
      aria-labelledby="event-close"
      className="mt-20 border-t border-line pt-12 md:mt-28 md:pt-14 lg:mt-32"
    >
      <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
        <Reveal className="col-span-12 md:col-span-7">
          <h2
            id="event-close"
            className="heading-script text-script-compact"
          >
            Ready to create?
          </h2>
          <p className="mt-5 max-w-[32rem] text-body leading-[1.85] text-text/80">
            Everything is laid out before you arrive. You bring nothing but
            yourself.
          </p>
        </Reveal>

        <Reveal
          delay={0.12}
          className="col-span-12 md:col-span-5 md:justify-self-end"
        >
          <PrimaryAction detail={detail} bookable={bookable} />
        </Reveal>
      </div>
    </section>
  );
}

/* ==========================================================================
   SECTION 08 — MORE EVENTS
   ========================================================================== */

/**
 * What else is on, and it adapts to how much there is.
 *
 * ==========================================================================
 * ONE SESSION IS THE NORMAL CASE HERE, NOT AN EDGE CASE
 * ==========================================================================
 *
 * The project holds exactly two scheduled sessions. `getRelatedWorkshops`
 * drops the one being viewed, so on any scheduled event's page this list has
 * ONE item in it — and it was rendering that one item into a two-column grid,
 * which left the whole right half of the section as empty Light Sage. Not a
 * rare state to design around: the only state a scheduled page ever shows.
 *
 * So the count picks the composition:
 *
 *   ONE   a wide object — the photograph and a White Rock field side by side,
 *         running the full measure. It reads as "here is the other session",
 *         which is what it is, instead of as a card that lost its row.
 *   TWO+  the pair or the row, as before. <EventCard> is unchanged and still
 *         does the work; nothing about how a session links or books moved.
 *
 * THE HEADING IS THE SAME TWO WORDS IT ALWAYS WAS, set in the brand's script
 * rather than as an 11px label, and the hairline above it is gone — a rule
 * between sections is the device this site has moved off, and the page is one
 * paper with objects laid on it now.
 */
function MoreEvents({
  sessions,
  currentSlug,
}: {
  sessions: Workshop[];
  currentSlug: string;
}) {
  const others = sessions.filter((session) => session.slug !== currentSlug);
  if (others.length === 0) return null;

  const solo = others.length === 1 ? others[0] : null;

  return (
    <section aria-labelledby="more-events" className="mt-20 md:mt-28 lg:mt-32">
      <Reveal>
        <h2
          id="more-events"
          className="heading-script pb-[0.3em] text-script-compact text-text"
        >
          <ScriptTitle>More events</ScriptTitle>
        </h2>
      </Reveal>

      {solo ? (
        <Reveal variant="fadeIn" className="mt-8 md:mt-10">
          <SoloSession workshop={solo} />
        </Reveal>
      ) : (
        <ul
          className={cn(
            "mt-8 grid grid-cols-1 gap-x-6 gap-y-14 md:mt-10 lg:gap-x-10",
            others.length >= 3
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "sm:grid-cols-2",
          )}
        >
          {others.map((session, i) => (
            <Reveal as="li" key={session.slug} delay={i * 0.08}>
              <EventCard
                workshop={session}
                sizes={
                  others.length >= 3
                    ? "(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                    : "(min-width: 640px) 46vw, 92vw"
                }
                className="h-full"
              />
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * The single related session, laid wide.
 *
 * Built here rather than by widening <EventCard>, which is a portrait card
 * used in three listings and should stay one. This borrows the same
 * formatters — no date, time, price or seat count is computed differently
 * from anywhere else on the site — and links to the same `workshopHref`.
 *
 * The whole object is one link. A field with a separate "view" control inside
 * it gives a pointer two targets for one destination, and the smaller of them
 * is the one people miss.
 */
function SoloSession({ workshop }: { workshop: Workshop }) {
  const { weekday } = sessionDateParts(workshop.startsAt);
  const { start } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const scarce = isScarce(workshop);
  const spots = spotsLabel(workshop);

  return (
    <Link
      href={workshopHref(workshop)}
      className="group press-in relative flex flex-col overflow-hidden rounded-[1.25rem] md:rounded-[1.75rem] lg:min-h-[20rem] lg:flex-row"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-cream lg:aspect-auto lg:w-[55%]">
        <WorkshopPhoto
          image={workshop.image}
          aspect="h-full"
          sizes="(min-width: 1024px) 55vw, 100vw"
        />
      </div>

      <div className="relative flex flex-1 flex-col justify-center bg-cream px-7 py-9 md:px-10 md:py-11">
        {/* The cut-out, breaking the field's top-right corner — the same
            device the facts field above uses. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-5 w-[4.5rem] rotate-[-10deg] transition-transform duration-700 ease-editorial motion-safe:group-hover:translate-y-1 md:w-[5.5rem]"
        >
          <DoodleMark name="starburst" color={INK.lavender} treatment="stamp" delay={260} />
        </span>

        <span className="flex items-center gap-2.5 text-label font-semibold uppercase tracking-eyebrow text-text">
          <span aria-hidden className="size-1.5 shrink-0 rounded-pill bg-primary" />
          Scheduled session
        </span>

        <span className="heading-script mt-3 block pb-[0.2em] text-script-compact leading-[1.15] text-text">
          <ScriptTitle>{workshop.title}</ScriptTitle>
        </span>

        <span className="mt-4 block text-lead leading-[1.5] text-text">
          {formatSessionDate(workshop.startsAt)}
          <span aria-hidden className="px-2 text-text/60">
            &middot;
          </span>
          {weekday}
          <span aria-hidden className="px-2 text-text/60">
            &middot;
          </span>
          {start}
        </span>

        <span className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-body text-text">
          <span className="font-medium">{formatPrice(workshop.price)}</span>
          {spots ? (
            <span className={cn(scarce ? "text-terracotta" : "text-text/85")}>{spots}</span>
          ) : null}
        </span>

        <span className="mt-7 inline-flex items-center gap-2 text-action font-semibold uppercase tracking-eyebrow text-primary">
          <span className="relative inline-block pb-1.5">
            View this session
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-full -mt-1 block h-px w-full origin-right scale-x-0 bg-current transition-transform duration-[380ms] ease-editorial group-hover:origin-left group-hover:scale-x-100 motion-reduce:transition-none"
            />
          </span>
          <span
            aria-hidden
            className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  );
}

/** The phone's persistent action. Resolved on the server, handed down as strings. */
function StickyBar({ workshop }: { workshop: Workshop }) {
  const { start, end } = sessionTimeRange(
    workshop.startsAt,
    workshop.durationMinutes,
  );

  return (
    <EventBookingBar
      title={workshop.title}
      bookingHref={bookingStepHref(workshop)}
      startsAt={workshop.startsAt}
      dateLabel={formatSessionDate(workshop.startsAt)}
      startLabel={start}
      endLabel={end}
      venueName={workshop.venue?.name}
      priceLabel={formatPrice(workshop.price)}
      spotsLabel={spotsLabel(workshop)}
      closed={isFullyBooked(workshop)}
      scarce={isScarce(workshop)}
      sentinelId={CONTENT_END}
    />
  );
}
