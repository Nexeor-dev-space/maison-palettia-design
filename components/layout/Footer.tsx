import Link from "next/link";

import { BackToTop } from "@/components/layout/BackToTop";
import { SocialIcons } from "@/components/layout/SocialIcons";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { CONTACT, FOOTER_NAV, LEGAL_NAV, NEWSLETTER, SITE } from "@/lib/constants";
import { getMallPartners } from "@/lib/partners";
import type { NavGroup } from "@/types";

/**
 * Global site footer — the last room.
 *
 * ==========================================================================
 * REBUILT AFTER GOODMAN GALLERY'S FOOTER, AND LIGHT
 * ==========================================================================
 *
 * The reference is a plain light field with dark type and almost no styling
 * at all: sentence-case group headings in medium weight, links in regular
 * weight at the same size, a newsletter block holding the left quarter, a
 * hairline, and a band of the gallery's cities underneath with an address and
 * a directions link under each. Weight does the hierarchy; nothing is tracked,
 * nothing is uppercase, and there is not a box anywhere in it.
 *
 * WHAT CHANGED HERE, AND IT IS MOSTLY THE REGISTER. The footer was a near-
 * black field carrying White Rock type, with tracked uppercase group headings
 * at 13px and body-size links under them. The ground is Light Sage now —
 * `--color-footer`, one line in globals.css, which also explains why Light
 * Sage rather than a white the palette does not contain — and the labels have
 * come down out of caps into the reference's quiet sentence case.
 *
 * THE ARCH SURVIVED THE MOVE, AND IS BETTER OFF. It needs two grounds to read
 * as a shape, and it had them the wrong way round: a near-black dome rising
 * out of a White Rock band, which is a dark shape cut into a light one. Now
 * the dome is the footer's own Light Sage and the band behind its corners is
 * still White Rock — the pairing the component's documentation described for
 * years while the code did something else. The reference has no such motif and
 * this is the one place the redesign does not follow it: the arch is the
 * Maison's entrance and one of only two left on the site.
 *
 * INK ON LIGHT SAGE. Charcoal Slate at full strength measures 9.07:1, and at
 * /75 it is 4.70:1 — so the muted ink that carries addresses and the legal
 * line still clears the 4.5:1 body copy owes. Deep Lilac is 3.83:1 here, which
 * is under that bar and over the 3:1 a graphical mark owes, so the accent is
 * only ever a rule: the link underlines, and nothing that is read as words.
 * That is the same division <PlanYourVisit> settled on for its rail links.
 *
 * ==========================================================================
 * THE COMPOSITION
 * ==========================================================================
 *
 *   ╭──────────────────── the arch ────────────────────╮
 *
 *   Newsletter                     Create      The Maison     Visit
 *   New dates and new…             Events      About          Contact
 *   [ Subscribe ]                  Private…    Journal        Check a booking
 *                                  Passes                     FAQ
 *                                  Gallery
 *   Follow
 *   Instagram  Facebook
 *   ─────────────────────────────────────────────────────────────────────
 *   The studio              Times Square Center
 *   Dubai                   Dubai
 *   United Arab Emirates    Get directions
 *
 *   © 2026 Maison Palettia Events L.L.C.                    Back to top
 *
 * THREE COLUMNS OF LINKS RATHER THAN THE REFERENCE'S STAGGERED TWO. Goodman
 * deals four groups into two columns and starts the second pair lower down,
 * which is what four groups of eight and ten links need. This site has three
 * groups holding nine links between them; dealt into two columns they would
 * make a stagger out of nothing, which is a composition borrowed rather than
 * earned. Three even columns is the same footer at this content's size, and a
 * fourth group appended to FOOTER_NAV wraps into the row without an edit here.
 *
 * THE CITIES BAND IS THE REFERENCE'S AND IT IS THE PART THAT TRANSFERS BEST.
 * Goodman lists four galleries with an address and Get Directions under each.
 * The Maison has a studio locality and a list of partner centres it actually
 * sets up in — real places, with a real maps link already on each one for
 * <MallPartners> — so the band is built from those rather than invented. One
 * partner today (see lib/partners.ts, which explains why one is the point
 * rather than a gap); the band takes more by appending to that array.
 *
 * WHAT IS NOT HERE, AND WHY. No newsletter block until there is a mailing
 * list — see {@link NEWSLETTER}, which renders the whole left-hand block only
 * once an endpoint exists. No Legals group: LEGAL_NAV is deliberately empty
 * because neither route has been built, so the legal line at the foot carries
 * nothing today and fills itself in when they are.
 *
 * AND THE SIGNATURE HAS GONE. "see you at the maison" closed this footer in
 * the brand script on every page of the site. It is also the signature inside
 * <PlanYourVisit>, which now closes /about — so on that page the same five
 * words were set twice within about four hundred pixels, the second time
 * smaller. The invitation is where the line means something; the footer is
 * where it had become furniture. The reference's footer has no flourish in it
 * at all, which made this the moment to settle it.
 *
 * ==========================================================================
 * THE HEIGHT BUDGET — MEASURED, BECAUSE THE FOOTER IS ONLY PINNED WHILE IT
 * FITS THE WINDOW
 * ==========================================================================
 *
 * <FooterReveal> measures this element, hands <main> a bottom margin of the
 * same height and fixes the footer behind it. Past the window height it gives
 * up and the footer goes back into the flow — graceful, but it is not the
 * designed ending, and it flips silently.
 *
 * The arch is `min(16vw,18vh)`, so the footer shrinks with the window: its
 * height is roughly `body + 0.18H` at desktop widths, and it pins while that
 * is at most `H - 8`. Measured at 1440 wide:
 *
 *   body 514px  ->  676px at H=900, and pins down to about H=637
 *   the old Ink footer was ~467px of body and pinned to about H=579
 *
 * The cities band is what costs the difference, and it is the part of the
 * reference that transfers best, so it stays. The spacing between the three
 * bands was tightened once to pay for it: at the first spacing the body came
 * to 566px and the footer stopped pinning below about H=700, and a 1366x768
 * laptop gives around 678px of viewport once browser chrome is off it — so the
 * reveal was quietly dying on one of the commonest screens there is. 637
 * clears that band with room.
 *
 * THE NEWSLETTER COSTS 147px ON TOP OF THAT — 875px at H=900, measured with a
 * dummy endpoint in place. Switched on, this footer pins only above about
 * H=893, which is to say almost nowhere. Before turning it on, either accept
 * that the reveal stops on most laptops or close the gap between the block and
 * Follow and trim a band; do not switch it on and assume the reveal survived.
 *
 * Server component, and async only to read the partner list. The interactive
 * parts are <BackToTop> and the newsletter form.
 */
