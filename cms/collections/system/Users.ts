import { APIError, type CollectionConfig } from "payload";

import { isAdmin, isAdminField, roleOf, ROLES } from "@/cms/access/roles";
import { publicUrl } from "@/cms/lib/publicUrl";

/**
 * ==========================================================================
 * users — staff accounts: admin, editor, front-desk (SPEC §D.1, §J)
 * ==========================================================================
 *
 * AUTH. Email + password with Payload's local strategy. Five failed attempts
 * lock the account for ten minutes (per account; the per-IP limit on
 * `/api/users/login` is the reverse proxy's job, SPEC §A.5). Sessions last
 * eight hours. The cookie is `Secure` in production and `SameSite=Lax`, and
 * `csrf` in payload.config.ts restricts which Origins may present it.
 *
 * ROLES. `role` is a select only an admin may change; the first account ever
 * created is forced to `admin` by the beforeChange hook so a fresh install
 * cannot lock itself out, and `active: false` refuses sign-in without
 * deleting history (`beforeLogin`), signs the person out of every session
 * they already have (`beforeChange` empties `sessions`), and leaves them
 * with no role in `roleOf()` so any token that survives is refused anyway.
 *
 * WHO SEES WHOM. Admins see everyone. Editors and the front desk see ACTIVE
 * colleagues' names and roles — the enquiries "assigned to" picker needs the
 * list — but a colleague's email only when it is their own.
 *
 * PASSWORDS NEVER TRAVEL. Staff are invited (Phase 4B's "Invite staff"
 * button → `POST /api/actions/users/invite`) and set their own password from
 * the emailed link; the same forgot-password machinery is configured here.
 * Payload's default link builder uses the request origin, which is "" when
 * `serverURL` is unset and the Host is not in `csrf` (verified in
 * auth/operations/forgotPassword.js), so the link is built from
 * `site-settings.publicUrl` instead. The email body is a plain branded
 * fallback until Phase 3C's `renderTemplateHtml("staff_login_link", …)`
 * replaces the function body. If the owner forgets their password with no
 * email transport configured: `npx payload run cms/scripts/reset-password.ts`.
 */

const isProd = process.env.NODE_ENV === "production";

const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
  admin: "Admin — everything, including settings and payments",
  editor: "Editor — pages, events, media, wording",
  "front-desk": "Front desk — bookings, tickets, check-in",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/** Minimal, inline-styled, no images: readable in every client. Phase 3C swaps in the template system. */
