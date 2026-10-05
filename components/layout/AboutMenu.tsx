"use client";

import { useId } from "react";

import { MenuCard, MenuDoor } from "@/components/layout/MenuCard";
import { NavLabel } from "@/components/layout/NavLabel";
import { useMenuDisclosure } from "@/components/layout/useMenuDisclosure";
import { cn } from "@/lib/utils";

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
            FOUR ACROSS AT `lg`, TWO AT `sm`, ONE BELOW.

            The card is the full measure less the gutter — see <MenuCard> for
            why it is not capped — so four doors across it are about 320px
            each at 1440, which is the width the door was drawn at in the
            Private events panel. Not three-and-a-wide-one and not a rail: the
            four are peers, and a grid that says so is the honest drawing.

            `items-stretch` is the default and is what is wanted: all four
            take the height of the tallest, so a two-line sub on one does not
            leave the other three short.
          */
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:gap-3 lg:grid-cols-4">
            {/*
              FOUR COLOURS AND FOUR CUT-OUTS, AT THE CLIENT'S ASK.

              This block used to say `bow` four times, and the note here
              explained why: <MenuDoor> hard-wired its paint, and `resolveIcon`
              picks the DRAWING from the COLOUR rather than from the shape
              word, so four different words would have rendered four identical
              lilac bows while reading in the source as four shapes. The honest
              move then was to say what was drawn.

              The client has now asked these boxes to differ, so the paint is a
              prop — see DOOR_TONE in <MenuCard>, where every ink is measured.
              Varying it varies the drawing, which is the whole mechanism:

                About ...... Deep Lilac field, White Rock mark ... open splash
                Locations .. Soft Lavender field, Deep Lilac ..... bow
                Gallery .... Light Sage field, Warm Terracotta ... splash
                Contact .... Terracotta wash, Deep Lilac SLAB .... slab + leaf

              THE WORD STILL ONLY PICKS LOOSE AGAINST SLAB. Three of these name
              the drawing they get; the fourth cannot, because the lilac pair's
              slab is the leaf-carrying slab and no shape word spells that. Its
              word is the weight, and the comment beside it says what lands.

              THE ACCENT STAYS ON ABOUT — it is the page the tab is named for
              and the other three are where it leads. The Experiences and
              Private events panels keep their two-tone doors, so this is the
              one panel that fans out; that is the client's instruction for
              these boxes rather than a new rule for every menu.
            */}
            <MenuDoor
              href={href}
              title="About the Maison"
              /* The footer's own heading over MISSION, word for word. */
              sub="Why we do it."
              /* White Rock on Deep Lilac: the open splash. */
              mark="bow"
              tone="accent"
            />
            <MenuDoor
              href="/locations"
              title="Locations"
              sub="Where to find us."
              /* Deep Lilac, loose: the bow. */
              mark="bow"
              tone="lavender"
            />
            {/* "What gets made here." is the gallery's own description and one
                word too long for the column — 20 characters wrapped where
                "Where to find us." at 17 did not, so one door of four sat on
                two lines. The clause without its adverb is the same claim. */}
            <MenuDoor
              href="/gallery"
              title="Gallery"
              sub="What gets made."
              /* Warm Terracotta, loose: the splash. */
              mark="splash"
              tone="sage"
            />
            <MenuDoor
              href="/contact"
              title="Contact"
              sub="Write to us."
              /* THE ONE WORD THAT IS A WEIGHT, NOT A NAME. `cutout` is a slab
                 word, and the slab of the Deep Lilac pair is the lilac slab
                 carrying a Light Sage leaf — so this draws that, not a cut-out.
                 It is the only shape on the four that needs saying. */
              mark="cutout"
              tone="blush"
            />
          </div>
        ) : null}
      </MenuCard>
    </div>
  );
}
