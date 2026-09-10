import Link from "next/link";
import { Fragment } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { CONTACT, PLAN_YOUR_VISIT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NavItem, VisitStep } from "@/types";

/**
 * The invitation's type. Sized per breakpoint rather than with one viewport
 * clamp, because the line sits in a full-width well on a phone and a
 * seven-column one from `lg` up — two different measures, not one that scales.
 * "COME MAKE" is the widest of the three lines by a hair — 699px against
 * "SOMETHING"'s 689 at a 1990 window — and is what sets the ceiling. All three
 * have to hold on one line at every width, without hyphenation.
 *
 * Deliberately a step below the philosophy statement above it. That section is
 * the crescendo of the page and keeps the largest type on it; this one is the
 * quiet word afterwards, and the scale has to say which is which. At 1990 that
 * is 115px against the philosophy's 135px — close enough to read as the same
 * voice, far enough apart to read as the quieter half of it.
 *
 * Past `xl` it hands over to the viewport, because the page carries no ceiling
 * any more and the measure keeps widening with the display. At a fixed 4rem
 * the widest line held 400px of ink in a 935px column on a 1990 window, which
 * is what made the section read as mostly empty: the invitation was not small,
 * it had simply stopped growing while the room around it did not. 5.8vw picks
 * up where the 4rem step left off, and the cap stops it on a wall display.
 *
 * The gain is vertical as much as horizontal. Three lines at 115px stand about
 * 145px taller than three at 64px, which is most of the 301px hole that used
 * to sit between the signature and the foot band — the left column was short
 * against the right, and the hole was the difference.
 */
const INVITATION_LINE =
  "block font-light uppercase leading-[0.96] tracking-[-0.02em] " +
  "text-[2rem] xs:text-[2.3rem] sm:text-[2.75rem] md:text-[3rem] lg:text-[3.4rem] " +
  "xl:text-[min(5.8vw,7rem)]";

/**
 * Where each step hangs, written out per step rather than derived.
 *
 * The three used to descend, each starting lower than the last, so the run
 * read as a path walked; at `xl` they also narrowed to three columns with the
 * gaps widening as they fell. On a wide screen that put the last step at
 * column ten with a seven-hundred-pixel hole in front of it, and left three
 * one-line entries scattered across a band three hundred pixels deep. The
 * stagger was there to stop the run reading as a row of cards. It is not what
 * was doing that work — there is no border, no ground and no box anywhere in
 * the band, and the rule the whole run hangs from is what makes it an index
 * rather than three panels.
 *
 * So they share a top edge now and take an even third of the measure each.
 * A fourth step wraps to a second row, which extends the run rather than
 * breaking it.
 *
 * Every breakpoint that sets a span restates its start, and it has to. Tailwind
 * compiles `col-span-*` to the `grid-column` shorthand, which resets
 * `grid-column-start` along with everything else in it — so a later span lands
 * after every earlier rule in the stylesheet and quietly throws that
 * breakpoint's start away, leaving the step to be auto-placed against whatever
 * sits before it. A start is only safe on the breakpoint that last set the span.
 */
const STEP_PLACEMENT = [
  "col-span-12 md:col-span-4 md:col-start-1",
  "col-span-12 mt-10 md:col-span-4 md:col-start-5 md:mt-0",
  "col-span-12 mt-10 md:col-span-4 md:col-start-9 md:mt-0",
];

/**
 * Homepage section 09 — plan your visit.
 *
 * The page's last move, and the only one that asks the visitor for anything.
 * Everything above has shown the place, the programme and the reason it
 * exists; this says come, and gives exactly one way to do it.
 *
 * It has to differ from the philosophy section it follows without raising its
 * voice, and it does that on five counts rather than by shouting: a warm
 * neutral ground where that one is a field of Deep Lilac, the terracotta-dash
 * masthead instead of its full-measure rule, a smaller statement, a spread
 * instead of a diagonal — the invitation anchored hard left, the next step
 * held far right and dropped to meet its last line — and a band of type along
 * the foot that the pause above has no equivalent of.
 *
 * White Rock is doing real work here rather than just alternating. The section
 * before it is the loudest colour on the page, and this is the exhale after
 * it: the same warmth the brand introduction opened on, so the page closes on
 * the ground it began with.
 *
 * No photograph. The brief allows one, and every atmospheric plate the project
 * holds is already hanging further up this same page — a second showing of one
 * of them here would be decoration, and the invitation wants the quiet. What
 * carries the section instead is the space around three lines of type and the
 * one marked action inside it.
 *
 * TODO(client): the one photograph that would earn a place here is the studio
 * door, or a table with people already at it — the destination rather than the
 * making, which every section above has covered. If it arrives, hang it off
 * the right of the invitation and above the steps, and keep it narrow: it is
 * there to say where the visitor is going, not to fill the section.
 *
 * Nothing here is a form, a date picker or a card. The conversion is a
 * sentence, a link, and three short lines saying what happens next.
 *
 * Server component; every animation lives in the client components it
 * composes.
 */
