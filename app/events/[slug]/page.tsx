import Image from "next/image";
import Link from "next/link";
import { groundShapes } from "@/components/motion/groundShapes";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { BlobButton } from "@/components/ui/BlobButton";
import { notFound } from "next/navigation";

import { EventBookingBar } from "@/components/booking/EventBookingBar";
import { EventCard } from "@/components/events/EventCard";
import { PageUtilityBar } from "@/components/layout/PageUtilityBar";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { INK } from "@/components/sections/hero/composition";
import { LocationMap, PartnerPlate } from "@/components/sections/LocationMap";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Container } from "@/components/ui/Container";
import ticket from "@/components/ui/Ticket.module.css";
import { PeelNote } from "@/components/ui/PeelNote";
import { ScriptTitle } from "@/components/ui/SectionHeader";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import {
  eventFlag,
  eventImage,
  eventAbout,
  eventIntro,
  eventTitle,
  getEventDetail,
  getEventSlugs,
  isUpcoming,
  type EventDetail,
  eventGallery,} from "@/lib/eventDetail";
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
      "A Maison Palettia creative experience: art, craft and community in Dubai.",
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

      THE FACTS AND THE "ABOUT" ARE ONE OBJECT NOW — see <SessionBrief>. They
      were two thin sections with a full section's margins each, which is what
      the client read as awkward; the brief is the plate that carries both.

      An earlier <AboutExperience /> was deleted outright for a different
      reason, and the reason still stands: it printed `eventIntro(detail)`,
      the exact string <EventHeader> already shows as the lead, so the page
      said one sentence twice. What the brief prints is `eventAbout`, which is
      the client's own `about` where one is written and otherwise the
      activity's `description` — a string a scheduled page has never shown,
      because its lead comes from the session's `excerpt` instead.
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
    <div className="relative isolate overflow-x-clip bg-sage">
      <SectionShapes plan={groundShapes("sage")} />
      {/* `pb-0`: <PageUtilityBar> is the last thing in this container and it
          is a Deep Lilac field of its own now, with its own vertical padding.
          The container's bottom padding printed a strip of the page's Light
          Sage between that field and the footer's wave — on the About page
          the same wave rises straight out of the lilac, which is the join the
          client asked this section to match. */}
      <Container className="relative pb-0 pt-[2.5rem] md:pt-[3.5rem] lg:pt-[4.5rem]">
        <Breadcrumb detail={detail} />

        {/* `related` is already "every other session that can be booked" —
            see getRelatedWorkshops. The header's full-date sentence counts
            it rather than assuming it. */}
        <EventHeader
          detail={detail}
          bookable={bookable}
          openElsewhere={related.length}
        />
        <SessionBrief detail={detail} />
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
          // `-my-3 py-3` grows the target without moving the trail: the label
          // sets a 16px box and the padding lifts the target to 40, which is
          // what a finger wants. Measured at 29px with the 6px this used to
          // pay. The negative margin cancels the padding, so the row still
          // measures as a row of labels — the same device as every other
          // action on the site.
          className="-my-3 py-3 transition-colors duration-300 ease-soft hover:text-text focus-visible:text-text"
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
  openElsewhere,
}: {
  detail: EventDetail;
  bookable: boolean;
  /** Passed straight to <PrimaryAction>; see the note there. */
  openElsewhere: number;
}) {
  const image = eventImage(detail);
  const intro = eventIntro(detail);
  const typeLabel =
    detail.kind === "scheduled"
      ? detail.workshop.category
      : "Create Anytime";

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
                className="heading-script block pb-[0.3em] text-script-compact"
              >
                <ScriptTitle>{eventTitle(detail)}</ScriptTitle>
              </Reveal>
            </Stagger>
          </h1>

          {intro ? (
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-[34rem] text-lead text-text/85">
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
                <PrimaryAction
                  detail={detail}
                  bookable={bookable}
                  openElsewhere={openElsewhere}
                />
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
        <p className="mt-4 flex items-center gap-4 text-h3 font-light leading-none tracking-[-0.01em] text-text">
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
          {/* IT SAYS THE NAME AFTER ALL. This row used to answer "how does it
              run" with the deck's own word for the mechanism, on the client's
              earlier instruction that walk-in could stay in descriptions even
              though the headings had been renamed. That instruction has been
              withdrawn — the word is not to appear anywhere — so the row takes
              the name, and the repetition is the price of retiring the term. */}
          Create Anytime
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
  openElsewhere = 0,
  tone = "lilac",
}: {
  detail: EventDetail;
  bookable: boolean;
  /**
   * ========================================================================
   * THE GROUND THIS IS STANDING ON, BECAUSE THE BUTTON CANNOT SEE IT
   * ========================================================================
   *
   * <BlobButton> floods on hover, and the default `lilac` tone floods LIGHT
   * SAGE. This component is rendered twice on one page and the two sit on
   * different paper:
   *
   *   <EventHeader> ... White Rock. A Light Sage flood measures dE 15.7
   *                     against it — plainly a change. `lilac`, the default.
   *   <ActionArea> .... Light Sage. A Light Sage flood measures dE 0.0, which
   *                     is not a hover at all: the button stops being a
   *                     button under the pointer and the section's own paper
   *                     shows through where it was.
   *
   * `deep` is the documented answer to exactly that — Deep Lilac deepening to
   * Charcoal, dE 73.3 against this paper — and BlobButton.module.css carries
   * the measurements. The prop exists because the ground is a fact about the
   * call site and nothing inside this function can read it.
   */
  tone?: "lilac" | "deep";
  /**
   * How many OTHER sessions can be booked right now — `getRelatedWorkshops`
   * already filters itself to exactly that, and the page already has it.
   *
   * It is a count rather than a boolean so the sentence below cannot drift
   * away from the thing it is counting. See the full-date branch.
   */
  openElsewhere?: number;
}) {
  if (bookable && detail.kind === "scheduled") {
    return (
      <BlobButton
        href={bookingStepHref(detail.workshop)}
        tone={tone}
        className="w-full justify-center px-8 py-5 sm:w-auto"
      >
        Book this experience
      </BlobButton>
    );
  }

  if (detail.kind === "scheduled") {
    /*
      ====================================================================
      "THE PROGRAMME HAS OTHER DATES" WAS NOT TRUE OF THE ONE PAGE THAT
      EVER SAID IT
      ====================================================================

      A `Workshop` carries ONE `startsAt`. There is no second date for a
      programme anywhere in the model, so the sentence promised a thing the
      project cannot hold — and the only page that reaches this branch is
      /events/crocheting, the single full session. The "other dates" it sent
      people looking for were one date for a DIFFERENT activity: candle
      making, three weeks earlier.

      So the sentence is now counted rather than assumed. `openElsewhere` is
      the number of sessions that can actually be booked, and the two
      branches are the only two things the data supports:

        some are open .... say so, and go to the list that holds them.
        none are open .... say that, and stop. No door, because there is
                           nothing behind it — a button to a page of full
                           dates is the same dead end wearing a button.

      <EventBookingBar> carried the same promise as "See other dates" and is
      fixed with it.
    */
    return (
      <div>
        <p className="max-w-[30rem] text-body text-text/85">
          {openElsewhere > 0
            ? "This date is full. Other sessions are open."
            : "This date is full, and nothing else is open just now."}
        </p>
        {openElsewhere > 0 ? (
          <PeelNote
            href="/events#scheduled"
            className="mt-6 min-h-[3.25rem] px-7"
          >
            See what is open
          </PeelNote>
        ) : null}
      </div>
    );
  }

  if (isUpcoming(detail)) {
    return (
      <p className="max-w-[30rem] text-body text-text/85">
        Not running yet. It will appear in the programme when it opens.
      </p>
    );
  }

  /*
    ==========================================================================
    "CREATE ANYTIME" WAS TELLING PEOPLE TO TURN UP AT A STUDIO THAT TRAVELS
    ==========================================================================

    This said "Create anytime. There is no date to book and nothing to
    reserve", and sent anyone who wanted a date to /events. Both halves read
    as "we are always open" — and the Maison is not. <WhereWeSetUp> states the
    actual arrangement: "The studio travels. Each date runs at a mall for that
    day only."

    So five of the seven activities — every walk-in, the majority of the menu —
    told a visitor to come whenever, to a place that is only there on certain
    days, and gave them no way to find out which. That is the site's single
    biggest dead end.

    WHY THERE IS STILL NO DATE ON THIS PAGE, and why that is correct. A
    walk-in carries no date in the data: `CreativeExperience` has no
    `startsAt` and no `venue`, and the dates <WhereWeSetUp> prints are read
    off the SCHEDULED sessions. Printing one of those here would be telling
    somebody the studio runs tote-bag painting on the 11th, which nothing in
    the project says. So the page does not invent a date — it sends them to
    the one place that holds the real ones.

    AND NOT "NO BOOKING NEEDED" EITHER, which is what this first became.
    <WalkInFacts> already says it two rows up — "How it runs: Walk-in / No
    booking needed" — and that row carries the same note about not repeating
    a label. The statement's job is the half the page does NOT say anywhere
    else, which is that turning up has a when.

    THE EYEBROW OVER THE TITLE STILL READS "CREATE ANYTIME" AND SHOULD. That
    is the client's own site-wide name for this half of the menu — see
    lib/brand.ts — and renaming a category is not what this is. What changed
    is only its use HERE, as a sentence with "there is no date to book" under
    it, where it stopped being a category and started being a promise about
    opening hours.
  */
  return (
    <div>
      <p className="text-h3 font-light tracking-[-0.015em] text-text">
        Come on a day we are there.
      </p>
      <p className="mt-3 max-w-[30rem] text-body text-text/85">
        There is nothing to reserve for this one. But the studio travels, and
        each date runs at a mall for that day only.
      </p>
      <PeelNote
        href="/events#where-we-set-up"
        className="mt-6 min-h-[3.25rem] px-7"
      >
        See where we are set up
      </PeelNote>
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
/**
 * ==========================================================================
 * THE SESSION BRIEF — what it is, and the facts, as one object
 * ==========================================================================
 *
 * WHAT THIS REPLACES, AND WHY THE TWO BECAME ONE. The page carried a bare
 * specification strip and, under a second heading and a second set of section
 * margins, a paragraph block. Rendered on a real session the pair read as the
 * client described them: awkward. Six short fields hung off a hairline with no
 * edge to hold them; then a band of empty Light Sage the depth of half a
 * screen; then a script heading in the left third with a SINGLE SHORT SENTENCE
 * stranded in the far column beside it — and a ground doodle landing across
 * the middle of that sentence, because nothing under it was opaque.
 *
 * None of that is fixed by nudging the pieces. The fault is that two thin
 * sections were each given the weight of a whole one. So they are one object
 * now: a White Rock plate on the Light Sage page, the voice at the top of it
 * and the facts ruled off underneath, with the brand's cut-outs breaking its
 * corners from behind. One set of margins, one edge, nothing stranded.
 *
 * THE SENTENCE IS SET AS A STATEMENT, NOT AS BODY COPY. `eventAbout` returns
 * one short line for most activities — it is the client's own description, and
 * five of the seven have nothing longer. A short line at body size across a
 * seven-column measure is exactly what looked broken; at lead size on a
 * 48-character measure directly under its own heading it reads as deliberate,
 * and a longer body, the day one is written, simply flows down the same
 * column.
 *
 * THE PLATE IS ALSO WHAT ENDS THE DOODLE COLLISION. The marks behind this part
 * of the page belong to the section ground; an opaque plate puts the reading
 * matter on its own paper, and the two marks that belong to this object sit
 * inside it, cut by its own corner.
 *
 * IT STILL SAYS ONLY WHAT THE DATA SAYS. The fields are the session's own
 * record and the paragraphs are `eventAbout`. A walk-in activity has no
 * session, so it gets the voice alone; an activity with neither renders
 * nothing at all.
 */
/*
  ==========================================================================
  `group/frame` AND `hover:z-30` — THE HALF OF THE HOVER THAT IS NOT A
  TRANSFORM
  ==========================================================================

  The three frames overlap by 20-28px and are stacked 10 / 20 / 10, so the
  middle one is in front of both its neighbours. Lifting an outer frame
  without raising it too would slide a card UNDER the one beside it — the
  gesture would read as the picture retreating rather than being picked up.
  30 clears both resting levels, and a `hover:` variant outranks the flat
  `z-10` on the same element, so the two can live together.

  The group is named rather than bare: these sit inside <Reveal>, which is
  itself inside a column that already uses `group` elsewhere on this page,
  and an unnamed `group-hover:` would answer to whichever ancestor happened
  to be nearest.
*/
const FRAME_SLOT = [
  "group/frame relative z-10 shrink-0 hover:z-30",
  "group/frame relative z-20 shrink-0 -ml-5 hover:z-30 sm:-ml-7",
  "group/frame relative z-10 shrink-0 -ml-5 hover:z-30 sm:-ml-7",
] as const;

/*
  HOW WIDE A FRAME IS DEPENDS ON HOW MANY THERE ARE.

  It was a flat 36% whatever the activity held, which is right at three and
  leaves a third of the column empty at two — the client's note that the
  pictures should cover the space. The share is now read off the count, so the
  cluster fills its column whether an activity has one photograph or three and
  the empty cream beside it goes.

  The figures allow for the overlap: two frames at 52% meet at a 28px seam and
  come to just under the full width, three at 36% to just over it with two
  seams taken out.
*/
const FRAME_WIDTH: Record<number, string> = {
  1: "w-[64%]",
  2: "w-[52%]",
  3: "w-[36%]",
};

/* Same crop on all three; only the angle varies. */
const FRAME_TILT = [
  "-rotate-[7deg] aspect-[3/4]",
  "rotate-[3deg] aspect-[3/4]",
  "rotate-[9deg] aspect-[3/4]",
] as const;

/*
  ==========================================================================
  THE HOVER — A PHOTOGRAPH PICKED OUT OF A STACK, NOT A ZOOM
  ==========================================================================

  At the client's ask: movement, and explicitly not a zoom. Which is the
  right call for this cluster and worth saying why. These three are drawn as
  prints dropped on a table — overlapped, each a few degrees off square, each
  with its own coloured edge. Scaling one up is a gesture a SCREEN makes; the
  gesture the object itself suggests is being picked up and turned straight
  to be looked at. The site already knows this: `settle` in lib/motion.ts
  brings each photograph in "a degree off square" and lands it, so the hover
  is that arrival played in reverse.

  SO IT STRAIGHTENS AND RISES. Each frame keeps its own character — none goes
  to a true 0deg, because three frames all square at once would be a grid
  pretending to be a scatter — and the one under the pointer comes up 10px
  and forward.

  THE ANGLES ARE PER FRAME BECAUSE THE RESTING ANGLES ARE. A single
  `rotate-0` would move the middle frame 3 degrees and the last one 9, so the
  three would respond at three different speeds to the same gesture. Roughly
  five degrees off each resting angle, toward square:

    -7deg -> -2deg      3deg -> 0.5deg      9deg -> 4deg

  NO SCALE ANYWHERE, which is also what keeps this cheap: `rotate` and
  `translate` are composited, and the figure carries `overflow-clip` and a
  3px border that a scale would have to resample every frame.

  `motion-safe:` on the transform and not on the z-lift — somebody who has
  asked for less motion should still get the frame brought to the front, so
  the hover still answers; it simply answers without travelling.
*/
const FRAME_HOVER = [
  "motion-safe:group-hover/frame:-rotate-[2deg]",
  "motion-safe:group-hover/frame:rotate-[0.5deg]",
  "motion-safe:group-hover/frame:rotate-[4deg]",
] as const;

/* Deep Lilac, Warm Terracotta, Light Sage — a cream frame on a cream plate
   would have no edge at all. */
const FRAME_EDGE = [
  "border-primary/70",
  "border-terracotta/70",
  "border-sage",
] as const;

function SessionBrief({ detail }: { detail: EventDetail }) {
  const paragraphs = eventAbout(detail);
  const frames = eventGallery(detail);
  /* At most three, and the count decides how wide each one is — see
     FRAME_WIDTH. Taken once so the map and the marks read the same number. */
  const shown = frames.slice(0, 3);
  const fields = detail.kind === "scheduled" ? sessionFields(detail.workshop) : [];

  if (paragraphs.length === 0 && fields.length === 0) return null;

  const titled = paragraphs.length > 0;
  /*
    A TICKET ONLY WHERE THERE ARE TWO HALVES TO TEAR. The face is the copy and
    its pictures, the stub is the session's facts — so a brief that is all
    facts and no copy, or all copy and no facts, is one piece of card and is
    drawn as one. Notching a seam that has nothing on the other side of it
    would be a decoration pretending to be a structure.
  */
  const split = titled && fields.length > 0;

  return (
    <section
      aria-labelledby={titled ? "event-about" : undefined}
      aria-label={titled ? undefined : "Session details"}
      className="mt-14 md:mt-16 lg:mt-20"
    >
      {/*
        ==================================================================
        THE BRIEF IS A TICKET, at the client's ask
        ==================================================================

        The copy and its pictures are the face; the session's facts are the
        stub torn off the foot, with a half-circle bitten from each side of
        the seam and a perforation between them. It is the same anatomy the
        booking step's place card uses — see components/ui/Ticket.module.css,
        where it now lives so the two cannot drift.

        NOT `plate`. The notches are masks and a mask clips the box-shadow
        `plate` draws, so a notched plate shows no edge at all. The shadow is
        a `drop-shadow` filter on this wrapper instead, which is computed from
        what the halves actually paint and so follows the bites round.

        AND `wide`, because this card runs the full measure. The place card's
        10px bite is right on a card a few inches across and disappears into
        the corner radius on one this long; see the note on `--notch`.
      */}
      <div
        className={cn(
          "relative",
          split ? cn(ticket.card, ticket.wide) : "plate rounded-[1.75rem]",
        )}
      >
        <div
          className={cn(
            "relative isolate overflow-clip bg-cream px-6 py-9 md:px-10 md:py-11 lg:px-12 lg:py-12",
            split ? cn(ticket.faceCut, "rounded-t-[1.75rem]") : "rounded-[1.75rem]",
          )}
        >
          {/*
            NO MARK ON THE PLATE'S CORNER. There was a 7.25rem lilac splash
            hanging off the top right; the pictures are the thing up there now
            and three marks already sit on them, so a fourth above the cluster
            was a second decoration arguing with the first.
          */}

          {titled ? (
            <div className="grid grid-cols-12 gap-x-10 gap-y-9">
              <div
                className={cn(
                  "col-span-12 max-w-[58ch]",
                  shown.length > 0 && "lg:col-span-6",
                )}
              >
              <Reveal>
                <p className={TERM}>About</p>
              </Reveal>
              <Reveal delay={0.06}>
                <h2
                  id="event-about"
                  className="heading-script mt-4 pb-[0.22em] text-script-compact text-text"
                >
                  About This Experience
                </h2>
              </Reveal>
              {paragraphs.map((paragraph, i) => (
                <Reveal key={i} delay={0.12 + i * 0.06}>
                  <p
                    className={cn(
                      "text-lead leading-[1.7] text-text/85",
                      i === 0 ? "mt-2" : "mt-5",
                    )}
                  >
                    {paragraph}
                  </p>
                </Reveal>
              ))}
              </div>

              {frames.length > 0 ? (
                <div className="col-span-12 lg:col-span-6">
                  <div className="relative mx-auto flex max-w-[30rem] items-center justify-center gap-0 lg:max-w-none">
                    {shown.map((frame, i) => (
                      <Reveal
                        key={frame.src}
                        delay={0.18 + i * 0.08}
                        variant="fadeIn"
                        className={cn(FRAME_SLOT[i], FRAME_WIDTH[shown.length] ?? "w-[36%]")}
                      >
                        <figure
                          className={cn(
                            "plate block w-full overflow-clip rounded-[1.1rem] border-[3px] bg-cream",
                            FRAME_TILT[i],
                            FRAME_EDGE[i],
                            /* 420ms: long enough to read as the card being
                               lifted rather than snapping, short enough that
                               a pointer crossing all three does not leave a
                               queue of animations behind it. `ease-editorial`
                               is front-loaded — most of the travel happens
                               early — which is what a picked-up object does. */
                            "transition-transform duration-[420ms] ease-editorial",
                            "motion-safe:group-hover/frame:-translate-y-2.5",
                            FRAME_HOVER[i],
                          )}
                        >
                          <Image
                            src={frame.src}
                            alt={frame.alt}
                            width={420}
                            height={560}
                            /*
                              TWICE THE FRAME'S WIDTH, because of the crop.

                              This box is 3:4 and `object-cover` scales a
                              picture until it covers BOTH axes — so a
                              landscape photograph is sized by its height, not
                              its width, and the browser then shows a narrow
                              column out of the middle of it. The activity sets
                              the client supplied run from 3:2 to 16:9, and at
                              the frame's own 18vw the widest of them decoded
                              at 259x172 into a 256x322 box: a 1.87x blow-up,
                              and it looked it.

                              16:9 into 3:4 needs 2.37x the element width to
                              cover; 40vw/90vw clears that with a little in
                              hand. A portrait source is width-bound and would
                              have been fine at 18vw — but `sizes` cannot know
                              which it is being handed, so it has to carry the
                              worst case. Roughly 30KB a frame.
                            */
                            sizes="(min-width: 1024px) 40vw, 90vw"
                            className="block h-full w-full object-cover"
                            style={frame.position ? { objectPosition: frame.position } : undefined}
                          />
                        </figure>

                        {/*
                          ON THE FIRST FRAME, NOT ON THE CLUSTER. This was hung
                          off the cluster's own left edge at `-left-5`, which is
                          the same place whatever the cluster holds — and the
                          cluster narrows when an activity has two frames rather
                          than three, so on those pages the mark landed in clear
                          cream beside the pictures instead of across one. Inside
                          the slot it is positioned against the frame itself and
                          crosses its corner at every count.
                        */}
                        {/*
                          ON THE LAST FRAME, for the reason the one below gives:
                          the cluster is `justify-center` inside a column wider
                          than itself, so its own right edge is the COLUMN's and
                          not the pictures'. Hung there, both of these sat in
                          clear cream on every activity that has fewer than three
                          frames. Anchored to the last figure they cross it at
                          one, two or three.
                        */}
                        {i === shown.length - 1 ? (
                          <>
                            <span
                              aria-hidden
                              className="pointer-events-none absolute -right-5 -top-6 z-30 w-14 rotate-[14deg] md:w-16"
                            >
                              <DoodleMark name="bow" color={INK.lilac} treatment="stamp" depth={0} />
                            </span>
                            <span
                              aria-hidden
                              className="pointer-events-none absolute -bottom-6 right-[18%] z-30 w-11 rotate-[8deg] md:w-[3.25rem]"
                            >
                              <DoodleMark
                                name="coral"
                                color={INK.lavender}
                                treatment="stamp"
                                depth={0}
                              />
                            </span>
                          </>
                        ) : null}

                        {i === 0 ? (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute -bottom-5 -left-6 z-30 w-12 -rotate-[12deg] md:w-14"
                          >
                            <DoodleMark
                              name="splash"
                              color={INK.terracotta}
                              treatment="stamp"
                              depth={0}
                            />
                          </span>
                        ) : null}
                      </Reveal>
                    ))}

                    {/*
                      ==============================================================
                      MARKS ON THE CLUSTER, AT THE CLIENT'S ASK
                      ==============================================================

                      There was one, off the shoulder. Three now, and every one of
                      them CROSSES A FRAME'S EDGE rather than sitting beside the
                      group — the standing rule for this brand's cut-outs, and the
                      reason they read as laid on the photographs rather than as
                      stickers parked nearby.

                      THREE COLOURS BECAUSE THE COLOUR PICKS THE DRAWING. In this
                      sheet `resolveIcon` keys off the ink and the shape word only
                      chooses loose or slab, so three marks in one colour would be
                      the same cut-out three times however they were named. Deep
                      Lilac, Warm Terracotta and Soft Lavender give a bow, a splash
                      and a coral — and they are the three edge colours the frames
                      already carry, so each mark answers the frame it sits on.

                      `z-30` puts them over the top frame, which is `z-20`.
                      `stamp` because a plate in the middle of a page never travels
                      through the viewport the way a scroll-drawn mark needs to.
                    */}

                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

        </div>

        {fields.length > 0 ? (
          <div
            className={cn(
              "relative overflow-clip bg-cream px-6 pb-9 pt-8 md:px-10 md:pb-11 md:pt-9 lg:px-12",
              split ? cn(ticket.stubCut, "rounded-b-[1.75rem]") : "rounded-[1.75rem] pt-9",
            )}
          >
            {/* The perforation. Decorative: both halves are one object to a
                screen reader, and nothing is read off the line. */}
            {split ? <span aria-hidden className={ticket.seam} /> : null}
            <dl className="grid grid-cols-2 gap-y-7 md:grid-cols-3 lg:grid-cols-6">
              {fields.map(({ term, value }, i) => (
                <Reveal
                  key={term}
                  delay={i * 0.05}
                  /*
                    Ruled between the columns at `lg`, where the six sit in one
                    row: the hairline is what makes them read as one object
                    rather than as six pairs floating at the same height. Below
                    that they stack two and three up, where a rule between them
                    would only chop the grid about.
                  */
                  className="lg:border-l lg:border-text/15 lg:px-5 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
                >
                  <dt className={TERM}>{term}</dt>
                  {/* `text-balance`: six values in a twelfth of the measure each,
                      and three of them run to two lines. Left to itself the time
                      range broke after "5:30" and dropped a lone "PM"; balanced,
                      the pair of lines come out even. */}
                  <dd className="mt-2.5 text-pretty text-body font-medium leading-snug text-text [text-wrap:balance]">
                    {value}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** The session's own record, as the fields the brief prints. */
function sessionFields(
  workshop: Workshop,
): { term: string; value: React.ReactNode }[] {
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
            value: (
              <>
                {workshop.venue.name}
                <Sub>{workshop.venue.locality}</Sub>
              </>
            ),
          },
        ]
      : []),
    {
      term: "Price",
      value: (
        <>
          {formatPrice(workshop.price)}
          <Sub>per person</Sub>
        </>
      ),
    },
    { term: "Experience", value: workshop.category },
  ];

  return fields;
}

/* ==========================================================================
   SECTION 05 — THE "ABOUT" NOW TRAVELS WITH THE FACTS
   ==========================================================================

   A section stood here on its own twice over: first printing `eventIntro`,
   which <EventHeader> already showed as the lead and which was deleted for
   saying the same sentence twice; then, wired to `eventAbout`, as a script
   heading in the left third with one short sentence stranded in the far
   column beside it.

   The second version was not wrong about the content — `eventAbout` is a
   string the page had never shown — it was wrong about the weight. One short
   line does not fill a seven-column measure under a section's own margins.
   It is part of <SessionBrief> now, set as a statement under its heading on
   the same plate as the session's facts.
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
      ? "Where It Happens"
      : "Where the Maison Sets Up";

  return (
    <section
      aria-labelledby="event-location"
      className="mt-20 md:mt-28 lg:mt-32"
    >
      <div className="border-t border-line pt-10 md:pt-14">
        {/*
          ==================================================================
          /locations' OWN ARRANGEMENT, AT THE CLIENT'S ASK
          ==================================================================

          This was a heading on the left, the destination beside it on the
          right, and the map run full width underneath — which put the answer
          level with the question but sent the map to a band of its own below
          both. The client has asked for the shape /locations uses, and the
          two sections are the same section: a place, said in words, with a
          map of it.

          So the words take one column and the map takes the other. The
          heading, the destination and its line read straight down the left;
          the map holds the right at a shape that fits half a measure rather
          than the whole one.

          FIVE AND SIX OF TWELVE, the same split /locations settles on, and
          for the same reason: the heading is set in the script and a sixth
          column forces its line to turn where the measure decides rather
          than where the design does.

          ==================================================================
          THE TWO COLUMNS END LEVEL, AND NOT BY A FIXED NUMBER
          ==================================================================

          The client asked for the halves to match, and offered a doodle or a
          line of subtext under the heading to pad the short one. Neither
          works, because the difference is not a constant — it is a function
          of the width, and it CHANGES SIGN. Measured, right column minus
          left: +306px at 1920, +205 at 1728, +135 at 1536, +69 at 1440, −8 at
          1280, −241 at 1024. The map keeps an aspect, so it gets taller as it
          gets wider; the words wrap less as they get wider, so they get
          shorter. Any fixed padding fixes one screen and breaks the rest.

          So the row stretches and the LEFT CARD TAKES UP THE SLACK. `plate` is
          already a flex column, so `flex-1` on it fills whatever the heading
          above it leaves, at any width, with no number here to maintain. The
          card's own cut-out then sits on the bottom corner of the column,
          which is the doodle the client asked for — placed by the layout
          rather than positioned against it.

          `items-stretch`, not the `items-start` this had: with the map the
          taller of the two, top-aligning them is what left the short column
          hanging in the first place.
        */}
        <div className="grid grid-cols-12 items-stretch gap-x-6 gap-y-10 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-5 lg:flex lg:flex-col">
            <Reveal>
              <p className={TERM}>Location</p>
              <h2
                id="event-location"
                className="mt-4 heading-script text-script-compact"
              >
                {heading}
              </h2>
            </Reveal>

            {/*
              THE DESTINATION UNDER THE HEADING THAT ASKS FOR IT.

              <LocationMap> draws this plate as its own caption, and the map
              turns that off here — same component, one definition; see
              <PartnerPlate>. It also stops the section saying it twice: this
              column prints the name, the city and the line, and the caption
              would print all three again.
            */}
            <Reveal delay={0.12} className="mt-8 block md:mt-10 lg:flex lg:flex-1 lg:flex-col">
              {partner ? (
                /*
                  `lg:h-full` fills the column; `lg:justify-between` is what
                  stops that reading as a tall card with a hole in it — the
                  name and the line stay at the top and "View location" drops
                  to the foot, so the extra height is the space between two
                  things rather than emptiness under one.

                  AND IT STACKS UNTIL 2xl. <PartnerPlate> turns to a row at
                  `sm`, which keys off the VIEWPORT and not off the column it
                  is in — and this column is five of twelve. At 1024 that put
                  the blurb and the link side by side in 385px and the card
                  came out 477px tall, taller than the map beside it, which is
                  the other half of why these two never matched. Stacked, the
                  words get the whole column.
                */
                <PartnerPlate
                  partner={partner}
                  className="lg:h-full lg:flex-col lg:justify-between lg:gap-8 2xl:flex-row 2xl:items-start 2xl:gap-10"
                />
              ) : (
                <p className="text-lead font-medium leading-snug text-text">
                  {venue?.name}
                  <Sub>{venue?.locality}</Sub>
                </p>
              )}
            </Reveal>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7 lg:self-start">
            {partner ? (
              /*
                THE SHAPE IS SET HERE BECAUSE THE WIDTH IS SET HERE — the same
                note /locations carries. In half the measure the component's
                own `lg:aspect-[2/1]` is a letterbox under 300px tall, which
                is not a map anyone can find a turning on.
              */
              /*
                THE LADDER IS SET SO THE MAP IS NEVER THE SHORTER COLUMN, and
                that is the whole trick: the stretch above only works one way.
                The words fill the map's height; the map cannot fill theirs,
                because its height comes from a ratio rather than from the
                row. So wherever the map is taller the two end level for free,
                and wherever it is SHORTER they cannot.

                At 1024 a 4:3 was 352px against a 486px column and the map
                stopped short. Square is 470 there, which clears it, and by
                1280 the same ratio is 600 — comfortably over, so the words
                stretch instead. Then 4:3 and 16:10 bring it back down as the
                column widens: a 4:3 at 1920 is 685px tall, the largest object
                on the page, for a map of one shop unit.
              */
              <LocationMap
                partners={[partner]}
                caption={false}
                aspect="aspect-[4/5] sm:aspect-[16/10] lg:aspect-square xl:aspect-[4/3] 2xl:aspect-[16/10]"
              />
            ) : (
              /*
                No partnership record for this venue, so no map. Said plainly
                rather than left as a gap where a map obviously belongs.
              */
              <Reveal>
                <p className="max-w-[34rem] text-fine leading-[1.75] text-text/75">
                  Full directions for this centre are confirmed with your booking.
                </p>
              </Reveal>
            )}
          </div>
        </div>
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
            Ready to Create?
          </h2>
          <p className="mt-5 max-w-[32rem] text-lead text-text/80">
            Everything is laid out before you arrive. You bring nothing but
            yourself.
          </p>
        </Reveal>

        <Reveal
          delay={0.12}
          className="col-span-12 md:col-span-5 md:justify-self-end"
        >
          {/* `deep`, because this section is Light Sage and the default
              floods Light Sage — see the note on the prop. */}
          <PrimaryAction detail={detail} bookable={bookable} tone="deep" />
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
    <section aria-labelledby="more-events" className="relative mt-20 md:mt-28 lg:mt-32">
      {/*
        ON THE RIGHT, BECAUSE THE LEFT IS OFF THE PAGE. This hung at `-left-6`
        off the heading's shoulder, which puts it outside the measure and the
        page clips it — half a shape against the window edge. "More events" is
        two words and leaves the rest of its own line empty, so the mark goes
        there instead: still breaking the line the heading sets, and entirely
        on the page.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-8 right-2 hidden w-[4.5rem] rotate-[-14deg] lg:block"
      >
        <DoodleMark name="splash" color={INK.lavender} treatment="stamp" delay={200} />
      </span>

      <Reveal>
        <h2
          id="more-events"
          className="heading-script relative pb-[0.3em] text-script-compact text-text"
        >
          <ScriptTitle>More Events</ScriptTitle>
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
      className="group press-in relative flex flex-col overflow-hidden rounded-[1.25rem] md:rounded-[1.75rem] lg:flex-row"
    >
      {/*
        A RATIO AT `lg`, NOT `aspect-auto` AND A FLOOR ON THE ROW.

        This column was `lg:aspect-auto` with `h-full` on the frame inside it,
        and the row carried `lg:min-h-[20rem]`. Two things were wrong with
        that. The picture is `<Image fill>`, which is absolutely positioned, so
        the frame has no in-flow content and its `h-full` resolves against a
        parent whose height comes only from flex stretch — measured on the
        page, the frame came back 0x0. What was actually visible was the row's
        own 320px floor showing through, and at 55% of the measure that is a
        3.4:1 letterbox: the client's "can't see its view".

        A ratio on the column gives it a definite height of its own, the frame
        resolves against that, and the text beside it stretches to match. 3:2
        puts the picture at about 500px here, which is a photograph rather than
        a band.
      */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-cream lg:aspect-[3/2] lg:w-[55%]">
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

        <span className="flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text">
          <span aria-hidden className="size-1.5 shrink-0 rounded-pill bg-primary" />
          Scheduled session
        </span>

        <span className="heading-script mt-3 block pb-[0.2em] text-script-compact text-text">
          <ScriptTitle>{workshop.title}</ScriptTitle>
        </span>

        <span className="mt-4 block text-lead text-text">
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

        {/*
          SHAPED AS THE SECONDARY BUTTON, at the client's note that underlined
          words are standing in for buttons. It was a word with a hairline that
          wiped in on the card's hover, which is the navigation's treatment and
          the wrong one for the only action on a card.

          IT IS NOT A <BlobButton>, AND CANNOT BE. The whole card is already
          one link — see the `after:absolute after:inset-0` on the title above
          — so a control here would be interactive content nested inside
          interactive content, which is the thing that overlay exists to avoid.
          It is the secondary's sticky note as a plain `span`
          (`trigger="card"`): the card activates it, and hovering the card
          peels it — the same device the rest of the site uses for a second
          action.
        */}
        <PeelNote trigger="card" className="mt-7 w-fit px-5 py-2.5">
          View this session
        </PeelNote>
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
