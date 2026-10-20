import { introConfig, introScript, type IntroLogoCuts } from "@/components/sections/hero/introCore";

/**
 * The homepage intro's opening decision, as an inline script for <head>.
 *
 * IT RUNS ON EVERY PAGE LOAD OF THE HOMEPAGE — a first visit, a return, a
 * refresh — before anything is painted, and marks <html> with `data-intro`:
 *
 *   play ... the intro will play. Only ever written here, so <HeroIntro> can
 *            tell a real page load, which plays the whole intro, from the
 *            homepage being shown again by a link inside the site, which gets
 *            the short entrance.
 *   done ... reduced motion: no intro, and the composed hero from the first
 *            paint rather than after hydration.
 *   skip ... something went wrong. A broken intro must never hold the page.
 *
 * It also turns the browser's scroll restoration off, so a load of the
 * homepage starts at the top, where the intro happens. <HeroIntro> keeps it
 * off for as long as the homepage is showing — the browser decides whether to
 * restore when reload is pressed, from the page being left, so it has to be
 * off already by then — and hands it back when the homepage unmounts.
 *
 * AND ON `play` IT NOW RUNS THE INTRO ITSELF, from the moment the hero has
 * been parsed: the foot's fit, the ring, the phase chain and the flight to the
 * header, so the entrance keeps its designed timing however late React
 * hydrates. <HeroIntro> adopts the running sequence instead of starting one.
 * The runtime and the reasons for it are in ./introCore.ts; this only hands
 * it the page's configuration — the ring and the header's two logo cuts,
 * which the layout already has from Site details.
 *
 * EVERY OTHER PAGE gets `data-loader="write"` instead (unless the reader has
 * asked for reduced motion): the same opening, played by <SiteLoader> from
 * the layout, on any refresh or first load of any page. A separate attribute
 * rather than `data-intro`, because every `data-intro` rule belongs to the
 * homepage's hero and its collage.
 *
 * In <head>, from the root layout, rather than inside the hero: there it runs
 * before the body is parsed, and the layout is never rendered again on the
 * client, so React never creates the script in the browser — which it warns
 * about, and where it would not run anyway. Everywhere but "/" it returns at
 * once.
 *
 * A plain module, not the "use client" <HeroIntro>: a string exported from a
 * client module reaches a server component as a client reference, not as its
 * value.
 */
export function introHeadScript(logo: IntroLogoCuts): string {
  return introScript(introConfig(logo));
}
