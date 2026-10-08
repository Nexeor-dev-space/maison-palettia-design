import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { PaintStroke } from "@/components/layout/PaintStroke";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { getCreativeExperiences } from "@/lib/experiences";
import { getUpcomingWorkshops } from "@/lib/workshops";
import { TWO_WAYS_SPOTS } from "@/components/sections/home/homeSpots";

/**
 * ==========================================================================
 * WALK IN, OR BOOK A SEAT — a fork in the road, and nothing else
 * ==========================================================================
 *
 * WHAT THIS SECTION IS FOR. One question: how do you take part? There are two
 * answers, and a visitor needs to know which one is theirs. That is the whole
 * job.
 *
 * ==========================================================================
 * WHY IT KEPT GROWING, AND WHAT WAS CUT
 * ==========================================================================
 *
 * It had, per half: an eyebrow, a numeral, a heading, a sentence of prose, a
 * photograph, a three-row fact table, a labelled list of five names or two
 * dated sessions, a venue line and an action. Something like forty-five words
 * a side, in eight type sizes, and the client's note — twice — was that it is
 * too much to read to find out what is in it.
 *
 * The reason it was too much is that almost none of it was this section's to
 * say. Every one of those things is already on the page, better placed:
 *
 *   the activity names ... <ExperienceCarousel>, immediately above this, as
 *                          seven photographs you can open;
 *   the dates .......... /events, which this section's own button opens;
 *   the venue .......... <WhereWeCreate> and /locations, which the other
 *                          button opens;
 *   the walk-in vs
 *   scheduled split .... <WorkshopJourney>, the first two swatches, and the
 *                          Experiences menu.
 *
 * A signpost that recites the contents of every road it points down is not a
 * signpost. So this is now a fork: two grounds, a photograph each, the name of
 * the choice, one line saying what it means, and the one thing that road
 * actually needs.
 *
 * THE TWO ACTIONS ARE DIFFERENT ON PURPOSE, and that difference is the most
 * useful thing here. If you need no booking, the only thing you are missing is
 * where to go; if you need a date, the only thing you are missing is when. So
 * one button opens the map and the other opens the calendar, rather than both
 * pointing at the same list.
 *
 * ==========================================================================
 * THE COMPOSITION
 * ==========================================================================
 *
 * Two colour fields meeting on a hard seam, both running to the edge of the
 * screen — White Rock where you can simply turn up, Deep Lilac where there is
 * a seat with your name on it. One cut-out sits across the join; it is the
 * only thing belonging to both halves and it is what stops the split reading
 * as two unrelated panels.
 *
 * NOTHING HERE IS WRITTEN FOR THE LAYOUT. The counts are the real records —
 * add a DIY activity and the left line says six — and the wording is the
 * site's own for this distinction, which <WorkshopsMenu> already gives as
 * "No booking — come in any time and make something." and "A set date and
 * time, booked online."
 *
 * ==========================================================================
 * THE HEADING WAS THERE ALL ALONG AND ONLY A SCREEN READER GOT IT
 * ==========================================================================
 *
 * The client's note is that the section arrives with no heading and no
 * description, and they are right about what is on screen: it opened cold on
 * two colour fields, and a reader met "01 NO BOOKING / WALK IN" with nothing
 * having told them what the two halves are for.
 *
 * It was not that the heading was missing. It was `sr-only` — the two
 * names, announced to a screen reader and drawn for nobody — on the
 * argument that two fields, two names and two buttons say it themselves. They
 * do not, and a heading that only one kind of visitor gets is the wrong kind
 * of difference anyway. It is now the section's visible statement, in the
 * brand's script, and the accessible name is unchanged because it is the same
 * words on the same element.
 *
 * THE SENTENCE UNDER IT IS THE SITE'S OWN, recombined rather than written:
 * the walk-in half of <WorkshopsMenu> says "come in any time and make
 * something", the scheduled half "a set date". Nothing new is claimed, and it
 * keeps the one distinction that must never blur — the walk-in activities are
 * not booked online, and this line does not imply they are.
 *
 * WHITE ROCK FOR THE BAND, so the two colour fields become an object laid
 * between two cream surfaces: <WhereWeCreate> below is White Rock too, and
 * the sheet above is Light Sage, so the header is not a third pale green
 * meeting a second one.
 */
