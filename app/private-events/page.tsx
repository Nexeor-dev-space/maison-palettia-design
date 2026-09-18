import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import {
  getCreativeExperiences,
  type CreativeExperience,
} from "@/lib/experiences";
import { getMallPartners } from "@/lib/partners";
import {
  PRIVATE_EVENT_AUDIENCES,
  PRIVATE_EVENT_IMAGES,
  PRIVATE_EVENT_STEPS,
} from "@/lib/privateEvents";
import { buildMetadata } from "@/lib/seo";
import type { MallPartner } from "@/types";

export const metadata = buildMetadata({
  title: "Private events",
  description:
    "Creative experiences designed around your people, your occasion and your space — a private Maison Palettia session where everyone makes something to take home.",
  path: "/private-events",
});

/** Where the enquiry lives. One constant, because two surfaces point at it. */
const ENQUIRY_HREF = "/private-events/book";

/**
 * The section statement, composed per breakpoint.
 *
 * Hand-set rather than folded into `text-h1` for the reason the ADOPTION note
 * in globals.css draws the line: the run from 2rem to 4.25rem is wider than
 * any single step of the scale, and these lines are this page's editorial
 * voice rather than ordinary headings.
 */
const SECTION_LINE = "heading-script text-script-section";

/**
 * The hero statement, composed per breakpoint rather than taken from
 * `text-display`.
 *
 * The token tops out at 104px, and it was 104px here until the hero was
 * measured: two lines at that size push the eyebrow to 65% of the hero's
 * height, which is above anything a foot field can reach without covering the
 * photograph entirely. At 84px the block is 40px shorter and sits inside the
 * field, which buys back a third of the picture. It is still the largest type
 * on the page by a wide margin.
 */
const HERO_LINE = "heading-script text-script-hero";

const EYEBROW =
  "flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow";
const TERM = "text-label font-medium uppercase tracking-eyebrow";

/**
 * /private-events — creative experiences for groups.
 *
 * THE GROUND RHYTHM, WHICH IS THE CLIENT'S STANDING COMPLAINT ANSWERED. The
 * note is that the site does not follow its own palette, so this page is cast
 * the way the homepage is cast in globals.css — quiet fields making room for
 * loud ones, rather than a different colour every section:
 *
 *   Hero .............. PHOTOGRAPH      cream type on the plate
 *   Introduction ...... light           the page's own off-white
 *   Who it is for ..... WHITE ROCK      warm, and the type carries it
 *   The experiences ... light           the photography is the colour here
 *   Create with us .... LIGHT SAGE      the structural brand field
 *   How it works ...... light           quiet before the close
 *   Enquire ........... DEEP LILAC      the one focal field on the page
 *
 * Deep Lilac carries exactly one full field and nothing else, which is the
 * rule that keeps it an accent rather than a background. Every value on this
 * page is a semantic token; there is not one literal colour in the file.
 *
 * WHAT IT IS CAREFUL NOT TO BE. An event-planning company. That grammar is a
 * wide shot of people laughing round a table, three packages with prices under
 * them, and a strip of client logos. None of those are here, and not because
 * they were deferred — there is no component on this page shaped to hold a
 * price, a capacity or a testimonial, because a slot built for a number is a
 * slot somebody eventually fills with an invented one.
 *
 * EVERY CLAIM IS TRACEABLE. The audiences and the process come from
 * lib/privateEvents.ts; the activities come from `getCreativeExperiences()`,
 * the same approved list the homepage reads, so this page cannot name
 * something the studio does not offer; the destination comes from
 * `getMallPartners()`, which holds exactly one real agreement. Nothing states a
 * price, a package, a guest count, a duration, a guarantee or a client.
 *
 * NO SECOND BOOKING FLOW. The one action is the enquiry form that already
 * exists at {@link ENQUIRY_HREF}. The scheduled-session booking, the cart and
 * checkout are untouched by this page and unreachable from it.
 *
 * Server component throughout: the content is static and the only interactive
 * things on the page are links.
 */
