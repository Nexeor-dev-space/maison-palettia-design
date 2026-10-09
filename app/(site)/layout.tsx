import type { Metadata, Viewport } from "next";
import { getBookingOptions } from "@/lib/bookingOptions";

import { ClickToEdit } from "@/components/cms/ClickToEdit";
import { LivePreviewListener } from "@/components/cms/LivePreviewListener";
import { Footer } from "@/components/layout/Footer";
import { FooterReveal } from "@/components/layout/FooterReveal";
import { FooterWave } from "@/components/layout/FooterWave";
import { BlobGooFilter } from "@/components/ui/BlobButton";
import { Header } from "@/components/layout/Header";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { SiteChromeProvider, type SiteChromeData } from "@/components/layout/SiteChrome";
import { BottomNav } from "@/components/layout/BottomNav";
import { ContactWidget } from "@/components/layout/ContactWidget";
import { CursorLayer } from "@/components/motion/CursorLayer";
import { PointerField } from "@/components/motion/PointerField";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { INTRO_SCRIPT } from "@/components/sections/hero/intro";
import { hapsha, montserrat } from "@/lib/fonts";
import { isDraft } from "@/lib/cms/draft";
import { getDefaultMetadata } from "@/lib/seo";
import { getBrandLogo, getHeroRoutes, getMainNav, getPrimaryCta, getSite } from "@/lib/constants.server";
import { getPrivateEventAudiences } from "@/lib/privateEvents.server";
import { getVibes } from "@/lib/vibes.server";

import "./globals.css";

/*
  The site-wide defaults — name, tagline, title template, origin and the
  default share card — from Site details and Search & sharing (lib/seo.ts).
*/
export function generateMetadata(): Promise<Metadata> {
  return getDefaultMetadata();
}

export const viewport: Viewport = {
  // The page ground, resolved. `themeColor` cannot read a CSS custom property,
  // so this is the one place a surface colour is repeated as a literal — it is
  // White Rock at 14% over white, the same mix `--color-surface` declares.
  themeColor: "#fdfbf8",
  colorScheme: "light",
};

/*
  ASYNC, FOR ONE LIST. <BottomNav> is a client component and the sheet behind
  its Book button needs the scheduled activities, which live in the data layer
  — so the layout reads them on the server and hands them down. Both sources
  are local modules, so this costs no request; it is the same shape the header
  already uses for its menus.
*/
/*
  What the client chrome draws, read once per render of the layout: Menus
  (the bar, the phone's tabs, the Book button), Site details (name, tagline,
  the two logo cuts, which routes open over a hero) and the two lists the
  header's panels show (programmes, vibes). Each getter is cached under its
  own tag, so a save in the admin reaches every page's chrome.
*/
async function getChrome(): Promise<SiteChromeData> {
  const [site, logo, mainNav, primaryCta, heroRoutes, audiences, vibes] = await Promise.all([
    getSite(),
    getBrandLogo(),
    getMainNav(),
    getPrimaryCta(),
    getHeroRoutes(),
    getPrivateEventAudiences(),
    getVibes(),
  ]);
  return { site: { name: site.name, tagline: site.tagline }, logo, mainNav, primaryCta, heroRoutes, audiences, vibes };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [bookingOptions, draft, chrome] = await Promise.all([getBookingOptions(), isDraft(), getChrome()]);

  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${hapsha.variable}`}
      /* The intro script below writes `data-intro` here before hydration, to
         decide on the homepage intro without a flash; React is told to expect
         it. This only covers this element's own attributes, not anything
         beneath it. */
      suppressHydrationWarning
    >
      <head>
        {/* Decides the homepage intro before first paint; does nothing on any
            other page. See components/sections/hero/intro.ts. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
        {/*
          Scroll-triggered reveals render at opacity 0 until JavaScript runs.
          Without this, a visitor (or crawler) with JS disabled sees an empty
          page. Keep the selector in sync with components/motion/.
        */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col">
        {/* Menus, logo and the lists behind the header's panels, from the
            CMS, for the client components that draw the chrome — see
            components/layout/SiteChrome.tsx. */}
        <SiteChromeProvider value={chrome}>
          {/*
            Renders nothing; it hands the page's scrolling to Lenis so the wheel
            eases rather than steps. Everything scroll-driven on the site is
            timed against it. Mounted here rather than per-page because it is the
            document that scrolls, and it takes itself back out for a reader who
            has asked for reduced motion.
          */}
          <SmoothScroll />
          {/* The gooey filter the primary action's blobs are drawn through, reachable
              by id from anywhere in the document — see <BlobButton>. */}
          <BlobGooFilter />
          <a href="#main" className="skip-link rounded-pill bg-primary px-4 py-2 text-sm text-on-primary">
            Skip to content
          </a>
          <Header />
          {/* 2px pending bar for client-side navigation. See the component for
              why this is not app/loading.tsx. */}
          <RouteProgress />
          {/*
            The two halves of the footer reveal; see <FooterReveal> for the whole
            mechanism.

            `bg-surface` is not decoration — it is the lid. The footer is pinned
            behind this element, and a transparent main would show it through
            every seam in the page.

            The bottom margin is the footer's own measured height, which is the
            distance the page has to travel before its foot clears the footer and
            uncovers it. It falls back to `0px` until the measurement lands, so
            the layout is unchanged without JavaScript.
          */}
          <main
            id="main"
            className="relative z-10 mb-[var(--footer-height,0px)] flex-1 bg-surface pb-[var(--bottom-nav-h)]"
          >
            {children}
            {/*
              The footer's wave, INSIDE main and anchored to its bottom edge. It
              has to be on this side of the lid: the footer is pinned behind
              main, so a shape drawn from the footer upward is covered by the
              very background that hides the footer. Filled with the footer's own
              White Rock, so what reads is the footer's background rising over
              the seam. Decorative, hidden from the accessibility tree, and last
              so it paints over the closing section rather than under it. See
              <FooterWave>.
            */}
            <FooterWave />
          </main>

          <FooterReveal>
            <Footer />
          </FooterReveal>

          {/* The paint dab, over pictures only — it mounts nothing on a phone
              or under reduced motion. See components/motion/CursorLayer.tsx. */}
          <CursorLayer />
          {/* Publishes the pointer's position as --mx/--my on <html> so every
              <DoodleMark> on the page can drift against it, the way the
              banner's doodles do. Renders nothing; see PointerField.tsx. */}
          <PointerField />

          {/* The floating Contact link, from `lg` up. Late in the body so it
              sits above the page without a stacking context of its own; it
              renders nothing on /contact itself. */}
          <ContactWidget />
          {/* Below `lg` only — see <BottomNav>. Mounted after the footer so it
              paints over the page's own foot, and before <CursorLayer>'s
              siblings so nothing of it is caught by the brush. */}
          <BottomNav bookingOptions={bookingOptions} />

          {/*
            AN EDITOR'S PREVIEW ONLY (SPEC §G.5). Draft mode is switched on by
            /preview for a signed-in editor; on the public site `draft` is
            false and neither of these is in the HTML. One refreshes the page
            on every admin save (live preview), the other draws the "Edit"
            pills over each section (click-to-edit).
          */}
          {draft ? (
            <>
              <LivePreviewListener />
              <ClickToEdit />
            </>
          ) : null}
        </SiteChromeProvider>
      </body>
    </html>
  );
}