export async function TwoWaysToCreate() {
  const [experiences, sessions] = await Promise.all([
    getCreativeExperiences(),
    getUpcomingWorkshops(3),
  ]);

  const walkIn = experiences.filter((experience) => experience.kind === "diy");

  /* The picture for each road: the first of that kind that has one. Both are
     optional in the data, and a missing one leaves its frame as cream rather
     than reaching for a photograph of something else — see lib/experiences. */
  /*
    Where the studio is, and when the next session runs — the two facts the
    doodle rows below need that are not just a count. Both fall back to
    something true rather than to a placeholder: an unnamed venue is still
    "Times Square Center" on every page of this site, and with no dates set
    the honest answer is that they are coming.
  */
  const home = "Times Square Center, Dubai";
  const next = sessions.find((session) => session.kind !== "diy");
  const nextDate = next
    ? new Date(next.startsAt).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "Dates coming";

  const walkInPlate = walkIn.find((experience) => experience.image)?.image;
  const scheduledPlate = experiences.find(
    (experience) => experience.kind === "scheduled" && experience.image,
  )?.image;


  return (
    <section
      id="two-ways"
      aria-labelledby="two-ways-heading"
      /* `overflow-clip`, not `hidden`: `hidden` makes a scroll container, and
         the cut-out straddling the seam below draws on a view timeline, which
         resolves against the nearest one — inside a scroll container it is
         reported as permanently out of view and never fills. */
      className="relative isolate overflow-clip"
    >
      {/* ---- what the two halves are, before you meet them --------------- */}
      {/* `isolate`, and it is load-bearing. <SectionShapes> paints at -z-10;
          with no stacking context here that -10 escapes to the section's own
          `isolate` and the marks land BEHIND this band's cream background,
          where they cannot be seen. Isolating keeps them above the cream and
          below the type. */}
      <div className="relative isolate bg-cream pb-[3rem] pt-[4rem] md:pb-[3.5rem] md:pt-[5.5rem] lg:pb-[4.5rem] lg:pt-[6.5rem]">
        {/* The band's doodles — see homeSpots.ts. */}
        <SectionShapes plan={TWO_WAYS_SPOTS} />
        <Container>
          <Reveal>
            <Eyebrow>How to take part</Eyebrow>
          </Reveal>

          <DisplayHeading
            id="two-ways-heading"
            size="section"
            className="mt-6 md:mt-7"
            lines={["Create Anytime,", "or Make It Your Way."]}
          />

          <Reveal delay={0.12}>
            {/* `script-lede` rather than a margin: the gap under a script
                heading is a token, because Hapsha's descenders hang into it. */}
            <p className="script-lede max-w-[54ch] text-lead text-text/80">
              Drop in and create, or book a seat for a scheduled session.
            </p>
          </Reveal>
        </Container>
      </div>

      {/* ---- the fork ---------------------------------------------------- */}
      <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* The two lines are held to one line each and to about the same
            length, so the two buttons land on the same baseline and the halves
            read as a pair rather than as one longer than the other. */}
        <Road
          index={1}
          ground="terracotta"
          eyebrow="No booking"
          title="Create Anytime"
          /* Not Terracotta any more — that is the ground it would sit on. */
          dot={INK.whiteRock}
          plate={walkInPlate}
          line="Pick a project. Pick your colours. Just drop in."
          /*
            THE DETAIL THAT USED TO BE THREE LABELLED PARAGRAPHS. The old
            version of this section carried BOOKING / MAKE / WHERE as headed
            blocks of running copy, and the client asked for those facts back
            WITHOUT the text — so each is a mark and a few words, and the
            things a reader can already infer ("Not needed. Turn up and
            start.") are gone rather than reworded. Three is the whole list:
            what it costs you to arrive, what kind of making this is, and
            where.
          */
          /*
            ==============================================================
            THE MIDDLE FACT IS NO LONGER A TALLY — at the client's ask
            ==============================================================

            It read "5 activities" here and "2 sessions" opposite, counted
            live off the catalogue. The count was accurate and it was the
            wrong thing to say in this slot for two reasons.

            A BARE NUMBER INVITES THE COMPARISON IT LOSES. Five against two,
            side by side in matching chips, reads as a scoreboard — and the
            smaller half is the one the studio wants booked. "2 sessions" is
            the truth and it is also the thinnest possible way to put it.

            AND THE SLOT'S QUESTION IS NOT "HOW MANY". The three chips answer
            what it costs you to arrive, what kind of making this is, and
            where or when — see the note below. Only the middle one was
            answering a different question from its neighbours.

            THE NOUNS STAY, which is the part of the ask that matters: this
            half is still about ACTIVITIES and the other is still about
            SESSIONS. What goes is the arithmetic in front of them, and what
            arrives in its place is the thing the two halves actually differ
            on — you CHOOSE here, you are GUIDED there. The catalogue can
            grow or shrink now without the homepage announcing it.

            NOT "PICK YOUR ACTIVITY", THOUGH IT IS SHORTER. The line directly
            above this row is "Pick a project. Pick your colours." — a third
            "pick" inside 40px of each other reads as a stutter, and "choose"
            is the word that makes the contrast with "guided" anyway.

            THE ROW STILL WRAPS TO TWO LINES ON THIS SIDE at desktop widths,
            and no wording fixes that: "Times Square Center, Dubai" is 311px
            of a 590px track at 1440 on its own, so the three chips were over
            the track with "5 activities" too — it fitted only past about
            1600. Measured rather than guessed. Shortening the middle chip to
            the point where it fits means cutting it to one bare word, which
            costs more than the second line does.
          */
          facts={["No booking", "Choose your activity", home]}
          action={{ label: "Find the studio", href: "/locations", tone: "sage" }}
        />

        <Road
          index={2}
          ground="lilac"
          eyebrow="A date and a seat"
          title="Create Together"
          dot={INK.lavender}
          plate={scheduledPlate}
          line="A little more planned. Same creative energy."
          /*
            The same three, as this half answers them. The old block listed
            every upcoming date with its price and remaining seats, which is
            the events page's job — here it is only the NEXT one, because the
            question this side answers is "is there one soon?".
          */
          facts={["Booked online", "Guided sessions", nextDate]}
          action={{ label: "See the dates", href: "/events#scheduled", tone: "cream" }}
        />
      </div>

      {/*
        The one thing belonging to both halves, sitting across the join. On a
        phone the halves stack, so it lands on the horizontal seam instead —
        the same job, the other axis.

        IT IS POSITIONED AGAINST THE FORK, NOT AGAINST THE SECTION, and that
        is why the fork has a wrapper of its own. `top-29%` was measured
        against a section that began at the first photograph; with a header
        band above it the same figure lands a third of the way down the
        heading instead.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[29%] z-10 hidden w-[9rem] -translate-x-1/2 -translate-y-1/2 lg:block"
      >
        {/* White Rock, not Terracotta: this mark straddles the seam, and half
            of it now lies on a Terracotta ground. */}
        <DoodleMark name="splash" color={INK.whiteRock} delay={300} />
      </span>
      </div>
    </section>
  );
}

