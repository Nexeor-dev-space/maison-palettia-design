"use client";

import { Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";

import { WORKSHOPS_HREF } from "@/lib/constants";
import { getPopularSearches, searchExperiences, searchWorkshops } from "@/lib/search";
import { pauseScroller, resumeScroller } from "@/lib/scroll";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useMediaQuery } from "@/lib/useMediaQuery";
import {
  formatVenueLine,
  formatWorkshopDate,
  isFullyBooked,
  isScarce,
  sessionTimeRange,
  spotsLabel,
  workshopHref,
} from "@/lib/workshops";
import { cn } from "@/lib/utils";
import type { CreativeExperience } from "@/lib/experiences";
import type { Workshop } from "@/types";

/** Cards shown at once. The brief's own instruction — do not overwhelm — set
 * against a catalogue that will grow past what a quick-search overlay should
 * ever try to list in full; `/events` is where the complete programme lives. */
const RESULT_LIMIT = 6;

/** How long the results wait for typing to pause. Fast enough that "live
 * search" still feels live; long enough that a fast typist's every keystroke
 * does not re-render and re-layout the list underneath them. */
const DEBOUNCE_MS = 160;

/** The same threshold `lg:` utilities answer to — see `--breakpoint-lg` in
 * globals.css. Read once here rather than duplicated as a bare number, so the
 * two can never quietly drift apart. */
const DESKTOP_QUERY = "(min-width: 64rem)";

interface SearchPanelProps {
  id: string;
  /** Bumped by the header every time the panel opens; see the note below. */
  openCount: number;
  isOpen: boolean;
  onClose: () => void;
  /** The trigger button, excluded from the desktop panel's outside-click
   * check — see the note on that effect below. */
  triggerRef: RefObject<HTMLButtonElement | null>;
  workshops: Workshop[];
  /**
   * The studio's approved activities.
   *
   * Search indexed the schedule alone until now, and the schedule is two
   * dates — so five of the seven things the Maison does could not be found by
   * name. The header already holds this list for the Experiences menu, so it
   * costs one prop rather than a second fetch.
   */
  experiences: readonly CreativeExperience[];
}

/**
 * Ink on this panel, and why none of it is faded.
 *
 * The nav ground is Deep Lilac, and the headroom above it is small: full white
 * measures 5.06:1 and the ratio falls under the 4.5:1 body text owes by /90.
 * There is no usable faded scale here — the /70, /55 and /50 values this panel
 * used to carry were calibrated against the near-black ground it had before,
 * where even /50 cleared 5:1. Anything read is therefore full white or /95,
 * and the hierarchy is carried by size, weight and letterspacing, which it
 * largely was already. The `aria-hidden` marks — the search glyph and the
 * separators between a result's metadata — are graphical objects owing 3:1
 * rather than 4.5:1, and sit at /80 (3.88:1).
 */
/**
 * The search overlay's shell: where it sits, and when it opens and closes.
 *
 * Below `lg` it is a full-screen panel in the same register as the mobile
 * navigation menu — same ground, same positioning, same scroll lock, because
 * a visitor should not be able to tell from the chrome alone which overlay
 * they opened. From `lg` it is a compact panel dropped from the header, the
 * same device <WorkshopsMenu> uses for its own disclosure, so the bar reads
 * as one system rather than as two different ideas about what opens under it.
 *
 * ONE MOUNT, NOT TWO. An earlier version rendered both shapes at once and hid
 * whichever the viewport did not need with `hidden lg:block` — which is the
 * pattern the rest of the header uses, and is wrong here specifically because
 * the search state below (<SearchExperience>) owns things a duplicate cannot
 * safely share: two live inputs cannot both call `.focus()` on open without
 * one stealing it from the other, silently, depending only on DOM order.
 * `useMediaQuery` decides which single shape actually mounts. The edge this
 * trades away: resizing an open panel across the breakpoint remounts it and
 * loses whatever was typed. Genuinely rare — nobody rotates a phone or drags
 * a desktop window mid-search — and worth it for correctness everywhere else.
 *
 * The query itself lives one component down, in <SearchExperience>, keyed by
 * `openCount` so a fresh instance — and an empty box — is what a visitor gets
 * every time they open search, without this component reaching into a ref to
 * force the reset by hand.
 */
