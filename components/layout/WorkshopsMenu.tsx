"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { NavLabel } from "@/components/layout/NavLabel";
import { cn } from "@/lib/utils";
import type { Discipline } from "@/types";

interface WorkshopsMenuProps {
  label: string;
  href: string;
  disciplines: Discipline[];
  isActive: boolean;
  linkClassName: string;
}

/**
 * The Workshops entry, which opens onto the studio's four creative strands.
 *
 * The point of it is discovery, not navigation. "Workshops" on its own asks a
 * visitor to take it on faith that there is something for them behind the
 * word; four photographs and four short lines answer that before they have
 * clicked anything, which is the whole job the header was failing at.
 *
 * It is not a mega-menu. There are no prices, no dates, no counts and no
 * columns of links — four doors with a picture each, and one line out to the
 * full listing. The strands come from {@link Discipline}, the same data the
 * homepage section reads, so the menu cannot drift from the page.
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
 */
export function WorkshopsMenu({
  label,
  href,
  disciplines,
  isActive,
  linkClassName,
}: WorkshopsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const region = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const openNow = useCallback(() => {
    cancelClose();
    setIsOpen(true);
  }, [cancelClose]);

  const closeSoon = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setIsOpen(false), 220);
  }, [cancelClose]);

  const closeNow = useCallback(() => {
    cancelClose();
    setIsOpen(false);
  }, [cancelClose]);

  // A pending close must not outlive the component, or it fires against an
  // unmounted tree on the way to another page.
  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeNow();
      trigger.current?.focus();
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
      onFocus={openNow}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => (isOpen ? closeNow() : openNow())}
        className={cn(linkClassName, "cursor-pointer")}
      >
        {/*
          The rule is drawn while the menu is open as well as on the current
          page. Opening a menu is the same gesture as hovering the link it
          hangs off, and leaving the trigger unmarked while its own panel is
          down reads as the panel belonging to nothing.
        */}
        <NavLabel isActive={isActive || isOpen}>{label}</NavLabel>
      </button>

      {/*
        Full-bleed rather than a floating card. A panel hanging under one word
        would be a component sitting on the page; a field that runs the width
        of the screen reads as the page opening up, which is the register the
        rest of the site is in. Hidden from the tree when closed so its links
        stay out of the tab order.
      */}
      <div
        id={menuId}
        hidden={!isOpen}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        className="absolute inset-x-0 top-full border-t border-white/10 bg-nav"
      >
        <div className="mx-auto w-full px-gutter py-12 lg:py-14">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-10">
            {disciplines.map((strand) => (
              <li key={strand.slug}>
                <Link
                  href={strand.href}
                  className="group block"
                  onClick={closeNow}
                >
                  <div className="relative aspect-[5/4] w-full overflow-hidden bg-white/5">
                    <Image
                      src={strand.image.src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 22vw, 44vw"
                      className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.04]"
                    />
                  </div>

                  {/*
                    White throughout, hover included — see the note on
                    NAV_LINK in <HeaderBar> for why the colour change was
                    dropped: sage measured 3.84:1 during the bar's stretch on
                    Deep Lilac, under the 4.5:1 running text owes at this
                    size — and the image beneath already carries its own
                    hover cue (a slow scale, set on the figure above).
                  */}
                  <p className="mt-4 text-sm font-medium uppercase tracking-eyebrow text-white transition-colors duration-300 ease-soft">
                    {strand.name}
                  </p>
                  {/*
                    /95, not the /70 this was first written at. /70 was
                    measured against Ink, this bar's ground both before and
                    after — 5.9:1, clear of the 4.5:1 this size owes — but for
                    the stretch the ground moved to Deep Lilac, /70 measured
                    only 3.37:1 there, and /95 (4.76:1) was the fix. Left at
                    /95 on the way back rather than restored to /70: it costs
                    nothing against Ink either, and a description this small
                    is worth the extra margin regardless of which ground ends
                    up live next.
                  */}
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-white/95">
                    {strand.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/*
            The way through to everything. Last, because the strands are the
            answer to "what could I do here" and this is the answer to "show
            me all of it" — which is the smaller question at this moment.
          */}
          <Link
            href={href}
            onClick={closeNow}
            className="group mt-12 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-white"
          >
            <span className="border-b border-sage/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-sage">
              See every upcoming event
            </span>
            <span
              aria-hidden
              className="text-sage transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
            >
              &#8594;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
