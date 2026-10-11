import Link from "next/link";

import { SessionGate } from "@/components/booking/SessionClock";
import { eventCopy } from "@/components/blocks/templateCopy";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { PartnerPlate } from "@/components/sections/LocationMap";
import { BlobButton } from "@/components/ui/BlobButton";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { ModeMark } from "@/components/ui/ModeMark";
import { PeelNote } from "@/components/ui/PeelNote";
import { ScriptTitle } from "@/components/ui/SectionHeader";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import type { ChoiceEvent, TypeEvent } from "@/lib/eventDetail";
import { eventAbout, eventImage, eventIntro } from "@/lib/eventDetail";
import type { PartnerRecord } from "@/lib/partners";
import { cn } from "@/lib/utils";
import {
  bookingStepHref,
  durationToIso,
  formatDuration,
  formatPrice,
  formatSessionDate,
  isFullyBooked,
  isScarce,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshopHelpers";
import type { WorkshopType } from "@/lib/workshopTypes";
import type { Workshop } from "@/types";

/**
 * ==========================================================================
 * The two pages a formatted experience adds — the choice, and the dates
 * ==========================================================================
 *
 * The client's Oct 2026 "Scheduled Workshops Update" asks for a booking
 * flow in two steps: pick the format (a candle theme, a crochet level),
 * then pick a date within it. Both pages live at /events/{slug} like every
 * other event page, resolved by lib/eventDetail.ts:
 *
 *   /events/candle-making ............ <ChoiceBody>: the experience's formats
 *   /events/cheesecake-collection .... <TypeBody>: that format's dates ahead
 *   /events/cheesecake-collection-2026-11-17-1100 ... the session page, unchanged
 *
 * Nothing about booking changed: every "Book" here is `bookingStepHref`,
 * the same door the session page opens. These pages decide which date is
 * offered, never what happens behind it.
 *
 * SERVER COMPONENTS. Dates, prices and availability are the server's
 * verdict as of the render, handed to <SessionGate> where a clock matters
 * so a date that lapses while the page is open closes itself.
 *
 * NO COUNTS. The cards say "Next date: …" rather than "6 dates", per the
 * client's rule against printing a number that can change (PDF p05).
 */

/** The small-caps label every field on the event pages uses. */
const TERM = "block text-label font-medium uppercase tracking-eyebrow text-text/75";

/* ────────────────────────────────────────────────────────────────────────── */
/* Shared pieces                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function Breadcrumb({ trail, current }: { trail: { label: string; href?: string }[]; current: string }) {
  return (
    <Reveal>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-label font-medium uppercase tracking-eyebrow text-text/75">
          {[{ label: "Home", href: "/" }, { label: eventCopy().breadcrumbRoot, href: "/events" }, ...trail].map((crumb) => (
            <li key={crumb.label} className="flex items-center gap-2.5">
              {crumb.href ? (
                <Link href={crumb.href} className="-my-3.5 py-3.5 transition-colors duration-300 ease-soft hover:text-text focus-visible:text-text">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              <span aria-hidden className="text-text/70">
                /
              </span>
            </li>
          ))}
          <li className="text-text" aria-current="page">
            {current}
          </li>
        </ol>
      </nav>
    </Reveal>
  );
}

/**
 * Photograph on the left, the words on the right — the same first screen
 * the session page opens on, so a visitor moving from the choice to a
 * format to a date sees one page design throughout.
 */
function Header({
  eyebrow,
  title,
  intro,
  image,
  level,
  flag,
  note,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string | null;
  image?: { src: string; alt: string; position?: string };
  level?: string;
  flag?: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby="event-title" className="mt-9 md:mt-12">
      <div className="grid grid-cols-12 items-start gap-x-6 gap-y-10 lg:gap-x-10">
        {image ? (
          <figure className="col-span-12 -mx-gutter lg:col-span-7 lg:mx-0">
            <WorkshopPhoto image={image} aspect="aspect-[4/3] sm:aspect-[3/2]" sizes="(min-width: 1024px) 58vw, 100vw" />
          </figure>
        ) : null}

        <div className={cn("col-span-12", image ? "lg:col-span-5" : "lg:col-span-8")}>
          <Reveal>
            <p className="flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-text/75">
              <span aria-hidden className="h-px w-6 shrink-0 bg-terracotta" />
              {eyebrow}
            </p>
          </Reveal>

          <h1 id="event-title" className="mt-5">
            <Reveal as="span" variant="maskUp" className="heading-script block pb-[0.3em] text-script-compact">
              <ScriptTitle>{title}</ScriptTitle>
            </Reveal>
          </h1>

          {level || flag ? (
            <Reveal delay={0.08}>
              <p className="mt-2 flex flex-wrap items-center gap-2">
                {level ? <LevelChip>{level}</LevelChip> : null}
                {flag ? <LevelChip tone="lilac">{flag}</LevelChip> : null}
              </p>
            </Reveal>
          ) : null}

          {intro ? (
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-[34rem] text-lead text-text/85">{intro}</p>
            </Reveal>
          ) : null}

          {note ? (
            <Reveal delay={0.14}>
              <p className="mt-4 max-w-[34rem] text-body text-text/75">{note}</p>
            </Reveal>
          ) : null}

          {children}
        </div>
      </div>
    </section>
  );
}

/** "Beginner" · "New this month" — a small chip beside a name. */
function LevelChip({ children, tone = "cream" }: { children: string; tone?: "cream" | "lilac" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-3 py-1 text-label font-medium uppercase tracking-eyebrow",
        tone === "lilac" ? "bg-primary text-on-primary" : "bg-cream text-text",
      )}
    >
      {children}
    </span>
  );
}

