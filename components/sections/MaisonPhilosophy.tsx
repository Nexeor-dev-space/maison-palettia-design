import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { MAISON_PHILOSOPHY } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The statement's type. Sized per breakpoint rather than with one viewport
 * clamp: the two lines sit in different column spans, and "FELT DEEPLY." —
 * the wider of them, and the one that steps across the measure — is what sets
 * the ceiling. It has to hold on one line at every width.
 */
const STATEMENT =
  "block font-light uppercase leading-[0.95] tracking-[-0.02em] text-cream " +
  "text-[2.35rem] xs:text-[2.6rem] sm:text-[3.25rem] md:text-[3.5rem] lg:text-[3.75rem] xl:text-[5rem]";

/**
 * Homepage section 08 — the Maison philosophy.
 *
 * A pause, and the one place on the page where Deep Lilac is the ground
 * rather than an accent. Everything before it has been showing things: what is
 * on, what it feels like, what has just arrived. This one stops showing and
 * says why the place exists, in two lines and one paragraph, on an empty
 * field of the brand colour.
 *
 * It gets the lilac because it is the only section that can carry it. There is
 * no photography here to fight the saturation, and nothing to buy — so the
 * colour is doing what the brand asks of it, marking the page's one major
 * touchpoint instead of tinting a surface. Everything else on the homepage is
 * warm neutral or sage, which is what makes this field land when it arrives.
 *
 * The composition is a step. The first line of the statement starts at the
 * left edge of the measure; the second crosses to column five and everything
 * after it — the paragraph, the signature — hangs from that same line. So the
 * eye reads down and to the right on a diagonal, and the section still has
 * only two vertical edges, which is what keeps the emptiness around them
 * reading as intended rather than as a gap someone forgot to fill.
 *
 * No photograph. The brief allows one; the section is stronger without,
 * because the silence is the point and an image would fill it.
 *
 * Ink is inverted throughout, and split in two because this ground does not
 * take one pale colour for everything. The statement is White Rock, which is
 * the warmer of the two and measures 3.95:1 — ample for display type, which
 * owes 3:1, and the reason the section reads warm rather than stark. Every
 * other piece of text is the off-white at 4.98:1, because at body size the
 * bar is 4.5:1 and White Rock does not reach it. No alpha anywhere below
 * those: dropping either ink to 90% takes it under.
 *
 * The masthead rule is Light Sage — Deep Lilac and Light Sage is the Maison's
 * own pairing, off its packaging, and at full strength the rule clears the 3:1
 * a graphical mark owes. The section also declares its own `--color-focus`,
 * since the default ring is Deep Lilac and would be invisible here.
 *
 * Server component; every animation lives in the client components it
 * composes.
 */
export function MaisonPhilosophy() {
  const { eyebrow, title, description, accent } = MAISON_PHILOSOPHY;

  return (
    <section
      aria-labelledby="philosophy-heading"
      className={cn(
        "bg-primary text-surface py-[6.5rem] md:py-section-lg lg:py-[12rem]",
        // Lilac on lilac would vanish; the ring takes the section's own ink.
        "[--color-focus:var(--color-cream)]",
      )}
    >
      <Container>
        {/*
          The same masthead the experience section uses: a rule across the
          full measure, stating where the grid starts and finishes before any
          content does.
        */}
        <Reveal>
          <p className="border-t border-sage/70 pt-5 text-xs font-medium uppercase tracking-eyebrow text-surface">
            {eyebrow}
          </p>
        </Reveal>

        {/*
          The statement. A grid rather than two stacked lines, so the step
          lands on a real column line instead of on a percentage that happens
          to look close.
        */}
        <h2
          id="philosophy-heading"
          className="mt-20 grid grid-cols-12 gap-x-6 md:mt-28 lg:mt-36 lg:gap-x-10"
        >
          <StatementLine className="col-span-12 lg:col-span-7">{title[0]}</StatementLine>
          {/*
            An explicit space so the accessible name reads "Made slowly. Felt
            deeply." and not one run-on line — the two halves are block-level,
            which gives no word boundary on its own. A white-space-only child
            of a grid container is never rendered, so the layout is untouched.
          */}{" "}
          <StatementLine
            delay={0.12}
            className="col-span-12 -mt-[0.12em] lg:col-span-8 lg:col-start-5"
          >
            {title[1]}
          </StatementLine>
        </h2>

        {/* The story, hanging from the line the statement stepped to. */}
        <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10">
          <div className="col-span-12 mt-16 md:mt-20 lg:col-span-6 lg:col-start-5 lg:mt-24">
            <Reveal delay={0.28}>
              <p className="max-w-[30rem] text-[0.95rem] leading-[1.85] text-surface md:text-base">
                {description}
              </p>
            </Reveal>

            {/*
              The section's one flourish, and it arrives last — set under the
              paragraph rather than over it.

              Not the script face, though it was once. The script is the
              brand's rarest gesture and it had drifted into every section on
              the homepage, which is the one thing that can stop it feeling
              special; it now appears three times on the page and this is not
              one of them. What replaces it is Light Sage on Deep Lilac — the
              Maison's own pairing, off the paper bags — set wide enough to
              read as a hand-lettered sign rather than as a label.
            */}
            <Reveal variant="fadeIn" delay={0.45}>
              <Signature ground="lilac" className="mt-10 md:mt-12">
                {accent}
              </Signature>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * One line of the statement, rising from behind its own mask.
 *
 * The mask needs an overflow parent of its own, which is also the grid item —
 * so the column span is set here rather than on the moving element inside.
 */
function StatementLine({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    // The padding keeps descenders off the mask edge.
    <span className={cn("block overflow-hidden pb-[0.12em]", className)}>
      <Reveal as="span" variant="maskUp" delay={delay} className={STATEMENT}>
        {children}
      </Reveal>
    </span>
  );
}
