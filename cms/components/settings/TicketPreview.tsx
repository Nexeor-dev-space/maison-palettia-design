"use client";

import { Button, toast, useConfig, useFormFields } from "@payloadcms/ui";
import React, { useState } from "react";

/**
 * ==========================================================================
 * TicketPreview — "Preview ticket PDF" (SPEC §C.3 booking-settings.ticket)
 * ==========================================================================
 *
 * A `ui` field under Booking & checkout wording → Tickets. Sends the
 * UNSAVED heading and instructions to `POST /api/actions/tickets/preview`
 * (admin + editor), which renders a clearly marked sample ticket
 * (`renderSampleTicketPdf`: fake code, a QR no scanner accepts, today's
 * logo and fonts), and opens the PDF in a new tab. Nothing is saved.
 */
export function TicketPreview() {
  const { config } = useConfig();
  const heading = useFormFields(([fields]) => (fields["ticket.heading"]?.value as string | undefined) ?? "");
  const instructions = useFormFields(([fields]) => (fields["ticket.instructions"]?.value as string | undefined) ?? "");
  const [busy, setBusy] = useState(false);

  const open = async () => {
    // Opened before the request so popup blockers treat it as a click.
    const tab = window.open("", "_blank");
    setBusy(true);
    try {
      const response = await fetch(`${config.serverURL ?? ""}${config.routes.api}/actions/tickets/preview`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ heading, instructions }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string; errors?: Array<{ message?: string }> };
        throw new Error(body.errors?.[0]?.message ?? body.message ?? `The server answered ${response.status}.`);
      }
      const url = URL.createObjectURL(await response.blob());
      if (tab) tab.location.href = url;
      else window.location.assign(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      tab?.close();
      toast.error(error instanceof Error ? error.message : "Could not create the preview.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field-type" style={{ margin: "4px 0 24px" }}>
      <Button buttonStyle="secondary" size="small" margin={false} onClick={open} disabled={busy}>
        {busy ? "Creating…" : "Preview ticket PDF"}
      </Button>
      <div style={{ fontSize: 12, color: "var(--theme-elevation-600)", marginTop: 6 }}>Shows a sample ticket with the wording above — no need to save first.</div>
    </div>
  );
}
