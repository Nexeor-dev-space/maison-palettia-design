import Image from "next/image";
import Link from "next/link";

import { BackToTop } from "@/components/layout/BackToTop";
import { Container } from "@/components/ui/Container";
import { MISSION, TAGLINE } from "@/lib/brand";
import { BRAND_LOGO, CONTACT, FOOTER_NAV, LEGAL_NAV, SITE, SOCIAL_LINKS } from "@/lib/constants";
import { getMallPartners } from "@/lib/partners";

/** A footer link: the label, and a rule that draws in under it on hover. */
const LINK =
  "group/link -my-1.5 inline-flex py-1.5 text-body text-cream/85 transition-colors duration-300 ease-soft hover:text-cream";

/**
 * ==========================================================================
 * THE FOOTER
 * ==========================================================================
 *
 * CHARCOAL SLATE, AND THE LOGO IS WHY. The client supplied two cuts of the
 * mark: Light Sage for dark grounds and Deep Lilac for light ones. A footer on
 * Charcoal Slate carries the Light Sage cut at 9.07:1 — the strongest pairing
 * the palette offers — so the page ends on the brand's own mark at a size
 * that lets it be seen, where the previous footer had no mark at all.
 *
 * It is also the right weight to close on. Every section above it is a light
 * field; ending on the palette's one dark neutral gives the page a floor,
 * rather than letting it thin out into another pale band.
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
 * <FooterReveal> measures this element's height to decide whether to pin it
 * behind the page; nothing here needs to know about that.
 */
export async function Footer() {
  const partners = await getMallPartners();
  const year = new Date().getFullYear();
  const socials = SOCIAL_LINKS.filter((link): link is typeof link & { href: string } =>
    Boolean(link.href),
  );

  return (
    <footer className="bg-text text-cream [--color-focus:var(--color-cream)]">
      <Container className="pb-8 pt-16 md:pt-20 lg:pb-10 lg:pt-24">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-10">
          {/* ---- the Maison ---- */}
          <div className="col-span-12 lg:col-span-5">
            <Link href="/" aria-label={`${SITE.name} — home`} className="inline-block">
              <Image
                src={BRAND_LOGO.src}
                alt=""
                width={BRAND_LOGO.width}
                height={BRAND_LOGO.height}
                className="h-16 w-auto md:h-20"
              />
            </Link>
            <p className="mt-7 text-label font-semibold uppercase tracking-eyebrow text-cream">
              {TAGLINE}
            </p>
            <p className="mt-4 max-w-[24rem] text-lead font-light leading-[1.6] text-cream/85">
              {MISSION}
            </p>
          </div>

          {/* ---- where to go ---- */}
          <nav aria-label="Footer" className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {FOOTER_NAV.map((group) => (
                <div key={group.title}>
                  <h2 className="text-label font-semibold uppercase tracking-eyebrow text-cream">
                    {group.title}
                  </h2>
                  <ul className="mt-5 space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} className={LINK}>
                          <span className="border-b border-transparent pb-0.5 transition-colors duration-300 ease-soft group-hover/link:border-sage">
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
        <div className="mt-16 grid grid-cols-12 gap-x-6 gap-y-10 border-t border-cream/20 pt-10 md:mt-20 lg:gap-x-10">
          {partners.map((partner) => (
            <div key={partner.slug} className="col-span-12 sm:col-span-6 lg:col-span-4">
              <h2 className="text-label font-semibold uppercase tracking-eyebrow text-cream">
                Find us
              </h2>
              <p className="mt-4 text-lead leading-snug text-cream">{partner.name}</p>
              <p className="mt-1 text-body text-cream/85">{partner.locality}</p>
              {partner.locationHref ? (
                <a
                  href={partner.locationHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LINK} mt-3 items-baseline gap-2`}
                >
                  <span className="border-b border-sage/70 pb-0.5 transition-colors duration-300 ease-soft group-hover/link:border-sage">
                    Get directions
                  </span>
                  <span className="sr-only">(opens Google Maps in a new tab)</span>
                  <span aria-hidden>&#8599;</span>
                </a>
              ) : null}
            </div>
          ))}

          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <h2 className="text-label font-semibold uppercase tracking-eyebrow text-cream">
              The studio
            </h2>
            <address className="mt-4 text-body not-italic leading-[1.75] text-cream/85">
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

          {socials.length > 0 ? (
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <h2 className="text-label font-semibold uppercase tracking-eyebrow text-cream">
                Follow
              </h2>
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
        <div className="mt-14 flex flex-col gap-5 border-t border-cream/20 pt-7 text-fine text-cream/85 sm:flex-row sm:items-center sm:justify-between md:mt-16">
          <div className="flex flex-col gap-x-7 gap-y-2 sm:flex-row sm:items-center">
            <p>
              &copy; {year} {SITE.legalName}
            </p>
            {LEGAL_NAV.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
                {LEGAL_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="transition-colors hover:text-cream">
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
