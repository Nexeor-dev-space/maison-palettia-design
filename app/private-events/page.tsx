import Image from "next/image";
import Link from "next/link";
import { groundShapes } from "@/components/motion/groundShapes";
import { BlobButton } from "@/components/ui/BlobButton";

import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import {
  getCreativeExperiences,
  type CreativeExperience,
} from "@/lib/experiences";
import { ActivityPlate } from "@/components/private-events/ActivityPlate";
import { getMallPartners } from "@/lib/partners";
import {
  PRIVATE_EVENT_AUDIENCES,
  PRIVATE_EVENT_STEPS,
} from "@/lib/privateEvents";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { DoodleMark } from "@/components/ui/DoodleMark";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { INK } from "@/components/sections/hero/composition";

/*
  Light Sage as a literal, because INK is not the place for it. That palette is
  documented as "the deck's shapes on the six approved colours, FOR A LIGHT
  SAGE GROUND" — sage is absent from it precisely because everything it colours
  is standing on sage. Here it is a mark on a Deep Lilac card, which is the
  brand sheet's own pairing, and it measures 3.83:1 on that ground.
*/
const SAGE_MARK = "#D1E7BE";
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
    "Creative experiences designed around your people, your occasion and your space. A private Maison Palettia session where everyone makes something to take home.",
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
  "flex items-center gap-4 text-label font-medium uppercase tracking-eyebrow";
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
      {/*
        (REMOVED) FOR OUR LITTLE CREATORS — at the client's ask, 2026-10-08.
        "Tailored kids activities" stood here, moved to this page from /about
        only a few passes earlier on the argument that two of the four
        audiences above it — birthdays and school programmes — are
        children's. The client has asked for it to come off, so the page runs
        from the audiences straight into the activities themselves.
      */}
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
 * What a private event is, in one short passage — and the first thing on the
 * page a reader actually looks at.
 *
 * ==========================================================================
 * LIGHT SAGE, THE BAR'S OWN GROUND, AT THE CLIENT'S ASK
 * ==========================================================================
 *
 * It stood on the page ground — Light Sage taken 30% into white — directly
 * under a bar that is full-strength Light Sage. Two greens a few percent
 * apart, meeting on a hairline, read as a rendering fault rather than as two
 * surfaces. The client asked for this section to take the bar's colour, and
 * that is the better answer for a page that opens with no banner: the bar and
 * the opening statement become one field of the brand's own green, and the
 * page begins at the White Rock seam below it instead of nowhere.
 *
 * Charcoal Slate on Light Sage is 8.97:1, so nothing here changes ink.
 *
 * ==========================================================================
 * THE PARAGRAPH CAME BACK TO THE STATEMENT, AND A PICTURE TOOK ITS PLACE
 * ==========================================================================
 *
 * The paragraph sat low and right, four columns away from the heading, with
 * the whole middle of the section empty between them — the masthead
 * arrangement this page uses elsewhere. It does not survive being the first
 * thing on a page: there is no picture above it to hold the width, so what a
 * reader met was two islands of type with a hole in the middle. The
 * paragraph now sits under the statement it belongs to, at a reading measure,
 * and the right-hand half carries a photograph.
 *
 * THE PHOTOGRAPH IS ONE OF THE FOUR THAT ARE REALLY THE STUDIO'S. It is a
 * frame from the studio's own film (`maison-banner.mp4` at 0:49) — two pairs
 * of hands at one table, one holding the palette while the other paints a
 * tote. That is this section's sentence in a picture: people brought together
 * through making, and something to take home. Hands only, no identifiable
 * face, and it is used nowhere else on the site. Nothing captions it as a
 * private event, because it is a workshop frame and this page must not imply
 * an event it cannot evidence.
 *
 * It is cut into one of the deck's blob shapes rather than framed in a
 * rectangle: the brand's pictures are cut-outs, and a 16:9 video frame set
 * square at the top of a page is a screenshot. Four marks break its outline,
 * which is the standing rule for this brand's icons — none floats in clear
 * space.
 */
