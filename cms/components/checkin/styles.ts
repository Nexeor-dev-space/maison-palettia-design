/**
 * ==========================================================================
 * Check-in styles — one scoped sheet for the desk and the attendee list
 * ==========================================================================
 *
 * Plain CSS in a string, injected with a <style> tag by the components that
 * need it: the admin has no CSS-module pipeline for files under cms/, and
 * `app/(payload)/custom.scss` belongs to Phase 4. Every selector is under
 * `mp-ci-` / `mp-att-` so nothing leaks into Payload's own UI. Colours are
 * Payload's theme variables, so the light and dark admin themes both work.
 *
 * Phone first: one column, thumb-sized buttons (≥ 44 px), a square camera;
 * from 900 px the scanner and the day's sessions sit side by side. The
 * attendee table turns into stacked cards below 640 px. Print shows only
 * the attendee list, with the action buttons removed.
 */
export const CHECKIN_CSS = `
.mp-ci { --mp-gap: calc(var(--base, 20px) * 0.75); display: grid; gap: var(--mp-gap); padding-block: var(--mp-gap) calc(var(--base, 20px) * 2); }
.mp-ci h1 { margin: 0; }
.mp-ci-sub { margin: 0; color: var(--theme-elevation-600); }
.mp-ci-grid { display: grid; gap: var(--mp-gap); grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 900px) { .mp-ci-grid { grid-template-columns: minmax(320px, 440px) minmax(0, 1fr); } }
.mp-ci-card { border: 1px solid var(--theme-elevation-150); border-radius: var(--style-radius-m, 6px); background: var(--theme-elevation-0); padding: var(--mp-gap); display: grid; gap: calc(var(--mp-gap) * 0.75); min-width: 0; }
.mp-ci-card h2, .mp-ci-card h3 { margin: 0; }
.mp-ci-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.mp-ci-btn { appearance: none; min-height: 44px; padding: 0 16px; border-radius: var(--style-radius-s, 4px); border: 1px solid var(--theme-elevation-250); background: var(--theme-elevation-50); color: var(--theme-text); font: inherit; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; text-decoration: none; }
.mp-ci-btn:hover:not(:disabled) { background: var(--theme-elevation-100); }
.mp-ci-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mp-ci-btn--primary { background: var(--theme-elevation-900); border-color: var(--theme-elevation-900); color: var(--theme-elevation-0); }
.mp-ci-btn--primary:hover:not(:disabled) { background: var(--theme-elevation-800); }
.mp-ci-btn--warn { background: var(--theme-warning-500); border-color: var(--theme-warning-500); color: #1a1200; }
.mp-ci-btn--small { min-height: 36px; padding: 0 12px; font-size: 0.9em; }
.mp-ci-camera { width: 100%; max-width: 440px; aspect-ratio: 1 / 1; border-radius: var(--style-radius-m, 6px); overflow: hidden; background: var(--theme-elevation-100); position: relative; }
.mp-ci-camera__placeholder { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; text-align: center; color: var(--theme-elevation-600); }
.mp-ci-manual { display: grid; gap: 6px; }
.mp-ci-manual label { font-weight: 600; }
.mp-ci-manual input { flex: 1 1 180px; min-width: 0; min-height: 48px; padding: 0 12px; font-size: 1.25em; letter-spacing: 0.06em; font-family: var(--font-mono, ui-monospace, monospace); text-transform: uppercase; border: 1px solid var(--theme-elevation-250); border-radius: var(--style-radius-s, 4px); background: var(--theme-input-bg, var(--theme-elevation-0)); color: var(--theme-text); }
.mp-ci-error { margin: 0; color: var(--theme-error-500); }
.mp-ci-verdict { border-radius: var(--style-radius-m, 6px); padding: var(--mp-gap); display: grid; gap: 6px; border: 2px solid; }
.mp-ci-verdict p { margin: 0; }
.mp-ci-verdict--ok { background: var(--theme-success-100); border-color: var(--theme-success-500); }
.mp-ci-verdict--warn { background: var(--theme-warning-100); border-color: var(--theme-warning-500); }
.mp-ci-verdict--stop { background: var(--theme-error-100); border-color: var(--theme-error-500); }
.mp-ci-verdict__headline { margin: 0; font-size: clamp(1.5rem, 5vw, 2.1rem); line-height: 1.15; }
.mp-ci-verdict--ok .mp-ci-verdict__headline { color: var(--theme-success-750, var(--theme-success-500)); }
.mp-ci-verdict--warn .mp-ci-verdict__headline { color: var(--theme-warning-750, var(--theme-text)); }
.mp-ci-verdict--stop .mp-ci-verdict__headline { color: var(--theme-error-750, var(--theme-error-500)); }
.mp-ci-verdict__holder { font-size: 1.3em; font-weight: 600; }
.mp-ci-verdict__seat { font-weight: 400; }
.mp-ci-verdict__meta { color: var(--theme-elevation-700); }
.mp-ci-verdict__code { font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.85em; color: var(--theme-elevation-600); }
.mp-ci-recent { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.mp-ci-recent li { display: grid; grid-template-columns: auto auto minmax(0, 1fr); gap: 8px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid var(--theme-elevation-100); }
.mp-ci-recent time { font-variant-numeric: tabular-nums; color: var(--theme-elevation-600); }
.mp-ci-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.mp-ci-dot--ok { background: var(--theme-success-500); } .mp-ci-dot--warn { background: var(--theme-warning-500); } .mp-ci-dot--stop { background: var(--theme-error-500); }
.mp-ci-sessions { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.mp-ci-session { border: 1px solid var(--theme-elevation-150); border-radius: var(--style-radius-s, 4px); padding: 10px 12px; display: grid; gap: 6px; }
.mp-ci-session[data-open="true"] { border-color: var(--theme-elevation-500); }
.mp-ci-session__top { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; justify-content: space-between; }
.mp-ci-session__time { font-variant-numeric: tabular-nums; font-weight: 700; }
.mp-ci-session__count { font-variant-numeric: tabular-nums; white-space: nowrap; }
.mp-ci-bar { height: 6px; border-radius: 3px; background: var(--theme-elevation-100); overflow: hidden; }
.mp-ci-bar > span { display: block; height: 100%; background: var(--theme-success-500); }
.mp-ci-pill { font-size: 0.8em; padding: 1px 8px; border-radius: 999px; background: var(--theme-elevation-100); color: var(--theme-elevation-700); }
.mp-att { display: grid; gap: 10px; min-width: 0; }
.mp-att table { width: 100%; border-collapse: collapse; font-size: 0.95em; }
.mp-att th, .mp-att td { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--theme-elevation-100); vertical-align: top; }
.mp-att th { font-weight: 600; color: var(--theme-elevation-700); white-space: nowrap; }
.mp-att td.mp-att__num { font-variant-numeric: tabular-nums; white-space: nowrap; }
.mp-att tr[data-status="checked_in"] td { background: color-mix(in srgb, var(--theme-success-100) 60%, transparent); }
.mp-att tr[data-status="void"] td, .mp-att tr[data-status="refunded"] td { color: var(--theme-elevation-500); text-decoration: line-through; }
.mp-att__muted { color: var(--theme-elevation-600); font-size: 0.9em; }
.mp-att__summary { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; }
@media (max-width: 640px) {
  .mp-att thead { display: none; }
  .mp-att table, .mp-att tbody, .mp-att tr, .mp-att td { display: block; width: 100%; }
  .mp-att tr { border: 1px solid var(--theme-elevation-150); border-radius: var(--style-radius-s, 4px); margin-bottom: 8px; padding: 4px 8px; }
  .mp-att td { border: 0; padding: 4px 0; }
  .mp-att td[data-label]::before { content: attr(data-label) ": "; font-weight: 600; color: var(--theme-elevation-600); }
}
@media print {
  body * { visibility: hidden !important; }
  .mp-att--printing, .mp-att--printing * { visibility: visible !important; }
  .mp-att--printing { position: absolute; inset: 0 auto auto 0; width: 100%; color: #000; background: #fff; }
  .mp-noprint { display: none !important; }
  .mp-att tr[data-status="checked_in"] td { background: none; }
}
`;
