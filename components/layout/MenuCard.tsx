"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

/**
 * ==========================================================================
 * THE SHAPE EVERY MENU THAT DROPS OUT OF THE BAR NOW TAKES
 * ==========================================================================
 *
 * The panels used to be full-bleed fields: a sheet the width of the screen,
 * torn along its foot, carrying three columns of rows. The argument was that a
 * field reads as the page opening up rather than as a component sitting on it.
 * It is a good argument and the client has overruled it, with references —
 * every one of them the same object: a FLOATING CARD, rounded, inset from the
 * edges, with a rail of choices down one side and a preview of the chosen one
 * filling the rest.
 *
 * That shape is better here for a reason the full-bleed version could not fix.
 * A field the width of a 1440 screen holding seven short rows has to spread
 * them, so the eye crosses 1400px to read 300px of content and the panel is
 * mostly air. A card is as wide as its contents deserve, and the space it
 * gives back goes to the thing the old panel had no room for at all: a
 * picture of what you are about to choose, at a size worth looking at.
 *
 * WHAT IS SHARED AND WHY. Three menus hang off this bar and they are one
 * object in three states, not three designs — so the card, the rail row and
 * the preview live here once. A menu supplies what goes in them and nothing
 * about how they are drawn.
 *
 * THE BEHAVIOUR IS NOT HERE. Opening, the grace period, Escape, the closed
 * panel staying out of the tab order — all of that is `useMenuDisclosure`,
 * unchanged. This file is the look.
 */

/**
 * The card itself.
 *
 * POSITIONED AGAINST THE HEADER, NOT THE TRIGGER. Each menu region is
 * `static`, so an absolutely positioned child resolves against the <header> —
 * which is the full width of the screen and is what lets the card centre on
 * the page rather than hang off whichever word opened it.
 *
 * `translate` AND `scale` AS INDIVIDUAL PROPERTIES, which is what Tailwind v4
 * writes and what makes this animate at all: a transition naming `transform`
 * animates nothing here. The card rises 6px and settles from 98.5% — small
 * enough to read as arriving rather than as zooming, which the reference
 * cards all do and which a menu that opens twenty times a session needs.
 */
export function MenuCard({
  id,
  open,
  shown,
  onMouseEnter,
  onMouseLeave,
  width = "wide",
  children,
}: {
  id: string;
  open: boolean;
  /** One frame behind `open` — the flag the transition runs off. */
  shown: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** `wide` for the two rail menus; `narrow` for search. */
  width?: "wide" | "narrow";
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      inert={!open}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "absolute left-1/2 top-[calc(100%+0.5rem)] z-40 -translate-x-1/2",
        "w-[calc(100vw-2*var(--spacing-gutter))]",
        /*
          ==============================================================
          THE WIDE CARD HAS NO CEILING, AND THAT IS A BUG FIX AS MUCH AS
          A LOOK
          ==============================================================

          It was capped at 72rem and centred. On a 1440 screen that put its
          left edge at x=144 while the word that opens it — "Experiences" —
          sits at x=24, so the card did not begin until 120px to the RIGHT of
          its own trigger. A visitor moving straight down from the word to the
          rail therefore crossed page, not menu: the pointer left the region,
          the 220ms grace in `useMenuDisclosure` ran out, and the panel closed
          under a hand that was aiming at it. The only way in was a diagonal
          nobody should have to find.

          Full width less the gutter puts the card's left edge on the same
          line as the first word of the bar, so straight down is into the
          menu. The client asked for the width; the width is also the fix.
        */
        width === "wide" ? null : "max-w-[40rem]",
        /*
          WHITE ROCK, AND THE VEIL RATHER THAN A BORDER. The card has to read
          as laid on the page over every ground the bar can be sitting on —
          Light Sage, White Rock, a photograph — and the site's answer to that
          is `plate`: a hairline of Charcoal at a tenth plus a soft veil. An
          outline heavy enough to work on all three would be the loudest thing
          on the screen, which is the note the client already gave about hard
          strokes.
        */
        "plate rounded-[1.75rem] bg-cream p-2.5 md:p-3",
        /*
          AND A BRIDGE ACROSS THE GAP. The card hangs 0.5rem below the bar, and
          that strip belongs to the header — a pointer crossing it is over
          neither the trigger nor the panel. The grace period exists for
          exactly this and is not quite enough on its own, because a slow hand
          can spend more than 220ms in 8px. A `::before` spanning the gap makes
          those pixels part of the card's own box, so `mouseenter` fires there
          and the close is disarmed before it can be armed. It is transparent
          and takes no space: the card's position is unchanged.
        */
        "before:absolute before:inset-x-0 before:-top-3 before:h-3 before:content-['']",
        "transition-[opacity,translate,scale] ease-soft motion-reduce:transition-none",
        shown
          ? "scale-100 -translate-x-1/2 translate-y-0 opacity-100 duration-[380ms]"
          : "-translate-x-1/2 -translate-y-1.5 scale-[0.985] opacity-0 duration-[200ms]",
        open ? null : "pointer-events-none",
      )}
    >
      {children}
    </div>
  );
}

