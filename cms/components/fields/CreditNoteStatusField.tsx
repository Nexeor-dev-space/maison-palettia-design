"use client";

import { FieldDescription, FieldError, FieldLabel, ReactSelect, useField } from "@payloadcms/ui";
import type { SelectFieldClientProps } from "payload";
import React, { useMemo } from "react";

const DEFAULT_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "Partially Redeemed", value: "partially_redeemed" },
  { label: "Fully Redeemed", value: "redeemed" },
  { label: "Expired", value: "expired" },
];

/**
 * Custom dropdown selector for Credit Note Status matching Payload's native theme.
 * Disables search/text input (`isSearchable={false}`) to prevent arbitrary user typing,
 * while preserving Payload's full styling, elevation, colors, width, and chevron indicator.
 */
export function CreditNoteStatusField({ field, path, readOnly }: SelectFieldClientProps) {
  const { value, setValue, showError, errorMessage } = useField<string>({ path });

  const rawOptions = field.options && field.options.length > 0 ? field.options : DEFAULT_OPTIONS;
  const options = useMemo(() => {
    return rawOptions.map((opt) => {
      if (typeof opt === "string") {
        return { label: opt, value: opt };
      }
      return {
        label: typeof opt.label === "string" ? opt.label : String(opt.value),
        value: String(opt.value),
      };
    });
  }, [rawOptions]);

  const selectedOption = useMemo(() => {
    if (!value) return options[0];
    return options.find((opt) => opt.value === value) ?? { label: value, value };
  }, [options, value]);

  const style: React.CSSProperties = {
    ...(field.admin?.style || {}),
    ...(field.admin?.width
      ? { ["--field-width" as any]: field.admin.width }
      : { flex: "1 1 auto" }),
    ...(field.admin?.style?.flex ? { flex: field.admin.style.flex } : {}),
  };

  const id = `field-${path.replace(/\./g, "__")}`;
  const description = typeof field.admin?.description === "string" ? field.admin.description : undefined;

  return (
    <div
      className={["field-type", "select", field.admin?.className, showError && "error", readOnly && "read-only"]
        .filter(Boolean)
        .join(" ")}
      id={id}
      style={style}
    >
      <FieldLabel label={field.label} localized={field.localized} path={path} required={field.required} />
      <div className="field-type__wrap">
        <FieldError message={errorMessage} path={path} showError={showError} />
        <ReactSelect
          disabled={readOnly}
          id={id}
          isClearable={false}
          isSearchable={false}
          onChange={(opt: any) => {
            if (!readOnly && opt && !Array.isArray(opt)) {
              setValue(opt.value);
            }
          }}
          options={options}
          showError={showError}
          value={selectedOption}
        />
      </div>
      {description ? <FieldDescription description={description} path={path} /> : null}
    </div>
  );
}
