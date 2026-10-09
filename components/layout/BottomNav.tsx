"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { BookingOption } from "@/lib/bookingOptions";
import { BookingSheet } from "@/components/booking/BookingSheet";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  AboutIcon,
  BookIcon,
  ExperiencesIcon,
  HomeIcon,
  LocationsIcon,
  PrivateEventsIcon,
  WhatsAppIcon,
} from "@/components/layout/bottomNavIcons";
import { AboutSheet } from "@/components/layout/AboutSheet";
import styles from "@/components/layout/BottomNav.module.css";
import { MAIN_NAV, PRIMARY_CTA, WHATSAPP } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * ==========================================================================
 * THE BOTTOM NAVIGATION — a phone's whole map of the site, painted
 * ==========================================================================
 *
 * BELOW `lg` ONLY, and that boundary is not a new opinion: it is where
 * <HeaderBar> already swaps its five links for the hamburger, so it is this
 * site's own definition of where a phone begins. One breakpoint, not two.
 *
 * WHAT IT IS. A White Rock sheet with a wave torn across its top edge, five
 * destinations on it, and the booking action raised out of the middle on a
 * Deep Lilac blob. The reference the client supplied is an app tab bar with
 * decoration applied to it; what is drawn here is meant to read the other way
 * round — paper first, with the navigation set down on it.
 *
 * WHY A WAVE AND NOT A TORN EDGE. `tornEdge.ts` already generates a deckled
 * clip-path and was the obvious reuse. It is wrong here on two counts: a
 * clip-path would cut the raised badge off at the sheet's boundary, and a
 * torn edge is a 72-point polygon of fibre, which at 76px tall reads as noise
 * rather than as paper. The wave is one path, drawn once, and it rises in the
 * middle so the badge nests into it rather than sitting on top of it.
 *
 * ==========================================================================
 * THE CURRENT ITEM IS SAID THREE WAYS
 * ==========================================================================
 *
 * Deep Lilac on White Rock measures 3.95:1. That clears the 3:1 a graphical
 * mark owes and misses the 4.5:1 a label owes, so the labels stay Charcoal
 * throughout and the colour never carries the state alone — which is also
 * what the brief asks for. The current item is marked by the blob behind its
 * icon, the brush stroke under its word, and `aria-current`.
 *
 * THE SHEET IS DEEP LILAC, THE BADGE IS LIGHT SAGE, THE CURRENT MARK IS
 * WHITE ROCK — the client's third pass at this, and the one that finally has
 * room in it. Paint on paper could only ever be as loud as White Rock would
 * let it: Light Sage on it is 1.03:1 and terracotta 2.44:1, so every mark was
 * fighting the ground. Inverting it gives all three something to be seen
 * against.
 *
 * THE INK CHANGED WITH IT, AND HAD TO. Charcoal on Deep Lilac is 2.37:1 —
 * under the 3:1 an icon owes, let alone the 4.5:1 an 11px label owes — so
 * every word and every unselected icon is now `text-on-primary`, the
 * near-white globals.css mixes for this one ground (14% White Rock in white,
 * about 4.87:1). White Rock itself would have been 3.95:1: fine for a shape,
 * short for a word.
 *
 * MEASURED, ALL OF IT, on Deep Lilac:
 *
 *   labels and idle icons ... on-primary ... 4.87:1   over 4.5 for text
 *   the current mark ........ White Rock ... 3.95:1   over 3 for a shape
 *   its icon ................ Charcoal ..... 9.36:1   on the White Rock
 *   the badge ............... Light Sage ... 3.83:1   over 3 for a shape
 *   its icon ................ Charcoal ..... 9.07:1   on the sage
 *   the brush ............... White Rock ... 3.95:1   over 3 for a mark
 *
 * So the current item is still said three ways — a White Rock blob with a
 * step in lightness this time, a brush under the word, and `aria-current` —
 * and the badge is the one thing on the bar in a different hue family
 * entirely, which is what the client was asking for two passes ago.
 *
 * THE BLOB IS ONE ELEMENT, NOT FIVE. `layoutId` hands it to framer, which
 * moves the single shape from the old item to the new one on every route
 * change. Five blobs cross-fading would be the same picture and none of the
 * travel, and the travel is the thing that makes the bar feel answered.
 *
 * ==========================================================================
 * WHAT IT DOES NOT COVER
 * ==========================================================================
 *
 * The bar publishes its own height as `--bottom-nav-h` (globals.css), and
 * everything else that pins itself to the bottom of a phone reads that
 * variable rather than knowing about this file: <main>'s padding, the footer,
 * <WhatsAppWidget>, and <EventBookingBar> — which is `fixed bottom-0 z-40` on
 * every event page and would otherwise have been sitting underneath this.
 */

