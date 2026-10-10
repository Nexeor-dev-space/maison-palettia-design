import Link from "next/link";
import React from "react";

import { Icon } from "@/cms/components/admin/icons";
import type { AnalyticsDashboard, BreakdownRow } from "@/cms/lib/analyticsQueries";

import { aed, fmtNum, fmtPct, fmtWhen } from "./format";
import { BarList, type BarItem, Card, DayTable, DeltaLine, Empty, ExportCsv, Funnel, Kpi, SplitBar, StatList, VatTile } from "./Panels";
import { RangeBar, type RangeBarProps } from "./RangeBar";
import { ANALYTICS_CSS } from "./styles";
import { TimeChart } from "./TimeChart";

/**
 * ==========================================================================
 * AnalyticsPage — what /admin/analytics shows, top to bottom (SPEC §I, 4C)
 * ==========================================================================
 *
 * Laid out in the order an owner asks the questions:
 *
 *   1. "How are we doing?" — a header that says which dates are shown, one
 *      filter row (7 / 30 / 90 days or chosen dates) and eight headline
 *      tiles, each with "vs the previous N days".
 *   2. Sales (admins only): money per day, online vs desk, refunds and
 *      discounts, best-selling experiences, how full each session was.
 *   3. Website: visits per day, most-visited pages, how people found the
 *      site, phones vs computers, countries, and the path from looking at
 *      an event to paying.
 *   4. For the accountant (admins only): the VAT summary tile and the
 *      five CSV downloads for the same dates; then "behind the scenes" —
 *      failed emails and tasks, seat holds, disputes.
 *
 * Editors see 1 (traffic tiles only) and 3; the data function already
 * returns `sales: null` for them (cms/lib/analyticsQueries.ts), so nothing
 * here can leak money to the wrong role. Every panel teaches when empty:
 * it says what would appear and what makes it appear.
 *
 * A server component: the only client pieces are the two time charts
 * (crosshair + keyboard reading) and the range panel's close-on-Escape.
 */

export interface AnalyticsPageProps {
  data: AnalyticsDashboard;
  firstName: string;
  adminRoute: string;
  apiRoute: string;
  rangeBar: Omit<RangeBarProps, "children">;
}

const pageItems = (rows: BreakdownRow[]): BarItem[] =>
  rows.map((r) => ({
    key: r.key,
    label: r.label,
    secondary: r.key === "/other" ? "Pages that don't exist and old links" : r.key,
    value: fmtNum(r.views),
    amount: r.views,
    share: fmtPct(r.share),
    href: r.key === "/other" ? undefined : r.key,
    external: true,
  }));

const shareItems = (rows: BreakdownRow[], secondary?: (r: BreakdownRow) => string): BarItem[] =>
  rows.map((r) => ({ key: r.key, label: r.label, secondary: secondary?.(r), value: fmtNum(r.visitors), amount: r.visitors, share: fmtPct(r.share) }));

function SectionHead({ title, sub, id }: { title: string; sub?: string; id: string }) {
  return (
    <div className="mp-an-section__head">
      <h2 id={id}>{title}</h2>
      {sub ? <p>{sub}</p> : null}
    </div>
  );
}

