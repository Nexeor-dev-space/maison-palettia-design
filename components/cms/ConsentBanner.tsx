"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  isExcludedPath,
  normalisePath,
  type ConsentChoice,
  type SiteAnalyticsConfig,
} from "@/cms/collections/analytics/shared";

/**
 * ==========================================================================
 * ConsentBanner — asks once, before any third-party script loads (SPEC §C.3)
 * ==========================================================================
 *
 * Shown only when ALL of these hold:
 *   · Analytics & tracking has a third-party tag set up (GA4, Plausible,
 *     Umami or a Meta Pixel) — with none, there is nothing to consent to and
 *     no banner, because the first-party counter needs no consent;
 *   · "Ask before loading third-party scripts" is on (the default; UAE PDPL);
 *   · this browser has not answered yet (`localStorage["mp_consent"]`);
 *   · the page is not a booking surface (nobody should meet a cookie
 *     question between "Pay" and the payment page).
 *
 * Accept and Decline are equal-weight buttons — declining is as easy as
 * accepting, which is the point of asking. The choice is stored in the
 * visitor's own browser and announced with a `mp:consent` window event so
 * <ExternalAnalytics> loads the tags at once, without a reload.
 *
 * Changing one's mind later: `window.mpConsent.reset()` clears the stored
 * choice and shows the banner again — a footer "Cookie settings" link can
 * call it.
 */

/** Where the choice lives when localStorage is unavailable (private mode): this page only, which is still a choice. */
let memoryChoice: ConsentChoice | null = null;

export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return memoryChoice;
  }
}

function storeConsent(choice: ConsentChoice | null) {
  memoryChoice = choice;
  try {
    if (choice) window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    else window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // kept in memory above
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The visitor's answer: "granted", "denied", `null` (not asked yet) — or
 * `undefined` during server rendering and hydration, when localStorage
 * cannot be read. Treat `undefined` as "do nothing yet": no banner flash for
 * someone who already answered, and no script before we know.
 */
export function useConsent(): ConsentChoice | null | undefined {
  return useSyncExternalStore<ConsentChoice | null | undefined>(subscribe, readConsent, () => undefined);
}

export function ConsentBanner({
  consent,
  active,
  excludePaths,
}: {
  consent: SiteAnalyticsConfig["consent"];
  /** True when a third-party tag is configured. */
  active: boolean;
  excludePaths: string[];
}) {
  const pathname = usePathname();
  const choice = useConsent();

  useEffect(() => {
    (window as Window & { mpConsent?: { reset: () => void } }).mpConsent = { reset: () => storeConsent(null) };
  }, []);

  const path = normalisePath(pathname || "/") ?? "/";
  if (!active || !consent.required || choice !== null || isExcludedPath(path, excludePaths)) return null;

  return (
    <section
      role="region"
      aria-label="Cookie choice"
      className="fixed inset-x-4 bottom-[calc(var(--bottom-nav-h,0px)+1rem)] z-[45] mx-auto max-w-md rounded-lg border border-line bg-surface-alt p-5 text-text shadow-[var(--shadow-veil)] sm:left-6 sm:right-auto sm:mx-0"
    >
      <p className="text-sm leading-relaxed">
        {consent.bannerText}{" "}
        <Link href={consent.policyHref} className="underline underline-offset-2 hover:text-primary">
          Privacy policy
        </Link>
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => storeConsent("granted")}
          className="flex-1 rounded-pill bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {consent.acceptLabel}
        </button>
        <button
          type="button"
          onClick={() => storeConsent("denied")}
          className="flex-1 rounded-pill border border-text/30 px-4 py-2 text-sm font-medium text-text transition-colors hover:border-text focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {consent.declineLabel}
        </button>
      </div>
    </section>
  );
}
