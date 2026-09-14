import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { HOW_IT_WORKS } from "@/lib/constants";

/**
 * Homepage section 04 — how it works.
 *
 * The page spent a long time showing what the Maison makes and never once
 * said where any of it happens. Maison Palettia has no studio door: it sets
 * up at a mall on a fixed date, and someone who has not understood that is
 * not hesitating over a booking — they cannot picture what they would be
 * booking, which is a worse problem and an invisible one.
 *
 * Four steps, set as a run of numbered columns rather than as cards. No
 * boxes, no icons, no arrows between them: the numerals and the rule above
 * each one carry the sequence, which is all a sequence needs, and it keeps
 * the section in the same register as the index pages rather than turning it
 * into the "3 easy steps!" band that every service site has.
 *
 * Sits directly under the events listing on purpose. The listing raises the
 * question — what actually happens if I book one of these — and this is the
 * answer, in the place the question gets asked.
 */
export function HowItWorks() {
  return (
    <Container
      as="section"
      aria-labelledby="how-it-works"
      /*
        `bg-surface` is load-bearing, not decoration.

        This section sits inside the homepage's sticky-hero wrapper, in the
        `relative z-10` layer whose job is to rise over the hero and cover it.
        A section in that layer with no ground of its own is transparent, so
        the hero's triptych and wordmark paint straight through the type — a
        pinned photograph behind four steps of copy, which is exactly what
        happened when this moved inside the wrapper.

        The page's own note states the contract: every section that does the
        covering carries an opaque ground. This is the page's ground, matching
        the events listing directly above, so the two read as one field with no
        seam between them.
      */
      className="bg-surface py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
        <Reveal className="col-span-12 md:col-span-6">
          <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
            How it works
          </p>
          <h2
            id="how-it-works"
            className="mt-7 text-[1.9rem] font-light uppercase leading-[1.02] tracking-[-0.02em] md:text-[2.3rem] lg:text-[2.75rem]"
          >
            We come to you.
          </h2>
        </Reveal>

        <Reveal delay={0.15} className="col-span-12 mt-6 md:col-span-5 md:col-start-8 md:mt-0">
          <p className="max-w-[24rem] text-body leading-[1.85] text-text/80">
            Every event runs at a mall, at a set time, with everything laid out before you
            arrive. You bring nothing but yourself.
          </p>
        </Reveal>
      </div>

      {/*
        Two columns on a phone rather than one. Four stacked steps is a long
        scroll for four short sentences, and the pairs read as 01/02 then
        03/04 — which is the sequence anyway.
      */}
      <ol className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:mt-16 lg:grid-cols-4 lg:gap-x-10">
        {HOW_IT_WORKS.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * 0.08}>
              {/*
                The rule is the only chrome. It replaces the card each of
                these would otherwise sit in — a border on four sides of a
                two-line paragraph is a box drawn for the sake of drawing one.
              */}
              <span aria-hidden className="block h-px w-full bg-line" />
              <p className="mt-5 text-action font-medium tabular-nums tracking-eyebrow text-terracotta">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-lead font-medium uppercase tracking-[0.06em] text-text md:text-lead">
                {step.title}
              </h3>
              <p className="mt-3 text-body leading-[1.75] text-text/80">{step.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Container>
  );
}
