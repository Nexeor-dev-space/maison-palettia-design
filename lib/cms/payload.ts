import config from "@payload-config";
import { getPayload } from "payload";

/**
 * The Local API handle for the site (SPEC §G.1).
 *
 * `getPayload` caches the instance per process, so this is cheap to call
 * from every page and getter; the first call in a process is the one that
 * connects to Postgres and runs `onInit` (cms/seed/defaults.ts). It is
 * server-only — `payload.config.ts` must never reach a client component
 * (docs/cms/research/00-spike.md, G18) — so import this from server
 * components, route handlers and `lib/cms/*` getters only.
 */
export const getCms = () => getPayload({ config });
