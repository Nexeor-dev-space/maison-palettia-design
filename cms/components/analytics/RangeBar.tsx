"use client";

import Link from "next/link";
import React, { useEffect, useRef } from "react";

import { Icon } from "@/cms/components/admin/icons";

/**
 * ==========================================================================
 * RangeBar — the one filter row above everything on /admin/analytics (4C)
 * ==========================================================================
 *
 * Presets first (Last 7 / 30 / 90 days — the owner's usual question), then
 * "Choose dates": a small panel with From / To and the shortcuts an
 * accountant asks for (this month, last month, this year, last year).
 *
 * Everything is a plain link or a plain GET form to the same page, so the
 * filter works before JavaScript loads and the URL is shareable
 * ("/admin/analytics?from=2026-09-01&to=2026-09-30" is last month's
 * report). The client half only closes the panel: on Escape (focus goes
 * back to its button), on a click outside, and once the dates change. The
 * server clamps whatever arrives (cms/lib/analyticsQueries.ts
 * `resolveRange`), so a hand-edited URL cannot ask for the future or for
 * more than 400 days.
 */

export interface RangeBarProps {
  base: string;
  preset: "7" | "30" | "90" | "custom";
  from: string;
  to: string;
  today: string;
  label: string;
  shortcuts: Array<{ label: string; href: string }>;
  children?: React.ReactNode;
}

const PRESETS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;

export function RangeBar({ base, preset, from, to, today, label, shortcuts, children }: RangeBarProps) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const close = (focus: boolean) => {
      if (!details.open) return;
      details.open = false;
      if (focus) details.querySelector("summary")?.focus();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    const onDown = (e: PointerEvent) => !details.contains(e.target as Node) && close(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  // A shortcut link navigates on the client and React keeps the <details>
  // element, so it would stay open over the new numbers; close it once the
  // range has changed.
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [preset, from, to]);

  return (
    <div className="mp-an-filters" role="search" aria-label="Choose the dates to report on">
      <nav className="mp-an-presets" aria-label="Quick periods">
        {PRESETS.map((p) => (
          <Link key={p.value} className="mp-an-preset" href={`${base}?range=${p.value}`} aria-current={preset === p.value ? "true" : undefined} prefetch={false}>
            Last {p.label}
          </Link>
        ))}
      </nav>

      <details className="mp-an-custom" ref={ref} data-active={preset === "custom" ? "true" : undefined}>
        <summary>
          <Icon name="calendar" size={15} />
          {preset === "custom" ? label : "Choose dates"}
        </summary>
        <form className="mp-an-custom__panel" method="get" action={base}>
          <div className="mp-an-custom__dates">
            <label>
              From
              <input type="date" name="from" defaultValue={from} max={today} required />
            </label>
            <label>
              To
              <input type="date" name="to" defaultValue={to} max={today} required />
            </label>
          </div>
          <div className="mp-an-custom__shortcuts" aria-label="Shortcuts">
            {shortcuts.map((s) => (
              <Link key={s.label} href={s.href} prefetch={false}>
                {s.label}
              </Link>
            ))}
          </div>
          <p>Dates are Dubai days and include both ends. Up to 400 days at a time.</p>
          <div>
            <button type="submit" className="mp-actions__btn mp-actions__btn--primary">
              Show these dates
            </button>
          </div>
        </form>
      </details>

      <span className="mp-an-filters__range" aria-live="polite">
        Showing <strong>{label}</strong>
      </span>

      {children ? <div className="mp-an-filters__end">{children}</div> : null}
    </div>
  );
}
