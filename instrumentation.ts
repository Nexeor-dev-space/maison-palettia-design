/**
 * ==========================================================================
 * instrumentation.ts — boot Payload once, with its job crons, per server start
 * ==========================================================================
 *
 * Next calls `register()` exactly once when a server instance starts, before
 * it serves a request. That is the only moment in the process that is both
 * "once" and "early", which is what the Payload Jobs Queue needs: its
 * `autoRun` crons (SPEC §H.9 — the email queue every 20 s, the default queue
 * every minute) are started by the first `getPayload({ cron: true })` call,
 * and a request handler would start them late and, under load, more than
 * once. `getPayload` caches the instance, so every later call from a page,
 * a hook or a route handler reuses this one.
 *
 * Two guards, both deliberate:
 *
 *   · `NEXT_RUNTIME !== "nodejs"` — Next evaluates this file for the edge
 *     runtime too, where there is no Postgres driver and no `node:crypto`.
 *   · `NEXT_PHASE === "phase-production-build"` — `next build` also loads
 *     instrumentation while prerendering, and a build worker must never
 *     start crons against the production database (SPEC §A.5: during the
 *     build, workers only read). `seedDefaults` applies the same guard on
 *     its own side (cms/seed/defaults.ts).
 *
 * The imports are dynamic for the same reason the guards exist: a static
 * `import config from "@payload-config"` would pull the whole CMS graph into
 * the edge bundle before the runtime check could run.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { getPayload } = await import("payload");
  const { default: config } = await import("@payload-config");
  await getPayload({ config, cron: true });
}
