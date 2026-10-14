import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";

/**
 * The Maison's map, drawn in its own palette.
 *
 * ==========================================================================
 * A PRINT, NOT A NAVIGATION APP
 * ==========================================================================
 *
 * Nobody drives to the studio by this map — "View location" hands them to
 * their own maps app for that. What this one is for is the glance: which part
 * of the city, which road it is off, what is near. So it is drawn like an
 * illustrated city print rather than a road atlas: flat colour with an ink
 * line round every shape — roads, blocks, buildings, parks, the shoreline —
 * no shops or restaurants (a map of a mall's neighbours would be a map of
 * other people's businesses), and only the labels that orient: districts,
 * the big roads, the water.
 *
 * THE INK LINE IS WHAT MAKES IT A DRAWING. The first version was flat fills
 * only, and in Al Quoz — warehouse lots, few parks, no water — that came out
 * as cream on cream: "too blank". The outlines are Charcoal at a fraction,
 * so they give every shape an edge without turning into a road atlas.
 *
 *   land ......... White Rock lifted toward paper
 *   blocks ....... White Rock itself, so each city block reads as a shape
 *   green ........ Light Sage, edged in a deeper sage
 *   water ........ Soft Lavender, edged in lilac
 *   buildings .... a warmer cream, each one outlined in ink
 *   big roads .... Warm Terracotta, cased in ink: the strokes the eye follows
 *   small roads .. paper white, cased in ink, as if cut out of the land
 *   type ......... Charcoal, sparing, spaced capitals for places
 *   metro ........ Deep Lilac badges with the station's name — the one kind
 *                  of point shown, because a lot of visitors arrive by it
 *
 * TILES: OpenFreeMap (openfreemap.org) — OpenStreetMap data in the
 * OpenMapTiles schema, free, no key, no account. If it ever needs an SLA,
 * MapTiler serves the same schema; change `TILES` and `GLYPHS` and every
 * layer below still applies.
 *
 * TYPE: the labels are drawn by the map in WebGL from glyph files, so they
 * cannot use Montserrat without hosting its glyphs; Noto Sans is what the
 * tile host serves and is close enough at label size. The pin's own tag is
 * HTML (see <BrandMap>) and is set in the site's type.
 */

const TILES = "https://tiles.openfreemap.org/planet";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

export const MAP_INK = {
  land: "#F7F0E3",
  block: "#EFE2CA",
  green: "#D1E7BE",
  greenEdge: "#8FB872",
  sand: "#F3E3C4",
  water: "#C9BCF5",
  waterEdge: "#9059A4",
  building: "#F4E7CF",
  roadMajor: "#E08A6A",
  roadMid: "#EDB49C",
  roadMinor: "#FFFDF8",
  rail: "#9059A4",
  ink: "#2D3748",
  text: "#2D3748",
  textSoft: "#4A5363",
  halo: "#F7F0E3",
  lilac: "#9059A4",
} as const;

/** English where the data has it — Dubai's base names are Arabic. */
const NAME: ExpressionSpecification = ["coalesce", ["get", "name:en"], ["get", "name_en"], ["get", "name"]];

const REGULAR = ["Noto Sans Regular"];
const BOLD = ["Noto Sans Bold"];
const ITALIC = ["Noto Sans Italic"];

/**
 * Road width by zoom, scaled per class. `edge` widens it for the ink casing
 * drawn underneath, so the casing shows as a line either side of the road.
 */
const width = (base: number, edge = 0): ExpressionSpecification => [
  "interpolate",
  ["exponential", 1.6],
  ["zoom"],
  10,
  base * 0.4 + edge * 0.5,
  14,
  base * 2 + edge,
  18,
  base * 9 + edge * 1.5,
];

const MAJOR = ["motorway", "trunk"];
const MID = ["primary", "secondary"];
const MINOR = ["tertiary", "minor", "service", "street", "street_limited"];

const SRC = { source: "openmaptiles" } as const;

