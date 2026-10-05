import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BackToTop } from "@/components/layout/BackToTop";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import type { DoodleName } from "@/components/sections/hero/doodles";
import { forScript } from "@/components/ui/SectionHeader";
import { MISSION, TAGLINE } from "@/lib/brand";
import { PaintStroke, linkPaint } from "@/components/layout/PaintStroke";
import { BRAND_LOGO, CONTACT, FOOTER_NAV, LEGAL_NAV, SITE, SOCIAL_LINKS } from "@/lib/constants";
import { POLICIES } from "@/lib/policies";
import { getMallPartners } from "@/lib/partners";

/*
  One cut-out per navigation group, in the order the groups are read.

  Four shapes rather than one repeated: three identical marks down a row of
  three headings is a bullet, and the point of using the brand's set here is
  that it has a set. All four are LOOSE cuts — the slab icons carry a filled
  tile behind the drawing, which at 18px beside a 13px label reads as a
  coloured square rather than as a mark.
*/
/*
  THE COLOUR PICKS THE SHAPE, NOT THE NAME — which is the one thing you have
  to know to use this set. `resolveIcon` keys the brand sheet by colour:
  each of the five brand colours owns one loose cut and one slab cut, so
  `splash`, `coral` and `bow` all resolve to the SAME drawing when they are
  handed the same ink. Four different names in lilac rendered as four
  identical marks down the footer.

  Varying the ink is the only way to vary the shape — and it varies the shape
  WITHOUT varying the colour, because a cut from the sheet carries its own
  fills and the `color` prop is only the key that selects it. Charcoal Slate
  was tried as a third entry here and rendered identically to Deep Lilac:
  both map to the bow, and the bow is drawn in the sheet's lilac either way.

  The cream ground rules out the rest. Soft Lavender is 1.3:1 on it and White
  Rock IS it. So the set is two: Deep Lilac's bow and Warm Terracotta's
  splash, alternating down the column. These are decoration beside a text
  label that carries the meaning, so the 3:1 a meaningful graphic owes does
  not bind on the terracotta's 2.44.
*/
const GROUP_MARKS: readonly { name: DoodleName; color: string }[] = [
  { name: "bow", color: "#9059A4" },
  { name: "splash", color: "#D97757" },
];

/**
 * A footer link.
 *
 * `text-text` at full strength, not the `/75` it was. The nav links in the
 * groups below carry a painted swatch now, and a label is read against the
 * swatch rather than against the footer — charcoal at 75% over paint is a
 * different and much worse number than charcoal at 75% over White Rock.
 * Links with no swatch keep the same ink so the footer does not end up with
 * two weights of the same thing.
 */
/*
  ==========================================================================
  NO PSEUDO-ELEMENT HERE, AND THE ONE THAT WAS IS THE REASON FOR THIS NOTE
  ==========================================================================

  This carried `after:-inset-y-0.5`, added to lift a "40px" box to the 44px a
  thumb wants. Re-measured against the rendered page, the box is 45.25px —
  33.25 of line plus 12 of padding — so it was already over the line and the
  extra 4px bought nothing.

  What it cost was real. `-my-1.5` pulls 6px back off each end, so a column of
  these pitches its rows at 43.25 while each BOX is 45.25: the boxes already
  overlap by 2, and the pseudo-element took the targets to 49.25 and the
  overlap to 6. Six pixels of every row belonged to its neighbour, so a thumb
  aimed at the top of "Locations" could open "About". Measured across all
  three breakpoints: four overlapping pairs at 1440, six at 768.

  A target is not only its height. Growing one into the row above is not
  making it bigger, it is making two of them wrong, and the fix is the pitch —
  see the `space-y` on the lists, which is now 14px rather than 10.

  `py-2` AND NOT `py-1.5`, WHICH IS THE PHONE'S NUMBER. At 1440 the line box
  is 33.25px and 12px of padding clears 44 comfortably; the type scale steps
  down below `sm`, the line box with it, and the same padding gave a 42px
  target. 16px of padding holds 44 at every width the site has, and the extra
  4px still fits inside the 14px row gap.
*/
const LINK =
  "group/link relative -my-1.5 inline-flex py-2 text-body text-text transition-colors duration-300 ease-soft";

