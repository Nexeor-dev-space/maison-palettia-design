"use client";

import { useAuth, useConfig, useDocumentInfo } from "@payloadcms/ui";
import React, { useEffect, useRef, useState } from "react";

import { type AttendeeRow, type CheckInResponse, callApi, fmtDay, fmtTime } from "@/cms/components/checkin/client";
import { CHECKIN_CSS } from "@/cms/components/checkin/styles";

/**
 * ==========================================================================
 * AttendeeList — who is coming, who has arrived (SPEC §H.7, §I)
 * ==========================================================================
 *
 * The front desk's paper list, on screen: one row per ticket, grouped by
 * booker (holder, booking reference, seat n of qty), with phone, email and
 * the customer's booking notes, and whether they have arrived.
 *
 * Two ways in:
 *   · `AttendeeListPanel` — given a session id; the check-in view opens it
 *     under a session card.
 *   · `AttendeeList` — the same panel as a `ui` field on the session's edit
 *     page (it reads the document id). Hidden from editors: the rows are
 *     customer data, and the endpoint refuses them anyway.
 *
 * "Mark as arrived" goes through the same check-in endpoint as the scanner
 * (`{ code, device: "list" }`), so the verdict rules are the same: a
 * cancelled or refunded seat cannot be marked, and outside the session's
 * check-in window the desk is asked before forcing. Undo is admin-only and
 * asks for a note, which lands on the order's timeline.
 *
 * Print prints only this list (print CSS hides the rest of the admin);
 * "Download CSV" is `GET /api/actions/sessions/{id}/attendees.csv`.
 */

type Props = { sessionId: string; onChange?: () => void; heading?: string };

