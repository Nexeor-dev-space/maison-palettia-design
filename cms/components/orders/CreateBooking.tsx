"use client";

import { toast, useConfig } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { ActionError, aed, callAction, fmtWhen, parseAed } from "@/cms/components/admin/api";
import { Dialog, DialogButtons, Field } from "@/cms/components/admin/Dialog";

/**
 * ==========================================================================
 * CreateBookingDialog — a desk booking in one screen (SPEC §H.7, §I)
 * ==========================================================================
 *
 * The front desk takes a walk-in: pick the date, how many seats, who it is
 * for, how they paid. "Preview total" asks the server for the price
 * (`POST /actions/orders/quote` — promo and pass codes included, nothing
 * reserved) so the amount is shown before anything is written; "Create
 * booking" posts to `/actions/orders/manual`, which holds the seats,
 * confirms the order, issues tickets and invoice, and emails the
 * confirmation when an email was given. On success the new order opens.
 *
 * Admins may override the amount taken (a goodwill price); the front desk
 * cannot, which the endpoint enforces as well. Opened from the Orders list
 * ("Create desk booking"), from the dashboard quick action (`?desk=1`) and
 * from a session ("Desk booking" — the session is then preselected).
 */

type SessionOption = { id: string; label: string; startsAt: string; available: number | null; price: number; waitlist: boolean };

type Quote = {
  lines: Array<{ title: string; qty: number; lineFils: number }>;
  totals: { grossFils: number; discountFils: number; vatFils: number };
  rejectedCodes?: string[];
  promo?: { code: string } | null;
};

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card_terminal", label: "Card terminal" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "complimentary", label: "Complimentary (no charge)" },
] as const;

