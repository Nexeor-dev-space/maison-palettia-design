import Link from "next/link";

import { BackToTop } from "@/components/layout/BackToTop";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { CONTACT, FOOTER_NAV, LEGAL_NAV, SITE, SOCIAL_LINKS } from "@/lib/constants";
import type { NavGroup } from "@/types";

/**
 * The wordmark, set to run the measure as the hero's does.
 *
 * The page opens on the name and closes on it, at the same width both times,
 * so the site reads as one room entered and left rather than as a masthead
 * and a utility strip. The two are set in different faces on purpose: Qarine
 * caps at the top, Hapsha Sophia Script here. This is the only place on the
 * site the brand script is given the name at size, and holding it back to the
 * last thing on the page is what keeps it from becoming the site's default
 * voice — the hero is the announcement and this is the signature under it.
 *
 * Mixed case and unspaced because the face requires it. A connecting script
 * stops connecting the moment it is set in capitals, and runs well over twice
 * as wide besides — 13.4em against 5.8em for the same fifteen characters — so
 * caps would force the type down to a third of the size to fit the measure.
 *
 * The figures are the hero's, and so are its viewport-height ceilings. Those
 * were dropped here while nothing in the footer was bound to the fold; the
 * footer is pinned now (see <FooterReveal>), which binds all of it. A pinned
 * element taller than the window keeps its head above the top of the screen
 * with no way to scroll to it, so the mark takes the measure only while the
 * measure is the tighter of the two constraints, and gives way to the window
 * when it is not. On a tall display nothing below changes at all; on a laptop
 * the mark comes down enough for the whole footer to sit on one screen. They
 * are sized for the script's own metrics and do not transfer to Qarine — see
 * the hero's own set, which are solved separately.
 *
 * The `lg` step stops growing at 14rem, which is the size at which the mark
 * spans about the same width the site map below it is capped to. Without the
 * ceiling the wordmark keeps reaching for the window while everything under it
 * holds at 1440, and the footer reads as two compositions at two measures
 * rather than one block.
 */
const WORDMARK =
  "font-display font-normal leading-[1.06] tracking-normal " +
  "text-[29vw] md:text-[min(15vw,17vh)] lg:text-[min(15.6vw,14rem,17vh)]";

