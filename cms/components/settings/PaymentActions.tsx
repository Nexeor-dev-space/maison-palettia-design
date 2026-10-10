"use client";

import { Button, toast, useAllFormFields, useConfig, useFormModified } from "@payloadcms/ui";
import React, { useMemo, useState } from "react";

import { formValues } from "@/cms/components/VerifyButton";

/**
 * ==========================================================================
 * PaymentActions — the buttons above Settings → Payments (SPEC §C.3, §I)
 * ==========================================================================
 *
 * Mounted through `admin.components.elements.beforeDocumentControls` on the
 * `payment-settings` global. Five actions, each a call to an admin-only
 * endpoint in cms/endpoints/settings-payments.ts:
 *
 *   · Test connection        GET /me with the key in the form — the unsaved
 *                            one if the admin just pasted it (§C.3);
 *   · Register/Update webhook shows the exact URL first, then registers;
 *   · Rotate webhook secret  new secret, the old one honoured 10 minutes;
 *   · List Mamo webhooks     what Mamo has on file (auth header as [set]);
 *   · Send AED 2 test order  sandbox / mock only — opens the payment page.
 *
 * KEEPING THE OPEN FORM HONEST. The endpoints store what they did (the
 * check result, the webhook id/URL, a new secret) straight into the global.
 * The form on screen still holds the values it loaded with, and the next
 * Save would write those back — a stale `null` in `webhookAuthHeader` would
 * even CLEAR the new secret. So every response carries `fields` (dotted
 * path → new masked value) and this component writes them into the form
 * state with both `value` and `initialValue`, which updates what Save sends
 * without marking the page as modified.
 *
 * Register and Rotate act on the SAVED key; with unsaved edits on the page
 * they ask for a Save first instead of guessing.
 */

type Env = "test" | "live";
type Busy = null | "test" | "register" | "rotate" | "list" | "order";

interface ActionResponse {
  ok?: boolean;
  message?: string;
  preview?: boolean;
  url?: string;
  paymentUrl?: string;
  fields?: Record<string, unknown>;
  webhooks?: Array<{ id: string; url: string; enabled_events: string[]; auth_header: "[set]" | null; ours?: boolean; current?: boolean }>;
  expectedUrl?: string | null;
  errors?: Array<{ message?: string }>;
}

const ENV_LABEL: Record<Env, string> = { test: "Sandbox", live: "Live" };

