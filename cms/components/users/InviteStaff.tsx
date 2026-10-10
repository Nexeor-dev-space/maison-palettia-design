"use client";

import { toast, useAuth, useConfig } from "@payloadcms/ui";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

import { callAction } from "@/cms/components/admin/api";
import { Dialog, DialogButtons, Field } from "@/cms/components/admin/Dialog";
import { Icon } from "@/cms/components/admin/icons";

/**
 * ==========================================================================
 * InviteStaff — "Invite staff" above the Staff list (SPEC §I "Users")
 * ==========================================================================
 *
 * Name, email, role → `POST /actions/users/invite`: the account is created
 * with a password nobody knows and the person gets a one-time link to set
 * their own. No passwords are typed or sent by anyone. The endpoint
 * refuses until Email sending is verified, and says so; the dialog repeats
 * that in its own words. `?invite=1` opens it straight away (the dashboard
 * quick action and the ⌘K command).
 */

const ROLES = [
  { value: "editor", label: "Editor", hint: "Pages, sessions, photos and wording. No bookings, no settings." },
  { value: "front-desk", label: "Front desk", hint: "Bookings, tickets, check-in and the inbox. No content, no settings." },
  { value: "admin", label: "Admin", hint: "Everything, including payments, email and staff." },
] as const;

export function InviteStaff() {
  const { user } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  const listUrl = `${config.routes.admin}/collections/users`;
  const [open, setOpen] = useState(() => searchParams.get("invite") === "1");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("editor");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "ok" | "info"; text: string } | null>(null);

  if ((user as { role?: string } | null)?.role !== "admin") return null;

  const close = () => {
    if (busy) return;
    setOpen(false);
    setStatus(null);
    if (searchParams.get("invite") === "1") router.replace(listUrl);
  };

  const invite = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await callAction<{ id: string; message: string; status: string }>(api, "/actions/users/invite", { body: { name: name.trim(), email: email.trim(), role } });
      toast.success(res.message);
      setOpen(false);
      setName("");
      setEmail("");
      router.push(`${listUrl}/${res.id}`);
    } catch (error) {
      setStatus({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const ready = name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <>
      <div className="mp-toolbar">
        <span className="mp-field__hint">Colleagues set their own password from an emailed link — nobody shares one.</span>
        <span className="mp-toolbar__spacer" />
        <button type="button" className="mp-actions__btn mp-actions__btn--primary" onClick={() => setOpen(true)}>
          <Icon name="users" size={14} />
          Invite staff
        </button>
      </div>
      <Dialog
        open={open}
        onClose={close}
        title="Invite a colleague"
        intro="They receive an email with a link to choose their password. The link works once and expires in an hour; you can send a new one from their page at any time."
        busy={busy}
        footer={<DialogButtons onCancel={close} onConfirm={invite} confirmLabel="Send invitation" busyLabel="Sending…" busy={busy} disabled={!ready} status={status} />}
      >
        <div className="mp-field--row">
          <Field label="Name" id="inv-name">
            <input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="off" />
          </Field>
          <Field label="Email" id="inv-email">
            <input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          </Field>
        </div>
        <div className="mp-field">
          <span className="mp-field__label">What they may do</span>
          <div className="mp-choice">
            {ROLES.map((r) => (
              <label key={r.value}>
                <input type="radio" name="inv-role" checked={role === r.value} onChange={() => setRole(r.value)} />
                <span>
                  {r.label}
                  <small>{r.hint}</small>
                </span>
              </label>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
}
