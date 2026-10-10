import type { CollectionSlug, Condition, DateField, Field, FieldHook, PayloadRequest, TextField } from "payload";

import { isAdminField } from "@/cms/access/roles";
import { isSealed, MASK, seal, tryOpen } from "@/cms/lib/crypto";
import { getByPath } from "@/cms/lib/mediaReferences";

/**
 * ==========================================================================
 * encryptedText() — a secret the admin can set, replace or clear, never read
 * ==========================================================================
 *
 * Returns TWO fields: the secret itself and `${name}SetAt`, the date it was
 * last entered. The stored value and the displayed value are kept strictly
 * apart (SPEC §C.2):
 *
 *   · in the database: `enc:v1:…` ciphertext (cms/lib/crypto.ts);
 *   · in every read — REST, Local API, the admin form — the mask `••••••••`,
 *     unless the caller is server code that set `context.internalRead` (or
 *     `revealSecrets`), which is how the Mamo client and the mailer get the
 *     clear text;
 *   · in the admin: the `SecretField` component shows the mask and "set on
 *     <date>" from the sibling field, with Replace / Clear / Verify.
 *
 * THE FOUR beforeChange BRANCHES, in order:
 *
 *   1. `null`             → Clear. Stored value and the date are both nulled.
 *   2. "" | MASK | absent → Untouched. Re-read the CIPHERTEXT from the
 *                           database adapter and store it back unchanged.
 *   3. `enc:v1:…`         → Already sealed (reseal script, import). Keep.
 *   4. anything else      → A new entry. Seal it and stamp the date.
 *
 * WHY BRANCH 2 READS THE DATABASE INSTEAD OF `previousValue`. Payload's
 * global update (globals/operations/update.js:117, verified in 3.90.2) runs
 * `afterRead` on the stored document with the request's own context BEFORE
 * field `beforeChange` hooks, and `previousValue` is taken from that output.
 * With `internalRead` unset — every admin save — `previousValue` is therefore
 * the MASK, and a naive "keep previousValue" would overwrite the Mamo key
 * with eight bullets the next time an admin toggled an unrelated checkbox
 * on the same global. `payload.db.findGlobal` / `payload.db.findOne` return
 * the row as stored, hooks untouched. Branch 2 also covers a value that was
 * omitted from the request or stripped by field access: Payload back-fills
 * those from the (masked) original before this hook runs, so they arrive as
 * MASK and take the same path.
 *
 * The `…SetAt` stamp is written into `siblingData` from THIS hook rather
 * than by a hook on the date field, because sibling fields are processed
 * concurrently (`Promise.all` in fields/hooks/beforeChange/traverseFields.js)
 * and the date field cannot know whether the secret changed. A hook-less
 * date field never reassigns its own slot, so the stamp survives the pass.
 *
 * Settings globals have no drafts; `db.findGlobal` reads the live row. If an
 * encryptedText field is ever placed on a versioned global, branch 2 must
 * read the draft version instead.
 */

export type EncryptedTextOptions = {
  label?: string;
  description?: string;
  /** Which "Verify" action the field offers (SPEC §C.3). Omit for none. */
  verify?: "mamo" | "smtp" | "resend";
  required?: boolean;
  condition?: Condition;
  readOnly?: boolean;
  /** Hide from the form entirely (e.g. the previous webhook secret kept for the grace window). */
  hidden?: boolean;
};

async function readStoredRaw(
  req: PayloadRequest,
  args: {
    global: { slug: string } | null;
    collection: { slug: string } | null;
    originalDoc: unknown;
    path: (number | string)[];
  },
): Promise<string | null> {
  const { payload } = req;
  let raw: unknown;
  if (args.global) {
    raw = await payload.db.findGlobal({ slug: args.global.slug, req });
  } else if (args.collection) {
    const id = (args.originalDoc as { id?: number | string } | undefined)?.id;
    if (id === undefined || id === null) return null; // create: nothing stored yet
    raw = await payload.db.findOne({ collection: args.collection.slug as CollectionSlug, where: { id: { equals: id } }, req });
  }
  const stored = getByPath(raw, args.path);
  return isSealed(stored) ? stored : null;
}

export function encryptedText(name: string, opts: EncryptedTextOptions = {}): Field[] {
  const setAtName = `${name}SetAt`;
  const label = opts.label ?? name;

  const beforeChange: FieldHook = async ({ value, req, path, global, collection, originalDoc, siblingData }) => {
    const stamp = (iso: string | null) => {
      if (siblingData) siblingData[setAtName] = iso;
    };

    if (value === null) {
      stamp(null);
      return null;
    }
    if (value === undefined || value === "" || value === MASK) {
      return readStoredRaw(req, { global, collection, originalDoc, path });
    }
    if (isSealed(value)) return value;

    stamp(new Date().toISOString());
    return seal(String(value));
  };

  const afterRead: FieldHook = ({ value, req }) => {
    if (!value) return null;
    const reveal = req?.context?.revealSecrets === true || req?.context?.internalRead === true;
    if (!reveal) return MASK;
    // A value that is not ours is never returned in clear: either it was
    // written around the hooks (a bug) or the secret changed (tryOpen
    // records that for the dashboard banner). Both read as "not set".
    return isSealed(value) ? tryOpen(value) : null;
  };

  const secret: TextField = {
    name,
    type: "text",
    label,
    required: opts.required,
    access: { read: isAdminField, create: isAdminField, update: isAdminField },
    hooks: { beforeChange: [beforeChange], afterRead: [afterRead] },
    // The reseal script finds every encrypted field by this marker (cms/scripts/reseal.ts).
    custom: { encrypted: true },
    admin: {
      description: opts.description,
      condition: opts.condition,
      readOnly: opts.readOnly,
      hidden: opts.hidden,
      components: {
        Field: {
          path: "@/cms/components/SecretField#SecretField",
          clientProps: { verify: opts.verify ?? null, setAtPath: setAtName },
        },
      },
    },
  };

  const setAt: DateField = {
    name: setAtName,
    type: "date",
    label: `${label} — set on`,
    access: { read: isAdminField },
    // Hidden, not disabled: the field must stay in the form state so the
    // stamp written by the hook above round-trips and SecretField can show it.
    admin: { hidden: true, readOnly: true },
  };

  return [secret, setAt];
}
