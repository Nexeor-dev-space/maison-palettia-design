import Link from "next/link";
import { Fragment } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { CONTACT, PLAN_YOUR_VISIT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

/**
 * The invitation's type. Sized per breakpoint rather than with one viewport
 * clamp, because the line sits in a full-width well on a phone and a
 * seven-column one from `lg` up — two different measures, not one that scales.
 * "SOMETHING" is the widest of the three lines and is what sets the ceiling;
 * all three have to hold on one line at every width, without hyphenation.
 *
 * Deliberately a step below the philosophy statement above it. That section is
 * the crescendo of the page and keeps the largest type on it; this one is the
 * quiet word afterwards, and the scale has to say which is which.
 *
 * It grew when the statement gained a column. The invitation used to share the
 * measure six-and-five with a rail of five stacked links; it now runs seven
 * against a single action, so the same three lines have about 130px more room
 * and take it.
 */
const INVITATION_LINE =
  "block font-light uppercase leading-[0.94] tracking-[-0.02em] " +
  "text-[2.1rem] xs:text-[2.5rem] sm:text-[3rem] md:text-[3.4rem] lg:text-[3.9rem] " +
  "xl:text-[min(6.4vw,7.5rem)]";

/** The label on every foot-rail entry. One class, so the three cannot drift. */
const RAIL_LABEL = "text-label font-medium uppercase tracking-eyebrow text-text/80";

/**
 * Homepage section 09 — plan your visit.
 *
 * The page's last move, and the only one that asks the visitor for anything.
 * Everything above has shown the place, the programme and the reason it
 * exists; this says come, and gives exactly one way to do it.
 *
 * ==========================================================================
 * WHAT THIS REPLACES, AND WHY — measured at 1440x900 before it was touched
 * ==========================================================================
 *
 * The section was an invitation on the left, a rail of five stacked items on
 * the right, and a band of three numbered steps along the foot. Four things
 * were wrong with it and three of them were holes:
 *
 *   A 159px DEAD GUTTER down the middle. The grid ran six columns, skipped a
 *   whole column, then five. Nothing bridged it at any width.
 *
 *   A 285px HOLE UNDER THE SIGNATURE. The two columns both ended at 728px, but
 *   the left one ran out of content at the script line and the right kept
 *   going to the address. Air beside a large statement reads as composition;
 *   the same air under a small script line reads as a mistake.
 *
 *   A 169px TAIL between the columns and the steps rule.
 *
 *   A RAIL OF FIVE THINGS in four type treatments — paragraph, marked link,
 *   quiet link, sentence-with-link, address block — stacked with no grouping.
 *   It read as a sitemap, and the one action the page actually wants was the
 *   same size as everything around it.
 *
 * And the largest type on screen carried the least information while the ask
 * was the smallest thing in the section, which is the hierarchy upside down.
 *
 * THE STEPS STAY GONE — RE-CHECKED THIS PASS, AND THE OLD REASON WAS WRONG.
 * This paragraph used to say <HowItWorks /> already ran on this page, section
 * 04, "We come to you", with Choose, Book, Come by and Create set out a
 * sentence each, so keeping the steps here too would tell a visitor the same
 * thing twice. It does not run here: app/page.tsx mounts Hero, UpcomingEvents,
 * CreativeExperiences, MallPartners, AboutTeaser, Gallery, HomeFaq,
 * Testimonials and this section, nothing else, and its own comment says why —
 * <HowItWorks /> "moved to /about" a pass before this one. /private-events and
 * /loyalty each define their own page-local "HowItWorks", not this component,
 * so neither of those is "this page" either.
 *
 * The steps were therefore never actually said twice on the homepage, and
 * "leaves the fuller version standing where a visitor meets it before they
 * need it" was describing a page that is not this one. The removal still
 * holds, on a narrower and truer reason: a closing section is the wrong place
 * to explain a process for the first time, regardless of whether it is
 * explained anywhere else on the same page. By the time a visitor reaches the
 * last section, the page has stopped explaining and started asking —
 * Choose/Book/Come by/Create is the former, and belongs nearer the listing it
 * describes if the homepage ever wants it stated on itself. What the removal
 * reliably did either way is give this section back its foot, for
 * {@link FootRail} below.
 *
 * ==========================================================================
 * WHAT IT IS NOW
 * ==========================================================================
 *
 * Two rules and everything between them:
 *
 *   PLAN YOUR VISIT ──────────────────────────────────────────────────
 *
 *   COME MAKE
 *   SOMETHING                        Choose an experience, find a date…
 *   WITH US.
 *        see you at the maison            [ EXPLORE EVENTS  → ]
 *   ────────────────────────────────────────────────────────────────────
 *   WHERE               HAVE A QUESTION?          PLANNING FOR A GROUP?
 *   Dubai, UAE          Contact the Maison →      Private events →
 *
 * The masthead rule runs from the label to the right edge instead of stopping
 * at a 48px dash, and the foot rail hangs from a second rule the full width.
 * Two horizontals holding one composition — the section's structure is legible
 * before a word of it is read, and there is not a border or a box anywhere in
 * it, which is the rule the rest of this page keeps.
 *
 * The statement and the action bottom-align (`lg:items-end`), so the empty
 * space sits beside three lines of display type where it belongs rather than
 * under the signature. At the foot of that row the eye reads signature on the
 * left, action on the right, level with each other — which is what an
 * invitation looks like when it is signed.
 *
 * ONE MARKED ACTION. Everything in the old rail was a line of type, so nothing
 * in the page's closing section looked like something to press. Explore events
 * is now a filled Deep Lilac block — the only one on the page — and the two
 * other doors moved to the foot rail, where they are answers to different
 * questions rather than three options on the same one.
 *
 * White Rock is doing real work here rather than just alternating — CHECKED
 * AGAINST THE ACTUAL PAGE THIS PASS, AND PARTLY REWRITTEN. This used to say
 * the section before it is the loudest colour on the page and that White Rock
 * answers it with the same warmth the brand introduction opened on. Neither
 * half is true of app/page.tsx as it stands: the brand introduction is not
 * mounted on the homepage at all (see that file's own "WHAT IS NOT HERE"
 * note), and what actually precedes this section is <Testimonials>, set on
 * Charcoal Slate — the one dark ground the homepage holds, not the loudest
 * colour on it. White Rock after that is still real work, just a different
 * kind: the page's only dark passage resolves into its lightest warm neutral
 * rather than into more colour, which needs no earlier section to justify it.
 *
 * No photograph. Every atmospheric plate the project holds is already hanging
 * further up this same page, and a second showing of one here would be
 * decoration. What carries the section is the space around three lines of type
 * and the one marked action inside it.
 *
 * TODO(client): the one photograph that would earn a place is the studio door,
 * or a table with people already at it — the destination rather than the
 * making, which every section above has covered. If it arrives, hang it in the
 * right-hand column above the action and keep it narrow.
 *
 * ==========================================================================
 * THIS PASS — checked against goodman-gallery.com's own closing register,
 * and against the "no premises" rule this round adds
 * ==========================================================================
 *
 * Three calls were asked for explicitly. All three left the section's shape
 * alone and either preserved a cost already paid or fixed a cost this pass
 * found, rather than moving anything for its own sake:
 *
 *   The invitation's per-breakpoint sizing (INVITATION_LINE, below) is
 *   untouched. Its own comment already carries the measured reason: two
 *   different measures, not one curve between them — and nothing about the
 *   reference argues with that arithmetic; goodman-gallery's own display type
 *   is the same idea at a different scale, quiet weight and tightened
 *   tracking rather than colour or ornament.
 *
 *   The closing action ({@link PrimaryAction}, below) stays a filled block,
 *   and stays Deep Lilac rather than the Light Sage this round's navbar
 *   takes. Both calls have measured reasons on that function itself, not
 *   just asserted here.
 *
 *   The steps band stays gone, but not for the reason this comment used to
 *   give — see the correction above, which was wrong about what else runs on
 *   this page. The script signature stays; see the note beside it below for
 *   why this is the rarer of two cases, not an oversight.
 *
 * One thing not on that list turned up while checking the rest: the foot
 * rail's location entry was labelled "The studio", which this business does
 * not have. See the note inside {@link FootRail} for the fix and the
 * precedent already set for it on /contact.
 *
 * Server component; every animation lives in the client components it
 * composes.
 */
export function PlanYourVisit() {
  const { eyebrow, title, signature, description, primaryCta, secondaryCta, groupCta } =
    PLAN_YOUR_VISIT;

  return (
    <section
      aria-labelledby="plan-your-visit-heading"
      className="bg-cream py-[5.5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        {/*
          The masthead, and the first of the section's two horizontals.

          The house eyebrow is a 48px terracotta dash and a label; here the
          dash keeps its colour and the rule carries on past the label to the
          right edge of the measure. That is the same mark doing more work: it
          opens the section and draws its top edge in one gesture, which is
          what lets the composition below sit inside something without being
          put in a box.
        */}
        <Reveal>
          <div className="flex items-center gap-4 md:gap-6">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            <p className="shrink-0 text-action font-medium uppercase tracking-eyebrow text-text">
              {eyebrow}
            </p>
            {/* /15 is a hairline, not text: it owes nothing and is a boundary
                rather than information. The foot rule matches it exactly. */}
            <span aria-hidden className="h-px w-full bg-text/15" />
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-12 gap-x-6 md:mt-20 lg:mt-24 lg:items-end lg:gap-x-10">
          {/* ---------- The invitation, anchored to the left edge ---------- */}
          <div className="col-span-12 lg:col-span-7">
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
              — `font-display`, the Hapsha cut set in globals.css — appears
              nowhere else in this section.

              IT EARNS THAT EXCEPTION RATHER THAN JUST KEEPING IT. The brand's
              actual handwriting is rationed on purpose: <Signature>, in
              components/ui, carries a "signage voice" of its own — wide caps,
              not script — everywhere the site used to reach for the cursive
              face, precisely so the cursive would stay rare once it stopped
              being the default. Checked this pass: `font-display` now has
              exactly one other caller in the whole component tree, the
              matching aside in <Experience>. A closing invitation is the
              register that handwriting was kept for, and this is the second
              of its two remaining appearances — not a leftover the brand pass
              missed.

              Indented so it starts inside the statement's measure, and it now
              sits level with the action across the gutter — the bottom edge of
              this row reads as one line, signed on the left and answered on
              the right.
            */}
            {signature ? (
              <Reveal variant="fadeIn" delay={0.5}>
                <p className="ml-1 mt-9 font-display text-[1.75rem] leading-none tracking-normal text-primary md:ml-[10%] md:mt-10 md:text-[2rem] lg:ml-[12%] lg:text-[2.25rem]">
                  {signature}
                </p>
              </Reveal>
            ) : null}
          </div>

          {/*
            ---------- The one thing to do next ----------

            Bottom-aligned with the column beside it rather than dropped by a
            top margin. The margin was a guess that happened to land; the
            alignment is the intent — a paragraph and an action sitting on the
            statement's last line, with the air above them rather than below.
          */}
          <div className="col-span-12 mt-14 lg:col-span-5 lg:mt-0">
            <Reveal delay={0.15}>
              {/*
                A measure, not the full column: five columns on a wide display
                is past 90 characters a line, well beyond where a line stops
                being comfortable to track.
              */}
              <p className="max-w-[26rem] text-body leading-[1.85] text-text/80 lg:max-w-[30rem]">
                {description}
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-10 md:mt-12">
                <PrimaryAction item={primaryCta} />
              </div>
            </Reveal>
          </div>
        </div>

        <FootRail secondaryCta={secondaryCta} groupCta={groupCta} />
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
 * The foot rail — where the Maison is, and the two doors that are not the
 * main one.
 *
 * This is where the band of numbered steps used to be, and it is a better use
 * of the same rule — see the correction above {@link PlanYourVisit} on why
 * they stayed gone. These three answer questions the invitation raises and
 * does not settle instead — where is it, who do I ask, and what if I am not
 * booking one seat.
 *
 * Each entry is a label and one line, which is the index grammar the rest of
 * the site uses. Three of them take an even third of the measure, so the rail
 * reaches the right edge instead of trailing off — the old rail's last item
 * finished two thirds across and left the corner empty.
 */
function FootRail({
  secondaryCta,
  groupCta,
}: {
  secondaryCta?: NavItem;
  groupCta?: { note: string; link: NavItem };
}) {
  return (
    <div className="mt-20 border-t border-text/15 pt-12 md:mt-24 md:pt-14 lg:mt-28">
      <Stagger as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 lg:gap-x-10">
        {/*
          Where the Maison operates — the plainest thing a visitor wants from
          a section called Plan Your Visit, and it was previously the last
          line of a five-item rail. It reads {@link CONTACT}, so it fills
          itself in as the client supplies an email rather than needing to be
          written again.

          LABELLED "WHERE", NOT "THE STUDIO" — CHECKED THIS PASS. There is no
          studio: the business sets up inside a mall on fixed dates, and
          CONTACT.addressLines holds a city and a country, not a street.
          "The studio", the label this carried before, names a place with a
          door and sits directly over an address block — exactly the
          impression /contact's own equivalent entry was written to avoid:
          "the city is all the project holds, and a city is not an address
          someone can arrive at." That page's fix was a plain "Where" label
          plus a link redirecting to the venues that actually exist, one per
          event. This block borrows the honest label and skips the redirect —
          the section's one action, a column over, already sends the visitor
          to that same listing, and a second link to it here would have the
          rail repeat the invitation instead of answering a different
          question.
        */}
        <Reveal className="col-span-12 md:col-span-4">
          <address className="not-italic">
            <span className={`block ${RAIL_LABEL}`}>Where</span>
            <span className="mt-3 block text-body leading-[1.8] text-text/85">
              {CONTACT.addressLines.join(", ")}
            </span>
            {CONTACT.email ? (
              // `after:-inset-y-3` clears 44px on text-body's smallest
              // computed line height (16px × 1.75 ≈ 28px, +24px from the
              // pseudo-element ≈ 52px) with no padding that would push the
              // line below it out of the rail's measured rhythm. Untested
              // against real content — CONTACT.email is null today — and
              // kept correct anyway, so a future email is not also a future
              // hit-area fix.
              <a
                href={`mailto:${CONTACT.email}`}
                className="relative mt-2 inline-block text-body text-text/85 underline decoration-primary/40 underline-offset-4 transition-colors duration-300 ease-soft hover:decoration-primary after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
              >
                {CONTACT.email}
              </a>
            ) : null}
          </address>
        </Reveal>

        {secondaryCta ? (
          <Reveal delay={0.08} className="col-span-12 md:col-span-4">
            <p className={RAIL_LABEL}>Have a question?</p>
            <div className="mt-3">
              <RailLink item={secondaryCta} />
            </div>
          </Reveal>
        ) : null}

        {groupCta ? (
          <Reveal delay={0.16} className="col-span-12 md:col-span-4">
            {/*
              The client's own lead-in becomes the label. It was set as a
              sentence with the link inside it, which was the right instinct in
              a stack of near-identical links and is no longer needed now the
              three entries are visibly answering different questions.
            */}
            <p className={RAIL_LABEL}>{groupCta.note}</p>
            <div className="mt-3">
              <RailLink item={groupCta.link} />
            </div>
          </Reveal>
        ) : null}
      </Stagger>
    </div>
  );
}

/**
 * The page's one dominant action, and the only filled block on the homepage.
 *
 * IT USED TO BE A LINE OF TYPE. Every item in the old rail was — a label with
 * a rule under it — so the closing section of the page contained nothing that
 * looked like something to press, and the ask sat at the same weight as the
 * address beneath it. A marked block is the plainest fix and the section can
 * afford exactly one.
 *
 * RECONSIDERED AGAINST THE REFERENCE, AND KEPT FILLED. goodman-gallery.com's
 * own closing moments run to plain type, and even its hero buttons are small
 * and outlined rather than solid — the honest transfer of that restraint
 * would put this back to a line of type. It stays a filled block anyway, for
 * a difference the reference does not have to reconcile: nothing on a
 * gallery's homepage is the one place a visitor buys something, and this is
 * — the homepage has exactly one conversion moment and this button is it
 * (see the comment on `PLAN_YOUR_VISIT` in lib/constants.ts). Undoing the fix
 * this component exists for, to match a gallery's register more closely,
 * would trade a real and already-diagnosed problem for a closer costume.
 * Restraint is kept everywhere else it does not cost that: flat colour, no
 * shadow, the same 8px corner as every other control on the site, and the
 * same `px-8 py-5` padding as `Button`'s own `lg` — "the page-level action"
 * per that component's comment — rather than anything larger.
 *
 * Deep Lilac with `--color-on-primary`, which is the near-white the token
 * exists for: White Rock on this ground measures 3.95:1 and a 13px label owes
 * 4.5:1, while the near-white clears at 4.90:1. On the White Rock ground the
 * block itself is a large area of the brand accent, which is what makes it
 * the first thing the eye lands on in the section.
 *
 * STILL DEEP LILAC, NOT THIS ROUND'S SAGE FILL. <BookAction> — the header's
 * booking button, filled this round in Light Sage — says explicitly why:
 * sage "is the palest thing in the palette and reads instantly against
 * [charcoal], where lilac is dark and would sit into the ground rather than
 * on it." That reasoning flips on this section's ground. PlanYourVisit sits
 * on White Rock, a pale warm cream, and Light Sage sits at almost exactly the
 * same lightness — by the sRGB relative-luminance arithmetic behind every
 * other ratio in this file, sage on this cream measures roughly 1.03:1. It is
 * the same failure `BRAND_LOGO`'s own note names for a different pale-on-pale
 * pairing: "invisible rather than faint." Nothing sits inside the fill here,
 * so 1.03:1 is not a text ratio; it is the contrast a borderless block owes
 * its own ground to read as a shape at all, which WCAG 1.4.11 sets at 3:1.
 * Deep Lilac against the same cream is the 3.95:1 pairing Button.tsx's own
 * `primary` note already records for White Rock on Deep Lilac — cited there
 * as a failing TEXT pairing, near-white type set into the fill, but equally
 * true read the other way, as this block's own edge against the page, where
 * 3.95:1 clears the 3:1 a shape owes. The brand-fill swap belongs on a dark
 * ground; on this section's own light one, Deep Lilac is the colour that
 * still reads as a block.
 *
 * `py-5` on a 13px label is a 54px target, comfortably over the 44 a thumb
 * needs, and it runs full width below `sm` where a phone would otherwise give
 * it a third of the screen.
 */
function PrimaryAction({ item }: { item: NavItem }) {
  const externalProps = item.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Link
      href={item.href}
      {...externalProps}
      className={cn(
        "group inline-flex w-full items-center justify-center gap-3 rounded-sm px-8 py-5 sm:w-auto",
        "bg-primary text-fine font-medium uppercase leading-none tracking-eyebrow text-on-primary",
        "transition-colors duration-300 ease-soft hover:bg-primary/90",
      )}
    >
      {item.label}
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}

/**
 * A door in the foot rail, as a line of type.
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
function RailLink({ item }: { item: NavItem }) {
  const externalProps = item.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Link
      href={item.href}
      {...externalProps}
      // `-my-1.5 py-1.5` grows the tap target without moving the link: at this
      // size the label sets a 23px box, under the 24px a standalone control
      // owes, and the negative margin cancels the padding so the rail's
      // spacing is untouched. Same device as every other action on the site.
      className="group -my-1.5 inline-flex items-baseline gap-3 py-1.5 text-fine font-medium uppercase tracking-eyebrow text-text"
    >
      <span className="relative pb-2">
        {item.label}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-primary/45" />
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary",
            "transition-transform duration-500 ease-editorial",
            "group-hover:scale-x-100 group-focus-visible:scale-x-100",
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
