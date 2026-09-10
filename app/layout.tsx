import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/layout/Footer";
import { FooterReveal } from "@/components/layout/FooterReveal";
import { Header } from "@/components/layout/Header";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { hapsha, montserrat, qarine } from "@/lib/fonts";
import { defaultMetadata } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: "#fffdf9",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${qarine.variable} ${hapsha.variable}`}>
      <head>
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
        <a href="#main" className="skip-link rounded-pill bg-primary px-4 py-2 text-sm text-white">
          Skip to content
        </a>
        <Header />
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
        </main>

        <FooterReveal>
          <Footer />
        </FooterReveal>
      </body>
    </html>
  );
}
