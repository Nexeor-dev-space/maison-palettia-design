"use client";

import { useConfig } from "@payloadcms/ui";
import type { UIFieldClientProps } from "payload";
import React from "react";

import type { BrandCopyLinkCustom } from "@/cms/fields/brandCopyLink";

/**
 * ==========================================================================
 * BrandCopyLink — "this text comes from Brand wording" (SPEC §E)
 * ==========================================================================
 *
 * Rendered in place of a block's own text fields while its "Use Brand
 * wording" switch is on (cms/fields/brandCopyLink.ts decides when). It
 * stores nothing; it names the global field the words come from and links
 * straight to it: `/admin/globals/brand-copy#field-{path}`, Payload's own
 * field id with dots turned into double underscores (the same id the
 * click-to-edit listener scrolls to, §G.5).
 *
 * The link opens in a new tab on purpose: the editor is usually halfway
 * through a page, and the page's unsaved autosave draft should still be
 * there when they come back.
 */

const isBrandCopy = (value: unknown): value is BrandCopyLinkCustom =>
  Boolean(value) && typeof value === "object" && typeof (value as BrandCopyLinkCustom).path === "string";

export function BrandCopyLink({ field }: UIFieldClientProps) {
  const { config } = useConfig();
  const custom = (field.admin as { custom?: { brandCopy?: unknown } } | undefined)?.custom?.brandCopy;
  if (!isBrandCopy(custom)) return null;

  const href = `${config.routes.admin}/globals/${custom.global}#field-${custom.path.replace(/\./g, "__")}`;

  return (
    <div
      className="field-type mp-brand-copy-link"
      style={{
        marginBottom: "var(--base)",
        padding: "calc(var(--base) / 2) var(--base)",
        border: "1px dashed var(--theme-elevation-250)",
        borderRadius: "var(--style-radius-s)",
        background: "var(--theme-elevation-50)",
      }}
    >
      <p style={{ margin: 0 }}>
        This text comes from{" "}
        <strong>
          Brand wording → {custom.label}
        </strong>
        .{" "}
        <a href={href} target="_blank" rel="noopener noreferrer">
          Edit it there →
        </a>
      </p>
      {custom.toggleLabel ? (
        <p style={{ margin: "0.25em 0 0", fontSize: "0.85em", color: "var(--theme-elevation-600)" }}>
          Turn off “{custom.toggleLabel}” to write your own for this page.
        </p>
      ) : null}
    </div>
  );
}
