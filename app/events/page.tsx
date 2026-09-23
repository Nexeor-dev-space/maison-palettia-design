import Link from "next/link";

import { EventsBrowser } from "@/components/events/EventsBrowser";
import { WalkInDiscovery } from "@/components/events/WalkInDiscovery";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { ModeMark } from "@/components/ui/ModeMark";
import { DisplayHeading, Eyebrow, ScriptTitle } from "@/components/ui/SectionHeader";
import { WORKSHOP_JOURNEY } from "@/lib/brand";
import { getCreativeExperiences } from "@/lib/experiences";
import { getMallPartners } from "@/lib/partners";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { getAllWorkshops } from "@/lib/workshops";

export const metadata = buildMetadata({
  title: "Experiences",
  description:
    "Every Maison Palettia creative experience — walk-in DIY activities you can enjoy at your own pace, and guided scheduled sessions you book online for a set date.",
  path: "/events",
});

/**
 * /events — every experience, in the two groups the business runs on.
 *
 * WHAT WAS MISSING. This page listed the scheduled sessions and nothing else,
 * under the heading "Upcoming events". Five of the seven approved activities
 * are walk-in, and none of them appeared on the page the navigation calls
 * Experiences — a visitor who clicked it learned about two things the studio
 * does and not the other five. Its introduction also said the studio runs "in
 * malls across Dubai" and comes to "a mall near you", which overstates one
 * confirmed destination.
 *
 * TWO GROUPS, EACH ANCHORED. `#walk-in` and `#scheduled` are what the hero's
 * actions and the header's "Book a session" point at, so a visitor lands on
 * the half of the page their question belongs to. Walk-in comes first because
 * the deck lists it first (p.5); a visitor who came to book is taken straight
 * past it by the anchor.
 *
 * NOTHING ABOUT BOOKING CHANGED. The scheduled half is the existing
 * <EventsBrowser> — its filters, its cards, its links into the booking step —
 * given a heading. Walk-in activities are plates that open their own pages,
 * where no booking is ever offered.
 */
/*
  ==========================================================================
  THE GROUNDS — the brand's own cut-outs, drifting behind each section
  ==========================================================================

  The page was two long flat fields, Light Sage then White Rock, and its own
  note said the grounds were what told the two halves apart. They did, and flat
  is all they did: 1971px of one colour followed by 2317px of another, with
  nothing moving in either. These plans put the studio's shapes into that
  space — placed by hand, held low, and drifting at their own rates as each
  section crosses the window. See <SectionShapes> for why the placement is
  explicit rather than scattered.

  ONE PALETTE, AND ONLY IT. Every colour below is one of the six: Deep Lilac
  #9059A4, Light Sage #D1E7BE, White Rock #EFE2CA, Charcoal Slate #2D3748,
  Soft Lavender #C4B5FD, Warm Terracotta #D97757. `INK` in the hero's
  composition holds five of them as literals — <DoodleMark> hands the colour
  to an SVG `fill`, which cannot take a `var()` from a server component — and
  Light Sage is written out because that file has no name for it.

  EACH GROUND TAKES THE COLOURS THAT ARE NOT IT. On Light Sage the marks are
  lilac, lavender and terracotta; on White Rock they are lilac, sage and
  terracotta. A mark in the ground's own colour is not a quiet mark, it is an
  invisible one.
*/
const SAGE = "#D1E7BE";

/** The masthead: the largest shapes on the page, because it has the most air. */
const TITLE_SHAPES: readonly ShapePlan[] = [
  { name: "splash", color: INK.lilac, width: "26%", top: "-8%", right: "-4%", rotate: -12, drift: 26, opacity: 0.16 },
  { name: "wave", color: INK.lavender, width: "16%", bottom: "6%", left: "-3%", rotate: 8, drift: -18, opacity: 0.22, desktopOnly: true },
  { name: "dot", color: INK.terracotta, width: "5%", top: "24%", left: "46%", drift: 34, opacity: 0.2, desktopOnly: true },
];

