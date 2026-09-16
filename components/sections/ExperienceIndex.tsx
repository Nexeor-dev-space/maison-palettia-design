import Image from "next/image";
import Link from "next/link";

import { ParallaxPlate } from "@/components/motion/ParallaxPlate";
import { Reveal } from "@/components/motion/Reveal";
import { EXPERIENCE_KIND_LABEL, type CreativeExperience } from "@/lib/experiences";
import { cn } from "@/lib/utils";

/**
 * The activity name.
 *
 * `text-h2` off the scale — clamp(1.75rem, …, 2.25rem), so 28px on a phone and
 * 36px at 1440. It came DOWN to `text-h3` in the last pass, on the argument
 * that a name set at display scale beside a 400px photograph is two things
 * shouting; it goes back up one step now because the photograph is no longer
 * 414px but 518px, and the text block no longer sits beside the whole of it.
 * It is a compact stack at the TOP of an otherwise empty 694px half, and at
 * 28px it read as a caption that had come adrift rather than as the thing the
 * half is about. 36px against the section's own 70px statement keeps the
 * outline unambiguous, and everything else in the block — the folio at 11px,
 * the line at 17px, the affordance at 12px — is small enough that the name is
 * plainly the largest thing in it without being the largest thing on screen.
 */
const NAME = "text-h2 font-light uppercase tracking-[-0.02em]";

/**
 * The plate, and the whole point of this revision: the client asked for a
 * bigger picture and the reference is where the number comes from.
 *
 * `lg:aspect-[694/518]` IS THE REFERENCE, WRITTEN OUT. Goodman Gallery's
 * exhibitions index runs 1400px rows split into two 694px halves with a 12px
 * gap, the right half a single 518px-tall photograph. A 12-column grid on this
 * site's 1400px measure with `gap-x-3` gives columns of 105.67px, so six of
 * them plus five gaps is 694px exactly — and 694/518 held as an aspect ratio
 * reproduces their frame at 1440 and then keeps the proportion on every wider
 * display instead of pinning a pixel height that only one screen ever sees.
 * Measured at 1440x900 it renders 694x518; it replaces a frame that measured
 * 676x414, so the picture is 25% taller and 28% larger in area.
 *
 * `w-full` IS LOAD-BEARING AND WAS NOT OBVIOUS. A grid item that carries an
 * aspect ratio and an `auto` inline size is not stretched to its track — it
 * resolves its width FROM its height through the ratio. Left off, the two
 * ceilings and the floor below stopped being height constraints and became
 * width ones: at 1023 the plate measured 864px across a 995px measure, 130px
 * short of the column it was supposed to fill, and at 1024 it measured 557px
 * across a 492px half — wider than its own column, bleeding into the gap. With
 * an explicit `w-full` the width is definite, the track decides it, and
 * `min-h`/`max-h` do only what they are there to do.
 *
 * THE CEILINGS ARE NOT DECORATION. The container has no max-width — see
 * <Container> — so the measure keeps growing, and an unbounded ratio would hand
 * a 1920 display a 694px-tall photograph and a run of five of them taller than
 * four windows. `lg:max-h-[40rem]` stops it at 640px; below `lg` the plate
 * takes the full measure on its own line and `max-h-[36rem]` does the same job
 * where a 1023px-wide 3:2 frame would otherwise be 664px tall.
 *
 * BELOW `lg` THE RATIO CHANGES RATHER THAN THE HEIGHT. A stacked plate is
 * 366px wide on a 390px phone, and the old 4/3 made that 275px — the smallest
 * picture on the page. Square takes it to 366px, a third taller, without
 * turning a set of photographs composed and crop-positioned as landscapes into
 * portraits that cut through their own subject. Rejected: 4/5, which is a
 * genuinely large phone plate and re-crops every frame in lib/experiences.ts.
 *
 * `lg:min-h-[26rem]` IS THE ONE PLACE THE RATIO IS ALLOWED TO GIVE, and it
 * exists because "bigger" has to mean bigger at every width and not only at
 * 1440. The plate this replaces was `clamp(18rem, 46vh, 30rem)` — height off
 * the window, not off the measure — which topped out at 414px on a 900px-tall
 * one. A ratio taken off the half instead crosses that line at about 1153px of
 * viewport: at 1024 the half is only 492px, so 694/518 would give 367px and the
 * picture would have SHRUNK for anyone on a 1024-to-1150 display. 416px is the
 * floor that keeps it just clear of the old ceiling; above 1153 the ratio is
 * taller than the floor and takes over on its own, and the frame is the
 * reference's again by 1440.
 */
const PLATE =
  "w-full aspect-square max-h-[36rem] sm:aspect-[3/2] " +
  "lg:aspect-[694/518] lg:min-h-[26rem] lg:max-h-[40rem]";

/**
 * The two halves, spelled out in full because Tailwind v4 scans source
 * literally and a class assembled from fragments is never emitted.
 *
 * Both parts of a row are placed into `lg:row-start-1`, which is what lets the
 * text sit at the top of its half while the plate sets the row's height. With
 * `items-start` on the grid the text block is exactly as tall as its own type
 * and the rest of its half is empty — that emptiness is the composition, not a
 * gap waiting to be filled.
 */
