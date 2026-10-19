import React from "react";

import type { Block, RoleCell, Screenshot } from "@/docs/admin-guide/content/types";

import { inlineText } from "@/cms/lib/docs/inline";

import { Checklist } from "./Checklist";
import { Inline, type LinkMode } from "./Inline";

/**
 * Renders a list of guide blocks (docs/admin-guide/content/types.ts) for the
 * Docs tab and the print layout. Server component; the only client parts
 * are the checklist (ticks) and the lightbox, which finds the screenshots
 * by their `data-zoom` buttons.
 */

export const ASSET_BASE = "/admin-docs";
/**
 * Where a screenshot is served. The print layout asks for JPEG: Chrome copies
 * a JPEG into the PDF as it is, but re-encodes WebP losslessly — the same 100
 * screenshots make a ~60 MB PDF as WebP and a fraction of that as JPEG.
 */
export const imageUrl = (file: string, forPrint = false) => `${ASSET_BASE}/images/${encodeURIComponent(file)}${forPrint ? "?format=jpeg" : ""}`;

type Ctx = { link: LinkMode; checklistKey?: string; print?: boolean };

const NOTE_TITLES = { tip: "Tip", warning: "Good to know", never: "Never do this", info: "Note" } as const;

function NoteIcon({ kind }: { kind: keyof typeof NOTE_TITLES }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "tip")
    return (
      <svg {...common}>
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
      </svg>
    );
  if (kind === "warning")
    return (
      <svg {...common}>
        <path d="M12 3 2 20h20L12 3z" />
        <path d="M12 10v4M12 17h.01" />
      </svg>
    );
  if (kind === "never")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m5.6 5.6 12.8 12.8" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h.01" />
    </svg>
  );
}

