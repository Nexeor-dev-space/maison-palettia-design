"use client";

import { useSyncExternalStore } from "react";

import { useSiteChrome } from "@/components/layout/SiteChrome";
import { introConfig, introScript } from "@/components/sections/hero/introCore";

/**
 * THE HOMEPAGE INTRO, STARTED THE MOMENT ITS HERO HAS BEEN PARSED.
 *
 * Rendered straight after the banner's <section>, and only on the homepage,
 * by the block adapter (components/blocks/Hero.tsx). The head's decision
 * (./intro.ts) has already written `play` by then; this is the runtime from
 * ./introCore.ts in "boot" mode, which finds the hero whole — this script is
 * the node after it — and starts the sequence at once, long before React
 * hydrates. <HeroIntro> adopts it on hydration, as it did when the runtime
 * sat in <head>.
 *
 * WHY HERE AND NOT IN <head>. The runtime is about 10 KB. In the root
 * layout's <head> it went out on every page of the site to run on one, could
 * not be cached, and travelled twice — in the HTML and again as a prop in the
 * server payload. And from <head> it had to watch the whole document being
 * parsed (a MutationObserver over every node of an 850 KB page) to learn when
 * the hero had arrived. Here it is in the homepage's HTML once: a client
 * component sends the server payload only its name and the logo, and the
 * string itself is already in the browser's bundle, which <HeroIntro> loads
 * for the same runtime.
 *
 * ONLY ON THE SERVER AND WHILE HYDRATING. React never runs a script it
 * creates in the browser, and warns about one. So the server's render, and
 * the hydration that matches it, carry the script; React re-renders without
 * it straight after (the snapshot below turns `false`), and it is never
 * created on a client-side navigation back to the homepage — where <HeroIntro>
 * plays the short entrance anyway. Removing an inline script that has already
 * run changes nothing.
 *
 * The text can differ between the server's build and the browser's (each
 * minifies the function its own way); it has already run, so React is told
 * the difference is expected rather than patching it.
 */
const subscribeToNothing = () => () => {};

export function HeroIntroScript() {
  const { logo } = useSiteChrome();
  const hydrating = useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true,
  );
  if (!hydrating) return null;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: introScript(introConfig(logo)) }} />;
}
