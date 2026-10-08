import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { embedSrc } from "@/components/sections/LocationMap";
import { Container } from "@/components/ui/Container";
import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { getMallPartners } from "@/lib/partners";
import { WHERE_SPOTS } from "@/components/sections/home/homeSpots";

/**
 * Homepage 09 — where the Maison has created, and where to find it now.
 *
 * ONE CLAIM, NOT TWO. This used to carry both the record of where the studio
 * has been — ten mall names set as a poster — and the place to find it today.
 * The client has asked for the record to live with the collaboration pages
 * instead, so what is left is the statement and the studio you can walk into
 * this week. See the note on the column below.
 *
 * THE MAP AND THE ADDRESS ARE ONE OBJECT. It was an arch over a separate
 * card, which is the Maison's own shape but read as two things stacked; on the
 * client's ask the map now carries the card's radius, so the pair is a map
 * with its address under it. The map is also the link — see the note on the
 * frame. It is the project's existing keyless embed, built from the partner
 * record: no coordinates are invented.
 */
export async function WhereWeCreate() {
  const partners = await getMallPartners();
  const home = partners[0];

  return (
    /*
      WHITE ROCK, NOT THE NEAR-WHITE `surface`. The client's note on this
      section was "add some color to this page", and it was fair: a near-white
      ground under charcoal type with one terracotta rule was the palest
      thing on the homepage — it read as a document rather than as part of
      this site. White Rock is the warm paper the rest of the page is printed
      on, and it lets the colour below it (the marks, the plate behind the
      map) register instead of floating on nothing.
    */
    <section
      aria-labelledby="where-heading"
      /*
        `overflow-clip`, NOT `hidden`, and it is the difference between a mark
        that fills and one that never does. `hidden` makes this a scroll
        container, and a scroll container breaks the view timeline the brand
        marks draw on — the cut-outs render into the HTML and then sit at their
        undrawn outline state forever. The wave behind the map was drawn as a
        wireframe for exactly this reason. `clip` clips the same and creates no
        scrollport. Same trap as the hero's sections; see DoodleMark.module.css.
      */
      className="relative isolate overflow-clip bg-cream py-[4rem] md:py-[5.5rem] lg:py-[6.5rem]"
    >
      {/*
        TWO ON THE SECTION'S OWN EDGES, and two in the channel inside it — see
        the note on the grid below. These two break the gutters rather than
        floating in the band of ground the page breathes with between sections
        — the deck's rule that a cut-out always crosses an edge — so they read
        as the section's corners rather than as clutter dropped into its air.
      */}
      {/* The section's doodles — see WHERE_SPOTS in homeSpots.ts. */}
      <SectionShapes plan={WHERE_SPOTS} />

      <Container>
        {/*
          ==================================================================
          TWO BLOCKS AND A CHANNEL, AND THE CHANNEL IS WHAT THE MARKS ARE FOR
          ==================================================================

          THE HISTORY MATTERS HERE, because this has now been both shapes.

          It was six columns of statement and four of map, which left columns
          seven and eight carrying nothing — 280px of dead ground straight
          down the middle of the section, and the client's note was exactly
          that. The answer at the time was to put a third block of type in the
          channel: four columns of heading, four of statement, four of map.

          The client has since asked for the two columns back, with the
          cut-outs in the channel instead. That is not a reversal of the first
          note, it is a different answer to it: what made the channel dead was
          that it was EMPTY, and a column of brand shapes fills it as surely
          as a column of text — while leaving the statement whole instead of
          split across two blocks with a gutter through it.

          SO THE CHANNEL IS A CELL, not a pair of marks floated over the row.
          Columns seven and eight are a real grid child that stretches to the
          row's height, and the two marks are placed against its edges: at
          1440 that is x740-940, and nothing in it can drift onto a word,
          because there are no words in it at any width.

          Below `lg` the three stack and the channel does not exist, so the
          cell is `lg:block` and the row is the statement and the map.
        */}
        <div className="grid grid-cols-12 items-start gap-x-6 gap-y-12 lg:items-center lg:gap-x-10">
          {/*
            ==================================================================
            THE MARKS SIT ON THE TWO THINGS, NOT IN THE GAP BETWEEN THEM
            ==================================================================

            They were four cut-outs in a two-column channel of their own
            between the statement and the map — a strip of ground with nothing
            in it but shapes. The client's note is that they read as disorderly
            there, and they are right about why: a mark in open ground has
            nothing to be near, so four of them stepping down an empty channel
            is four strays rather than one gesture. The deck never does that —
            every cut-out on that sheet crosses the edge of something.

            So the channel is gone and the marks are on the two objects the
            section actually has. Two beside the heading, in the clear ground
            to its right where no line of type reaches; two on the map, tucked
            behind its corners at `-z-10` so they show only as much as its
            edges leave uncovered, which is what "just behind" means.

            WHAT IS KEPT. `depth` and `pointer-lift` — the lean toward the
            pointer and the swell as it nears — because those were never about
            where the marks sat. The section's own two edge marks are
            untouched: they cross the gutters, which was always right.
          */}
          <div className="relative col-span-12 lg:col-span-5">

            {/*
              ==============================================================
              THE PAST-YEAR FRAMING HAS GONE — at the client's ask
              ==============================================================

              This was "Our experience / Where We've Created." over the
              deck's year-in-review sentence, and under it a run of ten malls
              the studio has worked in. The destinations came off first; the
              heading and the sentence are the rest of the same note, which
              asks for that record to leave the main pages and live on a
              Brands & Malls page if it is wanted at all.

              WHAT THE SECTION IS FOR SURVIVES IT, because what it actually
              holds is the map and the destination the studio sets up in —
              present tense, and the one thing the client asked to keep. So
              the words become that: "Find us" over "Where We Set Up.", which
              is the phrase /events already uses for the same idea, and the
              sentence is the one /locations opens with rather than a new
              claim written to fill the space.

              `EXPERIENCE_STATEMENT` is untouched in lib/brand.ts and nothing
              reads it now — it is one import away from a collaboration page.
            */}
            <Reveal>
              <Eyebrow>Find us</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="where-heading"
              className="mt-8 md:mt-10"
              lines={["Your Next Creative", "Stop."]}
            />
            {/* 60 characters: the measure has to fill the column it is
                actually in, or the dead ground it leaves reads as the
                section being empty — the note this section keeps getting.
                At five columns the column is about 480px and so is 60ch. */}
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-[60ch] text-lead text-text">
                Find Maison Palettia in the places you already love to visit — and come
                make something while you&rsquo;re there.
              </p>
            </Reveal>
          </div>

          {/*
            THE MARKS ARE PLACED, NOT SCATTERED — the client's earlier note on
            this was "uncontrolled icon scattering did not look good", and it
            still governs. Every mark below is anchored to this cell, which is
            a column with no words in it at any width, so none of them can ever
            be measured against a line of type.

            ==================================================================
            ONE FAMILY, AND THE SPIKY ONE IS GONE
            ==================================================================

            It was a starburst high on the left and a bean low on the right —
            two marks, far apart, and one of them the only hard-edged shape in
            a section whose other cut-outs are a coral and a wave. The client's
            words were that it "looks separated", and both halves of that are
            fair: a pair at opposite corners of a tall channel is not a group,
            and a starburst does not belong to the same set as a coral.

            So it is four SMOOTH shapes now — coral, bean, wave, dot — the
            rounded end of the brand's sheet and the same two the section's own
            gutters already carry. They step down the channel rather than
            sitting at its corners, each overlapping the last one's band a
            little, so the eye reads a run of marks instead of two strays.

            ==================================================================
            AND THEY ANSWER THE POINTER — BOTH WAYS
            ==================================================================

            `depth` is the lean <DoodleMark> already had: the mark translates
            toward the pointer, and each one takes a different figure so the
            group parts rather than sliding as a sheet.

            `pointer-lift` is the other half the client asked for — the mark
            GROWS as the pointer comes near its column. `--ax` is where each
            one sits across the window, `--lift` how much bigger it gets at
            nought distance. The two strongest are the two in the middle of the
            run, so the growth reads as the group swelling toward the cursor
            rather than four things inflating at once. See the utility's note
            in globals.css for why the distance is measured across only.
          */}
          {home ? (
            <div className="relative col-span-12 lg:col-span-5 lg:col-start-8">

              {/*
                ==========================================================
                SMALLER, AND WITH AN EDGE OF ITS OWN
                ==========================================================

                The client's note: "this doesnt need to be SO big, or maybe
                give it a border cuz it blend with the background."

                Both halves are fixed here. It was a 4:5 portrait across four
                columns — about 360x450 on a 1440 screen, the largest object
                in the section and taller than the words beside it. 5:4 is
                wider but a third shorter, which is the shape a map of one
                place wants anyway.

                AND IT IS FIVE COLUMNS AGAIN, at the client's later ask to
                widen it — but at 5:4, not the 4:5 that made it too big the
                first time. Five columns of 4:5 was 560x700; five columns of
                5:4 is about 480x380, which is wider than the four-column
                version and still shorter than it was originally. The width
                is what the client asked for and the height is what the
                earlier note protects.

                THE EDGE IS `plate`, NOT A BORDER. The site's answer to a pale
                object on a pale ground is a hairline of Charcoal at a tenth
                plus a soft veil, and it follows whatever radius it is given —
                including the rounded rectangle this is now. A drawn border
                heavy enough to hold would be the loudest mark in the section,
                which is the note the client already gave about hard strokes
                elsewhere.

                AND THE GREY CAME OFF. The embed was desaturated 35%, which on
                a near-white ground is most of why it disappeared. Its own
                colour is muted enough to sit here, and it answers the other
                note on this section at the same time.
              */}
              <Reveal variant="fadeIn">
                {/*
                  A ROUNDED RECTANGLE ON THE BOX'S OWN RADIUS, at the client's
                  ask, in place of the arch. `rounded-[1.25rem]` is not a new
                  number: it is exactly what the address card below carries, so
                  the two now read as one object in two parts rather than as an
                  arch with a card parked under it. `plate` follows whatever
                  radius it is given, so the hairline and veil come with it.
                */}
              {/*
                BEHIND THE MAP'S OWN FRAME, not behind its column. Hung off
                the column they landed against whatever the column happened to
                end with — the address card below the map — which is a
                different object and half a section away from the thing they
                are meant to be tucked under. This wrapper is the map and
                nothing else.

                `-z-10` is what makes them read as behind it: the frame is
                opaque, so only as much of each mark shows as its corners
                leave uncovered. And the frame itself is `overflow-clip`, so
                the marks cannot live inside it — they sit in a `relative`
                wrapper around it instead.
              */}
              <div className="relative">

                <div className="plate relative aspect-[5/4] overflow-clip rounded-[1.25rem] bg-surface">
                  {/*
                    Taller than its frame and lifted by the height of Google's
                    place card, so the card sits above the frame and out of
                    sight. 11rem, not the 7 this was, and the reason is the
                    widening: below about 450px Google draws only the pin, and
                    above it the full place card — so widening this frame
                    turned a card that was not there into a 157px one carrying
                    the rating, and the old crop left the stars showing.

                    Lifting the frame rather than shrinking it keeps the
                    BOTTOM pinned, which is the half that matters: Google's
                    logo and terms sit at the foot of the embed and have to
                    stay visible, so whatever comes off the top, nothing comes
                    off the bottom. The card carries a star rating and a review count —
                    Google's, not the studio's, but on this page it would read
                    as a rating the Maison is showing, which the brief rules
                    out. Only the top is cropped: Google's logo and terms sit
                    at the foot of the embed and stay visible, as the embed's
                    terms require.

                    `pointer-events-none`, WHICH IS WHAT MAKES THE MAP A LINK.
                    The client's note was that the map "is not redirect to
                    anywhere" — and it could not, because an iframe eats every
                    click inside its own box, so a map that looks pressable did
                    nothing when pressed. The frame is now inert and the anchor
                    below covers it, which costs the embed's own pan and zoom
                    and buys the one behaviour that was asked for. `tabIndex`
                    keeps the dead frame out of the tab order; the title stays,
                    so the map still announces itself.
                  */}
                  <iframe
                    title={`Map showing ${home.name}, ${home.locality}`}
                    src={embedSrc(home)}
                    loading="lazy"
                    tabIndex={-1}
                    referrerPolicy="no-referrer-when-downgrade"
                    className="pointer-events-none absolute inset-x-0 -top-44 h-[calc(100%+11rem)] w-full border-0"
                  />

                  {/*
                    The link is a sibling that covers the frame rather than a
                    wrapper around it: an anchor with an iframe inside it is
                    interactive content nested in interactive content, and the
                    overlay gets the same hit area without that. Its own name
                    is the sr-only line, because the thing it covers is a
                    picture of a map and "map" is not a destination.
                  */}
                  {home.locationHref ? (
                    <a
                      href={home.locationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 rounded-[1.25rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span className="sr-only">
                        Open {home.name}, {home.locality} in Google Maps (opens
                        in a new tab)
                      </span>
                    </a>
                  ) : null}
                </div>
              </div>
              </Reveal>

              {/*
                THE ADDRESS SITS ON LIGHT SAGE. Loose type under the map was
                the palest corner of the palest section; on the brand's own
                green it reads as a card you could take with you, and it is
                the second half of the client's "add some color" note.
              */}
              <Reveal delay={0.1}>
                <div className="plate mt-5 rounded-[1.25rem] bg-sage px-6 py-6 md:px-7">
                  <h3 className="flex items-center gap-3 text-label font-medium uppercase tracking-eyebrow text-text">
                    <span aria-hidden className="block w-4 shrink-0">
                      <DoodleMark name="dot" color={INK.lilac} />
                    </span>
                    Find us now
                  </h3>
                  <p className="mt-3 text-h3 font-light tracking-[-0.01em] text-text">
                    {home.name}
                  </p>
                  <p className="mt-1 text-body text-text/85">{home.locality}</p>
                </div>
              </Reveal>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
