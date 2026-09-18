import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { COLLABORATIONS, OUR_APPROACH } from "@/lib/brand";

/**
 * Homepage 10 — the collaborative approach.
 *
 * This is the one section addressed to partners rather than visitors — malls,
 * retailers, F&B outlets — and it says so, because the deck does (p.10). The
 * three models are the deck's own; the approach beneath them is p.12.
 *
 * NO PARTNER NAMES, NO LOGOS. The deck names none for these programmes, so the
 * section describes how collaboration works and never implies that a
 * particular brand has signed up to it.
 *
 * The action is an enquiry through /contact, which exists and is honest about
 * where a message goes. There is no partnerships page, and a link to one
 * would be a link to nothing.
 */
export function Collaborations() {
  return (
    <section
      aria-labelledby="collaborations-heading"
      className="relative bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Eyebrow>Collaborative approach</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="collaborations-heading"
              size="compact"
              className="mt-8 md:mt-10"
              lines={["Let’s create", "together."]}
            />
            <Reveal delay={0.15}>
              <p className="mt-7 max-w-[26rem] text-body leading-[1.85] text-text/85">
                For malls, retailers and F&amp;B partners: creative activations built around your
                space and your calendar.
              </p>
              <Link
                href="/contact"
                className="group mt-9 inline-flex min-h-12 items-center gap-3 rounded-sm border border-text px-7 text-action font-semibold uppercase tracking-eyebrow text-text transition-colors duration-300 ease-soft hover:bg-text hover:text-cream"
              >
                Partner with us
                <span
                  aria-hidden
                  className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                >
                  &#8594;
                </span>
              </Link>
            </Reveal>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <ol>
              {COLLABORATIONS.map((model, i) => (
                <li key={model.slug} className="border-t border-text/25 py-7 md:py-8">
                  <Reveal delay={i * 0.07}>
                    <div className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4">
                      <span
                        aria-hidden
                        className="text-label font-semibold tabular-nums tracking-eyebrow text-text"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-[1.4rem] font-light leading-tight tracking-[-0.01em] text-text md:text-[1.65rem]">
                          {model.name}
                        </h3>
                        <p className="mt-2.5 text-body leading-[1.75] text-text/85">
                          {model.description}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>

            <Reveal delay={0.2}>
              <div className="border-t border-text/25 pt-7">
                <h3 className="text-label font-semibold uppercase tracking-eyebrow text-text">
                  Our approach
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {OUR_APPROACH.map((line) => (
                    <li key={line} className="flex gap-3 text-body leading-[1.7] text-text/85">
                      <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-terracotta" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
