import { ArrowDown } from "lucide-react";

import { EventsBrowser } from "@/components/events/EventsBrowser";
import { WalkInDiscovery } from "@/components/events/WalkInDiscovery";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { groundShapes } from "@/components/motion/groundShapes";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow, ScriptTitle } from "@/components/ui/SectionHeader";
import { WORKSHOP_JOURNEY } from "@/lib/brand";
import type { CreativeExperience } from "@/lib/experiences";
import { cn } from "@/lib/utils";
import type { Vibe } from "@/lib/vibes";
import type { WorkshopType } from "@/lib/workshopTypes";
import type { Workshop } from "@/types";



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
 * TWO GROUPS, EACH ANCHORED. `#create-anytime` and `#scheduled` are what the hero's
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
/** The masthead: the largest shapes on the page, because it has the most air. */
const TITLE_SHAPES: readonly ShapePlan[] = groundShapes("sage");

/*
  ON THE SHARED TABLE NOW, like the masthead above and the other forty-odd
  grounds on the site.

  These two were written by hand before `groundShapes()` existed and never
  moved onto it, so they kept the widths and opacities the table was created
  to retire: 20% and 16% cut-outs at 0.55 and 0.6, placed at `left: -5%` and
  `top: 2%`. Measured on this page at 1440 that 20% mark came out 319px and
  lay across the "Create Together" heading, its standfirst and the event
  count — the last of the text-overlapping doodles the client asked to be
  rid of, and the reason the fix to the table alone did not move them.

  The walk-in section keeps its own constant because it sits on Light Sage
  and the scheduled one on White Rock — the ground decides the inks (see
  GROUND_INKS) — but both now read from the table.
*/
const WALK_IN_SHAPES: readonly ShapePlan[] = groundShapes("sage");
const SCHEDULED_SHAPES: readonly ShapePlan[] = groundShapes("cream");

/*
  ==========================================================================
  /events' BODY — the head with its two doors, then the two halves
  ==========================================================================

  The `pageHeader` and `eventsBrowser` blocks (SPEC §E.1), drawn as the page
  always drew them: the header's eyebrow and heading share the first section
  with the two doors (see `TAKES_HEADER` in components/blocks/BlockRenderer),
  then Create Anytime and Create Together. The closing "where we set up" panel
  is its own block (`whereWeSetUp`). Moved here from app/(site)/events/page.tsx;
  every word arrives as a prop and defaults to the launch wording, and the
  door notes default to the first two steps of the Brand wording journey.
*/

/** The two doors as the page shipped them; the notes are WORKSHOP_JOURNEY's first two steps. */
const LAUNCH_DOORS: readonly EventsDoor[] = [
  { title: "Create Anytime", note: WORKSHOP_JOURNEY[0]?.description ?? null, modeLabel: "No booking" },
  { title: "Create Together", note: WORKSHOP_JOURNEY[1]?.description ?? null, modeLabel: "Booked online" },
];

/** One of the two doors at the head of the page. */
export interface EventsDoor {
  title: string;
  note: string | null;
  modeLabel: string | null;
}

/** The page's words — the `pageHeader` and `eventsBrowser` blocks'. */
export interface EventsWords {
  eyebrow?: string | null;
  lines?: readonly string[];
  doors?: readonly EventsDoor[];
  groupLeads?: { diy: string | null; scheduled: string | null };
  /**
   * NOT PRINTED (Oct 2026). The venue line under Create Anytime, which this
   * labelled, was removed at the client's ask: the same location is already
   * on the page ("where we set up") and on every activity page. The CMS field
   * stays until a release can drop it with a migration.
   */
  viewLocationLabel?: string | null;
  emptyTitle?: string | null;
  emptyBody?: string | null;
}

