import { escapeHtml } from "./render";

/**
 * ==========================================================================
 * The HTML shell around every email (SPEC §A.3 `cms/email/layout.ts`, §H.8)
 * ==========================================================================
 *
 * Code, not content: editors write the message (the template body); the
 * frame — logo, colours, footer with the studio's contact details — is the
 * same on every email and is not something to re-decide per template.
 *
 * Built the way email clients still need it: a single 600-px table, inline
 * styles, no web fonts (Montserrat is named first and falls back to the
 * system sans; Outlook ignores it either way), no external CSS, a hidden
 * preheader for the inbox preview line, `role="presentation"` on layout
 * tables for screen readers. Colours are the brand's: Deep Lilac #9059a4
 * accents, Charcoal Slate #2d3748 text, a White Rock #efe2ca ground.
 *
 * Everything that comes from settings is escaped here; the body arrives as
 * HTML that cms/email/render.ts has already made safe.
 */

export interface EmailSite {
  name: string;
  url: string;
  /** Absolute URL of a PNG/JPEG logo. SVG is not used: Gmail and Outlook do not render it. */
  logoUrl?: string | null;
  addressLines?: string[];
  email?: string | null;
  phone?: string | null;
}

export interface EmailLayoutInput {
  subject: string;
  preheader?: string | null;
  bodyHtml: string;
  site: EmailSite;
}

const FONT = "Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function renderEmailLayout({ subject, preheader, bodyHtml, site }: EmailLayoutInput): string {
  const name = escapeHtml(site.name || "Maison Palettia");
  const url = escapeHtml(site.url || "");
  const header = site.logoUrl
    ? `<img src="${escapeHtml(site.logoUrl)}" alt="${name}" width="180" style="display:block;border:0;outline:none;max-width:180px;height:auto;margin:0 auto;">`
    : `<span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.04em;color:#2d3748;">${name}</span>`;

  const contactBits = [
    ...(site.addressLines ?? []).filter(Boolean).map(escapeHtml),
    site.email ? `<a href="mailto:${escapeHtml(site.email)}" style="color:#6b5a73;text-decoration:underline;">${escapeHtml(site.email)}</a>` : "",
    site.phone ? escapeHtml(site.phone) : "",
  ].filter(Boolean);

  // The preheader is followed by zero-width padding so clients do not pull
  // body text into the preview line after it.
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#efe2ca;opacity:0;">${escapeHtml(preheader)}${"&#8199;&#65279;&#847; ".repeat(40)}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f6efe2;-webkit-text-size-adjust:100%;">
${preheaderHtml}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6efe2;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td align="center" style="padding:8px 0 24px;">${url ? `<a href="${url}" style="text-decoration:none;">${header}</a>` : header}</td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:16px;border-top:4px solid #9059a4;padding:36px 36px 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:#2d3748;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 24px 8px;font-family:${FONT};font-size:12px;line-height:1.6;color:#6b5a73;">
            <strong style="color:#2d3748;">${name}</strong><br>
            ${contactBits.join("<br>")}
            ${url ? `<br><a href="${url}" style="color:#6b5a73;text-decoration:underline;">${escapeHtml(site.url.replace(/^https?:\/\//, ""))}</a>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** The plain-text alternative: the message, then the same footer as lines. */
export function renderEmailText({ bodyText, site }: { bodyText: string; site: EmailSite }): string {
  const footer = [site.name, ...(site.addressLines ?? []), site.email, site.phone, site.url].filter(Boolean).join("\n");
  return `${bodyText.trim()}\n\n--\n${footer}\n`;
}
