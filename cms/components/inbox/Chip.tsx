import React from "react";

/**
 * ==========================================================================
 * Chip — the Inbox's one visual token (status, count, spam flag)
 * ==========================================================================
 *
 * Shared by the list's status cell, the chips above the list and the
 * Reply-by-email panel so a status looks the same in all three places.
 * Colours come from Payload's theme variables only, so the chips follow
 * the admin's light/dark theme without a stylesheet of their own:
 *
 *   new         → warning (amber): somebody needs to pick this up
 *   in progress → success (green): somebody has
 *   closed      → neutral
 *   spam        → error (red): the honeypot was filled in
 *
 * No hooks, no "use client": it renders in server and client trees alike.
 */

export type ChipTone = "new" | "active" | "done" | "spam" | "plain";

const TONES: Record<ChipTone, { border: string; background: string; color?: string }> = {
  new: { border: "var(--theme-warning-500)", background: "var(--theme-warning-100)", color: "var(--theme-warning-900, inherit)" },
  active: { border: "var(--theme-success-500)", background: "var(--theme-success-100)", color: "var(--theme-success-900, inherit)" },
  done: { border: "var(--theme-elevation-200)", background: "var(--theme-elevation-50)", color: "var(--theme-elevation-700)" },
  spam: { border: "var(--theme-error-500)", background: "var(--theme-error-100)", color: "var(--theme-error-900, inherit)" },
  plain: { border: "var(--theme-elevation-150)", background: "transparent" },
};

export function Chip({
  tone = "plain",
  children,
  selected,
  title,
}: {
  tone?: ChipTone;
  children: React.ReactNode;
  selected?: boolean;
  title?: string;
}) {
  const colours = TONES[tone];
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        gap: "0.35em",
        alignItems: "baseline",
        padding: "0.15em 0.65em",
        borderRadius: "999px",
        border: `1px solid ${colours.border}`,
        background: colours.background,
        color: colours.color,
        whiteSpace: "nowrap",
        fontSize: "0.85em",
        lineHeight: 1.5,
        boxShadow: selected ? `0 0 0 2px ${colours.border}` : undefined,
        fontWeight: selected ? 600 : undefined,
      }}
    >
      {children}
    </span>
  );
}

export const toneForStatus = (status: unknown): ChipTone =>
  status === "new" ? "new" : status === "in_progress" ? "active" : status === "closed" ? "done" : "plain";