/**
 * The recommended path through an experience's formats, drawn only when
 * the studio has set one (a note or a "recommended after" on any type).
 * Themes have none and get no strip; the crochet ladder gets its order.
 */
function Progression({ types, currentSlug }: { types: readonly WorkshopType[]; currentSlug?: string }) {
  const hasPath = types.some((type) => type.recommendedAfterSlug || type.progressionNote);
  if (!hasPath || types.length < 2) return null;

  return (
    <Reveal>
      <section aria-labelledby="progression" className="mt-14 md:mt-16">
        <h2 id="progression" className={TERM}>
          Recommended path
        </h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {types.map((type, i) => {
            const here = type.slug === currentSlug;
            return (
              <li key={type.slug} className="flex">
                <Link
                  href={`/events/${type.slug}`}
                  aria-current={here ? "page" : undefined}
                  className={cn(
                    "press-in flex w-full items-start gap-4 rounded-[1.25rem] px-5 py-5 transition-colors duration-300 ease-soft",
                    here ? "bg-text text-surface" : "bg-cream text-text hover:bg-lavender-soft",
                  )}
                >
                  <span className={cn("text-folio font-light leading-none tabular-nums", here ? "text-surface/60" : "text-primary")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-h4 font-medium leading-tight">{type.name}</span>
                    {type.progressionNote ? (
                      <span className={cn("mt-1.5 block text-fine", here ? "text-surface/75" : "text-text/75")}>{type.progressionNote}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </Reveal>
  );
}

/** The long copy, when there is any. */
function About({ paragraphs }: { paragraphs: readonly string[] }) {
  if (paragraphs.length === 0) return null;
  return (
    <Reveal>
      <section aria-labelledby="about" className="mt-16 max-w-[40rem] md:mt-20">
        <h2 id="about" className={TERM}>
          About
        </h2>
        <div className="mt-5 space-y-5 text-body text-text/85">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

/** Where it happens — the studio's one current centre, as the session page prints it. */
function Where({ partner }: { partner?: PartnerRecord }) {
  if (!partner) return null;
  return (
    <section aria-labelledby="event-location" className="mt-20 md:mt-28">
      <div className="border-t border-line pt-10 md:pt-14">
        <Reveal>
          <h2 id="event-location" className="heading-script pb-[0.3em] text-script-compact text-text">
            <ScriptTitle>{eventCopy().locationHeadingScheduled}</ScriptTitle>
          </h2>
        </Reveal>
        <PartnerPlate partner={partner} className="mt-8 md:mt-10" line={partner.eventDescriptor ?? partner.descriptor} />
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The choice — /events/candle-making                                         */
/* ────────────────────────────────────────────────────────────────────────── */

export function ChoiceBody({ detail, partner }: { detail: ChoiceEvent; partner?: PartnerRecord }) {
  const { experience, types, sessions } = detail;

  return (
    <>
      <Breadcrumb trail={[]} current={experience.name} />
      <Header
        eyebrow="Create Together"
        title={experience.name}
        intro={eventIntro(detail)}
        image={eventImage(detail)}
        note="Choose a format first, then the date that suits you."
      />

      <section aria-labelledby="formats" className="mt-14 md:mt-16">
        <Reveal>
          <h2 id="formats" className={TERM}>
            {types.length === 1 ? "The format" : "Choose a format"}
          </h2>
        </Reveal>
        <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:gap-6">
          {types.map((type, i) => (
            <Reveal as="li" key={type.slug} delay={i * 0.06} className="flex">
              <TypeCard type={type} dates={sessions.filter((session) => session.workshopType?.slug === type.slug)} />
            </Reveal>
          ))}
        </ul>
      </section>

      <Progression types={types} />
      <About paragraphs={eventAbout(detail)} />
      <Where partner={partner} />
    </>
  );
}

/**
 * One format: name, level, the studio's line, and the next date it runs.
 * The whole card is the link to the format's page; the Book button lives
 * there, beside the dates, because a format is not a date.
 */
function TypeCard({ type, dates }: { type: WorkshopType; dates: Workshop[] }) {
  const next = dates[0];
  const from = dates.length ? Math.min(...dates.map((d) => d.price.amount)) : null;
  const currency = dates[0]?.price.currency ?? "AED";

  return (
    <Link
      href={`/events/${type.slug}`}
      className="group press-in relative flex w-full flex-col justify-between overflow-hidden rounded-[1.25rem] bg-cream px-7 py-7 text-text md:rounded-[1.5rem] md:px-8 md:py-8"
    >
      <span aria-hidden className="pointer-events-none absolute -right-4 -top-5 w-[4.5rem] rotate-[-10deg] transition-transform duration-700 ease-editorial motion-safe:group-hover:translate-y-1 md:w-[5.5rem]">
        <DoodleMark name="starburst" color={INK.lavender} treatment="stamp" delay={240} />
      </span>

      <span className="relative">
        <span className="flex flex-wrap items-center gap-2">
          <ModeMark mode="scheduled" />
          {type.level ? <LevelChip>{type.level}</LevelChip> : null}
          {type.status ? <LevelChip tone="lilac">{type.status}</LevelChip> : null}
        </span>
        <span className="heading-script mt-3 block pb-[0.2em] text-script-panel">
          <ScriptTitle>{type.name}</ScriptTitle>
        </span>
        {type.description ? <span className="mt-2 block max-w-[30rem] text-body text-text/85">{type.description}</span> : null}
        {type.progressionNote ? <span className="mt-2 block text-fine text-text/75">{type.progressionNote}</span> : null}
      </span>

      <span className="relative mt-7 flex items-end justify-between gap-6 border-t border-line pt-5">
        <span>
          <span className={TERM}>Next date</span>
          {next ? (
            <span className="mt-2 block text-body font-medium">
              {formatSessionDate(next.startsAt)}
              <span aria-hidden className="px-2 text-text/60">
                &middot;
              </span>
              {sessionTimeRange(next.startsAt, next.durationMinutes).start}
              {from !== null ? (
                <span className="mt-1 block text-fine font-normal text-text/75">
                  {dates.length > 1 && dates.some((d) => d.price.amount !== from) ? "From " : ""}
                  {formatPrice({ amount: from, currency })} {eventCopy().perPersonLabel}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="mt-2 block text-body text-text/75">Dates are being set.</span>
          )}
        </span>
        <span aria-hidden className="shrink-0 text-lead leading-none transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
          &#8594;
        </span>
      </span>
    </Link>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The dates — /events/cheesecake-collection                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export function TypeBody({
  detail,
  siblings,
  partner,
  renderedAt,
}: {
  detail: TypeEvent;
  /** Every format of the same experience, in order — the progression strip. */
  siblings: readonly WorkshopType[];
  partner?: PartnerRecord;
  /** The page's one clock, for the server's verdict on each date. */
  renderedAt: number;
}) {
  const { type, experience, sessions } = detail;
  const trail = experience ? [{ label: experience.name, href: `/events/${experience.slug}` }] : [];

  return (
    <>
      <Breadcrumb trail={trail} current={type.name} />
      <Header
        eyebrow={experience?.name ?? "Create Together"}
        title={type.name}
        intro={eventIntro(detail)}
        image={eventImage(detail)}
        level={type.level}
        flag={type.status}
        note={type.progressionNote}
      />

      <section aria-labelledby="dates" className="mt-14 md:mt-16">
        <Reveal>
          <h2 id="dates" className="heading-script pb-[0.3em] text-script-compact text-text">
            <ScriptTitle>Pick a date</ScriptTitle>
          </h2>
        </Reveal>

        {sessions.length === 0 ? (
          <Reveal className="mt-6 border-t border-line pt-8">
            <p className="max-w-[30rem] text-h3 font-light tracking-[-0.015em]">The next dates are being set.</p>
            {experience ? (
              <PeelNote href={`/events/${experience.slug}`} className="mt-7 min-h-[3.25rem] px-7">
                See the other formats
              </PeelNote>
            ) : null}
          </Reveal>
        ) : (
          <ol className="mt-6 border-t border-line">
            {sessions.map((session, i) => (
              <Reveal as="li" key={session.slug} delay={Math.min(i, 6) * 0.04} className="border-b border-line">
                <DateRow session={session} renderedAt={renderedAt} />
              </Reveal>
            ))}
          </ol>
        )}
      </section>

      <Progression types={siblings} currentSlug={type.slug} />
      <About paragraphs={eventAbout(detail)} />
      <Where partner={partner} />
    </>
  );
}

/**
 * One date: when, how long, where, how much, what is left, and the door.
 *
 *   open .......... "Book" into the booking step
 *   waitlist ...... "Join the waitlist" to the session page, which holds the form
 *   full .......... the state, in words, and a link to the date's page
 *   passed ........ never listed: the resolver drops them before render,
 *                   and <SessionGate> closes a row that lapses on screen
 */
function DateRow({ session, renderedAt }: { session: Workshop; renderedAt: number }) {
  const { weekday, day, month } = sessionDateParts(session.startsAt);
  const { start, end } = sessionTimeRange(session.startsAt, session.durationMinutes);
  const full = isFullyBooked(session);
  const waitlist = session.status === "waitlist" || full;
  const scarce = isScarce(session);
  const passed = Date.parse(session.startsAt) <= renderedAt;

  return (
    <div className="grid grid-cols-12 items-center gap-x-4 gap-y-4 py-5 md:gap-x-6 md:py-6">
      {/* The date, set stepped: the numeral largest, the day and month under it. */}
      <Link href={workshopHref(session)} className="col-span-6 flex items-baseline gap-3 md:col-span-3">
        <time dateTime={session.startsAt} className="text-folio font-light leading-none tabular-nums text-text">
          {day}
        </time>
        <span className="text-body font-medium leading-tight text-text">
          {month}
          <span className="block text-fine font-normal text-text/75">{weekday}</span>
        </span>
      </Link>

      <div className="col-span-6 md:col-span-3">
        <span className={TERM}>Time</span>
        <p className="mt-1 text-body font-medium tabular-nums text-text">
          {start} <span aria-hidden className="text-text/50">–</span> <span className="sr-only">to</span> {end}
        </p>
        <p className="text-fine text-text/75">
          <time dateTime={durationToIso(session.durationMinutes)}>{formatDuration(session.durationMinutes)}</time>
          {session.venue ? <span> · {session.venue.name}</span> : null}
        </p>
      </div>

      <div className="col-span-6 md:col-span-2">
        <span className={TERM}>{eventCopy().priceTerm}</span>
        <p className="mt-1 text-body font-medium text-text">
          {formatPrice(session.price)}
          <span className="block text-fine font-normal text-text/75">{eventCopy().perPersonLabel}</span>
        </p>
      </div>

      <div className="col-span-6 flex flex-col items-end gap-3 md:col-span-4 md:flex-row md:items-center md:justify-end md:gap-5">
        <p className="flex items-center gap-2 text-label font-medium uppercase tracking-eyebrow text-text">
          <SessionGate
            startsAt={session.startsAt}
            passedAtRender={passed}
            open={
              <>
                {scarce ? <span aria-hidden className="size-1.5 shrink-0 rounded-pill bg-primary" /> : null}
                {spotsLabel(session)}
              </>
            }
            passed="Date passed"
          />
        </p>
        <SessionGate
          startsAt={session.startsAt}
          passedAtRender={passed}
          open={
            waitlist ? (
              <PeelNote href={workshopHref(session)} className="min-h-[2.75rem] px-5">
                {full && session.status !== "waitlist" ? "View date" : "Join the waitlist"}
              </PeelNote>
            ) : (
              <BlobButton href={bookingStepHref(session)} className="px-6 py-3.5">
                Book
              </BlobButton>
            )
          }
          passed={null}
        />
      </div>
    </div>
  );
}
