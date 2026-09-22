"use client";

import Link from "next/link";

import Image from "next/image";

import { NavLabel } from "@/components/layout/NavLabel";
import { useMenuDisclosure } from "@/components/layout/useMenuDisclosure";
import { BlobButton } from "@/components/ui/BlobButton";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { PRIVATE_EVENT_AUDIENCES, PRIVATE_EVENT_ENQUIRY_HREF } from "@/lib/privateEvents";
import { cn } from "@/lib/utils";

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

interface PrivateEventsMenuProps {
  label: string;
  href: string;
  isActive: boolean;
  linkClassName: string;
  onOpenChange?: (open: boolean) => void;
}

/**
 * The three programmes a private booking can be built around, and the way in.
 *
 * THE SAME PANEL AS EXPERIENCES, at the client's ask. It was a compact column
 * hanging under the word — three programmes and one action do not need the
 * width — but a bar with two entries that open two different *kinds* of thing
 * reads as two navigation systems, whatever each one is individually worth. So
 * this is the Experiences panel's twin: the same full-bleed field, the same
 * ground and edges, the same curtain, the same left-hand intro column with the
 * eyebrow, the terracotta rule and the one filled action, and the same
 * left-to-right sweep. What differs is what it holds.
 *
 * The heading and the line under it are the words the private-events page
 * already uses over this very list — "Groups of every kind", and the sentence
 * about a group that is none of these still being worth asking about. Nothing
 * here is written for the menu.
 *
 * WHAT IS IN IT, AND WHAT IS NOT. `PRIVATE_EVENT_AUDIENCES` names the
 * studio's four documented programmes; the three offered here are the ones
 * that are private bookings. Mall & community activations is deliberately
 * absent: it is its own programme category in the proposal, not something a
 * host books for a party, and it stays on the page with the other three.
 *
 * Every line is the description already written for that programme — nothing
 * here invents a package, a price, a capacity, an inclusion or a duration.
 * Three of these programmes have no page of their own yet, so each entry
 * points at its own entry on /private-events, which is where the studio's
 * approved words about it live today. When the client supplies content and
 * the routes exist, this becomes one `href` per item and nothing else moves.
 *
 * Behaviour — the grace period, the frame the open waits for, Escape, the
 * inert closed panel — is `useMenuDisclosure`, shared with the Experiences
 * menu so the two cannot drift.
 */
