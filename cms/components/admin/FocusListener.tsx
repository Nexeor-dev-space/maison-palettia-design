"use client";

/**
 * ==========================================================================
 * FocusListener — the admin's end of click-to-edit (SPEC §G.5, §I)
 * ==========================================================================
 *
 * Mounted through `admin.components.providers` (payload.config.ts), so it
 * wraps every admin page and renders nothing of its own. Two jobs:
 *
 *   1. THE LIVE-PREVIEW IFRAME ASKS FOR A SECTION. The site's
 *      components/cms/ClickToEdit.tsx posts `{ type: "maison:focus", path }`
 *      when an editor clicks "Edit …" on a section of the previewed page.
 *      The page document is already open beside the iframe, so the block's
 *      row (`blocks-row-3`, Payload's own id for row 3 of the `blocks` field)
 *      is scrolled to the middle of the form and outlined for 1.2 s.
 *
 *   2. …OR ITS BRAND WORDING. A section in "Use Brand wording" mode posts
 *      `{ global: "brand-copy", path: "tagline" }`: its words are not on the
 *      block, so the admin goes to Settings → Brand wording at that field
 *      (`/admin/globals/brand-copy#field-tagline`). The same hash arrives when
 *      the pill is used outside the admin (a new tab) — so on every page load
 *      with a `#field-…` hash the field is found and outlined too.
 *
 * Payload renders only the open tab of a `tabs` field, so a field on another
 * tab is not in the page yet: each tab button is tried in turn until the
 * field appears. If Payload ever renames its ids the worst case is that
 * nothing scrolls — the editor is still on the right document.
 *
 * Messages are accepted only from this origin (the site and the admin are
 * one Next process) and only in the `maison:focus` shape; anything else is
 * ignored, so no page can drive the admin.
 */

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

type FocusMessage = { type: "maison:focus"; path?: unknown; global?: unknown };

/** Field and block paths are dotted names and row numbers — nothing else is let through. */
const PATH = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)*$/;
const GLOBALS = new Set(["brand-copy", "booking-settings", "site-settings", "navigation", "template-copy"]);

const HIGHLIGHT_CSS =
  ".maison-focus{outline:3px solid #9059A4!important;outline-offset:6px;border-radius:6px;transition:outline-color .3s}";

function candidates(path: string): string[] {
  const id = `field-${path.replace(/\./g, "__")}`;
  // "blocks.3" is a block row: Payload ids the row `blocks-row-3`.
  const row = path.match(/^(.+)\.(\d+)$/);
  return [...(row ? [`${row[1].split(".").join("-")}-row-${row[2]}`] : []), id];
}

function find(path: string): HTMLElement | null {
  for (const id of candidates(path)) {
    const exact = document.getElementById(id);
    if (exact) return exact;
    // Fields inside drawers and nested forms carry a suffix (`field-x-2`).
    const prefixed = document.querySelector<HTMLElement>(`[id^="${CSS.escape(id)}-"]`);
    if (prefixed) return prefixed;
  }
  return null;
}

function highlight(element: HTMLElement) {
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  element.classList.add("maison-focus");
  window.setTimeout(() => element.classList.remove("maison-focus"), 1200);
  const input = element.querySelector<HTMLElement>("input, textarea, [contenteditable='true']");
  input?.focus({ preventScroll: true });
}

/** A `#field-…` hash on the current address → reveal that field. */
function revealHash() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (!hash.startsWith("field-")) return;
  void reveal(hash.slice("field-".length).replace(/__/g, "."));
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Finds the field, opening each tab of the form in turn if it is not rendered yet. */
async function reveal(path: string): Promise<void> {
  // A fresh admin page renders its form a moment after the route changes;
  // wait (up to ~10 s) for the field or for the form's own fields to appear.
  for (let attempt = 0; attempt < 50; attempt++) {
    const element = find(path);
    if (element) return highlight(element);
    if (document.querySelector(".tabs-field__tab-button, .render-fields")) break;
    await wait(200);
  }
  const ready = find(path);
  if (ready) return highlight(ready);

  // Not on the open tab: try each tab until the field renders.
  for (const tab of Array.from(document.querySelectorAll<HTMLButtonElement>(".tabs-field__tab-button"))) {
    tab.click();
    for (let tick = 0; tick < 10; tick++) {
      await wait(100);
      const element = find(path);
      if (element) return highlight(element);
    }
  }
}

export function FocusListener({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // A client-side navigation to `/admin/globals/brand-copy#field-…` (job 2)
  // fires no hashchange, and this provider outlives the page — so the hash
  // is read again whenever the route changes.
  useEffect(() => {
    revealHash();
  }, [pathname]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = HIGHLIGHT_CSS;
    document.head.appendChild(style);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as FocusMessage | null;
      if (!data || data.type !== "maison:focus" || typeof data.path !== "string" || !PATH.test(data.path)) return;

      if (typeof data.global === "string") {
        if (!GLOBALS.has(data.global)) return;
        router.push(`/admin/globals/${data.global}#field-${data.path.replace(/\./g, "__")}`);
        return;
      }
      void reveal(data.path);
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("hashchange", revealHash);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("hashchange", revealHash);
      style.remove();
    };
  }, [router]);

  return <>{children}</>;
}