const HALF_LEFT = "lg:col-span-6 lg:col-start-1 lg:row-start-1";
const HALF_RIGHT = "lg:col-span-6 lg:col-start-7 lg:row-start-1";

/**
 * The index: one large row per experience, photographs alternating sides.
 *
 * WHAT THE CLIENT ASKED FOR, AND WHERE EACH PIECE OF IT LANDED. Three things,
 * against Goodman Gallery's Exhibitions and Fairs listing:
 *
 *   - "Remove the divider lines." Gone. Every row carried `border-t
 *     border-text/20` and the list closed on a `border-b`; the reference has
 *     no rule anywhere in its listing and neither does this now. What separated
 *     rows was a hairline plus 96px of padding, and what separates them now is
 *     48px of air and the alternation below — space doing the work a rule was
 *     doing badly.
 *   - "Remove the background colour." The section took `bg-sage`, full-strength
 *     Light Sage, and now takes the page ground. See <CreativeExperiences> for
 *     what that changed about the ink.
 *   - "Increase the image size." 676x414 to 694x518 at 1440, 366x275 to 366x366
 *     at 390. See PLATE.
 *
 * THE PHOTOGRAPHS ALTERNATE SIDES, which the reference does not do — it hangs
 * every picture on the right. Five identical right-hand plates down a section
 * with no rules and no ground is a column of photographs with captions rather
 * than a run of rows, and the alternation is what makes the eye cross the page
 * instead of falling straight down one edge. It is bought with grid placement
 * only: the DOM is text-then-plate in every row without exception, so the
 * reading order, the tab order and the phone's stack are identical whichever
 * way a row is flipped. Parity runs off the folio rather than the position
 * within a band, so the zig-zag never resets and never puts two plates on the
 * same side in succession.
 *
 * ROWS ARE 48px APART AT `lg`, NOT THE REFERENCE'S 20px. That 20px is safe
 * for them because their text block is always in the left half, so nothing ever
 * sits directly beneath a photograph. Alternating puts one row's text block
 * 48px under the previous row's plate, and at 20px the name read as a caption
 * for the picture above it. 48px is the smallest gap tested where the folio
 * and the name plainly start something new; it is still half the 96px the
 * ruled version needed.
 *
 * NO STATE, NO OBSERVER, NO CLIENT BOUNDARY. A server component; every
 * animation belongs to the shared motion primitives it composes.
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

            The short rule beside it is the label's own mark, the same one the
            section's eyebrow and <SectionHead> carry — not a divider between
            items, which is what the client asked to see the back of.
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

          {/* No `border-b`, and no rule between items. */}
          <ol className="mt-8 md:mt-10">
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
 * interleaved the two kinds — a gap nobody could explain from the page. It is
 * also what the alternation is keyed to, so it has to be continuous across the
 * bands or the zig-zag would break at every band head.
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
 * One row: a compact label at the top of one half, a very large photograph in
 * the other.
 *
 * THE ROW IS A LINK NOW, AND THE OLD COMMENT SAYING IT COULD NOT BE IS STALE.
 * It read "there is no page for 'Bedazzling' to go to, so seven links would be
 * seven identical destinations" — true when it was written, and not true since
 * lib/eventDetail.ts joined the activity list to the schedule. `getEventSlugs`
 * now returns every experience slug alongside the two workshops and
 * `/events/[slug]` prerenders all of them, so each of these seven rows has a
 * page of its own carrying that activity's name, line and photograph. Nothing
 * is invented to make the link work; the destination already existed and this
 * section was the last surface still refusing to point at it.
 *
 * EXACTLY ONE ANCHOR PER ROW. The name carries it and stretches over the whole
 * row with `after:absolute after:inset-0`, which is this codebase's own idiom
 * (see <EventIndexEntry>, <EventCard>, <SessionShowcase>). "View activity"
 * beside it is `aria-hidden` and is a span, not a second anchor: it is an
 * affordance telling a sighted visitor the row is clickable, and a screen
 * reader that announced it would hear the same destination twice.
 *
 * THE STACKING TRAP, AND WHY `isolate` AND `-z-10` ARE LOAD-BEARING. The plate
 * has to be `relative` because <ParallaxPlate> hangs an `absolute inset-0`
 * frame inside it. It is also the LATER of the two positioned siblings — the
 * DOM is text-then-plate in every row, deliberately — so with both at `z-auto`
 * the plate paints above the stretched link's overlay and swallows every click
 * on the photograph. Lifting the text block with `relative z-10` is the
 * obvious fix and the wrong one: `relative` on the text block makes IT the
 * containing block for `after:inset-0`, and the overlay shrinks from the row
 * to the label. So the plate is pushed under instead. That needs a stacking
 * context on the row to push it under INTO, and `isolate` is what guarantees
 * one: Framer's `fadeUp` leaves `transform: none` and `opacity: 1` at rest, so
 * the context a transform would have created disappears the moment the
 * animation lands — and a `-z-10` plate resolving against <main> instead would
 * paint behind main's own `bg-surface` and vanish.
 *
 * THE TWO ROW SHAPES ARE THE ANSWER TO THE MISSING PICTURES. Two of these
 * activities have no photograph in the project (see lib/experiences.ts). In a
 * grammar where half of every row is a picture, both obvious readings are
 * wrong: leave the half empty and it is a hole, fill it with a plain panel and
 * it is a hole with a border. So a row with no photograph simply is not a
 * picture row — the label takes the full measure and the row is as tall as its
 * own type, a short beat between two hangs. That reading is stronger without
 * the rules than it was with them: a ruled short row looked like a row that
 * had lost its picture, where an unruled one is just a change of pace.
 */