export function PrivateEventsMenu({
  label,
  href,
  isActive,
  linkClassName,
  onOpenChange,
}: PrivateEventsMenuProps) {
  const { isOpen, mounted, shown, trigger, openNow, closeSoon, closeNow, regionProps } =
    useMenuDisclosure(onOpenChange);
  const menuId = "private-events-menu";

  /* The sweep, in the order the panel is read. */
  const rise = (index: number) => ({ transitionDelay: shown ? `${90 + index * 45}ms` : "0ms" });
  const RISE =
    "transition-[opacity,translate] duration-[420ms] ease-editorial motion-reduce:transition-none";
  const riseState = shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0";

  const items = PRIVATE_EVENT_AUDIENCES.filter((audience) => audience.inPrivateEventsMenu);

  return (
    <div
      {...regionProps}
      // `static`, so the full-bleed panel below positions against the <header>
      // rather than against this box. `h-full` is what removes the dead strip
      // between the two — see the note in <HeaderBar>.
      className="static flex h-full items-center"
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => (isOpen ? closeNow() : openNow())}
        className={cn(linkClassName, "cursor-pointer items-center")}
      >
        <NavLabel isActive={isActive || isOpen}>{label}</NavLabel>
      </button>

      <div
        id={menuId}
        inert={!isOpen}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        /*
          Full-bleed, like the Experiences panel: a field that runs the width of
          the screen reads as the page opening up rather than as a component
          sitting on it, and it is the one thing that makes the two entries feel
          like one system. Same ground as the bar takes on scroll, the bar's own
          hairline at the top, and the Deep Lilac line along the bottom as the
          drawer's edge — it travels down with the reveal.
        */
        className={cn(
          "absolute inset-x-0 top-full overflow-hidden bg-surface",
          "border-t border-t-text/10",
          /*
            THE PANEL IS OPAQUE THE WHOLE WAY DOWN, and it did not use to be.

            It faded in while the clip wiped, so for the first few hundred
            milliseconds the whole surface was semi-transparent and the page
            behind it showed straight through — the script line and the
            photograph bleeding into the menu. That is what "abrupt" was about:
            not the speed, but that the panel never read as a surface arriving.
            It read as a translucent sheet being switched on over the page.

            The clip alone reveals it now. A solid ground drawn down from under
            the bar is a drawer opening; the Deep Lilac rule along its bottom
            is the drawer's lip, and it travels down with the edge. Nothing
            else about the timing changed — 520ms down, 240 back up, because
            a menu you have decided against should get out of the way.

            The two durations are per-property, in the order the property list
            names them: clip-path 520ms, opacity 0ms. On the way out one
            `duration` covers both at 240.

            Closing keeps the fade. Wiping a fully opaque panel upward off the
            page reads as the content being eaten from below; going out it is
            better to simply stop being there.
          */
          // See <SearchPanel> for why this is `ease-soft` and not
          // `ease-editorial`: the quintic curve spent five sixths of its
          // time on the last few per cent of the travel.
          "transition-[clip-path,opacity] ease-soft motion-reduce:transition-none",
          shown
            ? "opacity-100 [transition-duration:520ms,0ms] [clip-path:inset(0_0_0_0)]"
            : "opacity-0 duration-[240ms] [clip-path:inset(0_0_100%_0)]",
          isOpen ? null : "pointer-events-none",
        )}
      >
        {/*
          THE DRAWER'S EDGE, WHICH THE PANEL CANNOT DRAW FOR ITSELF.

          The bottom border used to sit on the panel, and the note beside it
          claimed the line travelled down with the reveal. Photographed, it
          does not: `clip-path: inset(0 0 X% 0)` clips the element's own
          bottom border away for the whole of the wipe, so the line only
          appears in the final frame. What a visitor actually saw was menu
          text arriving over page text with no boundary between them — on
          /about the panel's ground (`--color-surface`, thirty per cent sage
          in white) is the same colour as the page behind it, so there was
          nothing to mark where the menu ended. That, not the speed, is what
          reads as abrupt.

          So the edge is its own element. It is pinned to the top of the panel
          and its `bottom` travels from 100% to 0 on the same duration and the
          same curve as the clip, which keeps its 2px underside exactly on the
          clip's edge for every frame. A line drawn down the page with the
          menu filling in behind it is a drawer being pulled open.

          Percentages both ends, and `bottom` rather than `height`: an
          absolutely positioned box resolves them against its containing
          block's padding box, which is this panel and is definite. A `height`
          of 100% would resolve against a content-sized parent and collapse.
        */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 border-b-2 border-b-primary/30",
            "transition-[bottom] ease-soft motion-reduce:transition-none",
            shown ? "[bottom:0%] duration-[520ms]" : "[bottom:100%] duration-[240ms]",
          )}
        />
        {mounted ? (
          <div className="mx-auto w-full px-gutter py-8 lg:py-9">
            <div className="grid grid-cols-12 gap-x-6 gap-y-8 lg:gap-x-8">
              {/*
                The intro column, built exactly as the Experiences panel's is:
                the section named in Deep Lilac, the site's terracotta accent
                rule under it, the page's own heading and line, and the one
                filled action in the whole field.
              */}
              <div
                className={cn("col-span-12 flex flex-col lg:col-span-3 xl:col-span-4", RISE, riseState)}
                style={rise(0) as Vars}
              >
                <p className="text-label font-semibold uppercase tracking-eyebrow text-primary">
                  {label}
                </p>
                <span aria-hidden className="mt-2.5 block h-px w-8 bg-terracotta" />
                <p className="mt-3.5 max-w-[12ch] text-[clamp(1.5rem,1.15rem+0.9vw,2rem)] font-light leading-[1.1] tracking-[-0.02em] text-text">
                  Groups of every kind.
                </p>
                <p className="mt-3 max-w-[30ch] text-fine leading-[1.6] text-text/85">
                  Examples of the groups a session can be built around. If yours
                  is none of these, it is still worth asking.
                </p>
                <BlobButton
                  href={PRIVATE_EVENT_ENQUIRY_HREF}
                  onClick={closeNow}
                  /* Light Sage on hover rather than the default Charcoal, at
                     the client's ask. It is a tone rather than a change to the
                     default because the flood measures 1.00:1 on the Light
                     Sage sections the homepage buttons stand on, and 1.22:1
                     on this panel's near-white — see BlobButton.module.css. */
                  tone="sage"
                  className="mt-6 w-fit min-h-[3.25rem] px-7"
                >
                  Book a private event
                </BlobButton>
              </div>

              {/*
                BUILT LIKE THE EXPERIENCES PANEL'S ROWS, at the client's ask.

                Three cards across the field were the wrong answer twice over:
                they made this panel a different kind of thing from the one
                beside it in the same bar, and a card the width of a third of
                the screen is a poster, not a way of choosing. The Experiences
                menu has always shown a programme as one quiet row — a small
                photograph, the name, what it is — and the client's note was
                that this should read the same way.

                So each programme is a row on three aligned tracks: the picture,
                then the name in a track wide enough for the longest of them,
                then its line. The three names start on the same x and the three
                lines start on the same x, which is what lets the eye go down
                the list instead of reading three separate objects.

                NO RULES ANYWHERE BETWEEN THEM. The Experiences rows have none
                either — the one hairline in that panel is under a group
                heading, not between links. What separates these is the air
                around them and the White Rock that comes up under a pointer.

                The thumbnail is 64px rather than that panel's 48: three rows
                have room where eight do not, and it is the size at which these
                photographs still show what is in them.
              */}
              <ul className="col-span-12 flex flex-col lg:col-span-9 xl:col-span-8">
                {items.map((audience, i) => (
                  <li key={audience.slug} className={cn(RISE, riseState)} style={rise(i + 1) as Vars}>
                    <Link
                      href={`${href}#${audience.slug}`}
                      onClick={closeNow}
                      className="group -mx-2 flex items-center gap-4 rounded-sm px-2 py-3.5 transition-colors duration-300 ease-soft hover:bg-cream/70"
                    >
                      <span className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-cream">
                        {audience.image ? (
                          <Image
                            src={audience.image.src}
                            alt=""
                            fill
                            sizes="64px"
                            style={{ objectPosition: audience.image.position ?? "50% 50%" }}
                            className="object-cover transition-transform duration-700 ease-editorial motion-safe:group-hover:scale-110"
                          />
                        ) : audience.mark ? (
                          <span className="flex size-full items-center justify-center">
                            {/* Drawn in as the panel opens, one after the
                                next — see <DoodleMark>. */}
                            <DoodleMark
                              name={audience.mark.name}
                              color={audience.mark.color}
                              on={isOpen}
                              delay={120 + i * 90}
                              className="size-7"
                            />
                          </span>
                        ) : null}
                      </span>
                      {/*
                        The name's track is 12rem — "School programmes", the
                        longest of the three, sets at 176px at `--text-body`, so
                        the track holds it without wrapping and without leaving
                        a gutter wide enough to read as a table column. Below
                        `lg` the panel is not on screen at all, but the two
                        stack there rather than squeezing.
                      */}
                      <span className="min-w-0 flex-1 lg:flex lg:items-baseline lg:gap-6">
                        <span className="block text-body font-medium leading-snug text-text transition-colors duration-300 ease-soft group-hover:text-primary lg:w-48 lg:shrink-0">
                          {audience.name}
                        </span>
                        <span className="mt-1 block max-w-[52ch] text-fine leading-[1.55] text-text/80 lg:mt-0">
                          {audience.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
