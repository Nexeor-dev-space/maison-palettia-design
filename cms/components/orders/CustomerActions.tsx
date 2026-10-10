"use client";

import { toast, useAuth, useConfig, useDocumentInfo } from "@payloadcms/ui";
import React, { useState } from "react";

import { ActionsMenu } from "@/cms/components/admin/ActionsMenu";
import { callAction } from "@/cms/components/admin/api";
import { Dialog, DialogButtons } from "@/cms/components/admin/Dialog";

/**
 * ==========================================================================
 * CustomerActions — Sign out everywhere (SPEC §H.10, §I "Customers")
 * ==========================================================================
 *
 * The one action a customer record has: invalidate every "My bookings"
 * session at once by bumping `sessionVersion` — for a lost phone, or a
 * magic link forwarded to the wrong person. Admin only (§J); the endpoint
 * checks again. Also a shortcut to the customer's orders, filtered.
 */

export function CustomerActions() {
  const { id, initialData } = useDocumentInfo();
  const { user } = useAuth();
  const { config } = useConfig();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "ok" | "info"; text: string } | null>(null);
  const isAdmin = (user as { role?: string } | null)?.role === "admin";
  if (!id) return null;

  const email = String((initialData as { email?: string } | undefined)?.email ?? "this customer");

  const signOut = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await callAction(api, `/actions/customers/${id}/sign-out-everywhere`, { body: {} });
      toast.success(`${email} has been signed out on every device.`);
      setOpen(false);
    } catch (error) {
      setStatus({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ActionsMenu
        items={[
          { label: "See their bookings", icon: "bag", href: `${config.routes.admin}/collections/orders?where[customer][equals]=${id}` },
          ...(isAdmin ? [{ divider: true as const }, { label: "Sign out everywhere", icon: "person" as const, hint: "Ends every “My bookings” sign-in", onClick: () => setOpen(true), danger: true }] : []),
        ]}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Sign out everywhere?"
        intro={`Every “My bookings” link and sign-in for ${email} stops working. They can request a new link from the site at any time. Their bookings are not affected.`}
        busy={busy}
        footer={<DialogButtons onCancel={() => setOpen(false)} onConfirm={signOut} confirmLabel="Sign out everywhere" busyLabel="Signing out…" busy={busy} status={status} danger />}
      />
    </>
  );
}
