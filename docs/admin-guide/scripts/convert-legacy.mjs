#!/usr/bin/env node
/**
 * ==========================================================================
 * convert-legacy.mjs — one-off: the old single-page handbook → typed chapters
 * ==========================================================================
 *
 *   node docs/admin-guide/scripts/convert-legacy.mjs [--force]
 *
 * Reads docs/admin-guide/legacy/index.html (the October 2026 handbook that
 * the first PDF was printed from) and writes one TypeScript file per chapter
 * into docs/admin-guide/content/, plus front.ts and index.ts, in the model
 * described by content/types.ts. It also copies legacy/images/*.webp to
 * docs/admin-guide/images/.
 *
 * It refuses to overwrite existing chapter files unless --force is given:
 * after the first run the chapter files are the source of truth and are
 * edited by hand. Kept in the repo as a record of how the content got here;
 * it is not part of any build. Its input, docs/admin-guide/legacy/, was
 * removed once the conversion was done (everything it held now lives in
 * content/ and images/), so the script no longer runs as it stands.
 *
 * Anything the converter does not recognise is reported on stderr with the
 * chapter and the element, and kept as a paragraph of its text, so nothing
 * is silently dropped. At the end it prints a word count of the legacy page
 * and of the generated content, which should match closely.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Window } from "happy-dom";

const here = path.dirname(fileURLToPath(import.meta.url));
const GUIDE = path.resolve(here, "..");
const LEGACY = path.join(GUIDE, "legacy", "index.html");
const OUT = path.join(GUIDE, "content");
const IMAGES_IN = path.join(GUIDE, "legacy", "images");
const IMAGES_OUT = path.join(GUIDE, "images");
const force = process.argv.includes("--force");

const win = new Window();
win.document.write(fs.readFileSync(LEGACY, "utf8"));
const doc = win.document;

const problems = [];
const warn = (where, msg) => problems.push(`${where}: ${msg}`);

// ─── inline: DOM nodes → the guide's inline markup ─────────────────────────

const escapeText = (s) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/`/g, "\\`")
    .replace(/\[/g, "\\[")
    .replace(/\{\{/g, "\\{{")
    .replace(/\(\((?=\d+\)\))/g, "\\((")
    .replace(/<</g, "\\<<");

const tidy = (s) => s.replace(/\s+/g, " ").trim();

function inline(node, where) {
  let out = "";
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      out += escapeText(child.textContent.replace(/\s+/g, " "));
      continue;
    }
    if (child.nodeType !== 1) continue;
    const el = child;
    const tag = el.tagName.toLowerCase();
    const cls = el.classList;
    if (tag === "svg") continue;
    if (tag === "br") { out += " "; continue; }
    if (tag === "span" && cls.contains("c")) { out += `((${tidy(el.textContent)}))`; continue; }
    if (tag === "span" && cls.contains("path")) {
      out += `{{${pathOf(el)}}}`;
      continue;
    }
    if (tag === "b" && cls.contains("ui")) { out += `[[${tidy(el.textContent)}]]`; continue; }
    if (tag === "b" || tag === "strong") { out += `**${inline(el, where).trim()}**`; continue; }
    if (tag === "em" || tag === "i") { out += `*${inline(el, where).trim()}*`; continue; }
    if (tag === "code") { out += "`" + el.textContent.replace(/`/g, "\\`") + "`"; continue; }
    if (tag === "kbd") { out += `<<${tidy(el.textContent)}>>`; continue; }
    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      out += `[${inline(el, where).trim()}](${href})`;
      continue;
    }
    if (tag === "span" && (cls.contains("yes") || cls.contains("no") || cls.contains("part"))) { out += escapeText(el.textContent); continue; }
    if (tag === "span" && cls.contains("sev")) continue;
    if (tag === "span" || tag === "small" || tag === "label" || tag === "div" || tag === "p") { out += inline(el, where); continue; }
    warn(where, `unknown inline <${tag} class="${el.className}">, kept its text`);
    out += escapeText(el.textContent);
  }
  return out.replace(/\s+/g, " ");
}

const inl = (el, where) => (el ? tidy(inline(el, where)) : "");

/** A `.path` pill ("Settings<i>›</i>Staff") as "Settings > Staff". */
function pathOf(el) {
  const parts = [];
  let cur = "";
  for (const n of el.childNodes) {
    if (n.nodeType === 1 && n.tagName.toLowerCase() === "i") {
      parts.push(cur);
      cur = "";
    } else cur += n.textContent;
  }
  parts.push(cur);
  return parts.map(tidy).join(" > ");
}

