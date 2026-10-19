#!/usr/bin/env node
/**
 * ==========================================================================
 * shoot.mjs — take admin screenshots with the guide's numbered callouts
 * ==========================================================================
 *
 *   DOCS_BOT_EMAIL=… DOCS_BOT_PASSWORD=… \
 *     node docs/admin-guide/scripts/shoot.mjs <shots.json> [--only name,name] [--base http://localhost:3200]
 *
 * Signs in to a running copy of the admin, and for each shot: opens the
 * page, runs a few optional actions (click, fill, press, hover, scroll),
 * draws lilac numbered circles on the elements you name — the same circles
 * the steps and the legend under the picture refer to as ((1)), ((2)) … —
 * takes the screenshot, and writes docs/admin-guide/images/<name>.webp.
 * It then prints the `screenshot` block to paste into the chapter file,
 * with the real width and height filled in.
 *
 * shots.json is a list of:
 *
 *   {
 *     "name": "08-sessions-list",              // file name, no extension
 *     "url": "/admin/collections/sessions",    // path on the base URL
 *     "viewport": { "width": 1440, "height": 900 },   // optional; "phone": true → 390×844
 *     "actions": [ { "click": "text=Actions" }, { "fill": ["#field-title", "Candle Making"] },
 *                  { "press": "Escape" }, { "hover": ".row-1" }, { "wait": 800 } ],
 *     "waitFor": ".collection-list",           // optional selector to wait for
 *     "clip": ".document-fields",              // optional: shoot just this element (else the viewport)
 *     "clipPad": 32,                           // optional: room around the clipped element for the circles
 *     "full": false,                           // optional: whole scrolling page
 *     "hide": [".some-banner"],                // optional: hidden before the shot
 *     "replace": [["Docs Bot", "Maya"]],       // optional: on-page text swaps (never saved)
 *     "callouts": [
 *       { "n": 1, "target": "button:has-text('Create new')", "place": "left", "label": "Add a session" },
 *       { "n": 2, "target": { "x": 640, "y": 220 }, "label": "The search box" }
 *     ],
 *     "width": 1200                            // optional output width (default 1200; phones 390)
 *   }
 *
 * `place` is where the circle sits relative to the element: left (default),
 * right, top, bottom, center or top-left; `ring: true` also outlines it.
 * Extra actions: { "type": "words" } types at the cursor, { "eval": "js" }
 * runs a line of script in the page (e.g. to scroll a panel; a promise is
 * awaited, so it can also wait for something to finish loading), and
 * { "resize": { "width": 1440, "height": 600 } } changes the window size.
 * List views only load relationship cells (Experience, Venue …) for rows
 * inside the window, so open a short list with a tall window, wait for the
 * cells, then resize down before the shot.
 *
 * Every callout must land: a target that matches nothing, or a circle that
 * falls outside a window-sized shot, fails that shot (nothing is written)
 * and the script exits non-zero.
 *
 * `replace` swaps text on the page just before the shot (text and form
 * values) so screenshots show realistic example names instead of the
 * capture account or `zz-docs-` prefixes. Nothing is typed into the form,
 * so nothing is saved.
 *
 * OTHER PORTS. The admin only accepts in-page requests (previews, dialogs)
 * from the origins in payload.config.ts `csrf` (port 3200 in development).
 * Against any other base URL the script sends those requests with the
 * sign-in token instead of the browser's Origin header, so they still work.
 *
 * SAFETY. This drives the real admin against the shared LIVE database. Only
 * open pages and menus; use `fill` on unsaved forms you then leave; never
 * click Save, Publish, Refund, Send or Delete. Demo records must be clearly
 * temporary (a `zz-docs-` prefix, drafts) and removed afterwards.
 * Credentials come from the command line only, never .env.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const IMAGES = path.resolve(here, "..", "images");

const args = process.argv.slice(2);
const specFile = args.find((a) => !a.startsWith("--"));
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const BASE = (flag("base") || process.env.DOCS_BASE_URL || "http://localhost:3200").replace(/\/$/, "");
const only = flag("only")?.split(",").map((s) => s.trim());
const EMAIL = process.env.DOCS_BOT_EMAIL;
const PASSWORD = process.env.DOCS_BOT_PASSWORD;

if (!specFile || !EMAIL || !PASSWORD) {
  console.error("Usage: DOCS_BOT_EMAIL=… DOCS_BOT_PASSWORD=… node docs/admin-guide/scripts/shoot.mjs <shots.json> [--only a,b] [--base URL]");
  process.exit(2);
}

const shots = JSON.parse(fs.readFileSync(specFile, "utf8")).filter((s) => !only || only.includes(s.name));
if (!shots.length) {
  console.error("No shots to take (check --only).");
  process.exit(2);
}

/** Things that are never part of a guide screenshot: the dev-only MOCK strip and Next's dev badge. */
const ALWAYS_HIDE = ["[data-mock-banner]", "nextjs-portal"];

