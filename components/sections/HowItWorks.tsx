import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { HOW_IT_WORKS } from "@/lib/constants";

/**
 * Homepage section 03 — how it works.
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
 *
 * `<Section>` and `<SectionHead>` now carry what this file used to hand-roll
 * itself: the ground, the vertical rhythm, and the eyebrow/heading/standfirst
 * treatment. Adopting `<SectionHead>` also moves the eyebrow rule from Warm
 * Terracotta to Deep Lilac for free. The step numerals below make the same
 * move by hand, since they are this section's own mark rather than the
 * shared head's — Deep Lilac is the one accent left on the homepage, and
 * numerals are named explicitly as one of the marks it carries (see THE
 * ONE-ACCENT RULE in app/globals.css).
 *
 * `ground="surface"` is written out explicitly rather than left to the prop
 * default, as a flag for the next person editing this file: it is load
 * bearing, not decoration. This section sits inside the homepage's
 * sticky-hero wrapper, in the `relative z-10` layer whose job is to rise over
 * the pinned hero photograph and cover it (see app/page.tsx). A section in
 * that layer with no ground of its own is transparent, and the hero paints
 * straight through the copy — it happened to this exact section once
 * already, which is why `<Section>` no longer offers a "none" ground at all
 * (see its own file comment for the full story). `surface` is also simply
 * correct here on design grounds: the homepage's ground rhythm keeps this
 * section continuous with Upcoming Events directly above it, with no seam
 * between them. Do not replace it with a transparent class.
 */
export function HowItWorks() {
  return (
    <Section id="how-it-works" ground="surface">
      <SectionHead
        id="how-it-works"
        eyebrow="How it works"
        title="We come to you."
        // TODO(client): confirm. Same operational promise as the FAQ's "Do I
        // need to bring anything?" answer (lib/constants.ts, HOMEPAGE_FAQ),
        // which already carries this flag — this standfirst makes the
        // identical claim about what the studio supplies and had no flag of
        // its own. Keeping the wording, since it is the client's own and
        // UpcomingEvents' standfirst repeats it too, but marking it here so
        // all instances of the claim stay in step until it is confirmed.
        standfirst="Every event runs at a mall, at a set time, with everything laid out before you arrive. You bring nothing but yourself."
        layout="spread"
      />

      {/*
        Two columns on a phone rather than one. Four stacked steps is a long
        scroll for four short sentences, and the pairs read as 01/02 then
        03/04 — which is the sequence anyway.
      */}
      <ol className="mt-section-gap grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4 lg:gap-x-10">
        {HOW_IT_WORKS.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * 0.08}>
              {/*
                The rule is the only chrome. It replaces the card each of
                these would otherwise sit in — a border on four sides of a
                two-line paragraph is a box drawn for the sake of drawing one.
                It is also what stops four columns of numeral-plus-paragraph
                from reading as four independent cards: remove it and each
                step floats with nothing tying it to the ones beside it.
              */}
              <span aria-hidden className="block h-px w-full bg-line" />
              <p className="mt-5 text-action font-medium tabular-nums tracking-eyebrow text-primary">
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
    </Section>
  );
}
