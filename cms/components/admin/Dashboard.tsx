import Link from "next/link";
import type { ServerProps } from "payload";
import React from "react";

import { Icon, type IconName } from "./icons";
import { type DashboardData, type DashSession, fmtAgo, fmtDay, fmtTime, loadDashboard, orderStatusLabel, orderTone } from "./adminData";

/**
 * ==========================================================================
 * Dashboard — the admin home for a studio owner (SPEC §I "Dashboard", 4B)
 * ==========================================================================
 *
 * What the owner wants to know at a glance, in the order they ask it:
 *
 *   1. a greeting with the studio's name and one sentence about today;
 *   2. quick actions — the seven or eight things people come here to do,
 *      each one click (role-filtered: the front desk is not offered
 *      "Edit homepage", editors are not offered "Refund an order");
 *   3. KPI tiles — bookings and revenue this week, new enquiries, visitors
 *      (a placeholder until 4A's rollup exists; the tile reads
 *      `analytics-daily` when it does);
 *   4. today's sessions with seats sold / left and a check-in shortcut,
 *      then recent orders, enquiries waiting, drafts and scheduled items.
 *
 * A server component (`admin.components.beforeDashboard`), rendered after
 * Warnings. Everything is a plain link, so the page is useful before any
 * JavaScript runs and prints cleanly. The reads are in ./adminData.ts; the
 * look is in app/(payload)/custom.scss under `.mp-dash`.
 */

type Quick = { label: string; href: string; icon: IconName; roles: Array<DashboardData["role"]>; primary?: boolean };

function quickActions(data: DashboardData): Quick[] {
  const all: Quick[] = [
    { label: "Add a session", href: "/admin/collections/sessions/create", icon: "plus", roles: ["admin", "editor"], primary: true },
    { label: "Desk booking", href: "/admin/collections/orders?desk=1", icon: "bag", roles: ["admin", "front-desk"], primary: data.role === "front-desk" },
    { label: "Check-in", href: "/admin/check-in", icon: "check", roles: ["admin", "front-desk"] },
    { label: "Edit homepage", href: data.homePageId ? `/admin/collections/pages/${data.homePageId}` : "/admin/collections/pages", icon: "home", roles: ["admin", "editor"] },
    { label: "Write a journal post", href: "/admin/collections/posts/create", icon: "pen", roles: ["admin", "editor"] },
    { label: "Swap a photo", href: "/admin/collections/media", icon: "image", roles: ["admin", "editor"] },
    { label: "Refund an order", href: "/admin/collections/orders?where[status][in]=confirmed,completed", icon: "refund", roles: ["admin", "front-desk"] },
    { label: "Resend tickets", href: "/admin/collections/orders?where[status][equals]=confirmed", icon: "send", roles: ["admin", "front-desk"] },
    { label: "Invite staff", href: "/admin/collections/users?invite=1", icon: "users", roles: ["admin"] },
    { label: "Mamo Pay mode", href: "/admin/globals/payment-settings#field-mode", icon: "card", roles: ["admin"] },
    { label: "Analytics", href: "/admin/analytics", icon: "chart", roles: ["admin", "editor"] },
  ];
  return all.filter((q) => q.roles.includes(data.role));
}

