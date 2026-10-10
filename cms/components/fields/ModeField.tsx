"use client";

/**
 * The Payments **Mode** switch (SPEC §C.3 payment-settings, `mode`).
 *
 * A radio with three answers — Test, Live, Mock — and one of them is a real
 * money decision. Payload's stock radio would flip to Live on a single click,
 * so this field intercepts that one transition and opens a checklist first:
 *
 *   ✓ the live API key is saved and has passed Test connection
 *   ✓ the live webhook is registered at the current site address
 *   ✓ the site address is https
 *
 * The first two come from the *unsaved* form (`useAllFormFields`), so a key
 * verified a moment ago counts; the third needs Site details and is fetched
 * once when the dialog opens. **Switch to Live** stays disabled while any
 * line fails, and the server's `beforeValidate` runs the same checks on save
 * — the dialog explains, the hook enforces. Switching *away* from Live is the
 * safe direction and needs no ceremony.
 *
 * `mock` is only offered outside production. `process.env.NODE_ENV` is
 * inlined into the client bundle by Next, so the option simply is not
 * rendered in a production build; the server-side validator refuses the
 * value too, in case it is already stored.
 */

import type { RadioFieldClientProps } from "payload";

import { Button, FieldDescription, FieldError, FieldLabel, Modal, useAllFormFields, useConfig, useField, useModal } from "@payloadcms/ui";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type Mode = "test" | "live" | "mock";

const MODAL_SLUG = "payment-mode-go-live";

/** Same wording as `PAYMENT_MODE_OPTIONS` in cms/globals/PaymentSettings.ts (server-only module). */
const OPTIONS: Array<{ value: Mode; label: string; hint: string }> = [
  { value: "test", label: "Test", hint: "Mamo sandbox. Cards are test cards and no money moves." },
  { value: "live", label: "Live", hint: "Real payments with the live key. Switching runs a checklist first." },
  { value: "mock", label: "Mock", hint: "A built-in fake gateway for development. Never available in production." },
];

interface Check {
  label: string;
  ok: boolean | null; // null = still finding out
  detail?: string;
}

const PUBLIC_URL_RE = /^https:\/\/[a-z0-9.-]+(:\d+)?$/;

