"use client";

import { SetStepNav, useConfig } from "@payloadcms/ui";
import React, { useCallback, useRef, useState } from "react";

import { AttendeeListPanel } from "@/cms/components/sessions/AttendeeList";

import { type CheckInResponse, type DaySession, type Device, callApi, feedback, fmtDayLong, fmtTime, toneOf, usePref } from "./client";
import { Scanner } from "./Scanner";
import { CHECKIN_CSS } from "./styles";
import { Verdict } from "./Verdict";

/**
 * ==========================================================================
 * CheckInDesk — the client half of /admin/check-in (SPEC §H.7, §I)
 * ==========================================================================
 *
 * Left (top on a phone): the scanner, the verdict and the last ten scans.
 * Right (below on a phone): the day's sessions with arrived / sold, each
 * opening its attendee list for "Mark as arrived".
 *
 * Every scan is one POST to `/api/actions/tickets/check-in`; the server
 * decides the verdict, the screen only shows it. While a request is in
 * flight the camera is paused, and the same payload is ignored for a few
 * seconds after it was answered, so a QR held still in front of the lens
 * produces one verdict, not five. "Let in anyway" re-sends the last scan
 * with `force: true`.
 *
 * The day sheet arrives server-rendered with the page and is refreshed from
 * `GET /api/actions/tickets/day` after every check-in, so the counts move
 * as people arrive without reloading the admin.
 */

type Recent = { at: number; result: CheckInResponse };
type LastInput = { qr?: string; code?: string; device: Device };

const REPEAT_MS = 4000;