function SessionRow({ session, showDate, canCheckIn }: { session: DashSession; showDate?: boolean; canCheckIn: boolean }) {
  const sold = session.sold ?? (session.available !== null ? session.seatsTotal - session.available - (session.held ?? 0) : null);
  const pct = sold !== null && session.seatsTotal > 0 ? Math.min(100, Math.round((sold / session.seatsTotal) * 100)) : 0;
  const chip =
    session.status === "cancelled" ? (
      <span className="mp-chip mp-chip--bad">Cancelled</span>
    ) : session.status === "draft" ? (
      <span className="mp-chip mp-chip--muted">Draft</span>
    ) : session.available === 0 ? (
      <span className="mp-chip mp-chip--warn">Fully booked</span>
    ) : session.bookingStatus !== "open" ? (
      <span className="mp-chip mp-chip--muted">{session.bookingStatus === "waitlist" ? "Waitlist only" : "Closed"}</span>
    ) : null;
  const date = session.startsAt.slice(0, 10);
  return (
    <li>
      <Link className="mp-sessions__row" href={`/admin/collections/sessions/${session.id}`}>
        <span>
          <span className="mp-sessions__time">{fmtTime(session.startsAt)}</span>
          {showDate ? <div className="mp-sessions__date">{fmtDay(session.startsAt)}</div> : null}
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="mp-sessions__title">
            {session.title}
            {chip}
          </span>
          <div className="mp-sessions__meta">{[session.venue, `${session.seatsTotal} seats`].filter(Boolean).join(" · ")}</div>
        </span>
        <span className="mp-sessions__seats">
          {sold !== null ? (
            <>
              <span>
                <strong>{sold}</strong> sold · <strong>{session.available ?? "—"}</strong> left
                {session.held ? <span title="In baskets right now"> · {session.held} held</span> : null}
              </span>
              <span className="mp-sessions__bar">
                <span style={{ width: `${pct}%` }} />
              </span>
            </>
          ) : (
            <span>{session.available !== null ? `${session.available} left` : ""}</span>
          )}
        </span>
      </Link>
      {canCheckIn && session.status === "published" && (sold ?? 0) > 0 ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -4, paddingRight: 2 }}>
          <Link className="mp-card__link" href={`/admin/check-in?date=${date}`}>
            Check in guests →
          </Link>
        </div>
      ) : null}
    </li>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mp-empty">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