export function AttendeeListPanel({ sessionId, onChange, heading = "Attendee list" }: Props) {
  const { config } = useConfig();
  const { user } = useAuth();
  const isAdmin = (user as { role?: string } | null)?.role === "admin";
  const apiBase = `${config.serverURL ?? ""}${config.routes.api}`;
  const adminBase = `${config.serverURL ?? ""}${config.routes.admin}`;
  const [rows, setRows] = useState<AttendeeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await callApi<{ rows: AttendeeRow[] }>(apiBase, `/actions/tickets/attendees?session=${encodeURIComponent(sessionId)}`);
        if (cancelled) return;
        setRows(data.rows);
        setError(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [apiBase, sessionId, reloadKey]);

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    window.print();
    return () => window.removeEventListener("afterprint", done);
  }, [printing]);

  const markArrived = async (row: AttendeeRow, force = false) => {
    setBusy(row.ticketId);
    try {
      const r = await callApi<CheckInResponse>(apiBase, "/actions/tickets/check-in", { method: "POST", body: { code: row.code, device: "list", force } });
      if (r.forceable && !force) {
        const why =
          r.verdict === "wrong_day"
            ? `This ticket is for ${fmtDay(r.sessionStartsAt)} at ${fmtTime(r.sessionStartsAt)}, outside its check-in window.`
            : `Already checked in at ${fmtTime(r.checkedInAt)}.`;
        if (window.confirm(`${why}\n\nMark ${row.holder || row.code} as arrived anyway? This is noted on the booking.`)) {
          setBusy(null);
          return markArrived(row, true);
        }
      } else if (r.verdict !== "ok") {
        window.alert(r.verdict === "not_found" ? "That ticket no longer exists." : `Cannot mark as arrived: the ticket is ${r.verdict.replace(/_/g, " ")}.`);
      }
      reload();
      onChange?.();
    } catch (e) {
      window.alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const undo = async (row: AttendeeRow) => {
    const note = window.prompt(`Undo the check-in for ${row.holder || row.code}? Say why (saved on the booking):`);
    if (note === null) return;
    setBusy(row.ticketId);
    try {
      await callApi<{ undone: boolean }>(apiBase, `/actions/tickets/${row.ticketId}/undo-check-in`, { method: "POST", body: { note } });
      reload();
      onChange?.();
    } catch (e) {
      window.alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const live = rows?.filter((r) => r.status === "valid" || r.status === "checked_in") ?? [];
  const arrived = live.filter((r) => r.status === "checked_in").length;

  return (
    <div ref={rootRef} className={`mp-att${printing ? " mp-att--printing" : ""}`}>
      <style>{CHECKIN_CSS}</style>
      <div className="mp-att__summary">
        <h3 style={{ margin: 0 }}>
          {heading}
          {rows ? (
            <span className="mp-att__muted" style={{ fontWeight: 400 }}>
              {" "}
              · {arrived} of {live.length} arrived
            </span>
          ) : null}
        </h3>
        <div className="mp-ci-row mp-noprint">
          <button type="button" className="mp-ci-btn mp-ci-btn--small" onClick={reload}>
            Refresh
          </button>
          <button type="button" className="mp-ci-btn mp-ci-btn--small" onClick={() => setPrinting(true)} disabled={!rows?.length}>
            Print
          </button>
          <a className="mp-ci-btn mp-ci-btn--small" href={`${apiBase}/actions/sessions/${sessionId}/attendees.csv`}>
            Download CSV
          </a>
        </div>
      </div>
      {error ? (
        <p className="mp-ci-error" role="alert">
          {error}
        </p>
      ) : null}
      {rows === null && !error ? <p className="mp-att__muted">Loading…</p> : null}
      {rows && rows.length === 0 ? <p className="mp-att__muted">No tickets for this session yet.</p> : null}
      {rows && rows.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Booking</th>
              <th>Seat</th>
              <th>Contact</th>
              <th>Notes</th>
              <th>Arrived</th>
              <th className="mp-noprint" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ticketId} data-status={r.status}>
                <td data-label="Name">
                  <strong>{r.holder || "—"}</strong>
                  <div className="mp-att__muted">{r.code}</div>
                </td>
                <td data-label="Booking">
                  {r.orderId ? (
                    <a href={`${adminBase}/collections/orders/${r.orderId}`}>
                      {r.orderReference || "—"}
                    </a>
                  ) : (
                    r.orderReference || "—"
                  )}
                </td>
                <td data-label="Seat" className="mp-att__num">
                  {r.seatNo} of {r.qty}
                </td>
                <td data-label="Contact">
                  {r.phone ? <div>{r.phone}</div> : null}
                  {r.email ? <div className="mp-att__muted">{r.email}</div> : null}
                </td>
                <td data-label="Notes">{r.notes || ""}</td>
                <td data-label="Arrived" className="mp-att__num">
                  {r.status === "checked_in" ? (
                    <>
                      ✓ {fmtTime(r.checkedInAt)}
                      {r.forced ? <span className="mp-att__muted"> (override)</span> : null}
                      {r.checkedInByName ? <div className="mp-att__muted">{r.checkedInByName}</div> : null}
                    </>
                  ) : r.status === "valid" ? (
                    "—"
                  ) : (
                    <span>{r.status}</span>
                  )}
                </td>
                <td className="mp-noprint">
                  {r.status === "valid" ? (
                    <button type="button" className="mp-ci-btn mp-ci-btn--small" onClick={() => void markArrived(r)} disabled={busy !== null}>
                      {busy === r.ticketId ? "…" : "Mark as arrived"}
                    </button>
                  ) : r.status === "checked_in" && isAdmin ? (
                    <button type="button" className="mp-ci-btn mp-ci-btn--small" onClick={() => void undo(r)} disabled={busy !== null}>
                      {busy === r.ticketId ? "…" : "Undo"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

/** The `ui` field on a session's edit page. Staff only; nothing for a session that has not been saved yet. */
export function AttendeeList() {
  const { id } = useDocumentInfo();
  const { user } = useAuth();
  const role = (user as { role?: string } | null)?.role;
  const [open, setOpen] = useState(false);
  if (!id || (role !== "admin" && role !== "front-desk")) return null;
  return (
    <div style={{ marginBlock: "calc(var(--base) * 0.5) var(--base)" }}>
      <style>{CHECKIN_CSS}</style>
      {open ? (
        <AttendeeListPanel sessionId={String(id)} />
      ) : (
        <button type="button" className="mp-ci-btn" onClick={() => setOpen(true)}>
          Show attendee list
        </button>
      )}
    </div>
  );
}
