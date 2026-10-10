"use client";

import { toast, useAuth, useConfig, useDocumentInfo } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { ActionsMenu, type MenuItem } from "@/cms/components/admin/ActionsMenu";
import { callAction, fmtWhen, fromDubaiLocal, toDubaiLocal } from "@/cms/components/admin/api";
import { Dialog, DialogButtons, Field } from "@/cms/components/admin/Dialog";
import { CreateBookingDialog } from "@/cms/components/orders/CreateBooking";

import { RepeatDialog } from "./RepeatDialog";

/**
 * ==========================================================================
 * SessionActions — Repeat · Reschedule · Desk booking · Cancel (SPEC §I)
 * ==========================================================================
 *
 * Beside Save on a session, after the sold/held/left chips
 * (`admin.components.edit.beforeDocumentControls`). What is offered
 * depends on the role (§J) and on whether the session has been saved:
 *
 *   admin, editor    Repeat weekly…   (drafts; ./RepeatDialog.tsx)
 *   admin, front desk  Desk booking…  (the Orders dialog, session preset)
 *                      Check-in       (the door, on this session's day)
 *   admin            Reschedule…      emails every ticket holder, redirects
 *                                     the old address — the ONLY way to move
 *                                     a date once seats are sold
 *                    Cancel & refund all…  refunds queued, tickets void,
 *                                     holders emailed; irreversible
 *
 * The endpoints are Phase 3's (cms/endpoints/admin-sessions.ts). The
 * view refreshes after each action so the new date, slug or the
 * "Cancelled" stamp shows without a reload.
 */

type SessionData = { id?: string; title?: string; startsAt?: string; venue?: string | { id: string; name?: string }; cancelledAt?: string | null; seatsSold?: number | null; experience?: string | { name?: string } };
type VenueOption = { id: string; name: string };
type Which = null | "repeat" | "reschedule" | "cancel" | "desk";

