"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { BookAction } from "@/components/layout/BookAction";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavLabel } from "@/components/layout/NavLabel";
import { SearchPanel } from "@/components/layout/SearchPanel";
import { SearchTrigger } from "@/components/layout/SearchTrigger";
import { WorkshopsMenu } from "@/components/layout/WorkshopsMenu";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { BasketLink } from "@/components/layout/BasketLink";
import { DARK_HERO_ROUTES, MAIN_NAV } from "@/lib/constants";
import { pauseScroller, resumeScroller } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import type { Discipline, Workshop } from "@/types";

/**
 * Shared by the nav links and the menu trigger so the two are one row of type.
 *
 * The rule under a link is drawn rather than switched on. `text-decoration`
 * can only appear and disappear — it was `hover:underline` here — and an
 * underline that blinks into existence is the one interaction on this site
 * that had no craft in it. The rule is now an element of its own, scaled from
 * its left edge, so it arrives the way a pen would draw it. See <NavLabel>.
 *
 * `group/nav` rather than a bare `group`: the Workshops entry is itself a
 * group — it owns a menu — and an unnamed group inside another would leave the
 * rule answering to whichever ancestor won.
 *
 * Text stays white in every state, including hover. It used to shift to
 * Light Sage there as well as drawing the rule, which was two signals for one
 * event — and for the stretch the bar's ground moved off near-black onto
 * Deep Lilac, one signal too many to keep: sage measured 3.84:1 there at this
 * size, clear of the 3:1 a graphical mark like the rule owes but short of the
 * 4.5:1 running text does. The colour change was dropped rather than brought
 * back with the ground: the rule alone carrying the signal is the simpler
 * system either way, and it holds with more room to spare against Ink than it
 * ever needed to against the lilac — see the same choice made in <MobileNav>
 * and <WorkshopsMenu>.
 */
const NAV_LINK =
  "group/nav inline-flex text-[0.9rem] font-medium tracking-[0.01em] text-white " +
  "transition-colors duration-300 ease-soft";

/**
 * The bar. Client component: it owns the scroll state and the mobile overlay.
 *
 * Three tracks: where to go, the mark, what to do — left, centre, right, in
 * that reading order. The mark sits on the page's own centre line, held there
 * by the grid rather than by its place in the row: both outer tracks are
 * `minmax(0,1fr)`, the same flexible width, so the centre track lands exactly
 * halfway between them regardless of how much the nav on one side and the
 * actions on the other actually need. `minmax(0,1fr)` rather than a bare
 * `1fr` is the part that makes that a guarantee and not a coincidence — a
 * bare `1fr` track still grows to fit whatever it holds first, so three nav
 * links on the left and two actions on the right would pull the two tracks to
 * different widths the moment their content stopped matching, and the mark
 * would drift toward whichever side had less in it. Pinning the minimum to 0
 * forces both tracks to the same width unconditionally; content that does not
 * fit clips or wraps inside its own track rather than ever widening it.
 *
 * Every child carries an explicit `col-start` rather than relying on DOM
 * order to land it in the right track, which is what lets the *mobile* row
 * keep its own arrangement — mark left, trigger right, no centred anything —
 * from the very same three elements: `grid-cols-[auto_1fr_auto]` below `lg`
 * puts the mark in the first `auto` track and the nav (which is `hidden`
 * there regardless) out of the way, and the desktop `lg:grid-cols-[...]`
 * override simply reassigns where each explicit track number points.
 *
 * The ground is Deep Lilac — see `--color-nav` in globals.css, which the bar,
 * the Workshops dropdown and the mobile overlay all read from the one place.
 * The logo artwork is drawn in Light Sage on transparency, so whatever this
 * token is set to has to stay dark enough for that mark to exist at all.
 *
 * Over a colour-field hero it stays transparent and takes the ground up on the
 * first scroll, settling 16px lower at the same time. Settling, not
 * collapsing: the previous bar dropped from 72px to 56px, which read as the
 * page closing up the further someone got into it. See the height tokens in
 * globals.css, where all four numbers live.
 */
