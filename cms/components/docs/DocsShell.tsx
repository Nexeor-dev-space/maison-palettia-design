"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * ==========================================================================
 * DocsShell — the Docs tab's contents list, search and reading column
 * ==========================================================================
 *
 * The chapter itself is rendered on the server and arrives as `children`;
 * this client half adds what needs the browser:
 *
 *   · SEARCH. The index (one entry per section, ~120 KB) is fetched from
 *     /admin-docs/search-index.json the first time someone focuses the box
 *     or presses "/", then searched in memory: every word must appear in the
 *     section's title, keywords or text; title hits rank first. While a
 *     search is active the contents list shows only the chapters and
 *     sections that match, and the reading column shows the results with the
 *     words highlighted. No library: the guide is small enough that a plain
 *     scan answers in well under a millisecond per keystroke.
 *   · HIGHLIGHT ON ARRIVAL. A result links to the section with `?hl=words`;
 *     the words are then marked in the chapter with the CSS Custom Highlight
 *     API — no DOM is rewritten, so React's tree is never disturbed. Browsers
 *     without it simply land on the section.
 *   · WHERE AM I. An IntersectionObserver (not a scroll listener — see the
 *     animation rules in CLAUDE.md) marks the section being read in the list.
 *   · "/" focuses the search from anywhere on the page; Esc clears it.
 */

const HIGHLIGHT_CSS = "::highlight(mpd-hit){background-color:var(--mp-lilac-soft);color:var(--mp-lilac-ink)}";

export type TocChapter = { slug: string; num: string; label: string; title: string; sections: Array<{ id: string; title: string }> };

type Entry = { c: string; a: string; ct: string; cl: string; t: string; k: string; x: string };
type Indexed = Entry & { ft: string; fk: string; fx: string };
type Result = { e: Indexed; score: number; snippet: string };

/** Lower case, accents off, curly quotes straight — one character in, one character out, so positions line up with the original. */
function fold(s: string): string {
  let out = "";
  for (const ch of s) {
    const base = ch.normalize("NFD")[0] ?? ch;
    const lower = base.toLowerCase();
    out += lower === "’" || lower === "‘" ? "'" : lower === "“" || lower === "”" ? '"' : lower.length === 1 ? lower : ch;
  }
  return out;
}

