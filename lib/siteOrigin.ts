/**
 * ==========================================================================
 * The production origin — the one address search engines should keep
 * ==========================================================================
 *
 * Named in code, not read from Site details, because the live site and
 * staging are two deployments on ONE database (DECISIONS.md #1, #9): a
 * `publicUrl` saved in the admin is the same row for both, so it can only
 * ever be right for one of them. In October 2026 it held the staging
 * address, and maisonpalettia.com printed staging canonicals, a staging
 * sitemap and staging JSON-LD.
 *
 * Read by:
 *   - `getSite().url` (lib/constants.server.ts) — canonicals, `og:url`,
 *     the sitemap, robots, JSON-LD and the Journal feed, on every deployment.
 *     A staging page therefore names its production twin as canonical.
 *   - next.config.ts — `www.` redirects here permanently, and every response
 *     served under any other host (staging, localhost, a bare IP) carries
 *     `X-Robots-Tag: noindex`.
 *
 * The apex, not `www`: deploy/nginx.conf.example and the domain's earlier
 * GoDaddy setup both send `www` to the apex.
 *
 * No imports: next.config.ts loads this file before the app's aliases exist.
 * Changing the domain is a code change and a deploy (the runbook already
 * needs one for `NEXT_PUBLIC_SERVER_URL`).
 */
export const PRODUCTION_ORIGIN = "https://maisonpalettia.com";

export const PRODUCTION_HOST = new URL(PRODUCTION_ORIGIN).host;

/**
 * Whether the current deployment is the production site (maisonpalettia.com).
 * Any other host (staging, preview, localhost, or unset) returns false.
 */
export function isProductionDeployment(): boolean {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!serverUrl) return false;
  try {
    return new URL(serverUrl).host === PRODUCTION_HOST;
  } catch {
    return false;
  }
}

