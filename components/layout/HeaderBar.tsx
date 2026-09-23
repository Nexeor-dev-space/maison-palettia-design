"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MobileNav } from "@/components/layout/MobileNav";
import { NavLabel } from "@/components/layout/NavLabel";
import { SearchPanel } from "@/components/layout/SearchPanel";
import { SearchTrigger } from "@/components/layout/SearchTrigger";
import { PrivateEventsMenu } from "@/components/layout/PrivateEventsMenu";
import { WorkshopsMenu } from "@/components/layout/WorkshopsMenu";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { BasketLink } from "@/components/layout/BasketLink";
import { linkPaint } from "@/components/layout/PaintStroke";
import { DARK_HERO_ROUTES, LIGHT_HERO_ROUTES, MAIN_NAV } from "@/lib/constants";
import { pauseScroller, resumeScroller } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import type { CreativeExperience } from "@/lib/experiences";
import type { Workshop } from "@/types";

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
  "group/nav inline-flex whitespace-nowrap text-body tracking-[0.015em] text-current " +
  "transition-colors duration-300 ease-soft";

/**
 * ONE WEIGHT FOR THE WHOLE ROW — Montserrat SemiBold.
 *
 * The client asked twice, and the second note corrected the first. "Improve
 * the font weight on the navbar" was answered by raising it; that left three
 * weights in one row, because the bar had been built to rank itself by weight
 * — SemiBold for the two entries that open a panel, Medium for the plain
 * links, Regular for Search, which was filed as a utility rather than a
 * destination. The reasoning was sound and the result was not: at 17px on a
 * pale ground, three weights across six words read as an inconsistency rather
 * than as a hierarchy, which is exactly what the client saw.
 *
 * So the row is one weight. SemiBold was tried there first, on the reasoning
 * that the first note had asked for confidence — and it was too much: the
 * client's word was "not this much hard". Medium is the answer to both notes
 * at once. It is a step up from the Regular the row started at, so it still
 * reads as deliberate rather than as default, and it is light enough that six
 * words across a masthead stay elegant.
 *
 * WHAT CARRIES THE HIERARCHY INSTEAD. Nothing is lost by giving up the
 * ranking, because none of it was doing the work alone: an entry that opens a
 * panel says so with `aria-expanded` and by drawing its rule while the panel
 * is down, and Search keeps the icon that no other entry has. The row ranks
 * itself by order and by behaviour now rather than by weight.
 *
 * Letterspacing is 0.015em against the old 0.01em: a heavier weight closes the
 * counters, and a little more air keeps the labels as legible as they were.
 */
const NAV_WEIGHT = "font-medium";

/**
 * How far the page has to move before the bar leaves the document flow.
 *
 * It has to clear the bar's own resting height, and by enough that the switch
 * happens well out of sight: detaching is the one moment the header stops
 * taking up space, and a spacer takes its place in the same commit so the
 * document keeps its height and nothing under it moves. 240px clears the
 * 120px desktop bar twice over and the 88px phone bar nearly three times.
 */
const DETACH_AFTER = 240;

