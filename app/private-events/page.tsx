import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import {
  PRIVATE_EVENT_ACTIVITIES,
  PRIVATE_EVENT_IMAGES,
  PRIVATE_EVENT_OCCASIONS,
  PRIVATE_EVENT_STEPS,
} from "@/lib/privateEvents";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Private events",
  description:
    "Creative experiences for groups — a private Maison Palettia session planned around your gathering, with everyone making something to take home.",
  path: "/private-events",
});

/** Where the enquiry lives. One constant, because three surfaces point at it. */
const ENQUIRY_HREF = "/private-events/book";

/**
 * The hero statement. Larger than the About page's, which is itself larger
 * than the homepage's — this page is asked to feel more premium than the rest
 * of the site, and on a type-led site that is mostly a decision about scale
 * and about how much air is left around it.
 */
const HERO_LINE =
  "block font-light uppercase leading-[0.9] tracking-[-0.03em] " +
  "text-[2.75rem] xs:text-[3.5rem] sm:text-[4.5rem] md:text-[5rem] lg:text-[6.5rem] xl:text-[7.5rem]";

const SECTION_LINE =
  "block font-light uppercase leading-[0.96] tracking-[-0.02em] " +
  "text-[2rem] xs:text-[2.5rem] sm:text-[3rem] md:text-[3rem] lg:text-[3.75rem] xl:text-[4.25rem]";

const EYEBROW = "flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow";

/**
 * /private-events — creative experiences for groups.
 *
 * WHAT THIS PAGE IS CAREFUL NOT TO BE. An event-planning company. That is the
 * whole positioning note in the brief and it is a design problem before it is
 * a copy problem: the visual grammar of event planning is a wide photograph of
 * people laughing around a table, a row of three packages with prices under
 * them, and a strip of client logos. This page has none of those, and not
 * because they were left for later — it has no component shaped to hold a
 * price, a capacity or a testimonial, because a slot built for a number is a
 * slot somebody eventually fills with an invented one.
 *
 * What it is instead: the same editorial language as the rest of the site,
 * turned up. A watercolour rather than a party as the hero, statements set two
 * steps larger than /about sets them, occasions as a line of type rather than
 * as five cards, and the activities as a numbered index beside one true
 * photograph. Every section is a different shape, which is how the rest of
 * this site is read.
 *
 * EVERY CLAIM IS TRACEABLE. The words come from lib/privateEvents.ts, where
 * the line between what the client supplied and what would be invention is
 * documented at length. Nothing on this page states a price, a package, a
 * capacity, a duration, a venue, a client or a guarantee.
 *
 * Server component throughout. Nothing here needs the browser: the content is
 * static and the only interactive thing on the page is a link to the enquiry.
 */
export default function PrivateEventsPage() {
  return (
    <>
      <Hero />
      <TheExperience />
      <CreativeOptions />
      <HowItWorks />
      <EnquiryCta />
    </>
  );
}

/* ==========================================================================
   01 — HERO
   ========================================================================== */

/**
 * A full-bleed artwork with the title standing at its foot.
 *
 * Pulled up under the sticky bar by exactly the bar's own height, the same
 * device the homepage hero uses, so the picture runs behind the navigation
 * rather than starting below it. `/private-events` is registered in
 * DARK_HERO_ROUTES so the bar inverts to its light treatment over it.
 *
 * THE SCRIM IS NOT DECORATION. Cream type on this plate is legible in the deep
 * blue at the left and not legible at all where the wash opens to warm yellow
 * on the right, so the type gets a gradient under it rather than a guess. The
 * stops are the ones the editorial spreads arrived at for the same job — see
 * `foot` in EditorialStatement — and they are measured again on this plate in
 * the browser rather than assumed to transfer.
 *
 * `justify-end` puts the title at the foot, which also settles the header
 * clearance question: nothing in the type block can collide with the bar
 * because the type block is at the other end of the screen.
 */
