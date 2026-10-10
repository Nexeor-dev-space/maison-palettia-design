"use client";

import { useFormFields } from "@payloadcms/ui";
import type { UIFieldClientProps } from "payload";
import React from "react";

/**
 * ==========================================================================
 * FixedPageBadge — "this page is part of the site's structure" (SPEC §D.2)
 * ==========================================================================
 *
 * Eleven pages have routes of their own and the menus point at them, so
 * they cannot be deleted or renamed (cms/hooks/formatSlug.ts refuses both).
 * Without a word in the editor, a non-developer found that out only when a
 * save or a delete was refused. This says it up front, in the sidebar
 * beside the (then read-only) address.
 *
 * The list arrives as `admin.custom.fixedSlugs`, set from
 * `FIXED_PAGE_SLUGS` in cms/collections/content/Pages.ts — the one copy of
 * it. Importing that module here would pull the whole collection config
 * into the admin's browser bundle. It stores nothing.
 */

const fixedSlugsOf = (field: UIFieldClientProps["field"]): readonly string[] => {
  const list = (field.admin as { custom?: { fixedSlugs?: unknown } } | undefined)?.custom?.fixedSlugs;
  return Array.isArray(list) ? list.filter((value): value is string => typeof value === "string") : [];
};

function LockIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" style={{ flex: "none", marginTop: "0.2em" }}>
      <path
        fill="currentColor"
        d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6H6V4.5a2 2 0 1 1 4 0V7Z"
      />
    </svg>
  );
}

export function FixedPageBadge({ field }: UIFieldClientProps) {
  const slug = useFormFields(([fields]) => fields.slug?.value);
  if (typeof slug !== "string" || !fixedSlugsOf(field).includes(slug)) return null;

  return (
    <div
      className="field-type mp-fixed-page-badge"
      style={{
        display: "flex",
        gap: "0.5em",
        marginBottom: "var(--base)",
        padding: "calc(var(--base) / 2) calc(var(--base) * 0.75)",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "var(--style-radius-s)",
        background: "var(--theme-elevation-50)",
        color: "var(--theme-elevation-800)",
      }}
    >
      <LockIcon />
      <p style={{ margin: 0 }}>This page is part of the site structure and cannot be deleted or renamed.</p>
    </div>
  );
}