/** The badge image's id; <BrandMap> draws it on demand. */
export const METRO_ICON = "maison-metro";
/** Metro stations in the OpenMapTiles points layer. Shared with <BrandMap>'s "nearest station" fit. */
export const METRO_FILTER: ExpressionSpecification = [
  "all",
  ["==", ["get", "class"], "railway"],
  ["==", ["get", "subclass"], "subway"],
];
const ROUND = { "line-cap": "round", "line-join": "round" } as const;

export function brandMapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: { openmaptiles: { type: "vector", url: TILES } },
    layers: [
      { id: "land", type: "background", paint: { "background-color": MAP_INK.land } },

      /* Blocks: every built-up lot in White Rock, so the streets between them
         read as paper-white cuts. Industrial is in — it is most of Al Quoz. */
      {
        id: "block",
        type: "fill",
        ...SRC,
        "source-layer": "landuse",
        filter: ["in", ["get", "class"], ["literal", ["residential", "commercial", "industrial", "retail", "school", "hospital"]]],
        paint: { "fill-color": MAP_INK.block },
      },
      {
        id: "sand",
        type: "fill",
        ...SRC,
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "sand"],
        paint: { "fill-color": MAP_INK.sand },
      },
      {
        id: "green",
        type: "fill",
        ...SRC,
        "source-layer": "landcover",
        filter: ["in", ["get", "class"], ["literal", ["grass", "wood", "farmland", "wetland"]]],
        paint: { "fill-color": MAP_INK.green },
      },
      {
        id: "park",
        type: "fill",
        ...SRC,
        "source-layer": "park",
        paint: { "fill-color": MAP_INK.green },
      },
      {
        id: "pitch",
        type: "fill",
        ...SRC,
        "source-layer": "landuse",
        filter: ["in", ["get", "class"], ["literal", ["pitch", "stadium", "cemetery"]]],
        paint: { "fill-color": MAP_INK.green },
      },
      {
        id: "green-edge",
        type: "line",
        ...SRC,
        "source-layer": "park",
        paint: { "line-color": MAP_INK.greenEdge, "line-width": 1, "line-opacity": 0.8 },
      },

      {
        id: "water",
        type: "fill",
        ...SRC,
        "source-layer": "water",
        paint: { "fill-color": MAP_INK.water },
      },
      {
        id: "water-edge",
        type: "line",
        ...SRC,
        "source-layer": "water",
        paint: { "line-color": MAP_INK.waterEdge, "line-width": 1.2, "line-opacity": 0.55 },
      },
      {
        id: "waterway",
        type: "line",
        ...SRC,
        "source-layer": "waterway",
        paint: { "line-color": MAP_INK.waterEdge, "line-width": 1.2, "line-opacity": 0.55 },
      },

      {
        id: "building",
        type: "fill",
        ...SRC,
        "source-layer": "building",
        minzoom: 13.5,
        paint: { "fill-color": MAP_INK.building },
      },
      {
        id: "building-edge",
        type: "line",
        ...SRC,
        "source-layer": "building",
        minzoom: 13.5,
        paint: {
          "line-color": MAP_INK.ink,
          "line-width": ["interpolate", ["linear"], ["zoom"], 13.5, 0.4, 17, 1],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 13.5, 0.15, 15, 0.35],
        },
      },

      /* Casings first, all of them, then the road fills over the top — so
         where two roads cross, the ink runs round the junction rather than
         across it. */
      {
        id: "road-minor-edge",
        type: "line",
        ...SRC,
        "source-layer": "transportation",
        minzoom: 12,
        filter: ["in", ["get", "class"], ["literal", MINOR]],
        layout: ROUND,
        paint: { "line-color": MAP_INK.ink, "line-opacity": 0.35, "line-width": width(0.9, 1.4) },
      },
      {
        id: "road-mid-edge",
        type: "line",
        ...SRC,
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", MID]],
        layout: ROUND,
        paint: { "line-color": MAP_INK.ink, "line-opacity": 0.55, "line-width": width(1.3, 1.8) },
      },
      {
        id: "road-major-edge",
        type: "line",
        ...SRC,
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", MAJOR]],
        layout: ROUND,
        paint: { "line-color": MAP_INK.ink, "line-opacity": 0.7, "line-width": width(1.9, 2.2) },
      },
      {
        id: "road-minor",
        type: "line",
        ...SRC,
        "source-layer": "transportation",
        minzoom: 12,
        filter: ["in", ["get", "class"], ["literal", MINOR]],
        layout: ROUND,
        paint: { "line-color": MAP_INK.roadMinor, "line-width": width(0.9) },
      },
      {
        id: "road-mid",
        type: "line",
        ...SRC,
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", MID]],
        layout: ROUND,
        paint: { "line-color": MAP_INK.roadMid, "line-width": width(1.3) },
      },
      {
        id: "road-major",
        type: "line",
        ...SRC,
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", MAJOR]],
        layout: ROUND,
        paint: { "line-color": MAP_INK.roadMajor, "line-width": width(1.9) },
      },
      {
        id: "rail",
        type: "line",
        ...SRC,
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["rail", "transit"]]],
        paint: { "line-color": MAP_INK.rail, "line-width": 1.6, "line-opacity": 0.8, "line-dasharray": [3, 2] },
      },

      {
        id: "water-name",
        type: "symbol",
        ...SRC,
        "source-layer": "water_name",
        layout: {
          "text-field": NAME,
          "text-font": ITALIC,
          "text-size": 13,
          "text-letter-spacing": 0.08,
        },
        paint: { "text-color": MAP_INK.lilac, "text-halo-color": MAP_INK.water, "text-halo-width": 1 },
      },
      {
        id: "road-name",
        type: "symbol",
        ...SRC,
        "source-layer": "transportation_name",
        minzoom: 13,
        filter: ["in", ["get", "class"], ["literal", [...MAJOR, ...MID]]],
        layout: {
          "symbol-placement": "line",
          "text-field": NAME,
          "text-font": REGULAR,
          "text-size": 11,
          "text-letter-spacing": 0.04,
        },
        paint: { "text-color": MAP_INK.textSoft, "text-halo-color": MAP_INK.halo, "text-halo-width": 1.6 },
      },
      {
        id: "place",
        type: "symbol",
        ...SRC,
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["suburb", "quarter", "neighbourhood", "town", "city"]]],
        layout: {
          "text-field": ["upcase", NAME],
          "text-font": BOLD,
          "text-size": ["match", ["get", "class"], ["city", "town"], 14, 11],
          "text-letter-spacing": 0.22,
          "text-max-width": 8,
        },
        paint: { "text-color": MAP_INK.text, "text-opacity": 0.8, "text-halo-color": MAP_INK.halo, "text-halo-width": 1.8 },
      },
      /*
        DUBAI METRO, AND NOTHING ELSE FROM THE POINTS LAYER. Many visitors come
        by Metro, and "which station" is the question the map can answer that
        the address cannot. The names come from the data, not from here:
        Dubai renames stations when a sponsorship changes (Equiti, Garmin), and
        OpenStreetMap follows within weeks — a hard-coded name would go stale.

        Last in the list so it wins any collision with a road or district
        name. The badge image is drawn by <BrandMap> (see `metroBadge`).
      */
      {
        id: "metro",
        type: "symbol",
        ...SRC,
        "source-layer": "poi",
        minzoom: 12,
        filter: METRO_FILTER,
        layout: {
          "icon-image": METRO_ICON,
          "icon-size": 1,
          "icon-allow-overlap": true,
          "text-field": [
            "format",
            ["upcase", NAME],
            { "text-font": ["literal", BOLD] },
            "\n",
            {},
            "METRO",
            { "text-font": ["literal", REGULAR], "font-scale": 0.8 },
          ],
          // The layer's own font, for the line break between the two runs —
          // without it MapLibre asks the tile host for its default (Open Sans),
          // which it does not serve.
          "text-font": REGULAR,
          "text-size": 11,
          "text-letter-spacing": 0.12,
          "text-anchor": "left",
          "text-justify": "left",
          "text-offset": [1.4, 0],
          "text-optional": true,
        },
        paint: { "text-color": MAP_INK.lilac, "text-halo-color": MAP_INK.halo, "text-halo-width": 2 },
      },
    ],
  };
}
