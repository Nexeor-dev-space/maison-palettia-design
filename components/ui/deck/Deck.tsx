import type { ReactNode } from "react";

import { DoodleMark } from "@/components/ui/DoodleMark";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { cn } from "@/lib/utils";

/**
 * ==========================================================================
 * THE BRAND DECK'S OWN DESIGN SYSTEM, AS COMPONENTS
 * ==========================================================================
 *
 * The client's note was that the deck's pages are beautifully put together and
 * the site's sections were not built to match. Reading the fourteen pages of
 * "Maison Palettia — General" side by side, the system is small, strict and
 * repeated on every single page:
 *
 *   ONE GROUND.      Light Sage, every page, with no alternation at all. The
 *                    deck never changes its paper. Colour arrives as objects
 *                    laid on the paper, never as a new background.
 *   THE BINDING.     A spiral coil down the left edge of every spread. It is
 *                    the one device that says "creative journal" before a
 *                    single word is read, and the site had nothing like it.
 *   HEADING PILLS.   Every heading sits in a Soft Lavender lozenge with a
 *                    charcoal outline, set in white condensed uppercase.
 *                    Eleven of them across the deck; it is the signature.
 *   OUTLINED BOXES.  Statements and photographs alike sit in rounded
 *                    rectangles with the same charcoal outline. The outline is
 *                    what makes the page read as cut paper laid down rather
 *                    than as ink printed on it.
 *                    THE SITE NO LONGER DRAWS IT. At 2.5px it was the loudest
 *                    mark in every section it appeared in, and the client
 *                    asked for it gone. `plate` in globals.css says the same
 *                    thing — an object set down on the paper — with a tenth
 *                    of the ink; the note there has the measurement that
 *                    stopped it simply being deleted.
 *   DOODLES ON TOP.  Cut-outs overlap the corners of plates and pills, often
 *                    on a White Rock backing square, and they always break an
 *                    edge — a doodle floating in clear space does not appear
 *                    anywhere in the deck.
 *   THE TAG.         A small lavender pill reading MAISON PALETTIA, bottom
 *                    right, on every page. THE SITE DOES NOT CARRY IT. A page
 *                    tag is how a reader keeps their place in a document they
 *                    are holding; a website says whose it is in the bar at the
 *                    top of every screen, so on here it was the same three
 *                    words repeated down the page with nothing to do.
 *
 * These components are that system and nothing else. Sections compose
 * them; no section re-invents an outline, a radius or a pill of its own.
 */

/* The deck's radius, in one place so nothing drifts. Its outline used to live
   here beside it; see OUTLINED BOXES above for where it went. */
const RADIUS = "rounded-[1.25rem]";

/**
 * A heading in the deck's lavender lozenge.
 *
 * `as` because a page has one h1 and many h2s and the pill is used for both;
 * the look must never decide the outline of the document.
 */
