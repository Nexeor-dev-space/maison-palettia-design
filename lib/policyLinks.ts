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
 * Two things become links, and nothing else:
 *   · `maisonpalettia.com` (with or without `www.`) and any path after it →
 *     that path on this site, e.g. `/policies/privacy-policy`;
 *   · an email address → `mailto:`.
 * A trailing full stop or comma is never part of the link.
 */

export type PolicyTextPart = { text: string; href?: string };

const LINKABLE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})|((?:www\.)?maisonpalettia\.com((?:\/[a-z0-9-]+)*))/g;

export function policyTextParts(text: string): PolicyTextPart[] {
  const parts: PolicyTextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINKABLE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index) });
    const [whole, email, , path] = match;
    parts.push({ text: whole, href: email ? `mailto:${email}` : path || "/" });
    last = index + whole.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
