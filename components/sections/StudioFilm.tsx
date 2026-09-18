import { Reveal } from "@/components/motion/Reveal";
import { FilmStage } from "@/components/sections/FilmStage";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";

/**
 * The film band, sitting between the creative index and the mall partners.
 *
 * WHAT THE REFERENCE ACTUALLY DOES, MEASURED RATHER THAN GUESSED. Goodman's
 * film band is one viewport tall (900px at 900px of viewport) and its type
 * does not move: the label sat at y=441 at every one of four scroll positions
 * sampled 300px apart, while the section itself travelled the full 900 —
 * secY 300, 0, -300, -600. So the band is a window the page scrolls past
 * rather than a block that scrolls with it, and that stillness IS the effect
 * the client pointed at. Their media element could not be read from the
 * outside (`querySelector('video,img')` returned nothing, so it is painted
 * some other way), which is why what follows reproduces the behaviour and not
 * their markup.
 *
 * STICKY, NOT `background-attachment: fixed`, AND NOT `position: fixed`.
 *
 * `background-attachment: fixed` is the one-line version and it cannot be used
 * here: it takes an image, not a film, and mobile Safari has never supported
 * it — it silently degrades to a scrolling background on the devices most
 * likely to see this page.
 *
 * `position: fixed` would hold the type still forever rather than for the
 * length of the band, so it needs script to mount and unmount it around the
 * section's edges, and it escapes every clip in the document — including the
 * opaque <main> that the footer reveal slides under, which would put a film
 * over the footer.
 *
 * A `sticky top-0 h-svh` child inside a taller section gets the same stillness
 * out of the layout engine: the stage pins at the top of the viewport for the
 * 70svh of travel the section has over it, then releases at the section's
 * bottom edge. It cannot leak past its own section, it needs no script, and it
 * is the same mechanism the hero on this page already uses.
 *
 * 170svh IS THE DIAL. It is the band's height, and the length of the pin is
 * whatever is left after the stage's own 100svh — so 0.7 of a screen of
 * scrolling with the film held still. Shorter than that and the stillness
 * reads as a stutter rather than a pause; much longer and a reader with
 * nothing new to look at starts wondering whether the page has stopped.
 */

/**
 * The film's running time, and it is measured rather than decided:
 * `maison-banner.mp4` runs 61.26s, which the 1280x720 cut preserves exactly.
 *
 * It is here for the reason the reference carries one. A timecode tells a
 * reader the size of the thing they are being offered before they commit to
 * it, and the honest number for a minute of film is the number in the file.
 */
const DURATION = "1:01";

/** The band's own word for what it is showing. Not a title, and not a claim
 *  about the work — the two lines in the middle carry the brand's own copy. */
const KIND = "A short film";

export function StudioFilm() {
  return (
    <section
      aria-labelledby="studio-film"
      className="relative h-[170svh] bg-text [--color-focus:var(--color-cream)]"
    >
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <FilmStage
          src="/videos/maison-film.mp4"
          poster="/images/hero/film-poster.jpg"
          posterAlt=""
          duration={DURATION}
        />

        {/*
          THE SCRIM, IN TWO PARTS, AND THE SECOND ONE IS WHY THE FIRST IS WEAK.

          A flat wash dark enough to carry cream type over every frame of a
          61-second film turns the film into a grey rectangle — which defeats
          the point of showing one. So the flat layer only does the floor, and
          a centre-weighted wash adds the rest where the type actually is.

          IT IS FULL-BLEED, NOT A BOX BEHIND THE WORDS. That was tried on the
          hero and abandoned there for the reason it would fail here: a
          positioned scrim can always show its own rectangle edge once it is
          strong enough to do its job, and an edge crossing the frame is more
          conspicuous than the contrast problem it solves.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-text/60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 78% at 50% 50%, " +
              "color-mix(in oklab, var(--color-text) 42%, transparent) 0%, " +
              "color-mix(in oklab, var(--color-text) 36%, transparent) 58%, " +
              "transparent 92%)",
          }}
        />

        <Container className="relative z-10 w-full">
          {/*
            The reference's three-part line: what it is on the left, what it is
            called in the middle, how long it runs on the right, all on one
            optical centre.

            IT IS A GRID AND NOT `justify-between`, so the middle column is
            centred on the MEASURE rather than on whatever space the two
            outer labels happen to leave it. "A short film" and "1:01" are very
            different lengths, and with flexbox the title drifts right by half
            that difference — visible, because the title is the one thing on
            this screen a reader is lining up on.

            The outer two stack under the title on a phone, where three columns
            would leave the middle one about 40% of a 390px screen.
          */}
          <div className="grid grid-cols-1 items-center gap-y-10 text-center md:grid-cols-12 md:gap-y-0 md:text-left">
            <Reveal className="md:col-span-3">
              <p className="flex items-center justify-center gap-4 text-action font-medium uppercase tracking-eyebrow text-cream md:justify-start">
                <span
                  aria-hidden
                  className="h-px w-9 shrink-0 bg-cream/55 md:w-12"
                />
                {KIND}
              </p>
            </Reveal>

            <Reveal
              variant="subtleReveal"
              className="md:col-span-6 md:text-center"
            >
              {/* The maker, then the work — the reference's order, and the
                  only order that lets the larger line be the statement. */}
              <p className="text-fine font-medium uppercase tracking-eyebrow text-cream/80">
                {SITE.name}
              </p>
              <h2
                id="studio-film"
                className="mt-5 text-h1 font-light uppercase leading-[1.05] tracking-[-0.02em] text-cream md:mt-6"
              >
                {SITE.tagline}
              </h2>
            </Reveal>

            <Reveal className="md:col-span-3 md:text-right">
              {/*
                `tabular-nums` so the digits hold their column — this line is
                the only number on the screen and a proportional "1" makes it
                sit visibly off its own right edge.

                Marked up as <time> with a real duration, because it is one.
              */}
              <time
                dateTime="PT1M1S"
                className="text-action font-medium uppercase tracking-eyebrow tabular-nums text-cream/85"
              >
                {DURATION}
              </time>
            </Reveal>
          </div>
        </Container>
      </div>
    </section>
  );
}