export function CheckInDesk({
  date,
  today,
  initialSessions,
  loadError,
}: {
  date: string;
  today: string;
  initialSessions: DaySession[];
  loadError: string | null;
}) {
  const { config } = useConfig();
  const apiBase = `${config.serverURL ?? ""}${config.routes.api}`;
  const adminBase = `${config.serverURL ?? ""}${config.routes.admin}`;

  const [sessions, setSessions] = useState(initialSessions);
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);
  const [sound, setSound] = usePref("mp-checkin-sound", true);
  const last = useRef<{ input: LastInput; key: string; at: number } | null>(null);

  const refreshDay = useCallback(async () => {
    try {
      const data = await callApi<{ sessions: DaySession[] }>(apiBase, `/actions/tickets/day?date=${date}`);
      setSessions(data.sessions);
    } catch {
      /* the counts are a convenience; the verdict already told the desk what it needs */
    }
  }, [apiBase, date]);

  const submit = useCallback(
    async (input: LastInput, force = false) => {
      const key = input.qr ?? input.code ?? "";
      const prev = last.current;
      if (!force && prev && prev.key === key && Date.now() - prev.at < REPEAT_MS) return;
      last.current = { input, key, at: Date.now() };
      setBusy(true);
      setError(null);
      try {
        const r = await callApi<CheckInResponse>(apiBase, "/actions/tickets/check-in", { method: "POST", body: { ...input, force } });
        setResult(r);
        setRecent((list) => [{ at: Date.now(), result: r }, ...list].slice(0, 10));
        feedback(toneOf(r.verdict), sound);
        if (r.verdict === "ok") {
          void refreshDay();
          setListVersion((v) => v + 1);
        }
      } catch (e) {
        setError((e as Error).message);
        feedback("stop", sound);
      } finally {
        setBusy(false);
        if (last.current) last.current.at = Date.now();
      }
    },
    [apiBase, refreshDay, sound],
  );

  const toggleSound = () => setSound(!sound);

  const dayHref = (d: string) => `${adminBase}/check-in${d === today ? "" : `?date=${d}`}`;
  const shift = (d: string, days: number) => {
    const t = new Date(`${d}T12:00:00+04:00`);
    t.setUTCDate(t.getUTCDate() + days);
    return t.toISOString().slice(0, 10);
  };

  return (
    <div className="mp-ci">
      <style>{CHECKIN_CSS}</style>
      <SetStepNav nav={[{ label: "Check-in" }]} />
      <header className="mp-ci-row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Check-in</h1>
          <p className="mp-ci-sub">
            {fmtDayLong(date)}
            {date === today ? " · today" : ""}
          </p>
        </div>
        <div className="mp-ci-row">
          <button type="button" className="mp-ci-btn mp-ci-btn--small" onClick={toggleSound} aria-pressed={sound}>
            Sound {sound ? "on" : "off"}
          </button>
        </div>
      </header>

      <div className="mp-ci-grid">
        <div style={{ display: "grid", gap: "var(--mp-gap)", minWidth: 0 }}>
          <section className="mp-ci-card" aria-label="Scan a ticket">
            <Scanner busy={busy} onScan={(qr) => void submit({ qr, device: "camera" })} onManual={(code) => void submit({ code, device: "manual" })} />
          </section>
          {error ? (
            <p className="mp-ci-error" role="alert">
              {error}
            </p>
          ) : null}
          {result ? (
            <Verdict
              result={result}
              busy={busy}
              onForce={() => last.current && void submit(last.current.input, true)}
              onDismiss={() => setResult(null)}
              orderHref={(id) => `${adminBase}/collections/orders/${id}`}
            />
          ) : null}
          {recent.length > 0 ? (
            <section className="mp-ci-card" aria-label="Last scans">
              <h3>Last scans</h3>
              <ul className="mp-ci-recent">
                {recent.map(({ at, result: r }) => (
                  <li key={at}>
                    <time>{fmtTime(new Date(at).toISOString())}</time>
                    <span className={`mp-ci-dot mp-ci-dot--${toneOf(r.verdict)}`} aria-hidden />
                    <span>
                      <strong>{r.holder || r.code || "Unknown code"}</strong>{" "}
                      <span className="mp-att__muted">
                        {r.verdict === "ok" ? (r.forced ? "let in (override)" : "checked in") : r.verdict.replace(/_/g, " ")}
                        {r.seatNo && r.qty ? ` · seat ${r.seatNo}/${r.qty}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <section className="mp-ci-card" aria-label="Sessions">
          <div className="mp-ci-row" style={{ justifyContent: "space-between" }}>
            <h2>Sessions</h2>
            <nav className="mp-ci-row" aria-label="Day">
              <a className="mp-ci-btn mp-ci-btn--small" href={dayHref(shift(date, -1))}>
                ← Previous
              </a>
              {date !== today ? (
                <a className="mp-ci-btn mp-ci-btn--small" href={dayHref(today)}>
                  Today
                </a>
              ) : null}
              <a className="mp-ci-btn mp-ci-btn--small" href={dayHref(shift(date, 1))}>
                Next →
              </a>
            </nav>
          </div>
          {loadError ? (
            <p className="mp-ci-error" role="alert">
              {loadError}
            </p>
          ) : null}
          {!loadError && sessions.length === 0 ? <p className="mp-ci-sub">No sessions on this day.</p> : null}
          <ul className="mp-ci-sessions">
            {sessions.map((s) => {
              const open = openSession === s.id;
              const pct = s.sold > 0 ? Math.round((s.checkedIn / s.sold) * 100) : 0;
              return (
                <li key={s.id} className="mp-ci-session" data-open={open}>
                  <div className="mp-ci-session__top">
                    <span>
                      <span className="mp-ci-session__time">{fmtTime(s.startsAt)}</span> <strong>{s.title}</strong>
                      {s.status === "draft" ? <span className="mp-ci-pill"> draft</span> : null}
                    </span>
                    <span className="mp-ci-session__count">
                      {s.checkedIn} / {s.sold} arrived
                      <span className="mp-att__muted"> · {s.seatsTotal} seats</span>
                    </span>
                  </div>
                  {s.venue ? <div className="mp-att__muted">{s.venue}</div> : null}
                  <div className="mp-ci-bar" aria-hidden>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mp-ci-row">
                    <button type="button" className="mp-ci-btn mp-ci-btn--small" onClick={() => setOpenSession(open ? null : s.id)} aria-expanded={open}>
                      {open ? "Hide attendees" : "Attendees"}
                    </button>
                    <a className="mp-ci-btn mp-ci-btn--small" href={`${adminBase}/collections/sessions/${s.id}`}>
                      Open session
                    </a>
                  </div>
                  {open ? <AttendeeListPanel key={`${s.id}:${listVersion}`} sessionId={s.id} heading={s.title} onChange={() => void refreshDay()} /> : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
