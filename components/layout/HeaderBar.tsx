"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { BookAction } from "@/components/layout/BookAction";
import { MobileNav } from "@/components/layout/MobileNav";
import { WorkshopsMenu } from "@/components/layout/WorkshopsMenu";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { DARK_HERO_ROUTES, MAIN_NAV, WORKSHOPS_HREF } from "@/lib/constants";
import { pauseScroller, resumeScroller } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import type { Discipline } from "@/types";

/** Shared by the nav links and the menu trigger so the two are one row of type. */
const NAV_LINK =
  "text-sm font-medium tracking-wide text-white transition-colors duration-200 " +
  "decoration-sage underline-offset-[6px] hover:underline";

/**
 * The bar. Client component: it owns the scroll state and the mobile overlay.
 *
 * Three zones, mark first: the Maison, then where to go, then what to do. It
 * was the mark in the centre with the nav to its left, which looked balanced
 * and cost the layout its two side tracks — the six links needed 421px against
 * an equal track of 340, so the inline nav could not appear until 1280px and a
 * laptop got a hamburger. Moving the mark to the edge gives the row back its
 * width: the nav is inline from 1024, and the action lands at the end of the
 * reading path rather than opposite it.
 *
 * The ground is charcoal rather than the Deep Lilac it was. Two reasons, and
 * neither is taste. Deep Lilac is the page's one saturated field and the
 * philosophy section spends it; a bar wearing the same colour above every
 * scroll leaves it describing the furniture instead of marking a moment. And
 * the logo artwork is drawn in Light Sage on transparency, so it needs a dark
 * ground to exist at all — charcoal is the darkest thing in the palette and
 * the hero's own colour, which is why the bar appears to condense out of the
 * artwork rather than arrive on top of it.
 *
 * Over a colour-field hero it stays transparent and takes the ground up on the
 * first scroll, losing a little height at the same time.
 */
export function HeaderBar({ disciplines }: { disciplines: Discipline[] }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuId = useId();

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

  // Escape closes the overlay; hold the page behind it while it is open.
  //
  // Two locks, because the page has two things that scroll it. The body rule
  // is for the browser; `pauseScroller` is for Lenis, which drives the scroll
  // position itself and would otherwise carry on moving the page underneath a
  // rule it never reads. See lib/scroll.ts — and note that the overlay carries
  // `data-lenis-prevent` so the menu itself stays scrollable through both.
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    // Restored rather than blanked: this is a shared inline style, and the
    // next thing to lock the page should get back what it had, not "".
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pauseScroller();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      resumeScroller();
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  // Only a route whose hero is its own colour field earns the transparent bar;
  // everywhere else the ground is there from the first paint.
  const isOverHero = DARK_HERO_ROUTES.includes(pathname);
  const isSolid = !isOverHero || isScrolled || isMenuOpen;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header
      className={cn(
        // The focus ring is cream throughout: on this ground the default lilac
        // would vanish.
        "sticky top-0 z-50 transition-colors duration-500",
        "ease-[cubic-bezier(0.4,0,0.2,1)] [--color-focus:var(--color-cream)]",
        isSolid ? "bg-nav" : "bg-transparent",
      )}
    >
      <Container
        className={cn(
          "flex items-center justify-between gap-6 transition-[height] duration-500",
          "ease-[cubic-bezier(0.4,0,0.2,1)]",
          // A little shorter once the page is moving, so the bar takes less of
          // the screen the further in someone reads.
          isScrolled ? "h-14 md:h-16" : "h-header md:h-header-lg",
        )}
      >
        <Wordmark variant="logo" />

        {/*
          The nav sits beside the mark rather than centred on the page: it
          keeps the row reading left to right — who, where, what — and leaves
          the right edge to the one action. Inline from 1024: mark, nav and
          action measure about 740px there against 983px of measure, which is
          what moving the mark off centre bought.
        */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-6 2xl:gap-8">
            {MAIN_NAV.map((item) =>
              item.href === WORKSHOPS_HREF ? (
                <li key={item.href}>
                  <WorkshopsMenu
                    label={item.label}
                    href={item.href}
                    disciplines={disciplines}
                    isActive={isActive(item.href)}
                    linkClassName={NAV_LINK}
                  />
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(NAV_LINK, isActive(item.href) && "underline")}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          {/* Wrapped rather than given `hidden`: that would collide with the
              action's own display utility and lose on source order. */}
          <div className="hidden sm:block">
            <BookAction />
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="-mr-2 inline-flex size-11 items-center justify-center text-cream transition-colors duration-200 hover:text-sage lg:hidden"
          >
            {isMenuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </Container>

      <MobileNav
        id={menuId}
        isOpen={isMenuOpen}
        onClose={closeMenu}
        items={MAIN_NAV}
        disciplines={disciplines}
        isActive={isActive}
      />
    </header>
  );
}
