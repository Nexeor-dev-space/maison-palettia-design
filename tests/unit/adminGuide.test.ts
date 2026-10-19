import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { chapters, checkGuide, screenshotFiles, searchIndex } from "@/cms/lib/docs/guide";
import { inlineText, parseInline } from "@/cms/lib/docs/inline";
import type { Block } from "@/docs/admin-guide/content/types";

/**
 * The owner's guide (docs/admin-guide/content) is data the Docs tab and the
 * PDF render; these checks keep it honest as chapters are edited:
 * unique anchors, links that land, screenshots that exist, and callout
 * numbers in the steps that match a screenshot in the same section.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const images = path.join(root, "docs", "admin-guide", "images");

describe("admin guide content", () => {
  it("has no duplicate anchors or links to nowhere", () => {
    expect(checkGuide()).toEqual([]);
  });

  it("uses only screenshots that exist in docs/admin-guide/images", () => {
    const missing = screenshotFiles().filter((f) => !fs.existsSync(path.join(images, f)));
    expect(missing).toEqual([]);
  });

  it("refers in the steps only to callout numbers a screenshot in the same section draws", () => {
    const problems: string[] = [];
    const numbersIn = (blocks: Block[]) => {
      const drawn = new Set<number>();
      for (const b of blocks) {
        if (b.type === "screenshot") b.callouts.forEach((c) => drawn.add(c.n));
        if (b.type === "phones") b.shots.forEach((s) => s.callouts.forEach((c) => drawn.add(c.n)));
      }
      return drawn;
    };
    for (const c of chapters) {
      for (const s of c.sections) {
        const drawn = numbersIn(s.blocks);
        for (const b of s.blocks) {
          const texts = b.type === "steps" || b.type === "list" ? b.items : b.type === "paragraph" ? [b.text] : [];
          for (const t of texts) {
            for (const node of parseInline(t)) {
              if (node.t === "callout" && !drawn.has(node.n)) problems.push(`${c.slug}#${s.id}: ((${node.n})) but no screenshot here draws a ${node.n}`);
            }
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("builds a search index with an entry per chapter and per section", () => {
    const index = searchIndex();
    const sections = chapters.reduce((n, c) => n + c.sections.length, 0);
    expect(index).toHaveLength(chapters.length + sections);
    expect(index.every((e) => e.t && e.c && e.a)).toBe(true);
  });
});

describe("inline markup", () => {
  it("parses every marker and flattens to plain words", () => {
    const src = "Press [[Save]] ((2)) in {{Settings > Staff}}, type `MP-` or <<⌘>> **now** *gently* — see [refunds](#refund).";
    const kinds = parseInline(src).map((n) => n.t);
    expect(kinds).toEqual(["text", "ui", "text", "callout", "text", "path", "text", "code", "text", "kbd", "text", "b", "text", "i", "text", "link", "text"]);
    expect(inlineText(src)).toBe("Press Save in Settings › Staff, type MP- or ⌘ now gently — see refunds.");
  });

  it("keeps unclosed markers and escapes as literal text", () => {
    expect(inlineText("a * b and [not a link and \\[[x]]")).toBe("a * b and [not a link and [[x]]");
    expect(inlineText("2 ** 3")).toBe("2 ** 3");
  });
});
