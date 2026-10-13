import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
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
/** The grounds a section's tickets take, in the order sections take them — see Ticket.module.css. */
export const TICKET_GROUNDS = ["sage", "lavender", "terracotta", "lilac"] as const;
export type TicketGround = (typeof TICKET_GROUNDS)[number] | "cream";

export function TypeCard({
  type,
  dates,
  perPersonLabel = "per person",
  ground = "sage",
}: {
  type: WorkshopType;
  dates: Workshop[];
  perPersonLabel?: string;
  /** The section's ticket colour; every ticket in one section shares it. */
  ground?: TicketGround;
}) {
  const next = dates[0];
  const from = dates.length ? Math.min(...dates.map((d) => d.price.amount)) : null;
  const currency = dates[0]?.price.currency ?? "AED";

  return (
    <Link
      href={`/events/${type.slug}`}
      data-ground={ground}
      className={cn(styles.ticket, styles.theme, "group press-in w-full overflow-hidden")}
    >
      <span className={cn(styles.body, "relative flex flex-col px-7 py-7 md:px-8 md:py-8")}>
        <span className="relative flex flex-wrap items-center gap-2">
          {/* A plain filled dot, at the client's ask — the calendar icon read
              as clutter on the ticket; the dot is the quiet mark it had. */}
          <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-pill bg-text" />
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
/*
  BRAND TINTS, SOLID, at the client's ask — "use our theme brand colours for
  these cards". Two of the four were not: Light Sage vanished on the format
  page's own Light Sage ground, and `bg-terracotta/25` is translucent, so on
  that ground it came out olive. Each is now a brand colour mixed into White
  Rock (or the site's raised near-white), opaque, so it reads the same on the
  sage format page and the White Rock listing. Charcoal clears all four by a
  wide margin; the darkest, the terracotta, is about 7:1.
*/
const PATH_GROUND = [
  "bg-[color-mix(in_oklab,var(--color-brand-lilac)_24%,var(--color-brand-cream))]",
  "bg-[color-mix(in_oklab,var(--color-brand-terracotta)_30%,var(--color-brand-cream))]",
  "bg-lavender-soft",
  "bg-surface",
] as const;

/*
  The connector between two steps: one S-curve, drawn at the gap's own size
  so nothing scales and the dashes stay even. Across is 40 × 28 (the column
  gap by a card's middle); down is 28 × 32 (the stacked row gap).
*/
const PATH_ACROSS = "M1 14 C 11 2, 29 26, 39 14";
const PATH_DOWN = "M14 1 C 2 9, 26 23, 14 31";
const PATH_STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeDasharray: "3 4",
} as const;

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

          A LINE BETWEEN THEM, CURVED AND CENTRED. Dashed, in the same ink
          and the same language as the ticket's perforation, so the strip
          belongs to the cards above it — and drawn as a little S rather
          than a ruled dash, the way a hand would join two stops on a map,
          at the client's ask. It sits in the MIDDLE of the gap, half way
          down the cards, rather than level with the numerals at the top.

          ACROSS the gap where two steps share a row, DOWN the gap on a phone
          where they stack, and nowhere a row wraps: on the two-up tablet
          grid the third step starts a new row under the first, and a line
          from the second to it would have to cross the card between.
          Never before the first step, which nothing leads into.
          `aria-hidden`: the order is carried by the <ol> and the numerals.

          A GROUND PER STEP, cycling the palette's four light grounds so the
          eye can tell one stop from the next. All four take Charcoal at well
          over AA (see PATH_GROUND).

          THE NUMERAL ON ITS OWN DISC, which is what makes a step read as a
          stop on a route rather than as a figure beside a title.
        */}
        <StepPath
          className="mt-6"
          steps={types.map((type) => ({
            key: type.slug,
            title: type.name,
            note: type.progressionNote,
            href: `/events/${type.slug}`,
            here: type.slug === currentSlug,
          }))}
        />
      </section>
    </Reveal>
  );
}

/** One stop on a {@link StepPath}. */
export interface PathStep {
  key: string;
  title: string;
  note?: string | null;
  /** A step that goes somewhere is a link; one that only explains is not. */
  href?: string;
  /** The page the visitor is on — drawn filled, and `aria-current`. */
  here?: boolean;
}

