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
  PRIVATE_EVENT_STEPS,
} from "@/lib/privateEvents";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { DoodleMark } from "@/components/ui/DoodleMark";
import type { MallPartner } from "@/types";

/*
  ==========================================================================
  THE FOUR PROGRAMMES' FIELDS — see <WhoItIsFor>.
  ==========================================================================

  Keyed by slug rather than by position, so re-ordering the programmes in
  lib/privateEvents.ts cannot silently hand the corporate field to a birthday.
  A slug with no entry falls through to `default`, which is the section's own
  White Rock — a programme added tomorrow gets a sane panel rather than an
  unstyled one.

  INK IS NOT A FREE CHOICE ON THIS PALETTE and each pairing here is the one
  that clears: Charcoal Slate on Soft Lavender is 6.49:1 and on Light Sage
  8.97:1; the near-white `surface` on Deep Lilac is 4.90:1 — the only light
  ink that clears 4.5 on lilac — and on Charcoal Slate it is far above it.

  The numerals are content, not decoration: an <ol> gives a screen reader the
  order for free, but a sighted reader gets it from these and nowhere else, so
  they owe the full 4.5:1 at 11px. They hold /75 on the two light fields,
  where the measured value on this palette's pale grounds is about 4.8, and
  full strength on the two dark ones, where /85 of `surface` on lilac would
  drop under the line.
*/
const AUDIENCE_TONES: Record<
  string,
  { plate: string; field: string; ink: string; numeral: string }
