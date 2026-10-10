"use client";

import { useFormFields } from "@payloadcms/ui";
import React, { useState } from "react";

import { COMMON_VARIABLES, TEMPLATE_VARIABLES, type EmailTemplateKey } from "@/cms/email/variables";

/**
 * ==========================================================================
 * TemplateVariables — "what can I write in {{ }}?" (SPEC §D.5, §I)
 * ==========================================================================
 *
 * A read-only list in the template's sidebar, from the same code map the
 * renderer and the save-time check use (cms/email/variables.ts), so what
 * this panel offers is exactly what a save accepts. Clicking a name copies
 * `{{name}}` for pasting into the subject or the message. `links.*` names
 * belong in a link (select text → link → paste as the URL).
 */

const box: React.CSSProperties = {
  border: "1px solid var(--theme-elevation-150)",
  borderRadius: 8,
  padding: "10px 12px",
  background: "var(--theme-elevation-50)",
  fontSize: 13,
};

export function TemplateVariables() {
  const key = useFormFields(([fields]) => fields.key?.value as EmailTemplateKey | undefined);
  const [copied, setCopied] = useState<string | null>(null);
  const own = key ? (TEMPLATE_VARIABLES[key] ?? []) : [];

  const copy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(`{{${name}}}`);
      setCopied(name);
      window.setTimeout(() => setCopied((current) => (current === name ? null : current)), 1500);
    } catch {
      /* clipboard blocked: the name is visible to copy by hand */
    }
  };

  const row = (variable: { name: string; description: string }) => (
    <li key={variable.name} style={{ margin: "0 0 8px", listStyle: "none" }}>
      <button
        type="button"
        onClick={() => copy(variable.name)}
        title="Copy"
        style={{
          font: "inherit",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 12,
          padding: "1px 6px",
          borderRadius: 4,
          border: "1px solid var(--theme-elevation-200)",
          background: copied === variable.name ? "var(--theme-success-100)" : "var(--theme-elevation-0)",
          color: "var(--theme-elevation-800)",
          cursor: "pointer",
        }}
      >
        {`{{${variable.name}}}`}
      </button>
      <div style={{ color: "var(--theme-elevation-600)", marginTop: 2 }}>{variable.description}</div>
    </li>
  );

  return (
    <div className="field-type mp-template-variables" style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Variables</div>
      <div style={box}>
        {key ? (
          <>
            <ul style={{ margin: 0, padding: 0 }}>{own.map(row)}</ul>
            <div style={{ margin: "10px 0 6px", fontWeight: 600, color: "var(--theme-elevation-700)" }}>In every email</div>
            <ul style={{ margin: 0, padding: 0 }}>{COMMON_VARIABLES.map(row)}</ul>
            <p style={{ margin: "8px 0 0", color: "var(--theme-elevation-600)" }}>
              Click to copy. Put <code>links.…</code> in a link’s URL. Anything else in double braces is refused when you save.
            </p>
          </>
        ) : (
          <span style={{ color: "var(--theme-elevation-600)" }}>Choose which email this is to see its variables.</span>
        )}
      </div>
    </div>
  );
}