export function PlanYourVisit() {
  const { eyebrow, title, signature, description, primaryCta, secondaryCta, steps } =
    PLAN_YOUR_VISIT;

  return (
    <section
      aria-labelledby="plan-your-visit-heading"
      className="bg-cream py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        {/*
          The house masthead — a terracotta rule and a label. The philosophy
          section above opens on a rule across the whole measure instead, which
          is what keeps two quiet, typographic sections from reading as twins.
        */}
        <Reveal>
          <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            {eyebrow}
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-12 gap-x-6 md:mt-16 lg:mt-20 lg:gap-x-10">
          {/* ---------- The invitation, anchored to the left edge ---------- */}
          <div className="col-span-12 lg:col-span-6">
            <h2 id="plan-your-visit-heading">
              {/*
                One trigger, three lines, each rising from behind its own mask.
                Rendered as a <span> rather than the default <div> because the
                content model of a heading is phrasing content; the utility
                makes it a block, so the layout is identical.
              */}
              <Stagger as="span" className="block">
                {title.map((line, i) => (
                  <Fragment key={line}>
                    {/*
                      An explicit space between the lines. They are block-level
                      and give no word boundary of their own, so without it the
                      accessible name reads as one run-on word rather than as
                      "Come make something with us.".
                    */}
                    {i > 0 ? " " : null}
                    <InvitationLine>{line}</InvitationLine>
                  </Fragment>
                ))}
              </Stagger>
            </h2>

            {/*
              The section's one flourish, and it is a signature rather than a
              heading: the invitation above it is signed, and the script face
              appears nowhere else here. Indented so it sits between the
              statement's left edge and the action held out on the right,
              carrying the eye across.
            */}
            {signature ? (
              <Reveal variant="fadeIn" delay={0.5}>
                <p className="ml-1 mt-8 font-display text-[1.75rem] leading-none tracking-normal text-primary md:ml-[10%] md:mt-9 md:text-[2rem] lg:ml-[12%] lg:text-[2.25rem]">
                  {signature}
                </p>
              </Reveal>
            ) : null}
          </div>

          {/*
            ---------- The next step, held out on the right --------------

            Dropped by a large top margin at `lg` rather than bottom-aligned
            with the column beside it: the invitation is three lines of display
            type and this is a paragraph and two links, so an alignment rule
            would settle where they meet on whichever of them happened to be
            taller. The margin puts the description against the statement's
            last line and keeps it there.
          */}
          <div className="col-span-12 mt-14 md:col-span-8 md:col-start-5 md:mt-16 lg:col-span-5 lg:col-start-8 lg:mt-20">
            <Reveal delay={0.15}>
              {/*
                A measure, not the full column. `lg:max-w-none` let this run
                the width of its five columns, which on a 1990 window is 772px
                — about 96 characters a line, well past where a line stops
                being comfortable to track. It is capped rather than the column
                narrowed, so the links and the address below keep their width.
              */}
              <p className="max-w-[26rem] text-[0.95rem] leading-[1.85] text-text/80 md:text-base lg:max-w-[34rem]">
                {description}
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-10 md:mt-12">
                <InvitationLink item={primaryCta} tone="primary" />
              </div>
            </Reveal>

            {secondaryCta ? (
              <Reveal variant="fadeIn" delay={0.42}>
                <div className="mt-7 md:mt-8">
                  <InvitationLink item={secondaryCta} tone="quiet" />
                </div>
              </Reveal>
            ) : null}

            {/*
              Where the studio is. The section is called Plan Your Visit and
              never said — which is both the plainest thing a visitor wants
              here and the reason the column had nothing holding its foot. It
              reads {@link CONTACT}, so it fills itself in as the client
              supplies an email and a phone number rather than needing to be
              written again.
            */}
            <Reveal variant="fadeIn" delay={0.54}>
              <address className="mt-12 border-t border-text/15 pt-7 not-italic md:mt-14">
                <span className="block text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/70">
                  The Studio
                </span>
                <span className="mt-3 block text-[0.9rem] leading-[1.8] text-text/85">
                  {CONTACT.addressLines.join(", ")}
                </span>
                {CONTACT.email ? (
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="mt-2 inline-block text-[0.9rem] text-text/85 underline decoration-primary/40 underline-offset-4 transition-colors duration-300 ease-soft hover:decoration-primary"
                  >
                    {CONTACT.email}
                  </a>
                ) : null}
              </address>
            </Reveal>
          </div>
        </div>

        <Steps steps={steps} />
      </Container>
    </section>
  );
}

