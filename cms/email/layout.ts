import { doodleImg } from "./doodles";
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
    : `<span class="mp-header-fallback" style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.04em;color:#2d3748;">${name}</span>`;

  const contactBits = [
    ...(site.addressLines ?? []).filter(Boolean).map(escapeHtml),
    site.email ? `<a href="mailto:${escapeHtml(site.email)}" class="mp-footer-link" style="color:#6b5a73;text-decoration:underline;">${escapeHtml(site.email)}</a>` : "",
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
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<style>
:root {
  color-scheme: light dark;
  supported-color-schemes: light dark;
}
.mp-button { transition: background-color 0.2s ease; }
.mp-button:hover { background-color: #7a4a8c !important; }
@media (max-width: 760px) { .mp-side { display: none !important; } }

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  body, .mp-body, .mp-bg { background-color: #1a181b !important; }
  .mp-card {
    background-color: #242c22 !important;
    border-color: #a879bc !important;
    box-shadow: 0 14px 34px -14px rgba(0, 0, 0, 0.6) !important;
  }
  .mp-body-text, .mp-body-text p, .mp-body-text td, .mp-body-text li {
    color: #f7f3ed !important;
  }
  .mp-heading, h1, h2, h3, h4, h5, h6 {
    color: #ffffff !important;
  }
  .mp-body-text a, a.mp-link {
    color: #d8a8ee !important;
  }
  .mp-footer-text, .mp-footer-text td {
    color: #c4b5cb !important;
  }
  .mp-footer-text strong {
    color: #f7f3ed !important;
  }
  .mp-footer-link, .mp-footer-text a {
    color: #d8a8ee !important;
  }
  .mp-header-fallback {
    color: #f7f3ed !important;
  }
  .mp-doodle, img.mp-doodle {
    filter: brightness(0) invert(1) opacity(0.85);
  }
}

/* Outlook Android / iOS / Web [data-ogsc] & [data-ogsb] support */
[data-ogsc] body, [data-ogsb] body,
[data-ogsc] .mp-body, [data-ogsb] .mp-body,
[data-ogsc] .mp-bg, [data-ogsb] .mp-bg {
  background-color: #1a181b !important;
}
[data-ogsc] .mp-card, [data-ogsb] .mp-card {
  background-color: #242c22 !important;
  border-color: #a879bc !important;
}
[data-ogsc] .mp-body-text, [data-ogsc] .mp-body-text p, [data-ogsc] .mp-body-text td,
[data-ogsc] .mp-body-text li, [data-ogsb] .mp-body-text {
  color: #f7f3ed !important;
}
[data-ogsc] .mp-heading, [data-ogsc] h1, [data-ogsc] h2, [data-ogsc] h3,
[data-ogsc] h4, [data-ogsc] h5, [data-ogsc] h6 {
  color: #ffffff !important;
}
[data-ogsc] .mp-body-text a, [data-ogsc] a.mp-link {
  color: #d8a8ee !important;
}
[data-ogsc] .mp-footer-text, [data-ogsc] .mp-footer-text strong,
[data-ogsc] .mp-footer-link, [data-ogsc] .mp-footer-text a {
  color: #d8a8ee !important;
}
[data-ogsc] .mp-doodle, [data-ogsc] img.mp-doodle {
  filter: brightness(0) invert(1) opacity(0.85);
}
</style>
</head>
<body class="mp-body" style="margin:0;padding:0;background:#efe2ca;-webkit-text-size-adjust:100%;">
${preheaderHtml}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="mp-bg" style="background:#efe2ca;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:820px;">
        <tr>
          <td class="mp-side" width="110" align="left" valign="top" style="padding:190px 0 0;font-size:0;line-height:0;">${doodleImg("mp-doodle-cutout", 30)}</td>
          <td align="center" valign="top" style="padding:0;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:8px 0 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="56" align="left" valign="top" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-bow", 30)}</td>
                <td align="center" valign="middle" style="padding:0;">${url ? `<a href="${url}" style="text-decoration:none;">${header}</a>` : header}</td>
                <td width="56" align="right" valign="top" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-wave", 30)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="mp-card" style="background:#d1e7be;border:1px solid #9059a4;border-radius:16px;padding:14px 16px;box-shadow:0 14px 34px -14px rgba(45,55,72,0.28);">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="left" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-coral", 15)}</td>
                <td align="right" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-splash", 30)}</td>
              </tr>
              <tr>
                <td colspan="2" class="mp-body-text" style="padding:6px 20px 8px;font-family:${FONT};font-size:15px;line-height:1.6;color:#2d3748;">
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td align="left" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-bow", 24)}</td>
                <td align="right" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-wave", 24)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="56" align="left" valign="bottom" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-splash", 30)}</td>
                <td class="mp-footer-text" align="center" valign="top" style="padding:24px 8px 8px;font-family:${FONT};font-size:12px;line-height:1.6;color:#6b5a73;">
            <strong style="color:#2d3748;">${name}</strong><br>
            ${contactBits.join("<br>")}
            ${url ? `<br><a href="${url}" class="mp-footer-link" style="color:#6b5a73;text-decoration:underline;">${escapeHtml(site.url.replace(/^https?:\/\//, ""))}</a>` : ""}
          </td>
                <td width="56" align="right" valign="bottom" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-coral", 30)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
          </td>
          <td class="mp-side" width="110" align="right" valign="bottom" style="padding:0 0 150px;font-size:0;line-height:0;">${doodleImg("mp-doodle-starburst", 30)}</td>
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
