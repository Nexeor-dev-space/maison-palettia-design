import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { WORKSHOP_JOURNEY } from "@/lib/brand";

/**
 * Homepage 03 — what the Maison offers, as the deck's "Workshop Journey".
 *
 * Five ways people experience the Maison, in the deck's order and words
 * (p.5). They are not equal, and the layout says so: walk-in DIY and scheduled
 * sessions are how the business actually runs — one is never booked online,
 * the other always is — so they take the top row at full width with their
 * names set large. Family bonding, the monthly refresh and the digital detox
 * describe what those visits are like, and sit beneath as a row of three.
 *
 * TYPE, NOT CARDS. Five tiles of equal size would flatten exactly the
 * hierarchy that matters. Hairlines and scale do the grouping instead.
 *
 * White Rock: the warm neutral the brand guide gives to editorial content,
 * following the Light Sage of the section above.
 */
export function WorkshopJourney() {
  const [walkIn, scheduled, ...supporting] = WORKSHOP_JOURNEY;

  return (
    <section
      aria-labelledby="workshop-journey"
      className="relative bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 lg:gap-x-10">
          <div className="col-span-12 md:col-span-8">
            <Reveal>
              <Eyebrow>What we offer</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="workshop-journey"
              className="mt-8 md:mt-10"
              lines={["The workshop", "journey."]}
            />
          </div>
          <Reveal delay={0.2} className="col-span-12 md:col-span-4 md:pb-3">
            <p className="max-w-[24rem] text-body leading-[1.8] text-text/85">
              Two ways to create, and three reasons people keep coming back to the table.
            </p>
          </Reveal>
        </div>

        {/* The two ways to create. */}
        <ol className="mt-14 grid grid-cols-1 gap-x-6 md:mt-20 md:grid-cols-2 lg:gap-x-10">
          {[walkIn, scheduled].map((step, i) => (
            <li key={step.slug} className="border-t border-text/25 py-8 md:py-10">
              <Reveal delay={i * 0.08}>
                <div className="flex items-baseline gap-5">
                  <span
                    aria-hidden
                    className="text-label font-semibold tabular-nums tracking-eyebrow text-text"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[1.9rem] font-light leading-[1.05] tracking-[-0.02em] text-text md:text-[2.4rem]">
                      {step.name}
                    </h3>
                    <p className="mt-4 max-w-[28rem] text-lead leading-[1.65] text-text/85">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        {/* What the time at the table is like. */}
        <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-3 lg:gap-x-10">
          {supporting.map((step, i) => (
            <li key={step.slug} className="border-t border-text/25 pt-7 pb-2 sm:pb-0">
              <Reveal delay={0.1 + i * 0.06}>
                <h3 className="text-lead font-semibold leading-snug text-text">{step.name}</h3>
                <p className="mt-2.5 text-body leading-[1.75] text-text/85">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
