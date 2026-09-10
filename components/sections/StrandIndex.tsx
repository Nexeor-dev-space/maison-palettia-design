"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { Discipline } from "@/types";

/**
 * The strand name — the largest type in the section, and deliberately larger
 * than the heading above it. An index whose entries are smaller than its title
 * is a table of contents; one where the entries dominate is the content.
 *
 * The names are short — six characters at the longest — so this can be set far
 * bigger than a line of running text ever could.
 */
const NAME =
  "font-light uppercase leading-[0.95] tracking-[-0.02em] " +
  "text-[2.6rem] xs:text-[3rem] sm:text-[3.6rem] lg:text-[3.4rem] xl:text-[4.2rem] 2xl:text-[4.8rem]";

/**
 * The band, in viewport terms, that decides which strand is showing. A strip
 * across the middle of the window: whichever row crosses it owns the doorway.
 */
const ACTIVE_BAND = { rootMargin: "-46% 0px -46% 0px", threshold: 0 } as const;

interface StrandIndexProps {
  disciplines: Discipline[];
}

/**
 * The index: four ways in, seen through one doorway.
 *
 * The strands run down the left as a numbered list and the photographs do not
 * travel with them — a single arched window holds at the right and changes
 * what is behind it as each strand comes level. The arch is the Maison's own
 * entrance (see the `arch` utility), which is the whole reason the section is
 * built this way round: these are doors, so there is one door, and the reader
 * scrolls the building past it rather than being handed four pictures.
 *
 * Below `lg` there is no second column to hold still, so the window is dropped
 * and each strand carries its own plate. The list stops being an index and
 * becomes a sequence, which is what a single narrow column can actually be.
 *
 * The active strand is found with an IntersectionObserver over a thin band
 * across the middle of the window rather than by measuring scroll offsets on
 * every frame. It costs nothing while the section is off screen, it needs no
 * knowledge of the page above it, and it stays correct when the smoothed
 * scroll overshoots and settles back.
 */
