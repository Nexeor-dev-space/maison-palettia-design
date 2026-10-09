"use client";

import { useId } from "react";

import { MenuCard, MenuDoor } from "@/components/layout/MenuCard";
import { NavLabel } from "@/components/layout/NavLabel";
import { useMenuDisclosure } from "@/components/layout/useMenuDisclosure";
import { cn } from "@/lib/utils";

/*
  ==========================================================================
  FOUR DOORS, AND NOTHING ON THEM BUT WORDS — at the client's ask
  ==========================================================================

  The client's note on this panel was "just the text is fine". It has taken
  two rounds to say exactly that, and the history is worth keeping because
  the middle step read the note wrongly.

  2026-10-06 .. a photograph on every door. Three of the four showed
                something other than what the door said: an art-gallery pun
                behind Gallery with nothing made here in it, a florist behind
                Contact, and a mall that is not Times Square Center behind
                the one door whose words are an address question.
  2f11e55 ..... the photographs out and a large brand cut-out in their place,
                a 4:3 slab drawn on each door. That answered "no photos" and
                not "just the text": measured at 1440, each door was 335x341
                with a 235x176 drawing in it — two thirds of every card was
                still a picture.
  now ......... the name and its line, and nothing else. The doors are the
                same <MenuDoor> the other two panels already end on ("Upcoming
                dates", "All private events"), in its quiet tone and without
                its mark, so the About panel reads as text the way those doors
                do rather than inventing a fourth look.

  The four photographs that started this are deleted from
  public/images/about-dropdown — nothing referenced them after 2f11e55.
*/

interface AboutDoor {
  slug: string;
  href: string;
  name: string;
  sub: string;
}

/*
  TYPED RATHER THAN `as const`, and the reason is a type error that was also
  a design one. With `as const` the array's type is the literal shape of
  whatever is in it, so a field existed only while one entry happened to set
  it — the moment all four agreed, that field narrowed to `{}` and the render
  stopped compiling. The knobs should not appear and disappear with the data.

  EXPORTED FOR <AboutSheet>, which is this panel on a phone and shows the
  same four lines under the same four names — one list, so the two cannot
  describe a page two different ways.
*/
export const ABOUT_DOORS: readonly AboutDoor[] = [
  {
    slug: "about",
    /* Overwritten from the `href` prop below, so the tab and its first door
       can never point at two different routes. */
    href: "/about",
    name: "About the Maison",
    /* The footer's own heading over MISSION, word for word. */
    sub: "Why we do it.",
  },
  {
    slug: "locations",
    href: "/locations",
    name: "Locations",
    sub: "Where to find us.",
  },
  {
    slug: "gallery",
    href: "/gallery",
    name: "Gallery",
    /* "What gets made here." is the gallery's own description and one word
       too long for the column. */
    sub: "What gets made.",
  },
  {
    slug: "contact",
    href: "/contact",
    name: "Contact",
    sub: "Write to us.",
  },
];

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
 * destination with a name and a line. Four of them in one row is the same
 * object the Private events panel puts in its third column, not a new one —
 * here without the mark that door can carry, because the client asked for
 * this panel to be the words alone.
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
 * panel staying out of the tab order, a click after a hover keeping the panel
 * rather than shutting it — is `useMenuDisclosure`, shared with the other two
 * so none of the three can drift.
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
  const { isOpen, mounted, shown, regionProps, triggerProps, cardProps } =
    useMenuDisclosure(onOpenChange);

  return (
    <div {...regionProps} className="static flex h-full items-center">
      <button
        {...triggerProps}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
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
        {...cardProps}
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

            Four columns show all four at once, and with the drawings gone
            the row is only as tall as a name over a line — measured at 1440,
            a 335x94 door and a 118px panel, where the cut-outs made it 341px
            a door. One strip of four names, not four tiles.

            TWO BY TWO UNDER `xl`. At 1024 four columns are 234px each, and
            "About the Maison", "Where to find us." and "What gets made." all
            broke onto a second line beside the arrow — a strip of text
            wrapping in three of its four cells reads as cramped rather than
            quiet. Two columns there give each door about 480px and every
            name and line its own single line.

            `items-stretch` is the default and is what is wanted: every door
            takes the height of the tallest in its row, so a line that wraps
            on one does not leave the others short.
          */
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:gap-3 xl:grid-cols-4">
            {ABOUT_DOORS.map((door) => (
              <MenuDoor
                key={door.slug}
                href={door.slug === "about" ? href : door.href}
                title={door.name}
                sub={door.sub}
              />
            ))}
          </div>
        ) : null}
      </MenuCard>
    </div>
  );
}