export function Shot({ shot, ctx }: { shot: Screenshot; ctx: Ctx }) {
  const alt = shot.alt ?? inlineText(shot.caption);
  const style = shot.maxWidth ? ({ "--mpd-shot-max": `${shot.maxWidth}px` } as React.CSSProperties) : undefined;
  const img = (
    // Plain <img>: the files are behind the signed-in asset route, and next/image's optimiser would fetch them without the cookie.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl(shot.file, ctx.print)} width={Math.round(shot.width)} height={Math.round(shot.height)} alt={alt} loading={ctx.print ? "eager" : "lazy"} decoding="async" />
  );
  return (
    <figure className={`mpd-shot${shot.phone ? " mpd-shot--phone" : ""}`} style={style}>
      {ctx.print ? (
        <div className="mpd-shot-frame">{img}</div>
      ) : (
        <button type="button" className="mpd-shot-frame" data-zoom={imageUrl(shot.file)} data-title={shot.title ?? ""} aria-label={`Enlarge: ${shot.title ?? alt}`}>
          {img}
          <span className="mpd-zoom-hint" aria-hidden="true">
            Click to enlarge
          </span>
        </button>
      )}
      <figcaption>
        <p className="mpd-cap">
          <Inline text={shot.caption} link={ctx.link} />
        </p>
        {shot.callouts.length ? (
          <ol className="mpd-legend">
            {shot.callouts.map((c) => (
              <li key={c.n}>
                <span className="mpd-c" aria-label={`callout ${c.n}`}>
                  {c.n}
                </span>
                <span>
                  <Inline text={c.label} link={ctx.link} />
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </figcaption>
    </figure>
  );
}

function Cell({ cell, role }: { cell: RoleCell; role: string }) {
  const value = typeof cell === "string" ? cell : cell.value;
  const note = typeof cell === "string" ? (cell === "view" ? "View" : "") : cell.note;
  const label = value === "yes" ? "Yes" : value === "view" ? "Can look, not change" : "No";
  return (
    <td data-role={role}>
      <span className={`mpd-rm mpd-rm--${value}`} aria-label={label}>
        {value === "yes" ? "✓" : value === "view" ? "◐" : "—"}
      </span>
      {note ? <span className="mpd-rm-note">{note}</span> : null}
    </td>
  );
}

function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  const L = (text: string) => <Inline text={text} link={ctx.link} />;
  switch (block.type) {
    case "paragraph":
      return <p>{L(block.text)}</p>;
    case "heading":
      return <h3 className="mpd-h3">{block.text}</h3>;
    case "steps":
      return (
        <ol className="mpd-steps">
          {block.items.map((item, i) => (
            <li key={i}>{L(item)}</li>
          ))}
        </ol>
      );
    case "list":
      return (
        <ul className="mpd-list">
          {block.items.map((item, i) => (
            <li key={i}>{L(item)}</li>
          ))}
        </ul>
      );
    case "screenshot":
      return <Shot shot={block} ctx={ctx} />;
    case "phones":
      return (
        <div className="mpd-phones">
          {block.shots.map((s) => (
            <Shot key={s.file} shot={{ ...s, phone: true }} ctx={ctx} />
          ))}
        </div>
      );
    case "tip":
    case "warning":
    case "never":
    case "info":
      return (
        <aside className={`mpd-note mpd-note--${block.type}`} aria-label={block.title ?? NOTE_TITLES[block.type]}>
          <NoteIcon kind={block.type} />
          <p className="mpd-note-t">{block.title ?? NOTE_TITLES[block.type]}</p>
          <div className="mpd-note-b">
            {block.text.map((t, i) => (
              <p key={i}>{L(t)}</p>
            ))}
          </div>
        </aside>
      );
    case "table":
      return (
        <div className="mpd-table-wrap" role="region" aria-label="Table" tabIndex={0}>
          <table className="mpd-table">
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th key={i} scope="col">
                    {L(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>{L(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "roleMatrix":
      return (
        <div className="mpd-table-wrap mpd-roles-wrap" role="region" aria-label="Who can do what" tabIndex={0}>
          <table className="mpd-table mpd-roles">
            <thead>
              <tr>
                <th scope="col">Job</th>
                {block.roles.map((r) => (
                  <th key={r} scope="col">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            {block.groups.map((g, gi) => (
              <tbody key={gi}>
                {g.title ? (
                  <tr className="mpd-roles-group">
                    <th colSpan={block.roles.length + 1} scope="colgroup">
                      {g.title}
                    </th>
                  </tr>
                ) : null}
                {g.rows.map((row, ri) => (
                  <tr key={ri}>
                    <th scope="row">{L(row.job)}</th>
                    {row.cells.map((cell, ci) => (
                      <Cell key={ci} cell={cell} role={block.roles[ci] ?? ""} />
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      );
    case "checklist":
      return (
        <Checklist
          storageKey={`${ctx.checklistKey ?? "anon"}:${block.id}`}
          print={ctx.print}
          steps={block.steps.map((s) => ({
            title: s.title,
            time: s.time,
            where: s.where ? <Inline text={`{{${s.where}}}`} link={ctx.link} /> : undefined,
            items: s.items.map((it) => ({ id: it.id, node: L(it.text) })),
          }))}
        />
      );
    case "mock":
      return (
        <div className="mpd-mock" role="group" aria-label={block.label ?? "Example from the admin"}>
          {block.label ? <p className="mpd-mock-label">{block.label}</p> : null}
          {/* Authored in the repo (content/types.ts says so) — never user input. */}
          <div className="mpd-mock-body" dangerouslySetInnerHTML={{ __html: block.html }} />
        </div>
      );
    case "routine":
      return (
        <div className="mpd-routine">
          {block.columns.map((col) => (
            <section key={col.title}>
              <h3>
                <span className="mpd-script">{col.title}</span>
                <small>{col.when}</small>
              </h3>
              <ul>
                {col.items.map((it, i) => (
                  <li key={i}>
                    <span>
                      {L(it.text)}
                      {it.note ? <small>{L(it.note)}</small> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      );
    case "timeline":
      return (
        <ol className="mpd-timeline">
          {block.items.map((it, i) => (
            <li key={i}>
              <span className="mpd-when">{it.when}</span>
              <div className="mpd-what">
                <h3>{it.title}</h3>
                <p>{L(it.text)}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "faq":
      return (
        <div className="mpd-faq">
          {block.items.map((it, i) => (
            <details key={i} open={ctx.print || undefined}>
              <summary>{it.q}</summary>
              <div className="mpd-faq-body">
                <Blocks blocks={it.blocks} ctx={ctx} />
              </div>
            </details>
          ))}
        </div>
      );
    case "glossary":
      return (
        <dl className="mpd-glossary">
          {block.items.map((it) => (
            <div key={it.term}>
              <dt>{it.term}</dt>
              <dd>{L(it.definition)}</dd>
            </div>
          ))}
        </dl>
      );
    case "legend":
      return (
        <p className="mpd-legend-strip">
          {block.items.map((it, i) => (
            <span key={i}>{L(it)}</span>
          ))}
        </p>
      );
  }
}

export function Blocks({ blocks, ctx }: { blocks: Block[]; ctx: Ctx }) {
  return (
    <>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} ctx={ctx} />
      ))}
    </>
  );
}

export type { Ctx as BlockCtx };