> = {
  /* Celebratory. */
  "birthday-parties": {
    plate: "bg-cream",
    field: "bg-lavender",
    ink: "text-text",
    numeral: "text-text/75",
  },
  /* Refined, and the one programme set in reverse. */
  "corporate-events": {
    plate: "bg-text",
    field: "bg-text",
    ink: "text-surface",
    numeral: "text-surface",
  },
  /* Warm and approachable — the deck's own paper. */
  "school-programs": {
    plate: "bg-cream",
    field: "bg-sage",
    ink: "text-text",
    numeral: "text-text/75",
  },
  /* Experience-led, on the brand's lead colour. */
  "mall-and-community-activations": {
    plate: "bg-primary",
    field: "bg-primary",
    ink: "text-surface",
    numeral: "text-surface",
  },
  default: {
    plate: "bg-cream",
    field: "bg-surface",
    ink: "text-text",
    numeral: "text-text/75",
  },
};

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
      {/*
        THE BANNER IS GONE, at the client's ask, and one other thing went with
        it: this route was the only entry in DARK_HERO_ROUTES. That flag told
        the bar to invert to light ink, which in turn told <NavLabel> to draw
        no paint — pale swatches behind pale type are unreadable. With no dark
        hero to sit over, the bar keeps its charcoal ink here like every other
        page and the painted links appear on their own. See lib/constants.ts.
      */}
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
   (REMOVED) 01 — THE BANNER
   ==========================================================================

   A screen-high photograph with the page's title over it stood here, and it
   is off at the client's ask. Its two helpers — <Hero> and <HeroLine> — went
   with it rather than being left behind unused.

   IT TOOK A FLAG WITH IT. `/private-events` was the sole entry in
   DARK_HERO_ROUTES, which exists to tell the bar to reverse its ink over a
   dark banner. There is no dark banner here now, so the route came out of
   that list; leaving it would have kept the bar in light ink over a Light
   Sage page, and kept the painted nav links suppressed.

   The page now opens on <Introduction>, which carries the same eyebrow and
   sets the section's own heading — nothing the banner said is lost, because
   the banner said the page's title and the page still has one.
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

        {/*
          ==================================================================
          FOUR PROGRAMMES, FOUR PERSONALITIES, ONE LANGUAGE
          ==================================================================

          These four used to be four identical rows of a numbered list:
          numeral, name, one line, hairline, repeat. That is the arrangement
          the brief rules out — "same cards" on every programme — and it is
          also wrong about the content, because a birthday and a corporate
          booking are not four flavours of one thing.

          So each takes its own field, and the field is the personality:

            Birthday parties ....... Soft Lavender. The palette's lightest,
                                     warmest colour — celebratory without
                                     reaching outside the six approved.
            Corporate events ....... Charcoal Slate. The one restrained field
                                     on the page; refined rather than playful,
                                     and the only programme set in reverse.
            School programmes ...... Light Sage. The deck's own paper, which
                                     is the warmest and most approachable
                                     ground the brand has.
            Mall & activations ..... Deep Lilac. The brand's lead colour, for
                                     the one programme the deck has an actual
                                     track record behind (p.12).

          WHAT STAYS. `id={audience.slug}` is the anchor the bar's Private
          events menu points at, and `scroll-mt` still clears the fixed bar.
          The <ol> stays an <ol>: the order is content, and the numeral is
          still drawn because a sighted reader gets the sequence from it and
          nowhere else. Every word is lib/privateEvents.ts, unchanged.

          THE PHOTOGRAPHS ARE STAND-INS AND THE ALT TEXT KNOWS IT. Nothing in
          the project photographs a birthday, a company gathering or a school
          group; each `image` describes what is in the frame and never asserts
          the occasion. See the note on the type. Where there is no picture at
          all the programme shows its brand cut-out on the field instead,
          which is the fallback `mark` exists for.
        */}
        {/*
          THREE COLUMNS, AND A FOURTH THAT IS NOT ONE OF THEM.

          The four ran as full-width panels, image beside field, alternating
          sides. The client asked for cards, and three across is what the
          measure takes — but four items in three columns leaves an orphan,
          and an orphan is what made this read as a row that ran out rather
          than a row that was placed.

          So the split is the DATA'S, not the arithmetic's.
          `inPrivateEventsMenu` is true for exactly three of these — a
          birthday, a company gathering and a school visit are all things a
          host books privately. Mall & community activations is not: the note
          on the type says the studio is engaged by the venue rather than by a
          guest, which is why it is kept out of a menu headed "Private
          events". It is a different kind of thing, so it gets a different
          shape — the full width, under the three.

          A grid of four with one hanging would have been a layout accident.
          Three and one is the content.

          WHAT IS UNCHANGED. `id={audience.slug}` is still the anchor the
          bar's menu points at, `scroll-mt` still clears the fixed bar, the
          <ol> is still an <ol> because the order is content, and every word
          is still lib/privateEvents.ts. The per-programme fields and their
          ink pairings are the same ones, measured — see AUDIENCE_TONES.
        */}
        <ol className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mt-16 lg:grid-cols-3 lg:gap-8">
          {PRIVATE_EVENT_AUDIENCES.map((audience, i) => {
            const tone = AUDIENCE_TONES[audience.slug] ?? AUDIENCE_TONES.default;
            const wide = audience.inPrivateEventsMenu !== true;

            return (
              <li
                key={audience.slug}
                id={audience.slug}
                className={cn(
                  "scroll-mt-header md:scroll-mt-[var(--spacing-header-lg)]",
                  wide && "sm:col-span-2 lg:col-span-3",
                )}
              >
                <Reveal variant="fadeIn" delay={Math.min(i, 3) * 0.06} className="h-full">
                  <div
                    className={cn(
                      /*
                        `overflow-clip`, not `overflow-hidden`. `hidden` makes
                        this a scroll container, and a scroll container breaks
                        the view timeline the brand marks draw on — the
                        cut-out below rendered into the HTML and then sat at
                        its undrawn start state, invisible. `clip` clips the
                        same and creates no scrollport. Same trap as the home
                        page's sections; see DoodleMark.module.css.
                      */
                      "relative flex h-full flex-col overflow-clip rounded-[1.25rem] md:rounded-[1.75rem]",
                      // The wide one lies down; the three stand up.
                      wide && "lg:min-h-[17rem]",
                      wide && audience.image && "lg:flex-row",
                    )}
                  >
                    {/*
                      A PLATE ONLY WHERE THERE IS A PICTURE FOR IT.

                      The wide card used to draw its plate either way, so the
                      one programme with no photograph rendered a 42%-wide
                      block of flat colour with a single small cut-out adrift
                      in the middle of it, and a heading stranded in the
                      corner of the rest. That is the empty slab the client
                      marked.

                      With no picture the card is ONE field across the full
                      width, and the cut-out goes large and breaks its right
                      edge — the deck's own device, and the thing that makes a
                      field read as a composition instead of as a gap.
                    */}
                    {audience.image ? (
                      <div
                        className={cn(
                          "relative w-full shrink-0",
                          wide ? "aspect-[16/10] lg:aspect-auto lg:w-[42%]" : "aspect-[4/3]",
                          tone.plate,
                        )}
                      >
                        <Image
                          src={audience.image.src}
                          alt={audience.image.alt}
                          fill
                          sizes={
                            wide
                              ? "(min-width: 1024px) 42vw, 100vw"
                              : "(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
                          }
                          className="object-cover"
                        />
                      </div>
                    ) : audience.mark ? (
                      <span
                        aria-hidden
                        /*
                          `z-10`, or it is not there at all. The field below
                          is `relative` and comes after this in the DOM, so
                          its own background paints over an absolutely placed
                          sibling — the cut-out rendered into the HTML, drew
                          itself correctly on scroll, and was covered the
                          whole time. It can sit above safely because the
                          heading and the copy are capped well short of it.
                        */
                        className="pointer-events-none absolute -right-10 -top-8 z-10 w-[13rem] rotate-[-12deg] opacity-90 md:-right-12 md:w-[17rem] lg:-right-8 lg:top-1/2 lg:w-[19rem] lg:-translate-y-1/2"
                      >
                        <DoodleMark
                          name={audience.mark.name}
                          color={audience.mark.color}
                          treatment="draw"
                          delay={220}
                        />
                      </span>
                    ) : null}

                    {/* The field, carrying the words. `flex-1` so three cards
                        of different copy lengths still end level. */}
                    <div
                      className={cn(
                        "relative flex flex-1 flex-col justify-center px-6 py-7 md:px-8 md:py-9",
                        wide && "lg:px-11",
                        /*
                          THE CAP GOES ON THE WORDS, NOT ON THE FIELD.

                          It was `max-w-[62%]` here, on the field — which is
                          the thing carrying the colour, so the card's Deep
                          Lilac stopped at 62% and the rest of the row showed
                          the page through it. The card read as cut off, and
                          the cut-out placed past that edge was outside the
                          coloured area altogether and so invisible.

                          The field fills the card; the measure below holds
                          the text off the mark.
                        */
                        wide && !audience.image && "lg:py-14",
                        tone.field,
                        tone.ink,
                      )}
                    >
                      <span aria-hidden className={cn(TERM, "tabular-nums", tone.numeral)}>
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <h3
                        className={cn(
                          "mt-3 text-h3 font-medium tracking-[-0.015em]",
                          // Clear of the cut-out breaking the right edge.
                          wide && !audience.image && "lg:max-w-[58%]",
                        )}
                      >
                        {audience.name}
                      </h3>

                      <p
                        className={cn(
                          "mt-3 max-w-[40ch] text-body leading-[1.8]",
                          wide && !audience.image && "lg:max-w-[52%]",
                        )}
                      >
                        {audience.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
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
        A COLLAGE THAT TESSELLATES, at the client's ask and against their own
        reference: tiles of several sizes packed tight into one clean
        rectangle, the way a wall of photographs is actually hung.

        WHAT THIS REPLACES, AND WHY IT COULD NOT BE NUDGED INTO SHAPE. It was
        one `aspect-[5/4]` plate across seven columns beside a two-column stack
        of `aspect-[3/4]` plates across five. Those two halves have no reason
        to come to the same height and they did not: the lead ran past the foot
        of the stack beside it, the stack's own rows broke at a third place
        again, and the block ended on a ragged edge that read as a layout
        accident rather than as a composition. No amount of tuning the aspects
        fixes that — two independent columns of fixed-ratio tiles only line up
        by coincidence, and the coincidence breaks at the next breakpoint.

        SO THE TILES SHARE ONE SET OF CELLS. The grid owns the geometry: four
        columns of equal width and rows of one fixed height, with each plate
        spanning a whole number of both. Seven plates over twelve cells —
        4 + 2 + 1 + 1 + 1 + 2 + 1 — which is exactly a 4x3 rectangle, so the
        block closes flush on every side at every width. The plates fill their
        cells (`h-full`) instead of carrying an aspect of their own, which is
        what lets the grid decide and keeps them honest.

        Auto-placement does the rest in source order, so the arrangement is in
        the spans below and nowhere else — no explicit row or column starts to
        keep in sync with them.

        TWO COLUMNS ON A PHONE. Four 90px cells is a contact sheet, not a
        collage: the lead keeps its 2x2 and everything else drops to a single
        cell, which is three tidy rows under it.

        The gap is 10px rising to 14px — tight, because the reference is packed
        and a collage with section-sized gutters in it is just a grid again.
      */}
      <div
        className={cn(
          "mt-12 grid gap-2.5 md:mt-16 md:gap-3.5",
          "grid-cols-2 lg:grid-cols-4",
          "auto-rows-[clamp(7rem,26vw,9rem)] lg:auto-rows-[clamp(9rem,13vw,14rem)]",
        )}
      >
        <Reveal variant="fadeIn" className="col-span-2 row-span-2">
          <Plate
            experience={lead}
            className="h-full"
            sizes="(min-width: 1024px) 46vw, 92vw"
            large
          />
        </Reveal>

        {rest.map((experience, i) => (
          <Reveal
            key={experience.slug}
            variant="fadeIn"
            delay={0.08 + i * 0.05}
            /* The spans ARE the composition — see the note above. The first of
               the six is the tall one beside the lead and the fifth is the wide
               one along the foot; the rest are single cells. */
            className={cn(
              i === 0 ? "lg:row-span-2" : null,
              i === 4 ? "lg:col-span-2" : null,
            )}
          >
            <Plate
              experience={experience}
              className="h-full"
              sizes="(min-width: 1024px) 24vw, 46vw"
            />
          </Reveal>
        ))}
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
        className={`flex ${className} flex-col justify-end rounded-[1.25rem] bg-surface-alt p-5 lg:p-6`}
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
      /* `rounded-[1.25rem]`, not the site's 8px `rounded-sm`: packed this
         tight the corners are what separate one photograph from the next, and
         the client's reference rounds them hard. It is the same radius the
         activity cards already use. */
      className={`group relative overflow-hidden rounded-[1.25rem] bg-surface-alt ${className}`}
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
          ? "press-in bg-primary text-on-primary hover:bg-primary/90"
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