/**
 * Walk-in. The tallest section on the page at nearly 2000px, so it carries
 * four and spreads them down its whole length rather than clustering at the
 * head where they would all be gone after one screen.
 */
const WALK_IN_SHAPES: readonly ShapePlan[] = [
  { name: "coral", color: INK.lavender, width: "14%", top: "4%", right: "-2%", rotate: 14, drift: -22, opacity: 0.2 },
  { name: "starburst", color: INK.terracotta, width: "12%", top: "38%", left: "-4%", rotate: -6, drift: 20, opacity: 0.16, desktopOnly: true },
  { name: "bean", color: INK.lilac, width: "9%", top: "64%", right: "4%", rotate: 22, drift: 28, opacity: 0.14, desktopOnly: true },
  { name: "zigzag", color: INK.terracotta, width: "11%", bottom: "3%", left: "8%", rotate: -10, drift: -16, opacity: 0.18, desktopOnly: true },
];

/** Scheduled, on White Rock — so sage joins the set and the warmth stays. */
const SCHEDULED_SHAPES: readonly ShapePlan[] = [
  { name: "cutout", color: SAGE, width: "20%", top: "2%", left: "-5%", rotate: -8, drift: 24, opacity: 0.55 },
  { name: "starleaf", color: INK.lilac, width: "10%", top: "34%", right: "-2%", rotate: 12, drift: -20, opacity: 0.16, desktopOnly: true },
  { name: "bow", color: INK.terracotta, width: "12%", bottom: "8%", right: "6%", rotate: -14, drift: 22, opacity: 0.16, desktopOnly: true },
  { name: "splash", color: SAGE, width: "16%", bottom: "-4%", left: "10%", rotate: 18, drift: -26, opacity: 0.6, desktopOnly: true },
];