/**
 * Global site footer — the last room.
 *
 * A Light Sage field rising through an arch out of the White Rock invitation
 * above it. The arch is the Maison's own mark: it crowns the photograph that
 * opens the brand introduction and the one that opens the creative strands,
 * and here it is the doorway on the way out rather than a frame around a
 * picture. That is the whole reason the ground changes colour — an arch cut
 * into White Rock over White Rock would be a shape nobody could see.
 *
 * Deep Lilac is the anchor rather than a second lilac field: the philosophy
 * section already spends the page's one lilac ground, and a second so soon
 * after would leave the colour describing a mood instead of marking a moment.
 * It appears here as ink only — the wordmark, the signature — which on Light
 * Sage measures 3.83:1 and is why both are set well above the 24px where that
 * ratio is enough (see <Signature>).
 *
 * Every muted ink here is `text/75` and none goes below it. Light Sage is a
 * darker ground than the page's off-white, so the point where charcoal stops
 * clearing 4.5:1 moves with it: /75 measures 4.71:1 and /70 only 4.14:1. The
 * /70 floor quoted elsewhere in the codebase is the floor for the off-white,
 * not for this.
 *
 * Composition, top to bottom: the mark, the farewell, the site map, the one
 * utility, and a quiet legal line under a hairline.
 *
 * The map is four even columns, which is a reversal. It was three groups
 * weighted left against connection on the right, so that the halves carried
 * different weights rather than reading as a row of equal columns. That works
 * at a fixed measure; it stopped working when the site's container lost its
 * max-width, because two halves of a 1990px window are two 900px columns
 * holding two links each. The map is capped at the old site width for the same
 * reason. Whatever the asymmetry bought, it was not worth a footer that reads
 * as mostly air.
 *
 * Server component. The one interactive part is <BackToTop>.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    // The ground the arch cuts into, so its corners reveal the same White Rock
    // the invitation above closes on rather than the page's off-white.
    <footer className="bg-cream">
      {/*
        The arch. A strip of its own rather than a radius on the whole footer:
        the utility sets the vertical radius as a share of the element's
        height, so giving it an element whose height is a share of the
        viewport keeps the sweep proportional to the width at every size
        instead of stretching with the footer's contents.
      */}
      {/*
        The arch takes a ceiling against the window for the same reason the
        wordmark does — it is the tallest single thing here after the mark, and
        the footer has to fit the screen it is pinned to.
      */}
      <div
        aria-hidden
        className="arch h-[min(7vw,8vh)] max-h-36 min-h-10 w-full bg-sage [--arch-rise:100%]"
      />

      <div className="bg-sage pb-10 pt-6 md:pb-12 md:pt-8 lg:pb-[min(3.5rem,5vh)]">
        <Container>
          {/* 01 — the mark, and the first thing under the arch. */}
          <Reveal>
            <p
              className={`${WORDMARK} flex flex-col items-center text-primary md:flex-row md:justify-center md:gap-[4vw]`}
            >
              {/*
                Not a heading: the document already has one wordmark in its
                outline, in the hero, and a second would say the page has two
                subjects. The explicit space keeps it reading as two words to
                a screen reader announcing the paragraph.
              */}
              <span className="block">Maison</span> <span className="block">Palettia</span>
            </p>
          </Reveal>

          {/* 01b — the farewell, in the Maison's signage voice. */}
          <Reveal variant="fadeIn" delay={0.15}>
            <Signature ground="sage" className="mt-6 text-center md:mt-8">
              see you at the maison
            </Signature>
          </Reveal>

          {/*
            02 / 03 — the site map. Four even columns, capped at the old site
            width so the groups stay a readable distance apart on a wide
            display instead of drifting to the corners of the window.

            The nav keeps its own element and spans three of the four columns
            rather than being flattened into the grid: `display: contents` on a
            landmark would line the groups up just as well and has a history of
            dropping the landmark out of the accessibility tree, which is a bad
            trade for an alignment nothing else depends on.
          */}
          <div className="mx-auto mt-12 grid max-w-site grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4 md:mt-14 lg:mt-[min(4rem,5.5vh)] lg:gap-x-10">
            <nav
              aria-label="Footer"
              className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-12 sm:col-span-3 sm:grid-cols-3 lg:gap-x-10"
            >
              {FOOTER_NAV.map((group) => (
                <FooterGroup key={group.title} group={group} />
              ))}
            </nav>

            <div className="col-span-2 sm:col-span-1">
              <GroupHeading>Connect</GroupHeading>
              <ul className="mt-5 flex flex-col gap-3">
                {SOCIAL_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
                        <LinkLabel>{label}</LinkLabel>
                      </a>
                    ) : (
                      // No href yet. Rendered as plain text rather than as a
                      // dead link, so nothing looks clickable that is not.
                      <span className="text-sm text-text/75">{label}</span>
                    )}
                  </li>
                ))}
              </ul>

              <address className="mt-7 not-italic text-sm leading-[1.9] text-text/75">
                {CONTACT.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                {CONTACT.email ? (
                  <a href={`mailto:${CONTACT.email}`} className={`${LINK} mt-3`}>
                    <LinkLabel>{CONTACT.email}</LinkLabel>
                  </a>
                ) : null}
                {CONTACT.phone ? (
                  <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className={LINK}>
                    <LinkLabel>{CONTACT.phone}</LinkLabel>
                  </a>
                ) : null}
              </address>
            </div>
          </div>

          {/* 05 — the utility, floated at the foot of the measure. */}
          <Reveal variant="fadeIn">
            <div className="mx-auto mt-12 flex max-w-site justify-start md:mt-14 md:justify-end">
              <BackToTop />
            </div>
          </Reveal>

          {/* 04 — the last line. */}
          <Reveal variant="fadeIn">
            <div className="mx-auto mt-8 flex max-w-site flex-col gap-4 border-t border-text/20 pt-6 text-[0.68rem] uppercase tracking-eyebrow text-text/75 sm:flex-row sm:items-center sm:justify-between">
              <p>
                &copy; {year} {SITE.legalName}
              </p>
              <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
                {LEGAL_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="transition-colors duration-300 ease-soft hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </div>
    </footer>
  );
}

/**
 * One column of the site map.
 *
 * A heading and a list, so the group's name is announced with its links rather
 * than sitting beside them as decoration.
 */
function FooterGroup({ group }: { group: NavGroup }) {
  return (
    <div>
      <GroupHeading>{group.title}</GroupHeading>
      <ul className="mt-5 flex flex-col gap-3">
        {group.items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={LINK}>
              <LinkLabel>{item.label}</LinkLabel>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupHeading({ children }: { children: string }) {
  return (
    <h2 className="text-[0.62rem] font-medium uppercase tracking-eyebrow text-text/75">
      {children}
    </h2>
  );
}

/** The row a footer link sits in. The rule lives on the label inside it. */
const LINK =
  "group inline-flex text-sm text-text transition-colors duration-300 ease-soft hover:text-primary";

/**
 * A link's text, with the rule that draws itself on hover.
 *
 * The underline is a border on the label rather than `text-decoration`, so it
 * sits clear of the descenders and can be animated; it grows from the left
 * instead of fading, which reads as drawn rather than switched on.
 */
function LinkLabel({ children }: { children: string }) {
  return (
    <span className="relative">
      {children}
      <span
        aria-hidden
        className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-500 ease-editorial group-hover:scale-x-100"
      />
    </span>
  );
}
