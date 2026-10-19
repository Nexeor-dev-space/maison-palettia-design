"use client";

import React, { useCallback, useEffect, useState } from "react";

/**
 * The day-one checklist with ticks remembered per person, per browser.
 *
 * The key is `mp-docs-ticks:<user id>:<checklist id>`, so two staff sharing
 * a laptop keep separate progress. localStorage can be missing or throw
 * (private windows, blocked storage); the list then simply works for the
 * visit. In print the boxes are empty squares to tick with a pen.
 */

type Step = { title: string; time?: string; where?: React.ReactNode; items: Array<{ id: string; node: React.ReactNode }> };

const PREFIX = "mp-docs-ticks:";

function read(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, ids: string[]) {
  try {
    if (ids.length) window.localStorage.setItem(PREFIX + key, JSON.stringify(ids));
    else window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* storage unavailable: ticks last for this visit only */
  }
}

export function Checklist({ steps, storageKey, print }: { steps: Step[]; storageKey: string; print?: boolean }) {
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const total = steps.reduce((n, s) => n + s.items.length, 0);

  // Ticks load after hydration so the server HTML (no ticks) and the first client render agree.
  useEffect(() => {
    if (print) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage is only possible after mount
    setDone(new Set(read(storageKey)));
  }, [storageKey, print]);

  const toggle = useCallback(
    (id: string, on: boolean) => {
      setDone((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        write(storageKey, [...next]);
        return next;
      });
    },
    [storageKey],
  );

  const clear = () => {
    setDone(new Set());
    write(storageKey, []);
  };

  const count = done.size;
  const pct = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className="mpd-checklist">
      {print ? null : (
        <div className="mpd-checklist-head">
          <div className="mpd-progress">
            <span aria-live="polite">
              {count === total && total > 0 ? "All done — you're ready for real bookings." : `${count} of ${total} done`}
            </span>
            <span className="mpd-bar" aria-hidden="true">
              <i style={{ transform: `scaleX(${pct / 100})` }} />
            </span>
          </div>
          <button type="button" className="mpd-ghost-btn" onClick={clear} disabled={count === 0}>
            Clear ticks
          </button>
        </div>
      )}
      <ol className="mpd-cl-steps">
        {steps.map((step, si) => {
          const stepDone = step.items.every((it) => done.has(it.id));
          return (
            <li key={si} className={`mpd-cl-step${stepDone && !print ? " is-done" : ""}`}>
              <div className="mpd-cl-head">
                <span className="mpd-cl-n" aria-hidden="true">
                  {si + 1}
                </span>
                <h3>{step.title}</h3>
                {step.time ? <span className="mpd-cl-time">{step.time}</span> : null}
                {step.where ? <span className="mpd-cl-where">{step.where}</span> : null}
              </div>
              <ul className="mpd-cl-items">
                {step.items.map((it) => (
                  <li key={it.id}>
                    <label>
                      <input type="checkbox" checked={done.has(it.id)} onChange={(e) => toggle(it.id, e.currentTarget.checked)} disabled={print} />
                      <span>{it.node}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
