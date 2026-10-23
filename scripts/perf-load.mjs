#!/usr/bin/env node
/**
 * Load-and-idle benchmark (issue #135). Not part of CI. The companion to
 * perf-bench.mjs, which measures interaction (scroll, pointer) once the page
 * has settled; this measures the load itself, then the page left alone.
 *
 *   node scripts/perf-load.mjs [--url http://localhost:3201] [--paths /,events]
 *        [--devices phone,desktop] [--runs 7] [--idle 5] [--label after]
 *        [--json out.json]
 *   node scripts/perf-load.mjs --compare before.json after.json
 *
 * Run it against a PRODUCTION build, on the same machine, once per build, and
 * compare the medians. Dev mode is meaningless here.
 *
 * Options
 *   --url <base>          site origin (default http://localhost:3201)
 *   --paths a,b           pages (default /,/events). A leading '/' is optional
 *                         (Git Bash rewrites one — see perf-bench.mjs).
 *   --devices a,b         phone (iPhone 13, 4x CPU) and/or desktop (1440x900,
 *                         1x CPU). Default both.
 *   --cpu-phone <n>       phone throttle (default 4)
 *   --cpu-desktop <n>     desktop throttle (default 1)
 *   --runs <n>            measured runs per path x device (default 7; one extra
 *                         warm-up run is always discarded)
 *   --idle <s>            seconds of "page left alone" measured (default 5)
 *   --label <text>        stored in the JSON and the table heading
 *   --json <file>         write {label, summary, runs, meta}
 *   --compare <a> <b>     no browser: per-metric change a->b, ±3% = same
 *
 * Each run is a fresh browser context (cold cache for the page, as a first
 * visit). It reports, as medians:
 *   fcp / lcp      first and largest contentful paint, ms from navigation
 *   tbt            sum of (long task - 50 ms) after FCP, up to the idle window
 *   longN/longMs   long tasks (> 50 ms) from navigation to the idle window
 *   htmlKB         the document's uncompressed size
 *   idleTaskMs     main-thread time during the idle window (CDP TaskDuration)
 *   idleScriptMs   JavaScript time in it
 *   idleStyleN/Ms  style recalculations in it — ~60/s means something ticks
 *                  every frame
 *   lcpEl          (JSON and table) the LCP element, most frequent across runs
 *
 * The idle window starts 1.5 s after the homepage intro reports `done` (or
 * 1.5 s after load on any other page), with the pointer never on the page.
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const cols = ["fcp", "lcp", "tbt", "longN", "longMs", "htmlKB", "idleTaskMs", "idleScriptMs", "idleStyleN", "idleStyleMs"];

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mode = (xs) => {
  const n = new Map();
  for (const x of xs) n.set(x, (n.get(x) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
};
const fmt = (v) => (typeof v !== "number" ? String(v) : Number.isInteger(v) ? String(v) : v.toFixed(1));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ compare */

function compare(fileA, fileB) {
  const A = JSON.parse(fs.readFileSync(fileA, "utf8"));
  const B = JSON.parse(fs.readFileSync(fileB, "utf8"));
  const names = [...new Set([...Object.keys(A.summary || {}), ...Object.keys(B.summary || {})])];
  const change = (a, b) => {
    if (typeof a !== "number" || typeof b !== "number") return "n/a";
    let pct;
    if (a === 0 && b === 0) pct = 0;
    else if (a === 0) pct = null;
    else pct = ((b - a) / Math.abs(a)) * 100;
    const verdict =
      pct === null ? (b === a ? "same" : "regressed") : Math.abs(pct) <= 3 ? "same" : pct < 0 ? "improved" : "regressed";
    const pctText = pct === null ? "new" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    return `${fmt(a)}→${fmt(b)} (${pctText}) ${verdict}`;
  };
  let md = `\n### compare — ${A.label ?? fileA} → ${B.label ?? fileB}\n\nLower is better for every metric; within ±3% = same.\n\n`;
  md += `| page / device | ${cols.join(" | ")} |\n|---|${cols.map(() => "---").join("|")}|\n`;
  for (const n of names) {
    md += `| ${n} | ${cols.map((m) => change(A.summary?.[n]?.[m], B.summary?.[n]?.[m])).join(" | ")} |\n`;
  }
  console.log(md);
}

if (has("compare")) {
  const i = process.argv.indexOf("--compare");
  const [a, b] = [process.argv[i + 1], process.argv[i + 2]];
  if (!a || !b || a.startsWith("--") || b.startsWith("--")) {
    console.error("usage: --compare <a.json> <b.json>");
    process.exit(2);
  }
  compare(a, b);
  process.exit(0);
}

/* ------------------------------------------------------------------ options */

const URL_BASE = arg("url", "http://localhost:3201");
const RUNS = Number(arg("runs", 7));
const IDLE_S = Number(arg("idle", 5));
const LABEL = arg("label", "run");
const JSON_OUT = arg("json", "");
const CPU = { phone: Number(arg("cpu-phone", 4)), desktop: Number(arg("cpu-desktop", 1)) };