/** Pixels of travel before a change of direction counts as one. */
const DIRECTION_DEADBAND = 6;

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
export function HeaderBar({
  experiences,
  workshops,
}: {
  experiences: CreativeExperience[];
  workshops: Workshop[];
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  /*
    Whether a panel is down under the bar — either of them.

    Held here rather than inside the menus because the bar has to know: a panel
    drops on the page's white ground, and a white panel hanging off a bar still
    transparent over the hero photograph reads as two unrelated surfaces
    instead of one thing opening. Both menus report through the same setter —
    only one can be open at a time, because opening either means the pointer
    has left the other.
  */
  const [isStrandsOpen, setIsStrandsOpen] = useState(false);
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
  /*
    Two questions, not one, and they are independent.

    `isDetached` — has the page moved far enough that the bar has left the
    document flow and is now a fixed element? `isRising` — is the reader
    currently going up? The bar is only on screen when both are true (or an
    overlay is open, which pins it regardless).
  */
  const [isDetached, setIsDetached] = useState(false);
  const [isRising, setIsRising] = useState(false);
  const menuId = useId();
  const searchPanelId = useId();
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  // Handed to <MobileNav> so closing the overlay returns focus here rather
  // than dropping it at the top of the document.
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  /*
    The scroll reader. It answers three things: has the page moved at all
    (ground and ink), has it moved past the bar (in flow or fixed), and which
    way is the reader going (on screen or gone).

    DIRECTION NEEDS A DEADBAND. A momentum fling and a rubber-band bounce both
    produce a handful of pixels in the wrong direction at the end of a gesture,
    and a bar that flips on a single pixel flickers through every one of them.
    Six pixels is under the threshold of a deliberate scroll and over the noise.
  */
  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 8);
      setIsDetached(y > DETACH_AFTER);

      const delta = y - lastY;
      if (Math.abs(delta) > DIRECTION_DEADBAND) {
        setIsRising(delta < 0);
        lastY = y;
      }
    };

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
  // same white the bar itself would otherwise be fading out of.
  // A light hero — the homepage's Light Sage banner — earns the transparent
  // bar too, but not the light ink: see LIGHT_HERO_ROUTES.
  const isOverDarkHero = DARK_HERO_ROUTES.includes(pathname);
  const isOverHero = isOverDarkHero || LIGHT_HERO_ROUTES.includes(pathname);
  const overlayOpen = isMenuOpen || isSearchOpen;

  /*
    THE BAR IS IN FLOW AT THE TOP AND FIXED ON THE WAY BACK UP, at the client's
    ask, and the two halves of that answer two different complaints.

    Pinned everywhere, it is furniture: a permanent strip across a site whose
    whole argument is full-bleed photography, taking a slice of every screen
    including the hero. In flow everywhere — which is what this was — there is
    no navigation from the middle of a page at all, and reaching it means
    scrolling back to the top.

    Going down is reading, so the bar gets out of the way. Going up is looking
    for something, and the something is almost always navigation — so that is
    when it comes back, and it comes back over whatever section happens to be
    passing, which is why it takes its ground and its ink with it rather than
    arriving transparent.

    An open overlay pins it regardless: both panels hang off the bar's bottom
    edge, and a bar that slid away while its own menu stayed would leave the
    menu attached to nothing.
  */
  const isPinned = isDetached && (isRising || overlayOpen);

  /*
    GROUND AND INK ARE TWO DECISIONS, AND THE GROUND HAS THREE CAUSES.

    The bar is transparent where it opens — over a hero that is its own colour
    field — and takes a ground the moment it is over page instead.

    THE PANEL ON SCROLL IS BACK, AT THE CLIENT'S ASK. It was taken out in an
    earlier pass so the bar sat on the page at every position with only its ink
    changing, and the client has since asked for the white bar. It is the
    better answer anyway now that the sections under it are photographs as
    often as they are flat colour: ink alone cannot hold a bar legible over an
    arbitrary picture, and a ground can.

    `!isOverHero` is the same rule said at rest rather than on scroll. Only the
    homepage opens on a colour field; every other route opens on page, so the
    bar is over something it needs a ground for from the first paint. Without
    it those routes flashed — transparent for eight pixels of scroll, then
    white, on a bar that is already on its way off the screen.

    The other two causes are the overlays. The mobile menu and the search panel
    hang directly off the bar's bottom edge; a transparent bar above either
    would show a strip of page between the two and read as a gap in one field
    rather than as one panel.
  */
  const hasGround = overlayOpen || isStrandsOpen || isScrolled || !isOverHero;

  /*
    ONE GROUND. Every panel that hangs off the bar is the page's own white —
    the strands megamenu, the search panel, and the mobile menu, which were
    charcoal until the client asked for each of them white — so whenever the
    bar has a ground it is that white, and it joins whichever panel is open as
    one field.

    Light ink only over a dark hero before the page has moved, with nothing
    open. Every panel is white, the bar joins it, and light ink on the pair
    would be unreadable.
  */
  const onDarkInk = isOverDarkHero && !isScrolled && !isStrandsOpen && !overlayOpen;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  // One source, split by role for the desktop bar only — the mobile menu and
  // the footer still read MAIN_NAV whole and in order.
  const primaryNav = MAIN_NAV.filter((item) => !item.secondary && !item.utility);
  const utilityNav = MAIN_NAV.filter((item) => !item.secondary && item.utility);

  return (
    <>
    <header
      className={cn(
        /*
          THREE POSITIONS, AND ONLY THE FIRST TWO ARE EVER SEEN.

            in flow      at the top of the document, `relative` so `z-50`
                         still applies — the overlays hang off this element
                         and have to stack over the page.
            fixed, up    translated off the top. This is the "not fixed" the
                         client asked for while reading down: the bar is out
                         of flow but out of sight, so the page is whole.
            fixed, down  on screen, over whatever is passing.

          `relative` is kept for the first because a `fixed` bar takes no
          space, and every page on this site is laid out against a bar that
          does — the hero pulls itself up by `-mt-header` to sit under it. Go
          fixed at the top and the hero would clear a bar that is no longer
          there. So the switch happens 240px down, out of sight, and a spacer
          takes the bar's place in the same render.
        */
        isDetached ? "fixed inset-x-0 top-0" : "relative",
        "z-50 transition-colors duration-500",
        "ease-[cubic-bezier(0.4,0,0.2,1)]",
        /*
          The slide. Transform only — an animated `top` would lay out on every
          frame, where a transform is composited. Held behind `motion-reduce`,
          which snaps it instead: a reader who has asked for stillness should
          still get the bar back on the way up, just without the travel.
        */
        isDetached
          ? "transition-transform duration-[450ms] motion-reduce:transition-none"
          : "",
        /*
          `translate-none` on screen, never `translate-y-0`. Tailwind 4 writes
          these as the CSS `translate` property, and any value but `none` —
          `0 0` included — makes the bar the containing block for `fixed`
          descendants. The menu and search overlays are `fixed` children of
          this element, sized top-to-bottom against the screen; contained by a
          64px bar they measured 0px tall, so tapping the menu turned the bar
          dark and showed nothing. `none` still transitions to and from
          `-translate-y-full`, so the slide is unchanged.
        */
        isDetached && !isPinned ? "-translate-y-full" : "translate-none",
        // The focus ring follows the ink. Cream is right over the hero and
        // inside an open overlay; on the page's pale grounds it would vanish,
        // so the ring falls back to Deep Lilac there.
        onDarkInk ? "[--color-focus:var(--color-cream)]" : "[--color-focus:var(--color-primary)]",
        /*
          LIGHT SAGE ON SCROLL, which the bar carries from the moment the page
          has moved at all.

          It was `bg-surface` — the page's own near-white — on the argument
          that a bar of pure white over a #fffdf9 page reads as a second,
          colder surface laid on top. That argument was about WHITE, and it
          still holds; the client has asked for the brand's Light Sage instead,
          which is not a neutral at all but the palette's own soft ground, so
          the bar now states a colour rather than trying to disappear.

          THE INK STILL CLEARS EVERYTHING IT OWES. Charcoal Slate on Light Sage
          is 9.07:1 against the 11.61 it had on the near-white — a real drop
          and nowhere near the 4.5 it needs. The focus ring is Deep Lilac on
          this ground at 3.83:1, past the 3:1 a ring owes, and the header's
          Deep Lilac logo cut clears the same bar at the same figure.

          `border-b` IS APPLIED WITH THE GROUND, NOT KEPT AND MADE
          TRANSPARENT, and that is a layout fix rather than a tidy-up. A
          transparent border still occupies its pixel: the bar measured 121px
          against the 120px the hero pulls itself up by, so one row of the
          page's own near-white ground showed above the artwork as a hairline
          across the top of the window.

          ONE PLACE DECIDES THE INK, AND EVERYTHING IN THE BAR INHERITS IT.
          Setting `color` here and letting the row use `text-current` means the
          flip is one class rather than a conditional on every link, icon and
          rule inside it — and it cannot go half-done, which is what a bar of
          White Rock links over a pale section would be.

          THE BAR AND THE PANELS ARE TWO GROUNDS NOW, DELIBERATELY. This note
          used to say the bar takes the same white when a panel is open
          "because every panel hanging under it is that white, and the two have
          to read as one field" — and that had already stopped being true
          before this change: <WorkshopsMenu> and <PrivateEventsMenu> are
          `bg-cream` (White Rock), not the near-white. So the pairing is Light
          Sage over White Rock, two of the brand's own grounds meeting on the
          bar's hairline, rather than one field that no longer matches itself.
          Both panels are one class away from Light Sage if the join is ever
          wanted closed.

          Charcoal on the page measures 11.61:1; White Rock over the hero is
          held up by the photograph's own head wash, which is measured in
          <Hero>.
        */
        hasGround ? "border-b border-text/10 bg-sage" : "bg-transparent",
        onDarkInk ? "text-on-dark" : "text-text",
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
          /*
            ONE HEIGHT NOW, AND THE PINNING IS WHY.

            The bar used to settle 8px shorter once the page moved. An
            out-of-flow bar can do that for free; an in-flow one cannot —
            shrinking it moves every pixel of the document up by the
            difference, so the whole page would lurch at 8px of scroll and
            lurch back on the way home.

            It also quietly fixes a mismatch that was always there: both
            overlays hang from the *resting* height (<MobileNav>'s
            `top-header`, <SearchPanel>'s mobile shape the same), so a settled
            bar left a strip of page showing between the bar and the panel.
          */
          /*
            THE DESKTOP HEIGHT NEVER APPLIED, AND THE BAR HAS BEEN 64px SINCE.

            This read `md:h-header-lg`, and that utility is not generated —
            measured at 700, 900 and 1440, the row was 64px at all three. The
            token is fine and the breakpoint is fine: the hero's own
            `md:-mt-header-lg` resolves to -72px from the same variable at the
            same width. It is `h-*` specifically that does not pick this name
            up, so the class sat in the markup looking correct and did nothing.

            The mismatch was live: the hero pulled up 72px under a 64px bar, so
            the two disagreed by 8px about where the page starts — the same
            class of bug as the white stroke this bar had earlier.

            Referencing the variable directly is unambiguous and keeps the
            token the single source of truth, which an arbitrary `4.5rem` here
            would not.
          */
          "h-header md:h-[var(--spacing-header-lg)]",
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
          {/*
            24px at 1024, 44px from 1280. The labels are heavier now and the
            row gained a fourth thing to fit; measured, 32px everywhere left
            the 1024 track 2px short and wrapped a label. The wide screens keep
            the air — it is only the narrow end of the desktop range that has
            to give it up.
          */}
          {/*
            THE BAR IS A PALETTE, AND THE PAINT IS HANDED OUT BY POSITION.

            Each top-level link carries a swatch behind its word — see
            <PaintStroke>. The colour comes from the link's place in the row
            rather than from what it means, so the bar reads left to right as
            a palette does instead of as six colour-coded categories, which
            would be a taxonomy nobody asked for and nobody can learn.

            `onDarkInk ? null` IS THE IMPORTANT PART. Over a dark hero the bar
            reverses to light ink, and the swatches are the light half of the
            palette — pale paint behind pale type. Null there, and <NavLabel>
            falls back to the hairline it has always drawn.
          */}
          <ul className="flex items-stretch gap-6 xl:gap-11 2xl:gap-12">
            {/*
              Two filters, two different jobs. `secondary` entries are dropped
              from the bar entirely and kept in the mobile menu and the footer;
              `utility` entries stay in the bar but belong with search on the
              right. See both flags on NavItem.
            */}
            {primaryNav.map((item, i) =>
              item.menu === "private-events" ? (
                <li key={item.href} className="flex items-center">
                  <PrivateEventsMenu
                    onOpenChange={setIsStrandsOpen}
                    label={item.label}
                    href={item.href}
                    isActive={isActive(item.href)}
                    linkClassName={cn(NAV_LINK, NAV_WEIGHT)}
                    paint={onDarkInk ? null : linkPaint(i)}
                  />
                </li>
              ) : item.menu === "experiences" ? (
                <li key={item.href} className="flex items-center">
                  <WorkshopsMenu
                    onOpenChange={setIsStrandsOpen}
                    label={item.label}
                    href={item.href}
                    experiences={experiences}
                    // The same dates the search panel and the listing read, so
                    // a seat count in the menu can never disagree with one two
                    // clicks away. Matched to an activity by slug inside.
                    sessions={workshops}
                    isActive={isActive(item.href)}
                    linkClassName={cn(NAV_LINK, NAV_WEIGHT)}
                    paint={onDarkInk ? null : linkPaint(i)}
                  />
                </li>
              ) : (
                <li key={item.href} className="flex items-center">
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(NAV_LINK, NAV_WEIGHT)}
                  >
                    <NavLabel isActive={isActive(item.href)} paint={onDarkInk ? null : linkPaint(i)}>
                      {item.label}
                    </NavLabel>
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
          {/* Light ground gets the Deep Lilac cut; the sage cut would vanish. */}
          <Wordmark onLight={!onDarkInk} />
        </div>

        {/*
          The right track: how to reach us, and how to find something.

          THE WIDTH BUDGET IS FIXED HERE RATHER THAN TRIMMED AGAIN. True
          centring forces both side tracks to exactly (width − mark − gaps)/2,
          and every previous pass solved an overrun by shaving gaps and padding
          off this side: at 1024 the nav opposite wanted 238px of its 403 while
          this cluster wanted all of its own and then some. Two passes had
          already taken 4px off a gap and 8px off the action's flanks, and
          Phase 1's type scale ate both again.

          The cause was that the bar carried two ways to do the same thing. The
          booking action pointed at /events, which is exactly where the Events
          entry on the other side of the mark goes — one row, one destination,
          two controls, and the widest of them sitting on the tight side. It is
          gone from the bar (it stays in the mobile menu, where it is the
          panel's own primary action and there is room for it), and the budget
          stopped being tight rather than being made to fit.

          That also answers the brief on its own terms: the client asked for
          Events to lead without the bar looking like a shop, and a header with
          one solid block of colour in the corner is the single thing that most
          made it look like one.
        */}
        <div className="col-start-3 flex items-center justify-end gap-5 lg:gap-7 xl:gap-9">
          {/*
            The way back into a booking in progress. It appears only once
            something is held, which is why it is not a permanent basket icon:
            an empty basket in the corner of a studio's website is shop
            furniture, and this site is not a shop until someone has chosen a
            date. Without it, checkout was reachable only by not navigating
            away from it.
          */}
          <BasketLink />

          {/* Search leads the utilities: it is the fastest route to a date on
              the whole site, and the only control here that does something
              rather than going somewhere. */}
          <SearchTrigger
            ref={searchTriggerRef}
            isOpen={isSearchOpen}
            onClick={toggleSearch}
            panelId={searchPanelId}
            /* Search keeps the same swatch as everything else — the brief is
               explicit that it must not become a CTA, so it gets the row's
               treatment and nothing more. */
            paint={onDarkInk ? null : linkPaint(3)}
          />

          {/*
            Contact, set in the same type as the navigation opposite so the two
            halves of the bar read as one row rather than as a nav and a
            toolbar. Desktop only — on a phone it is in the menu with
            everything else, and repeating it in a three-control bar would
            crowd the one control that has to be easy to hit.
          */}
          {utilityNav.map((item, u) => (
            /*
              Wrapped rather than given `hidden` directly, because NAV_LINK
              already carries `inline-flex`: two display utilities on one
              element are settled by their order in the generated stylesheet
              rather than by the order they are written, and `hidden` lost —
              Contact rendered on a 360px phone beside the menu button. The
              same trap is documented on the booking action this replaced.
            */
            <div key={item.href} className="hidden lg:block">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(NAV_LINK, NAV_WEIGHT)}
              >
                <NavLabel isActive={isActive(item.href)} paint={onDarkInk ? null : linkPaint(u + 4)}>
                  {item.label}
                </NavLabel>
              </Link>
            </div>
          ))}

          <button
            ref={menuTriggerRef}
            type="button"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="-mr-2 inline-flex size-11 items-center justify-center text-current transition-colors duration-200 hover:opacity-70 lg:hidden"
          >
            {isMenuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </Container>

      <MobileNav
        id={menuId}
        triggerRef={menuTriggerRef}
        openCount={openCount}
        isOpen={isMenuOpen}
        onClose={closeMenu}
        items={MAIN_NAV}
        experiences={experiences}
        isActive={isActive}
      />

      <SearchPanel
        id={searchPanelId}
        openCount={searchOpenCount}
        isOpen={isSearchOpen}
        onClose={closeSearch}
        triggerRef={searchTriggerRef}
        workshops={workshops}
        experiences={experiences}
      />
    </header>

    {/*
      The bar's stand-in, and the reason detaching is invisible.

      A `fixed` element takes no space, so the moment the bar leaves the flow
      the document is one bar shorter and everything below it jumps up by that
      much — 120px on a desktop, mid-scroll, with no warning. This holds the
      gap open. It carries the bar's own height classes rather than a measured
      number, so the two cannot drift: change the bar's height and this
      follows in the same edit.
    */}
    {isDetached ? (
      <div aria-hidden className="h-header md:h-[var(--spacing-header-lg)]" />
    ) : null}
    </>
  );
}
