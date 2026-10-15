#!/usr/bin/env node
/**
 * Jitter benchmark (issue #70). Not part of CI.
 *
 *   node scripts/perf-bench.mjs [--url http://localhost:3200] [--path /] \
 *        [--runs 5] [--cpu 4] [--label after] [--json out.json]
 *
 * Run it against a PRODUCTION build (`npm run build && npm start`), once per
 * branch, on the same machine, and compare the printed medians. Dev mode adds
 * HMR and unminified React, which distorts every number here.
 *
 * Options
 *   --url <base>             site origin (default http://localhost:3200)
 *   --path <p> | --paths a,b page(s) to test (default /). A leading '/' is
 *                            optional: `--paths events,journal` works.
 *                            GIT BASH: it rewrites an argument that starts with
 *                            '/' into a Windows path (`/` -> `C:/Program
 *                            Files/Git/`). Either omit the leading slash, or
 *                            run with MSYS_NO_PATHCONV=1.
 *   --cpu <n> | --cpu 1,2    CPU throttle rate(s) (default 4). Comma list ok.
 *                            Every path x cpu combination gets its own table.
 *   --runs <n>               measured runs per combination (default 5; one
 *                            extra warm-up run is always discarded)
 *   --scenarios <list>       comma list of scroll,mouse,both,hero (default all)
 *   --label <text>           label stored in the table heading and JSON
 *   --json <file>            write {label, summary, min, max, runs, results,
 *                            meta}. Top-level summary/min/max/runs are the
 *                            first path x cpu combination (backward
 *                            compatible); `results` has every combination.
 *   --headed                 launch a visible browser (real GPU compositing)
 *   --trace <file.zip>       Playwright trace of the first measured run only
 *   --screenshots <dir>      after the intro, scroll to 0/25/50/75/100% of the
 *                            hero hold and save hero-<pct>.png (first measured
 *                            run per combination; with several combinations
 *                            each goes in its own sub-directory)
 *   --marker <string>        grep .next/static (plain text, recursive) for the
 *                            string; stored as meta.markerFound. Proves which
 *                            build is being served/measured.
 *   --expect-marker <t|f>    abort with exit code 2 if markerFound disagrees
 *   --compare <a.json> <b.json>
 *                            no browser: print per-scenario, per-metric change
 *                            a->b (+-%) and improved/regressed/same (+-3%)
 *
 * Examples
 *   node scripts/perf-bench.mjs --label before --json before.json
 *   MSYS_NO_PATHCONV=1 node scripts/perf-bench.mjs --paths /,/events --cpu 1,4
 *   node scripts/perf-bench.mjs --paths events --scenarios hero,scroll --headed
 *   node scripts/perf-bench.mjs --marker data-hero-fix --expect-marker true \
 *        --screenshots shots --trace trace.zip --json after.json
 *   node scripts/perf-bench.mjs --compare before.json after.json
 *
 * Scenarios, each on a fresh browser context:
 *   scroll  — wheel the page ~6 viewport heights (fixed distance), mouse parked
 *   mouse   — circle the mouse across the window for 6 s, no scrolling
 *   both    — scroll ~6 viewport heights and move the mouse together
 *   hero    — slow wheel through the first ~3 viewport heights (hero banner hold)
 *
 * Per scenario it reports (medians over runs):
 *   fps / fps1pct  average FPS, and the FPS of the slowest 1% of frames
 *   drop%          share of frames longer than 16.7 ms (a missed 60 Hz frame)
 *   jank           frames longer than 50 ms
 *   longTasks      main-thread tasks over 50 ms, and their summed ms
 *   styleN/styleMs style recalculations (count, ms) — what causes 1 and 2 hit
 *   layoutN        layouts
 *   scriptMs       JavaScript time
 *   taskMs         total main-thread time
 *   anims          running CSS/Web animations at the end of the scenario
 *   endY           (JSON only) final window.scrollY, to check the scroll landed
 * A second table shows min-max of fps and styleMs; a scenario is flagged
 * `noisy` when (max-min)/median of either exceeds 0.25 — rerun before trusting it.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const cols = ["fps", "fps1pct", "drop%", "jank", "longTasks", "longMs", "styleN", "styleMs", "layoutN", "scriptMs", "taskMs", "anims"];

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/* ------------------------------------------------------------------ compare */

