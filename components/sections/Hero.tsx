import { MaskedText } from "@/components/motion/MaskedText";
import { Reveal } from "@/components/motion/Reveal";
import { HeroVisual } from "@/components/sections/HeroVisual";

/**
 * Shared between the two halves of the wordmark.
 *
 * Sized in viewport width so it always reaches for the full width of the
 * frame, but capped against viewport height as well — without that guard a
 * phone held in landscape gets two lines of type taller than the hero itself.
 */
const WORDMARK =
  "text-[min(16.5vw,20vh)] font-light uppercase leading-[0.92] tracking-[0.05em] md:text-[min(11vw,19vh)] lg:text-[min(9.2vw,21vh)] lg:leading-[0.86]";

/**
 * Homepage hero.
 *
 * A triptych filling the viewport — a painting, the wheel turning, the fired
 * object — with the type laid over it rather than beside it. The sequence is
 * the argument: Maison Palettia is a place where things get made, not a shelf
 * of finished pots.
 *
 * Two lines of type and nothing else. The wordmark runs the width of the
 * frame along the foot, the way a title sits under a work in a gallery; the
 * statement is handed to the image field so it stays centred on the one panel
 * that moves, whichever shape that panel takes.
 *
 * Server component. The image field, the video and every animation live in the
 * client components it composes.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate -mt-header flex min-h-svh flex-col justify-end overflow-hidden bg-text [--color-focus:var(--color-cream)] md:-mt-header-lg"
    >
      <HeroVisual className="absolute inset-0" statement={<Statement />} />

      {/*
        Contrast in two soft passes rather than one flat overlay: a wash at the
        head so the navigation keeps its footing over pale clay, and a rise
        from the foot so the wordmark lands on something. Both are far weaker
        than a scrim — the paintwork and the glaze still read through them.
      */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-text/68 via-text/26 to-transparent md:h-52"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-text/80 via-text/30 to-transparent"
      />

      {/* The h1 — the statement over the wheel is supporting copy, not the heading. */}
      <h1
        id="hero-heading"
        className="relative flex flex-col items-center px-5 pb-5 text-cream lg:flex-row lg:justify-center lg:gap-[3.2vw] lg:px-8 lg:pb-6"
      >
        <MaskedText delay={0.5} className={WORDMARK}>
          Maison
        </MaskedText>
        {/*
          An explicit space so the heading's accessible name is "Maison
          Palettia" and not one run-on word — the two halves are block-level,
          which gives no word boundary on its own. A white-space-only child of
          a flex container is never rendered, so the layout is untouched.
        */}{" "}
        <MaskedText delay={0.62} className={WORDMARK}>
          Palettia
        </MaskedText>
      </h1>
    </section>
  );
}

/** "Create freely" — the quiet half of the hero, laid on the wheel. */
function Statement() {
  return (
    <Reveal delay={1.05} variant="fadeIn">
      <p className="text-center text-cream">
        <span className="block text-[clamp(1.05rem,1.7vw,1.6rem)] font-light uppercase leading-none tracking-eyebrow">
          Create
        </span>{" "}
        <span className="mt-2 block font-display text-[clamp(2.75rem,min(5.6vw,13vh),5rem)] leading-[1.05] tracking-normal">
          freely
        </span>
      </p>
    </Reveal>
  );
}
