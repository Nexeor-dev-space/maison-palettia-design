"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { NavLabel } from "@/components/layout/NavLabel";
import { BlobButton } from "@/components/ui/BlobButton";
import { ModeMark } from "@/components/ui/ModeMark";
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
  /**
   * Told whenever the panel opens or closes.
   *
   * The bar needs it: the panel drops on the page's white ground, and a white
   * panel hanging off a bar that is still transparent over the hero reads as
   * two unrelated things rather than one opening. The bar counts this menu as
   * a reason to take its solid state, the same way it counts the mobile
   * overlay and the search panel.
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * The two ways to take part, in the order the studio puts them.
 *
 * THE SPLIT CHANGES AT 1280, AND THE NUMBERS ARE MEASURED. A row needs its
 * 48px thumbnail, a 14px gap and about 140px for the longest name — "Tote bag
 * painting" sets 141px at `--text-body`. Two sub-columns of walk-in rows
 * therefore need the group to hold 6 of the 12 at 1024 (217px a sub-column,
 * 155px for the name) and can drop to 5 once there are 1280px to divide. The
 * intro takes what is left: 3 at 1024, 4 from 1280.
 *
 * The first attempt gave the walk-in group 4 at 1024 and wrapped every second
 * name — "Tote bag / painting" — with "Booked online" breaking into the
 * heading beside it. The second gave it 4 and ran the list as one column,
 * which fitted and left a 192px hole under the scheduled group. This is the
 * arrangement where both groups end within a row of each other.
 */
const GROUPS = [
  {
    mode: "diy",
    title: "Walk-in",
    note: "No booking — come in any time and make something.",
    span: "sm:col-span-7 lg:col-span-6 xl:col-span-5",
  },
  {
    mode: "scheduled",
    title: "Scheduled",
    note: "A set date and time, booked online.",
    span: "sm:col-span-5 lg:col-span-3",
  },
] as const;

/**
 * The Workshops entry, which opens onto the studio's creative experiences.
 *
 * The point of it is discovery, not navigation. "Experiences" on its own asks
 * a visitor to take it on faith that there is something for them behind the
 * word; seven activities, split by how you take part, answer that before they
 * have clicked anything.
 *
 * HOW IT OPENS, AND WHY THAT IS WORTH THE CODE. The panel used to be toggled
 * with `hidden`, which is not a state anything can animate between — the menu
 * appeared, fully formed, in one frame. It now draws down: the field itself is
 * revealed top to bottom with `clip-path`, and the three columns rise into it
 * in a short left-to-right sweep, so the panel reads as one movement opening
 * rather than a block of content being switched on. Closing is deliberately
 * not the same gesture reversed — it is faster and unstaggered, because a
 * menu you have decided against should get out of the way.
 *
 * The content mounts on the first open and stays mounted, so the seven
 * thumbnails are never fetched by a visitor who does not open the menu; the
 * `shown` flag is set a frame later, which is what gives that first open a
 * transition to run rather than a fresh element already in its final state.
 *
 * COLOUR. The panel used to be Charcoal Slate on the page's near-white and
 * nothing else — one lilac hairline in the whole field. The brand is in it
 * now, by role rather than by decoration: Deep Lilac names the section and
 * carries the one action, Light Sage bands the two group headings, White Rock
 * is the hover ground under a row and the ground behind a thumbnail, and Warm
 * Terracotta appears twice at most — the rule under the eyebrow, and the mark
 * beside a status. Charcoal Slate is still every word.
 *
 * Behaviour, in the order it matters:
 *
 * - Trigger is a <button> with `aria-expanded`. It is a disclosure, not a
 *   link, so it never navigates on click and never traps someone who only
 *   wanted the listing — the listing is the last item inside.
 * - Opens on hover for a mouse and on focus for a keyboard, closes on Escape,
 *   on leaving the whole region, and on any click outside it.
 * - Escape returns focus to the trigger, so a keyboard visitor is put back
 *   where they were rather than at the top of the document.
 * - The closed panel is `inert`, which is what `hidden` used to do for free:
 *   its links stay out of the tab order and out of the accessibility tree
 *   while it is clipped away.
 */