const normPath = (p) => {
  let s = p.trim();
  s = s.replace(/^[A-Za-z]:[\\/]+Program Files[\\/]+Git(?=[\\/]|$)/i, "").replace(/\\/g, "/");
  return s.startsWith("/") ? s : `/${s}`;
};
const PATHS = String(arg("paths", "/,/events"))
  .split(",")
  .filter((p) => p.trim() !== "")
  .map(normPath);
const DEVICES = String(arg("devices", "phone,desktop"))
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);
for (const d of DEVICES) {
  if (!(d in CPU)) {
    console.error(`unknown device "${d}" (valid: phone, desktop)`);
    process.exit(2);
  }
}

const meta = { timestamp: new Date().toISOString(), gitHead: null, url: URL_BASE, cpu: CPU, idleSeconds: IDLE_S };
try {
  meta.gitHead = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {
  /* not a git checkout */
}

const { chromium, devices } = await import("@playwright/test");

/* ------------------------------------------------------------------ browser */

/** Injected before the page runs: buffers paints, the LCP and every long task. */
const SAMPLER = () => {
  const out = (window.__load = { fcp: 0, lcp: 0, lcpEl: "", long: [] });
  const describe = (el) => {
    if (!el) return "";
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    const attr = [...el.attributes].find((a) => a.name.startsWith("data-"));
    if (attr) s += `[${attr.name}]`;
    return s;
  };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (e.name === "first-contentful-paint") out.fcp = e.startTime;
    }).observe({ type: "paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        out.lcp = e.startTime;
        out.lcpEl = describe(e.element);
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) out.long.push({ start: e.startTime, duration: e.duration });
    }).observe({ type: "longtask", buffered: true });
  } catch {
    /* unsupported: the columns read 0 */
  }
};

async function metrics(cdp) {
  const { metrics: list } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(list.map((m) => [m.name, m.value]));
}

async function oneRun(browser, pagePath, device) {
  const context = await browser.newContext(
    device === "phone" ? devices["iPhone 13"] : { viewport: { width: 1440, height: 900 } },
  );
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU[device] });
  await page.addInitScript(SAMPLER);
  const response = await page.goto(URL_BASE + pagePath, { waitUntil: "load", timeout: 120_000 });
  const html = response ? await response.body() : Buffer.alloc(0);
  if (pagePath === "/") {
    await page
      .waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 30_000 })
      .catch(() => {});
  }
  await sleep(1500);
  const load = await page.evaluate(() => window.__load);
  const m0 = await metrics(cdp);
  await sleep(IDLE_S * 1000);
  const m1 = await metrics(cdp);
  await context.close();
  const d = (k) => (m1[k] ?? 0) - (m0[k] ?? 0);
  const afterFcp = load.long.filter((t) => t.start >= load.fcp);
  return {
    fcp: load.fcp,
    lcp: load.lcp,
    tbt: afterFcp.reduce((s, t) => s + Math.max(0, t.duration - 50), 0),
    longN: load.long.length,
    longMs: load.long.reduce((s, t) => s + t.duration, 0),
    htmlKB: html.length / 1024,
    idleTaskMs: d("TaskDuration") * 1000,
    idleScriptMs: d("ScriptDuration") * 1000,
    idleStyleN: d("RecalcStyleCount"),
    idleStyleMs: d("RecalcStyleDuration") * 1000,
    lcpEl: load.lcpEl,
  };
}

/* --------------------------------------------------------------------- main */

const browser = await chromium.launch({ channel: "chrome", headless: true }).catch(() => chromium.launch({ headless: true }));
const summary = {};
const runs = {};
for (const pagePath of PATHS) {
  for (const device of DEVICES) {
    const key = `${pagePath} ${device}`;
    process.stderr.write(`${key}: warm-up`);
    await oneRun(browser, pagePath, device);
    const results = [];
    for (let i = 0; i < RUNS; i++) {
      process.stderr.write(` ${i + 1}`);
      results.push(await oneRun(browser, pagePath, device));
    }
    process.stderr.write("\n");
    runs[key] = results;
    summary[key] = Object.fromEntries(cols.map((c) => [c, median(results.map((r) => r[c]))]));
    summary[key].lcpEl = mode(results.map((r) => r.lcpEl));
  }
}
await browser.close();

let md = `\n### ${LABEL} — median of ${RUNS} (${meta.gitHead ?? "?"}, phone ${CPU.phone}x, desktop ${CPU.desktop}x)\n\n`;
md += `| page / device | ${cols.join(" | ")} | lcpEl |\n|---|${cols.map(() => "---").join("|")}|---|\n`;
for (const [key, s] of Object.entries(summary)) md += `| ${key} | ${cols.map((c) => fmt(s[c])).join(" | ")} | ${s.lcpEl} |\n`;
console.log(md);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ label: LABEL, summary, runs, meta }, null, 2));