export function StrandIndex({ disciplines }: StrandIndexProps) {
  const [inBand, setInBand] = useState(0);
  /**
   * The strand the reader is pointing at or has tabbed to, if any.
   *
   * Held apart from the scrolled state rather than folded into it, so that
   * leaving a row restores whatever the scroll position says is current
   * instead of stranding the window on the last thing touched. A pointer that
   * wanders across the list and off it leaves the section exactly as it found
   * it.
   */
  const [previewed, setPreviewed] = useState<number | null>(null);
  const active = previewed ?? inBand;
  const rows = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const nodes = rows.current.filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        // Only ever promoted on entry. Nothing is demoted, so the last strand
        // to cross the band keeps the window at the two ends of the section,
        // where no row is in it at all.
        if (entry.isIntersecting) {
          const i = nodes.indexOf(entry.target as HTMLElement);
          if (i !== -1) setInBand(i);
        }
      }
    }, ACTIVE_BAND);

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [disciplines.length]);

  return (
    <div className="mt-16 grid grid-cols-12 gap-x-6 md:mt-20 lg:mt-24 lg:gap-x-12">
      {/* ---- The list ------------------------------------------------- */}
      <ol className="col-span-12 lg:col-span-7">
        {disciplines.map((discipline, i) => (
          <Strand
            key={discipline.slug}
            ref={(node) => {
              rows.current[i] = node;
            }}
            discipline={discipline}
            index={i + 1}
            isActive={i === active}
            onPreview={(on) => setPreviewed(on ? i : null)}
          />
        ))}
      </ol>

      {/* ---- The doorway ----------------------------------------------- */}
      <div className="col-span-12 hidden lg:col-span-5 lg:block">
        {/*
          Held clear of the sticky header rather than at the top of the window,
          so the arch has air above it and never sits under the bar.
        */}
        <div className="sticky top-[7.5rem]">
          <div
            className="arch relative w-full overflow-hidden bg-text/5"
            style={{ height: "clamp(22rem, 60vh, 36rem)" }}
          >
            {disciplines.map((discipline, i) => (
              <Image
                key={discipline.slug}
                src={discipline.image.src}
                alt={discipline.image.alt}
                fill
                sizes="(min-width: 64rem) 42vw, 1px"
                className={cn(
                  // The swap is a cross-fade with the incoming plate settling
                  // out of a slight enlargement — the same gesture the rest of
                  // the site uses when a photograph arrives, borrowed here so
                  // the change reads as the picture being placed rather than
                  // as a slideshow advancing.
                  "object-cover transition-[opacity,transform] duration-[900ms] ease-editorial",
                  i === active ? "scale-100 opacity-100" : "scale-[1.05] opacity-0",
                )}
              />
            ))}
          </div>

          <p className="mt-5 flex items-center gap-4 text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/85">
            <span aria-hidden className="h-px w-6 shrink-0 bg-primary" />
            {String(active + 1).padStart(2, "0")} / {String(disciplines.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StrandProps {
  discipline: Discipline;
  index: number;
  isActive: boolean;
  /** Called with true when the row is pointed at or focused, false on leaving. */
  onPreview: (on: boolean) => void;
  ref: (node: HTMLElement | null) => void;
}

/**
 * One entry in the index.
 *
 * The active state is carried by a band of Soft Lavender laid across the row,
 * with the rule drawing over its head and the name coming up to full strength
 * inside it.
 *
 * The band is doing a specific job, and it is not decoration. The photograph
 * beside the list belongs to exactly one of these rows and there is nothing
 * else on screen to say which — an earlier version marked the active row with
 * a coloured numeral and thirty per cent of opacity on the name, and at arm's
 * length the two rows looked identical, so the window read as a picture that
 * happened to be there rather than as this row's picture. A field of colour is
 * the one signal large enough to be seen at the same time as the thing it is
 * pointing at.
 *
 * Dimming the others instead is the obvious alternative and it is unusable:
 * the name is the link, and charcoal faint enough to read as "off" against
 * Light Sage falls under the contrast a link owes. The inactive name is held
 * at 70% — measured at 3.9:1, clear of the 3:1 large text is owed — and the
 * work is done by the band instead.
 *
 * Ink on the band is charcoal throughout, at 7.4:1. Deep Lilac is the
 * section's accent everywhere else and it cannot come along here: on Soft
 * Lavender it measures 2.7:1, under the 3:1 even a graphical mark owes. The
 * lilac keeps the hairline at the top of the row, where it is a mark rather
 * than something being read, and clears 3:1 against the band at full strength.
 */
function Strand({ discipline, index, isActive, onPreview, ref }: StrandProps) {
  return (
    <li>
      <article
        ref={ref}
        /*
          Pointing at a row takes the doorway, overriding the scroll position
          for as long as the pointer is on it. Rows abut with no gap between
          them, so crossing from one to the next fires leave-then-enter and the
          window changes once rather than flickering back through the scrolled
          state on the way.

          Touch is excluded deliberately: a tap emits a synthetic enter on the
          way to the link, which would swap the plate for the instant before
          the page navigates away. There is no hover on a touch screen and the
          window below `lg` is not rendered at all, so there is nothing to do.

          Focus is wired to the same handler — React's onFocus/onBlur ride
          focusin/focusout, which bubble from the link inside — so tabbing
          through the index drives the window exactly as pointing does, and a
          keyboard reader is never shown a photograph belonging to a different
          strand than the one they are on.
        */
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") onPreview(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch") onPreview(false);
        }}
        onFocus={() => onPreview(true)}
        onBlur={() => onPreview(false)}
        className={cn(
          "group relative border-t border-text/20 py-10 md:py-12 lg:py-14",
          /*
            The row is widened past the measure and pulled back by the same
            amount, so the type stays exactly where it was and everything that
            spans the row — the hairline above it, the rule that draws over
            that hairline, and the band itself — comes out one width.

            That is the whole reason the band is the row's own background here
            rather than a layer floating behind it. As a layer it could bleed
            on its own, and it did: the colour ran a clean sixteen pixels wider
            than the two rules at the top of it, which at a glance read as a
            misaligned box rather than as a band.

            The bleed is small on purpose — it is air between the colour's edge
            and the word, not a gesture. An earlier version bled it by the
            width of the page gutter, which at the common desktop widths put
            the edge a pixel off the screen and made it look like a deliberate
            full-bleed band, then sat it a hundred pixels inside the screen the
            moment the measure hit its cap and the container began centring.
          */
          "-mx-3 px-3 lg:-mx-4 lg:px-4",
          // Fades rather than wipes. The rule at the top wipes, and two
          // different gestures on the same edge at once read as a glitch.
          "transition-colors duration-500 ease-soft",
          isActive && "bg-lavender/60",
        )}
      >
        {/*
          The active rule, drawn over the hairline rather than replacing it, so
          nothing in the row's height changes as it becomes active.
        */}
        <span
          aria-hidden
          className={cn(
            "absolute left-0 top-0 h-px bg-primary transition-[width] duration-700 ease-editorial",
            isActive ? "w-full" : "w-0",
          )}
        />

        <Reveal variant="fadeIn">
          {/*
            The numeral sits over the name rather than beside it. Set against
            type this large it has no baseline worth sharing — aligned to one
            it reads as a stray mark a long way from the word it belongs to —
            and above, it belongs to the rule instead, which is what a folio
            does on a page.
          */}
          <p
            className={cn(
              "text-[0.62rem] font-medium uppercase tracking-eyebrow transition-colors duration-500 ease-soft",
              // Charcoal on the band. Lilac at eleven pixels measures 2.7:1
              // there and 3.8:1 on the bare sage — under the 4.5:1 text this
              // size owes on either ground.
              isActive ? "text-text" : "text-text/85",
            )}
          >
            {String(index).padStart(2, "0")}
          </p>

          <div className="mt-5 md:mt-6">
            <h3
              className={cn(
                NAME,
                "transition-colors duration-500 ease-soft",
                isActive ? "text-text" : "text-text/70",
              )}
            >
              <Link
                href={discipline.href}
                aria-label={`${discipline.name} — explore ${discipline.name.toLowerCase()} experiences`}
                // Stretched across the whole row, so the plate on a phone and
                // the arrow are both live while the tab order gains exactly
                // one well-named stop per strand.
                className="after:absolute after:inset-0"
              >
                {discipline.name}
              </Link>
            </h3>
          </div>
        </Reveal>

        {/*
          The plate, on the narrow layout only. Above `lg` the doorway holds
          every photograph and this would be the same picture twice.
        */}
        <div className="mt-7 lg:hidden">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-text/5 xs:aspect-[3/2]">
            <Reveal variant="imageReveal" className="absolute inset-0">
              <Image
                src={discipline.image.src}
                alt={discipline.image.alt}
                fill
                sizes="(min-width: 64rem) 1px, calc(100vw - 2 * max(1.25rem, 2vw))"
                className="object-cover"
              />
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.08}>
          <p className="mt-7 max-w-[26rem] text-[0.95rem] leading-[1.8] text-text/80 md:mt-8">
            {discipline.description}
          </p>

          {/*
            Not a link: the row already has one, stretched across it, and a
            second anchor to the same place would double every strand in the
            tab order for nothing.
          */}
          {/*
            Charcoal, not Deep Lilac. The lilac is the section's accent and it
            reads beautifully here, but on Light Sage it measures 3.83:1 —
            which clears the 3:1 that display type owes and fails the 4.5:1
            owed at eleven pixels. The same constraint <Signature> is built
            around. The lilac stays on the rule and the arrow, where it is
            decoration rather than the thing being read.
          */}
          <span
            aria-hidden
            className="mt-6 flex w-fit items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-eyebrow text-text"
          >
            <span className="border-b border-primary/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-primary group-focus-within:border-primary">
              Explore {discipline.name}
            </span>
            <span className="text-primary transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1 motion-safe:group-focus-within:translate-x-1">
              &#8594;
            </span>
          </span>
        </Reveal>
      </article>
    </li>
  );
}
