"use client";

import { Button, toast, useConfig, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

/**
 * ==========================================================================
 * RetryButton — run a failed background job again (SPEC §H.9, §I "Jobs")
 * ==========================================================================
 *
 * Shown above the document controls of a `payload-jobs` row (System →
 * Background jobs), only when that job failed for good (`hasError`). It asks
 * the server to queue a NEW job with the same task and input
 * (`POST /api/payload-jobs/:id/retry`, admin only — cms/jobs/
 * collectionOverrides.ts) and then opens the new job, so the admin watches
 * the retry rather than the old failure.
 *
 * Safe to press twice: every task re-checks its own state before acting
 * (a refund only proceeds while still `approved`, tickets and invoices are
 * issued once), and the server refuses a job that is waiting or running.
 */

export function RetryButton() {
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const router = useRouter();
  const hasError = useFormFields(([fields]) => fields?.hasError?.value === true);
  const [busy, setBusy] = useState(false);

  if (!id || !hasError) return null;

  const retry = async () => {
    setBusy(true);
    try {
      const response = await fetch(`${config.serverURL ?? ""}${config.routes.api}/payload-jobs/${encodeURIComponent(String(id))}/retry`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
      });
      const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string; errors?: Array<{ message?: string }> };
      if (!response.ok || !body.id) throw new Error(body.errors?.[0]?.message ?? body.message ?? `The server answered ${response.status}.`);
      toast.success(body.message ?? "Queued again.");
      router.push(`${config.routes.admin}/collections/payload-jobs/${body.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not retry the job.");
      setBusy(false);
    }
  };

  return (
    <Button buttonStyle="secondary" size="small" onClick={retry} disabled={busy}>
      {busy ? "Queuing…" : "Retry"}
    </Button>
  );
}