// ─── blocks ────────────────────────────────────────────────────────────────

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

function screenshot(fig, where) {
  const img = fig.querySelector("img");
  const btn = fig.querySelector(".zoom");
  const file = path.basename(img.getAttribute("src"));
  const caption = inl(fig.querySelector(".cap"), where);
  const alt = tidy(img.getAttribute("alt") || "");
  const callouts = [...fig.querySelectorAll("ol.legend > li")].map((li) => ({
    n: Number(tidy(li.querySelector(".c").textContent)),
    label: inl(li.querySelectorAll(":scope > span")[1], where),
  }));
  const shot = { type: "screenshot", file, width: num(img.getAttribute("width")), height: num(img.getAttribute("height")), caption };
  const plainCaption = tidy(fig.querySelector(".cap")?.textContent || "");
  if (alt && alt !== plainCaption) shot.alt = alt;
  const title = btn?.getAttribute("data-title");
  if (title) shot.title = title;
  shot.callouts = callouts;
  if (fig.classList.contains("shot--phone")) shot.phone = true;
  const mw = /max-width:\s*(\d+)px/.exec(fig.getAttribute("style") || "");
  if (mw) shot.maxWidth = Number(mw[1]);
  if (!fs.existsSync(path.join(IMAGES_IN, file))) warn(where, `image ${file} is missing`);
  return shot;
}

const NOTE_DEFAULTS = { tip: "Tip", warning: "Good to know", never: "Never do this", info: "Note" };

function note(el, where) {
  const kind = el.classList.contains("tip") ? "tip" : el.classList.contains("warn") ? "warning" : el.classList.contains("never") ? "never" : "info";
  const title = tidy(el.querySelector(":scope > .t")?.textContent || "");
  const body = el.querySelector(":scope > .b");
  const ps = [...body.querySelectorAll(":scope > p")];
  const text = ps.length ? ps.map((p) => inl(p, where)) : [inl(body, where)];
  const block = { type: kind };
  if (title && title !== NOTE_DEFAULTS[kind]) block.title = title;
  block.text = text;
  return block;
}

function table(wrap, where) {
  const t = wrap.querySelector("table");
  return {
    type: "table",
    head: [...t.querySelectorAll("thead th")].map((th) => inl(th, where)),
    rows: [...t.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map((td) => inl(td, where))),
  };
}

function roleMatrix(wrap, where) {
  const t = wrap.querySelector("table");
  const roles = [...t.querySelectorAll("thead th")].slice(1).map((th) => tidy(th.textContent));
  const groups = [];
  for (const tr of t.querySelectorAll("tbody tr")) {
    const groupTh = tr.querySelector("th[colspan]");
    if (groupTh) { groups.push({ title: tidy(groupTh.textContent), rows: [] }); continue; }
    if (!groups.length) groups.push({ title: "", rows: [] });
    const [jobTd, ...cellTds] = [...tr.children];
    const cells = cellTds.map((td) => {
      const value = td.querySelector(".yes") ? "yes" : td.querySelector(".part") ? "view" : "no";
      const noteEl = td.querySelector(".role-note");
      const n = noteEl ? tidy(noteEl.textContent) : "";
      return n && !(value === "view" && n === "View") ? { value, note: n } : value;
    });
    groups.at(-1).rows.push({ job: inl(jobTd, where), cells });
  }
  return { type: "roleMatrix", roles, groups };
}

function mock(el) {
  const clone = el.cloneNode(true);
  const labelEl = clone.querySelector(":scope > .mock-label");
  const label = labelEl ? tidy(labelEl.textContent) : (el.getAttribute("aria-label") || undefined);
  labelEl?.remove();
  const html = clone.innerHTML.replace(/\s+/g, " ").replace(/> </g, "><").trim();
  return label ? { type: "mock", label, html } : { type: "mock", html };
}

function routine(el, where) {
  return {
    type: "routine",
    columns: [...el.querySelectorAll(":scope > section")].map((sec) => {
      const h3 = sec.querySelector("h3");
      const small = h3.querySelector("small");
      const when = small ? tidy(small.textContent) : "";
      small?.remove();
      return {
        title: tidy(h3.textContent),
        when,
        items: [...sec.querySelectorAll("li")].map((li) => {
          const div = li.querySelector("div") || li;
          const sm = div.querySelector("small");
          const noteText = sm ? inl(sm, where) : undefined;
          sm?.remove();
          const item = { text: inl(div, where) };
          if (noteText) item.note = noteText;
          return item;
        }),
      };
    }),
  };
}

