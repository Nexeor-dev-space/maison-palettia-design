import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { embedSrc } from "@/components/sections/LocationMap";
import { Container } from "@/components/ui/Container";
import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { EXPERIENCE_STATEMENT } from "@/lib/brand";
import { getMallPartners } from "@/lib/partners";

/**
 * Homepage 09 — where the Maison has created, and where to find it now.
 *
 * ONE CLAIM, NOT TWO. This used to carry both the record of where the studio
 * has been — ten mall names set as a poster — and the place to find it today.
 * The client has asked for the record to live with the collaboration pages
 * instead, so what is left is the statement and the studio you can walk into
 * this week. See the note on the column below.
 *
 * THE MAP IN AN ARCH. The Maison's entrances and signage are arches, and the
 * same shape framing the map is what stops a Google embed looking like an
 * afterthought pasted into the page. It is the project's existing keyless
 * embed, built from the partner record — no coordinates are invented.
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
      className="relative isolate overflow-hidden bg-cream py-[4rem] md:py-[5.5rem] lg:py-[6.5rem]"
    >
      {/*
        TWO ON THE SECTION'S OWN EDGES, and two in the channel inside it — see
        the note on the grid below. These two break the gutters rather than
        floating in the band of ground the page breathes with between sections
        — the deck's rule that a cut-out always crosses an edge — so they read
        as the section's corners rather than as clutter dropped into its air.
      */}
      {/*
        THE CORAL HAD TO COME DOWN WITH THE COLUMNS. It sat at 12% off the
        foot while the statement was in the MIDDLE four columns, so the left
        gutter beside it was clear ground. With the statement back on the left
        it was measured across the copy — x-61 to 93 against a paragraph that
        starts at x20, sitting on "creativity, engagement" at 1440 and on the
        same line at 1920. Dropped past the section's floor it clears the last
        line by 11px at 1024, 48px at 1440 and 40px at 1920, and it still
        crosses the left gutter, which is the part of it that matters. What it
        loses is 32px off its foot to `overflow-hidden`, which is the deck's
        own habit rather than a cost: a cut-out there always runs off an edge.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-8 -bottom-8 hidden w-20 rotate-[8deg] lg:block xl:-left-12 xl:w-28"
      >
        <DoodleMark name="coral" color={INK.terracotta} treatment="draw" delay={380} />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 top-[8%] hidden w-24 -rotate-12 lg:block xl:w-28"
      >
        <DoodleMark name="wave" color={INK.lavender} treatment="draw" delay={520} />
      </span>

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
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <Eyebrow>Our experience</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="where-heading"
              className="mt-8 md:mt-10"
              lines={["Where we’ve", "created."]}
            />
            {/* 54 characters, not the 46 this was set to. That figure was
                cut for a four-column block; in six columns it left 140px of
                its own column empty on top of the channel beside it, which
                is the fault this section was already pulled up on. 54 is
                still well inside the measure — the note on the old
                arrangement put the ceiling at about 75. */}
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-[54ch] text-body leading-[1.85] text-text/85">
                {EXPERIENCE_STATEMENT}
              </p>
            </Reveal>
          </div>

          {/*
            THE MARKS ARE PLACED, NOT SCATTERED — the client's earlier note on
            this was "uncontrolled icon scattering did not look good", and it
            still governs. These two are anchored to the channel's own edges,
            one high on its left and one low on its right, so the pair reads
            as a column of air with something in it rather than as two
            stickers dropped in the gap. The other two break the section's
            gutters, which is the deck's own rule for a cut-out.

            AND NEITHER OF THEM CAN SIT ON A WORD, which is the fault the
            last arrangement had: the starburst was inside the statement's
            column and became its first line the moment the blocks were
            centred against each other. A mark that has to be checked against
            the text it floats over belongs somewhere there is no text, and
            this cell is that place by construction.
          */}
          <div
            aria-hidden
            className="pointer-events-none relative hidden self-stretch lg:col-span-2 lg:col-start-7 lg:block"
          >
            {/*
              SIZED TO LEAVE THE CHANNEL VISIBLE, which is the difference
              between filling a space and plugging it. At 92% and 76% of a
              200px cell the two marks spanned it edge to edge — 186px and
              152px of solid colour with no ground showing between them, which
              reads as a third column of shapes rather than as air with marks
              standing in it. At these figures they are about 140px and 108px
              at 1440, staggered on opposite corners, and the channel is still
              a channel.
            */}
            <span className="absolute left-0 top-[8%] w-[70%] -rotate-6 xl:w-[62%]">
              <DoodleMark name="starburst" color={INK.lilac} treatment="draw" delay={260} />
            </span>
            <span className="absolute bottom-[10%] right-0 w-[54%] rotate-[10deg] xl:w-[48%]">
              <DoodleMark name="bean" color={INK.lavender} treatment="draw" delay={460} />
            </span>
          </div>

          {home ? (
            <div className="col-span-12 lg:col-span-4 lg:col-start-9">
              {/*
                ==========================================================
                SMALLER, AND WITH AN EDGE OF ITS OWN
                ==========================================================

                The client's note: "this doesnt need to be SO big, or maybe
                give it a border cuz it blend with the background."

                Both halves are fixed here. It was a 4:5 portrait across four
                columns — about 360x450 on a 1440 screen, the largest object
                in the section and taller than the words beside it. 5:4 across
                five columns is wider but a third shorter, which is the shape
                a map of one place wants anyway.

                THE EDGE IS `plate`, NOT A BORDER. The site's answer to a pale
                object on a pale ground is a hairline of Charcoal at a tenth
                plus a soft veil, and it follows whatever radius it is given —
                including this one, which is an arch. A drawn border heavy
                enough to hold would be the loudest mark in the section, which
                is the note the client already gave about hard strokes
                elsewhere.

                AND THE GREY CAME OFF. The embed was desaturated 35%, which on
                a near-white ground is most of why it disappeared. Its own
                colour is muted enough to sit here, and it answers the other
                note on this section at the same time.
              */}
              <Reveal variant="fadeIn">
                <div className="arch plate relative aspect-[5/4] overflow-clip bg-surface [--arch-rise:22%]">
                  {/*
                    Taller than its frame and lifted by the height of Google's
                    place card, so the card sits above the arch and out of
                    sight. The card carries a star rating and a review count —
                    Google's, not the studio's, but on this page it would read
                    as a rating the Maison is showing, which the brief rules
                    out. Only the top is cropped: Google's logo and terms sit
                    at the foot of the embed and stay visible, as the embed's
                    terms require.
                  */}
                  <iframe
                    title={`Map showing ${home.name}, ${home.locality}`}
                    src={embedSrc(home)}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-x-0 -top-28 h-[calc(100%+7rem)] w-full border-0"
                  />
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
                  <h3 className="flex items-center gap-3 text-label font-semibold uppercase tracking-eyebrow text-text">
                    <span aria-hidden className="block w-4 shrink-0">
                      <DoodleMark name="dot" color={INK.lilac} />
                    </span>
                    Find us now
                  </h3>
                  <p className="mt-3 text-[1.375rem] font-light leading-tight tracking-[-0.01em] text-text">
                    {home.name}
                  </p>
                  <p className="mt-1 text-body text-text/85">{home.locality}</p>
                  <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
                    <Link
                      href="/locations"
                      className="group -my-1.5 inline-flex items-baseline gap-3 py-1.5 text-action font-semibold uppercase tracking-eyebrow text-text"
                    >
                      <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
                        Locations
                      </span>
                      <span aria-hidden className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1">
                        &#8594;
                      </span>
                    </Link>
                    {home.locationHref ? (
                      <a
                        href={home.locationHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group -my-1.5 inline-flex items-baseline gap-3 py-1.5 text-action font-semibold uppercase tracking-eyebrow text-text"
                      >
                        <span className="border-b border-text/60 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
                          Directions
                        </span>
                        <span className="sr-only">(opens Google Maps in a new tab)</span>
                        <span aria-hidden>&#8599;</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
