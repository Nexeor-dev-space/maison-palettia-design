import { handleCollect } from "@/cms/lib/analytics";

/**
 * POST /api/site/analytics/collect — the cookieless page-view beacon (SPEC §D.6).
 *
 * One line on purpose: the privacy rules (1 KB body, 120/min per hashed IP,
 * bots, Do-Not-Track, excluded paths, known-route mapping, the daily
 * visitor hash) all live in cms/lib/analytics.ts, next to the code that
 * reads the rows back. Always answers 204 (or 4xx for a malformed request);
 * `navigator.sendBeacon` ignores the answer anyway.
 *
 * Node runtime (the default) because it reaches Postgres through the Local
 * API; never cached, because every call writes.
 */
export const dynamic = "force-dynamic";

export const POST = (request: Request) => handleCollect(request);