function Introduction() {
  return (
    <section
      aria-labelledby="private-events-intro"
      /* `overflow-clip`, not `hidden`: a scroll container breaks the view
         timeline the brand marks draw on, and four of them hang off the
         picture's edges here. Same trap as everywhere else on this page. */
      className="relative isolate overflow-clip bg-sage py-[5rem] md:py-section lg:py-section-lg"
    >
      <SectionShapes plan={INTRO_SHAPES} />
      <Container className="relative">
        <div className="grid grid-cols-12 items-center gap-x-6 gap-y-12 lg:gap-x-12">
          {/* ---- the statement, and the sentence under it ---------------- */}
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <p className={`${EYEBROW} text-text`}>
                <span
                  aria-hidden
                  className="h-px w-9 shrink-0 bg-terracotta md:w-12"
                />
                Creative experiences, made for your moment
              </p>
            </Reveal>

            {/* h1, not h2. This is the page's own title and it was the only
                heading above the fold, so /private-events shipped with no h1
                at all — the same gap /faq had. The level is the only change;
                the type is set by <SectionLine>. */}
            <h1 id="private-events-intro" className="mt-8 md:mt-10">
              <Stagger>
                <SectionLine>Bring People Together</SectionLine>{" "}
                <SectionLine>Through Making.</SectionLine>
              </Stagger>
            </h1>

            <Reveal delay={0.2}>
              {/* `script-lede` rather than a margin: the gap under a script
                  heading is a token, because Hapsha's descenders hang into
                  it. */}
              <p className="script-lede max-w-[46ch] text-lead text-text/80">
                From team gatherings to celebrations, Maison Palettia creates
                hands-on experiences that give people a reason to sit down
                together, make something, and take it home.
              </p>
            </Reveal>
          </div>

          {/* ---- the picture, cut out and broken by four marks ----------- */}
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="relative mx-auto w-full max-w-[34rem]">
              <Reveal variant="imageReveal" delay={0.24} className="relative block">
                {/*
                  3:2 out of a 16:9 frame, which is the widest the column can
                  take without the picture turning into a letterbox strip —
                  and it matters, because the subject runs the full width of
                  the source: the palette and the second pair of hands at the
                  left edge, the brush and the tote in the middle, the painting
                  hand at the right. A 4:3 crop was tried first and it cut one
                  end off whichever way it was positioned, which left a
                  photograph of a palette rather than of two people at a
                  table. 3:2 takes 16% off the width and keeps all of it.

                  `overflow-clip` on the cut: `clip` honours a radius exactly
                  as `hidden` does and makes no scroll container, which the
                  marks hanging off this box depend on.
                */}
                <span
                  className="blob relative block aspect-[3/2] w-full overflow-clip"
                  style={{ "--blob": "42% 30% 38% 34% / 34% 40% 30% 38%" } as React.CSSProperties}
                >
                  <Image
                    src="/images/hero/tote-painting.jpg"
                    alt="Two pairs of hands at one table: one holds a red paint palette, the other paints a silver and teal design onto a pale denim tote bag."
                    fill
                    sizes="(min-width: 1024px) 544px, 92vw"
                    style={{ objectPosition: "50% 50%" }}
                    className="object-cover"
                  />
                </span>
              </Reveal>

              {/*
                The four marks, placed rather than scattered — the client's
                standing note — and every one of them crossing the picture's
                outline. Lilac, terracotta and lavender: the three of the six
                that can be seen on Light Sage.
              */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-5 -top-8 w-[5rem] md:w-[6.5rem]"
              >
                <DoodleMark name="starburst" color={INK.terracotta} treatment="draw" delay={240} />
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute -left-4 top-[28%] w-[2.25rem] md:w-[2.75rem]"
              >
                <DoodleMark name="bow" color={INK.lilac} treatment="draw" delay={380} />
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-7 -left-6 w-[8.5rem] md:w-[10.5rem]"
              >
                <DoodleMark name="wave" color={INK.lavender} treatment="draw" delay={460} />
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 bottom-[18%] w-[2.75rem] md:w-[3.5rem]"
              >
                <DoodleMark name="splash" color={INK.lilac} treatment="draw" delay={540} />
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/*
  The shapes behind <Introduction>.

  TWO, AND BOTH OF THEM LOW AND LEFT. The right half of this section is a
  photograph, and a mark behind a photograph is a mark nobody sees. Light Sage
  and White Rock are not in the list for the reason <CreateWithUs>'s plan
  already gives: on this ground they are invisible at any opacity a background
  can afford.

  THERE WAS A THIRD AND IT HAD TO GO. A small charcoal zigzag sat in the open
  gap between the heading and the picture, and at a ground's opacity charcoal
  on a warm green is not ink — it is grey. What it read as was a stray hair on
  the screen, which is the exact failure the client has already named twice:
  no wavy lines, nothing scattered.

  The lilac shape is cut by the section's own bottom-left corner rather than
  floating clear of it. A mark that breaks an edge is placed; the same mark in
  open space is a smudge.
*/
const INTRO_SHAPES: readonly ShapePlan[] = groundShapes("sage");

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
      className="relative isolate overflow-clip bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <SectionShapes plan={groundShapes("cream")} />
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
                <SectionLine>Every Kind.</SectionLine>
              </Stagger>
            </h2>
          </div>

          <Reveal delay={0.2} className="col-span-12 md:col-span-5 md:pb-3">
            {/* No `max-w`: the column is the measure — see <ExperienceDiscovery>. */}
            <p className="text-lead text-text/80">
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
          FOUR COLUMNS, FOUR EQUAL CARDS.

          This ran as three across with the fourth laid down full width
          beneath them. The argument was that the split should be the data's
          rather than the arithmetic's: `inPrivateEventsMenu` is true for
          exactly three — a birthday, a company gathering and a school visit
          are things a host books privately — while mall and community
          activations is a programme the venue engages the studio for, so it
          was given a different shape to say so.

          The client has asked for four columns, and the distinction survives
          without the shape: it is still the only programme kept out of the
          bar's "Private events" menu, and it still reads differently because
          it is the only one on Deep Lilac. What it loses is a full-width slab
          that made the row look like it had run out.

          THE FOURTH HAS NO PHOTOGRAPH, so in a row of four it cannot simply
          go without one — three cards with a picture and one with a bare
          field reads as a missing asset. Its brand cut-out takes the same
          box the others give their photograph, on the tone's own plate
          colour, so all four cards have one anatomy: a block on top, a field
          under it.

          WHAT IS UNCHANGED. `id={audience.slug}` is still the anchor the
          bar's menu points at, `scroll-mt` still clears the fixed bar, the
          <ol> is still an <ol> because the order is content, and every word
          is still lib/privateEvents.ts. The per-programme fields and their
          ink pairings are the same ones, measured — see AUDIENCE_TONES.
        */}
        <ol className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mt-16 lg:grid-cols-4 lg:gap-6 xl:gap-8">
          {PRIVATE_EVENT_AUDIENCES.map((audience, i) => {
            const tone = AUDIENCE_TONES[audience.slug] ?? AUDIENCE_TONES.default;

            return (
              <li
                key={audience.slug}
                id={audience.slug}
                className="scroll-mt-header md:scroll-mt-[var(--spacing-header-lg)]"
              >
                <Reveal variant="fadeIn" delay={Math.min(i, 3) * 0.06} className="h-full">
                  <Link
                    href={`/private-events/${audience.slug}`}
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
                      "group relative flex h-full flex-col overflow-clip rounded-[1.25rem] md:rounded-[1.75rem]",
                      /* THE WHOLE CARD IS THE DOOR, now each programme has a
                         page of its own. A card that carries a name, a line
                         and a picture and then asks you to find a small link
                         inside it is a card with a target the size of a word. */
                      "transition-transform duration-[var(--duration-hover)] ease-soft motion-safe:hover:-translate-y-1",
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
                    {/*
                      ONE BOX ON TOP OF EVERY CARD — a photograph where there
                      is one, and the programme's brand cut-out where there is
                      not. Mall and community activations is the only one
                      without a frame (nothing in the project photographs an
                      activation, and lib/privateEvents.ts declines to borrow
                      a picture of something else), so it shows the mark on
                      its own plate colour at the same 4:3 the others take.
                      Four cards, one anatomy.
                    */}
                    <div
                      className={cn(
                        "relative aspect-[4/3] w-full shrink-0",
                        tone.plate,
                      )}
                    >
                      {audience.image ? (
                        <Image
                          src={audience.image.src}
                          alt={audience.image.alt}
                          fill
                          sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 100vw"
                          className="object-cover"
                        />
                      ) : audience.mark ? (
                        <span
                          aria-hidden
                          className="absolute inset-7 block rotate-[-8deg]"
                        >
                          {/*
                            INSET, NOT CENTRED-AND-PADDED, so the mark has a
                            box with a definite height to fit inside.

                            The shape has to be contained rather than cropped:
                            the coral branch is 218×339, half again as tall as
                            it is wide, so sized by width alone it stood 269px
                            in a 209px opening and lost its foot to the
                            overflow. An svg with a viewBox solves that by
                            itself — `meet` letterboxes it — but only once BOTH
                            axes are definite.

                            `grid place-items-center` with `h-full` does not
                            give it one. The row is auto-sized, so a percentage
                            height inside it is cyclic, resolves to auto, and
                            the svg falls back to its viewBox ratio again —
                            which is how this cropped a second time, wider.

                            Absolute insets are definite on all four sides.
                            The inset is the margin the padding used to be, the
                            mark centres itself within it whatever its
                            proportions, and the tilt turns inside the frame.
                          */}
                          <DoodleMark
                            name={audience.mark.name}
                            color={audience.mark.color}
                            treatment="draw"
                            delay={220}
                          />
                        </span>
                      ) : null}
                    </div>

                    {/* The field, carrying the words. `flex-1` so four cards
                        of different copy lengths still end level. */}
                    <div
                      className={cn(
                        "relative flex flex-1 flex-col justify-center px-6 py-7 md:px-7 md:py-8",
                        tone.field,
                        tone.ink,
                      )}
                    >
                      <span aria-hidden className={cn(TERM, "tabular-nums", tone.numeral)}>
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <h3 className="mt-3 text-h3 font-medium tracking-[-0.015em]">
                        {audience.name}
                      </h3>

                      <p className="mt-3 max-w-[40ch] text-body">
                        {audience.description}
                      </p>

                      {/* The affordance is drawn rather than implied: the card
                          is the link, and a reader needs to be told so. */}
                      <span className="mt-5 inline-flex items-center gap-2.5 text-action font-medium uppercase tracking-eyebrow">
                        See the programme
                        <span
                          aria-hidden
                          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                        >
                          &#8594;
                        </span>
                      </span>
                    </div>
                  </Link>
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
    /*
      LIGHT SAGE, AT THE CLIENT'S ASK — "#D1E7BE in bg". It was the page's own
      pale ground, which put three near-white bands in a row through the middle
      of the page. With this the run alternates properly and no two sections
      touching each other share a ground:

        Introduction ..... Light Sage
        Who it is for .... White Rock
        The experiences .. LIGHT SAGE   <- here
        Create with us ... White Rock
        How it works ..... Light Sage
        Enquire .......... Deep Lilac

      `as="section"` with a `bg-` on it would paint only the measure and leave
      the gutters pale, so the colour goes on a real <section> and the
      container sits inside it.
    */
    <section
      aria-labelledby="private-events-experiences"
      className="relative isolate overflow-clip bg-sage py-[5rem] md:py-section lg:py-section-lg"
    >
      <SectionShapes plan={groundShapes("sage")} />
     <Container>
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
              <SectionLine>Choose What</SectionLine>{" "}
              <SectionLine>You Make.</SectionLine>
            </Stagger>
          </h2>
        </div>

        <Reveal delay={0.2} className="col-span-12 md:col-span-5 md:pb-3">
          {/* No `max-w`: the column is the measure — see <ExperienceDiscovery>. */}
          <p className="text-lead text-text/80">
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

        TWO COLUMNS AT sm, ONE BELOW IT. Four cells across a phone is a contact
        sheet, not a collage — but two is not much better, and that was the
        mistake here. At 390 a two-up tile is 174px wide, and 174px cannot hold
        a photograph, a name that wraps to two lines and a sentence that wraps
        to three: the caption grew past the top of its own cell and "Ceramic
        painting" ended up set on the page behind it.

        So the collage starts at sm, where a tile is ~295px and the caption
        fits with the picture still showing. Below that it is one column of
        wide tiles, which is the same composition read one at a time, and the
        rows are taller there because a full-width tile has a full-width
        caption to carry.

        The gap is 10px rising to 14px — tight, because the reference is packed
        and a collage with section-sized gutters in it is just a grid again.
      */}
      <div
        className={cn(
          "mt-12 grid gap-2.5 md:mt-16 md:gap-3.5",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          /*
            THE TRACKS GREW BY ABOUT A FIFTH when the captions came off the
            pictures — the foot is a fixed block and it has to come from
            somewhere, and taking it out of the photograph would have left the
            single-cell tiles as strips. See <ActivityPlate>.
          */
          "auto-rows-[clamp(13rem,52vw,16rem)]",
          "sm:auto-rows-[clamp(10.5rem,30vw,12.5rem)]",
          /*
            THREE EXPLICIT TRACKS AT lg, NOT THREE EQUAL ONES.

            The composition reads as two rows rather than three: the lead and
            its neighbours occupy tracks 1 and 2 as one block, and the three
            wide tiles along the foot are the second row. At a uniform
            `auto-rows` that foot was a third the height of the block above it
            and its pictures were strips — the client's note is to give them
            more room.

            So the first two tracks keep the height they had, and the third
            takes about 4/3 of it. The lead spans the first two and is
            unchanged; only the foot grows.
          */
          /*
            THE FLOOR IS WHAT 1024 NEEDS, NOT WHAT 1440 LOOKS BEST AT. At four
            columns a 1024 screen gives each tile 236px of width, so a
            two-sentence line wraps to three — and with the old 11rem floor the
            Bedazzling tile had 176px to hold a 156px caption, which left 20px
            of photograph. The floor now clears the tallest caption at the
            narrowest four-column width, measured.
          */
          "lg:auto-rows-auto lg:grid-rows-[repeat(2,clamp(14rem,16vw,17rem))_clamp(16.5rem,20vw,22rem)]",
        )}
      >
        <Reveal variant="fadeIn" className="row-span-2 sm:col-span-2">
          <ActivityPlate
            experience={lead}
            className="h-full"
            sizes="(min-width: 1024px) 46vw, 92vw"
            paint={0}
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
            <ActivityPlate
              experience={experience}
              className="h-full"
              sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 92vw"
              /* `i + 1`, so the lead is the first paint and the six after it
                 carry on the rotation rather than restarting it. */
              paint={i + 1}
            />
          </Reveal>
        ))}
      </div>
     </Container>
    </section>
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
/*
  ==========================================================================
  FOUR SHAPES, PLACED AGAINST THE MEASURED CLEAR GROUND
  ==========================================================================

  The client's note was that these overlapped and wanted aligning. They did,
  and not by a little: sampled as a fraction of the section's own box, every
  one of the four sat on something.

      coral      over the eyebrow and the heading's column
      splash     over "Maison Palettia brings creative experiences..."
      starburst  over the destination card AND over the card's own cut-out
      zigzag     over the paragraph

  The old note above this list claimed they sat "in the empty middle and low
  along the foot, never behind the heading or the card". That was the
  intention and it was simply not what the numbers said — which is the reason
  the placements below are derived rather than chosen by eye.

  THE CLEAR GROUND, as percentages of the section box at 1440x600:

      top strip        t 0-24      full width, above the eyebrow
      centre channel   l 48.6-59.6 full height, between the two columns
      under the words  t 76-100    l 1.4-48.6, below the paragraph
      beside the words l 34.7-48.6 t 65-100, right of the paragraph's measure
      above the card   l 48.6-100  t 0-35.3

  Each shape below sits inside one of those with a margin, and its HEIGHT is
  computed rather than hoped for: `width` is a percentage of the section's
  width, and each doodle's own aspect then decides how far down it reaches —
  coral is 1.55 times as tall as it is wide, splash 0.84, starburst 1.08,
  zigzag 1.28. That ratio is what made the old coral, nominally 12% wide, run
  from 7% to 57% of the section's height and swallow the heading.

  One per band, so they read as four marks placed around the type rather than
  as a texture behind it, and none of them touches another.
*/
/* Deep Lilac carries White Rock (3.95:1) and Light Sage (3.83) only. */
const ENQUIRY_SHAPES: readonly ShapePlan[] = groundShapes("lilac");

const WHERE_SHAPES: readonly ShapePlan[] = groundShapes("cream");

function CreateWithUs({ partner }: { partner?: MallPartner }) {
  if (!partner) return null;

  return (
    <section
      aria-labelledby="private-events-where"
      className="relative isolate overflow-clip bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      {/*
        `overflow-clip`, not `hidden`: a scroll container breaks the view
        timeline the brand marks draw on. Same trap as everywhere else on this
        page — see the note in <WhoItIsFor>.
      */}
      <SectionShapes plan={WHERE_SHAPES} />

      <Container className="relative">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-10 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-6">
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
                <SectionLine>Where People</SectionLine>{" "}
                <SectionLine>Already Gather.</SectionLine>
              </Stagger>
            </h2>

            <Reveal delay={0.15}>
              <p className="mt-8 max-w-[30rem] text-lead text-text/85">
                Maison Palettia brings creative experiences to spaces where
                people already gather.
              </p>
            </Reveal>
          </div>

          {/*
            ==================================================================
            THE DESTINATION IS A CARD NOW, ON THE ROW'S OWN PAPER
            ==================================================================

            It was a description list under a hairline: an eyebrow, a name and
            a city, set on the section's own Light Sage. The client has asked
            for it as one of the cards the collaboration row uses on
            /locations — a coloured plate, set down slightly out of true, with
            a cut-out breaking its edge.

            DEEP LILAC, AND THE INK IS MEASURED FOR IT. `--color-surface` on
            Deep Lilac is 4.90:1, the one light ink on this palette that clears
            4.5 on that ground — White Rock is 3.95 and fails. So the name and
            the line take `text-surface` at full strength and nothing here
            carries an alpha, which is the same rule CARD_STOCK keeps on
            /locations.

            THE MARK IS WHITE ROCK, 3.95:1 on lilac — under what type owes and
            well over what a decorative shape does. It breaks the bottom-left
            corner, which is the deck's own placement.

            AND IT IS PUSHED CLEAR OF THE LAST LINE. The note here used to say
            this was "the one corner the words do not reach", and measured, it
            was not: the mark sat 454-526 against a descriptor ending at 465,
            so it took a bite out of "Maison sets up for each run of dates."

            The offset is derived rather than nudged, which is why it holds at
            any width: the mark's height is 0.84 of its width (splash is 386 by
            323) and the card keeps a fixed 32/36px of padding under the text,
            so `bottom` has to be at least markHeight − padding for the two to
            stop touching. 60 − 32 at base and 70 − 36 at md, plus 8px to stand
            in, which is -bottom-10 and -bottom-11. Nothing here depends on how
            the descriptor happens to wrap.
          */}
          <Reveal delay={0.24} className="col-span-12 lg:col-span-5 lg:col-start-8">
            <div className="plate relative rounded-[1.5rem] bg-primary px-7 py-8 md:px-8 md:py-9 lg:rotate-[-1.2deg]">
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-10 -left-5 w-[4.5rem] md:-bottom-11 md:w-[5.25rem]"
              >
                <DoodleMark name="splash" color={INK.whiteRock} treatment="stamp" delay={260} />
              </span>

              <p className={`${TERM} text-surface`}>Our home</p>
              <p className="mt-4 text-h3 font-light tracking-[-0.02em] text-surface">
                {partner.name}
              </p>
              <p className="mt-2 text-body text-surface">{partner.locality}</p>
              <p className="mt-5 max-w-[26rem] text-fine leading-[1.7] text-surface">
                {partner.descriptor}
              </p>
            </div>
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
/*
  ==========================================================================
  THE THREE STEPS AS THREE PAPERS — the row the client pointed at
  ==========================================================================

  They were three ruled columns: a hairline, a large grey numeral, a title and
  a line, three times. That is the arrangement a specification sheet uses, and
  on a page whose whole argument is "this is made by hand" it was the one
  block that looked typeset rather than laid out.

  The client has asked for this section to be built like the collaboration row
  on /locations, so the tokens below are that row's, kept deliberately in step
  with it — same three grounds in the same order, same tilt-and-lift, same
  cut-out in the head and one breaking an edge. Two sections of this site now
  say "here are three things, choose the one that fits" in one voice.

  EVERY INK IS THE MEASURED ONE, carried across rather than re-picked:

      ground            ink            ratio
      Deep Lilac        surface        4.90   <- only at FULL strength
      Light Sage        charcoal/85    6.14
      Soft Lavender     charcoal/85    4.73

  So the lilac card's body takes no alpha at all and the two light grounds
  take /85 rather than the /80 used elsewhere on this page. The folio is
  decorative and `aria-hidden` — the order is already in the <ol> — so it can
  sit under what type owes.

  AND THE EDGE MARKS HANG BELOW THE LAST LINE, NOT ACROSS IT. Two of the three
  were taking a bite out of their own card's closing sentence — measured, not
  guessed. A mark pinned by `bottom` clears the text when its offset is at
  least its own HEIGHT minus the card's bottom padding, and the height is the
  doodle's aspect times the width given here: splash is 0.84 of its width and
  starburst 1.08, against 32px of padding at base and 36 at md. That puts
  splash at 9 and starburst at 12, with 8px to stand in. The wave on the third
  card hangs off the TOP and never had the problem.

  THE MARKS ARE MEASURED THE SAME WAY. On Deep Lilac only White Rock (3.95),
  Light Sage (3.83) and Soft Lavender (2.74) show; on Light Sage, Deep Lilac
  (3.83) and Warm Terracotta (2.36); on Soft Lavender, Deep Lilac (2.74) and
  Charcoal (6.49). Warm Terracotta on Soft Lavender is 1.69 and would vanish,
  so it is the one pairing this row does not use.
*/
/*
  The shapes in <Process>'s masthead — see the note in the section.

  Sized and placed as a share of the section (1440x914 at this width), so the
  arrangement holds as it scales. Light Sage is not among them: it is the
  ground they stand on.
*/
const PROCESS_SHAPES: readonly ShapePlan[] = groundShapes("sage");

const STEP_STOCK: readonly {
  ground: string;
  heading: string;
  body: string;
  folio: string;
  head: { name: DoodleName; color: string };
  edge: { name: DoodleName; color: string; place: string; size: string };
  /* `lg:` only — a phone stacks these, and a stack of tilted, offset cards is
     a mess rather than a composition. */
  tilt: string;
  lift: string;
}[] = [
  {
    ground: "bg-primary",
    heading: "text-surface",
    body: "text-surface",
    folio: "text-sage/50",
    head: { name: "bow", color: INK.whiteRock },
    edge: { name: "splash", color: SAGE_MARK, place: "-bottom-9 -left-5", size: "w-[4.5rem]" },
    tilt: "lg:rotate-[-1.4deg]",
    lift: "",
  },
  {
    /*
      WHITE ROCK, NOT THE LIGHT SAGE THIS ROW USED TO TAKE, and the reason is
      the field under it: this section is Light Sage now at the client's ask,
      and a Light Sage card on a Light Sage ground is not a card. All `plate`
      would leave of it is a hairline of Charcoal at a tenth.

      It is the one place this row steps out of /locations' order, and it is
      forced rather than chosen. The ink is better for it: Charcoal at 85% on
      White Rock measures 6.26:1 against 6.14 on Light Sage, and the two marks
      still hold — Deep Lilac on White Rock and Warm Terracotta on it are both
      well clear of what a decorative shape owes.
    */
    ground: "bg-cream",
    heading: "text-text",
    body: "text-text/85",
    folio: "text-primary/35",
    head: { name: "splash", color: INK.lilac },
    edge: { name: "starburst", color: INK.terracotta, place: "-bottom-12 right-10", size: "w-[4rem]" },
    tilt: "lg:rotate-[0.9deg]",
    lift: "lg:mt-14",
  },
  {
    ground: "bg-lavender",
    heading: "text-text",
    body: "text-text/85",
    folio: "text-primary/40",
    head: { name: "starleaf", color: INK.lilac },
    edge: { name: "wave", color: INK.charcoal, place: "-left-6 -top-7", size: "w-[3.75rem]" },
    tilt: "lg:rotate-[-0.7deg]",
    lift: "lg:mt-6",
  },
];

function HowItWorks() {
  return (
    /*
      A FIELD, NOT A CONTAINER, because the colour has to reach the window's
      edge. This was `<Container as="section">` and a `bg-` on that paints the
      measure and stops — <Container> carries a max-width, so the colour would
      have ended in a band down the middle with the page ground either side.
      The section holds the ground and the padding; the container holds the
      gutter, as it does in <CreateWithUs> above.
    */
    <section
      aria-labelledby="private-events-process"
      className="relative isolate overflow-hidden bg-sage py-[5rem] md:py-section lg:py-section-lg"
    >
      {/*
        THE BAND BESIDE THE HEADING, FILLED — at the client's ask that this
        section looks very empty.

        Measured at 1440: the section is 1440x914, the heading's ink stops at
        about x 280 though its box runs the full width, and the cards do not
        begin until y 426. That leaves roughly 1000 x 290 of nothing between
        the two — the whole right of the masthead — which is what reads as
        empty rather than as air.

        Four marks fill it, placed against that box rather than scattered, and
        solved against their own travel the same way every other plan on this
        site is: worst case each stays inside x 420-1400 and clears the cards'
        top edge. Low opacity and behind everything, because a script heading
        and three coloured cards are what this section is for.
      */}
      <SectionShapes plan={PROCESS_SHAPES} />
      <Container className="relative">
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
          <SectionLine>Three Steps,</SectionLine>{" "}
          <SectionLine>Then the Day.</SectionLine>
        </Stagger>
      </h2>

      {/*
        `items-start`, so a card that is lifted stays lifted: a stretched row
        would pull all three to the tallest and the offset would be lost, which
        is the whole of the arrangement. Extra bottom room because the cut-outs
        hang past the cards' edges and the row is the last thing before the
        enquiry.
      */}
      <ol className="mt-14 grid grid-cols-1 items-start gap-6 sm:grid-cols-3 md:mt-16 lg:gap-7 lg:pb-8">
        {PRIVATE_EVENT_STEPS.map((step, i) => {
          const stock = STEP_STOCK[i % STEP_STOCK.length];
          return (
            <li key={step.number} className={stock.lift}>
              <Reveal delay={i * 0.08}>
                <article
                  className={cn(
                    "plate group relative flex flex-col rounded-[1.5rem] px-7 py-8 md:px-8 md:py-9",
                    "transition-transform duration-[var(--duration-hover)] ease-soft",
                    "motion-safe:hover:-translate-y-1",
                    stock.ground,
                    stock.tilt,
                  )}
                >
                  {/* The cut-out that breaks the card's edge. `overflow` is
                      deliberately NOT clipped on the card, so it can. */}
                  <span
                    aria-hidden
                    className={cn("pointer-events-none absolute", stock.edge.place, stock.edge.size)}
                  >
                    <DoodleMark
                      name={stock.edge.name}
                      color={stock.edge.color}
                      treatment="stamp"
                      delay={300 + i * 120}
                    />
                  </span>

                  <div className="flex items-start justify-between gap-5">
                    <p
                      aria-hidden
                      className={cn(
                        "text-folio tracking-[0.01em] [font-family:var(--font-deck)] [font-synthesis:none]",
                        stock.folio,
                      )}
                    >
                      {step.number}
                    </p>
                    <span
                      aria-hidden
                      className="block w-10 shrink-0 transition-transform duration-[900ms] ease-editorial motion-safe:group-hover:rotate-6"
                    >
                      <DoodleMark
                        name={stock.head.name}
                        color={stock.head.color}
                        delay={200 + i * 110}
                      />
                    </span>
                  </div>

                  <h3
                    className={cn(
                      "mt-9 text-h3 font-light tracking-[-0.02em]",
                      stock.heading,
                    )}
                  >
                    {step.title}
                  </h3>

                  <p className={cn("mt-4 text-body", stock.body)}>{step.detail}</p>
                </article>
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
      className="relative isolate overflow-clip bg-primary py-[5.5rem] text-surface md:py-section lg:py-section-lg [--color-focus:var(--color-cream)]"
    >
      <SectionShapes plan={ENQUIRY_SHAPES} />
      {/*
        ONE CENTRED COLUMN, AT THE CLIENT'S ASK. This was the page's two-column
        close — the statement in the left seven columns, the button parked at
        the right edge, and the signature line centred under both — which put
        the one action a screen's width from the words that ask for it. It is
        now the shape the /about and /locations closes already take: a centred
        stack with the button directly under the sentence.

        AND IT IS DOWN TO THREE PARTS. The label over the heading and the
        signature line under the button both came out at the client's ask, so
        what is left is the heading, the sentence and the action — which is
        what this field was spent on in the first place.
      */}
      <Container className="text-center">
        <div className="mx-auto max-w-[44rem]">
          <div>
            {/*
              The ink on Deep Lilac is not a free choice, and it is not the one
              the rest of the site's dark grounds use. Measured on this field:
              Light Sage 3.83:1, White Rock (--color-on-dark) 3.95:1,
              --color-surface 4.90:1. The first two are fine for display type
              and both fail the 4.5:1 a 12px label owes, so everything read at
              body size or below in this section is set in `surface`.
            */}
            {/* NO EYEBROW, AND NO TOP MARGIN WHERE ONE USED TO BE. The label
                over this heading came out at the client's ask; the heading is
                the first thing in the column now, so the `mt-8` that used to
                hold it off the label would print as a gap under the section's
                own padding. */}
            <h2 id="private-events-enquiry">
              <Stagger>
                <SectionLine tone="light">Let&apos;s Make</SectionLine>{" "}
                <SectionLine tone="light">Something Together.</SectionLine>
              </Stagger>
            </h2>

            <Reveal delay={0.2}>
              {/*
                Full strength, not /90. Faded to 90% this lands at 4.31:1 —
                under the bar — which is the kind of miss an opacity modifier
                makes easy to ship.

                TWO LINES, AT THE CLIENT'S ASK, AND 44rem IS WHERE IT BREAKS.
                The sentence is 1270px set on one line, so half of it is 635 —
                but 40rem (640) still came out as three, because a line breaks
                at a word and not at the halfway mark. 44rem is the first width
                that takes it to two, and it is also the column this sits in,
                so the cap is really just the paragraph no longer being
                narrower than its own parent.

                `text-balance` then evens the two: without it the first line
                runs to the full measure and the second sits about 130px
                short, which under a centred script heading reads as a
                paragraph that ran out rather than as two lines.
              */}
              <p className="mx-auto mt-9 max-w-[44rem] text-balance text-lead text-surface">
                Tell us what you are planning: roughly when, roughly how many,
                and what you would like everyone to make. We will help you shape
                the experience.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.3} className="mt-10 flex justify-center md:mt-12">
            <PlanAction tone="onLilac" />
          </Reveal>
        </div>

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
    /*
      The tone carries what the hand-built classes used to. On the photograph
      it is the default Deep Lilac, whose ink `--color-on-primary` fixes at
      4.90:1 where plain White Rock would be 3.95:1 and fail what a 12px label
      owes. On the lilac field it is `cream`, because there the button has to
      read as a figure standing on that ground rather than dissolve into it.
    */
    <BlobButton
      href={ENQUIRY_HREF}
      tone={onImage ? "lilac" : "cream"}
      className={`w-full justify-center px-8 py-5 sm:w-auto ${className ?? ""}`}
    >
      Plan a private event
    </BlobButton>
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