export function DeckPill({
  children,
  as: Tag = "h2",
  id,
  tone = "lavender",
  size = "section",
  className,
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "p";
  id?: string;
  /** Lavender is the deck's own. Lilac is for a pill on a sage-on-sage panel. */
  tone?: "lavender" | "lilac" | "cream";
  size?: "section" | "compact" | "hero";
  className?: string;
}) {
  const tones = {
    lavender: "bg-lavender text-white",
    lilac: "bg-primary text-white",
    cream: "bg-cream text-text",
  } as const;

  const sizes = {
    hero: "px-[0.7em] py-[0.24em] text-[clamp(2.25rem,1.1rem+5vw,4.5rem)]",
    section: "px-[0.7em] py-[0.26em] text-[clamp(1.75rem,1rem+3.4vw,3.25rem)]",
    compact: "px-[0.75em] py-[0.3em] text-[clamp(1.25rem,0.9rem+1.7vw,2rem)]",
  } as const;

  return (
    <Tag
      id={id}
      className={cn(
        /*
          `font-deck` is the condensed grotesque; the deck sets it in caps with
          a little negative tracking and a line box tight enough that a
          two-line heading still reads as one block. `leading-[0.92]` is
          measured off the deck's own two-line pills (CREATING COMMUNITY /
          THROUGH CREATIVITY, WORKSHOP / JOURNEY).
        */
        // `font-synthesis: none` so a missing weight is never faked. Bold is
        // real here: Montserrat ships 700 and lib/fonts.ts loads it. It reads
        // as emphasis the way the condensed face this replaced did by being
        // narrow — see the note there.
        "inline-block max-w-full font-bold uppercase leading-[1] tracking-[0.012em] [font-synthesis:none]",
        "[font-family:var(--font-deck)]",
        // It cannot go unedged: the default tone is Soft Lavender and the
        // sheet under it is Light Sage, which is 1.40:1. `plate` is the site's
        // soft edge — see globals.css.
        "plate",
        RADIUS,
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * A rounded box set down on the paper — the deck's container for a statement, a
 * list or a column of copy. Sage by default, because the deck's boxes are the
 * paper showing through the edge rather than a new colour.
 */
export function DeckPanel({
  children,
  tone = "paper",
  className,
}: {
  children: ReactNode;
  tone?: "paper" | "cream" | "lavender" | "lilac";
  className?: string;
}) {
  const tones = {
    paper: "bg-sage text-text",
    cream: "bg-cream text-text",
    lavender: "bg-lavender text-text",
    lilac: "bg-primary text-surface",
  } as const;

  return (
    <div className={cn("plate", RADIUS, tones[tone], "px-6 py-6 md:px-9 md:py-8", className)}>
      {children}
    </div>
  );
}

/**
 * A photograph, laid down the way the deck lays one: rounded, edged, and with
 * a cut-out breaking one corner.
 *
 * `mark` is optional and deliberately singular. In the deck a plate carries at
 * most one doodle, and it always overlaps the edge — the backing square behind
 * it is White Rock, which is what stops a purple cut-out disappearing into a
 * dark photograph.
 *
 * That backing is also why the mark's colour must never be White Rock: pale on
 * pale is an invisible doodle and an empty-looking square, which is exactly
 * how it rendered the first time. Lilac, lavender, terracotta or charcoal.
 */
export function DeckPlate({
  children,
  mark,
  markAt = "top-right",
  className,
}: {
  children: ReactNode;
  mark?: { name: DoodleName; color: string };
  markAt?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}) {
  const corners = {
    "top-right": "-right-5 -top-5 md:-right-7 md:-top-7",
    "top-left": "-left-5 -top-5 md:-left-7 md:-top-7",
    "bottom-right": "-bottom-5 -right-5 md:-bottom-7 md:-right-7",
    "bottom-left": "-bottom-5 -left-5 md:-bottom-7 md:-left-7",
  } as const;

  return (
    <div className={cn("relative", className)}>
      <div className={cn("plate relative overflow-hidden bg-cream", RADIUS)}>{children}</div>
      {mark ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-10 grid size-16 place-items-center rounded-[0.35rem] bg-cream p-2.5 md:size-20 md:p-3",
            "rotate-[-8deg]",
            corners[markAt],
          )}
        >
          <DoodleMark name={mark.name} color={mark.color} treatment="stamp" />
        </span>
      ) : null}
    </div>
  );
}

/**
 * The spiral binding down the left edge.
 *
 * One SVG with a repeating pattern rather than a column of elements: the coil
 * has to run the whole height of a section whatever that turns out to be, and
 * a pattern does that without React knowing the height or anything measuring
 * it. Each ring is the deck's own — a charcoal loop with White Rock inside it,
 * seen edge-on.
 *
 * Decorative, so `aria-hidden`; and hidden below `md`, where a 28px margin
 * spent on a binding is 28px not spent on the words.
 */
export function SpiralEdge({ className }: { className?: string }) {
  /*
    A TILED BACKGROUND, NOT A STRETCHED SVG. The first version was one SVG with
    `preserveAspectRatio="none"` and a pattern inside it, which meant the rings
    scaled with the section: on a 938px sheet each coil came out the height of
    a fist and swallowed the photograph beside it. A repeating background has
    no such problem — the tile is 36x44 device pixels whatever the sheet does,
    so a short section and a long one show the same binding.

    The colours are literal because a data URI cannot read a CSS custom
    property. They are Charcoal Slate and White Rock, from the palette.
  */
  const tile =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44">' +
        '<rect x="2" y="6" width="31" height="31" rx="15.5" fill="#2D3748"/>' +
        '<rect x="10" y="13" width="24" height="17" rx="8.5" fill="#EFE2CA"/>' +
        "</svg>",
    );

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 hidden w-9 md:block",
        className,
      )}
      style={{
        backgroundImage: `url("${tile}")`,
        backgroundRepeat: "repeat-y",
        backgroundPosition: "left top",
        backgroundSize: "36px 44px",
      }}
    />
  );
}

/**
 * A deck page: the sage ground, the binding, and room for the tag.
 *
 * Every section below the banner is one of these, which is the whole point —
 * the deck does not alternate grounds and neither should the page. What varies
 * between sections is what is laid on the paper, never the paper.
 */
export function DeckSheet({
  children,
  id,
  labelledBy,
  binding = false,
  className,
}: {
  children: ReactNode;
  id?: string;
  labelledBy?: string;
  /*
    THE BINDING IS AN ACCENT, NOT A FRAME. Putting the coil on every section
    is what turned the page into a reproduction of the PDF rather than a site
    built from it — fourteen identical bound pages in a row is a document, and
    a visitor scrolling a website should not feel they are turning leaves. It
    is off by default and switched on for the two or three sheets where the
    journal idea is the point.
  */
  binding?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative isolate overflow-hidden bg-sage",
        "py-[4.5rem] md:py-[6rem] lg:py-[7rem]",
        binding ? "md:pl-10 lg:pl-12" : null,
        className,
      )}
    >
      {binding ? <SpiralEdge /> : null}
      {children}
    </section>
  );
}
