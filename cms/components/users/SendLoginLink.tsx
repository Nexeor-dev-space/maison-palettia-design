"use client";

import { toast, useAuth, useConfig, useDocumentInfo } from "@payloadcms/ui";
import React, { useState } from "react";

import { callAction } from "@/cms/components/admin/api";
import { Dialog, DialogButtons } from "@/cms/components/admin/Dialog";
import { Icon } from "@/cms/components/admin/icons";

/**
 * ==========================================================================
 * SendLoginLink — on a staff member's page (SPEC §I "Users")
 * ==========================================================================
 *
 * For "I never got the invitation" and "I forgot my password": one button
 * that emails a fresh one-time link to set a password
 * (`POST /actions/users/:id/send-login-link`). Admin only; refused with a
 * clear sentence until Email sending is verified.
 */

export function SendLoginLink() {
  const { id, initialData } = useDocumentInfo();
  const { user } = useAuth();
  const { config } = useConfig();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "ok" | "info"; text: string } | null>(null);
  if (!id || (user as { role?: string } | null)?.role !== "admin") return null;

  const data = (initialData ?? {}) as { name?: string; email?: string; active?: boolean };
  const who = data.name || data.email || "this person";

  const send = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await callAction<{ message: string }>(api, `/actions/users/${id}/send-login-link`, { body: {} });
      toast.success(res.message);
      setOpen(false);
    } catch (error) {
      setStatus({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="mp-actions__btn" onClick={() => setOpen(true)} style={{ marginInlineEnd: 6 }} disabled={data.active === false} title={data.active === false ? "Tick “Can sign in” first" : undefined}>
        <Icon name="send" size={14} />
        Send login link
      </button>
      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={`Email ${who} a login link?`}
        intro={`A one-time link to choose a new password goes to ${data.email ?? "their address"}. It expires in an hour; older links stop working.`}
        busy={busy}
        footer={<DialogButtons onCancel={() => setOpen(false)} onConfirm={send} confirmLabel="Send link" busyLabel="Sending…" busy={busy} status={status} />}
      />
    </>
  );
}
