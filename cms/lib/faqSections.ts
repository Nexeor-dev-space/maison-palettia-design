import type { Payload } from "payload";

import { FAQ_GROUPS } from "@/cms/blocks/FaqList";
import { SEED_CONTEXT } from "@/cms/seed/upsert";

/**
 * ==========================================================================
 * The FAQ page's three sections, moved from the code into the CMS — once
 * ==========================================================================
 *
 * Until Nov 2026 the FAQ page had three sections fixed in code (`FAQ_GROUPS`),
 * with their headings typed on the page's "FAQ list" block. Editors now
 * manage sections themselves (Content → FAQ sections). This creates the three
 * that already exist, so the page reads the same before and after:
 *
 *   · heading — the one the FAQ page's published "FAQ list" block gives it,
 *     or the code's own when the block does not name it;
 *   · order — the block's order, then any the block left out;
 *   · legacyKey — which old section it replaces, so every question filed the
 *     old way (`faqs.group`) lands under it without being rewritten.
 *
 * NO QUESTION IS WRITTEN. A question saved before the change keeps its
 * `group`; `faqs.section` reads as the matching section until the question is
 * next saved. So no draft is touched, and no new version is made.
 *
 * ONCE. Then `system-state.faqSectionsMovedAt` is stamped and nothing here
 * runs again, so a section an editor deletes or renames stays that way. A
 * section that already carries a legacy key is never made twice, so a run
 * that fails part-way is simply run again.
 *
 * BEFORE IT RUNS, the site prints the sections the old way (from the block),
 * so a deploy looks the same whichever order things happen in.
 *
 * It runs at the end of cms/scripts/restore-media.ts (every `npm run
 * start:prod`, after migrations) and at the end of the seed.
 */

type Key = (typeof FAQ_GROUPS)[number]["value"];

export interface FaqMoveResult {
  state: "already-moved" | "dry-run" | "moved";
  /** Sections made (or, in a dry run, that would be), in page order. */
  created: string[];
  /** Old sections that already had a section document. */
  existing: string[];
}

const CONTEXT = { ...SEED_CONTEXT };
const KEYS = FAQ_GROUPS.map((group) => group.value) as Key[];
const DEFAULT_TITLES = Object.fromEntries(FAQ_GROUPS.map((group) => [group.value, group.label])) as Record<Key, string>;

/** Has the move run against this database? False when that cannot be read (a database without the column yet). */
export async function faqSectionsMoved(payload: Payload): Promise<boolean> {
  try {
    const state = (await payload.findGlobal({ slug: "system-state", depth: 0, overrideAccess: true, context: CONTEXT })) as { faqSectionsMovedAt?: unknown };
    return Boolean(state?.faqSectionsMovedAt);
  } catch {
    return false;
  }
}

/** The headings and order the FAQ page was printing: its published "FAQ list" block. */
async function pageSections(payload: Payload): Promise<{ key: Key; title: string }[]> {
  const found = await payload.find({
    collection: "pages",
    where: { slug: { equals: "faq" } },
    limit: 1,
    depth: 0,
    draft: false,
    overrideAccess: true,
    context: CONTEXT,
  });
  const blocks = ((found.docs[0] as { blocks?: unknown[] } | undefined)?.blocks ?? []) as { blockType?: string; groups?: { key?: string; title?: string }[] }[];
  const list = blocks.find((block) => block.blockType === "faqList");
  const sections: { key: Key; title: string }[] = [];
  for (const group of list?.groups ?? []) {
    const key = group.key as Key;
    if (!KEYS.includes(key) || sections.some((section) => section.key === key)) continue;
    sections.push({ key, title: group.title?.trim() || DEFAULT_TITLES[key] });
  }
  for (const key of KEYS) {
    if (!sections.some((section) => section.key === key)) sections.push({ key, title: DEFAULT_TITLES[key] });
  }
  return sections;
}

export async function moveFaqSections(payload: Payload, options: { dryRun?: boolean } = {}): Promise<FaqMoveResult> {
  const { dryRun = false } = options;
  const result: FaqMoveResult = { state: dryRun ? "dry-run" : "moved", created: [], existing: [] };
  if (await faqSectionsMoved(payload)) return { ...result, state: "already-moved" };

  const sections = await pageSections(payload);
  const { docs } = await payload.find({ collection: "faq-sections", where: { legacyKey: { exists: true } }, limit: 100, depth: 0, overrideAccess: true, context: CONTEXT });
  const made = new Set(docs.map((doc) => (doc as { legacyKey?: string | null }).legacyKey));

  for (const [index, section] of sections.entries()) {
    if (made.has(section.key)) {
      result.existing.push(section.title);
      continue;
    }
    result.created.push(section.title);
    if (dryRun) continue;
    await payload.create({
      collection: "faq-sections",
      data: { title: section.title, order: index, legacyKey: section.key },
      depth: 0,
      overrideAccess: true,
      context: CONTEXT,
    });
  }

  if (!dryRun) {
    await payload.updateGlobal({ slug: "system-state", data: { faqSectionsMovedAt: new Date().toISOString() } as never, depth: 0, overrideAccess: true, context: CONTEXT });
  }
  return result;
}

/** One line for a start log or a terminal. */
export function describeFaqMove(result: FaqMoveResult): string {
  if (result.state === "already-moved") return "the FAQ sections are already in the CMS.";
  const verb = result.state === "dry-run" ? "would create" : "created";
  const parts = [`${verb} ${result.created.length} FAQ section${result.created.length === 1 ? "" : "s"}${result.created.length ? ` (${result.created.join(", ")})` : ""}`];
  if (result.existing.length) parts.push(`${result.existing.join(", ")} already existed`);
  return `${parts.join("; ")}.`;
}
