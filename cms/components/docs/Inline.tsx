import React from "react";

import { anchorChapter } from "@/cms/lib/docs/guide";
import { type InlineNode, parseInline } from "@/cms/lib/docs/inline";

/**
 * Renders the guide's inline markup (cms/lib/docs/inline.ts) as HTML.
 *
 * Server component: it reads the anchor map to turn `[words](#section)`
 * into a link to the right chapter page. `mode: "print"` keeps links on
 * the same page (the print layout has every chapter) and leaves a slot the
 * PDF script fills with the page number.
 */

export type LinkMode = { mode: "web"; base: string } | { mode: "print" };

function hrefFor(anchor: string, link: LinkMode): string {
  if (link.mode === "print") return `#${anchor}`;
  const chapter = anchorChapter.get(anchor);
  if (!chapter) return `#${anchor}`;
  return chapter === anchor ? `${link.base}/${chapter}` : `${link.base}/${chapter}#${anchor}`;
}

function render(nodes: InlineNode[], link: LinkMode, keyPrefix = ""): React.ReactNode[] {
  return nodes.map((n, i) => {
    const key = `${keyPrefix}${i}`;
    switch (n.t) {
      case "text":
        return <React.Fragment key={key}>{n.v}</React.Fragment>;
      case "b":
        return <strong key={key}>{render(n.c, link, `${key}.`)}</strong>;
      case "i":
        return <em key={key}>{render(n.c, link, `${key}.`)}</em>;
      case "code":
        return <code key={key}>{n.v}</code>;
      case "ui":
        return (
          <b key={key} className="mpd-ui">
            {n.v}
          </b>
        );
      case "kbd":
        return <kbd key={key}>{n.v}</kbd>;
      case "callout":
        return (
          <span key={key} className="mpd-c" aria-label={`callout ${n.n}`}>
            {n.n}
          </span>
        );
      case "path":
        return (
          <span key={key} className="mpd-path">
            {n.parts.map((p, j) => (
              <React.Fragment key={j}>
                {j > 0 ? (
                  <i aria-hidden="true">›</i>
                ) : null}
                {j > 0 ? <span className="mpd-sr"> then </span> : null}
                {p}
              </React.Fragment>
            ))}
          </span>
        );
      case "link": {
        if (n.href.startsWith("#")) {
          const anchor = n.href.slice(1);
          return (
            <React.Fragment key={key}>
              <a href={hrefFor(anchor, link)}>{render(n.c, link, `${key}.`)}</a>
              {link.mode === "print" ? <span className="mpd-pg" data-pg-for={anchor} /> : null}
            </React.Fragment>
          );
        }
        const external = /^https?:\/\//.test(n.href);
        return (
          <a key={key} href={n.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {render(n.c, link, `${key}.`)}
          </a>
        );
      }
    }
  });
}

export function Inline({ text, link }: { text: string; link: LinkMode }) {
  return <>{render(parseInline(text), link)}</>;
}
