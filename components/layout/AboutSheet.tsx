"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { ABOUT_DOORS } from "@/components/layout/AboutMenu";
import { AboutIcon } from "@/components/layout/bottomNavIcons";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

/**
 * ==========================================================================
 * THE ABOUT SHEET — the desktop's About panel, as the same four lines of text
 * ==========================================================================
 *
 * IT WAS "MORE" AND IT IS THE SAME DRAWER. What changed is what it holds and
 * therefore what it can honestly be called: the desktop bar put Locations,
 * Gallery and Contact under an About panel (see <AboutMenu>), and the phone
 * now groups them the same way. A slot labelled More promises the rest of the
 * menu; this one holds four named pages and says so.
 *
 * WHAT IS IN IT AND WHY. Everything `mobileSurface: "sheet"` marks in
 * MAIN_NAV, which is now exactly the four doors <AboutMenu> opens and in the
 * same order: About the Maison, Locations, Gallery, Contact. They are "who
 * this is and how to reach it", where the bar's own slots are the programme a
 * visitor is moving through. Contact is the one entry that is in both: the
 * bar's fourth slot is Contact too, on purpose, and only the slot carries the
 * "you are here" mark — see the note over `CONTACT_HREF` in <BottomNav>, and
 * `mobileSurface` in lib/constants.ts for the rest.
 *
 * JUST THE TEXT, at the client's later ask. This sheet was four painted
 * cards — a hand-drawn blot on each, a Lucide glyph and the name, in the
 * site's lilac / terracotta / lavender / sage rotation — because an earlier
 * note asked for "not a list of links". The client's note on the desktop
 * About panel has since been "just the text is fine", and the sheet is that
 * panel on a phone, so it follows: each entry is now the page's name over
 * the same line <AboutMenu> gives it (`ABOUT_DOORS`, shared, so the two
 * cannot drift), on the same quiet near-white door the desktop uses. Going
 * back to the cards is a client decision, not a tidy-up: the paints, blots
 * and glyphs they used are gone from this file rather than left unused.
 *
 * NOT FULL SCREEN, also at the client's ask. It is the height of its own
 * contents and it sits on the bar, so the bar it came out of is still
 * visible underneath — a drawer, not a takeover.
 *
 * ==========================================================================
 * HOW IT CLOSES
 * ==========================================================================
 *
 * Four ways, because a drawer with one is a trap: the close control, the
 * scrim behind it, Escape, and following any link in it. Focus moves into the
 * sheet when it opens and returns to the About button when it shuts — that
 * button owns `aria-expanded`, so the state is said as well as drawn.
 */
