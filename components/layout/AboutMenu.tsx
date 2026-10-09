"use client";

import Link from "next/link";
import { useId } from "react";

import { MenuCard } from "@/components/layout/MenuCard";
import { DoodleMark } from "@/components/ui/DoodleMark";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { INK } from "@/components/sections/hero/composition";
import { NavLabel } from "@/components/layout/NavLabel";
import { useMenuDisclosure } from "@/components/layout/useMenuDisclosure";
import { cn } from "@/lib/utils";

/*
  ==========================================================================
  FOUR DOORS, EACH ONE CARRYING A CUT-OUT RATHER THAN A PHOTOGRAPH
  ==========================================================================

  At the client's ask: the pictures are out and the brand's own marks are in.

  THE PHOTOGRAPHS WERE THE PROBLEM, AND THE FILE SAID SO BEFORE THEY WENT.
  Four frames sat here from 2026-10-06, and three of the four showed
  something other than what the door above them said:

    gallery.jpg ... somebody photographing through a gilt frame in an ART
                    gallery. A pun on the word rather than the Maison's own
                    gallery of finished work: nothing in it was made here.
    contact.jpg ... a FLORIST at a counter, on the phone beside a vase of
                    roses with a calculator under their hand. Nothing in it
                    is a creative studio.
    location.jpg .. a mall interior that is NOT Times Square Center. The
                    signage is Chinese and the storefronts are other
                    retailers' — Petit Bateau, MCS, Marisfrolg, Toys'R'Us.
                    It sat behind the one door whose words are an address
                    question, "Where to find us", so a generic mall there
                    read as the Maison's mall.

  A cut-out claims nothing. It is the studio's own drawing, it is the same
  object the rest of the site decorates with, and no reader can mistake it
  for a photograph of a place they will be standing in. The one honest frame,
  about.jpg, goes with the other three rather than leaving one door
  photographic and three drawn — a row of four has to be one kind of thing.

  The four files are still in public/images/about-dropdown and are now unused
  by anything; they are the client's own supply, so they are left on disk to
  be deleted or re-pointed deliberately rather than swept up by this change.

  ==========================================================================
  WHICH DRAWING EACH DOOR GETS, AND WHY IT IS THE PAINT THAT DECIDES
  ==========================================================================

  `resolveIcon` keys off the COLOUR, not the shape word: the brand sheet
  holds two icons per colour — one loose cut-out, one laid on a slab — and
  the word only picks which of those two. So four different marks means four
  different paints, and naming them four different shapes would change
  nothing. See components/sections/hero/doodles.ts.

  All four take the slab weight. A slab is the poster version of a mark —
  two-tone and solid-edged, where a loose cut-out is a thin shape that would
  float in a panel this size with nothing holding it. The ratios differ
  because these are hand-cut shapes and genuinely are different shapes; each
  one meets its box and centres, which is a sheet of cut-outs rather than
  four icons forced to a grid.

  THE PANEL KEEPS NO GROUND OF ITS OWN. The picture box was `bg-cream`,
  because a photograph needs something under it while it loads — and cream is
  what <MenuCard> itself is, so four cream boxes in a cream panel ran together
  into one band and the cards lost their top edge entirely. Measured: only the
  name strips showed as four objects. Dropping the fill lets each card's own
  `bg-surface` run the full height, which is what draws the edge, and the
  hover then washes the whole card rather than half of it.

  All four are therefore chosen to read on `bg-surface` — Light Sage mixed
  into white. Light Sage's own slab is the one colour that cannot: it is that
  ground. Soft Lavender's slab carries Charcoal Slate, so Gallery is the
  darkest of the four.
*/

interface AboutDoor {
  slug: string;
  href: string;
  name: string;
  sub: string;
  /**
   * The cut-out standing on this door.
   *
   * `ink` is the paint, and the paint is what picks the drawing; `name` only
   * asks for the slab of that colour rather than the loose one. Changing
   * `name` between two slab words would hand back the same icon.
   */
  mark: { name: DoodleName; ink: string };
}

