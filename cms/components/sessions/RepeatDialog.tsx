"use client";

import { toast, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import React, { useMemo, useState } from "react";

import { callAction, fmtWhen } from "@/cms/components/admin/api";
import { Dialog, DialogButtons, Field } from "@/cms/components/admin/Dialog";
// The server's own date rule and cap (pure, client-safe): the preview can never promise more than it creates.
import { allRepeatDates, dubaiDay, dubaiWeekday, REPEAT_BATCH, REPEAT_MAX, repeatDates } from "@/cms/lib/sessionSeries";

/**
 * ==========================================================================
 * RepeatDialog — "Repeat weekly…" on a session (SPEC §H.7, §I)
 * ==========================================================================
 *
 * Builds a weekly series from this session: tick the weekdays, pick the
 * last date, and the server creates one DRAFT per date with the same
 * experience, time of day, venue, price, seats and copy
 * (`POST /actions/sessions/:id/repeat`). Drafts, so nothing goes on sale
 * until each is reviewed and published — the owner changes a price or a
 * venue on one date without affecting the rest. The dialog previews how
 * many dates it will create before anything is written, and lists the new
 * drafts afterwards with links.
 *
 * The preview uses the server's own `repeatDates` and `REPEAT_MAX`
 * (cms/lib/sessionSeries.ts), so "Create 26 drafts" is exactly what
 * happens; a range with more matching dates says plainly that only the
 * first 26 are made. Each draft takes a couple of seconds to write, so the
 * series goes up in batches of REPEAT_BATCH with a running "Created 10 of
 * 26…" — and if one batch fails, the drafts already made are still listed.
 */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Created = { id: string; startsAt: string };

/** "Takes about a minute." — each draft is a couple of seconds of writing (versions, slug, seat counter). */
const takes = (n: number): string => {
  const minutes = Math.ceil((n * 2.5) / 60);
  return minutes <= 1 ? "Takes about a minute." : `Takes about ${minutes} minutes.`;
};

export function RepeatDialog({ open, onClose, sessionId, startsAt, title }: { open: boolean; onClose: () => void; sessionId: string; startsAt: string; title: string }) {
  const { config } = useConfig();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  const admin = config.routes.admin;
  const sourceDay = dubaiWeekday(new Date(startsAt));
  const defaultUntil = new Date(new Date(startsAt).getTime() + 8 * 7 * 86_400_000).toISOString().slice(0, 10);

  const [weekdays, setWeekdays] = useState<number[]>([sourceDay]);
  const [until, setUntil] = useState(defaultUntil);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "ok" | "info"; text: string } | null>(null);
  const [created, setCreated] = useState<Created[] | null>(null);
  const [progress, setProgress] = useState(0);

  const dates = useMemo(() => repeatDates(startsAt, until, weekdays), [startsAt, until, weekdays]);
  // How many the range WOULD hold without the cap — to say "only the first 26".
  const wanted = useMemo(() => allRepeatDates(startsAt, until, weekdays).length, [startsAt, until, weekdays]);
  const overCap = wanted > dates.length;

  const toggle = (day: number) => setWeekdays((w) => (w.includes(day) ? w.filter((d) => d !== day) : [...w, day].sort()));

  const create = async () => {
    setBusy(true);
    setStatus(null);
    setProgress(0);
    const made: Created[] = [];
    try {
      // Batches of REPEAT_BATCH: each request creates the dates after the
      // previous batch's last one, through this batch's last day.
      for (let i = 0; i < dates.length; i += REPEAT_BATCH) {
        const batch = dates.slice(i, i + REPEAT_BATCH);
        const after = i > 0 ? dates[i - 1].toISOString() : undefined;
        const res = await callAction<{ created: Created[] }>(api, `/actions/sessions/${sessionId}/repeat`, {
          body: { every: "weekly", until: dubaiDay(batch[batch.length - 1]), weekdays, ...(after ? { after } : {}) },
        });
        made.push(...res.created);
        setProgress(made.length);
      }
      setCreated(made);
      toast.success(`${made.length} draft session${made.length === 1 ? "" : "s"} created.`);
    } catch (error) {
      if (made.length) {
        // Keep what was made: list it, and say plainly where it stopped.
        setCreated(made);
        setStatus({ tone: "error", text: `Stopped after ${made.length} of ${dates.length}: ${(error as Error).message} The drafts below were created; run Repeat again from the last one for the rest.` });
      } else {
        setStatus({ tone: "error", text: (error as Error).message });
      }
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    setCreated(null);
    setStatus(null);
    onClose();
  };

  const n = dates.length;
  const hint = n
    ? `${overCap ? `${wanted} dates match — only the first ${REPEAT_MAX} will be created (${REPEAT_MAX} is the most one repeat makes). ` : `${n} date${n === 1 ? "" : "s"}: `}${dates
        .slice(0, 3)
        .map((d) => fmtWhen(d.toISOString()))
        .join(", ")}${n > 3 ? ` … ${fmtWhen(dates[n - 1].toISOString())}` : ""}${n > REPEAT_BATCH ? `. ${takes(n)}` : ""}`
    : "No dates fall on those weekdays before the end date.";

  return (
    <Dialog
      open={open}
      onClose={finish}
      title={created ? "Drafts created" : "Repeat this session weekly"}
      intro={
        created
          ? "Each date is a draft: open it to check the details, then publish. Draft dates are not on sale."
          : `Copies ${title} — same time of day, venue, price, seats and wording — onto the weekdays you tick, up to the last date. Every copy is a draft until you publish it.`
      }
      busy={busy}
      footer={
        created ? (
          <>
            <Link className="mp-actions__btn" href={`${admin}/collections/sessions?where[_status][equals]=draft`}>
              See all drafts
            </Link>
            <button type="button" className="mp-actions__btn mp-actions__btn--primary" onClick={finish}>
              Done
            </button>
          </>
        ) : (
          <DialogButtons
            onCancel={finish}
            onConfirm={create}
            confirmLabel={n ? `Create ${n} draft${n === 1 ? "" : "s"}` : "Create drafts"}
            busyLabel={n > REPEAT_BATCH ? `Created ${progress} of ${n}…` : "Creating…"}
            busy={busy}
            disabled={!n}
            status={status}
          />
        )
      }
    >
      {created ? (
        <>
        {status ? (
          <p className="mp-dialog__status mp-dialog__status--error" role="alert">
            {status.text}
          </p>
        ) : null}
        <ul className="mp-rows">
          {created.map((c) => (
            <li key={c.id}>
              <Link className="mp-rows__row" href={`${admin}/collections/sessions/${c.id}`}>
                <span className="mp-rows__primary">{fmtWhen(c.startsAt)}</span>
                <span className="mp-rows__aside">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
        </>
      ) : (
        <>
          <div className="mp-field">
            <span className="mp-field__label">On these days</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {WEEKDAYS.map((label, day) => (
                <button
                  key={label}
                  type="button"
                  className={`mp-chip ${weekdays.includes(day) ? "mp-chip--lilac" : "mp-chip--plain"}`}
                  aria-pressed={weekdays.includes(day)}
                  onClick={() => toggle(day)}
                  style={{ cursor: "pointer", border: "1px solid var(--theme-elevation-150)", padding: "6px 12px" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Until (last date)" id="rp-until" hint={<span className={overCap ? "mp-field__hint--warn" : undefined}>{hint}</span>}>
            <input id="rp-until" type="date" value={until} min={startsAt.slice(0, 10)} onChange={(e) => setUntil(e.target.value)} />
          </Field>
        </>
      )}
    </Dialog>
  );
}