/**
 * ==========================================================================
 * THE FOOTER
 * ==========================================================================
 *
 * WHITE ROCK, AT THE CLIENT'S ASK, AND IT INVERTED EVERY INK IN THE FILE.
 * This was Charcoal Slate for a long time on the argument that a dark floor
 * stops the page thinning out into another pale band. The client read it as
 * not matching the site, which is fair: every section above it is light, and
 * the one dark surface on the site was the last thing you saw.
 *
 * The ground is now the palette's own neutral and the ink is Charcoal Slate at
 * 9.36:1. The logo swapped cuts with it — the client supplied Light Sage for
 * dark grounds and Deep Lilac for pale ones, and the sage cut on White Rock
 * would have been a blank rectangle.
 *
 * ONLY WHAT IS REAL.
 *
 *   Contact ....... the address lines are always shown; email and phone only
 *                   once they are set in CONTACT. Both are null today.
 *   Social ........ only profiles with a real URL. Every href in SOCIAL_LINKS
 *                   is null, so there is no "Follow" heading at all — the
 *                   previous footer printed "Instagram" and "Facebook" as
 *                   plain text under "Follow", which reads as two broken links.
 *   Legal ......... LEGAL_NAV, which is empty until the policy pages exist,
 *                   so no link in the footer answers 404.
 *   Newsletter .... not rendered: NEWSLETTER has no endpoint, and a form that
 *                   posts nowhere is a promise the site cannot keep.
 *
 * ==========================================================================
 * BROUGHT INTO THE SITE'S OWN LANGUAGE
 * ==========================================================================
 *
 * It was the last surface that had not been: no script, no brand mark, no
 * doodle — a dark slab with three columns of links and two bands of
 * addresses, which is what every footer on the internet looks like. Three
 * things changed and the ground was not one of them.
 *
 *   THE TAGLINE IS SET IN THE SCRIPT. It was a 12px uppercase label, which is
 *   the register this site gives to eyebrows and field labels rather than to
 *   the sentence the brand is named for. Hapsha in Light Sage measures 9.07:1
 *   here — the strongest pairing in the palette — so the one place the page
 *   can afford the brand's own voice at size is the place it was missing.
 *
 *   THE TWO ADDRESS BANDS BECAME ONE. "Find us" and "The studio" each took a
 *   third of a full-width band and left the other two thirds empty, and the
 *   mission sat alone under the logo above. They are now one row of three:
 *   where the Maison sets up, where the studio is, and the mission as the
 *   line that closes it. Nothing was added and nothing was cut — the same
 *   content stops leaving two holes in the page.
 *
 *   TWO MARKS, BOTH ANCHORED. One on the rule where the links turn into the
 *   addresses — the same "mark at the turn" the workshop journey and the
 *   About purpose section use, so the footer is punctuated the way the rest
 *   of the site is — and one bleeding off the bottom corner behind the legal
 *   line, where there is genuinely nothing else.
 *
 * THE ACCENTS ALL CHANGED HANDS WITH THE GROUND, and the old note is worth
 * keeping beside the new one because it is the exact mirror. On Charcoal:
 * Light Sage 9.07:1, White Rock 9.36:1, Soft Lavender 6.49:1, Warm Terracotta
 * 3.84:1 — all clear — and DEEP LILAC DIED at 2.37:1, so the marks were sage,
 * lavender and terracotta and the site's own accent was deliberately absent.
 *
 * On White Rock it is the other way round and much tighter. Measured against
 * this ground: Deep Lilac 3.95:1, Warm Terracotta 2.44:1, Soft Lavender
 * 1.44:1, Light Sage 1.03:1. Only Deep Lilac clears the 3:1 a rule or a mark
 * owes, so it is now the only accent in the footer — the tagline, the heading
 * rules, the link underlines, the starleaf and the brush's own bristles. The
 * three that carried this footer on Charcoal cannot be used on it at all.
 *
 * Nothing here is set in Deep Lilac at body size: 3.95:1 is under the 4.5:1
 * running text owes. Muted copy is Charcoal at /75 and the tagline is display
 * type at 2.75rem, which owes 3:1.
 *
 * <FooterReveal> measures this element's height to decide whether to pin it
 * behind the page. Merging the two address bands took height out rather than
 * adding it, which is the right direction: past the window height the whole
 * reveal falls back to a footer in the flow.
 */