function timeline(el, where) {
  return {
    type: "timeline",
    items: [...el.querySelectorAll(":scope > li")].map((li) => {
      const what = li.querySelector(".what");
      const ps = [...what.querySelectorAll(":scope > p")];
      return { when: tidy(li.querySelector(".when").textContent), title: tidy(what.querySelector("h4").textContent), text: ps.map((p) => inl(p, where)).join(" ") };
    }),
  };
}

function checklist(el, where) {
  return {
    type: "checklist",
    id: "day-one",
    steps: [...el.querySelectorAll("li.cl-step")].map((li) => {
      const step = { title: tidy(li.querySelector("h3").textContent) };
      const time = li.querySelector(".time");
      if (time) step.time = tidy(time.textContent);
      const p = li.querySelector(".where .path");
      if (p) step.where = pathOf(p);
      step.items = [...li.querySelectorAll(".cl-items input")].map((input) => ({
        id: input.id,
        text: inl(input.parentElement.querySelector("span"), where),
      }));
      return step;
    }),
  };
}

/** Convert one element into zero or more blocks. */
function blocks(el, where) {
  const tag = el.tagName.toLowerCase();
  const cls = el.classList;
  if (tag === "ol" && cls.contains("steps")) return [{ type: "steps", items: [...el.querySelectorAll(":scope > li")].map((li) => inl(li, where)) }];
  if (tag === "ul" && cls.contains("plain")) return [{ type: "list", items: [...el.querySelectorAll(":scope > li")].map((li) => inl(li, where)) }];
  if (tag === "figure" && cls.contains("shot")) return [screenshot(el, where)];
  if (tag === "div" && cls.contains("phones")) return [{ type: "phones", shots: [...el.querySelectorAll("figure.shot")].map((f) => screenshot(f, where)) }];
  if (tag === "div" && cls.contains("note")) return [note(el, where)];
  if (tag === "div" && cls.contains("roles-wrap")) return [roleMatrix(el, where)];
  if (tag === "div" && cls.contains("table-wrap")) return [table(el, where)];
  if (tag === "div" && cls.contains("mock")) return [mock(el)];
  if (tag === "div" && cls.contains("routine")) return [routine(el, where)];
  if (tag === "ol" && cls.contains("timeline")) return [timeline(el, where)];
  if (tag === "p" && cls.contains("legend-strip")) return [{ type: "legend", items: [...el.querySelectorAll(":scope > span")].map((s) => inl(s, where)) }];
  if (tag === "p") return [{ type: "paragraph", text: inl(el, where) }];
  if (tag === "h4") return [{ type: "heading", text: tidy(el.textContent) }];
  if (tag === "div" && cls.contains("body")) return [...el.children].flatMap((c) => blocks(c, where));
  if (tag === "div" && el.querySelector(":scope > .note")) return [...el.children].flatMap((c) => blocks(c, where));
  warn(where, `unknown block <${tag} class="${el.className}" id="${el.id}">, kept as a paragraph of its text`);
  return [{ type: "paragraph", text: inl(el, where) }];
}

// ─── chapters ──────────────────────────────────────────────────────────────

const blurbs = new Map([...doc.querySelectorAll("ul.cards li a")].map((a) => [a.getAttribute("href").slice(1), tidy(a.querySelector("p").textContent)]));

/** Sections the old page kept outside an <article>, given a title of their own. */
const LOOSE_TITLES = { "photo-rules": "Photos you may use", tracking: "Visitor counting and tracking" };

