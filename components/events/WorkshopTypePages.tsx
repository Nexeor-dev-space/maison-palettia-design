import Link from "next/link";

import { eventCopy, modeCopy } from "@/components/blocks/templateCopy";
import { Reveal } from "@/components/motion/Reveal";
import { PartnerPlate } from "@/components/sections/LocationMap";
import { INK } from "@/components/sections/hero/composition";
import { BannerMarks } from "@/components/ui/BannerMarks";
import { DoodleMark } from "@/components/ui/DoodleMark";
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
          <figure className="relative col-span-12 lg:col-span-7">
            <WorkshopPhoto image={image} aspect="aspect-[4/3] sm:aspect-[3/2]" sizes="(min-width: 1024px) 58vw, 100vw" />
            {/* The four cut-outs over the photograph's edges that the
                private-event pages carry; `relative` above is for them. */}
            <BannerMarks />
          </figure>
        ) : null}

        <div className={cn("col-span-12", image ? "lg:col-span-5 lg:flex lg:flex-col lg:self-stretch" : "lg:col-span-8")}>
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

          {/*
            THE FOOT OF THE COLUMN, AND THREE OF THE BRAND'S CUT-OUTS IN IT —
            the client's ask. Beside a 3:2 photograph the words end about half
            way down, and the rest of the column was empty sage next to a full
            picture. The column now stretches to the photograph's height and
            this sits at its foot (`mt-auto`), IN THE FLOW rather than laid
            over it, so on a page with more words it simply moves down and can
            never cover a line. Desktop only: below `lg` the photograph and the
            words stack, and there is no gap to fill.
          */}
          {image ? (
            <div aria-hidden className="pointer-events-none relative mt-10 hidden h-36 w-full max-w-[22rem] self-end lg:mt-auto lg:block">
              <span className="absolute bottom-6 right-[46%] block w-20 rotate-[-14deg]">
                <DoodleMark name="coral" color={INK.lavender} treatment="stamp" delay={120} />
              </span>
              <span className="absolute right-[18%] top-0 block w-16 rotate-[10deg]">
                <DoodleMark name="splash" color={INK.terracotta} treatment="stamp" delay={260} />
              </span>
              <span className="absolute bottom-0 right-0 block w-14 rotate-[-6deg]">
                <DoodleMark name="starburst" color={INK.lilac} treatment="stamp" delay={400} />
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/**
 * The long copy and where it happens, SIDE BY SIDE, at the client's ask.
 *
 * They used to stack: About as a single column of text with the right half of
 * the page empty beside it, then a rule, then the location heading and its
 * plate at full width. Two short things each leaving half the page blank. Now
 * they share one row from `lg` — About on the left, the location on the right
 * — each under its own heading in the page's script, so the two columns read
 * as a pair. Below `lg` they stack in the same order. Either can be missing:
 * with no long copy the location takes the row on its own.
 */
function AboutAndWhere({ paragraphs, partner }: { paragraphs: readonly string[]; partner?: PartnerRecord }) {
  const about = paragraphs.length > 0;
  if (!about && !partner) return null;
  return (
    <div className={cn("mt-16 grid gap-14 border-t border-line pt-10 md:mt-20 md:pt-14", about && partner && "lg:grid-cols-2 lg:gap-16")}>
      {about ? (
        <Reveal>
          <section aria-labelledby="about">
            <h2 id="about" className="heading-script pb-[0.3em] text-script-compact text-text">
              <ScriptTitle>About</ScriptTitle>
            </h2>
            <div className="mt-6 max-w-[40rem] space-y-5 text-body text-text/85 md:mt-8">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      {partner ? (
        <section aria-labelledby="event-location">
          <Reveal>
            <h2 id="event-location" className="heading-script pb-[0.3em] text-script-compact text-text">
              <ScriptTitle>{eventCopy().locationHeadingScheduled}</ScriptTitle>
            </h2>
          </Reveal>
          <PartnerPlate partner={partner} className="mt-6 md:mt-8" line={partner.eventDescriptor ?? partner.descriptor} />
        </section>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The choice — /events/candle-making                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/*
  THE CHOICE PAGE IS LAID OUT LIKE A WALK-IN PAGE, at the client's ask: the
  About card (copy and its photographs) straight under the banner, and the
  location with its map at the foot — the same two sections, from the same
  components, as /events/tote-bag-painting. They used to share one row near
  the end, About beside a location card, with no room for photographs.

  The two arrive as slots because they are the event page's own server
  components (app/(site)/events/[slug]/page.tsx); this file only places them.
*/
export function ChoiceBody({
  detail,
  partner,
  about,
  location,
}: {
  detail: ChoiceEvent;
  partner?: PartnerRecord;
  /** The About card — <SessionBrief> from the event page. */
  about?: React.ReactNode;
  /** The location and its map — <LocationSection> from the event page. */
  location?: React.ReactNode;
}) {
  const { experience, types, sessions } = detail;

  return (
    <>
      <Breadcrumb trail={[]} current={experience.name} />
      <Header
        eyebrow={modeCopy().labels.createTogether}
        title={experience.name}
        intro={eventIntro(detail)}
        image={eventImage(detail)}
        note="Choose a format first, then the date that suits you."
      />

      {about}

      <section aria-labelledby="formats" className="mt-14 md:mt-16">
        <Reveal>
          <h2 id="formats" className={TERM}>
            {types.length === 1 ? "The format" : "Choose a format"}
          </h2>
        </Reveal>
        <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:gap-6">
          {types.map((type, i) => (
            <Reveal as="li" key={type.slug} delay={i * 0.06} className="flex">
              {/* White Rock: this page is Light Sage, where the listing's sage
                  ticket would have no edge at all — only its words showed. */}
              <TypeCard
                type={type}
                dates={sessions.filter((session) => session.workshopType?.slug === type.slug)}
                perPersonLabel={eventCopy().perPersonLabel}
                ground="cream"
              />
            </Reveal>
          ))}
        </ul>
      </section>

      <Progression types={types} />
      {location ?? <AboutAndWhere paragraphs={[]} partner={partner} />}
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
        eyebrow={experience?.name ?? modeCopy().labels.createTogether}
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
          <ol className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-5 xl:gap-6">
            {sessions.map((session, i) => (
              <Reveal as="li" key={session.slug} delay={Math.min(i, 6) * 0.04} className="flex">
                <SessionTicket session={session} renderedAt={renderedAt} priceTerm={eventCopy().priceTerm} perPersonLabel={eventCopy().perPersonLabel} />
              </Reveal>
            ))}
          </ol>
        )}
      </section>

      <Progression types={siblings} currentSlug={type.slug} />
      <AboutAndWhere paragraphs={eventAbout(detail)} partner={partner} />
    </>
  );
}
