import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { SEASONAL_INTRO, SEASONAL_MOMENTS } from "@/lib/brand";

/**
 * Homepage 07 — seasonal creative experiences.
 *
 * Editorial, not promotional. The brief is explicit that seasonal work is
 * storytelling rather than a banner, and the data agrees: the deck gives four
 * occasions and what the studio made for each, with no dates and no year. So
 * the section is a calendar of examples — nothing here says "now on", "book
 * for Ramadan" or anything else that would imply one of them is running.
 *
 * FOUR COLUMNS UNDER ONE RULE, each occasion set large and its making beneath,
 * so the year reads left to right as it does on a wall planner. The numerals
 * are only an order; the months are deliberately not given, because Ramadan's
 * moves every year and a fixed month beside it would be wrong within twelve.
 */
export function SeasonalExperiences() {
  return (
    <section
      aria-labelledby="seasonal-heading"
      className="relative bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>Seasonal experiences</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="seasonal-heading"
              className="mt-8 md:mt-10"
              lines={["Something new", "for every season."]}
            />
          </div>
          <Reveal delay={0.2} className="col-span-12 lg:col-span-5 lg:pb-3">
            <p className="max-w-[30rem] text-body leading-[1.85] text-text/85">{SEASONAL_INTRO}</p>
          </Reveal>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:mt-20 lg:grid-cols-4 lg:gap-x-10">
          {SEASONAL_MOMENTS.map((moment, i) => (
            <li key={moment.slug}>
              <Reveal delay={i * 0.07}>
                <div className="relative border-t border-text/25 pb-8 pt-7">
                  {/* Terracotta as the brand guide intends it: a small accent,
                      marking the start of each season, never a field. */}
                  <span aria-hidden className="absolute -top-px left-0 h-0.5 w-10 bg-terracotta" />
                  <span
                    aria-hidden
                    className="text-label font-semibold tabular-nums tracking-eyebrow text-text"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-[1.6rem] font-light leading-[1.1] tracking-[-0.015em] text-text md:text-[1.85rem]">
                    {moment.occasion}
                  </h3>
                  <p className="mt-3 max-w-[18rem] text-body leading-[1.7] text-text/85">
                    {moment.experience}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
