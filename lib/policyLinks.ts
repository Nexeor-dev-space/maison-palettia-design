/**
 * ==========================================================================
 * Links inside policy prose
 * ==========================================================================
 *
 * Policy blocks are plain text (cms/collections/content/Policies.ts), so a
 * cross-reference is written the way it reads on paper — "our Cancellation,
 * Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-
 * rescheduling-and-refunds" — and the page turns it into a link. That keeps
 * the wording right wherever the text is read without this renderer (a
 * copy-paste, an older deploy, a screen reader's plain-text mode) and needs
 * no markup an editor could get wrong.
 *
 * Three things become links, and nothing else:
 *   · `maisonpalettia.com` (with or without `www.`) and any path after it →
 *     that path on this site, e.g. `/policies/privacy-policy`;
 *   · an email address → `mailto:`;
 *   · `[label](https://…)` → the label, linking to that address in a new tab.
 *     Only for pages on other sites — the official consumer-rights pages the
 *     Terms point to — where printing the address would be unreadable. Only
 *     `https:` addresses are accepted, so a typed `javascript:` stays text.
 * A trailing full stop or comma is never part of the link.
 */

export type PolicyTextPart = { text: string; href?: string; external?: boolean };

const LINKABLE =
  /\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})|((?:www\.)?maisonpalettia\.com((?:\/[a-z0-9-]+)*))/g;

export function policyTextParts(text: string): PolicyTextPart[] {
  const parts: PolicyTextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINKABLE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index) });
    const [whole, label, url, email, , path] = match;
    if (label && url) parts.push({ text: label, href: url, external: true });
    else parts.push({ text: whole, href: email ? `mailto:${email}` : path || "/" });
    last = index + whole.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
