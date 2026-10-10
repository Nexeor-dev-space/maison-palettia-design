import type { Payload, PayloadRequest } from "payload";

import { DEFAULT_TEMPLATES, toLexical } from "@/cms/email/defaults";

/**
 * ==========================================================================
 * seedEmailTemplates — one `email-templates` document per key (SPEC §F.8)
 * ==========================================================================
 *
 * Creates the documents that are MISSING, from the house copy in
 * cms/email/defaults.ts, and never touches one that exists: an edited
 * subject or body is the owner's, and a re-seed must not undo it. Safe to
 * run on every boot — `onInit` (cms/seed/defaults.ts, under its advisory
 * lock, so concurrent workers create each key once) and the full seed
 * (`npm run seed`) both call it.
 *
 * Writes go through the Local API so the template's own `beforeValidate`
 * (unknown-variable check) and the Lexical link hooks run exactly as they
 * do for an editor's save. A table that does not exist yet (migrations not
 * applied) is reported once and skipped, never fatal.
 */
export async function seedEmailTemplates(payload: Payload, opts: { req?: PayloadRequest } = {}): Promise<{ created: string[] }> {
  const created: string[] = [];
  let existing: Set<string>;
  try {
    const found = await payload.find({
      collection: "email-templates",
      limit: 200,
      depth: 0,
      pagination: false,
      overrideAccess: true,
      select: { key: true },
      ...(opts.req ? { req: opts.req } : {}),
    });
    existing = new Set(found.docs.map((doc) => String((doc as { key?: unknown }).key)));
  } catch (error) {
    payload.logger.warn({ err: error }, "seedEmailTemplates: email-templates is not readable yet (run `npx payload migrate`); skipped");
    return { created };
  }

  for (const template of DEFAULT_TEMPLATES) {
    if (existing.has(template.key)) continue;
    try {
      await payload.create({
        collection: "email-templates",
        data: {
          key: template.key,
          label: template.label,
          subject: template.subject,
          preheader: template.preheader ?? null,
          body: toLexical(template.paragraphs) as never,
          attachInvoice: template.attachInvoice ?? false,
          attachTickets: template.attachTickets ?? false,
          enabled: template.enabled ?? true,
        },
        depth: 0,
        overrideAccess: true,
        context: { system: true, seed: true, skipRevalidate: true, disableRevalidate: true },
        ...(opts.req ? { req: opts.req } : {}),
      });
      created.push(template.key);
    } catch (error) {
      payload.logger.error({ err: error, key: template.key }, "seedEmailTemplates: could not create the template");
    }
  }
  if (created.length) payload.logger.info(`seedEmailTemplates: created ${created.length} email template(s): ${created.join(", ")}`);
  return { created };
}
