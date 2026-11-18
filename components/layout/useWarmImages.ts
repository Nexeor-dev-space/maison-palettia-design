"use client";

import { getImageProps } from "next/image";
import { useEffect } from "react";

/**
 * ==========================================================================
 * Fetch a menu's photographs before the menu is first opened
 * ==========================================================================
 *
 * WHY THE FIRST OPEN WAS BLURRY. A header panel mounts its contents on the
 * first open (`mounted` in useMenuDisclosure), so that is the moment its
 * <img> elements exist and start downloading — and every image request to
 * this host costs ~0.6–1s whatever its size (see `images` in next.config.ts).
 * Until it lands, the blur stand-in is what shows. Every later open is sharp
 * because the panel stays mounted and the files are cached.
 *
 * WHAT THIS DOES. Asks the browser for the SAME files ahead of time: the
 * srcset and sizes come from next/image's own `getImageProps`, with the same
 * `sizes` the menu passes, so a detached `new Image()` picks the same
 * candidate the real <img> will and the open is served from cache. Nothing
 * on the page changes; the panel's markup and behaviour are untouched.
 *
 * WHEN. After the page's `load` and then at idle, so it never competes with
 * the page's own pictures or its first paint. Only where the header menus are
 * shown at all (the bar's links are `hidden lg:flex`, so 1024px and up), and
 * not for a visitor who has asked to save data. Each URL is fetched once per
 * page session, however many menus or navigations ask for it.
 */

export const DESKTOP_MENUS = "(min-width: 1024px)";

const warmed = new Set<string>();
/* Held until they settle, so a request is never dropped with its object. */
const inFlight = new Set<HTMLImageElement>();

export function warmImage(src: string, sizes: string) {
  const key = `${src}|${sizes}`;
  if (warmed.has(key)) return;
  warmed.add(key);

  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  const img = new window.Image();
  img.decoding = "async";
  // sizes and srcset before src, so the browser chooses once.
  if (props.sizes) img.sizes = props.sizes;
  if (props.srcSet) img.srcset = props.srcSet;
  const done = () => inFlight.delete(img);
  img.onload = done;
  img.onerror = done;
  inFlight.add(img);
  img.src = props.src;
}

function shouldWarm() {
  if (!window.matchMedia(DESKTOP_MENUS).matches) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !connection?.saveData;
}

/**
 * Warms `images` (each with its `sizes`) once the page has loaded and gone
 * idle. `key` should change only when the list does — pass a string built from
 * the URLs so a fresh array on every render does not restart it.
 */
export function useWarmImages(images: { src?: string; sizes: string }[], key: string) {
  useEffect(() => {
    if (!key || !shouldWarm()) return;

    let idle = 0;
    let timer = 0;
    const run = () => {
      for (const { src, sizes } of images) if (src) warmImage(src, sizes);
    };
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run, { timeout: 3000 });
      else timer = window.setTimeout(run, 200);
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      window.removeEventListener("load", schedule);
      if (idle) window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
    };
    // `images` is described by `key`; see the note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
