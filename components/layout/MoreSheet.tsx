"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Heart, Images, Mail, Sparkles, type LucideIcon } from "lucide-react";

import { MoreIcon } from "@/components/layout/bottomNavIcons";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

/**
 * ==========================================================================
 * THE MORE SHEET — the pages you go to once, on cards rather than in a list
 * ==========================================================================
 *
 * WHAT IS IN IT AND WHY. Everything `mobileSurface: "sheet"` marks in
 * MAIN_NAV: About, Private events, Contact. They are the destinations a
 * visitor reaches for once, where the bar's four slots are for the ones they
 * reach for mid-task. Nothing here also appears in the bar or the slide-out
 * menu — see the note on the field.
 *
 * NOT A LIST OF LINKS, at the client's ask. Each entry is a card on its own
 * paint, with its own blob radius and its own ink, so the sheet reads as
 * three objects set down rather than as a menu that opened. The colours are
 * the site's own rotation on a cream ground — lilac, terracotta, lavender —
 * which is the same sequence PAINTS_ON_CREAM hands out everywhere else.
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
 * sheet when it opens and returns to the More button when it shuts — that
 * button owns `aria-expanded`, so the state is said as well as drawn.
 */
export function MoreSheet({
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
    and 768: `document.activeElement` was the bar's "More" button before
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
            id="bottom-nav-more"
            role="group"
            aria-label="More of the Maison"
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
                <p className="flex items-center gap-2.5 text-label font-semibold uppercase tracking-eyebrow text-text">
                  <span aria-hidden className="block w-4 text-primary">
                    <MoreIcon size={16} />
                  </span>
                  More
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-1 flex size-11 items-center justify-center rounded-pill text-text transition-colors duration-300 ease-soft hover:bg-text/5"
                  aria-label="Close more"
                >
                  <span aria-hidden className="relative block size-3.5">
                    <span className="absolute inset-x-0 top-1/2 block h-[1.6px] -translate-y-1/2 rotate-45 rounded-full bg-current" />
                    <span className="absolute inset-x-0 top-1/2 block h-[1.6px] -translate-y-1/2 -rotate-45 rounded-full bg-current" />
                  </span>
                </button>
              </div>

              {/*
                FOUR BLOTS IN A TWO-BY-TWO, not four bars in a column. Stacked
                full width, the blob radii could only ever resolve into
                ellipses — a 330x60 box has no room to be anything else, and
                the client's note was that they looked wrong. At roughly 4:3
                a thrown shape has somewhere to go, so each card carries a
                hand-drawn blot behind it: four different outlines, none of
                them symmetrical, drawn at the proportion they are used at so
                nothing is stretched into shape.
              */}
              <ul className="grid grid-cols-2 gap-3">
                {items.map((item, i) => {
                  const paint = PAINTS[i % PAINTS.length];
                  const Icon = ICONS[item.href] ?? Sparkles;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          /*
                            `isolate` IS LOAD-BEARING. The blot below is
                            `-z-10`, and without a stacking context here that
                            -10 escapes to the nearest ancestor that has one —
                            which is the sheet — and the paint lands BEHIND the
                            cream panel instead of behind the label. Measured:
                            four cards with icons and words and no colour at
                            all. Same trap <BottomNav>'s own note describes.
                          */
                          "group/card relative isolate flex aspect-[4/3] flex-col items-center justify-center gap-2 px-3 text-center",
                          "transition-transform duration-300 ease-editorial motion-reduce:transition-none",
                          "active:scale-[0.97] motion-safe:hover:scale-[1.02]",
                          paint.ink,
                        )}
                      >
                        {/* The blot. `preserveAspectRatio="none"` only ever
                            has to make up the few per cent between the card's
                            real box and the 160x120 it was drawn in. */}
                        <svg
                          aria-hidden
                          viewBox="0 0 160 120"
                          preserveAspectRatio="none"
                          className="absolute inset-0 -z-10 size-full"
                        >
                          <path d={BLOTS[i % BLOTS.length]} className={paint.fill} />
                        </svg>

                        <Icon aria-hidden size={22} strokeWidth={1.8} className="shrink-0" />
                        {/* 19px semibold: on terracotta, Charcoal is 3.84:1,
                            which is what large text owes. The other three
                            clear 4.5 at any size — see PAINTS. */}
                        <span className="text-[1.1875rem] font-semibold leading-tight">
                          {item.label}
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

/*
  THE SITE'S OWN ROTATION ON CREAM — lilac, terracotta, lavender — with Light
  Sage joining it for the fourth card. The inks are measured, not picked:

    Deep Lilac + on-primary ....... 4.90:1   over 4.5 at any size
    Warm Terracotta + Charcoal .... 3.84:1   over 3.0, which is what the
                                             19px semibold label owes as
                                             large text. White Rock there
                                             would have been 2.44.
    Soft Lavender + Charcoal ...... 6.49:1
    Light Sage + Charcoal ......... 9.07:1
*/
const PAINTS = [
  { fill: "fill-primary", ink: "text-on-primary" },
  { fill: "fill-terracotta", ink: "text-text" },
  { fill: "fill-lavender", ink: "text-text" },
  { fill: "fill-sage", ink: "text-text" },
] as const;

/*
  FOUR BLOTS, DRAWN AT 160x120 — the proportion the cards actually are, so the
  shape is never stretched into existence. Each is one closed path with its
  lumps in different places and no mirror symmetry anywhere; they are paint
  thrown down, not rounded rectangles.
*/
const BLOTS = [
  "M9 52 C 6 30 22 12 46 9 C 72 6 104 4 128 11 C 150 17 156 38 153 60 C 150 84 140 112 114 116 C 86 120 50 115 28 106 C 10 99 12 72 9 52 Z",
  "M12 44 C 14 22 34 8 58 10 C 84 12 110 6 132 14 C 154 22 155 46 150 67 C 145 90 148 113 120 117 C 92 121 56 114 32 104 C 12 96 10 64 12 44 Z",
  "M8 62 C 5 38 26 16 50 12 C 78 7 108 11 130 8 C 152 5 157 32 152 55 C 147 79 144 108 118 115 C 90 122 54 118 30 108 C 10 100 11 82 8 62 Z",
  "M14 48 C 10 26 30 9 54 11 C 80 13 112 9 134 18 C 155 27 153 50 148 70 C 143 92 136 114 110 117 C 84 120 48 112 27 101 C 9 92 17 69 14 48 Z",
] as const;

/*
  A small modern mark per destination. Lucide, not the drawn set: these are
  cards with room, where a 22px machine-cut glyph sits cleanly on paint — the
  drawn hand is for the bar, where the icon IS the item.
*/
const ICONS: Record<string, LucideIcon> = {
  "/private-events": Sparkles,
  "/gallery": Images,
  "/about": Heart,
  "/contact": Mail,
};
