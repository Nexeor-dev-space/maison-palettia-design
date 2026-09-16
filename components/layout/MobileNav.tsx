"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { BookAction } from "@/components/layout/BookAction";
import { NavLabel } from "@/components/layout/NavLabel";
import type { Discipline, NavItem } from "@/types";

/**
 * How far apart the pieces of the menu arrive, in seconds, and the longest any
 * of them waits.
 *
 * Short on both counts. A menu is a thing someone opened because they want to
 * be somewhere else, so the sequence has to be over before it is noticed as a
 * sequence — the last link is in place a third of a second after the first.
 */
const STEP = 0.045;
const CAP = 0.32;

/** The delay for the nth thing down the panel, in CSS-ready form. */
const riseDelay = (index: number) => ({ animationDelay: `${Math.min(index * STEP, CAP)}s` });

interface MobileNavProps {
  id: string;
  /** Focused when the panel closes, so a keyboard lands back where it was. */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Changes on each open, and keys the panel so the reveal replays. */
  openCount: number;
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  disciplines: Discipline[];
  isActive: (href: string) => boolean;
}

/**
 * The mobile navigation, as a full-height editorial overlay.
 *
 * It was a drawer: a short white panel under the bar holding six links at body
 * size and the action last, which told a visitor nothing about what the studio
 * does and buried the one thing most of them came to do. This is the same
 * information given the whole screen — the four strands first, as pictures,
 * then the action, then the rest of the site in small type underneath.
 *
 * Order is the argument. Someone opening this menu on a phone is deciding
 * whether to spend a Saturday here, so what they see first is what a Saturday
 * here looks like, and the second thing is how to book one.
 *
 * The panel takes the charcoal ground so the bar above it does not change
 * colour when it opens; the two read as one field. Scroll locking and the
 * Escape key are owned by the bar, which is where the open state lives.
 *
 * It is taller than the screen on a phone — four pictures, the action and six
 * links — so it is its own scroll container, and that is the part that has to
 * be said out loud to two different systems. See the attributes on the panel.
 */
export function MobileNav({
  id,
  triggerRef,
  openCount,
  isOpen,
  onClose,
  items,
  disciplines,
  isActive,
}: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // A route change from inside the overlay should close it. The links call
  // `onClose` directly, but a browser back/forward while it is open would
  // otherwise leave it covering the page it returned to.
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("popstate", onClose);
    return () => window.removeEventListener("popstate", onClose);
  }, [isOpen, onClose]);

  /*
    FOCUS, WHICH THIS PANEL PREVIOUSLY DID NOT HANDLE AT ALL.

    The overlay covers the page but the page behind it stays in the tab order,
    so a keyboard or screen-reader visitor opening the menu was left with focus
    still on the trigger and a Tab key that walked straight past the menu into
    content they could not see. Escape closed it and dropped focus to the
    document.

    Three things fix it, and all three are required together:

      - focus moves into the panel when it opens, so the next Tab is inside it;
      - Tab and Shift+Tab cycle within the panel while it is open;
      - focus returns to the trigger when it closes, so nobody is dropped at
        the top of the document.

    The panel is `hidden` when closed, so its contents are out of the tab order
    on their own — this only has to hold the boundary while it is open.
  */
  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Captured now rather than read at cleanup: the trigger node is stable for
    // the life of the bar, and reading a ref during teardown is the pattern
    // the exhaustive-deps rule warns about.
    const trigger = triggerRef.current;
    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // Wrap at both ends, and pull focus back in if it has escaped the panel.
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Only take focus back if it is still somewhere in the panel; a link
      // that navigated has already moved it somewhere more useful.
      if (panel.contains(document.activeElement) || document.activeElement === previouslyFocused) {
        trigger?.focus();
      }
    };
  }, [isOpen, triggerRef]);

  return (
    <div
      id={id}
      hidden={!isOpen}
      /*
        Lenis listens for wheel and touch on the window with `passive: false`
        and calls `preventDefault()` on anything it decides to handle — which
        includes every wheel gesture made inside this panel. The browser then
        never scrolls the panel and Lenis scrolls the page behind it instead,
        so the menu simply does not move: proven here, not guessed at, by
        dispatching a wheel event inside the open overlay and reading
        `defaultPrevented === true` back off it. `data-lenis-prevent` is the
        documented way out — Lenis walks the event's composed path for it and
        bails before it does anything else, including before it checks whether
        it has been stopped, which is what lets this panel keep scrolling while
        the page behind it is held. (`allowNestedScroll` would do the same for
        every nested scroller on the site; this is the only one that needs it.)

        `overscroll-contain` is the second half. Without it, a gesture that
        carries on past the top or bottom of this list chains out into the
        document — on a phone that is the difference between a menu that stops
        at its ends and one that hands the whole gesture to the page.
      */
      data-lenis-prevent
      ref={panelRef}
      aria-label="Site menu"
      className="fixed inset-x-0 bottom-0 top-header overflow-y-auto overscroll-contain bg-nav md:top-header-lg lg:hidden"
    >
      {/* Keyed so the reveal below runs again every time the menu is opened. */}
      <div key={openCount} className="px-gutter pb-16 pt-10">
        {/* 01 — what you could do here. */}
        <nav aria-label="Creative strands">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8">
            {disciplines.map((strand, i) => (
              <li key={strand.slug} className="animate-rise" style={riseDelay(i)}>
                <Link href={strand.href} onClick={onClose} className="group block">
                  <div className="relative aspect-[5/4] w-full overflow-hidden rounded-sm bg-on-dark/5">
                    <Image
                      src={strand.image.src}
                      alt=""
                      fill
                      sizes="46vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-3 text-fine font-medium uppercase tracking-eyebrow text-on-dark">
                    {strand.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 02 — the action, given a rule of its own so it is not one of a list. */}
        <div
          className="mt-12 animate-rise border-y border-on-dark/15 py-7"
          style={riseDelay(disciplines.length)}
        >
          <BookAction size="panel" onNavigate={onClose} />
        </div>

        {/* 03 — the rest of the site. */}
        <nav aria-label="Primary" className="mt-10">
          <ul className="flex flex-col">
            {items.map((item, i) => (
              <li
                key={item.href}
                className="animate-rise"
                style={riseDelay(disciplines.length + 1 + i)}
              >
                {/*
                  The same device the desktop bar uses — see <NavLabel> — kept
                  in step for a reason beyond consistency: the sage this used
                  to switch the text to on the current-page state measured
                  3.84:1 during the bar's stretch on Deep Lilac, at this size
                  and weight (light, not bold, so the 22px does not earn the
                  large-text exemption) — under the 4.5:1 running text owes.
                  The drawn rule is a graphical mark rather than text and
                  clears 3:1 comfortably against either ground, so it carries
                  hover and current-page alone; the label stays white
                  throughout regardless of which ground the bar is on.
                */}
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="group/nav block py-3.5 text-[1.35rem] font-light uppercase tracking-[0.02em] text-on-dark"
                >
                  <NavLabel isActive={isActive(item.href)}>{item.label}</NavLabel>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