function compare(fileA, fileB) {
  const A = JSON.parse(fs.readFileSync(fileA, "utf8"));
  const B = JSON.parse(fs.readFileSync(fileB, "utf8"));
  const metrics = ["fps", "fps1pct", "drop%", "jank", "longMs", "styleMs", "layoutN", "scriptMs", "taskMs", "anims"];
  const higherBetter = new Set(["fps", "fps1pct"]);
  const meanOf = ["fps", "fps1pct", "styleMs", "taskMs"];
  const names = [...new Set([...Object.keys(A.summary || {}), ...Object.keys(B.summary || {})])];

  const change = (m, a, b) => {
    if (typeof a !== "number" || typeof b !== "number") return { text: "n/a", pct: null };
    let pct;
    if (a === 0 && b === 0) pct = 0;
    else if (a === 0) pct = null; // divide by zero: no meaningful %
    else pct = ((b - a) / Math.abs(a)) * 100;
    let verdict;
    if (pct === null) verdict = b === a ? "same" : (b > a) === higherBetter.has(m) ? "improved" : "regressed";
    else if (Math.abs(pct) <= 3) verdict = "same";
    else verdict = (pct > 0) === higherBetter.has(m) ? "improved" : "regressed";
    const pctText = pct === null ? "new" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    return { text: `${fmt(a)}→${fmt(b)} (${pctText}) ${verdict}`, pct };
  };

  let md = `\n### compare — ${A.label ?? fileA} → ${B.label ?? fileB}\n\n`;
  md += `Higher is better for fps/fps1pct, lower for the rest; within ±3% = same.\n\n`;
  md += `| scenario | ${metrics.join(" | ")} |\n|---|${metrics.map(() => "---").join("|")}|\n`;
  const pcts = Object.fromEntries(meanOf.map((m) => [m, []]));
  for (const n of names) {
    const cells = metrics.map((m) => {
      const c = change(m, A.summary?.[n]?.[m], B.summary?.[n]?.[m]);
      if (c.pct !== null && pcts[m]) pcts[m].push(c.pct);
      return c.text;
    });
    md += `| ${n} | ${cells.join(" | ")} |\n`;
  }
  md += `\n| mean % change across scenarios | ${meanOf.join(" | ")} |\n|---|${meanOf.map(() => "---").join("|")}|\n| mean |`;
  for (const m of meanOf) {
    const xs = pcts[m];
    md += ` ${xs.length ? `${(xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(1)}%` : "n/a"} |`;
  }
  console.log(md + "\n");
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

const URL_BASE = arg("url", "http://localhost:3200");
const RUNS = Number(arg("runs", 5));
const LABEL = arg("label", "run");
const JSON_OUT = arg("json", "");
const HEADED = has("headed");
const TRACE = arg("trace", "");
const SHOTS = arg("screenshots", "");
const MARKER = arg("marker", "");
const EXPECT_MARKER = arg("expect-marker", "");

const normPath = (p) => {
  let s = p.trim();
  // Git Bash turned a leading '/' into its install dir: recover "/rest".
  s = s.replace(/^[A-Za-z]:[\\/]+Program Files[\\/]+Git(?=[\\/]|$)/i, "").replace(/\\/g, "/");
  return s.startsWith("/") ? s : `/${s}`;
};
const PATHS = String(arg("paths", arg("path", "/")))
  .split(",")
  .filter((p) => p.trim() !== "")
  .map(normPath);
const CPUS = String(arg("cpu", "4"))
  .split(",")
  .filter((c) => c.trim() !== "")
  .map(Number);
const ALL_SCENARIOS = ["scroll", "mouse", "both", "hero"];
const SCENARIOS = String(arg("scenarios", ALL_SCENARIOS.join(",")))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
for (const s of SCENARIOS) {
  if (!ALL_SCENARIOS.includes(s)) {
    console.error(`unknown scenario "${s}" (valid: ${ALL_SCENARIOS.join(", ")})`);
    process.exit(2);
  }
}
if (CPUS.some((c) => !Number.isFinite(c) || c < 1)) {
  console.error("--cpu must be a number >= 1 or a comma list of them");
  process.exit(2);
}

/* --------------------------------------------------------------- build meta */

function grepDir(dir, needle) {
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (fs.readFileSync(full, "latin1").includes(needle)) return true;
    }
  }
  return false;
}

