import config from "@payload-config";
import { getPayload, type Field, type Payload } from "payload";

import { isSealed, open, seal, secretsKey } from "@/cms/lib/crypto";

import { readHidden } from "./prompt";

/**
 * ==========================================================================
 * reseal — re-encrypt every stored secret after PAYLOAD_SECRET is rotated
 * ==========================================================================
 *
 *   OLD_PAYLOAD_SECRET=<old> npx payload run cms/scripts/reseal.ts [--dry-run]
 *
 * Run BEFORE the process restarts with the new secret, with the NEW secret
 * already in `.env` (`payload run` loads it): every `encryptedText` value is
 * opened with the old key and sealed with the new one, in place, through
 * the database adapter so no hook masks or re-seals along the way
 * (SPEC §C.1). Skipping this step leaves every key unreadable — the boot
 * canary then shows the red banner and admins have to re-enter them.
 *
 * THE OLD SECRET IS NEVER AN ARGUMENT. Command lines end up in shell history
 * and in `ps` output on a shared host; the script reads the old value from
 * `OLD_PAYLOAD_SECRET` or from a hidden prompt, and refuses to run if
 * anything that looks like a value is passed positionally.
 *
 * Fields are found by the `custom.encrypted` marker that encryptedText()
 * sets, walking groups, tabs, rows, collapsibles, arrays and blocks, so a
 * secret added by a later phase is covered without touching this file.
 */

type Keys = { previous: Buffer; next: Buffer };
type Stats = { globals: number; docs: number; resealed: number; unreadable: number };

function resealFields(fields: Field[], data: Record<string, unknown> | undefined, keys: Keys, stats: Stats): boolean {
  if (!data) return false;
  let changed = false;
  for (const field of fields) {
    switch (field.type) {
      case "text": {
        if (!field.custom?.encrypted) break;
        const value = data[field.name];
        if (!isSealed(value)) break;
        try {
          data[field.name] = seal(open(value, keys.previous), keys.next);
          stats.resealed += 1;
          changed = true;
        } catch {
          // Already sealed under the NEW key (a re-run) or under neither: leave it and report.
          try {
            open(value, keys.next);
          } catch {
            stats.unreadable += 1;
          }
        }
        break;
      }
      case "group":
        if ("name" in field && field.name) {
          changed = resealFields(field.fields, data[field.name] as Record<string, unknown> | undefined, keys, stats) || changed;
        } else {
          changed = resealFields(field.fields, data, keys, stats) || changed;
        }
        break;
      case "array":
        for (const row of (data[field.name] as Record<string, unknown>[] | undefined) ?? []) {
          changed = resealFields(field.fields, row, keys, stats) || changed;
        }
        break;
      case "blocks":
        for (const row of (data[field.name] as Array<Record<string, unknown> & { blockType?: string }> | undefined) ?? []) {
          const block = field.blocks.find((candidate) => candidate.slug === row.blockType);
          if (block) changed = resealFields(block.fields, row, keys, stats) || changed;
        }
        break;
      case "tabs":
        for (const tab of field.tabs) {
          if ("name" in tab && tab.name) {
            changed = resealFields(tab.fields, data[tab.name] as Record<string, unknown> | undefined, keys, stats) || changed;
          } else {
            changed = resealFields(tab.fields, data, keys, stats) || changed;
          }
        }
        break;
      case "row":
      case "collapsible":
        changed = resealFields(field.fields, data, keys, stats) || changed;
        break;
      default:
        break;
    }
  }
  return changed;
}

function hasEncrypted(fields: Field[]): boolean {
  return fields.some((field) => {
    if (field.type === "text") return Boolean(field.custom?.encrypted);
    if (field.type === "tabs") return field.tabs.some((tab) => hasEncrypted(tab.fields));
    if (field.type === "blocks") return field.blocks.some((block) => hasEncrypted(block.fields));
    return "fields" in field ? hasEncrypted(field.fields) : false;
  });
}

async function resealGlobals(payload: Payload, keys: Keys, stats: Stats, dryRun: boolean) {
  for (const global of payload.globals.config) {
    if (!hasEncrypted(global.fields)) continue;
    const raw = (await payload.db.findGlobal({ slug: global.slug })) as Record<string, unknown>;
    if (!raw || raw.id === undefined) continue;
    const data = structuredClone(raw);
    if (resealFields(global.fields, data, keys, stats)) {
      stats.globals += 1;
      if (!dryRun) await payload.db.updateGlobal({ slug: global.slug, data });
    }
  }
}

async function resealCollections(payload: Payload, keys: Keys, stats: Stats, dryRun: boolean) {
  for (const collection of payload.config.collections) {
    if (!hasEncrypted(collection.fields)) continue;
    let page = 1;
    for (;;) {
      const result = await payload.db.find({ collection: collection.slug, limit: 100, page, pagination: true });
      for (const doc of result.docs as Array<Record<string, unknown> & { id: number | string }>) {
        const data = structuredClone(doc);
        if (resealFields(collection.fields, data, keys, stats)) {
          stats.docs += 1;
          if (!dryRun) await payload.db.updateOne({ collection: collection.slug, id: doc.id, data });
        }
      }
      if (!result.hasNextPage) break;
      page += 1;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const positional = args.filter((arg) => !arg.startsWith("--"));
  if (positional.length > 0) {
    console.error("reseal: the old secret is read from OLD_PAYLOAD_SECRET or an interactive prompt — never from the command line.");
    process.exit(2);
  }
  if (!process.env.PAYLOAD_SECRET) {
    console.error("reseal: PAYLOAD_SECRET (the NEW secret) must be set in .env before running.");
    process.exit(2);
  }

  const previousSecret = process.env.OLD_PAYLOAD_SECRET || (await readHidden("Old PAYLOAD_SECRET (input hidden): "));
  if (!previousSecret) {
    console.error("reseal: no old secret given.");
    process.exit(2);
  }
  if (previousSecret === process.env.PAYLOAD_SECRET) {
    console.error("reseal: the old and new secrets are identical — nothing to do.");
    process.exit(2);
  }

  const keys: Keys = { previous: secretsKey(previousSecret), next: secretsKey() };
  const stats: Stats = { globals: 0, docs: 0, resealed: 0, unreadable: 0 };

  const payload = await getPayload({ config });
  await resealGlobals(payload, keys, stats, dryRun);
  await resealCollections(payload, keys, stats, dryRun);

  console.log(
    `${dryRun ? "[dry run] " : ""}reseal: ${stats.resealed} value(s) re-sealed across ${stats.globals} global(s) and ${stats.docs} document(s); ${stats.unreadable} unreadable under either secret.`,
  );
  if (!dryRun && stats.resealed > 0) console.log("Restart the server now so the boot canary re-opens under the new secret.");
  process.exit(stats.unreadable > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("reseal failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
