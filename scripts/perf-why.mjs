#!/usr/bin/env node
/*
 * Why is the frame slow? — a companion to perf-bench.mjs. Not part of CI.
 *
 *   node scripts/perf-why.mjs [--url http://localhost:3201] [--path /]
 *        [--cpu 1] [--mobile] [--seconds 4] [--top 12]
 *
 * Scrolls the page with the wheel for a few seconds while Chrome's own
 * tracing is on (`devtools.timeline`), then prints what the main thread did:
 *
 *   - style recalculations (UpdateLayoutTree): count, total ms, the elements
 *     they touched, and the JavaScript that triggered the slow ones
 *   - layouts: count, total ms, and the JavaScript that FORCED them (a
 *     layout with a stack trace was synchronous: something read a layout
 *     value after a write)
 *   - paint and composite time, and animation frame fired counts
 *
 * The stacks name a function and a file:line in the production bundle; the
 * function names survive minification often enough to be useful.
 */
import { chromium } from "@playwright/test";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);
const URL_BASE = arg("url", "http://localhost:3201");
const PATH = arg("path", "/");
const CPU = Number(arg("cpu", 1));
const SECONDS = Number(arg("seconds", 4));
const TOP = Number(arg("top", 12));
const MOBILE = has("mobile");

const browser = await chromium.launch({ channel: "chrome", headless: true }).catch(() => chromium.launch({ headless: true }));
const context = await browser.newContext(
  MOBILE
    ? {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
      }
    : { viewport: { width: 1440, height: 900 } },
);
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
await page.goto(URL_BASE + PATH, { waitUntil: "load", timeout: 120_000 });
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 30_000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.mouse.move(400, 400);

const events = [];
cdp.on("Tracing.dataCollected", ({ value }) => events.push(...value));
const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
await cdp.send("Tracing.start", {
  categories: "devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking,disabled-by-default-devtools.timeline.stack",
  options: "sampling-frequency=10000",
});
const t0 = Date.now();
let step = 0;
while (Date.now() - t0 < SECONDS * 1000) {
  await page.mouse.wheel(0, 28);
  await page.waitForTimeout(16);
  step++;
}
await page.waitForTimeout(300);
await cdp.send("Tracing.end");
await done;
await browser.close();

const byName = new Map();
const stacks = { layout: new Map(), style: new Map() };
const styleElements = [];
let frames = 0;
const main = events.filter((e) => e.ph === "X" || e.ph === "B" || e.ph === "I");
for (const e of main) {
  const dur = (e.dur || 0) / 1000;
  const n = byName.get(e.name) || { n: 0, ms: 0 };
  n.n++;
  n.ms += dur;
  byName.set(e.name, n);
  if (e.name === "AnimationFrameFired") frames++;
  const stack = e.args?.beginData?.stackTrace || e.args?.data?.stackTrace;
  const key = (s) => s.slice(0, 3).map((f) => `${f.functionName || "(anon)"} @ ${(f.url || "").split("/").pop()}:${f.lineNumber}`).join(" <- ");
  if (e.name === "Layout" && stack?.length) {
    const k = key(stack);
    const v = stacks.layout.get(k) || { n: 0, ms: 0 };
    v.n++;
    v.ms += dur;
    stacks.layout.set(k, v);
  }
  if (e.name === "UpdateLayoutTree") {
    styleElements.push(e.args?.elementCount || 0);
    if (stack?.length) {
      const k = key(stack);
      const v = stacks.style.get(k) || { n: 0, ms: 0 };
      v.n++;
      v.ms += dur;
      stacks.style.set(k, v);
    }
  }
}
const fmt = (x) => x.toFixed(1);
const show = (title, map) => {
  console.log(`\n${title}`);
  const rows = [...map.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, TOP);
  for (const [k, v] of rows) console.log(`  ${String(v.n).padStart(5)}x ${fmt(v.ms).padStart(8)}ms  ${k}`);
};
console.log(`\n${URL_BASE}${PATH} ${MOBILE ? "phone" : "desktop"} cpu${CPU}x, ${SECONDS}s wheel scroll (${step} steps), ${frames} animation frames`);
console.log("\nmain-thread events (top by total ms)");
for (const [k, v] of [...byName.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, TOP)) {
  console.log(`  ${String(v.n).padStart(6)}x ${fmt(v.ms).padStart(8)}ms  ${k}`);
}
const se = styleElements.filter(Boolean).sort((a, b) => a - b);
if (se.length) console.log(`\nstyle recalcs: ${styleElements.length}, elements touched median ${se[Math.floor(se.length / 2)]}, max ${se[se.length - 1]}, total ${se.reduce((a, b) => a + b, 0)}`);
show("forced layouts — what read layout after a write (top by ms)", stacks.layout);
show("style recalcs with a JS cause (top by ms)", stacks.style);
