"use client";

import { FieldDescription, FieldError, FieldLabel, useField } from "@payloadcms/ui";
import type { NumberFieldClientProps } from "payload";
import React from "react";

/**
 * ==========================================================================
 * LineChoiceField — "which line?" as words, stored as the renderer's index
 * ==========================================================================
 *
 * A heading line is picked by its position, and the renderer counts from
 * zero (components/sections/Hero.tsx `accentLine`). Asking an editor for
 * "0 for the first line" is a developer's question, so the admin shows a
 * dropdown of First / Second / Third line while the column keeps the
 * number it always held — no migration, nothing for the site to relearn.
 * `admin.custom.lines` says how many lines to offer (default three).
 */

const ORDINALS = ["First", "Second", "Third", "Fourth"];

export function LineChoiceField({ field, path, readOnly }: NumberFieldClientProps) {
  const { value, setValue, showError, errorMessage } = useField<number | null>({ path });
  const lines = Number((field.admin as { custom?: { lines?: unknown } } | undefined)?.custom?.lines) || 3;
  const description = typeof field.admin?.description === "string" ? field.admin.description : undefined;
  const id = `field-${path.replace(/\./g, "__")}`;

  return (
    <div className="field-type select mp-line-choice">
      <FieldLabel htmlFor={id} label={field.label} path={path} required={field.required} />
      <select
        id={id}
        value={typeof value === "number" ? String(value) : ""}
        disabled={readOnly}
        onChange={(event) => setValue(event.target.value === "" ? null : Number(event.target.value))}
        style={{ width: "100%", padding: "calc(var(--base) / 2.5) calc(var(--base) / 2)" }}
      >
        {field.required ? null : <option value="">—</option>}
        {Array.from({ length: lines }, (_, index) => (
          <option key={index} value={index}>
            {`${ORDINALS[index] ?? `Line ${index + 1}`} line`}
          </option>
        ))}
      </select>
      <FieldError path={path} showError={showError} message={errorMessage} />
      {description ? <FieldDescription description={description} path={path} /> : null}
    </div>
  );
}