export function SearchPanel({ id, openCount, isOpen, onClose, triggerRef, workshops, experiences }: SearchPanelProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const panelRef = useRef<HTMLDivElement>(null);

  /*
    MOUNTED ON THE FIRST OPEN, AND NEVER BEFORE.

    <SearchExperience> focuses its input the instant it mounts — mounting and
    opening are the same event for a component that only exists because
    someone asked for search. That held while the panel was toggled with
    `hidden`, because `.focus()` on a `display: none` element does nothing at
    all, so the effect ran on every page load and quietly failed.

    The panel is animated now, which means it stays displayed while it is
    closed — and that same effect would fire for real, dropping the caret into
    a search box nobody opened and scrolling the page up to it. So the
    contents are gated: nothing mounts until the first open, and after that
    they stay, which is also what gives every later open a transition to run.

    ONE FRAME LATER, ON PURPOSE. A transition needs two states in two frames,
    and on the first open the contents mount in the same commit that opens
    them — setting the open classes there would paint them already open with
    nothing to animate. Two nested frames is the reliable version of "once
    this has been laid out and painted"; one is enough in Chrome and not in
    every engine. <useMenuDisclosure> waits the same two frames for the two
    megamenus, for the same reason.

    `ready` is the whole state this needs, and it is one-way: it says the
    panel has been through a first open and is laid out. Everything else
    falls out of it and the `isOpen` the header owns, which is why neither
    flag below is state of its own — deriving them is what keeps this out of
    an effect that writes state on every open and close.
  */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isOpen || ready) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isOpen, ready]);

  /** Rendered from the first open onward — see above. */
  const mounted = isOpen || ready;
  /** The visual state: open, and laid out at least one frame ago. */
  const shown = isOpen && ready;

  /*
    The rise the contents make into the drawn panel, held back far enough that
    the surface is most of the way down before the words start arriving. The
    two megamenus stagger a grid of rows across this beat; search has one
    column, so it is a single move.
  */
  const RISE =
    "transition-[opacity,translate] duration-[460ms] ease-editorial motion-reduce:transition-none " +
    "[transition-delay:120ms]";
  const riseState = shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0";

  // Escape closes on both shapes. The brief calls this out for the desktop
  // overlay specifically; there is no reason the full-screen one should
  // behave worse, so it gets the same handler rather than a narrower one.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, triggerRef]);

  /*
    Scroll is held only for the full-screen shape. The desktop dropdown is a
    small panel in the page's own flow — the same as <WorkshopsMenu>'s, which
    does not lock scroll either — so there is nothing behind it that needs
    holding still. The mobile shape covers the whole screen, which is exactly
    the case `pauseScroller` exists for; see its own notes in lib/scroll.ts
    for why `overflow: hidden` alone is not enough against Lenis.
  */
  useEffect(() => {
    if (!isOpen || isDesktop) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pauseScroller();
    return () => {
      document.body.style.overflow = previousOverflow;
      resumeScroller();
    };
  }, [isOpen, isDesktop]);

  // Outside-click, desktop only — the mobile shape covers the screen, so
  // there is no "outside" to click. Excludes the trigger button deliberately:
  // without that, clicking it to close the panel closes it on `pointerdown`
  // and the trigger's own `onClick` then reopens it on the same gesture,
  // because `pointerdown` fires before `click` does.
  useEffect(() => {
    if (!isOpen || !isDesktop) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, isDesktop, onClose, triggerRef]);

  if (!isDesktop) {
    return (
      <div
        id={id}
        ref={panelRef}
        // `inert`, not `hidden`. `hidden` is `display: none`, which is not a
        // state anything can animate between — the overlay arrived fully
        // formed in one frame and left the same way. `inert` takes the closed
        // panel out of the tab order and out of the accessibility tree while
        // leaving it something a transition can move.
        inert={!isOpen}
        data-lenis-prevent
        // `top-header md:top-header-lg`, not the resting height alone — the
        // header itself is 80px at rest and 104px from `md`, and this has to
        // clear whichever one is actually on screen or it either overlaps the
        // bar or leaves a strip of the page showing under it. See the same
        // pair on <MobileNav>, which this is positioned to match exactly.
        className={cn(
          "fixed inset-x-0 bottom-0 top-header overflow-y-auto overscroll-contain bg-surface md:top-[var(--spacing-header-lg)]",
          // The mobile navigation's own reveal, to the millisecond. These two
          // overlays occupy the same rectangle and a visitor should not be
          // able to tell from the movement which one they opened — see the
          // note at the top of this file on why they share their chrome.
          // `visibility` is in the list so the closed panel stops being a
          // scroll container, and transitions discretely: it stays `visible`
          // for the whole of the 240ms exit and only then goes.
          // `ease-soft` for the same reason as the desktop shape below.
          "transition-[clip-path,opacity,visibility] ease-soft motion-reduce:transition-none",
          shown
            ? "visible opacity-100 duration-[520ms] [clip-path:inset(0_0_0_0)]"
            : "invisible opacity-0 duration-[240ms] [clip-path:inset(0_0_100%_0)]",
        )}
      >
        {mounted ? (
          <div className={cn("px-gutter pb-16 pt-10", RISE, riseState)}>
            <SearchExperience
              key={openCount}
              onClose={onClose}
              workshops={workshops}
              experiences={experiences}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      id={id}
      ref={panelRef}
      // See the note on the full-screen shape above for why this is `inert`
      // and not `hidden`.
      inert={!isOpen}
      /*
        ==================================================================
        THE SAME CARD THE TWO MEGAMENUS OPEN — see <MenuCard>
        ==================================================================

        This was a full-bleed drawer: a field the width of the screen wiping
        down from under the bar with a travelling Deep Lilac lip to draw the
        movement, because one pale ground sliding over another pale ground has
        nothing to show for itself. All three panels in this bar were built
        that way and all three are cards now, at the client's ask.

        The lip goes with the wipe. A card has an edge already — a radius and
        the `plate` veil — so the line that existed to invent one is a rule
        drawn across a rounded corner, which is two edge treatments arguing.
        What draws the movement instead is the card itself: it rises six
        pixels and settles from 98.5%, which is a thing arriving rather than a
        field being revealed.

        NARROWER THAN THE OTHER TWO. Those carry a rail and a preview and earn
        72rem. This is one field and a row of suggestions; at that width the
        input would be a 1100px line with a caret at one end. 44rem is the
        measure the content actually has.
      */
      className={cn(
        "absolute left-1/2 top-[calc(100%+0.5rem)] z-40 -translate-x-1/2",
        "w-[calc(100vw-2*var(--spacing-gutter))] max-w-[44rem]",
        "plate rounded-[1.75rem] bg-cream p-2.5 md:p-3",
        "transition-[opacity,translate,scale] ease-soft motion-reduce:transition-none",
        shown
          ? "scale-100 -translate-x-1/2 translate-y-0 opacity-100 duration-[380ms]"
          : "-translate-x-1/2 -translate-y-1.5 scale-[0.985] opacity-0 duration-[200ms]",
        isOpen ? null : "pointer-events-none",
      )}
    >
      {mounted ? (
        <div className={cn("rounded-[1.35rem] bg-surface p-6 lg:p-8", RISE, riseState)}>
          <div className="mx-auto w-full">
            <SearchExperience
              key={openCount}
              onClose={onClose}
              workshops={workshops}
              experiences={experiences}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The search itself: the query, the results, the empty and no-results states.
 *
 * A component of its own rather than inline in <SearchPanel>, specifically so
 * it can be given a `key`. React remounts a keyed child from scratch whenever
 * its key changes — a plain, ordinary consequence of how keys work, not a
 * mechanism reached for on purpose here — and giving this one `openCount` as
 * its key is what hands every fresh open a `query` that starts at `""`, via
 * `useState`'s own initial value rather than a reset written by hand. No
 * effect clears anything and no ref is read during a render to notice the
 * moment has come; the moment is simply when this component exists again.
 *
 * Focus is the other half of "fresh": the mount effect below runs once, the
 * instant this component exists, which is precisely the instant search was
 * asked for — mounting and opening are the same event for a component that
 * only ever mounts because someone opened it.
 */
function SearchExperience({
  onClose,
  workshops,
  experiences,
}: {
  onClose: () => void;
  workshops: Workshop[];
  experiences: readonly CreativeExperience[];
}) {
  const headingId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const trimmedQuery = debouncedQuery.trim();

  const results = useMemo(() => searchWorkshops(workshops, debouncedQuery), [workshops, debouncedQuery]);
  const activityResults = useMemo(
    () => searchExperiences(experiences, debouncedQuery),
    [experiences, debouncedQuery],
  );
  const popularSearches = useMemo(
    () => getPopularSearches(workshops, experiences),
    [workshops, experiences],
  );
  const nothingFound = results.length === 0 && activityResults.length === 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Enter picks the top match, the way a browser's own address bar does with
  // its first suggestion — a real action for a key the brief asks this to
  // answer, on an interface that otherwise never needs submitting.
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const top = results[0];
    if (!top) return;
    onClose();
    router.push(workshopHref(top));
  };

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <h2 id={headingId} className="text-label font-medium uppercase tracking-eyebrow text-text">
          Search Maison Palettia
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center text-text transition-colors duration-200 hover:text-primary"
        >
          <X size={22} aria-hidden />
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 lg:mt-8" role="search">
        {/*
          A FILLED FIELD, NOT A RULED LINE. The panel is a card on a card now,
          so a single hairline under a caret reads as a form left unfinished
          in the middle of it. A rounded well with its own ground is the same
          shape as everything else in these menus, and it says where to type
          without a label having to.
        */}
        <div className="flex items-center gap-3 rounded-pill bg-cream px-5 py-4 transition-shadow duration-300 ease-soft focus-within:ring-2 focus-within:ring-primary/35">
          <Search size={20} aria-hidden className="shrink-0 text-text/70" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-labelledby={headingId}
            placeholder="Search events by name, type or location"
            autoComplete="off"
            className="w-full bg-transparent text-xl font-light text-text placeholder:text-text/70 outline-none lg:text-lg"
          />
        </div>
      </form>

      {/* `aria-live` so a screen reader hears the count change as the list
          updates, the way it would see it change — nothing here is announced
          twice, since the visible heading each branch renders is itself the
          only text that changes. */}
      <div className="mt-8 lg:mt-10" aria-live="polite">
        {trimmedQuery === "" ? (
          <PopularSearches terms={popularSearches} onPick={setQuery} />
        ) : nothingFound ? (
          <NoResults onNavigate={onClose} />
        ) : (
          /*
            DATES FIRST, THEN ACTIVITIES, and the order is the answer to two
            different questions. A query that matches a session is answered
            best by the session — it has a date, a price and a seat count. A
            query that matches only an activity is answered by the activity's
            own page, which is where a walk-in belongs because there is nothing
            to book. Whichever list is empty simply does not render.
          */
          <div className="space-y-10">
            {results.length > 0 ? (
              <ResultList workshops={results.slice(0, RESULT_LIMIT)} onNavigate={onClose} />
            ) : null}
            {activityResults.length > 0 ? (
              <ActivityResults
                experiences={activityResults.slice(0, RESULT_LIMIT)}
                onNavigate={onClose}
              />
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * The empty-query state: terms someone could search for, read off the
 * catalogue rather than written down — see `getPopularSearches`. Picking one
 * fills the box and runs the search immediately; it is a shortcut into
 * typing, not a link to anywhere, so it stays a `<button>`.
 */
function PopularSearches({ terms, onPick }: { terms: string[]; onPick: (term: string) => void }) {
  if (terms.length === 0) return null;

  return (
    <div>
      <p className="text-label font-medium uppercase tracking-eyebrow text-text">
        Popular searches
      </p>
      <ul className="mt-4 flex flex-wrap gap-2.5">
        {terms.map((term) => (
          <li key={term}>
            <button
              type="button"
              onClick={() => onPick(term)}
              className="rounded-pill bg-cream px-4 py-2.5 text-fine text-text transition-colors duration-200 ease-soft hover:bg-primary hover:text-on-primary"
            >
              {term}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Nothing matched. A dead end is never the honest answer to a search — there
 * is always the full programme one step further on. */
function NoResults({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div>
      <p className="text-body font-medium text-text">No events found</p>
      <p className="mt-2 text-fine text-text/80">
        Try searching for another event, location, or activity.
      </p>
      <Link
        href={WORKSHOPS_HREF}
        onClick={onNavigate}
        className="group mt-6 inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-primary"
      >
        <span className="border-b border-primary/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-primary">
          View all events
        </span>
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    </div>
  );
}

function ResultList({ workshops, onNavigate }: { workshops: Workshop[]; onNavigate: () => void }) {
  return (
    <>
    {/* Labelled now that activities can follow underneath: two unlabelled
        lists of links read as one list that changes shape halfway down. */}
    <p className="mb-4 text-label font-medium uppercase tracking-eyebrow text-text/75">
      Sessions with dates
    </p>
    <ul className="flex flex-col gap-6 lg:gap-5">
      {workshops.map((workshop) => (
        <li key={workshop.slug}>
          <ResultCard workshop={workshop} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
    </>
  );
}

/**
 * Activities that matched, as names rather than as dated rows.
 *
 * NO DATE, NO PRICE, NO SEAT COUNT — because a walk-in activity has none of
 * those, and inventing a shape for it that looks like a session would be
 * telling a visitor there is something to book when there is not. Each row is
 * the activity's name, its one line where the studio has written one, and how
 * you take part. The link goes to the activity's own page, which is the same
 * destination the Experiences menu uses.
 */
function ActivityResults({
  experiences,
  onNavigate,
}: {
  experiences: readonly CreativeExperience[];
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="mb-4 text-label font-medium uppercase tracking-eyebrow text-text/75">
        Activities
      </p>
      <ul className="flex flex-col gap-5">
        {experiences.map((experience) => (
          <li key={experience.slug}>
            <Link
              href={`/events/${experience.slug}`}
              onClick={onNavigate}
              className="group flex items-baseline justify-between gap-5 border-b border-line pb-4 transition-colors duration-200 ease-soft hover:border-primary"
            >
              <span className="min-w-0">
                <span className="block text-body font-light text-text">{experience.name}</span>
                {experience.description ? (
                  <span className="mt-1 block text-fine leading-[1.6] text-text/75">
                    {experience.description}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-label font-medium uppercase tracking-eyebrow text-text/70">
                {experience.kind === "diy" ? "Walk-in" : "Scheduled"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One event, as a single clickable row: thumbnail, category, title, the date
 * and time, the venue if there is one — the same four facts the rest of the
 * site states in the same order (where, when — the schedule's own logic —
 * folded here into one compact line rather than a table, because a search
 * result is a pointer to the full page, not the page itself).
 *
 * The panel is the site's white now, at the client's ask — the same ground as
 * the Experiences menu and the bar on scroll — so the ink is Charcoal Slate
 * and the accents are Deep Lilac (4.67:1 on this ground; Light Sage, the
 * accent on the old charcoal panel, all but vanishes on white). White Rock
 * behind the thumbnail, as <WorkshopsMenu> uses for its own.
 */
function ResultCard({ workshop, onNavigate }: { workshop: Workshop; onNavigate: () => void }) {
  const { start } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);
  const closed = isFullyBooked(workshop);
  const scarce = isScarce(workshop);

  return (
    <article className="group relative flex items-center gap-4">
      <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-sm bg-cream lg:w-[4.5rem]">
        <Image
          src={workshop.image.src}
          alt=""
          fill
          sizes="72px"
          style={{ objectPosition: workshop.image.position ?? "50% 50%" }}
          className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.06]"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-label font-medium uppercase tracking-eyebrow text-text">
          {workshop.category}
        </p>
        <h3 className="mt-1 truncate text-body font-medium leading-snug text-text">
          <Link href={workshopHref(workshop)} onClick={onNavigate} className="after:absolute after:inset-0">
            {workshop.title}
          </Link>
        </h3>
        <p className="mt-1 truncate text-fine text-text/80">
          {formatWorkshopDate(workshop.startsAt)}
          <span aria-hidden className="px-1.5 text-text/70">
            &middot;
          </span>
          <span className="tabular-nums">{start}</span>
          {workshop.venue ? (
            <>
              <span aria-hidden className="px-1.5 text-text/70">
                &middot;
              </span>
              {formatVenueLine(workshop.venue)}
            </>
          ) : null}
        </p>

        {/*
          WHAT IS LEFT, IN THE COLOUR OF THE ACTION.

          The client's note on this card asked for the seat count to be here
          and to carry the call-to-action's colour — "2 spots left" was their
          example. The words are `spotsLabel`, which reads `seatsAvailable`
          straight off the session and is the same sentence the listing, the
          event page and the booking bar set; nothing is estimated and no
          number is written by hand. A session down to its last few seats is
          the one that takes Deep Lilac, the ground of every primary button on
          the site (4.90:1 with `on-primary`); a comfortable one takes Light
          Sage and a closed one the quiet grey, because a panel where every
          result shouts is a panel where nothing does.

          Not positioned, deliberately: the title's `after:absolute inset-0`
          covers the card and is what makes all of it clickable, and a chip
          that painted above it would be a dead patch in the middle of the row.
        */}
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1",
            "text-label font-medium uppercase tracking-eyebrow",
            closed
              ? "bg-text/10 text-text/80"
              : scarce
                ? "bg-primary text-on-primary"
                : "bg-sage text-text",
          )}
        >
          {scarce ? (
            <span aria-hidden className="size-1.5 shrink-0 rounded-pill bg-on-primary/90" />
          ) : null}
          {spotsLabel(workshop)}
        </p>
      </div>

      <span
        aria-hidden
        className="hidden shrink-0 items-center gap-2 text-label font-medium uppercase tracking-eyebrow text-primary lg:flex"
      >
        View event
        <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
          &#8594;
        </span>
      </span>
    </article>
  );
}