/** Runs in the page: draws the circles. Colours come from the admin theme, with the brand lilac as fallback. */
function drawCallouts({ callouts, windowOnly }) {
  document.querySelectorAll("[data-docs-callout]").forEach((e) => e.remove());
  const sx = window.scrollX;
  const sy = window.scrollY;
  const problems = [];
  for (const c of callouts) {
    let x;
    let y;
    let rect = null;
    if (typeof c.target === "string") {
      let el = null;
      try {
        el = document.querySelector(c.target);
      } catch {
        el = null;
      }
      if (!el) {
        problems.push(`callout ${c.n}: nothing matches ${c.target}`);
        continue;
      }
      rect = el.getBoundingClientRect();
      const gap = 18;
      const place = c.place || "left";
      x = place === "right" ? rect.right + gap : place === "left" ? rect.left - gap : place === "top-left" ? rect.left : rect.left + rect.width / 2;
      y = place === "top" ? rect.top - gap : place === "bottom" ? rect.bottom + gap : place === "top-left" ? rect.top : rect.top + rect.height / 2;
      x = Math.max(16, Math.min(document.documentElement.scrollWidth - 16, x + sx));
      y = Math.max(16, y + sy);
    } else {
      x = c.target.x;
      y = c.target.y;
    }
    if (windowOnly && (y - sy < 0 || y - sy > window.innerHeight || x - sx < 0 || x - sx > window.innerWidth)) {
      problems.push(`callout ${c.n}: lands outside the window (${Math.round(x - sx)}, ${Math.round(y - sy)}) — target a smaller element`);
    }
    const dot = document.createElement("div");
    dot.setAttribute("data-docs-callout", String(c.n));
    dot.textContent = String(c.n);
    Object.assign(dot.style, {
      position: "absolute",
      left: `${x - 14}px`,
      top: `${y - 14}px`,
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      background: "var(--mp-lilac, rgb(144 89 164))",
      color: "white",
      font: "700 14px/28px Montserrat, system-ui, sans-serif",
      textAlign: "center",
      boxShadow: "0 0 0 3px white, 0 4px 12px rgb(0 0 0 / 0.25)",
      zIndex: "2147483647",
      pointerEvents: "none",
    });
    document.body.appendChild(dot);
    if (c.ring && rect) {
      const ring = document.createElement("div");
      ring.setAttribute("data-docs-callout", `ring-${c.n}`);
      Object.assign(ring.style, {
        position: "absolute",
        left: `${rect.left + sx - 4}px`,
        top: `${rect.top + sy - 4}px`,
        width: `${rect.width + 8}px`,
        height: `${rect.height + 8}px`,
        border: "2px solid var(--mp-lilac, rgb(144 89 164))",
        borderRadius: "10px",
        zIndex: "2147483646",
        pointerEvents: "none",
      });
      document.body.appendChild(ring);
    }
  }
  return problems;
}