/**
 * Numbered steps joined by a curved dashed line — the recommended path's
 * strip, shared so anything that is "do this, then this" on the site draws
 * the same way (the walk-in "How it works" on /events is the other one).
 *
 * FOUR OR MORE STEPS go two-up from `sm` and four across from `lg`; THREE
 * stack until `lg` and then sit three across, because a two-up grid of three
 * leaves one card alone on its row with a line that has nowhere to go.
 * Connectors are drawn only between steps that share a row (across) or a
 * column (down), never across a wrap.
 *
 * `grounds` are the step colours in order; the default suits a White Rock
 * page. On a Light Sage section pass ones that are not sage, or the first
 * card is not there.
 */
export function StepPath({
  steps,
  grounds = PATH_GROUND,
  className,
}: {
  steps: readonly PathStep[];
  grounds?: readonly string[];
  className?: string;
}) {
  const twoUp = steps.length >= 4;
  const across = twoUp ? 4 : 3;
  return (
    <ol
      className={cn(
        "grid gap-x-10 gap-y-8",
        twoUp ? "sm:grid-cols-2 sm:gap-y-6 lg:grid-cols-4" : "lg:grid-cols-3 lg:gap-y-6",
        className,
      )}
    >
      {steps.map((step, i) => {
        const ground = grounds[i % grounds.length];
        const body = (
          <>
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-pill text-h4 font-medium leading-none tabular-nums",
                "transition-transform duration-300 ease-soft motion-safe:group-hover/step:scale-[1.08]",
                step.here ? "bg-on-primary text-primary" : "bg-primary text-on-primary",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 pt-1.5">
              <span className="block text-h4 font-medium leading-tight">{step.title}</span>
              {step.note ? (
                <span className={cn("mt-1.5 block text-fine", step.here ? "text-on-primary" : "text-text/75")}>{step.note}</span>
              ) : null}
            </span>
          </>
        );
        /*
          ONE HOVER FOR EVERY STEP, link or not — the client wants the "How it
          works" steps to answer the pointer exactly as the recommended path's
          do. The card lifts a little and its ground deepens a shade; the
          numeral disc grows a touch. No shadow (the client's rule for cards on
          this page). The lift is off for a reader who asked for less motion.
        */
        const card = cn(
          "group/step flex w-full items-start gap-4 rounded-[1.25rem] px-5 py-5",
          "transition-[transform,filter] duration-300 ease-soft",
          "hover:brightness-[0.96] motion-safe:hover:-translate-y-1",
          /* The step you are on: Deep Lilac, the brand's own colour for "this
             one", with the near-white `on-primary` ink (4.90:1). It was
             Charcoal Slate, which read as a dark block rather than a brand. */
          step.here ? "bg-primary text-on-primary" : cn(ground, "text-text", step.href && "press-in"),
        );
        return (
          <li key={step.key} className="relative flex">
            {i > 0 ? (
              <>
                {/* Stacked: down through the 2rem row gap, centred on the card. */}
                <svg
                  aria-hidden
                  viewBox="0 0 28 32"
                  className={cn(
                    "pointer-events-none absolute bottom-full left-1/2 h-8 w-7 -translate-x-1/2 text-text/55",
                    twoUp ? "sm:hidden" : "lg:hidden",
                  )}
                >
                  <path d={PATH_DOWN} {...PATH_STROKE} />
                </svg>
                {/* In a row: across the 2.5rem column gap, half way down the card. */}
                <svg
                  aria-hidden
                  viewBox="0 0 40 28"
                  className={cn(
                    "pointer-events-none absolute right-full top-1/2 hidden h-7 w-10 -translate-y-1/2 text-text/55",
                    twoUp && i % 2 === 1 && "sm:block",
                    i % across === 0 ? "lg:hidden" : "lg:block",
                  )}
                >
                  <path d={PATH_ACROSS} {...PATH_STROKE} />
                </svg>
              </>
            ) : null}
            {step.href ? (
              <Link href={step.href} aria-current={step.here ? "page" : undefined} className={card}>
                {body}
              </Link>
            ) : (
              <div className={card}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
