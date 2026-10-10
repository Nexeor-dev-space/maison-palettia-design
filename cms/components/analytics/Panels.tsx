import Link from "next/link";
import React from "react";

import { Icon, type IconName } from "@/cms/components/admin/icons";
import type { Delta, FunnelStep, ResolvedRange, VatSummary } from "@/cms/lib/analyticsQueries";

import { aed, aedPlain, fmtNum, fmtPct, monthLong } from "./format";

/**
 * ==========================================================================
 * Analytics panels — the static building blocks of /admin/analytics (4C)
 * ==========================================================================
 *
 * Server components (no "use client"): KPI tiles with a "vs previous
 * period" line, ranked bar lists, the booking funnel, a two-part split bar,
 * the VAT summary tile, the CSV export buttons and the teaching empty
 * state. They reuse 4B's primitives from app/(payload)/custom.scss
 * (`mp-card`, `mp-kpi`, `mp-chip`, `mp-eyebrow`, `mp-empty`) and add only
 * what a chart needs, under the `mp-an-` prefix in ./styles.ts.
 *
 * Every number is printed as text next to its bar, so nothing depends on
 * reading a colour or hovering; bars are decoration for the eye, and are
 * hidden from screen readers.
 */

/* ── KPI tile ──────────────────────────────────────────────────────────── */

