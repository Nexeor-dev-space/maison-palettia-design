/**
 * `system-state` — hidden (SPEC §C.3 last row). Not a settings page.
 *
 * A handful of stamps the server writes about itself. No human edits it:
 * `admin.hidden: true` keeps it out of the sidebar and routes, and
 * `access.read/update: systemOnly` means only server code that sets
 * `context.system` (or `overrideAccess`) can touch it — REST cannot.
 *
 * `canary` is the sealed string "ok", minted once by `onInit` (§F.0) with the
 * same `encryptedText` machinery every real secret uses. On every boot
 * `onInit` opens it; if `PAYLOAD_SECRET` was rotated without running the
 * reseal script the open fails, an in-memory flag is set, and the admin
 * shows the red "server secret changed" banner (§C.1) — so the owner learns
 * about the problem from a banner, not from a Mamo call that silently uses
 * garbage for an API key.
 *
 * `publicUrlConfirmedAt` is stamped by the first human save of Site details
 * and read by `isPlaceholderPublicUrl()`; the other stamps belong to the
 * seed and the daily jobs (§H.9).
 */

import type { GlobalConfig } from "payload";

import { systemOnly } from "@/cms/access/roles";
import { encryptedText } from "@/cms/fields/encryptedText";

import { copy, matches } from "./copyFields";

export const SYSTEM_STATE_SLUG = "system-state" as const;

export const SystemState: GlobalConfig = {
  slug: SYSTEM_STATE_SLUG,
  label: "System state",
  admin: { hidden: true, group: false },
  access: { read: systemOnly, update: systemOnly },
  fields: [
    ...encryptedText("canary", {
      label: "Secret canary",
      description: "Sealed “ok”, opened on every boot to prove PAYLOAD_SECRET still matches the stored secrets.",
    }),
    { name: "installedAt", type: "date", label: "Installed at" },
    copy("seedVersion", "Seed version", {
      description: "The version of cms/seed last applied; the seed uses it to decide what to upgrade.",
      max: 40,
    }),
    { name: "publicUrlConfirmedAt", type: "date", label: "Site address confirmed at" },
    copy("lastDigestDay", "Last daily digest (Dubai day)", {
      max: 10,
      validate: matches(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
    }),
    { name: "lastInventoryReconcileAt", type: "date", label: "Last inventory reconcile" },
  ],
};