const browser = await chromium.launch({ channel: process.env.DOCS_CHROME_CHANNEL ?? "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();
page.setDefaultTimeout(120_000);
let failed = 0;

/** Runs in the page: swaps example text in text nodes and form values. */
function swapText(pairs) {
  const swap = (v) => pairs.reduce((acc, [from, to]) => acc.split(from).join(to), v);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const next = swap(n.nodeValue ?? "");
    if (next !== n.nodeValue) n.nodeValue = next;
  }
  document.querySelectorAll("input, textarea").forEach((el) => {
    const next = swap(el.value);
    if (next !== el.value) el.value = next;
  });
}

try {
  const login = await page.request.post(`${BASE}/api/users/login`, { data: { email: EMAIL, password: PASSWORD }, timeout: 180_000 });
  if (!login.ok()) throw new Error(`sign-in failed (${login.status()})`);
  if (!/:3200$/.test(new URL(BASE).host)) {
    const { token } = await login.json();
    await context.route(`${BASE}/api/**`, (route) => {
      const headers = { ...route.request().headers(), authorization: `JWT ${token}` };
      delete headers.origin;
      route.continue({ headers });
    });
  }

  for (const shot of shots) {
    try {
      const viewport = shot.phone ? { width: 390, height: 844 } : (shot.viewport ?? { width: 1440, height: 900 });
      await page.setViewportSize(viewport);
      await page.goto(`${BASE}${shot.url}`, { waitUntil: "load", timeout: 300_000 });
      if (shot.waitFor) await page.waitForSelector(shot.waitFor, { timeout: 120_000 });
      await page.waitForTimeout(shot.settle ?? 1200);
      for (const a of shot.actions ?? []) {
        if (a.click) await page.click(a.click, { timeout: 30_000 });
        else if (a.fill) await page.fill(a.fill[0], a.fill[1]);
        else if (a.press) await page.keyboard.press(a.press);
        else if (a.hover) await page.hover(a.hover);
        else if (a.scroll) await page.locator(a.scroll).scrollIntoViewIfNeeded();
        else if (a.type) await page.keyboard.type(a.type, { delay: 30 });
        else if (a.eval) await page.evaluate(a.eval);
        else if (a.wait) await page.waitForTimeout(a.wait);
        else if (a.resize) await page.setViewportSize(a.resize);
        await page.waitForTimeout(250);
      }
      const hide = [...ALWAYS_HIDE, ...(shot.hide ?? [])];
      await page.addStyleTag({ content: `${hide.join(",")}{display:none!important}` });
      if (shot.replace?.length) await page.evaluate(swapText, shot.replace);
      const problems = await page.evaluate(drawCallouts, { callouts: shot.callouts ?? [], windowOnly: !shot.full && !shot.clip });
      if (problems.length) throw new Error(`callouts missing, image not written:\n    ${problems.join("\n    ")}`);

      let png;
      if (shot.clip && shot.clipPad) {
        const box = await page.locator(shot.clip).first().boundingBox();
        if (!box) throw new Error(`nothing to clip: ${shot.clip}`);
        const pad = shot.clipPad;
        const x = Math.max(0, box.x - pad);
        const y = Math.max(0, box.y - pad);
        png = await page.screenshot({ animations: "disabled", clip: { x, y, width: box.width + pad * 2, height: box.height + pad * 2 } });
      } else if (shot.clip) {
        png = await page.locator(shot.clip).first().screenshot({ animations: "disabled" });
      } else {
        png = await page.screenshot({ fullPage: !!shot.full, animations: "disabled" });
      }

      const width = shot.width ?? (shot.phone ? 390 : 1200);
      const out = path.join(IMAGES, `${shot.name}.webp`);
      const info = await sharp(png).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
      console.log(`✓ ${path.relative(process.cwd(), out)}  ${info.width}×${info.height}`);
      console.log(
        `  { type: "screenshot", file: "${shot.name}.webp", width: ${info.width}, height: ${info.height}, caption: "…", ${shot.phone ? "phone: true, " : ""}callouts: [${(shot.callouts ?? [])
          .map((c) => `{ n: ${c.n}, label: ${JSON.stringify(c.label ?? "…")} }`)
          .join(", ")}] },`,
      );
    } catch (error) {
      failed++;
      console.error(`✗ ${shot.name}: ${error instanceof Error ? error.message : error}`);
    }
  }
  await page.request.post(`${BASE}/api/users/logout`).catch(() => {});
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