export function DeltaLine({ delta, range, upIsGood = true, format = fmtNum }: { delta: Delta; range: ResolvedRange; upIsGood?: boolean; format?: (n: number) => string }) {
  const period = `previous ${range.days === 1 ? "day" : `${range.days} days`}`;
  if (delta.change === null) {
    return delta.value > 0 ? (
      <span className="mp-an-delta mp-an-delta--good">
        <span aria-hidden="true">▲</span> New <span className="mp-an-delta__vs">· none before</span>
      </span>
    ) : (
      <span className="mp-an-delta mp-an-delta--flat">No change vs {period}</span>
    );
  }
  if (Math.abs(delta.change) < 0.005) return <span className="mp-an-delta mp-an-delta--flat">Same as the {period}</span>;
  const up = delta.change > 0;
  const good = up === upIsGood;
  return (
    <span className={`mp-an-delta mp-an-delta--${good ? "good" : "bad"}`} title={`${format(delta.previous)} in the ${period}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      <span className="mp-an-sr">{up ? "Up" : "Down"}</span> {fmtPct(Math.abs(delta.change))} <span className="mp-an-delta__vs">vs prev. {range.days === 1 ? "day" : `${range.days} days`}</span>
    </span>
  );
}

export function Kpi({
  label,
  value,
  unit,
  hint,
  delta,
  href,
  tone,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: React.ReactNode;
  delta?: React.ReactNode;
  href?: string;
  tone?: "attention" | "muted";
  icon?: IconName;
}) {
  const body = (
    <>
      <span className="mp-kpi__label">
        {icon ? <Icon name={icon} size={14} className="mp-an-kpi-icon" /> : null}
        {label}
      </span>
      <span className="mp-kpi__value mp-an-kpi-value">
        {value}
        {unit ? <small>{unit}</small> : null}
      </span>
      {delta}
      {hint ? <span className="mp-kpi__hint">{hint}</span> : null}
    </>
  );
  const cls = `mp-card mp-kpi${tone === "attention" ? " mp-kpi--attention" : ""}${tone === "muted" ? " mp-kpi--muted" : ""}`;
  return href ? (
    <Link className={cls} href={href} prefetch={false}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ── Card shell ────────────────────────────────────────────────────────── */

export function Card({ title, sub, link, children, id, className }: { title: string; sub?: React.ReactNode; link?: { href: string; label: string; external?: boolean }; children: React.ReactNode; id?: string; className?: string }) {
  return (
    <section className={`mp-card mp-an-card${className ? ` ${className}` : ""}`} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="mp-card__head">
        <div className="mp-an-card__titles">
          <h3 className="mp-card__title" id={id ? `${id}-title` : undefined}>
            {title}
          </h3>
          {sub ? <p className="mp-an-card__sub">{sub}</p> : null}
        </div>
        {link ? (
          <Link className="mp-card__link" href={link.href} prefetch={false} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined}>
            {link.label} →
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Empty({ title, body, action }: { title: string; body: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="mp-empty mp-an-empty">
      <strong>{title}</strong>
      <p>{body}</p>
      {action ? (
        <p>
          <Link className="mp-card__link" href={action.href} prefetch={false}>
            {action.label} →
          </Link>
        </p>
      ) : null}
    </div>
  );
}

/* ── Ranked bar list ───────────────────────────────────────────────────── */

export interface BarItem {
  key: string;
  label: string;
  /** Printed on the right — "1,204", "AED 3,400.00". */
  value: string;
  /** Drives the bar length (relative to the largest in the list). */
  amount: number;
  /** Small grey line under the label — a path, "12 tickets · 9 bookings". */
  secondary?: string;
  /** Printed after the value — "32%". */
  share?: string;
  href?: string;
  external?: boolean;
}

export function BarList({ items, label, empty }: { items: BarItem[]; label: string; empty?: React.ReactNode }) {
  if (items.length === 0) return <>{empty ?? null}</>;
  const max = Math.max(1, ...items.map((i) => i.amount));
  return (
    <ol className="mp-an-bars" aria-label={label}>
      {items.map((item) => {
        const inner = (
          <>
            <span className="mp-an-bars__text">
              <span className="mp-an-bars__label">{item.label}</span>
              {item.secondary ? <span className="mp-an-bars__secondary">{item.secondary}</span> : null}
            </span>
            <span className="mp-an-bars__value">
              <strong>{item.value}</strong>
              {item.share ? <span>{item.share}</span> : null}
            </span>
            <span className="mp-an-bars__track" aria-hidden="true">
              <span style={{ width: `${Math.max(item.amount > 0 ? 1.5 : 0, (item.amount / max) * 100)}%` }} />
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <Link className="mp-an-bars__row" href={item.href} prefetch={false} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined}>
                {inner}
              </Link>
            ) : (
              <div className="mp-an-bars__row">{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Two-part split (online / desk) ────────────────────────────────────── */

export function SplitBar({ parts, label }: { parts: Array<{ key: string; label: string; amount: number; value: string; slot: 1 | 2 }>; label: string }) {
  const total = parts.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="mp-an-split">
      <div className="mp-an-split__bar" role="img" aria-label={`${label}: ${parts.map((p) => `${p.label} ${p.value}${total ? ` (${fmtPct(p.amount / total)})` : ""}`).join(", ")}`}>
        {total > 0 ? (
          parts.map((p) => (p.amount > 0 ? <span key={p.key} className={`mp-an-fill-bg--${p.slot}`} style={{ flexGrow: p.amount }} /> : null))
        ) : (
          <span className="mp-an-split__none" />
        )}
      </div>
      <ul className="mp-an-legend mp-an-legend--split">
        {parts.map((p) => (
          <li key={p.key}>
            <span className={`mp-an-key mp-an-key--box mp-an-key--${p.slot}`} aria-hidden="true" />
            <span>{p.label}</span>
            <strong>{p.value}</strong>
            {total > 0 ? <span className="mp-an-legend__pct">{fmtPct(p.amount / total)}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Booking funnel ────────────────────────────────────────────────────── */

/**
 * Five steps in two units (4A): the first two count DAILY VISITORS (from the
 * beacon), the last three count ONLINE ORDERS (from the orders table). So
 * the funnel is drawn as two groups, each scaled to its own first step, and
 * the hop between them is stated in words rather than as a bar — a bar
 * would pretend visitors and orders are the same thing.
 */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const browse = steps.slice(0, 2);
  const checkout = steps.slice(2);
  const group = (list: FunnelStep[], unit: string) => {
    const first = Math.max(1, list[0]?.count ?? 0);
    return (
      <ol className="mp-an-funnel">
        {list.map((s, i) => (
          <li key={s.key} title={s.hint}>
            <span className="mp-an-funnel__label">
              <span className="mp-an-funnel__n" aria-hidden="true">
                {steps.indexOf(s) + 1}
              </span>
              {s.label}
            </span>
            <span className="mp-an-funnel__value">
              <span className="mp-an-funnel__count">
                <strong>{fmtNum(s.count)}</strong> {unit}
              </span>
              {i > 0 ? <span className="mp-an-funnel__pct">{list[i - 1].count > 0 ? `${fmtPct(s.ofPrevious)} of the step before` : "—"}</span> : null}
            </span>
            <span className="mp-an-bars__track mp-an-funnel__track" aria-hidden="true">
              <span style={{ width: `${Math.max(s.count > 0 ? 1.5 : 0, (s.count / first) * 100)}%` }} />
            </span>
          </li>
        ))}
      </ol>
    );
  };
  const opened = browse[1]?.count ?? 0;
  const started = checkout[0]?.count ?? 0;
  return (
    <div className="mp-an-funnel-wrap">
      <div>
        <p className="mp-eyebrow">Browsing · daily visitors</p>
        {group(browse, browse[0]?.count === 1 ? "visitor" : "visitors")}
      </div>
      {checkout.length ? (
        <>
          <p className="mp-an-funnel__bridge">
            <Icon name="arrow" size={14} />
            {opened > 0 ? (
              <span>
                About <strong>{fmtPct(Math.min(1, started / opened))}</strong> of booking-page visitors went on to start a checkout ({fmtNum(started)} from {fmtNum(opened)}).
              </span>
            ) : (
              <span>Checkouts are counted from orders, so they can appear even before the website has recorded a visit.</span>
            )}
          </p>
          <div>
            <p className="mp-eyebrow">Checkout · online orders</p>
            {group(checkout, started === 1 ? "order" : "orders")}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ── VAT summary tile (§H.12) ──────────────────────────────────────────── */

export function VatTile({ vat, rangeLabel, exportHref, includesTestOrders }: { vat: VatSummary; rangeLabel: string; exportHref: string; includesTestOrders: boolean }) {
  const hasAny = vat.invoices.count + vat.creditNotes.count > 0;
  return (
    <section className="mp-card mp-an-card mp-an-vat" aria-labelledby="mp-an-vat-title">
      <div className="mp-card__head">
        <div className="mp-an-card__titles">
          <h3 className="mp-card__title" id="mp-an-vat-title">
            VAT summary for {rangeLabel.startsWith("Last") ? rangeLabel.toLowerCase() : rangeLabel}
          </h3>
          <p className="mp-an-card__sub">{vat.trn ? `TRN ${vat.trn} · ` : ""}Invoices minus credit notes — the figures for your VAT return.</p>
        </div>
      </div>
      {includesTestOrders ? (
        <p className="mp-an-note mp-an-note--warn">
          <Icon name="alert" size={14} /> Includes test orders while Payments is not Live — do not file these figures.
        </p>
      ) : null}
      <dl className="mp-an-vat__big">
        <div>
          <dt>Sales incl. VAT</dt>
          <dd>{aed(vat.net.grossFils)}</dd>
        </div>
        <div>
          <dt>Net (excl. VAT)</dt>
          <dd>{aed(vat.net.netFils)}</dd>
        </div>
        <div className="mp-an-vat__due">
          <dt>VAT</dt>
          <dd>{aed(vat.net.vatFils)}</dd>
        </div>
      </dl>
      <dl className="mp-an-vat__lines">
        <div>
          <dt>Invoices</dt>
          <dd>
            {fmtNum(vat.invoices.count)} · {aed(vat.invoices.grossFils)}
          </dd>
        </div>
        <div>
          <dt>Credit notes (refunds)</dt>
          <dd>
            {fmtNum(vat.creditNotes.count)}
            {vat.creditNotes.count ? ` · −${aed(Math.abs(vat.creditNotes.grossFils))}` : ""}
          </dd>
        </div>
        {vat.invoices.discountFils ? (
          <div>
            <dt>Discounts given</dt>
            <dd>{aed(vat.invoices.discountFils)}</dd>
          </div>
        ) : null}
      </dl>
      {vat.byMonth.length > 1 ? (
        <details className="mp-an-details">
          <summary>By month</summary>
          <div className="mp-an-table-wrap">
            <table className="mp-an-table">
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Invoices</th>
                  <th scope="col">Credit notes</th>
                  <th scope="col">Net AED</th>
                  <th scope="col">VAT AED</th>
                  <th scope="col">Gross AED</th>
                </tr>
              </thead>
              <tbody>
                {vat.byMonth.map((m) => (
                  <tr key={m.month}>
                    <th scope="row">{monthLong(m.month)}</th>
                    <td>{fmtNum(m.invoices)}</td>
                    <td>{fmtNum(m.creditNotes)}</td>
                    <td>{aedPlain(m.netFils)}</td>
                    <td>{aedPlain(m.vatFils)}</td>
                    <td>{aedPlain(m.grossFils)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
      <div className="mp-an-vat__foot">
        {/* A plain GET link: the endpoint answers with the file and the admin cookie rides along. */}
        <a className="mp-actions__btn mp-actions__btn--primary" href={exportHref} download>
          <Icon name="page" size={15} /> Download invoices (CSV)
        </a>
        {!hasAny ? <span className="mp-kpi__hint">No invoices were issued in these dates.</span> : null}
      </div>
    </section>
  );
}

/* ── CSV exports (§H.12) ───────────────────────────────────────────────── */

const EXPORTS: Array<{ kind: string; label: string; hint: string; icon: IconName }> = [
  { kind: "orders", label: "Orders", hint: "Every booking with totals, VAT, channel and payment", icon: "bag" },
  { kind: "invoices", label: "Invoices", hint: "Tax invoices and credit notes — for the accountant", icon: "page" },
  { kind: "tickets", label: "Tickets", hint: "One row per seat, with check-in times", icon: "ticket" },
  { kind: "customers", label: "Customers", hint: "People who booked, with their booking count", icon: "users" },
  { kind: "enquiries", label: "Enquiries", hint: "Messages from the contact and private-event forms", icon: "mail" },
];

export function ExportCsv({ apiRoute, range }: { apiRoute: string; range: ResolvedRange }) {
  const q = `from=${range.from}&to=${range.to}`;
  return (
    <section className="mp-card mp-an-card" aria-labelledby="mp-an-export-title">
      <div className="mp-card__head">
        <div className="mp-an-card__titles">
          <h3 className="mp-card__title" id="mp-an-export-title">
            Download a spreadsheet
          </h3>
          <p className="mp-an-card__sub">
            For the dates above ({range.label}). Opens in Excel, Numbers or Google Sheets; times are Dubai time, amounts in AED.
          </p>
        </div>
      </div>
      <ul className="mp-an-exports">
        {EXPORTS.map((e) => (
          <li key={e.kind}>
            <a className="mp-an-export" href={`${apiRoute}/actions/exports/${e.kind}.csv?${q}`} download>
              <span className="mp-an-export__icon" aria-hidden="true">
                <Icon name={e.icon} size={18} />
              </span>
              <span className="mp-an-export__text">
                <strong>{e.label}</strong>
                <span>{e.hint}</span>
              </span>
              <span className="mp-an-export__go">
                <span className="mp-an-export__dl">Download </span>CSV ↓
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Small stat list (refunds, promos, ops) ────────────────────────────── */

export function StatList({ items }: { items: Array<{ key: string; label: string; value: string; hint?: string; href?: string; tone?: "warn" | "bad" | "ok" }> }) {
  return (
    <ul className="mp-an-stats">
      {items.map((s) => {
        const inner = (
          <>
            <span className="mp-an-stats__label">
              {s.tone ? <span className={`mp-an-dot mp-an-dot--${s.tone}`} aria-hidden="true" /> : null}
              {s.label}
              {s.hint ? <span className="mp-an-stats__hint">{s.hint}</span> : null}
            </span>
            <strong className="mp-an-stats__value">{s.value}</strong>
          </>
        );
        return (
          <li key={s.key}>
            {s.href ? (
              <Link className="mp-an-stats__row" href={s.href} prefetch={false}>
                {inner}
              </Link>
            ) : (
              <div className="mp-an-stats__row">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ── "Show as table" for a time chart ──────────────────────────────────── */

export function DayTable({ caption, columns, rows }: { caption: string; columns: Array<{ key: string; label: string; money?: boolean }>; rows: Array<{ day: string } & Record<string, number | string>> }) {
  return (
    <details className="mp-an-details">
      <summary>Show as a table</summary>
      <div className="mp-an-table-wrap">
        <table className="mp-an-table">
          <caption className="mp-an-sr">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((r) => (
              <tr key={r.day}>
                <th scope="row">{new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${r.day}T12:00:00Z`))}</th>
                {columns.map((c) => (
                  <td key={c.key}>{c.money ? aedPlain(Number(r[c.key] ?? 0)) : fmtNum(Number(r[c.key] ?? 0))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
