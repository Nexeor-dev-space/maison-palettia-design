"use client";

import { FieldLabel } from "@payloadcms/ui";
import type { StaticLabel } from "payload";
import React from "react";

/**
 * A field label WITHOUT its group's name in front (4B review). Payload
 * heads a list column for a nested field with the whole path —
 * "TOTALS > TOTAL CHARGED", "CONTACT DETAILS (AS BOOKED) > EMAIL" — unless
 * the field has its own `admin.components.Label`, which it then uses for
 * the column and the form alike. This one draws exactly Payload's own
 * label, so the form is unchanged; `text` (clientProps) can say it
 * differently in both places.
 */
export function PlainLabel({ field, path, text }: { field?: { label?: StaticLabel | false; required?: boolean }; path?: string; text?: string }) {
  // No `path` means a list column heading: no required star there.
  return <FieldLabel label={text ?? (field?.label || undefined)} required={path ? field?.required : false} path={path} />;
}