/** A titled run of rows down the rail. */
export function MenuRailGroup({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="px-3 text-label font-semibold uppercase tracking-eyebrow text-text/55">{title}</p>
      {note ? <p className="mt-1.5 px-3 text-fine leading-[1.5] text-text/60">{note}</p> : null}
      <ul className="mt-2 flex flex-col">{children}</ul>
    </div>
  );
}

/**
 * One choice in the rail.
 *
 * IT IS A LINK AND A POINTER TARGET AT ONCE. Hovering it changes what the
 * preview shows; clicking it goes to that page. Both matter — the preview is
 * what makes the menu worth opening, and a row you can only preview is a
 * dead end for anyone who already knows what they want.
 *
 * `onFocus` mirrors `onPointerEnter` so a keyboard tabbing the rail drives the
 * preview exactly as a pointer does. Without it the panel is a picture of the
 * first item and a list of names for everyone not using a mouse.
 */
export function MenuRailRow({
  href,
  name,
  sub,
  image,
  active,
  onActivate,
}: {
  href: string;
  name: string;
  sub?: string;
  image?: ImageAsset & { position?: string };
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onPointerEnter={onActivate}
        onFocus={onActivate}
        className={cn(
          "group flex items-center gap-3.5 rounded-[0.9rem] px-3 py-2.5",
          "transition-colors duration-[var(--duration-hover)] ease-soft",
          active ? "bg-surface" : "hover:bg-surface/70",
        )}
      >
        <span className="relative size-11 shrink-0 overflow-hidden rounded-[0.65rem] bg-surface-alt">
          {image ? (
            <Image
              src={image.src}
              alt=""
              fill
              sizes="44px"
              style={{ objectPosition: image.position ?? "50% 50%" }}
              className="object-cover"
            />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-body font-medium leading-snug transition-colors duration-300 ease-soft",
              active ? "text-primary" : "text-text",
            )}
          >
            {name}
          </span>
          {sub ? <span className="mt-0.5 block truncate text-fine text-text/65">{sub}</span> : null}
        </span>

        <span
          aria-hidden
          className={cn(
            "shrink-0 text-text/35 transition-all duration-300 ease-soft",
            active ? "translate-x-0 text-primary opacity-100" : "-translate-x-1 opacity-0",
          )}
        >
          &#8594;
        </span>
      </Link>
    </li>
  );
}

/**
 * The right half: what the rail is currently pointing at.
 *
 * THE PICTURE IS THE POINT. It is the one thing the full-bleed panel had no
 * room for and the reason a visitor opens a menu called "Experiences" rather
 * than simply clicking it — "Bedazzling" is a word until you have seen it.
 *
 * `key` on the caller's side is what makes this cross-fade: remounting the
 * block on every change restarts the reveal, so moving down the rail plays as
 * a series of arrivals rather than as an image being swapped in a frame.
 */
