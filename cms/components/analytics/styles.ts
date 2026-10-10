/**
 * ==========================================================================
 * Analytics styles — the chart layer on top of 4B's admin look (4C)
 * ==========================================================================
 *
 * Plain CSS in a string, injected once with a <style> tag by the view
 * (the same pattern as cms/components/checkin/styles.ts): files under cms/
 * have no CSS pipeline of their own, and app/(payload)/custom.scss belongs
 * to 4B. The page is built from 4B's primitives (`mp-card`, `mp-kpi`,
 * `mp-chip`, `mp-eyebrow`, `mp-empty`, `mp-actions__btn`, the `--mp-*`
 * tokens); everything here is prefixed `mp-an-` and only adds what charts
 * need, so the analytics page and the dashboard read as one product.
 *
 * SERIES COLOURS. Two slots, chosen from the brand palette and checked with
 * the dataviz validator for colour-blind separation on each admin surface:
 *   light (#fcfaf6 / card #fff): 1 = Deep Lilac #9059a4, 2 = sage ink #4b7a3c
 *   dark  (card #1b212b):        1 = #b07fc3,          2 = #6fa058
 * Terracotta stays reserved for "needs attention" (4B's warning scale), so
 * a chart never borrows the alarm colour.
 *
 * Phone first: one column under 760 px, the filter row wraps, tables
 * scroll inside their card rather than the page.
 */
