"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import maplibrePkg from "maplibre-gl/package.json";
import { useEffect, useRef, useState } from "react";

import { INK } from "@/components/sections/hero/composition";
import { resolveIcon } from "@/components/sections/hero/doodles";
import { brandMapStyle, MAP_INK, METRO_FILTER, METRO_ICON } from "@/components/sections/map/brandMapStyle";
import { cn } from "@/lib/utils";

type MapLibre = typeof import("maplibre-gl");

/** Where scripts/vendor-maplibre.mjs puts the browser build — see the note there. */
const VENDOR = `/vendor/maplibre-gl/${maplibrePkg.version}`;

/** Close enough to read the turnings off the main road, wide enough to see the district. */
const ZOOM = 14.4;
/** A phone-width frame shows a third of the ground; step back so the district still reads. */
const ZOOM_NARROW = 13.8;
/** How far the map will look for "the nearest Metro", and how far out it will zoom to show it. */
const METRO_REACH_M = 2500;
const ZOOM_FLOOR = 12.6;

let loading: Promise<MapLibre> | null = null;

/**
 * The library and its stylesheet, once per page however many maps ask.
 *
 * A runtime import of the public copy, NOT a bundled one: see
 * scripts/vendor-maplibre.mjs for why the bundler cannot have it.
 */
