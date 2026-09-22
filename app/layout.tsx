import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/layout/Footer";
import { FooterReveal } from "@/components/layout/FooterReveal";
import { FooterWave } from "@/components/layout/FooterWave";
import { BlobGooFilter } from "@/components/ui/BlobButton";
import { Header } from "@/components/layout/Header";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { WhatsAppWidget } from "@/components/layout/WhatsAppWidget";
import { CursorLayer } from "@/components/motion/CursorLayer";
import { PointerField } from "@/components/motion/PointerField";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { INTRO_SCRIPT } from "@/components/sections/hero/intro";
import { hapsha, montserrat } from "@/lib/fonts";
import { defaultMetadata } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  // The page ground, resolved. `themeColor` cannot read a CSS custom property,
  // so this is the one place a surface colour is repeated as a literal — it is
  // White Rock at 14% over white, the same mix `--color-surface` declares.
  themeColor: "#fdfbf8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <a href="#main" className="skip-link rounded-sm bg-primary px-4 py-2 text-sm text-on-primary">
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
          className="relative z-10 mb-[var(--footer-height,0px)] flex-1 bg-surface"
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

        {/* Last in the body so it sits above the page without a stacking
            context of its own; renders nothing until it has a number. */}
        {/* The paint dab, over pictures only — it mounts nothing on a phone
            or under reduced motion. See components/motion/CursorLayer.tsx. */}
        <CursorLayer />
        {/* Publishes the pointer's position as --mx/--my on <html> so every
            <DoodleMark> on the page can drift against it, the way the
            banner's doodles do. Renders nothing; see PointerField.tsx. */}
        <PointerField />

        <WhatsAppWidget />
      </body>
    </html>
  );
}