export const ANALYTICS_CSS = `
:root { --mp-an-1: #9059a4; --mp-an-2: #4b7a3c; --mp-an-1-wash: rgba(144, 89, 164, 0.1); --mp-an-track: var(--theme-elevation-100); }
html[data-theme="dark"] { --mp-an-1: #b07fc3; --mp-an-2: #6fa058; --mp-an-1-wash: rgba(176, 127, 195, 0.12); --mp-an-track: var(--theme-elevation-150); }

.mp-an { display: grid; gap: calc(var(--base) * 1.1); padding-block: calc(var(--base) * 0.6) calc(var(--base) * 2.5); }
.mp-an-sr { position: absolute !important; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* Header */
.mp-an-hero { display: grid; gap: 10px; }
.mp-an-hero h1 { margin: 0; font-size: 30px; line-height: 1.15; font-weight: 600; letter-spacing: -0.02em; }
.mp-an-hero p.mp-an-hero__sub { margin: 0; font-size: 14px; color: var(--theme-elevation-600); max-width: 72ch; line-height: 1.5; }

/* Filter row — one row, above everything it scopes */
.mp-an-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; padding: 10px; background: var(--mp-card-bg); border: 1px solid var(--theme-elevation-100); border-radius: var(--style-radius-l); box-shadow: var(--mp-shadow); position: relative; }
.mp-an-presets { display: inline-flex; gap: 4px; padding: 3px; border-radius: 999px; background: var(--theme-elevation-50); border: 1px solid var(--theme-elevation-100); }
.mp-an-preset { display: inline-flex; align-items: center; min-height: 34px; padding: 0 14px; border-radius: 999px; font-size: 12.5px; font-weight: 600; color: var(--theme-elevation-700); text-decoration: none; white-space: nowrap; }
.mp-an-preset:hover { color: var(--mp-lilac-ink); background: var(--mp-lilac-mist); }
.mp-an-preset[aria-current="true"] { background: var(--mp-lilac); color: #fff; box-shadow: var(--mp-shadow); }
html[data-theme="dark"] .mp-an-preset[aria-current="true"] { color: #1f1426; }
.mp-an-custom { position: relative; }
.mp-an-custom > summary { list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--theme-elevation-150); font-size: 12.5px; font-weight: 600; color: var(--theme-elevation-800); background: var(--mp-card-bg); }
.mp-an-custom > summary::-webkit-details-marker { display: none; }
.mp-an-custom > summary svg { color: var(--mp-lilac); }
.mp-an-custom > summary:hover, .mp-an-custom[open] > summary { border-color: var(--mp-lilac); }
.mp-an-custom[data-active="true"] > summary { border-color: var(--mp-lilac); background: var(--mp-lilac-soft); color: var(--mp-lilac-ink); }
.mp-an-custom__panel { position: absolute; z-index: 20; top: calc(100% + 8px); left: 0; width: min(380px, calc(100vw - 32px)); background: var(--mp-card-bg); border: 1px solid var(--theme-elevation-150); border-radius: var(--style-radius-l); box-shadow: var(--mp-shadow-lg); padding: 16px; display: grid; gap: 12px; }
.mp-an-custom__panel .mp-an-custom__dates { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mp-an-custom__panel label { display: grid; gap: 4px; font-size: 12px; font-weight: 600; color: var(--theme-elevation-700); }
.mp-an-custom__panel input[type="date"] { min-height: 40px; padding: 0 10px; border: 1px solid var(--theme-elevation-200); border-radius: var(--style-radius-m); background: var(--theme-input-bg); color: var(--theme-text); font: inherit; font-size: 13px; }
.mp-an-custom__panel input[type="date"]:focus { outline: none; border-color: var(--mp-lilac); box-shadow: 0 0 0 3px var(--mp-lilac-soft); }
.mp-an-custom__panel p { margin: 0; font-size: 12px; color: var(--theme-elevation-500); line-height: 1.45; }
.mp-an-custom__shortcuts { display: flex; flex-wrap: wrap; gap: 6px; }
.mp-an-custom__shortcuts a { font-size: 12px; font-weight: 600; color: var(--mp-lilac-ink); text-decoration: none; padding: 4px 10px; border-radius: 999px; background: var(--mp-lilac-mist); }
.mp-an-custom__shortcuts a:hover { background: var(--mp-lilac-soft); }
.mp-an-filters__range { font-size: 13px; color: var(--theme-elevation-600); }
.mp-an-filters__range strong { color: var(--theme-elevation-800); font-weight: 600; }
.mp-an-filters__end { margin-left: auto; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
button.mp-actions__btn, a.mp-actions__btn { font: inherit; font-size: 12.5px; cursor: pointer; text-decoration: none; }
.mp-actions__btn { min-height: 36px; }

/* Sections */
.mp-an-section { display: grid; gap: 12px; }
.mp-an-section__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px; margin-top: 6px; }
.mp-an-section__head h2 { margin: 0; font-size: 19px; font-weight: 600; letter-spacing: -0.01em; }
.mp-an-section__head p { margin: 0; font-size: 12.5px; color: var(--theme-elevation-500); }
.mp-an-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 1100px) { .mp-an-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.mp-an-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
.mp-an-grid--wide { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); }
@media (max-width: 1000px) { .mp-an-grid, .mp-an-grid--wide { grid-template-columns: minmax(0, 1fr); } }
.mp-an-col { display: grid; gap: 14px; min-width: 0; }

/* Cards and tiles */
.mp-an-card { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; }
.mp-an-card > * { min-width: 0; }
.mp-an-card .mp-card__head { align-items: flex-start; }
.mp-an-card__titles { display: grid; gap: 3px; min-width: 0; }
.mp-an-card__sub { margin: 0; font-size: 12px; color: var(--theme-elevation-500); line-height: 1.45; }
.mp-an-card__total { font-size: 13px; color: var(--theme-elevation-600); margin: -4px 0 8px; }
.mp-an-card__total strong { font-size: 22px; color: var(--theme-elevation-800); font-weight: 600; letter-spacing: -0.02em; margin-right: 6px; }
.mp-an-kpi-value { font-variant-numeric: normal; }
.mp-an-kpi-icon { vertical-align: -2px; margin-right: 6px; color: var(--mp-lilac); }
.mp-an-delta { font-size: 12px; font-weight: 600; display: inline-flex; align-items: baseline; gap: 4px; flex-wrap: wrap; }
.mp-an-delta--good { color: var(--theme-success-600); }
.mp-an-delta--bad { color: var(--theme-warning-600); }
.mp-an-delta--flat { color: var(--theme-elevation-500); font-weight: 500; }
.mp-an-delta__vs { font-weight: 500; color: var(--theme-elevation-500); }
html[data-theme="dark"] .mp-an-delta--good { color: var(--theme-success-750); }
html[data-theme="dark"] .mp-an-delta--bad { color: var(--theme-warning-750); }
.mp-an-empty { padding: 22px 8px; }
.mp-an-empty p { max-width: 56ch; margin-inline: auto; }
.mp-an-note { margin: 0 0 12px; display: flex; gap: 8px; align-items: flex-start; font-size: 12.5px; line-height: 1.45; padding: 9px 12px; border-radius: var(--style-radius-m); background: var(--theme-elevation-50); color: var(--theme-elevation-700); }
.mp-an-note svg { flex-shrink: 0; margin-top: 2px; }
.mp-an-note--warn { background: var(--theme-warning-50); color: var(--theme-warning-700); }
.mp-an-note--info { background: var(--mp-lilac-mist); color: var(--mp-lilac-ink); }
html[data-theme="dark"] .mp-an-note--warn { color: var(--theme-warning-750); }
.mp-an-welcome { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 14px; align-items: start; }
.mp-an-welcome__icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--mp-lilac-soft); color: var(--mp-lilac); }
.mp-an-welcome h3 { margin: 0 0 4px; font-size: 15px; font-weight: 600; }
.mp-an-welcome p { margin: 0; font-size: 13px; color: var(--theme-elevation-600); line-height: 1.55; max-width: 76ch; }
.mp-an-welcome ul { margin: 8px 0 0; padding-left: 18px; font-size: 13px; color: var(--theme-elevation-600); line-height: 1.6; }

/* Time chart */
.mp-an-chart { margin: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; min-width: 0; }
.mp-an-chart__plot { position: relative; min-width: 0; border-radius: var(--style-radius-m); outline-offset: 4px; touch-action: pan-y; }
.mp-an-chart__plot:focus-visible { outline: 2px solid var(--mp-lilac); }
.mp-an-chart svg { display: block; overflow: visible; }
line.mp-an-gridline { stroke: var(--theme-elevation-100); stroke-width: 1; shape-rendering: crispEdges; }
line.mp-an-base { stroke: var(--theme-elevation-250); stroke-width: 1; shape-rendering: crispEdges; }
text.mp-an-tick { fill: var(--theme-elevation-500); font-size: 11px; font-family: var(--font-body); font-variant-numeric: tabular-nums; }
path.mp-an-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
path.mp-an-area { stroke: none; }
.mp-an-stroke--1 { stroke: var(--mp-an-1); } .mp-an-stroke--2 { stroke: var(--mp-an-2); }
.mp-an-fill--1 { fill: var(--mp-an-1-wash); } .mp-an-fill--2 { fill: transparent; }
.mp-an-fill-solid--1 { fill: var(--mp-an-1); } .mp-an-fill-solid--2 { fill: var(--mp-an-2); }
.mp-an-fill-bg--1 { background: var(--mp-an-1); } .mp-an-fill-bg--2 { background: var(--mp-an-2); }
circle.mp-an-dot { stroke: var(--mp-card-bg); stroke-width: 2; }
line.mp-an-cross { stroke: var(--theme-elevation-300); stroke-width: 1; shape-rendering: crispEdges; }
path.mp-an-col { transition: opacity 120ms ease; }
path.mp-an-col.is-dim { opacity: 0.45; }
.mp-an-tip { position: absolute; top: 4px; pointer-events: none; min-width: 168px; padding: 10px 12px; border-radius: 10px; background: var(--mp-card-bg); border: 1px solid var(--theme-elevation-150); box-shadow: var(--mp-shadow-lg); display: grid; gap: 5px; z-index: 5; }
.mp-an-tip__day { font-size: 11.5px; font-weight: 600; color: var(--theme-elevation-500); }
.mp-an-tip__row { display: grid; grid-template-columns: 14px auto 1fr; gap: 8px; align-items: center; font-size: 12.5px; white-space: nowrap; }
.mp-an-tip__row strong { font-size: 14px; color: var(--theme-elevation-900); font-variant-numeric: tabular-nums; }
.mp-an-tip__row span:last-child { color: var(--theme-elevation-600); }
.mp-an-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12.5px; color: var(--theme-elevation-700); font-weight: 500; }
.mp-an-legend li { display: inline-flex; align-items: center; gap: 7px; }
.mp-an-key { display: inline-block; flex-shrink: 0; }
.mp-an-key--line { width: 14px; height: 3px; border-radius: 2px; }
.mp-an-key--box { width: 10px; height: 10px; border-radius: 3px; }
.mp-an-key--none { width: 14px; height: 3px; }
.mp-an-key--1 { background: var(--mp-an-1); } .mp-an-key--2 { background: var(--mp-an-2); }

/* Ranked bars */
.mp-an-bars { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.mp-an-bars__row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 12px; padding: 7px 6px; margin-inline: -6px; border-radius: 8px; text-decoration: none; color: inherit; }
a.mp-an-bars__row:hover { background: var(--mp-lilac-mist); }
a.mp-an-bars__row:hover .mp-an-bars__label { color: var(--mp-lilac-ink); }
.mp-an-bars__text { display: grid; min-width: 0; }
.mp-an-bars__label { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-an-bars__secondary { font-size: 11.5px; color: var(--theme-elevation-500); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-an-bars__secondary.mono, .mp-an-mono { font-family: var(--font-mono); }
.mp-an-bars__value { display: flex; gap: 8px; align-items: baseline; justify-content: flex-end; font-size: 12px; color: var(--theme-elevation-500); font-variant-numeric: tabular-nums; white-space: nowrap; }
.mp-an-bars__value strong { font-size: 13px; color: var(--theme-elevation-800); }
.mp-an-bars__value span { min-width: 34px; text-align: right; }
.mp-an-bars__track { grid-column: 1 / -1; height: 6px; border-radius: 3px; background: var(--mp-an-track); overflow: hidden; }
.mp-an-bars__track > span { display: block; height: 100%; border-radius: 0 3px 3px 0; background: var(--mp-an-1); }

/* Split bar */
.mp-an-split { display: grid; gap: 10px; }
.mp-an-split__bar { display: flex; gap: 2px; height: 12px; border-radius: 6px; overflow: hidden; background: var(--mp-an-track); }
.mp-an-split__bar > span { display: block; min-width: 3px; }
.mp-an-split__none { flex: 1; }
.mp-an-legend--split { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.mp-an-legend--split li { display: grid; grid-template-columns: auto 1fr auto auto; gap: 8px; align-items: center; }
.mp-an-legend--split strong { font-variant-numeric: tabular-nums; color: var(--theme-elevation-800); }
.mp-an-legend__pct { color: var(--theme-elevation-500); font-size: 12px; min-width: 34px; text-align: right; }

/* Funnel */
.mp-an-funnel-wrap { display: grid; gap: 12px; }
.mp-an-funnel-wrap .mp-eyebrow { margin-bottom: 6px; }
.mp-an-funnel { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.mp-an-funnel li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 5px 12px; align-items: baseline; }
.mp-an-funnel__label { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; min-width: 0; }
.mp-an-funnel__n { width: 20px; height: 20px; flex-shrink: 0; border-radius: 50%; display: inline-grid; place-items: center; font-size: 11px; font-weight: 700; background: var(--mp-lilac-soft); color: var(--mp-lilac-ink); }
.mp-an-funnel__value { font-size: 12px; color: var(--theme-elevation-500); text-align: right; font-variant-numeric: tabular-nums; display: grid; justify-items: end; }
.mp-an-funnel__value strong { font-size: 14px; color: var(--theme-elevation-800); }
.mp-an-funnel__count { white-space: nowrap; }
.mp-an-funnel__pct { font-size: 11.5px; }
.mp-an-funnel__track { height: 10px; border-radius: 5px; }
.mp-an-funnel__track > span { border-radius: 0 5px 5px 0; }
.mp-an-funnel__bridge { margin: 0; display: flex; gap: 8px; align-items: flex-start; font-size: 12.5px; line-height: 1.45; color: var(--theme-elevation-600); padding: 9px 12px; border-radius: var(--style-radius-m); background: var(--mp-lilac-mist); }
.mp-an-funnel__bridge svg { color: var(--mp-lilac); transform: rotate(90deg); margin-top: 2px; flex-shrink: 0; }

/* Session fill */
.mp-an-fill { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.mp-an-fill a { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; padding: 9px 10px; border: 1px solid var(--theme-elevation-100); border-radius: var(--style-radius-m); text-decoration: none; color: inherit; }
.mp-an-fill a:hover { border-color: var(--mp-lilac); background: var(--mp-lilac-mist); }
.mp-an-fill__title { font-size: 13px; font-weight: 600; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; min-width: 0; }
.mp-an-fill__when { font-size: 11.5px; color: var(--theme-elevation-500); grid-column: 1; }
.mp-an-fill__seats { grid-row: 1 / span 2; grid-column: 2; display: grid; gap: 5px; justify-items: end; font-size: 12px; color: var(--theme-elevation-600); font-variant-numeric: tabular-nums; }
.mp-an-fill__seats strong { color: var(--theme-elevation-800); }
.mp-an-fill__bar { width: 110px; height: 6px; border-radius: 3px; background: var(--mp-an-track); overflow: hidden; display: flex; gap: 2px; }
.mp-an-fill__bar > span { display: block; height: 100%; }
.mp-an-fill__bar > .is-sold { background: var(--mp-an-1); }
.mp-an-fill__bar > .is-held { background: var(--mp-lilac-soft); }
html[data-theme="dark"] .mp-an-fill__bar > .is-held { background: var(--theme-elevation-300); }
@media (max-width: 520px) { .mp-an-fill__bar { width: 72px; } }

/* Small stat rows */
.mp-an-stats { list-style: none; margin: 0; padding: 0; display: grid; }
.mp-an-stats li + li { border-top: 1px solid var(--theme-elevation-100); }
.mp-an-stats__row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 9px 2px; text-decoration: none; color: inherit; }
a.mp-an-stats__row:hover .mp-an-stats__label { color: var(--mp-lilac-ink); }
.mp-an-stats__label { font-size: 13px; font-weight: 500; display: grid; grid-template-columns: auto 1fr; column-gap: 8px; align-items: baseline; }
.mp-an-stats__label > .mp-an-dot { align-self: center; }
.mp-an-stats__hint { grid-column: 1 / -1; font-size: 11.5px; color: var(--theme-elevation-500); font-weight: 400; }
.mp-an-stats__label:not(:has(.mp-an-dot)) { grid-template-columns: 1fr; }
.mp-an-stats__value { font-size: 14px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.mp-an-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.mp-an-dot--ok { background: var(--theme-success-500); } .mp-an-dot--warn { background: var(--theme-warning-400); } .mp-an-dot--bad { background: var(--theme-error-400); }
.mp-an-codes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }

/* VAT tile */
.mp-an-vat { background: linear-gradient(180deg, var(--mp-lilac-mist), var(--mp-card-bg) 140px); }
.mp-an-vat__big { margin: 0 0 12px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.mp-an-vat__big > div { padding: 12px; border-radius: var(--style-radius-m); background: var(--mp-card-bg); border: 1px solid var(--theme-elevation-100); min-width: 0; }
.mp-an-vat__big dt { font-size: 11.5px; font-weight: 600; color: var(--theme-elevation-600); }
.mp-an-vat__big dd { margin: 4px 0 0; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; overflow-wrap: anywhere; }
.mp-an-vat__due { border-color: var(--mp-lilac) !important; box-shadow: inset 0 0 0 1px var(--mp-lilac); }
@media (max-width: 520px) { .mp-an-vat__big { grid-template-columns: minmax(0, 1fr); } }
.mp-an-vat__lines { margin: 0; display: grid; }
.mp-an-vat__lines > div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 2px; border-top: 1px solid var(--theme-elevation-100); font-size: 13px; }
.mp-an-vat__lines dt { color: var(--theme-elevation-600); }
.mp-an-vat__lines dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
.mp-an-vat__foot { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

/* Exports */
.mp-an-exports { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(168px, 1fr)); gap: 8px; }
.mp-an-export { height: 100%; display: grid; grid-template-rows: auto 1fr auto; gap: 10px; padding: 14px; border: 1px solid var(--theme-elevation-150); border-radius: var(--style-radius-m); text-decoration: none; color: inherit; }
.mp-an-export:hover { border-color: var(--mp-lilac); background: var(--mp-lilac-mist); }
.mp-an-export:focus-visible { outline: 2px solid var(--mp-lilac); outline-offset: 2px; }
.mp-an-export__icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--mp-lilac-soft); color: var(--mp-lilac); }
.mp-an-export__text { display: grid; gap: 3px; align-content: start; min-width: 0; }
.mp-an-export__text strong { font-size: 13.5px; }
.mp-an-export__text span { font-size: 11.5px; color: var(--theme-elevation-500); line-height: 1.4; }
.mp-an-export__go { font-size: 11.5px; font-weight: 700; color: var(--mp-lilac-ink); letter-spacing: 0.02em; }
@media (max-width: 520px) {
  .mp-an-exports { grid-template-columns: minmax(0, 1fr); }
  .mp-an-export__dl { display: none; }
  .mp-an-export { grid-template-rows: none; grid-template-columns: 36px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 10px 12px; }
}

/* Tables (show-as-table, VAT by month) */
.mp-an-details { margin-top: 10px; }
.mp-an-details > summary { cursor: pointer; font-size: 12.5px; font-weight: 600; color: var(--mp-lilac-ink); width: fit-content; padding: 4px 0; }
.mp-an-details > summary:focus-visible { outline: 2px solid var(--mp-lilac); outline-offset: 2px; border-radius: 4px; }
.mp-an-table-wrap { margin-top: 8px; max-height: 320px; overflow: auto; border: 1px solid var(--theme-elevation-100); border-radius: var(--style-radius-m); }
.mp-an-table { width: 100%; border-collapse: collapse; font-size: 12.5px; font-variant-numeric: tabular-nums; }
.mp-an-table th, .mp-an-table td { padding: 7px 10px; text-align: right; border-bottom: 1px solid var(--theme-elevation-100); white-space: nowrap; }
.mp-an-table th:first-child { text-align: left; }
.mp-an-table thead th { position: sticky; top: 0; background: var(--theme-elevation-50); font-weight: 600; color: var(--theme-elevation-600); font-size: 11.5px; }
.mp-an-table tbody th { font-weight: 500; }
.mp-an-table tr:last-child > * { border-bottom: 0; }

/* Phone */
@media (max-width: 760px) {
  .mp-an-hero h1 { font-size: 25px; }
  .mp-an-filters { padding: 8px; }
  .mp-an-presets { width: 100%; justify-content: space-between; }
  .mp-an-preset { flex: 1; justify-content: center; padding: 0 8px; }
  .mp-an-custom { flex: 1; }
  .mp-an-custom > summary { width: 100%; justify-content: center; }
  .mp-an-filters__end { margin-left: 0; width: 100%; }
  .mp-an-filters__range { width: 100%; text-align: center; }
  .mp-an-card.mp-card { padding: 16px 14px; }
}
@media (max-width: 520px) {
  .mp-an-kpis { gap: 8px; }
  .mp-an-kpis .mp-kpi { padding: 12px 13px; }
  .mp-an-kpis .mp-kpi__value { font-size: 22px; }
}
@media print {
  .mp-an-filters, .mp-an-exports, .mp-an-vat__foot { display: none; }
  .mp-an-details > *:not(summary) { display: block; }
}
@media (prefers-reduced-motion: reduce) { path.mp-an-col { transition: none; } }
@media (forced-colors: active) {
  .mp-an-bars__track > span, .mp-an-split__bar > span, .mp-an-fill__bar > .is-sold, .mp-an-key { background: CanvasText; forced-color-adjust: none; }
  path.mp-an-line { stroke: CanvasText; }
}
`;
