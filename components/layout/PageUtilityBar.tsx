import Link from "next/link";

import { INK } from "@/components/sections/hero/composition";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { Eyebrow } from "@/components/ui/SectionHeader";
import type { NavItem } from "@/types";

export interface PageUtilityBarProps {
  /** One short line of orientation. Optional; the bar is fine without it. */
  note?: string;
  /** Existing routes only. Never a booking or payment action — see below. */
  links: NavItem[];
}

const HEADING_ID = "page-utility-heading";

/**
 * The closing panel at the foot of a page, between the content and the footer.
 *
 * WHAT IT IS FOR. Two pages ask a visitor to commit — the event page and
 * checkout — and on both of them the useful secondary questions ("what else is
 * on?", "who do I ask?", "what happened to my last booking?") have nowhere to
 * go, because answering them in the page body would compete with the thing the
 * page is for. This is where they go: after the decision, before the footer.
 *
 * WHAT IT IS NOT. It never carries a booking or payment action. Both host
 * pages already have exactly one primary action each — <EventBookingBar> and
 * the checkout's own submit — and a second one here would be the page arguing
 * with itself at the last moment. Everything in it is a quiet link.
 *
 * NOT STICKY, DELIBERATELY. It sits in the page's normal flow. The event page
 * already has a floating bar that retracts at a sentinel so it never meets the
 * fixed footer behind it; a second pinned element would reintroduce exactly
 * the collision that mechanism exists to avoid, and on checkout it would hover
 * over a form someone is trying to fill in.
 *
 * DEEP LILAC, AT THE CLIENT'S ASK — the same closing field the About page and
 * the home page end on. It took the footer's own Light Sage at 45%, which made
 * it the palest band on a page that had just been asking someone to commit:
 * pale type on pale ground, immediately above a pale footer, and the three
 * links in it read as a caption rather than as a way on.
 *
 * ==========================================================================
 * A PANEL, NOT A STRIP — AND THE HEIGHT WAS NOT THE PROBLEM
 * ==========================================================================
 *
 * The client's note was that this "looks very thin", and padding alone would
 * not have answered it. The band was ONE ROW: a sentence on the left and three
 * caption-sized links on the right, set at the smallest size in the scale. A
 * row is thin however much air is put above and below it, and this one sits
 * directly over a footer with four headed columns and a logo in it — so it
 * read as a rule between two sections rather than as a section.
 *
 * So it has the parts a section has. A HEADING, which is the `aria-label` this
 * already carried made visible rather than new copy — the accessible name has
 * not changed, it is simply something you can now see. THE NOTE AT LEAD SIZE,
 * because it is the last reassurance before someone books and it was set at
 * 13px. AND THE LINKS AS RULED ROWS rather than a caption: full width of their
 * column, the arrow carried out to the right edge, each one its own press.
 *
 * The two halves sit side by side at `lg` and stack below it, which keeps the
 * original left-right relationship at the width it was drawn for.
 */