type NavIcon = (props: { size?: number; className?: string }) => React.ReactElement;

interface NavItem {
  href: string;
  label: string;
  /** Leaves the site: rendered as a plain anchor in a new tab, not a <Link>. */
  external?: boolean;
  /** Spoken name, where the visible label is too terse to stand alone. */
  ariaLabel?: string;
  /* Drawn for this bar — see ./bottomNavIcons.tsx for why lucide came out. */
  Icon: NavIcon;
  /** How the route is recognised. Omitted means an exact match on the path. */
  match?: (pathname: string) => boolean;
}

/*
  THE ICON FOR A ROUTE. Kept here rather than in lib/constants.ts so the config
  stays a list of destinations and knows nothing about how any surface draws
  them — the desktop bar and the footer read the same list and draw no icons.
*/
/*
  Keyed by route rather than by position, so a slot that changes which page it
  holds brings its own glyph with it. `/locations` stays in the table although
  Locations is now a card in the About sheet rather than a slot: the table is
  a lookup for whatever `mobileSurface: "bar"` happens to name, and flipping
  that flag back should not also need an icon re-wired.
*/
const ICONS: Record<string, NavIcon> = {
  "/events": ExperiencesIcon,
  "/private-events": PrivateEventsIcon,
  "/locations": LocationsIcon,
};

/*
  ==========================================================================
  THE FOURTH SLOT: WHATSAPP, OR HOME WHERE THERE IS NO WHATSAPP
  ==========================================================================

  The client asked for Home to be replaced by a WhatsApp action, and that is
  what this does — but only once there is a number to open. `WHATSAPP.number`
  is `null` in this project and has been since the constant was written: there
  is no WhatsApp number anywhere in the repo, no `.env`, and `CONTACT.phone`
  is null beside it. A tab that opens `https://wa.me/null` is a broken control
  on the most prominent surface the phone has.

  So the slot falls back to Home, which is what it has always been, and
  becomes WhatsApp the moment somebody sets the number — one value, no build.
  That is the same rule <WhatsAppWidget>, the footer's social links and the
  newsletter block already follow: the code is ready and the absence is
  honest.

  WHY HOME IS THE FALLBACK AND NOT AN EMPTY SLOT. Below `lg` the header
  carries no navigation at all — its links are `hidden lg:block` and there is
  no hamburger — so the wordmark is the only way back to the homepage on a
  phone, and it scrolls away. Dropping Home without putting WhatsApp there
  would leave the bar with four slots and the site with no visible way home.
*/
const HOME: NavItem = { href: "/", label: "Home", Icon: HomeIcon };

const WHATSAPP_ITEM: NavItem | null = WHATSAPP.number
  ? {
      href: WHATSAPP.greeting
        ? `https://wa.me/${WHATSAPP.number}?text=${encodeURIComponent(WHATSAPP.greeting)}`
        : `https://wa.me/${WHATSAPP.number}`,
      label: "WhatsApp",
      ariaLabel: "Chat with us on WhatsApp",
      external: true,
      Icon: WhatsAppIcon,
      /* An outbound chat is never "the page you are on". */
      match: () => false,
    }
  : null;