export default async function PrivateEventsPage() {
  /*
    Both seams are already async for the CMS that will replace them, so they
    are awaited together rather than in series — two round trips on the same
    page would otherwise queue for no reason.
  */
  const [experiences, partners] = await Promise.all([
    getCreativeExperiences(),
    getMallPartners(),
  ]);

  return (
    <>
      <Hero />
      <Introduction />
      <WhoItIsFor />
      <Experiences experiences={experiences} />
      <CreateWithUs partner={partners[0]} />
      <HowItWorks />
      <EnquiryCta />
    </>
  );
}

/* ==========================================================================
   01 — HERO
   ========================================================================== */

/**
 * A full-bleed photograph with the title standing at its foot.
 *
 * Pulled up under the sticky bar by exactly the bar's own height, the same
 * device the homepage hero uses, so the picture runs behind the navigation
 * rather than starting below it. `/private-events` is registered in
 * DARK_HERO_ROUTES, which is what inverts the bar to its light treatment here.
 *
 * ONE ACTION, AND ONLY ONE. A hero with two offers has decided nothing.
 * Everything else the page has to say is below it, where anyone who wants it
 * will find it.
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
        style={{ objectPosition: image.position }}
        className="object-cover"
      />

      {/*
        TWO SCRIMS, AND THE SECOND ONE IS A FIELD RATHER THAN A WASH.

        This started as the usual single gradient rising from the foot, and it
        was measured rather than trusted: cream on the composite came back at
        1.28:1 on the eyebrow, 1.47:1 on the title and 3.58:1 on the standfirst.
        Not marginal — illegible.

        The cause is geometry, not strength. The type block here is an eyebrow,
        two lines of display, a standfirst and a button: about 540px of stack,
        so its top sits around 65% of the way up the hero, in the middle of the
        picture. A foot gradient has decayed to roughly 0.13 alpha by then, and
        sweeping it — five strengths across six crops, then again with the title
        at 104, 84 and 68px — never cleared 3:1 on the first line without a wash
        heavy enough to flatten the whole photograph to charcoal. That is the
        trade the editorial spreads already refused once.

        So the foot is a defined field with a soft edge instead: ink at 0.86 or
        better everywhere the type actually sits. That is legible by
        construction rather than by measurement — 0.86 charcoal over pure white
        composites to 6:1 against cream — so it holds over any crop and cannot
        quietly stop being true when the picture is reframed.

        AND IT IS TIED TO THE TYPE, NOT TO THE HERO. It was a percentage of the
        section at first, which passed at 1440 and failed at 390: the hero
        shrinks with the viewport but the type block does not, so the eyebrow
        climbed out of the strong zone and measured 2.09:1 on a phone. The field
        is now the type block's own background — it is exactly as tall as the
        content plus the padding above it, at every width, and the fade runs out
        through that padding. Nothing about it needs re-measuring when the
        section's height changes.

        The band at the top is the homepage hero's own, for the header rather
        than for this type: `/private-events` is in DARK_HERO_ROUTES, so the bar
        renders its light ink here and needs a ground to do it over.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-text/80 via-text/80 via-45% to-transparent md:h-56 md:via-40%"
      />

      <div className="relative w-full bg-gradient-to-t from-text/92 via-text/86 via-80% to-transparent">
        <Container className="relative pb-[3.5rem] pt-[8rem] md:pb-[4.5rem] lg:pb-[5.5rem]">
          <Reveal>
            <p className={`${EYEBROW} text-cream`}>
              <span aria-hidden className="h-px w-9 shrink-0 bg-sage md:w-12" />
              Private events
            </p>
          </Reveal>

          <h1 id="private-events-title" className="mt-7 text-cream md:mt-9">
            {/*
            Two masked lines, one trigger — the device the brand statement and
            the About page both use. The explicit space between them keeps the
            accessible name reading as a sentence rather than as two fragments.
          */}
            <Stagger>
              <HeroLine>Make something</HeroLine>{" "}
              <HeroLine>memorable together.</HeroLine>
            </Stagger>
          </h1>

          <Reveal delay={0.25} className="mt-8 md:mt-10">
            {/* Full strength. The scrim above was measured against cream at
              100%, and fading the one paragraph it was measured for is how a
              measurement quietly stops being true. */}
            <p className="max-w-[34rem] text-lead leading-[1.7] text-cream">
              Creative experiences designed around your people, your occasion
              and your space.
            </p>
          </Reveal>

          <Reveal delay={0.35}>
            <PlanAction tone="onImage" className="mt-9 md:mt-11" />
          </Reveal>
        </Container>
      </div>
    </section>
  );
}

