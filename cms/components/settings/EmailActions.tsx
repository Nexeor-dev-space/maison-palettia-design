"use client";

import { Button, toast, useAllFormFields, useConfig, useField } from "@payloadcms/ui";
import React, { useState } from "react";

import { SendTestEmail } from "@/cms/components/email/SendTestEmail";
import { formValues } from "@/cms/components/VerifyButton";

/**
 * ==========================================================================
 * EmailActions — Verify connection · Send test to… (SPEC §C.3 email-settings)
 * ==========================================================================
 *
 * Mounted beside Save on Settings → Email sending
 * (`admin.components.elements.beforeDocumentControls`). Both buttons test
 * the UNSAVED form, so an admin can enter a password, verify, and only then
 * save; a masked secret means "the stored one".
 *
 * Verify writes `lastVerify` on the server AND into this form (`useField`),
 * because a json field the page loaded is otherwise sent back unchanged on
 * the next Save, silently undoing the verification "Bookings open" reads.
 */
export function EmailActions() {
  const { config } = useConfig();
  const [fields] = useAllFormFields();
  const { setValue: setLastVerify } = useField<unknown>({ path: "lastVerify" });
  const [state, setState] = useState<{ status: "idle" | "busy" | "ok" | "error"; message?: string }>({ status: "idle" });

  const verify = async () => {
    setState({ status: "busy" });
    try {
      const response = await fetch(`${config.serverURL ?? ""}${config.routes.api}/actions/email/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: formValues(fields) }),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string; lastVerify?: unknown; errors?: Array<{ message?: string }> };
      if (body.lastVerify) setLastVerify(body.lastVerify);
      const message = body.message ?? body.errors?.[0]?.message ?? `The server answered ${response.status}.`;
      if (!response.ok || body.ok === false) {
        setState({ status: "error", message });
        toast.error(message);
        return;
      }
      setState({ status: "ok", message });
      toast.success(message);
    } catch {
      setState({ status: "error", message: "Could not reach the server." });
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginRight: 8 }}>
      <Button buttonStyle="secondary" size="small" margin={false} onClick={verify} disabled={state.status === "busy"}>
        {state.status === "busy" ? "Checking…" : "Verify connection"}
      </Button>
      <SendTestEmail />
      {state.message ? (
        <span role="status" style={{ fontSize: 12, maxWidth: 420, color: state.status === "ok" ? "var(--theme-success-500)" : "var(--theme-error-500)" }}>
          {state.message}
        </span>
      ) : null}
    </span>
  );
}
