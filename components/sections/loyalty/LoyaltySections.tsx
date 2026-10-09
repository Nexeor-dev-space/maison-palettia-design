import Link from "next/link";

import { PassOffer } from "@/components/loyalty/PassOffer";
import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes } from "@/components/motion/SectionShapes";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import type { Pass } from "@/types";

/**
 * ==========================================================================
 * /loyalty's two sections — the offer, then how it works
 * ==========================================================================
 *
 * The `passesList` and `steps` blocks (SPEC §E.1), moved here from
 * app/(site)/loyalty/page.tsx when the page became CMS blocks. The words
 * arrive as props and default to the launch wording; <PassOffer> (the
 * client half, because the basket lives in the browser) stays in
 * components/loyalty/ and keeps its own labels until Phase 3 wires them.
 *
 * A COMMERCIAL PAGE, NOT AN EDITORIAL ONE. The rest of this site earns its
 * space with photography and slow type; this page has one job, which is to get
 * someone from "what is this?" to a pass in the basket. So the introduction is
 * three lines rather than a full-height hero, the offer is the first thing
 * under it, and the explanation of how it works sits *after* the passes — a
 * visitor who already understands should never have to scroll past an
 * explanation to reach the thing being explained.
 */

const TERM = "text-label font-medium uppercase tracking-eyebrow text-text/75";
/** The numeral above each step. Decorative — the list itself carries the order. */
const STEP_NUMERAL = `${TERM} tabular-nums`;

type Action = { label: string; href: string };

export interface PassesWords {
  eyebrow?: string | null;
  heading?: string;
  lead?: string | null;
  listHeading?: string | null;
  previewDisclaimer?: string | null;
}

export function PassesSection({
  passes,
  showDisclaimer,
  eyebrow = "Loyalty",
  heading = "Come More Than Once.",
  lead = "A pass holds your sessions in advance, so when a date comes round the only decision left is what to make. Choose one, add it to your booking, and check out as a guest. There is no account to create.",
  listHeading = "Choose Your Pass",
  previewDisclaimer = "Preview passes. Maison Palettia has not set its pass terms yet, so the names, prices, session counts and validity above are placeholders put here for review. None of them is final, and nothing is charged at checkout.",
}: PassesWords & {
  passes: Pass[];
  /** While the passes are placeholders (lib/passes.ts `PASSES_CONFIGURED`). */
  showDisclaimer: boolean;
}) {
  return (
    <Container
      as="section"
      aria-labelledby="passes-heading"
      className="relative isolate overflow-clip py-[3.5rem] md:py-[5rem] lg:py-[6rem]"
    >
      <SectionShapes plan={groundShapes("sage")} />
      <Intro eyebrow={eyebrow} heading={heading} lead={lead} />

      <h2
        id="passes-heading"
        className="mt-14 border-t border-line pt-10 text-label font-medium uppercase tracking-eyebrow text-text md:mt-16 md:pt-12"
      >
        {listHeading}
      </h2>

      <PassOffer passes={passes} />

      {/*
        Only while the passes are placeholders. The flag is the switch — see
        lib/passes.ts — so supplying the studio's own terms removes this note
        without anyone having to remember it is here.
      */}
      {showDisclaimer && passes.length > 0 && previewDisclaimer ? (
        <Reveal variant="fadeIn">
          <p className="mt-12 max-w-[42rem] border-l-2 border-terracotta pl-5 text-fine leading-[1.8] text-text/80 md:mt-14">
            {previewDisclaimer}
          </p>
        </Reveal>
      ) : null}
    </Container>
  );
}

/**
 * Three lines and no more.
 *
 * The label, the invitation and one paragraph that states the whole
 * transaction — what a pass is for, and the three steps to owning one. If a
 * visitor reads nothing else on this page they have still been told how it
 * works and what to do next.
 */
function Intro({ eyebrow, heading, lead }: { eyebrow: string | null; heading: string; lead: string | null }) {
  return (
    <Stagger>
      {eyebrow ? (
        <Reveal>
          <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
            <span aria-hidden className="h-px w-9 shrink-0 bg-primary md:w-12" />
            {eyebrow}
          </p>
        </Reveal>
      ) : null}

      <Reveal variant="subtleReveal">
        {/* The page-title treatment the other fifteen pages use. This was
            `text-h1 font-light` — Montserrat at 52px and weight 300 — the only
            page title on the site not set in the script. */}
        <h1 className="heading-script mt-8 max-w-[20ch] pb-[0.3em] text-script-section text-text md:mt-10">
          {heading}
        </h1>
      </Reveal>

      {lead ? (
        <Reveal>
          <p className="mt-6 max-w-[38rem] text-lead text-text/80 md:mt-8">{lead}</p>
        </Reveal>
      ) : null}
    </Stagger>
  );
}

