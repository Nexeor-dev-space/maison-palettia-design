"use client";

import type { DefaultCellComponentProps } from "payload";
import React from "react";

/**
 * ==========================================================================
 * StatusCell — every status column as a coloured chip (SPEC §I, 4B)
 * ==========================================================================
 *
 * One cell component for orders, tickets, refunds, payments, passes, the
 * waitlist and sent emails: the collection passes its value → label map
 * and tone map as `clientProps`, so the words in the chip are the words
 * of the select's own options (the long form "Requested — awaiting
 * approval" is cut at the dash for the chip; the full option is still in
 * the filter). Tones come from the same `mp-chip--*` classes the dashboard
 * uses, so a "Confirmed" order looks the same everywhere.
 *
 * The Inbox keeps its own StatusCell (Phase 3E) because it also shows the
 * spam flag; this one is for everything else.
 */

export type ChipTone = "ok" | "lilac" | "warn" | "bad" | "muted";

type Props = DefaultCellComponentProps & {
  labels?: Record<string, string>;
  tones?: Record<string, ChipTone>;
};

export function StatusCell({ cellData, labels = {}, tones = {} }: Props) {
  const value = typeof cellData === "string" ? cellData : cellData == null ? "" : String(cellData);
  if (!value) return <span className="mp-chip mp-chip--muted mp-chip--plain">—</span>;
  const label = (labels[value] ?? value.replace(/_/g, " ")).split(" — ")[0];
  const tone = tones[value] ?? "muted";
  return <span className={`mp-chip mp-chip--${tone}`}>{label}</span>;
}

/** `[{ label, value }]` → the `labels` prop, so a collection passes its own options. */
export const labelsOf = (options: ReadonlyArray<{ label: string; value: string }>): Record<string, string> => Object.fromEntries(options.map((o) => [o.value, o.label]));