export function MenuPreview({
  href,
  eyebrow,
  name,
  description,
  image,
  meta,
  action,
}: {
  href: string;
  eyebrow?: string;
  name: string;
  description?: string;
  image?: ImageAsset & { position?: string };
  /** A status line — a date, a seat count, "Coming soon". */
  meta?: ReactNode;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-surface p-3 transition-colors duration-300 ease-soft hover:bg-surface-alt"
    >
      <span className="relative block aspect-[16/9] w-full overflow-hidden rounded-[1rem] bg-surface-alt">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 38vw, 90vw"
            style={{ objectPosition: image.position ?? "50% 50%" }}
            className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.04]"
          />
        ) : null}
      </span>

      <span className="flex flex-1 flex-col px-2 pb-1 pt-4">
        {eyebrow ? (
          <span className="flex items-center gap-3 text-label font-semibold uppercase tracking-eyebrow text-text/60">
            <span aria-hidden className="h-px w-5 shrink-0 bg-terracotta" />
            {eyebrow}
          </span>
        ) : null}

        <span className="mt-3 block text-[1.375rem] font-light leading-[1.15] tracking-[-0.02em] text-text md:text-[1.5rem]">
          {name}
        </span>

        {description ? (
          <span className="mt-2.5 block max-w-[34ch] text-fine leading-[1.7] text-text/75">
            {description}
          </span>
        ) : null}

        {meta ? <span className="mt-3 block text-fine text-text/70">{meta}</span> : null}

        <span className="mt-auto flex items-center gap-3 pt-5 text-action font-semibold uppercase tracking-eyebrow text-primary">
          <span className="border-b border-primary/40 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-primary">
            {action}
          </span>
          <span
            aria-hidden
            className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
          >
            &#8594;
          </span>
        </span>
      </span>
    </Link>
  );
}

/**
 * The second door — a tile in the card's third column.
 *
 * IT CARRIES A CUT-OUT, AND THAT IS A LAYOUT FIX RATHER THAN DECORATION. The
 * tiles share a column with the preview beside them, so each one is half of
 * whatever height that preview takes — around 290px for two lines of text and
 * an arrow. Left plain they were two large empty rectangles with a word in the
 * corner of each. A brand mark, drawn big and allowed to run off the bottom
 * corner, is what the deck does with exactly this kind of space: the tile
 * reads as a designed field rather than as a card that failed to fill.
 *
 * Decorative and `aria-hidden`, so it owes no contrast ratio — which is why it
 * can sit at a low opacity in the tile's own colour family.
 */
export function MenuTile({
  href,
  title,
  sub,
  mark,
  tone = "quiet",
}: {
  href: string;
  title: string;
  sub: string;
  mark?: DoodleName;
  tone?: "quiet" | "accent";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col justify-between gap-6 overflow-hidden rounded-[1.1rem] p-5",
        "transition-colors duration-300 ease-soft",
        tone === "accent"
          ? "bg-primary text-on-primary hover:bg-text"
          : "bg-surface text-text hover:bg-surface-alt",
      )}
    >
      {mark ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-6 -right-6 w-28 transition-transform duration-[900ms] ease-editorial",
            "motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-6",
            tone === "accent" ? "opacity-30" : "opacity-25",
          )}
        >
          <DoodleMark
            name={mark}
            color={tone === "accent" ? INK.whiteRock : INK.lilac}
            treatment="rise"
            depth={0}
          />
        </span>
      ) : null}

      <span className="relative">
        <span className="block text-body font-medium leading-snug">{title}</span>
        <span
          className={cn(
            "mt-1.5 block max-w-[22ch] text-fine leading-[1.6]",
            tone === "accent" ? "text-on-primary/80" : "text-text/70",
          )}
        >
          {sub}
        </span>
      </span>

      <span
        aria-hidden
        className="relative text-action transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}
