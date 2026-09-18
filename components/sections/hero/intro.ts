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
export const INTRO_SCRIPT = `(function(){if(location.pathname!=="/")return;var d=document.documentElement;try{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-intro","done");return}if("scrollRestoration" in history)history.scrollRestoration="manual";d.setAttribute("data-intro","play")}catch(e){d.setAttribute("data-intro","skip")}})();`;
