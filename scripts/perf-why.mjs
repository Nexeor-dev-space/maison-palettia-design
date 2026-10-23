#!/usr/bin/env node
/*
 * Why is the frame slow? — a companion to perf-bench.mjs. Not part of CI.
 *
 *   node scripts/perf-why.mjs [--url http://localhost:3201] [--path /]
 *        [--cpu 1] [--mobile] [--seconds 4] [--top 12] [--load | --idle]
 *
 * Scrolls the page with the wheel for a few seconds while Chrome's own
 * tracing is on (`devtools.timeline`), then prints what the main thread did.
 *
 *   --load   instead traces the LOAD: from before navigation until the
 *            homepage intro reports `done` (or `load`) plus 1.5 s, and also
 *            lists every long task (> 50 ms) with what ran inside it.
 *   --iphone the phone as perf-load.mjs emulates it (iPhone 13, a WebKit user
 *            agent, so the site takes its WebKit paths) instead of Android.
 *   --idle   instead traces --seconds of the page left alone, starting 1.5 s
 *            after the intro, with the pointer never on the page — for what
 *            still ticks at rest.
 *
 * Either way it prints:
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
import { chromium, devices } from "@playwright/test";

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
const IPHONE = has("iphone");
const MOBILE = has("mobile") || IPHONE;
const LOAD = has("load");
const IDLE = has("idle");

const browser = await chromium.launch({ channel: "chrome", headless: true }).catch(() => chromium.launch({ headless: true }));
const context = await browser.newContext(
  IPHONE
    ? devices["iPhone 13"]
    : MOBILE
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
const events = [];
cdp.on("Tracing.dataCollected", ({ value }) => events.push(...value));
const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
const startTracing = () =>
  cdp.send("Tracing.start", {
    categories: "devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking,disabled-by-default-devtools.timeline.stack,v8.execute",
    options: "sampling-frequency=10000",
  });
const settle = async () => {
  await page.waitForFunction(() => document.documentElement.dataset.intro !== "play" && document.documentElement.dataset.intro !== "dots" && document.documentElement.dataset.intro !== "burst" && document.documentElement.dataset.intro !== "settle", null, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1500);
};

let step = 0;
if (LOAD) {
  await startTracing();
  await page.goto(URL_BASE + PATH, { waitUntil: "load", timeout: 120_000 });
  await settle();
} else {
  await page.goto(URL_BASE + PATH, { waitUntil: "load", timeout: 120_000 });
  await settle();
  if (!IDLE) await page.mouse.move(400, 400);
  await startTracing();
  const t0 = Date.now();
  while (Date.now() - t0 < SECONDS * 1000) {
    if (IDLE) {
      await page.waitForTimeout(100);
      continue;
    }
    await page.mouse.wheel(0, 28);
    await page.waitForTimeout(16);
    step++;
  }
  await page.waitForTimeout(300);
}
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
const what = LOAD ? "page load" : IDLE ? `${SECONDS}s left alone` : `${SECONDS}s wheel scroll (${step} steps)`;
console.log(`\n${URL_BASE}${PATH} ${MOBILE ? "phone" : "desktop"} cpu${CPU}x, ${what}, ${frames} animation frames`);
console.log("\nmain-thread events (top by total ms)");
for (const [k, v] of [...byName.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, TOP)) {
  console.log(`  ${String(v.n).padStart(6)}x ${fmt(v.ms).padStart(8)}ms  ${k}`);
}
const se = styleElements.filter(Boolean).sort((a, b) => a - b);
if (se.length) console.log(`\nstyle recalcs: ${styleElements.length}, elements touched median ${se[Math.floor(se.length / 2)]}, max ${se[se.length - 1]}, total ${se.reduce((a, b) => a + b, 0)}`);
show("forced layouts — what read layout after a write (top by ms)", stacks.layout);
show("style recalcs with a JS cause (top by ms)", stacks.style);

/*
  Long tasks (> 50 ms) on the page's main thread, and what ran inside each:
  inclusive ms per event name (nested events count in each parent, so the
  rows overlap), with the script file for evaluations and calls. The main
  thread is the busiest CrRendererMain in the trace.
*/
const mains = events.filter((e) => e.ph === "M" && e.name === "thread_name" && e.args?.name === "CrRendererMain");
const busiest = mains
  .map((m) => ({ pid: m.pid, tid: m.tid, n: events.filter((e) => e.pid === m.pid && e.tid === m.tid).length }))
  .sort((a, b) => b.n - a.n)[0];
if (busiest) {
  const onMain = events.filter((e) => e.pid === busiest.pid && e.tid === busiest.tid && e.ph === "X" && e.dur);
  const origin = Math.min(...onMain.map((e) => e.ts));
  const tasks = onMain.filter((e) => e.name === "RunTask" && e.dur > 50_000).sort((a, b) => a.ts - b.ts);
  const file = (e) => {
    const url = e.args?.data?.url || e.args?.data?.stackTrace?.[0]?.url || "";
    return url ? ` ${url.split("/").pop().split("?")[0]}` : "";
  };
  const named = (e) => {
    const fn = e.args?.data?.functionName;
    return `${e.name}${fn ? ` ${fn}` : ""}${file(e)}`;
  };
  console.log(`\nlong tasks on the main thread: ${tasks.length}, ${fmt(tasks.reduce((s, t) => s + t.dur, 0) / 1000)}ms`);
  for (const t of tasks) {
    const inside = new Map();
    for (const e of onMain) {
      if (e === t || e.ts < t.ts || e.ts + e.dur > t.ts + t.dur) continue;
      const k = named(e);
      inside.set(k, (inside.get(k) || 0) + e.dur / 1000);
    }
    const top = [...inside.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    console.log(`  at ${fmt((t.ts - origin) / 1000).padStart(8)}ms  ${fmt(t.dur / 1000).padStart(7)}ms`);
    for (const [k, ms] of top) console.log(`      ${fmt(ms).padStart(7)}ms  ${k}`);
  }
}
