"use client";

import { toast, useAuth, useConfig, useDocumentInfo } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { ActionsMenu, type MenuItem } from "@/cms/components/admin/ActionsMenu";
import { aed, callAction, fmtWhen, freshKey, parseAed } from "@/cms/components/admin/api";
import { Check, Dialog, DialogButtons, Field } from "@/cms/components/admin/Dialog";

/**
 * ==========================================================================
 * OrderActions — everything you can do to a booking (SPEC §H.7, §I)
 * ==========================================================================
 *
 * Mounted beside Save through `admin.components.edit.beforeDocumentControls`
 * on `orders`. The status chip says where the order is; the Actions menu
 * offers only what applies to that status and this role (§J):
 *
 *   admin + front desk   Refund… (desk: request; admin may approve at once)
 *                        Move to another date…   Resend confirmation
 *                        Resend tickets          (role-gated by the endpoint too)
 *   admin only           Approve / Mark repaid a waiting refund
 *                        Cancel with full refund…   Regenerate invoice PDF
 *                        Mark review resolved
 *
 * Every action is a dialog that says in one sentence what will happen,
 * then calls the Phase 3 endpoint (cms/endpoints/admin-orders.ts). After
 * success the view is refreshed so the status, timeline and joins show
 * the result without a reload. Refunds carry a per-opening idempotency
 * key, so a double click can never ask Mamo for the money twice.
 */

type OrderData = {
  id?: string;
  reference?: string;
  status?: string;
  channel?: "online" | "desk";
  needsReview?: boolean;
  contact?: { email?: string | null; firstName?: string | null; lastName?: string | null };
  lines?: Array<{ kind?: string; session?: string | { id: string }; title?: string; qty?: number; startsAt?: string; unitFils?: number; passCredits?: number | null }>;
  totals?: { grossFils?: number };
};

type PendingRefund = { id: string; amountFils: number; status: string; providerRefundId?: string | null; reason?: string };

type SessionOption = { id: string; label: string; available: number | null; priceFils: number };

const REASONS = [
  { value: "customer_request", label: "Customer asked" },
  { value: "goodwill", label: "Goodwill" },
  { value: "duplicate", label: "Booked twice by mistake" },
  { value: "session_cancelled", label: "Session cancelled" },
  { value: "post_expiry_payment", label: "Paid after the hold expired" },
  { value: "other", label: "Other" },
] as const;

const PAID = ["confirming", "confirmed", "completed"];

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending payment",
  awaiting_payment: "Awaiting payment",
  confirming: "Confirming",
  confirmed: "Confirmed",
  completed: "Completed",
  failed: "Payment failed",
  expired: "Expired",
  cancelled: "Cancelled",
  refunded: "Refunded",
};
const STATUS_TONE: Record<string, string> = { confirmed: "ok", completed: "ok", confirming: "lilac", awaiting_payment: "lilac", pending_payment: "lilac", failed: "warn", expired: "warn" };

type Which = null | "refund" | "move" | "cancel" | "resend-confirmation" | "resend-tickets" | "invoice" | "resolve";

