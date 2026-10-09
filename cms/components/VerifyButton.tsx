"use client";

import { Button, toast, useAllFormFields } from "@payloadcms/ui";
import type { FormState } from "payload";
import React, { useState } from "react";

/**
 * ==========================================================================
 * VerifyButton — "does this key work?", asked before saving
 * ==========================================================================
 *
 * Posts the CURRENT form values (not the saved document) to the matching
 * `/api/actions/**` endpoint, so an admin can paste a Mamo key, press Test
 * connection, and only then save (SPEC §C.3: "all test the unsaved form
 * values"). A masked secret in the form means "use the stored one"; the
 * endpoint resolves that server-side and the clear text never comes back.
 *
 * The endpoints are Phase 3's (settings-payments.ts, settings-email.ts).
 * Until they exist the button reports the 404 as a failure, which is the
 * truthful answer.
 */

export type VerifyKind = "mamo" | "smtp" | "resend";

const ACTIONS: Record<VerifyKind, { url: string; label: string }> = {
  mamo: { url: "/api/actions/payments/test-connection", label: "Test connection" },
  smtp: { url: "/api/actions/email/verify", label: "Verify connection" },
  resend: { url: "/api/actions/email/verify", label: "Verify connection" },
};

/** `{ "a.b": {value}, "rows.0.x": {value} }` → `{ a: { b }, rows: [{ x }] }` */
export function formValues(fields: FormState): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [path, state] of Object.entries(fields ?? {})) {
    if (!path || state === undefined) continue;
    const segments = path.split(".");
    let cursor: Record<string, unknown> | unknown[] = root;
    segments.forEach((segment, index) => {
      const last = index === segments.length - 1;
      const key: string | number = /^\d+$/.test(segment) ? Number(segment) : segment;
      if (last) {
        (cursor as Record<string | number, unknown>)[key] = state.value;
        return;
      }
      const nextIsIndex = /^\d+$/.test(segments[index + 1]);
      const existing = (cursor as Record<string | number, unknown>)[key];
      if (existing === undefined || typeof existing !== "object" || existing === null) {
        (cursor as Record<string | number, unknown>)[key] = nextIsIndex ? [] : {};
      }
      cursor = (cursor as Record<string | number, unknown>)[key] as Record<string, unknown> | unknown[];
    });
  }
  return root;
}

export function VerifyButton({ kind, label }: { kind: VerifyKind; label?: string }) {
  const [fields] = useAllFormFields();
  const [state, setState] = useState<{ status: "idle" | "busy" | "ok" | "error"; message?: string }>({ status: "idle" });
  const action = ACTIONS[kind];

  const run = async () => {
    setState({ status: "busy" });
    try {
      const response = await fetch(action.url, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: formValues(fields) }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string; errors?: Array<{ message?: string }>; ok?: boolean };
      if (!response.ok || body.ok === false) {
        throw new Error(body.message ?? body.errors?.[0]?.message ?? `The server answered ${response.status}.`);
      }
      const message = body.message ?? "Connected.";
      setState({ status: "ok", message });
      toast.success(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not verify.";
      setState({ status: "error", message });
      toast.error(message);
    }
  };

  return (
    <span className="mp-verify">
      <Button buttonStyle="secondary" size="small" onClick={run} disabled={state.status === "busy"}>
        {state.status === "busy" ? "Checking…" : (label ?? action.label)}
      </Button>
      {state.status === "ok" || state.status === "error" ? (
        <span className={`mp-verify__result mp-verify__result--${state.status}`} role="status">
          {state.message}
        </span>
      ) : null}
    </span>
  );
}