function Row({ experience, index }: { experience: CreativeExperience; index: number }) {
  const plate = experience.image;
  // Odd folios hang their picture on the right, even on the left. Keyed to the
  // folio, which is continuous across the bands — see groupByKind.
  const flip = index % 2 === 0;

  return (
    <li className="mt-14 first:mt-0 lg:mt-12">
      <Reveal
        as="article"
        className="group relative isolate grid grid-cols-12 items-start gap-x-3 gap-y-7 lg:gap-y-0"
      >
        {/*
          The label. Always first in the DOM, whichever half it takes.

          It is a single stack rather than the reference's two 337px columns:
          theirs splits name/subtitle from place/dates and we have no place and
          no dates, so the second column would hold a folio and — on one row in
          seven — a status. A column that is empty six times out of seven is
          not a column.
        */}
        <div className={cn("col-span-12", plate && (flip ? HALF_RIGHT : HALF_LEFT))}>
          <p className="flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-text/85">
            <span className="tabular-nums">{String(index).padStart(2, "0")}</span>
            {experience.status ? (
              <>
                <span aria-hidden className="h-px w-5 shrink-0 bg-primary" />
                {/* The studio's own flag, shown verbatim — today one row
                    carrying "Coming soon". */}
                <span>{experience.status}</span>
              </>
            ) : null}
          </p>

          {/* An <h4>: the band above it is the <h3>, and the section's
              statement is the <h2>. The outline reads statement → band →
              activity, which is the hang as a visitor walks it. */}
          <h4 className={cn(NAME, "mt-4 text-text")}>
            <Link
              href={`/events/${experience.slug}`}
              className="transition-colors duration-300 ease-soft after:absolute after:inset-0 after:content-[''] hover:text-primary"
            >
              {experience.name}
            </Link>
          </h4>

          {experience.description ? (
            // The reference sets this line in its serif; this palette has two
            // faces and the second is the script, which appears three times on
            // the homepage and is not about to appear seven more. Weight and
            // ink carry the register change instead. /80 sits well above the
            // /70 floor this ground allows.
            <p className="mt-4 max-w-[26rem] text-body leading-[1.75] text-text/80">
              {experience.description}
            </p>
          ) : null}

          {/*
            An affordance, not a link — the name above already covers the whole
            row. Same rule and same treatment as <EventIndexEntry>.

            Deep Lilac on the page ground measures 4.90:1; on the Light Sage
            this section used to carry it was 3.83 and depended on being a
            graphical mark rather than copy. Losing the ground colour is what
            makes it safe as 12px text.
          */}
          <span
            aria-hidden
            className="mt-7 flex w-fit items-center gap-3 text-action font-semibold uppercase tracking-eyebrow text-primary"
          >
            <span className="border-b border-primary/40 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-primary">
              View activity
            </span>
            <span className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
              &#8594;
            </span>
          </span>
        </div>

        {/*
          The plate. Always second in the DOM; `HALF_LEFT` is what flips it.

          NO ARCH, AND THAT IS A DECISION ABOUT THE MOTIF RATHER THAN ABOUT
          THIS SECTION. globals.css asks for the entrance arch rarely — "an
          arch in every section stops meaning anything, and stops looking like
          architecture". Five of them, each crowned with an ellipse, is the
          failure that note warns about. So the plates take the smallest radius
          in the scale, near enough the reference's own 2px to be the same
          gesture, and the arch keeps its meaning where it still crowns
          something: the footer, and the introduction on /about.

          The drift is <ParallaxPlate>, already on the site for the editorial
          spreads — the reference hangs a 575px picture in a 518px frame and
          slides it, which is the same effect by the same means. No <Reveal> of
          its own any more: the row is the reveal now, so the label and its
          picture arrive as one thing rather than as two.
        */}
        {plate ? (
          <div
            className={cn(
              "relative -z-10 col-span-12 overflow-hidden rounded-xs bg-cream",
              flip ? HALF_LEFT : HALF_RIGHT,
              PLATE,
            )}
          >
            <ParallaxPlate>
              <Image
                src={plate.src}
                alt={plate.alt}
                fill
                sizes="(min-width: 64rem) 48vw, calc(100vw - 2 * max(0.75rem, 1.3889vw))"
                style={{ objectPosition: plate.position ?? "50% 50%" }}
                className="object-cover"
              />
            </ParallaxPlate>
          </div>
        ) : null}
      </Reveal>
    </li>
  );
}