/*
  TYPED RATHER THAN `as const`, and the reason is a type error that was also
  a design one. With `as const` the array's type is the literal shape of
  whatever is in it, so a field existed only while one entry happened to set
  it — the moment all four agreed, that field narrowed to `{}` and the render
  stopped compiling. The knobs should not appear and disappear with the data.
*/
const ABOUT_DOORS: readonly AboutDoor[] = [
  {
    slug: "about",
    /* Overwritten from the `href` prop below, so the tab and its first door
       can never point at two different routes. */
    href: "/about",
    name: "About the Maison",
    /* The footer's own heading over MISSION, word for word. */
    sub: "Why we do it.",
    /* Deep Lilac's slab — the lilac leaf, the brand accent itself, under the
       door that answers who the Maison is. */
    mark: { name: "bean", ink: INK.lilac },
  },
  {
    slug: "locations",
    href: "/locations",
    name: "Locations",
    sub: "Where to find us.",
    /* Warm Terracotta's slab: the one solid single-colour block in the set,
       and the strongest mark on the row — the door a reader is most often
       hunting for. */
    mark: { name: "cutout", ink: INK.terracotta },
  },
  {
    slug: "gallery",
    href: "/gallery",
    name: "Gallery",
    /* "What gets made here." is the gallery's own description and one word
       too long for the column. */
    sub: "What gets made.",
    /* Soft Lavender's slab, the one the sheet draws with Charcoal Slate
       waves across it — the widest shape of the four. */
    mark: { name: "wave", ink: INK.lavender },
  },
  {
    slug: "contact",
    href: "/contact",
    name: "Contact",
    sub: "Write to us.",
    /* White Rock's slab: a warm cream block with a Deep Lilac coral on it.
       The quietest of the four, under the door that is a form rather than a
       place to look at — and the only warm neutral on a row of three paints. */
    mark: { name: "slabCoral", ink: INK.whiteRock },
  },
] as const;

interface AboutMenuProps {
  label: string;
  href: string;
  isActive: boolean;
  linkClassName: string;
  /** The swatch behind the trigger word. Null over a dark hero. */
  paint?: string | null;
  onOpenChange?: (open: boolean) => void;
}

/**
 * ==========================================================================
 * THE MAISON ITSELF — four pages, under the one tab they all answer to
 * ==========================================================================
 *
 * At the client's ask: Locations, Gallery and Contact came out of the bar and
 * live here. The bar carried six entries across two tracks and four of them
 * answered one question in four places — who is this, and how do I reach
 * them. Three tabs now, each with a panel under it.
 *
 * ==========================================================================
 * DOORS, NOT A RAIL, AND THAT IS NOT A SHORTCUT
 * ==========================================================================
 *
 * <PrivateEventsMenu> carries the standing warning that two entries in one
 * bar opening two different kinds of object read as two navigation systems,
 * and it is right. The answer it draws from that is a shared <MenuCard>: the
 * same floating plate, the same bridge up to the bar, the same open, the same
 * Escape — and this has all of those. What differs is what is inside, and it
 * differs because the CONTENT differs, not to be different.
 *
 * Those two menus browse a catalogue: seven activities, four programmes, each
 * with a photograph and a line already written for it, so a rail of choices
 * feeding a preview is the shape that content has. This one holds four
 * destinations. There is no fifth thing to scroll to, no preview to fill —
 * and a rail of four with a preview beside it would mean writing a
 * description and finding a photograph for Contact, which is inventing
 * content to fill a layout.
 *
 * <MenuDoor> is the primitive the other two already use for exactly this: a
 * destination with a name, a line and a mark. Four of them in one row is the
 * same object the Private events panel puts in its third column, not a new
 * one.
 *
 * ==========================================================================
 * EVERY LINE BELOW IS ALREADY ON THE PAGE IT POINTS AT
 * ==========================================================================
 *
 *   About ....... "Why we do it" is the footer's own heading over MISSION.
 *   Locations ... "Where to Find Us." is that page's own h1.
 *   Gallery ..... "what gets made here" is that page's own description.
 *   Contact ..... "Write to Us" is that page's own section heading.
 *
 * Nothing here describes the studio in words the studio has not used.
 *
 * Behaviour — the grace period that lets a pointer cross the bar's padding,
 * the frame the open waits for, Escape outranking focus-to-open, the closed
 * panel staying out of the tab order — is `useMenuDisclosure`, shared with
 * the other two so none of the three can drift.
 */
