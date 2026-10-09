import Image from "next/image";

import { INK } from "@/components/sections/hero/composition";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { forScript } from "@/components/ui/SectionHeader";
import { OPENING_STATEMENT } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

/*
  THE WORDS ARE NOW HANDED IN. The opening statement lives in the Brand
  wording global (`openingStatement`) or, when the homepage block turns
  "Use Brand wording" off, in the block itself — components/blocks/
  OpeningStatement.tsx decides which and passes it here. Left out, each
  prop falls back to lib/brand.ts, which is what this section printed
  before the CMS; `null` leaves the line out.
*/
export type BrandStoryWords = {
  heading?: string | null;
  body?: string | null;
  closer?: string | null;
};

export type BrandStoryPanel = {
  heading?: string | null;
  body?: string | null;
  signOff?: string | null;
};

/**
 * ==========================================================================
 * THE BRAND STORY, TYPESET — used by the homepage and by /about
 * ==========================================================================
 *
 * `BRAND_STORY` is one sentence of the client's deck. The homepage does not
 * set it as one paragraph: it breaks at the sentence's own punctuation into a
 * lead-in, the word the brand is named for, and the clause that defines it —
 * and then hands the rest to a lilac field beside a photograph. That is the
 * treatment the client pointed at when they asked for the about-us section to
 * read "like this screenshot".
 *
 * IT LIVES HERE BECAUSE IT IS NOW IN TWO PLACES. /about used to set the same
 * sentence as a single flat paragraph, which is the same words with none of
 * the typesetting. Copying ninety lines of markup into the page would have
 * given the two a way to drift; one definition cannot.
 *
 * NOTHING HERE IS WRITTEN FOR THE LAYOUT. Every string is `BRAND_STORY_SET`,
 * which is `BRAND_STORY` cut at its own punctuation and nothing else — read
 * the four in order and the deck's sentence comes back word for word. See the
 * note above it in lib/brand.ts.
 */

/**
 * The opening statement: the headline, what the place is, and the line that
 * closes it.
 *
 * ==========================================================================
 * IT WAS THE DECK'S SENTENCE AND IT IS THE CLIENT'S INVITATION
 * ==========================================================================
 *
 * This used to typeset `BRAND_STORY_SET` — the deck's one sentence broken at
 * its own punctuation, with "Palette" set in the brand's script inside the
 * running line. It was faithful, and it was a definition: a paragraph about
 * what the brand IS, addressed to nobody in particular.
 *
 * The client has supplied copy for this block in its place, and it is doing a
 * different job — a headline, two lines about what a person can come in and
 * do, and a line short enough to remember. So the block is three elements now
 * rather than one typeset paragraph.
 *
 * `as` because the homepage's copy is a section heading and /about's is not:
 * that page's h1 is already the tagline, and a second heading of the same rank
 * under it would be a document outline claiming two titles. On /about the
 * headline is therefore a paragraph, which is also why it cannot simply wrap
 * everything — a heading inside a `p` is not valid, so the three parts are
 * siblings in a plain box and only the first one changes element.
 *
 * THE HEADLINE IS SCRIPT AND THE REST IS NOT, which is this site's rule: the
 * script carries what somebody would say out loud, Montserrat carries what
 * they have to act on. `forScript` straightens the curly quotes the face has
 * no glyphs for — see the note on it in <SectionHeader>.
 */
