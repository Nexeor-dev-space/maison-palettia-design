"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { StepPath, TERM } from "@/components/events/WorkshopTypeCards";
import { FindYourVibe } from "@/components/layout/FindYourVibe";
import { PaintStroke } from "@/components/layout/PaintStroke";
import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { ModeMark } from "@/components/ui/ModeMark";
import type { CreativeExperience } from "@/lib/experiences";
import { cn } from "@/lib/utils";
import { experiencesByVibe, hasVibeTags, vibeCounts, type VibeSlug } from "@/lib/vibes";

/**
 * The walk-in half of /events — what you can come in and make, and how.
 *
 * ==========================================================================
 * IT WAS A ROW OF PICTURES, AND VISITORS COULD NOT TELL WHAT TO DO WITH IT
 * ==========================================================================
 *
 * This half used the home page's carousel: tilted photographs with a big
 * numeral, the name and "Any time" under each, a "View details" that only
 * appeared on hover, and the fifth card cut off at the edge of the screen.
 * The client's read was that the cards were confusing — a visitor could see
 * five pretty pictures but not what they were for, what was on offer, or
 * what to do next. Three things change:
 *
 *   HOW IT WORKS, FIRST. Three short steps above the cards — choose a
 *   project, drop in, make it yours — so the cards are read as "the projects
 *   you can choose from" before the first one is looked at. The words are the
 *   page's own (the Create Anytime door's note and this group's lead), so
 *   nothing here promises more than the studio already says.
 *
 *   A CARD THAT SAYS WHAT IT IS AND WHAT TO DO. The photograph, the name, the
 *   activity's own one-line description (the old card never showed it), how
 *   it runs — no booking needed — and a visible "View details" on every card,
 *   at every width, with the same lilac pebble arrow the doors and tickets
 *   use. The whole card is the link.
 *
 *   EVERYTHING VISIBLE, AND GROUPED BY WHAT YOU CAN DO TODAY. A grid instead
 *   of a track, so all of them can be compared without scrolling sideways;
 *   the ones running now under "Open for drop-ins", and the studio's
 *   "Coming soon" ones in their own quieter group after them, so nobody
 *   plans a visit around something that is not on yet.
 *
 * THE HOME PAGE KEEPS ITS CAROUSEL. That is a teaser of every activity; this
 * is the walk-in catalogue, where the visitor is choosing.
 *
 * DISCOVERY SITS OVER THE LISTING, NEVER INSTEAD OF IT. The vibe chips (when
 * the data has vibe tags) narrow the same cards rather than replacing them.
 *
 * NOTHING HERE BOOKS ANYTHING. Every card is a link to the activity's own
 * page. Walk-in experiences have no date, no seat count and no checkout.
 */
export function WalkInDiscovery({ experiences }: { experiences: CreativeExperience[] }) {
  const [vibe, setVibe] = useState<VibeSlug | null>(null);

  const offersVibes = useMemo(() => hasVibeTags(experiences), [experiences]);
  const counts = useMemo(() => {
    const out = {} as Record<VibeSlug, number>;
    for (const { vibe: v, count } of vibeCounts(experiences)) out[v.slug] = count;
    return out;
  }, [experiences]);

  const shown = useMemo(
    () => (vibe ? experiencesByVibe(experiences, vibe) : experiences),
    [experiences, vibe],
  );
  /* "Coming soon" — the studio's own flag — is the one thing that splits them. */
  const open = shown.filter((experience) => !experience.status);
  const soon = shown.filter((experience) => experience.status);

  return (
    <Container>
      <Reveal className="mt-9 md:mt-11">
        <HowItWorks />
      </Reveal>

      {offersVibes ? (
        <Reveal delay={0.1} className="mt-9 md:mt-11">
          <FindYourVibe counts={counts} selected={vibe} onSelect={setVibe} size="full" />
        </Reveal>
      ) : null}

      {/*
        `aria-live` on the count rather than on the list: a screen reader
        should hear "showing four" once, not every card re-announced each time
        a chip is pressed.
      */}
      <p aria-live="polite" className="sr-only">
        {shown.length} Create Anytime {shown.length === 1 ? "experience" : "experiences"} shown
      </p>

      {shown.length === 0 ? (
        <p className="mt-10 max-w-[34rem] text-body text-text/85">
          Nothing is tagged that way yet. Clear the filter to see every Create Anytime experience.
        </p>
      ) : (
        <div className="mt-10 flex flex-col gap-12 md:mt-12 md:gap-14">
          {open.length > 0 ? <CardGroup id="walk-in-open" title="Open for drop-ins" experiences={open} /> : null}
          {soon.length > 0 ? <CardGroup id="walk-in-soon" title="Coming soon" experiences={soon} quiet offset={open.length} /> : null}
        </div>
      )}
    </Container>
  );
}