export function HeaderBar({ disciplines, workshops }: { disciplines: Discipline[]; workshops: Workshop[] }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  /*
    Bumped every time the overlay opens, and used as the panel's React key.

    The panel is kept mounted and hidden rather than unmounted, so its contents
    would otherwise animate once in a session and never again — a CSS animation
    only runs when the element it is on appears. Changing the key remounts the
    contents on each open, which replays it. Cheap: it is four pictures and a
    list, and it is only paid when someone actually opens the menu.
  */
  const [openCount, setOpenCount] = useState(0);
  // Search's own open state and its own remount counter — the same device,
  // for the same reason, one flight below. See <SearchPanel> for why its
  // query is cleared by this rather than by a remount.
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchOpenCount, setSearchOpenCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuId = useId();
  const searchPanelId = useId();
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

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
  //
  // Search's own full-screen shape locks the page the same way, but from
  // inside <SearchPanel> rather than here — it is the one that knows whether
  // it is currently the full-screen shape or the small desktop dropdown, and
  // only the first of those needs the lock at all. The two never run at once:
  // opening either overlay closes the other below, so there is never a second
  // lock to interleave with this one.
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
  const closeSearch = () => setIsSearchOpen(false);

  // Opening one overlay closes the other. Both can cover the same ground —
  // the mobile menu sits under the bar exactly where the mobile search panel
  // does — and nothing about their own effects expects to find itself running
  // underneath a second one, the scroll lock included.
  const toggleMenu = () => {
    setIsSearchOpen(false);
    setIsMenuOpen((open) => {
      const next = !open;
      if (next) setOpenCount((count) => count + 1);
      return next;
    });
  };

  const toggleSearch = () => {
    setIsMenuOpen(false);
    setIsSearchOpen((open) => {
      const next = !open;
      if (next) setSearchOpenCount((count) => count + 1);
      return next;
    });
  };

  // Only a route whose hero is its own colour field earns the transparent bar;
  // everywhere else the ground is there from the first paint. Either overlay
  // forces it solid too — the mobile search panel hangs directly off the bar
  // the same way the mobile menu does, and the desktop search dropdown is the
  // same `bg-nav` the bar itself would otherwise be fading out of.
  const isOverHero = DARK_HERO_ROUTES.includes(pathname);
  const isSolid = !isOverHero || isScrolled || isMenuOpen || isSearchOpen;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header
      className={cn(
        // The focus ring is cream throughout: on this ground the default lilac
        // would vanish.
        "sticky top-0 z-50 border-b transition-colors duration-500",
        "ease-[cubic-bezier(0.4,0,0.2,1)] [--color-focus:var(--color-cream)]",
        // The hairline only exists once the bar has a ground of its own. Over
        // the hero there is nothing for it to divide, and a line ruled across
        // the artwork is exactly the hard separation the bar is avoiding.
        isSolid ? "border-white/10 bg-nav" : "border-transparent bg-transparent",
      )}
    >
      <Container
        className={cn(
          // Three tracks rather than `justify-between`. Spaced-between puts
          // whatever is in the middle at the centre of the *leftovers* once
          // the outer two have taken their share — which is never the centre
          // of the page, and moves every time a label changes.
          //
          // `minmax(0,1fr) auto minmax(0,1fr)` from `lg`. The two outer tracks
          // are given identical flexible widths, so the `auto` between them
          // lands on the page's own centre line no matter that three nav links
          // and two actions are nothing like the same size. The `minmax(0,…)`
          // is the guarantee: a bare `1fr` is really `minmax(auto,1fr)` and
          // still refuses to shrink below its content, so the wider side would
          // push the mark off centre the moment the two stopped matching.
          //
          // Below `lg` the nav is hidden and the row is the ordinary mobile
          // arrangement — mark at the left edge, actions at the right — so the
          // tracks only have to hold those two.
          "grid grid-cols-[auto_1fr_auto] items-center gap-6",
          "lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
          "transition-[height] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          // Full height while either overlay is open, whatever the scroll:
          // both panels hang from the resting height (<MobileNav>'s `top-header`,
          // <SearchPanel>'s mobile shape the same), and a settled bar would
          // leave a strip of the page showing between the two.
          isScrolled && !isMenuOpen && !isSearchOpen
            ? "h-header-set md:h-header-set-lg"
            : "h-header md:h-header-lg",
        )}
      >
        {/*
          The left track: where to go. First in the source as well as on the
          screen, so a keyboard's tab order runs left to right across the bar
          in the order the eye reads it — nav, mark, actions — rather than
          starting in the middle and jumping back out to the edge.

          The gaps answer the client's note about the bar feeling tight. Links
          at 24px apart read as one object with its dividers missing; at 40 and
          up they read as separate places you could go, which is what a nav is
          for. They open further as the window does rather than holding one
          figure, because air is what the extra width is for.

          1024 is still the tight width and the figure there is held back for
          it — measured below, where the three links, the mark and the actions
          have to share one row without the mark leaving the centre.
        */}
        {/*
          `self-stretch` down this chain is what makes the strands menu usable
          with a mouse. Its panel hangs from the bottom of the bar, but the
          entry's own box was only as tall as the word — leaving a 37px strip
          of the bar's padding that belonged to neither, and `mouseleave` fires
          the moment a pointer enters it. Every strand was unreachable. Giving
          the nav, the list and each item the bar's full height puts the
          entry's bottom edge exactly where the panel's top edge is, so there
          is nothing to cross. Measured: the gap is now 0.
        */}
        <nav
          aria-label="Primary"
          className="hidden self-stretch lg:col-start-1 lg:flex lg:justify-start"
        >
          <ul className="flex items-stretch gap-7 xl:gap-10 2xl:gap-12">
            {/*
              Secondary entries are dropped from the bar and kept in the mobile
              menu and the footer — see `secondary` on NavItem. The bar is the
              one place on the site with a hard width budget.
            */}
            {MAIN_NAV.filter((item) => !item.secondary).map((item) =>
              item.megamenu ? (
                <li key={item.href} className="flex items-center">
                  <WorkshopsMenu
                    label={item.label}
                    href={item.href}
                    disciplines={disciplines}
                    isActive={isActive(item.href)}
                    linkClassName={NAV_LINK}
                  />
                </li>
              ) : (
                <li key={item.href} className="flex items-center">
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={NAV_LINK}
                  >
                    <NavLabel isActive={isActive(item.href)}>{item.label}</NavLabel>
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        {/*
          The centre track, and the only thing in it. Both flanking tracks are
          the same flexible width, so the mark sits on the page's own centre
          line rather than wherever the nav happened to end — and stays there
          when a label is added or the action's copy changes.

          On a phone this is the first `auto` track instead: the nav above is
          `hidden`, the explicit `col-start-1` puts the mark at the left edge,
          and the row reverts to the ordinary mobile arrangement without a
          second set of markup to keep in step.
        */}
        <div className="col-start-1 flex items-center justify-start lg:col-start-2 lg:justify-center">
          <Wordmark variant="logo" />
        </div>

        {/*
          The right track: what to do.

          Tighter flanks between 1024 and 1280, where this row is at its most
          crowded. True centring makes the two side tracks exactly equal, so
          the right one gets (width − mark − gaps) / 2 whether or not it needs
          it — and this is the side that does. The nav opposite asks for 231px
          of its 402; this cluster, with a booking held, asked for more than
          the track had.

          Measured at 1024 with the basket showing, which is the widest this
          ever gets: 104 + 77 + 188 and two 20px gaps came to 408.8 against a
          402.6 track — a 6px overrun, taken out of the items themselves.
          Four pixels off each gap here and eight off the action's flanks (see
          <BookAction>) bring it to 392.8, which is about 10px clear.
        */}
        <div className="col-start-3 flex items-center justify-end gap-5 lg:gap-4 xl:gap-5">
          {/*
            The way back into a booking in progress. It appears only once
            something is held, which is why it is not a permanent basket icon:
            an empty basket in the corner of a studio's website is shop
            furniture, and this site is not a shop until someone has chosen a
            date. Without it, checkout was reachable only by not navigating
            away from it.
          */}
          <BasketLink />

          {/*
            Search, ahead of the booking action rather than after it. The
            action is the strongest thing in the bar on purpose — the one
            solid block of colour — and search sitting past it would read as
            an afterthought tacked onto the end of the row rather than a
            second way in, which is what it actually is.
          */}
          <SearchTrigger
            ref={searchTriggerRef}
            isOpen={isSearchOpen}
            onClick={toggleSearch}
            panelId={searchPanelId}
          />

          {/* Wrapped rather than given `hidden`: that would collide with the
              action's own display utility and lose on source order. */}
          <div className="hidden sm:block">
            <BookAction />
          </div>

          <button
            type="button"
            onClick={toggleMenu}
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
        openCount={openCount}
        isOpen={isMenuOpen}
        onClose={closeMenu}
        items={MAIN_NAV}
        disciplines={disciplines}
        isActive={isActive}
      />

      <SearchPanel
        id={searchPanelId}
        openCount={searchOpenCount}
        isOpen={isSearchOpen}
        onClose={closeSearch}
        triggerRef={searchTriggerRef}
        workshops={workshops}
      />
    </header>
  );
}
