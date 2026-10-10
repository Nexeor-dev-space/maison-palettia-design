"use client";

import { Button } from "@payloadcms/ui";
import React, { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * ==========================================================================
 * Dialog — the one modal every 4B action uses
 * ==========================================================================
 *
 * A centred card over a blurred scrim, portalled to <body> so it escapes
 * the sticky document bar it is opened from. Esc and the scrim close it;
 * focus moves to the first field when it opens and returns to the opener
 * when it closes; the card is `role="dialog"` with its heading as the
 * label. `busy` disables the close paths so a refund cannot be abandoned
 * halfway through its request.
 *
 * Children are the form body; `footer` the buttons. Nothing here knows
 * about orders or sessions — those are the dialogs in cms/components/
 * orders and cms/components/sessions.
 */

const noSubscribe = () => () => {};

/**
 * True only after hydration. A portal cannot be part of the server HTML, so
 * a dialog that is open on first render (`?desk=1`, `?invite=1`) must wait
 * one tick — otherwise React compares the portal against the table it
 * hydrates next to and reports a mismatch.
 */
const useIsClient = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

export function Dialog({
  open,
  onClose,
  title,
  intro,
  children,
  footer,
  busy,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  intro?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  busy?: boolean;
  wide?: boolean;
}) {
  const id = useId();
  const isClient = useIsClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const first = cardRef.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-dialog-close])");
    const t = window.setTimeout(() => first?.focus(), 30);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open || !isClient) return null;

  return createPortal(
    <div className="mp-dialog">
      <button type="button" className="mp-dialog__scrim" aria-label="Close" data-dialog-close onClick={() => !busy && onClose()} tabIndex={-1} />
      <div ref={cardRef} className={`mp-dialog__card${wide ? " mp-dialog__card--wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <div className="mp-dialog__head">
          <h2 id={`${id}-title`}>{title}</h2>
          {intro ? <p>{intro}</p> : null}
        </div>
        {children ? <div className="mp-dialog__body">{children}</div> : null}
        {footer ? <div className="mp-dialog__foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

/** The standard footer: a status line, Cancel, and the one primary action. */
export function DialogButtons({
  onCancel,
  onConfirm,
  confirmLabel,
  cancelLabel = "Cancel",
  busyLabel,
  busy,
  disabled,
  danger,
  status,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  /** The dismiss button's words — "Keep session" where "Cancel" would read as the destructive action. */
  cancelLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  danger?: boolean;
  status?: { tone: "error" | "ok" | "info"; text: string } | null;
}) {
  return (
    <>
      {status ? (
        <span className={`mp-dialog__status mp-dialog__status--${status.tone}`} role={status.tone === "error" ? "alert" : "status"}>
          {status.text}
        </span>
      ) : null}
      <Button buttonStyle="secondary" size="medium" margin={false} onClick={onCancel} disabled={busy}>
        {cancelLabel}
      </Button>
      <Button buttonStyle={danger ? "secondary" : "primary"} size="medium" margin={false} onClick={onConfirm} disabled={busy || disabled} className={danger ? "mp-actions__danger" : undefined}>
        {busy ? (busyLabel ?? "Working…") : confirmLabel}
      </Button>
    </>
  );
}

/** A labelled field row for the dialog forms. */
export function Field({ label, hint, children, id, required }: { label: string; hint?: React.ReactNode; children: React.ReactNode; id?: string; required?: boolean }) {
  return (
    <div className="mp-field">
      <label htmlFor={id}>
        {label}
        {required ? (
          <span className="mp-field__required" aria-hidden>
            {" "}
            · required
          </span>
        ) : null}
      </label>
      {children}
      {hint ? <span className="mp-field__hint">{hint}</span> : null}
    </div>
  );
}

export function Check({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label className="mp-field mp-field--check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span>
        {label}
        {hint ? <small>{hint}</small> : null}
      </span>
    </label>
  );
}
