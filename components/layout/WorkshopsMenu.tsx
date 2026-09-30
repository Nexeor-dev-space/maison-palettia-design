"use client";

import { useId, useState } from "react";

import { MenuCard, MenuDoor, MenuPreview, MenuRailGroup, MenuRailRow } from "@/components/layout/MenuCard";
import { NavLabel } from "@/components/layout/NavLabel";
import { useMenuDisclosure } from "@/components/layout/useMenuDisclosure";
import { cn } from "@/lib/utils";
import { formatWorkshopDate, isScarce, spotsLabel } from "@/lib/workshops";
import type { CreativeExperience } from "@/lib/experiences";
import type { Workshop } from "@/types";

interface WorkshopsMenuProps {
  label: string;
  /*
    THE PANEL NO LONGER TAKES AN `href`, and that is the tail of the client's
    ask rather than a tidy-up. Its one consumer was the "All experiences"
    door, which has been removed; the trigger beside it is a disclosure
    BUTTON, not a link, so nothing else here ever navigated to /events.

    WHICH MEANS THE LISTING IS NOW REACHED FROM THIS PANEL ONLY THROUGH
    "Upcoming dates" — the same page, anchored to its scheduled half. The
    rows go to individual activities. If the word itself should navigate
    again, the honest way back is this prop and a door, not a button that
    both opens a panel and follows a link.
  */
  /** The approved activities, grouped in the panel by walk-in or scheduled. */
  experiences: CreativeExperience[];
  /**
   * The studio's real dates, matched to the scheduled activities by slug.
   *
   * The panel says nothing a session has not told it: a row carries a date and
   * a seat count only when a session with that slug exists, and both values
   * come from the same helpers the listing and the event page read. An empty
   * array is a perfectly good answer — the rows simply go back to being names.
   */
  sessions: Workshop[];
  isActive: boolean;
  linkClassName: string;
  /** The swatch behind the trigger word. Null over a dark hero. */
  paint?: string | null;
  /**
   * Told whenever the panel opens or closes, so the bar can take its solid
   * state — a card dropping out of a transparent bar reads as two unrelated
   * things rather than one opening.
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * The two ways to take part, in the order the studio puts them.
 *
 * THE NAMES ARE THE CLIENT'S. "Walk-in" and "Scheduled" described the booking
 * mechanism; "Create Anytime" and "Create Together" describe what you get, and
 * the client has asked for the menu to say the second. The notes under them
 * still carry the mechanism, so nothing a visitor needs to know has gone.
 *
 * `mode` is untouched and stays `diy` / `scheduled` — it is the key everything
 * from lib/experiences.ts to the event routes is filtered on, and none of that
 * was part of the ask.
 */
const GROUPS = [
  { mode: "diy", title: "Walk-in — Create Anytime" },
  { mode: "scheduled", title: "Scheduled — Create Together" },
] as const;

/**
 * The Experiences entry, which opens onto the studio's creative programme.
 *
 * ==========================================================================
 * IT WAS A FIELD AND IT IS A CARD
 * ==========================================================================
 *
 * This panel used to run the full width of the screen: a torn sheet of Light
 * Sage carrying three columns — an invitation, five walk-in rows in two
 * sub-columns, two scheduled rows — with a band of cut-outs along its foot.
 * The client has asked for the reference shape instead, and the reference is
 * right for a reason the old one could not fix. Seven short rows spread across
 * 1400px are seven short rows with 1100px of air between them; a visitor
 * crosses the whole screen to read a list that would fit in a column. The card
 * is only as wide as it earns, and the width it gives back buys the one thing
 * the field had no room for: a picture of the activity, at a size worth
 * looking at.
 *
 * SO THE PANEL IS A RAIL AND A PREVIEW. Every activity is a row on the left;
 * whichever row the pointer — or the keyboard — is on fills the right half
 * with its photograph, its line, and whatever the data actually knows about
 * it. Nothing is invented: a date and a seat count appear only when a session
 * with that slug exists, a status only when the studio has set one.
 *
 * WHAT CAME OUT WITH THE FIELD. The torn sheets and the splash band were the
 * field's own furniture — a card with a radius and a veil has an edge already,
 * and a tear along a rounded card is two edge treatments arguing. The vibe row
 * went with them: `hasVibeTags` is false for every activity in the catalogue
 * (see lib/vibes.ts on why inventing the tags is the one thing a mood filter
 * cannot survive), so it has never rendered here and the card does not carry
 * the branch.
 *
 * Behaviour is unchanged and not in this file — see `useMenuDisclosure`. The
 * trigger is a <button> with `aria-expanded`, the panel opens on hover and on
 * focus, Escape returns focus to the trigger, and the closed card is `inert`.
 */
export function WorkshopsMenu({
  label,
  experiences,
  sessions,
  isActive,
  linkClassName,
  paint = null,
  onOpenChange,
}: WorkshopsMenuProps) {
  const menuId = useId();
  const { isOpen, mounted, shown, trigger, openNow, closeSoon, closeNow, regionProps } =
    useMenuDisclosure(onOpenChange);

  const groups = GROUPS.map((group) => ({
    ...group,
    items: experiences.filter((experience) => experience.kind === group.mode),
  })).filter((group) => group.items.length > 0);

  const ordered = groups.flatMap((group) => group.items);

  /*
    ONE GROUP PER COLUMN, so they are found by mode rather than by index:
    `groups` drops any group with nothing in it, so `groups[1]` is only the
    scheduled one while both happen to be filled.
  */
  const walkIn = groups.find((group) => group.mode === "diy");
  const scheduled = groups.find((group) => group.mode === "scheduled");

  /*
    WHICH ROW THE PREVIEW IS SHOWING. It starts on the first activity rather
    than on nothing: a panel that opens with an empty right half asks the
    visitor to hover something before it will tell them anything, which is a
    worse first frame than simply showing them one.
  */
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = ordered.find((item) => item.slug === activeSlug) ?? ordered[0];

  const sessionFor = (slug: string) => sessions.find((session) => session.slug === slug);
  const activeSession = active ? sessionFor(active.slug) : undefined;

  /*
    One group's rows, rendered the same way in either column. It was written
    inline when both groups lived in one rail; split across two columns it has
    to be a function or the row markup is duplicated, and two copies of a row
    is two places for a `href` to go wrong.
  */
  const renderGroup = (group: (typeof groups)[number]) => (
    <MenuRailGroup key={group.mode} title={group.title} fill={group.mode === "diy"}>
      {group.items.map((experience) => {
        const session = sessionFor(experience.slug);
        return (
          <MenuRailRow
            key={experience.slug}
            /*
              `/events/<slug>`, NOT `/experiences/<slug>`. There is no
              experiences route: `app/events/[slug]` is the page for both an
              activity and a session, and it resolves every slug in
              lib/experiences.ts — walk-in ones included. A rewrite of this
              menu pointed these at a route that has never existed and every
              row 404'd.
            */
            href={`/events/${experience.slug}`}
            name={experience.name}
            sub={experience.status ?? (session ? formatWorkshopDate(session.startsAt) : undefined)}
            image={experience.image}
            active={active?.slug === experience.slug}
            onActivate={() => setActiveSlug(experience.slug)}
          />
        );
      })}
    </MenuRailGroup>
  );

  return (
    <div
      {...regionProps}
      /* `static`, so the card positions against the <header> and can centre on
         the page rather than hang off this word. */
      className="static flex h-full items-center"
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => (isOpen ? closeNow() : openNow())}
        className={cn(linkClassName, "cursor-none items-center")}
      >
        <NavLabel isActive={isActive || isOpen} paint={paint}>{label}</NavLabel>
      </button>

      <MenuCard id={menuId} open={isOpen} shown={shown} onMouseEnter={openNow} onMouseLeave={closeSoon}>
        {mounted ? (
          <div className="grid grid-cols-12 gap-2.5 md:gap-3">
            {/*
              ==========================================================
              FOUR / FOUR / FOUR — THREE COLUMNS THAT CARRY THE SAME WEIGHT
              ==========================================================

              It was a rail of both groups, a preview across eight columns and
              the two doors on a strip along the foot. The client has asked for
              three equal columns instead, with the scheduled group and the two
              doors together in the middle and the picture on the right.

              WHAT MAKES THEM "LOOK EQUAL" IS NOT THE WIDTHS. Equal thirds are
              the easy half; the hard half is that all three FILL the row, and
              each column does it a different way:

                one ... the walk-in rows, spread down the column (`fill` on
                        <MenuRailGroup>). Fixed-height rows cannot grow, so
                        without it the slack collects under the last one and
                        the column ends about 30px short of the other two —
                        the ragged foot the client asked about. Divided
                        between the rows it is a few pixels each.
                two ... two rows, then the door taking everything under them
                        (`fill` on <MenuDoor>).
                three . the preview, whose picture is `flex-1` (see
                        <MenuPreview>) and therefore takes whatever height the
                        other two settle on.

              AND NO VERTICAL PADDING ON ANY OF THEM. Columns one and two
              carried `py-2.5` and column three none, so even with all three
              boxes the same height their contents started and finished on
              three different lines. The panel's own padding is what holds
              this block off the card's edge; a second inset on two of the
              three columns was only ever making them disagree.

              THE CEILING STAYS ON COLUMN ONE ONLY. It is the column that can
              grow — a longer catalogue adds rows there — and it is the only
              one that can safely be a scroll container: the doors in column
              two carry cut-outs that animate off a view timeline, and a view
              timeline inside a scroll container resolves against that box and
              never completes. Column one holds nothing of the sort.
            */}

            {/* ---- 1. walk in, any time ------------------------------- */}
            <div className="col-span-12 flex flex-col gap-5 lg:col-span-4 lg:max-h-[min(38rem,calc(100vh-8.5rem))] lg:overflow-y-auto lg:overscroll-contain">
              {walkIn ? renderGroup(walkIn) : null}
            </div>

            {/* ---- 2. the dated sessions, and the two doors ------------ */}
            <div className="col-span-12 flex flex-col gap-5 lg:col-span-4">
              {scheduled ? renderGroup(scheduled) : null}

              {/*
                ONE DOOR, NOT TWO — at the client's ask.

                "All experiences" stood above this one and went to /events —
                "the whole programme, in one place", offered by a panel that
                IS the whole programme in one place, every activity listed in
                the column beside it. A third of this column was spent on a
                door to a page the reader was already looking at.

                The door that stays goes somewhere the panel does not: the
                dated sessions at /events#scheduled. Note what that leaves —
                see the note on the props above.

                `flex-1` rather than `mt-auto`: with two doors the pair filled
                the space under the rows, and one door pushed to the foot
                would leave the hole between. It takes the space instead, and
                its content is centred, so it reads as a panel rather than as
                a stretched button.
              */}
              <div className="mt-auto flex min-h-0 flex-1 flex-col">
                <MenuDoor
                  href="/events#scheduled"
                  title="Upcoming dates"
                  mark="coral"
                  sub="Guided sessions you can book."
                  tone="accent"
                  fill
                />
              </div>
            </div>

            {/* ---- 3. the preview ------------------------------------- */}
            <div className="col-span-12 flex flex-col gap-2.5 md:gap-3 lg:col-span-4">
              {active ? (
                /*
                  Keyed on the slug so the block remounts as the rail moves —
                  which is what makes this cross-fade rather than swap a
                  photograph inside a frame that never moved.
                */
                <MenuPreview
                  key={active.slug}
                  href={`/events/${active.slug}`}
                  /* The same two names as the groups beside it — this panel
                     would otherwise call one thing two things at once. */
                  eyebrow={active.kind === "diy" ? "Create Anytime" : "Create Together"}
                  name={active.name}
                  description={active.description}
                  image={active.image}
                  meta={
                    active.status ? (
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className="size-1.5 shrink-0 rounded-pill bg-terracotta" />
                        {active.status}
                      </span>
                    ) : activeSession ? (
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        {formatWorkshopDate(activeSession.startsAt)}
                        <span aria-hidden className="text-text/30">
                          &middot;
                        </span>
                        <span className="flex items-center gap-2">
                          {isScarce(activeSession) ? (
                            <span aria-hidden className="size-1.5 shrink-0 rounded-pill bg-terracotta" />
                          ) : null}
                          {spotsLabel(activeSession)}
                        </span>
                      </span>
                    ) : null
                  }
                  action={active.kind === "diy" ? "See the activity" : "See the session"}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </MenuCard>
    </div>
  );
}