export function WorkshopsMenu({
  label,
  href,
  experiences,
  sessions,
  isActive,
  linkClassName,
  onOpenChange,
}: WorkshopsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  /** Mounted on the first open; never unmounted after, so later opens animate. */
  const [mounted, setMounted] = useState(false);
  /** The visual state, set one frame behind `isOpen` — see the note above. */
  const [shown, setShown] = useState(false);
  const menuId = useId();
  const region = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /*
    ESCAPE HAS TO OUTRANK FOCUS-TO-OPEN, AND IT DID NOT.

    The region opens on focus, which is how a keyboard visitor gets into the
    panel at all. Escape closes the menu and then puts focus back on the
    trigger, so that they are not dropped at the top of the document — and that
    focus lands inside the region, fires the same handler, and the menu they
    just dismissed opens again. Measured: `aria-expanded` was still "true" one
    frame after Escape.

    Raised for exactly the one frame the programmatic focus takes, so the
    handler can tell "focus arrived because the visitor tabbed here" from
    "focus arrived because we put it here".
  */
  const dismissed = useRef(false);

  /*
    THE GAP IS WHY THIS NEEDS A DELAY.

    The panel is `absolute inset-x-0 top-full`, which positions it against the
    <header> — the nearest positioned ancestor — not against this region, whose
    own box is just the width and height of the trigger word. Between the
    bottom of that word and the top of the panel lies the bar's own padding,
    and that strip belongs to the header, not to anything in here.

    `mouseleave` does not fire when the pointer moves into a descendant, so a
    panel touching the trigger would have been fine. Crossing the bar's padding
    is not: the pointer leaves the region, the menu closes, and it closes
    before the pointer has travelled far enough to reach the thing it was
    aiming at. Every strand was unreachable by mouse.

    A short grace period fixes it without touching the layout — leaving arms a
    close, re-entering anywhere in the region or the panel disarms it. 220ms is
    long enough to cross roughly 40px of padding at an ordinary pointer speed
    and short enough that a menu left behind still feels like it shut promptly.

    Escape and an outside click still close immediately; neither is a near miss.
  */
  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const report = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      // Closing needs no frame of its own — the panel is already laid out, so
      // the visual state can drop in the same commit that closes it. Only the
      // open is deferred, in the effect below.
      if (!open) setShown(false);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const openNow = useCallback(() => {
    cancelClose();
    setMounted(true);
    report(true);
  }, [cancelClose, report]);

  const closeSoon = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => report(false), 220);
  }, [cancelClose, report]);

  const closeNow = useCallback(() => {
    cancelClose();
    report(false);
  }, [cancelClose, report]);

  // A pending close must not outlive the component, or it fires against an
  // unmounted tree on the way to another page.
  useEffect(() => cancelClose, [cancelClose]);

  /*
    ONE FRAME LATER, ON PURPOSE.

    A transition needs two states in two frames. On the first open the panel's
    contents are mounting in the same commit that opens them, so setting the
    open classes now would paint them already open and there would be nothing
    to animate. Two nested frames is the reliable version of "after this one
    has been laid out and painted" — one is enough in Chrome and not in every
    engine. Closing needs no such care: the element is already there.
  */
  useEffect(() => {
    if (!isOpen) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      dismissed.current = true;
      closeNow();
      trigger.current?.focus();
      requestAnimationFrame(() => {
        dismissed.current = false;
      });
    };

    // A click anywhere else dismisses it — including on the page behind, which
    // is what someone expects when they have decided against the menu.
    const onPointerDown = (event: PointerEvent) => {
      if (!region.current?.contains(event.target as Node)) closeNow();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen, closeNow]);

  const groups = GROUPS.map((group) => ({
    ...group,
    items: experiences.filter((experience) => experience.kind === group.mode),
  })).filter((group) => group.items.length > 0);

  /*
    The sweep order: the intro column is 0, then every row in the order it is
    read, left group before right. A row's delay is its place in that order, so
    the panel fills the way an eye crosses it rather than all at once — and on
    the way out every delay is dropped, so it leaves in one piece.
  */
  const order = new Map<string, number>();
  for (const group of groups) {
    for (const item of group.items) order.set(item.slug, order.size + 1);
  }
  const rise = (index: number) => ({ transitionDelay: shown ? `${100 + index * 32}ms` : "0ms" });
  /*
    `translate`, not `transform`. Tailwind v4 sets movement on the individual
    `translate` property, so a transition list naming `transform` animates
    nothing — the opacity faded and the 12px rise snapped, which was the exact
    "not smooth" the client already had.
  */
  const RISE = "transition-[opacity,translate] duration-[460ms] ease-editorial motion-reduce:transition-none";
  const riseState = shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0";

  const sessionFor = (slug: string) => sessions.find((session) => session.slug === slug);

  return (
    <div
      ref={region}
      // `static`, so the full-bleed panel below still positions against the
      // <header> rather than against this box. `h-full` is what removes the
      // dead strip between the two — see the note in <HeaderBar>.
      className="static flex h-full items-center"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      // Fires when focus leaves the region entirely, which is how a keyboard
      // visitor tabbing past the last strand closes it. No grace period here —
      // focus does not drift across a gap the way a pointer does.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) closeNow();
      }}
      onFocus={() => {
        // Not when Escape put the focus here — see `dismissed` above.
        if (!dismissed.current) openNow();
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => (isOpen ? closeNow() : openNow())}
        className={cn(linkClassName, "cursor-pointer items-center")}
      >
        {/*
          The rule is drawn while the menu is open as well as on the current
          page. Opening a menu is the same gesture as hovering the link it
          hangs off, and leaving the trigger unmarked while its own panel is
          down reads as the panel belonging to nothing.
        */}
        {/*
          NO MARK BESIDE THE WORD.

          There was a small triangle here saying the entry had something behind
          it. The client has asked for it to come out, and the row is better
          for it: the trigger now sets exactly like the links either side of
          it, which is what the arrow was quietly preventing — a flex row
          carrying a word and a 7px glyph does not measure the same as one
          carrying a word.

          `aria-expanded` on the button still states the relationship properly,
          so nothing is lost to a screen reader. What is lost is the visual
          cue for a touch visitor, who now discovers the panel by tapping —
          which is the trade the client has chosen.
        */}
        <NavLabel isActive={isActive || isOpen}>{label}</NavLabel>
      </button>

      {/*
        Full-bleed rather than a floating card. A panel hanging under one word
        would be a component sitting on the page; a field that runs the width
        of the screen reads as the page opening up, which is the register the
        rest of the site is in.
      */}
      <div
        id={menuId}
        inert={!isOpen}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        /*
          A WHITE FIELD NOW, NOT A CHARCOAL ONE.

          The bar takes the page's own near-white the moment it stops being
          transparent, and a panel that dropped out of it in Charcoal Slate
          read as a second, unrelated surface arriving from somewhere else.
          Same ground as the bar means the two are one object opening, which is
          what a menu hanging off a masthead should be.

          Charcoal on this ground is 11.61:1; the hairline at the top is the
          bar's own. The Deep Lilac line along the bottom is the drawer's
          edge — it travels down with the reveal, which is what makes the open
          read as a movement rather than a fade.
        */
        className={cn(
          "absolute inset-x-0 top-full overflow-hidden bg-surface",
          "border-t border-t-text/10 border-b-2 border-b-primary/30",
          "transition-[clip-path,opacity] ease-editorial motion-reduce:transition-none",
          shown
            ? "opacity-100 duration-[520ms] [clip-path:inset(0_0_0_0)]"
            : "opacity-0 duration-[240ms] [clip-path:inset(0_0_100%_0)]",
          isOpen ? null : "pointer-events-none",
        )}
      >
        {mounted ? (
          <div className="mx-auto w-full px-gutter py-8 lg:py-9">
            {/*
              THE PANEL SAYS HOW YOU TAKE PART BEFORE IT SAYS WHAT.

              It used to show the four creative strands — Paint, Shape, Craft,
              Create — which are categories, not things anyone can do, and said
              nothing about the one distinction a visitor has to learn: most
              activities are walk-in and never booked, and two are scheduled
              sessions that are. So the approved activities are listed in those
              two groups, each headed by the mark the rest of the site uses,
              and every entry opens its own page.

              Text rows with a small thumbnail rather than large plates: seven
              entries have to scan in a glance, and a caption laid over a
              photograph at menu size needs a scrim heavy enough to spoil it.

              THE COLUMNS ARE 3 / 6 / 3, not 4 / 5 / 3. The intro was a third
              of the panel holding four short lines, and the scheduled column
              ran out 70px above the floor — the empty space the client marked.
              A narrower intro, a wider walk-in column that takes its five
              entries as two even columns, and dates on the scheduled rows
              leave the three columns ending within a line of each other.
            */}
            <div className="grid grid-cols-12 gap-x-6 gap-y-8 lg:gap-x-8">
              <div
                className={cn("col-span-12 flex flex-col lg:col-span-3 xl:col-span-4", RISE, riseState)}
                style={rise(0)}
              >
                <p className="text-label font-semibold uppercase tracking-eyebrow text-primary">
                  {label}
                </p>
                {/* The site's own accent mark under an eyebrow — see <SectionHeader>. */}
                <span aria-hidden className="mt-2.5 block h-px w-8 bg-terracotta" />
                <p className="mt-3.5 max-w-[12ch] text-[clamp(1.5rem,1.15rem+0.9vw,2rem)] font-light leading-[1.1] tracking-[-0.02em] text-text">
                  Choose what you make.
                </p>
                <p className="mt-3 max-w-[30ch] text-fine leading-[1.6] text-text/85">
                  Walk in and create at your own pace, or book a guided session for a set date.
                </p>
                {/*
                  The one filled control in the panel, and the only Deep Lilac
                  ground in it. It is the banner's button — the same pill, the
                  same flood of Light Sage rising through the gooey filter on
                  hover — at the client's ask, so the site has one primary
                  action rather than two that merely share a colour.
                */}
                <BlobButton
                  href={href}
                  onClick={closeNow}
                  className="mt-6 w-fit min-h-[3.25rem] px-7"
                >
                  All experiences
                </BlobButton>
              </div>

              {groups.map((group) => (
                <div key={group.mode} className={`col-span-12 ${group.span}`}>
                  {/*
                    THE HEADING SAYS WHAT THE GROUP IS FOR.

                    It used to be a tab and, at the far right of the column, two
                    words — "No booking", "Booked online". The client's note was
                    that nobody could tell what this part of the menu was doing,
                    and they were right: a label pushed 500px away from the tab
                    it belongs to is not an explanation, it is a caption looking
                    for a picture.

                    So the tab keeps the mark and the one word, and directly
                    under it, in a full sentence, is what that word means for a
                    visitor. Both groups are built the same way, so their rules
                    line up and the two are read as a pair — which is the one
                    distinction this menu exists to teach.

                    Charcoal on Light Sage is 9.35:1.
                  */}
                  <div
                    className={cn("border-b border-line pb-2.5", RISE, riseState)}
                    style={rise(order.get(group.items[0].slug) ?? 0)}
                  >
                    <p className="inline-flex items-center gap-2.5 rounded-pill bg-sage/70 px-3 py-1.5 text-label font-semibold uppercase tracking-eyebrow text-text">
                      <ModeMark mode={group.mode} />
                      {group.title}
                    </p>
                    <p className="mt-2 text-fine leading-[1.5] text-text/85">{group.note}</p>
                  </div>
                  <ul
                    className={
                      group.mode === "diy" ? "mt-2 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-6" : "mt-2"
                    }
                  >
                    {group.items.map((experience) => {
                      const session = sessionFor(experience.slug);
                      const scarce = session ? isScarce(session) : false;

                      return (
                        <li
                          key={experience.slug}
                          className={cn(RISE, riseState)}
                          style={rise(order.get(experience.slug) ?? 0)}
                        >
                          {/*
                            NO UNDERLINE ON THESE ROWS. They carried the bar's
                            own wipe under the name; the client has asked for it
                            off here, and the menu is better for it — seven rows
                            each drawing a line under themselves was the one
                            place on the site where that mark was decoration
                            rather than navigation.

                            What answers a pointer instead is the row itself:
                            the White Rock ground, the thumbnail's slow zoom and
                            the name taking Deep Lilac. The underline in the bar
                            above is untouched — the client likes it there.
                          */}
                          <Link
                            href={`/events/${experience.slug}`}
                            onClick={closeNow}
                            className="group -mx-2 flex items-center gap-3.5 rounded-sm px-2 py-2 transition-colors duration-300 ease-soft hover:bg-cream/70"
                          >
                            <span className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-cream">
                              {experience.image ? (
                                <Image
                                  src={experience.image.src}
                                  alt=""
                                  fill
                                  sizes="48px"
                                  style={{ objectPosition: experience.image.position ?? "50% 50%" }}
                                  className="object-cover transition-transform duration-700 ease-editorial motion-safe:group-hover:scale-110"
                                />
                              ) : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-body font-medium leading-snug text-text transition-colors duration-300 ease-soft group-hover:text-primary">
                                {experience.name}
                              </span>
                              {/*
                                WHAT THE SECOND LINE SAYS, AND WHERE IT COMES
                                FROM. A scheduled row carries its real date and
                                its real seat count — `formatWorkshopDate` and
                                `spotsLabel`, the same two functions the listing
                                and the event page call, reading `seatsAvailable`
                                straight from the session. Nothing here is
                                estimated: no session, no line.

                                A session down to its last few seats takes Deep
                                Lilac, the colour of the action beside it, and a
                                dot — the studio's own way of marking scarcity.
                                Everything else stays quiet, because a menu that
                                marks all seven rows as urgent marks none.
                              */}
                              {session ? (
                                <span className="mt-0.5 block text-fine leading-[1.45] text-text/80">
                                  {/*
                                    Two lines, not one with a middot between
                                    them. The scheduled group is the narrowest
                                    column on the widest screen — 229px at
                                    1024 — and "Sun 11 Oct · 9 spots available"
                                    sets at 186px, so on one line it broke
                                    mid-phrase. A fact to a line cannot break
                                    at all, and it gives the seat count a line
                                    of its own, which is where the client
                                    wanted the eye to land.
                                  */}
                                  <span className="block">
                                    {formatWorkshopDate(session.startsAt)}
                                  </span>
                                  <span
                                    className={cn(
                                      "flex items-center gap-1.5",
                                      scarce ? "font-medium text-primary" : null,
                                    )}
                                  >
                                    {scarce ? (
                                      <span
                                        aria-hidden
                                        className="size-1.5 shrink-0 rounded-pill bg-primary"
                                      />
                                    ) : null}
                                    {spotsLabel(session)}
                                  </span>
                                </span>
                              ) : experience.status ? (
                                <span className="mt-0.5 flex items-center gap-1.5 text-fine leading-tight text-text/80">
                                  <span
                                    aria-hidden
                                    className="size-1.5 shrink-0 rounded-pill bg-terracotta"
                                  />
                                  {experience.status}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
