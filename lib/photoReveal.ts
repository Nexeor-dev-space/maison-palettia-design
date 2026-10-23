/**
 * ==========================================================================
 * The photograph fade-in — set up before the page paints
 * ==========================================================================
 *
 * Inlined in the site layout's <head> (as is the homepage intro's script),
 * so it is listening before the first <img> is even parsed. It never waits
 * for React: a photograph that loads while the page is still hydrating
 * fades in on time instead of sitting hidden until the JavaScript arrives.
 *
 *   1. It marks <html> `data-blur-ready`. Only then does globals.css hide a
 *      photograph that has not loaded — so with JavaScript off, or this
 *      script blocked, every picture simply shows as it always did, and the
 *      blur behind it is never all there is.
 *   2. One capturing `load` listener on the document hears every <img> that
 *      carries `data-blur` (components/ui/Image.tsx) — the first load and
 *      every client-side navigation after it. It waits for `decode()`, so
 *      the fade starts on a picture the browser can actually paint whole,
 *      then sets `data-loaded`, which starts the fade.
 *   3. A sweep on DOMContentLoaded and on `pageshow` (a page restored from
 *      the back/forward cache) catches anything already complete.
 *
 * A picture that fails to load is never marked, so its frame keeps the blur
 * rather than showing a broken image.
 */
export const PHOTO_REVEAL_SCRIPT = `(function(){var d=document;d.documentElement.setAttribute("data-blur-ready","");function m(i){if(i.hasAttribute("data-loaded"))return;var s=function(){i.setAttribute("data-loaded","")};if(i.decode)i.decode().then(s,s);else s()}d.addEventListener("load",function(e){var t=e.target;if(t&&t.nodeName==="IMG"&&t.hasAttribute("data-blur"))m(t)},true);function w(){var l=d.querySelectorAll("img[data-blur]:not([data-loaded])");for(var k=0;k<l.length;k++)if(l[k].complete&&l[k].naturalWidth)m(l[k])}d.addEventListener("DOMContentLoaded",w);addEventListener("pageshow",w)})();`;
