import React from "react";

import { chapters } from "@/cms/lib/docs/guide";

import { CommandPalette, type GuideEntry } from "./CommandPalette";

/**
 * The ⌘K palette with the guide's chapters in it. A server component, mounted
 * in `admin.components.beforeNavLinks` in place of the palette itself, so
 * the chapter list (titles, keywords and section titles — a few KB) is read
 * here and only that crosses to the browser, never the chapters' text.
 */

const GUIDE: GuideEntry[] = chapters.map((c) => ({
  slug: c.slug,
  title: c.title,
  keywords: [c.keywords ?? "", c.blurb, ...c.sections.map((s) => s.title)].join(" ").toLowerCase(),
}));

export function CommandPaletteWithGuide() {
  return <CommandPalette guide={GUIDE} />;
}