/*
  AND THE TWO DESTINATIONS COME FROM THE SHARED LIST, filtered by
  `mobileSurface: "bar"` — Experiences and Private events. With WhatsApp, the
  action and About that is five, which is what five slots hold.

  THEY ARE THE DESKTOP BAR'S OWN TOP LEVEL, which is the point of the pair.
  That bar carries three triggers — Experiences, Private events, About — and
  the third opens a panel of four doors. Here the first two are thumb slots
  and the third is the drawer at the end, holding the same four. Locations was
  a slot until the desktop moved it under About; it is a card in the sheet
  now, with the rest of "who this is and how to reach it".

  EXPERIENCES POINTS AT THE LISTING. /events is where all seven activities are
  browsed and each card goes on to its own page; the bar deliberately carries
  no dropdown, so it can never shortcut past that. The slide-out menu keeps
  the one that expands.
*/
/*
  WHERE A SLOT IS NARROWER THAN THE LIST'S OWN LABEL.

  A slot is a fifth of the window: 78px at 390, 72 at 360, 64 at 320. Measured
  at 11px, "Private events" sets to 70px and WRAPS TO TWO LINES at every one
  of those widths — the second line dropped under the bar and ran into the
  label beside it. "Private" is 40 and sits on one.

  THE FULL NAME IS STILL THE ACCESSIBLE NAME, which is what makes the short
  form legitimate rather than a truncation: `ariaLabel` carries "Private
  events", and WCAG's label-in-name only asks that the accessible name contain
  the visible one. Anything typed here must therefore be a prefix of the
  entry's own label, not a synonym for it.

  The desktop bar and the footer are untouched — they read MAIN_NAV directly
  and have the room for the whole label.

  AND WHERE SHORTENING CANNOT HELP, THE TYPE GIVES WAY INSTEAD. The rule above
  only reaches labels that can be cut back to a prefix. "Experiences" is one
  word, so it never wraps — it OVERFLOWS, which is the quieter failure: at 11px
  with this tracking it sets to 72.5px against a 64px slot at 320, so it began
  at x = -4.3 and the E was cut off by the window. Nothing scrolled and nothing
  was clipped, so no overflow check could see it.

  The arithmetic says where it starts: the label must be no wider than a slot,
  so the break is 5 x 72.5 = 362px. 375 and up already fit and keep the drawn
  size. Below that the tracking goes — decorative, and 4.8px of the 8.5px
  deficit — and the type steps to 10px, which sets to 61.5px in that 64px slot.
*/
const BAR_LABELS: Record<string, string> = {
  "/private-events": "Private",
};

const ITEMS: readonly NavItem[] = [
  ...MAIN_NAV.filter((item) => item.mobileSurface === "bar").map((item) => {
    const short = BAR_LABELS[item.href];
    return {
      href: item.href,
      label: short ?? item.label,
      ariaLabel: short ? item.label : undefined,
      Icon: ICONS[item.href] ?? HomeIcon,
      match: (p: string) => p === item.href || p.startsWith(`${item.href}/`),
    };
  }),
  WHATSAPP_ITEM ?? HOME,
];

/* What About opens onto. Same list, the other flag — and the same four doors
   <AboutMenu> opens on a desktop, in the same order. */
const SHEET_ITEMS = MAIN_NAV.filter((item) => item.mobileSurface === "sheet");

const BOOK = { href: PRIMARY_CTA.href, label: "Book a Session" } as const;
/* Static rather than `useId`, because the trigger and the dialog are in two
   different components and both have to name the same string. */
const BOOK_SHEET_ID = "bottom-nav-book";

/*
  The wave, drawn once. `preserveAspectRatio="none"` lets it stretch from 320
  to 1023 without the crests changing height, and the rise around x=195 is the
  seat the badge sits in.
*/
const WAVE =
  "M0 40 L0 22 C 26 22, 42 11, 72 13 C 102 15, 116 26, 144 24 " +
  "C 163 23, 170 7, 195 7 C 220 7, 227 23, 246 24 " +
  "C 274 26, 288 15, 318 13 C 348 11, 364 22, 390 22 L390 40 Z";