export function EventsBody({
  experiences,
  sessions,
  types = [],
  vibes,
  renderedAt,
  eyebrow = "Experiences",
  lines = ["Make It", "Your Way."],
  doors = LAUNCH_DOORS,
  groupLeads = { diy: "Pick a project. Pick your colours. Just drop in.", scheduled: "A little more planned. Same creative energy." },
  emptyTitle = "The next dates are being set.",
  emptyBody = "Create Anytime experiences are available in the meantime.",
  perPersonLabel,
}: EventsWords & {
  experiences: CreativeExperience[];
  /** The dated sessions only. */
  sessions: Workshop[];
  /** The formats the scheduled experiences run in (lib/workshopTypes.ts); none before the Oct 2026 update. */
  types?: readonly WorkshopType[];
  /** The vibe taxonomy, for the browser's Vibe filter; the experiences carry the tags. */
  vibes?: readonly Vibe[];
  /** The page's one clock — see ONE CLOCK FOR THE WHOLE RENDER on the page. */
  renderedAt: number;
  /** The Page labels' "per person", for the price line on a format card. */
  perPersonLabel?: string;
}) {
  const walkIn = experiences.filter((e) => e.kind === "diy");
  const [diyDoor, scheduledDoor] = doors;

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
              it only re-wraps the lines it was given, which is how the old
              heading's first line once came out as two. */}
          <div>
            {eyebrow ? (
              <Reveal>
                <Eyebrow>{eyebrow}</Eyebrow>
              </Reveal>
            ) : null}
            {/* The client's heading for exactly this choice — drop in or
                book — from the homepage section that introduces the same two
                doors (PDF p04). It replaced "Choose What You Make.", which
                was ours. */}
            <DisplayHeading
              as="h1"
              id="experiences-title"
              className="mt-7 md:mt-9"
              lines={lines}
            />
          </div>

          <nav aria-label="Experience types" className="mt-10 md:mt-14">
            <ul className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-2">
              {diyDoor ? (
                <Door
                  href="#create-anytime"
                  title={diyDoor.title}
                  note={diyDoor.note}
                  modeLabel={diyDoor.modeLabel}
                  tone="cream"
                />
              ) : null}
              {scheduledDoor ? (
                <Door
                  href="#scheduled"
                  title={scheduledDoor.title}
                  note={scheduledDoor.note}
                  modeLabel={scheduledDoor.modeLabel}
                  tone="lilac"
                />
              ) : null}
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
        id="create-anytime"
        aria-labelledby="create-anytime-heading"
        className="relative isolate scroll-mt-24 overflow-hidden bg-sage pb-[4.5rem] pt-[2.5rem] md:pb-[6rem] md:pt-[3.5rem]"
      >
        <SectionShapes plan={WALK_IN_SHAPES} />
        <Container>
          {/*
            THE LEAD IS THE CLIENT'S LINE FOR THIS DOOR (PDF p05), word for
            word — the same one the homepage's <TwoWaysToCreate> prints over
            its Create Anytime half. It was "No booking needed. Choose an
            experience on the day and create at your own pace.", ours, and it
            all but repeated the door note a screen above it (p26's "Drop in,
            choose an experience and create at your own pace."). "Just drop
            in." still carries the no-booking fact.
          */}
          <GroupHead
            id="create-anytime-heading"
            title={diyDoor?.title ?? "Create Anytime"}
            lead={groupLeads.diy}
          />
        </Container>

        {/* <WalkInDiscovery> brings its own <Container>: the how-it-works
            steps, the vibe chips and the activity cards (a grid now, not the
            home page's track). The filtering is client state and the cards
            link to their own pages, never to a checkout. */}
        <WalkInDiscovery experiences={walkIn} />
      </section>

      {/* ---- scheduled ---- */}
      <section
        id="scheduled"
        aria-labelledby="scheduled-heading"
        className="relative isolate scroll-mt-24 overflow-hidden bg-cream py-[4.5rem] md:py-[6rem]"
      >
        <SectionShapes plan={SCHEDULED_SHAPES} />
        <Container>
          {/*
            The client's p05 line for this door, exactly, as on the homepage.
            It was "Guided workshops on a set date and time, booked online.
            Everything is provided." — and "Everything is provided" opens the
            very sentence the client retired on the event pages (p21). The
            booking facts are not lost: every card below carries its date and
            time and opens the session's own page, which is where it is booked.
          */}
          <GroupHead
            id="scheduled-heading"
            title={scheduledDoor?.title ?? "Create Together"}
            lead={groupLeads.scheduled}
          />

          {/*
            ==================================================================
            ONE SECTION, FILTERED — FORMATS ARE WHAT THE FILTERS RETURN
            ==================================================================

            The client's booking brief (Oct 2026) reads the same way for both
            experiences: a customer "should be able to select their preferred
            candle theme" and "browse the different crochet workshop types",
            and only THEN "view and choose from the available dates and time
            slots for that workshop". And this half is one section, narrowed
            by date, by event and by vibe — not a format picker with a dated
            wall under it.

            So <EventsBrowser> keeps its bar and its calendar, and with the
            formats handed to it, what the filters return is the formats: each
            experience's themes or levels as the cards its own page draws,
            with the next date that passes the filter, and the recommended
            path where the studio set one. A date is chosen on the format's
            page, where every sitting prints its price, duration, spaces and
            booking state. A new monthly theme or a repriced level is a CMS
            row and arrives here with nothing redrawn.
          */}
          {sessions.length === 0 && types.length === 0 ? (
            <Reveal className="mt-12 border-t border-line pt-10">
              <p className="max-w-[30rem] text-h3 font-light tracking-[-0.015em]">
                {emptyTitle}
              </p>
              {emptyBody ? <p className="mt-4 max-w-[32rem] text-body text-text/85">{emptyBody}</p> : null}
            </Reveal>
          ) : (
            <div className="mt-10 md:mt-12">
              <EventsBrowser
                workshops={sessions}
                experiences={experiences}
                types={types}
                vibes={vibes}
                renderedAt={renderedAt}
                perPersonLabel={perPersonLabel}
                emptyTitle={emptyTitle}
                emptyBody={emptyBody}
              />
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
 * A field, a cut-out bleeding off its corner, the mode's own label and the
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
  title,
  note,
  modeLabel,
  tone,
}: {
  href: string;
  title: string;
  note: string | null;
  /** "No booking" / "Booked online" — the mode's own label. */
  modeLabel: string | null;
  tone: "cream" | "lilac";
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
  /* The corner's one cut-out: the colour that stands out on this field. */
  const corner: { name: DoodleName; color: string } =
    tone === "lilac" ? { name: "coral", color: INK.terracotta } : { name: "splash", color: INK.lilac };

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
          ONE CUT-OUT IN THE TOP-RIGHT CORNER, at the client's ask — the
          purple one on the White Rock door, the orange one on the Deep Lilac
          door, each the colour that stands out on its field. It sits wholly
          inside the card (never clipped by the edge), turned a little off
          square, and drifts on hover with the rest of the door. Large enough
          to hold the right side of the card; small enough that it never
          reaches the words or the arrow below it.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-5 top-5 block w-16 rotate-[-10deg] transition-transform duration-700 ease-editorial motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-[-3deg] md:right-7 md:top-7 md:w-24 xl:right-9 xl:top-8 xl:w-32"
        >
          <DoodleMark name={corner.name} color={corner.color} treatment="stamp" delay={260} />
        </span>

        <span className="relative">
          <span className="flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow">
            {modeLabel}
          </span>

          <span className="heading-script mt-3 block pb-[0.2em] text-script-compact">
            <ScriptTitle>{title}</ScriptTitle>
          </span>
        </span>

        <span className="relative mt-6 flex items-end justify-between gap-6">
          {/* Wider than it was (26ch): the cluster now fills the right half,
              so the words no longer have to be kept short to leave it room. */}
          <span className="max-w-[36ch] text-body">{note}</span>
          {/*
            THE WAY DOWN, ON A PEBBLE — the same hand-cut lilac blob the
            format tickets carry their arrow on (see <TypeCard>), turned to
            point down the page, at the client's ask. It was a bare "↓" in
            the field's ink, which at body size was the smallest thing on a
            very large card.

            The pebble takes the opposite of its field, so it always reads as
            an object ON the card: Deep Lilac with the near-white arrow on the
            White Rock door (4.90:1), and the near-white `surface` with a Deep
            Lilac arrow on the Deep Lilac door (4.90:1 the other way round).
            Decorative either way — the whole door is the link.
          */}
          <span
            aria-hidden
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-[58%_42%_55%_45%/50%_58%_42%_50%] rotate-[-6deg]",
              tone === "lilac" ? "bg-surface text-primary" : "bg-primary text-on-primary",
              "transition-transform duration-500 ease-editorial",
              "motion-safe:group-hover:translate-y-1 motion-safe:group-hover:rotate-[2deg]",
            )}
          >
            {/* An icon rather than the "↓" character: Montserrat draws that
                glyph at about half the weight and size of its "→", so on the
                pebble it read as a speck. */}
            <ArrowDown strokeWidth={2.25} className="h-5 w-5" />
          </span>
        </span>
      </a>
    </li>
  );
}

function GroupHead({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead: string | null;
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
            <ScriptTitle>{title}</ScriptTitle>
          </h2>
          {lead ? <p className="mt-4 max-w-[34rem] text-lead text-text/85">{lead}</p> : null}
        </div>
        {children ? <div className="col-span-12 md:col-span-5 md:pb-1">{children}</div> : null}
      </div>
    </Reveal>
  );
}
