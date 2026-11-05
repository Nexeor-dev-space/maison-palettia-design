import { doodleImg } from "./doodles";
import { escapeHtml, lockedBackground } from "./render";

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
 * tables for screen readers. Colours are the brand's: a White Rock #efe2ca
 * ground and a Deep Lilac #9059a4 card.
 *
 * Everything that comes from settings is escaped here; the body arrives as
 * HTML that cms/email/render.ts has already made safe.
 */

export interface EmailSite {
  name: string;
  url: string;
  /** Absolute URL of a PNG/JPEG logo. SVG is not used: Gmail and Outlook do not render it. */
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
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
    ? `<img class="mp-logo" src="${escapeHtml(site.logoUrl)}" alt="${name}" width="150" style="display:block;border:0;outline:none;max-width:150px;height:auto;margin:0 auto;">`
    : `<span class="mp-header-fallback" style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.04em;color:#9059a4;">${name}</span>`;

  const contactBits = [
    ...(site.addressLines ?? []).filter(Boolean).map(escapeHtml),
    site.email ? `<a href="mailto:${escapeHtml(site.email)}" class="mp-footer-link" style="color:#9059a4;text-decoration:underline;">${escapeHtml(site.email)}</a>` : "",
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
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(subject)}</title>
<style>
@media (max-width: 760px) { .mp-side { display: none !important; } }
</style>
<style>
@media screen {
.mp-body, .mp-bg, .mp-button { background-image: linear-gradient(#00aa00, #00aa00), linear-gradient(#00a800, #00a800), linear-gradient(#ef00ca, #ef00ca) !important; background-blend-mode: screen, screen, normal !important; }
.mp-card { background-image: linear-gradient(#9059a4, #9059a4) !important; }
.mp-footer-text, .mp-button-label { background-image: linear-gradient(#000000, #000000) !important; mix-blend-mode: exclusion !important; }
.mp-footer-name { color: #dedddf !important; }
.mp-footer-lines, .mp-footer-lines a, .mp-button-text { color: #b6d8a0 !important; mix-blend-mode: hard-light !important; }
}
</style>
<style>
:root { color-scheme: light only; supported-color-schemes: light only; }
.mp-button { transition: background-color 0.2s ease; }
.mp-button:hover { background: #d1e7be !important; }
</style>
<style>
[data-ogsb] .mp-body, [data-ogsb] .mp-bg, [data-ogsb] .mp-button { background-color: #efe2ca !important; }
[data-ogsb] .mp-card { background-color: #9059a4 !important; }
[data-ogsc] .mp-body-text, [data-ogsc] .mp-body-text p, [data-ogsc] .mp-body-text li, [data-ogsc] .mp-body-text strong, [data-ogsc] .mp-body-text b, [data-ogsc] .mp-heading, [data-ogsc] .mp-link { color: #efe2ca !important; }
[data-ogsc] .mp-button, [data-ogsc] .mp-footer-text, [data-ogsc] .mp-header-fallback { color: #9059a4 !important; }
</style>
</head>
<body class="mp-body" style="margin:0;padding:0;background:#efe2ca;-webkit-text-size-adjust:100%;">
${preheaderHtml}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="mp-bg" bgcolor="#efe2ca" style="${lockedBackground("#efe2ca")}">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:820px;">
        <tr>
          <td class="mp-side" width="110" align="left" valign="top" style="padding:190px 0 0;font-size:0;line-height:0;">${doodleImg("mp-doodle-wave", 38)}</td>
          <td align="center" valign="top" style="padding:0;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:8px 8px 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="56" align="left" valign="top" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-splash", 38)}</td>
                <td align="center" valign="middle" style="padding:0;">${url ? `<a href="${url}" style="text-decoration:none;">${header}</a>` : header}</td>
                <td width="56" align="right" valign="top" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-wave", 38)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="mp-card" bgcolor="#9059a4" style="${lockedBackground("#9059a4")}border:1px solid #9059a4;border-radius:20px;padding:16px 18px;box-shadow:0 18px 38px -16px rgba(144,89,164,0.45);">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="left" valign="top" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-coral", 15)}</td>
                <td align="right" valign="top" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-splash", 30)}</td>
              </tr>
              <tr>
                <td colspan="2" class="mp-body-text" style="padding:8px 22px 10px;font-family:${FONT};font-size:15px;line-height:1.65;color:#efe2ca;">
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td align="left" valign="bottom" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-cutout", 24)}</td>
                <td align="right" valign="bottom" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-wave", 24)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="56" align="left" valign="bottom" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-splash", 38)}</td>
                <td align="center" valign="top" style="padding:28px 8px 8px;">
                  <div class="mp-footer-text" style="padding:0;font-family:${FONT};font-size:12px;line-height:1.7;color:#9059a4;">
            <strong class="mp-footer-name" style="font-weight:700;color:#2d3748;">${name}</strong><br>
            <span class="mp-footer-lines">${contactBits.join("<br>")}
            ${url ? `<br><a href="${url}" class="mp-footer-link" style="color:#9059a4;text-decoration:underline;">${escapeHtml(site.url.replace(/^https?:\/\//, ""))}</a>` : ""}</span>
                  </div>
                </td>
                <td width="56" align="right" valign="bottom" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-coral", 38)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
          </td>
          <td class="mp-side" width="110" align="right" valign="bottom" style="padding:0 0 150px;font-size:0;line-height:0;">${doodleImg("mp-doodle-starburst", 38)}</td>
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