const chapters = [];
for (const ch of doc.querySelectorAll("main section.chapter")) {
  const id = ch.id;
  const head = ch.querySelector(".chapter-head");
  const eyebrow = tidy(head.querySelector(".eyebrow").textContent);
  const m = /^Chapter (\d+)$/.exec(eyebrow);
  const chapter = {
    slug: id,
    number: m ? Number(m[1]) : null,
  };
  if (!m) chapter.eyebrow = eyebrow;
  chapter.title = tidy(head.querySelector("h2").textContent);
  chapter.lede = inl(head.querySelector(".lede"), id);
  chapter.blurb = blurbs.get(id) || "";
  if (!chapter.blurb) warn(id, "no contents-card blurb");
  chapter.summary = [...ch.querySelectorAll(":scope > .tldr li")].map((li) => inl(li, id));
  chapter.roles = [];
  chapter.keywords = ch.getAttribute("data-keywords") || undefined;
  if (ch.classList.contains("feature")) chapter.feature = true;
  const intro = [];
  const sections = [];

  for (const el of ch.children) {
    const tag = el.tagName.toLowerCase();
    if (tag === "header" || tag === "nav" || el.classList.contains("tldr")) continue;
    if (tag === "article") {
      const where = `${id}#${el.id}`;
      const section = { id: el.id, title: tidy(el.querySelector(":scope > h3").textContent) };
      const meta = el.querySelector(":scope > .task-meta");
      if (meta) {
        const p = meta.querySelector(".path");
        if (p) section.path = pathOf(p);
        const w = meta.querySelector(".who");
        if (w) section.who = tidy(w.textContent);
      }
      const kw = el.getAttribute("data-keywords");
      if (kw) section.keywords = kw;
      section.blocks = [];
      for (const c of el.children) {
        if (c.tagName.toLowerCase() === "h3" || c.classList.contains("task-meta")) continue;
        section.blocks.push(...blocks(c, where));
      }
      sections.push(section);
      continue;
    }
    if (el.id === "day-one-list") {
      sections.push({ id: "day-one-list", title: "The ten steps", blocks: [checklist(el, id)] });
      continue;
    }
    if (el.id === "fixes") {
      for (const d of el.querySelectorAll("details.fix")) {
        const where = `${id}#${d.id}`;
        const sev = d.querySelector(".sev");
        const small = d.querySelector("summary small");
        const section = {
          id: d.id,
          title: tidy(d.querySelector(".symptom").textContent),
        };
        if (small) section.hint = tidy(small.textContent);
        section.severity = sev.classList.contains("r") ? "red" : sev.classList.contains("a") ? "amber" : "green";
        section.blocks = [...d.querySelector(".body").children].flatMap((c) => blocks(c, where));
        sections.push(section);
      }
      continue;
    }
    if (el.id === "glossary-list") {
      sections.push({
        id: "glossary-list",
        title: "Glossary",
        blocks: [{ type: "glossary", items: [...el.querySelectorAll("dl.glossary > div")].map((div) => ({ term: tidy(div.querySelector("dt").textContent), definition: inl(div.querySelector("dd"), id) })) }],
      });
      continue;
    }
    if (el.id === "faq") {
      sections.push({
        id: "faq",
        title: tidy(el.querySelector("h3").textContent),
        blocks: [
          {
            type: "faq",
            items: [...el.querySelectorAll("details.faq")].map((d) => ({
              q: tidy(d.querySelector("summary").textContent),
              blocks: [...d.querySelector(".body").children].flatMap((c) => blocks(c, `${id}#faq`)),
            })),
          },
        ],
      });
      continue;
    }
    if (el.classList.contains("legend-strip") && id === "troubleshooting") continue; // the severity key is drawn beside each problem
    if (LOOSE_TITLES[el.id]) {
      sections.push({ id: el.id, title: LOOSE_TITLES[el.id], blocks: blocks(el, `${id}#${el.id}`) });
      continue;
    }
    if (sections.length === 0) {
      intro.push(...blocks(el, id));
      continue;
    }
    warn(id, `loose <${tag} class="${el.className}" id="${el.id}"> after the sections — added to the last section`);
    sections.at(-1).blocks.push(...blocks(el, id));
  }
  if (intro.length) chapter.intro = intro;
  chapter.sections = sections;
  chapters.push(chapter);
}

// ─── front matter ──────────────────────────────────────────────────────────

const hero = doc.querySelector("section.hero");
const h1 = hero.querySelector("h1").cloneNode(true);
const script = tidy(h1.querySelector(".script").textContent);
h1.querySelector(".script").remove();
const front = {
  title: "Admin Guide",
  kicker: tidy(hero.querySelector(".hero-kicker").textContent),
  welcome: { script, headline: inl(h1, "front"), lede: inl(hero.querySelector(".hero-lede"), "front") },
  facts: [...hero.querySelectorAll(".hero-facts > div")].map((d) => ({ label: tidy(d.querySelector("dt").textContent), value: inl(d.querySelector("dd"), "front") })),
  howToRead: [...doc.querySelectorAll(".pintro-how > div")].map((d) => ({ title: tidy(d.querySelector("h3").textContent), text: inl(d.querySelector("p"), "front") })),
  colophon: [...doc.querySelectorAll("footer.colophon p")].map((p) => inl(p, "front")),
  edition: "October 2026",
};

// ─── write ─────────────────────────────────────────────────────────────────

