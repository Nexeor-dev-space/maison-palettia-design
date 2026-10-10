import type { CollectionConfig } from "payload";

import { isAdmin, never, roleOf, systemOnly } from "@/cms/access/roles";

/**
 * ==========================================================================
 * settings-audit — who changed which switch, when (SPEC §D.1, §C.3)
 * ==========================================================================
 *
 * An append-only log of the settings that change the site's behaviour
 * rather than its wording: the public URL, bookings open/closed, the
 * payments mode, the email provider, the jobs switch, AI imagery allowed…
 * (the fields marked 📝 in SPEC §C.3). When bookings were "mysteriously"
 * closed on a Saturday, this is where the answer is.
 *
 * Append-only is enforced three ways: `create` is `systemOnly` (only a
 * global's afterChange hook, writing with `overrideAccess`, may add a row),
 * `update` and `delete` are `never` for everyone including admins, and the
 * admin UI hides the collection from non-admins. Secrets are never logged:
 * encrypted fields are recorded as `[set]` / `[cleared]`, never as values.
 *
 * The one writer is `settingsAfterChange` in cms/globals/settingsHooks.ts,
 * which diffs each global's watched fields and creates the rows on the
 * saving request's own transaction (so a change that cannot be logged is
 * not saved). It passes `req` and no `context` on purpose: with `req`
 * present, Payload replaces the parent request's context rather than
 * copying it (utilities/createLocalReq.js), so a `system: true` set for the
 * nested create would leak onto the user's save. An earlier helper here did
 * exactly that and was removed rather than kept as a second, unused path.
 */

export const SettingsAudit: CollectionConfig = {
  slug: "settings-audit",
  labels: { singular: "Settings change", plural: "Settings changes" },
  admin: {
    // With the admin-only settings it audits (4B review); also what makes the
    // "Settings (admin)" group come before "System" in the sidebar (navOrder.ts).
    group: "Settings (admin)",
    useAsTitle: "field",
    defaultColumns: ["at", "global", "field", "from", "to", "user"],
    description: "Every change to a behaviour-changing setting, with who made it. Read-only.",
    hidden: ({ user }) => roleOf({ user } as never) !== "admin",
    listSearchableFields: ["global", "field", "to"],
  },
  defaultSort: "-at",
  access: {
    read: isAdmin,
    create: systemOnly,
    update: never,
    delete: never,
  },
  fields: [
    { name: "global", type: "text", label: "Settings page", required: true, index: true },
    { name: "field", type: "text", label: "Field", required: true },
    { name: "from", type: "text", label: "Was" },
    { name: "to", type: "text", label: "Now" },
    { name: "user", type: "relationship", relationTo: "users", label: "Changed by" },
    { name: "at", type: "date", label: "When", required: true, index: true, admin: { date: { displayFormat: "d MMM yyyy, HH:mm" } } },
    { name: "ipHash", type: "text", label: "IP (hashed)", admin: { readOnly: true } },
  ],
};
