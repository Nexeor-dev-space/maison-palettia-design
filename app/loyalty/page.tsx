import Link from "next/link";

import { PassOffer } from "@/components/loyalty/PassOffer";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { Container } from "@/components/ui/Container";
import { getPasses, PASSES_CONFIGURED } from "@/lib/passes";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Passes",
  description:
    "Maison Palettia passes — hold your sessions in advance and check out as a guest.",
  path: "/loyalty",
});

const TERM = "text-label font-medium uppercase tracking-eyebrow text-text/75";
/** The numeral above each step. Decorative — the list itself carries the order. */
const STEP_NUMERAL = `${TERM} tabular-nums`;

/**
 * The loyalty page — choose a pass, add it to the booking, check out.
 *
 * A COMMERCIAL PAGE, NOT AN EDITORIAL ONE. The rest of this site earns its
 * space with photography and slow type; this page has one job, which is to get
 * someone from "what is this?" to a pass in the basket. So the introduction is
 * three lines rather than a full-height hero, the offer is the first thing
 * under it, and the explanation of how it works sits *after* the passes — a
 * visitor who already understands should never have to scroll past an
 * explanation to reach the thing being explained.
 *
 * A thin server shell. It awaits the catalogue and hands it down; <PassOffer>
 * is the client half, because the basket lives in the browser. Awaited in
 * place rather than suspended, for the reason set out in <UpcomingEvents>: a
 * boundary would strand a visitor without JavaScript on the fallback.
 */
export default async function LoyaltyPage() {
  const passes = await getPasses();

  return (
    <>
      <Container
        as="section"
        aria-labelledby="passes-heading"
        className="py-[3.5rem] md:py-[5rem] lg:py-[6rem]"
      >
        <Intro />

        <h2
          id="passes-heading"
          className="mt-14 border-t border-line pt-10 text-label font-medium uppercase tracking-eyebrow text-text md:mt-16 md:pt-12"
        >
          Choose your pass
        </h2>

        <PassOffer passes={passes} />

        {/*
          Only while the passes are placeholders. The flag is the switch — see
          lib/passes.ts — so supplying the studio's own terms removes this note
          without anyone having to remember it is here.
        */}
        {!PASSES_CONFIGURED && passes.length > 0 ? (
          <Reveal variant="fadeIn">
            <p className="mt-12 max-w-[42rem] border-l-2 border-terracotta pl-5 text-fine leading-[1.8] text-text/80 md:mt-14">
              Preview passes. Maison Palettia has not set its pass terms yet, so the names,
              prices, session counts and validity above are placeholders put here for review —
              none of them is final, and nothing is charged at checkout.
            </p>
          </Reveal>
        ) : null}
      </Container>

      <HowItWorks />
    </>
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
function Intro() {
  return (
    <Stagger>
      <Reveal>
        <p className="flex items-center gap-4 text-action font-medium uppercase tracking-eyebrow text-text">
          <span aria-hidden className="h-px w-9 shrink-0 bg-primary md:w-12" />
          Loyalty
        </p>
      </Reveal>

      <Reveal variant="subtleReveal">
        <h1 className="mt-8 max-w-[20ch] text-[2rem] font-light leading-[1.1] tracking-[-0.02em] text-text md:mt-10 md:text-[2.6rem] lg:text-[3rem]">
          Come more than once.
        </h1>
      </Reveal>

      <Reveal>
        <p className="mt-6 max-w-[38rem] text-lead leading-[1.75] text-text/80 md:mt-8">
          A pass holds your sessions in advance, so when a date comes round the only decision
          left is what to make. Choose one, add it to your booking, and check out as a guest —
          there is no account to create.
        </p>
      </Reveal>
    </Stagger>
  );
}

/**
 * What actually happens, in four steps.
 *
 * Each one describes something the site really does today. Nothing here
 * promises a balance to check, a card to carry, a discount, or a session that
 * books itself — none of which exists — and the fourth step says what the
 * checkout already says rather than a better-sounding version of it.
 *
 * A band of its own on the White Rock ground, so it reads as a footnote to the
 * offer rather than as another part of it.
 */
function HowItWorks() {
  const steps = [
    {
      number: "01",
      name: "Choose your pass",
      detail: "Three sizes of the same thing. Take the one that matches how often you will come.",
    },
    {
      number: "02",
      name: "Add it to your booking",
      detail: "It joins the same basket as any session, alongside anything already held there.",
    },
    {
      number: "03",
      name: "Check out as a guest",
      detail: "A name, an email and a number to reach you on. No account, here or later.",
    },
    {
      number: "04",
      name: "Keep your reference",
      detail: "The Maison confirms your pass directly, and the reference is how you look it up.",
    },
  ] as const;

  return (
    <section aria-labelledby="how-it-works" className="bg-cream py-[3.5rem] md:py-[4.5rem]">
      <Container>
        <Reveal variant="fadeIn">
          <h2 id="how-it-works" className={TERM}>
            How it works
          </h2>
        </Reveal>

        <ol className="mt-9 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.number} variant="fadeIn" delay={i * 0.05}>
              <p className={STEP_NUMERAL}>
                <span aria-hidden>{step.number}</span>
              </p>
              <h3 className="mt-3 text-body font-medium leading-snug text-text">{step.name}</h3>
              <p className="mt-2.5 text-fine leading-[1.8] text-text/80">{step.detail}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal variant="fadeIn">
          <p className="mt-10 text-fine leading-[1.8] text-text/80 md:mt-12">
            Already holding something?{" "}
            <Link
              href="/checkout"
              className="border-b border-text/40 pb-0.5 transition-colors duration-300 ease-soft hover:border-text"
            >
              Go to your booking
            </Link>
            , or{" "}
            <Link
              href="/events"
              className="border-b border-text/40 pb-0.5 transition-colors duration-300 ease-soft hover:border-text"
            >
              see what is on
            </Link>
            .
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
