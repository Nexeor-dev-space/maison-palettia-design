import type { CollectionSlug, GlobalSlug, Payload } from "payload";

/**
 * ==========================================================================
 * Upserts that change nothing the second time (SPEC §F.1–F.8)
 * ==========================================================================
 *
 * Every writer in the seed goes through these three functions, so the
 * idempotency rule is written once:
 *
 *   · a document is found by its natural key (`slug`, `filename`, a global's
 *     slug), never by position or by id — ids differ between databases;
 *   · it is written only when what the seed would write differs from what is
 *     stored (`differs()` compares the seed's fields and ignores everything
 *     Payload adds: ids, timestamps, array row ids, populated relations);
 *   · every write carries the seed context, which the revalidation hooks,
 *     the settings audit and the system-only field guards all honour
 *     (cms/hooks/revalidate.ts, cms/globals/settingsHooks.ts) — a seed is not
 *     a human edit and must not purge a cache that does not exist yet.
 *
 * So a second `npm run seed` against the same database reads everything and
 * writes nothing, and the tally at the end says so ("unchanged").
 */

/** What every seed write carries. `seed` lets a hook tell the seed apart from other system writes. */
export const SEED_CONTEXT = {
  seed: true,
  system: true,
  skipRevalidate: true,
  disableRevalidate: true,
  skipAudit: true,
} as const;

export type Outcome = "created" | "updated" | "unchanged" | "skipped" | "failed";

/** Per-collection tallies, printed at the end of the run. */
export class Tally {
  private rows = new Map<string, Record<Outcome, number>>();

  add(key: string, outcome: Outcome): void {
    const row = this.rows.get(key) ?? { created: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0 };
    row[outcome] += 1;
    this.rows.set(key, row);
  }

  get(key: string): Record<Outcome, number> | undefined {
    return this.rows.get(key);
  }

  /** True when any write was refused. */
  get anyFailed(): boolean {
    return [...this.rows.values()].some((row) => row.failed > 0);
  }

