"use client";

import React from "react";

import { type CheckInResponse, fmtDay, fmtTime, toneOf } from "./client";

/**
 * ==========================================================================
 * Verdict — the big coloured answer after a scan (SPEC §H.7)
 * ==========================================================================
 *
 * Read from arm's length at a busy door: one word-sized headline in the
 * verdict's colour (green welcome, amber "look again", red "do not let in"),
 * then who it is for and which seat. `already_checked_in` and `wrong_day`
 * offer "Let in anyway", which re-sends the same scan with `force: true`
 * and is recorded on the ticket (`checkInForced`) and the order's timeline.
 * `void`, `refunded` and `not_found` have no override — that is the point
 * of them.
 */

const HEADLINES: Record<CheckInResponse["verdict"], string> = {
  ok: "Welcome — checked in",
  already_checked_in: "Already checked in",
  wrong_day: "Not this session's time",
  void: "Ticket cancelled — do not admit",
  refunded: "Ticket refunded — do not admit",
  not_found: "No ticket with this code",
};

function detailOf(r: CheckInResponse): string | null {
  switch (r.verdict) {
    case "ok":
      return r.forced ? "Let in by override — noted on the booking." : null;
    case "already_checked_in":
      return `Arrived at ${fmtTime(r.checkedInAt)}${r.checkedInByName ? `, checked in by ${r.checkedInByName}` : ""}. Someone may be using a copy of this ticket.`;
    case "wrong_day": {
      const when = r.sessionStartsAt ? `${fmtDay(r.sessionStartsAt)} at ${fmtTime(r.sessionStartsAt)}` : "another time";
      const window = r.window ? ` Check-in for it opens ${fmtTime(r.window.opensAt)} and closes ${fmtTime(r.window.closesAt)}.` : "";
      return `This ticket is for ${when}.${window}`;
    }
    case "void":
      return "The booking was cancelled or moved to another session. Ask for the booking reference and look it up.";
    case "refunded":
      return "This seat was refunded. Ask for the booking reference and look it up.";
    case "not_found":
      return "Check the code was typed correctly, or ask for the booking reference.";
  }
}

export function Verdict({
  result,
  busy,
  onForce,
  onDismiss,
  orderHref,
}: {
  result: CheckInResponse;
  busy: boolean;
  onForce: () => void;
  onDismiss: () => void;
  orderHref: (orderId: string) => string;
}) {
  const tone = toneOf(result.verdict);
  const detail = detailOf(result);
  return (
    <section className={`mp-ci-verdict mp-ci-verdict--${tone}`} role="status" aria-live="assertive">
      <h2 className="mp-ci-verdict__headline">{HEADLINES[result.verdict]}</h2>
      {result.holder ? (
        <p className="mp-ci-verdict__holder">
          {result.holder}
          {result.seatNo && result.qty ? (
            <span className="mp-ci-verdict__seat">
              {" "}
              · seat {result.seatNo} of {result.qty}
            </span>
          ) : null}
        </p>
      ) : null}
      {result.sessionTitle ? (
        <p className="mp-ci-verdict__meta">
          {result.sessionTitle}
          {result.sessionStartsAt ? ` · ${fmtDay(result.sessionStartsAt)} ${fmtTime(result.sessionStartsAt)}` : ""}
        </p>
      ) : null}
      {detail ? <p className="mp-ci-verdict__detail">{detail}</p> : null}
      {result.verdict === "ok" && typeof result.remainingOnOrder === "number" && result.remainingOnOrder > 0 ? (
        <p className="mp-ci-verdict__detail">
          {result.remainingOnOrder} more {result.remainingOnOrder === 1 ? "ticket" : "tickets"} on this booking still to arrive.
        </p>
      ) : null}
      <div className="mp-ci-row">
        {result.forceable ? (
          <button type="button" className="mp-ci-btn mp-ci-btn--warn" onClick={onForce} disabled={busy}>
            Let in anyway
          </button>
        ) : null}
        {result.orderId && result.orderReference ? (
          <a className="mp-ci-btn" href={orderHref(result.orderId)}>
            Booking {result.orderReference}
          </a>
        ) : null}
        <button type="button" className="mp-ci-btn" onClick={onDismiss}>
          Next
        </button>
      </div>
      {result.code ? <p className="mp-ci-verdict__code">{result.code}</p> : null}
    </section>
  );
}
