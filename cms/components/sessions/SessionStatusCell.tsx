"use client";

import type { DefaultCellComponentProps } from "payload";
import React from "react";

/**
 * The Sessions list's "Booking status" column as a chip — and "Cancelled"
 * when the session was cancelled (4B review: a cancelled date showed as
 * "Published · Closed", indistinguishable from one closed by hand).
 * `cancelledAt` is stamped by "Cancel session & refund all".
 */

const LABEL: Record<string, string> = { open: "Open", waitlist: "Waitlist only", closed: "Closed" };
const TONE: Record<string, string> = { open: "ok", waitlist: "lilac", closed: "muted" };

export function SessionStatusCell({ cellData, rowData }: DefaultCellComponentProps) {
  const cancelled = Boolean((rowData as { cancelledAt?: string | null } | undefined)?.cancelledAt);
  if (cancelled) return <span className="mp-chip mp-chip--bad">Cancelled</span>;
  const value = typeof cellData === "string" ? cellData : "";
  if (!value) return <span className="mp-chip mp-chip--muted mp-chip--plain">—</span>;
  return <span className={`mp-chip mp-chip--${TONE[value] ?? "muted"}`}>{LABEL[value] ?? value}</span>;
}
