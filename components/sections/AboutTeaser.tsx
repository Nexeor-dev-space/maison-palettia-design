import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { ParallaxPlate } from "@/components/motion/ParallaxPlate";
import { ABOUT_TEASER, HERO_IMAGE } from "@/lib/constants";

/**
 * Homepage section — the About teaser.
 *
 * A doorway, not a second About page. The homepage used to carry the Maison's
 * philosophy in full — the same eyebrow, title, description and script accent
 * that /about renders from the same constant — so the page was arguing its
 * case twice and the visitor read the same paragraph on two routes. This says
 * there is a story and points at where it is told.
 *
 * Deliberately small. It sits between the experience above and the booking
 * invitation below, and anything with more weight than a photograph and three
 * lines would interrupt the run to the one thing this page is for.
 *
 * ==========================================================================
 * WHITE ROCK, AND WHY IT IS THIS SECTION THAT GETS A GROUND
 * ==========================================================================
 *
 * Measured down the rendered homepage, the grounds ran:
 *
 *   01 Hero ................. Charcoal
 *   02 Upcoming events ...... page off-white
 *   03 How it works ......... page off-white
 *   04 Creative experiences . Light Sage
 *   05 Mall partners ........ page off-white  ┐
 *   06 The Maison (here) .... page off-white  │ 4,138px with no change at all
 *   07 Gallery .............. page off-white  │
 *   08 Good to know ......... page off-white  ┘
 *   09 In their words ....... Charcoal
 *   10 Plan your visit ...... White Rock
 *
 * Four sections and over four thousand pixels of one flat field — the longest
 * stretch on the page, and this section sat in the middle of it. A ground here
 * splits that run roughly in half and the page alternates again.
 *
 * WHITE ROCK RATHER THAN THE LOUDER OPTIONS, on three counts. Light Sage is
 * already the 2,579px field at 04 and would read as a repeat two sections
 * later rather than as a change. Charcoal is a moment of gravity, and this
 * section is a doorway that the note above says must not interrupt the run —
 * a dark band here would do exactly that. Soft Lavender has no ground anywhere
 * on the site, and a small teaser is not where a palette should introduce one.
 *
 * What is left is the brand's warm neutral, which is the right weight: it
 * separates this section from its neighbours without asking to be looked at,
 * and it flatters the photograph where a saturated field would compete with
 * it. It is also the ground the closing invitation uses, so the page's two
 * quiet typographic moments are set on the same warmth.
 *
 * The ground moves to a wrapping <section> rather than onto the Container.
 * Container carries no max-width today, so a colour on it would reach the
 * viewport edges by accident rather than by intent — and would stop doing so
 * the day `--container-site` is put back. Every other coloured section on the
 * site is shaped this way.
 *
 * ==========================================================================
 * THE SPREAD IS INVERTED, NOT REPEATED
 * ==========================================================================
 *
 * The reference for this composition is goodman-gallery.com's Exhibitions and
 * Fairs pattern — a compact text block set against one large image, with the
 * space the text doesn't use left empty on purpose. Two sections above this
 * one already build that pattern straight: <MallPartners> sets its text at
 * the top of its half beside a full-height map, and <CreativeExperiences>
 * (via <ExperienceIndex>) runs the same top-anchored text-and-photograph row
 * four times over. A third top-anchored version here would read as the same
 * idea a third time rather than as its own moment, so this one turns the
 * pattern over instead of repeating it: the photograph still fills one half,
 * but the eyebrow, title, paragraph and link sit low in the other —
 * `lg:items-end` on the row, against the neighbours' `items-start`. The
 * emptiness the reference leaves under its text now sits above it here. Same
 * device, read the other way round.
 *
 * The frame is a flat 4:3 at every width, rather than the 4:3-on-phone,
 * 5:4-on-desktop split this file held before. 4:3 is close to the reference's
 * own half (694:518 ≈ 1.34:1) and, measured against the text block it now
 * sits beside, it is reliably the taller of the two: 358px against a 301px
 * text block at 1024 (a 57px band above the eyebrow), widening to 510px
 * against 310px at 1440 (200px). The band grows with the viewport rather than
 * thinning, because the frame's height rides the column width while the text
 * block barely grows at all — which is what keeps it a visible band and not a
 * rounding error, at both ends of the range this file is measured across.
 *
 * SIX AND SIX, not the five-column offset this file held before.
 *
 * The text column used to be `lg:col-span-5 lg:col-start-8` — five columns
 * with column 7 left empty as a wide gutter — which measures 391px at 1024
 * and 560px at 1440 (this project's own Container gutter and `lg:gap-x-10`,
 * measured, not assumed). The title's longer authored line, "AND TIME TO USE
 * THEM." at this project's own Montserrat 300 and the -0.02em tracking set
 * below, measures 484px at the 2.5rem (40px) this file used to jump to at
 * `lg`. A line that wide was never going to fit a 391px column at any size
 * past about 32px — the old arrangement was already broken, just never at a
 * width anyone had measured against the actual authored copy.
 *
 * The fix is the reference's own split. Goodman's Exhibitions and Fairs rows
 * are two even 694px halves inside a 1400px measure, and <MallPartners> —
 * this page's own neighbour — already reaches for the identical six-and-six
 * for the identical reason; see its own note. Six columns with no offset
 * measures 478px at 1024 and 680px at 1440, and the 484px line still doesn't
 * clear the narrower of those two — 478 against 484, six pixels short. So the
 * title is held at the 2.25rem (36px) it already reaches at `md` all through
 * `lg` (436px against 478px, 42px to spare) rather than let it climb to 40px
 * there, and only steps up to 2.5rem once `xl` opens the column to 602px —
 * 118px to spare, against the six-pixel deficit at `lg`. There is deliberately
 * no `lg:` size in the classes below; that is the hold, not an omission.
 */