export function AboutMenu({
  label,
  href,
  isActive,
  linkClassName,
  paint = null,
  onOpenChange,
}: AboutMenuProps) {
  const menuId = useId();
  const { isOpen, mounted, shown, trigger, openNow, closeSoon, closeNow, regionProps } =
    useMenuDisclosure(onOpenChange);


  return (
    <div {...regionProps} className="static flex h-full items-center">
      <button
        ref={trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => (isOpen ? closeNow() : openNow())}
        className={cn(linkClassName, "cursor-none items-center")}
      >
        <NavLabel isActive={isActive || isOpen} paint={paint}>
          {label}
        </NavLabel>
      </button>

      <MenuCard
        id={menuId}
        open={isOpen}
        shown={shown}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
      >
        {mounted ? (
          /*
            ==================================================================
            FOUR COLUMNS, ONE PER PAGE — at the client's ask
            ==================================================================

            It was briefly a rail and a preview, borrowed from the other two
            panels. That arrangement earns its keep where a rail is long and
            the preview is the only way to see what a name means: Experiences
            has seven rows, Private events four. This menu has four short
            names a reader already understands, so the preview was showing one
            page at a time and three of the four stayed blank.

            Four columns show all four at once — not a preview pane, but a
            drawing on every door, arriving in reading order as the panel
            opens.

            `items-stretch` is the default and is what is wanted: all four take
            the height of the tallest, so a two-line sub on one does not leave
            the other three short.
          */
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:gap-3 lg:grid-cols-4">
            {ABOUT_DOORS.map((door, i) => (
              <Link
                key={door.slug}
                href={door.slug === "about" ? href : door.href}
                className={cn(
                  /*
                    `overflow-clip`, not `overflow-hidden`. It clips the same
                    and respects the radius the same, and it does not make a
                    scroll container — which is what a mark's view timeline
                    resolves against. The marks below are on `trigger="state"`
                    and so do not ask the question, but the default for new
                    work here is clip; see app/locations/page.tsx.
                  */
                  "group/door relative flex flex-col overflow-clip rounded-[1.35rem] bg-surface",
                  "transition-colors duration-300 ease-soft hover:bg-sage",
                )}
              >
                {/*
                  THE MARK SETS THE COLUMN'S TOP AND NOTHING ELSE. A fixed
                  ratio rather than `flex-1`: four columns side by side have to
                  hold the same box or the row reads as four different objects.
                  4:3 was the crop the photographs took and it suits the slabs
                  too — none of the five is taller than it is wide by much.

                  The inset is what keeps a shape off its own edges, so the
                  widest of the four (Soft Lavender's waves) still has air
                  either side rather than running out of the panel.
                */}
                <span className="relative block aspect-[4/3] w-full overflow-clip">
                  <span aria-hidden className="absolute inset-[15%] block">
                    {/*
                      THEY DRAW THEMSELVES WHEN THE PANEL OPENS, left to right.

                      `trigger="state"` with `on={shown}` because the panel
                      owns the moment: the default trigger is a view timeline,
                      and a timeline inside this panel resolves against the
                      panel itself — a scroll container that never scrolls — so
                      every mark would report as covered and sit permanently
                      drawn. <MenuSplash> carries the same pair for the same
                      reason.

                      `depth` is low. A mark this size with the pointer right
                      on it reads as the card wobbling at the 8 the hero uses.
                    */}
                    <DoodleMark
                      name={door.mark.name}
                      color={door.mark.ink}
                      treatment="draw"
                      trigger="state"
                      on={shown}
                      delay={shown ? 140 + i * 90 : 0}
                      depth={4}
                    />
                  </span>
                </span>

                <span className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3.5">
                  {/*
                    NO SECOND MARK BESIDE THE NAME. There was a 1rem cut-out
                    here, in the same paint as the column, back when the panel
                    above it was a photograph and the mark was the only brand
                    drawing on the card. With the drawing now filling that
                    panel, a small copy of it under its own chin is a second
                    decoration arguing with the first.
                  */}
                  <span className="text-body font-medium text-text">{door.name}</span>
                  <span className="text-fine text-text/75">{door.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </MenuCard>
    </div>
  );
}
