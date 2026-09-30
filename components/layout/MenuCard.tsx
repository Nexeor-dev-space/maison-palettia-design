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
  fill = false,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  /**
   * Spread the rows down the whole column rather than letting them stop
   * wherever they end.
   *
   * The three columns of a mega-menu are a grid row, so they are already
   * exactly as tall as each other — what is not equal is where each one's
   * CONTENT stops, and the client's note is about the ragged foot that
   * leaves. A rail of fixed-height rows is the column that ends short: it
   * cannot grow, so the slack collects under the last row. With this the
   * slack is divided between the rows instead, a few pixels each, and the
   * last row lands on the same line as the card beside it.
   *
   * Off by default: it is only right where a column is one of several that
   * have to agree. A rail on its own should keep its rows together.
   */
  fill?: boolean;
}) {
  return (
    <div className={fill ? "flex min-h-0 flex-1 flex-col" : undefined}>
      {/*
        THE NOTE IS OPTIONAL, AND THE EXPERIENCES MENU NO LONGER PASSES ONE.

        Its two groups carried a title and a sentence under it — "Walk-in" over
        "No booking — come in any time." The client has replaced both with a
        single line that names the group twice, mechanism first and invitation
        second: "Walk-in — Create Anytime". The sentence is gone with the
        change, which is what they asked for; the mechanism it explained is
        still the first half of the title.

        It stays a prop because the Private events menu has one group and a
        real sentence under it, and that menu was not part of the note.
      */}
      <p className="px-3 text-label font-semibold uppercase tracking-eyebrow text-text/55">{title}</p>
      {note ? <p className="mt-1.5 px-3 text-fine leading-[1.5] text-text/60">{note}</p> : null}
      <ul className={cn("mt-2 flex flex-col", fill && "flex-1 justify-between")}>{children}</ul>
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
          /*
            LIGHT SAGE ON HOVER, NOT A VEIL OF THE PANEL'S OWN NEAR-WHITE.
            The row under the pointer showed `surface` — the same near-white
            the panel is cut from — and the client's note was that a hovered
            card "becomes the megamenu's bg colour". Light Sage (#D1E7BE) is
            the brand's own hover and the one field that is unmistakably not
            the panel; Charcoal on it is 9.07:1.

            THE ACTIVE ROW IS THE HOVERED ROW, so the active ground has to be
            the hover colour or the hover colour never shows: `onPointerEnter`
            makes a row active the moment the pointer arrives, and the
            `hover:` rule would only ever paint the frame between the two. So
            both states are Light Sage. Keyboard focus activates the same way
            and gets the same field. The `hover:` is kept for the pointer that
            crosses a row faster than React re-renders it.
          */
          active ? "bg-sage" : "hover:bg-sage",
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
              /* Charcoal in both states. The active name was Deep Lilac on
                 the near-white; on Light Sage that pairing is 3.9:1, under the
                 4.5:1 a 16px name owes. The arrow below keeps the lilac and
                 says which row is chosen — it is decorative and owes none. */
              "block truncate text-body font-medium leading-snug text-text transition-colors duration-300 ease-soft",
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
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-surface p-3 transition-colors duration-300 ease-soft hover:bg-sage"
    >
      {/*
        ==================================================================
        THE PICTURE TAKES WHAT IS LEFT, IT DOES NOT SET THE HEIGHT
        ==================================================================

        This was `aspect-[16/9]`, which meant the image's height was its
        column's width — 318px across five columns of a 1400px card — and the
        preview was therefore the tallest thing in the row whatever the rail
        beside it contained. In the Experiences menu that is harmless: seven
        rows and two group headings come to 596px and the rail wins anyway.
        In Private events it is the whole fault the client marked: three rows
        end 260px above the card's floor, and every one of those pixels
        belongs to a picture insisting on a shape.

        `flex-1` inside the preview's own column makes it the opposite — it
        takes whatever height the row has left after the type, so the rail
        decides and the image fits itself to the answer. The two bounds are
        what keep that from going silly in either direction: it never falls
        below 7rem, where a photograph stops being one, and it is the ONLY
        thing in the preview that grows — see the note on the type below it.
      */}
      {/*
        THE FLOOR IS 9REM, NOT 7, AND THAT IS A MEASUREMENT.

        The picture takes whatever height the row has left, which in this menu
        is not much: measured at 1440, the rail set the row and the frame came
        out 427x112 — 3.81:1 — against private-event photographs that are
        324x432, or 0.75:1. `object-cover` on that pair keeps about a fifth of
        the picture's height, which is the band the client saw and called
        "expanded and not visible properly".

        Narrowing the card helped and did not fix it, because the fault was the
        HEIGHT. 9rem takes the frame to roughly 2.4:1, which is the shallowest
        a portrait subject survives, and it costs the panel about 32px — the
        preview then sets the row and the rail's two doors share the extra
        between them, which is what `grid-rows-2` is there for.
      */}
      <span className="relative block min-h-[9rem] w-full flex-1 overflow-hidden rounded-[1rem] bg-surface-alt">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            /* The preview is four of twelve columns now, not five. */
            sizes="(min-width: 1024px) 30vw, 90vw"
            style={{ objectPosition: image.position ?? "50% 50%" }}
            className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.04]"
          />
        ) : null}
      </span>

      {/*
        AND THE TYPE IS ITS OWN HEIGHT, WHICH IS THE OTHER HALF OF IT. This
        carried `flex-1` too, so the picture and the words split the column's
        spare height between them — and because the action is pinned to the
        foot of this block with `mt-auto`, the words' half opened as a gap
        under the description: 160px of it in the Experiences menu, which is
        the same fault the client marked on the panel as a whole, one box in.
        Left at its natural height it takes what it needs, the action closes
        up under the description, and every pixel of slack goes to the one
        element that can use it.
      */}
      <span className="flex flex-col px-2 pb-1 pt-4">
        {eyebrow ? (
          <span className="flex items-center gap-3 text-label font-semibold uppercase tracking-eyebrow text-text/60">
            <span aria-hidden className="h-px w-5 shrink-0 bg-terracotta" />
            {eyebrow}
          </span>
        ) : null}

        <span className="mt-3 block text-h3 font-light tracking-[-0.02em] text-text">
          {name}
        </span>

        {/*
            CHARCOAL AT FULL STRENGTH, AND UP A SIZE. The client marked this
            line: "for the descriptions use #2D3748" — which is `--color-text`,
            the brand's Charcoal Slate — and "the font size of that
            descriptions are very small". It was 13px at 75% of that ink, which
            on White Rock measures about 7:1 and still reads as a caption
            rather than as the sentence that tells you what the activity is.

            Full-strength `text-text` IS #2D3748, and `text-body` is the same
            size the rest of the site sets a sentence at. The measure comes in
            to 30ch with it, so the block stays three lines at most and the
            preview's height does not move.
        */}
        {description ? (
          <span className="mt-2.5 block max-w-[30ch] text-body leading-[1.6] text-text">
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
 * A door out of the menu: to the whole programme, or to the dates.
 *
 * ==========================================================================
 * IT WAS TWO LARGE CARDS AND IT IS NOW A ROW
 * ==========================================================================
 *
 * These were two tiles stacked in a column of their own, each as tall as half
 * the preview beside them — about 290px apiece — carrying a word, a sentence
 * and an arrow, with a brand cut-out drawn big in the corner to fill what was
 * otherwise empty. The client's note is exactly that: "A good CTA, but i don't
 * think it needs to be this big, This doesnt feel necessarily needed."
 *
 * Both halves of that are answered rather than one. NOT THIS BIG: a door is
 * now a single row about 60px tall, so the pair costs roughly a fifth of the
 * height the column did. NOT NECESSARILY NEEDED: they no longer take a column
 * at all. The third of the card they were holding goes to the preview, which
 * is the thing that makes the menu worth opening — the picture gets bigger
 * and the two doors drop to a quiet strip along the foot, which is where a
 * "see everything" link belongs.
 *
 * THE CUT-OUT SHRINKS WITH THEM. It was a decorative fill for a large empty
 * field; at this height there is no empty field, so it sits at the head of the
 * row at 28px, in the tile's own colour family, doing the job a mark does on
 * the deck — marking the line rather than filling the space. Still decorative
 * and `aria-hidden`, so it owes no contrast ratio.
 *
 * The accent tone is kept for the second door. One of the two is the studio's
 * bookable dates and it should still read as the warmer of the pair; at this
 * size Deep Lilac is a bar of colour along the foot rather than a slab.
 */
export function MenuDoor({
  href,
  title,
  sub,
  mark,
  tone = "quiet",
  fill = false,
}: {
  href: string;
  title: string;
  sub: string;
  mark?: DoodleName;
  tone?: "quiet" | "accent";
  /**
   * Take whatever height is left under the rows above, instead of sitting at
   * the foot of the column at the door's own height.
   *
   * For the column that carries one door rather than two: without it the
   * single door keeps the height a door wants and the space the second one
   * used to fill becomes a hole in the middle of the column. The content is
   * centred in the box, so a taller door reads as a panel rather than as a
   * stretched button — and `min-h` keeps it a door if the list above ever
   * grows enough to squeeze it.
   */
  fill?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        /*
          THE TYPE IS SIZED FOR THE BOX IT ENDED UP IN. These doors are
          `grid-rows-2` inside the panel, so their height is whatever the rail
          beside them turns out to be — about 170px each — and they were
          carrying a 17px title over a 13px line, which is the size they would
          be at if they were rows in a list. The client's word for the result
          was "empty", and it was a mismatch between the type and the box
          rather than too much padding.

          So the pair steps up one place on the scale: `text-h4` for the title
          (the compact-card step) over `text-body` for the line, which is the
          same pairing every card on the site uses. The mark and the arrow go
          up with them, because a 28px cut-out beside 20px type reads as an
          icon that was left behind.
        */
        "group relative flex items-center gap-4 overflow-hidden rounded-[0.9rem] px-5 py-4",
        "transition-colors duration-300 ease-soft",
        fill && "min-h-[6.5rem] flex-1",
        tone === "accent"
          ? "bg-primary text-on-primary hover:bg-text"
          /* Light Sage, not `surface-alt`: that is White Rock, which is the
             panel's own ground, so the door vanished on hover. Same rule as
             <MenuRailRow>. */
          : "bg-surface text-text hover:bg-sage",
      )}
    >
      {mark ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none w-10 shrink-0 transition-transform duration-[900ms] ease-editorial",
            "motion-safe:group-hover:rotate-6",
            tone === "accent" ? "opacity-70" : "opacity-55",
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

      <span className="min-w-0 flex-1">
        <span className="block text-h4 font-medium">{title}</span>
        <span
          className={cn(
            "mt-1 block text-body leading-[1.5]",
            /* FULL STRENGTH ON THE LILAC DOOR. `--color-on-primary` is the one
               light ink that clears 4.5:1 on Deep Lilac, and it clears it at
               4.90 — there is no headroom to spend on an alpha. At /80 this
               line measured under the bar at 13px and would still be under it
               at 17px, since 17px is not large text. The quiet door keeps its
               /70, which is charcoal on a near-white and has room to spare. */
            tone === "accent" ? "text-on-primary" : "text-text/70",
          )}
        >
          {sub}
        </span>
      </span>

      <span
        aria-hidden
        className="shrink-0 text-lead leading-none transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}
