import { MaskedText } from "@/components/motion/MaskedText";
import { Reveal } from "@/components/motion/Reveal";
import { HeroVisual } from "@/components/sections/HeroVisual";

/**
 * Shared between the two halves of the wordmark.
 *
 * Set in Qarine — the client-supplied display serif, not the sans used
 * everywhere else on the page — so the brand name reads as a headline rather
 * than as UI type. Qarine's caps already carry generous, flared spacing of
 * their own; the tracking here is a fraction of what the previous sans
 * treatment needed; anything wider starts separating the letter pairs into
 * unrelated marks instead of a word.
 *
 * Sized in viewport width so it reaches the gutter at every width — the
 * wordmark is meant to run the frame, not to sit in the middle of it. The
 * numbers are solved rather than guessed: the type's width is linear in its
 * size, so each was derived from a measured render and then checked against
 * the narrow end of its own breakpoint, where the fit is tightest. One line
 * at `lg`, two below it, which is why the `lg` value is so much smaller.
 *
 * Each is capped against viewport height as well. Without that guard a short
 * window — a phone held in landscape, a laptop with a tall browser chrome —
 * gets a wordmark taller than the hero it sits in. The cap does bite in the
 * tablet range on a short window, where the wordmark is two lines and simply
 * cannot reach the gutter without taking half the frame; there the height
 * wins, and it should.
 */
const WORDMARK =
  "font-wordmark text-[min(21.5vw,20vh)] font-normal uppercase leading-[0.92] tracking-[0.015em] md:text-[min(23.5vw,23vh)] lg:text-[min(12.8vw,26vh)] lg:leading-[0.9]";

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
 * The section is sticky rather than static: it holds at the top of the
 * viewport while the page below rises over it and covers it. That needs a
 * definite height (`h-svh`, not `min-h`) and a wrapper on the page tall
 * enough to give sticky somewhere to travel — see app/page.tsx.
 *
 * Server component. The image field, the video and every animation live in the
 * client components it composes.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="sticky top-0 z-0 isolate -mt-header flex h-svh flex-col justify-end overflow-hidden bg-text [--color-focus:var(--color-cream)] md:-mt-header-lg"
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
        className="relative flex flex-col items-center px-gutter pb-5 text-cream lg:flex-row lg:justify-center lg:gap-[3.2vw] lg:pb-6"
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
        {/*
          Light Sage rather than the cream the rest of the hero is set in —
          the one place the brand colour itself appears over the artwork.
          Taken from the token, not the hex: --color-sage is #d1e7be, and
          re-skinning the palette should carry this with it.
        */}
        <span className="mt-2 block font-display text-[clamp(2.75rem,min(5.6vw,13vh),5rem)] leading-[1.05] tracking-normal text-sage">
          freely
        </span>
      </p>
    </Reveal>
  );
}