/* ==========================================================================
   How it works
   ========================================================================== */

/*
  The three steps, in the page's own words: the Create Anytime door says
  "Drop in, choose an experience and create at your own pace … just pick a
  project and make it yours", and this group's lead says "Pick a project.
  Pick your colours. Just drop in." Nothing here is a new claim.
*/
const STEPS = [
  { title: "Choose a project", body: "Browse the activities below and pick the one you would like to make." },
  { title: "Drop in", body: "No booking needed. Just come in to the studio." },
  { title: "Make it yours", body: "Pick your colours and create at your own pace." },
] as const;

/*
  DRAWN AS THE RECOMMENDED PATH IS, at the client's ask — the same numbered
  cards joined by the same curved dashed line (<StepPath>), so "do this, then
  this" looks the same wherever the site says it. No box around it any more;
  the cards are the object.

  THE GROUNDS SKIP SAGE. This sits on the Light Sage half of the page, where
  the path's first colour would be no card at all, so the steps take White
  Rock, the soft lavender and terracotta mixed into White Rock.
*/
/* Solid mixes, not alpha: `bg-terracotta/25` over Light Sage came out olive. */
const HOW_GROUNDS = [
  "bg-cream",
  "bg-lavender-soft",
  "bg-[color-mix(in_oklab,var(--color-brand-terracotta)_30%,var(--color-brand-cream))]",
] as const;

function HowItWorks() {
  return (
    <section aria-labelledby="walk-in-how">
      <h3 id="walk-in-how" className={TERM}>
        How it works
      </h3>
      <StepPath
        className="mt-6"
        grounds={HOW_GROUNDS}
        steps={STEPS.map((step) => ({ key: step.title, title: step.title, note: step.body }))}
      />
    </section>
  );
}

/* ==========================================================================
   The cards
   ========================================================================== */

