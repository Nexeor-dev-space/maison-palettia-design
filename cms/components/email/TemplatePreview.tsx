"use client";

import { Button, toast, useConfig, useFormFields } from "@payloadcms/ui";
import React, { useEffect, useRef, useState } from "react";

/**
 * ==========================================================================
 * TemplatePreview — the email as the customer will see it, before saving
 * ==========================================================================
 *
 * Posts the UNSAVED subject, preview text and body to
 * `POST /api/actions/email-templates/preview`, which renders them with the
 * sample values inside the real shell (logo, footer) and returns HTML,
 * plain text and any `{{names}}` that are not variables of this email. The
 * preview refreshes by itself a moment after typing stops.
 *
 * The HTML is shown in an `<iframe sandbox>` with no permissions at all —
 * no scripts, no same-origin access — so even a hostile template could not
 * reach the admin session.
 *
 * **Send me this** emails the same preview to the signed-in user (subject
 * prefixed "[Preview]") through the saved Email sending settings.
 */

type Preview = { subject: string; html: string; text: string; unknown: string[] };

export function TemplatePreview() {
  const { config } = useConfig();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  // One selector per field: a selector that built a new object would
  // re-render this panel on every keystroke anywhere in the form.
  const draft = {
    key: useFormFields(([fields]) => fields.key?.value as string | undefined),
    subject: useFormFields(([fields]) => fields.subject?.value as string | undefined),
    preheader: useFormFields(([fields]) => fields.preheader?.value as string | null | undefined),
    body: useFormFields(([fields]) => fields.body?.value),
  };
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [mode, setMode] = useState<"html" | "text">("html");
  const latest = useRef(0);

  const payload = JSON.stringify({ key: draft.key, subject: draft.subject ?? "", preheader: draft.preheader ?? null, body: draft.body ?? null });

  const [nonce, setNonce] = useState(0);

  // Re-render a moment after typing stops (and on Refresh, which bumps `nonce`).
  useEffect(() => {
    if (!draft.key) return;
    const ticket = ++latest.current;
    const timer = window.setTimeout(async () => {
      setBusy("preview");
      try {
        const response = await fetch(`${api}/actions/email-templates/preview`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: payload,
        });
        const body = (await response.json().catch(() => ({}))) as Partial<Preview> & { errors?: Array<{ message?: string }>; message?: string };
        if (ticket !== latest.current) return;
        if (!response.ok) throw new Error(body.errors?.[0]?.message ?? body.message ?? `The server answered ${response.status}.`);
        setPreview(body as Preview);
        setError(null);
      } catch (caught) {
        if (ticket === latest.current) setError(caught instanceof Error ? caught.message : "Preview failed.");
      } finally {
        if (ticket === latest.current) setBusy(null);
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [api, payload, draft.key, nonce]);

  const refresh = () => setNonce((n) => n + 1);

  const sendMe = async () => {
    setBusy("send");
    try {
      const response = await fetch(`${api}/actions/email-templates/send-me`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: payload,
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string; errors?: Array<{ message?: string }> };
      const message = body.message ?? body.errors?.[0]?.message ?? `The server answered ${response.status}.`;
      if (!response.ok || body.ok === false) toast.error(message);
      else toast.success(message);
    } catch {
      toast.error("Could not send the preview.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="field-type mp-template-preview" style={{ margin: "8px 0 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <strong style={{ marginRight: "auto" }}>Preview (sample values)</strong>
        <Button buttonStyle="secondary" size="small" margin={false} onClick={() => setMode(mode === "html" ? "text" : "html")}>
          {mode === "html" ? "Plain text" : "Formatted"}
        </Button>
        <Button buttonStyle="secondary" size="small" margin={false} onClick={refresh} disabled={busy !== null || !draft.key}>
          {busy === "preview" ? "Rendering…" : "Refresh"}
        </Button>
        <Button buttonStyle="primary" size="small" margin={false} onClick={sendMe} disabled={busy !== null || !draft.key}>
          {busy === "send" ? "Sending…" : "Send me this"}
        </Button>
      </div>
      {error ? (
        <div role="alert" style={{ color: "var(--theme-error-500)", marginBottom: 8 }}>
          {error}
        </div>
      ) : null}
      {preview?.unknown?.length ? (
        <div role="alert" style={{ color: "var(--theme-warning-700, #92400e)", background: "var(--theme-warning-100)", padding: "6px 10px", borderRadius: 6, marginBottom: 8 }}>
          Not variables of this email (the save will be refused): {preview.unknown.map((name) => `{{${name}}}`).join(", ")}
        </div>
      ) : null}
      {preview ? (
        <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", background: "var(--theme-elevation-50)", borderBottom: "1px solid var(--theme-elevation-150)", fontSize: 13 }}>
            <span style={{ color: "var(--theme-elevation-600)" }}>Subject: </span>
            <strong>{preview.subject}</strong>
          </div>
          {mode === "html" ? (
            <iframe title="Email preview" sandbox="" srcDoc={preview.html} style={{ width: "100%", height: 680, border: 0, background: "#fff", display: "block" }} />
          ) : (
            <pre style={{ margin: 0, padding: 16, whiteSpace: "pre-wrap", fontSize: 13, maxHeight: 680, overflow: "auto" }}>{preview.text}</pre>
          )}
        </div>
      ) : (
        <div style={{ color: "var(--theme-elevation-600)" }}>{draft.key ? "Rendering the preview…" : "Choose which email this is to preview it."}</div>
      )}
    </div>
  );
}
