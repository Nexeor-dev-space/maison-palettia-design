import { commitTransaction, createLocalReq, initTransaction, killTransaction, type Payload } from "payload";

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
 * ONLY WHERE A QUESTION NEEDS IT. An original section is made only while
 * there is no section for it yet AND some question (published, or the latest
 * draft) still names it as its old `group` with no section of its own. So it
 * runs in full the first time, does nothing on every start after that, and
 * repairs itself if a run ever failed — even if an editor has meanwhile made
 * sections of their own. A section an editor deletes is not brought back:
 * deleting is refused while any question would be left without one. The
 * sections it makes are made in one transaction, all or none.
 *
 * NO STAMP ON `system-state`. A new column there would make every read of
 * that global fail while a build runs against a database the migration has
 * not reached yet (Coolify builds before `start:prod` migrates), and the
 * experience pages read it to decide where their photographs come from.
 *
 * BEFORE IT RUNS, the site prints the sections the old way (from the block),
 * so a deploy looks the same whichever order things happen in.
 *
 * It runs first in cms/scripts/restore-media.ts (every `npm run start:prod`,
 * after migrations, before the media restore so a failure there cannot stop
 * it), at the end of the seed, and by hand with `npm run move:faq-sections`.
 */

type Key = (typeof FAQ_GROUPS)[number]["value"];

export interface FaqMoveResult {
  state: "already-moved" | "dry-run" | "moved";
  /** Sections made (or, in a dry run, that would be), in page order. */
  created: string[];
}

const CONTEXT = { ...SEED_CONTEXT };
const KEYS = FAQ_GROUPS.map((group) => group.value) as Key[];
const DEFAULT_TITLES = Object.fromEntries(FAQ_GROUPS.map((group) => [group.value, group.label])) as Record<Key, string>;

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

/** Does any question — published, or its latest draft — still name `key` as its old section, with no section of its own? */
async function hasQuestionsWaiting(payload: Payload, key: Key): Promise<boolean> {
  const live = await payload.count({
    collection: "faqs",
    where: { and: [{ section: { exists: false } }, { group: { equals: key } }] },
    overrideAccess: true,
    context: CONTEXT,
  });
  if (live.totalDocs > 0) return true;
  const drafts = await payload.countVersions({
    collection: "faqs",
    where: { and: [{ latest: { equals: true } }, { "version.section": { exists: false } }, { "version.group": { equals: key } }] },
    overrideAccess: true,
    context: CONTEXT,
  });
  return drafts.totalDocs > 0;
}

export async function moveFaqSections(payload: Payload, options: { dryRun?: boolean } = {}): Promise<FaqMoveResult> {
  const { dryRun = false } = options;
  const { docs } = await payload.find({
    collection: "faq-sections",
    where: { legacyKey: { exists: true } },
    limit: 10,
    depth: 0,
    overrideAccess: true,
    context: CONTEXT,
  });
  const made = new Set(docs.map((doc) => (doc as { legacyKey?: string | null }).legacyKey));

  const needed = new Set<Key>();
  for (const key of KEYS) {
    if (!made.has(key) && (await hasQuestionsWaiting(payload, key))) needed.add(key);
  }
  if (!needed.size) return { state: "already-moved", created: [] };

  // In the page's order; `order` is the place each had on the page.
  const sections = (await pageSections(payload)).map((section, order) => ({ ...section, order })).filter((section) => needed.has(section.key));
  const created = sections.map((section) => section.title);
  if (dryRun) return { state: "dry-run", created };

  const req = await createLocalReq({ context: CONTEXT }, payload);
  const started = await initTransaction(req);
  try {
    for (const section of sections) {
      await payload.create({
        collection: "faq-sections",
        data: { title: section.title, order: section.order, legacyKey: section.key },
        depth: 0,
        overrideAccess: true,
        req,
      });
    }
    if (started) await commitTransaction(req);
  } catch (err) {
    if (started) await killTransaction(req);
    throw err;
  }
  return { state: "moved", created };
}

/** One line for a start log or a terminal. */
export function describeFaqMove(result: FaqMoveResult): string {
  if (result.state === "already-moved") return "every FAQ question already has its section.";
  const verb = result.state === "dry-run" ? "would create" : "created";
  return `${verb} ${result.created.length} FAQ section${result.created.length === 1 ? "" : "s"}${result.created.length ? ` (${result.created.join(", ")})` : ""}.`;
}