function staffLoginLinkHtml(args: { name?: string; link: string; expiresIn: string }): string {
  const greeting = args.name ? `Hello ${escapeHtml(args.name)},` : "Hello,";
  return `<!doctype html><html><body style="margin:0;padding:32px;background:#fdfbf8;font-family:Helvetica,Arial,sans-serif;color:#2b2b2b">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
<p style="margin:0 0 16px;font-size:16px">${greeting}</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5">Use the button below to set your password for the Maison Palettia admin. The link works once and expires in ${escapeHtml(args.expiresIn)}.</p>
<p style="margin:0 0 24px"><a href="${escapeHtml(args.link)}" style="display:inline-block;background:#7a5ba6;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">Set my password</a></p>
<p style="margin:0;font-size:13px;color:#6b6b6b;line-height:1.5">If the button does not work, copy this address into your browser:<br>${escapeHtml(args.link)}</p>
<p style="margin:24px 0 0;font-size:13px;color:#6b6b6b">If you did not expect this email, you can ignore it — nothing changes until the link is used.</p>
</div></body></html>`;
}

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Staff member", plural: "Staff" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "role", "active", "lastLoginAt"],
    // Under Settings (4B review): "who can sign in" is a setting to the owner,
    // and the System group is kept for the internal tables.
    group: "Settings",
    description: "Who can sign in to this admin, and what they may do. Invite colleagues rather than sharing passwords.",
    hidden: ({ user }) => roleOf({ user } as never) !== "admin",
    listSearchableFields: ["name", "email"],
    components: {
      // 4B (SPEC §I "Users"): Invite staff above the list, Send login link on a person.
      beforeListTable: ["@/cms/components/users/InviteStaff#InviteStaff"],
      edit: { beforeDocumentControls: ["@/cms/components/users/SendLoginLink#SendLoginLink"] },
    },
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 8 * 3600,
    verify: false,
    cookies: { secure: isProd, sameSite: "Lax" },
    forgotPassword: {
      expiration: 60 * 60 * 1000,
      generateEmailSubject: () => "Your Maison Palettia admin login link",
      generateEmailHTML: async (args) => {
        const base = await publicUrl(args?.req);
        const user = (args?.user ?? {}) as { name?: string };
        return staffLoginLinkHtml({ name: user.name, link: `${base}/admin/reset/${args?.token ?? ""}`, expiresIn: "1 hour" });
      },
    },
  },
  access: {
    // Who may open /admin at all. Payload's default is "any signed-in user";
    // a deactivated account (whose token somehow outlived its sessions) has
    // no role in roleOf() and is turned away from the panel too.
    admin: ({ req }) => roleOf(req) !== undefined,
    // The first account is created through /admin's create-first-user screen
    // with no user on the request; after that, only admins add staff.
    create: async ({ req }) => {
      if (roleOf(req) === "admin") return true;
      const { totalDocs } = await req.payload.count({ collection: "users", overrideAccess: true });
      return totalDocs === 0;
    },
    read: ({ req }) => {
      if (roleOf(req) === "admin") return true;
      return req.user && roleOf(req) !== undefined ? { active: { equals: true } } : false;
    },
    // Everyone may edit their own account (name, password — SPEC §J "U self");
    // `role` and `active` stay admin-only at field level, so a self-edit can
    // never escalate. Admins edit anyone.
    update: ({ req }) => {
      if (roleOf(req) === "admin") return true;
      return req.user && roleOf(req) !== undefined ? { id: { equals: req.user.id } } : false;
    },
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === "create") {
          const { totalDocs } = await req.payload.count({ collection: "users", overrideAccess: true, req });
          if (totalDocs === 0) data.role = "admin";
        }
        // OFFBOARDING SIGNS THEM OUT EVERYWHERE. Unticking "Can sign in" must
        // end the sessions this person already has, not only refuse the next
        // login: Payload's JWT strategy accepts a token for as long as its
        // session id is still in `users.sessions`, and a token refresh extends
        // that session without running `beforeLogin`. Emptying the array here
        // (the field's own `update: false` access rule is applied before
        // collection hooks, so this server-side write is kept) makes every
        // existing token fail on its next request. Saving an already-blocked
        // account again is harmless: it has no sessions to clear.
        //
        // An admin changing SOMEONE ELSE'S password needs nothing here:
        // Payload's update operation already resets `sessions` whenever a
        // password is saved, keeping only the current session when people
        // change their own (collections/operations/utilities/update.js).
        if (operation === "update" && data.active === false) {
          (data as { sessions?: unknown[] }).sessions = [];
        }
        return data;
      },
    ],
    beforeLogin: [
      ({ user }) => {
        if ((user as { active?: unknown }).active === false) {
          throw new APIError("This account has been deactivated. Ask an admin to reactivate it.", 403, undefined, true);
        }
      },
    ],
    afterLogin: [
      async ({ user, req }) => {
        // Never let a bookkeeping write fail a login. `req` is passed so the
        // update joins the login's own transaction: the login operation is
        // still holding the user row (it has just written the session) when
        // this hook runs, and a second transaction on the same row would wait
        // for the first — which is waiting for this hook. Verified deadlock.
        //
        // No `context` here, deliberately. With `req` present Payload does not
        // copy the context for the nested call — it REPLACES `req.context`
        // (utilities/createLocalReq.js, `req.context = getRequestContext(req,
        // context)`), so a `system: true` passed here would stay on the
        // login request for its remaining hooks and mark a user-triggered
        // operation as a system one. `overrideAccess: true` is all the write
        // needs; a `users` change has no revalidation to skip.
        try {
          await req.payload.update({
            collection: "users",
            id: user.id,
            data: { lastLoginAt: new Date().toISOString() },
            depth: 0,
            overrideAccess: true,
            req,
          });
        } catch (error) {
          req.payload.logger.warn({ err: error }, "users: could not stamp lastLoginAt");
        }
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Name",
      required: true,
      maxLength: 80,
      admin: { description: "As colleagues see it — in the enquiries 'assigned to' list, in the audit log." },
    },
    {
      // Payload adds this field for auth collections; declaring it merges
      // our access rule into the base definition (fields/mergeBaseFields.js).
      name: "email",
      type: "email",
      required: true,
      unique: true,
      access: {
        read: ({ req, doc, id }) => {
          if (roleOf(req) === "admin") return true;
          const own = (doc as { id?: unknown } | undefined)?.id ?? id;
          // A create form has no document yet, so there is no stored address to
          // protect. Payload also evaluates this rule while building form state
          // (ui/forms/fieldSchemasToFormState/addFieldStatePromise.js) and the
          // create-first-user form is built with no user: a refusal there drops
          // the field from server state, and the client then renders a second,
          // default "Email" input under the auth one instead of honouring
          // `Field: false`. Anonymous readers never reach a users document
          // anyway — the collection-level rule stops them first.
          if (own === undefined) return true;
          return Boolean(req.user) && String(own) === String(req.user?.id);
        },
      },
    },
    {
      name: "role",
      type: "select",
      label: "Role",
      required: true,
      defaultValue: "front-desk",
      options: ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      access: { update: isAdminField },
      admin: {
        description: "What this person may do. Only admins can change roles; the first account created is always an admin.",
      },
    },
    {
      name: "active",
      type: "checkbox",
      label: "Can sign in",
      defaultValue: true,
      access: { update: isAdminField },
      admin: {
        description: "Untick to stop this person signing in without deleting their account or history.",
        position: "sidebar",
        // The list showed a monospace `true`; a chip in words instead (4B review).
        components: { Cell: { path: "@/cms/components/admin/StatusCell#StatusCell", clientProps: { labels: { true: "Can sign in", false: "Blocked" }, tones: { true: "ok", false: "muted" } } } },
      },
    },
    {
      name: "lastLoginAt",
      type: "date",
      label: "Last signed in",
      access: { read: isAdminField, create: () => false, update: () => false },
      admin: {
        readOnly: true,
        position: "sidebar",
        date: { displayFormat: "d MMM yyyy, HH:mm" },
      },
    },
  ],
};
