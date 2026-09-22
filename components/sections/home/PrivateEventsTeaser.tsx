import { Reveal } from "@/components/motion/Reveal";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { PRIVATE_EVENT_AUDIENCES } from "@/lib/privateEvents";

/**
 * Homepage 11 — private events.
 *
 * DEEP LILAC, ONCE. The brand guide gives Deep Lilac to primary signage and key
 * actions — the architectural moments — and a page with several lilac fields
 * has no focal point at all. This is the only full lilac field on the
 * homepage, spent on the one thing that is both a strong brand moment and a
 * real enquiry.
 *
 * The four programmes are the proposal's own (see lib/privateEvents.ts), so a
 * visitor is never offered a kind of private event the studio has not
 * contracted a page for. No packages, prices, capacities or inclusions appear,
 * because none have been supplied.
 *
 * INK. On Deep Lilac only the near-white `surface` clears 4.5:1 (4.90) for
 * text at reading size; White Rock (3.95) and Light Sage (3.83) are display
 * size only. Everything here that is read at body size is `surface`.
 */
export function PrivateEventsTeaser() {
  return (
    <section
      aria-labelledby="private-events-teaser"
      className="relative bg-primary py-[5rem] text-surface md:py-section lg:py-section-lg [--color-focus:var(--color-cream)]"
    >
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <Eyebrow ground="lilac">Private events</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="private-events-teaser"
              ground="lilac"
              className="mt-8 md:mt-10"
              lines={["Make something", "memorable", "together."]}
            />
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-[30rem] text-lead leading-[1.7] text-surface">
                Creative experiences shaped around your people and your occasion. Tell us what you
                are planning and we will help you create it.
              </p>
            </Reveal>
          </div>

          <div className="col-span-12 flex flex-col justify-end lg:col-span-5 lg:col-start-8">
            <ul>
              {PRIVATE_EVENT_AUDIENCES.map((audience, i) => (
                <li key={audience.slug} className="border-t border-surface/40 py-5">
                  <Reveal delay={i * 0.06}>
                    <h3 className="text-[1.3rem] font-light leading-tight tracking-[-0.01em] text-surface md:text-[1.5rem]">
                      {audience.name}
                    </h3>
                    <p className="mt-1.5 text-fine leading-[1.6] text-surface">{audience.description}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
            <Reveal delay={0.25}>
              <div className="border-t border-surface/40 pt-8">
                {/*
                  White Rock button on the lilac field: a figure standing on the
                  ground rather than a second lilac shape dissolving into it.
                */}
                {/* A pill now, and White Rock on the lilac field: the site's
                    primary action is one object wherever it appears. */}
                <BlobButton
                  href="/private-events"
                  tone="cream"
                  className="min-h-12 w-full justify-center px-7 sm:w-auto"
                >
                  Plan a private event
                </BlobButton>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
