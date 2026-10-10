import type { PayloadRequest } from "payload";

import { normalizeVars } from "@/cms/email/aliases";
import { DEFAULT_TEMPLATE_BY_KEY, toLexical } from "@/cms/email/defaults";
import { type EmailSite, renderEmailLayout, renderEmailText } from "@/cms/email/layout";
import { escapeHtml, interpolate, interpolateLexical, isLexicalState, lexicalToEmailHtml, lexicalToEmailText, type TemplateVars } from "@/cms/email/render";
import type { TemplateKey } from "@/cms/lib/contracts";
import { publicUrl } from "@/cms/lib/publicUrl";
import type { EmailTemplate, Media, SiteSetting } from "@/payload-types";

/**
 * ==========================================================================
 * templates — load a template, render it with variables, wrap it (SPEC §H.8)
 * ==========================================================================
 *
 * The database half of rendering. cms/email/render.ts does the string work
 * (interpolation, escaping, Lexical conversion); this module supplies what
 * it needs from the CMS:
 *
 *   · the `email-templates` document for the key — or the house copy from
 *     cms/email/defaults.ts when there is none yet (a lost confirmation is
 *     worse than one in the default wording);
 *   · the site's name, address, logo and contact lines from Site details,
 *     both as the `site.*` variables every template may use and as the
 *     footer of the shell (cms/email/layout.ts).
 *
 * Rendering happens when `sendTemplated` is called, not when the email job
 * runs: the notification log stores exactly what was sent, and a template
 * edited between "queued" and "sent" does not change a message already in
 * flight (SPEC §H.8 "render now").
 */

export interface TemplateSource {
  key: TemplateKey;
  subject: string;
  preheader?: string | null;
  body: unknown;
  attachInvoice?: boolean | null;
  attachTickets?: boolean | null;
  enabled?: boolean | null;
  /** False when the house copy stood in for a missing document. */
  fromDatabase: boolean;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** The house copy for `key` in the same shape as a stored template. */
export function defaultTemplate(key: TemplateKey): TemplateSource {
  const fallback = DEFAULT_TEMPLATE_BY_KEY[key];
  if (!fallback) {
    return { key, subject: key, preheader: null, body: toLexical([]), enabled: true, fromDatabase: false };
  }
  return {
    key,
    subject: fallback.subject,
    preheader: fallback.preheader ?? null,
    body: toLexical(fallback.paragraphs),
    attachInvoice: fallback.attachInvoice ?? false,
    attachTickets: fallback.attachTickets ?? false,
    enabled: fallback.enabled ?? true,
    fromDatabase: false,
  };
}

/** The stored template for `key`, or the house copy. Never throws for a missing table or row. */
export async function loadTemplate(req: PayloadRequest, key: TemplateKey): Promise<TemplateSource> {
  try {
    const result = await req.payload.find({
      collection: "email-templates",
      where: { key: { equals: key } },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req,
    });
    const doc = result.docs[0] as EmailTemplate | undefined;
    if (doc) {
      return {
        key,
        subject: doc.subject,
        preheader: doc.preheader,
        body: doc.body,
        attachInvoice: doc.attachInvoice,
        attachTickets: doc.attachTickets,
        enabled: doc.enabled,
        fromDatabase: true,
      };
    }
  } catch (error) {
    req.payload.logger.warn({ err: error, key }, "templates: could not read email-templates; using the house copy");
  }
  return defaultTemplate(key);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Site chrome                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

const EMAIL_SAFE_IMAGE = /^image\/(png|jpe?g|gif)$/;

/**
 * Site details as the email needs them. The logo is "Logo (on light)" when
 * it is a PNG/JPEG/GIF — SVG and WebP do not render in Gmail or Outlook, so
 * those fall back to the name set as a wordmark rather than a broken image.
 */
export async function emailSite(req?: PayloadRequest): Promise<EmailSite> {
  const url = await publicUrl(req);
  const fallback: EmailSite = { name: "Maison Palettia", url };
  if (!req) return fallback;
  try {
    const site = (await req.payload.findGlobal({ slug: "site-settings", depth: 1, overrideAccess: true, req })) as SiteSetting;
    const logo = (typeof site.logoOnLight === "object" ? site.logoOnLight : null) as Media | null;
    const logoUrl = logo?.url && EMAIL_SAFE_IMAGE.test(logo.mimeType ?? "") ? absolute(url, logo.url) : null;
    return {
      name: site.name || fallback.name,
      url,
      logoUrl,
      addressLines: (site.contact?.addressLines ?? []).map((row) => row.line).filter(Boolean),
      email: site.contact?.email ?? null,
      phone: site.contact?.phone ?? null,
    };
  } catch (error) {
    req.payload.logger.warn({ err: error }, "templates: could not read site-settings for the email shell");
    return fallback;
  }
}

const absolute = (origin: string, path: string) => (/^https?:\/\//.test(path) ? path : `${origin}${path.startsWith("/") ? "" : "/"}${path}`);

/** The `site.*` variables every template may use (cms/email/variables.ts COMMON_VARIABLES). */
export function siteVariables(site: EmailSite): TemplateVars {
  return { site: { name: site.name, url: site.url, email: site.email ?? "", phone: site.phone ?? "" } };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Rendering                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Renders a template source with `vars`. `site.*` is filled in by the
 * renderer; a caller's own `site` key is ignored so an email can never claim
 * to come from somewhere else.
 */
export function renderSource(source: Pick<TemplateSource, "subject" | "preheader" | "body">, vars: TemplateVars, site: EmailSite): RenderedEmail {
  const all: TemplateVars = { ...vars, ...siteVariables(site) };
  // Subjects are one line; a multi-line value would break the header.
  const subject = interpolate(source.subject, all).replace(/\s+/g, " ").trim() || site.name;
  const preheader = interpolate(source.preheader ?? "", all).replace(/\s+/g, " ").trim();
  const body = isLexicalState(source.body) ? interpolateLexical(source.body, all) : null;
  const bodyHtml = body ? lexicalToEmailHtml(body) : `<p>${escapeHtml(subject)}</p>`;
  const bodyText = body ? lexicalToEmailText(body) : subject;
  return {
    subject,
    html: renderEmailLayout({ subject, preheader, bodyHtml, site }),
    text: renderEmailText({ bodyText, site }),
  };
}

/**
 * Load + render, for the mailer. Callers' own variable spellings
 * (`sessionTitle`, `reference`, `lines[]`…) are mapped onto the documented
 * names first (cms/email/aliases.ts).
 */
export async function renderTemplate(req: PayloadRequest, key: TemplateKey, vars: TemplateVars): Promise<RenderedEmail & { template: TemplateSource }> {
  const [template, site] = await Promise.all([loadTemplate(req, key), emailSite(req)]);
  return { ...renderSource(template, normalizeVars(key, vars), site), template };
}

/**
 * SPEC §O `renderTemplateHtml`. Without a request there is no database to
 * read, so the house copy and the `.env` site address are used — enough
 * for tests and for callers outside a request; with one, the stored
 * template and Site details.
 */
export async function renderTemplateHtml(key: TemplateKey, vars: Record<string, unknown>, req?: PayloadRequest): Promise<RenderedEmail> {
  if (req) {
    const { subject, html, text } = await renderTemplate(req, key, vars);
    return { subject, html, text };
  }
  return renderSource(defaultTemplate(key), normalizeVars(key, vars), await emailSite());
}
