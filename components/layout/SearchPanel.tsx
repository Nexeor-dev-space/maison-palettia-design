"use client";

import { Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";

import { WORKSHOPS_HREF } from "@/lib/constants";
import { getPopularSearches, searchWorkshops } from "@/lib/search";
import { pauseScroller, resumeScroller } from "@/lib/scroll";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { formatVenueLine, formatWorkshopDate, sessionTimeRange, workshopHref } from "@/lib/workshops";
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
export function SearchPanel({ id, openCount, isOpen, onClose, triggerRef, workshops }: SearchPanelProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const panelRef = useRef<HTMLDivElement>(null);

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
        hidden={!isOpen}
        data-lenis-prevent
        // `top-header md:top-header-lg`, not the resting height alone — the
        // header itself is 80px at rest and 104px from `md`, and this has to
        // clear whichever one is actually on screen or it either overlaps the
        // bar or leaves a strip of the page showing under it. See the same
        // pair on <MobileNav>, which this is positioned to match exactly.
        className="fixed inset-x-0 bottom-0 top-header overflow-y-auto overscroll-contain bg-nav md:top-header-lg"
      >
        <div className="animate-rise px-gutter pb-16 pt-10">
          <SearchExperience key={openCount} onClose={onClose} workshops={workshops} />
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      ref={panelRef}
      hidden={!isOpen}
      className="absolute inset-x-0 top-full border-t border-white/10 bg-nav"
    >
      <div className="mx-auto w-full animate-rise px-gutter py-12 lg:py-14">
        <div className="mx-auto max-w-[36rem]">
          <SearchExperience key={openCount} onClose={onClose} workshops={workshops} />
        </div>
      </div>
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
function SearchExperience({ onClose, workshops }: { onClose: () => void; workshops: Workshop[] }) {
  const headingId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const trimmedQuery = debouncedQuery.trim();

  const results = useMemo(() => searchWorkshops(workshops, debouncedQuery), [workshops, debouncedQuery]);
  const popularSearches = useMemo(() => getPopularSearches(workshops), [workshops]);

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
        <h2 id={headingId} className="text-[0.68rem] font-medium uppercase tracking-eyebrow text-white">
          Search Maison Palettia
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center text-white transition-colors duration-200 hover:text-sage"
        >
          <X size={22} aria-hidden />
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 lg:mt-8" role="search">
        <div className="flex items-center gap-3 border-b border-white/25 pb-3 transition-colors duration-300 ease-soft focus-within:border-sage">
          <Search size={20} aria-hidden className="shrink-0 text-white/80" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-labelledby={headingId}
            placeholder="Search events, workshops, and more"
            autoComplete="off"
            className="w-full bg-transparent text-xl font-light text-white placeholder:text-white/95 outline-none lg:text-lg"
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
        ) : results.length === 0 ? (
          <NoResults onNavigate={onClose} />
        ) : (
          <ResultList workshops={results.slice(0, RESULT_LIMIT)} onNavigate={onClose} />
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
      <p className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-white">
        Popular searches
      </p>
      <ul className="mt-4 flex flex-wrap gap-2.5">
        {terms.map((term) => (
          <li key={term}>
            <button
              type="button"
              onClick={() => onPick(term)}
              className="rounded-pill border border-white/20 px-4 py-2 text-[0.8rem] text-white transition-colors duration-200 ease-soft hover:border-sage hover:text-sage"
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
      <p className="text-[0.95rem] font-medium text-white">No events found</p>
      <p className="mt-2 text-[0.85rem] text-white/95">
        Try searching for another event, location, or activity.
      </p>
      <Link
        href={WORKSHOPS_HREF}
        onClick={onNavigate}
        className="group mt-6 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-sage"
      >
        <span className="border-b border-sage/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-sage">
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
    <ul className="flex flex-col gap-6 lg:gap-5">
      {workshops.map((workshop) => (
        <li key={workshop.slug}>
          <ResultCard workshop={workshop} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

/**
 * One event, as a single clickable row: thumbnail, category, title, the date
 * and time, the venue if there is one — the same four facts the rest of the
 * site states in the same order (where, when — the schedule's own logic —
 * folded here into one compact line rather than a table, because a search
 * result is a pointer to the full page, not the page itself).
 *
 * `bg-white/10` behind the thumbnail rather than `<WorkshopPhoto>`'s own
 * `bg-surface-alt`: that component is tuned for the light grounds it
 * normally sits on, and its cream placeholder would read as a hole in this
 * panel's dark one. <WorkshopsMenu> hand-rolls its own thumbnails for the
 * same reason; this follows that precedent rather than reaching for
 * `<WorkshopPhoto>` and fighting its ground.
 */
function ResultCard({ workshop, onNavigate }: { workshop: Workshop; onNavigate: () => void }) {
  const { start } = sessionTimeRange(workshop.startsAt, workshop.durationMinutes);

  return (
    <article className="group relative flex items-center gap-4">
      <div className="relative aspect-square w-16 shrink-0 overflow-hidden bg-white/10 lg:w-[4.5rem]">
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
        <p className="text-[0.6rem] font-medium uppercase tracking-eyebrow text-white">
          {workshop.category}
        </p>
        <h3 className="mt-1 truncate text-[1rem] font-medium leading-snug text-white">
          <Link href={workshopHref(workshop)} onClick={onNavigate} className="after:absolute after:inset-0">
            {workshop.title}
          </Link>
        </h3>
        <p className="mt-1 truncate text-[0.8rem] text-white/95">
          {formatWorkshopDate(workshop.startsAt)}
          <span aria-hidden className="px-1.5 text-white/80">
            &middot;
          </span>
          <span className="tabular-nums">{start}</span>
          {workshop.venue ? (
            <>
              <span aria-hidden className="px-1.5 text-white/80">
                &middot;
              </span>
              {formatVenueLine(workshop.venue)}
            </>
          ) : null}
        </p>
      </div>

      <span
        aria-hidden
        className="hidden shrink-0 items-center gap-2 text-[0.62rem] font-medium uppercase tracking-eyebrow text-sage lg:flex"
      >
        View event
        <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
          &#8594;
        </span>
      </span>
    </article>
  );
}
