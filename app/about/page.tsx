import Image from "next/image";
import { groundShapes } from "@/components/motion/groundShapes";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { PeelNote } from "@/components/ui/PeelNote";
import { cn } from "@/lib/utils";
/*
  THE CARD AND THE DAB COME FROM THE TEASER ITSELF — see <Apart>. The client
  asked for that section's object here, and one stylesheet for both is the
  only way the two stay the same object: the file is two rules, it carries no
  colour of its own, and a second copy would drift the first time either is
  touched.
*/
import swatch from "@/components/sections/home/CollaborateTeaser.module.css";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow, forScript } from "@/components/ui/SectionHeader";
import {
  BRAND_STORY,
  CLOSING,
  COMMUNITY,
  MISSION,
  TAGLINE,
  VISION,
  WHAT_SETS_US_APART,
  WORKSHOP_JOURNEY,
} from "@/lib/brand";
import { PAINTS_ON_CREAM, paintAt } from "@/lib/paint";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Maison Palettia is a creative lifestyle brand celebrating creativity, mindfulness and meaningful human connection: hands-on experiences that bring people together.",
  path: "/about",
});

/**
 * /about — who the Maison is, in the order its own deck tells it.
 *
 * ==========================================================================
 * THE HOMEPAGE'S LANGUAGE, NOT THE HOMEPAGE'S LAYOUT
 * ==========================================================================
 *
 * This page was built before the homepage was redesigned and it showed:
 * profiled against the new home page it had 3 script headings to its 17, 5
 * doodles to its 117, and `bg-surface` — the near-white — as its dominant
 * ground where the homepage is Light Sage paper throughout. It read as a
 * different website.
 *
 * What it takes from the homepage is the VOCABULARY:
 *
 *   ONE PAPER.      Light Sage is the ground. White Rock and Deep Lilac are
 *                   objects laid on it — fields, plates, a closing panel —
 *                   never a new page colour. The homepage alternates nothing.
 *   SCRIPT SPEAKS.  Hapsha carries the statements a person would say out
 *                   loud; Montserrat carries everything a person has to use.
 *   DOODLES PUNCTUATE. They break an edge or mark an entry. None floats in
 *                   clear space, which is the one thing the deck never does.
 *   OBJECTS, NOT CARDS. Flush colour fields meeting on a hard seam, plates
 *                   at different sizes and angles — not a grid of boxes with
 *                   one radius and one shadow.
 *
 * What it does NOT take is the composition. The homepage opens on a
 * photograph, runs a carousel, holds a fixed picture and closes on a totem.
 * None of that is here. This page is a story told in six beats and its own
 * devices are a two-field statement, a threaded timeline and an offset
 * collage — so the two pages are unmistakably one brand and plainly not the
 * same page.
 *
 * THE WORDS ARE UNCHANGED. Every sentence is lib/brand.ts, the deck's own —
 * welcome and story (p.2), mission and vision (p.3), the community and how it
 * is made (p.4-5), what sets it apart (p.11), where it has created (p.12) and
 * the closing line (p.15). Nothing here is written for the website and no
 * claim, figure or programme detail has been added.
 */
export default function AboutPage() {
  return (
    <>
      <Welcome />
      <Purpose />
      <Community />
      {/*
        <LittleCreators /> HAS MOVED ON TO /private-events, at the client's
        ask, and it has now been on three pages: the home page first, here
        second, and the private events page third. That is where it finally
        belongs — tailored children's activities are something a client books
        for a birthday or a school, which is the question that page answers,
        and here it was only ever illustrating "appeals to all ages" for
        <Apart> below. See app/private-events/page.tsx.
      */}
      <Apart />
      <Close />
    </>
  );
}

/* ---- 01 welcome ---------------------------------------------------------- */

/**
 * The opening, and it is deliberately only words.
 *
 * The homepage opens on a photograph the size of the window. If this page did
 * the same it would read as the same page with different copy, so it opens on
 * the one thing an about page has that a homepage does not: the sentence the
 * brand is named for. The tagline is set at script-hero — the largest type on
 * the site — and the story sits under it at a reading measure, dropped to the
 * right so the eye turns a corner instead of running straight down.
 *
 * `pt` is generous and the section carries nothing else. That empty half is
 * the "visual pause" doing a job: it is what makes the next section's colour
 * arrive as an event.
 */
