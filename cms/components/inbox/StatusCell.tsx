"use client";

import type { DefaultCellComponentProps } from "payload";
import React from "react";

import { statusLabel } from "@/cms/collections/inbox/shared";

import { Chip, toneForStatus } from "./Chip";

/**
 * The `status` column of the Inbox list as a coloured chip, with a red
 * "Spam?" beside it when the honeypot was filled in (SPEC §I "Enquiries").
 * Scanning a list for the amber "New" chips is faster than reading a column
 * of identical grey words. `rowData` is the whole row, which is how the
 * spam flag (a nested `meta` field, not a column) reaches the cell.
 */
export function StatusCell({ cellData, rowData }: DefaultCellComponentProps) {
  const spam = Boolean((rowData as { meta?: { honeypotTripped?: boolean | null } } | undefined)?.meta?.honeypotTripped);
  return (
    <span style={{ display: "inline-flex", gap: "0.35em", alignItems: "center", flexWrap: "wrap" }}>
      <Chip tone={toneForStatus(cellData)}>{statusLabel(cellData)}</Chip>
      {spam ? (
        <Chip tone="spam" title="The hidden form field was filled in — probably a bot. Not notified.">
          Spam?
        </Chip>
      ) : null}
    </span>
  );
}