function loadMapLibre(): Promise<MapLibre> {
  if (!loading) {
    if (!document.querySelector(`link[data-maplibre]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${VENDOR}/maplibre-gl.css`;
      link.dataset.maplibre = "";
      document.head.appendChild(link);
    }
    const url = `${VENDOR}/maplibre-gl.mjs`;
    loading = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url) as Promise<MapLibre>;
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

/**
 * The pin: a Charcoal name tag over the terracotta bean from the brand's own
 * icon set, standing on a Charcoal point at the exact spot. HTML rather than
 * a map symbol, so the tag is set in the site's type.
 *
 * THE TAG IS THE DARKEST THING ON THE MAP, ON PURPOSE. It was a White Rock
 * pill, which on a White Rock map was a cream shape on cream — the one thing
 * a visitor most needs to find was the easiest to miss. Charcoal with White
 * Rock type is 10.6:1 and nothing else on the map is that dark, so the eye
 * lands there first. Charcoal Slate (#2D3748) by the brand token itself,
 * not `bg-text`, so it cannot drift if the text colour ever does. It wears the frame's own Soft Lavender offset and a
 * couple of degrees of tilt, so it reads as a sticker from the same print
 * rather than a tooltip, and a small caret ties it to the bean under it.
 *
 * Built by hand rather than rendered by React, because MapLibre moves the
 * element into its own container — a React-owned node moved out from under
 * React fails on unmount. MapLibre also positions the OUTER element with a
 * transform, so anything that moves (see `dropIn`) moves the inner one.
 */
function pinElement(name: string): { root: HTMLElement; body: HTMLElement } {
  const root = document.createElement("div");
  root.className = "pointer-events-none";
  root.setAttribute("aria-hidden", "true");

  const body = document.createElement("div");
  body.className = "flex flex-col items-center";
  root.appendChild(body);

  const tag = document.createElement("div");
  tag.className =
    "relative -rotate-2 rounded-xl bg-[var(--color-brand-charcoal)] px-4 pb-2 pt-1.5 text-center shadow-[4px_4px_0_0_var(--color-brand-lavender)] md:px-5 md:pb-2.5 md:pt-2";

  const eyebrow = document.createElement("span");
  eyebrow.className = "block text-[0.5625rem] font-semibold uppercase tracking-[0.24em] text-lavender md:text-[0.625rem]";
  eyebrow.textContent = "Maison Palettia";
  tag.appendChild(eyebrow);

  const title = document.createElement("span");
  title.className =
    "mt-0.5 block whitespace-nowrap text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-cream md:text-[0.9375rem]";
  title.textContent = name;
  tag.appendChild(title);

  const caret = document.createElement("span");
  caret.className = "absolute -bottom-1.5 left-1/2 block size-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-[var(--color-brand-charcoal)]";
  tag.appendChild(caret);
  body.appendChild(tag);

  const icon = resolveIcon("bean", INK.terracotta);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${icon.w} ${icon.h}`);
  svg.setAttribute("class", "mt-2 w-14 -rotate-[8deg] md:w-16");
  // A White Rock outline round the bean, then the shadow: the big roads are
  // terracotta too, and without the outline the pin sinks into the road it
  // stands beside.
  svg.style.filter =
    [1, -1].flatMap((x) => [1, -1].map((y) => `drop-shadow(${x * 1.5}px ${y * 1.5}px 0 ${INK.whiteRock})`)).join(" ") +
    " drop-shadow(0 4px 6px rgba(45,55,72,0.3))";
  for (const part of icon.parts) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", part.d);
    path.setAttribute("fill", part.fill);
    svg.appendChild(path);
  }
  body.appendChild(svg);

  const point = document.createElement("span");
  point.className = "mt-1 block size-3 rounded-full border-2 border-cream bg-[var(--color-brand-charcoal)]";
  body.appendChild(point);

  return { root, body };
}

/**
 * The Metro badge: a Deep Lilac disc with a White Rock "M", ringed in White
 * Rock so it lifts off the terracotta roads it usually sits on. Drawn on a
 * canvas at twice its size for sharp edges, in the site's own type.
 */
function metroBadge(): ImageData {
  const size = 44;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = INK.whiteRock;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK.lilac;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK.whiteRock;
  ctx.font = `700 22px ${getComputedStyle(document.body).fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("M", size / 2, size / 2 + 1);
  return ctx.getImageData(0, 0, size, size);
}

/**
 * The zoom that keeps the nearest Metro station in frame, or `zoom` if it
 * already is (or there is none within reach).
 *
 * The venue stays dead centre — it is the subject — and the map steps back
 * only as far as it must for the station's badge and name to fit inside the
 * frame. On /locations' full-width frame both nearby stations already show;
 * on the homepage card, which is a third of the size, neither did.
 *
 * Read from the tiles already drawn, so it costs no request and follows
 * whatever OpenStreetMap currently calls the station.
 */
function zoomToShowMetro(map: MapLibreMap, maplibre: MapLibre, venue: [number, number], zoom: number): number {
  const here = new maplibre.LngLat(...venue);
  let nearest: [number, number] | null = null;
  let best = METRO_REACH_M;
  for (const feature of map.querySourceFeatures("openmaptiles", { sourceLayer: "poi", filter: METRO_FILTER })) {
    if (feature.geometry.type !== "Point") continue;
    const [x, y] = feature.geometry.coordinates;
    const metres = here.distanceTo(new maplibre.LngLat(x, y));
    if (metres < best) {
      best = metres;
      nearest = [x, y];
    }
  }
  if (!nearest) return zoom;

  const centre = map.project(venue);
  const station = map.project(nearest);
  const dx = Math.abs(station.x - centre.x);
  const dy = Math.abs(station.y - centre.y);
  const { width, height } = map.getContainer().getBoundingClientRect();
  // Room for the badge and the name written to its right, and for the
  // attribution line along the foot.
  const roomX = width / 2 - (station.x > centre.x ? 130 : 40);
  const roomY = height / 2 - 44;
  const scale = Math.min(dx ? roomX / dx : Infinity, dy ? roomY / dy : Infinity);
  const fit = map.getZoom() + Math.log2(scale);
  return Math.max(ZOOM_FLOOR, Math.min(zoom, fit));
}

/** The pin lands once the map has drawn: a short drop and a settle, not a bounce. */
function dropIn(body: HTMLElement) {
  body.animate(
    [
      { transform: "translateY(-18px)", opacity: 0 },
      { transform: "translateY(2px)", opacity: 1, offset: 0.7 },
      { transform: "translateY(0)", opacity: 1 },
    ],
    { duration: 650, delay: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" },
  );
}

export interface BrandMapProps {
  lat: number;
  lng: number;
  /** The centre's name, printed on the pin's tag. */
  name: string;
  /** The iframe's title, if it comes to the fallback. */
  title: string;
  /**
   * The Google embed, for the rare browser that cannot draw this one (no
   * WebGL, or the tile host is down). Better a plain map than an empty frame.
   */
  fallbackSrc: string;
  /**
   * False where the map is a picture under a link (the homepage card): no
   * pan, no zoom, no controls, and nothing to catch a click before the link.
   */
  interactive?: boolean;
  /**
   * Where a click on the map goes — the venue's Google Maps page. Omitted,
   * Google is pointed at the pin's coordinates.
   */
  mapsHref?: string;
  className?: string;
}

/**
 * A map made into a link to Google Maps, for the maps whose clicks we cannot
 * read: Google's own embed (the fallback) swallows every click inside its
 * frame. So the frame is made inert and this anchor covers it — the client's
 * ask is that clicking any map opens the venue's Google Maps page. The embed's
 * own pan and zoom are what it costs.
 *
 * A sibling over the frame rather than a wrapper round it: an anchor holding
 * an iframe is interactive content nested in interactive content. Its name is
 * the sr-only line, because the thing it covers is a picture of a map.
 */
export function MapClickThrough({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="sr-only">{label}: open in Google Maps (opens in a new tab)</span>
    </a>
  );
}

/**
 * The venue on a map drawn in the Maison's palette — see brandMapStyle.ts.
 *
 * Fills its parent (`absolute inset-0`); the caller owns the frame and its
 * shape, exactly as it did for the iframe this replaces. Nothing is fetched
 * until the frame is within a screen of the viewport, so a visitor who never
 * scrolls this far never loads the library or a tile.
 *
 * Interactive maps use cooperative gestures — one finger scrolls the page, two
 * move the map; ctrl/⌘ + wheel zooms — so the map cannot trap a visitor
 * scrolling past it.
 */
export function BrandMap({ lat, lng, name, title, fallbackSrc, interactive = true, mapsHref, className }: BrandMapProps) {
  const href = mapsHref ?? `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`;
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = container.current;
    if (!node || failed) return;

    let map: MapLibreMap | null = null;
    let cancelled = false;
    let loaded = false;

    const start = async () => {
      try {
        const maplibre = await loadMapLibre();
        if (cancelled) return;

        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const zoom = node.clientWidth < 520 ? ZOOM_NARROW : ZOOM;
        map = new maplibre.Map({
          container: node,
          style: brandMapStyle(),
          center: [lng, lat],
          // Always start wide: the nearest-station check below reads the tiles
          // the first view loads, and a wider first view is what makes sure the
          // station's tile is among them.
          zoom: zoom - 1.2,
          interactive,
          cooperativeGestures: interactive,
          dragRotate: false,
          touchPitch: false,
          pitchWithRotate: false,
          // Always shown, never collapsed behind an icon: OpenStreetMap's licence
          // wants the credit on the map. globals.css keeps it to one small line.
          attributionControl: { compact: false },
        });
        if (interactive) map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

        // A click on the map opens the venue in Google Maps — the client's ask.
        // MapLibre fires `click` only when the pointer did not travel, so a
        // drag still pans and the zoom buttons (outside the canvas) still zoom.
        // A non-interactive map fires nothing; its caller's card is the link.
        map.on("click", () => {
          window.open(href, "_blank", "noopener,noreferrer");
        });

        const pin = pinElement(name);
        new maplibre.Marker({ element: pin.root, anchor: "bottom" }).setLngLat([lng, lat]).addTo(map);

        // MapLibre 6 asks a resolver for images the style names but does not
        // carry; the `styleimagemissing` event can no longer supply one.
        map.setMissingStyleImageResolver((id) => {
          if (id === METRO_ICON && map && !map.hasImage(METRO_ICON)) {
            map.addImage(METRO_ICON, metroBadge(), { pixelRatio: 2 });
          }
        });

        map.once("load", () => {
          if (cancelled || !map) return;
          loaded = true;
          // Once the first tiles are in, settle on the zoom that shows the
          // nearest station — over the 1.5s entrance the rest of the site
          // keeps to, or at once for a visitor who asked for no motion (the
          // map stays hidden until then, so they never see the wide view).
          map.once("idle", () => {
            if (cancelled || !map) return;
            const target = zoomToShowMetro(map, maplibre, [lng, lat], zoom);
            if (still) {
              map.jumpTo({ zoom: target });
            } else {
              map.easeTo({ zoom: target, duration: 1500 });
              dropIn(pin.body);
            }
            setReady(true);
          });
        });
        map.on("error", () => {
          // Before the first load, an error means the map will not draw (tile host
          // unreachable, no WebGL context). After it, a missing tile is just noise.
          if (!loaded && !cancelled) setFailed(true);
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void start();
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      map?.remove();
    };
  }, [lat, lng, name, interactive, failed, href]);

  if (failed) {
    return (
      <>
        <iframe
          title={title}
          src={fallbackSrc}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
          className={cn("pointer-events-none absolute inset-0 h-full w-full border-0", className)}
        />
        {/* The homepage card brings its own link; everywhere else, this one. */}
        {interactive ? <MapClickThrough href={href} label={title} /> : null}
      </>
    );
  }

  return (
    <div
      ref={container}
      /* A picture when it is one; a labelled region when it holds controls. */
      role={interactive ? "region" : "img"}
      aria-label={title}
      style={{ backgroundColor: MAP_INK.land }}
      className={cn(
        "brand-map absolute inset-0 h-full w-full transition-opacity duration-700",
        ready ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
