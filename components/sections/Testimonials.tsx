import { Reveal } from "@/components/motion/Reveal";
import { HeroVideo } from "@/components/sections/HeroVideo";
import { TestimonialPanel } from "@/components/sections/TestimonialPanel";
import { Container } from "@/components/ui/Container";
import { TESTIMONIALS_GROUND } from "@/lib/constants";
import { getTestimonials } from "@/lib/testimonials";

/**
 * Homepage section — in their words.
 *
 * The studio at the width of the window — running — with a plate of paper laid
 * on it.
 *
 * It is the only section on the page built as a panel over a photograph, and
 * that is the point of it: everywhere else the words sit on the page's own
 * ground and the pictures sit beside them. Here someone else is talking, so
 * what they said is set on its own sheet and put down on top of the room they
 * are talking about. The device is borrowed from objectandarchive.com, where a
 * card of type floats on a full-bleed painting; what it holds is different,
 * and so is the ground under it — a working studio rather than a still life,
 * because a quote about making something should sit on the making, and here
 * the making is actually happening rather than being remembered.
 *
 * Distinct from <EditorialStatement>, which is the page's other full-bleed
 * artwork, and deliberately its opposite. There the caption is laid directly
 * on the picture with nothing behind it, because the artwork is the content.
 * Here the picture is the setting and the sheet is the content, so the sheet
 * is opaque and holds its own edges.
 *
 * The plate takes a ground rather than a shadow. The one shadow token this
 * site has is reserved for something that genuinely floats — the mobile
 * navigation — and a sheet of paper on a table is not lifted off it.
 *
 * No heading beyond the label. The quote is the largest type in the panel,
 * which is the correct order: a section of testimonials that opens with a
 * headline is a section about itself.
 *
 * Server component. The footage and the quotes are both client components;
 * see <HeroVideo> and <TestimonialPanel>.
 */
export async function Testimonials() {
  const testimonials = await getTestimonials();

  // Nothing to show is a supported state, not an empty shell. See the note at
  // the head of lib/testimonials.ts on why this matters more here than
  // anywhere else on the page.
  if (testimonials.length === 0) return null;

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative isolate flex min-h-[max(36rem,78svh)] items-center overflow-hidden bg-text py-20 md:min-h-[80vh] md:py-24 lg:min-h-[84vh]"
    >
      {/*
        The room, running. Held at the back of the section's own stacking
        context, so the plate above it never needs a z-index of its own.

        <HeroVideo> rather than a bare <video>: it is the component that knows
        how to treat footage as scenery instead of as a media player — muted,
        looping, no controls, out of the tab order, with the retry that covers
        a browser refusing to start it unprompted, and stopped outright for a
        reader who has asked for reduced motion, where the poster stands in as
        the photograph this section used to carry.
      */}
      <Reveal variant="imageReveal" className="absolute inset-0 -z-10">
        <HeroVideo
          src={TESTIMONIALS_GROUND.src}
          label={TESTIMONIALS_GROUND.alt}
          position={TESTIMONIALS_GROUND.position}
          poster={TESTIMONIALS_GROUND.poster}
        />
      </Reveal>

      {/*
        A wash rather than a scrim. The plate is opaque and does not need the
        picture darkened to be legible — this is here so the two read as
        foreground and background rather than as two bright things competing,
        and it is weak enough that the clay, the brick and the glazed cups all
        still come through.
      */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-text/35" />

      <Container>
        {/*
          Centred, and the only centred composition on the page. Every other
          section is a spread or a staircase; a sheet laid on a table is
          square to it, and the symmetry is what marks this as the page
          pausing to let someone else speak.
        */}
        <Reveal className="mx-auto w-full max-w-[46rem]">
          <div className="bg-surface px-7 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16">
            <h2
              id="testimonials-heading"
              className="flex items-center gap-4 text-xs font-medium uppercase tracking-eyebrow text-text"
            >
              <span aria-hidden className="h-px w-9 shrink-0 bg-terracotta md:w-12" />
              In their words
            </h2>

            <div className="mt-9 md:mt-11">
              <TestimonialPanel testimonials={testimonials} />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