const meta = { timestamp: new Date().toISOString(), gitHead: null, buildId: null };
try {
  meta.gitHead = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {
  /* not a git checkout / git missing */
}
try {
  meta.buildId = fs.readFileSync(path.join(".next", "BUILD_ID"), "utf8").trim();
} catch {
  /* no build in cwd */
}
if (MARKER) {
  meta.marker = MARKER;
  meta.markerFound = grepDir(path.join(".next", "static"), MARKER);
}
if (EXPECT_MARKER) {
  if (!MARKER) {
    console.error("--expect-marker needs --marker <string>");
    process.exit(2);
  }
  const want = /^(true|1|yes|t)$/i.test(EXPECT_MARKER);
  if (meta.markerFound !== want) {
    console.error(`marker check failed: "${MARKER}" ${meta.markerFound ? "IS" : "is NOT"} in .next/static but --expect-marker ${want}. Wrong or stale build; aborting.`);
    process.exit(2);
  }
}

const { chromium } = await import("@playwright/test");

/* ------------------------------------------------------------------ browser */

/** Injected before the page runs: records every frame and every long task. */
const SAMPLER = () => {
  window.__bench = { frames: [], long: [], on: false };
  let last = performance.now();
  const loop = (now) => {
    if (window.__bench.on) window.__bench.frames.push(now - last);
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((list) => {
      if (window.__bench.on) for (const e of list.getEntries()) window.__bench.long.push(e.duration);
    }).observe({ entryTypes: ["longtask"] });
  } catch {
    /* longtask unsupported: the column reads 0 */
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fixed-distance scenarios: total viewport heights, wheel px per step.
const DISTANCE = {
  scroll: { vh: 6, step: 28, mouse: false },
  both: { vh: 6, step: 28, mouse: true },
  hero: { vh: 3, step: 12, mouse: false },
};
const MOUSE_MS = 6000;

async function scenario(page, cdp, name) {
  const { width, height } = page.viewportSize();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await sleep(1200);
  const before = await metrics(cdp);
  await page.evaluate(() => {
    window.__bench.frames = [];
    window.__bench.long = [];
    window.__bench.on = true;
  });

  const moveMouse = (step) => {
    const a = step / 9;
    return page.mouse.move(width / 2 + Math.cos(a) * width * 0.35, height / 2 + Math.sin(a * 1.3) * height * 0.3);
  };
  let step = 0;
  if (name === "mouse") {
    const t0 = Date.now();
    while (Date.now() - t0 < MOUSE_MS) {
      await moveMouse(step++);
      await sleep(16);
    }
  } else {
    const cfg = DISTANCE[name];
    const steps = Math.ceil((cfg.vh * height) / cfg.step);
    for (; step < steps; step++) {
      if (cfg.mouse) await moveMouse(step);
      else if (step === 0) await page.mouse.move(width / 2, height / 2);
      await page.mouse.wheel(0, cfg.step);
      await sleep(16);
    }
  }
  await sleep(300);

  const out = await page.evaluate(() => {
    window.__bench.on = false;
    return {
      frames: window.__bench.frames,
      long: window.__bench.long,
      anims: document.getAnimations().length,
      endY: Math.round(window.scrollY),
    };
  });
  const after = await metrics(cdp);

  const frames = out.frames.filter((d) => d > 0);
  const sorted = [...frames].sort((a, b) => a - b);
  const worst1 = sorted.slice(Math.floor(sorted.length * 0.99));
  const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
  const worstAvg = worst1.reduce((a, b) => a + b, 0) / (worst1.length || 1);
  const d = (k) => (after[k] - before[k]) * (k.endsWith("Duration") ? 1000 : 1);
  return {
    fps: 1000 / avg,
    fps1pct: 1000 / worstAvg,
    "drop%": (frames.filter((x) => x > 16.7).length / frames.length) * 100,
    jank: frames.filter((x) => x > 50).length,
    longTasks: out.long.length,
    longMs: out.long.reduce((a, b) => a + b, 0),
    styleN: d("RecalcStyleCount"),
    styleMs: d("RecalcStyleDuration"),
    layoutN: d("LayoutCount"),
    scriptMs: d("ScriptDuration"),
    taskMs: d("TaskDuration"),
    anims: out.anims,
    endY: out.endY,
  };
}

async function metrics(cdp) {
  const { metrics: list } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(list.map((m) => [m.name, m.value]));
}

/** Scroll through the hero hold at 0/25/50/75/100% and save PNGs. */
async function heroShots(page, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const hold = await page.evaluate(() => {
    const vh = window.innerHeight;
    const s = document.querySelector("section");
    const h = s ? s.getBoundingClientRect().height - vh : 0;
    return h > 0 ? h : 2.8 * vh;
  });
  for (const pct of [0, 25, 50, 75, 100]) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round((hold * pct) / 100));
    await sleep(700);
    await page.screenshot({ path: path.join(dir, `hero-${pct}.png`) });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function oneRun(browser, { pagePath, cpu, trace, shotsDir }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (trace) await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  await page.addInitScript(SAMPLER);
  await page.goto(URL_BASE + pagePath, { waitUntil: "load", timeout: 120_000 });
  // The homepage plays an intro; wait it out so every run starts from rest.
  await page
    .waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 30_000 })
    .catch(() => {});
  await sleep(1500);
  if (shotsDir) await heroShots(page, shotsDir);
  const result = {};
  for (const name of SCENARIOS) {
    result[name] = await scenario(page, cdp, name);
  }
  if (trace) await context.tracing.stop({ path: trace });
  await context.close();
  return result;
}

/* --------------------------------------------------------------------- main */

const browser = await chromium
  .launch({ channel: "chrome", headless: !HEADED })
  .catch(() => chromium.launch({ headless: !HEADED }));

const results = [];
const multi = PATHS.length * CPUS.length > 1;
let traceDone = false;
for (const pagePath of PATHS) {
  for (const cpu of CPUS) {
    const runs = [];
    for (let i = 0; i < RUNS + 1; i++) {
      const first = i === 1; // first measured run
      const trace = first && TRACE && !traceDone ? TRACE : "";
      if (trace) traceDone = true;
      const shotsDir =
        first && SHOTS ? (multi ? path.join(SHOTS, `${pagePath.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root"}-cpu${cpu}`) : SHOTS) : "";
      const r = await oneRun(browser, { pagePath, cpu, trace, shotsDir });
      if (i > 0) runs.push(r); // run 0 warms caches and is discarded
      process.stderr.write(`${pagePath} cpu${cpu} run ${i}${i === 0 ? " (warm-up, discarded)" : ""} done\n`);
    }

    const summary = {};
    const min = {};
    const max = {};
    let md = `\n### ${LABEL} — ${URL_BASE}${pagePath}, CPU ${cpu}x, median of ${RUNS}\n\n| scenario | ${cols.join(" | ")} |\n|---|${cols.map(() => "---").join("|")}|\n`;
    let noise = `\n| scenario | fps min–max | styleMs min–max | noise |\n|---|---|---|---|\n`;
    for (const name of SCENARIOS) {
      summary[name] = {};
      min[name] = {};
      max[name] = {};
      const cells = cols.map((c) => {
        const xs = runs.map((r) => r[name][c]);
        const v = median(xs);
        summary[name][c] = v;
        min[name][c] = Math.min(...xs);
        max[name][c] = Math.max(...xs);
        return fmt(v);
      });
      summary[name].endY = median(runs.map((r) => r[name].endY));
      md += `| ${name} | ${cells.join(" | ")} |\n`;
      const spread = (c) => (summary[name][c] ? (max[name][c] - min[name][c]) / summary[name][c] : 0);
      const noisy = spread("fps") > 0.25 || spread("styleMs") > 0.25;
      noise += `| ${name} | ${fmt(min[name].fps)}–${fmt(max[name].fps)} | ${fmt(min[name].styleMs)}–${fmt(max[name].styleMs)} | ${noisy ? "noisy" : "ok"} |\n`;
    }
    console.log(md + noise);
    results.push({ path: pagePath, cpu, summary, min, max, runs });
  }
}
await browser.close();

if (JSON_OUT) {
  const first = results[0];
  fs.writeFileSync(
    JSON_OUT,
    JSON.stringify({ label: LABEL, summary: first.summary, min: first.min, max: first.max, runs: first.runs, results, meta }, null, 2),
  );
}
