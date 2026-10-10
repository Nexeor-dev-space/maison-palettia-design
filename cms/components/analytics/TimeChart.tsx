"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { aed, aedShort, dayLong, dayShort, fmtCompact, fmtNum, labelDays, niceTicks } from "./format";

/**
 * ==========================================================================
 * TimeChart — one value per Dubai day, as lines or columns (SPEC §I, 4C)
 * ==========================================================================
 *
 * The two charts on /admin/analytics that run along the calendar: "Visits
 * per day" (two lines — page views and daily visitors, both counts, one
 * axis) and "Sales per day" (columns of AED, with orders and tickets
 * riding along in the readout). Inline SVG, no chart library (§I).
 *
 * HOW IT READS
 *   - Thin marks: 2 px lines with a 10 % wash under the first series;
 *     columns capped at 24 px with a rounded top, square at the baseline.
 *   - One y-axis with clean ticks (0 / 250 / 500), hairline gridlines.
 *   - A crosshair snaps to the nearest day; the readout lists every series
 *     for that day, value first. Arrow keys do the same from the keyboard
 *     (Home/End jump to the ends), and the readout is announced politely.
 *   - Nothing is gated behind hover: the card under the chart has a
 *     "Show as table" disclosure with every number (rendered here too).
 *
 * COLOUR. Two series slots, validated for colour-blind separation against
 * both admin surfaces (dataviz validator: light lilac #9059a4 / sage
 * #4b7a3c, dark #b07fc3 / #6fa058 — all six checks pass). They are CSS
 * variables (`--mp-an-1`, `--mp-an-2`, in ./styles.ts) so the dark theme
 * picks its own steps rather than an automatic flip. Text never wears a
 * series colour; the legend and readout key each series with a swatch.
 *
 * Props are plain JSON (a server component renders this), so formatting is
 * named by `unit` rather than passed as a function.
 */

export type Unit = "count" | "fils";

export interface TimeSeries {
  key: string;
  label: string;
  unit: Unit;
  /** Drawn series take a colour slot; `null` = readout and table only (e.g. orders beside revenue). */
  slot: 1 | 2 | null;
}

export interface TimeChartProps {
  title: string;
  kind: "lines" | "columns";
  series: TimeSeries[];
  rows: Array<{ day: string } & Record<string, number | string>>;
  /** One sentence for screen readers, e.g. "1,204 page views from 512 daily visitors over 30 days". */
  summary: string;
  height?: number;
}

const fmt = (unit: Unit, n: number) => (unit === "fils" ? aed(n) : fmtNum(n));
const tick = (unit: Unit, n: number) => (unit === "fils" ? aedShort(n).replace("AED ", "") : fmtCompact(n));

const M = { top: 14, right: 12, bottom: 28 };

