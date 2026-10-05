"use client";

import Image from "next/image";
import Link from "next/link";
import { useId } from "react";

import { MenuCard } from "@/components/layout/MenuCard";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { INK } from "@/components/sections/hero/composition";
import { NavLabel } from "@/components/layout/NavLabel";
import { useMenuDisclosure } from "@/components/layout/useMenuDisclosure";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

/*
  ==========================================================================
  THE FOUR PAGES, AND THE PICTURE EACH ONE ALREADY OWNS
  ==========================================================================

  At the client's ask: the other two panels show the thing they are offering
  and this one showed four coloured tiles, so About was the one menu a reader
  could not see into. It takes the same anatomy now — a rail of names on the
  left, a preview filling the column beside it — which is <MenuCard>'s own
  pair of primitives rather than a third arrangement invented for one panel.

  EVERY PICTURE IS THE ONE ITS PAGE ALREADY USES, which is what makes this
  honest rather than decorated: a reader who opens Contact from here meets the
  photograph that is on /contact when they arrive. Locations has no hero of
  its own, so it takes the studio's own frame of a shared table — one of the
  four stills cut from the studio's film, not a stock photograph.

  NOTHING HERE IS CAPTIONED AS THE STUDIO'S OWN WORK. `alt` describes the
  frame and never the occasion, which is the rule lib/privateEvents.ts sets
  out at length for the same reason.
*/
/* One colour per column, in the site's own rotation. The colour picks the
   drawing, so four colours is four different cut-outs. */
const DOOR_MARKS = [INK.lilac, INK.terracotta, INK.lavender, INK.whiteRock];

/*
  ==========================================================================
  THE FOUR PICTURES — supplied by the client 2026-10-06
  ==========================================================================

  public/images/about-dropdown, one file named for each door. They replace
  four frames borrowed from elsewhere on the site: the About page's own
  cut-out, a community-table shot standing in for Locations, a candle
  photograph standing in for Gallery, and the plate-painting frame /contact
  shows. Borrowed frames are why three of the four doors were showing
  something that belonged to a different page.

  PROVENANCE. Checked with `strings`: no C2PA manifest, no SynthID, no Adobe,
  Figma or OpenAI marker on any of the four — which proves nothing either
  way, so none of them may be captioned as the studio's own photograph or as
  its own guests. All four are 2000px-wide landscape and crop to the 4:3 box
  centred, so none needs a `position`.

  AND THREE OF THE FOUR SHOW SOMETHING OTHER THAN WHAT THE DOOR SAYS. Used
  as asked and raised in full, because the one place this matters is the one
  door that reads as a claim:

    about.jpg ..... two women painting on a studio floor. On-brand, and the
                    only one of the four that needs no caveat.
    gallery.jpg ... somebody photographing through a gilt frame in an ART
                    gallery. A pun on the word rather than the Maison's own
                    gallery of finished work: nothing in it was made here.
    contact.jpg ... a FLORIST at a counter, on the phone beside a vase of
                    roses with a calculator under their hand. Nothing in it
                    is a creative studio.
    location.jpg .. a mall interior that is NOT Times Square Center. The
                    signage is Chinese and the storefronts are other
                    retailers' — Petit Bateau, MCS, Marisfrolg, Toys'R'Us.
                    It sits behind the one door whose words are an address
                    question, "Where to find us", so a generic mall there is
                    read as the Maison's mall.

  Swapping any of them is one `src` and one `alt`; nothing else moves.
*/
interface AboutDoor {
  slug: string;
  href: string;
  name: string;
  sub: string;
  image: ImageAsset;
}

/*
  TYPED RATHER THAN `as const`, and the reason is a type error that was also
  a design one. With `as const` the array's type is the literal shape of
  whatever is in it, so `position` existed only while one entry happened to
  set it — the moment all four crops were centred, `door.image.position`
  narrowed to `{}` and the render stopped compiling. The aiming knob should
  not appear and disappear with the data. `ImageAsset` carries it optionally,
  which is what it is.
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
    image: {
      src: "/images/about-dropdown/about.jpg",
      alt: "Two people sitting on a studio floor with paint across their palms, a brush held between them over sheets of finished painting.",
    },
  },
  {
    slug: "locations",
    href: "/locations",
    name: "Locations",
    sub: "Where to find us.",
    image: {
      src: "/images/about-dropdown/location.jpg",
      alt: "A wide mall atrium under a glazed roof, escalators crossing between balconied floors of shops.",
    },
  },
  {
    slug: "gallery",
    href: "/gallery",
    name: "Gallery",
    /* "What gets made here." is the gallery's own description and one word
       too long for the column. */
    sub: "What gets made.",
    image: {
      src: "/images/about-dropdown/gallery.jpg",
      alt: "Someone raising a camera to photograph through a gilt picture frame, a hung print and a tall vase behind them.",
    },
  },
  {
    slug: "contact",
    href: "/contact",
    name: "Contact",
    sub: "Write to us.",
    image: {
      src: "/images/about-dropdown/contact.jpg",
      alt: "Someone in an apron taking a call at a counter, a bouquet of pale roses beside an open notebook.",
    },
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
            page at a time and three of the four stayed pictureless.

            Four columns show all four at once, which is the thing the client
            actually asked for when they asked for imagery — not a preview
            pane, but a picture on every door.

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
                  "group/door relative flex flex-col overflow-hidden rounded-[1.35rem] bg-surface",
                  "transition-colors duration-300 ease-soft hover:bg-sage",
                )}
              >
                {/*
                  THE PICTURE SETS THE COLUMN'S TOP AND NOTHING ELSE. A fixed
                  ratio rather than `flex-1`: four columns side by side have
                  to crop identically or the row reads as four different
                  objects, and 4:3 is the shallowest crop that still keeps a
                  subject held in somebody's hands whole at this width.
                */}
                <span className="relative block aspect-[4/3] w-full overflow-hidden bg-cream">
                  <Image
                    src={door.image.src}
                    alt={door.image.alt}
                    fill
                    sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw"
                    className="object-cover transition-transform duration-700 ease-editorial motion-safe:group-hover/door:scale-[1.03]"
                    style={door.image.position ? { objectPosition: door.image.position } : undefined}
                  />
                </span>

                <span className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3.5">
                  <span className="flex items-center gap-2">
                    {/*
                      The cut-out each door carries, one per column. The colour
                      picks the drawing in this brand's sheet, so four colours
                      is four different marks — see `resolveIcon`.
                    */}
                    <span aria-hidden className="block w-4 shrink-0">
                      <DoodleMark
                        name="bow"
                        color={DOOR_MARKS[i % DOOR_MARKS.length]}
                        treatment="stamp"
                        depth={0}
                      />
                    </span>
                    <span className="text-body font-medium text-text">{door.name}</span>
                  </span>
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
