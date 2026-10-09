"use client";

import { useId, useState } from "react";

import { MenuCard, MenuDoor, MenuPreview, MenuRailGroup, MenuRailRow } from "@/components/layout/MenuCard";
import { NavLabel } from "@/components/layout/NavLabel";
import { useMenuDisclosure } from "@/components/layout/useMenuDisclosure";
import { PRIVATE_EVENT_ENQUIRY_HREF } from "@/lib/privateEvents";
import { useSiteChrome } from "@/components/layout/SiteChrome";
import { cn } from "@/lib/utils";

interface PrivateEventsMenuProps {
  label: string;
  href: string;
  isActive: boolean;
  linkClassName: string;
  /** The swatch behind the trigger word. Null over a dark hero. */
  paint?: string | null;
  onOpenChange?: (open: boolean) => void;
}

/**
 * The programmes a private booking can be built around, and the way in.
 *
 * THE SAME CARD AS EXPERIENCES, which is the point. Two entries in one bar
 * that open two different kinds of object read as two navigation systems
 * however good each is on its own — so this is the Experiences panel's twin:
 * the same floating card, the same rail of choices, the same preview filling
 * the right half, the same pair of tiles at its foot. What differs is what is
 * in it. Both are `MenuCard`, so neither can drift from the other.
 *
 * WHAT IS IN IT. `PRIVATE_EVENT_AUDIENCES` names the studio's four documented
 * programmes and this shows the ones flagged for the menu, which is now all
 * four. Mall & community activations was deliberately absent — the proposal
 * lists it as its own programme category and the studio is engaged by the
 * venue rather than by a guest — and the client has asked for it here with
 * the others. The reasoning is kept on `inPrivateEventsMenu` in
 * lib/privateEvents.ts rather than repeated; the filter below is unchanged,
 * because the decision belongs in the data and not in this component.
 *
 * Every line is the description already written for that programme. Nothing
 * here invents a package, a price, a capacity, an inclusion or a duration, and
 * three of the programmes have no page of their own yet — so each entry points
 * at its own anchor on /private-events, which is where the studio's approved
 * words about it live today. THE ROUTES NOW EXIST and this does link straight
 * at them — see the note in <WaysToExperience> for why an anchor on the
 * overview could not work once the four programmes became a grid.
 *
 * (Originally: "when the routes exist this becomes one `href` per
 * item and nothing else moves.
 *
 * Behaviour — the grace period, the frame the open waits for, Escape, the
 * inert closed panel, a click or a tap that opens rather than toggles, one
 * panel open at a time — is `useMenuDisclosure`, shared with the Experiences
 * and About menus so the three cannot drift there either.
 */
