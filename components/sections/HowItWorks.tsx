import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { HOW_IT_WORKS } from "@/lib/constants";

/**
 * How it works — the practical answer, on /about.
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
 * Sits immediately before the closing call to action on /about, and that is
 * the same rule it followed on the homepage, where it ran under the events
 * listing: it belongs beside the moment the question gets asked — what
 * actually happens if I book one of these — rather than wherever a page has
 * room for it. The client asked for it on /about; the adjacency moved with it.
 */
export function HowItWorks() {
  return (
    <Container
      as="section"
      aria-labelledby="how-it-works"
      /*
        `bg-surface` was load-bearing and is now a choice — keep it either way.

        On the homepage this sat inside the sticky-hero wrapper, in the
        `relative z-10` layer that rises over the hero and covers it, and a
        section in that layer with no ground of its own is transparent: the
        pinned film painted straight through the type. There is no sticky hero
        on /about, so nothing depends on it any more.

        It stays because it earns its place differently here. The sections
        above it sit on the page ground and the call to action below is
        charcoal, so this band separates the two and keeps the page from
        ending on one flat field. If it is ever moved again, check whether the
        destination needs the opacity before assuming it is only a tint.
      */
      className="bg-surface py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
        <div className="col-span-12 md:col-span-8 lg:col-span-7">
          <Reveal>
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

          <Reveal delay={0.15}>
            <p className="mt-7 max-w-[32rem] text-body leading-[1.85] text-text/80 md:mt-8">
              Every event runs at a mall, at a set time, with everything laid out before you
              arrive. You bring nothing but yourself.
            </p>
          </Reveal>
        </div>
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
              {/*
                Charcoal, not Warm Terracotta. The accent measures 3.02:1 on
                the page ground — fine for the rules and arrows it is used for
                elsewhere, which are graphical objects owing 3:1, and short of
                the 4.5:1 this numeral owes as 12px text. Terracotta is an
                accent for marks on this palette, never for small copy. /75 is
                5.44:1 and still sits back from the step title.
              */}
              <p className="mt-5 text-action font-medium tabular-nums tracking-eyebrow text-text/75">
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
