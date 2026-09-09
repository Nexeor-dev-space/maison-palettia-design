import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { CONTACT, LEGAL_NAV, MAIN_NAV, SITE, SOCIAL_LINKS } from "@/lib/constants";

/**
 * Global site footer. Server component — no interactivity required.
 * Content areas are in place; real contact details and social URLs are still
 * pending from the client (see lib/constants.ts).
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-section border-t border-line bg-surface-alt/40">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Wordmark className="text-text hover:text-primary" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{SITE.tagline}</p>
          </div>

          {/* Navigation */}
          <nav aria-labelledby="footer-nav-heading">
            <h2
              id="footer-nav-heading"
              className="text-xs uppercase tracking-eyebrow text-muted"
            >
              Explore
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-text transition-colors duration-200 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact + social */}
          <div>
            <h2 className="text-xs uppercase tracking-eyebrow text-muted">Visit</h2>
            <address className="mt-5 not-italic text-sm leading-relaxed text-text">
              {CONTACT.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              {CONTACT.email ? (
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="mt-3 block transition-colors duration-200 hover:text-primary"
                >
                  {CONTACT.email}
                </a>
              ) : null}
              {CONTACT.phone ? (
                <a
                  href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                  className="block transition-colors duration-200 hover:text-primary"
                >
                  {CONTACT.phone}
                </a>
              ) : null}
            </address>

            {/* Text links until the client supplies profile URLs and brand marks. */}
            <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-text transition-colors duration-200 hover:text-primary"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="text-sm text-muted">{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {SITE.legalName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-6">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors duration-200 hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
