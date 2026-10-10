import { Fragment } from "react";

import { groundShapes } from "@/components/motion/groundShapes";
import { Reveal } from "@/components/motion/Reveal";
import { SectionShapes, type ShapePlan } from "@/components/motion/SectionShapes";
import { Stagger } from "@/components/motion/Stagger";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { PeelNote } from "@/components/ui/PeelNote";
import { DisplayHeading, forScript } from "@/components/ui/SectionHeader";
import { CLOSING } from "@/lib/brand";

/**
 * ==========================================================================
 * THE DEEP LILAC CLOSE — one component, the six ways the site sets it
 * ==========================================================================
 *
 * Six pages end on the brand's one saturated field: /about, /gallery, /faq,
 * /policies, /private-events and /contact. They were six hand-written
 * sections, and the CMS sees them as one block (`closingCtaLilac`, SPEC
 * §E.1): an optional eyebrow, a heading in lines, a sentence and up to two
 * buttons. The six compositions are NOT the same, though — each was tuned
 * for its own page (a centred stack, a two-column masthead, a single
 * button, a script heading set whole) — and the parity gate holds every
 * page to what it was. So the block's words go into the composition its
 * page has always had, chosen by `variant`, which the adapter
 * (components/blocks/ClosingCtaLilac.tsx) takes from the page's slug. A new
 * landing page gets `about`'s, the house close.
 *
 * Each variant below is its page's section moved here unchanged except that
 * the words arrive as props; the note that explained each choice moved with
 * it. A slot a variant never had (an eyebrow on the /faq close) is printed
 * only when an editor fills it, in the label style the /contact close uses.
 */

export type ClosingVariant = "about" | "gallery" | "faq" | "policies" | "privateEvents" | "contact";

export type ClosingAction = { label: string; href: string };

export interface ClosingCtaProps {
  variant: ClosingVariant;
  eyebrow?: string | null;
  lines: readonly string[];
  body?: string | null;
  primary?: ClosingAction | null;
  secondary?: ClosingAction | null;
}

/**
 * What each page's close said before the CMS — the launch wording, used when
 * the page has no stored document yet (components/blocks/layouts.ts). The
 * seed writes the same words into each page's block.
 */
export const CLOSING_LAUNCH: Record<ClosingVariant, Omit<ClosingCtaProps, "variant">> = {
  about: {
    lines: [CLOSING.heading],
    body: CLOSING.body,
    primary: { label: "Explore experiences", href: "/events" },
    secondary: { label: "Plan a private event", href: "/private-events" },
  },
  gallery: {
    lines: ["Ready to make", "something of your own?"],
    body: "Pick an activity, bring your people, or come on your own.",
    primary: { label: "Explore experiences", href: "/events" },
    secondary: { label: "Plan a private event", href: "/private-events" },
  },
  faq: {
    lines: ["Still", "Wondering?"],
    body: "Just ask us. We\u2019re always happy to help you get creating.",
    primary: { label: "Ask the Maison", href: "/contact" },
  },
  policies: {
    lines: ["Something", "Unclear?"],
    body: "Ask before you book. We would rather answer a question twice than have you find out on the day.",
    primary: { label: "Ask the Maison", href: "/contact" },
  },
  privateEvents: {
    lines: ["Let's Make", "Something Together."],
    body: "Have something in mind? Tell us when, who\u2019s coming and what you\u2019d like to make. We\u2019ll help turn the idea into an experience made for your group.",
    primary: { label: "Plan a private event", href: "/private-events/book" },
  },
  contact: {
    eyebrow: "Looking for an event?",
    lines: ["The Programme,", "Date by Date."],
    body: "Every event lists its venue, its times and what you will make. If you already know what you are after, it is quicker than writing to us.",
    primary: { label: "Explore upcoming events", href: "/events" },
  },
};

/*
  On Deep Lilac only White Rock (3.95:1) and Light Sage (3.83) clear the 3:1 a
  decorative mark owes — Charcoal is 2.37 and Soft Lavender 2.74, so neither
  appears here.
*/
const LILAC_SHAPES: readonly ShapePlan[] = groundShapes("lilac");

/** The /contact label, borrowed by any variant whose page never had an eyebrow. */
function Label({ children, className = "" }: { children: string; className?: string }) {
  return (
    <p className={`text-label font-medium uppercase tracking-eyebrow text-surface/85 ${className}`}>{children}</p>
  );
}