export async function Footer() {
  const partners = await getMallPartners();
  const year = new Date().getFullYear();
  /*
    One counter for every painted link in the footer's groups, so the palette
    runs across the grid rather than restarting per column. Mutated during
    render, which is safe here because it is re-initialised on every render
    and never read after it — the alternative is threading an offset through
    two maps for no benefit.
  */
  let paintCursor = 0;

  const socials = SOCIAL_LINKS.filter((link): link is typeof link & { href: string } =>
    Boolean(link.href),
  );

  return (
    /*
      ---- THE WAVE ON TOP OF THIS ELEMENT IS NOT DRAWN HERE ----

      <FooterWave>, rendered at the foot of <main>, carries this footer's own
      White Rock up over the seam on five crests. It cannot be drawn from
      inside this element: <FooterReveal> pins the footer BEHIND main, and
      main's opaque background — the lid that hides the footer for the whole of
      the page — covers anything this element paints above its own top edge.

      IT TOOK FIVE GOES AND EACH ONE FAILED DIFFERENTLY. A five-stop band of
      the whole palette, which read as a rainbow rather than as paint and
      misread the activity cards (a card is flooded with ONE colour; the set
      only appears because seven cards each take a different one). Then a torn
      splatter edge in that colour with a swell that tracked the pointer — read
      as a bite taken out of the section above, and the swell as simply odd.
      Then a smooth wave, one edge doing both jobs. Then a Deep Lilac band with
      a straight top and a wavy bottom, which is the only arrangement that lets
      the section keep a flat bottom while this footer keeps a wavy top — and
      the client has taken the purple out, so the two are one edge again. See
      FooterWave.module.css for why no other colour in the palette can hold
      those two edges apart.

      ---- AND THE BRUSH ----

      `data-paint` is what puts <CursorLayer>'s paintbrush over this footer,
      loaded with the Deep Lilac in `--paint`: the pointer picked up over an
      activity photograph is the one the visitor still has when they reach the
      foot of the page. It was Light Sage while the ground was Charcoal, and
      the bristles would be all but invisible on White Rock at 1.03:1.

      The brush no longer drags anything with it. It used to push a swell of
      paint along the edge above; that came out at the client's ask along with
      the torn edge it was swelling.

      ---- AND THE WAVE IS THE FIRST CHILD ----

      It is absolutely positioned and <Container> below it is `relative`, so
      paint order settles between the two on DOM order alone and the type sits
      over the band without either needing a z-index. `isolate` keeps that
      argument inside this element.

      IT COSTS THE LINKS THEIR HAND, which is worth saying out loud, and it
      took a rule in globals.css to make it do so cleanly. `cursor: none` on
      this element is inherited by everything in it, but `cursor: pointer`
      comes from the UA stylesheet on each <a> itself and beats an inherited
      value — so the first build drew the hand ON TOP OF the brush over every
      link in the footer. That never showed up on the activity plates because
      they mark the frame INSIDE the anchor rather than the anchor itself.

      So a link inside a paint surface now follows the surface; see the rule
      next to the other paint-cursor rules in globals.css. The links keep the
      rule that draws in under them on hover, which is the affordance doing
      the work at this size anyway, and the brush is never mounted at all for
      a visitor on a phone, under reduced motion or without JavaScript — all
      of whom keep the hand.
    */
    <footer
      data-paint
      style={{ "--paint": "var(--color-primary)" } as CSSProperties}
      className="relative isolate bg-cream text-text"
    >
      {/*
        ==================================================================
        THREE MARKS ON THE GROUND, WHERE THE COMPOSITION IS ACTUALLY EMPTY
        ==================================================================

        The client's reference footer carries half a dozen drawn shapes
        around its edges and asked for the same liveliness here — but those
        are biro strokes and marker scribbles from a stock set, and this
        brand has its own cut-outs. These are the Maison's, placed where
        the measured layout has room rather than where the reference puts
        its own: the gap between the tagline and the first navigation
        group, the outer margin beside the three-up band, and the floor
        beside the copyright line.

        DESKTOP ONLY, and low. Below `lg` the footer is a single stacked
        column with no margins to draw in, and at 0.14–0.2 these read as
        paper rather than as objects competing with eight navigation links.
        All three are clipped by the footer's own edges where they overrun,
        which is what makes them cut-outs rather than stickers.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[27%] top-[7.5rem] hidden w-16 rotate-[-12deg] opacity-[0.18] xl:block"
      >
        <DoodleMark name="bow" color="#9059A4" treatment="stamp" depth={0} />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -left-12 top-[58%] hidden w-28 rotate-[8deg] opacity-[0.13] lg:block"
      >
        <DoodleMark name="splash" color="#D97757" treatment="stamp" depth={0} />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-1 left-[27%] hidden w-20 rotate-[-18deg] opacity-[0.15] lg:block"
      >
        <DoodleMark name="bow" color="#9059A4" treatment="stamp" depth={0} />
      </span>

      <Container className="relative pb-[calc(2rem+var(--bottom-nav-h))] pt-16 md:pt-20 lg:pb-10 lg:pt-24">
        {/*
          THE CORAL THAT USED TO BLEED OFF THIS CORNER HAS GONE, and the note
          it carried is worth keeping because it was right at the time: the
          footer's top margin was the one piece of genuinely empty space in
          the composition — roughly 96px of padding, the full width of the
          page — after the bottom-right corner put a shape behind "Back to
          top" and the left column drove the row 89px taller in flow.

          That space is the pour now, which is a stronger event on the same
          edge and would have the mark sitting in wet paint. The footer keeps
          one doodle, the starleaf at the turn below; Terracotta opens the
          band along the top instead, where it used to sit up here alone.

          A ROW OF FIVE PAINT DABS UNDER THE TAGLINE WAS TRIED AND TAKEN OUT.
          The idea was to resolve the band back into the colours it came off,
          which is a fair rhyme and a poor drawing: the `splash` vector has
          arms thinner than the gaps between them, so at 16-24px it sets as an
          asterisk, at 24-40 as a small flower, and only past about 44px as a
          splat — by which point five of them are a 48px row of clip art
          sitting 400px under a band that already says the same thing better.
          The palette is stated once, at the top, in paint.
        */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-10">
          {/* ---- the Maison ---- */}
          {/*
            CENTRED UNTIL `lg`, at the client's ask. Stacked, this block is a
            mark and one line of script with the whole measure to themselves,
            and left-aligning them put every piece of the footer against one
            rail with nothing on the other side of it. Centred, the mark and
            the tagline read as a colophon — which is what they are — and the
            groups below can then be centred too without the two halves
            disagreeing. At `lg` the row goes back to five columns and five,
            where left is right.
          */}
          <div className="col-span-12 text-center lg:col-span-4 lg:text-left">
            <Link href="/" aria-label={`${SITE.name} home`} className="inline-block">
              {/*
                THE DEEP LILAC CUT, BECAUSE THE GROUND IS LIGHT NOW. The client
                supplied two: Light Sage for dark grounds and Deep Lilac for
                pale ones. This was the sage cut, which was right on Charcoal
                at 9.07:1 and is invisible on White Rock — it would have left
                the footer opening on a blank rectangle.

                The two files are NOT the same proportion (1120x466 against
                1015x438), so only the height is set and each keeps its own
                aspect; see the note on BRAND_LOGO.onLight.
              */}
              <Image
                src={BRAND_LOGO.onLight.src}
                alt=""
                width={BRAND_LOGO.onLight.width}
                height={BRAND_LOGO.onLight.height}
                className="h-16 w-auto md:h-20"
              />
            </Link>
            {/*
              The brand's own voice, at the one size the palette lets it be
              read: Light Sage on Charcoal is 9.07:1. `forScript` swaps curly
              punctuation for the straight marks Hapsha actually draws — the
              face has no curly apostrophe, and the tagline has none either,
              but the copy is shared and this keeps it safe if it ever gains
              one. The size carries the face's own leading floor; see the
              script tokens in globals.css.
            */}
            {/*
              IT IS THE FOOTER'S DISPLAY LINE NOW, not a caption under the
              mark. It was 32px rising to 38px and set on one line, which left
              the left half of this row carrying about a third of its own
              width — the widest hole in the composition, and a good part of
              why the footer read as a directory with a logo on it.

              A STEP UNDER `text-script-compact`, WHICH WAS TRIED FIRST AND IS
              TOO MUCH. That token tops out at 3.4rem, and at 1440 it set the
              tagline in two lines nearly as tall as the whole nav beside it —
              the footer stopped closing the page and started competing with
              the section above it, and it pushed about 110px into the height
              <FooterReveal> is budgeting. 2.75rem is the size that fills the
              column without taking it over.

              `leading-[1.22]` is set because the size is: the script tokens
              carry their own leading (1.32 at this step) and an arbitrary
              size does not inherit it, so the two lines opened a gap wide
              enough to read as two separate sentences.

              THE MEASURE IS THE COLUMN, and that is what closes the hole. It
              breaks the line in two at every width — without a measure a
              2000px display sets all thirty-six characters on one line — and
              at 34rem the second line runs to about the foot of the five
              columns this block is given, so the brand block finally occupies
              its own half of the row. At 20rem, which is where this started,
              the type stopped 290px short of the nav beside it and the hole
              the larger size was meant to close was still there, just lower
              down.

              Light Sage on Charcoal is 9.07:1, the strongest pairing in the
              palette — see the note at the head of this file.
            */}
            <p className="mt-7 heading-script mx-auto max-w-[34rem] text-script-panel text-primary lg:mx-0">
              {forScript(TAGLINE)}
            </p>

          </div>

          {/* ---- where to go ---- */}
          {/*
            Seven columns from the sixth rather than six from the seventh. The
            three groups were parked against the right edge with a column of
            nothing between them and the brand block; starting one column
            earlier closes that gap and gives the longest label ("Check a
            booking") room to stay on one line.
          */}
          <nav aria-label="Footer" className="col-span-12 lg:col-span-8 lg:col-start-5">
            {/*
              ONE COLUMN ON A PHONE, NOT TWO. At `grid-cols-2` the three
              groups fell as Create beside The Maison with Help orphaned
              underneath in the left half — a two-column block with a hole in
              the bottom-right, which is what the client marked. Three groups
              do not divide by two. Stacked and centred they read as a
              contents page; from `sm` there is room for all three abreast and
              the alignment goes back to the rail.
            */}
            {/*
              ==========================================================
              CAPPED AT 34rem, WHICH IS THE TAGLINE'S OWN MEASURE
              ==========================================================

              Measured at 1440: this nav was 800px wide and its three groups
              took 251px tracks to hold about 150px of label each. A hundred
              pixels of nothing after every column — the groups read as three
              thin lists drifting apart rather than as one block of
              navigation, which is the "spread out" the client saw.

              The cap is not a round number picked for tidiness. The script
              tagline on the other side of this row is set to `max-w-[34rem]`,
              and matching it gives the footer two 544px blocks on the same
              baseline with the gutter between them — a composition rather
              than a left edge and a right edge. `ml-auto` holds it against
              the right rail so the gutter is one gap instead of two.

              Below `lg` the cap does nothing: the nav is full width there and
              544px is wider than the three groups need.
            */}
            {/*
              NOT HELD AGAINST THE RIGHT RAIL ANY MORE. `lg:ml-auto` with a
              34rem cap pushed all three groups into the last 544px of an
              800px span, so between the end of the tagline and the start of
              "Create" there was about 450px of empty cream across the widest
              part of the footer — the hole the client's reference closes by
              running the logo and the three groups as four even columns.
              Starting at column 5 and filling the span does the same thing.
            */}
            <div className="grid grid-cols-1 gap-y-9 text-center sm:grid-cols-3 sm:gap-x-8 sm:gap-y-10 sm:text-left">
              {FOOTER_NAV.map((group, g) => (
                <div key={group.title}>
                  <FooterHeading
                    mark={GROUP_MARKS[g % GROUP_MARKS.length].name}
                    markColor={GROUP_MARKS[g % GROUP_MARKS.length].color}
                  >
                    {group.title}
                  </FooterHeading>
                  {/* 14px, not 10: the box is 45.25px and the rows were
                      pitched at 43.25, so every link overlapped the one above
                      it. 14 pitches them at 47.25 and leaves 2px of air. See
                      the note on `LINK`. */}
                  <ul className="mt-5 space-y-3.5">
                    {/*
                      THE FOOTER IS THE LOUDER VERSION OF THE BAR.

                      Same swatch, same three paints, same interaction — see
                      <PaintStroke>. What differs is that the footer hands the
                      colour out ACROSS the whole grid rather than restarting
                      it in each column: `paintCursor` keeps counting, so no
                      two neighbours in a row share a colour and the three
                      groups read as one palette instead of three copies of
                      the same one.

                      `shape="blot"` FOR THE SAME REASON THE BAR TAKES IT. The
                      brush mask is drawn 200 by 44 for a stroke that sits
                      UNDER a word; hovering swells it to a field BEHIND one,
                      and stretching a four-and-a-half-to-one drawing into a
                      three-to-one chip is what made the bar's hover read as a
                      smeared lozenge — the client's word for it. The blot is
                      drawn at the proportion it is actually used at, so it
                      swells into the chip the swatches use. At rest the two
                      shapes are the same thin line under the word; the
                      difference is only visible on hover, which is where the
                      note was.
                    */}
                    {group.items.map((item) => {
                      /*
                        HOISTED, BECAUSE TWO THINGS NEED IT NOW. The swatch
                        draws the blot and the span publishes it to the brush
                        — see below — and `linkPaint(paintCursor++)` written
                        twice would hand out two different colours and advance
                        the run by two.
                      */
                      const paint = linkPaint(paintCursor++);
                      return (
                        <li key={item.href}>
                          <Link href={item.href} className={LINK}>
                            {/*
                              THE BRUSH TAKES THE LINK'S OWN PAINT HERE TOO.

                              <CursorLayer> loads the brush from the nearest
                              `[data-paint]` ancestor of whatever is under the
                              pointer. The footer sets one on ITSELF — Deep
                              Lilac, so the bristles are visible on White Rock
                              — and without this that is what every link in it
                              handed the brush: one colour over ten links each
                              wearing a different one. Marked here, the nearest
                              ancestor is the link's own span and the brush
                              carries the blot swelling under the word.

                              THE PALE ONE IS SAFE, which is what held this
                              back when the bar got the same treatment. Soft
                              Lavender is 1.44:1 on White Rock and would be a
                              ghost on its own — but the brush is drawn twice,
                              and `dip()` picks the outline off the loaded
                              colour's luminance: lavender measures 0.51,
                              above the 0.42 midpoint, so it takes the
                              Charcoal outline and reads as a shape whatever
                              the ground does.
                            */}
                            <span
                              className="relative inline-block"
                              data-paint
                              style={{ "--paint": paint } as CSSProperties}
                            >
                              <PaintStroke paint={paint} shape="blot" />
                              {item.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* ---- where to find it ---- */}
        {/*
          ---- where to find it, and what it is for ----

          One row of three rather than two bands of one. "Find us" and "The
          studio" each held a third and left the rest of a full-width band
          empty; the mission now takes the third column, so the row is full
          and the footer is shorter than it was.
        */}
        {/*
          NO RULE ACROSS THIS TURN, at the client's ask. It was `border-t
          border-text/20` — Charcoal at a fifth, the full width of the
          measure — and it was the only line in the footer.

          THE SPACING IS UNTOUCHED. `mt-12 … pt-12` is what sets the two bands
          apart and it is doing that work on its own now; only the stroke has
          gone, so nothing below moves.

          AND THE MARK KEEPS ITS PLACE WITHOUT THE KNOCK-OUT. It carried
          `bg-cream pr-2`, which existed for one reason: to break the rule it
          was sitting on so the mark read as laid over the line rather than
          crossed out by it. With no line there is nothing to break, and a
          cream patch in a cream footer is an invisible rectangle that would
          only ever clip whatever drifted under it.
        */}
        <div className="relative mt-12 grid grid-cols-12 gap-x-6 gap-y-10 pt-12 md:mt-16 lg:gap-x-10">
          {/* The mark at the turn — the same punctuation <WorkshopJourney>
              and the About purpose section use, so the footer is marked the
              way the rest of the site is. Sized by its wrapper: <DoodleMark>
              fills the box it is given. */}
          <span
            aria-hidden
            className="absolute -top-5 left-0 block h-10 w-10"
          >
            {/* Deep Lilac, not the Soft Lavender it was. On Charcoal that
                lavender measured 6.49:1; on White Rock it is 1.44:1 and the
                mark simply disappears. Deep Lilac is 3.95:1 here and clears
                the 3:1 a graphical mark owes. */}
            <DoodleMark name="starleaf" color="#9059A4" treatment="draw" delay={120} />
          </span>

          {partners.map((partner) => {
            /* Hoisted for the same reason the groups above hoist theirs: the
               swatch draws the blot and the span publishes it to the brush,
               and `linkPaint(paintCursor++)` written twice would hand out two
               different colours and advance the run by two. */
            const directionsPaint = linkPaint(paintCursor++);
            return (
            <div key={partner.slug} className="col-span-12 text-center sm:col-span-6 sm:text-left lg:col-span-4">
              <FooterHeading mark="bow" markColor="#9059A4">
                Find us
              </FooterHeading>
              <p className="mt-4 flex items-center justify-center gap-2 text-lead leading-snug text-text sm:justify-start">
                <MapPin aria-hidden size={16} strokeWidth={1.9} className="shrink-0 text-primary" />
                {partner.name}
              </p>
              <p className="mt-1 text-body text-text/75">{partner.locality}</p>
              {partner.locationHref ? (
                <a
                  href={partner.locationHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LINK} mt-3 items-baseline gap-2`}
                >
                  {/*
                    ==========================================================
                    THE PAINT, NOT A HAIRLINE — at the client's ask
                    ==========================================================

                    This was `border-b border-text/60` deepening to Deep Lilac
                    on hover: a rule under a word, which is what every link on
                    this site looked like before <PaintStroke> existed. It was
                    the last link in the footer still wearing it, so the one
                    outbound link in the contact column answered the pointer
                    differently from the ten above and below it.

                    The swatch takes the SAME `paintCursor` the nav groups
                    above run off, so the palette keeps counting through this
                    link rather than restarting after it — which is the whole
                    reason that counter is a single `let` for the file.

                    IT IS THE LAST CALLER OF THAT COUNTER AFTER THE GROUPS.
                    The policies band took a swatch per link too and has since
                    been redrawn with arrow markers instead, so nothing below
                    this advances the run any further. Worth saying because
                    the comments down there still describe the swatch: they
                    are stale, not a second user of this cursor.

                    NO `pb-0.5`. That half-step existed to hold the border off
                    the descenders. The blot is inked in the leading BELOW the
                    word — see the note on the policies band — so padding
                    under the text pushes the paint down out of its own line
                    box rather than making room for it.
                  */}
                  <span
                    className="relative inline-block"
                    data-paint
                    style={{ "--paint": directionsPaint } as CSSProperties}
                  >
                    <PaintStroke paint={directionsPaint} shape="blot" />
                    Get directions
                  </span>
                  <span className="sr-only">(opens Google Maps in a new tab)</span>
                  {/* `ArrowUpRight`, not the &#8599; entity it replaced. The
                      entity renders in whatever the system font has for it —
                      a different weight and baseline on every platform, and
                      nothing like the stroke the rest of the page is drawn
                      with. An icon inherits the ink and the weight. */}
                  <ArrowUpRight
                    aria-hidden
                    size={14}
                    strokeWidth={2}
                    className="shrink-0 translate-y-[1px] transition-transform duration-500 ease-editorial motion-safe:group-hover/link:-translate-y-0.5 motion-safe:group-hover/link:translate-x-0.5"
                  />
                </a>
              ) : null}
            </div>
            );
          })}

          <div className="col-span-12 text-center sm:col-span-6 sm:text-left lg:col-span-4">
            <FooterHeading mark="splash" markColor="#D97757">
              The studio
            </FooterHeading>
            <address className="mt-4 text-body not-italic text-text/75">
              {CONTACT.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            {CONTACT.email ? (
              <a href={`mailto:${CONTACT.email}`} className={`${LINK} mt-2 items-center gap-2`}>
                <Mail
                  aria-hidden
                  size={15}
                  strokeWidth={1.9}
                  className="shrink-0 text-primary transition-transform duration-300 ease-editorial motion-safe:group-hover/link:-translate-y-px"
                />
                {CONTACT.email}
              </a>
            ) : null}
            {CONTACT.phone ? (
              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                className={`${LINK} items-center gap-2`}
              >
                <Phone
                  aria-hidden
                  size={15}
                  strokeWidth={1.9}
                  className="shrink-0 text-primary transition-transform duration-300 ease-editorial motion-safe:group-hover/link:-translate-y-px"
                />
                {CONTACT.phone}
              </a>
            ) : null}
          </div>

          {/*
            The mission, moved down out of the logo block to close this row.
            It was sitting alone under the mark while this band ran two
            thirds empty; here it does the work of a third column and the
            page ends on what the studio is for rather than on an address.
          */}
          <div className="col-span-12 text-center sm:col-span-6 sm:text-left lg:col-span-4">
            <FooterHeading mark="bow" markColor="#9059A4">
              Why we do it
            </FooterHeading>
            <p className="mx-auto mt-4 max-w-[22rem] text-body text-text/75 sm:mx-0">{MISSION}</p>
          </div>

          {socials.length > 0 ? (
            <div className="col-span-12 text-center sm:col-span-6 sm:text-left lg:col-span-4">
              <FooterHeading>Follow</FooterHeading>
              <ul className="mt-4 space-y-2.5">
                {socials.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/*
          ==================================================================
          THE POLICIES, IN A BAND OF THEIR OWN
          ==================================================================

          The client asked for "a clearly organized policy/legal section" in
          the footer, and then for it to stay visually clean. Those pull
          against each other at eight links, and where they are put decides
          which one wins:

            a fourth nav group .... the groups above are a `sm:grid-cols-3`,
                                    so a fourth either breaks the row into
                                    two uneven lines or squeezes all four
                                    into thirds. And it would read as a
                                    fourth DESTINATION group — Create, The
                                    Maison, Help, Policies — when a policy is
                                    not somewhere you were going.
            the copyright line .... where <LEGAL_NAV> sits, and the natural
                                    home for two or three links. Eight turns
                                    that one quiet row into the loudest thing
                                    at the bottom of every page on the site.
            a band of their own ... this. One label, one wrap, under the rule
                                    that already closes the row above, set in
                                    the same small type as the copyright
                                    beneath it rather than the nav type above
                                    it — so it reads as reference material,
                                    which is what it is.

          DERIVED FROM {@link POLICIES}, NOT RETYPED. A footer list of policy
          names is the single most likely place for a name to drift out of
          step with the page it points at — renaming "Refund & Exchange" in
          lib/policies.ts would have left the footer saying the old one, and
          nothing would have failed. `navLabel` exists on the record for this
          one caller: the page titles are title-case and eight of those in a
          row reads as a contents page.

          `text-text/75` matches the foot below rather than the `LINK` ink
          above, and clears 7.9:1 on White Rock.
        */}
        {/*
          ==================================================================
          THE POLICIES, ON A PLATE
          ==================================================================

          THIS WAS A HAIRLINE AND A WRAP OF GREY TEXT, and the client's note
          on it was that it did not look designed. It did not: eight labels at
          13px, set at /75, loose across 1400px under a rule — the one block
          in a footer full of script, paint and brand marks that had none of
          them. Reference material is allowed to be quiet; it is not allowed
          to look unfinished.

          A PLATE IS THE SITE'S OWN ANSWER TO "SET THIS APART". Light Sage on
          the footer's White Rock is the pairing <PartnerPlate> documents and
          the policy pages themselves use for their callouts, and `@utility
          plate` exists precisely because the two measure 1.03:1 against each
          other — it supplies the 1px ring and the veil that let a sage panel
          read as a laid object rather than as a patch of the same paper. So
          the band becomes a thing on the page, and the rule that used to
          divide it off is no longer needed: an object does not want a line
          above it as well.

          FOUR COLUMNS, NOT A WRAP. The wrap put "Photography & media" alone
          on its own line at most widths and broke differently at every one.
          A grid lines the eight up in two tidy rows and gives each label its
          own track, so the list can be scanned down as well as across.

          AND THE LINKS ARE PAINTED, WHICH IS THE WHOLE POINT. They take the
          same <PaintStroke> swatch as the navigation above, off the same
          `paintCursor` — so the palette carries on running rather than
          restarting, and the policies read as the same family of link in a
          quieter register. On Light Sage the three paints measure Deep Lilac
          3.83:1, Warm Terracotta 2.36:1 and Soft Lavender 1.51:1, which is
          within a hundredth of what each does on the White Rock they were
          already drawn on, so nothing about the swatch changes with the
          ground.

          The ink is full-strength Charcoal rather than the /75 it was: 9.07:1
          on sage, and a label read against a swatch wants the whole of it —
          the same argument the note on `LINK` makes for the groups above.
        */}
        <nav
          aria-labelledby="footer-policies"
          className="plate relative mt-12 overflow-clip rounded-[1.75rem] bg-sage px-6 py-7 text-center sm:px-8 sm:py-8 sm:text-left md:mt-14 md:px-10 md:py-9"
        >
          {/* A mark bleeding off the plate's own corner, which is where every
              other plate on this site puts one — <PartnerPlate> breaks a
              cut-out off its bottom-right in exactly this way. `overflow-clip`
              on the panel cuts it to the radius; clip rather than hidden, so
              the draw timeline inside <DoodleMark> still runs.

              A STAMP AND NOT A DRAW, which is the difference between a mark
              and a scribble. `draw` inks an outline, and an outline of a
              coral at 7rem, half of it clipped by the corner, reads as a
              stray pen line rather than as one of the brand's shapes. The
              filled cut is a shape at any crop.

              Deep Lilac, 3.83:1 on this sage. Warm Terracotta is 2.36:1 here
              and is spent inside the policy pages themselves on their callout
              edges; a third marking colour in a footer this quiet is one too
              many.

              TOP-RIGHT, AND IT WAS BOTTOM-RIGHT FIRST. The bottom corner is
              where a plate's mark normally goes and it is the one corner this
              plate cannot give: the links run four across to the right edge,
              so a 7rem shape there landed on "Cancellation & rescheduling"
              and read as a splotch over the type. The top-right is genuinely
              empty — the heading and its line stop at 46 characters — so the
              mark goes where the plate actually has room rather than where
              the pattern says. */}
          <span
            aria-hidden
            /* HUNG MOSTLY OFF THE CORNER, at <PartnerPlate>'s sizes rather
               than at the 7rem this started on. Stamped at full strength and
               sitting inside the panel, a 112px lilac cut was the loudest
               object in the footer and it was decoration — the shape has to
               be clipped by the edge it is breaking, or it is not a cut-out,
               it is a sticker. 5.5rem with half of it outside is what every
               other plate on this site shows. */
            className="pointer-events-none absolute -right-7 -top-8 hidden w-24 rotate-[14deg] sm:block"
          >
            <DoodleMark name="coral" color="#9059A4" treatment="stamp" delay={200} />
          </span>

          {/*
            ==============================================================
            THE EXPLANATION BESIDE THE LIST, NOT STACKED OVER IT
            ==============================================================

            The heading and its sentence ran the full width of the plate and
            the eight links sat underneath in four columns, which left the
            sentence stretched over 46 characters of a 1400px panel and the
            links crammed into the bottom half. Held in a column of its own
            the sentence reads at its natural measure, the links get three
            tidy columns instead of four tight ones, and the plate stops
            being a heading with a grid bolted under it.
          */}
          <div className="grid grid-cols-12 gap-x-8 gap-y-7">
            <div className="col-span-12 lg:col-span-4 xl:col-span-3">
              {/* Deep Lilac on the sage plate is 3.83:1 — the same ink the
                  cut-out breaking this plate's corner is drawn in. */}
              <FooterHeading id="footer-policies" mark="bow" markColor="#9059A4">
                Policies
              </FooterHeading>

              {/* One line, because a heading alone leaves the reader to guess
                  whether these are eight pages or eight sections of one. */}
              <p className="mx-auto mt-3 max-w-[34ch] text-fine leading-[1.7] text-text/80 sm:mx-0">
                How sessions run, what we ask of visitors, and what happens if
                plans change.
              </p>
            </div>

          {/*
            `gap-y-3.5` FOR THE REASON THE GROUPS ABOVE TAKE `space-y-3.5`.
            Each link is a 45.25px box that occupies 33.25 of flow, because
            `-my-1.5` pulls 6px off each end; at a 10px gap the rows pitch at
            43.25 and every box overlaps the one above it. 14px pitches them
            at 47.25 and clears by 2. The full arithmetic is on `LINK`.
          */}
            <ul className="relative col-span-12 grid grid-cols-1 gap-x-7 gap-y-1 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3 xl:col-span-9">
            {POLICIES.map((policy) => {
              return (
                <li key={policy.slug}>
                  <Link
                    href={`/policies/${policy.slug}`}
                    /*
                      ==================================================
                      `text-body`, THE SAME SIZE AS THE NAVIGATION ABOVE
                      ==================================================

                      These were `text-fine` — 13px, on the reasonable-sounding
                      argument that reference links should be quieter than
                      navigation. Rendered, the swatch underneath them was not
                      there at all, and the reason is arithmetic rather than
                      taste: <PaintStroke> sizes its blot to the span it sits
                      in and scales it by `--swell`. A 16px link gives it a
                      35.5px box and inks 7.1px of paint in the leading below
                      the word. A 13px link gives it 20.9px, inks 4.2px — and
                      at that size the masked brush, which tapers at both
                      ends, is drawn almost entirely BEHIND the glyphs, because
                      a 13px line box has about 3px under its baseline to put
                      anything in.

                      Forcing the swell back up was tried and is the wrong
                      repair: it inks the right number of pixels in the wrong
                      place, through the type.

                      So the type takes the footer's own body size and the
                      swatch needs no tuning at all — it is the navigation's
                      swatch, drawn the way the navigation draws it. The
                      hierarchy is carried by the GROUND instead, which is
                      what the plate is for: these are plainly the quieter
                      list because they sit on a panel of their own, not
                      because their labels were shrunk until their paint
                      stopped working.

                      `inline-flex` and not `flex`: the swatch is drawn to the
                      span's box, and a full-width cell would stretch a blot
                      meant for a word across an empty track.
                    */
                    /* NO `leading-snug`, which was the last thing keeping the
                       swatch invisible after the size was fixed. The blot is
                       drawn to the span's box and inked in the leading BELOW
                       the word; snug leading on a 16px label gives a 22px box
                       where the groups above get 33, and the paint goes back
                       behind the glyphs. The footer's own 1.65 is the number
                       the swatch was tuned against. */
                    className="group/link flex items-baseline gap-2.5 py-1.5 text-fine text-text/90 transition-colors duration-300 ease-soft hover:text-primary"
                  >
                    {/*
                      ====================================================
                      `isolate`, AND WITHOUT IT THE PAINT IS UNDER THE PLATE
                      ====================================================

                      <PaintStroke> draws its swatch at `z-index: -1` so the
                      word sits on top of its own paint. A negative z-index
                      paints behind the BACKGROUND of its stacking context's
                      element, and the nearest stacking context here is not
                      this link, or the panel — it is the <footer>, which
                      carries `isolate` for the wave. So the swatch was being
                      painted behind the footer's own content and the sage
                      plate's background was then laid straight over it.

                      Every measurement said the paint was fine — right box,
                      right 7.1px of ink, right colour, `visibility: visible`,
                      identical in every computed value to the navigation's.
                      It was simply underneath the panel. The groups above
                      never showed this because nothing is painted over them.

                      `isolate` on the span gives the -1 somewhere local to
                      resolve, so it lands behind the word and in front of the
                      plate. Same trap, same fix, as the `-z-10` note on
                      <SectionShapes>.
                    */}
                    {/*
                      AN ARROW, NOT A PAINTED SWATCH, AND THAT IS WHY THESE
                      COULD FINALLY GET SMALLER.

                      The long note above explains why these links were set
                      at the navigation's size: <PaintStroke> inks its blot
                      into the leading UNDER the word, a 13px line box has
                      about 3px to put it in, and below 16px the brush is
                      drawn through the glyphs instead of beneath them. So
                      the type could not come down while the paint stayed.

                      The client's note is that these are too big — they are
                      eight legal links and they were the same size as the
                      footer's primary navigation. Swapping the affordance
                      resolves the conflict rather than fighting it: the
                      paint stays where it works, on the navigation, and the
                      quiet list is marked the way a quiet list should be,
                      with a small lilac arrow that travels on hover and a
                      rule that only appears when you are on the link.
                    */}
                    <span
                      aria-hidden
                      className="shrink-0 text-primary/70 transition-transform duration-300 ease-editorial motion-safe:group-hover/link:translate-x-0.5"
                    >
                      &#8594;
                    </span>
                    <span className="underline decoration-transparent decoration-[1.5px] underline-offset-[5px] transition-colors duration-300 ease-soft group-hover/link:decoration-primary/55">
                      {policy.navLabel}
                    </span>
                  </Link>
                </li>
              );
            })}
            </ul>
          </div>
        </nav>

        {/* ---- the foot ---- */}
        <div className="mt-9 flex flex-col items-center gap-5 pt-0 text-center text-fine text-text/75 sm:flex-row sm:items-center sm:justify-between sm:text-left md:mt-10">

          <div className="flex flex-col items-center gap-x-7 gap-y-2 sm:flex-row sm:items-center">
            <p>
              &copy; {year} {SITE.legalName}
            </p>
            {LEGAL_NAV.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
                {LEGAL_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="transition-colors hover:text-text">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <BackToTop />
        </div>
      </Container>
    </footer>
  );
}

/**
 * A heading in the footer, with the short rule every section on the site
 * opens with.
 *
 * THE RULE IS THE WHOLE CHANGE, and it is reuse rather than decoration. Six
 * bare tracked labels floating in a dark field is what a footer looked like
 * before the rest of this site had a language; <Eyebrow> has carried a rule
 * in front of exactly this type at exactly this size on every section above,
 * so this was the one surface speaking a dialect of its own.
 *
 * THE COLOUR IS WRITTEN OUT RATHER THAN TAKEN FROM `inkFor`, which is the one
 * place this component stops reusing <Eyebrow>'s decisions, and it is a
 * measurement. `inkFor("light")` gives Warm Terracotta, and that ground covers
 * "the page off-white, White Rock, Light Sage" as one — but Terracotta on
 * White Rock is 2.44:1, under the 3:1 a rule identifying a heading owes. Deep
 * Lilac is 3.95:1 on the same ground and clears it, so the rule takes the
 * accent instead. (`inkFor("dark")` was right while this footer was Charcoal
 * and its Light Sage would now be 1.03:1 — invisible.)
 *
 * Still an <h2>, and not <Eyebrow> itself, which renders a <p>. These head
 * lists inside a nav landmark and an address block; the rule is styling and
 * the heading is structure, and swapping the element to reuse the one would
 * give up the other.
 */
/*
  A MARK INSTEAD OF A RULE, where the heading names one.

  Every group in this footer opened on the same 24px lilac hairline — seven
  identical dashes down one column of the page. The reference the client sent
  puts a small drawn shape in front of each label instead, which is the right
  idea and the wrong shapes: those are pen scribbles and biro strokes, and
  this brand has its own set. So each heading takes one of the Maison's own
  cut-outs, at label size, and the rule stays as the fallback for any heading
  that is not given one.

  Deep Lilac throughout: 3.83:1 on the sage plate and 4.90 on the cream, and
  it is the colour every other mark in this footer is already drawn in.
*/
function FooterHeading({
  id,
  mark,
  markColor = "#9059A4",
  children,
}: {
  id?: string;
  mark?: DoodleName;
  markColor?: string;
  children: string;
}) {
  return (
    <h2
      id={id}
      className="flex items-center justify-center gap-2.5 text-label font-medium uppercase tracking-eyebrow text-text sm:justify-start"
    >
      {mark ? (
        <span aria-hidden className="block w-[1.15rem] shrink-0">
          <DoodleMark name={mark} color={markColor} treatment="stamp" depth={0} />
        </span>
      ) : (
        <span aria-hidden className="h-px w-6 shrink-0 bg-primary" />
      )}
      {children}
    </h2>
  );
}
