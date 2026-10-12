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
        {/*
          TWO TINY MARKS, IN THE PADDING, NOT OVER THE WORDS.

          A 5.5rem lavender starburst hung off this corner at -right-4 -top-5
          and crossed both the chips row and the perforation — the overlap the
          client asked to be rid of. These are 1.25rem and 1rem and they sit
          inside the card's own `py-7` / `px-7` band, which no line of text
          reaches, so the card keeps its hand-drawn note and every word stays
          clear of it.

          TWO INKS, BECAUSE THE INK PICKS THE DRAWING. In this sheet the
          COLOUR chooses the glyph and the shape word only picks loose or
          slab, so terracotta and lilac are two different marks however they
          are named — asking for two `dot`s in one colour would print the same
          cut-out twice.
        */}
        <span aria-hidden className="pointer-events-none absolute right-4 top-2.5 w-5 rotate-[-12deg] transition-transform duration-700 ease-editorial motion-safe:group-hover:-translate-y-0.5">
          <DoodleMark name="dot" color={INK.terracotta} treatment="stamp" delay={240} />
        </span>
        <span aria-hidden className="pointer-events-none absolute bottom-2 left-3 w-4 rotate-[14deg] transition-transform duration-700 ease-editorial motion-safe:group-hover:translate-y-0.5">
          <DoodleMark name="bean" color={INK.lilac} treatment="stamp" delay={320} />
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
        {/*
          THE WAY IN, ON A BLOB — the client's "doodle shaped bg" in Deep
          Lilac. An asymmetric `border-radius` (four different corners on each
          axis) draws a hand-pulled pebble rather than a circle, which is the
          shape language the rest of the sheet uses; a second rotation keeps
          it off the grid. No new asset, and it scales with the type.

          Near-white on Deep Lilac measures 4.90:1 — AA for the glyph at this
          size, and it is decorative besides: the whole ticket is the link and
          this is `aria-hidden`.
        */}
        <span
          aria-hidden
          className={cn(
            "grid size-11 shrink-0 self-end place-items-center rounded-[58%_42%_55%_45%/50%_58%_42%_50%]",
            "bg-primary text-on-primary rotate-[-6deg] md:mt-4",
            "transition-transform duration-500 ease-editorial",
            "motion-safe:group-hover:translate-x-1 motion-safe:group-hover:rotate-[2deg]",
          )}
        >
          <span className="text-lead leading-none">&#8594;</span>
        </span>
      </span>
    </Link>
  );
}

/*
  The four grounds a path step cycles through.

  NONE OF THEM IS CREAM, and that is the whole constraint. Cream is what this
  strip sits ON, so a cream step is not a quiet card — it is no card at all:
  the second stop simply disappeared into the page and the route lost a leg.
  Every ground here separates from Cream while staying inside the palette —
  Light Sage, the soft lavender, a terracotta wash, and the near-white the
  rest of the site uses for raised surfaces.

  Charcoal clears AA on all four by a wide margin; Light Sage, the darkest,
  measures 9.07:1.
*/
const PATH_GROUND = ["bg-sage", "bg-lavender-soft", "bg-terracotta/25", "bg-surface"] as const;

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
        {/*
          A PATH, DRAWN AS ONE — the client's note that this section "is
          really a step by step path".

          It was four cards of the same Cream in a plain grid: a list of
          formats that happened to be numbered, with nothing saying one
          follows another. Three things make it a route instead.

          A LINE BETWEEN THEM. Dashed, in the same ink and the same language
          as the ticket's perforation, so the strip belongs to the cards above
          it. It runs ACROSS the gap on `lg`, where the four sit in a row, and
          DOWN the gap below that, where they stack — and it is never drawn
          before the first step, which nothing leads into. `aria-hidden`: the
          order is already carried by the <ol> and by the printed numeral.

          A GROUND PER STEP, cycling the palette's four light grounds so the
          eye can tell one stop from the next. All four take Charcoal at well
          over AA (Light Sage, the darkest of them, measures 9.07:1).

          THE NUMERAL ON ITS OWN DISC, which is what makes a step read as a
          stop on a route rather than as a figure beside a title.
        */}
        <ol className="mt-6 grid gap-x-7 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {types.map((type, i) => {
            const here = type.slug === currentSlug;
            const ground = PATH_GROUND[i % PATH_GROUND.length];
            return (
              <li key={type.slug} className="relative flex">
                {i > 0 ? (
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute border-dashed border-text/30",
                      /* stacked: down through the row gap, above the card */
                      "-top-6 left-9 h-6 border-l-2",
                      /* in a row: across the column gap, at the disc's height */
                      "lg:left-auto lg:top-9 lg:h-0 lg:w-7 lg:-translate-x-7 lg:border-l-0 lg:border-t-2",
                    )}
                  />
                ) : null}
                <Link
                  href={`/events/${type.slug}`}
                  aria-current={here ? "page" : undefined}
                  className={cn(
                    "press-in flex w-full items-start gap-4 rounded-[1.25rem] px-5 py-5 transition-colors duration-300 ease-soft",
                    here ? "bg-text text-surface" : cn(ground, "text-text hover:bg-lavender-soft"),
                  )}
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-pill text-h4 font-medium leading-none tabular-nums",
                      here ? "bg-surface/20 text-surface" : "bg-primary text-on-primary",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 pt-1.5">
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
