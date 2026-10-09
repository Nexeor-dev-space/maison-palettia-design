"use client";

import { FieldDescription, FieldError, FieldLabel, useField } from "@payloadcms/ui";
import type { DefaultCellComponentProps, NumberFieldClient, NumberFieldClientProps } from "payload";
import React, { useState } from "react";

import { aedToFils, filsToAed, formatAed } from "@/cms/lib/money";

/**
 * ==========================================================================
 * MoneyField — type AED, store fils (cms/fields/money.ts)
 * ==========================================================================
 *
 * The input holds text ("240.00") while the field value is an integer
 * (24000). Conversion happens on blur, not on every keystroke, so "24" does
 * not snap to "24.00" under the cursor. An unparseable entry leaves the
 * stored value alone and shows a message; the field's own server-side
 * validation is the backstop.
 *
 * The text is DERIVED, not synchronised: a draft is kept only while the
 * stored value is still the one it was typed against. When the value
 * changes from outside (form reset, autosave reload, a Clear) the draft no
 * longer matches and the display falls back to the formatted value — no
 * effect, no second render.
 */

const toText = (fils: number | null | undefined) => (typeof fils === "number" ? filsToAed(fils).toFixed(2) : "");

type Draft = { forValue: number | null; text: string };

export function MoneyField({ field, path, readOnly }: NumberFieldClientProps) {
  const { value, setValue, showError, errorMessage } = useField<number | null>({ path });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const current = value ?? null;
  const text = draft && draft.forValue === current ? draft.text : toText(current);

  const commit = () => {
    if (text.trim() === "") {
      setLocalError(null);
      setDraft(null);
      setValue(null);
      return;
    }
    const fils = aedToFils(text);
    if (fils === null) {
      setLocalError("Enter an amount in AED, e.g. 240.00");
      return;
    }
    setLocalError(null);
    setDraft(null);
    setValue(fils);
  };

  const description = typeof field.admin?.description === "string" ? field.admin.description : undefined;

  return (
    <div className="field-type number mp-money">
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div className="mp-money__row">
        <span className="mp-money__currency" aria-hidden="true">
          AED
        </span>
        <input
          id={`field-${path.replace(/\./g, "__")}`}
          className="mp-money__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          disabled={readOnly}
          onChange={(event) => setDraft({ forValue: current, text: event.target.value })}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
          aria-invalid={Boolean(localError) || showError}
        />
      </div>
      <FieldError path={path} showError={showError || Boolean(localError)} message={localError ?? errorMessage} />
      {description ? <FieldDescription description={description} path={path} /> : null}
    </div>
  );
}

/** List-view cell: "AED 240.00" instead of "24000". */
export function MoneyCell({ cellData }: DefaultCellComponentProps<NumberFieldClient>) {
  return <span className="mp-money__cell">{typeof cellData === "number" ? formatAed(cellData) : "—"}</span>;
}