export function AboutTeaser() {
  /*
    HERO_IMAGE, and it was going spare. The hero became a looping film, which
    left this — a painter at her easel, brush in hand, a loaded palette beside
    her — exported and referenced by nothing. It is also the photograph this
    section has wanted all along: see the note below.
  */
  const plate = HERO_IMAGE;

  return (
    <section
      aria-labelledby="about-teaser"
      /*
        NO GROUND OF ITS OWN, at the client's ask. It carried White Rock; the
        reference sets this composition on the page's own paper and lets the
        photograph be the only block of colour in it.
      */
      className="py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <Container>
        {/*
          Top-aligned, not bottom. The reference hangs its text from the top of
          the picture and lets the column end wherever it ends — which is what
          makes the two read as one object rather than as two blocks sitting on
          a shared baseline.
        */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-10 lg:items-start lg:gap-x-10">
          <Reveal variant="maskUp" className="col-span-12 lg:col-span-6">
            {/*
              `surface-alt` now the section has no ground of its own: the
              holding colour behind a plate is there so the frame reads as a
              frame before the photograph arrives, and on the page's own paper
              the near-white it used would have been an invisible hole.
            */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-surface-alt">
              {/*
                THE PLATE'S OWN TODO IS RESOLVED BY THIS SWAP.

                It used to carry EXPERIENCE_IMAGES.studio — dried lilies
                against a bare wall — and the note here said plainly that it
                did not show what the heading promises: "a room, a table, and
                time to use them", against a still life with no room, no table
                and nobody using anything. This is a painter at her easel
                mid-brushstroke with her palette beside her, which is the
                heading.

                THE DRIFT IS THE REFERENCE'S OWN MECHANISM. Goodman hangs a
                575px picture in a 518px frame and slides it as the section
                passes; <ParallaxPlate> overscans by 16% and drifts 7.5%, which
                is the same effect by the same means and is already on the site
                for the editorial spreads and the experience index.
              */}
              <ParallaxPlate>
                <Image
                  src={plate.src}
                  alt={plate.alt}
                  fill
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  style={{ objectPosition: plate.position }}
                  className="object-cover"
                />
              </ParallaxPlate>
            </div>
          </Reveal>

          {/*
            AND THE TEXT HOLDS WHILE THE PICTURE GOES PAST.

            This is the half of the reference's motion that was missing. I gave
            the plate its drift and stopped there, and the client was right
            that the section still felt inert — the drift is 82px over a whole
            section, which nobody reads as movement. The thing you actually see
            on their page is the copy standing still while the photograph
            slides up behind it.

            Measured on the reference: the text column computes `position:
            sticky`, tracks the page 1:1 until the section reaches the top of
            the window, then pins — gaining 238px on its own picture before the
            containing block's foot pushes it out and it resumes. The picture
            never pauses.

            ON THE GRID ITEM, NOT INSIDE IT. A grid item's containing block is
            its grid *area*, which is as tall as the row — so a short column in
            a tall row has exactly the travel sticky needs. Put this on the
            <Reveal> inside instead and it would stick within its own box,
            which is its own height, and never move. `self-start` keeps the box
            from stretching to fill the area and taking that travel away;
            `items-start` on the grid already sets it, and it is repeated here
            so moving this block cannot silently break it.

            `lg` only: stacked in one column below that, the picture is above
            the text rather than beside it and there is nothing to hold against.
          */}
          <div className="col-span-12 lg:sticky lg:top-20 lg:col-span-6 lg:col-start-7 lg:self-start">
            <Reveal delay={0.12}>
              <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
                {ABOUT_TEASER.eyebrow}
              </p>
              <h2
                id="about-teaser"
                className="mt-6 text-[1.75rem] font-light uppercase leading-[1.05] tracking-[-0.02em] md:text-[2.25rem] xl:text-[2.5rem]"
              >
                {ABOUT_TEASER.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-7 max-w-[30rem] text-body leading-[1.85] text-text/80">
                {ABOUT_TEASER.body}
              </p>

              {/*
                A FILLED BUTTON, as the reference ends on.

                Goodman closes this composition with a small solid block —
                "Explore the Programme" — rather than a ruled line of type, and
                on a section with no ground of its own it is the only thing
                holding the column down. Deep Lilac with `on-primary`, the same
                control every other primary action on this site uses.

                It also settles a contrast problem the ruled version had, which
                is worth keeping on the record. A link's underline is what
                makes the label read as a link, so it is a graphical object and
                owes 3:1. Swept against White Rock at 40/50/60/70/85/100%:

                  Warm Terracotta .. 1.41  1.53  1.70  1.86  2.12  2.44
                  Deep Lilac ....... 1.64  1.87  2.17  2.52  3.10  3.95
                  Charcoal Slate ... 2.11  2.59  3.30  4.24  6.26  9.36

                Terracotta fails at every opacity — it cannot carry a rule on
                that ground at all, which is worth knowing before it is reached
                for again. A filled control has its own ground and none of this
                applies to it.

                TODO(client): the same terracotta-underline pair is still used
                on the back links at /private-events and /events/[slug]/book.
                Worth one pass across the site rather than separate fixes.
              */}
              <Link
                href="/about"
                className="group mt-9 inline-flex min-h-11 items-center justify-center gap-2.5 rounded-sm bg-primary px-8 py-4 text-action font-medium uppercase leading-none tracking-eyebrow text-on-primary transition-colors duration-300 ease-soft hover:bg-primary/90 md:mt-10"
              >
                {ABOUT_TEASER.cta}
                <span
                  aria-hidden
                  className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
                >
                  &#8594;
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