/** One masked line of the invitation. The mask needs its own overflow parent. */
function InvitationLine({ children }: { children: string }) {
  return (
    // The padding keeps descenders off the mask edge; the negative margin takes
    // the same amount back out of the line rhythm.
    <span className="block overflow-hidden pb-[0.12em] [&+span]:-mt-[0.12em]">
      <Reveal as="span" variant="maskUp" className={INVITATION_LINE}>
        {children}
      </Reveal>
    </span>
  );
}

/**
 * What happens after the link, set along the foot of the section like
 * footnotes under an article.
 *
 * An ordered list, because the order is the content — which also means the
 * printed numerals are decoration and are hidden from assistive technology
 * rather than read out on top of "item 1 of 3". They are set large and soft
 * for the same reason: they are the band's only visual weight, and the step's
 * name is the thing that has to be legible.
 */
function Steps({ steps }: { steps: readonly VisitStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="mt-20 border-t border-text/15 pt-12 md:mt-24 md:pt-14 lg:mt-28">
      <Stagger as="ol" className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
        {steps.map((step, i) => (
          <Reveal
            key={step.number}
            as="li"
            className={cn(STEP_PLACEMENT[i % STEP_PLACEMENT.length])}
          >
            {/*
              Set large and light so the band has weight without the numeral
              ever competing with the name beside it — but not set faint. At
              this size it is large text, and a tint light enough to read as
              a watermark (35% was the first try) lands near 1.6:1, well under
              the 3:1 it owes. Three-quarter strength keeps it a tint and
              clears the ratio; the hierarchy is carried by size and weight,
              which cost nothing in contrast.
            */}
            <p
              aria-hidden
              className="text-[2.4rem] font-light leading-none tracking-[-0.02em] text-primary/80 md:text-[2.6rem] lg:text-[3rem] xl:text-[3.6rem]"
            >
              {step.number}
            </p>

            <h3 className="mt-5 text-[0.72rem] font-medium uppercase tracking-eyebrow text-text md:mt-6 md:text-[0.78rem]">
              {step.name}
            </h3>

            <p className="mt-3 max-w-[20rem] text-[0.85rem] leading-[1.75] text-text/85 md:mt-4 xl:max-w-[24rem]">
              {step.detail}
            </p>
          </Reveal>
        ))}
      </Stagger>
    </div>
  );
}

interface InvitationLinkProps {
  item: NavItem;
  /** "primary" is the one dominant action on the page; "quiet" sits under it. */
  tone: "primary" | "quiet";
}

/**
 * The call to action, as a line of type rather than a button.
 *
 * The label is Charcoal Slate and the marking is Deep Lilac — the rule under
 * it, and the rule that sweeps across on hover. It was lilac type until the
 * ground here became White Rock, where Deep Lilac measures 3.95:1 and a label
 * at this size owes 4.5:1. Moving the colour from the letterforms onto the
 * rule keeps the accent doing the same job: a rule is a graphical mark and
 * owes 3:1, which lilac clears, while the words themselves rise to 9.36:1.
 *
 * A rule already sits under the label at rest, so the link reads as a link
 * before anything is hovered; a second rule in full strength is what extends
 * across it on hover and focus. That extension is deliberately *not* gated
 * behind `motion-safe`. Under `prefers-reduced-motion` the global rule in
 * globals.css collapses its duration, so the underline snaps rather than
 * sweeps — a state change with no perceived motion, which is what that setting
 * asks for. Gating it instead would leave a visitor on reduced motion hovering
 * a link that answers with nothing at all. The arrow's drift is decoration
 * with no state behind it, so that one is gated in the usual way.
 *
 * Both responses fire on `group-focus-visible` as well as `group-hover`, so a
 * keyboard visitor sees exactly what a pointer one does.
 */
function InvitationLink({ item, tone }: InvitationLinkProps) {
  const primary = tone === "primary";
  const externalProps = item.external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={item.href}
      {...externalProps}
      className={cn(
        "group inline-flex items-baseline gap-3 font-medium uppercase tracking-eyebrow",
        primary
          ? "text-[0.85rem] text-text md:text-[0.95rem]"
          : "text-[0.7rem] text-text/85 transition-colors duration-300 ease-soft hover:text-text",
      )}
    >
      <span className={cn("relative", primary ? "pb-2.5" : "pb-1.5")}>
        {item.label}
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-0 bottom-0 h-px",
            primary ? "bg-primary/45" : "bg-text/25",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 ease-editorial",
            "group-hover:scale-x-100 group-focus-visible:scale-x-100",
            primary ? "bg-primary" : "bg-text/60",
          )}
        />
      </span>

      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}
