import type { ArrayFieldServerComponent } from "payload";
import React from "react";

import { formatAed } from "@/cms/lib/money";

/**
 * ==========================================================================
 * OrderLines — what was bought, as one compact table (SPEC §I "Orders UX")
 * ==========================================================================
 *
 * The `lines` array is a snapshot written at checkout and never edited, so
 * Payload's array UI — Kind, Title, Category, Duration, Venue repeated as
 * disabled inputs per line — showed a form where there is nothing to fill
 * in. This server component draws the same rows as a receipt: what, when,
 * where, seats, price, line total, with a link to the session. The data and
 * its access rules are unchanged.
 */

type Line = {
  kind?: string | null;
  session?: string | { id?: string } | null;
  pass?: string | { id?: string } | null;
  title?: string | null;
  startsAt?: string | null;
  durationMinutes?: number | null;
  venueName?: string | null;
  qty?: number | null;
  unitFils?: number | null;
  lineFils?: number | null;
  passCredits?: number | null;
};

const idOf = (v: Line["session"]): string | null => (typeof v === "string" ? v : v && typeof v === "object" && v.id ? String(v.id) : null);

const when = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";

const hours = (min?: number | null) => (min ? (min % 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min / 60} h`) : "");

export const OrderLines: ArrayFieldServerComponent = ({ data, clientField, payload }) => {
  const lines = ((data as { lines?: Line[] } | undefined)?.lines ?? []) as Line[];
  const admin = payload.config.routes.admin;
  const label = typeof clientField?.label === "string" ? clientField.label : "What was booked";
  return (
    <div className="field-type mp-lines">
      <span className="mp-eyebrow">{label}</span>
      {lines.length ? (
        <div className="mp-lines__scroll">
          <table className="mp-lines__table">
            <thead>
              <tr>
                <th scope="col">What</th>
                <th scope="col">When</th>
                <th scope="col" className="mp-num">Seats</th>
                <th scope="col" className="mp-num">Each</th>
                <th scope="col" className="mp-num">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const sessionId = line.kind === "session" ? idOf(line.session) : null;
                const passId = line.kind === "pass" ? idOf(line.pass) : null;
                const href = sessionId ? `${admin}/collections/sessions/${sessionId}` : passId ? `${admin}/collections/passes/${passId}` : null;
                return (
                  <tr key={index}>
                    <td>
                      {href ? <a href={href}>{line.title || "Untitled"}</a> : line.title || "Untitled"}
                      <small>{[line.kind === "pass" ? "Pass" : null, line.venueName, hours(line.durationMinutes)].filter(Boolean).join(" · ")}</small>
                    </td>
                    <td>{line.kind === "session" ? when(line.startsAt) : "—"}</td>
                    <td className="mp-num">
                      {line.qty ?? 0}
                      {line.passCredits ? <small>{line.passCredits} by pass</small> : null}
                    </td>
                    <td className="mp-num">{formatAed(line.unitFils ?? 0)}</td>
                    <td className="mp-num">{formatAed(line.lineFils ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mp-timeline__empty">No lines on this order.</p>
      )}
      <small className="mp-lines__note">Copied at checkout: what the customer saw is what the ticket and invoice print, even if the session changes later.</small>
    </div>
  );
};
