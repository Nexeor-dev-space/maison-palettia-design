#!/usr/bin/env node
/**
 * ==========================================================================
 * build-admin-guide-pdf.mjs — print /admin/docs/print to the guide's PDF
 * ==========================================================================
 *
 *   DOCS_BOT_EMAIL=… DOCS_BOT_PASSWORD=… npm run docs:pdf
 *   DOCS_BASE_URL=http://localhost:3200 (default) · DOCS_CHROME_CHANNEL=chrome (default)
 *
 * Signs in to a running copy of the site (dev or production build) as a
 * staff account, opens /admin/docs/print in Chrome through Playwright, waits
 * for the fonts and every screenshot, and writes
 * docs/admin-guide/dist/Maison-Palettia-Admin-Guide.pdf — A4, backgrounds on,
 * a running header and footer (CSS page-margin boxes in the page itself),
 * the cover edge to edge.
 *
 * PAGE NUMBERS. Chrome cannot put page numbers into the contents by itself
 * (no `target-counter()`), so the page is printed twice: every chapter and
 * section is linked from the contents, which makes Chrome record a named
 * destination for each heading in the first PDF; this script reads which
 * page each destination is on, writes the numbers into the page's
 * `data-pg-for` slots, and prints again (a third time if the numbers moved
 * anything). No PDF library is needed — the destinations and the page tree
 * are plain dictionaries in Chrome's output.
 *
 * The credentials come from the command line only — never put them in .env
 * (CLAUDE.md: .env has exactly three keys). Use a staff account; the script
 * signs out when it is done.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// @playwright/test is already a devDependency (the e2e suite); it re-exports the browser launcher.
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "admin-guide", "dist", "Maison-Palettia-Admin-Guide.pdf");
const BASE = (process.env.DOCS_BASE_URL || "http://localhost:3200").replace(/\/$/, "");
const EMAIL = process.env.DOCS_BOT_EMAIL;
const PASSWORD = process.env.DOCS_BOT_PASSWORD;
const CHANNEL = process.env.DOCS_CHROME_CHANNEL ?? "chrome";

if (!EMAIL || !PASSWORD) {
  console.error("Set DOCS_BOT_EMAIL and DOCS_BOT_PASSWORD on the command line (a staff account). They are never read from .env.");
  process.exit(2);
}

const log = (...a) => console.log("docs:pdf ·", ...a);

// ─── reading Chrome's PDF: named destination → page number ─────────────────

/** Every `N 0 obj … endobj` body, by object number. */
function objects(pdf) {
  const map = new Map();
  const re = /(\d+) 0 obj\s*([\s\S]*?)\s*endobj/g;
  let m;
  while ((m = re.exec(pdf))) map.set(Number(m[1]), m[2]);
  return map;
}

/** Page object numbers in reading order, walking the page tree from the catalog. */
function pageOrder(objs) {
  let rootPages = null;
  for (const body of objs.values()) {
    const m = /\/Type\s*\/Catalog[\s\S]*?\/Pages\s+(\d+)\s+0\s+R/.exec(body);
    if (m) rootPages = Number(m[1]);
  }
  if (rootPages == null) throw new Error("no page tree in the PDF");
  const order = [];
  const walk = (n, depth) => {
    if (depth > 32) throw new Error("page tree too deep");
    const body = objs.get(n) ?? "";
    if (/\/Type\s*\/Pages\b/.test(body)) {
      const kids = /\/Kids\s*\[([^\]]*)\]/.exec(body)?.[1] ?? "";
      for (const k of kids.matchAll(/(\d+)\s+0\s+R/g)) walk(Number(k[1]), depth + 1);
    } else order.push(n);
  };
  walk(rootPages, 0);
  return order;
}