/**
 * One masked line of the title.
 *
 * The mask needs its own overflow parent, and the negative margin on the
 * second line takes back the descender room the first one reserves — without
 * it the two lines set further apart than the leading asks for.
 */
function HeroLine({ children }: { children: string }) {
  return (
    <span className={`script-mask ${HERO_LINE}`}>
      <Reveal as="span" variant="maskUp" className="block">
        {children}
      </Reveal>
    </span>
  );
}

/* ==========================================================================
   02 — INTRODUCTION
   ========================================================================== */

/**
 * What a private event is, in one short passage.
 *
 * Deliberately brief. The hero has already said what it is for; this says what
 * it is, and everything after it is evidence. A page that explains itself for
 * three paragraphs before showing anything is a brochure.
 *
 * The statement holds the left and the paragraph sits low and right, so the
 * eye crosses the measure before it starts down the page — the masthead
 * arrangement the homepage sections use.
 */
function Introduction() {
  return (
    <Container
      as="section"
      aria-labelledby="private-events-intro"
      className="py-[5rem] md:py-section lg:py-section-lg"
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-8 lg:gap-x-10">
        <div className="col-span-12 lg:col-span-7">
          <Reveal>
            <p className={`${EYEBROW} text-text`}>
              <span
                aria-hidden
                className="h-px w-9 shrink-0 bg-terracotta md:w-12"
              />
              Creative experiences, made for your moment
            </p>
          </Reveal>

          <h2 id="private-events-intro" className="mt-8 md:mt-10">
            <Stagger>
              <SectionLine>Bring people together</SectionLine>{" "}
              <SectionLine>through making.</SectionLine>
            </Stagger>
          </h2>
        </div>

        <Reveal
          delay={0.2}
          className="col-span-12 lg:col-span-4 lg:col-start-9 lg:self-end lg:pb-2"
        >
          <p className="max-w-[30rem] text-body leading-[1.9] text-text/80">
            From team gatherings to celebrations, Maison Palettia creates
            hands-on experiences that give people a reason to sit down together,
            make something, and take it home.
          </p>
        </Reveal>
      </div>
    </Container>
  );
}

/* ==========================================================================
   03 — WHO IT IS FOR
   ========================================================================== */

/**
 * The four audiences, as an editorial index rather than four cards.
 *
 * WHY NOT CARDS. Two reasons, and they agree. Four identical cards is the
 * generic move and reads as a component rather than as a page. And the project
 * holds no photograph of a corporate team, a birthday or a brand activation —
 * every picture in it is of somebody making something — so four cards would
 * mean four borrowed crops, each one a caption overstating what it shows.
 *
 * Set as an index the names carry the section, which is what the type on this
 * site is for, and the numerals give the run a rhythm four equal tiles would
 * not have. See lib/privateEvents.ts for the TODO that turns this image-led
 * the day the studio shoots a group.
 *
 * The copy says these are the kinds of group a session can be built around —
 * a description of the offer. It is careful never to imply the studio has
 * already run them, which is a claim nobody has verified.
 */
