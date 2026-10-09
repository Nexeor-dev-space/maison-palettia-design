"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * ==========================================================================
 * Click-to-edit — an "Edit" pill on every section of a previewed page
 * ==========================================================================
 *
 * SPEC §G.5. Our own protocol (@payloadcms/live-preview 3.90.2 ships none),
 * with both ends in this repo:
 *
 *   THIS END. In draft mode <BlockRenderer> wraps each block in a
 *   `display: contents` element carrying `data-cms-path="blocks.3"` and, for a
 *   section whose words are Brand wording's ("Use Brand wording" on),
 *   `data-cms-global="brand-copy"` + `data-cms-global-path="tagline"`.
 *   Hovering (or tabbing into) a section outlines it and shows a pill; a
 *   section in Brand-wording mode shows a second pill, because its own block
 *   holds only the picture and the buttons and the words are edited elsewhere.
 *
 *   THE OTHER END. Inside the admin's live-preview iframe a click posts
 *   `{ type: "maison:focus", path }` or `{ type: "maison:focus", global,
 *   path }` to the parent window, restricted to this origin (Payload is
 *   in-app, so the admin IS this origin). cms/components/admin/FocusListener.tsx
 *   scrolls the block's row into view, or opens the global at that field.
 *   Outside an iframe (the Preview button opens a tab) the pill opens the
 *   admin in a new tab at the same place instead.
 *
 * Mounted by the site layout only while draft mode is on; nothing of it
 * reaches a public page. It draws one fixed overlay and never moves the
 * page's own elements, so the preview is the page as published.
 */

type Target = {
  rect: { top: number; left: number; width: number; height: number };
  path: string;
  doc: string | null;
  type: string | null;
  global: string | null;
  globalPath: string | null;
};

/** What the wrapper's children occupy — the wrapper itself is `display: contents` and has no box. */
function boxOf(element: Element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const r = range.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function targetOf(node: EventTarget | null): Target | null {
  if (!(node instanceof Element)) return null;
  if (node.closest("[data-cms-overlay]")) return null;
  const section = node.closest<HTMLElement>("[data-cms-path]");
  if (!section) return null;
  return {
    rect: boxOf(section),
    path: section.dataset.cmsPath ?? "",
    doc: section.dataset.cmsDoc ?? null,
    type: section.dataset.cmsType ?? null,
    global: section.dataset.cmsGlobal ?? null,
    globalPath: section.dataset.cmsGlobalPath ?? null,
  };
}

const fieldId = (path: string) => `field-${path.replace(/\./g, "__")}`;

/** "openingStatement" → "Opening statement" — the pill names the section it edits. */
function labelOf(type: string | null): string {
  if (!type) return "section";
  const words = type.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const noop = () => () => {};

export function ClickToEdit() {
  const [target, setTarget] = useState<Target | null>(null);
  const hold = useRef<number | null>(null);
  // In the admin's live-preview iframe, or a tab of its own?
  const framed = useSyncExternalStore(noop, () => window.parent !== window, () => false);

  const show = useCallback((node: EventTarget | null) => {
    const next = targetOf(node);
    if (hold.current) window.clearTimeout(hold.current);
    if (next) setTarget(next);
    else hold.current = window.setTimeout(() => setTarget(null), 250);
  }, []);

  useEffect(() => {
    const onOver = (event: Event) => show(event.target);
    // Keep the outline on the section as the page scrolls under the pointer.
    const onScroll = () =>
      setTarget((current) => {
        if (!current) return current;
        const section = document.querySelector(`[data-cms-path="${current.path}"]`);
        return section ? { ...current, rect: boxOf(section) } : null;
      });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("focusin", onOver);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("focusin", onOver);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [show]);

  const focus = (message: { path: string; global?: string }) => {
    if (framed) {
      window.parent.postMessage({ type: "maison:focus", ...message }, window.location.origin);
      return;
    }
    const href = message.global
      ? `/admin/globals/${message.global}#${fieldId(message.path)}`
      : target?.doc
        ? `/admin/collections/pages/${target.doc}#${fieldId(message.path)}`
        : null;
    if (href) window.open(href, "_blank", "noopener");
  };

  if (!target) return <PreviewBadge framed={framed} />;

  const { rect } = target;
  // The launch layout (no stored document yet) has nothing to open.
  const canEditBlock = framed || Boolean(target.doc);
  return (
    <>
      <div
        data-cms-overlay
        aria-hidden
        style={{
          position: "fixed",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          outline: "2px dashed #9059A4",
          outlineOffset: -2,
          pointerEvents: "none",
          zIndex: 2147483000,
        }}
      />
      <div
        data-cms-overlay
        onMouseEnter={() => hold.current && window.clearTimeout(hold.current)}
        onMouseLeave={() => show(null)}
        style={{
          position: "fixed",
          top: Math.max(rect.top + 10, 10),
          left: Math.min(rect.left + rect.width - 10, window.innerWidth - 10),
          transform: "translateX(-100%)",
          display: "flex",
          gap: 8,
          zIndex: 2147483001,
        }}
      >
        {target.global && target.globalPath ? (
          <Pill onClick={() => focus({ global: target.global!, path: target.globalPath! })}>
            Edit Brand wording
          </Pill>
        ) : null}
        {canEditBlock ? <Pill onClick={() => focus({ path: target.path })}>Edit {labelOf(target.type).toLowerCase()}</Pill> : null}
      </div>
      <PreviewBadge framed={framed} />
    </>
  );
}

function Pill({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        font: "600 12px/1 system-ui, sans-serif",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "9px 14px",
        borderRadius: 999,
        border: 0,
        background: "#9059A4",
        color: "#fff",
        cursor: "pointer",
        boxShadow: "0 6px 20px -8px rgb(35 31 32 / 0.5)",
      }}
    >
      {children}
    </button>
  );
}

/**
 * Outside the admin, a draft preview looks exactly like the live site — which
 * is the point, and also how somebody forgets they are in it. A small fixed
 * badge says so and offers the way out (/exit-preview, back to this page).
 */
function PreviewBadge({ framed }: { framed: boolean }) {
  const path = useSyncExternalStore(noop, () => window.location.pathname, () => "/");
  if (framed) return null;
  return (
    <a
      data-cms-overlay
      href={`/exit-preview?path=${encodeURIComponent(path)}`}
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 2147483001,
        font: "600 12px/1 system-ui, sans-serif",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "10px 14px",
        borderRadius: 999,
        background: "#2D3748",
        color: "#fff",
        textDecoration: "none",
      }}
    >
      Draft preview · Exit
    </a>
  );
}