function CardGroup({
  id,
  title,
  experiences,
  quiet = false,
  offset = 0,
}: {
  id: string;
  title: string;
  experiences: CreativeExperience[];
  quiet?: boolean;
  /** Where this group starts in the colour cycle, so the second group carries on from the first. */
  offset?: number;
}) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-text/70">
        {quiet ? (
          <span aria-hidden className="size-2 rounded-pill bg-terracotta" />
        ) : (
          <ModeMark mode="diy" />
        )}
        {title}
      </h3>
      <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
        {experiences.map((experience, i) => (
          <Reveal as="li" key={experience.slug} delay={Math.min(i, 5) * 0.05} className="flex">
            <WalkInCard experience={experience} index={offset + i} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/*
  THE CARD'S COLOURS: the frame tint, the paint the chips and the cut-outs are
  drawn in, and the two cut-outs. The tints are the home page's "ways in"
  cards (WaysToExperience.tsx) — each brand colour 30% into White Rock, all
  three clearing Charcoal by a wide margin — less the sage one, which would
  vanish into this section's Light Sage ground.
*/
const FRAMES: readonly { tint: string; paint: string; mark: DoodleName; trail: DoodleName }[] = [
  { tint: "color-mix(in oklab, #9059A4 30%, var(--color-cream))", paint: INK.lilac, mark: "splash", trail: "coral" },
  { tint: "color-mix(in oklab, #D97757 30%, var(--color-cream))", paint: INK.terracotta, mark: "starburst", trail: "starleaf" },
  { tint: "color-mix(in oklab, #C4B5FD 30%, var(--color-cream))", paint: INK.lilac, mark: "starleaf", trail: "bow" },
];

/**
 * One walk-in activity, cut like the home page's "ways in" cards.
 *
 * THE SAME OBJECT, AT THE CLIENT'S ASK: the photograph across the top, a
 * tinted frame, and a White Rock panel inside it carrying the name, the
 * activity's own line and painted chips — with two cut-outs breaking the
 * panel's corners. A visitor who has seen the home page reads these as the
 * same kind of thing: a way in, with what it is and what to do written on it.
 *
 * THE CHIPS SAY HOW IT RUNS AND WHAT TO DO. "No booking" (or the studio's
 * "Coming soon") and "View details", on the same paint blots the home page's
 * doors sit on. They are not links of their own — the whole card is the link,
 * and a link inside a link is not allowed — so they are the card's label and
 * its affordance, in the card's own paint.
 *
 * "COMING SOON" STAYS QUIETER: the photograph is drained a little, its chip
 * carries the terracotta dot, and the action reads "Take a look".
 *
 * NO DARK SHADOW ON HOVER (the client's rule on this page): the card answers
 * with a lilac hairline, the photograph easing in, and the arrow stepping on.
 */
function WalkInCard({ experience, index }: { experience: CreativeExperience; index: number }) {
  const flag = experience.status ?? null;
  const how = flag ?? "No booking needed";
  const action = flag ? "Take a look" : "View details";
  const frame = FRAMES[index % FRAMES.length];
  // The activity page's banner where one is set, so the card shows what its page opens on.
  const photo = experience.pageImage ?? experience.image;

  return (
    <Link
      href={`/events/${experience.slug}`}
      aria-label={`${experience.name}${experience.description ? ` — ${experience.description.replace(/[.!?]+$/, "")}` : ""}. ${how}. ${action}`}
      style={{ backgroundColor: frame.tint }}
      className={cn(
        "group press-in plate flex w-full flex-col overflow-clip rounded-[1.5rem]",
        "transition-shadow duration-300 ease-soft hover:shadow-[0_0_0_1.5px_var(--color-primary)] focus-visible:shadow-[0_0_0_1.5px_var(--color-primary)]",
      )}
    >
      {/* ---- the photograph ----------------------------------------------- */}
      <span className="relative block aspect-[2/1] w-full overflow-hidden bg-sage/60 sm:aspect-[3/2]">
        {photo ? (
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            style={photo.position ? { objectPosition: photo.position } : undefined}
            className={cn(
              "object-cover transition-transform duration-700 ease-editorial motion-safe:group-hover:scale-[1.04]",
              flag && "saturate-[0.7]",
            )}
          />
        ) : null}
      </span>

      {/* ---- the frame and the panel inside it ----------------------------- */}
      <span className="flex flex-1 flex-col p-3.5 md:p-4">
        <span className="relative isolate flex flex-1 flex-col rounded-[1.25rem] bg-cream px-5 py-5 text-text md:px-6 md:py-6">
          {/* Two cut-outs on the panel's own edges, in the card's paint — a
              mark crosses an edge rather than floating in clear ground. */}
          <span aria-hidden className="pointer-events-none absolute -right-3 -top-4 block w-11 rotate-[10deg] md:w-12">
            <DoodleMark name={frame.mark} color={frame.paint} treatment="draw" delay={index * 110} />
          </span>
          <span aria-hidden className="pointer-events-none absolute -bottom-4 -left-3 block w-9 -rotate-12 md:w-10">
            <DoodleMark name={frame.trail} color={frame.paint} treatment="draw" delay={index * 110 + 160} />
          </span>

          <span className="block pe-8 text-h3 font-medium leading-tight tracking-[-0.02em]">{experience.name}</span>
          {experience.description ? (
            <span className="mt-2 block text-body text-text/85">{experience.description}</span>
          ) : null}

          {/* The chips, on the home page's paint blots. */}
          <span className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-2 pt-5">
            <span
              className="relative isolate inline-flex items-center gap-2.5 rounded-full px-3.5 py-2.5"
              style={{ "--swell": 1, "--wet": 0.44 } as React.CSSProperties}
            >
              <PaintStroke paint={frame.paint} shape="blot" />
              {flag ? (
                <span aria-hidden className="relative size-2 rounded-pill bg-terracotta" />
              ) : (
                <ModeMark mode="diy" className="relative" />
              )}
              <span className="relative text-action font-medium uppercase tracking-eyebrow">{flag ?? "No booking"}</span>
            </span>
            <span
              className="relative isolate inline-flex items-center gap-2 rounded-full px-3.5 py-2.5"
              style={{ "--swell": 1, "--wet": 0.44 } as React.CSSProperties}
            >
              <PaintStroke paint={frame.paint} shape="blot" />
              <span className="relative text-action font-medium uppercase tracking-eyebrow">{action}</span>
              <ArrowRight
                aria-hidden
                strokeWidth={2.25}
                className="relative h-4 w-4 transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
              />
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}