function WhoItIsFor() {
  return (
    <section
      aria-labelledby="private-events-audiences"
      className="bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 lg:gap-x-10">
          <div className="col-span-12 md:col-span-7">
            <Reveal>
              <p className={`${EYEBROW} text-text`}>
                <span
                  aria-hidden
                  className="h-px w-9 shrink-0 bg-terracotta md:w-12"
                />
                Who it is for
              </p>
            </Reveal>

            <h2 id="private-events-audiences" className="mt-8 md:mt-10">
              <Stagger>
                <SectionLine>Groups of</SectionLine>{" "}
                <SectionLine>every kind.</SectionLine>
              </Stagger>
            </h2>
          </div>

          <Reveal delay={0.2} className="col-span-12 md:col-span-5 md:pb-3">
            <p className="max-w-[26rem] text-body leading-[1.85] text-text/80">
              Examples of the groups a session can be built around. If yours is
              none of these, it is still worth asking.
            </p>
          </Reveal>
        </div>

        <ol className="mt-12 md:mt-16">
          {PRIVATE_EVENT_AUDIENCES.map((audience, i) => (
            /*
              The slug is the anchor the bar's Private events menu points at.
              Three of these programmes have no page of their own yet — the
              proposal says their content arrives when the client is ready —
              so the menu sends a visitor to the entry that describes it here
              rather than to a route invented to receive them. `scroll-mt`
              clears the fixed bar, which would otherwise cover the heading
              the anchor just landed on.
            */
            <li key={audience.slug} id={audience.slug} className="scroll-mt-header md:scroll-mt-[var(--spacing-header-lg)]">
              <Reveal delay={i * 0.06}>
                <div className="grid grid-cols-12 items-baseline gap-x-5 border-t border-text/15 py-7 md:gap-x-8 md:py-9">
                  {/*
                    /75, not the pale wash a numeral like this usually gets.
                    Measured on White Rock: /45 composites to 2.33:1, and while
                    the <ol> gives a screen reader the order for free, a sighted
                    reader gets it from these numerals and nowhere else — which
                    makes them content at 11px, owing the full 4.5:1. /75 is
                    4.81.
                  */}
                  <span
                    aria-hidden
                    className={`col-span-2 ${TERM} tabular-nums text-text/75 md:col-span-1`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <h3 className="col-span-10 text-h3 font-light tracking-[-0.015em] text-text md:col-span-5">
                    {audience.name}
                  </h3>

                  <p className="col-span-12 mt-3 max-w-[34rem] text-body leading-[1.8] text-text/80 md:col-span-6 md:mt-0">
                    {audience.description}
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

/* ==========================================================================
   04 — THE EXPERIENCES
   ========================================================================== */

/**
 * The creative work itself, read from the studio's approved list.
 *
 * THE SOURCE IS THE POINT. These come from `getCreativeExperiences()` — the
 * same set the homepage reads — rather than from a list written for this page.
 * The two used to be separate arrays saying overlapping things, which is the
 * drift this codebase keeps warning about; now an activity added, renamed or
 * photographed there appears here with no second edit, and this page can never
 * name something the studio does not offer.
 *
 * FRAMED AS EXAMPLES, NOT AS A MENU. Nothing in the project confirms which of
 * these can be booked privately, so the copy introduces them as the Maison's
 * creative world and says the right activity is shaped with you — which is
 * true — rather than presenting seven bookable packages, which is not.
 *
 * Two of the seven have no photograph. They are set on a plain ground with
 * their name rather than borrowing a picture of a different craft: the field
 * is optional on {@link CreativeExperience} for exactly that reason.
 */
function Experiences({ experiences }: { experiences: CreativeExperience[] }) {
  if (experiences.length === 0) return null;

  const [lead, ...rest] = experiences;

  return (
    <Container
      as="section"
      aria-labelledby="private-events-experiences"
      className="py-[5rem] md:py-section lg:py-section-lg"
    >
      <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 lg:gap-x-10">
        <div className="col-span-12 md:col-span-7">
          <Reveal>
            <p className={`${EYEBROW} text-text`}>
              <span
                aria-hidden
                className="h-px w-9 shrink-0 bg-terracotta md:w-12"
              />
              The experiences
            </p>
          </Reveal>

          <h2 id="private-events-experiences" className="mt-8 md:mt-10">
            <Stagger>
              <SectionLine>Choose what</SectionLine>{" "}
              <SectionLine>you make.</SectionLine>
            </Stagger>
          </h2>
        </div>

        <Reveal delay={0.2} className="col-span-12 md:col-span-5 md:pb-3">
          <p className="max-w-[26rem] text-body leading-[1.85] text-text/80">
            The Maison&rsquo;s creative world, as a starting point. We shape the
            right activity for your group once you have told us about it.
          </p>
        </Reveal>
      </div>

      {/*
        One large plate and a run of smaller ones, rather than seven of a size.

        The asymmetry is the composition: a grid of equal tiles is a catalogue,
        and this page is asked to be editorial. The lead takes the full measure
        on a phone and just over half the grid from `md`, so the difference in
        scale survives the narrow screen instead of collapsing into a stack of
        identical blocks.
      */}
      <div className="mt-12 grid grid-cols-12 gap-x-6 gap-y-8 md:mt-16 lg:gap-x-10">
        <Reveal variant="fadeIn" className="col-span-12 md:col-span-7">
          <Plate
            experience={lead}
            className="aspect-[4/3] md:aspect-[5/4]"
            sizes="(min-width: 768px) 56vw, 92vw"
            large
          />
        </Reveal>

        <div className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-8 md:col-span-5 lg:gap-x-10">
          {rest.map((experience, i) => (
            <Reveal
              key={experience.slug}
              variant="fadeIn"
              delay={0.08 + i * 0.05}
            >
              <Plate
                experience={experience}
                className="aspect-[3/4]"
                sizes="(min-width: 768px) 22vw, 44vw"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </Container>
  );
}

/**
 * One experience.
 *
 * The name sits on the photograph where there is one and under it where there
 * is not, so an entry with no picture is a quiet typographic block rather than
 * a grey rectangle pretending to be a plate.
 *
 * `alt=""` on the image because the name is set in text directly beneath it:
 * the photograph is illustrative of a label a screen reader is about to read,
 * and describing it again would say the same thing twice.
 */
function Plate({
  experience,
  className,
  sizes,
  large = false,
}: {
  experience: CreativeExperience;
  className: string;
  sizes: string;
  large?: boolean;
}) {
  const name = (
    <p
      className={
        large
          ? "text-lead font-medium leading-tight"
          : "text-body font-medium leading-tight"
      }
    >
      {experience.name}
    </p>
  );

  if (!experience.image) {
    return (
      <div
        className={`flex ${className} flex-col justify-end rounded-sm bg-surface-alt p-5 lg:p-6`}
      >
        <div className="text-text">{name}</div>
        {/*
          The studio's own flag where it has set one, and nothing at all where
          it has not — never an invented "available on request".
        */}
        {experience.status ? (
          <p className="mt-1.5 text-fine leading-snug text-text/75">
            {experience.status}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-sm bg-surface-alt ${className}`}
    >
      <Image
        src={experience.image.src}
        alt=""
        fill
        sizes={sizes}
        style={{ objectPosition: experience.image.position ?? "50% 50%" }}
        className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.04]"
      />

      {/*
        The type sits on the picture, so the picture is made to carry it. These
        are the stops the strands menu arrived at after measuring against the
        palest plate in the project — and these are the same photographs, so
        the measurement transfers rather than being guessed at again.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-text/95 via-text/80 via-42% to-transparent to-85%"
      />

      <div className="absolute inset-x-0 bottom-0 p-5 text-on-dark lg:p-6">
        {name}
        {experience.description ? (
          <p className="mt-1.5 max-w-[26rem] text-fine leading-snug text-on-dark/90">
            {experience.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ==========================================================================
   05 — CREATE WITH US
   ========================================================================== */

/**
 * Where the Maison works, on the brand's structural field.
 *
 * ONE DESTINATION, NAMED, BECAUSE THERE IS ONE. `getMallPartners()` holds a
 * single confirmed agreement and this section renders whatever it holds, so it
 * cannot grow a second centre the studio has not signed. If that list is ever
 * empty the section does not render at all, which is the right outcome rather
 * than a heading standing over nothing.
 *
 * Light Sage rather than Deep Lilac: the lilac field belongs to the enquiry at
 * the foot of the page, and a page with two saturated fields has two focal
 * points, which is none.
 */
function CreateWithUs({ partner }: { partner?: MallPartner }) {
  if (!partner) return null;

  return (
    <section
      aria-labelledby="private-events-where"
      className="bg-sage py-[5rem] md:py-section lg:py-section-lg"
    >
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-8 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              <p className={`${EYEBROW} text-text`}>
                <span
                  aria-hidden
                  className="h-px w-9 shrink-0 bg-terracotta md:w-12"
                />
                Create with us
              </p>
            </Reveal>

            <h2 id="private-events-where" className="mt-8 md:mt-10">
              <Stagger>
                <SectionLine>Where people</SectionLine>{" "}
                <SectionLine>already gather.</SectionLine>
              </Stagger>
            </h2>
          </div>

          <Reveal
            delay={0.2}
            className="col-span-12 lg:col-span-4 lg:col-start-9 lg:self-end"
          >
            <p className="max-w-[30rem] text-body leading-[1.9] text-text/80">
              Maison Palettia brings creative experiences to spaces where people
              already gather.
            </p>

            {/*
              A description list rather than a card: one entry set as a fact,
              not as a tile with three-quarters of a grid empty beside it.
            */}
            <dl className="mt-9 border-t border-text/20 pt-6">
              <dt className={`${TERM} text-text/75`}>Our home</dt>
              <dd className="mt-2 text-lead font-medium leading-snug text-text">
                {partner.name}
                <span className="mt-1 block text-fine font-normal text-text/75">
                  {partner.locality}
                </span>
              </dd>
            </dl>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ==========================================================================
   06 — HOW IT WORKS
   ========================================================================== */

/**
 * Three steps, set in type.
 *
 * No icons, no connecting arrows, no numbered circles — a three-step
 * infographic is the most corporate object a page like this can contain, and
 * the numerals plus the space between them say the same thing without any of
 * it. The hairline above each step does the joining: on desktop the three
 * rules read as one line across the page with the steps hanging from it.
 *
 * The wording is the client's own. See lib/privateEvents.ts for what has
 * deliberately not been added to it — no response times, no coordinator, no
 * site visit, because each of those is a commitment somebody has to keep.
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
          <span
            aria-hidden
            className="h-px w-9 shrink-0 bg-terracotta md:w-12"
          />
          How it works
        </p>
      </Reveal>

      <h2 id="private-events-process" className="mt-8 md:mt-10">
        <Stagger>
          <SectionLine>Three steps,</SectionLine>{" "}
          <SectionLine>then the day.</SectionLine>
        </Stagger>
      </h2>

      <ol className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-3 md:mt-16 lg:gap-x-10">
        {PRIVATE_EVENT_STEPS.map((step, i) => (
          <li key={step.number}>
            <Reveal delay={i * 0.08}>
              <div className="border-t border-line pt-6">
                {/*
                  /60, not the pale wash a numeral like this usually gets. At
                  48px these are large text and owe 3:1; the faint values
                  measured 1.59:1 on this ground, which is not pale as a choice,
                  it is illegible. /60 is 3.57 and still reads as the quiet
                  layer under the step title.
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
                <p className="mt-3 text-body leading-[1.8] text-text/80">
                  {step.detail}
                </p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Container>
  );
}

/* ==========================================================================
   07 — ENQUIRE
   ========================================================================== */

/**
 * The close, on the brand's one saturated field.
 *
 * Deep Lilac carries exactly one full field on this page and this is it, spent
 * on the only thing the page is asking anyone to do. One action, with nothing
 * competing: there is no "or call us", because `CONTACT.phone` is still null,
 * and no brochure, because there is no brochure.
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
                and both fail the 4.5:1 a 12px label owes, so everything read at
                body size or below in this section is set in `surface`.

                The rule keeps Light Sage: it is a graphical object, owes 3:1,
                and clears it.
              */}
              <p className={`${EYEBROW} text-surface`}>
                <span
                  aria-hidden
                  className="h-px w-9 shrink-0 bg-sage md:w-12"
                />
                Have an event in mind?
              </p>
            </Reveal>

            <h2 id="private-events-enquiry" className="mt-8 md:mt-10">
              <Stagger>
                <SectionLine tone="light">Let&apos;s make</SectionLine>{" "}
                <SectionLine tone="light">something together.</SectionLine>
              </Stagger>
            </h2>

            <Reveal delay={0.2}>
              {/*
                Full strength, not /90. Faded to 90% this lands at 4.31:1 —
                under the bar — which is the kind of miss an opacity modifier
                makes easy to ship.
              */}
              <p className="mt-9 max-w-[34rem] text-body leading-[1.9] text-surface">
                Tell us what you are planning — roughly when, roughly how many,
                and what you would like everyone to make. We will help you shape
                the experience.
              </p>
            </Reveal>
          </div>

          <Reveal
            delay={0.3}
            className="col-span-12 lg:col-span-4 lg:col-start-9 lg:justify-self-end"
          >
            <PlanAction tone="onLilac" />
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
 * The page's one action, in the two grounds it stands on.
 *
 * A single component because the label and the destination must not drift
 * between the hero and the foot — the brief asks for one call to action, and
 * two spellings of it is two calls to action.
 *
 * `tone` picks the treatment rather than leaving it to a className the caller
 * passes, for the reason <Signature> does the same: on this palette the ink is
 * decided by the ground, and a free choice is a choice somebody eventually
 * gets wrong.
 *
 * `py-5` on a 12px uppercase label is a 54px target, comfortably over the 44
 * a thumb needs, and it is full width below `sm` where a phone would otherwise
 * give it a third of the screen.
 */
function PlanAction({
  tone,
  className,
}: {
  tone: "onImage" | "onLilac";
  className?: string;
}) {
  const onImage = tone === "onImage";

  return (
    <Link
      href={ENQUIRY_HREF}
      className={[
        "group inline-flex w-full items-center justify-center gap-3 rounded-sm px-8 py-5 sm:w-auto",
        "text-action font-medium uppercase leading-none tracking-eyebrow",
        "transition-colors duration-300 ease-soft",
        /*
          On the photograph: Deep Lilac with the one light ink that survives it
          — White Rock on lilac is 3.95:1 and fails what a 12px label owes,
          which is what `--color-on-primary` exists to fix (4.90:1).

          On the lilac field: White Rock, because there the button has to read
          as a figure standing on that ground rather than dissolve into it.
        */
        onImage
          ? "bg-primary text-on-primary hover:bg-primary/90"
          : "bg-cream text-text hover:bg-surface",
        className ?? "",
      ].join(" ")}
    >
      Plan a private event
      <span
        aria-hidden
        className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
      >
        &#8594;
      </span>
    </Link>
  );
}

/** One masked line of a section heading. `tone` picks the ink from the ground. */
function SectionLine({
  children,
  tone = "dark",
}: {
  children: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={`script-mask ${SECTION_LINE}`}>
      <Reveal
        as="span"
        variant="maskUp"
        className={`block ${tone === "light" ? "text-surface" : "text-text"}`}
      >
        {children}
      </Reveal>
    </span>
  );
}
