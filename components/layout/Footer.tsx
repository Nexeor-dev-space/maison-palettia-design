import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BackToTop } from "@/components/layout/BackToTop";
import { Container } from "@/components/ui/Container";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { forScript } from "@/components/ui/SectionHeader";
import { MISSION, TAGLINE } from "@/lib/brand";
import { BRAND_LOGO, CONTACT, FOOTER_NAV, LEGAL_NAV, SITE, SOCIAL_LINKS } from "@/lib/constants";
import { getMallPartners } from "@/lib/partners";

/** A footer link: the label, and a rule that draws in under it on hover. */
const LINK =
  "group/link -my-1.5 inline-flex py-1.5 text-body text-text/75 transition-colors duration-300 ease-soft hover:text-text";

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
      <Container className="relative pb-8 pt-16 md:pt-20 lg:pb-10 lg:pt-24">
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
          <div className="col-span-12 lg:col-span-5">
            <Link href="/" aria-label={`${SITE.name} — home`} className="inline-block">
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
            <p className="mt-7 heading-script max-w-[34rem] text-[clamp(1.9rem,1.35rem+1.6vw,2.75rem)] leading-[1.22] text-primary">
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
          <nav aria-label="Footer" className="col-span-12 lg:col-span-7 lg:col-start-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {FOOTER_NAV.map((group) => (
                <div key={group.title}>
                  <FooterHeading>{group.title}</FooterHeading>
                  <ul className="mt-5 space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} className={LINK}>
                          <span className="border-b border-transparent pb-0.5 transition-colors duration-300 ease-soft group-hover/link:border-primary">
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    ))}
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
        <div className="relative mt-12 grid grid-cols-12 gap-x-6 gap-y-10 border-t border-text/20 pt-12 md:mt-16 lg:gap-x-10">
          {/* The mark at the turn — the same punctuation <WorkshopJourney>
              and the About purpose section use, so the footer is marked the
              way the rest of the site is. Sized by its wrapper: <DoodleMark>
              fills the box it is given. */}
          <span
            aria-hidden
            className="absolute -top-5 left-0 block h-10 w-10 bg-cream pr-2"
          >
            {/* Deep Lilac, not the Soft Lavender it was. On Charcoal that
                lavender measured 6.49:1; on White Rock it is 1.44:1 and the
                mark simply disappears. Deep Lilac is 3.95:1 here and clears
                the 3:1 a graphical mark owes. */}
            <DoodleMark name="starleaf" color="#9059A4" treatment="draw" delay={120} />
          </span>

          {partners.map((partner) => (
            <div key={partner.slug} className="col-span-12 sm:col-span-6 lg:col-span-4">
              <FooterHeading>Find us</FooterHeading>
              <p className="mt-4 text-lead leading-snug text-text">{partner.name}</p>
              <p className="mt-1 text-body text-text/75">{partner.locality}</p>
              {partner.locationHref ? (
                <a
                  href={partner.locationHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LINK} mt-3 items-baseline gap-2`}
                >
                  <span className="border-b border-text/60 pb-0.5 transition-colors duration-300 ease-soft group-hover/link:border-primary">
                    Get directions
                  </span>
                  <span className="sr-only">(opens Google Maps in a new tab)</span>
                  <span aria-hidden>&#8599;</span>
                </a>
              ) : null}
            </div>
          ))}

          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <FooterHeading>The studio</FooterHeading>
            <address className="mt-4 text-body not-italic leading-[1.75] text-text/75">
              {CONTACT.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            {CONTACT.email ? (
              <a href={`mailto:${CONTACT.email}`} className={`${LINK} mt-2`}>
                {CONTACT.email}
              </a>
            ) : null}
            {CONTACT.phone ? (
              <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className={`${LINK} block`}>
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
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <FooterHeading>Why we do it</FooterHeading>
            <p className="mt-4 max-w-[22rem] text-body leading-[1.8] text-text/75">{MISSION}</p>
          </div>

          {socials.length > 0 ? (
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
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

        {/* ---- the foot ---- */}
        <div className="mt-14 flex flex-col gap-5 border-t border-text/20 pt-7 text-fine text-text/75 sm:flex-row sm:items-center sm:justify-between md:mt-16">

          <div className="flex flex-col gap-x-7 gap-y-2 sm:flex-row sm:items-center">
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
function FooterHeading({ children }: { children: string }) {
  return (
    <h2 className="flex items-center gap-3 text-label font-semibold uppercase tracking-eyebrow text-text">
      <span aria-hidden className="h-px w-6 shrink-0 bg-primary" />
      {children}
    </h2>
  );
}
