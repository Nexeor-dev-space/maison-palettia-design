import type { DateField, Field, FieldAccess, JSONField, SelectField } from "payload";

import { neverField, roleOf } from "@/cms/access/roles";
import type { Mode, Role } from "@/cms/lib/contracts";

/**
 * ==========================================================================
 * What every Bookings collection shares (SPEC §D.3, §J)
 * ==========================================================================
 *
 * The thirteen commerce collections are the OUTPUT of a process — a
 * checkout, a webhook, a refund job — rather than of a person typing, and
 * the same few shapes recur in all of them:
 *
 *   · `BOOKINGS_GROUP` — the admin sidebar group, hidden from editors
 *     (`sidebarFor`): editors never see commerce (§J), and a collection the
 *     front desk may read but never needs to browse (payment events, seat
 *     holds, counters) is shown to admins only.
 *   · `systemDate` / `systemJson` / `systemField` — values the server stamps
 *     and staff read. `access.create/update: neverField` means no role may
 *     type them through REST or the admin form; server code writes them
 *     through the Local API, which overrides field access by default.
 *   · `modeField` — which gateway minted the row (`test | live | mock`),
 *     spelled once so `orders`, `payments` and `payment-events` share the
 *     enum and the generated type (`Mode` in cms/lib/contracts.ts).
 *   · `lockExcept` — the §J "U:f" rule ("update only these fields") applied
 *     to a whole field list in one readable place, instead of an `access`
 *     block on forty fields.
 *
 * Hooks (minting references, `transition()`, immutability, notifications)
 * are NOT here: 3A-1 adds them on top of these definitions (SPEC §L).
 */

export const BOOKINGS_GROUP = "Bookings";

/** Staff who work bookings: the §J "front-desk" column plus admins. */
export const STAFF_ROLES: readonly Role[] = ["admin", "front-desk"];

/**
 * `admin.hidden` that shows the collection in the sidebar only to the
 * given roles. Hidden is a navigation courtesy, not access control — the
 * `access` block on each collection is what REST and the Local API enforce.
 */
export const sidebarFor =
  (...roles: Role[]) =>
  ({ user }: { user: unknown }): boolean => {
    const role = roleOf({ user } as never);
    return role === undefined || !roles.includes(role);
  };

/** One option per `Mode`; the labels match Settings → Payments. */
export const MODE_OPTIONS = [
  { label: "Test (Mamo sandbox)", value: "test" },
  { label: "Live", value: "live" },
  { label: "Mock (built-in fake gateway)", value: "mock" },
] as const satisfies ReadonlyArray<{ label: string; value: Mode }>;

/** `mode` — which gateway minted this row. Stamped by the checkout, never edited. */
export const modeField = (description = "Which gateway this went through. A sandbox row can never touch a live order, or the reverse."): SelectField => ({
  name: "mode",
  type: "select",
  label: "Gateway mode",
  required: true,
  hasMany: false,
  options: [...MODE_OPTIONS],
  index: true,
  access: { create: neverField, update: neverField },
  admin: { readOnly: true, description, position: "sidebar" },
});

/** A date the system stamps; staff read it, nobody types it. */
export const systemDate = (
  name: string,
  label: string,
  opts: { description?: string; index?: boolean; sidebar?: boolean; read?: FieldAccess } = {},
): DateField => ({
  name,
  type: "date",
  label,
  index: opts.index,
  access: { read: opts.read, create: neverField, update: neverField },
  admin: {
    readOnly: true,
    description: opts.description,
    position: opts.sidebar ? "sidebar" : undefined,
    date: { displayFormat: "d MMM yyyy, HH:mm" },
  },
});

/** A JSON blob the system writes (snapshots, raw provider objects). `read` may be narrowed by the caller (🔐 fields). */
export const systemJson = (name: string, label: string, opts: { description?: string; read?: FieldAccess } = {}): JSONField => ({
  name,
  type: "json",
  label,
  access: { read: opts.read, create: neverField, update: neverField },
  admin: { readOnly: true, description: opts.description },
});

/** Any other field the system owns: adds `readOnly` and refuses human writes, keeps everything else. */
export function systemField<F extends Field & { name: string }>(field: F): F {
  const admin = (field as { admin?: Record<string, unknown> }).admin ?? {};
  return {
    ...field,
    access: { ...(field as { access?: object }).access, create: neverField, update: neverField },
    admin: { ...admin, readOnly: true },
  } as F;
}

/**
 * The §J "U:f" rule as a transform. Every named data field in `fields`
 * (recursing into groups, arrays, rows, collapsibles and tabs) gets
 * `access.update` set from `editable` by its dotted path — `"contact.email"`
 * — or `neverField` when the path is not listed. Fields that already carry
 * an `update` rule (system stamps) keep it; `join` and `ui` fields store
 * nothing and are left alone. `read` rules are untouched.
 *
 * Why a transform rather than forty `access` blocks: the readable thing
 * about "front desk may change the email, the phone and the internal notes
 * and nothing else" is the list of three, and this keeps it a list.
 */
export function lockExcept(fields: Field[], editable: Record<string, FieldAccess>, prefix = ""): Field[] {
  return fields.map((field) => {
    switch (field.type) {
      case "join":
      case "ui":
        return field;
      case "row":
      case "collapsible":
        return { ...field, fields: lockExcept(field.fields, editable, prefix) };
      case "tabs":
        return {
          ...field,
          tabs: field.tabs.map((tab) =>
            "name" in tab && tab.name
              ? { ...tab, fields: lockExcept(tab.fields, editable, `${prefix}${tab.name}.`) }
              : { ...tab, fields: lockExcept(tab.fields, editable, prefix) },
          ),
        };
      case "group": {
        if (!("name" in field) || !field.name) return { ...field, fields: lockExcept(field.fields, editable, prefix) };
        const path = `${prefix}${field.name}`;
        // A group listed whole ("contact.*" spelled as "contact") opens every field in it.
        const open = editable[path];
        return { ...field, fields: lockExcept(field.fields, open ? openAll(field.fields, open) : editable, `${path}.`) };
      }
      case "array":
        return {
          ...field,
          access: { ...field.access, update: field.access?.update ?? editable[`${prefix}${field.name}`] ?? neverField },
          fields: lockExcept(field.fields, editable, `${prefix}${field.name}.`),
        };
      default: {
        const path = `${prefix}${field.name}`;
        const update = field.access?.update ?? editable[path] ?? neverField;
        return { ...field, access: { ...field.access, update } };
      }
    }
  });
}

/** Expand a group-level grant to every field path inside it (used by `lockExcept`). */
function openAll(fields: Field[], rule: FieldAccess, prefix = ""): Record<string, FieldAccess> {
  const out: Record<string, FieldAccess> = {};
  for (const field of fields) {
    if ("name" in field && field.name) {
      out[`${prefix}${field.name}`] = rule;
      if (field.type === "group" || field.type === "array") Object.assign(out, openAll(field.fields, rule, `${prefix}${field.name}.`));
    } else if ("fields" in field) {
      Object.assign(out, openAll(field.fields, rule, prefix));
    }
  }
  return out;
}
