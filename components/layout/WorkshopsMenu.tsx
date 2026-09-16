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
  onOpenChange,
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

  const report = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const openNow = useCallback(() => {
    cancelClose();
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
        rest of the site is in. Hidden from the tree when closed so its links
        stay out of the tab order.
      */}
      <div
        id={menuId}
        hidden={!isOpen}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        /*
          A WHITE FIELD NOW, NOT A CHARCOAL ONE.

          The bar takes the page's own near-white the moment it stops being
          transparent, and a panel that dropped out of it in Charcoal Slate
          read as a second, unrelated surface arriving from somewhere else.
          Same ground as the bar means the two are one object opening, which is
          what a menu hanging off a masthead should be.

          Charcoal on this ground is 11.61:1; the hairline is the bar's own.
        */
        className="absolute inset-x-0 top-full border-t border-text/10 bg-surface"
      >
        <div className="mx-auto w-full px-gutter py-10 lg:py-12">
          <div className="grid grid-cols-12 gap-x-6 gap-y-8 lg:gap-x-10">
            {/*
              The left column says what this is; the plates say what is in it.

              Copy, not links. The heading is the strands section's own —
              "Explore your creative side." — rather than a second sentence
              written for the menu, so the menu and the page it opens onto
              cannot drift apart. The eyebrow is the nav item's own label, so
              it cannot drift either.
            */}
            <div className="col-span-12 flex flex-col lg:col-span-4">
              <p className="text-label font-medium uppercase tracking-eyebrow text-text/70">
                {label}
              </p>
              <p className="mt-4 max-w-[14ch] text-h2 font-light leading-[1.08] tracking-[-0.02em] text-text lg:mt-6">
                Explore your creative side.
              </p>

              {/*
                The way through to everything, held at the foot of the column
                so it sits on the same line as the bottom of the plates at
                `lg` and simply follows the heading on a narrower screen.
              */}
              <Link
                href={href}
                onClick={closeNow}
                className="group mt-8 inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text lg:mt-auto lg:pt-10"
              >
                <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
                  See every upcoming event
                </span>
                <span
                  aria-hidden
                  className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                >
                  &#8594;
                </span>
              </Link>
            </div>

            {/*
              The strands as plates, with their names set on the photograph
              rather than under it. That is the whole difference between this
              and the row of captioned thumbnails it replaces: a tile you read
              inside is a door, where an image with a label beneath it is a
              catalogue entry.
            */}
            <ul className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-8 lg:gap-5">
              {disciplines.map((strand) => (
                <li key={strand.slug}>
                  <Link
                    href={strand.href}
                    onClick={closeNow}
                    className="group relative block aspect-[5/4] overflow-hidden rounded-sm bg-surface-alt sm:aspect-[4/5] lg:aspect-[4/3]"
                  >
                    <Image
                      src={strand.image.src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 92vw"
                      className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.04]"
                    />

                    {/*
                      The type sits on the picture, so the picture has to be
                      made to carry it — and these numbers are measured, not
                      judged.

                      Sampled per tile: the shipped crop composited under each
                      caption's own box, worst pixel. The first pass
                      (88/55/32/72) read 3.79:1 under "Paint" and 2.06:1 under
                      "Create", which is not a near miss — the create plate is
                      a pale photograph and cream type on it was barely there.

                      These stops are the lightest of five candidates that
                      clear the 4.5:1 a 13px description owes on all three
                      plates at once; worst case is 5.35:1, still on "Create".
                      It is a heavy foot by the standards of this site, and the
                      pale plate is the reason.

                      TODO(client): create.jpg is the plate forcing this. It is
                      already flagged in lib/disciplines.ts as off-message — a
                      bought souvenir rather than something made. Replacing it
                      would let this rise come back up.
                    */}
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-text/95 via-text/80 via-42% to-transparent to-85%"
                    />

                    <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5">
                      <p className="text-lead font-medium leading-tight text-on-dark">
                        {strand.name}
                      </p>
                      <p className="mt-1.5 text-fine leading-snug text-on-dark/90">
                        {strand.description}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
