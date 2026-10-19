import React from "react";

import { chapterLabel, chapters, front } from "@/cms/lib/docs/guide";
import { PRODUCTION_ORIGIN } from "@/lib/siteOrigin";

import { Blocks, imageUrl } from "./Blocks";
import { Inline, type LinkMode } from "./Inline";

/**
 * ==========================================================================
 * /admin/docs/print — every chapter on A4, the source of the PDF
 * ==========================================================================
 *
 * Rendered without the admin chrome. scripts/build-admin-guide-pdf.mjs
 * opens it in Chrome, prints it once to learn which page each chapter and
 * section landed on (from the PDF's named destinations — every heading is
 * linked from the contents, so Chrome records one for each), writes those
 * numbers into the `data-pg-for` slots, and prints again.
 *
 * Anyone can also press ⌘P on this page: they get the same layout, just
 * without the page numbers in the contents.
 *
 * Page furniture: the cover, the welcome and the contents are full pages;
 * every chapter starts on a new page with its own opener; screenshots,
 * notes and mocks never split across pages; backgrounds print. Running
 * header and footer are CSS page-margin boxes (marginBoxes below; the cover
 * has no margin, so it has none).
 */

const link: LinkMode = { mode: "print" };

/** The live admin's address, printed on the cover and in every page footer. */
const ADMIN_URL = `${PRODUCTION_ORIGIN}/admin`;
const ADMIN_HOST = ADMIN_URL.replace(/^https?:\/\//, "");

/**
 * Running header and footer as CSS page-margin boxes. Written here rather
 * than in docs.scss because the edition is data, and the build's CSS parser
 * is not needed for a rule only Chrome's print engine reads. The page context
 * does not see the admin's custom properties, so the font and grey are
 * spelled out (the grey is --mp-ink-muted).
 */
function marginBoxes(edition: string): string {
  const q = (s: string) => JSON.stringify(s);
  const box = "font-family:Montserrat,-apple-system,'Segoe UI',sans-serif;font-size:7.5pt;color:rgb(102 96 90);";
  return `@page mpd-guide{
@top-left{content:${q("Maison Palettia · Admin Guide")};${box}font-weight:600;letter-spacing:.04em;vertical-align:bottom;padding-bottom:4mm}
@top-right{content:${q(`Edition ${edition}`)};${box}vertical-align:bottom;padding-bottom:4mm}
@bottom-left{content:${q(`${ADMIN_URL}  ·  Docs in the menu, or press / to search`)};${box}vertical-align:top;padding-top:4mm}
@bottom-right{content:counter(page) " / " counter(pages);${box}font-weight:600;vertical-align:top;padding-top:4mm}
}`;
}

export function DocsPrint({ edition, cover }: { edition: string; cover: string | null }) {
  const ctx = { link, print: true, checklistKey: "print" };
  return (
    <div className="mpd-root mpd-print" data-edition={edition}>
      <style dangerouslySetInnerHTML={{ __html: marginBoxes(edition) }} />
      <section className="mpd-p-cover" aria-label="Cover">
        <div className="mpd-p-band">
          <p className="mpd-p-brand">
            <span className="mpd-p-mark" aria-hidden="true">
              P
            </span>
            <span>
              <b>Maison Palettia</b>
              <small>{front.kicker.replace(/^Maison Palettia\s*·\s*/, "")}</small>
            </span>
          </p>
          <div className="mpd-p-title">
            <p className="mpd-script">Maison Palettia</p>
            <h1>
              Admin <b>Guide</b>
            </h1>
            <p className="mpd-p-sub">
              Everything you and your team need to run the studio&rsquo;s website: pages and photos, sessions and bookings, check-in at the door, emails, payments and settings. Step by step, with real screenshots.
            </p>
          </div>
        </div>
        {cover ? (
          <div className="mpd-p-window">
            <div className="mpd-p-chrome" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>{ADMIN_HOST} · your dashboard</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed-in asset route, see Blocks.tsx */}
            <img src={imageUrl(cover, true)} alt="" />
          </div>
        ) : null}
        <div className="mpd-p-foot">
          <span>
            <b>Edition</b>
            {edition}
          </span>
          <span>
            <b>For</b>The owner and studio team
          </span>
          <span>
            <b>Your admin</b>
            {ADMIN_HOST}
          </span>
        </div>
      </section>

      <section className="mpd-p-welcome" aria-labelledby="mpd-p-welcome-h">
        <p className="mpd-eyebrow">{front.kicker}</p>
        <h2 id="mpd-p-welcome-h">
          <span className="mpd-script">{front.welcome.script}</span> <Inline text={front.welcome.headline} link={link} />
        </h2>
        <p className="mpd-lede">
          <Inline text={front.welcome.lede} link={link} />
        </p>
        <h3 className="mpd-p-sub-h">How to read this guide</h3>
        <ul className="mpd-p-how">
          {front.howToRead.map((h) => (
            <li key={h.title}>
              <h4>{h.title}</h4>
              <p>
                <Inline text={h.text} link={link} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <nav className="mpd-p-toc" aria-labelledby="mpd-p-toc-h">
        <p className="mpd-script">Contents</p>
        <h2 id="mpd-p-toc-h">What&rsquo;s inside</h2>
        <ol>
          {chapters.map((c) => (
            <li key={c.slug} className={c.feature ? "is-feature" : undefined}>
              <a className="mpd-p-toc-row" href={`#${c.slug}`}>
                <span className="mpd-p-toc-n">{chapterLabel(c).toUpperCase().replace("CHAPTER", "CH")}</span>
                <span className="mpd-p-toc-t">
                  <b>{c.title}</b>
                  <small>{c.blurb}</small>
                </span>
                <span className="mpd-pg-num" data-pg-for={c.slug} />
              </a>
              {c.sections.length > 1 ? (
                <ol className="mpd-p-toc-subs">
                  {c.sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`}>
                        <span>{s.title}</span>
                        <span className="mpd-pg-num" data-pg-for={s.id} />
                      </a>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      {chapters.map((c) => (
        <section key={c.slug} className={`mpd-p-chapter${c.feature ? " is-feature" : ""}`} id={c.slug} aria-labelledby={`${c.slug}-h`}>
          <header className="mpd-p-opener">
            <p className="mpd-eyebrow">{chapterLabel(c)}</p>
            <h2 id={`${c.slug}-h`}>{c.title}</h2>
            <p className="mpd-lede">
              <Inline text={c.lede} link={link} />
            </p>
            {c.summary.length ? (
              <div className="mpd-tldr">
                <p className="mpd-tldr-h">In 30 seconds</p>
                <ul>
                  {c.summary.map((s, i) => (
                    <li key={i}>
                      <Inline text={s} link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {c.sections.length > 1 ? (
              <div className="mpd-p-inthis">
                <p>In this chapter</p>
                <ol>
                  {c.sections.map((s) => (
                    <li key={s.id}>
                      <span>{s.title}</span>
                      <span className="mpd-pg-num" data-pg-for={s.id} />
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </header>
          {c.intro?.length ? (
            <div className="mpd-flow">
              <Blocks blocks={c.intro} ctx={ctx} />
            </div>
          ) : null}
          {c.sections.map((s) => (
            <section key={s.id} id={s.id} className="mpd-section" aria-labelledby={`${s.id}-h`}>
              <h3 id={`${s.id}-h`}>
                {s.severity ? <span className={`mpd-sev mpd-sev--${s.severity}`} aria-hidden="true" /> : null}
                {s.title}
              </h3>
              {s.hint ? <p className="mpd-hint">{s.hint}</p> : null}
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
        </section>
      ))}

      <footer className="mpd-p-colophon">
        <span className="mpd-p-mark" aria-hidden="true">
          P
        </span>
        <span className="mpd-script">Maison Palettia</span>
        {front.colophon.map((p, i) => (
          <p key={i}>
            <Inline text={p} link={link} />
          </p>
        ))}
      </footer>
    </div>
  );
}
