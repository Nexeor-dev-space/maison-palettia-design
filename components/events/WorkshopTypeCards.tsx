import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { ModeMark } from "@/components/ui/ModeMark";
import { ScriptTitle } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { formatPrice, formatSessionDate, sessionTimeRange } from "@/lib/workshopHelpers";
import type { WorkshopType } from "@/lib/workshopTypes";
import type { Workshop } from "@/types";

import styles from "./Ticket.module.css";

/**
 * ==========================================================================
 * The format card and the progression strip — shared by two surfaces
 * ==========================================================================
 *
 * A format (a candle theme, a crochet level — lib/workshopTypes.ts) is
 * drawn the same way wherever it is offered: on the experience's own page
 * (components/events/WorkshopTypePages.tsx) and in the Create Together
 * listing on /events (components/events/EventsBrowser.tsx), which filters
 * the same cards by date, event and vibe. One card, one strip, so a visitor
 * who moves from the listing to the experience meets what they just saw.
 *
 * NOTHING HERE READS THE REQUEST. The listing is a client component, and
 * the template labels (`eventCopy()`) live in a server-side holder, so the
 * one label a card prints — "per person" — arrives as a prop; the server
 * callers pass the CMS's word and the listing passes the same word from the
 * page that rendered it.
 */

/** The small-caps label every field on the event pages uses. */
export const TERM = "block text-label font-medium uppercase tracking-eyebrow text-text/75";

/** "Beginner" · "New this month" — a small chip beside a name. */
export function LevelChip({ children, tone = "cream" }: { children: string; tone?: "cream" | "lilac" }) {
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
 * One format: name, level, the studio's line, and the next date it runs.
 * The whole card is the link to the format's page; the Book button lives
 * there, beside the dates, because a format is not a date.
 *
 * CUT AS A TICKET, at the client's ask (Ticket.module.css): the name and
 * the line on the body, the next date and the price on a stub torn off
 * the end, where the arrow sits. On a phone the stub is the card's foot.
 *
 * `dates` are the format's sessions AHEAD, soonest first — the caller has
 * already dropped the passed ones (the resolver on the experience page,
 * `renderedAt` in the listing) and, in the listing, the ones outside the
 * visitor's filters — so the first is the next date and the price is read
 * off what can still be booked.
 */
export function TypeCard({
  type,
  dates,
  perPersonLabel = "per person",
}: {
  type: WorkshopType;
  dates: Workshop[];
  perPersonLabel?: string;
}) {
  const next = dates[0];
  const from = dates.length ? Math.min(...dates.map((d) => d.price.amount)) : null;
  const currency = dates[0]?.price.currency ?? "AED";

  return (
    <Link href={`/events/${type.slug}`} className={cn(styles.ticket, styles.theme, "group press-in w-full overflow-hidden")}>
      <span className={cn(styles.body, "relative flex flex-col px-7 py-7 md:px-8 md:py-8")}>
        <span aria-hidden className="pointer-events-none absolute -right-4 -top-5 w-[4.5rem] rotate-[-10deg] transition-transform duration-700 ease-editorial motion-safe:group-hover:translate-y-1 md:w-[5.5rem]">
          <DoodleMark name="starburst" color={INK.lavender} treatment="stamp" delay={240} />
        </span>

        <span className="relative flex flex-wrap items-center gap-2">
          <ModeMark mode="scheduled" />
          {type.level ? <LevelChip>{type.level}</LevelChip> : null}
          {type.status ? <LevelChip tone="lilac">{type.status}</LevelChip> : null}
        </span>
        <span className="heading-script relative mt-3 block pb-[0.2em] text-script-panel">
          <ScriptTitle>{type.name}</ScriptTitle>
        </span>
        {type.description ? <span className="relative mt-2 block max-w-[30rem] text-body text-text/85">{type.description}</span> : null}
        {type.progressionNote ? <span className="relative mt-2 block text-fine text-text/75">{type.progressionNote}</span> : null}
      </span>

      {/* The stub: the next date, the price, and the way in. */}
      <span className={cn(styles.stub, "px-6 py-4 md:px-7 md:py-6")}>
        <span className="min-w-0">
          <span className={TERM}>Next date</span>
          {next ? (
            <span className="mt-1.5 block text-body font-medium leading-snug">
              {formatSessionDate(next.startsAt)}
              <span className="block">{sessionTimeRange(next.startsAt, next.durationMinutes).start}</span>
              {from !== null ? (
                <span className="mt-1 block text-fine font-normal text-text/75">
                  {dates.length > 1 && dates.some((d) => d.price.amount !== from) ? "From " : ""}
                  {formatPrice({ amount: from, currency })} {perPersonLabel}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="mt-1.5 block text-body text-text/75">Dates are being set.</span>
          )}
        </span>
        <span
          aria-hidden
          className="shrink-0 self-end text-lead leading-none transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1 md:mt-4"
        >
          &#8594;
        </span>
      </span>
    </Link>
  );
}

/**
 * The recommended path through an experience's formats, drawn only when
 * the studio has set one (a note or a "recommended after" on any type).
 * Themes have none and get no strip; the crochet ladder gets its order.
 *
 * The client asked for the booking page to "clearly communicate the
 * recommended learning progression": the listing draws this strip under
 * the crochet formats, and the experience and format pages draw it again,
 * so the order is the same wherever a level is chosen.
 */
export function Progression({
  types,
  currentSlug,
  id = "progression",
  heading: Heading = "h2",
  className = "mt-14 md:mt-16",
}: {
  types: readonly WorkshopType[];
  currentSlug?: string;
  /** Unique on the page: the listing draws one strip per experience. */
  id?: string;
  /** The heading level the strip sits under — h2 on its own page, h4 inside a listing group. */
  heading?: "h2" | "h3" | "h4";
  className?: string;
}) {
  const hasPath = types.some((type) => type.recommendedAfterSlug || type.progressionNote);
  if (!hasPath || types.length < 2) return null;

  return (
    <Reveal>
      <section aria-labelledby={id} className={className}>
        <Heading id={id} className={TERM}>
          Recommended path
        </Heading>
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