export function BottomNav({ bookingOptions }: { bookingOptions: readonly BookingOption[] }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef<HTMLButtonElement>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const bookRef = useRef<HTMLButtonElement>(null);

  /*
    A drawer left open across a route change is a drawer covering the page the
    visitor just asked for. Reset DURING RENDER rather than in an effect —
    React's own pattern for adjusting state when a prop changes, and the one
    `react-hooks/set-state-in-effect` is pointing at. <MobileNav> resets its
    vibe filter the same way, for the same reason: an effect would paint the
    open drawer for a frame over the new page first.
  */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setAboutOpen(false);
  }

  const isCurrent = (item: NavItem) =>
    item.match ? item.match(pathname) : pathname === item.href;

  /*
    MORE CARRIES THE STATE FOR WHAT IS BEHIND IT. A visitor on /private-events
    is somewhere the bar can reach — it is just a tap further in — so the slot
    that reaches it is marked. Without this the bar went blank on three of the
    site's pages and said "you are nowhere", which is worse than imprecise.
    The drawer being open marks it too, for the same reason.
  */
  const onSheetRoute = SHEET_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  /* The blob only travels once there is somewhere to travel to. On a route
     none of them lists — /faq, /checkout — nothing is marked, which is
     honest: none of the five is where you are. */
  const anyCurrent = ITEMS.some(isCurrent) || onSheetRoute;

  const bar = (
    <motion.nav
      aria-label="Primary"
      className={cn(styles.bar, "fixed inset-x-0 bottom-0 z-40 lg:hidden")}
      /* The entrance: the sheet arrives from under the fold once, on mount.
         Not scroll-driven — a bar that reacts to scrolling is a bar that is
         sometimes missing, and this one is the whole map. */
      initial={reduce ? false : { y: "110%" }}
      animate={{ y: 0 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30, delay: 0.35 }}
    >
      {/* ---- the wave along the top edge ---- */}
      <svg
        aria-hidden
        viewBox="0 0 390 40"
        preserveAspectRatio="none"
        /*
          1.5rem, NOT 2.25. Measured at 390: the sheet is 48px and its icons
          start 4px into it, so the bar itself was already as tight as its
          targets allow — all of the empty purple the client circled was up
          here. The wave is drawn in a 40-unit box whose crests sit at 7 and
          troughs at 26, so at 36px tall it put 23px of flat colour over the
          icons before the first glyph. At 24px that is 15, the curve keeps
          its shape because the viewBox scales with it, and the bar's whole
          painted extent comes down from 83px to 71.
        */
        className="absolute inset-x-0 bottom-full h-[1.5rem] w-full translate-y-px"
      >
        <path d={WAVE} fill="var(--color-primary)" />
      </svg>

      {/* ---- the sheet ---- */}
      {/*
        SHORTER TWICE. 77px, then 65, and now 53 on a phone with a home
        button — measured at 390x844 each time. The client's second note was
        that it still took "huge space", and the first pass had only taken the
        easy ten.

        AND A THIRD TIME, TO 48 — but the last pass was as much about where
        the space WAS as how much of it there was. Measured against the bar's
        own top, the glyph did not start until 9.5px down (2 of wrapper
        padding, 4 of link padding, and 3.5 of slack inside a 28px icon box
        holding a 21px glyph) while only 6px sat under the label. The bar was
        not merely tall, it was top-heavy — the "slot space above each icon"
        in the client's note.

        SO THE SLACK IS CENTRED RATHER THAN STACKED. The link keeps its 44px
        because that is what a touch target owes and the content only comes
        to 36; the difference is split by `justify-center` instead of being
        spent as padding above the glyph. The icon box is the glyph's size
        now, and the wrapper's top padding is gone.
      */}
      <div className="relative overflow-hidden bg-primary pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-0">
        {/*
          SMALL COLOUR AT THE TWO BOTTOM CORNERS, clipped by the sheet so only
          a curve of each one shows — the brief's "colour accents", and the
          reference's own device. They are under everything and carry no
          meaning, so they are the one place on this bar where Soft Lavender
          and its 1.40:1 against White Rock are perfectly fine.
        */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-7 -left-6 size-20 rounded-full bg-sage/30"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-8 -right-7 size-24 rounded-full bg-terracotta/35"
        />
        {/* Three dots of paint, thrown. Fixed positions, not random: this
            renders on the server and again on the client. */}
        <span aria-hidden className="pointer-events-none absolute left-[14%] top-1 size-1 rounded-full bg-lavender" />
        <span aria-hidden className="pointer-events-none absolute right-[18%] top-2 size-1.5 rounded-full bg-terracotta" />
        <span aria-hidden className="pointer-events-none absolute right-[33%] bottom-2 size-1 rounded-full bg-sage/60" />

        <ul className="relative grid grid-cols-5 items-end">
          {ITEMS.slice(0, 2).map((item) => (
            <Item key={item.href} item={item} current={isCurrent(item)} reduce={!!reduce} any={anyCurrent} />
          ))}

          {/* The middle cell is a spacer: the badge is positioned against the
              nav, not against this cell, so it can rise out of the sheet. */}
          <li aria-hidden className="h-11" />

          {ITEMS.slice(2).map((item) => (
            <Item key={item.href} item={item} current={isCurrent(item)} reduce={!!reduce} any={anyCurrent} />
          ))}

          {/* ABOUT IS A BUTTON, NOT A LINK, because it goes nowhere — it
              opens a drawer, and /about is the first card inside it exactly
              as "About the Maison" is the first door of the desktop panel.
              Giving it `aria-expanded` and `aria-controls` is what says that
              to anyone not looking at it. */}
          <li>
            <button
              ref={aboutRef}
              type="button"
              aria-expanded={aboutOpen}
              /*
                ONLY WHILE IT EXISTS. <AboutSheet> renders null when closed, so
                a constant `aria-controls` pointed at an id that was absent
                from the DOM on every page — "jump to controlled element" did
                nothing, every time. `aria-expanded` already says the button
                opens something; `aria-controls` is only meaningful once there
                is something to control.
              */
              aria-controls={aboutOpen ? "bottom-nav-about" : undefined}
              aria-current={onSheetRoute ? "page" : undefined}
              onClick={() => setAboutOpen((v) => !v)}
              className="group/nav flex min-h-11 w-full flex-col items-center justify-center gap-[3px] px-1 py-0 text-on-primary outline-offset-4"
            >
              <span className="relative flex size-[1.375rem] items-center justify-center">
                {aboutOpen || onSheetRoute ? (
                  <motion.span
                    aria-hidden
                    layoutId="bottom-nav-ink"
                    className={cn(styles.inkBlob, "absolute inset-0 bg-cream")}
                    transition={
                      reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }
                    }
                  />
                ) : null}
                <motion.span
                  className="relative"
                  whileTap={reduce ? undefined : { scale: 0.82 }}
                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                >
                  <AboutIcon
                    size={21}
                    className={cn(
                      "block transition-colors duration-300 ease-soft",
                      aboutOpen || onSheetRoute ? "text-primary" : "text-on-primary",
                    )}
                  />
                </motion.span>
              </span>
              <span className="relative block">
                <span className="block text-[0.6875rem] font-medium leading-none tracking-[0.04em] max-[374px]:text-[0.625rem] max-[374px]:tracking-[0em] text-on-primary">
                  About
                </span>
                <span
                  aria-hidden
                  className={cn(
                    styles.brush,
                    "absolute -bottom-1 left-0 h-[3px] w-full origin-left [--paint:var(--color-cream)] transition-transform duration-300 ease-editorial motion-reduce:transition-none",
                    aboutOpen || onSheetRoute ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </span>
            </button>
          </li>
        </ul>
      </div>

      <BookBadge
        reduce={!!reduce}
        open={bookOpen}
        onOpen={() => {
          /* One sheet at a time: the drawer and the dialog both cover the bar,
             and two of them open at once is two scrims and no way back. */
          setAboutOpen(false);
          setBookOpen(true);
        }}
        triggerRef={bookRef}
        controls={bookOpen ? BOOK_SHEET_ID : undefined}
      />

    </motion.nav>
  );

  /*
    THE TWO SHEETS ARE SIBLINGS OF THE BAR, NOT CHILDREN OF IT.

    Both are modals — `fixed`, z-50, over their own scrim — and inside
    <motion.nav> neither could ever reach that. The bar is z-40, which opens a
    stacking context and caps everything inside it at 40, while <Header> is
    z-50: the logo and the search button painted straight over the open sheet,
    and the scrim dimmed the page but not the header. The bar also animates `y`
    on mount, and a transformed ancestor becomes the containing block for
    `fixed` descendants, so the sheets were being positioned against the bar
    rather than against the window.

    Out here they are direct children of <body> — app/layout.tsx already mounts
    <BottomNav> last — so their z-50 stands beside the header's and wins on
    document order, which is what the scrim and `role="dialog"` always meant.

    <BookBadge> stays inside the bar: it is the bar's own raised control, not a
    modal, and it rises out of the sheet it belongs to.
  */
  return (
    <>
      {bar}

      <AboutSheet
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        items={SHEET_ITEMS}
        returnFocusTo={aboutRef}
      />

      <BookingSheet
        id={BOOK_SHEET_ID}
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        options={bookingOptions}
        returnFocusTo={bookRef}
      />
    </>
  );
}

/** One destination: an icon that can sit in paint, and a word under it. */
function Item({
  item,
  current,
  reduce,
  any,
}: {
  item: NavItem;
  current: boolean;
  reduce: boolean;
  any: boolean;
}) {
  const { Icon } = item;

  /*
    AN OUTBOUND ACTION IS AN ANCHOR, NOT A <Link>. next/link prefetches and
    routes client-side, both of which are wrong for `wa.me`: there is no route
    to prefetch and the hand-off belongs to the OS, which opens the WhatsApp
    app on a phone and web.whatsapp.com on a desktop. `rel="noopener
    noreferrer"` because `target="_blank"` without it hands the opened tab a
    live `window.opener` back into this one.
  */
  const Tag = item.external ? "a" : Link;
  const linkProps = item.external
    ? { href: item.href, target: "_blank", rel: "noopener noreferrer" as const }
    : { href: item.href };

  return (
    <li>
      <Tag
        {...linkProps}
        aria-label={item.ariaLabel}
        aria-current={current ? "page" : undefined}
        /* 56px of height plus the label's line box clears the 44px a touch
           target owes at every width this bar is drawn at. */
        className="group/nav flex min-h-11 flex-col items-center justify-center gap-[3px] px-1 py-0 text-on-primary outline-offset-4"
      >
        <span className="relative flex size-[1.375rem] items-center justify-center">
          {current && any ? (
            <motion.span
              aria-hidden
              layoutId="bottom-nav-ink"
              className={cn(styles.inkBlob, "absolute inset-0 bg-cream")}
              transition={
                reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }
              }
            />
          ) : null}

          {/* Three dots thrown off the paint as it lands. They belong to the
              item, not to the shared blob, so they pop where it arrives. */}
          {current && any && !reduce ? (
            <>
              <Dot className="-right-1 -top-0.5 bg-terracotta" delay={0.12} />
              <Dot className="-left-1.5 top-1.5 bg-lavender" delay={0.18} />
              <Dot className="-bottom-0.5 right-0.5 bg-sage" delay={0.24} />
            </>
          ) : null}

          <motion.span
            className="relative"
            whileTap={reduce ? undefined : { scale: 0.82 }}
            transition={{ type: "spring", stiffness: 600, damping: 20 }}
          >
            <Icon
              size={21}
              /*
                IT FLIPS WITH ITS GROUND. Idle, the icon sits on Deep Lilac
                and takes the near-white `on-primary` (4.90:1); current, it
                sits on the White Rock blob and takes Deep Lilac (3.95:1).
                The near-white on the blob would have been 1.24:1 — no one ink
                works on both grounds.

                DEEP LILAC RATHER THAN CHARCOAL, which is what it was. Charcoal
                measures 9.36:1 on the blob and is the stronger ink by a long
                way, but it reads as a black fill dropped into a pastel bar and
                the client asked for the palette instead. Deep Lilac is the
                only other brand colour that can hold a glyph on White Rock:
                Terracotta is 2.44:1 there and Soft Lavender 1.3:1, both under
                the 3:1 a non-text graphic owes. 3.95:1 clears it, and the ink
                is now the bar's own colour showing through its paint.

                THE WEIGHT NO LONGER CHANGES WITH IT, because a filled glyph
                has no stroke to thicken. Nothing is lost: the paint arriving
                behind the icon, the brush under the word and `aria-current`
                were always the three things saying it.
              */
              className={cn(
                "block transition-colors duration-300 ease-soft",
                current ? "text-primary" : "text-on-primary",
              )}
            />
          </motion.span>
        </span>

        <span className="relative block">
          <span className="block text-[0.6875rem] font-medium leading-none tracking-[0.04em] max-[374px]:text-[0.625rem] max-[374px]:tracking-[0em] text-on-primary">
            {item.label}
          </span>
          {/* The brush, drawn only under the word it belongs to. White Rock
              now, not Deep Lilac: the sheet IS Deep Lilac, and a mark cannot
              be drawn in the colour it is drawn on. 3.95:1, over what a
              graphical mark owes. */}
          <span
            aria-hidden
            className={cn(
              styles.brush,
              "absolute -bottom-1 left-0 h-[3px] w-full origin-left [--paint:var(--color-cream)] transition-transform duration-300 ease-editorial motion-reduce:transition-none",
              current ? "scale-x-100" : "scale-x-0",
            )}
          />
        </span>
      </Tag>
    </li>
  );
}