function Hero() {
  const image = PRIVATE_EVENT_IMAGES.hero;

  return (
    <section
      aria-labelledby="private-events-title"
      className={
        "relative isolate -mt-header flex min-h-[max(34rem,82svh)] flex-col justify-end " +
        "overflow-hidden bg-text md:-mt-header-lg md:min-h-[88vh] lg:min-h-[92vh] " +
        "[--color-focus:var(--color-cream)]"
      }
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/*
        Measured on this plate, not inherited from another one.

        These stops began as the editorial spread's `foot` scrim, which is
        calibrated for a busy mural photographed edge to edge. On a watercolour
        that is two thirds deep blue it was far too heavy — it flattened the
        whole picture to charcoal and the hero lost the only thing that made it
        this page's rather than any page's.

        What replaced it is the lightest gradient that clears every bar, found
        by sampling the composite under the letterforms rather than under the
        blocks holding them. That distinction is the whole reason this is light:
        the title and the eyebrow are full-width boxes whose text sits in the
        left third, and measuring the boxes drags the bright right-hand side of
        the wash into a reading it never actually sits behind.

        Worst case at each element, cream on the composite: eyebrow 4.70:1,
        title 4.80:1, standfirst 6.65:1. The eyebrow is the one that sets these
        numbers — it sits highest in the block, where the scrim has nearly gone,
        and it is 12px so it owes the full 4.5:1 where the 120px title owes 3:1.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-text/72 via-text/45 via-45% to-transparent to-85%"
      />

      <Container className="relative pb-[3.5rem] pt-[8rem] md:pb-[4.5rem] lg:pb-[5.5rem]">
        <Reveal>
          <p className={`${EYEBROW} text-cream`}>
            <span aria-hidden className="h-px w-9 shrink-0 bg-sage md:w-12" />
            Creative experiences for groups
          </p>
        </Reveal>

        <h1 id="private-events-title" className="mt-7 text-cream md:mt-9">
          {/*
            Two masked lines, one trigger — the device the brand statement and
            the About page both use, at the largest scale on the site. The
            explicit space keeps the accessible name reading as a phrase.
          */}
          <Stagger>
            <HeroLine>Private</HeroLine> <HeroLine>events.</HeroLine>
          </Stagger>
        </h1>

        <Reveal delay={0.25} className="mt-9 md:mt-11">
          {/* Full strength. The scrim above was measured against cream at
              100%, and fading the one paragraph it was measured for is how a
              measurement quietly stops being true. */}
          <p className="max-w-[34rem] text-lead leading-[1.7] text-cream">
            An afternoon built around making something together — planned with you, and shaped
            around the people coming.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

/** One masked line of the title. The mask needs its own overflow parent. */
function HeroLine({ children }: { children: string }) {
  return (
    <span className="block overflow-hidden pb-[0.1em] [&+span]:-mt-[0.1em]">
      <Reveal as="span" variant="maskUp" className={HERO_LINE}>
        {children}
      </Reveal>
    </span>
  );
}

/* ==========================================================================
   02 — THE EXPERIENCE
   ========================================================================== */

/**
 * What a private session actually is, explained by reference to the thing the
 * studio already does.
 *
 * That framing is doing real work. The Maison runs public sessions at fixed
 * times in malls, and everyone reading this page can go and look at them — so
 * the honest and the persuasive answer are the same one: it is that, arranged
 * around your group instead of around a public date. It promises nothing new,
 * and it borrows all the credibility of something the visitor can verify in
 * two clicks.
 *
 * The occasions sit here rather than in a section of their own, set as a line
 * of type under a rule. Five cards with icons would be the generic move and
 * would also give each example a visual weight it has not earned — these are
 * specimens, not an offer.
 */
function TheExperience() {
  const image = PRIVATE_EVENT_IMAGES.experience;

  return (
    <Container
      as="section"
      aria-labelledby="private-events-experience"
      className="py-[5rem] md:py-section lg:py-section-lg"
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
        {/*
          The plate leads on the left and the argument answers it on the right.
          Portrait, and deliberately not full width: the hero has just filled
          the screen edge to edge, and a second full-bleed picture immediately
          under it would read as a slideshow rather than as a page.
        */}
        <Reveal
          variant="fadeIn"
          className="col-span-12 md:col-span-5 lg:col-span-5"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-alt">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 768px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <div className="col-span-12 md:col-span-7 md:pl-[4%] lg:col-span-6 lg:col-start-7 lg:pl-0">
          <Reveal>
            <p className={`${EYEBROW} text-text`}>
              <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
              The experience
            </p>
          </Reveal>

          <h2 id="private-events-experience" className="mt-8 md:mt-10">
            <Stagger>
              <SectionLine>Your group,</SectionLine> <SectionLine>making.</SectionLine>
            </Stagger>
          </h2>

          <Reveal delay={0.15}>
            <p className="mt-9 max-w-[34rem] text-body leading-[1.9] text-text/80 md:mt-11">
              Maison Palettia runs hands-on creative sessions — a table, the materials, someone
              to show you how, and a couple of hours to make something. A private event is the
              same thing, arranged around your group rather than around a public date.
            </p>
            <p className="mt-6 max-w-[34rem] text-body leading-[1.9] text-text/80">
              Nobody needs to have done it before. That is usually the point: a room of people
              who are all equally new to it, which turns out to be the fastest way to get a
              group talking.
            </p>
          </Reveal>

          {/*
            Framed as examples in the heading itself, not in small print under
            it. The brief asks for these to be carefully presented and this is
            the careful version — the label says what the list is before the
            list is read.
          */}
          <Reveal delay={0.25} className="mt-12 border-t border-line pt-8 md:mt-14">
            <h3 className="text-label font-medium uppercase tracking-eyebrow text-text/75">
              Examples of what a session can be built around
            </h3>
            <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-3">
              {PRIVATE_EVENT_OCCASIONS.map((occasion) => (
                <li
                  key={occasion.slug}
                  className="border border-text/20 px-4 py-2 text-fine text-text/85"
                >
                  {occasion.label}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[32rem] text-fine leading-[1.7] text-text/70">
              Not a fixed list. If your gathering is none of these, it is still worth asking.
            </p>
          </Reveal>
        </div>
      </div>
    </Container>
  );
}

/* ==========================================================================
   03 — CREATIVE OPTIONS
   ========================================================================== */

/**
 * The six activities, as a numbered index beside one photograph.
 *
 * WHY AN INDEX AND NOT SIX CARDS. Two reasons, and they agree. The brief rules
 * out excessive cards and asks for large type and generous space, which an
 * index is and a grid of six tiles is not. And the project holds a real
 * photograph for two of these six and nothing for the other four — so a card
 * grid would either ship four grey boxes or four pictures of the wrong craft.
 * The index states all six truthfully at the same weight, and the one plate
 * beside it is of an activity that is actually on the list.
 *
 * The numerals are the composition. Set large and quiet against the names,
 * they give the run a rhythm that six equal rows would not have, and they cost
 * nothing to extend when a seventh activity is approved.
 */
function CreativeOptions() {
  const image = PRIVATE_EVENT_IMAGES.activities;

  return (
    <section
      aria-labelledby="private-events-options"
      className="bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 md:col-span-7">
            <Reveal>
              <p className={`${EYEBROW} text-text`}>
                <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
                Creative options
              </p>
            </Reveal>

            <h2 id="private-events-options" className="mt-8 md:mt-10">
              <Stagger>
                <SectionLine>Choose what</SectionLine> <SectionLine>you make.</SectionLine>
              </Stagger>
            </h2>
          </div>

          <Reveal
            delay={0.2}
            className="col-span-12 md:col-span-5 md:col-start-8 md:pb-3"
          >
            <p className="max-w-[26rem] text-body leading-[1.85] text-text/80">
              One activity per session, chosen before the day so everything is ready when your
              group arrives.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-12 gap-x-6 gap-y-12 md:mt-20 lg:gap-x-10">
          {/*
            The index takes the wider column. It is the content of this
            section; the photograph is evidence that the content is real.
          */}
          <ol className="col-span-12 lg:col-span-7">
            {PRIVATE_EVENT_ACTIVITIES.map((activity, i) => (
              <li key={activity.slug}>
                <Reveal delay={i * 0.05}>
                  <div className="flex items-baseline gap-6 border-t border-text/15 py-7 md:gap-9 md:py-8">
                    {/*
                      /75, not the /45 this was drawn at. Measured on White
                      Rock: /45 composites to 2.33:1, and while the <ol> gives
                      a screen reader the order for free, a sighted reader gets
                      it from these numerals and nowhere else — which makes
                      them content at 11px, owing the full 4.5:1. /75 is 4.81.
                    */}
                    <span
                      aria-hidden
                      className="shrink-0 text-label font-medium tabular-nums tracking-eyebrow text-text/75"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[1.375rem] font-light leading-[1.15] tracking-[-0.015em] text-text md:text-[1.75rem] lg:text-[2rem]">
                        {activity.name}
                      </h3>
                      <p className="mt-3 max-w-[30rem] text-body leading-[1.8] text-text/75">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal
            variant="fadeIn"
            delay={0.2}
            className="col-span-12 lg:col-span-4 lg:col-start-9"
          >
            {/*
              Held at the top of its column so it sits against the head of the
              index rather than floating level with its middle.
            */}
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface lg:aspect-[3/4]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                className="object-cover"
              />
            </div>
            {/* /75 rather than /70: on White Rock the latter is 4.22:1, just
                under what 13px owes. */}
            <p className="mt-4 text-fine leading-[1.7] text-text/75">
              Ceramic painting — one of the six, mid-session.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ==========================================================================
   04 — HOW IT WORKS
   ========================================================================== */

/**
 * Four steps, as a horizontal run on desktop and a stacked list on a phone.
 *
 * The numerals carry the sequence rather than arrows between the steps: an
 * arrow has to be drawn four times, breaks differently at every width, and
 * says nothing "01, 02, 03, 04" does not. The hairline above each step does
 * the joining instead — on desktop the four rules read as one line across the
 * page with the steps hanging from it.
 *
 * The wording is the client's. See lib/privateEvents.ts for what has
 * deliberately not been added to it.
 */
function HowItWorks() {
  return (
    <Container
      as="section"
      aria-labelledby="private-events-process"
      className="py-[5rem] md:py-section lg:py-section-lg"
    >
      <Reveal>
        <p className={`${EYEBROW} text-text`}>
          <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
          How it works
        </p>
      </Reveal>

      <h2 id="private-events-process" className="mt-8 md:mt-10">
        <Stagger>
          <SectionLine>Four steps,</SectionLine> <SectionLine>then the day.</SectionLine>
        </Stagger>
      </h2>

      <ol className="mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:mt-20 lg:grid-cols-4 lg:gap-x-10">
        {PRIVATE_EVENT_STEPS.map((step, i) => (
          <li key={step.number}>
            <Reveal delay={i * 0.08}>
              <div className="border-t border-line pt-6">
                {/*
                  /60, not the /25 this was drawn at. At 48px these are large
                  text and owe 3:1; /25 measured 1.59:1 on the page ground,
                  which is not pale-as-a-choice, it is illegible. /60 is 3.57
                  and still reads as the quiet layer under the step title.
                */}
                <p
                  aria-hidden
                  className="text-[2.5rem] font-light leading-none tabular-nums tracking-[-0.03em] text-text/60 md:text-[3rem]"
                >
                  {step.number}
                </p>
                <h3 className="mt-6 text-lead font-medium leading-snug text-text">
                  {step.title}
                </h3>
                <p className="mt-3 text-body leading-[1.8] text-text/75">{step.detail}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Container>
  );
}

/* ==========================================================================
   05 — ENQUIRY
   ========================================================================== */

/**
 * The close, on the brand's one saturated ground.
 *
 * Deep Lilac carries exactly one full field on the homepage and nothing else,
 * which is what keeps it a focal colour rather than a background — see the
 * ground rhythm at the head of globals.css. This page spends that one field
 * here, on the only thing it is asking anyone to do.
 *
 * One action, and no second one competing with it. There is no "or call us" —
 * `CONTACT.phone` is still null — and no "download our brochure", because
 * there is no brochure.
 */
function EnquiryCta() {
  return (
    <section
      aria-labelledby="private-events-enquiry"
      className="bg-primary py-[5.5rem] text-surface md:py-section lg:py-section-lg [--color-focus:var(--color-cream)]"
    >
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-10 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              {/*
                The ink on Deep Lilac is not a free choice, and it is not the
                one the rest of the site's dark grounds use. Measured on this
                field: Light Sage 3.83:1, White Rock (--color-on-dark) 3.95:1,
                --color-surface 4.90:1. The first two are fine for display type
                and both fail the 4.5:1 a 12px label owes, so everything read
                at body size or below in this section is set in `surface` — the
                same answer the homepage's lilac field arrived at.

                The rule keeps Light Sage: it is a graphical object, owes 3:1,
                and clears it.
              */}
              <p className={`${EYEBROW} text-surface`}>
                <span aria-hidden className="h-px w-9 shrink-0 bg-sage md:w-12" />
                Enquire
              </p>
            </Reveal>

            <h2 id="private-events-enquiry" className="mt-8 md:mt-10">
              <Stagger>
                <SectionLine tone="light">Tell us about</SectionLine>{" "}
                <SectionLine tone="light">your event.</SectionLine>
              </Stagger>
            </h2>

            <Reveal delay={0.2}>
              {/*
                Full strength, not /90. Faded to 90% this lands at 4.31:1 —
                under the bar — which is the kind of miss an opacity modifier
                makes easy to ship. See the note on the eyebrow above.
              */}
              <p className="mt-9 max-w-[34rem] text-body leading-[1.9] text-surface">
                Send us the shape of it — roughly when, roughly how many, and what you would
                like everyone to make. We will come back to you with what the session could
                look like.
              </p>
            </Reveal>
          </div>

          <Reveal
            delay={0.3}
            className="col-span-12 lg:col-span-4 lg:col-start-9 lg:justify-self-end"
          >
            <Link
              href={ENQUIRY_HREF}
              className={
                "group inline-flex w-full items-center justify-center gap-3 bg-cream px-9 py-6 " +
                "text-action font-medium uppercase leading-none tracking-eyebrow text-text " +
                "transition-colors duration-300 ease-soft hover:bg-surface sm:w-auto"
              }
            >
              Plan a private event
              <span
                aria-hidden
                className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
              >
                &#8594;
              </span>
            </Link>
          </Reveal>
        </div>

        <Reveal variant="fadeIn" delay={0.4} className="mt-16 md:mt-20">
          <Signature ground="lilac" className="text-center">
            come and make something
          </Signature>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * One masked line of a section heading.
 *
 * `tone` picks the ink rather than leaving it to a className the caller
 * passes, for the reason <Signature> does the same: on this palette the ink is
 * decided by the ground, and a free choice is a choice somebody eventually
 * gets wrong.
 */
function SectionLine({
  children,
  tone = "dark",
}: {
  children: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className="block overflow-hidden pb-[0.12em] [&+span]:-mt-[0.12em]">
      <Reveal
        as="span"
        variant="maskUp"
        className={`${SECTION_LINE} ${tone === "light" ? "text-surface" : "text-text"}`}
      >
        {children}
      </Reveal>
    </span>
  );
}