/**
 * One road: a photograph, what it is called, what it means, and where it goes.
 *
 * ==========================================================================
 * FOUR THINGS, AND A LOT OF AIR
 * ==========================================================================
 *
 * Four type sizes, not eight: the label, the name, the line, the button. There
 * is nothing here to scan past, so the space between them can be generous —
 * which is what makes two blocks of this little text read as a considered
 * choice rather than as a thin card.
 *
 * THE PHOTOGRAPH IS A PHOTOGRAPH, AND THE SECTION IS ONE SCREEN. It was a
 * 240px band across a 660px column, nearly 3:1, which is a banner — you read
 * it as decoration above the content rather than as a picture of the thing.
 * It then went to 4:3, and 4:3 is what made the client call the section
 * "very tall": measured, the whole thing ran 1025px at 1440×900 and 1141px at
 * 2000×1030, with the button under the fold at both. A 4:3 frame that is
 * 42vw wide is 615px tall on a 2000px screen before a word is set.
 *
 * So it is 16:9 — still a picture, the ratio every photograph on a phone
 * already is — and on a desktop it is capped at 21rem, because the frame is
 * sized off the WIDTH of the screen and the section has to fit its HEIGHT.
 * `max-height` alone does that: `aspect-ratio` only resolves the auto
 * dimension, so the frame keeps its full width and the picture, which is
 * `object-cover`, simply shows a little less of its top and bottom on a very
 * wide screen. With the vertical padding brought from 6rem to 4rem and the
 * gaps between the four things tightened by a step each, the section is
 * about 820px at 1440×900 and 750px at 2000×1030 — inside the window, button
 * included. The seam mark moved with it: `top-[29%]` is the centre of the
 * photo band, where `top-1/2` used to land before the frames got shorter.
 *
 * ==========================================================================
 * INK, AND WHY NEITHER HALF SOFTENS IT
 * ==========================================================================
 *
 * Both grounds are saturated now — the left half was White Rock and is Warm
 * Terracotta at the client's ask — so both carry the same near-white ink at
 * FULL strength. There is no room to soften either: the left half used to run
 * its line at `text-text/80`, which was 5.5:1 on White Rock and is nothing
 * like that on Terracotta.
 *
 * WARM TERRACOTTA IS A LIGHT GROUND, AND THIS IS THE ONE THING TO KNOW ABOUT
 * IT. #D97757 has a relative luminance of 0.286 — nearly twice Deep Lilac's
 * 0.158 — so a near-white on it reads 2.88:1 where the same ink on the lilac
 * half reads 4.67:1. Body copy owes 4.5:1 and large text 3:1, and 2.88 is
 * under both. Charcoal on it is 3.84:1, which is also under 4.5.
 *
 * There is no ink that clears 4.5:1 on neat #D97757; the ground itself is the
 * variable. Deepening it to about 75% Terracotta in Charcoal would take the
 * near-white over 4.5:1 and keep the hue, at the cost of the colour the client
 * named. That is a decision about the brand, not about the code, so this ships
 * the colour as asked and the note is here so the number is not rediscovered.
 */
