"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { isExcludedPath, normalisePath, type SiteAnalyticsConfig } from "@/cms/collections/analytics/shared";

import { useConsent } from "./ConsentBanner";

/**
 * ==========================================================================
 * ExternalAnalytics — GA4 / Plausible / Umami / Meta Pixel, only after
 * consent and never on the booking pages (SPEC §C.3, §G.2, §H.10)
 * ==========================================================================
 *
 * Renders nothing. Loads the third-party script(s) set up in Analytics &
 * tracking, by creating the `<script>` elements itself, when:
 *
 *   · the visitor accepted the consent banner (or "Ask before loading
 *     third-party scripts" is off), AND
 *   · the current page is not excluded — the booking surfaces
 *     (/checkout, /payment-success, /my-bookings, /booking-status, /dev)
 *     always, plus Analytics & tracking → "Paths never recorded".
 *
 * PAGE VIEWS ARE SENT BY HAND, NOT BY THE TAGS. Each provider is put in its
 * manual mode (GA4 `send_page_view: false`, Plausible's `script.manual.js`,
 * Umami `data-auto-track="false"`), and this component reports a page view
 * on every route change — except on excluded pages, where it reports
 * nothing and, for GA4, also raises Google's own opt-out flag
 * (`window["ga-disable-G-…"]`) so not even an automatic event (enhanced
 * measurement) can leave from a checkout page. A script that is already
 * loaded cannot be unloaded, which is why the per-page gate matters more
 * than the first load. The URL reported is origin + pathname only: query
 * strings (which can carry an order reference or a token) are never sent.
 *
 * THE IDS ARE DATA, NEVER CODE. The admin validates each id's shape
 * (cms/globals/AnalyticsSettings.ts), the server re-checks it before it
 * reaches this component (cms/lib/analytics.ts `toSiteAnalyticsConfig`),
 * and here ids only ever go into a URL through `encodeURIComponent`, into
 * a `data-` attribute, or into a function call as a JavaScript value —
 * nothing is concatenated into script source.
 */

type Queue = ((...args: unknown[]) => void) & { q?: unknown[]; queue?: unknown[]; callMethod?: (...args: unknown[]) => void; loaded?: boolean; version?: string; push?: unknown };

type TagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  plausible?: Queue;
  umami?: { track: (props?: unknown) => void };
  fbq?: Queue;
  _fbq?: Queue;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

/** Appends a script once (by id); resolves when it has loaded. */
function loadScript(id: string, src: string, attrs: Record<string, string> = {}): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) return existing.dataset.loaded === "1" ? Promise.resolve() : new Promise((resolve) => existing.addEventListener("load", () => resolve(), { once: true }));
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    for (const [name, value] of Object.entries(attrs)) script.setAttribute(name, value);
    script.addEventListener("load", () => {
      script.dataset.loaded = "1";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`could not load ${src}`)));
    document.head.appendChild(script);
  });
}

/** Sets up each configured provider (queues first, so calls before the script arrives are kept). */
function install(external: SiteAnalyticsConfig["external"]) {
  const w = window as unknown as TagWindow;

  if (external.provider === "ga4" && external.measurementId) {
    if (!w.gtag) {
      w.dataLayer = w.dataLayer || [];
      // gtag.js reads the `arguments` object itself, not an array — this is Google's own stub.
      w.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
      w.gtag("js", new Date());
      w.gtag("config", external.measurementId, { send_page_view: false, anonymize_ip: true, allow_google_signals: false });
    }
    void loadScript("mp-ga4", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(external.measurementId)}`).catch(() => undefined);
  }

  if (external.provider === "plausible" && external.plausibleDomain) {
    if (!w.plausible) {
      const stub: Queue = (...args: unknown[]) => {
        (stub.q = stub.q || []).push(args);
      };
      w.plausible = stub;
    }
    void loadScript("mp-plausible", "https://plausible.io/js/script.manual.js", { "data-domain": external.plausibleDomain }).catch(() => undefined);
  }

  if (external.provider === "umami" && external.umamiScriptUrl && external.umamiWebsiteId) {
    void loadScript("mp-umami", external.umamiScriptUrl, { "data-website-id": external.umamiWebsiteId, "data-auto-track": "false" }).catch(() => undefined);
  }

  if (external.metaPixelId && !w.fbq) {
    // Meta's documented stub, written out: a function that queues calls until fbevents.js replaces it.
    const fbq: Queue = (...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    w.fbq = fbq;
    w._fbq = w._fbq || fbq;
    fbq("init", external.metaPixelId);
    void loadScript("mp-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js").catch(() => undefined);
  }
}

/** One page view to each configured provider. */
function trackPageView(external: SiteAnalyticsConfig["external"], path: string) {
  const w = window as unknown as TagWindow;
  const url = `${window.location.origin}${path}`;
  if (external.provider === "ga4" && external.measurementId) {
    w[`ga-disable-${external.measurementId}`] = false;
    w.gtag?.("event", "page_view", { page_location: url, page_path: path, page_title: document.title });
  }
  if (external.provider === "plausible") w.plausible?.("pageview", { u: url });
  if (external.provider === "umami") {
    const send = () => w.umami?.track((props: Record<string, unknown>) => ({ ...props, url: path, referrer: "" }));
    if (w.umami) send();
    else void loadScript("mp-umami", external.umamiScriptUrl ?? "").then(send, () => undefined);
  }
  if (external.metaPixelId) w.fbq?.("track", "PageView");
}

/** On an excluded page: make sure nothing can be sent from here, even automatically. */
function silence(external: SiteAnalyticsConfig["external"]) {
  if (external.provider === "ga4" && external.measurementId) (window as unknown as TagWindow)[`ga-disable-${external.measurementId}`] = true;
}

export function ExternalAnalytics({
  external,
  consentRequired,
  excludePaths,
}: {
  external: SiteAnalyticsConfig["external"];
  consentRequired: boolean;
  excludePaths: string[];
}) {
  const pathname = usePathname();
  const choice = useConsent();
  const installed = useRef(false);
  const lastPath = useRef<string | null>(null);
  const exclude = excludePaths.join("\n");
  const configured = external.provider !== "none" || Boolean(external.metaPixelId);
  const allowed = configured && (consentRequired ? choice === "granted" : choice !== undefined);

  useEffect(() => {
    if (!allowed) return;
    const path = normalisePath(pathname || window.location.pathname);
    if (!path) return;
    if (isExcludedPath(path, exclude.split("\n"))) {
      silence(external);
      lastPath.current = path;
      return;
    }
    if (!installed.current) {
      installed.current = true;
      install(external);
    }
    if (lastPath.current === path) return;
    lastPath.current = path;
    trackPageView(external, path);
  }, [allowed, pathname, exclude, external]);

  return null;
}