export function BrandStoryLead({
  as: Tag = "h2",
  id,
  className,
  words = {},
}: {
  as?: "h2" | "p";
  id?: string;
  className?: string;
  words?: BrandStoryWords;
}) {
  const heading = words.heading === undefined ? OPENING_STATEMENT.heading : words.heading;
  const body = words.body === undefined ? OPENING_STATEMENT.body : words.body;
  const closer = words.closer === undefined ? OPENING_STATEMENT.closer : words.closer;

  return (
    <div className={className}>
      <Tag
        id={id}
        /*
          `pb-[0.18em]` for the same reason every script heading on this site
          carries one: Hapsha's descenders drop below the line box, and without
          the clearance the "p" of "Space" is cut by whatever follows.
        */
        /*
          CHARCOAL, NOT DEEP LILAC, at the client's ask. Every other section
          heading on this site takes its ground's reading ink — that is what
          <DisplayHeading> does with `ground`, and `tone="accent"` is the
          documented exception for "a statement set as a brand moment rather
          than as a heading". This is a section heading, so it takes the ink,
          and the page stops carrying one heading in a colour of its own.
        */
        className="heading-script max-w-[22ch] pb-[0.18em] text-script-section text-text"
      >
        {forScript(heading ?? "")}
      </Tag>

      {/*
        MEDIUM, NOT LIGHT. The sentence this replaced was set at display size
        in a light weight because it was the section's statement; this one sits
        UNDER a statement, so it is body copy — and the client's own mock sets
        it heavier than the page's running text, which is what tells you it is
        still part of the opening rather than the start of the article.
      */}
      {/*
        `statement`, NOT `lead`. This is the brand story — the paragraph the
        homepage is built around — and it was set at the same step as any
        section intro on the site. The client asked for it larger. The measure
        comes in with the size: 62ch at 23–28px is a 900px line, well past the
        75 characters a reader tracks comfortably, so it is 46ch now and the
        block holds the same physical width it always had.
      */}
      {body ? (
        <p className="script-lede max-w-[46ch] text-statement font-medium text-text">
          {body}
        </p>
      ) : null}

      {closer ? (
        <p className="mt-6 max-w-[40ch] text-statement font-semibold leading-[1.4] text-text">
          {closer}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The object: photograph and field, flush, sharing one edge and one height.
 *
 * `items-stretch` and a minimum on the row, so the picture covers whatever
 * height the copy turns out to need.
 *
 * ==========================================================================
 * THE PICTURE
 * ==========================================================================
 *
 * The client supplied this frame for this block. It is the studio's own
 * finished work — poured candles set with fruit, boxed — rather than a stock
 * lifestyle shot, and it answers the note that retired the one before it:
 * "use images like this, not the birdhouse, it's not part of our activities."
 * Candle making is a real scheduled session (lib/workshops.ts).
 *
 * It is 1488x718, about 2:1 — wider than the 16:10 the stacked frame takes, so
 * a phone crops its sides a little and the three candles stay in shot; at `lg`
 * the frame has no ratio of its own and the picture fills whatever height the
 * field beside it asks for.
 */
export function BrandStoryObject({
  className,
  panel = {},
  image,
}: {
  className?: string;
  panel?: BrandStoryPanel;
  /** The photograph beside the panel; `undefined` keeps the launch file. */
  image?: ImageAsset | null;
}) {
  const heading = panel.heading === undefined ? OPENING_STATEMENT.panel.heading : panel.heading;
  const body = panel.body === undefined ? OPENING_STATEMENT.panel.body : panel.body;
  const signOff = panel.signOff === undefined ? OPENING_STATEMENT.panel.signOff : panel.signOff;
  const photo =
    image === undefined
      ? {
          src: "/images/about-sec-img.png",
          alt: "Three poured candles in a lined gift box: one in a cut-glass tumbler set with raspberries, one in a brass tin with raspberries and blueberries, and one swirled in a fluted white pot.",
          position: "50% 50%",
        }
      : image;

  return (
    <div
      className={cn(
        "flex flex-col overflow-clip rounded-[1.5rem] md:rounded-[2rem]",
        "lg:min-h-[22rem] lg:flex-row",
        className,
      )}
    >
      <div
        className="relative aspect-[16/10] w-full lg:aspect-auto lg:w-[48%] lg:shrink-0"
        data-paint
        style={{ "--paint": "var(--color-terracotta)" } as React.CSSProperties}
      >
        {photo ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover"
            style={{ objectPosition: photo.position ?? "50% 50%" }}
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-center bg-primary px-7 py-11 text-surface md:px-12 md:py-14 lg:px-14">
        {/*
          LIGHT SAGE, AND ONLY BECAUSE IT IS DISPLAY SIZE. On Deep Lilac the
          near-white `surface` is the one ink that clears 4.5:1 at reading size
          (4.90); Light Sage measures 3.83, which carries large text and
          nothing smaller. A script heading at this size is large text, so the
          sage the client's mock shows is safe here — and the paragraph under
          it stays `surface` for exactly the same reason.
        */}
        {heading ? (
          <p className="heading-script pb-[0.14em] text-script-panel text-sage">
            {forScript(heading)}
          </p>
        ) : null}

        {body ? (
          <p className="script-lede max-w-[48ch] text-body">
            {body}
          </p>
        ) : null}

        {/* The sign-off, in the sage that reads on Deep Lilac. */}
        {signOff ? (
          <p className="mt-7 flex items-center gap-3 text-body font-medium text-sage">
            <span aria-hidden className="block w-5 shrink-0">
              <DoodleMark name="splash" color={INK.lavender} delay={220} />
            </span>
            {signOff}
          </p>
        ) : null}
      </div>
    </div>
  );
}
