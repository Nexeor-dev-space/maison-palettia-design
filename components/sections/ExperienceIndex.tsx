import Image from "next/image";

import { ParallaxPlate } from "@/components/motion/ParallaxPlate";
import { Reveal } from "@/components/motion/Reveal";
import { EXPERIENCE_KIND_LABEL, type CreativeExperience } from "@/lib/experiences";
import { cn } from "@/lib/utils";

/**
 * The activity name.
 *
 * `text-h3` off the scale rather than another hand-cut ramp. The type block in
 * globals.css says the heading steps get adopted "when each section is
 * restructured, not before" — this is that restructuring, and 1.5→1.75rem is
 * exactly the band the site's entry headings already occupy.
 *
 * IT CAME DOWN FROM 3.2rem, AND THAT IS THE POINT OF THE REDESIGN. The old
 * index made the name the largest type in the section, on the argument that
 * entries smaller than their title are a table of contents. That argument was
 * sound while six of the seven entries had no picture on screen — the type was
 * all there was. Now every photographed entry carries its own plate, and the
 * plate is what a visitor reads first. A name set at display scale beside a
 * 400px photograph is two things shouting; set here it is a wall label, and
 * the section becomes a hang rather than a list with pictures attached.
 */
const NAME = "text-h3 font-light uppercase tracking-[-0.015em]";

/**
 * The plate's height above `lg`, where it stands beside the caption rather
 * than under it. Bounded at both ends for the same reason the type scale is:
 * an open `vh` keeps growing, and a laptop and a tall monitor should not get
 * sections of different proportions.
 *
 * Below `lg` the plate takes an aspect ratio instead — a fixed height in a
 * single column letterboxes a wide photograph on a phone.
 */
const PLATE = "aspect-[4/3] xs:aspect-[3/2] lg:aspect-auto lg:h-[clamp(18rem,46vh,30rem)]";

/**
 * Where the caption parks while its plate travels past.
 *
 * 7rem clears the header's resting 4.5rem with enough air that the label never
 * looks tucked under the bar, and still reads as deliberate once the bar
 * settles to 3.75rem. Sticky only above `lg`; see the note on the caption.
 */
const CAPTION_TOP = "lg:sticky lg:top-[7rem] lg:self-start";

/**
 * The index: one row per experience, a wall label beside each.
 *
 * REDESIGNED AFTER GOODMAN GALLERY'S EXHIBITIONS INDEX, and the grammar is
 * theirs: a stack of full-measure rows, each split into a quiet caption on the
 * left and a tall photograph on the right; the caption pinned near the top of
 * the window so it holds while the picture scrolls past it; the picture
 * drifting against the page; type kept small so the photographs carry the
 * section. Their listing runs a 50/50 split at 518px a row with the caption
 * sticking at 80px, and everything here is that proportion adapted to a
 * homepage section rather than a catalogue page.
 *
 * WHAT IT REPLACES, AND WHY THE SWAP IS WORTH IT. The previous index ran seven
 * names down the page against ONE arched window that swapped its photograph as
 * each row came level, driven by an IntersectionObserver over a band across
 * the middle of the viewport plus pointer-preview state. A good idea with
 * three costs:
 *
 *   - It only existed above `lg`. Narrow screens got a different composition
 *     entirely — every row grew its own plate — so the section was two designs
 *     and only one of them was ever art-directed. This one is a single
 *     composition that stacks.
 *   - Six of the seven photographs were never on screen at once, and a visitor
 *     scrolling at speed saw one picture and six names.
 *   - The window fell back to a plain ground for the two activities with no
 *     photograph, which announced the gap in the middle of the section.
 *
 * WHAT IT COSTS. Height: seven rows of photograph are taller than one window.
 * That is the trade the reference makes too, and it buys the thing the old
 * section could not do — every experience shown, not merely named.
 *
 * NO STATE, NO OBSERVER, NO CLIENT BOUNDARY. The whole "which row is active"
 * machinery goes with the shared window that needed it: nothing here depends
 * on scroll position except the parallax, which each plate owns. This is a
 * server component again, and the only JavaScript in the section belongs to
 * the shared motion primitives it composes.
 *
 * STILL NOTHING IN A ROW IS A CONTROL. Goodman's rows are links because every
 * exhibition has a page; there is no page for "Bedazzling" to go to, so seven
 * links would be seven identical destinations and seven redundant tab stops.
 * The section's one link is the call to action beneath it. That was the old
 * component's decision and the reference does not overturn it.
 */