export function AboutSheet({
  open,
  onClose,
  items,
  returnFocusTo,
}: {
  open: boolean;
  onClose: () => void;
  items: readonly NavItem[];
  returnFocusTo: React.RefObject<HTMLButtonElement | null>;
}) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);

  /* Escape closes it, and focus goes back where it came from. A drawer that
     drops focus at the foot of the document is worse than one that never
     opened. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /*
    "ONLY ON THE CLOSE EDGE" IS WHAT THIS MEANT AND NOT WHAT IT DID. An
    effect with `open` in its deps runs on mount too, and on mount `open`
    is false — so the first page load focused the trigger. Measured at 390
    and 768: `document.activeElement` was the bar's "About" button before
    anything had been touched, which puts a keyboard visitor at the foot of
    the page with the header and the content behind Shift+Tab.

    <BookingSheet> carried the same line and the same bug, and the two hid
    each other: whichever of them ran second won the focus, so fixing one
    alone only changed which button it landed on.
  */
  const hadFocus = useRef(false);
  useEffect(() => {
    if (open) {
      hadFocus.current = true;
      return;
    }
    if (!hadFocus.current) return;
    hadFocus.current = false;
    returnFocusTo.current?.focus();
  }, [open, returnFocusTo]);

  /*
    ======================================================================
    THE SCRIM HELD BACK FINGERS AND NOT TAB
    ======================================================================

    This sheet is deliberately NOT a modal — see the note at the top, and
    <BookingSheet> for the one that is. It gets no `role="dialog"` and no
    Tab trap, because the bar it came out of is meant to stay usable under
    it. That part was right. What was missing is that the scrim already
    makes the rest of the page unusable — it covers the viewport and any
    tap on it closes the sheet — and nothing said the same thing to a
    keyboard.

    So focus moved into the sheet, and one Shift+Tab walked out of it and
    into the footer, then the page, then the header: live controls sitting
    behind a dark scrim, where the focus ring cannot be seen and a click
    would have closed the sheet instead. The sheet has no previous
    sibling, being the last thing in the body, so backwards from its first
    card is always the obscured page.

    `inert` on the rest of the body closes that gap and nothing else. It is
    exactly the scrim's own rule, said to focus and to the accessibility
    tree as well as to the pointer:

      the bar and this sheet ... untouched. They share one body child, so
                                 the host is found from the panel rather
                                 than named, and skipped.
      header, main, footer ..... inert while open, as the scrim already had
                                 them.

    The attribute is only cleared where this effect set it, so an `inert`
    that belongs to something else survives the sheet closing.
  */
  useEffect(() => {
    if (!open) return;
    const host = panel.current?.closest("body > *");
    if (!host) return;

    const silenced = Array.from(document.body.children).filter(
      (el) => el !== host && !el.hasAttribute("inert"),
    );
    silenced.forEach((el) => el.setAttribute("inert", ""));

    return () => silenced.forEach((el) => el.removeAttribute("inert"));
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* The scrim. `aria-hidden` and a plain div: the sheet is not modal
              — the bar under it stays usable — so this is a surface to tap,
              not a dialog's backdrop. */}
          <motion.div
            aria-hidden
            onClick={onClose}
            className="fixed inset-0 z-30 bg-text/25 lg:hidden"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22 }}
          />

          <motion.div
            ref={panel}
            id="bottom-nav-about"
            role="group"
            aria-label="About the Maison"
            className={cn(
              "fixed inset-x-0 z-40 lg:hidden",
              "bottom-[calc(var(--bottom-nav-h)-0.75rem)]",
            )}
            initial={reduce ? false : { y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 20, opacity: 0 }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 }
            }
          >
            <div className="rounded-[1.75rem] bg-cream px-4 pb-7 pt-4 shadow-[0_-10px_30px_-14px_rgba(45,55,72,0.45)]">
              <div className="flex items-center justify-between gap-4 px-1 pb-3">
                <p className="flex items-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text">
                  <span aria-hidden className="block w-4 text-primary">
                    <AboutIcon size={16} />
                  </span>
                  About
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-1 flex size-11 items-center justify-center rounded-pill text-text transition-colors duration-300 ease-soft hover:bg-text/5"
                  aria-label="Close About"
                >
                  <span aria-hidden className="relative block size-3.5">
                    <span className="absolute inset-x-0 top-1/2 block h-[1.6px] -translate-y-1/2 rotate-45 rounded-full bg-current" />
                    <span className="absolute inset-x-0 top-1/2 block h-[1.6px] -translate-y-1/2 -rotate-45 rounded-full bg-current" />
                  </span>
                </button>
              </div>

              {/*
                FOUR ROWS OF TEXT, one column on a phone and two from `sm`.

                It was a two-by-two of painted blots, each a 4:3 card with a
                22px icon over the name and no line under it — 173x130 at 390
                and 362x272 at 768, so the sheet was mostly paint. The rows
                are the desktop door's anatomy instead: the name, its line,
                an arrow — the sheet's own heading still says About, so the
                first row takes the door's full name. Measured at 390: each
                row is 358x70, well over the 44px a finger needs, and the
                whole row is the link.

                `bg-surface` on the cream sheet is the desktop's quiet door on
                the desktop's cream card, and Light Sage on press and hover is
                the same rule <MenuRailRow> keeps: the one field that is
                unmistakably not the panel. The line is Charcoal at 80% —
                the desktop door's value too, since both made the same move
                for the same measured reason: 70% is 4.58:1 on the near-white
                but about 4.2:1 on Light Sage, so the line dropped under the
                4.5 a 14px line owes the moment a finger was on it. 80%
                measures 6.09:1 at rest and 5.38:1 on the sage, at 390.
              */}
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
                {items.map((item) => {
                  /* The desktop door's name and line where there is one —
                     "About the Maison", not a second "About" under the
                     sheet's own "About" heading — and the nav label where
                     there is not, so a page added to MAIN_NAV still shows. */
                  const door = ABOUT_DOORS.find((d) => d.href === item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-4 rounded-[0.9rem] bg-surface px-5 py-3 text-text",
                          "transition-colors duration-300 ease-soft hover:bg-sage active:bg-sage",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-h4 font-medium">{door?.name ?? item.label}</span>
                          {door ? (
                            <span className="mt-0.5 block text-fine text-text/80">{door.sub}</span>
                          ) : null}
                        </span>
                        <span
                          aria-hidden
                          className="shrink-0 text-lead leading-none transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                        >
                          &#8594;
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
