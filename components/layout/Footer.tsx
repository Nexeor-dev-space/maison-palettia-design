import Link from "next/link";

import { BackToTop } from "@/components/layout/BackToTop";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { CONTACT, FOOTER_NAV, LEGAL_NAV, SITE, SOCIAL_LINKS } from "@/lib/constants";
import type { NavGroup } from "@/types";

/**
 * The wordmark, set to run the measure exactly as the hero's does.
 *
 * The page opens on this mark in cream over charcoal and closes on it in Deep
 * Lilac over Light Sage — the same words, the same face, at the same width, so
 * the site reads as one room entered and left rather than as a masthead and a
 * utility strip. The sizes are the hero's, solved the same way: the type's
 * width is linear in its size, so each was derived from a measured render and
 * checked at the narrow end of its own breakpoint. One line from `lg`, two
 * below it, which is why the `lg` value is so much smaller.
 */
const WORDMARK =
  "font-wordmark font-normal uppercase leading-[0.92] tracking-[0.015em] " +
  "text-[21.5vw] md:text-[23.5vw] lg:text-[12.8vw] lg:leading-[0.9]";

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
 * Composition, top to bottom: the mark, the farewell, the site map weighted
 * to the left against connection and address on the right, the one utility,
 * and a quiet legal line under a hairline. Back-to-top sits at the foot
 * rather than the head so it is reached after the footer has been read — on a
 * phone this section is taller than the screen, and a control at the top
 * would mean scrolling back up to use it. Nothing is a four-column grid; the
 * asymmetry is in what the two halves hold, not in staggered edges.
 *
 * Every muted ink here is `text/75` and none goes below it. Light Sage is a
 * darker ground than the page's off-white, so the point where charcoal stops
 * clearing 4.5:1 moves with it: /75 measures 4.71:1 and /70 only 4.14:1. The
 * /70 floor quoted elsewhere in the codebase is the floor for the off-white,
 * not for this.
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
      <div
        aria-hidden
        className="arch h-[7vw] max-h-36 min-h-10 w-full bg-sage [--arch-rise:100%]"
      />

      <div className="bg-sage pb-12 pt-8 md:pb-16 md:pt-12 lg:pb-20">
        <Container>
          {/* 01 — the mark, and the first thing under the arch. */}
          <Reveal>
            <p
              className={`${WORDMARK} flex flex-col items-center text-primary lg:flex-row lg:justify-center lg:gap-[3.2vw]`}
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
            <Signature ground="sage" className="mt-8 text-center md:mt-10">
              see you at the maison
            </Signature>
          </Reveal>

          {/*
            02 / 03 — the site map against connection. Three groups on the
            left, one plus the address on the right: the halves carry
            different weights on purpose, which is what keeps this from
            reading as a row of equal columns.
          */}
          <div className="mt-20 grid grid-cols-12 gap-x-6 gap-y-14 md:mt-24 lg:mt-28 lg:gap-x-10">
            <nav
              aria-label="Footer"
              className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:col-span-7 lg:gap-x-10"
            >
              {FOOTER_NAV.map((group) => (
                <FooterGroup key={group.title} group={group} />
              ))}
            </nav>

            <div className="col-span-12 lg:col-span-4 lg:col-start-9">
              <GroupHeading>Connect</GroupHeading>
              <ul className="mt-6 flex flex-col gap-3.5">
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

              <address className="mt-9 not-italic text-sm leading-[1.9] text-text/75">
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
            <div className="mt-16 flex justify-start md:mt-20 md:justify-end">
              <BackToTop />
            </div>
          </Reveal>

          {/* 04 — the last line. */}
          <Reveal variant="fadeIn">
            <div className="mt-10 flex flex-col gap-4 border-t border-text/20 pt-7 text-[0.68rem] uppercase tracking-eyebrow text-text/75 sm:flex-row sm:items-center sm:justify-between">
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
      <ul className="mt-6 flex flex-col gap-3.5">
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
const LINK = "group inline-flex text-sm text-text transition-colors duration-300 ease-soft hover:text-primary";

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
