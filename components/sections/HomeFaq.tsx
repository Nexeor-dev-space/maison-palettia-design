import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { HOMEPAGE_FAQ } from "@/lib/constants";

/**
 * Homepage — the questions that stand between someone and a booking.
 *
 * Last before the invitation, and deliberately the quietest thing on the page.
 * An FAQ is not content a visitor came for; it is the answer to a specific
 * hesitation, and it earns its place only by removing one. So it is four
 * questions, not twelve, and each one is a thing somebody would actually
 * stall on: where is this, how long is it, what do I need, how do I book.
 *
 * NO STANDFIRST, UNLIKE ITS NEIGHBOURS. Every other <SectionHead> on the page
 * pairs its title with a lead paragraph; this one is just the eyebrow, the
 * title and a single ruled link. The quietest section on the page should also
 * be the one with the least to read before it gets out of the way. Dropping
 * the standfirst still leaves `layout="spread"` doing something: with no lead
 * paragraph in the side cell, `<SectionHead>` sends "Get in touch" flush to
 * the page's right edge — the same "one small link, top right" shape as every
 * "See all" affordance elsewhere on the page, rather than a bespoke position.
 *
 * NATIVE DISCLOSURE, NO JAVASCRIPT. `<details>` and `<summary>` give the open
 * and close behaviour, the keyboard handling and the screen-reader semantics
 * for nothing — and unlike a hand-built accordion they work before hydration
 * and in a printed page. The site's motion language is a fade on the way in,
 * which is a wrapper, not a state machine; an accordion animating its own
 * height would be the most complicated thing on the homepage in service of the
 * least important one.
 *
 * The first question opens on load. Someone who has scrolled this far has a
 * question, and an entirely closed list asks them to guess which row holds it.
 *
 * Server component. No data is invented: see the note on HOMEPAGE_FAQ for what
 * the studio still has to answer, and why none of it is guessed at here.
 */
export function HomeFaq() {
  if (HOMEPAGE_FAQ.length === 0) return null;

  return (
    <Section id="faq-heading" ground="surface">
      <SectionHead
        id="faq-heading"
        eyebrow="Before you book"
        title="Good to know."
        /*
          RESTORED. This line was dropped during the rebuild because the spec
          for this section listed only an eyebrow, a title and a layout — but a
          prop missing from a spec is not an instruction to delete approved
          copy. Without it the left column is a heading and a link with nothing
          between them, and this sentence is what makes the section read as an
          offer to help rather than as a wall of questions.
        */
        standfirst="Anything else, and the Maison is happy to answer."
        action={{ label: "Get in touch", href: "/contact" }}
        layout="spread"
      />

      {/*
        No column restriction: `<SectionHead>`'s own contract is "the block
        that follows gets `mt-section-gap`", not a particular width, and this
        page already lets a full-width row settle its own measure from its
        content — the booking strip above does the same. Constraining it to a
        column here would be a spacing decision this file has no business
        inventing.
      */}
      <Reveal delay={0.1} className="mt-section-gap">
        <dl>
          {HOMEPAGE_FAQ.map((item, i) => (
            <div key={item.question} className="border-t border-line last:border-b">
              {/*
                `<details>` carries the state, so the question is a <dt> and
                the answer a <dd> only in spirit — nesting a disclosure inside
                a definition list breaks both. The list semantics that matter
                here are the pairing, and <summary> already announces itself
                as an expandable control with its answer as the content.
              */}
              {/*
                THE PADDING IS ON THE SUMMARY, NOT ON THE DETAILS, and the
                difference is the whole tap target.

                It sat on <details>, which reads identically — one continuous
                row between two hairlines — and is wrong, because only
                <summary> toggles. Activation outside its own box does
                nothing, so the 24 to 28px above and below the question were
                dead space that looked live. Measured on the running page, the
                real hit box was 25px at 390 and 30px at 1440, against the
                44px a control owes; there was no pseudo-element extending it
                the way every other control on this page has one.

                The row keeps its exact height and spacing: the padding simply
                moved onto the element that responds to it, and the marker is
                pushed back up by the same amount so it still aligns with the
                first line of the question rather than with the padded box.
              */}
              <details open={i === 0} className="group/faq">
                <summary className="group flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-h3 font-light tracking-[-0.01em] text-text transition-colors duration-300 ease-soft hover:text-primary focus-visible:text-primary md:py-7 [&::-webkit-details-marker]:hidden">
                  {item.question}
                  {/*
                    A rule that becomes a cross, rather than a chevron: the
                    site draws rules everywhere and owns no icon set. It is
                    aria-hidden because <summary> already tells a screen
                    reader whether the row is open.

                    DEEP LILAC ON HOVER AND FOCUS, NOT JUST BG-TEXT AT REST. A
                    mark owes 3:1 and Deep Lilac clears it at 4.9:1 on this
                    ground (see the contrast table), so the whole row answers
                    together instead of the question text lighting up while
                    its own marker stays inert. `group` is declared on
                    <summary> itself rather than on the surrounding <details>
                    — reading an open answer should not light the marker
                    above it; only pointing at or focusing the question does.
                  */}
                  <span
                    aria-hidden
                    className="relative mt-2.5 h-px w-4 shrink-0 bg-text transition-colors duration-300 ease-soft group-hover:bg-primary group-focus-visible:bg-primary"
                  >
                    <span className="absolute inset-0 bg-text transition-[transform,background-color] duration-500 ease-editorial group-open/faq:rotate-0 group-hover:bg-primary group-focus-visible:bg-primary [transform:rotate(90deg)]" />
                  </span>
                </summary>
                {/*
                  The row's lower padding lives here now. It moved off
                  <details> with the upper half (see above), and an open answer
                  is what sits at the bottom of the row, so it is what has to
                  carry it. A closed row is <summary> alone and keeps its own
                  py — so both states keep exactly the height they had.
                */}
                <p className="mt-4 max-w-[34rem] pb-6 text-body text-text/80 md:pb-7">
                  {item.answer}
                </p>
              </details>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}