export function SessionActions() {
  const { id, initialData } = useDocumentInfo();
  const { user } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === "admin";
  const session = (initialData ?? {}) as SessionData;

  const [which, setWhich] = useState<Which>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "ok" | "info"; text: string } | null>(null);
  const [venues, setVenues] = useState<VenueOption[] | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [venue, setVenue] = useState("");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (which !== "reschedule" || venues !== null) return;
    callAction<{ docs: Array<{ id: string; name: string }> }>(api, "/venues?limit=50&depth=0&sort=name")
      .then((res) => setVenues(res.docs.map((v) => ({ id: String(v.id), name: v.name }))))
      .catch(() => setVenues([]));
  }, [which, venues, api]);

  if (!id || !role) return null;

  const title = session.title || (typeof session.experience === "object" ? session.experience?.name : "") || "this session";
  const sold = session.seatsSold ?? 0;
  const cancelled = Boolean(session.cancelledAt);

  const open = (next: Exclude<Which, null>) => {
    setStatus(null);
    if (next === "reschedule") {
      setStartsAt(toDubaiLocal(session.startsAt));
      setVenue(typeof session.venue === "string" ? session.venue : session.venue?.id ?? "");
      setMessage("");
    }
    if (next === "cancel") {
      setReason("");
      setMessage("");
    }
    setWhich(next);
  };

  const close = () => {
    if (!busy) setWhich(null);
  };

  const run = async (path: string, body: Record<string, unknown>, done: (r: Record<string, unknown>) => string) => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await callAction<Record<string, unknown>>(api, path, { body });
      toast.success(done(res));
      setWhich(null);
      router.refresh();
    } catch (error) {
      setStatus({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const day = session.startsAt ? session.startsAt.slice(0, 10) : "";
  const items: MenuItem[] = [];
  if (role !== "front-desk") items.push({ label: "Repeat weekly…", icon: "repeat", hint: "Copies as drafts on the days you choose", onClick: () => open("repeat") });
  if (role !== "editor" && !cancelled) {
    items.push({ label: "Desk booking…", icon: "bag", hint: "A walk-in or phone booking on this date", onClick: () => open("desk") });
    items.push({ label: "Check-in", icon: "check", hint: "Scan tickets for this day", href: `${config.routes.admin}/check-in?date=${day}` });
  }
  if (isAdmin && !cancelled) {
    items.push({ divider: true });
    items.push({ label: "Reschedule…", icon: "calendar", hint: sold ? `Tells the ${sold} ticket holder${sold === 1 ? "" : "s"}` : "Move the date or venue", onClick: () => open("reschedule") });
    items.push({ label: "Cancel session & refund all…", icon: "alert", danger: true, onClick: () => open("cancel") });
  }

  const newIso = fromDubaiLocal(startsAt);

  return (
    <>
      {cancelled ? (
        <span className="mp-chip mp-chip--bad" style={{ marginInlineEnd: 8 }}>
          Cancelled
        </span>
      ) : null}
      <ActionsMenu items={items} />

      {session.startsAt ? <RepeatDialog open={which === "repeat"} onClose={close} sessionId={String(id)} startsAt={session.startsAt} title={title} /> : null}

      <CreateBookingDialog open={which === "desk"} onClose={close} sessionId={String(id)} isAdmin={isAdmin} />

      <Dialog
        open={which === "reschedule"}
        onClose={close}
        title="Reschedule this session"
        intro={
          sold
            ? `${sold} ticket holder${sold === 1 ? "" : "s"} will be emailed the new date, and the old web address will forward to the new one. Tickets stay valid.`
            : "Moves the date (and venue, if you change it) and forwards the old web address to the new one."
        }
        busy={busy}
        footer={
          <DialogButtons
            onCancel={close}
            onConfirm={() => run(`/actions/sessions/${id}/reschedule`, { startsAt: newIso, ...(venue ? { venueId: venue } : {}), message: message.trim() || undefined }, (r) => `Rescheduled to ${fmtWhen(newIso)}${typeof r.notified === "number" && r.notified ? ` — ${r.notified} customer${r.notified === 1 ? "" : "s"} emailed` : ""}.`)}
            confirmLabel="Reschedule"
            busyLabel="Rescheduling…"
            busy={busy}
            disabled={!newIso}
            status={status}
          />
        }
      >
        <div className="mp-field--row">
          <Field label="New start (studio time)" id="rs-start" hint={session.startsAt ? `Currently ${fmtWhen(session.startsAt)}.` : undefined}>
            <input id="rs-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </Field>
          <Field label="Venue" id="rs-venue">
            <select id="rs-venue" value={venue} onChange={(e) => setVenue(e.target.value)} disabled={venues === null}>
              <option value="">{venues === null ? "Loading…" : "Keep the current venue"}</option>
              {venues?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {sold ? (
          <Field label="A line for the email (optional)" id="rs-msg" hint="Added to the “your session has moved” email, e.g. why it moved.">
            <textarea id="rs-msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
          </Field>
        ) : null}
      </Dialog>

      <Dialog
        open={which === "cancel"}
        onClose={close}
        title="Cancel this session and refund everyone?"
        intro={`${title}: every booking on this date is refunded in full, every ticket voided, and each customer emailed with your reason. The session stays visible to you as cancelled. This cannot be undone.`}
        busy={busy}
        footer={
          <DialogButtons
            onCancel={close}
            onConfirm={() => run(`/actions/sessions/${id}/cancel`, { reason: reason.trim(), message: message.trim() || undefined }, (r) => `Session cancelled — ${String(r.refundsQueued ?? 0)} refund${r.refundsQueued === 1 ? "" : "s"} queued for ${String(r.orders ?? 0)} booking${r.orders === 1 ? "" : "s"}.`)}
            confirmLabel="Cancel session & refund all"
            // Two buttons both starting "Cancel" on a destructive dialog read alike (4B review).
            cancelLabel="Keep session"
            busyLabel="Cancelling…"
            busy={busy}
            disabled={reason.trim().length < 3}
            status={status}
            danger
          />
        }
      >
        {sold ? (
          <div className="mp-dialog__danger">
            {sold} seat{sold === 1 ? " is" : "s are"} sold on this date. Refunds go through Mamo Pay for online bookings; desk bookings are marked for repayment at the studio.
          </div>
        ) : null}
        <Field
          label="Reason (customers see this)"
          id="cs-reason"
          required
          hint={reason.trim().length < 3 ? "Needed for the customer email — a few words is enough. The button unlocks once it is filled in." : "Goes into every customer's cancellation email."}
        >
          <input id="cs-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="e.g. The host is unwell" required aria-required="true" />
        </Field>
        <Field label="A line for the email (optional)" id="cs-msg">
          <textarea id="cs-msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
        </Field>
      </Dialog>
    </>
  );
}