export function OrderActions() {
  const { id, initialData, lastUpdateTime } = useDocumentInfo();
  const { user } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === "admin";
  const order = (initialData ?? {}) as OrderData;

  const [which, setWhich] = useState<Which>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "ok" | "info"; text: string } | null>(null);
  const [pending, setPending] = useState<PendingRefund[]>([]);

  // Refund form
  const [refundable, setRefundable] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("customer_request");
  const [note, setNote] = useState("");
  const [releaseSeats, setReleaseSeats] = useState(true);
  const [approveNow, setApproveNow] = useState(true);
  const [key, setKey] = useState(freshKey);

  // Move form
  const [targets, setTargets] = useState<SessionOption[] | null>(null);
  const [target, setTarget] = useState("");
  const [priceDifference, setPriceDifference] = useState<"no_charge" | "collect_at_venue" | "refund_difference">("no_charge");

  // Cancel / resolve form
  const [cancelReason, setCancelReason] = useState("");

  const refresh = useCallback(() => router.refresh(), [router]);

  // Refunds waiting on this order (admin approves; desk refunds are marked repaid).
  useEffect(() => {
    if (!id || !isAdmin) return;
    let cancelled = false;
    callAction<{ docs: PendingRefund[] }>(api, `/refunds?where[order][equals]=${id}&where[status][equals]=requested&depth=0&limit=10`)
      .then((res) => !cancelled && setPending(res.docs))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, id, isAdmin, lastUpdateTime]);

  const openDialog = async (next: Exclude<Which, null>) => {
    setStatus(null);
    setWhich(next);
    if (next === "refund") {
      setKey(freshKey());
      setNote("");
      setRefundable(null);
      try {
        const r = await callAction<{ refundableFils: number }>(api, `/actions/orders/${id}/refundable`);
        setRefundable(r.refundableFils);
        setAmount((r.refundableFils / 100).toFixed(2));
      } catch (error) {
        setStatus({ tone: "error", text: (error as Error).message });
      }
    }
    if (next === "move") {
      setTargets(null);
      setTarget("");
      const line = (order.lines ?? []).find((l) => l.kind === "session");
      const sourceId = typeof line?.session === "string" ? line.session : line?.session?.id;
      if (!sourceId) {
        setStatus({ tone: "error", text: "This booking has no session line to move." });
        return;
      }
      try {
        const source = await callAction<{ experience: string | { id: string } }>(api, `/sessions/${sourceId}?depth=0`);
        const experience = typeof source.experience === "string" ? source.experience : source.experience?.id;
        const params = new URLSearchParams({ limit: "60", depth: "1", sort: "startsAt" });
        params.set("where[experience][equals]", String(experience));
        params.set("where[startsAt][greater_than]", new Date().toISOString());
        params.set("where[_status][equals]", "published");
        params.set("where[id][not_equals]", sourceId);
        const res = await callAction<{ docs: Array<Record<string, unknown>> }>(api, `/sessions?${params.toString()}`);
        setTargets(
          res.docs
            .filter((d) => !d.cancelledAt)
            .map((d) => ({
              id: String(d.id),
              label: `${fmtWhen(d.startsAt as string)}${(d.venue as { name?: string } | undefined)?.name ? ` · ${(d.venue as { name?: string }).name}` : ""}`,
              available: typeof d.seatsAvailable === "number" ? d.seatsAvailable : null,
              priceFils: (d.priceFils as number) ?? 0,
            })),
        );
      } catch (error) {
        setStatus({ tone: "error", text: (error as Error).message });
      }
    }
  };

  const close = () => {
    if (busy) return;
    setWhich(null);
    setStatus(null);
  };

  const run = async (path: string, body: Record<string, unknown> | undefined, done: string | ((r: Record<string, unknown>) => string)) => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await callAction<Record<string, unknown>>(api, path, { body: body ?? {} });
      const message = typeof done === "function" ? done(res) : done;
      toast.success(message);
      setWhich(null);
      refresh();
    } catch (error) {
      setStatus({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  if (!id || !order.status) return null;

  const paid = PAID.includes(order.status);
  const email = order.contact?.email?.trim() || "";
  const who = [order.contact?.firstName, order.contact?.lastName].filter(Boolean).join(" ") || email || "the customer";
  const amountFils = parseAed(amount);
  const desk = order.channel === "desk";
  const seatLine = (order.lines ?? []).find((l) => l.kind === "session");
  // The move's price difference, as the server computes it (cms/lib/orders.ts
  // moveOrder): new price minus the price paid, on the seats paid in money
  // (pass-credit seats move free). Null until a date is chosen.
  const targetOption = targets?.find((t) => t.id === target);
  const paidSeats = Math.max(0, (seatLine?.qty ?? 0) - (seatLine?.passCredits ?? 0));
  const perSeatDiff = targetOption && seatLine?.unitFils !== undefined ? targetOption.priceFils - seatLine.unitFils : null;
  const moveDiff = perSeatDiff === null ? null : perSeatDiff * paidSeats;

  const items: MenuItem[] = [];
  if (paid) {
    items.push({ label: "Refund…", icon: "refund", hint: desk ? "Record money handed back at the desk" : isAdmin ? "Full or partial, sent to Mamo Pay" : "Request for an admin to approve", onClick: () => void openDialog("refund") });
  }
  if (order.status === "confirmed" && seatLine) {
    items.push({ label: "Move to another date…", icon: "move", hint: "Same experience, new session", onClick: () => void openDialog("move") });
  }
  if (paid) {
    items.push({ divider: true });
    items.push({ label: "Resend confirmation", icon: "send", hint: email ? `to ${email}` : "No email on this booking", disabled: !email, onClick: () => void openDialog("resend-confirmation") });
    items.push({ label: "Resend tickets", icon: "ticket", hint: email ? `to ${email}` : "No email on this booking", disabled: !email, onClick: () => void openDialog("resend-tickets") });
  }
  if (isAdmin) {
    for (const r of pending) {
      items.push({ divider: true });
      if (r.providerRefundId === "desk") {
        items.push({ label: `Mark ${aed(r.amountFils)} repaid`, icon: "check", hint: "The money was handed back at the studio", onClick: () => void run(`/actions/orders/${id}/refunds/${r.id}/mark-repaid`, {}, `${aed(r.amountFils)} marked as repaid.`) });
      } else {
        items.push({ label: `Approve refund of ${aed(r.amountFils)}`, icon: "check", hint: "Mamo Pay returns the money within a few minutes", onClick: () => void run(`/actions/orders/${id}/refunds/${r.id}/approve`, {}, `Refund of ${aed(r.amountFils)} approved — Mamo Pay is processing it.`) });
      }
    }
    if (["confirmed", "completed", "refunded", "cancelled"].includes(order.status)) {
      items.push({ divider: true });
      items.push({ label: "Regenerate invoice PDF", icon: "page", hint: "Same number, fresh file", onClick: () => void openDialog("invoice") });
    }
    if (order.needsReview) items.push({ label: "Mark review resolved", icon: "check", onClick: () => void openDialog("resolve") });
    if (order.status === "confirmed" || order.status === "confirming") {
      items.push({ divider: true });
      items.push({ label: "Cancel with full refund…", icon: "alert", danger: true, onClick: () => void openDialog("cancel") });
    }
  }

  return (
    <>
      <span className={`mp-chip mp-chip--${STATUS_TONE[order.status] ?? "muted"}`} style={{ marginInlineEnd: 8 }}>
        {STATUS_LABEL[order.status] ?? order.status}
      </span>
      {order.needsReview ? (
        <span className="mp-chip mp-chip--warn" style={{ marginInlineEnd: 8 }}>
          Needs review
        </span>
      ) : null}
      {items.length ? <ActionsMenu items={items} /> : null}

      {/* Refund */}
      <Dialog
        open={which === "refund"}
        onClose={close}
        title={desk ? "Record a desk refund" : isAdmin ? "Refund this booking" : "Request a refund"}
        intro={
          desk
            ? `${order.reference} was paid at the desk, so the money is handed back in person. This records the amount; an admin marks it repaid once it has been returned.`
            : isAdmin
              ? `The amount is sent to Mamo Pay and lands back on ${who}'s card within a few days. A credit note is issued and the customer is emailed.`
              : `An admin approves the request; Mamo Pay then returns the money to ${who}'s card.`
        }
        busy={busy}
        footer={
          <DialogButtons
            onCancel={close}
            confirmLabel={desk ? "Record refund" : isAdmin && approveNow ? "Refund now" : "Request refund"}
            busyLabel="Sending…"
            busy={busy}
            disabled={refundable === null || amountFils === null || amountFils < 100 || amountFils > (refundable ?? 0)}
            status={status}
            onConfirm={() =>
              run(
                `/actions/orders/${id}/refund`,
                { amountFils, reason, note: note.trim() || undefined, releaseSeats, idempotencyKey: key, approve: isAdmin && !desk ? approveNow : undefined },
                (r) => (r.status === "approved" ? `Refund of ${aed(amountFils ?? 0)} approved — Mamo Pay is processing it.` : `Refund of ${aed(amountFils ?? 0)} recorded${desk ? "" : " and waiting for approval"}.`),
              )
            }
          />
        }
      >
        <div className="mp-field--row">
          <Field label="Amount" id="rf-amount" hint={refundable === null ? "Checking what can still be refunded…" : `Up to ${aed(refundable)} can be refunded on this booking (paid ${aed(order.totals?.grossFils ?? 0)}).`}>
            <div className="mp-amount">
              <span className="mp-amount__cur">AED</span>
              <input id="rf-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={refundable === null} />
            </div>
          </Field>
          <Field label="Reason" id="rf-reason">
            <select id="rf-reason" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Note (optional)" id="rf-note" hint="For the team. Quoted in the customer's email if you choose.">
          <textarea id="rf-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </Field>
        <Check checked={releaseSeats} onChange={setReleaseSeats} label="Give the seats back" hint="On: the refunded seats become bookable again. Off: keep them reserved, e.g. a goodwill refund where the customer still attends." />
        {isAdmin && !desk ? <Check checked={approveNow} onChange={setApproveNow} label="Approve now" hint="Off: record the request and approve it later from the Refunds list." /> : null}
      </Dialog>

      {/* Move */}
      <Dialog
        open={which === "move"}
        onClose={close}
        title="Move to another date"
        intro={`${who}'s seats move to the date you choose, the old tickets are voided and new ones emailed${email ? ` to ${email}` : ""}. Only dates of the same experience are offered.`}
        busy={busy}
        footer={
          <DialogButtons
            onCancel={close}
            onConfirm={() => run(`/actions/orders/${id}/move`, { targetSessionId: target, priceDifference, note: note.trim() || undefined }, "Booking moved — new tickets are on their way.")}
            confirmLabel="Move booking"
            busyLabel="Moving…"
            busy={busy}
            disabled={!target}
            status={status}
          />
        }
      >
        <Field label="New date" id="mv-target" hint={seatLine ? `Currently ${seatLine.qty} × ${seatLine.title}${seatLine.startsAt ? ` on ${fmtWhen(seatLine.startsAt)}` : ""}.` : undefined}>
          <select
            id="mv-target"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              // A new date can flip "more" to "less": start again from "No change".
              setPriceDifference("no_charge");
            }} disabled={targets === null}>
            <option value="">{targets === null ? "Loading dates…" : targets.length ? "Choose a date…" : "No other published dates of this experience"}</option>
            {targets?.map((t) => (
              <option key={t.id} value={t.id} disabled={t.available !== null && seatLine?.qty !== undefined && t.available < seatLine.qty}>
                {t.label}
                {t.available !== null ? ` (${t.available} left)` : ""} · {aed(t.priceFils)} pp
              </option>
            ))}
          </select>
        </Field>
        <div className="mp-field">
          <span className="mp-field__label">If the price is different</span>
          {/* The actual difference, once a date is picked (4B review: "Refund the difference" never said how much). */}
          {moveDiff !== null ? (
            <span className="mp-field__hint">
              {moveDiff === 0
                ? "Same price — nothing to settle."
                : `The new date is ${aed(Math.abs(moveDiff))} ${moveDiff > 0 ? "more" : "less"} in total (${aed(Math.abs(perSeatDiff ?? 0))} × ${paidSeats} paid seat${paidSeats === 1 ? "" : "s"}).`}
            </span>
          ) : null}
          <div className="mp-choice">
            <label>
              <input type="radio" name="pd" checked={priceDifference === "no_charge"} onChange={() => setPriceDifference("no_charge")} />
              <span>
                No change
                <small>The customer pays nothing more and gets nothing back.</small>
              </span>
            </label>
            <label>
              <input type="radio" name="pd" checked={priceDifference === "collect_at_venue"} disabled={moveDiff !== null && moveDiff <= 0} onChange={() => setPriceDifference("collect_at_venue")} />
              <span>
                {moveDiff !== null && moveDiff > 0 ? `Collect ${aed(moveDiff)} at the venue` : "Collect the difference at the venue"}
                <small>Noted on the booking for the front desk.{moveDiff !== null && moveDiff <= 0 ? " Only when the new date costs more." : ""}</small>
              </span>
            </label>
            <label>
              <input type="radio" name="pd" checked={priceDifference === "refund_difference"} disabled={moveDiff !== null && moveDiff >= 0} onChange={() => setPriceDifference("refund_difference")} />
              <span>
                {moveDiff !== null && moveDiff < 0 ? `Refund ${aed(-moveDiff)}` : "Refund the difference"}
                <small>A refund request for the difference is raised for approval.{moveDiff !== null && moveDiff >= 0 ? " Only when the new date costs less." : ""}</small>
              </span>
            </label>
          </div>
        </div>
        <Field label="Note (optional)" id="mv-note">
          <input id="mv-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
      </Dialog>

      {/* Cancel with refund */}
      <Dialog
        open={which === "cancel"}
        onClose={close}
        title="Cancel this booking and refund everything?"
        intro={`${order.reference}: the seats go back on sale now, every ticket is voided, and a full refund is approved on the spot. ${who} is emailed. This cannot be undone.`}
        busy={busy}
        footer={
          <DialogButtons
            onCancel={close}
            onConfirm={() => run(`/actions/orders/${id}/cancel`, { reason: cancelReason.trim(), note: note.trim() || undefined }, "Booking cancelled — the refund is on its way.")}
            confirmLabel="Cancel booking & refund"
            busyLabel="Cancelling…"
            busy={busy}
            disabled={cancelReason.trim().length < 3}
            status={status}
            danger
          />
        }
      >
        <Field label="Reason" id="cn-reason" hint="Kept on the booking's timeline.">
          <input id="cn-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} maxLength={200} placeholder="e.g. Customer unwell, asked to cancel" />
        </Field>
        <Field label="Note (optional)" id="cn-note">
          <textarea id="cn-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </Field>
      </Dialog>

      {/* Resends */}
      <Dialog
        open={which === "resend-confirmation" || which === "resend-tickets"}
        onClose={close}
        title={which === "resend-tickets" ? "Resend the tickets?" : "Resend the confirmation?"}
        intro={`${which === "resend-tickets" ? "The ticket email, with every ticket PDF attached," : "The booking confirmation, with the invoice,"} is sent again to ${email}. Correct the email on the booking first if it has changed.`}
        busy={busy}
        footer={
          <DialogButtons
            onCancel={close}
            onConfirm={() => run(`/actions/orders/${id}/${which === "resend-tickets" ? "resend-tickets" : "resend-confirmation"}`, {}, (r) => (r.status === "skipped" ? "Logged, but not sent — email sending is off or the template is disabled." : `Sent to ${email}.`))}
            confirmLabel="Send again"
            busyLabel="Sending…"
            busy={busy}
            status={status}
          />
        }
      />

      {/* Invoice */}
      <Dialog
        open={which === "invoice"}
        onClose={close}
        title="Regenerate the invoice PDF?"
        intro="The PDF is rebuilt from the figures on this order with the current invoice settings (logo, legal name, TRN). The invoice number does not change. If no invoice exists yet, one is issued."
        busy={busy}
        footer={<DialogButtons onCancel={close} onConfirm={() => run(`/actions/orders/${id}/regenerate-invoice`, {}, (r) => `Invoice ${String(r.number ?? "")} is being regenerated.`)} confirmLabel="Regenerate" busyLabel="Queuing…" busy={busy} status={status} />}
      />

      {/* Resolve review */}
      <Dialog
        open={which === "resolve"}
        onClose={close}
        title="Mark the review resolved"
        intro="Clears the “Needs review” flag. Say what you checked so the next person knows."
        busy={busy}
        footer={<DialogButtons onCancel={close} onConfirm={() => run(`/actions/orders/${id}/resolve-review`, { note: note.trim() || undefined }, "Marked as resolved.")} confirmLabel="Mark resolved" busyLabel="Saving…" busy={busy} status={status} />}
      >
        <Field label="What you checked (optional)" id="rs-note">
          <textarea id="rs-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </Field>
      </Dialog>
    </>
  );
}
