import { randomBytes } from "node:crypto";

import { APIError, type Endpoint, type PayloadRequest } from "payload";
import { z } from "zod";

import { ROLES } from "@/cms/access/roles";
import { emailReadiness, sendTemplated } from "@/cms/lib/mailer";
import { publicUrl } from "@/cms/lib/publicUrl";
import type { User } from "@/payload-types";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Staff invites and login links — no passwords over chat (SPEC §D.1, §I)
 * ==========================================================================
 *
 *   POST /actions/users/invite                { name, email, role }   admin
 *   POST /actions/users/:id/send-login-link   {}                      admin
 *
 * Both do the same thing in the end: mint a one-time reset token with
 * Payload's own forgot-password machinery (`disableEmail: true`, so Payload
 * does not send its stock message) and email the `staff_login_link`
 * template through the notification pipeline — logged under Emails → Sent
 * emails like every other message, with the link redacted. Invite first
 * creates the account with a random password nobody knows; the person sets
 * their own from the link. The link is built from Site details → public
 * address, never from the request's Host.
 *
 * Both REFUSE until Email sending is verified (SPEC §I "Users"): an invite
 * that silently lands in the log-only sink is worse than a clear "set up
 * email first", so the refusal names the page.
 *
 * Every handler starts with `requireRole` (which also refuses
 * `Sec-Fetch-Site: cross-site`) and validates its body with zod.
 */

const LINK_HOURS = 1;

const inviteBody = z.object({
  name: z.string().trim().min(1, "Enter the person's name.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  role: z.enum(ROLES as unknown as [string, ...string[]]),
});

const idParam = (value: unknown): string => {
  const id = typeof value === "string" ? value : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new APIError("Unknown staff member.", 404, undefined, true);
  return id;
};

async function requireEmail(req: PayloadRequest): Promise<void> {
  const ready = await emailReadiness(req);
  if (!ready.ok) {
    throw new APIError(`${ready.reason ?? "Email is not set up."} Finish Settings → Email sending first, then send the link.`, 409, undefined, true);
  }
}

/** Mints the reset token and emails the login link. Returns the log row id and the delivery status. */
async function sendLoginLink(req: PayloadRequest, user: Pick<User, "id" | "name" | "email">): Promise<{ logId: string; status: "queued" | "skipped" }> {
  const token = await req.payload.forgotPassword({
    collection: "users",
    data: { email: user.email },
    disableEmail: true,
    expiration: LINK_HOURS * 3600 * 1000,
    req,
  });
  if (!token) throw new APIError("Could not create a login link for that account.", 500, undefined, true);
  const base = await publicUrl(req);
  const invitedBy = (req.user as { name?: string } | null)?.name?.trim() || "An admin";
  return sendTemplated(req, {
    key: "staff_login_link",
    to: user.email,
    vars: {
      user: { name: user.name, email: user.email },
      invitedBy,
      expiresHours: LINK_HOURS,
      links: { login: `${base}${req.payload.config.routes.admin}/reset/${token}` },
    },
  });
}

export const usersEndpoints: Endpoint[] = [
  {
    path: "/actions/users/invite",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const body = await parseBody(req, inviteBody);
      await requireEmail(req);
      const email = body.email.toLowerCase();
      const existing = await req.payload.find({ collection: "users", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true, req });
      if (existing.docs[0]) {
        throw new APIError(`${email} already has an account (${existing.docs[0].name}). Open it and use “Send login link” instead.`, 409, undefined, true);
      }
      const created = (await req.payload.create({
        collection: "users",
        data: { name: body.name, email, role: body.role as User["role"], active: true, password: randomBytes(24).toString("base64url") },
        depth: 0,
        overrideAccess: true,
        req,
      })) as User;
      const sent = await sendLoginLink(req, created);
      return json({ id: created.id, email, status: sent.status, message: `Invitation sent to ${email}. The link works once and expires in ${LINK_HOURS} hour.` });
    },
  },
  {
    path: "/actions/users/:id/send-login-link",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const id = idParam(req.routeParams?.id);
      await requireEmail(req);
      const user = (await req.payload.findByID({ collection: "users", id, depth: 0, overrideAccess: true, disableErrors: true, req })) as User | null;
      if (!user) throw new APIError("Unknown staff member.", 404, undefined, true);
      if (user.active === false) throw new APIError(`${user.name} cannot sign in — tick “Can sign in” and save first.`, 409, undefined, true);
      const sent = await sendLoginLink(req, user);
      return json({ id: user.id, status: sent.status, message: `Login link sent to ${user.email}. It works once and expires in ${LINK_HOURS} hour.` });
    },
  },
];