export default async function EventsPage() {
  const [experiences, workshops, partners] = await Promise.all([
    getCreativeExperiences(),
    getAllWorkshops(),
    getMallPartners(),
  ]);
  const walkIn = experiences.filter((e) => e.kind === "diy");
  const sessions = workshops.filter((w) => w.kind !== "diy");
  const home = partners.length === 1 ? partners[0] : undefined;
  const [diyStep, scheduledStep] = WORKSHOP_JOURNEY;

  return (
    <>
      {/* ---- the head ---- */}
      {/*
        ==================================================================
        TWO DOORS, NOT A HEADLINE AND A LIST
        ==================================================================

        This opened on a script line in the left seven columns and a bordered
        two-item list in the right five, and between them sat a third of a
        screen of empty Light Sage. Nothing was wrong with it and nothing was
        the Maison either: the homepage opens on a picture the size of the
        window, and this page opened on a heading and a table of contents.

        The two modes are the whole page, so they ARE the opening. Each is a
        field with its own brand cut-out bleeding off a corner, and pressing
        one drops you into that half — the same two anchors the hero's actions
        and the header's "Book a session" already point at, so nothing about
        the navigation changed.

        WALK-IN IS WHITE ROCK AND SCHEDULED IS DEEP LILAC, which is not a new
        decision: <TwoWaysToCreate> on the homepage splits the same two ideas
        across the same two colours. A visitor who has seen that section meets
        the same pair here. That consistency is the point — one language, and
        this page's own composition.

        THE MARK IS THE PICTURE. Nothing in the project photographs "walk-in"
        or "scheduled" as such, and a stock-feeling stand-in on the page that
        introduces the studio's own work would be the wrong first impression.
        A cut-out at this size is the deck's own device and claims nothing.
      */}
      <section
        aria-labelledby="experiences-title"
        className="relative isolate overflow-hidden bg-sage"
      >
        <SectionShapes plan={TITLE_SHAPES} />
        <Container className="relative pb-[3rem] pt-[3.5rem] md:pb-[3.5rem] md:pt-[4.5rem] lg:pt-[5.5rem]">
          {/* No measure on this block. <DisplayHeading> already decides where
              the line turns — `lines` is the break — and a `max-w` on top of
              it only re-wraps the lines it was given, which is how "Choose
              what" came out as two. */}
          <div>
            <Reveal>
              <Eyebrow>Experiences</Eyebrow>
            </Reveal>
            <DisplayHeading
              as="h1"
              id="experiences-title"
              className="mt-7 md:mt-9"
              lines={["Choose what", "you make."]}
            />
          </div>

          <nav aria-label="Experience types" className="mt-10 md:mt-14">
            <ul className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-2">
              <Door
                href="#walk-in"
                mode="diy"
                title="Walk-in DIY"
                note={diyStep.description}
                tone="cream"
                mark="starleaf"
                markColor={INK.terracotta}
              />
              <Door
                href="#scheduled"
                mode="scheduled"
                title="Scheduled sessions"
                note={scheduledStep.description}
                tone="lilac"
                mark="starburst"
                markColor={INK.lavender}
              />
            </ul>
          </nav>
        </Container>
      </section>

      {/* ---- walk-in ---- */}
      {/*
        LIGHT SAGE, NOT THE NEAR-WHITE `surface`. The homepage is one paper
        from top to bottom and colour arrives as objects laid on it; this page
        was alternating into `bg-surface` for both halves, which is what made
        it read as the older site. Walk-in stays on the paper; the scheduled
        half below is a White Rock field, so the two groups are told apart by
        the ground they sit on rather than by a border between them.
      */}
      <section
        id="walk-in"
        aria-labelledby="walk-in-heading"
        className="relative isolate scroll-mt-24 overflow-hidden bg-sage pb-[4.5rem] pt-[2.5rem] md:pb-[6rem] md:pt-[3.5rem]"
      >
        <SectionShapes plan={WALK_IN_SHAPES} />
        <Container>
          <GroupHead
            id="walk-in-heading"
            mode="diy"
            title="Walk-in DIY"
            lead="No booking needed. Choose an experience on the day and create at your own pace."
          >
            {home ? (
              <p className="text-body leading-[1.7] text-text">
                {home.name}, {home.locality}
                <span className="block text-fine text-text/85">
                  Where the Maison sets up for each run of dates.{" "}
                  <Link href="/locations" className="underline decoration-primary underline-offset-4">
                    Find us
                  </Link>
                </span>
              </p>
            ) : null}
          </GroupHead>

          {/* The vibe chips and the editorial rhythm both live in
              <WalkInDiscovery>; the filtering is client state and the plates
              still link to their own pages, never to a checkout. */}
          <WalkInDiscovery experiences={walkIn} />
        </Container>
      </section>

      {/* ---- scheduled ---- */}
      <section
        id="scheduled"
        aria-labelledby="scheduled-heading"
        className="relative isolate scroll-mt-24 overflow-hidden bg-cream py-[4.5rem] md:py-[6rem]"
      >
        <SectionShapes plan={SCHEDULED_SHAPES} />
        <Container>
          <GroupHead
            id="scheduled-heading"
            mode="scheduled"
            title="Scheduled sessions"
            lead="Guided workshops on a set date and time, booked online. Everything is provided."
          />
          {sessions.length === 0 ? (
            <Reveal className="mt-12 border-t border-line pt-10">
              <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25] tracking-[-0.015em]">
                The next dates are being set.
              </p>
              <p className="mt-4 max-w-[32rem] text-body leading-[1.85] text-text/85">
                Walk-in experiences are available in the meantime.
              </p>
            </Reveal>
          ) : (
            <div className="mt-10 md:mt-12">
              <EventsBrowser workshops={sessions} />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

/**
 * One of the two doors at the head of the page.
 *
 * A field, a cut-out bleeding off its corner, the mode's own mark and the
 * line the deck uses for it — pressing it drops into that half of the page.
 *
 * THE ARROW TRAVELS DOWN, not right: this is not a link to another page, it
 * is a jump to a section below, and an arrow that says otherwise is a small
 * lie a visitor notices the moment the page does not change.
 *
 * `press-in` and the mark's drift are the site's own tactile feedback; both
 * are `motion-safe`, so a visitor who has asked for less movement gets a
 * field that simply changes colour.
 */
function Door({
  href,
  mode,
  title,
  note,
  tone,
  mark,
  markColor,
}: {
  href: string;
  mode: "diy" | "scheduled";
  title: string;
  note: string;
  tone: "cream" | "lilac";
  mark: DoodleName;
  markColor: string;
}) {
  /*
    White Rock takes Charcoal Slate; Deep Lilac takes the near-white
    `surface`, which is the one light ink that clears 4.5:1 on it (4.90).
    See inkFor() in <SectionHeader>.
  */
  const field =
    tone === "lilac"
      ? "bg-primary text-surface"
      : "bg-cream text-text";

  return (
    /*
      `h-full` on BOTH the item and the anchor. A grid stretches its items, so
      the <li> matched its neighbour already — but the <a> inside it was sized
      by its own content, and the two doors came out different heights because
      one description runs to two lines and the other to three.
    */
    <li className="h-full">
      <a
        href={href}
        className={cn(
          "group press-in relative flex h-full min-h-[13rem] flex-col justify-between overflow-hidden rounded-[1.25rem] px-7 py-7 md:min-h-[15rem] md:rounded-[1.75rem] md:px-9 md:py-9",
          field,
        )}
      >
        {/*
          The cut-out, breaking the field's TOP-right corner.

          It was at the foot and half again this size, where two things went
          wrong: at 12.5rem the shape ran so far past the corner that only a
          lobe of it stayed on the field — a coloured blob rather than a mark
          anyone could name — and it sat directly under the arrow, so the one
          moving element on the door was drawn on top of the one decorative
          one. Smaller, and at the other end of the field, it reads as the
          cut-out it is and the arrow has clear ground.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-5 w-[6.5rem] rotate-[-10deg] transition-transform duration-700 ease-editorial motion-safe:group-hover:translate-y-1 motion-safe:group-hover:rotate-[-3deg] md:-right-5 md:-top-6 md:w-[8rem]"
        >
          <DoodleMark name={mark} color={markColor} treatment="stamp" delay={260} />
        </span>

        <span className="relative">
          <span className="flex items-center gap-3 text-label font-semibold uppercase tracking-eyebrow">
            <ModeMark mode={mode} />
            {mode === "diy" ? "No booking" : "Booked online"}
          </span>

          <span className="heading-script mt-3 block pb-[0.2em] text-script-compact leading-[1.15]">
            <ScriptTitle>{title}</ScriptTitle>
          </span>
        </span>

        <span className="relative mt-6 flex items-end justify-between gap-6">
          <span className="max-w-[26ch] text-body leading-[1.7]">{note}</span>
          <span
            aria-hidden
            className="shrink-0 text-[1.375rem] leading-none transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-y-1"
          >
            &#8595;
          </span>
        </span>
      </a>
    </li>
  );
}

function GroupHead({
  id,
  mode,
  title,
  lead,
  children,
}: {
  id: string;
  mode: "diy" | "scheduled";
  title: string;
  lead: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="grid grid-cols-12 items-end gap-x-6 gap-y-5 lg:gap-x-10">
        <div className="col-span-12 md:col-span-7">
          <h2
            id={id}
            className="flex items-center gap-3.5 heading-script text-script-compact text-text"
          >
            {/* Lifted to the script's x-height: its letters sit high in their
                line box, so a centred mark read as sitting on the baseline. */}
            <ModeMark mode={mode} className="size-3 -translate-y-[0.15em]" />
            <ScriptTitle>{title}</ScriptTitle>
          </h2>
          <p className="mt-4 max-w-[34rem] text-lead leading-[1.65] text-text/85">{lead}</p>
        </div>
        {children ? <div className="col-span-12 md:col-span-5 md:pb-1">{children}</div> : null}
      </div>
    </Reveal>
  );
}