export function PaymentActions() {
  const [fields, dispatchFields] = useAllFormFields();
  const modified = useFormModified();
  const { config } = useConfig();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;

  const formMode = fields?.mode?.value as string | undefined;
  const [env, setEnv] = useState<Env>(formMode === "live" ? "live" : "test");
  const [busy, setBusy] = useState<Busy>(null);
  const [note, setNote] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [pending, setPending] = useState<{ kind: "register" | "rotate"; text: string } | null>(null);
  const [webhooks, setWebhooks] = useState<ActionResponse["webhooks"] | null>(null);

  const values = useMemo(() => formValues(fields), [fields]);

  const applyFields = (next?: Record<string, unknown>) => {
    for (const [path, value] of Object.entries(next ?? {})) {
      dispatchFields({ type: "UPDATE", path, value, initialValue: value });
    }
  };

  const call = async (kind: Exclude<Busy, null>, path: string, body: Record<string, unknown>): Promise<ActionResponse | null> => {
    setBusy(kind);
    setNote(null);
    try {
      const response = await fetch(`${api}/actions/payments/${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = ((await response.json().catch(() => ({}))) ?? {}) as ActionResponse;
      if (!response.ok || data.ok === false) {
        const message = data.message ?? data.errors?.[0]?.message ?? `The server answered ${response.status}.`;
        if (data.fields) applyFields(data.fields);
        setNote({ tone: "error", text: message });
        toast.error(message);
        return null;
      }
      applyFields(data.fields);
      return data;
    } catch {
      setNote({ tone: "error", text: "Could not reach the server." });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const done = (data: ActionResponse | null) => {
    if (!data?.message) return;
    setNote({ tone: "ok", text: data.message });
    toast.success(data.message);
  };

  const needsSave = (what: string) => {
    if (!modified) return false;
    setNote({ tone: "info", text: `Save the page first — ${what} uses the saved ${ENV_LABEL[env]} key.` });
    return true;
  };

  const testConnection = async () => done(await call("test", "test-connection", { data: values, mode: env }));

  const startRegister = async () => {
    if (needsSave("registering the webhook")) return;
    const data = await call("register", "register-webhook", { mode: env, confirm: false });
    if (data?.preview) setPending({ kind: "register", text: data.message ?? `Register ${data.url}?` });
  };

  const startRotate = async () => {
    if (needsSave("rotating the secret")) return;
    const data = await call("rotate", "rotate-webhook-secret", { mode: env, confirm: false });
    if (data?.preview) setPending({ kind: "rotate", text: data.message ?? "Rotate the webhook secret?" });
  };

  const confirmPending = async () => {
    if (!pending) return;
    const kind = pending.kind;
    setPending(null);
    done(await call(kind, kind === "register" ? "register-webhook" : "rotate-webhook-secret", { mode: env, confirm: true }));
  };

  const listWebhooks = async () => {
    const data = await call("list", "list-webhooks", { mode: env, data: values });
    if (data) {
      setWebhooks(data.webhooks ?? []);
      done(data);
    }
  };

  const testOrder = async () => {
    const data = await call("order", "test-order", {});
    if (data?.paymentUrl) {
      window.open(data.paymentUrl, "_blank", "noopener,noreferrer");
      done(data);
    }
  };

  const tone = note?.tone === "error" ? "var(--theme-error-500)" : note?.tone === "info" ? "var(--theme-warning-500)" : "var(--theme-success-500)";

  return (
    <div
      className="mp-payment-actions"
      style={{
        display: "grid",
        gap: "calc(var(--base) / 2)",
        padding: "calc(var(--base) / 2) var(--base)",
        marginBottom: "var(--base)",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "var(--style-radius-m, 4px)",
        background: "var(--theme-elevation-50)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "calc(var(--base) / 2)" }}>
        <strong style={{ marginRight: "calc(var(--base) / 2)" }}>Mamo Pay actions</strong>
        <span role="radiogroup" aria-label="Environment" style={{ display: "inline-flex", gap: "0.25rem" }}>
          {(["test", "live"] as const).map((option) => (
            <Button
              key={option}
              buttonStyle={env === option ? "primary" : "secondary"}
              size="small"
              aria-pressed={env === option}
              onClick={() => {
                setEnv(option);
                setWebhooks(null);
                setPending(null);
              }}
            >
              {ENV_LABEL[option]}
            </Button>
          ))}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <Button buttonStyle="secondary" size="small" onClick={testConnection} disabled={busy !== null}>
          {busy === "test" ? "Checking…" : "Test connection"}
        </Button>
        <Button buttonStyle="secondary" size="small" onClick={startRegister} disabled={busy !== null}>
          {busy === "register" ? "Working…" : "Register/Update webhook"}
        </Button>
        <Button buttonStyle="secondary" size="small" onClick={startRotate} disabled={busy !== null}>
          {busy === "rotate" ? "Working…" : "Rotate webhook secret"}
        </Button>
        <Button buttonStyle="secondary" size="small" onClick={listWebhooks} disabled={busy !== null}>
          {busy === "list" ? "Loading…" : "List Mamo webhooks"}
        </Button>
        {formMode !== "live" ? (
          <Button buttonStyle="secondary" size="small" onClick={testOrder} disabled={busy !== null}>
            {busy === "order" ? "Creating…" : formMode === "mock" ? "Send mock test payment" : "Send AED 2 test order"}
          </Button>
        ) : null}
      </div>

      {pending ? (
        <div role="alertdialog" aria-label="Confirm" style={{ display: "grid", gap: "0.5rem", padding: "0.75rem", border: "1px solid var(--theme-warning-500)", borderRadius: "4px" }}>
          <span>{pending.text}</span>
          <span style={{ display: "flex", gap: "0.5rem" }}>
            <Button size="small" onClick={confirmPending}>
              {pending.kind === "register" ? `Register with ${ENV_LABEL[env]}` : "Rotate now"}
            </Button>
            <Button size="small" buttonStyle="secondary" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </span>
        </div>
      ) : null}

      {note ? (
        <p role="status" style={{ margin: 0, paddingLeft: "0.6rem", borderLeft: `3px solid ${tone}` }}>
          {note.text}
        </p>
      ) : null}

      {webhooks ? (
        webhooks.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Webhook</th>
                <th>URL</th>
                <th>Events</th>
                <th>Auth header</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((hook) => (
                <tr key={hook.id} style={{ borderTop: "1px solid var(--theme-elevation-150)" }}>
                  <td>
                    {hook.id}
                    {hook.ours ? " (ours)" : ""}
                  </td>
                  <td style={{ color: hook.current ? undefined : "var(--theme-error-500)", wordBreak: "break-all" }}>
                    {hook.url}
                    {hook.current ? "" : " — not this site's address"}
                  </td>
                  <td>{hook.enabled_events.length}</td>
                  <td>{hook.auth_header ?? "none"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ margin: 0 }}>Mamo has no webhooks registered for {ENV_LABEL[env]}.</p>
        )
      ) : null}
    </div>
  );
}
