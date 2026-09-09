"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { DARK_HERO_ROUTES, MAIN_NAV, PRIMARY_CTA } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Global site header: navigation left, logo centred, primary action right.
 * Client component because it owns the mobile menu state.
 *
 * The bar carries its own Deep Lilac ground. Over a hero it holds off and
 * stays transparent so it reads as part of the artwork rather than a bar
 * sitting on top of it, taking the lilac up as soon as the page scrolls under
 * it or the mobile menu opens.
 *
 * Either way the ground beneath the type is dark, so there is one treatment
 * throughout — light type, the sage logo, a sage action — and no inverted
 * variant to keep in step.
 */
export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);

    // Deferred so the restored-scroll sync does not run inside the effect body.
    const initial = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(initial);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

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

  // Only a route whose hero is its own colour field earns the transparent bar;
  // everywhere else the lilac is there from the first paint.
  const isOverHero = DARK_HERO_ROUTES.includes(pathname);
  const isSolid = !isOverHero || isScrolled || isMenuOpen;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header
      className={cn(
        // The focus ring is cream throughout: lilac on lilac would vanish.
        "sticky top-0 z-50 border-b border-transparent transition-colors duration-500",
        "ease-[cubic-bezier(0.4,0,0.2,1)] [--color-focus:var(--color-cream)]",
        isSolid ? "bg-primary" : "bg-transparent",
      )}
    >
      {/*
        Three zones on one row: navigation left, logo centred, action right.
        The outer tracks are equal `1fr` and allowed to shrink below their
        content (`min-w-0`), which is what keeps the logo on the centre line of
        the page rather than on the centre of whatever is left over after the
        nav and the button have taken their share.
      */}
      <Container className="grid h-header grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-header-lg">
        <div className="flex min-w-0 items-center justify-start">
          {/*
            Desktop navigation. It appears at xl rather than lg because
            centring the wordmark on the page costs the side tracks their
            asymmetry: at 1024px the six links want 421px and an equal track
            is only 340px wide — true even with the gutters closed up. Below
            xl the menu button stands in for it.
          */}
          <nav aria-label="Primary" className="hidden xl:block">
            <ul className="flex items-center gap-5 2xl:gap-7">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      // Cream at 14px measures 3.95:1 on Deep Lilac, under the
                      // 4.5:1 needed for body-size text — so the links stay
                      // white (5.1:1) and mark hover/active with a sage rule
                      // rather than a colour change.
                      "text-sm font-medium tracking-wide text-white transition-colors duration-200",
                      "decoration-sage underline-offset-[6px] hover:underline",
                      isActive(item.href) && "underline",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Menu trigger — it stands in for the nav, so it takes the nav's
              place on the left rather than sitting beside the action. */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-pill text-cream transition-colors duration-200 hover:text-white xl:hidden"
          >
            {isMenuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>

        <Wordmark variant="logo" />

        <div className="flex min-w-0 items-center justify-end">
          {/* Wrapped rather than given `hidden`: that would collide with the
              button's own display utility and lose on source order. */}
          <div className="hidden sm:block">
            <ButtonLink href={PRIMARY_CTA.href} size="sm" shape="square" variant="sage">
              {PRIMARY_CTA.label}
            </ButtonLink>
          </div>
        </div>
      </Container>

      {/* Mobile navigation panel */}
      <div
        id="mobile-navigation"
        hidden={!isMenuOpen}
        className="border-t border-line bg-surface shadow-veil xl:hidden"
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
                    "block rounded-sm py-3 text-lg font-medium transition-colors duration-200 hover:text-primary",
                    isActive(item.href) ? "text-primary" : "text-text",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-4 sm:hidden">
              <ButtonLink
                href={PRIMARY_CTA.href}
                onClick={closeMenu}
                shape="square"
                variant="sage"
                className="w-full"
              >
                {PRIMARY_CTA.label}
              </ButtonLink>
            </li>
          </Container>
        </nav>
      </div>
    </header>
  );
}