export function ExperienceIndex({ experiences }: { experiences: CreativeExperience[] }) {
  const groups = groupByKind(experiences);

  return (
    <div className="mt-12 md:mt-14 lg:mt-16">
      {groups.map(({ kind, entries }) => (
        <section
          key={kind}
          aria-labelledby={`experience-group-${kind}`}
          className="mt-16 first:mt-0 lg:mt-20"
        >
          {/*
            The band label. It takes the section's own eyebrow treatment
            rather than the reference's 34px caps, and that is a question of
            what it sits under: their group headings ARE the page's headings,
            where this one is subordinate to a 4.4rem statement three inches
            above it. Set any larger it competes with the statement; set in
            the activity names' own size it would be indistinguishable from
            them. The signage register is the third thing the section already
            speaks, and it is the right one for a wall band.
          */}
          <Reveal>
            <h3
              id={`experience-group-${kind}`}
              className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text"
            >
              <span aria-hidden className="h-px w-9 shrink-0 bg-primary md:w-12" />
              {EXPERIENCE_KIND_LABEL[kind]}
            </h3>
          </Reveal>

          <ol className="mt-7 border-b border-text/20 md:mt-8">
            {entries.map(({ experience, folio }) => (
              <Row key={experience.slug} experience={experience} index={folio} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** The order the bands are hung in: walk-in first, then the diary. */
const GROUP_ORDER = ["diy", "scheduled"] as const satisfies readonly CreativeExperience["kind"][];

/**
 * The experiences in bands, and empty bands dropped.
 *
 * GROUPING IS THE REFERENCE'S ACTUAL STRUCTURE — its index is not one list but
 * several, each under its own heading (gallery, museum, off-site, upcoming,
 * past). This data already carries the same axis in `kind`, and splitting on
 * it earns its place twice over: it answers the question a visitor is actually
 * holding — can I walk in, or do I need a date? — and it retires five
 * consecutive rows all labelled "Any time", which is what the flat list had
 * printed down its right-hand column.
 *
 * ORDER WITHIN A BAND IS THE STUDIO'S OWN, untouched: `filter` is stable and
 * lib/experiences.ts is the one place the sequence is decided. Between bands
 * the order is GROUP_ORDER, which today matches the file's own DIY-then-
 * scheduled arrangement exactly, so nothing moves on screen.
 *
 * The folio is counted down the rendered page rather than off the source
 * array, so it always reads 01…07 in the order a visitor meets them. Numbering
 * before the grouping would let the sequence jump the moment the data
 * interleaved the two kinds — a gap nobody could explain from the page.
 */
function groupByKind(experiences: CreativeExperience[]) {
  const bands = GROUP_ORDER.map((kind) => ({
    kind,
    entries: experiences.filter((experience) => experience.kind === kind),
  })).filter((band) => band.entries.length > 0);

  // Each band picks up where the one above it finished. Derived rather than
  // counted with a running variable: reassigning one during render is exactly
  // what the compiler's immutability rule exists to stop, and there is no
  // reason to reach for it when the offset is a sum of what came before.
  return bands.map((band, i) => ({
    kind: band.kind,
    entries: band.entries.map((experience, j) => ({
      experience,
      folio: bands.slice(0, i).reduce((n, previous) => n + previous.entries.length, 0) + j + 1,
    })),
  }));
}

/**
 * One row: a label, and — where there is a photograph — the photograph.
 *
 * THE TWO ROW HEIGHTS ARE THE ANSWER TO THE MISSING PICTURES. Two of these
 * activities have no photograph in the project (see lib/experiences.ts). In a
 * grammar where half of every row is a picture, both obvious readings are
 * wrong: leave the half empty and it is a hole, fill it with a plain panel and
 * it is a hole with a border. So a row with no photograph simply is not a
 * picture row. The caption takes the full measure and the row is as tall as
 * its own type — a short beat between two hangs, which is a rhythm rather than
 * an omission.
 *
 * It also retires a line of copy that should never have been public. The old
 * design had to explain its empty frame, and where the studio had supplied no
 * status it fell back to "Photograph to come" — a note to ourselves, printed
 * on the homepage. With no frame to explain, Mandala painting is simply a name
 * and a folio under its band like everything else, and Glass painting carries
 * the studio's own "Coming soon", which is a fact about the activity rather
 * than an apology for the layout.
 */
function Row({ experience, index }: { experience: CreativeExperience; index: number }) {
  const hasPlate = Boolean(experience.image);

  return (
    <li>
      <article
        className={cn(
          "grid grid-cols-12 items-start gap-x-6 border-t border-text/20 lg:gap-x-12",
          // The rule states where the row begins, so the plate starts clear of
          // it rather than hanging off it.
          "pt-7 md:pt-8",
          hasPlate ? "pb-14 md:pb-16" : "pb-9 md:pb-10",
        )}
      >
        {/*
          The caption.

          STICKY ONLY ABOVE `lg`, which is the old window's constraint
          inverted. A sticky element travels inside its containing block and
          stops when the foot of that block arrives; here the block is the row,
          and above `lg` the row is as tall as the plate beside it, so the
          label holds for most of the picture's pass. Below `lg` the caption
          and the plate are stacked in one column and the caption's grid area
          is exactly its own height — sticky would pin for a distance of zero.
          `self-start` is what stops the area stretching to the row and taking
          the travel away with it.

          AND ONLY ON A ROW THAT HAS A PLATE. A pictureless row is as tall as
          its own type plus its padding, which leaves the label a few dozen
          pixels of travel — not enough to read as pinning, and more than
          enough to read as a label that has slipped out of its row. Sticky
          with almost no travel is worse than no sticky at all.
        */}
        <div className={cn("col-span-12", hasPlate && cn("lg:col-span-5", CAPTION_TOP))}>
          <Reveal>
            <div className="grid grid-cols-8 items-start gap-x-4 sm:gap-x-6">
              <div className="col-span-5">
                {/* Charcoal at full strength — 9.07:1 on Light Sage.

                    An <h4>: the band above it is the <h3>, and the section's
                    statement is the <h2>. The outline reads statement → band →
                    activity, which is the hang as a visitor walks it. */}
                <h4 className={cn(NAME, "text-text")}>{experience.name}</h4>

                {experience.description ? (
                  // 5.38:1. The reference sets this line in its serif; this
                  // palette has two faces and the second is the script, which
                  // appears three times on the homepage and is not about to
                  // appear seven more. Weight and ink carry the register
                  // change instead.
                  <p className="mt-3 max-w-[24rem] text-body leading-[1.75] text-text/80">
                    {experience.description}
                  </p>
                ) : null}
              </div>

              {/*
                The second sub-column, which is the reference's own: where its
                listing sets a city over a run of dates, this sets the folio
                over anything the studio has flagged about the activity.

                THE KIND IS NOT REPEATED HERE. It was, and it meant the words
                "Any time" appeared five times down one column of a section
                that had already said so at the head of the band. The only
                thing left in this slot is `status` — the studio's own flag,
                shown verbatim, and today that is one row carrying "Coming
                soon". A folio on its own is what the rest of them get, which
                is the right amount of furniture for a wall label.

                Ink at 85% measures 6.14:1 on the sage. The old index set these
                at 75% (4.71:1 in sRGB, and nearer the 4.5 bar once Tailwind's
                oklab mix is accounted for); at label size there was nothing to
                be had from the extra fade.
              */}
              <div className="col-span-3 text-label font-medium uppercase tracking-eyebrow text-text/85">
                <p>{String(index).padStart(2, "0")}</p>
                {experience.status ? <p className="mt-2">{experience.status}</p> : null}
              </div>
            </div>
          </Reveal>
        </div>

        {/*
          The plate.

          NO ARCH, AND THAT IS A DECISION ABOUT THE MOTIF RATHER THAN ABOUT
          THIS SECTION. globals.css asks for the entrance arch rarely — "an
          arch in every section stops meaning anything, and stops looking like
          architecture" — and the old design could afford one because it had
          exactly one frame. Seven of them, each crowned with an ellipse, is
          the failure that note warns about. So the plates take the smallest
          radius in the scale, near enough the reference's own 2px to be the
          same gesture, and the arch keeps its meaning where it still crowns
          something: the footer, and the introduction on /about.

          The drift is <ParallaxPlate>, already on the site for the editorial
          spreads — the reference hangs a 575px picture in a 518px frame and
          slides it, which is the same effect by the same means.
        */}
        {experience.image ? (
          <Reveal
            variant="fadeIn"
            className={cn(
              "relative col-span-12 mt-8 overflow-hidden rounded-xs bg-cream",
              "lg:col-span-6 lg:col-start-7 lg:mt-0",
              PLATE,
            )}
          >
            <ParallaxPlate>
              <Image
                src={experience.image.src}
                alt={experience.image.alt}
                fill
                sizes="(min-width: 64rem) 48vw, calc(100vw - 2 * max(0.75rem, 1.3889vw))"
                style={{ objectPosition: experience.image.position ?? "50% 50%" }}
                className="object-cover"
              />
            </ParallaxPlate>
          </Reveal>
        ) : null}
      </article>
    </li>
  );
}
