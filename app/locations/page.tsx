import { BlobButton } from "@/components/ui/BlobButton";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { LocationMap, PartnerPlate } from "@/components/sections/LocationMap";
import { Container } from "@/components/ui/Container";
import { INK } from "@/components/sections/hero/composition";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { COLLABORATIONS, EXPERIENCE_STATEMENT, OUR_APPROACH, PAST_DESTINATIONS } from "@/lib/brand";
import { getMallPartners } from "@/lib/partners";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Locations",
  description:
    "Where to find Maison Palettia now, and the UAE destinations where the Maison has delivered creative workshops and activations.",
  path: "/locations",
});

/**
 * /locations — where to find the Maison, and where it has been.
 *
 * THE BRIEF ASKED FOR THIS PAGE, AND THE DATA DECIDES ITS SHAPE. The Maison
 * has no studio door; it sets up inside malls. So "where" has two honest
 * answers, and they must never be confused:
 *
 *   Now ........ the confirmed partnerships in lib/partners.ts — one today,
 *                Times Square Center — shown with the project's existing map.
 *   Before ..... the ten destinations the deck says the studio has delivered
 *                workshops and activations at over the past year (p.12).
 *
 * The second list is labelled as past every time it appears and never links
 * to a map, so nobody sets off for Yas Mall expecting a table to be there.
 *
 * NO COORDINATES, NO ADDRESSES, NO EMIRATES. The project holds none, and two
 * of the ten (Wasl, Ithra) are organisations rather than single addresses.
 * The map is the existing keyless embed built from the partner record.
 *
 * The close is for partners — malls and F&B outlets — because this is where a
 * destination deciding whether to host the Maison will read.
 */
