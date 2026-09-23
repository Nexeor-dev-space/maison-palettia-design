import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { PaintStroke } from "@/components/layout/PaintStroke";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { getCreativeExperiences } from "@/lib/experiences";
import { getUpcomingWorkshops } from "@/lib/workshops";

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
 */
export async function TwoWaysToCreate() {
  const [experiences, sessions] = await Promise.all([
    getCreativeExperiences(),
    getUpcomingWorkshops(3),
  ]);

  const walkIn = experiences.filter((experience) => experience.kind === "diy");
  const scheduled = sessions.filter((session) => session.kind !== "diy");

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

  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <section
      id="two-ways"
      aria-labelledby="two-ways-heading"
      className="relative isolate overflow-hidden"
    >
      <h2 id="two-ways-heading" className="sr-only">
        Walk in, or book a seat
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* The two lines are held to one line each and to about the same
            length, so the two buttons land on the same baseline and the halves
            read as a pair rather than as one longer than the other. */}
        <Road
          index={1}
          ground="cream"
          eyebrow="No booking"
          title="Walk in"
          dot={INK.terracotta}
          plate={walkInPlate}
          line={`${count(walkIn.length, "activity", "activities")}, any time you come in.`}
          /*
            THE DETAIL THAT USED TO BE THREE LABELLED PARAGRAPHS. The old
            version of this section carried BOOKING / MAKE / WHERE as headed
            blocks of running copy, and the client asked for those facts back
            WITHOUT the text — so each is a mark and a few words, and the
            things a reader can already infer ("Not needed. Turn up and
            start.") are gone rather than reworded. Three is the whole list:
            what it costs you to arrive, how much there is, and where.
          */
          facts={["No booking", count(walkIn.length, "activity", "activities"), home]}
          action={{ label: "Find the studio", href: "/locations", tone: "sage" }}
        />

        <Road
          index={2}
          ground="lilac"
          eyebrow="A date and a seat"
          title="Book a seat"
          dot={INK.lavender}
          plate={scheduledPlate}
          line={`${count(scheduled.length, "session", "sessions")}, each on a set date.`}
          /*
            The same three, as this half answers them. The old block listed
            every upcoming date with its price and remaining seats, which is
            the events page's job — here it is only the NEXT one, because the
            question this side answers is "is there one soon?".
          */
          facts={["Booked online", count(scheduled.length, "session", "sessions"), nextDate]}
          action={{ label: "See the dates", href: "/events#scheduled", tone: "cream" }}
        />
      </div>

      {/*
        The one thing belonging to both halves, sitting across the join. On a
        phone the halves stack, so it lands on the horizontal seam instead —
        the same job, the other axis.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden w-[9rem] -translate-x-1/2 -translate-y-1/2 lg:block"
      >
        <DoodleMark name="splash" color={INK.terracotta} delay={300} />
      </span>
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
 * THE PHOTOGRAPH IS A PHOTOGRAPH AGAIN. It was a 240px band across a 660px
 * column, nearly 3:1, which is a banner — you read it as decoration above the
 * content rather than as a picture of the thing. At 4:3 it is the first thing
 * in the half and it carries its own weight, and it can, because there is now
 * room for it.
 *
 * ==========================================================================
 * INK, AND WHY THE TWO HALVES DIFFER
 * ==========================================================================
 *
 * Deep Lilac is the hardest ground in this palette: the near-white it carries
 * reads 4.67:1 at full strength and 3.61:1 at 80%, under the 4.5:1 body copy
 * owes. So the lilac half softens nothing — its line is full-strength
 * `text-surface`. The same 80% as charcoal on White Rock is 5.5:1, so the pale
 * half can afford `text-text/80` and takes it, because there the line is
 * genuinely secondary to the name above it.
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
  ground: "cream" | "lilac";
  eyebrow: string;
  title: string;
  dot: string;
  plate?: { src: string; alt: string; position?: string };
  line: string;
  facts: readonly string[];
  action: { label: string; href: string; tone: "sage" | "cream" };
}) {
  const pale = ground === "cream";

  return (
    <div
      className={
        pale
          ? "relative bg-cream px-gutter py-[4rem] text-text md:py-[5rem] lg:py-[6rem] lg:pl-[10%] lg:pr-[8%]"
          : "relative bg-primary px-gutter py-[4rem] text-surface md:py-[5rem] lg:py-[6rem] lg:pl-[8%] lg:pr-[10%]"
      }
    >
      <Reveal variant="imageReveal">
        <span className="plate relative block aspect-[4/3] w-full overflow-clip rounded-[1.5rem]">
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
        <p className="mt-9 flex items-center gap-3 text-label font-bold uppercase tracking-eyebrow">
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
        <h3 className="mt-4 text-h1 font-light uppercase tracking-[0.02em] [font-family:var(--font-deck)] [font-synthesis:none]">
          {title}
        </h3>
      </Reveal>

      <Reveal delay={0.16}>
        <p
          className={`mt-4 max-w-[34ch] text-lead font-light leading-[1.5] tracking-[-0.01em] ${
            pale ? "text-text/80" : "text-surface"
          }`}
        >
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
        EACH FACT ON ITS OWN BRUSHSTROKE — the treatment the header already
        gives the current nav item, at the client's ask. <PaintStroke> is that
        component: one wobble along the top, a different one along the bottom
        and two ends that do not match, so three chips in a row are plainly
        painted rather than three identical pills.

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
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
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
              <PaintStroke paint={CHIP_PAINTS[i % CHIP_PAINTS.length]} />
              <span className="relative text-action font-semibold uppercase tracking-eyebrow text-text">
                {fact}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.28}>
        <BlobButton href={action.href} tone={action.tone} className="mt-9 min-h-[3.25rem] px-7">
          {action.label}
        </BlobButton>
      </Reveal>
    </div>
  );
}
