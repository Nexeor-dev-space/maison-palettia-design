"use client";

import { Button, toast, useAuth, useConfig, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import React, { useState } from "react";

/**
 * ==========================================================================
 * ResendButton — send a logged email again (SPEC §D.5, §I "Notifications")
 * ==========================================================================
 *
 * In the sidebar of a Sent emails row, admins only (`POST /api/actions/
 * notifications/{id}/resend`). The resend is a NEW row with the same stored
 * HTML, queued like any other send, so the log keeps both attempts; the
 * link to it appears here once it is queued.
 *
 * Disabled once the 30-day purge has cleared the stored content — the
 * order's own "Resend confirmation" renders the email afresh instead.
 * (`html` is admin-read only, which is also why this reads it: an admin
 * sees an empty `html` only when it really was purged.)
 */
export function ResendButton() {
  const { user } = useAuth();
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const html = useFormFields(([fields]) => fields.html?.value as string | null | undefined);
  const [busy, setBusy] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);

  if ((user as { role?: string } | null)?.role !== "admin" || !id) return null;
  const expired = !html;

  const resend = async () => {
    setBusy(true);
    try {
      const response = await fetch(`${config.serverURL ?? ""}${config.routes.api}/actions/notifications/${id}/resend`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string; logId?: string; errors?: Array<{ message?: string }> };
      const message = body.message ?? body.errors?.[0]?.message ?? `The server answered ${response.status}.`;
      if (!response.ok || body.ok === false) {
        toast.error(message);
        return;
      }
      toast.success(message);
      if (body.logId) setNewId(body.logId);
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field-type" style={{ marginBottom: 24 }}>
      <Button buttonStyle="secondary" size="small" margin={false} onClick={resend} disabled={busy || expired}>
        {busy ? "Queuing…" : "Resend this email"}
      </Button>
      <div style={{ fontSize: 12, color: "var(--theme-elevation-600)", marginTop: 6 }}>
        {expired
          ? "Expired — the content was cleared after 30 days. Use the order’s Resend action, which renders it afresh."
          : "Sends exactly this message again to the same address."}
      </div>
      {newId ? (
        <a href={`${config.routes.admin}/collections/notification-log/${newId}`} style={{ fontSize: 12 }}>
          Open the new row →
        </a>
      ) : null}
    </div>
  );
}
