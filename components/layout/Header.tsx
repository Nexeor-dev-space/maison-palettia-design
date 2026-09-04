"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { MAIN_NAV, PRIMARY_CTA } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Global site header. Client component because it owns the mobile menu state.
 * Structure and behaviour only — the visual design lands in the next phase.
 */
export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Escape closes the menu; lock background scroll while it is open.
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-sm">
      <Container className="flex h-20 items-center justify-between gap-6 md:h-24">
        <Wordmark />

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "text-sm tracking-wide transition-colors duration-200 hover:text-primary",
                    isActive(item.href) ? "text-primary" : "text-text",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink href={PRIMARY_CTA.href} className="hidden sm:inline-flex">
            {PRIMARY_CTA.label}
          </ButtonLink>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex size-11 items-center justify-center rounded-pill text-text transition-colors duration-200 hover:text-primary lg:hidden"
          >
            {isMenuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </Container>

      {/* Mobile navigation panel */}
      <div
        id="mobile-navigation"
        hidden={!isMenuOpen}
        className="border-t border-line bg-surface lg:hidden"
      >
        <nav aria-label="Primary mobile">
          <Container as="ul" className="flex flex-col gap-1 py-6">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-sm py-3 text-lg transition-colors duration-200 hover:text-primary",
                    isActive(item.href) ? "text-primary" : "text-text",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-4 sm:hidden">
              <ButtonLink href={PRIMARY_CTA.href} onClick={closeMenu} className="w-full">
                {PRIMARY_CTA.label}
              </ButtonLink>
            </li>
          </Container>
        </nav>
      </div>
    </header>
  );
}