export function PageUtilityBar({ note, links }: PageUtilityBarProps) {
  if (links.length === 0) return null;

  return (
    // Full-bleed: the gutter is rebuilt inside by <Container>, so the band
    // runs edge to edge the way the footer under it does.
    <section
      aria-labelledby={HEADING_ID}
      /*
        `relative isolate` for the marks below, and `overflow-clip` rather than
        `overflow-hidden` to keep them: `hidden` makes a scroll container, and
        a scroll container is what stops <DoodleMark>'s draw ever filling for a
        mark inside it.
      */
      /*
        THE BOTTOM PADDING IS NOT THE TOP PADDING, AND IT IS THE FOOTER'S
        NUMBER. <FooterWave> paints upward out of the footer's own top edge —
        2.75rem of amplitude, 3.5 at md and 4.5 at lg — so whatever this panel
        pays at the bottom, the wave takes the last 72px of it. At the old
        `py-14` the crest was about 8px under the last rule, which is why the
        band looked like it was being swallowed rather than arriving at
        something.

        Each step is the wave's height at that breakpoint PLUS the padding
        above, so the clear ground under the last rule matches the clear ground
        over the heading and the wave is extra rather than borrowed. Too much
        more and the panel goes bottom-heavy: at 10rem there was 100px of empty
        lilac under the rules before the crest even started.
      */
      className="relative isolate -mx-gutter mt-16 overflow-clip bg-primary pt-14 pb-24 md:mt-20 md:pt-24 md:pb-32 lg:pb-36"
    >
      {/*
        SOFT LAVENDER, BOTH OF THEM — the same colour and the same corner the
        About page's close puts one in. Terracotta is 2.0:1 on this ground and
        Deep Lilac is the ground, so the palette's choices here are lavender,
        White Rock and Light Sage; the close uses lavender, and two closing
        fields in a row should not disagree about it.

        Each crosses an edge rather than floating inside the field, which is
        the deck's standing rule for a cut-out, and each sits where the panel
        has no type: they ride the top corners, above the heading on one side
        and above the first rule on the other. The marks are decorative in both
        cases — everything this panel says is said by its words.

        BOTH ON THE TOP EDGE, BECAUSE THE BOTTOM ONE IS NOT THE PANEL'S. The
        second mark started at the foot and the footer's wave ate it: what was
        left read as a lavender smudge under the note rather than as a cut-out.
        The bottom edge of this band belongs to the wave.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-5 -top-9 hidden w-[4.5rem] -rotate-12 md:block"
      >
        <DoodleMark name="starburst" color={INK.lavender} treatment="draw" delay={260} />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-7 right-[6%] hidden w-[5.5rem] rotate-[18deg] lg:block"
      >
        <DoodleMark name="bean" color={INK.lavender} treatment="draw" delay={420} />
      </span>

      <Container>
        <div className="mx-auto grid max-w-site grid-cols-12 gap-x-6 gap-y-10 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-6 lg:self-center">
            {/*
              `as="h2"` and an id, so `aria-labelledby` has something real to
              point at — the pattern <Eyebrow> documents for a section whose
              content is a list rather than a statement, which is exactly what
              this is. `ground="lilac"` is the measured pairing: the near-white
              `surface` at 4.90:1 with a Light Sage rule.
            */}
            <Eyebrow ground="lilac" as="h2" id={HEADING_ID}>
              More from Maison Palettia
            </Eyebrow>

            {/* `text-lead`, not `text-fine`. This is the reassurance a visitor
                reads before deciding to book — "everything is provided, no
                experience needed" — and it was set at 13px, the smallest size
                in the scale and the one meant for legal notes and captions.
                The client has said three times now that copy on this site is
                set too small. */}
            {note ? (
              <p className="mt-7 max-w-[34ch] text-lead leading-[1.5] tracking-[-0.01em] text-surface md:mt-8">
                {note}
              </p>
            ) : null}
          </div>

          <ul className="col-span-12 border-t border-surface/25 lg:col-span-5 lg:col-start-8 lg:self-center">
            {links.map((item) => (
              <li key={item.href} className="border-b border-surface/25">
                <Link
                  href={item.href}
                  /*
                    THE WHOLE ROW IS THE TARGET, which is the difference
                    between a list of links and a list of destinations. It was
                    an inline word with an underline about 90px wide; a row is
                    the full column and 56px tall, so it clears the 44px
                    minimum on a phone without a hit area drawn around it.

                    The wash is pulled out by the row's own padding so it fills
                    the column edge to edge rather than stopping at the words.
                  */
                  className="group -mx-4 flex items-center justify-between gap-6 px-4 py-5 text-action font-semibold uppercase tracking-[0.12em] text-surface transition-colors duration-300 ease-soft hover:bg-surface/10 md:py-6"
                >
                  <span>{item.label}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-lead leading-none transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                  >
                    &#8594;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
