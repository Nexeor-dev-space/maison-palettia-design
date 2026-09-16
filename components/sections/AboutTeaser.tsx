import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { RuledLink } from "@/components/ui/Action";
import { Section } from "@/components/ui/Section";
import { ABOUT_TEASER, EXPERIENCE_IMAGES } from "@/lib/constants";

/**
 * Homepage section 05 — the About teaser.
 *
 * A doorway, not a second About page. /about renders this exact paragraph in
 * full; the homepage's only job is to say a story exists and point at where
 * it is told. Kept deliberately small — anything with more weight than a
 * photograph and three lines would argue the Maison's case twice.
 *
 * THE COMPOSITION is the reference's EXHIBITIONS AND FAIRS pattern (see
 * BRIEF.md 4b), inverted and quieted so it rhymes with the strand index
 * above rather than repeating it. EXHIBITIONS runs a compact text block
 * top-left against a large image right, stacked as a list, with the empty
 * space living BELOW each entry's text. Here there is a single "entry": the
 * photograph moves to the left, and the empty space moves ABOVE the text
 * instead of below it — the eyebrow, title, paragraph and link sit low,
 * against the foot of the row, rather than centred against the photograph
 * the way this section read before. Ground is White Rock: the page's first
 * warm field, landing as a breath after three `surface` sections in a row.
 *
 * WHY THE HEADING IS HAND-SET RATHER THAN A LITERAL <SectionHead>, even
 * though it carries the exact `text-h2` token that primitive is built on.
 * <SectionHead> assumes it owns the section's full measure: with no side
 * content, its own title cell is still `md:col-span-8` of ITS OWN 12
 * columns, each separated by the same 40px (`gap-x-10`) the page grid uses.
 * This row's text half only ever gets roughly half the container — at 1024
 * (inside `lg`, and one of this brief's own definition-of-done widths) that
 * half is ~386px, and <SectionHead>'s 11 internal gaps alone already total
 * 440px: there is no positive width left for a title to sit in at all. Even
 * at 1440 the half is ~552px and the resulting title cell computes to
 * ~355px — and `text-h2` is already resting at its 36px ceiling by ~747px
 * wide, so this is not a narrow-viewport edge case, it holds everywhere this
 * two-column row is active. A two-line, uppercase, letter-spaced heading
 * wants more room than that to trust, and a title that wraps to three lines
 * here stops being the authored pair it was written as. So this sets the
 * same classes <SectionHead> would apply — `text-h2 font-light uppercase
 * tracking-[-0.02em]` for the title, its eyebrow rule and its staggered
 * reveal sequence for the label — inside this section's own two-column
 * grid, rather than nesting the primitive's full-width grid inside a
 * half-width column it was never sized for. The token travels; the
 * component's layout assumptions do not fit this shape and are left behind.
 * (Incidental benefit: `ABOUT_TEASER.title` is a readonly tuple and
 * <SectionHead>'s `title` prop wants a mutable `string[]` — hand-setting it
 * also sidesteps a spread-to-satisfy-the-type.)
 *
 * The photograph uses `imageReveal` — the slow scale-settle the strand index
 * uses for its own plates — rather than the `maskUp` this section reached
 * for before: `maskUp` slides type out from behind a mask that clips it, and
 * the aspect-ratio box below already is that clip, which is exactly what
 * `imageReveal` is for.
 */
export function AboutTeaser() {
  /*
    TODO(client): this plate is a still life of lilies, and the heading it
    sits beside promises "a room, a table" — a place, not a bouquet. It is
    not being swapped: EXPERIENCE_IMAGES.studio is already the project's
    stand-in for "the studio" because there is no photograph of the studio
    itself (see that constant's own doc comment in lib/constants.ts), and
    every other atmospheric plate in the project already carries a job
    further down this same page — the gallery, the strand index, the
    editorial panels. What this section actually wants is a real corner of a
    session in progress: a table laid out with materials and a couple of
    chairs pulled in, shot wide enough to read as a room as well as a table,
    calm enough (no faces required) to sit beside this little text. Until
    that exists, this stays the lilies rather than repeating a plate this
    page has already spent.
  */
  const plate = EXPERIENCE_IMAGES.studio;

  return (
    <Section id="about-teaser" ground="cream">
      <div className="grid grid-cols-12 gap-x-6 gap-y-10 lg:gap-x-10">
        <div className="col-span-12 lg:col-span-6">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-text/5">
            <Reveal variant="imageReveal" className="absolute inset-0">
              <Image
                src={plate.src}
                alt={plate.alt}
                fill
                sizes="(min-width: 1024px) 48vw, 100vw"
                style={{ objectPosition: plate.position }}
                className="object-cover"
              />
            </Reveal>
          </div>
        </div>

        {/*
          `justify-end` only does anything from `lg`: that is where this item
          shares a grid row with the photograph and CSS Grid's default
          `align-items: stretch` gives it that row's full height to sit
          within. Below `lg` the two stack in document order, each sized to
          its own content, and there is no extra height for `justify-end` to
          push against — "anchored low" is a large-screen reading of the
          row, not a phone one.
        */}
        <div className="col-span-12 flex flex-col justify-end lg:col-span-5 lg:col-start-8">
          <Stagger>
            <Reveal>
              <p className="flex items-center gap-4 text-label font-medium uppercase tracking-eyebrow text-text">
                <span aria-hidden className="h-px w-9 shrink-0 bg-primary md:w-12" />
                {ABOUT_TEASER.eyebrow}
              </p>
            </Reveal>

            <Reveal className="mt-7">
              <h2
                id="about-teaser"
                className="text-h2 font-light uppercase tracking-[-0.02em] text-text"
              >
                {ABOUT_TEASER.title.map((line, i) => (
                  <span key={line} className="inline md:block">
                    {/*
                      An explicit space, only doing anything while the lines
                      run inline below `md`: they are block-level from `md`
                      up and give no word boundary of their own, so without
                      it the accessible name reads as one run-on word. The
                      same correction <SectionHead> makes for an authored
                      title, kept here for the identical reason.
                    */}
                    {i > 0 ? " " : null}
                    {line}
                  </span>
                ))}
              </h2>
            </Reveal>

            <Reveal className="mt-6">
              <p className="max-w-[26rem] text-body leading-[1.85] text-text/80">
                {ABOUT_TEASER.body}
              </p>
              <RuledLink label={ABOUT_TEASER.cta} href="/about" className="mt-9" />
            </Reveal>
          </Stagger>
        </div>
      </div>
    </Section>
  );
}