export function ModeField(props: RadioFieldClientProps) {
  const { field, path, readOnly } = props;
  const { value, setValue, showError, errorMessage, initialValue } = useField<Mode>({ path });
  const [fields] = useAllFormFields();
  const { openModal, closeModal } = useModal();
  const { config } = useConfig();

  const isProduction = process.env.NODE_ENV === "production";
  const options = useMemo(() => OPTIONS.filter((o) => o.value !== "mock" || !isProduction), [isProduction]);

  const [publicUrl, setPublicUrl] = useState<string | null | undefined>(undefined);

  /* Unsaved live credentials, straight from form state. */
  const liveKeySaved = Boolean(fields["live.apiKey"]?.value);
  const liveCheck = fields["live.lastConnectionCheck"]?.value as { ok?: boolean } | null | undefined;
  const liveWebhookId = fields["live.webhookId"]?.value as string | null | undefined;
  const liveWebhookUrl = fields["live.webhookUrl"]?.value as string | null | undefined;

  const loadPublicUrl = useCallback(async () => {
    setPublicUrl(undefined);
    try {
      const res = await fetch(`${config.serverURL ?? ""}${config.routes.api}/globals/site-settings?depth=0`, {
        credentials: "include",
      });
      const doc = res.ok ? ((await res.json()) as { publicUrl?: string | null }) : null;
      setPublicUrl(doc?.publicUrl ?? null);
    } catch {
      setPublicUrl(null);
    }
  }, [config.routes.api, config.serverURL]);

  const checks: Check[] = useMemo(() => {
    const httpsOk = typeof publicUrl === "string" && PUBLIC_URL_RE.test(publicUrl);
    const webhookOk =
      Boolean(liveWebhookId) &&
      typeof liveWebhookUrl === "string" &&
      typeof publicUrl === "string" &&
      publicUrl.length > 0 &&
      liveWebhookUrl.startsWith(publicUrl);
    return [
      {
        label: "Live API key saved and verified",
        ok: liveKeySaved && liveCheck?.ok === true,
        detail: liveKeySaved
          ? liveCheck?.ok === true
            ? undefined
            : "Run Test connection with the live key."
          : "Paste the live key under Live credentials and save.",
      },
      {
        label: "Live webhook registered at the current site address",
        ok: publicUrl === undefined ? null : webhookOk,
        detail: webhookOk ? liveWebhookUrl ?? undefined : "Use Register/Update webhook after the live key is verified.",
      },
      {
        label: "Site address is https",
        ok: publicUrl === undefined ? null : httpsOk,
        detail: publicUrl === undefined ? "Checking…" : publicUrl || "Set it under Site details → Advanced.",
      },
    ];
  }, [liveCheck, liveKeySaved, liveWebhookId, liveWebhookUrl, publicUrl]);

  const allPass = checks.every((c) => c.ok === true);

  const choose = (next: Mode) => {
    if (readOnly || next === value) return;
    if (next === "live") {
      void loadPublicUrl();
      openModal(MODAL_SLUG);
      return;
    }
    setValue(next);
  };

  const confirmLive = () => {
    if (!allPass) return;
    setValue("live");
    closeModal(MODAL_SLUG);
  };

  /* Close the dialog if the form resets under it (e.g. after save). */
  useEffect(() => {
    if (value === "live") closeModal(MODAL_SLUG);
  }, [value, closeModal]);

  const description = typeof field.admin?.description === "string" ? field.admin.description : undefined;

  return (
    <div className={`field-type radio-group${showError ? " error" : ""}`} style={{ marginBottom: "var(--base)" }}>
      <FieldLabel label={field.label} path={path} required={field.required} />
      <FieldError path={path} showError={showError} message={errorMessage} />

      <div role="radiogroup" aria-labelledby={`field-${path.replace(/\./g, "__")}`} style={{ display: "grid", gap: "calc(var(--base) / 2)" }}>
        {options.map((option) => {
          const selected = value === option.value;
          const isSaved = initialValue === option.value;
          return (
            <label
              key={option.value}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "calc(var(--base) / 2)",
                alignItems: "start",
                padding: "calc(var(--base) / 2) var(--base)",
                border: `1px solid ${selected ? "var(--theme-elevation-800)" : "var(--theme-elevation-150)"}`,
                borderRadius: "var(--style-radius-s)",
                background: selected ? "var(--theme-elevation-50)" : "var(--theme-elevation-0)",
                cursor: readOnly ? "default" : "pointer",
                opacity: readOnly && !selected ? 0.6 : 1,
              }}
            >
              <input
                type="radio"
                name={path}
                value={option.value}
                checked={selected}
                disabled={readOnly}
                onChange={() => choose(option.value)}
                style={{ marginTop: "0.25em" }}
              />
              <span>
                <strong style={{ display: "block" }}>
                  {option.label}
                  {option.value === "live" && selected ? " — real money" : ""}
                </strong>
                <span style={{ color: "var(--theme-elevation-600)", fontSize: "0.9em" }}>{option.hint}</span>
              </span>
              <span style={{ fontSize: "0.75em", color: "var(--theme-elevation-500)", whiteSpace: "nowrap" }}>
                {isSaved ? "saved" : selected ? "not saved yet" : ""}
              </span>
            </label>
          );
        })}
      </div>

      {description ? <FieldDescription description={description} path={path} /> : null}

      <Modal slug={MODAL_SLUG} className="confirmation-modal" style={{ padding: "var(--base)" }}>
        <div
          style={{
            maxWidth: "36rem",
            margin: "10vh auto 0",
            background: "var(--theme-elevation-0)",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "var(--style-radius-m)",
            padding: "var(--base)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Switch to Live?</h2>
          <p style={{ color: "var(--theme-elevation-700)" }}>
            From the moment this is saved, Book buttons charge real cards through the live Mamo account. Every line
            below must pass; the server checks them again when you save.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "var(--base) 0" }}>
            {checks.map((check) => (
              <li key={check.label} style={{ display: "grid", gridTemplateColumns: "1.5em 1fr", gap: "0.5em", marginBottom: "0.5em" }}>
                <span
                  aria-hidden="true"
                  style={{
                    color:
                      check.ok === true ? "var(--theme-success-500)" : check.ok === false ? "var(--theme-error-500)" : "var(--theme-elevation-500)",
                    fontWeight: 700,
                  }}
                >
                  {check.ok === true ? "✓" : check.ok === false ? "✗" : "…"}
                </span>
                <span>
                  <span style={{ display: "block" }}>{check.label}</span>
                  {check.detail ? (
                    <span style={{ display: "block", fontSize: "0.85em", color: "var(--theme-elevation-600)" }}>{check.detail}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: "calc(var(--base) / 2)", justifyContent: "flex-end" }}>
            <Button buttonStyle="secondary" onClick={() => closeModal(MODAL_SLUG)}>
              Stay in {value === "mock" ? "Mock" : "Test"}
            </Button>
            <Button buttonStyle="primary" disabled={!allPass} onClick={confirmLive}>
              Switch to Live
            </Button>
          </div>
          <p style={{ marginTop: "var(--base)", fontSize: "0.85em", color: "var(--theme-elevation-600)" }}>
            Switching selects Live in the form; nothing changes until you press Save.
          </p>
        </div>
      </Modal>
    </div>
  );
}