export function CreateBookingDialog({ open, onClose, sessionId, isAdmin }: { open: boolean; onClose: () => void; sessionId?: string; isAdmin: boolean }) {
  const { config } = useConfig();
  const router = useRouter();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  const admin = `${config.serverURL ?? ""}${config.routes.admin}`;

  const [sessions, setSessions] = useState<SessionOption[] | null>(null);
  const [session, setSession] = useState(sessionId ?? "");
  const [qty, setQty] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("cash");
  const [amount, setAmount] = useState("");
  const [codes, setCodes] = useState("");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState<"quote" | "create" | null>(null);
  const [status, setStatus] = useState<{ tone: "error" | "ok" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      const params = new URLSearchParams({ limit: "100", depth: "1", sort: "startsAt" });
      params.set("where[startsAt][greater_than]", new Date().toISOString());
      params.set("where[_status][equals]", "published");
      params.set("where[cancelledAt][exists]", "false");
      try {
        const res = await callAction<{ docs: Array<Record<string, unknown>> }>(api, `/sessions?${params.toString()}`);
        if (cancelled) return;
        setSessions(
          res.docs.map((d) => {
            const exp = d.experience as { name?: string } | undefined;
            const venue = d.venue as { name?: string } | undefined;
            const title = (d.title as string) || exp?.name || (d.slug as string);
            return {
              id: String(d.id),
              label: `${fmtWhen(d.startsAt as string)} · ${title}${venue?.name ? ` · ${venue.name}` : ""}`,
              startsAt: d.startsAt as string,
              available: typeof d.seatsAvailable === "number" ? d.seatsAvailable : null,
              price: (d.priceFils as number) ?? 0,
              waitlist: d.bookingStatus === "waitlist",
            };
          }),
        );
      } catch (error) {
        if (!cancelled) setStatus({ tone: "error", text: (error as Error).message });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, api]);

  const picked = useMemo(() => sessions?.find((s) => s.id === session) ?? null, [sessions, session]);
  const codeList = codes.split(/[,\s]+/).map((c) => c.trim()).filter(Boolean).slice(0, 3);
  const amountFils = isAdmin && amount.trim() ? parseAed(amount) : undefined;
  const ready = Boolean(session && qty >= 1 && firstName.trim() && lastName.trim() && (amountFils !== null || !isAdmin || !amount.trim()));

  const body = () => ({
    sessionId: session,
    qty,
    method,
    ...(amountFils !== undefined && amountFils !== null ? { amountFils } : {}),
    codes: codeList,
    ...(email.trim() ? { email: email.trim() } : {}),
  });

  const preview = async () => {
    setBusy("quote");
    setStatus(null);
    try {
      const q = await callAction<Quote>(api, "/actions/orders/quote", { body: body() });
      setQuote(q);
      if (q.rejectedCodes?.length) setStatus({ tone: "info", text: `Code${q.rejectedCodes.length > 1 ? "s" : ""} not applied: ${q.rejectedCodes.join(", ")}.` });
    } catch (error) {
      setStatus({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    setBusy("create");
    setStatus(null);
    try {
      const res = await callAction<{ reference: string; orderId: string | null }>(api, "/actions/orders/manual", {
        body: { ...body(), customer: { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() || undefined }, note: note.trim() || undefined },
      });
      toast.success(`Booking ${res.reference} created${email.trim() ? ` — confirmation sent to ${email.trim()}` : ""}.`);
      onClose();
      if (res.orderId) router.push(`${admin}/collections/orders/${res.orderId}`);
      else router.refresh();
    } catch (error) {
      const e = error as ActionError;
      setStatus({ tone: "error", text: e.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create a desk booking"
      intro="For a walk-in or a phone booking paid at the studio. Seats are taken straight away; tickets and the invoice are issued like an online order."
      busy={busy !== null}
      wide
      footer={
        <>
          <button type="button" className="mp-actions__btn" onClick={preview} disabled={!session || busy !== null}>
            {busy === "quote" ? "Pricing…" : "Preview total"}
          </button>
          <DialogButtons onCancel={onClose} onConfirm={create} confirmLabel="Create booking" busyLabel="Creating…" busy={busy === "create"} disabled={!ready || busy !== null} status={status} />
        </>
      }
    >
      <Field label="Session" id="desk-session" hint={picked ? `${picked.available ?? "—"} seats left · ${aed(picked.price)} per person${picked.waitlist ? " · waitlist only online, staff may still book" : ""}` : undefined}>
        <select id="desk-session" value={session} onChange={(e) => setSession(e.target.value)} disabled={sessions === null}>
          <option value="">{sessions === null ? "Loading sessions…" : sessions.length ? "Choose a date…" : "No upcoming published sessions"}</option>
          {sessions?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
              {s.available !== null ? ` (${s.available} left)` : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="mp-field--row">
        <Field label="Seats" id="desk-qty">
          <input id="desk-qty" type="number" min={1} max={50} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
        </Field>
        <Field label="Paid by" id="desk-method">
          <select id="desk-method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        {isAdmin ? (
          <Field label="Amount taken (optional)" id="desk-amount" hint="Leave empty to charge the normal price.">
            <div className="mp-amount">
              <span className="mp-amount__cur">AED</span>
              <input id="desk-amount" inputMode="decimal" placeholder={picked ? (picked.price * qty) / 100 + "" : "0.00"} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </Field>
        ) : null}
      </div>
      <div className="mp-field--row">
        <Field label="First name" id="desk-first">
          <input id="desk-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Last name" id="desk-last">
          <input id="desk-last" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="off" />
        </Field>
      </div>
      <div className="mp-field--row">
        <Field label="Email (optional)" id="desk-email" hint="With an email the customer gets the confirmation, tickets and invoice.">
          <input id="desk-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Phone (optional)" id="desk-phone">
          <input id="desk-phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" />
        </Field>
      </div>
      <div className="mp-field--row">
        <Field label="Promo or pass codes (optional)" id="desk-codes" hint="Up to three, separated by commas.">
          <input id="desk-codes" value={codes} onChange={(e) => setCodes(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Note for the team (optional)" id="desk-note">
          <input id="desk-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </Field>
      </div>
      {quote ? (
        <div className="mp-dialog__note" role="status">
          {quote.lines.map((l, i) => (
            <div key={i}>
              {l.qty} × {l.title} — {aed(l.lineFils)}
            </div>
          ))}
          {quote.totals.discountFils ? <div>Discount — −{aed(quote.totals.discountFils)}</div> : null}
          <div>
            <strong>Total {aed(quote.totals.grossFils)}</strong> (includes {aed(quote.totals.vatFils)} VAT)
            {quote.promo?.code ? ` · code ${quote.promo.code} applied` : ""}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