const decodeName = (s) => s.replace(/#([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

/** { anchor id → 1-based page number } from the PDF's /Dests dictionary. */
function destinations(buffer) {
  const pdf = buffer.toString("latin1");
  const objs = objects(pdf);
  const pages = pageOrder(objs);
  const index = new Map(pages.map((n, i) => [n, i + 1]));
  const out = {};
  let destsBody = null;
  for (const body of objs.values()) {
    const m = /\/Dests\s+(\d+)\s+0\s+R/.exec(body);
    if (m) destsBody = objs.get(Number(m[1]));
  }
  if (!destsBody) return { pages: pages.length, map: out };
  for (const m of destsBody.matchAll(/\/([^\s/[\]<>()]+)\s*\[\s*(\d+)\s+0\s+R/g)) {
    const page = index.get(Number(m[2]));
    if (page) out[decodeName(m[1])] = page;
  }
  return { pages: pages.length, map: out };
}

// ─── print ─────────────────────────────────────────────────────────────────

async function launch() {
  try {
    return await chromium.launch({ channel: CHANNEL || undefined, headless: true });
  } catch (error) {
    if (!CHANNEL) throw error;
    log(`could not start Chrome (${CHANNEL}); trying Playwright's own Chromium`);
    return chromium.launch({ headless: true });
  }
}

const browser = await launch();
let exitCode = 0;
try {
  const context = await browser.newContext({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  log(`signing in at ${BASE}`);
  const login = await page.request.post(`${BASE}/api/users/login`, { data: { email: EMAIL, password: PASSWORD }, timeout: 120_000 });
  if (!login.ok()) throw new Error(`sign-in failed (${login.status()}): ${(await login.text()).slice(0, 200)}`);

  log("opening /admin/docs/print");
  await page.goto(`${BASE}/admin/docs/print`, { waitUntil: "load", timeout: 300_000 });
  await page.waitForSelector(".mpd-print", { timeout: 120_000 });
  await page.emulateMedia({ media: "print" });

  // Fonts, then every screenshot decoded (they are eager on this page).
  await page.evaluate(async () => {
    await document.fonts.ready;
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
      ),
    );
  });
  const broken = await page.evaluate(() => Array.from(document.images).filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src")));
  if (broken.length) throw new Error(`${broken.length} screenshot(s) did not load, e.g. ${broken.slice(0, 3).join(", ")}`);
  const anchors = await page.evaluate(() => Array.from(new Set(Array.from(document.querySelectorAll("[data-pg-for]")).map((e) => e.getAttribute("data-pg-for")))));

  const print = () =>
    page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      // The running header and footer are CSS page-margin boxes in the page
      // (DocsPrint.tsx), so the cover can have none; Chrome's own
      // header/footer templates would print on every page, cover included.
      displayHeaderFooter: false,
      outline: true,
      tagged: true,
    });

  let pdf = await print();
  let previous = "";
  for (let pass = 1; pass <= 3; pass++) {
    const { pages, map } = destinations(pdf);
    const missing = anchors.filter((a) => !map[a]);
    const key = JSON.stringify(map);
    log(`pass ${pass}: ${pages} pages, ${Object.keys(map).length} headings placed${missing.length ? `, ${missing.length} not found (${missing.slice(0, 4).join(", ")}…)` : ""}`);
    if (key === previous) break;
    previous = key;
    await page.evaluate((m) => {
      for (const el of document.querySelectorAll("[data-pg-for]")) el.textContent = m[el.getAttribute("data-pg-for")] ? String(m[el.getAttribute("data-pg-for")]) : "";
    }, map);
    pdf = await print();
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, pdf);
  log(`wrote ${path.relative(ROOT, OUT)} (${(pdf.length / 1024 / 1024).toFixed(1)} MB)`);

  await page.request.post(`${BASE}/api/users/logout`).catch(() => {});
} catch (error) {
  console.error("docs:pdf · failed:", error instanceof Error ? error.message : error);
  exitCode = 1;
} finally {
  await browser.close();
}
process.exit(exitCode);
