import { APIError, type Endpoint } from "payload";
import { z } from "zod";

import { findVariables, findVariablesInString } from "@/cms/email/render";
import { sampleVariables, TEMPLATE_VARIABLES, variableNamesFor } from "@/cms/email/variables";
import type { TemplateKey } from "@/cms/lib/contracts";
import { readMailSettings, resendNotification, sendNow } from "@/cms/lib/mailer";
import { defaultTemplate, emailSite, renderSource } from "@/cms/lib/templates";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Email actions: template Preview / Send me this, and Resend from the log
 * ==========================================================================
 *
 *   POST /api/actions/email-templates/preview   admin, editor
 *   POST /api/actions/email-templates/send-me   admin, editor
 *   POST /api/actions/notifications/{id}/resend admin (SPEC §J)
 *
 * PREVIEW renders the template AS IT IS IN THE FORM — unsaved subject,
 * preheader and body — with the sample values from cms/email/variables.ts,
 * inside the real shell with the real logo and footer. It also returns the
 * names the draft uses that are not variables of this email, so the panel
 * can warn before the save is refused. Nothing is written.
 *
 * SEND ME THIS sends that same preview to the signed-in user's own address
 * and nowhere else (the body has no `to`), through the saved Email sending
 * settings, and logs it like every other send. Editors may use it: it can
 * only ever reach themselves.
 *
 * RESEND re-sends a logged email's stored HTML as a new log row (see
 * `resendNotification`); rows past the 30-day purge answer 410.
 */

const KEYS = Object.keys(TEMPLATE_VARIABLES) as [TemplateKey, ...TemplateKey[]];

const draftBody = z.object({
  key: z.enum(KEYS),
  subject: z.string().max(300).optional(),
  preheader: z.string().max(300).nullable().optional(),
  body: z.unknown().optional(),
});

type Draft = z.infer<typeof draftBody>;

/** The form's draft over the house copy, for fields the form did not send. */
function sourceFrom(draft: Draft) {
  const fallback = defaultTemplate(draft.key);
  return {
    subject: draft.subject ?? fallback.subject,
    preheader: draft.preheader ?? fallback.preheader,
    body: draft.body ?? fallback.body,
  };
}

function unknownVariables(draft: Draft): string[] {
  const allowed = variableNamesFor(draft.key);
  const used = findVariables(draft.body, findVariablesInString(`${draft.subject ?? ""} ${draft.preheader ?? ""}`));
  return [...used].filter((name) => !allowed.has(name)).sort();
}

export const emailEndpoints: Endpoint[] = [
  {
    path: "/actions/email-templates/preview",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "editor"]);
      const draft = await parseBody(req, draftBody);
      const rendered = renderSource(sourceFrom(draft), sampleVariables(draft.key), await emailSite(req));
      return json({ ...rendered, unknown: unknownVariables(draft) });
    },
  },
  {
    path: "/actions/email-templates/send-me",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin", "editor"]);
      const draft = await parseBody(req, draftBody);
      const unknown = unknownVariables(draft);
      if (unknown.length) {
        throw new APIError(`Fix the unknown variable${unknown.length > 1 ? "s" : ""} first: ${unknown.map((n) => `{{${n}}}`).join(", ")}`, 400, undefined, true);
      }
      const to = (req.user as { email?: string }).email ?? "";
      const vars = sampleVariables(draft.key);
      const rendered = renderSource(sourceFrom(draft), vars, await emailSite(req));
      const settings = await readMailSettings(req.payload, req);
      const result = await sendNow(req, { key: draft.key, to, rendered: { ...rendered, subject: `[Preview] ${rendered.subject}` }, settings, vars });
      return json({ ok: result.ok, message: result.message });
    },
  },
  {
    path: "/actions/notifications/:id/resend",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const id = String(req.routeParams?.id ?? "");
      if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) throw new APIError("Unknown email.", 404, undefined, true);
      const result = await resendNotification(req, id);
      return json({
        ok: true,
        logId: result.logId,
        status: result.status,
        message: result.status === "queued" ? "Queued to send again — it appears as a new row in Sent emails." : "Logged again, but email is set to “Log only”, so nothing was sent.",
      });
    },
  },
];