export function TimeChart({ title, kind, series, rows, summary, height = 240 }: TimeChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);
  const liveId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(260, Math.round(el.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const drawn = series.filter((s) => s.slot !== null);
  const axisUnit = drawn[0]?.unit ?? "count";
  const values = (key: string) => rows.map((r) => Number(r[key] ?? 0));
  const max = Math.max(0, ...drawn.flatMap((s) => values(s.key)));
  const ticks = useMemo(() => niceTicks(max, height < 220 ? 3 : 4), [max, height]);
  const top = ticks[ticks.length - 1] || 1;

  const left = Math.max(30, 10 + Math.max(...ticks.map((t) => tick(axisUnit, t).length)) * 7);
  const plotW = Math.max(10, width - left - M.right);
  const plotH = height - M.top - M.bottom;
  const n = rows.length;
  const band = n > 0 ? plotW / n : plotW;
  const x = (i: number) => (kind === "columns" ? left + band * (i + 0.5) : n <= 1 ? left + plotW / 2 : left + (plotW * i) / (n - 1));
  const y = (v: number) => M.top + plotH - (v / top) * plotH;
  const colW = Math.max(1, Math.min(24, band - 2, band * 0.72));
  const labelled = useMemo(() => labelDays(rows.map((r) => r.day), Math.max(2, Math.floor(plotW / 78))), [rows, plotW]);

  const pick = useCallback(
    (clientX: number) => {
      const el = wrapRef.current;
      if (!el || n === 0) return;
      const px = clientX - el.getBoundingClientRect().left;
      const i = kind === "columns" ? Math.floor((px - left) / band) : Math.round(((px - left) / plotW) * (n - 1));
      setActive(Math.min(n - 1, Math.max(0, i)));
    },
    [band, kind, left, n, plotW],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (n === 0) return;
    const cur = active ?? n - 1;
    const next = e.key === "ArrowLeft" ? cur - 1 : e.key === "ArrowRight" ? cur + 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : e.key === "Escape" ? null : undefined;
    if (next === undefined) return;
    e.preventDefault();
    setActive(next === null ? null : Math.min(n - 1, Math.max(0, next)));
  };

  const path = (key: string) => rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(Number(r[key] ?? 0)).toFixed(1)}`).join("");
  const area = (key: string) => `${path(key)}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;

  const activeRow = active !== null ? rows[active] : null;
  const readout = activeRow ? `${dayLong(activeRow.day)}: ${series.map((s) => `${fmt(s.unit, Number(activeRow[s.key] ?? 0))} ${s.label.toLowerCase()}`).join(", ")}` : "";
  const tipLeft = active !== null ? x(active) : 0;
  const flip = tipLeft > width * 0.62;

  return (
    <figure className="mp-an-chart">
      {drawn.length > 1 ? (
        <ul className="mp-an-legend" aria-label="Legend">
          {drawn.map((s) => (
            <li key={s.key}>
              <span className={`mp-an-key mp-an-key--${kind === "lines" ? "line" : "box"} mp-an-key--${s.slot}`} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div
        ref={wrapRef}
        className="mp-an-chart__plot"
        tabIndex={0}
        role="group"
        aria-roledescription="chart"
        aria-label={`${title}. ${summary}. Use the left and right arrow keys to read each day.`}
        aria-describedby={liveId}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
          {ticks.map((t) => (
            <g key={t}>
              <line className="mp-an-gridline" x1={left} x2={width - M.right} y1={y(t)} y2={y(t)} />
              <text className="mp-an-tick" x={left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {tick(axisUnit, t)}
              </text>
            </g>
          ))}
          {rows.map((r, i) =>
            labelled.has(i) ? (
              <text key={r.day} className="mp-an-tick" x={x(i)} y={height - 8} textAnchor={kind === "lines" && i === n - 1 && n > 1 ? "end" : kind === "lines" && i === 0 && n > 1 ? "start" : "middle"}>
                {dayShort(r.day)}
              </text>
            ) : null,
          )}

          {kind === "lines" ? (
            <>
              {drawn[0] && n > 1 ? <path className={`mp-an-area mp-an-fill--${drawn[0].slot}`} d={area(drawn[0].key)} /> : null}
              {drawn.map((s) => (n > 1 ? <path key={s.key} className={`mp-an-line mp-an-stroke--${s.slot}`} d={path(s.key)} /> : null))}
              {active !== null ? (
                <>
                  <line className="mp-an-cross" x1={x(active)} x2={x(active)} y1={M.top} y2={M.top + plotH} />
                  {drawn.map((s) => (
                    <circle key={s.key} className={`mp-an-dot mp-an-fill-solid--${s.slot}`} cx={x(active)} cy={y(Number(rows[active][s.key] ?? 0))} r={4.5} />
                  ))}
                </>
              ) : n === 1 ? (
                drawn.map((s) => <circle key={s.key} className={`mp-an-dot mp-an-fill-solid--${s.slot}`} cx={x(0)} cy={y(Number(rows[0][s.key] ?? 0))} r={4.5} />)
              ) : null}
            </>
          ) : (
            drawn.slice(0, 1).map((s) =>
              rows.map((r, i) => {
                const v = Number(r[s.key] ?? 0);
                if (v <= 0) return null;
                const h = Math.max(2, y(0) - y(v));
                const x0 = x(i) - colW / 2;
                const rad = Math.min(4, colW / 2, h);
                const y0 = y(0) - h;
                const d = `M${x0},${y(0)}V${y0 + rad}Q${x0},${y0} ${x0 + rad},${y0}H${x0 + colW - rad}Q${x0 + colW},${y0} ${x0 + colW},${y0 + rad}V${y(0)}Z`;
                return <path key={r.day} className={`mp-an-col mp-an-fill-solid--${s.slot}${active !== null && active !== i ? " is-dim" : ""}`} d={d} />;
              }),
            )
          )}
          <line className="mp-an-base" x1={left} x2={width - M.right} y1={y(0)} y2={y(0)} />
        </svg>

        {activeRow ? (
          <div className="mp-an-tip" style={{ left: tipLeft, transform: flip ? "translateX(calc(-100% - 14px))" : "translateX(14px)" }} aria-hidden="true">
            <div className="mp-an-tip__day">{dayLong(activeRow.day)}</div>
            {series.map((s) => (
              <div key={s.key} className="mp-an-tip__row">
                {s.slot ? <span className={`mp-an-key mp-an-key--line mp-an-key--${s.slot}`} /> : <span className="mp-an-key mp-an-key--none" />}
                <strong>{fmt(s.unit, Number(activeRow[s.key] ?? 0))}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <p id={liveId} className="mp-an-sr" aria-live="polite">
          {readout}
        </p>
      </div>
      <figcaption className="mp-an-sr">{summary}</figcaption>
    </figure>
  );
}
