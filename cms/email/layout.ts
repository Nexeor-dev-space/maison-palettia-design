import { doodleImg } from "./doodles";
import { EMAIL_GROUND, EMAIL_INK, escapeHtml, lockedBackground } from "./render";

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
 * tables for screen readers.
 *
 * ONE SURFACE, ONE INK, IN LIGHT AND DARK MODE. White Rock #efe2ca runs
 * edge to edge with Charcoal Slate #2d3748 text, painted on the body, the
 * outer tables and every cell, so no inner cell can drift from it and no
 * client darkens an unpainted cell separately.
 *
 * DARK MODE HANDLING:
 * - Meta tags: color-scheme and supported-color-schemes: light dark.
 * - Root CSS: :root { color-scheme: light dark; supported-color-schemes: light dark; }.
 * - @media (prefers-color-scheme: dark) keeps #efe2ca background and #2d3748 text.
 * - Outlook.com/web overrides: [data-ogsc] (text) and [data-ogsb] (background)
 *   locking #2d3748 and #efe2ca.
 * - Gmail iOS/Android: sets solid #efe2ca on every cell via bgcolor and inline
 *   background-color, plus background-image: linear-gradient(#efe2ca, #efe2ca)
 *   which Gmail's dark-mode inversion engine preserves without darkening.
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
const GROUND = EMAIL_GROUND;
const INK = EMAIL_INK;

export function renderEmailLayout({ subject, preheader, bodyHtml, site }: EmailLayoutInput): string {
  const name = escapeHtml(site.name || "Maison Palettia");
  const url = escapeHtml(site.url || "");
  const header = site.logoUrl
    ? `<img class="mp-logo" src="${escapeHtml(site.logoUrl)}" alt="${name}" width="150" style="display:block;border:0;outline:none;max-width:150px;height:auto;margin:0 auto;">`
    : `<span class="mp-text mp-header-fallback" style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.04em;color:${INK};">${name}</span>`;

  const contactBits = [
    ...(site.addressLines ?? []).filter(Boolean).map(escapeHtml),
    site.email ? `<a href="mailto:${escapeHtml(site.email)}" style="color:${INK};text-decoration:underline;">${escapeHtml(site.email)}</a>` : "",
    site.phone ? escapeHtml(site.phone) : "",
  ].filter(Boolean);

  // The preheader is followed by zero-width padding so clients do not pull
  // body text into the preview line after it.
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${GROUND};opacity:0;">${escapeHtml(preheader)}${"&#8199;&#65279;&#847; ".repeat(40)}</div>`
    : "";

  const bg = lockedBackground(GROUND);

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
:root { color-scheme: light dark; supported-color-schemes: light dark; }
</style>
<style>
@media (prefers-color-scheme: dark) {
  body, .mp-body, .mp-bg, table, td { background-color: ${GROUND} !important; }
  h1, h2, h3, h4, h5, h6, p, span, strong, b, em, i, a, li, .mp-text, .mp-link, .mp-button, .mp-header-fallback { color: ${INK} !important; }
  .mp-button { border-color: ${INK} !important; }
}
</style>
<style>
[data-ogsb] body, [data-ogsb] .mp-body, [data-ogsb] .mp-bg, [data-ogsb] table, [data-ogsb] td { background-color: ${GROUND} !important; }
[data-ogsc] h1, [data-ogsc] h2, [data-ogsc] h3, [data-ogsc] h4, [data-ogsc] h5, [data-ogsc] h6, [data-ogsc] p, [data-ogsc] span, [data-ogsc] strong, [data-ogsc] b, [data-ogsc] em, [data-ogsc] i, [data-ogsc] a, [data-ogsc] li, [data-ogsc] .mp-text, [data-ogsc] .mp-link, [data-ogsc] .mp-button, [data-ogsc] .mp-header-fallback { color: ${INK} !important; }
[data-ogsc] .mp-button { border-color: ${INK} !important; }
</style>
</head>
<body class="mp-body" bgcolor="${GROUND}" style="margin:0;padding:0;${bg}-webkit-text-size-adjust:100%;">
${preheaderHtml}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="mp-bg" bgcolor="${GROUND}" style="${bg}">
  <tr>
    <td align="center" bgcolor="${GROUND}" style="padding:32px 12px;${bg}">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" bgcolor="${GROUND}" style="width:100%;max-width:820px;${bg}">
        <tr>
          <td class="mp-side" width="110" align="left" valign="top" bgcolor="${GROUND}" style="padding:190px 0 0;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-wave", 38)}</td>
          <td align="center" valign="top" bgcolor="${GROUND}" style="padding:0;${bg}">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="${GROUND}" style="width:100%;max-width:600px;${bg}">
        <tr>
          <td bgcolor="${GROUND}" style="padding:8px 8px 24px;${bg}">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${GROUND}" style="${bg}">
              <tr>
                <td width="56" align="left" valign="top" bgcolor="${GROUND}" style="padding:0;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-splash", 38)}</td>
                <td align="center" valign="middle" bgcolor="${GROUND}" style="padding:0;${bg}">${url ? `<a href="${url}" style="text-decoration:none;">${header}</a>` : header}</td>
                <td width="56" align="right" valign="top" bgcolor="${GROUND}" style="padding:0;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-wave", 38)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td bgcolor="${GROUND}" style="padding:16px 18px;${bg}">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${GROUND}" style="${bg}">
              <tr>
                <td align="left" valign="top" bgcolor="${GROUND}" style="padding:0;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-coral", 15)}</td>
                <td align="right" valign="top" bgcolor="${GROUND}" style="padding:0;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-splash", 30)}</td>
              </tr>
              <tr>
                <td colspan="2" bgcolor="${GROUND}" style="padding:8px 22px 10px;${bg}">
                  <div style="font-family:${FONT};font-size:15px;line-height:1.65;color:${INK};">${bodyHtml}</div>
                </td>
              </tr>
              <tr>
                <td align="left" valign="bottom" bgcolor="${GROUND}" style="padding:0;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-cutout", 24)}</td>
                <td align="right" valign="bottom" bgcolor="${GROUND}" style="padding:0;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-wave", 24)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td bgcolor="${GROUND}" style="padding:0;${bg}">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${GROUND}" style="${bg}">
              <tr>
                <td width="56" align="left" valign="bottom" bgcolor="${GROUND}" style="padding:0;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-splash", 38)}</td>
                <td align="center" valign="top" bgcolor="${GROUND}" style="padding:28px 8px 8px;${bg}">
                  <div class="mp-text" style="padding:0;font-family:${FONT};font-size:12px;line-height:1.7;color:${INK};">
            <strong style="font-weight:700;color:${INK};">${name}</strong><br>
            <span style="color:${INK};">${contactBits.join("<br>")}
            ${url ? `<br><a href="${url}" style="color:${INK};text-decoration:underline;">${escapeHtml(site.url.replace(/^https?:\/\//, ""))}</a>` : ""}</span>
                  </div>
                </td>
                <td width="56" align="right" valign="bottom" bgcolor="${GROUND}" style="padding:0;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-coral", 38)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
          </td>
          <td class="mp-side" width="110" align="right" valign="bottom" bgcolor="${GROUND}" style="padding:0 0 150px;font-size:0;line-height:0;${bg}">${doodleImg("mp-doodle-starburst", 38)}</td>
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
