import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow, forScript } from "@/components/ui/SectionHeader";
import {
  BRAND_STORY,
  CLOSING,
  COMMUNITY,
  EVENT_PLATES,
  MISSION,
  PAST_DESTINATIONS,
  TAGLINE,
  VISION,
  WHAT_SETS_US_APART,
  WORKSHOP_JOURNEY,
} from "@/lib/brand";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Maison Palettia is a creative lifestyle brand celebrating creativity, mindfulness and meaningful human connection — hands-on experiences that bring people together.",
  path: "/about",
});

/**
 * /about — who the Maison is, in the order its own deck tells it.
 *
 * Welcome and story (p.2), mission and vision (p.3), how the community is made
 * (p.4–5), what sets it apart (p.11), where it has created (p.12), and the
 * deck's closing line (p.15). Every sentence of substance is lib/brand.ts;
 * the headings are short and say only what their section contains.
 *
 * WHAT CAME OUT. The previous page opened on "Art, craft and company.", ran
 * a sequence of watercolour editorial panels, and included a "Just added"
 * strip whose photographs were glazed ceramic vases — pottery, which the
 * client has asked the site not to show. It also described the programme
 * through the Paint / Shape / Craft / Create strands, which the rest of the
 * site no longer uses.
 */
export default function AboutPage() {
  return (
    <>
      <Welcome />
      <MissionVision />
      <Community />
      <Apart />
      <Created />
      <Close />
    </>
  );
}

/* ---- 01 welcome ---------------------------------------------------------- */