/** The four loyalty steps, as the page shipped them. */
export const LOYALTY_STEPS: readonly { title: string; detail: string }[] = [
  {
    title: "Choose Your Pass",
    detail: "Three sizes of the same thing. Take the one that matches how often you will come.",
  },
  {
    title: "Add It to Your Booking",
    detail: "It joins the same basket as any session, alongside anything already held there.",
  },
  {
    title: "Check Out as a Guest",
    detail: "A name, an email and a number to reach you on. No account, here or later.",
  },
  {
    title: "Keep Your Reference",
    detail: "The Maison confirms your pass directly, and the reference is how you look it up.",
  },
];

/**
 * The sentence under the steps, with its two links — `passesList`'s
 * `footerBefore` / `footerFirstLink` / `footerBetween` / `footerSecondLink`
 * / `footerAfter`, kept as five fields so an editor cannot break a link
 * by retyping the sentence around it.
 */
export interface StepsFooter {
  before: string;
  first: Action | null;
  between: string;
  second: Action | null;
  after: string;
}

export const LOYALTY_FOOTER: StepsFooter = {
  before: "Already holding something? ",
  first: { label: "Go to your booking", href: "/checkout" },
  between: ", or ",
  second: { label: "see what is on", href: "/events" },
  after: ".",
};

const FOOTER_LINK =
  "border-b border-text/40 pb-0.5 transition-colors duration-300 ease-soft hover:border-text";

/**
 * What actually happens, in four steps — the `steps` block in its `list`
 * variant.
 *
 * Each one describes something the site really does today. Nothing here
 * promises a balance to check, a card to carry, a discount, or a session that
 * books itself — none of which exists — and the fourth step says what the
 * checkout already says rather than a better-sounding version of it.
 *
 * A band of its own on the White Rock ground, so it reads as a footnote to the
 * offer rather than as another part of it.
 */
export function StepsList({
  eyebrow = "How it works",
  steps = LOYALTY_STEPS,
  footer = LOYALTY_FOOTER,
}: {
  eyebrow?: string | null;
  steps?: readonly { title: string; detail?: string | null }[];
  footer?: StepsFooter | null;
} = {}) {
  return (
    <section aria-labelledby="how-it-works" className="relative isolate overflow-clip bg-cream py-[3.5rem] md:py-[4.5rem]">
      <SectionShapes plan={groundShapes("cream")} />
      <Container>
        {eyebrow ? (
          <Reveal variant="fadeIn">
            <h2 id="how-it-works" className={TERM}>
              {eyebrow}
            </h2>
          </Reveal>
        ) : null}

        <ol className="mt-9 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12">
          {steps.map((step, i) => {
            const number = String(i + 1).padStart(2, "0");
            return (
              <Reveal as="li" key={number} variant="fadeIn" delay={i * 0.05}>
                <p className={STEP_NUMERAL}>
                  <span aria-hidden>{number}</span>
                </p>
                <h3 className="mt-3 text-body font-medium leading-snug text-text">{step.title}</h3>
                {step.detail ? <p className="mt-2.5 text-fine leading-[1.8] text-text/80">{step.detail}</p> : null}
              </Reveal>
            );
          })}
        </ol>

        {footer ? (
          <Reveal variant="fadeIn">
            {/* `body`, not `fine`. This is a sentence a visitor reads, not a
                caption — it was the only paragraph on /loyalty set at 14px. */}
            <p className="mt-10 text-body text-text/80 md:mt-12">
              {footer.before}
              {footer.first ? (
                <Link href={footer.first.href} className={FOOTER_LINK}>
                  {footer.first.label}
                </Link>
              ) : null}
              {footer.between}
              {footer.second ? (
                <Link href={footer.second.href} className={FOOTER_LINK}>
                  {footer.second.label}
                </Link>
              ) : null}
              {footer.after}
            </p>
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}
