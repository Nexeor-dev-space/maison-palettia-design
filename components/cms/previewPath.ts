/**
 * ==========================================================================
 * The one check between an admin link and a redirect (SPEC §G.5)
 * ==========================================================================
 *
 * `/preview?path=…` and `/exit-preview?path=…` end by redirecting the browser
 * to `path`, and `path` arrives in a query string anyone can write. Unchecked,
 * either route is an open redirect wearing the studio's own domain —
 * `https://maisonpalettia.ae/preview?path=//evil.example/login` sent to a
 * member of staff is a phishing page with a trustworthy address. So a path
 * is accepted only if it is unmistakably a page on THIS site:
 *
 *   · it starts with exactly one "/" (no protocol-relative "//host");
 *   · it contains no "//" anywhere and no "\" (browsers treat "/\host" as
 *     "//host");
 *   · it carries no scheme ("javascript:", "https:") and no control or
 *     whitespace characters — the allowed alphabet below has no ":" at all;
 *   · it is at most 512 characters.
 *
 * Anything else is refused with a 400 rather than "fixed" into a guess.
 * Pure and dependency-free so the unit tests (SPEC §K) can import it.
 */
const SAFE_PATH = /^\/(?!\/)[A-Za-z0-9\-_/.?=&%]*$/;

export function safePreviewPath(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return null;
  if (!SAFE_PATH.test(value)) return null;
  if (value.includes("//") || value.includes("\\")) return null;
  // `%2F%2F`, `%5C` and `%3A` decode to the very characters refused above.
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (decoded.includes("//") || decoded.includes("\\") || /[\s:]/.test(decoded)) return null;
  return value;
}