/** A JS object literal with bare keys — reads like hand-written TS. */
function lit(value, indent = "") {
  const next = indent + "  ";
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const flat = value.every((v) => typeof v !== "object" || v === null);
    const parts = value.map((v) => lit(v, next));
    const oneLine = `[${parts.join(", ")}]`;
    if (flat && oneLine.length + indent.length < 110) return oneLine;
    return `[\n${parts.map((p) => next + p).join(",\n")},\n${indent}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    const parts = entries.map(([k, v]) => `${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${lit(v, next)}`);
    const oneLine = `{ ${parts.join(", ")} }`;
    if (!oneLine.includes("\n") && oneLine.length + indent.length < 110) return oneLine;
    return `{\n${parts.map((p) => next + p).join(",\n")},\n${indent}}`;
  }
  return JSON.stringify(value);
}

fs.mkdirSync(OUT, { recursive: true });
const files = [];
chapters.forEach((chapter, i) => {
  const base = `${String(i + 1).padStart(2, "0")}-${chapter.slug}`;
  const name = `${base}.ts`;
  const varName = chapter.slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  files.push({ base, varName });
  const file = path.join(OUT, name);
  if (fs.existsSync(file) && !force) { console.log(`skip  ${name} (exists; --force to overwrite)`); return; }
  fs.writeFileSync(file, `import type { Chapter } from "./types";\n\nexport const ${varName}: Chapter = ${lit(chapter)};\n`);
  console.log(`wrote ${name}`);
});

const frontFile = path.join(OUT, "front.ts");
if (!fs.existsSync(frontFile) || force) {
  fs.writeFileSync(frontFile, `import type { GuideFront } from "./types";\n\nexport const front: GuideFront = ${lit(front)};\n`);
  console.log("wrote front.ts");
}

const indexFile = path.join(OUT, "index.ts");
if (!fs.existsSync(indexFile) || force) {
  fs.writeFileSync(
    indexFile,
    `/**\n * The guide, in reading order. Add a chapter: create its file, import it here, put it in the list.\n */\n` +
      files.map((f) => `import { ${f.varName} } from "./${f.base}";`).join("\n") +
      `\nimport type { Chapter } from "./types";\n\nexport { front } from "./front";\nexport type * from "./types";\n\nexport const chapters: Chapter[] = [\n${files.map((f) => `  ${f.varName},`).join("\n")}\n];\n`,
  );
  console.log("wrote index.ts");
}

fs.mkdirSync(IMAGES_OUT, { recursive: true });
let copied = 0;
for (const f of fs.readdirSync(IMAGES_IN)) {
  if (!f.endsWith(".webp")) continue;
  const dest = path.join(IMAGES_OUT, f);
  if (!fs.existsSync(dest)) { fs.copyFileSync(path.join(IMAGES_IN, f), dest); copied++; }
}
console.log(`images: copied ${copied} new file(s) to images/`);

// ─── checks ────────────────────────────────────────────────────────────────

const used = new Set();
const walk = (v) => {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === "object") { if (v.type === "screenshot") used.add(v.file); Object.values(v).forEach(walk); }
};
walk(chapters);
const all = fs.readdirSync(IMAGES_IN).filter((f) => f.endsWith(".webp"));
const unused = all.filter((f) => !used.has(f));
if (unused.length) warn("images", `not used by any chapter: ${unused.join(", ")}`);
console.log(`screenshots referenced: ${used.size} of ${all.length}`);

const words = (s) => (s.match(/[A-Za-z0-9’']+/g) || []).length;
const legacyMain = doc.querySelector("main").cloneNode(true);
legacyMain.querySelectorAll(".print-only, .hero, .cards, .cards-head, .colophon, .empty-search, svg, .checklist-head").forEach((e) => e.remove());
const strip = (s) => s.replace(/\\(.)/g, "$1").replace(/\*\*|\[\[|\]\]|\{\{|\}\}|\(\(|\)\)|<<|>>|`/g, " ");
const textOf = (v) => (Array.isArray(v) ? v.map(textOf).join(" ") : v && typeof v === "object" ? Object.entries(v).filter(([k]) => !["type", "file", "id", "slug", "html", "alt", "width", "height"].includes(k)).map(([, x]) => textOf(x)).join(" ") + (v.html ? " " + v.html.replace(/<[^>]+>/g, " ") : "") : typeof v === "string" ? strip(v) : "");
console.log(`words: legacy chapters ≈ ${words(legacyMain.textContent)}, converted ≈ ${words(textOf(chapters))}`);

if (problems.length) {
  console.error(`\n${problems.length} thing(s) to tidy by hand:`);
  for (const p of problems) console.error("  · " + p);
}
await win.happyDOM.close();
