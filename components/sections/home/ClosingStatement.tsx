import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { forScript } from "@/components/ui/SectionHeader";
import { CLOSING, TAGLINE } from "@/lib/brand";

/**
 * Homepage 12 — the closing statement.
 *
 * The deck's last page, word for word (p.15), set the way the brand board sets
 * its mark: on the Light Sage stripe, inside a solid panel. The stripe is the
 * one pattern the brand owns, and this is the page's only full use of it.
 *
 * THE SCRIPT, AT THE SIZE IT WANTS. The heading is Hapsha Sophia Script — a
 * high-level display headline, which is what the brand guide reserves the face
 * for — at a size where every letterform is readable. The wordmark itself is
 * never set in it: the logo is the client's artwork and only ever appears as
 * that artwork.
 *
 * One action, and the obvious one: go and see what there is to make.
 */
export function ClosingStatement() {
  return (
    <section aria-labelledby="closing-heading" className="stripes relative py-16 md:py-24 lg:py-28">
      <Container>
        <Reveal className="mx-auto max-w-[52rem] bg-cream px-7 py-14 text-center sm:px-12 md:px-16 md:py-20">
          <p className="text-label font-semibold uppercase tracking-eyebrow text-text">{TAGLINE}</p>
          <h2
            id="closing-heading"
            className="mt-7 heading-script text-[2.6rem] leading-[1.1] text-primary sm:text-[3.4rem] md:text-[4.2rem]"
          >
            {forScript(CLOSING.heading)}
          </h2>
          <p className="mx-auto mt-7 max-w-[30rem] text-lead leading-[1.7] text-text">
            {CLOSING.body}
          </p>
          <Link
            href="/events"
            className="group mt-10 inline-flex min-h-12 items-center gap-3 rounded-sm bg-primary px-7 text-action font-semibold uppercase tracking-eyebrow text-on-primary transition-colors duration-300 ease-soft hover:bg-primary/90"
          >
            Explore experiences
            <span
              aria-hidden
              className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
            >
              &#8594;
            </span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