const wordsOf = (q: string) =>
  fold(q)
    .split(/\s+/)
    .map((w) => w.replace(/^["']+|["']+$/g, ""))
    .filter(Boolean);

function count(hay: string, needle: string, cap: number): number {
  let n = 0;
  let i = hay.indexOf(needle);
  while (i >= 0 && n < cap) {
    n++;
    i = hay.indexOf(needle, i + needle.length);
  }
  return n;
}

function search(index: Indexed[], q: string): Result[] {
  const words = wordsOf(q);
  if (!words.length) return [];
  const phrase = words.join(" ");
  const out: Result[] = [];
  for (const e of index) {
    let score = 0;
    let ok = true;
    for (const w of words) {
      const inT = e.ft.includes(w);
      const inK = e.fk.includes(w);
      const inX = count(e.fx, w, 6);
      if (!inT && !inK && !inX) {
        ok = false;
        break;
      }
      score += (inT ? 12 : 0) + (inK ? 4 : 0) + inX;
    }
    if (!ok) continue;
    if (e.ft.startsWith(words[0])) score += 6; // "Refund an order" before "Cancel a session and refund everyone"
    if (words.length > 1 && e.ft.includes(phrase)) score += 20;
    if (words.length > 1 && e.fx.includes(phrase)) score += 8;
    if (e.a === e.c) score -= 2; // a chapter's intro ranks just below its own sections
    out.push({ e, score, snippet: snippet(e.x, e.fx, words) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 50);
}

function snippet(x: string, fx: string, words: string[]): string {
  let at = -1;
  for (const w of words) {
    const i = fx.indexOf(w);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return x.slice(0, 160) + (x.length > 160 ? "…" : "");
  const start = Math.max(0, x.lastIndexOf(" ", Math.max(0, at - 60)) + 1);
  const end = Math.min(x.length, start + 190);
  return (start > 0 ? "…" : "") + x.slice(start, end).trim() + (end < x.length ? "…" : "");
}

/** Wrap every occurrence of the words in <mark>. */
function Marked({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const f = fold(text);
  const ranges: Array<[number, number]> = [];
  for (const w of words) {
    let i = f.indexOf(w);
    while (i >= 0) {
      ranges.push([i, i + w.length]);
      i = f.indexOf(w, i + w.length);
    }
  }
  if (!ranges.length) return <>{text}</>;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const r of ranges) {
    const last = merged.at(-1);
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  const parts: React.ReactNode[] = [];
  let pos = 0;
  merged.forEach(([s, e], i) => {
    if (s > pos) parts.push(text.slice(pos, s));
    parts.push(<mark key={i}>{text.slice(s, e)}</mark>);
    pos = e;
  });
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}

/** Marks the words inside the chapter with the CSS Custom Highlight API. Returns how many were marked. */
function highlightArticle(root: HTMLElement | null, words: string[]): number {
  const registry = (globalThis.CSS as unknown as { highlights?: Map<string, unknown> } | undefined)?.highlights;
  const HighlightCtor = (globalThis as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight;
  if (!registry || !HighlightCtor) return 0;
  registry.delete("mpd-hit");
  if (!root || !words.length) return 0;
  const ranges: Range[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node && ranges.length < 400; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    if (!text.trim()) continue;
    const f = fold(text);
    for (const w of words) {
      let i = f.indexOf(w);
      while (i >= 0) {
        const r = document.createRange();
        r.setStart(node, i);
        r.setEnd(node, i + w.length);
        ranges.push(r);
        i = f.indexOf(w, i + w.length);
      }
    }
  }
  if (ranges.length) registry.set("mpd-hit", new HighlightCtor(...ranges));
  return ranges.length;
}

export function DocsShell({
  toc,
  current,
  base,
  indexUrl,
  pdfHref,
  children,
}: {
  toc: TocChapter[];
  current: string | null;
  base: string;
  indexUrl: string;
  pdfHref: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const hl = params.get("hl") ?? "";

  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<Indexed[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [hlCount, setHlCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const articleRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLOListElement>(null);
  const loading = useRef(false);

  const loadIndex = useCallback(async () => {
    if (index || loading.current) return;
    loading.current = true;
    try {
      const res = await fetch(indexUrl, { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Entry[];
      setIndex(data.map((e) => ({ ...e, ft: fold(e.t), fk: fold(e.k + " " + e.ct), fx: fold(e.x) })));
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      loading.current = false;
    }
  }, [index, indexUrl]);

  const q = query.trim();
  const searching = q.length > 0;
  const results = useMemo(() => (index && searching ? search(index, q) : []), [index, q, searching]);
  const words = useMemo(() => wordsOf(q), [q]);
  const hlWords = useMemo(() => wordsOf(hl).filter((w) => w.length > 1), [hl]);

  /** Which anchors match, per chapter — the contents list shows only these while searching. */
  const matched = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of results) {
      if (!map.has(r.e.c)) map.set(r.e.c, new Set());
      map.get(r.e.c)!.add(r.e.a);
    }
    return map;
  }, [results]);

  // "/" focuses the search box from anywhere on the page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const t = event.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // The section being read, for the contents list.
  useEffect(() => {
    const root = articleRef.current;
    if (!root || !current) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-section]"));
    if (!targets.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set((e.target as HTMLElement).dataset.section ?? "", e.isIntersecting);
        const first = targets.find((t) => visible.get(t.dataset.section ?? ""));
        if (first) setActive(first.dataset.section ?? null);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [current]);

  // Highlight the words a search result brought the reader here for.
  useEffect(() => {
    const n = highlightArticle(articleRef.current, hlWords);
    setHlCount(n);
    return () => {
      highlightArticle(null, []);
    };
  }, [hlWords, current]);

  const clearHighlight = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("hl");
    router.replace(url.pathname + url.search + url.hash, { scroll: false });
  };

  const hrefOf = (e: Entry) => `${base}/${e.c}?hl=${encodeURIComponent(q)}${e.a === e.c ? "" : `#${e.a}`}`;

  const onSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (query) {
        event.preventDefault();
        setQuery("");
      } else inputRef.current?.blur();
    } else if (event.key === "ArrowDown" || (event.key === "Enter" && results.length)) {
      const first = resultsRef.current?.querySelector<HTMLAnchorElement>("a");
      if (first) {
        event.preventDefault();
        if (event.key === "Enter") first.click();
        else first.focus();
      }
    }
  };

  const onResultsKey = (event: React.KeyboardEvent<HTMLOListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = Array.from(resultsRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    event.preventDefault();
    if (event.key === "ArrowUp" && i === 0) inputRef.current?.focus();
    else links[Math.min(links.length - 1, Math.max(0, i + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
  };

  const afterPick = () => {
    setQuery("");
    setTocOpen(false);
  };

  const visibleToc = searching && index ? toc.filter((c) => matched.has(c.slug)) : toc;

  return (
    <div className="mpd-root mpd-layout">
      {/* Here rather than in docs.scss: the build's CSS parser rejects ::highlight(). Uses the admin's theme variables. */}
      <style dangerouslySetInnerHTML={{ __html: HIGHLIGHT_CSS }} />
      <aside className="mpd-aside" aria-label="Guide contents and search">
        <div className="mpd-search" role="search">
          <label htmlFor="mpd-q" className="mpd-sr">
            Search the guide
          </label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.2-4.2" />
          </svg>
          <input
            ref={inputRef}
            id="mpd-q"
            type="search"
            placeholder="Search the guide"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onFocus={loadIndex}
            onChange={(e) => {
              setQuery(e.target.value);
              void loadIndex();
            }}
            onKeyDown={onSearchKey}
            aria-controls="mpd-results"
            aria-describedby="mpd-search-hint"
          />
          <kbd aria-hidden="true">/</kbd>
        </div>
        <p id="mpd-search-hint" className="mpd-sr">
          Type to search every chapter. Press the down arrow to move to the results.
        </p>
        <button type="button" className="mpd-toc-toggle" aria-expanded={tocOpen} aria-controls="mpd-toc" onClick={() => setTocOpen((o) => !o)}>
          <span>Contents</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <nav id="mpd-toc" className={`mpd-toc${tocOpen ? " is-open" : ""}`} aria-label="Chapters">
          {searching && index ? (
            <p className="mpd-toc-status" aria-live="polite">
              {results.length ? `${results.length} ${results.length === 1 ? "match" : "matches"} in ${matched.size} ${matched.size === 1 ? "chapter" : "chapters"}` : "No matches"}
            </p>
          ) : null}
          <ol>
            {!searching ? (
              <li className={current === null ? "is-current" : undefined}>
                <Link href={base} className="mpd-toc-ch" aria-current={current === null ? "page" : undefined} prefetch={false} onClick={afterPick}>
                  <span className="mpd-toc-num">◆</span>
                  <span>Welcome</span>
                </Link>
              </li>
            ) : null}
            {visibleToc.map((c) => {
              const isCurrent = c.slug === current;
              const hits = matched.get(c.slug);
              const sections = searching && hits ? c.sections.filter((s) => hits.has(s.id)) : isCurrent ? c.sections : [];
              return (
                <li key={c.slug} className={isCurrent ? "is-current" : undefined}>
                  <Link
                    href={searching ? `${base}/${c.slug}?hl=${encodeURIComponent(q)}` : `${base}/${c.slug}`}
                    className="mpd-toc-ch"
                    aria-current={isCurrent && !searching ? "page" : undefined}
                    prefetch={false}
                    onClick={afterPick}
                  >
                    <span className="mpd-toc-num">{c.num}</span>
                    <span>{searching ? <Marked text={c.title} words={words} /> : c.title}</span>
                  </Link>
                  {sections.length ? (
                    <ul>
                      {sections.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={searching ? `${base}/${c.slug}?hl=${encodeURIComponent(q)}#${s.id}` : isCurrent ? `#${s.id}` : `${base}/${c.slug}#${s.id}`}
                            aria-current={!searching && isCurrent && active === s.id ? "location" : undefined}
                            prefetch={false}
                            onClick={afterPick}
                          >
                            {searching ? <Marked text={s.title} words={words} /> : s.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {pdfHref ? (
            <a className="mpd-pdf-link" href={pdfHref}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
              Download the PDF
            </a>
          ) : null}
        </nav>
      </aside>

      <div className="mpd-main">
        {searching ? (
          <section className="mpd-results" aria-labelledby="mpd-results-h">
            <h1 id="mpd-results-h" className="mpd-results-h">
              {index ? (
                results.length ? (
                  <>
                    {results.length} {results.length === 1 ? "place" : "places"} mention <q>{q}</q>
                  </>
                ) : (
                  <>
                    Nothing in the guide matches <q>{q}</q>
                  </>
                )
              ) : loadError ? (
                "The search could not load. Reload the page and try again."
              ) : (
                "Searching…"
              )}
            </h1>
            {index && !results.length ? <p className="mpd-muted">Try a simpler word, such as “refund”, “photo”, “price” or “email”.</p> : null}
            <ol id="mpd-results" ref={resultsRef} className="mpd-result-list" onKeyDown={onResultsKey}>
              {results.map((r) => (
                <li key={`${r.e.c}#${r.e.a}`}>
                  <Link href={hrefOf(r.e)} prefetch={false} onClick={afterPick}>
                    <span className="mpd-result-where">
                      {r.e.cl} · {r.e.ct}
                    </span>
                    <span className="mpd-result-title">
                      <Marked text={r.e.t} words={words} />
                    </span>
                    <span className="mpd-result-snippet">
                      <Marked text={r.snippet} words={words} />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <div className="mpd-article-wrap" hidden={searching}>
          {hl && hlWords.length ? (
            <p className="mpd-hl-bar" role="status">
              {hlCount ? (
                <>
                  Highlighting <q>{hl}</q> on this page.
                </>
              ) : (
                <>
                  Showing results for <q>{hl}</q>.
                </>
              )}
              <button type="button" className="mpd-ghost-btn" onClick={clearHighlight}>
                Clear
              </button>
            </p>
          ) : null}
          <div ref={articleRef}>{children}</div>
        </div>
      </div>
    </div>
  );
}
