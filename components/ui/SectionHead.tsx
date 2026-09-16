import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { RuledLink } from "@/components/ui/Action";
import type { Ground } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

/**
 * The shared masthead. One component, two arrangements, eleven sections.
 *
 * WHAT IT REPLACES. Every section on this page opened the same way — a short
 * rule, a small uppercase label, a heading, sometimes a lead paragraph in a
 * right-hand column — and every one of them wrote it out again. The heading
 * sizes drifted the furthest: `text-[1.9rem] md:text-[2.3rem] lg:text-[2.75rem]`
 * in one section, a six-breakpoint ladder in the next, `text-h2` in two more,
 * and a `lg` step that goes *down* in a fifth. That is the client's note about
 * the type system, and it is fixed by there being one heading here.
 *
 * ALL OF IT IS `text-h2`. The token has existed since the type pass and was
 * adopted by exactly two sections; the rest is now folded in. `font-light
 * uppercase tracking-[-0.02em]` travels with it, because those three are not
 * separate decisions from the size — they are what makes a Maison heading a
 * Maison heading, and a section that sets them differently is a section that
 * looks like a different site.
 *
 * THE RULE IS DEEP LILAC NOW, NOT WARM TERRACOTTA — see THE ONE-ACCENT RULE at
 * the top of app/globals.css. Terracotta is 2.44:1 on White Rock and 2.36:1 on
 * Light Sage against the 3:1 a graphical mark owes; Deep Lilac clears it on
 * every light ground and is replaced outright on ink, where it would be 2.37:1.
 *
 * `id` is the heading's, and the same string goes to the surrounding
 * <Section>'s `aria-labelledby`. Passing one value to two places is the whole
 * of the section-labelling contract.
 */

/** Which ink, which rule. Ground is the only thing that moves any colour here. */
const INKS: Record<Ground, { heading: string; rule: string; standfirst: string }> = {
  /*
    Charcoal on all three light grounds: 11.61:1 on the page ground, 9.36:1 on
    White Rock, 9.07:1 on Light Sage. The standfirst is held at /80 — above the
    /70 floor the page ground allows and the /75 Light Sage allows, so one value
    is safe on all three rather than three values nobody will keep straight.
  */
  surface: { heading: "text-text", rule: "bg-primary", standfirst: "text-text/80" },
  cream: { heading: "text-text", rule: "bg-primary", standfirst: "text-text/80" },
  sage: { heading: "text-text", rule: "bg-primary", standfirst: "text-text/80" },
  /*
    White Rock ink at 9.36:1, and a White Rock rule because the accent is
    2.37:1 on Charcoal. The standfirst sits at /85 rather than /80: the same
    fade costs more on a dark ground than a light one, and this is the only
    place on the page where the muted floor is measured downward from 9.36
    rather than from 11.61.
  */
  ink: { heading: "text-on-dark", rule: "bg-cream", standfirst: "text-on-dark/85" },
};

/**
 * Where the head's two halves sit, and which half carries the standfirst.
 *
 * The grid is the site's 12 columns with `gap-x-6 lg:gap-x-10`, the same one
 * every section body uses, so a head and the content under it line up on the
 * same column edges rather than nearly doing so.
 *
 * `stacked` — the standfirst runs under the title, and the right cell holds
 * only the action, pushed to the page's right edge. This is the default and it
 * is the arrangement for most sections: a head that is a heading and a
 * sentence, with a "See all" in the far corner.
 *
 * `spread` — the standfirst moves to a right-hand column beside the title, and
 * the action goes to the top of that same column, aligned with the paragraph
 * under it rather than flush to the page edge. A 12px uppercase link
 * right-aligned over a left-aligned paragraph reads as two objects that landed
 * near each other; the shared column edge is what makes them one block. With no
 * standfirst there is nothing to align to and the action goes flush right
 * again — `justify-self-end` sizes a cell to its content, so it cannot be left
 * on while a paragraph is sharing the cell.
 *
 * ONE COMPROMISE, ON A PHONE, IN `spread`. Below `md` everything is one column
 * and the DOM order is eyebrow, title, action, standfirst — so a short link
 * lands between the heading and its lead paragraph. Reordering it visually
 * would put the reading order and the visual order out of step, which is the
 * worse of the two problems. It is the reason `stacked` is the default.
 */
const CELLS = {
  stacked: {
    title: "col-span-12 md:col-span-8",
    side: "col-span-12 mt-7 md:col-span-4 md:col-start-9 md:mt-0",
  },
  spread: {
    title: "col-span-12 md:col-span-6 lg:col-span-7",
    side: "col-span-12 mt-7 md:col-span-5 md:col-start-8 md:mt-0 lg:col-span-4 lg:col-start-9",
  },
} as const;

type Layout = keyof typeof CELLS;

