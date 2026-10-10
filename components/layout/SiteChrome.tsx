"use client";

import { createContext, useContext, type ReactNode } from "react";

import { BRAND_LOGO, DARK_HERO_ROUTES, LIGHT_HERO_ROUTES, MAIN_NAV, PRIMARY_CTA, SITE } from "@/lib/constants";
import { PRIVATE_EVENT_AUDIENCES, type PrivateEventAudience } from "@/lib/privateEvents";
import { VIBES, type Vibe } from "@/lib/vibes";
import type { NavItem } from "@/types";

/**
 * ==========================================================================
 * The site chrome's CMS data, for the client components that draw it
 * ==========================================================================
 *
 * The header, the phone's bottom bar and their menus are client components
 * (scroll, menu and search state), several levels deep: HeaderBar →
 * MobileNav → FindYourVibe, HeaderBar → PrivateEventsMenu → BookAction. They
 * cannot await a getter, and threading seven lists through every level
 * would touch a dozen signatures for no gain. So the root layout reads the
 * getters once on the server (Menus, Site details, the vibes and the
 * programmes) and hands them in here; each component takes what it draws
 * with `useSiteChrome()`.
 *
 * DEFAULTS ARE THE CONSTANTS. Outside the provider — a component rendered in
 * isolation — every value is the in-file one, so nothing renders blank.
 *
 * PLAIN DATA ONLY. The value crosses the server → client boundary as
 * serialised props, so it holds lists and strings, never functions.
 */

export interface SiteChromeLogo {
  src: string;
  width: number;
  height: number;
  ink: { left: number; top: number; width: number; height: number };
  onLight: { src: string; width: number; height: number; ink: { left: number; top: number; width: number; height: number } };
}

export interface SiteChromeData {
  site: { name: string; tagline: string };
  logo: SiteChromeLogo;
  mainNav: NavItem[];
  primaryCta: { label: string; href: string };
  heroRoutes: { dark: string[]; light: string[] };
  audiences: PrivateEventAudience[];
  vibes: Vibe[];
}

const IN_FILE: SiteChromeData = {
  site: { name: SITE.name, tagline: SITE.tagline },
  logo: BRAND_LOGO,
  mainNav: MAIN_NAV,
  primaryCta: PRIMARY_CTA,
  heroRoutes: { dark: [...DARK_HERO_ROUTES], light: [...LIGHT_HERO_ROUTES] },
  audiences: [...PRIVATE_EVENT_AUDIENCES],
  vibes: [...VIBES],
};

const SiteChromeContext = createContext<SiteChromeData>(IN_FILE);

export function SiteChromeProvider({ value, children }: { value: SiteChromeData; children: ReactNode }) {
  return <SiteChromeContext.Provider value={value}>{children}</SiteChromeContext.Provider>;
}

export const useSiteChrome = () => useContext(SiteChromeContext);