function Welcome() {
  return (
    <section aria-labelledby="about-title" className="bg-surface">
      <Container className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <Eyebrow>About</Eyebrow>
            </Reveal>
            <p className="mt-9 heading-script text-[2.1rem] leading-[1.15] text-primary md:text-[2.6rem]">
              {TAGLINE}
            </p>
            <DisplayHeading
              as="h1"
              id="about-title"
              className="mt-6"
              lines={["Welcome to", "Maison Palettia."]}
            />
            <Reveal delay={0.15}>
              <p className="mt-9 max-w-[34rem] text-lead leading-[1.75] text-text">{BRAND_STORY}</p>
            </Reveal>
          </div>

          <Reveal variant="fadeIn" className="col-span-12 lg:col-span-5 lg:col-start-8">
            <div className="arch relative aspect-[4/5] overflow-hidden bg-cream [--arch-rise:34%]">
              <Image
                src="/images/experience/painting.jpg"
                alt="A hand painting a pale flower on a canvas at an easel, holding a palette of white, lilac and blue paint."
                fill
                priority
                sizes="(min-width: 1024px) 38vw, 92vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---- 02 mission and vision ---------------------------------------------- */

function MissionVision() {
  return (
    <section aria-labelledby="purpose-heading" className="bg-sage py-[5rem] md:py-section">
      <Container>
        <h2 id="purpose-heading" className="sr-only">
          Mission and vision
        </h2>
        <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2">
          {[
            { label: "Our mission", text: MISSION },
            { label: "Our vision", text: VISION },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 0.1}>
              <figure className="border-t border-text/30 pt-8">
                <figcaption className="text-label font-semibold uppercase tracking-eyebrow text-text">
                  {item.label}
                </figcaption>
                <blockquote className="mt-6 text-[1.7rem] font-light leading-[1.25] tracking-[-0.015em] text-text md:text-[2.2rem]">
                  {item.text}
                </blockquote>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---- 03 community ------------------------------------------------------- */

function Community() {
  return (
    <section aria-labelledby="community-about" className="bg-surface py-[5rem] md:py-section lg:py-section-lg">
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Eyebrow>The Maison experience</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="community-about"
              size="compact"
              className="mt-8 md:mt-10"
              lines={["Creating community", "through creativity."]}
            />
            <Reveal delay={0.15}>
              <p className="mt-7 max-w-[30rem] text-body leading-[1.85] text-text/85">{COMMUNITY.body}</p>
              <p className="mt-6 heading-script text-[1.75rem] leading-[1.2] text-primary md:text-[2.1rem]">
                {forScript(COMMUNITY.closer)}
              </p>
            </Reveal>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <Reveal>
              <h3 className="text-label font-semibold uppercase tracking-eyebrow text-text">
                The workshop journey
              </h3>
            </Reveal>
            <ol className="mt-5 border-t border-text/25">
              {WORKSHOP_JOURNEY.map((step, i) => (
                <li key={step.slug} className="border-b border-text/25 py-5">
                  <Reveal delay={i * 0.05}>
                    <div className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3">
                      <span aria-hidden className="text-label font-semibold tabular-nums tracking-eyebrow text-text">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-lead font-semibold leading-snug text-text">{step.name}</p>
                        <p className="mt-1.5 text-body leading-[1.7] text-text/85">{step.description}</p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---- 04 what sets it apart ---------------------------------------------- */

function Apart() {
  return (
    <section aria-labelledby="apart-heading" className="bg-cream py-[5rem] md:py-section">
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <Eyebrow>What sets us apart</Eyebrow>
            </Reveal>
            <ul className="mt-10 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {WHAT_SETS_US_APART.map((point, i) => (
                <li key={point.slug} className="border-t border-text/25 py-6">
                  <Reveal delay={i * 0.06}>
                    <h3 className="text-[1.3rem] font-light leading-tight tracking-[-0.01em] text-text md:text-[1.5rem]">
                      {point.name}
                    </h3>
                    <p className="mt-2.5 text-body leading-[1.75] text-text/85">{point.description}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <Reveal>
              <h3 className="text-label font-semibold uppercase tracking-eyebrow text-text">From our tables</h3>
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-3">
              {EVENT_PLATES.map((plate, i) => (
                <Reveal
                  key={plate.src}
                  variant="fadeIn"
                  delay={i * 0.08}
                  className={i === 0 ? "col-span-2" : undefined}
                >
                  <div
                    className={`relative overflow-hidden rounded-sm bg-surface ${i === 0 ? "aspect-[4/3]" : "aspect-square"}`}
                  >
                    <Image
                      src={plate.src}
                      alt={plate.alt}
                      fill
                      sizes={i === 0 ? "(min-width: 1024px) 30vw, 92vw" : "(min-width: 1024px) 15vw, 46vw"}
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---- 05 where it has created -------------------------------------------- */

function Created() {
  return (
    <section aria-labelledby="created-heading" className="bg-surface py-[5rem] md:py-section">
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Eyebrow>Our experience</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="created-heading"
              size="compact"
              className="mt-8 md:mt-10"
              lines={["Where we’ve", "created."]}
            />
          </div>
          <Reveal delay={0.15} className="col-span-12 lg:col-span-7">
            <p className="text-[1.3rem] font-light leading-[1.55] tracking-[-0.01em] text-text md:text-[1.6rem]">
              {PAST_DESTINATIONS.join(" · ")} and more.
            </p>
            <Link
              href="/locations"
              className="group -my-1.5 mt-7 inline-flex items-baseline gap-3 py-1.5 text-action font-semibold uppercase tracking-eyebrow text-text"
            >
              <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
                Locations
              </span>
              <span aria-hidden className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
                &#8594;
              </span>
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---- 06 close ----------------------------------------------------------- */

function Close() {
  return (
    <section aria-labelledby="about-close" className="stripes py-16 md:py-24">
      <Container>
        <Reveal className="mx-auto max-w-[50rem] bg-cream px-7 py-14 text-center sm:px-12 md:py-18">
          <h2 id="about-close" className="heading-script text-[2.4rem] leading-[1.1] text-primary sm:text-[3.2rem] md:text-[3.8rem]">
            {forScript(CLOSING.heading)}
          </h2>
          <p className="mx-auto mt-6 max-w-[30rem] text-lead leading-[1.7] text-text">{CLOSING.body}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/events"
              className="inline-flex min-h-12 items-center rounded-sm bg-primary px-7 text-action font-semibold uppercase tracking-eyebrow text-on-primary transition-colors duration-300 ease-soft hover:bg-primary/90"
            >
              Explore experiences
            </Link>
            <Link
              href="/private-events"
              className="inline-flex min-h-12 items-center rounded-sm border border-text px-7 text-action font-semibold uppercase tracking-eyebrow text-text transition-colors duration-300 ease-soft hover:bg-text hover:text-cream"
            >
              Plan a private event
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
