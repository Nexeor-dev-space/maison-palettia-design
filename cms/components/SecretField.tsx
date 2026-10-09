"use client";

import { Button, FieldDescription, FieldLabel, TextInput, useField, useFormFields } from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";
import React, { useState } from "react";

import { MASK } from "@/cms/lib/mask";

import { VerifyButton, type VerifyKind } from "./VerifyButton";

/**
 * ==========================================================================
 * SecretField — the admin face of encryptedText() (SPEC §C.2)
 * ==========================================================================
 *
 * The server never sends a secret to the browser: a stored value arrives as
 * the mask `••••••••` and the sibling `…SetAt` date says when it was entered.
 * This component shows exactly that, plus three actions:
 *
 *   · Replace  — swaps the row for a text input. Submitting clear text seals
 *                it on the server; cancelling, or saving with the input left
 *                empty, keeps the stored value (the hook treats "" as
 *                "untouched").
 *   · Clear    — sets the form value to `null`, which the hook stores as
 *                "no secret" and clears the date.
 *   · Verify   — only when the field declares one (Mamo / SMTP / Resend);
 *                posts the UNSAVED form to the matching action endpoint so
 *                a key can be tested before it is saved.
 *
 * `verify` and `setAtPath` arrive as `clientProps` from the field config.
 */

type Props = TextFieldClientProps & {
  verify?: VerifyKind | null;
  setAtPath?: string;
};

const formatSetAt = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai" }).format(date);
};

export function SecretField({ field, path, readOnly, verify, setAtPath }: Props) {
  const { value, setValue, initialValue, showError, errorMessage } = useField<string | null>({ path });
  // `setAtPath` is the sibling's bare name ("apiKeySetAt"); form state is keyed
  // by full path, so a secret inside a group ("test.apiKey") reads "test.apiKeySetAt".
  const siblingPath = `${path.slice(0, path.lastIndexOf(".") + 1)}${setAtPath ?? `${field.name}SetAt`}`;
  const setAt = useFormFields(([fields]) => fields?.[siblingPath]?.value as string | null | undefined);
  const [editing, setEditing] = useState(false);

  const stored = value === MASK;
  const setOn = typeof setAt === "string" ? formatSetAt(setAt) : null;
  const description = typeof field.admin?.description === "string" ? field.admin.description : undefined;

  if (editing) {
    return (
      <div className="field-type text mp-secret-field mp-secret-field--editing">
        <TextInput
          path={path}
          label={field.label}
          required={field.required}
          value={value ?? ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
          placeholder="Paste the new value"
          htmlAttributes={{ autoComplete: "off" }}
          showError={showError}
          Error={errorMessage ? <span className="mp-secret-field__error">{errorMessage}</span> : undefined}
        />
        <div className="mp-secret-field__actions">
          <Button
            buttonStyle="secondary"
            size="small"
            onClick={() => {
              setValue(initialValue ?? null);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
          <span className="mp-secret-field__hint">Saved when you save the page. Leave empty to keep the current value.</span>
        </div>
        {description ? <FieldDescription description={description} path={path} /> : null}
      </div>
    );
  }

  return (
    <div className="field-type text mp-secret-field">
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div className="mp-secret-field__row">
        <code className="mp-secret-field__value" aria-label={stored ? "A value is set" : "No value set"}>
          {stored ? MASK : "Not set"}
        </code>
        {stored && setOn ? <span className="mp-secret-field__meta">set on {setOn}</span> : null}
        {!readOnly ? (
          <>
            <Button buttonStyle="secondary" size="small" onClick={() => setEditing(true)}>
              {stored ? "Replace" : "Enter"}
            </Button>
            {stored ? (
              <Button buttonStyle="error" size="small" onClick={() => setValue(null)}>
                Clear
              </Button>
            ) : null}
          </>
        ) : null}
        {verify ? <VerifyButton kind={verify} /> : null}
      </div>
      {showError && errorMessage ? <span className="mp-secret-field__error">{errorMessage}</span> : null}
      {description ? <FieldDescription description={description} path={path} /> : null}
    </div>
  );
}
