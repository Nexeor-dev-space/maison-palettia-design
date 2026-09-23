import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import styles from "@/components/sections/home/WorkshopJourney.module.css";
import { Container } from "@/components/ui/Container";
import { DeckSheet } from "@/components/ui/deck/Deck";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { DisplayHeading, Eyebrow } from "@/components/ui/SectionHeader";
import { WORKSHOP_JOURNEY } from "@/lib/brand";
import { PAINTS_ON_SAGE, paintAt } from "@/lib/paint";

/* Fixed, not random: five dabs set down by a hand that was not using a ruler. */
const TILT = ["-2.5deg", "1.5deg", "-1deg", "2deg", "-1.5deg"];

/**
 * "The workshop journey" — the five ways a visit can go.
 *
 * ==========================================================================
 * BUILT FROM THE DECK, NOT TRACED FROM IT
 * ==========================================================================
 *
 * This section used to be the deck's page 5 reproduced: a lavender condensed
 * pill for the heading, two photographs in 2.5px outlined frames, cut-outs
 * taped over their corners, and the five ways as a bulleted list. The client's
 * note was exact — it was the PDF, ditto. What a slide needs and what a page
 * needs are not the same thing: a slide is looked at once, from across a room,
 * and its frames and pills are there to hold a projected image together. A
 * scrolled page has the reader's whole attention and does not need the frame.
 *
 * So the deck's colours, its words and its paper stay; its furniture goes.
 *
 * THE IDEA IS THE BRAND'S OWN LINE. "A palette of creativity for everyone" —
 * so the five ways are laid out as a palette: a swatch of paint above each
 * one, brushed on with the same loaded-brush edge the activity plates use, in
 * the four approved colours running left to right. Five swatches in a row say
 * "these are your choices" at a glance, where five bullets said "read me".
 *
 * They are not a sequence and never were — nobody does walk-in, then
 * scheduled, then family bonding in order — so there is no numbering, no
 * arrows and no line joining them. They arrive in order as the section comes
 * into view, which is the only place order belongs here.
 *
 * The heading is the site's script, like every other section on this page;
 * the pill was the one heading on the homepage set in a different face.
 *
 * THE HEADING HAS A PICTURE BESIDE IT, AND THAT IS AN EMPTINESS FIX. The
 * header was the heading alone against the full measure: two lines of script
 * using a third of the width, a cut-out stranded in the far corner, and some
 * six hundred pixels of Light Sage between them. Every other section header on
 * this page pairs the heading with something on the right — a note in
 * <ExperienceDiscovery>, a paragraph in <WaysToExperience> — and this one had
 * nothing to pair it with, because the client has supplied no standfirst for
 * it and writing one would be inventing a claim about their programme.
 *
 * So the right-hand half is given a photograph the section already owned
 * rather than a sentence it did not. Both pictures used to sit in a band at
 * the foot; the first now opens the section beside the heading and the second
 * closes it across the full measure, which fills the header, keeps every image
 * that was here, and takes a band of scrolling out of the middle.
 *
 * Both carry `data-paint`, so the brush cursor inks over them like every other
 * picture on the site.
 *
 * The five entries and their sentences are `WORKSHOP_JOURNEY`, verbatim.
 */
export function WorkshopJourney() {
  return (
    <DeckSheet labelledBy="journey-heading">
      <Container className="relative">
        {/*
          `items-end`, so the heading's last line and the foot of the
          photograph finish together — the two halves of the header land on one
          line rather than each starting at the top and ending wherever they
          happen to.

          The cut-out rides the picture's top-left corner, which is where the
          deck puts a shape: breaking an edge. It used to hang in clear space
          at the far right of the section, which is the one place the deck
          never puts one.
        */}
        <div className="grid grid-cols-12 items-end gap-x-gutter gap-y-9">
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Eyebrow>What we offer</Eyebrow>
            </Reveal>
            <DisplayHeading
              id="journey-heading"
              lines={["The workshop", "journey."]}
              className="mt-6 md:mt-8"
            />
          </div>

          <Reveal
            variant="imageReveal"
            delay={0.08}
            className="relative col-span-12 lg:col-span-7"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -left-5 -top-6 z-10 hidden w-[5.5rem] rotate-[-8deg] lg:block"
            >
              <DoodleMark name="coral" color="var(--color-lavender)" delay={200} />
            </span>
            <figure
              className={styles.lead}
              data-paint
              style={{ "--paint": "var(--color-primary)" } as React.CSSProperties}
            >
              <Image
                src="/images/workshop-journey.jpg"
                alt="A child's hands colouring in a printed butterfly with an orange crayon, a second pair of hands holding the page steady alongside."
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className={styles.photo}
              />
            </figure>
          </Reveal>
        </div>

        {/*
          The palette. One rule above it sets the row off from the heading
          without drawing a box around anything.
        */}
        <Stagger
          as="ul"
          className="mt-12 grid grid-cols-1 gap-x-gutter gap-y-10 border-t border-line pt-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-5 lg:pt-12"
        >
          {WORKSHOP_JOURNEY.map((step, i) => (
            <Reveal as="li" key={step.slug} delay={i * 0.06} className="flex flex-col">
              <span
                aria-hidden
                className={styles.swatch}
                style={
                  {
                    "--paint": paintAt(i, PAINTS_ON_SAGE),
                    "--tilt": TILT[i % TILT.length],
                  } as React.CSSProperties
                }
              />
              <p className="mt-5 text-lead font-medium leading-snug text-text">{step.name}</p>
              <p className="mt-2.5 text-body leading-[1.65] text-text/80">{step.description}</p>
            </Reveal>
          ))}
        </Stagger>

        {/*
          THE CLOSING PHOTOGRAPH IS GONE, at the client's ask. It was a
          full-measure band of yarn under the palette — a second picture in a
          section that already opens with one, and the only thing between the
          five steps and the section below. The palette is the full stop now.
        */}
      </Container>
    </DeckSheet>
  );
}
