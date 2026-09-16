import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { ABOUT_TEASER, EXPERIENCE_IMAGES } from "@/lib/constants";

/**
 * Homepage section 06 — the About teaser.
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
 */
export function AboutTeaser() {
  const plate = EXPERIENCE_IMAGES.studio;

  return (
    <section
      aria-labelledby="about-teaser"
      className="bg-cream py-[4.5rem] md:py-[6rem] lg:py-[7rem]"
    >
      <Container>
        <div className="grid grid-cols-12 items-center gap-x-6 gap-y-10 lg:gap-x-10">
          <Reveal variant="maskUp" className="col-span-12 lg:col-span-6">
            {/*
            `surface`, not `surface-alt`. The holding ground behind a plate is
            there so the frame reads as a frame before the photograph arrives —
            and `surface-alt` IS White Rock, which is now the section's own
            ground, so it would have left an invisible hole during load. The
            near-white sits a shade lighter than the field and reads as a plate.
          */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-surface lg:aspect-[5/4]">
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

          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <Reveal delay={0.12}>
              <p className="text-label font-medium uppercase tracking-eyebrow text-text/75">
                {ABOUT_TEASER.eyebrow}
              </p>
              <h2
                id="about-teaser"
                className="mt-6 text-[1.75rem] font-light uppercase leading-[1.05] tracking-[-0.02em] md:text-[2.25rem] lg:text-[2.5rem]"
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