export default async function LocationsPage() {
  const partners = await getMallPartners();

  return (
    <>
      {/* ---- now ---- */}
      {/*
        `overflow-clip` because the destination plate hangs a cut-out off its
        bottom-right corner, and in this layout that corner IS the page's
        right edge — the mark ran 27px past it and gave the document 7px of
        horizontal scroll. Every other page that renders <PartnerPlate> was
        already clipping at the section, which is why this only showed here.

        Clip, not hidden: `hidden` would make this a scroll container and
        break the `view()` timelines the marks inside it draw off.
      */}
      {/*
        WHITE ROCK, AT THE CLIENT'S ASK. This was `surface` — a pale
        sage-white — which made the page open on very nearly the same colour
        as the Light Sage section under it, and put a White Rock plate on a
        ground it was a shade away from. The two have swapped: the section is
        the cream and the plate is the sage, so the card is plainly an object
        laid on the paper rather than a lighter patch of it.
      */}
      <section aria-labelledby="locations-title" className="overflow-clip bg-cream">
        <Container className="py-[3.5rem] md:py-[4.5rem] lg:py-[5.5rem]">
          {/*
            ==============================================================
            TWO COLUMNS THAT EACH SAY ONE THING — at the client's ask
            ==============================================================

            It was two rows. The top row put the heading on the left and the
            statement on the right, and the map ran the full measure beneath
            them. Two problems with that, and the client named the second:

            THE STATEMENT WAS NOT WITH ITS HEADING. "Where to find us." asks
            a question and the paragraph answers it — the Maison has no
            studio door, it sets up inside malls — but the two sat in
            different columns separated by the width of the page, so the
            answer read as an unrelated aside rather than as the second half
            of the sentence. It sits under the heading now, which is simply
            where an answer goes.

            AND THE PAGE OPENED ON AN EMPTY BAND. With the statement pulled
            out of the right column, that half of the first screen held
            nothing at all, and the one object the page is actually for was
            below it. The map moves up into that space, so a visitor who
            never scrolls still gets the address.

            The columns are 5 and 6 of 12 with a gap between, rather than 6
            and 6: the heading is set in the script at display size and its
            two lines want a measure that does not force a third.
          */}
          <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
            <div className="relative col-span-12 lg:col-span-5">
              <Reveal>
                <Eyebrow>Locations</Eyebrow>
              </Reveal>
              <DisplayHeading
                as="h1"
                id="locations-title"
                className="mt-7 md:mt-9"
                lines={["Where to", "find us."]}
              />
              <Reveal delay={0.15}>
                <p className="mt-6 max-w-[30rem] text-lead leading-[1.7] text-text/85 md:mt-8">
                  Maison Palettia brings creative experiences into the places people already gather
                  — set up inside a mall rather than behind a studio door.
                </p>
              </Reveal>

              {/*
                ==========================================================
                THE DESTINATION, UNDER THE STATEMENT THAT DESCRIBES IT
                ==========================================================

                <LocationMap> draws this plate as its own caption and it sat
                under the map, in the right-hand column. The client has asked
                for it here, and it is the better reading: the statement says
                the Maison sets up inside a mall rather than behind a studio
                door, and the plate names the mall. An answer belongs under
                its own sentence, not across a gutter and below a map.

                The map turns its caption off rather than this drawing a
                second one — same component, one definition. See
                <PartnerPlate>.

                A PLATE PER PARTNER, not `partners[0]`. There is one today and
                the map already handles a second by splitting into two
                columns; the column would otherwise name the first and leave
                the rest to the map alone.
              */}
              <Reveal delay={0.22}>
                <div className="mt-10 flex flex-col gap-4 md:mt-12">
                  {partners.map((partner) => (
                    <PartnerPlate key={partner.slug} partner={partner} tone="sage" />
                  ))}
                </div>
              </Reveal>

            </div>

            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              {partners.length > 0 ? (
                <>
                  <Reveal>
                    <h2 className="mb-6 text-label font-semibold uppercase tracking-eyebrow text-text">
                      Find us now
                    </h2>
                  </Reveal>
                  {/*
                    THE SHAPE IS SET HERE BECAUSE THE WIDTH IS SET HERE. In
                    half the measure the component's own `lg:aspect-[2/1]`
                    is a letterbox under 300px tall, which is not a map you
                    can find a turning on. See the `aspect` prop.
                  */}
                  <LocationMap
                    partners={partners}
                    caption={false}
                    aspect="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/3]"
                  />

                  {/*
                    ======================================================
                    THE CUT-OUTS FOLLOWED THE AIR ACROSS THE ROW
                    ======================================================

                    They were a band at the foot of the LEFT column, placed
                    there when the heading and its statement left 500px of it
                    empty against an 850px map. The plate has come down into
                    that column, so the left is now the taller of the two and
                    the band was measured straight across the card — over the
                    destination's own name.

                    What is short now is this column: the map stops about
                    150px above the row's foot. So the marks move here, and
                    there are two rather than three, at the size 150px of
                    band can hold.

                    MEASURED, AS EVERY MARK ON THIS SITE IS — and re-measured
                    when the ground changed. Against White Rock the two that
                    carry are the same two: Deep Lilac at 3.94:1 and Warm
                    Terracotta at 2.45:1, both a little softer than they were
                    on the old pale sage-white (4.67 and 2.88) and both still
                    plainly shapes. Soft Lavender is 1.44 here and Light Sage
                    1.23 — the plate beside them is the sage now, and a mark
                    in it would read as a smudge of the card rather than as a
                    cut-out.

                    Decorative and `aria-hidden`, `lg:` only: below that the
                    columns stack and there is no band for them to sit in.
                  */}
                  <span
                    aria-hidden
                    className="pointer-events-none relative mt-8 hidden h-[7rem] select-none lg:block"
                  >
                    <span className="absolute bottom-0 left-[4%] block w-[7rem] rotate-[-9deg]">
                      <DoodleMark name="coral" color={INK.lilac} treatment="draw" delay={260} />
                    </span>
                    <span className="absolute bottom-[10%] left-[26%] block w-[4.25rem] rotate-[16deg]">
                      <DoodleMark name="starburst" color={INK.terracotta} treatment="draw" delay={420} />
                    </span>
                  </span>
                </>
              ) : (
                <Reveal className="border-t border-line pt-10 lg:mt-12">
                  <p className="max-w-[30rem] text-[1.5rem] font-light leading-[1.25]">
                    The next destination is being confirmed.
                  </p>
                </Reveal>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ---- before ---- */}
      <section aria-labelledby="past-heading" className="bg-sage py-[5rem] md:py-section lg:py-section-lg">
        <Container>
          <div className="grid grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
            <div className="col-span-12 lg:col-span-5">
              <Reveal>
                <Eyebrow>Our experience</Eyebrow>
              </Reveal>
              <DisplayHeading
                id="past-heading"
                size="compact"
                className="mt-8 md:mt-10"
                lines={["Where we’ve", "created."]}
              />
              <Reveal delay={0.15}>
                <p className="mt-7 max-w-[30rem] text-body leading-[1.85] text-text">
                  {EXPERIENCE_STATEMENT}
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <h3 className="mt-10 text-label font-semibold uppercase tracking-eyebrow text-text">
                  Our approach
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {OUR_APPROACH.map((line) => (
                    <li key={line} className="flex gap-3 text-body leading-[1.7] text-text">
                      <span aria-hidden className="mt-[0.75em] h-px w-3 shrink-0 bg-text/60" />
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              <Reveal>
                <h3 className="text-label font-semibold uppercase tracking-eyebrow text-text">
                  Past destinations
                </h3>
              </Reveal>
              <ol className="mt-5 border-t border-text/25">
                {PAST_DESTINATIONS.map((name, i) => (
                  <li key={name} className="border-b border-text/25">
                    <Reveal delay={i * 0.03}>
                      <p className="grid grid-cols-[2.75rem_1fr] items-baseline py-3.5 md:py-4">
                        <span
                          aria-hidden
                          className="text-label font-semibold tabular-nums tracking-eyebrow text-text"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[1.3rem] font-light leading-tight tracking-[-0.01em] text-text md:text-[1.55rem]">
                          {name}
                        </span>
                      </p>
                    </Reveal>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-fine text-text">And more.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ---- for destinations ------------------------------------------
          The partner movement, then the door. See the notes above each. */}
      <HostMovement />
      <PartnerClose />
    </>
  );
}

/**
 * ==========================================================================
 * THE PARTNER MOVEMENT — WHERE THE COLLABORATION CONTENT LIVES NOW
 * ==========================================================================
 *
 * WHAT ARRIVED HERE, AND WHY HERE. The homepage carried the whole
 * collaborative approach: the deck's three partnership models, the approach
 * beneath them and a bordered button. The client asked for the homepage to
 * stay on the Maison's own creative experiences and for this content to move
 * to the page it actually belongs on.
 *
 * That page is this one, and it already said so before any of this moved:
 * the note at the top of the file records that the close is "for partners —
 * malls and F&B outlets — because this is where a destination deciding
 * whether to host the Maison will read". The two sections above are the
 * argument a venue needs — where the Maison is now, and the ten destinations
 * it has delivered at over the past year — so the models belong at the end of
 * that argument rather than at a new address with nothing leading to it.
 *
 * The homepage USED to keep a one-statement teaser pointing here; it has been
 * taken off at the client's ask, so this section is now the only place the
 * partnership models are shown. Nothing else changed — the models were always
 * hosted here, and the teaser was only an inbound link.
 *
 * ==========================================================================
 * WHAT IT REPLACES
 * ==========================================================================
 *
 * A two-column close: a compact heading on the left, the three models as
 * plain ruled rows on the right with their descriptions at 13px, and a "Talk
 * to us" button. The client's read of the homepage version was that it felt
 * corporate and generic beside the rest of the site, and this was the same
 * layout with less room.
 *
 * It is now three movements:
 *
 *   The invitation .. a statement across the measure with the marks on it,
 *                     rather than a heading in a column. It is the first
 *                     thing a partner meets here, so it is the one place on
 *                     this page that gets display scale.
 *   The chapters .... the three models as numbered chapters, alternating
 *                     which side the folio sits on and stepping their measure,
 *                     so three items read as a sequence rather than a table.
 *   The invitation
 *   to write ........ one door, set as a sentence rather than as a button in
 *                     a box.
 *
 * NOTHING IS INVENTED. The three models and their descriptions are
 * `COLLABORATIONS` verbatim (deck p.10). No partner is named, no logo is
 * shown, no number, rate, result or case study appears — the deck names none
 * for these programmes, and a partnership page is exactly where inventing one
 * would do the most damage.
 *
 * THE ENQUIRY STILL GOES TO /contact. The private-events form offers "Mall &
 * community activations" as an event type, but it also asks for a guest count
 * and a preferred date, which are the wrong questions to put to a mall's
 * marketing team. /contact is the honest door and it is the one this page
 * already used.
 *
 * INK. The section ground is White Rock, where only Charcoal (9.36:1) and
 * Deep Lilac (3.95:1) can carry anything that is read — Warm Terracotta is
 * 2.44:1 and Soft Lavender 1.44:1 — so everything set directly on the paper
 * is Charcoal. The cards are their own grounds and carry their own ink; the
 * figures are on CARD_STOCK.
 */

/*
  ==========================================================================
  THE THREE CARDS ARE THREE DIFFERENT PAPERS — at the client's ask
  ==========================================================================

  They were three identical near-white plates with one mark each, which is
  the arrangement a pricing table uses. The client asked for different
  colours per card, more of the brand's cut-outs, and the cards set down out
  of line the way <Apart> sets its four on /about.

  THE GROUNDS ARE THE BRAND SHEET'S OWN, and so is the idea: that sheet is
  blocks of colour with cut-outs laid over and inside them, never a shape
  floating on white. Deep Lilac, Light Sage, Soft Lavender — the three
  grounds the palette offers that are not the paper this section is already
  printed on.

  DEEP LILAC LEADS RATHER THAN CLOSES, and that is a placement decision
  rather than a preference. The section now ends on a Deep Lilac band (see
  <PartnerClose>), so a Deep Lilac card in the third slot would put the same
  colour twice within one screen and the close would stop reading as a
  change. First slot, farthest from the band, and the row runs lilac → sage
  → lavender, which arrives at the close through its own lighter relative.

  EVERY INK HERE IS MEASURED, and one of them is the reason this list is not
  simply `text-text/80` three times:

      ground            ink            ratio
      Deep Lilac        surface        4.67   <- only at FULL strength
      Deep Lilac        surface/90     4.11   fails
      Light Sage        charcoal/85    6.14
      Soft Lavender     charcoal/85    4.73
      Soft Lavender     charcoal/80    4.27   fails

  So the body ink is /85 on the two light grounds rather than the /80 used
  everywhere else on this site, and the lilac card's body takes no alpha at
  all. Soft Lavender is the ground that sets both figures.

  THE MARK COLOURS ARE MEASURED THE SAME WAY, because a cut-out that cannot
  be seen is not decoration, it is a bug nobody files. On Deep Lilac only
  White Rock (3.95), Light Sage (3.83) and Soft Lavender (2.74) show; on
  Light Sage, Deep Lilac (3.83) and Warm Terracotta (2.36); on Soft
  Lavender, Deep Lilac (2.74) and Charcoal (6.49). Warm Terracotta on Soft
  Lavender is 1.69 and is the one pairing on this row that would vanish.

  LIGHT SAGE AGAINST WHITE ROCK IS 1.03:1 AND IS STILL A DIFFERENT PAPER.
  Luminance contrast is blind to hue and these two differ almost entirely in
  hue — the same trap that produced a wrong answer earlier in this project.
  The card's edge is carried by `plate`'s hairline and veil, which is the
  case that utility exists for.
*/
/*
  Light Sage as a literal, because INK is not the place for it. That palette
  is documented as "the deck's shapes on the six approved colours, FOR A LIGHT
  SAGE GROUND" — sage is absent from it precisely because everything it colours
  is standing on sage. Here it is a mark on a Deep Lilac card, which is the
  brand sheet's own pairing (its Deep Lilac block carries a Light Sage shape),
  and it measures 3.83:1 on that ground.
*/
const SAGE = "#D1E7BE";

const CARD_STOCK: readonly {
  /** The card's own paper. */
  ground: string;
  /** Heading ink, body ink and folio, measured against that paper. */
  heading: string;
  body: string;
  folio: string;
  /** The mark in the card's head, and the one that breaks its edge. */
  head: { name: DoodleName; color: string };
  edge: { name: DoodleName; color: string; place: string; size: string };
  /**
   * How the card is set down — see the row below. Both are `lg:` only: a
   * phone stacks these, and a stack of tilted, offset cards is a mess rather
   * than a composition.
   */
  tilt: string;
  lift: string;
}[] = [
  {
    ground: "bg-primary",
    heading: "text-surface",
    body: "text-surface",
    folio: "text-sage/50",
    head: { name: "bow", color: INK.whiteRock },
    edge: { name: "splash", color: SAGE, place: "-bottom-6 -left-5", size: "w-[4.5rem]" },
    tilt: "lg:rotate-[-1.4deg]",
    lift: "",
  },
  {
    ground: "bg-sage",
    heading: "text-text",
    body: "text-text/85",
    folio: "text-primary/35",
    head: { name: "splash", color: INK.lilac },
    edge: { name: "starburst", color: INK.terracotta, place: "-bottom-7 right-10", size: "w-[4rem]" },
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

/*
  The shapes on the section's own paper, behind everything.

  White Rock is a warm near-neutral and only three of the palette have a step
  against it — Deep Lilac 3.95, Warm Terracotta 2.44, Charcoal 9.36. Light
  Sage is 1.03 and Soft Lavender 1.44, so at the opacities a ground can
  afford they would be invisible. Those two are on the cards instead, where
  they are the paper rather than a mark on it.

  AND OF THE THREE THAT DO SHOW, CHARCOAL IS STILL WRONG HERE — see the note
  on the zigzag. Contrast says it works; what it actually looks like at a
  ground's opacity is grey, and grey on warm paper is dirt.

  Four is the ceiling <SectionShapes> sets, and they sit in the band the
  heading leaves open and low under the row, never behind a card's text.
*/
const HOST_SHAPES: readonly ShapePlan[] = [
  {
    name: "coral",
    color: INK.lilac,
    width: "11%",
    right: "4%",
    top: "4%",
    rotate: -12,
    drift: 22,
    opacity: 0.18,
    float: 13,
    desktopOnly: true,
  },
  {
    name: "starburst",
    color: INK.terracotta,
    width: "7%",
    left: "46%",
    top: "2%",
    rotate: 14,
    drift: -18,
    opacity: 0.16,
    float: 15,
    floatDelay: 1.2,
    desktopOnly: true,
  },
  {
    /*
      TERRACOTTA, NOT CHARCOAL. This was Charcoal Slate at 0.12 and it was
      wrong in the way this project has already written down once: a charcoal
      cut-out held at a ground's opacity is not a quiet mark, it is a grey
      one, and on warm White Rock paper it read as a smudge on the page
      rather than as paint. Warm Terracotta at 0.16 composites to a soft
      peach — the same weight, and still a colour.
    */
    name: "zigzag",
    color: INK.terracotta,
    width: "5%",
    left: "3%",
    bottom: "8%",
    rotate: -8,
    drift: 20,
    opacity: 0.16,
    float: 12,
    floatDelay: 2.1,
    desktopOnly: true,
  },
  {
    name: "cutout",
    color: INK.lilac,
    width: "9%",
    right: "10%",
    bottom: "4%",
    rotate: 18,
    drift: -24,
    opacity: 0.14,
    float: 16,
    floatDelay: 0.7,
    desktopOnly: true,
  },
];

function HostMovement() {
  return (
    /*
      `overflow-clip`, NOT `overflow-hidden`, and the difference is not
      cosmetic. Both clip identically, but `hidden` makes the box a scroll
      container, and a scroll container breaks the `view()` timelines every
      <DoodleMark> inside it draws off — the marks would resolve against this
      section instead of the window, report as permanently covered, and sit
      undrawn forever. Measured on this project before.
    */
    <section
      id="collaborate"
      aria-labelledby="host-heading"
      className="relative isolate scroll-mt-header overflow-clip bg-cream py-[5rem] md:py-section lg:py-section-lg md:scroll-mt-[var(--spacing-header-lg)]"
    >
      <SectionShapes plan={HOST_SHAPES} />
      <Container className="relative">
        {/* ---- the invitation ---- */}
        <div className="relative">
          <Reveal>
            <Eyebrow>For malls &amp; destinations</Eyebrow>
          </Reveal>

          <div className="mt-8 grid grid-cols-12 items-end gap-x-6 gap-y-8 md:mt-10 lg:gap-x-10">
            <DisplayHeading
              id="host-heading"
              className="col-span-12 lg:col-span-7"
              lines={["Bring the Maison", "to your space."]}
            />

            <Reveal delay={0.15} className="col-span-12 lg:col-span-4 lg:col-start-9 lg:pb-4">
              <p className="max-w-[26rem] text-body leading-[1.8] text-text/85">
                Creative activations built around your space and your calendar &mdash; run by the
                Maison, themed to what you already have on.
              </p>
            </Reveal>
          </div>

          {/* Two marks on the statement's own band rather than scattered over
              the section, and both Deep Lilac so they read as one gesture. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-2 right-0 hidden h-16 w-16 lg:block"
          >
            <DoodleMark name="starburst" color={INK.lilac} treatment="draw" delay={240} />
          </span>
        </div>

        {/*
          ==================================================================
          THREE CARDS, SET DOWN OUT OF LINE
          ==================================================================

          They were chapters before they were cards, and the note on that is
          worth keeping: each model used to be a full-measure row with a folio
          out at one edge, and the rows read as a sequence. These three are
          not steps. A mall does not do the voucher programme and then the
          retail collaborations; it picks the one that fits its calendar.
          Three cards side by side say "choose" where three stacked rows said
          "then".

          WHAT IS NEW IS THAT THEY NO LONGER LINE UP. Three cards at the same
          height, the same angle and the same colour are a table however
          rounded their corners are. Each one now has its own paper, its own
          tilt and its own drop, so the row reads as three pieces somebody
          laid out rather than three cells that were generated. The figures
          are all in CARD_STOCK and fixed — a tilt computed at render time
          would differ between the server and the client and would change on
          every paint, which is the "constant floating" the brief rules out.

          `items-start`, and the cards take their natural heights rather than
          stretching to the tallest. Stretching is what re-imposes the line
          the tilt and the drop are there to break: three cards of equal
          height with a ragged top read as a row that slipped, three of
          honest heights read as paper.

          The folio stays, quiet, because the deck lists these in this order
          and a partner reading the page twice should find them in the same
          places. It is set in the condensed face for the reason every numeral
          on this site is: the brand's script has no usable 7, 8 or 9.
        */}
        <Stagger
          as="ol"
          className="mt-14 grid items-start gap-5 md:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {COLLABORATIONS.map((model, i) => {
            const stock = CARD_STOCK[i % CARD_STOCK.length];
            return (
              <Reveal as="li" key={model.slug} delay={i * 0.08} className={stock.lift}>
                <article
                  className={cn(
                    "plate group relative flex flex-col rounded-[1.5rem] px-7 py-8 md:px-8 md:py-9",
                    "transition-transform duration-[var(--duration-hover)] ease-soft",
                    "motion-safe:hover:-translate-y-1",
                    stock.ground,
                    stock.tilt,
                  )}
                >
                  <div className="flex items-start justify-between gap-5">
                    <p
                      className={cn(
                        "text-[2.5rem] leading-[0.82] tracking-[0.01em] [font-family:var(--font-deck)] [font-synthesis:none]",
                        stock.folio,
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
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
                      "mt-9 text-[1.5rem] font-light leading-[1.15] tracking-[-0.02em] lg:text-[1.75rem]",
                      stock.heading,
                    )}
                  >
                    {model.name}
                  </h3>

                  {/* Body, not `fine`. This is the whole description of a
                      programme a partner is deciding about. */}
                  <p className={cn("mt-4 text-body leading-[1.8]", stock.body)}>
                    {model.description}
                  </p>

                  {/*
                    THE SECOND MARK, BREAKING THE CARD'S EDGE. The brand sheet
                    never floats a cut-out in clear space; it lays one over an
                    edge, half on and half off. Each of these hangs outward or
                    downward rather than toward the next card, so nothing is
                    painted over by a later sibling.
                  */}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute z-10 hidden lg:block",
                      stock.edge.place,
                      stock.edge.size,
                    )}
                  >
                    <DoodleMark
                      name={stock.edge.name}
                      color={stock.edge.color}
                      delay={320 + i * 110}
                    />
                  </span>
                </article>
              </Reveal>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}

/**
 * ==========================================================================
 * THE DOOR, AS A BAND OF COLOUR — at the client's ask
 * ==========================================================================
 *
 * It was the last block inside <HostMovement>: a hairline rule, the sentence
 * on the left, the button on the right, all on the same White Rock paper the
 * cards sit on. The client's note was that the foot of this page and the
 * footer were the same colour, which they were — the footer is White Rock
 * too, so the page simply stopped and the footer started, with a hairline
 * somewhere in the middle doing the work a section change should do.
 *
 * So the door is its own section on Deep Lilac, built the way /about closes:
 * a band of brand colour, centred, with two cut-outs on it and the cream
 * button that is the one tone a button can take on this ground. The page now
 * ends on a colour and the footer begins on paper.
 *
 * THE DIVIDER IS GONE, and not because it was replaced. A rule exists to
 * separate two things printed on one sheet; there is no longer one sheet.
 *
 * NO HEADING, AND THAT IS DELIBERATE. /about and the homepage both close on
 * CLOSING — the deck's own last page — and a third page saying the same
 * sentence would make it wallpaper rather than a refrain. The line this
 * section already had is better here anyway: it is the only closing copy on
 * the site addressed to a venue rather than to a guest, which is exactly who
 * reads this page. So it is the existing sentence, set at the scale a close
 * deserves. Nothing new was written for it.
 *
 * INK. Deep Lilac takes `--color-surface` at 4.67:1 and takes it at FULL
 * strength only — /90 is 4.11 and fails. White Rock on this ground is 3.95
 * and Light Sage 3.83, so both are fine for a decorative mark and neither
 * may carry a word. The marks are Soft Lavender (2.74) and White Rock.
 */
function PartnerClose() {
  return (
    <section aria-label="Partner with Maison Palettia" className="relative isolate overflow-clip bg-primary">
      <Container className="relative py-[4.5rem] text-center md:py-section lg:py-[6.5rem]">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[5%] top-10 hidden w-[5rem] rotate-[-10deg] md:block"
        >
          <DoodleMark name="starburst" color={INK.lavender} treatment="draw" delay={300} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-10 right-[6%] hidden w-[4.5rem] rotate-[8deg] md:block"
        >
          <DoodleMark name="splash" color={INK.whiteRock} treatment="draw" delay={420} />
        </span>

        <Reveal>
          <p className="mx-auto max-w-[30ch] text-[clamp(1.5rem,1.15rem+1.15vw,2.1rem)] font-light leading-[1.35] tracking-[-0.01em] text-surface">
            Tell us about your space and what you have coming up, and we will come back with what
            the Maison could make there.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-10 flex justify-center">
            {/* `cream` is the tone for a button standing ON Deep Lilac — a
                lilac one cannot be seen at all. See <BlobButton>. */}
            <BlobButton href="/contact" tone="cream" className="min-h-[3.25rem] px-8">
              Partner with us
            </BlobButton>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