  print(log: (line: string) => void): void {
    const width = Math.max(...[...this.rows.keys()].map((key) => key.length), 8);
    log(`${"".padEnd(width)}  created  updated  unchanged  skipped  failed`);
    for (const [key, row] of this.rows) {
      log(
        `${key.padEnd(width)}  ${String(row.created).padStart(7)}  ${String(row.updated).padStart(7)}  ${String(row.unchanged).padStart(9)}  ${String(row.skipped).padStart(7)}  ${String(row.failed).padStart(6)}`,
      );
    }
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Comparison                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** An upload or relationship comes back as an id at depth 0, or as a doc when populated. */
function idOf(value: unknown): unknown {
  if (value && typeof value === "object" && "id" in (value as Record<string, unknown>)) {
    return (value as Record<string, unknown>).id;
  }
  return value;
}

/**
 * True when `stored` does not already hold everything in `wanted`.
 * Only the keys the seed sets are compared; an absent or empty wanted value
 * matches an absent or empty stored one.
 */
export function differs(wanted: unknown, stored: unknown): boolean {
  if (wanted === undefined) return false;
  const emptyish = (v: unknown) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
  if (emptyish(wanted)) return !emptyish(stored);

  if (typeof wanted === "string" && typeof stored === "string" && ISO_DATE.test(wanted) && ISO_DATE.test(stored)) {
    return Date.parse(wanted) !== Date.parse(stored);
  }
  if (typeof wanted !== "object" || wanted === null) {
    return String(wanted) !== String(idOf(stored));
  }
  if (Array.isArray(wanted)) {
    if (!Array.isArray(stored) || stored.length !== wanted.length) return true;
    return wanted.some((item, i) => differs(item, stored[i]));
  }
  if (!stored || typeof stored !== "object") return true;
  return Object.entries(wanted as Record<string, unknown>).some(([key, value]) =>
    differs(value, (stored as Record<string, unknown>)[key]),
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Writers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export interface UpsertOptions {
  /** For collections with drafts: write as a draft instead of publishing. */
  draft?: boolean;
  /** `--missing-only`: create absent documents, never touch existing ones. */
  missingOnly?: boolean;
}

type Doc = Record<string, unknown> & { id: number | string };

/**
 * Finds `collection` by `key = value` (latest version, drafts included) and
 * creates or updates it so it holds `data`. Returns the document id.
 */
export async function upsertDoc(
  payload: Payload,
  tally: Tally,
  collection: CollectionSlug,
  key: string,
  data: Record<string, unknown>,
  options: UpsertOptions = {},
): Promise<number | string> {
  const versioned = Boolean(payload.collections[collection]?.config.versions);
  const value = data[key];
  const { docs } = await payload.find({
    collection,
    where: { [key]: { equals: value } },
    limit: 1,
    depth: 0,
    draft: versioned ? true : undefined,
    overrideAccess: true,
    pagination: false,
    context: { ...SEED_CONTEXT },
  });
  const existing = docs[0] as unknown as Doc | undefined;

  const status = versioned ? { _status: options.draft ? "draft" : "published" } : {};
  const wanted = { ...data, ...status };

  if (!existing) {
    const created = (await payload.create({
      collection,
      data: wanted as never,
      draft: versioned ? Boolean(options.draft) : undefined,
      depth: 0,
      overrideAccess: true,
      context: { ...SEED_CONTEXT },
    })) as unknown as Doc;
    tally.add(collection, "created");
    return created.id;
  }

  if (options.missingOnly || !differs(wanted, existing)) {
    tally.add(collection, options.missingOnly ? "skipped" : "unchanged");
    return existing.id;
  }

  await payload.update({
    collection,
    id: existing.id,
    data: wanted as never,
    draft: versioned ? Boolean(options.draft) : undefined,
    depth: 0,
    overrideAccess: true,
    context: { ...SEED_CONTEXT },
  });
  tally.add(collection, "updated");
  return existing.id;
}

/** Saves `data` into a global when it is not already there. */
export async function upsertGlobal(
  payload: Payload,
  tally: Tally,
  slug: GlobalSlug,
  data: Record<string, unknown>,
  options: Pick<UpsertOptions, "missingOnly"> = {},
): Promise<void> {
  const stored = (await payload.findGlobal({
    slug,
    depth: 0,
    overrideAccess: true,
    context: { ...SEED_CONTEXT },
  })) as unknown as Record<string, unknown>;

  const exists = stored && stored.id !== undefined && stored.id !== null;
  if (exists && (options.missingOnly || !differs(data, stored))) {
    tally.add(`global:${slug}`, options.missingOnly ? "skipped" : "unchanged");
    return;
  }

  await payload.updateGlobal({
    slug,
    data: data as never,
    depth: 0,
    overrideAccess: true,
    context: { ...SEED_CONTEXT },
  });
  tally.add(`global:${slug}`, exists ? "updated" : "created");
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Rich text                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Plain paragraphs → the Lexical document Payload's richText field stores.
 * The shape is the editor's own empty-document shape with one `paragraph`
 * per string and one plain `text` node in each, which is what the editor
 * itself writes when someone types a paragraph and presses Enter.
 */
export function lexicalParagraphs(paragraphs: string[]): Record<string, unknown> {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: paragraphs.map((text) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        textStyle: "",
        children: [{ type: "text", text, format: 0, style: "", mode: "normal", detail: 0, version: 1 }],
      })),
    },
  };
}

/** "Main menu > Main navigation: “Experiences” needs a short label…" from a Payload ValidationError, or its message. */
export function describeError(error: unknown): string {
  const data = (error as { data?: { errors?: Array<{ label?: string; path?: string; message?: string }> } })?.data;
  if (data?.errors?.length) return data.errors.map((e) => `${e.label ?? e.path}: ${e.message}`).join("; ");
  return error instanceof Error ? error.message : String(error);
}