export async function Footer() {
  const year = new Date().getFullYear();
  const partners = await getMallPartners();

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
        ONE PLACE DECIDES THE INK AND EVERYTHING INSIDE INHERITS IT — the same
        arrangement <HeaderBar> keeps. `text-text` here is what <BackToTop> and
        <SocialIcons> read through `text-current`, so neither has to know which
        ground it is standing on; both used to hard-code a Light Sage hover
        that would now be invisible, and both were fixed with this change.

        No `--color-focus` override any more. It was pointed at White Rock
        because Deep Lilac measures 3.02:1 on Ink, under the 3:1 a focus ring
        owes. On Light Sage the default lilac is 3.83:1 and clears it, so the
        ring goes back to the site's own accent.
      */}
      <div className="bg-footer text-text pb-8 pt-5 md:pb-9 md:pt-6 lg:pb-[min(2.5rem,4vh)]">
        <Container>
          <div className="mx-auto grid max-w-site grid-cols-12 gap-x-6 gap-y-12 lg:gap-x-10">
            {/* ---- The left quarter: the list, and who to follow ---- */}
            <div className="col-span-12 lg:col-span-4">
              <NewsletterBlock />

              <div className={NEWSLETTER.actionUrl ? "mt-12 lg:mt-16" : undefined}>
                <GroupHeading>Follow</GroupHeading>
                {/*
                  Marks rather than words where there is a URL to point at, and
                  plain readable names where there is not — see <SocialIcons>,
                  which holds that rule and the pull-left that keeps the icons'
                  44px targets from indenting the row past the type above them.
                */}
                <div className="mt-4">
                  <SocialIcons />
                </div>
              </div>
            </div>

            {/*
              ---- The site map ----

              The nav keeps its own element and spans the right half rather
              than being flattened into the outer grid: `display: contents` on
              a landmark would line the groups up just as well and has a
              history of dropping the landmark out of the accessibility tree,
              which is a bad trade for an alignment nothing depends on.
            */}
            <nav
              aria-label="Footer"
              className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7 lg:gap-x-10"
            >
              {FOOTER_NAV.map((group) => (
                <FooterGroup key={group.title} group={group} />
              ))}
            </nav>
          </div>

          {/*
            ---- The cities band ----

            The reference's own, and the hairline above it is the only rule in
            the footer. Four columns at desktop so a fourth partner lands
            beside the third rather than starting a row of its own.
          */}
          <Reveal variant="fadeIn">
            <div className="mx-auto mt-10 grid max-w-site grid-cols-12 gap-x-6 gap-y-10 border-t border-text/20 pt-8 md:mt-12 lg:gap-x-10">
              <div className="col-span-6 md:col-span-3">
                <PlaceHeading>The studio</PlaceHeading>
                <address className="not-italic mt-3 text-body leading-[1.75] text-text/75">
                  {CONTACT.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {/* Both null today, and rendered only when they are not —
                      the footer has never printed a contact detail the studio
                      has not supplied. */}
                  {CONTACT.email ? (
                    <a href={`mailto:${CONTACT.email}`} className={`${LINK} mt-2`}>
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

              {partners.map((partner) => (
                <div key={partner.slug} className="col-span-6 md:col-span-3">
                  <PlaceHeading>{partner.name}</PlaceHeading>
                  <p className="mt-3 text-body leading-[1.75] text-text/75">{partner.locality}</p>

                  {/*
                    "Get directions" carries a rule at rest rather than only on
                    hover, because it is the one link in this band and nothing
                    around it looks like a link. The reference underlines its
                    own for the same reason.

                    THE REST RULE IS NEUTRAL, NOT LILAC, AND THAT IS A CONTRAST
                    FIX. It identifies a link, so WCAG 1.4.11 asks 3:1 of it.
                    Deep Lilac at /50 — the weight the rail links use on White
                    Rock — composites to 2.11:1 on this ground and fails;
                    Charcoal at /60 is 3.26:1 and passes. Measured on the
                    rendered pixel rather than computed, because Tailwind mixes
                    these in oklab and the sRGB arithmetic does not predict it.

                    It also buys a better hover: the sweep is full-strength
                    Deep Lilac at 3.83:1, so pointing at the link changes the
                    rule's colour as well as redrawing it.
                  */}
                  {partner.locationHref ? (
                    <a
                      href={partner.locationHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${LINK} mt-3`}
                    >
                      <span className="relative pb-1">
                        Get directions
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-px bg-text/60"
                        />
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-500 ease-editorial group-hover:scale-x-100"
                        />
                      </span>
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </Reveal>

          {/* ---- The last line ---- */}
          <Reveal variant="fadeIn">
            <div className="mx-auto mt-8 flex max-w-site flex-col gap-5 text-fine text-text/75 sm:flex-row sm:items-center sm:justify-between md:mt-10">
              <div className="flex flex-col gap-x-7 gap-y-2 sm:flex-row sm:items-center">
                <p>
                  &copy; {year} {SITE.legalName}
                </p>

                {/* Empty today and rendered from the array regardless, so the
                    two documents appear here the moment their routes exist. */}
                {LEGAL_NAV.length > 0 ? (
                  <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
                    {LEGAL_NAV.map((item) => (
                      <li key={item.href}>
                        {/* The same invisible pad the nav links carry — these
                            set a 13px line box, the smallest targets here. */}
                        <Link
                          href={item.href}
                          className="relative inline-flex transition-colors duration-300 ease-soft hover:text-text after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <BackToTop />
            </div>
          </Reveal>
        </Container>
      </div>
    </footer>
  );
}

/**
 * The mailing-list block, or nothing at all.
 *
 * It renders only once {@link NEWSLETTER} has an endpoint, for the reason set
 * out on that constant: this project has no mailing list, and a Subscribe
 * button that posts nowhere takes an address and loses it.
 *
 * A plain `<form method="post">` at the provider's own endpoint — no client
 * library, no JavaScript, and it keeps working for a visitor who has none.
 * The provider's confirmation page is where the visitor lands, which is what
 * these embeds do and is honest about where the address went.
 */
function NewsletterBlock() {
  const { actionUrl, fieldName, heading, description, cta } = NEWSLETTER;
  if (!actionUrl) return null;

  return (
    <div>
      <GroupHeading>{heading}</GroupHeading>
      <p className="mt-3 max-w-[22rem] text-body leading-[1.75] text-text/75">{description}</p>

      <form action={actionUrl} method="post" className="mt-6 max-w-[22rem]">
        {/*
          A real label, visually hidden. A placeholder is not a label: it
          disappears the moment anything is typed, and it is the only thing
          naming this field for a screen reader.
        */}
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          {/*
            The border is the field's only boundary, so it is a user interface
            component under WCAG 1.4.11 and owes 3:1: Charcoal at /60 measures
            3.26:1 on this ground where the /30 it started at is about 1.7:1.
            The placeholder is held at /75 (4.70:1) for the same reason — it is
            read as text, so it owes the full 4.5:1.
          */}
          <input
            id="newsletter-email"
            type="email"
            name={fieldName}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full border-b border-text/60 bg-transparent pb-2 text-body text-text placeholder:text-text/75 transition-colors duration-300 ease-soft focus:border-primary focus:outline-none"
          />
          {/*
            Deep Lilac with `--color-on-primary`, the near-white that token
            exists for: White Rock on this ground measures 3.95:1 and a 13px
            label owes 4.5:1, where the near-white clears at 4.90:1. The
            reference's button is a filled black block; this is the same
            gesture in the one colour this site fills a block with.
          */}
          <button
            type="submit"
            className="shrink-0 rounded-sm bg-primary px-6 py-3 text-fine font-medium uppercase leading-none tracking-eyebrow text-on-primary transition-colors duration-300 ease-soft hover:bg-primary/90"
          >
            {cta}
          </button>
        </div>
      </form>
    </div>
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

/**
 * A group's name.
 *
 * SENTENCE CASE AT BODY SIZE, WHICH IS THE WHOLE REDESIGN IN ONE COMPONENT.
 * These were 13px, uppercase, tracked to 0.14em and set at 75% ink — the
 * site's label register, used here for eight headings at once. The reference
 * sets its group names in the same size and face as the links beneath them and
 * separates the two by weight alone, which is what makes that footer read as
 * quiet rather than as a directory. Full-strength charcoal against links held
 * lower does the same job here.
 *
 * Still an <h2>: it heads a list, and the footer is the one place on the page
 * where several of these stand side by side.
 */
function GroupHeading({ children }: { children: string }) {
  return <h2 className="text-body font-medium text-text">{children}</h2>;
}

/** A place name in the cities band. Not a heading — it labels an address. */
function PlaceHeading({ children }: { children: string }) {
  return <p className="text-body font-medium text-text">{children}</p>;
}

/**
 * A footer link, and the reason it carries an invisible pad.
 *
 * The text sets a 20px line box, and these are list items rather than links
 * inside a sentence — so WCAG 2.5.8's 24x24 minimum applies to them with no
 * inline exception to fall back on. Measured on a 360px phone, every link in
 * this footer came in at 20px high.
 *
 * The fix is a pseudo-element rather than padding, because padding here would
 * push the columns apart and re-space a footer that is already tuned.
 * `after:-inset-y-1.5` extends the hit area to 32px without moving a pixel of
 * type; the rule under the label stays where it was. Nothing is drawn — the
 * pseudo-element has no background.
 *
 * The ink no longer changes on hover. It used to go to Light Sage, which is
 * now the ground; the obvious replacement is Deep Lilac and it fails, at
 * 3.83:1 against the 4.5:1 body-size type owes. So the accent moved onto the
 * rule, where it is a graphical mark owing 3:1 — see <LinkLabel>.
 */
const LINK =
  "group relative inline-flex text-body text-text/75 transition-colors duration-300 ease-soft " +
  "hover:text-text after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-['']";

/**
 * A link's text, with the rule that draws itself on hover.
 *
 * The underline is a border on the label rather than `text-decoration`, so it
 * sits clear of the descenders and can be animated; it grows from the left
 * instead of fading, which reads as drawn rather than switched on. Deep Lilac,
 * which clears the 3:1 a rule owes on this ground at 3.83:1.
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
