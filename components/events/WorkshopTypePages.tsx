import Link from "next/link";

import { eventCopy } from "@/components/blocks/templateCopy";
import { Reveal } from "@/components/motion/Reveal";
import { PartnerPlate } from "@/components/sections/LocationMap";
import { PeelNote } from "@/components/ui/PeelNote";
import { ScriptTitle } from "@/components/ui/SectionHeader";
import { SessionTicket } from "@/components/events/SessionTicket";
import { LevelChip, Progression, TERM, TypeCard } from "@/components/events/WorkshopTypeCards";
import { WorkshopPhoto } from "@/components/workshops/WorkshopPhoto";
import type { ChoiceEvent, TypeEvent } from "@/lib/eventDetail";
import { eventAbout, eventImage, eventIntro } from "@/lib/eventDetail";
import type { PartnerRecord } from "@/lib/partners";
import { cn } from "@/lib/utils";

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


/* ────────────────────────────────────────────────────────────────────────── */
/* Shared pieces (the card and the path strip are in WorkshopTypeCards.tsx)   */
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
              <TypeCard type={type} dates={sessions.filter((session) => session.workshopType?.slug === type.slug)} perPersonLabel={eventCopy().perPersonLabel} />
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

/* ────────────────────────────────────────────────────────────────────────── */
/* The dates — /events/cheesecake-collection                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export function TypeBody({
  detail,
  partner,
  renderedAt,
}: {
  detail: TypeEvent;
  partner?: PartnerRecord;
  /** The page's one clock, for the server's verdict on each date. */
  renderedAt: number;
}) {
  const { type, experience, siblings, sessions } = detail;
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
          /*
            TICKETS, NOT ROWS — see <SessionTicket>. The run used to be a
            bordered table; each date is a cream ticket now, with its seats
            and its Book on a stub, so the list reads as the things it is
            selling.
          */
          <ol className="mt-6 grid gap-4 md:mt-8 md:gap-5">
            {sessions.map((session, i) => (
              <Reveal as="li" key={session.slug} delay={Math.min(i, 6) * 0.04}>
                <SessionTicket session={session} renderedAt={renderedAt} priceTerm={eventCopy().priceTerm} perPersonLabel={eventCopy().perPersonLabel} />
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
