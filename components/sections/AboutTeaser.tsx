import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { ABOUT_TEASER, EXPERIENCE_IMAGES } from "@/lib/constants";

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
  const plate = EXPERIENCE_IMAGES.studio;

  return (
    <section
      aria-labelledby="about-teaser"
      className="bg-cream py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-10 lg:items-end lg:gap-x-10">
          <Reveal variant="maskUp" className="col-span-12 lg:col-span-6">
            {/*
            `surface`, not `surface-alt`. The holding ground behind a plate is
            there so the frame reads as a frame before the photograph arrives —
            and `surface-alt` IS White Rock, which is now the section's own
            ground, so it would have left an invisible hole during load. The
            near-white sits a shade lighter than the field and reads as a plate.
          */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-surface">
              {/*
                TODO(client): `plate` is EXPERIENCE_IMAGES.studio — dried lilies
                against a bare wall — and it does not show what the heading
                promises. The heading is "a room, a table, and time to use
                them"; the photograph is a still life, with no room, no table
                and no one using anything in it. The project's other two
                captioned plates (`.painting`, `.pigment`) are the same kind of
                shot at the same close distance — paint on paper, not a space
                or a session — so reaching for either one would trade this
                mismatch for an identical one rather than fix it, which is why
                neither is swapped in here. What this frame actually needs is a
                wide, environmental photograph of a real session — the table
                laid with materials, the room it sits in — and nothing at that
                distance exists in this project's image library yet. Left on
                the plate already wired to this section until the studio
                supplies one.
              */}
              <Image
                src={plate.src}
                alt={plate.alt}
                fill
                sizes="(min-width: 1024px) 48vw, 100vw"
                style={{ objectPosition: plate.position }}
                className="object-cover"
              />
            </div>
          </Reveal>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
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
                THE MARKING IS LILAC HERE, NOT TERRACOTTA, AND IT IS THE GROUND
                THAT DECIDES THAT.

                A link's underline is what makes the label read as a link
                rather than as a caption, so it is a graphical object and owes
                3:1. Swept against White Rock at 40/50/60/70/85/100%:

                  Warm Terracotta .. 1.41  1.53  1.70  1.86  2.12  2.44
                  Deep Lilac ....... 1.64  1.87  2.17  2.52  3.10  3.95
                  Charcoal Slate ... 2.11  2.59  3.30  4.24  6.26  9.36

                Terracotta fails at every opacity — it cannot carry a rule on
                this ground at all, which is worth knowing before it is reached
                for again. Lilac clears only at full strength, and that is what
                this uses: /50 was the first attempt here and measured 1.87, so
                the tint that looked like restraint was simply a rule nobody
                could see. Hover goes to the label's own ink at 9.36, so the
                state change is unmistakable in both directions.

                The arrow went with it. At 12px terracotta it measured 2.44:1,
                and while it is `aria-hidden` and adds nothing the label does
                not already say, a glyph that washes out beside crisp type
                reads as a rendering fault rather than as restraint. In the
                label's own ink it is 9.36:1 and the control reads as one
                object.

                TODO(client): the same terracotta-underline pair is used on the
                back links at /private-events and /events/[slug]/book, where it
                sits on the page off-white and measures no better. Worth one
                pass across the site rather than four separate fixes.
              */}
              <Link
                href="/about"
                className="group mt-9 inline-flex items-center gap-3 -my-1.5 py-1.5 text-action font-medium uppercase tracking-eyebrow text-text"
              >
                <span className="border-b border-primary pb-1.5 transition-colors duration-300 ease-soft group-hover:border-text">
                  {ABOUT_TEASER.cta}
                </span>
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
