import { Reveal } from "@/components/motion/Reveal";
import type { PolicyBlock, PolicySection } from "@/lib/policies";

/**
 * ==========================================================================
 * A POLICY, SET TO BE READ RATHER THAN SURVIVED
 * ==========================================================================
 *
 * The brief for these pages was "should not look like generic legal pages …
 * do not over-design legal/policy content", which are two instructions
 * pulling opposite ways until you decide what each is about. The first is
 * about the GROUND: the Maison's own paper, its own type, its own marks, the
 * way every other page on this site is dressed. The second is about the
 * COLUMN: a policy is read in one pass by somebody checking one thing, so
 * nothing inside it moves, nothing opens, nothing is a card.
 *
 * So this component is deliberately plain and the page around it is not.
 *
 * ==========================================================================
 * WHY THE MEASURE IS 34rem AND NOT THE PAGE
 * ==========================================================================
 *
 * <FaqList> runs to 76rem because its rows are cards in a grid and a card
 * carries its own measure. This is continuous prose, and continuous prose at
 * 1216px is about 150 characters a line — roughly twice the span an eye
 * tracks without losing its place. 34rem sets about 70.
 *
 * SECTIONS ARE <section> WITH THEIR OWN h2, not styled paragraphs, because
 * "the cancellation bit" is a thing people are sent to and link to. Each one
 * takes an id off its heading so a future cross-reference has somewhere to
 * land, and so a screen reader's heading list IS the table of contents.
 */
export function PolicyBody({ sections }: { sections: readonly PolicySection[] }) {
  return (
    <div className="mx-auto max-w-[34rem]">
      {sections.map((section, index) => (
        <section
          key={section.heading}
          aria-labelledby={sectionId(section.heading)}
          /* The rule between sections, and never above the first one: the
             field's own top edge is already doing that job. Same device as
             the hairline runs elsewhere on the site. */
          className={index === 0 ? "" : "mt-12 border-t border-text/15 pt-12 md:mt-14 md:pt-14"}
        >
          <Reveal>
            <h2
              id={sectionId(section.heading)}
              className="text-h4 font-semibold tracking-[-0.01em] text-text"
            >
              {section.heading}
            </h2>
          </Reveal>

          {section.blocks.map((block, blockIndex) => (
            <Block key={blockIndex} block={block} first={blockIndex === 0} />
          ))}
        </section>
      ))}
    </div>
  );
}

/** "Following the instructions" -> "following-the-instructions". */
function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Block({ block, first }: { block: PolicyBlock; first: boolean }) {
  /* The first block sits closer to its heading than the ones after it do to
     each other, so a heading reads as attached to its own paragraph rather
     than floating between two. */
  const top = first ? "mt-5" : "mt-5";

  switch (block.type) {
    case "text":
      return (
        <Reveal delay={0.05}>
          {/* 1.85 leading and full-strength charcoal. A policy is the one
              kind of page where ink at 85% is a real cost: it is read once,
              carefully, often on a phone in a mall. 10.6:1 on White Rock. */}
          <p className={`${top} text-body text-text/90`}>{block.body}</p>
        </Reveal>
      );

    case "list":
      return (
        <Reveal delay={0.05}>
          {/*
            A DISC MARKER, NOT A PAINTED DOT. Every other list on this site
            carries a brand mark in front of it; here the list items are
            rules a reader counts, and a hand-drawn blot at 8px reads as
            decoration sitting where a bullet should be. `marker:` keeps the
            colour ours without replacing the glyph.
          */}
          <ul className={`${top} list-disc space-y-3 pl-5 marker:text-terracotta`}>
            {block.items.map((item) => (
              <li key={item} className="text-body text-text/90">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      );

    case "ages":
      return (
        <Reveal delay={0.05}>
          {/*
            A <dl>, NOT A <table>. Two columns of activity-and-guidance is a
            description list by definition — term, description — and a table
            would claim a relationship between rows that is not there. It
            also stacks honestly on a phone, where a two-column table has to
            either scroll sideways or crush the second column to nothing.

            `sm:grid-cols-[minmax(0,11rem)_1fr]` rather than two equal halves:
            the activity names are short and fixed, the guidance is a
            sentence, so an even split would leave a column of air beside
            "Glass painting" and wrap "Ages 5–10 for stencils and easy
            painting" onto three lines next to it.
          */}
          <dl className={`${top} grid gap-x-6 gap-y-4 sm:grid-cols-[minmax(0,11rem)_1fr]`}>
            {block.rows.map((row) => (
              <div key={row.activity} className="contents">
                <dt className="text-label font-medium uppercase tracking-eyebrow text-text">
                  {row.activity}
                </dt>
                <dd className="-mt-2 text-body text-text/90 sm:mt-0">
                  {row.guidance}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      );

    case "callout":
      return (
        <Reveal delay={0.05}>
          {/*
            THE ONE OBJECT ON THE PAGE, and it appears four times in eight
            policies. It marks the places the SOURCE DOCUMENT broke out of
            its own run — "Important for Ceramics and Glass", "Every creation
            is uniquely yours" — so the emphasis is the studio's and not a
            designer's eye for where a page needs relief.

            Light Sage on the White Rock field: the two neutrals of this site
            against each other, which is how <PartnerPlate> cuts a card out
            of a ground. Charcoal is 9.07:1 on it, so nothing inside changes
            ink. The terracotta edge is the mark — a graphical object at
            2.36:1 on sage, which is what a 3px rule is allowed to be.

            THE EDGE IS A PSEUDO-ELEMENT AND NOT `border-l`, which is a 3px
            detail that looked like a bug. A left border on a 20px radius
            curves around both corners, so the bar tapered into two thin
            terracotta hooks sticking out past the card — the eye reads that
            as a rendering fault rather than as a rule. An absolutely
            positioned bar under `overflow-clip` is cut to the card's own
            curve instead, so the edge follows the corner cleanly.

            `overflow-clip`, never `overflow-hidden`: hidden makes this a
            scroll container, which is what breaks a <DoodleMark>'s view
            timeline everywhere else on this site. Nothing draws inside a
            callout today and the habit is still worth keeping.
          */}
          <div
            className={`${top} relative overflow-clip rounded-[1.25rem] bg-sage px-6 py-6 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-terracotta before:content-['']`}
          >
            <p className="text-label font-medium uppercase tracking-eyebrow text-text">
              {block.title}
            </p>
            <p className="mt-3 text-body text-text/90">{block.body}</p>
          </div>
        </Reveal>
      );
  }
}
