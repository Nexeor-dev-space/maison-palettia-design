import Link from "next/link";
import React from "react";

import { chapterLabel, chapterNum, chapters, front, neighbours } from "@/cms/lib/docs/guide";
import type { Chapter, GuideRole } from "@/docs/admin-guide/content/types";

import { Blocks, imageUrl } from "./Blocks";
import { Inline, type LinkMode } from "./Inline";

/**
 * The Docs tab's two kinds of page, rendered on the server: the welcome
 * page (/admin/docs) and a chapter (/admin/docs/<slug>). DocsShell wraps
 * both with the contents list and the search.
 */

const ROLE_NAMES: Record<GuideRole, string> = { admin: "Admin", editor: "Editor", "front-desk": "Front desk" };

const SEVERITY = { red: "Act today", amber: "Act soon", green: "Small fix" } as const;

export function DocsHome({ base, pdf }: { base: string; pdf: { href: string; size: string; built: string } | null }) {
  const link: LinkMode = { mode: "web", base };
  return (
    <article className="mpd-article mpd-home">
      <header className="mpd-hero">
        <p className="mpd-eyebrow">{front.kicker}</p>
        <h1>
          <span className="mpd-script">{front.welcome.script}</span> <Inline text={front.welcome.headline} link={link} />
        </h1>
        <p className="mpd-lede">
          <Inline text={front.welcome.lede} link={link} />
        </p>
        <dl className="mpd-facts">
          {front.facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>
                <Inline text={f.value} link={link} />
              </dd>
            </div>
          ))}
        </dl>
        <div className="mpd-hero-actions">
          <Link className="mpd-btn mpd-btn--primary" href={`${base}/${chapters[0]?.slug ?? ""}`} prefetch={false}>
            Start reading
          </Link>
          {pdf ? (
            <a className="mpd-btn" href={pdf.href}>
              Download the PDF <span className="mpd-muted">· {pdf.size}</span>
            </a>
          ) : null}
        </div>
      </header>

      <section aria-labelledby="mpd-how-h" className="mpd-how">
        <h2 id="mpd-how-h">How to read this guide</h2>
        <ul>
          {front.howToRead
            .filter((h) => !/page numbers|ticking off/i.test(h.title))
            .map((h) => (
              <li key={h.title}>
                <h3>{h.title}</h3>
                <p>
                  <Inline text={h.text} link={link} />
                </p>
              </li>
            ))}
          <li>
            <h3>Search</h3>
            <p>
              Press <kbd>/</kbd> anywhere on these pages and type a word — “refund”, “photo”, “TRN”. Or press <kbd>⌘</kbd> <kbd>K</kbd> and type “guide”.
            </p>
          </li>
        </ul>
      </section>

      <section aria-labelledby="mpd-cards-h">
        <h2 id="mpd-cards-h">What&rsquo;s inside</h2>
        <ul className="mpd-cards">
          {chapters.map((c) => (
            <li key={c.slug} className={c.feature ? "is-feature" : undefined}>
              <Link href={`${base}/${c.slug}`} prefetch={false}>
                <span className="mpd-card-n">{chapterLabel(c)}</span>
                <span className="mpd-card-t">{c.title}</span>
                <span className="mpd-card-b">{c.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mpd-colophon">
        <span className="mpd-script">Maison Palettia</span>
        {front.colophon.map((p, i) => (
          <p key={i}>
            <Inline text={p} link={link} />
          </p>
        ))}
        {pdf ? <p className="mpd-muted">PDF edition printed {pdf.built}.</p> : null}
      </footer>
    </article>
  );
}

export function DocsChapter({ chapter, base, checklistKey }: { chapter: Chapter; base: string; checklistKey: string }) {
  const link: LinkMode = { mode: "web", base };
  const ctx = { link, checklistKey };
  const { prev, next } = neighbours(chapter.slug);
  return (
    <article className="mpd-article" aria-labelledby={`${chapter.slug}-h`}>
      <header className={`mpd-ch-head${chapter.feature ? " is-feature" : ""}`} id={chapter.slug}>
        <p className="mpd-eyebrow">{chapterLabel(chapter)}</p>
        <h1 id={`${chapter.slug}-h`}>{chapter.title}</h1>
        <p className="mpd-lede">
          <Inline text={chapter.lede} link={link} />
        </p>
        {chapter.roles.length ? (
          <p className="mpd-roles-line">
            For{" "}
            {chapter.roles.map((r) => (
              <span key={r} className="mpd-who">
                {ROLE_NAMES[r]}
              </span>
            ))}
          </p>
        ) : null}
      </header>

      {chapter.summary.length ? (
        <aside className="mpd-tldr" aria-label="In 30 seconds">
          <p className="mpd-tldr-h">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            In 30 seconds
          </p>
          <ul>
            {chapter.summary.map((s, i) => (
              <li key={i}>
                <Inline text={s} link={link} />
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      {chapter.intro?.length ? (
        <div className="mpd-flow">
          <Blocks blocks={chapter.intro} ctx={ctx} />
        </div>
      ) : null}

      {chapter.sections.map((s) => (
        <section key={s.id} id={s.id} data-section={s.id} className="mpd-section" aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`}>
            {s.severity ? <span className={`mpd-sev mpd-sev--${s.severity}`} aria-hidden="true" /> : null}
            <a href={`#${s.id}`} className="mpd-anchor">
              {s.title}
            </a>
          </h2>
          {s.hint || s.severity ? (
            <p className="mpd-hint">
              {s.severity ? <span className={`mpd-sev-label mpd-sev-label--${s.severity}`}>{SEVERITY[s.severity]}</span> : null}
              {s.hint}
            </p>
          ) : null}
          {s.path || s.who ? (
            <p className="mpd-meta">
              {s.path ? <Inline text={`{{${s.path}}}`} link={link} /> : null}
              {s.who ? <span className="mpd-who">{s.who}</span> : null}
            </p>
          ) : null}
          <div className="mpd-flow">
            <Blocks blocks={s.blocks} ctx={ctx} />
          </div>
        </section>
      ))}

      <nav className="mpd-pager" aria-label="Chapters">
        {prev ? (
          <Link href={`${base}/${prev.slug}`} rel="prev" prefetch={false}>
            <span className="mpd-pager-dir">← Previous</span>
            <span className="mpd-pager-t">
              {chapterNum(prev)} · {prev.title}
            </span>
          </Link>
        ) : (
          <Link href={base} rel="prev" prefetch={false}>
            <span className="mpd-pager-dir">← Welcome</span>
            <span className="mpd-pager-t">How to read this guide</span>
          </Link>
        )}
        {next ? (
          <Link href={`${base}/${next.slug}`} rel="next" prefetch={false} className="is-next">
            <span className="mpd-pager-dir">Next →</span>
            <span className="mpd-pager-t">
              {chapterNum(next)} · {next.title}
            </span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}

export { imageUrl };
