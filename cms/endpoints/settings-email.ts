import type { Endpoint } from "payload";
import { z } from "zod";

import { mailConfigHash, mergeUnsavedSettings, readMailSettings, sendNow, testEmailVars, verifyMailSettings } from "@/cms/lib/mailer";
import { renderTemplate } from "@/cms/lib/templates";

import { json, parseBody, requireRole } from "./requireRole";

/**
 * ==========================================================================
 * Settings → Email sending buttons: Verify connection, Send test to… (§C.3)
 * ==========================================================================
 *
 * Both test the UNSAVED form (`{ data }` from `useAllFormFields`, see
 * cms/components/VerifyButton.tsx `formValues`), so an admin can paste a
 * password, check it, and only then save. A masked secret in the form
 * means "use the stored one" (`mergeUnsavedSettings`); the clear text never
 * travels back to the browser — responses carry a sentence and a boolean.
 *
 * VERIFY returns `lastVerify = { ok, at, provider, message, configHash }`
 * (the "Bookings open" switch reads `ok`, §C.3) and the EmailActions panel
 * puts it into the form, so the admin's Save stores it — otherwise that
 * Save would write back the stale value the page loaded with. When the
 * tested values are the stored ones it is also stamped on the global
 * directly (nothing to save). `configHash` is an HMAC of the tested settings
 * (`mailConfigHash`) so a later edit of host or key is detectable as
 * "verified something else" (`emailReadiness`).
 *
 * Admin only (SPEC §J: `email/verify`, `email/test`).
 */

const unsavedBody = z.object({ data: z.record(z.string(), z.unknown()).optional() });
const testBody = z.object({
  to: z.string().trim().email("Enter a valid email address.").max(320).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const settingsEmailEndpoints: Endpoint[] = [
  {
    path: "/actions/email/verify",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const body = await parseBody(req, unsavedBody);
      const stored = await readMailSettings(req.payload, req);
      const settings = mergeUnsavedSettings(stored, body.data);
      const result = await verifyMailSettings(settings);
      const lastVerify = { ok: result.ok, at: new Date().toISOString(), provider: settings.provider, message: result.message, configHash: mailConfigHash(settings) };
      // Stamped on the stored global only when what was tested IS what is
      // stored; a verification of unsaved values reaches the database with
      // the admin's Save (the panel puts `lastVerify` into the form).
      if (lastVerify.configHash !== mailConfigHash(stored)) return json({ ok: result.ok, message: result.message, lastVerify });
      try {
        await req.payload.updateGlobal({
          slug: "email-settings",
          data: { lastVerify },
          depth: 0,
          overrideAccess: true,
          req,
          context: { system: true, skipAudit: true },
        });
      } catch (error) {
        // e.g. SMTP chosen but the password only exists in the unsaved form:
        // the global cannot be saved yet. The panel writes `lastVerify` into
        // the form, so the admin's Save stores it.
        req.payload.logger.info({ err: error }, "email verify: result not stamped on the global until the form is saved");
      }
      return json({ ok: result.ok, message: result.message, lastVerify });
    },
  },
  {
    path: "/actions/email/test",
    method: "post",
    handler: async (req) => {
      requireRole(req, ["admin"]);
      const body = await parseBody(req, testBody);
      const to = body.to || (req.user as { email?: string }).email || "";
      const settings = mergeUnsavedSettings(await readMailSettings(req.payload, req), body.data);
      const vars = testEmailVars(req, settings);
      const { subject, html, text } = await renderTemplate(req, "test", vars);
      const result = await sendNow(req, { key: "test", to, rendered: { subject, html, text }, settings, vars });
      return json({ ok: result.ok, message: result.message });
    },
  },
];