/*
  ==========================================================================
  A COLOUR PER CHIP, AND WHY THESE THREE
  ==========================================================================

  The chips were all Soft Lavender. The client has asked for them to differ,
  and the constraint is that a chip is a FIELD with words on it — Charcoal sits
  on each one and owes it 4.5:1 — so the palette cannot simply be cycled:
  Warm Terracotta undiluted is about 3.5:1 against Charcoal and fails.

  So two of the three are brand colours mixed 30% into White Rock, which is the
  same device <WaysToExperience> uses for its four panels and is already
  measured there: Soft Lavender 8.4:1, Warm Terracotta 7.3:1. Light Sage needs
  no dilution at 9.07:1 and is used neat.

  They are assigned by POSITION, not by meaning. Nothing here is told apart by
  its colour — "No booking" is not orange because it is a booking fact — so the
  order is simply the order, and a fourth chip would take the first colour
  again rather than needing a new one.
*/
const CHIP_PAINTS = [
  "color-mix(in oklab, #C4B5FD 30%, var(--color-cream))", // 8.4:1
  "var(--color-sage)", // 9.07:1
  "color-mix(in oklab, #D97757 30%, var(--color-cream))", // 7.3:1
] as const;

/*
  AND A THIRD COLOUR FOR THE TERRACOTTA HALF, because a chip also has to be
  told apart from the FIELD IT SITS ON, which is a second constraint the list
  above never had to answer: both halves used to be pale.

  The third paint is Warm Terracotta cut into White Rock, and on a Warm
  Terracotta ground that is the same colour twice — it separates at about
  2.0:1 and reads as a slightly paler patch rather than as a chip. White Rock
  neat separates at 2.4:1, is crisper than the number suggests because it is a
  flat cream against a saturated orange, and carries Charcoal at 9.4:1, which
  is the best of the four. Only the third changes: the first two are a mauve
  and a green and were never at risk here.
*/
const CHIP_PAINTS_ON_TERRACOTTA = [
  CHIP_PAINTS[0],
  CHIP_PAINTS[1],
  "var(--color-cream)", // 9.4:1
] as const;

