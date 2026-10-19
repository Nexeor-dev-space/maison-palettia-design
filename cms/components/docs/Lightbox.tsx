"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Click a screenshot to see it large. One dialog per page; it finds the
 * screenshots by their `data-zoom` buttons (cms/components/docs/Blocks.tsx)
 * through a single delegated click listener, so a chapter with twenty
 * screenshots adds one listener, not twenty.
 *
 * `<dialog>.showModal()` gives the focus trap, Esc and the inert page for
 * free. ← / → move between the page's screenshots; clicking the picture
 * toggles between "fit" and full size (scroll to pan). Focus returns to the
 * screenshot that opened it.
 */

type Shot = { src: string; title: string; caption: string; index: number; total: number };

export function Lightbox() {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [shot, setShot] = useState<Shot | null>(null);
  const [full, setFull] = useState(false);

  const all = () => Array.from(document.querySelectorAll<HTMLElement>(".mpd-root [data-zoom]"));

  const show = useCallback((btn: HTMLElement) => {
    const list = Array.from(document.querySelectorAll<HTMLElement>(".mpd-root [data-zoom]"));
    const index = list.indexOf(btn);
    const caption = btn.closest("figure")?.querySelector("figcaption")?.innerHTML ?? "";
    setShot({ src: btn.dataset.zoom ?? "", title: btn.dataset.title ?? "", caption, index, total: list.length });
    setFull(false);
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const btn = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-zoom]");
      if (!btn || !btn.closest(".mpd-root")) return;
      event.preventDefault();
      opener.current = btn;
      show(btn);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [show]);

  const step = (delta: number) => {
    if (!shot) return;
    const list = all();
    const next = list[(shot.index + delta + list.length) % list.length];
    if (next) {
      opener.current = next;
      show(next);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  const onClose = () => {
    setShot(null);
    opener.current?.focus();
  };

  return (
    <dialog ref={ref} className="mpd-lightbox" aria-label={shot?.title || "Enlarged screenshot"} onClose={onClose} onKeyDown={onKeyDown}>
      {shot ? (
        <>
          <div className="mpd-lb-bar">
            <p className="mpd-lb-title">
              {shot.title || "Screenshot"}
              {shot.total > 1 ? (
                <span className="mpd-lb-count">
                  {shot.index + 1} of {shot.total}
                </span>
              ) : null}
            </p>
            <div className="mpd-lb-btns">
              {shot.total > 1 ? (
                <>
                  <button type="button" onClick={() => step(-1)} aria-label="Previous screenshot">
                    ‹<span className="mpd-lb-word"> Previous</span>
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="Next screenshot">
                    <span className="mpd-lb-word">Next </span>›
                  </button>
                </>
              ) : null}
              <button type="button" onClick={() => ref.current?.close()} aria-label="Close" autoFocus>
                ✕<span className="mpd-lb-word"> Close</span>
              </button>
            </div>
          </div>
          <div className={`mpd-lb-stage${full ? " is-full" : ""}`}>
            <button type="button" className="mpd-lb-img" onClick={() => setFull((f) => !f)} aria-label={full ? "Fit the picture to the screen" : "Show the picture at full size"}>
              {/* eslint-disable-next-line @next/next/no-img-element -- signed-in asset route, see Blocks.tsx */}
              <img src={shot.src} alt="" />
            </button>
          </div>
          {/* The figure's own caption and callout list, already rendered on the page. */}
          <div className="mpd-lb-info" dangerouslySetInnerHTML={{ __html: shot.caption }} />
        </>
      ) : null}
    </dialog>
  );
}
