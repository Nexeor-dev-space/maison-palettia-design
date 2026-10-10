import Link from "next/link";
import type { ServerProps } from "payload";
import React from "react";

import { Icon } from "./icons";
import { loadWarnings, type Warning } from "./adminData";

/**
 * ==========================================================================
 * Warnings — the plain-language setup checks above the dashboard (SPEC §I)
 * ==========================================================================
 *
 * Mounted first in `admin.components.beforeDashboard`, so anything that
 * needs the owner's attention is the first thing on the admin home:
 *
 *   · red: something is broken NOW (secret changed, background tasks
 *     paused, webhook at an old address, open disputes) — one banner each;
 *   · amber: a "finish setting up" list with one link per line (email not
 *     verified, site address unconfirmed, nobody notified, TRN missing,
 *     AI-flagged photos, orders needing review, refunds to approve, failed
 *     tasks or emails);
 *   · info: small badges that describe the current mode rather than ask
 *     for anything (payments TEST/LIVE/MOCK, online bookings closed).
 *
 * The checks and the role filtering live in ./adminData.ts (`loadWarnings`);
 * this file only draws. A server component: the checks read the settings
 * globals, which only the server may do, and the result needs no
 * JavaScript. Mock mode's site-wide strip stays with MockBanner (Phase 1).
 */

const AlertIcon = () => <Icon name="alert" size={18} />;

function Line({ warning }: { warning: Warning }) {
  return (
    <li className={`mp-warn__item${warning.level === "info" ? " mp-warn__item--info" : ""}`}>
      <span className="mp-warn__item-dot" aria-hidden />
      <span>{warning.text}</span>
      {warning.href ? (
        <Link className="mp-warn__item-cta" href={warning.href}>
          {warning.cta ?? "Fix"} →
        </Link>
      ) : null}
    </li>
  );
}

export async function Warnings({ payload, user }: ServerProps) {
  const data = await loadWarnings(payload, user);
  if (!data) return null;
  const { red, amber, badges } = data;
  if (!red.length && !amber.length && !badges.length) return null;

  return (
    <section className="mp-warn" aria-label="Setup checks">
      {red.map((warning, index) => (
        <div key={index} className="mp-warn__alert" role="alert">
          <AlertIcon />
          <span>
            <strong>Needs attention now. </strong>
            {warning.text}
          </span>
          {warning.href ? <Link href={warning.href}>{warning.cta ?? "Fix"} →</Link> : null}
        </div>
      ))}

      {amber.length || badges.length ? (
        <div className="mp-card">
          <div className="mp-warn__list-head">
            {amber.length ? (
              <>
                <span>
                  {amber.length === 1 ? "One thing" : `${amber.length} things`} to finish setting up
                </span>
                <small>Each line links to where it is fixed.</small>
              </>
            ) : (
              <>
                <span>Everything is set up</span>
                <small>Nothing needs your attention.</small>
              </>
            )}
            {badges.length ? (
              <span className="mp-warn__badges" style={{ marginLeft: "auto" }}>
                {badges.map((badge) =>
                  badge.href ? (
                    <Link key={badge.label} className={`mp-chip mp-chip--${badge.tone}`} href={badge.href} title={badge.title} style={{ textDecoration: "none" }}>
                      {badge.label}
                    </Link>
                  ) : (
                    <span key={badge.label} className={`mp-chip mp-chip--${badge.tone}`} title={badge.title}>
                      {badge.label}
                    </span>
                  ),
                )}
              </span>
            ) : null}
          </div>
          {amber.length ? (
            <ul className="mp-warn__list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {amber.map((warning, index) => (
                <Line key={index} warning={warning} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