function Road({
  index,
  ground,
  eyebrow,
  title,
  dot,
  plate,
  line,
  facts,
  action,
}: {
  index: number;
  ground: "terracotta" | "lilac";
  eyebrow: string;
  title: string;
  dot: string;
  plate?: { src: string; alt: string; position?: string };
  line: string;
  facts: readonly string[];
  action: { label: string; href: string; tone: "sage" | "cream" };
}) {
  const warm = ground === "terracotta";
  const chips = warm ? CHIP_PAINTS_ON_TERRACOTTA : CHIP_PAINTS;

  return (
    <div
      className={
        warm
          ? "relative bg-terracotta px-gutter py-[3.5rem] text-surface md:py-[4rem] lg:pl-[10%] lg:pr-[8%]"
          : "relative bg-primary px-gutter py-[3.5rem] text-surface md:py-[4rem] lg:pl-[8%] lg:pr-[10%]"
      }
    >
      {/*
        THE PANEL'S OWN MARKS, and the phone is why they are here. Everything
        decorative in this section was `hidden lg:block` — the masthead's three
        and the splash on the seam — so a phone met two flat slabs of colour
        with a photograph and a list on them and nothing of the brand around it.

        THE COLOUR IS NOT A CHOICE, IT IS THE ONLY ONE THAT CLEARS. Measured
        against each ground at the 3:1 a decorative mark owes:

          on Warm Terracotta ... White Rock 2.44, Light Sage 2.36, Soft
                                 Lavender 1.69 — every pale brand colour is too
                                 close to be seen. Charcoal is 3.84 and is the
                                 only one that reads.
          on Deep Lilac ........ White Rock 3.95 and Light Sage 3.83 both read;
                                 Charcoal is 2.37 and Soft Lavender 2.74, so
                                 the warm panel's answer is wrong here and the
                                 two grounds take opposite inks.

        Placed inside the box rather than across its edge: these two panels sit
        flush against each other at `lg`, so a mark crossing an edge would land
        on its neighbour's ground, where its colour is measured against the
        wrong thing.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-[6%] top-[3%] z-10 block w-12 rotate-[14deg] sm:w-16"
      >
        <DoodleMark
          name="splash"
          color={warm ? INK.charcoal : INK.whiteRock}
          treatment="draw"
          delay={260}
        />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[6%] right-[8%] z-10 block w-10 -rotate-12 sm:w-14"
      >
        <DoodleMark
          name="starleaf"
          color={warm ? INK.charcoal : "var(--color-sage)"}
          treatment="draw"
          delay={420}
        />
      </span>
      <span
        aria-hidden
        /* Below the button, not at 16%: the fact chips wrap to a third row on a
           phone and 16% put this behind "Sun 11 Oct". A mark crossing a panel
           edge is the deck's habit; a mark sitting on a date is not. */
        className="pointer-events-none absolute bottom-[3%] left-[5%] z-10 block w-10 rotate-[8deg] sm:w-12 lg:hidden"
      >
        <DoodleMark
          name="bow"
          color={warm ? INK.charcoal : INK.whiteRock}
          treatment="draw"
          delay={540}
        />
      </span>

      <Reveal variant="imageReveal">
        <span className="plate relative block aspect-[16/9] w-full overflow-clip rounded-[1.5rem] lg:max-h-[21rem]">
          {plate ? (
            <Image
              src={plate.src}
              alt={plate.alt}
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              style={{ objectPosition: plate.position ?? "50% 50%" }}
              className="object-cover"
            />
          ) : null}
        </span>
      </Reveal>

      <Reveal delay={0.08}>
        {/* The numeral and the label on one line: the numeral says there are
            two of these before a word is read, and the label says which one
            this is. Together they are four words. */}
        <p className="mt-7 flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow">
          <span aria-hidden className="block w-4 shrink-0">
            <DoodleMark name="dot" color={dot} />
          </span>
          <span aria-hidden className="tabular-nums opacity-60">
            {String(index).padStart(2, "0")}
          </span>
          {eyebrow}
        </p>
      </Reveal>

      <Reveal delay={0.12}>
        <h3 className="mt-3 text-h1 font-light uppercase tracking-[0.02em] [font-family:var(--font-deck)] [font-synthesis:none]">
          {title}
        </h3>
      </Reveal>

      <Reveal delay={0.16}>
        <p className="mt-3 max-w-[34ch] text-lead tracking-[-0.01em] text-surface">
          {line}
        </p>
      </Reveal>

      {/*
        A MARK AND A FEW WORDS, NOT A LABELLED BLOCK.

        The facts run as a row of their own on a wide screen and wrap to a
        column on a narrow one — `flex-wrap` rather than a grid, because three
        items of very different lengths in equal columns leaves two of them
        mostly empty.

        The marks are decorative and the words carry the whole meaning: nothing
        here is told apart by which doodle it got, which is the rule every
        other mark on this site follows.

        The ink is the side's own — Charcoal on the cream half, the near-white
        `surface` on the lilac one — so the row inherits whichever way the
        panel has turned instead of stating a colour that only works on one.
      */}
      {/*
        EACH FACT ON ITS OWN PAINT — the treatment the header already gives the
        current nav item, at the client's ask. <PaintStroke> is that component,
        so three chips in a row are plainly painted rather than three identical
        pills.

        `shape="blot"`, NOT THE DEFAULT BRUSH. The brush is drawn for a nav
        underline and comes out lumpy when it is stretched into a chip's
        proportion — the client's word for it was "odd", and they were looking
        at a shape doing a job it was not drawn for. The blot is the same paint
        and the same swell in a shape drawn at this proportion: chopped ends,
        two separately drifting long edges, a fleck off each end. The note in
        PaintStroke.module.css has the arithmetic.

        SOFT LAVENDER ON BOTH SIDES, WHICH IS THE ONLY WAY IT WORKS. The mark
        that used to sit here took the side's own accent — Terracotta on the
        cream half, Lavender on the lilac one — and a stroke cannot do that:
        it is a FIELD now with words on top of it, so it owes the text 4.5:1.
        Charcoal on Soft Lavender is 6.49:1 and clears it; Charcoal on
        Terracotta is about 3.5 and does not. So the stroke is Lavender on both
        halves and the ink is Charcoal on both, which also makes the row read
        as one set rather than as two that happen to line up.

        `pb-1.5` and the `seat` are <NavLabel>'s own numbers: the stroke is
        sized off its parent's box, so the reserve under the word has to be
        told about or the chips come out fatter here than in the bar.
      */}
      <Reveal delay={0.2}>
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
          {facts.map((fact, i) => (
            /*
              `isolate` IS LOAD-BEARING. <PaintStroke> sits at `z-index: -1` so
              the word stays on top of its own paint. A `relative` parent with
              `z-index: auto` does not create a stacking context, so that -1
              escapes the chip and lands behind the nearest ancestor that does
              — which here is the panel, and the panel has a background. The
              strokes were painting behind the cream and the lilac and were
              invisible on both. `isolation: isolate` keeps the -1 inside the
              chip, above its own (transparent) ground and under its text.
              <NavLabel> never needed this because the bar it sits in is
              already a stacking context above its own ground.
            */
            <li
              key={fact}
              /*
                `--swell` AND `--wet` ARE SET HERE, NOT VIA `isCurrent`.
                <PaintStroke> is tuned for a nav item, where the paint is a
                stroke UNDER a word: it rests at `--swell: 0.2` and `isCurrent`
                only takes it to 0.78, which came out as a thin band along the
                bottom of each chip. The reference is the header's Contact
                item, where the paint is a lozenge the word sits inside — so
                the swell is driven to 1. Both are custom properties the
                stroke reads, and they inherit, so setting them on the chip
                reaches it without touching the shared component.
              */
              style={{ "--swell": 1, "--wet": 0.62 } as React.CSSProperties}
              /*
                `py-2.5` RATHER THAN `pb-1.5`, WHICH IS WHAT MAKES IT TALLER.
                The stroke is absolutely positioned to its parent — top at
                -0.12em, bottom at the seat — so its height IS this box's
                height and there is no size to set on the paint itself. Padding
                the chip is the knob, and it pads top and bottom now instead of
                only underneath, so the blob is centred on the word rather than
                hanging off its baseline.
              */
              className="relative isolate inline-block px-2.5 py-2.5"
            >
              {/* No `seat`: that prop exists to lift the stroke off a reserve
                  the bar keeps under its words. Here the blob is meant to
                  cover the chip, so it runs to the bottom of the box. */}
              <PaintStroke paint={chips[i % chips.length]} shape="blot" />
              <span className="relative text-action font-medium uppercase tracking-eyebrow text-text">
                {fact}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.28}>
        <BlobButton href={action.href} tone={action.tone} className="mt-7 min-h-[3.25rem] px-7">
          {action.label}
        </BlobButton>
      </Reveal>
    </div>
  );
}