export function AnalyticsPage({ data, firstName, adminRoute, apiRoute, rangeBar }: AnalyticsPageProps) {
  const { range, traffic, sales } = data;
  const isAdmin = data.role === "admin" && sales !== null;
  const t = traffic.summary;
  const anyTrafficInRange = t.views.value > 0;
  const k = sales?.kpis;
  const sentenceRange = range.preset === "custom" ? range.label : range.label.toLowerCase();
  const csv = (kind: string) => `${apiRoute}/actions/exports/${kind}.csv?from=${range.from}&to=${range.to}`;
  const col = (path: string) => `${adminRoute}/collections/${path}`;

  // One plain sentence under the heading: the period's headline, in words.
  const headline = isAdmin && k
    ? k.orders.value > 0
      ? `${fmtNum(k.orders.value)} ${k.orders.value === 1 ? "booking" : "bookings"} worth ${aed(k.grossFils.value)} in ${sentenceRange}${t.visitors.value ? `, from ${fmtNum(t.visitors.value)} daily visitors to the website` : ""}.`
      : `No bookings in ${sentenceRange}${t.visitors.value ? `, but ${fmtNum(t.visitors.value)} daily visitors came to the website` : ""}.`
    : t.visitors.value
      ? `${fmtNum(t.visitors.value)} daily visitors looked at ${fmtNum(t.views.value)} pages in ${sentenceRange}.`
      : `No visits recorded in ${sentenceRange}.`;

  const trafficRows = traffic.series.map((p) => ({ day: p.day, views: p.views, visitors: p.visitors }));
  const salesRows = sales?.series.map((p) => ({ day: p.day, grossFils: p.grossFils, orders: p.orders, tickets: p.tickets })) ?? [];

  return (
    <div className="mp-an">
      <style dangerouslySetInnerHTML={{ __html: ANALYTICS_CSS }} />

      <header className="mp-an-hero">
        <p className="mp-eyebrow">Analytics · {range.label}</p>
        <h1>How the studio is doing{firstName ? `, ${firstName}` : ""}</h1>
        <p className="mp-an-hero__sub">{headline}</p>
      </header>

      <RangeBar {...rangeBar}>
        {isAdmin && k?.includesTestOrders ? (
          <span className="mp-chip mp-chip--warn" title="Payments is not Live yet, so test and mock orders are counted. Once Live, only real orders count.">
            Including test orders
          </span>
        ) : null}
        {isAdmin ? (
          <a className="mp-actions__btn" href="#mp-an-exports-section">
            <Icon name="page" size={15} /> Download CSV
          </a>
        ) : null}
      </RangeBar>

      {/* ── Headline tiles ─────────────────────────────────────────────── */}
      <section aria-label="Headline numbers" className="mp-an-section">
        {isAdmin && k ? (
          <div className="mp-an-kpis">
            <Kpi icon="card" label="Revenue" value={fmtNum(Math.round(k.grossFils.value / 100))} unit="AED" delta={<DeltaLine delta={k.grossFils} range={range} format={aed} />} hint={k.refunds.amountFils ? `${aed(k.grossAfterRefundsFils)} after refunds` : "Including VAT"} href={col("orders?where[status][in]=confirmed,completed")} />
            <Kpi icon="bag" label="Bookings" value={fmtNum(k.orders.value)} delta={<DeltaLine delta={k.orders} range={range} />} hint={`${fmtNum(k.channel.online.orders)} online · ${fmtNum(k.channel.desk.orders)} at the desk`} href={col("orders")} />
            <Kpi icon="ticket" label="Seats sold" value={fmtNum(k.tickets.value)} delta={<DeltaLine delta={k.tickets} range={range} />} hint="Tickets on the bookings above" href={col("tickets")} />
            <Kpi icon="users" label="Daily visitors" value={fmtNum(t.visitors.value)} delta={<DeltaLine delta={t.visitors} range={range} />} hint="Each visitor counted once a day" />
            <Kpi icon="star" label="Average booking" value={k.aovFils ? fmtNum(Math.round(k.aovFils / 100)) : "—"} unit={k.aovFils ? "AED" : undefined} hint={k.aovFils ? aed(k.aovFils) : "Appears with the first booking"} />
            <Kpi
              icon="refund"
              label="Refunds"
              value={fmtNum(k.refunds.count)}
              hint={k.refunds.pendingApproval ? `${k.refunds.pendingApproval} waiting for your approval` : k.refunds.amountFils ? `${aed(k.refunds.amountFils)} returned` : "None in these dates"}
              tone={k.refunds.pendingApproval ? "attention" : undefined}
              href={col(k.refunds.pendingApproval ? "refunds?where[status][equals]=requested" : "refunds")}
            />
            <Kpi icon="page" label="Page views" value={fmtNum(t.views.value)} delta={<DeltaLine delta={t.views} range={range} />} hint={t.viewsPerVisitor ? `${t.viewsPerVisitor.toFixed(1)} pages per visit` : "Pages opened on the website"} />
            <Kpi icon="clock" label="Unfinished checkouts" value={fmtNum(k.abandonedCheckouts)} hint="Started online but never paid — the seats went back on sale" tone={k.abandonedCheckouts ? undefined : "muted"} />
          </div>
        ) : (
          <div className="mp-an-kpis">
            <Kpi icon="users" label="Daily visitors" value={fmtNum(t.visitors.value)} delta={<DeltaLine delta={t.visitors} range={range} />} hint="Each visitor counted once a day" />
            <Kpi icon="page" label="Page views" value={fmtNum(t.views.value)} delta={<DeltaLine delta={t.views} range={range} />} hint="Pages opened on the website" />
            <Kpi icon="text" label="Pages per visit" value={t.viewsPerVisitor ? t.viewsPerVisitor.toFixed(1) : "—"} hint="How far people read" />
            <Kpi icon="calendar" label="Booking pages opened" value={fmtNum(traffic.funnel[1]?.count ?? 0)} hint="Daily visitors who opened an event's Book page" />
          </div>
        )}
      </section>

      {/* ── Sales (admins) ─────────────────────────────────────────────── */}
      {isAdmin && sales && k ? (
        <section className="mp-an-section" aria-labelledby="mp-an-sales">
          <SectionHead id="mp-an-sales" title="Sales" sub={k.includesTestOrders ? "Counting test orders too, until Payments goes Live." : "Paid and desk-confirmed bookings, by the day they were confirmed."} />
          <div className="mp-an-grid mp-an-grid--wide">
            <Card title="Sales per day" sub="Money taken each day, including VAT" id="mp-an-sales-day">
              <p className="mp-an-card__total">
                <strong>{aed(k.grossFils.value)}</strong>
                {fmtNum(k.orders.value)} {k.orders.value === 1 ? "booking" : "bookings"} · {fmtNum(k.tickets.value)} seats
              </p>
              {k.orders.value > 0 ? (
                <>
                  <TimeChart
                    title="Sales per day"
                    kind="columns"
                    rows={salesRows}
                    series={[
                      { key: "grossFils", label: "Sales", unit: "fils", slot: 1 },
                      { key: "orders", label: "Bookings", unit: "count", slot: null },
                      { key: "tickets", label: "Seats", unit: "count", slot: null },
                    ]}
                    summary={`${aed(k.grossFils.value)} from ${fmtNum(k.orders.value)} bookings over ${range.days} days`}
                  />
                  <DayTable caption="Sales per day" rows={salesRows} columns={[{ key: "grossFils", label: "Sales AED", money: true }, { key: "orders", label: "Bookings" }, { key: "tickets", label: "Seats" }]} />
                </>
              ) : (
                <Empty title="No bookings in these dates" body="Each paid online booking and each desk booking adds to this chart on the day it is confirmed. Try a longer period above." />
              )}
            </Card>
            <div className="mp-an-col">
              <Card title="Online or at the desk" sub="Share of the money taken" id="mp-an-channel">
                <SplitBar
                  label="Sales by channel"
                  parts={[
                    { key: "online", label: "Online", amount: k.channel.online.grossFils, value: aed(k.channel.online.grossFils), slot: 1 },
                    { key: "desk", label: "Desk", amount: k.channel.desk.grossFils, value: aed(k.channel.desk.grossFils), slot: 2 },
                  ]}
                />
              </Card>
              <Card title="Refunds & discounts" id="mp-an-refunds" link={{ href: col("refunds"), label: "Refunds" }}>
                <StatList
                  items={[
                    { key: "refunded", label: "Refunded", value: k.refunds.count ? `${fmtNum(k.refunds.count)} · ${aed(k.refunds.amountFils)}` : "None", href: col("refunds?where[status][equals]=succeeded") },
                    ...(k.refunds.pendingApproval ? [{ key: "pending", label: "Waiting for your approval", value: fmtNum(k.refunds.pendingApproval), tone: "warn" as const, href: col("refunds?where[status][equals]=requested") }] : []),
                    { key: "promo", label: "Promo codes used", value: k.promo.orders ? `${fmtNum(k.promo.orders)} · −${aed(k.promo.discountFils)}` : "None", hint: k.promo.topCodes.length ? `Most used: ${k.promo.topCodes.slice(0, 3).map((c) => `${c.code} (${c.orders})`).join(", ")}` : undefined, href: col("promo-codes") },
                    { key: "passes", label: "Paid with pass credits", value: k.passCredits.orders ? `${fmtNum(k.passCredits.orders)} · ${fmtNum(k.passCredits.credits)} credits` : "None", href: col("pass-purchases") },
                  ]}
                />
              </Card>
            </div>
          </div>
          <div className="mp-an-grid">
            <Card title="Best-selling experiences" sub="By money taken" id="mp-an-experiences" link={{ href: col("experiences"), label: "Experiences" }}>
              <BarList
                label="Best-selling experiences"
                items={sales.topExperiences.map((e) => ({ key: e.key, label: e.name, value: aed(e.grossFils), amount: e.grossFils, secondary: `${fmtNum(e.tickets)} seats · ${fmtNum(e.orders)} ${e.orders === 1 ? "booking" : "bookings"}` }))}
                empty={<Empty title="Nothing sold in these dates" body="Experiences are ranked here by what they earned once bookings come in." />}
              />
            </Card>
            <Card title="How full the sessions were" sub="Published sessions in these dates" id="mp-an-fill" link={{ href: col("sessions"), label: "All sessions" }}>
              {sales.sessionFill.length ? (
                <ul className="mp-an-fill">
                  {sales.sessionFill.map((s) => {
                    const total = Math.max(1, s.seatsTotal);
                    return (
                      <li key={s.sessionId}>
                        <Link href={col(`sessions/${s.sessionId}`)} prefetch={false}>
                          <span className="mp-an-fill__title">
                            {s.title}
                            {s.cancelled ? <span className="mp-chip mp-chip--bad">Cancelled</span> : s.fill >= 1 ? <span className="mp-chip mp-chip--ok">Full</span> : null}
                          </span>
                          <span className="mp-an-fill__when">{fmtWhen(s.startsAt)}</span>
                          <span className="mp-an-fill__seats">
                            <span>
                              <strong>{s.seatsSold}</strong> of {s.seatsTotal} · {fmtPct(s.fill)}
                              {s.seatsHeld ? <span title="In someone's basket right now"> · {s.seatsHeld} held</span> : null}
                            </span>
                            <span className="mp-an-fill__bar" aria-hidden="true">
                              {s.seatsSold ? <span className="is-sold" style={{ width: `${(s.seatsSold / total) * 100}%` }} /> : null}
                              {s.seatsHeld ? <span className="is-held" style={{ width: `${(s.seatsHeld / total) * 100}%` }} /> : null}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty title="No sessions in these dates" body="Each published session that starts in the chosen dates is listed with seats sold out of its capacity." action={{ href: col("sessions/create"), label: "Add a session" }} />
              )}
            </Card>
          </div>
        </section>
      ) : null}

      {/* ── Website ────────────────────────────────────────────────────── */}
      <section className="mp-an-section" aria-labelledby="mp-an-web">
        <SectionHead id="mp-an-web" title="Website" sub="Counted without cookies. No names, emails or IP addresses are kept." />

        {!data.hasTraffic ? (
          <div className="mp-card mp-an-welcome">
            <span className="mp-an-welcome__icon" aria-hidden="true">
              <Icon name="chart" size={22} />
            </span>
            <div>
              <h3>The website hasn&rsquo;t recorded a visit yet</h3>
              <p>As soon as someone opens a page, it shows up here within a few seconds — today&rsquo;s numbers are always live. Visits are counted privately on our own server: no cookie banner is needed for it, and nobody can be identified from it.</p>
              <ul>
                <li>Staff previews and the checkout pages are never counted.</li>
                <li>Each visitor is counted once per day, so a period&rsquo;s figure is the sum of its days.</li>
                <li>
                  Want Google Analytics or a Meta pixel as well? Add it in{" "}
                  <Link className="mp-card__link" href={`${adminRoute}/globals/analytics-settings`} prefetch={false}>
                    Settings → Analytics &amp; tracking
                  </Link>
                  .
                </li>
              </ul>
            </div>
          </div>
        ) : null}

        <Card title="Visits per day" sub="Pages opened, and the number of different visitors each day" id="mp-an-visits">
          {anyTrafficInRange ? (
            <>
              <TimeChart
                title="Visits per day"
                kind="lines"
                rows={trafficRows}
                series={[
                  { key: "views", label: "Page views", unit: "count", slot: 1 },
                  { key: "visitors", label: "Daily visitors", unit: "count", slot: 2 },
                ]}
                summary={`${fmtNum(t.views.value)} page views from ${fmtNum(t.visitors.value)} daily visitors over ${range.days} days`}
              />
              <DayTable caption="Visits per day" rows={trafficRows} columns={[{ key: "views", label: "Page views" }, { key: "visitors", label: "Daily visitors" }]} />
            </>
          ) : (
            <Empty title="No visits in these dates" body={data.hasTraffic ? "Try a longer period with the buttons above." : "The chart fills in from the first visit."} />
          )}
        </Card>

        <div className="mp-an-grid">
          <Card title="Most-visited pages" sub="Page views · share of all views" id="mp-an-pages">
            <BarList label="Most-visited pages" items={pageItems(traffic.topPages)} empty={<Empty title="No pages yet" body="The ten most-opened pages appear here. Click one to open it on the site." />} />
            {t.unmatchedViews ? <p className="mp-an-card__sub" style={{ marginTop: 8 }}>{fmtNum(t.unmatchedViews)} views were of pages that don&rsquo;t exist (old links, typos, robots).</p> : null}
          </Card>
          <Card title="How people found you" sub="First page of each visit · daily visitors" id="mp-an-sources">
            <BarList label="Ways in" items={shareItems(traffic.channels)} empty={<Empty title="Nothing yet" body="Search, social media, email and other websites are told apart here." />} />
            {traffic.referrers.length ? (
              <>
                <p className="mp-eyebrow" style={{ margin: "14px 0 6px" }}>
                  Top referring sites
                </p>
                <BarList label="Top referring sites" items={shareItems(traffic.referrers)} />
              </>
            ) : null}
          </Card>
        </div>

        <div className="mp-an-grid">
          <Card title="From looking to booking" sub={isAdmin ? "Event pages through to paid online orders" : "Event pages and booking pages"} id="mp-an-funnel">
            <Funnel steps={traffic.funnel} />
            {!isAdmin ? <p className="mp-an-card__sub" style={{ marginTop: 10 }}>Checkout and payment steps are shown to admins.</p> : null}
          </Card>
          <div className="mp-an-col">
            <Card title="Phones, tablets & computers" sub="Daily visitors" id="mp-an-devices">
              <BarList label="Devices" items={shareItems(traffic.devices)} empty={<Empty title="Nothing yet" body="Shows whether people browse on phones or computers." />} />
              {traffic.browsers.length ? (
                <p className="mp-an-card__sub" style={{ marginTop: 10 }}>
                  Browsers: {traffic.browsers.slice(0, 5).map((b) => `${b.label} ${fmtPct(b.share)}`).join(" · ")}
                </p>
              ) : null}
            </Card>
            <Card title="Countries" sub="Daily visitors" id="mp-an-countries">
              <BarList label="Countries" items={shareItems(traffic.countries.slice(0, 6))} empty={<Empty title="Nothing yet" body="Where visitors are browsing from, when the hosting provides it." />} />
            </Card>
          </div>
        </div>
      </section>

      {/* ── Accounts & exports (admins) ────────────────────────────────── */}
      {isAdmin && sales && k ? (
        <section className="mp-an-section" aria-labelledby="mp-an-exports-section">
          <SectionHead id="mp-an-exports-section" title="For the accountant" sub={`Same dates as above: ${range.label}.`} />
          <div className="mp-an-grid">
            <VatTile vat={sales.vat} rangeLabel={range.label} exportHref={csv("invoices")} includesTestOrders={k.includesTestOrders} />
            <Card title="Behind the scenes" sub="Things that only need a look when they are not zero" id="mp-an-ops">
              <StatList
                items={[
                  { key: "notifications", label: "Emails that failed to send", value: fmtNum(sales.ops.failedNotifications), tone: sales.ops.failedNotifications ? "warn" : "ok", href: col("notification-log?where[status][equals]=failed") },
                  { key: "jobs", label: "Background tasks that failed", value: fmtNum(sales.ops.failedJobs), tone: sales.ops.failedJobs ? "warn" : "ok", href: col("payload-jobs?where[hasError][equals]=true") },
                  { key: "review", label: "Orders needing a look", value: fmtNum(sales.ops.needsReview), tone: sales.ops.needsReview ? "warn" : "ok", href: col("orders?where[needsReview][equals]=true") },
                  { key: "disputes", label: "Open card disputes", value: fmtNum(sales.ops.openDisputes), tone: sales.ops.openDisputes ? "bad" : "ok", href: col("orders?where[disputed][equals]=true") },
                  { key: "holds", label: "Seat holds", value: `${fmtNum(sales.ops.holds.converted)} booked · ${fmtNum(sales.ops.holds.expired)} let go`, hint: sales.ops.holds.active ? `${sales.ops.holds.active} in someone's basket right now` : "Seats held while a customer checks out" },
                  { key: "forced", label: "Check-ins let through by hand", value: fmtNum(sales.ops.forcedCheckIns), hint: "Tickets admitted with “Let in anyway”" },
                ]}
              />
            </Card>
          </div>
          <ExportCsv apiRoute={apiRoute} range={range} />
        </section>
      ) : null}
    </div>
  );
}