function Welcome() {
  return (
    /*
      `overflow-clip`, NOT `overflow-hidden`, AND IT IS A BUG FIX.

      `DoodleMark`'s draw runs on a CSS view timeline, and a view timeline
      resolves against the nearest SCROLL CONTAINER. `overflow: hidden` makes
      one; the box never scrolls inside itself, so a mark near its foot sits at
      the start of its own timeline for good — outline drawn, fill never
      arriving. The starburst at this section's bottom-left was measured that
      way at `fill-opacity: 0` at every scroll position. `overflow: clip` makes
      no scroll container, clips the same, and still respects a radius.
    */
    <section aria-labelledby="about-title" className="relative isolate overflow-clip bg-sage">
      <SectionShapes plan={groundShapes("sage")} />
      <Container className="relative py-[4rem] md:py-[5rem] lg:py-[6rem]">
        {/*
          The section's own mark, breaking the left margin. The lavender wave
          that used to break the right one has gone with the space it lived in
          — the picture is there now, and the wave is part of its arrangement
          rather than the page's.
        */}
        {/*
          AT THE FOOT, NOT AT 3rem OFF IT. The description moved into six
          columns when the picture took the other half, so it is four lines
          taller than it was and it now reaches y624 of a 720px section. This
          mark sat at `bottom-[3rem]` — x-24 to 80, y559 to 672 — which is
          across "of intentional living." Dropped past the section's floor it
          clears the last line by 24px and still crosses the left gutter,
          which is the half of it that matters.
        */}
        <Reveal
          delay={0.42}
          className="pointer-events-none absolute -bottom-8 -left-8 hidden w-[6rem] lg:block"
        >
          <DoodleMark name="starburst" color={INK.terracotta} treatment="draw" delay={460} />
        </Reveal>

        {/*
          ==================================================================
          THE PICTURE COMES UP BESIDE THE WORDS INSTEAD OF UNDER THEM
          ==================================================================

          It was a 21:9 band across the foot of the section, which left the
          whole right-hand half of the first screen empty — the client's note.
          Moved into that half it does two jobs at once: it fills the space
          and it stops the section being a column of type with a picture
          appended.

          `items-center` seats the object against the middle of the statement
          rather than its top, because the text column is the taller of the
          two and a picture hung from the eyebrow's line would read as the
          start of a second column rather than as the statement's companion.
        */}
        <div className="grid grid-cols-12 items-center gap-x-6 gap-y-12 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <Eyebrow>About the Maison</Eyebrow>
            </Reveal>

            {/*
              THE PAGE'S TITLE. `pb-[0.3em]` is not decoration and must stay on
              the element carrying the font-size: Hapsha's capitals and swashes
              stand about 0.9em above the baseline against a 0.8em line box, so
              without the clearance the line below cuts through the line above.
              Moved to a wrapper it resolves against 16px and fails again.
            */}
            <Reveal delay={0.08}>
              <h1
                id="about-title"
                className="heading-script mt-7 max-w-[15ch] pb-[0.3em] text-script-section text-text md:mt-9"
              >
                {forScript(TAGLINE)}
              </h1>
            </Reveal>

            {/*
              `BRAND_STORY` is the client's own description — one sentence of
              the deck, whole rather than cut into parts. On the homepage it is
              performed; here it is simply read, which is what an about page is
              for. The 62ch measure was their ask when it sat full width; in
              six columns the column reaches it first at 1440 and falls short
              below, which is the same sentence at a comfortable measure rather
              than a different decision.
            */}
            {/* TWO PARAGRAPHS, MAPPED. `BRAND_STORY` is a list since the
                client's rewrite, and an array dropped into one <p> renders as
                the strings run together with no space between them — React
                concatenates, it does not join. */}
            {BRAND_STORY.map((paragraph, i) => (
              <Reveal key={i} delay={0.16 + i * 0.06} className="mt-8 block md:mt-10">
                <p className="max-w-[62ch] text-lead text-text">{paragraph}</p>
              </Reveal>
            ))}
          </div>

          {/*
            ==================================================================
            THE OBJECT, BUILT THE WAY THE CLIENT'S REFERENCE BUILDS IT
            ==================================================================

            Two parts now, and the order they are written in is the order
            they stack: the photograph, which arrives already cut, and the
            marks over its edges.

            THE PHOTOGRAPH ARRIVES ALREADY CUT. `about-page-img.png` is the
            client's own file (a Figma export, 1950×1950): the picture inside a
            wavy outline on a transparent ground. So the CSS cut has come OFF
            the picture — clipping a shape that already has one gave it two
            outlines — and stays on the backing only. The frame is 4:5 with
            `object-cover`: the file is square with about 15% of clear ground
            either side of the cutting, and covering a 4:5 box takes 10% off
            each side, so the whole outline shows with a little air around it.
            The photograph itself carries no provenance record; it is not
            known to be the studio's own, so nothing captions it as such.

            THE PALER PIECE BEHIND IT HAS GONE, at the client's ask. It was a
            second cutting in `surface` — Light Sage mixed 30% into white —
            offset down and to the left, the way the deck lays paper on paper.
            It did not read that way here: the photograph's own outline is
            irregular and the backing's is a different irregular, so the two
            agreed along part of their edge and parted along the rest, and what
            showed through was a pale card behind the picture. The cutting
            stands on the section's own Light Sage instead, which is the ground
            the file was cut for.

            IT TOOK THE ROOM THE BACKING GAVE UP. Six columns rather than five
            and capped at 34rem rather than 28 — about a fifth larger on the
            widest screens and the full width of its column below them. Every
            mark is placed in percentages of this box, so all four keep hugging
            the outline at the new size.

            THE MARKS ARE THE REFERENCE'S OWN ARRANGEMENT: the terracotta
            starburst over the top-right corner, two small lilac cut-outs on
            opposite edges, and the lavender wave running off the bottom-right.
            All four break the picture's outline — none floats clear of it,
            which is the standing note on this brand's icons.
          */}
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            {/* Capped and centred in its column: the cutting is portrait, and
                past 34rem a 4:5 frame stands taller than the statement beside
                it. The marks are inside this box, so they keep hugging the
                picture whatever its size. */}
            <div className="relative mx-auto max-w-[34rem]">
            <Reveal variant="imageReveal" delay={0.24} className="relative block">
              <span
                className="relative block aspect-[4/5] w-full"
                data-paint
                style={{ "--paint": "var(--color-lavender)" } as React.CSSProperties}
              >
                <Image
                  src="/images/about-page-img.png"
                  /* The section's own picture and, now that it is six columns
                     wide, the page's largest contentful paint — Next says so
                     in the console. Eager, so the one thing anybody waits for
                     on /about is not queued behind the lazy loader. */
                  priority
                  alt="Two hands holding a small ceramic pot painted in blocks of soft blue, lilac, pink, yellow and green, a fine brush adding the last line."
                  fill
                  sizes="(min-width: 1024px) 544px, 92vw"
                  className="object-cover"
                />
              </span>
            </Reveal>

            <span
              aria-hidden
              className="pointer-events-none absolute -right-5 -top-7 w-[5rem] md:w-[6.5rem]"
            >
              <DoodleMark name="starburst" color={INK.terracotta} treatment="draw" delay={240} />
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute -right-3 top-[34%] w-[2.25rem] md:w-[2.75rem]"
            >
              <DoodleMark name="bow" color={INK.lilac} treatment="draw" delay={380} />
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute -left-3 bottom-[22%] w-[1.75rem] md:w-[2.25rem]"
            >
              <DoodleMark name="bow" color={INK.lilac} treatment="draw" delay={460} />
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-9 -right-8 w-[10rem] md:w-[12.5rem]"
            >
              <DoodleMark name="wave" color={INK.lavender} treatment="draw" delay={520} />
            </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---- 02 purpose ---------------------------------------------------------- */

/*
  THE HAND-BROKEN MISSION LINES HAVE GONE WITH THE TREATMENT THAT NEEDED THEM.

  `MISSION_LINES` set the statement as three given lines, because where a
  script statement turns is a design decision rather than a measure's. The
  statement is no longer the script — the label is — so the sentence wraps to
  its own measure like every other paragraph on the page, and a re-worded
  MISSION can no longer ship as three wrong lines because nothing here
  restates it.
*/

/**
 * Mission and vision as two fields meeting on a hard seam.
 *
 * One object, not two sections: the Deep Lilac and the White Rock share an
 * edge, a height and a radius, so the pair reads as a single thing laid on
 * the paper. It is the homepage's colour-field language — and it is not the
 * homepage's split screen, which runs full-bleed and edge to edge. This one
 * is held inside the measure and weighted 5/7, so the statement takes the
 * smaller, louder half and the explanation takes the larger, quieter one.
 */
function Purpose() {
  return (
    <section
      aria-labelledby="purpose-heading"
      className="relative isolate bg-sage pb-[5rem] md:pb-section lg:pb-section-lg"
    >
      {/* Lilac and Charcoal only: Warm Terracotta is 2.36:1 on Light Sage. */}
      <SectionShapes plan={PURPOSE_SHAPES} />
      <Container>
        <Reveal variant="fadeIn">
          {/*
            ==================================================================
            EQUAL HALVES, ONE TREATMENT — at the client's ask
            ==================================================================

            These were 42% and 58%, and set in two different ways: the mission
            as a script statement on Deep Lilac, the vision as Montserrat body
            copy on White Rock. The reasoning was that a mission is something
            somebody SAYS and a vision is something they describe — true, and
            it produced a pair that matched in nothing: not width, not height,
            not type, not rhythm. The client's note is that they should look
            equal and share one style.

            So both halves are now the same object: half the row each, the same
            padding, the same script label over the same Montserrat text at the
            same size. What still differs is the ground, and only the ground —
            which is what keeps them a PAIR rather than one long box.

            THE LABEL CARRIES THE SCRIPT, NOT THE STATEMENT. Setting the vision
            in Hapsha to match the mission would have put four lines of running
            copy in a display face; dropping the script from the mission would
            have taken the brand's own voice out of the one line on this page
            that has it. Moving it to the label gives both halves the script in
            the same place, doing the same job, at a length it is built for.

            INK, MEASURED. On Deep Lilac, Light Sage is 3.83:1 — large text
            only, which a script heading at this size is — and the near-white
            `surface` is 4.90:1, which carries the paragraph. On White Rock the
            two are Deep Lilac and Charcoal.
          */}
          <div className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem]">
            <div className="grid lg:min-h-[24rem] lg:grid-cols-2">
              <Purposeful
                ground="lilac"
                label="Our mission"
                id="purpose-heading"
                body={MISSION}
              />
              <Purposeful ground="cream" label="Our vision" body={VISION} />
            </div>

            {/*
              On the outer corner, not on the seam. A cut-out laid over a join
              reads as a sticker covering a joint rather than as the join being
              made well — which is why the homepage's own two-field object had
              its seam mark removed.
            */}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-3 right-5 hidden w-[4.5rem] rotate-[-8deg] md:block lg:right-8 lg:w-[5.5rem]"
            >
              <DoodleMark name="splash" color={INK.lavender} treatment="stamp" delay={260} />
            </span>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/**
 * One half of the purpose pair: a script label over a paragraph.
 *
 * Both halves take exactly this, so the two cannot drift into different
 * shapes — which is what the client's note was about. The only thing the
 * caller varies is the ground, and the two inks that go with it.
 */
function Purposeful({
  ground,
  label,
  body,
  id,
}: {
  ground: "lilac" | "cream";
  label: string;
  body: string;
  id?: string;
}) {
  const onLilac = ground === "lilac";

  return (
    <div
      className={cn(
        "flex flex-col justify-center px-7 py-12 md:px-11 md:py-16 lg:px-12",
        onLilac ? "bg-primary text-surface" : "bg-cream text-text",
      )}
    >
      <p
        id={id}
        className={cn(
          "heading-script pb-[0.18em] text-script-panel",
          onLilac ? "text-sage" : "text-primary",
        )}
      >
        {forScript(label)}
      </p>

      <p
        className={cn(
          /* The mission and the vision, at the client's ask: the top rung of
              the text ladder rather than the same `lead` every section intro
              takes. 42ch at this size is a 640px line, so the measure holds. */
          "mt-5 max-w-[42ch] text-statement",
          onLilac ? "text-surface" : "text-text",
        )}
      >
        {body}
      </p>
    </div>
  );
}

/* ---- 03 community -------------------------------------------------------- */

/**
 * How the community is made — the page's one threaded passage.
 *
 * White Rock ground, which is the first change of paper on the page and
 * arrives after the pause in <Welcome> and the object in <Purpose>.
 *
 * The four steps of WORKSHOP_JOURNEY are a sequence — walk-in, scheduled,
 * family, community — so they are drawn as one: a single rule running down
 * the column with a mark on it at each step. The homepage sets the same four
 * as a deck spread; here they are a thread, because this page is telling the
 * story in order and that is the one device that says "in order" without a
 * numeral. (Numerals are also why: Hapsha's 7, 8 and 9 are placeholder marks,
 * so a numbered list in the script is not available to this site.)
 */
function Community() {
  return (
    <section
      aria-labelledby="community-about"
      className="relative isolate overflow-hidden bg-cream py-[5rem] md:py-section lg:py-section-lg"
    >
      <SectionShapes plan={groundShapes("cream")} />
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-12">
          {/* The claim. */}
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Eyebrow>The Maison experience</Eyebrow>
            </Reveal>

            <Reveal delay={0.06}>
              <h2
                id="community-about"
                className="heading-script mt-6 max-w-[14ch] pb-[0.3em] text-script-section text-text"
              >
                {forScript(COMMUNITY.heading)}
              </h2>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-[42ch] text-lead text-text">
                {COMMUNITY.body}
              </p>
            </Reveal>

            {/* The closing line, in the script — it is the one sentence here
                that is a claim rather than a description. */}
            <Reveal delay={0.18}>
              <p className="heading-script mt-8 max-w-[18ch] pb-[0.3em] text-script-compact text-primary">
                {forScript(COMMUNITY.closer)}
              </p>
            </Reveal>
          </div>

          {/*
            ==================================================================
            NO BOXES AT ALL — the third version, and the client is right twice
            ==================================================================

            This was a thread: a hairline down the column with a bead on it at
            every step. Redesigned at the client's ask into laid cards, and
            their note on those was blunt — it does not look good, "especially
            its white boxes".

            They are right, and the reason is worth keeping. The section's
            ground is White Rock; the cards were the paler sage-white mix, so
            five near-white boxes sat on a near-white field, each carrying a
            soft edge and a shadow to be visible at all, each nudged off the
            column and with a cut-out over its corner. Five faint rectangles
            competing to be seen is what that reads as.

            So there is no box. Each step is a stroke of the brand's own paint
            with the words beside it — the loaded-brush mark the workshop
            journey and the collaboration cards already use (`dab` in
            globals.css), in a different colour for each step, with the step's
            cut-out laid over it. Nothing has an edge, nothing needs a shadow
            to exist, and the colour is doing the work the boxes were failing
            to do.
          */}
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <Stagger as="ol" className="flex flex-col gap-9 md:gap-10">
              {WORKSHOP_JOURNEY.map((step, i) => (
                <Reveal as="li" key={step.slug} delay={i * 0.06} className="flex gap-5 md:gap-6">
                  {/*
                    THE CUT-OUT ON ITS OWN, AND THAT IS A CORRECTION.

                    This was briefly a dab of paint with the step's cut-out
                    drawn on it in White Rock — the guideline's own two-tone
                    construction, a coloured shape with another shape cut out
                    of it. It did not work at this size: the dab is 9px of
                    height and the cut-out is 44px wide, so the shape sat over
                    the whole mark and out past its top, and what rendered was
                    a chewed blob rather than either object.

                    The two-tone icon needs the backing shape to be the larger
                    of the two. At the size a list item can give a mark, the
                    cut-out alone in its own colour is the honest version — and
                    it is what every other list on this site uses.
                  */}
                  <span
                    aria-hidden
                    className="mt-0.5 block w-[2.75rem] shrink-0 md:w-[3.25rem]"
                    style={{ rotate: `${i % 2 === 0 ? -8 : 6}deg` }}
                  >
                    <DoodleMark
                      name={JOURNEY_MARKS[i % JOURNEY_MARKS.length]}
                      color={JOURNEY_INKS[i % JOURNEY_INKS.length]}
                      treatment="stamp"
                      delay={200 + i * 110}
                    />
                  </span>

                  <div>
                    <h3 className="text-h4 font-semibold text-text">
                      {step.name}
                    </h3>
                    <p className="mt-2 max-w-[40ch] text-body text-text/85">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </Stagger>
          </div>
        </div>
      </Container>
    </section>
  );
}

/*
  The marks the thread uses, and the inks they are drawn in.

  Kept as lists indexed by position rather than hung off each step's slug: the
  steps come from lib/brand.ts and a fifth one added there should not have to
  remember to add itself here. White Rock is not in the ink list — the nodes
  sit on a White Rock ground and a White Rock cut-out on it is an empty disc.
*/
const JOURNEY_MARKS: readonly DoodleName[] = [
  "starleaf",
  "splash",
  "starburst",
  "wave",
  /* Five, because WORKSHOP_JOURNEY has five steps and a four-long list wrapped
     — the last card came back with the first one's mark and ink, which reads
     as a mistake rather than as a rhythm. */
  "coral",
];
const JOURNEY_INKS: readonly string[] = [
  INK.terracotta,
  INK.lilac,
  INK.lavender,
  INK.terracotta,
  INK.lilac,
];

/* ---- 04 apart ------------------------------------------------------------ */

/**
 * What sets the Maison apart — four points, set as an editorial list.
 *
 * NOT FOUR CARDS. Four equal boxes in a row is the composition the brief
 * calls a card website, and it is also the least useful arrangement for this
 * content: the points are not parallel options a visitor chooses between,
 * they are four things to read. So they run down the page as entries, each
 * indented a little further than the last, with the mark in the margin.
 *
 * The stagger of the indent is the whole device — it gives the eye a
 * left-hand edge that moves, which is the asymmetry the homepage gets from
 * its collages, in a section that has no photographs to offset.
 */
function Apart() {
  return (
    /*
      ==========================================================================
      THE TEASER'S COMPOSITION, WHICH IS WHAT THE CLIENT ASKED FOR
      ==========================================================================

      Their note was to make this section look like the collaboration teaser
      further down the page, and it is a fair read of what was wrong with it.
      This was a heading in the top-left corner with four equal cards run
      across the foot underneath — a header over a grid, which is the shape
      every section takes when the composition has not been decided. The
      teaser is the better object: the claim stands on the left as plain type,
      and the things being claimed are dealt out on the right as swatch cards,
      each set down a degree or two off square with a dab of paint above its
      name.

      SO THE OBJECTS ARE THE TEASER'S, LITERALLY — `CollaborateTeaser.module.css`
      rather than a second copy of its two rules. See the note on that import.

      IT IS STILL NOT THE SAME SECTION TWICE, and the differences are the ones
      that read at a glance. The ground stays lavender: the client asked for
      that colour, and it is the one the page has nowhere else — so this is
      White Rock cards on lavender where the teaser is Light Sage cards on
      White Rock. There are four of them rather than three, dealt two at a time
      rather than fanned in a row. And nothing here is a door: the page's calls
      to action are in <Close> below, and these four cards are for reading, not
      pressing.

      THE LAVENDER IS THE QUIETED ONE, ALSO AT THE CLIENT'S ASK — `bg-lavender-soft`,
      Soft Lavender with White Rock mixed into it, defined and measured in
      globals.css. Their note on the full-strength colour was that it was too
      much contrast, and it was: a saturated periwinkle band between two Light
      Sage fields arrives as a colour rather than as paper, and every White
      Rock object laid on it had to fight it.

      MEASURED, BECAUSE THE INK HAS TO SURVIVE IT. Charcoal Slate is 7.56:1 on
      this ground and 9.36:1 on the cards, so every word keeps the ink it had —
      and the quieter ground is the safer one, not the riskier. The heading
      does NOT take the teaser's Deep Lilac: lilac here is 3.19:1, which is
      display-only, and a section heading that cannot also be a label is a
      heading waiting to be copied into one.
    */
    <section
      aria-labelledby="apart-heading"
      /*
        `overflow-x-clip`, NOT `overflow-hidden`. The cards are tilted and lap
        their own column, and a shape reaching past the gutter on a narrow
        screen gives the whole page a horizontal scrollbar. `hidden` would stop
        that too — and would also make a scroll container, which leaves every
        mark inside it parked at the start of its own view timeline, outline
        drawn and fill never arriving. `clip` clips without making one.
      */
      /* The extra 2.5rem at the foot is exactly what the right-hand pair of
         cards is translated down by: without it the fan hangs 40px closer to
         the colour seam below than the heading does to the one above, and the
         section reads as sitting low in its own band. */
      className="relative isolate overflow-x-clip bg-lavender-soft py-[4.5rem] md:py-[6rem] lg:py-[7rem] lg:pb-[9.5rem]"
    >
      <SectionShapes plan={APART_SHAPES} />
      <Container className="relative">
        <div className="grid grid-cols-12 items-start gap-x-gutter gap-y-14 lg:items-center">
          {/* ---- the claim, as plain type on the page -------------------- */}
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              {/*
                The teaser's own label rather than <Eyebrow>: charcoal type
                with the colour carried by the mark beside it. The mark is
                decorative and `aria-hidden`, so it owes no ratio, and the
                label is not asked to be lilac on lavender.
              */}
              <p className="flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-text">
                <span aria-hidden className="block w-4 shrink-0">
                  <DoodleMark name="dot" color={INK.lilac} />
                </span>
                What sets us apart
              </p>
            </Reveal>

            {/*
              The house heading rather than an `h2` with the script set on it
              by hand — this one gets the masked line reveal the teaser's
              statement has, and where it breaks is a decision rather than
              whatever the measure does.
            */}
            <DisplayHeading
              id="apart-heading"
              size="section"
              className="mt-6 md:mt-7"
              lines={["Why It Feels", "Different"]}
            />
          </div>

          {/* ---- the four points, dealt two at a time -------------------- */}
          <Stagger
            as="ul"
            className="col-span-12 grid gap-5 sm:grid-cols-2 lg:col-span-7 lg:col-start-6 lg:gap-x-0 lg:gap-y-6"
          >
            {WHAT_SETS_US_APART.map((point, i) => {
              const card = APART_CARDS[i % APART_CARDS.length];

              return (
                <Reveal
                  as="li"
                  key={point.slug}
                  /* Dealt from above, one after the other — `drop` in
                     lib/motion.ts, at the 0.12 the teaser settled on: at 80ms
                     against a 680ms fall four cards land as a block. */
                  variant="drop"
                  delay={i * 0.12}
                  className={cn("relative", card.z, card.lane)}
                >
                  <div
                    className={cn(
                      swatch.card,
                      "plate h-full rounded-[1.25rem] bg-cream px-5 pb-7 pt-6 md:px-6 md:pb-8 md:pt-7",
                      card.lap,
                    )}
                    style={{ "--tilt": card.tilt } as React.CSSProperties}
                  >
                    {/*
                      The dab, at the size the workshop journey settled on. It
                      is the only thing carrying colour here, and it is
                      decorative: nothing in this section is told apart by
                      colour alone. `PAINTS_ON_CREAM` is three colours over
                      four cards, so the palette starts again rather than two
                      neighbours matching — and Light Sage is not in it,
                      because sage on White Rock is 1.03:1 and a swatch nobody
                      can see is a missing swatch.
                    */}
                    <span
                      aria-hidden
                      className={cn(swatch.dab, "h-9 w-[3.5rem] md:h-10 md:w-[4.25rem]")}
                      style={
                        {
                          "--paint": paintAt(i, PAINTS_ON_CREAM),
                          "--tilt": card.dab,
                        } as React.CSSProperties
                      }
                    />

                    {/*
                      The deck's condensed face in caps, which is what every
                      named thing taken straight off the deck is set in — these
                      four are deck p.11. One weight only, so
                      `font-synthesis: none`.
                    */}
                    <h3 className="mt-5 text-h4 font-bold uppercase tracking-[0.015em] text-text [font-family:var(--font-deck)] [font-synthesis:none]">
                      {point.name}
                    </h3>

                    <p className="mt-2.5 text-body text-text/85">
                      {point.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </Stagger>
        </div>
      </Container>
    </section>
  );
}

/*
  HOW EACH CARD IS DEALT — the teaser's `CARDS`, at four instead of three.

  `tilt` and `dab` are the two angles, fixed per card: four objects at one
  angle read as a template that has been knocked, four set down differently
  read as paper somebody put there.

  `lane` is where a card sits in its pair. The right-hand two lap 4% into the
  left-hand two and drop 2.5rem below them, and that lap is what turns a
  two-by-two grid into a hand rather than a table. It is also the teaser's
  measured failure and its fix: a card on top covered the first letter of the
  words under it, so every lapped card carries 36px of left padding at `lg`
  while the lap itself is about 10px of a 265px column — what a neighbour
  covers is always padding and never a letter, and anything added to these
  cards has to stay inside it.

  THE DROP IS `translate-y` ON PURPOSE. In Tailwind v4 that compiles to the
  `translate` property rather than to `transform`, so it composes with both the
  card's own rotation and the deal animation instead of overwriting either.

  `z` keeps the left of each pair on top, so the right card tucks under it.

  Written as complete class strings because Tailwind reads source literally:
  anything assembled at runtime never reaches the stylesheet. The lap and the
  drop are `lg:`-prefixed, so at `sm` this is a plain two-up grid and below
  that the four simply stack.
*/
const APART_CARDS = [
  { tilt: "-2.4deg", dab: "-7deg", lane: "", z: "z-40", lap: "" },
  { tilt: "1.7deg", dab: "5deg", lane: "lg:-ml-[4%] lg:translate-y-10", z: "z-30", lap: "lg:pl-9" },
  { tilt: "1.1deg", dab: "-4deg", lane: "", z: "z-20", lap: "" },
  {
    tilt: "-1.6deg",
    dab: "6deg",
    lane: "lg:-ml-[4%] lg:translate-y-10",
    z: "z-10",
    lap: "lg:pl-9",
  },
] as const;
/*
  The shapes behind <Apart>.

  THEY HAVE MOVED WITH THE CARDS. The plan put all four in the band to the
  right of the heading, which was open when the cards sat across the foot and
  is now where the cards are — four marks under four opaque plates is four
  marks nobody sees. Two are on the left now, around the statement, and two
  keep the corners the cards do not reach.

  Held low — 0.14 to 0.2 — because a ground that competes with a script
  heading is not a ground. Each drifts at its own rate and breathes on its own
  clock, so four marks read as layers at different distances rather than as one
  sheet of stickers.

  White Rock is in the list and Light Sage is not: the ground is lavender, and
  sage on lavender is the one pair in this palette too close to tell apart at
  this opacity. White Rock is now the faintest of the four, because the ground
  it is drawn on has White Rock mixed into it — it is the one mark here that is
  a texture rather than a shape, which is the right job for it behind a script
  heading.

  The per-card marks that used to sit in each plate have gone with the plate
  that held them — the card carries a dab of paint above its name now, which is
  the teaser's object and the thing the client asked for.
*/
/*
  On Deep Lilac only White Rock (3.95:1) and Light Sage (3.83) clear the 3:1 a
  decorative mark owes — Charcoal is 2.37 and Soft Lavender 2.74, so neither
  appears here.
*/
const CLOSE_SHAPES: readonly ShapePlan[] = groundShapes("lilac");

const PURPOSE_SHAPES: readonly ShapePlan[] = groundShapes("sage");

const APART_SHAPES: readonly ShapePlan[] = groundShapes("lavender");

/* ---- 06 close ------------------------------------------------------------ */

/**
 * The deck's closing line, on a Deep Lilac field.
 *
 * The one full field of colour on the page, and it is at the end on purpose:
 * the page has been Light Sage paper with two objects on it, so the last beat
 * being entirely a colour is what makes it read as a close rather than as
 * another section. The homepage closes on the same words over its own paper,
 * which is the point — same sentence, same brand, different ending.
 */
function Close() {
  return (
    <section aria-labelledby="about-close" className="relative isolate overflow-hidden bg-primary">
      <SectionShapes plan={CLOSE_SHAPES} />
      <Container className="relative py-[5rem] text-center md:py-section lg:py-[7rem]">
        {/* Soft Lavender and White Rock only: on Deep Lilac, terracotta is
            2.0:1 and the lilac marks disappear into the ground entirely. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[6%] top-10 hidden w-[5rem] rotate-[-10deg] md:block"
        >
          <DoodleMark name="starburst" color={INK.lavender} treatment="draw" delay={300} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-10 right-[7%] hidden w-[4.5rem] rotate-[8deg] md:block"
        >
          <DoodleMark name="splash" color={INK.whiteRock} treatment="draw" delay={420} />
        </span>

        <Reveal>
          <h2
            id="about-close"
            className="heading-script mx-auto max-w-[16ch] pb-[0.3em] text-script-section text-surface"
          >
            {forScript(CLOSING.heading)}
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mx-auto mt-5 max-w-[34ch] text-lead text-surface">
            {CLOSING.body}
          </p>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
            {/* `cream` is the tone for a button standing ON Deep Lilac — a
                lilac one cannot be seen at all. See <BlobButton>. */}
            <BlobButton href="/events" tone="cream" className="min-h-[3.25rem] px-8">
              Explore experiences
            </BlobButton>

            {/* The sticky note, as in the homepage banner — see <PeelNote>. */}
            <PeelNote href="/private-events" className="min-h-[3.25rem] px-8">
              Plan a private event
            </PeelNote>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
