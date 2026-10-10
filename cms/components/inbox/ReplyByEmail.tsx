"use client";

import { toast, useConfig, useDocumentInfo, useField, useFormFields } from "@payloadcms/ui";
import React, { useState } from "react";

import { buildReplyMailto, enquiryReference, formatWhen, statusLabel } from "@/cms/collections/inbox/shared";

import { Chip, toneForStatus } from "./Chip";

/**
 * ==========================================================================
 * ReplyByEmail — the top of every enquiry (SPEC §D.4 `ui` field, §I)
 * ==========================================================================
 *
 * Everything someone needs before answering, in one strip:
 *
 *   · the reference (`ENQ-…`, derived from the id — cms/collections/inbox/
 *     shared.ts) and the status chip;
 *   · a red warning when the honeypot was filled in ("probably a bot — not
 *     notified"), so nobody replies to spam without noticing;
 *   · the page the form was sent from (`meta.referer`, a site path), as a
 *     link that opens the public page in a new tab;
 *   · **Reply by email** — a real `mailto:` link (so it works with whatever
 *     mail client the computer has, and the reply leaves from the studio's
 *     own address), with the reference in the subject and the message
 *     quoted. Clicking it also calls `POST /api/actions/enquiries/{id}/
 *     replied`, which stamps `repliedAt` and moves a `new` enquiry to
 *     `in_progress` on the server; the form is then updated in place WITHOUT
 *     marking it modified, so there is no "unsaved changes" prompt for a
 *     change that is already saved. The link is never `preventDefault`ed: if
 *     the stamp fails (offline, signed out) the mail client still opens and
 *     a toast says the date was not recorded.
 *   · **Copy address**, for people who answer from a webmail tab.
 *
 * The CMS never sends a free-text reply itself (§D.4: replies happen in the
 * studio's inbox). Topic labels arrive as `clientProps` from the collection
 * config so this bundle does not import lib/enquiry.ts.
 */

type Topic = { value: string; label: string };

const str = (value: unknown): string => (typeof value === "string" ? value : "");

export function ReplyByEmail({ topics = [] }: { topics?: Topic[] }) {
  const { id, data } = useDocumentInfo();
  const { config } = useConfig();
  const [busy, setBusy] = useState(false);

  const values = useFormFields(([fields]) => ({
    email: str(fields.email?.value),
    name: str(fields.name?.value),
    topic: str(fields.topic?.value),
    message: str(fields.message?.value),
    // A site path only (refererPath() stores nothing else); re-checked here because it becomes an href.
    referer: /^\/(?!\/)/.test(str(fields["meta.referer"]?.value)) ? str(fields["meta.referer"]?.value) : "",
    spam: fields["meta.honeypotTripped"]?.value === true,
  }));
  const repliedAt = useField<string | null>({ path: "repliedAt" });
  const status = useField<string>({ path: "status" });

  if (!id) return null; // enquiries are only ever created by the public form
  const reference = enquiryReference(id);
  const createdAt = str((data as { createdAt?: unknown } | undefined)?.createdAt);
  const topicLabel = topics.find((topic) => topic.value === values.topic)?.label ?? values.topic;
  const mailto = values.email
    ? buildReplyMailto({ email: values.email, name: values.name, reference, topicLabel, message: values.message, receivedAt: createdAt || null })
    : "";

  const stamp = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`${config.serverURL ?? ""}${config.routes.api}/actions/enquiries/${id}/replied`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const body = (await res.json().catch(() => ({}))) as { repliedAt?: string; status?: string; errors?: { message?: string }[] };
      if (!res.ok) throw new Error(body.errors?.[0]?.message ?? `HTTP ${res.status}`);
      // `true` = do not mark the form modified: the server already has these values.
      if (body.repliedAt) repliedAt.setValue(body.repliedAt, true);
      if (body.status) status.setValue(body.status, true);
      toast.success("Marked as replied.");
    } catch (error) {
      toast.error(`Your mail app should open, but the reply date was not recorded (${(error as Error).message}). Set “Replied” by hand.`);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(values.email);
      toast.success("Email address copied.");
    } catch {
      toast.error("Could not copy — select the address in the Email field instead.");
    }
  };

  const button: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4em",
    padding: "0.45em 1em",
    borderRadius: "var(--style-radius-s, 4px)",
    border: "1px solid var(--theme-elevation-800)",
    background: "var(--theme-elevation-800)",
    color: "var(--theme-elevation-0)",
    textDecoration: "none",
    fontSize: "0.95em",
    cursor: "pointer",
  };
  const secondary: React.CSSProperties = { ...button, background: "transparent", color: "var(--theme-elevation-800)", border: "1px solid var(--theme-elevation-250)" };

  return (
    <section
      aria-label="Reply by email"
      style={{
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "var(--style-radius-m, 6px)",
        padding: "calc(var(--base) * 0.75)",
        marginBottom: "var(--base)",
        display: "grid",
        gap: "0.6em",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5em", alignItems: "center" }}>
        <Chip>
          <span style={{ fontFamily: "var(--font-mono, monospace)" }}>{reference}</span>
        </Chip>
        <Chip tone={toneForStatus(status.value)}>{statusLabel(status.value)}</Chip>
        {repliedAt.value ? <span style={{ color: "var(--theme-elevation-600)", fontSize: "0.9em" }}>Replied {formatWhen(repliedAt.value)}</span> : null}
        {createdAt ? <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.9em", marginInlineStart: "auto" }}>Received {formatWhen(createdAt)}</span> : null}
      </div>

      {values.spam ? (
        <p role="note" style={{ margin: 0, padding: "0.5em 0.75em", borderRadius: "var(--style-radius-s, 4px)", background: "var(--theme-error-100)", border: "1px solid var(--theme-error-500)" }}>
          <strong>Probably a bot.</strong> The hidden form field was filled in, so nobody was notified and it was filed as Closed. Read it before replying — browser autofill
          very occasionally catches a real person.
        </p>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5em", alignItems: "center" }}>
        {mailto ? (
          <a href={mailto} onClick={() => void stamp()} style={button} aria-busy={busy}>
            Reply by email
          </a>
        ) : (
          <span style={{ color: "var(--theme-elevation-500)" }}>No email address on this enquiry.</span>
        )}
        {values.email ? (
          <button type="button" onClick={() => void copy()} style={secondary}>
            Copy address
          </button>
        ) : null}
        {values.referer ? (
          <span style={{ fontSize: "0.9em", color: "var(--theme-elevation-600)" }}>
            Sent from{" "}
            <a href={values.referer} target="_blank" rel="noopener noreferrer">
              {values.referer}
            </a>
          </span>
        ) : null}
      </div>
      <p style={{ margin: 0, fontSize: "0.85em", color: "var(--theme-elevation-500)" }}>
        Opens your mail app with the reference {reference} in the subject and records the reply date here. The reply itself is sent from your own mailbox.
      </p>
    </section>
  );
}
