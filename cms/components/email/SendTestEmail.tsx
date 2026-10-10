"use client";

import { Button, toast, useAllFormFields, useAuth, useConfig } from "@payloadcms/ui";
import React, { useState } from "react";

import { formValues } from "@/cms/components/VerifyButton";

/**
 * ==========================================================================
 * SendTestEmail — "Send test to…" on Settings → Email sending (SPEC §C.3)
 * ==========================================================================
 *
 * Sends the `test` template to an address (the signed-in admin's by
 * default) using the UNSAVED form values — a masked secret means the stored
 * one — and shows the provider's answer: "Sent to … via SMTP (id …)" or the
 * reason it was not. Every attempt is also a row in Emails → Sent emails.
 */
export function SendTestEmail() {
  const { user } = useAuth();
  const { config } = useConfig();
  const [fields] = useAllFormFields();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState<string>((user as { email?: string } | null)?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const send = async () => {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch(`${config.serverURL ?? ""}${config.routes.api}/actions/email/test`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, data: formValues(fields) }),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string; errors?: Array<{ message?: string }> };
      const ok = response.ok && body.ok !== false;
      const message = body.message ?? body.errors?.[0]?.message ?? `The server answered ${response.status}.`;
      setResult({ ok, message });
      if (ok) toast.success(message);
      else toast.error(message);
    } catch {
      setResult({ ok: false, message: "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button buttonStyle="secondary" size="small" margin={false} onClick={() => setOpen(true)}>
        Send test…
      </Button>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <input
        type="email"
        value={to}
        onChange={(event) => setTo(event.target.value)}
        placeholder="name@example.com"
        aria-label="Send the test email to"
        style={{
          font: "inherit",
          fontSize: 13,
          padding: "4px 8px",
          borderRadius: 4,
          border: "1px solid var(--theme-elevation-250)",
          background: "var(--theme-input-bg)",
          color: "var(--theme-elevation-800)",
          minWidth: 220,
        }}
      />
      <Button buttonStyle="secondary" size="small" margin={false} onClick={send} disabled={busy || !to}>
        {busy ? "Sending…" : "Send"}
      </Button>
      {result ? (
        <span role="status" style={{ fontSize: 12, color: result.ok ? "var(--theme-success-500)" : "var(--theme-error-500)", maxWidth: 420 }}>
          {result.message}
        </span>
      ) : null}
    </span>
  );
}
