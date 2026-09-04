import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { montserrat } from "@/lib/fonts";
import { defaultMetadata } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: "#fffdf9",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
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
        <a href="#main" className="skip-link rounded-pill bg-primary px-4 py-2 text-sm text-white">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