interface SectionHeadProps {
  /** The heading's id. The surrounding <Section> is `aria-labelledby` this. */
  id: string;
  /**
   * A string, or authored lines.
   *
   * An array means the break belongs between the clauses rather than wherever
   * the measure happens to run out — but only from `md` up. Below it the lines
   * are set inline and allowed to flow, because a 390px screen cannot hold an
   * authored line in caps at any size a section heading should be set, and
   * insisting on the break there buys a wrapped line that breaks in the wrong
   * place *and* a heading two steps too small. The same arrangement
   * <MallPartners> and <EditorialStatement> reached for independently, and the
   * reason it is here instead of in three sections.
   */
  title: string | string[];
  /** The small uppercase label above the title, with its 1px accent rule. */
  eyebrow?: string;
  /** The lead paragraph. `text-lead`, per the type table. */
  standfirst?: string;
  /**
   * The "See all" affordance, top right. Rendered as the house <RuledLink>,
   * which is the only link shape on this page besides the one filled action.
   */
  action?: { label: string; href: string };
  ground?: Ground;
  layout?: Layout;
  /** Placement only — never the type, the ink or the grid. */
  className?: string;
}

/**
 * NO `maskUp` HERE, DELIBERATELY.
 *
 * The masked rise is the nicest entrance on the site and it is not a thing a
 * shared primitive can own. It needs an `overflow-hidden` parent per line plus
 * the `[&+span]:-mt-[0.12em]` correction for the descender padding, so an
 * authored two-line title becomes two masks and a negative margin between
 * them — a composition, not a prop. It also fails silently when it is got
 * wrong: an element slid clean out of its mask has no intersection with the
 * viewport, the observer answers "never on screen", the reveal never fires and
 * the line stays invisible for good. See the note in components/motion/Reveal.tsx.
 * Sections that want it build it themselves, over their own masks.
 *
 * What is here instead is the house default — one <Stagger> releasing the
 * eyebrow, the title block and the side block in sequence from a single
 * trigger, each a plain fade-up. The grid between the Stagger and its Reveals
 * is a plain div; Framer Motion propagates variants through React context, so
 * the intervening element is not a break in the chain (the same shape
 * <UpcomingEvents> already relies on).
 */
export function SectionHead({
  id,
  title,
  eyebrow,
  standfirst,
  action,
  ground = "surface",
  layout = "stacked",
  className,
}: SectionHeadProps) {
  const ink = INKS[ground];
  const cells = CELLS[layout];
  const lines = Array.isArray(title) ? title : null;

  const lead = standfirst ? (
    <p className={cn("max-w-[34rem] text-lead", ink.standfirst)}>{standfirst}</p>
  ) : null;

  const hasSide = Boolean(action) || (layout === "spread" && Boolean(lead));
  // Flush to the page edge whenever the side cell holds nothing but the action.
  const sideIsActionOnly = !lead || layout === "stacked";

  return (
    <Stagger className={className}>
      {eyebrow ? (
        <Reveal>
          <p
            className={cn(
              "flex items-center gap-4 text-label font-medium uppercase tracking-eyebrow",
              ink.heading,
            )}
          >
            <span aria-hidden className={cn("h-px w-9 shrink-0 md:w-12", ink.rule)} />
            {eyebrow}
          </p>
        </Reveal>
      ) : null}

      {/*
        The eyebrow-to-title gap is flat rather than fluid, and that is not an
        oversight. --spacing-section-gap is the distance between a head and the
        content it introduces; this is the distance between a label and the
        thing it labels, which is a typographic relationship and does not want
        to grow with the viewport.
      */}
      <div
        className={cn(
          "grid grid-cols-12 items-start gap-x-6 lg:gap-x-10",
          eyebrow ? "mt-7" : null,
        )}
      >
        <Reveal className={cells.title}>
          <h2
            id={id}
            className={cn("text-h2 font-light uppercase tracking-[-0.02em]", ink.heading)}
          >
            {lines
              ? lines.map((line, i) => (
                  <span key={line} className="inline md:block">
                    {/*
                      An explicit space, and only doing anything while the
                      lines are running inline. They are block-level from `md`
                      and give no word boundary of their own, so without it the
                      accessible name reads as one run-on word instead of as a
                      sentence.
                    */}
                    {i > 0 ? " " : null}
                    {line}
                  </span>
                ))
              : title}
          </h2>

          {layout === "stacked" && lead ? <div className="mt-6">{lead}</div> : null}
        </Reveal>

        {hasSide ? (
          <Reveal className={cn(cells.side, sideIsActionOnly ? "md:justify-self-end" : null)}>
            {action ? (
              <RuledLink
                label={action.label}
                href={action.href}
                tone={ground === "ink" ? "onDark" : "default"}
              />
            ) : null}
            {layout === "spread" && lead ? (
              <div className={action ? "mt-6" : undefined}>{lead}</div>
            ) : null}
          </Reveal>
        ) : null}
      </div>
    </Stagger>
  );
}