export function ClosingCta(props: ClosingCtaProps) {
  switch (props.variant) {
    case "gallery":
      return <GalleryClose {...props} />;
    case "faq":
      return <FaqClose {...props} />;
    case "policies":
      return <PoliciesClose {...props} />;
    case "privateEvents":
      return <PrivateEventsClose {...props} />;
    case "contact":
      return <ContactClose {...props} />;
    default:
      return <AboutClose {...props} />;
  }
}

/* ---- /about ------------------------------------------------------------- */

/**
 * The deck's closing line, on a Deep Lilac field.
 *
 * The one full field of colour on the page, and it is at the end on purpose:
 * the page has been Light Sage paper with two objects on it, so the last beat
 * being entirely a colour is what makes it read as a close rather than as
 * another section. The homepage closes on the same words over its own paper,
 * which is the point — same sentence, same brand, different ending.
 *
 * The heading is ONE script line wrapped by its measure (`max-w-[16ch]`), not
 * hand-broken lines, so the stored lines are joined back into the sentence.
 */
function AboutClose({ eyebrow, lines, body, primary, secondary }: ClosingCtaProps) {
  return (
    <section aria-labelledby="about-close" className="relative isolate overflow-hidden bg-primary">
      <SectionShapes plan={LILAC_SHAPES} />
      <Container className="relative py-[5rem] text-center md:py-section lg:py-[7rem]">
        {/* Soft Lavender and White Rock only: on Deep Lilac, terracotta is
            2.0:1 and the lilac marks disappear into the ground entirely. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[6%] top-10 deco-mark w-[5rem] rotate-[-10deg]"
        >
          <DoodleMark name="starburst" color={INK.lavender} treatment="draw" delay={300} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-10 right-[7%] deco-mark w-[4.5rem] rotate-[8deg]"
        >
          <DoodleMark name="splash" color={INK.whiteRock} treatment="draw" delay={420} />
        </span>

        {eyebrow ? (
          <Reveal>
            <Label className="mb-6">{eyebrow}</Label>
          </Reveal>
        ) : null}

        <Reveal>
          <h2
            id="about-close"
            className="heading-script mx-auto max-w-[16ch] pb-[0.3em] text-script-section text-surface"
          >
            {forScript(lines.join(" "))}
          </h2>
        </Reveal>

        {body ? (
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-[34ch] text-lead text-surface">{body}</p>
          </Reveal>
        ) : null}

        {primary || secondary ? (
          <Reveal delay={0.16}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
              {/* `cream` is the tone for a button standing ON Deep Lilac — a
                  lilac one cannot be seen at all. See <BlobButton>. */}
              {primary ? (
                <BlobButton href={primary.href} tone="cream" className="min-h-[3.25rem] px-8">
                  {primary.label}
                </BlobButton>
              ) : null}

              {/* The sticky note, as in the homepage banner — see <PeelNote>. */}
              {secondary ? (
                <PeelNote href={secondary.href} className="min-h-[3.25rem] px-8">
                  {secondary.label}
                </PeelNote>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}

/* ---- /gallery ----------------------------------------------------------- */

function GalleryClose({ eyebrow, lines, body, primary, secondary }: ClosingCtaProps) {
  return (
    <section aria-labelledby="gallery-close" className="relative isolate overflow-clip bg-primary">
      <SectionShapes plan={LILAC_SHAPES} />
      <Container className="relative py-[5rem] text-center md:py-section lg:py-[7rem]">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[7%] top-12 deco-mark w-[4.25rem] rotate-[-10deg]"
        >
          <DoodleMark name="coral" color={INK.lavender} treatment="draw" delay={300} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-12 right-[8%] deco-mark w-[4.5rem] rotate-[8deg]"
        >
          <DoodleMark name="splash" color={INK.whiteRock} treatment="draw" delay={420} />
        </span>

        {eyebrow ? (
          <Reveal>
            <Label className="mb-6">{eyebrow}</Label>
          </Reveal>
        ) : null}

        <DisplayHeading id="gallery-close" ground="lilac" className="mx-auto max-w-[18ch]" lines={lines} />

        {body ? (
          <Reveal delay={0.08}>
            <p className="script-lede mx-auto max-w-[40ch] text-lead text-surface">{body}</p>
          </Reveal>
        ) : null}

        {primary || secondary ? (
          <Reveal delay={0.16}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
              {primary ? (
                <BlobButton href={primary.href} tone="cream" className="min-h-[3.25rem] px-8">
                  {primary.label}
                </BlobButton>
              ) : null}
              {/* The second action beside the first: the site's secondary,
                  the sticky note — see <PeelNote>. */}
              {secondary ? (
                <PeelNote href={secondary.href} className="min-h-[3.25rem] px-8">
                  {secondary.label}
                </PeelNote>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}

/* ---- /faq --------------------------------------------------------------- */

function FaqClose({ eyebrow, lines, body, primary, secondary }: ClosingCtaProps) {
  return (
    <section
      aria-labelledby="faq-close"
      className="relative isolate overflow-clip bg-primary py-[5rem] text-surface md:py-section lg:py-section-lg [--color-focus:var(--color-cream)]"
    >
      <SectionShapes plan={LILAC_SHAPES} />
      <Container className="text-center">
        <div className="mx-auto max-w-[44rem]">
          {eyebrow ? (
            <Reveal>
              <Label className="mb-6">{eyebrow}</Label>
            </Reveal>
          ) : null}

          <DisplayHeading id="faq-close" ground="lilac" lines={lines} />

          {body ? (
            <Reveal delay={0.2}>
              {/*
                Full strength, no alpha. `--color-surface` on Deep Lilac is
                4.90:1 and that is the whole of the headroom — the same rule
                the /private-events close keeps.
              */}
              <p className="mx-auto mt-9 max-w-[44rem] text-balance text-lead text-surface">{body}</p>
            </Reveal>
          ) : null}

          {primary || secondary ? (
            <Reveal delay={0.3} className="mt-10 flex justify-center md:mt-12">
              {primary ? (
                <BlobButton href={primary.href} tone="cream" className="min-h-[3.25rem] px-7">
                  {primary.label}
                </BlobButton>
              ) : null}
              {secondary ? (
                <PeelNote href={secondary.href} className="ml-8 min-h-[3.25rem] px-7">
                  {secondary.label}
                </PeelNote>
              ) : null}
            </Reveal>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---- /policies ---------------------------------------------------------- */

function PoliciesClose({ eyebrow, lines, body, primary, secondary }: ClosingCtaProps) {
  return (
    <section
      aria-labelledby="policies-close"
      className="relative isolate overflow-clip bg-primary py-[4.5rem] text-surface md:py-section lg:py-section-lg [--color-focus:var(--color-cream)]"
    >
      <SectionShapes plan={LILAC_SHAPES} />
      <Container className="text-center">
        <div className="mx-auto max-w-[44rem]">
          {eyebrow ? (
            <Reveal>
              <Label className="mb-6">{eyebrow}</Label>
            </Reveal>
          ) : null}

          <DisplayHeading id="policies-close" ground="lilac" lines={lines} />

          {body ? (
            <Reveal delay={0.2}>
              <p className="mx-auto mt-7 max-w-[40ch] text-lead text-surface">{body}</p>
            </Reveal>
          ) : null}

          {primary || secondary ? (
            <Reveal delay={0.3}>
              <div className="mt-9 flex justify-center">
                {primary ? (
                  <BlobButton href={primary.href} tone="cream" className="min-h-[3.25rem] px-8">
                    {primary.label}
                  </BlobButton>
                ) : null}
                {secondary ? (
                  <PeelNote href={secondary.href} className="ml-8 min-h-[3.25rem] px-8">
                    {secondary.label}
                  </PeelNote>
                ) : null}
              </div>
            </Reveal>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/* ---- /private-events ---------------------------------------------------- */

/**
 * The close, on the brand's one saturated field.
 *
 * Deep Lilac carries exactly one full field on that page and this is it, spent
 * on the only thing the page is asking anyone to do: one centred column — the
 * heading, the sentence and the action — the shape the /about and /locations
 * closes take.
 */
function PrivateEventsClose({ eyebrow, lines, body, primary, secondary }: ClosingCtaProps) {
  return (
    <section
      aria-labelledby="private-events-enquiry"
      className="relative isolate overflow-clip bg-primary py-[5.5rem] text-surface md:py-section lg:py-section-lg [--color-focus:var(--color-cream)]"
    >
      <SectionShapes plan={LILAC_SHAPES} />
      <Container className="text-center">
        <div className="mx-auto max-w-[44rem]">
          <div>
            {/*
              The ink on Deep Lilac is not a free choice. Light Sage 3.83:1,
              White Rock 3.95:1, --color-surface 4.90:1 — the first two are
              fine for display type and fail the 4.5:1 a 12px label owes, so
              everything read at body size or below is set in `surface`.
            */}
            {eyebrow ? <Label className="mb-8">{eyebrow}</Label> : null}
            <h2 id="private-events-enquiry">
              <Stagger>
                {lines.map((line, i) => (
                  <Fragment key={line}>
                    {i > 0 ? " " : null}
                    <SectionLine tone="light">{line}</SectionLine>
                  </Fragment>
                ))}
              </Stagger>
            </h2>

            {body ? (
              <Reveal delay={0.2}>
                {/* `text-balance` is what the three lines need: without it the
                    first runs to the full measure and the last sits short,
                    which under a centred script heading reads as a paragraph
                    that ran out rather than as a block of them. */}
                <p className="mx-auto mt-9 max-w-[44rem] text-balance text-lead text-surface">{body}</p>
              </Reveal>
            ) : null}
          </div>

          {primary || secondary ? (
            <Reveal delay={0.3} className="mt-10 flex justify-center md:mt-12">
              {/* `py-5` on a 12px uppercase label is a 54px target, and it is
                  full width below `sm` where a phone would otherwise give it a
                  third of the screen. */}
              {primary ? (
                <BlobButton href={primary.href} tone="cream" className="w-full justify-center px-8 py-5 sm:w-auto ">
                  {primary.label}
                </BlobButton>
              ) : null}
              {secondary ? (
                <PeelNote href={secondary.href} className="ml-8 min-h-[3.25rem] px-8">
                  {secondary.label}
                </PeelNote>
              ) : null}
            </Reveal>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/** One line of a script heading, masked up into place — the private-events page's own. */
export function SectionLine({ children, tone = "dark" }: { children: string; tone?: "dark" | "light" }) {
  return (
    <span className="script-mask heading-script text-script-section">
      <Reveal as="span" variant="maskUp" className={`block ${tone === "light" ? "text-surface" : "text-text"}`}>
        {children}
      </Reveal>
    </span>
  );
}

/* ---- /contact ----------------------------------------------------------- */

/**
 * The way through to the programme. The About page's closing panel,
 * deliberately the same object, set as a two-column masthead: secondary to
 * the form above it, so a panel at the foot rather than a second column
 * competing with the enquiry. Its one button is the sticky note.
 */
function ContactClose({ eyebrow, lines, body, primary, secondary }: ClosingCtaProps) {
  return (
    <section
      aria-labelledby="contact-cta"
      className="relative isolate overflow-hidden bg-primary py-[5rem] text-surface md:py-section"
    >
      <SectionShapes plan={LILAC_SHAPES} />
      <Container>
        <div className="grid grid-cols-12 items-end gap-x-6 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-7">
            <Reveal>
              {eyebrow ? <Label>{eyebrow}</Label> : null}
              <h2 id="contact-cta" className={`${eyebrow ? "mt-6 " : ""}heading-script text-script-section`}>
                {lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
            </Reveal>
          </div>

          {/* The section-masthead description column: five of twelve, flush
              with the container's right edge, and no cap on the paragraph —
              the column IS the measure. */}
          <div className="col-span-12 mt-10 lg:col-span-5 lg:col-start-8 lg:mt-0">
            <Reveal delay={0.15}>
              {/* `surface`, not White Rock: White Rock on lilac is 3.95:1,
                  under the 4.5:1 body text owes; `surface` clears it (4.90). */}
              {body ? <p className="text-lead text-surface">{body}</p> : null}

              {/* A SECONDARY BUTTON, NOT AN UNDERLINED WORD — the site's
                  secondary action is the sticky note; see <PeelNote>. */}
              {primary ? (
                <PeelNote href={primary.href} className="mt-9 min-h-[3.25rem] px-7">
                  {primary.label}
                </PeelNote>
              ) : null}
              {secondary ? (
                <PeelNote href={secondary.href} className="ml-6 mt-9 min-h-[3.25rem] px-7">
                  {secondary.label}
                </PeelNote>
              ) : null}
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
