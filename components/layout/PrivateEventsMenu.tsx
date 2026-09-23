"use client";

import { useId, useState } from "react";

import { MenuCard, MenuPreview, MenuRailGroup, MenuRailRow, MenuTile } from "@/components/layout/MenuCard";
import { NavLabel } from "@/components/layout/NavLabel";
import { useMenuDisclosure } from "@/components/layout/useMenuDisclosure";
import { PRIVATE_EVENT_AUDIENCES, PRIVATE_EVENT_ENQUIRY_HREF } from "@/lib/privateEvents";
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
 * WHAT IS IN IT, AND WHAT IS NOT. `PRIVATE_EVENT_AUDIENCES` names the studio's
 * four documented programmes and this shows the ones flagged for the menu —
 * mall and community activations is deliberately absent, because it is its own
 * programme category in the proposal rather than something a host books for a
 * party.
 *
 * Every line is the description already written for that programme. Nothing
 * here invents a package, a price, a capacity, an inclusion or a duration, and
 * three of the programmes have no page of their own yet — so each entry points
 * at its own anchor on /private-events, which is where the studio's approved
 * words about it live today. When the routes exist this becomes one `href` per
 * item and nothing else moves.
 *
 * Behaviour — the grace period, the frame the open waits for, Escape, the
 * inert closed panel — is `useMenuDisclosure`, shared with the Experiences
 * menu so the two cannot drift there either.
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
  const { isOpen, mounted, shown, trigger, openNow, closeSoon, closeNow, regionProps } =
    useMenuDisclosure(onOpenChange);

  const items = PRIVATE_EVENT_AUDIENCES.filter((audience) => audience.inPrivateEventsMenu);

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = items.find((item) => item.slug === activeSlug) ?? items[0];

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
        <NavLabel isActive={isActive || isOpen} paint={paint}>{label}</NavLabel>
      </button>

      <MenuCard id={menuId} open={isOpen} shown={shown} onMouseEnter={openNow} onMouseLeave={closeSoon}>
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
            <div className="col-span-12 flex flex-col gap-5 py-2.5 lg:col-span-4">
              <MenuRailGroup
                title="Groups of every kind"
                note="Tell us what you are planning and we will help you create it."
              >
                {items.map((audience) => (
                  <MenuRailRow
                    key={audience.slug}
                    href={`${href}#${audience.slug}`}
                    name={audience.name}
                    image={audience.image}
                    active={active?.slug === audience.slug}
                    onActivate={() => setActiveSlug(audience.slug)}
                  />
                ))}
              </MenuRailGroup>
            </div>

            {/* ---- the preview ---------------------------------------- */}
            <div className="col-span-12 flex flex-col gap-2.5 md:gap-3 lg:col-span-5">
              {active ? (
                <MenuPreview
                  key={active.slug}
                  href={`${href}#${active.slug}`}
                  eyebrow="Private events"
                  name={active.name}
                  description={active.description}
                  image={active.image}
                  action="See this programme"
                />
              ) : null}
            </div>

            {/* ---- the two doors, in a column of their own ------------- */}
            <div className="col-span-12 grid gap-2.5 md:gap-3 lg:col-span-3 lg:grid-rows-2">
              <MenuTile href={href} title="All private events" sub="Every programme, in one place." mark="bow" />
              <MenuTile
                href={PRIVATE_EVENT_ENQUIRY_HREF}
                title="Plan a private event"
                mark="splash"
                sub="Tell us what you are planning."
                tone="accent"
              />
            </div>
          </div>
        ) : null}
      </MenuCard>
    </div>
  );
}
