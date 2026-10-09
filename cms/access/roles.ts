import type { Access, FieldAccess, PayloadRequest } from "payload";

import type { Role } from "@/cms/lib/contracts";

/**
 * ==========================================================================
 * Access helpers — the three roles, spelled once (SPEC §D, §J)
 * ==========================================================================
 *
 * Every collection, global and field in the CMS decides who may do what with
 * one of these functions, never with an inline `req.user.role === …`. Two
 * reasons:
 *
 *   · The RBAC matrix in SPEC §J is written in terms of exactly these names
 *     (`isAdmin`, `isEditor`, `isStaff`, `publishedOrEditor`, `systemOnly`,
 *     `never`), so a reviewer can read a collection file against the matrix
 *     line by line.
 *   · REST and the Local API run the same functions, so there is no way for
 *     the admin UI and the public API to disagree about a rule.
 *
 * Collection-level helpers return `true`/`false` or a `where` clause (Payload
 * turns a clause into a row filter, which is how anonymous visitors get only
 * published documents). Field-level helpers (`…Field`) return booleans only,
 * because Payload's field access is all-or-nothing per field.
 *
 * ROLES. `admin` is Nexeor and the owner; `editor` is studio content staff;
 * `front-desk` works bookings and check-in. The first user ever created is
 * forced to `admin` by a hook on the users collection, so an empty install
 * can never lock itself out.
 */

/** The roles a staff account can hold, in the order the admin lists them. */
export const ROLES: readonly Role[] = ["admin", "editor", "front-desk"];

/**
 * The role on the request's user, or `undefined` for anonymous requests.
 *
 * Read through this rather than `req.user.role` directly: until
 * `payload-types.ts` has been generated the user type is untyped, and after
 * it has, the cast below still compiles — so the helpers never depend on the
 * generated file being present.
 */
export function roleOf(req: PayloadRequest | undefined): Role | undefined {
  const role = (req?.user as { role?: unknown } | null | undefined)?.role;
  return typeof role === "string" && (ROLES as readonly string[]).includes(role) ? (role as Role) : undefined;
}

const hasRole = (req: PayloadRequest | undefined, roles: readonly Role[]): boolean => {
  const role = roleOf(req);
  return role !== undefined && roles.includes(role);
};

// ─── collection / global level ───────────────────────────────────────────────

export const isAdmin: Access = ({ req }) => hasRole(req, ["admin"]);

/** Content staff: admins edit content too, so "editor" always includes them. */
export const isEditor: Access = ({ req }) => hasRole(req, ["admin", "editor"]);

/** Bookings staff: admins and the front desk. Editors never see commerce. */
export const isStaff: Access = ({ req }) => hasRole(req, ["admin", "front-desk"]);

/** Anyone signed in to the admin, whatever their role. */
export const isSignedIn: Access = ({ req }) => roleOf(req) !== undefined;

export const anyone: Access = () => true;

/** For operations nothing and nobody may perform (append-only logs, SQL-owned counters). */
export const never: Access = () => false;

/**
 * Drafts are visible to content staff; everyone else gets a row filter on
 * `_status`, which Payload applies to REST and Local API reads alike. Used as
 * the `read` rule of every collection with drafts (SPEC §D.2).
 */
export const publishedOrEditor: Access = ({ req }) =>
  hasRole(req, ["admin", "editor"]) ? true : { _status: { equals: "published" } };

/**
 * Only server code may do this — a Local API call that sets
 * `context: { system: true }`. No role, not even admin, passes through REST.
 * Used for rows that are the output of a process rather than of a person:
 * orders, inventory, audit entries.
 */
export const systemOnly: Access = ({ req }) => req.context?.system === true;

/**
 * The signed-in user acting on their own document (profile edits). Returns
 * a row filter so it composes with list queries.
 */
export const self: Access = ({ req }) => (req.user ? { id: { equals: req.user.id } } : false);

// ─── field level ─────────────────────────────────────────────────────────────

export const isAdminField: FieldAccess = ({ req }) => hasRole(req, ["admin"]);
export const isEditorField: FieldAccess = ({ req }) => hasRole(req, ["admin", "editor"]);
export const isStaffField: FieldAccess = ({ req }) => hasRole(req, ["admin", "front-desk"]);

/** A field nobody may write (system-stamped dates, counters). */
export const neverField: FieldAccess = () => false;