export async function Dashboard({ payload, user }: ServerProps) {
  const data = await loadDashboard(payload, user);
  if (!data) return null;
  const staff = data.role === "admin" || data.role === "front-desk";
  const content = data.role === "admin" || data.role === "editor";
  const quick = quickActions(data);
  const hasSessionsToday = data.todaySessions.length > 0;

  return (
    <section className="mp-dash" aria-label="Overview">
      <header className="mp-dash__hero">
        <p className="mp-eyebrow">
          {data.studioName} · {data.todayLabel}
        </p>
        <h1 className="mp-dash__greeting">
          <span className="mp-script">{data.greeting},</span>
          <span>{data.firstName}</span>
        </h1>
        <p className="mp-dash__sub">{data.summary}</p>
        <nav className="mp-dash__quick" aria-label="Quick actions">
          {quick.map((q) => (
            <Link key={q.label} className={`mp-quick${q.primary ? " mp-quick--primary" : ""}`} href={q.href}>
              <Icon name={q.icon} />
              {q.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mp-dash__kpis">
        {data.kpis.map((kpi) => {
          const body = (
            <>
              <span className="mp-kpi__label">{kpi.label}</span>
              <span className="mp-kpi__value">
                {kpi.value}
                {kpi.unit ? <small>{kpi.unit}</small> : null}
              </span>
              {kpi.hint ? <span className="mp-kpi__hint">{kpi.hint}</span> : null}
            </>
          );
          const cls = `mp-card mp-kpi${kpi.tone === "attention" ? " mp-kpi--attention" : ""}${kpi.tone === "muted" ? " mp-kpi--muted" : ""}`;
          return kpi.href ? (
            <Link key={kpi.key} className={cls} href={kpi.href}>
              {body}
            </Link>
          ) : (
            <div key={kpi.key} className={cls}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="mp-dash__grid">
        <div className="mp-dash__col">
          <section className="mp-card" aria-label="Today's sessions">
            <div className="mp-card__head">
              <h2 className="mp-card__title">{hasSessionsToday ? "Today's sessions" : "Coming up"}</h2>
              <Link className="mp-card__link" href="/admin/collections/sessions">
                All sessions →
              </Link>
            </div>
            {hasSessionsToday ? (
              <ul className="mp-sessions">
                {data.todaySessions.map((s) => (
                  <SessionRow key={s.id} session={s} canCheckIn={staff} />
                ))}
              </ul>
            ) : data.upcoming.length ? (
              <>
                <p className="mp-kpi__hint" style={{ margin: "0 0 10px" }}>
                  No sessions today. The next {data.upcoming.length === 1 ? "one is" : `${data.upcoming.length} are`} below.
                </p>
                <ul className="mp-sessions">
                  {data.upcoming.map((s) => (
                    <SessionRow key={s.id} session={s} showDate canCheckIn={false} />
                  ))}
                </ul>
              </>
            ) : (
              <Empty
                title="No sessions in the next week"
                body={content ? "Add a session and publish it — it appears on the Events page within a second. Use “Repeat weekly” on a session to build a series." : "Nothing is scheduled in the next seven days."}
              />
            )}
            {hasSessionsToday && data.upcoming.length ? (
              <div style={{ marginTop: 12 }}>
                <p className="mp-eyebrow" style={{ marginBottom: 8 }}>
                  Next up
                </p>
                <ul className="mp-sessions">
                  {data.upcoming.slice(0, 3).map((s) => (
                    <SessionRow key={s.id} session={s} showDate canCheckIn={false} />
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {staff ? (
            <section className="mp-card" aria-label="Recent orders">
              <div className="mp-card__head">
                <h2 className="mp-card__title">Recent orders</h2>
                <Link className="mp-card__link" href="/admin/collections/orders">
                  All orders →
                </Link>
              </div>
              {data.recentOrders.length ? (
                <ul className="mp-rows">
                  {data.recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link className="mp-rows__row" href={`/admin/collections/orders/${o.id}`}>
                        <span className="mp-rows__primary">
                          <span className="mono">{o.reference}</span>
                          {o.who}
                          <span className={`mp-chip mp-chip--${orderTone(o.status)}`}>{orderStatusLabel(o.status)}</span>
                          {o.needsReview ? <span className="mp-chip mp-chip--warn">Needs review</span> : null}
                        </span>
                        <span className="mp-rows__secondary">
                          {o.what}
                          {o.channel === "desk" ? " · desk" : ""}
                        </span>
                        <span className="mp-rows__aside">
                          <strong>{o.gross}</strong>
                          {fmtAgo(o.createdAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="No bookings yet" body="Online bookings appear here the moment a customer pays. You can also take a booking at the desk with the button above." />
              )}
            </section>
          ) : null}
        </div>

        <div className="mp-dash__col">
          <section className="mp-card" aria-label="Enquiries">
            <div className="mp-card__head">
              <h2 className="mp-card__title">
                Enquiries {data.enquiriesNew ? <span className="mp-chip mp-chip--warn" style={{ marginLeft: 6, verticalAlign: "middle" }}>{data.enquiriesNew} new</span> : null}
              </h2>
              <Link className="mp-card__link" href="/admin/collections/enquiries">
                Inbox →
              </Link>
            </div>
            {data.enquiries.length ? (
              <ul className="mp-rows">
                {data.enquiries.map((e) => (
                  <li key={e.id}>
                    <Link className="mp-rows__row" href={`/admin/collections/enquiries/${e.id}`}>
                      <span className="mp-rows__primary">{e.name}</span>
                      <span className="mp-rows__secondary">{e.snippet || e.topic}</span>
                      <span className="mp-rows__aside">{fmtAgo(e.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="Inbox is clear" body="Messages from the contact and private-events forms land here. Reply from your own email; the status moves on its own." />
            )}
          </section>

          {content ? (
            <section className="mp-card" aria-label="Drafts and scheduled">
              <div className="mp-card__head">
                <h2 className="mp-card__title">Drafts &amp; scheduled</h2>
                <Link className="mp-card__link" href="/admin/collections/sessions?where[_status][equals]=draft">
                  Draft sessions →
                </Link>
              </div>
              {data.drafts.length ? (
                <ul className="mp-rows">
                  {data.drafts.map((d) => (
                    <li key={d.href + d.label}>
                      <Link className="mp-rows__row" href={d.href}>
                        <span className="mp-rows__primary">
                          {d.label}
                          <span className={`mp-chip ${d.scheduled ? "mp-chip--lilac" : "mp-chip--muted"}`}>{d.scheduled ? "Scheduled" : "Draft"}</span>
                        </span>
                        <span className="mp-rows__secondary">
                          {d.kind}
                          {d.when ? ` · ${d.when}` : ""}
                        </span>
                        <span className="mp-rows__aside">
                          <Icon name="arrow" size={14} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="Nothing waiting to be published" body="Unpublished sessions, pages and experiences show here, with anything scheduled to go live later." />
              )}
            </section>
          ) : null}

          {data.role === "admin" && data.refundsAwaiting ? (
            <Link className="mp-card mp-kpi mp-kpi--attention" href="/admin/collections/refunds?where[status][equals]=requested">
              <span className="mp-kpi__label">Refunds awaiting approval</span>
              <span className="mp-kpi__value">{data.refundsAwaiting}</span>
              <span className="mp-kpi__hint">Approve from the refund or the order; Mamo Pay does the rest.</span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
