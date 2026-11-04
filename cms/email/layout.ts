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
 * tables for screen readers. Colours are the brand's: Deep Lilac #9059a4
 * accents, Charcoal Slate #2d3748 text, a White Rock #efe2ca ground.
 *
 * Dark mode comes in two kinds. Apple Mail, Outlook's apps and Samsung Email
 * read prefers-color-scheme (or Outlook's data-og* attributes) and get the
 * designed dark theme: lilac ground, charcoal card, the dark logo. Gmail's
 * apps read neither; they recolour the email themselves and cannot be told
 * to show the dark logo. There the ground, card and button are locked (see
 * lockedBackground) so the light design and light logo survive intact.
 * Text cannot be locked: Gmail lightens dark text on the assumption that it
 * darkened what is behind it. So the little text that sits on the ground
 * (`.mp-on-page`) keeps a plain cream backing, which Gmail darkens along
 * with the text; it matches the ground everywhere else. The footer's backing
 * starts 20px down, clear of the card's shadow, which it would otherwise cover.
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
  const darkLogo = site.logoUrl && site.logoDarkUrl
    ? `<img class="mp-logo-dark" src="${escapeHtml(site.logoDarkUrl)}" alt="${name}" width="180" style="display:none;mso-hide:all;border:0;outline:none;max-width:180px;height:auto;margin:0 auto;">`
    : "";
  const header = site.logoUrl
    ? `<img class="mp-logo-light" src="${escapeHtml(site.logoUrl)}" alt="${name}" width="180" style="display:block;border:0;outline:none;max-width:180px;height:auto;margin:0 auto;">${darkLogo}`
    : `<span class="mp-header-fallback mp-on-page" style="background-color:#efe2ca;font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.04em;color:#2d3748;">${name}</span>`;

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
@media (max-width: 760px) { .mp-side { display: none !important; } }
</style>
<style>
.mp-bg { background-image: linear-gradient(#efe2ca, #efe2ca) !important; }
.mp-card { background-image: linear-gradient(#9059a4, #9059a4) !important; }
.mp-button { background-image: linear-gradient(#efe2ca, #efe2ca) !important; }
</style>
<style>
@media (prefers-color-scheme: dark) {
  body, .mp-body, .mp-bg { background: #9059a4 !important; }
  .mp-on-page { background: transparent !important; }
  .mp-card { background-color: #2d3748 !important; background-image: none !important; border-color: #2d3748 !important; box-shadow: 0 18px 40px -18px rgba(35, 31, 32, 0.6) !important; }
  .mp-body-text, .mp-body-text p, .mp-body-text li { color: #efe2ca !important; }
  .mp-body-text strong, .mp-body-text b, .mp-heading { color: #d1e7be !important; }
  .mp-link { color: #c4b5fd !important; }
  .mp-footer-text, .mp-footer-link { color: #efe2ca !important; }
  .mp-footer-name, .mp-header-fallback { color: #d1e7be !important; }
  .mp-logo-light { display: none !important; }
  .mp-logo-dark { display: block !important; }
}
</style>
<style>
:root { color-scheme: light dark; supported-color-schemes: light dark; }
.mp-button { transition: background-color 0.2s ease; }
.mp-button:hover { background: #e4d3b4 !important; }
</style>
<style>
[data-ogsb] .mp-body, [data-ogsb] .mp-bg { background: #9059a4 !important; }
[data-ogsb] .mp-on-page { background: transparent !important; }
[data-ogsb] .mp-card { background-color: #2d3748 !important; background-image: none !important; border-color: #2d3748 !important; }
[data-ogsb] .mp-button { background-color: #efe2ca !important; }
[data-ogsc] .mp-body-text, [data-ogsc] .mp-body-text p, [data-ogsc] .mp-body-text li, [data-ogsc] .mp-footer-text, [data-ogsc] .mp-footer-link { color: #efe2ca !important; }
[data-ogsc] .mp-body-text strong, [data-ogsc] .mp-body-text b, [data-ogsc] .mp-heading, [data-ogsc] .mp-footer-name, [data-ogsc] .mp-header-fallback { color: #d1e7be !important; }
[data-ogsc] .mp-link { color: #c4b5fd !important; }
[data-ogsc] .mp-button, [data-ogsc] .mp-button span { color: #9059a4 !important; }
[data-ogsc] .mp-logo-light { display: none !important; }
[data-ogsc] .mp-logo-dark { display: block !important; }
</style>
</head>
<body class="mp-body" style="margin:0;padding:0;background:#efe2ca;-webkit-text-size-adjust:100%;">
${preheaderHtml}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="mp-bg" bgcolor="#efe2ca" style="${lockedBackground("#efe2ca")}">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:820px;">
        <tr>
          <td class="mp-side" width="110" align="left" valign="top" style="padding:190px 0 0;font-size:0;line-height:0;">${doodleImg("mp-doodle-wave", 30)}</td>
          <td align="center" valign="top" style="padding:0;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:8px 0 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="56" align="left" valign="top" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-splash", 30)}</td>
                <td align="center" valign="middle" style="padding:0;">${url ? `<a href="${url}" style="text-decoration:none;">${header}</a>` : header}</td>
                <td width="56" align="right" valign="top" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-wave", 30)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="mp-card" bgcolor="#9059a4" style="${lockedBackground("#9059a4")}border:1px solid #9059a4;border-radius:16px;padding:14px 16px;box-shadow:0 14px 34px -14px rgba(45,55,72,0.28);">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="left" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-coral", 15)}</td>
                <td align="right" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-splash", 30)}</td>
              </tr>
              <tr>
                <td colspan="2" class="mp-body-text" style="padding:6px 20px 8px;font-family:${FONT};font-size:15px;line-height:1.6;color:#efe2ca;">
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td align="left" style="padding:0;font-size:0;line-height:0;">${doodleImg("mp-doodle-cutout", 24)}</td>
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
                <td class="mp-footer-text" align="center" valign="top" style="padding:20px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#6b5a73;"><div class="mp-on-page" style="background-color:#efe2ca;border-radius:12px;padding:4px 8px 8px;">
            <strong class="mp-footer-name" style="color:#2d3748;">${name}</strong><br>
            ${contactBits.join("<br>")}
            ${url ? `<br><a href="${url}" class="mp-footer-link" style="color:#6b5a73;text-decoration:underline;">${escapeHtml(site.url.replace(/^https?:\/\//, ""))}</a>` : ""}
          </div></td>
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
