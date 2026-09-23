"use client";

import { useId, useState } from "react";

import { MenuCard, MenuPreview, MenuRailGroup, MenuRailRow, MenuTile } from "@/components/layout/MenuCard";
import { NavLabel } from "@/components/layout/NavLabel";
import { useMenuDisclosure } from "@/components/layout/useMenuDisclosure";
import { cn } from "@/lib/utils";
import { formatWorkshopDate, isScarce, spotsLabel } from "@/lib/workshops";
import type { CreativeExperience } from "@/lib/experiences";
import type { Workshop } from "@/types";

interface WorkshopsMenuProps {
  label: string;
  href: string;
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

/** The two ways to take part, in the order the studio puts them. */
const GROUPS = [
  { mode: "diy", title: "Walk-in", note: "No booking — come in any time." },
  { mode: "scheduled", title: "Scheduled", note: "A set date and time, booked online." },
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
  href,
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
    WHICH ROW THE PREVIEW IS SHOWING. It starts on the first activity rather
    than on nothing: a panel that opens with an empty right half asks the
    visitor to hover something before it will tell them anything, which is a
    worse first frame than simply showing them one.
  */
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = ordered.find((item) => item.slug === activeSlug) ?? ordered[0];

  const sessionFor = (slug: string) => sessions.find((session) => session.slug === slug);
  const activeSession = active ? sessionFor(active.slug) : undefined;

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
              FOUR / FIVE / THREE, which is what the full width bought.

              At 72rem the card had room for a rail and a preview, so the two
              tiles had to go under one of them — and which one depended on
              how many rows the menu had, because a card is as tall as its
              tallest column. That asymmetry is gone: across the full measure
              the tiles take a column of their own, stacked, and both menus
              use the same three-part arrangement. The extra width goes
              sideways rather than down, which is the point — a taller card
              would have been a worse one.
            */}

            {/* ---- the rail ------------------------------------------- */}
            <div className="col-span-12 flex flex-col gap-5 py-2.5 lg:col-span-4">
              {groups.map((group) => (
                <MenuRailGroup key={group.mode} title={group.title} note={group.note}>
                  {group.items.map((experience) => {
                    const session = sessionFor(experience.slug);
                    return (
                      <MenuRailRow
                        key={experience.slug}
                        /*
                          `/events/<slug>`, NOT `/experiences/<slug>`. There is
                          no experiences route: `app/events/[slug]` is the page
                          for both an activity and a session, and it resolves
                          every slug in lib/experiences.ts — walk-in ones
                          included. A rewrite of this menu pointed these at a
                          route that has never existed and every row 404'd.
                        */
                        href={`/events/${experience.slug}`}
                        name={experience.name}
                        sub={
                          experience.status ??
                          (session ? formatWorkshopDate(session.startsAt) : undefined)
                        }
                        image={experience.image}
                        active={active?.slug === experience.slug}
                        onActivate={() => setActiveSlug(experience.slug)}
                      />
                    );
                  })}
                </MenuRailGroup>
              ))}
            </div>

            {/* ---- the preview ---------------------------------------- */}
            <div className="col-span-12 flex flex-col gap-2.5 md:gap-3 lg:col-span-5">
              {active ? (
                /*
                  Keyed on the slug so the block remounts as the rail moves —
                  which is what makes this cross-fade rather than swap a
                  photograph inside a frame that never moved.
                */
                <MenuPreview
                  key={active.slug}
                  href={`/events/${active.slug}`}
                  eyebrow={active.kind === "diy" ? "Walk-in" : "Scheduled"}
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

            {/* ---- the two doors, in a column of their own ------------- */}
            <div className="col-span-12 grid gap-2.5 md:gap-3 lg:col-span-3 lg:grid-rows-2">
              <MenuTile href={href} title="All experiences" sub="The whole programme, in one place." mark="starburst" />
              <MenuTile
                href="/events#scheduled"
                title="Upcoming dates"
                mark="coral"
                sub="Guided sessions you can book."
                tone="accent"
              />
            </div>
          </div>
        ) : null}
      </MenuCard>
    </div>
  );
}
