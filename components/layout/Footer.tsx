import Link from "next/link";

import { BackToTop } from "@/components/layout/BackToTop";
import { Reveal } from "@/components/motion/Reveal";
import { SocialIcons } from "@/components/layout/SocialIcons";
import { Container } from "@/components/ui/Container";
import { Signature } from "@/components/ui/Signature";
import { CONTACT, FOOTER_NAV, LEGAL_NAV, SITE } from "@/lib/constants";
import type { NavGroup } from "@/types";

/**
 * The closing mark.
 *
 * THE OFFICIAL ASSET, NOT A SECOND SETTING OF THE NAME. This was "Maison
 * Palettia" typed out in the brand script at up to 14vh — a logo made out of
 * type, and the site's second such treatment after the hero's. The guidelines
 * name one logo asset; a footer that draws its own is drawing a different one,
 * however close the face.
 *
 * <Wordmark variant="logo"> renders that asset, so the foot of every page and
 * the bar at the top of it now show the same mark. Sized to the footer rather
 * than the bar — this is the page's closing gesture and can afford the room.
 */

/**
 * Global site footer — the last room.
 *
 * An Ink field meeting the page on a straight edge. It used to rise through
 * an arch out of the White Rock invitation
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
    // The ground the arch cuts into, so its corners reveal White Rock rather
    // than the page's off-white.
    //
    // WHICH IS INVISIBLE ONLY WHERE THE SECTION ABOVE IS ALSO WHITE ROCK, and
    // that is now /about, whose closing invitation this was written against
    // before that section moved there from the homepage. Everywhere the last
    // section takes another ground — the homepage's Charcoal quotes, most
    // visibly — this band reads as a cream strip above the arch instead of as
    // the invitation continuing into it. It is a seam rather than a fault, and
    // it is the same seam every route other than /about and the homepage has
    // always had; flagged because the comment here used to promise otherwise.
    <footer>
      {/*
        NO ARCH, AND NO RADIUS ON THE TOP EDGE — removed at the client's ask.

        This was a strip of Ink cut into an arch, so the footer rose out of the
        section above it on a curve. It is gone: the footer is a flat-topped
        field now and meets the page on a straight edge.

        The `bg-cream` on the <footer> itself went with it. Its only job was to
        be what the arch's corners revealed; with no curve there are no corners
        and it would be a cream hairline under the last section.
      */}

      {/*
        ONE PLACE DECIDES THE INK, AND EVERYTHING INSIDE INHERITS IT — the same
        arrangement <HeaderBar> keeps, and for the same reason: a field this
        dark cannot be half-converted. `text-on-dark` here is what <BackToTop>
        and <SocialIcons> read through `text-current`, so neither of them has
        to know which ground it is standing on.

        `--color-focus` follows the ink as well. Deep Lilac measures 3.02:1 on
        Ink — under the 3:1 a focus ring owes with nothing to spare — so the
        ring takes White Rock here, as it does over the hero.
      */}
      <div className="bg-footer text-on-dark [--color-focus:var(--color-cream)] pb-8 pt-4 md:pb-10 md:pt-5 lg:pb-[min(2.75rem,4vh)]">
        <Container>
          {/*
            01 — NO MARK HERE, AND THAT IS THE CORRECT OUTCOME FOR NOW.

            This held "Maison Palettia" typed out in the brand script at up to
            14vh: a logo made out of type, and the site's second such treatment.
            The guidelines name one logo asset, so that had to go.

            The official asset cannot take its place on this band. logo.png is
            drawn in Light Sage on transparency — sampled, 93% of its ink is
            #d1e7be — and this footer is a Light Sage field. The two measure
            1.00:1 against each other: the mark would be perfectly invisible.

            So the footer closes on its signature line instead, and the mark
            returns the moment there is something to return.

            TODO(client): supply a dark-on-light cut of the logo — Charcoal
            Slate or Deep Lilac on transparency — and this becomes one line:
            <Wordmark className="h-16 w-auto md:h-20 lg:h-24" />.
          */}

          {/* 01b — the farewell, in the Maison's signage voice. */}
          <Reveal variant="fadeIn" delay={0.15}>
            <Signature ground="ink" className="mt-4 text-center md:mt-5">
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
          <div className="mx-auto mt-9 grid max-w-site grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4 md:mt-10 lg:mt-[min(2.75rem,4vh)] lg:gap-x-10">
            <nav
              aria-label="Footer"
              className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-9 sm:col-span-3 sm:grid-cols-3 lg:gap-x-10"
            >
              {FOOTER_NAV.map((group) => (
                <FooterGroup key={group.title} group={group} />
              ))}
            </nav>

            <div className="col-span-2 sm:col-span-1">
              <GroupHeading>Connect</GroupHeading>
              {/*
                Marks rather than words — see <SocialIcons>, which also holds
                the rule for what happens to a platform that has no URL yet and
                the pull-left that keeps the icons' 44px touch targets from
                indenting the row past the columns beside it.
              */}
              {/*
                Two columns on a phone, one from `sm`. The Connect block is the
                only cell in the map that carries two unrelated things, and
                stacking them made it the tallest row in the footer — 500px of
                a 1081px footer at 360px wide, most of it this. Side by side
                they cost one row instead of two, which is the difference
                between considering the mobile hierarchy and just letting the
                desktop one fall over.
              */}
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-1">
                <SocialIcons />

                <address className="not-italic text-body leading-[1.85] text-on-dark/80 sm:mt-2">
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
          </div>

          {/* 05 — the utility, floated at the foot of the measure. */}
          <Reveal variant="fadeIn">
            <div className="mx-auto mt-8 flex max-w-site justify-start md:mt-9 md:justify-end">
              <BackToTop />
            </div>
          </Reveal>

          {/* 04 — the last line. */}
          <Reveal variant="fadeIn">
            <div className="mx-auto mt-6 flex max-w-site flex-col gap-3 border-t border-on-dark/20 pt-5 text-fine uppercase tracking-[0.1em] text-on-dark/75 sm:flex-row sm:items-center sm:justify-between">
              <p>
                &copy; {year} {SITE.legalName}
              </p>
              <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
                {LEGAL_NAV.map((item) => (
                  <li key={item.href}>
                    {/* Same invisible pad as the nav links above — these set a
                        13px line box, the smallest targets on the site. */}
                    <Link
                      href={item.href}
                      className="relative inline-flex transition-colors duration-300 ease-soft hover:text-sage after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']"
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
      <ul className="mt-4 flex flex-col gap-2.5">
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
    <h2 className="text-fine font-medium uppercase tracking-[0.14em] text-on-dark/75">
      {children}
    </h2>
  );
}

/** The row a footer link sits in. The rule lives on the label inside it. */
/**
 * A footer link, and the reason it carries an invisible pad.
 *
 * The text sets a 20px line box, and these are list items rather than links
 * inside a sentence — so WCAG 2.5.8's 24x24 minimum applies to them with no
 * inline exception to fall back on. Measured on a 360px phone, every link in
 * this footer came in at 20px high.
 *
 * The fix is a pseudo-element rather than padding, because padding here would
 * push the three columns apart and re-space a footer that is already tuned.
 * `after:-inset-y-1.5` extends the hit area to 32px without moving a pixel of
 * type; the rule under the label stays where it was. Nothing is drawn — the
 * pseudo-element has no background.
 */
const LINK =
  "group relative inline-flex text-body text-on-dark transition-colors duration-300 ease-soft " +
  "hover:text-sage after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-['']";

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
        className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-sage transition-transform duration-500 ease-editorial group-hover:scale-x-100"
      />
    </span>
  );
}