/** One of the dots thrown off the paint. */
function Dot({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.span
      aria-hidden
      className={cn("absolute size-1 rounded-full", className)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 18, delay }}
    />
  );
}

/**
 * The booking action, raised out of the sheet.
 *
 * It is an ACTION, not a destination, so it carries no current state: it
 * points at the booked half of the programme from every page, including the
 * Events page it lands on. Marking it would say "you are here" about a thing
 * you do.
 */
/**
 * ==========================================================================
 * A BUTTON, NOT A LINK — it opens the booking sheet
 * ==========================================================================
 *
 * This was `<Link href="/events#scheduled">`, which is the page the
 * Experiences tab two cells to its left already opens. Two of the bar's
 * destinations went to one place, and the one labelled as the booking action
 * was the slower way to book: a list of seven activities, five of which are
 * walk-in and cannot be booked at all.
 *
 * It goes nowhere now, so it is a button — with `aria-expanded` and
 * `aria-controls`, which is what says "this opens something" to anybody not
 * looking at it. The same pair <MoreSheet>'s trigger beside it carries.
 */
function BookBadge({
  reduce,
  open,
  onOpen,
  triggerRef,
  controls,
}: {
  reduce: boolean;
  open: boolean;
  onOpen: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Undefined while the sheet is closed — it renders null, so the id
   *  it would name is not in the DOM. */
  controls?: string;
}) {
  /*
    THE BOOK LABEL SITS ON THE SAME LINE AS THE OTHER FOUR.

    This badge is positioned against the bar rather than laid out in the row
    with its siblings, so its label was wherever the offset happened to put
    it — measured, 12px above the other four, which is the "not well aligned"
    in the client's note and the most visible thing in the bar once you see
    it.

    The extra 0.75rem is gone. At the bar's own bottom padding the label's
    baseline lands on the row's and the disc's foot lands within half a pixel
    of the other glyphs' feet — the two rows the eye actually reads line up,
    and the disc still breaks the top edge the
    way a raised action should.
  */
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-center">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={controls}
        aria-label={BOOK.label}
        onClick={onOpen}
        className="pointer-events-auto flex flex-col items-center outline-offset-4"
      >
        <motion.span
          className={cn(
            styles.badge,
            /* Deep Lilac on Light Sage is 3.83:1 — over the 3:1 a glyph of
               this weight owes, and the palette's ink rather than a black
               one. See the note on the nav items' icons for why not Charcoal
               and why no third colour was available. */
            "relative flex size-[3.4rem] items-center justify-center bg-sage text-primary shadow-[0_6px_18px_-6px_rgba(45,55,72,0.55)]",
          )}
          whileTap={reduce ? undefined : { scale: 0.9 }}
          whileHover={reduce ? undefined : { scale: 1.04 }}
          transition={{ type: "spring", stiffness: 520, damping: 18 }}
        >
          {/* The three ticks the reference throws above its badge. */}
          <span aria-hidden className="absolute -top-3 left-1 h-2.5 w-[2px] -rotate-[20deg] rounded-full bg-cream" />
          <span aria-hidden className="absolute -top-4 left-4 h-3 w-[2px] rounded-full bg-cream" />
          <span aria-hidden className="absolute -top-3 right-1 h-2.5 w-[2px] rotate-[20deg] rounded-full bg-cream" />
          {/* And a dot of terracotta off its shoulder. */}
          <span aria-hidden className="absolute -right-1.5 bottom-1 size-1.5 rounded-full bg-terracotta" />

          <BookIcon size={23} className="block" />
        </motion.span>

        <span className="mt-1 block text-[0.6875rem] font-semibold leading-none tracking-[0.04em] max-[374px]:text-[0.625rem] max-[374px]:tracking-[0em] text-on-primary">
          Book
        </span>
      </button>
    </div>
  );
}