export function PrivateEventsMenu({
  label,
  href,
  isActive,
  linkClassName,
  paint = null,
  onOpenChange,
}: PrivateEventsMenuProps) {
  const menuId = useId();
  const { isOpen, mounted, shown, regionProps, triggerProps, cardProps } =
    useMenuDisclosure(onOpenChange);

  // The programmes from the CMS, through the layout (see SiteChrome).
  const { audiences } = useSiteChrome();
  const items = audiences.filter((audience) => audience.inPrivateEventsMenu);

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = items.find((item) => item.slug === activeSlug) ?? items[0];

  return (
    <div {...regionProps} className="static flex h-full items-center">
      <button
        {...triggerProps}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={cn(linkClassName, "cursor-none items-center")}
      >
        <NavLabel isActive={isActive || isOpen} paint={paint}>{label}</NavLabel>
      </button>

      <MenuCard id={menuId} open={isOpen} shown={shown} {...cardProps}>
        {mounted ? (
          <div className="grid grid-cols-12 gap-2.5 md:gap-3">
            {/*
              FOUR / FIVE / THREE, which is what the full width bought.

              At 72rem the card had room for a rail and a preview, so the two
              tiles had to go under one of them — and which one depended on how
              many rows the menu had, because a card is as tall as its tallest
              column. That asymmetry is gone: across the full measure the tiles
              take a column of their own and both menus use the same three-part
              arrangement. The extra width goes sideways rather than down,
              which is the point — a taller card would have been a worse one.
            */}

            {/* ---- the rail ------------------------------------------- */}
            {/*
              AND A CEILING ON THE RAIL, which is the second half of the
              client's note: "keep a ceiling above which the thing doesnt
              increase". The rail is now the only column that can make the
              card taller — see the note on the preview's picture in
              <MenuCard> — so capping the rail caps the card. 38rem clears
              the longest menu the site has (Experiences, 596px of rows), and
              the viewport term takes over on a short screen, where a panel
              that runs off the bottom is worse than one that scrolls.

              `overflow-y-auto` is safe HERE and would not be on the card: the
              card's `::before` bridges the gap up to the bar and a scroll
              container would clip it, and the tiles' cut-outs animate off a
              view timeline that a scroll container resolves against itself.
              The rail holds neither.
            */}
            <div className="col-span-12 flex flex-col gap-5 py-2.5 lg:col-span-4 lg:max-h-[min(38rem,calc(100vh-8.5rem))] lg:overflow-y-auto lg:overscroll-contain">
              {/*
                THE PAGE'S OWN WORDS FOR THE SAME FOUR, at the client's ask
                that older copy follow their rewrite. This rail is the "who it
                is for" section in miniature — the same programmes under the
                same idea — so it takes that section's copy (p31): the heading
                as the title, minus the full stop, which no rail title in
                either menu carries; and the last two sentences of its intro
                as the note, word for word. It was "Groups of every kind" over
                "Tell us what you are planning and we will help you create
                it." — the heading the client replaced, and the voice their
                p37 rewrite replaced.
              */}
              <MenuRailGroup
                title="Made for Your Kind of Crowd"
                note="Don’t see yours? That’s probably a conversation worth having."
              >
                {items.map((audience) => (
                  <MenuRailRow
                    key={audience.slug}
                    href={`${href}/${audience.slug}`}
                    name={audience.name}
                    image={audience.image}
                    active={active?.slug === audience.slug}
                    onActivate={() => setActiveSlug(audience.slug)}
                  />
                ))}
              </MenuRailGroup>
            </div>

            {/* ---- the preview ---------------------------------------- */}
            {/*
              FOUR COLUMNS, NOT FIVE — and the rail takes the one it loses.

              The preview's picture fills whatever height the row has left and
              crops to it (`object-cover`, see <MenuPreview>). Across five of
              twelve columns that box came out wide and short, so a subject
              held in somebody's hands was cropped to a band across its middle
              — the client's "expanded and not visible properly". Narrowing the
              card narrows the box against the same height, so the crop keeps
              more of the picture's own proportion and the badge is whole.

              The column goes to the rail beside it rather than to the list,
              which is the other half of what they asked for: the two doors
              were the narrowest things in the menu at three columns.
            */}
            <div className="col-span-12 flex flex-col gap-2.5 md:gap-3 lg:col-span-4">
              {active ? (
                <MenuPreview
                  key={active.slug}
                  href={`${href}/${active.slug}`}
                  eyebrow="Private events"
                  name={active.name}
                  description={active.description}
                  image={active.image}
                  action="See this programme"
                />
              ) : null}
            </div>

            {/* ---- the two doors, in a column of their own ------------- */}
            {/*
              BACK ON THE RIGHT, WHICH IS WHERE THIS MENU HAD THEM.

              They were moved to a strip along the foot to match the
              Experiences menu, on the argument that the same component in the
              same place should do the same thing in both. The client has
              asked for this one to keep its old shape, and the argument does
              not survive the difference between the two menus: Experiences
              carries seven rows in two groups and needed its third column for
              them, this one carries three rows in one group and has the
              column to spare.

              `grid-rows-2` shares the row's height between the pair, so the
              two doors are the same size as each other whatever the rail
              turns out to be — and the rail is what sets the height now (see
              the note on the preview's picture in <MenuCard>), so they are no
              longer the 290px fields the client called too big.
            */}
            <div className="col-span-12 grid gap-2.5 md:gap-3 lg:col-span-4 lg:grid-rows-2">
              <MenuDoor href={href} title="All private events" sub="Every programme, in one place." mark="bow" />
              {/* The sub is the opening question of the client's p37 line,
                  the one over the same door at the foot of /private-events.
                  It was "Tell us what you are planning.", the wording that
                  rewrite replaced. */}
              <MenuDoor
                href={PRIVATE_EVENT_ENQUIRY_HREF}
                title="Plan a private event"
                mark="splash"
                sub="Have something in mind?"
                tone="accent"
              />
            </div>
          </div>
        ) : null}
      </MenuCard>
    </div>
  );
}
