import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
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
    <Container as="section" aria-labelledby="faq-heading" className="py-[4.5rem] md:py-section">
      <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
        <div className="col-span-12 md:col-span-4">
          <Reveal>
            <p className="flex items-center gap-4 text-label font-medium uppercase tracking-eyebrow text-text">
              <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
              Before you book
            </p>
            <h2 id="faq-heading" className="mt-6 text-h2 font-light uppercase tracking-[-0.02em]">
              Good to know.
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="mt-6 max-w-[22rem] text-body text-text/80">
              Anything else, and the Maison is happy to answer.
            </p>
            <Link
              href="/contact"
              className="group mt-7 inline-flex items-center gap-3 text-action font-medium uppercase tracking-eyebrow text-text"
            >
              <span className="border-b border-terracotta/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-terracotta">
                Get in touch
              </span>
              <span
                aria-hidden
                className="text-terracotta transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
              >
                &#8594;
              </span>
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="col-span-12 mt-10 md:col-span-7 md:col-start-6 md:mt-0">
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
                <details open={i === 0} className="group/faq py-6 md:py-7">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-h3 font-light tracking-[-0.01em] text-text transition-colors duration-300 ease-soft hover:text-primary [&::-webkit-details-marker]:hidden">
                    {item.question}
                    {/*
                      A rule that becomes a cross, rather than a chevron: the
                      site draws rules everywhere and owns no icon set. It is
                      aria-hidden because <summary> already tells a screen
                      reader whether the row is open.
                    */}
                    <span
                      aria-hidden
                      className="relative mt-2.5 h-px w-4 shrink-0 bg-text transition-transform duration-500 ease-editorial"
                    >
                      <span className="absolute inset-0 bg-text transition-transform duration-500 ease-editorial group-open/faq:rotate-0 [transform:rotate(90deg)]" />
                    </span>
                  </summary>
                  <p className="mt-4 max-w-[34rem] text-body text-text/80">{item.answer}</p>
                </details>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </Container>
  );
}
