import type { LivePreviewConfig, Payload, PayloadRequest } from "payload";

/**
 * ==========================================================================
 * The site's public address — one resolver, three consumers' worth of rules
 * ==========================================================================
 *
 * The CMS needs an absolute origin in a handful of places that a request's
 * own Host header cannot be trusted for or is not present at all: canonical
 * and sitemap URLs, every link in an email, the Mamo Pay return URL and the
 * webhook it registers, the preview iframe, the password-reset link. The
 * resolution order is fixed (SPEC §A.4, §C.1):
 *
 *   1. `site-settings.publicUrl` — what an admin saved in Settings → Site
 *      details → Advanced. Wins whenever set, no redeploy.
 *   2. `NEXT_PUBLIC_SERVER_URL` — the `.env` fallback, which is what the CLI
 *      and a fresh install have before anyone has saved Site details.
 *   3. "" — never a guess from headers. A relative link is a visible bug; a
 *      link to an attacker-chosen Host is not.
 *
 * `publicUrl` is async because step 1 is a database read. Field and
 * collection hooks that cannot await it use `publicUrlSync`, which returns
 * the last value this process resolved (every page render and every
 * settings read keeps it warm). `isPlaceholderPublicUrl` is the third
 * question — "has a human confirmed the address yet?" — because the seed
 * writes a plausible-looking default, and registering a Mamo webhook
 * against a placeholder is the one mistake that is hard to undo (SPEC §C.3).
 */

let lastResolved: string | undefined;

const stripSlash = (url: string) => url.trim().replace(/\/+$/, "");

/* ────────────────────────────────────────────────────────────────────────── */
/* What counts as an acceptable address — one rule for validator and gates   */
/* ────────────────────────────────────────────────────────────────────────── */

/** SPEC §C.3: `https://host[:port]`, no path, no trailing slash. */
export const PUBLIC_URL_RE = /^https:\/\/[a-z0-9.-]+(:\d+)?$/;

/**
 * Development runs on `http://localhost:3200` (DECISIONS.md #4), and the §K
 * E2E run opens bookings against the mock gateway there. A strict https-only
 * rule would make that impossible, so local http is accepted outside
 * production and nowhere else — by the Site details validator AND by
 * `isPlaceholderPublicUrl` below, which gates "Bookings open" and
 * Register-webhook. (Mode → Live keeps the strict `PUBLIC_URL_RE`: real
 * payments never return to an http address, cms/globals/PaymentSettings.ts.)
 */
export const LOCAL_HTTP_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export const isProduction = (): boolean => process.env.NODE_ENV === "production";

export function isAcceptablePublicUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  if (PUBLIC_URL_RE.test(url)) return true;
  return !isProduction() && LOCAL_HTTP_RE.test(url);
}

/** The `.env` fallback, normalised; "" when unset. */
export function envPublicUrl(): string {
  return stripSlash(process.env.NEXT_PUBLIC_SERVER_URL ?? "");
}

/**
 * The globals are written by a parallel agent and land one file at a time,
 * and this module is used from Phase 1 code that must not fail while they
 * are missing. So every read of a global first asks the running config
 * whether the global exists at all.
 */
export function hasGlobal(payload: Payload | undefined, slug: string): boolean {
  return Boolean(payload?.globals?.config?.some((global) => global.slug === slug));
}

export async function publicUrl(req?: PayloadRequest): Promise<string> {
  const payload = req?.payload;
  if (payload && hasGlobal(payload, "site-settings")) {
    try {
      const settings = (await payload.findGlobal({
        slug: "site-settings",
        depth: 0,
        overrideAccess: true,
        select: { publicUrl: true },
        req,
      })) as { publicUrl?: unknown };
      const saved = typeof settings?.publicUrl === "string" ? stripSlash(settings.publicUrl) : "";
      if (saved) {
        lastResolved = saved;
        return saved;
      }
    } catch (error) {
      // A missing table (fresh database, migrations not yet applied) or a
      // transaction already rolled back: fall through to the env value and
      // say so once, rather than failing the caller for a URL.
      payload.logger.warn({ err: error }, "publicUrl: could not read site-settings, using NEXT_PUBLIC_SERVER_URL");
    }
  }
  const fallback = envPublicUrl();
  if (fallback) lastResolved = fallback;
  return fallback;
}

/**
 * The last value `publicUrl` resolved in this process, else the env
 * fallback. For hook code paths that cannot await. With a request whose
 * config has no `site-settings` global (Phase 1 before 1C lands it, tests)
 * there is nothing a cache could have come from, so the env value is
 * returned directly.
 */
export function publicUrlSync(req?: PayloadRequest): string {
  if (req?.payload && !hasGlobal(req.payload, "site-settings")) return envPublicUrl();
  return lastResolved ?? envPublicUrl();
}

/**
 * True until an admin has saved Site details with `publicUrl` at least once
 * (`system-state.publicUrlConfirmedAt`, stamped by the site-settings
 * afterChange for admin saves only), or while the address is not acceptable
 * — https, or local http outside production (`isAcceptablePublicUrl`).
 * Register-webhook and the bookingsOpen switch refuse on `true`.
 */
export async function isPlaceholderPublicUrl(req?: PayloadRequest): Promise<boolean> {
  const url = await publicUrl(req);
  if (!isAcceptablePublicUrl(url)) return true;
  const payload = req?.payload;
  if (!payload || !hasGlobal(payload, "system-state")) return true;
  try {
    const state = (await payload.findGlobal({
      slug: "system-state",
      depth: 0,
      overrideAccess: true,
      select: { publicUrlConfirmedAt: true },
      req,
    })) as { publicUrlConfirmedAt?: unknown };
    return !state?.publicUrlConfirmedAt;
  } catch {
    return true;
  }
}

/**
 * Where a document lives on the site. The single source for canonical URLs,
 * the SEO plugin's `generateURL`, preview links and the auto-redirect on a
 * slug rename (SPEC §A.4). Unknown collections map to "/" rather than
 * throwing, because a preview button on a new collection should open the
 * homepage, not an error page.
 */
export function routeFor(collectionSlug: string, doc: { slug?: string } | null | undefined): string {
  const slug = doc?.slug ?? "";
  switch (collectionSlug) {
    case "pages":
      return slug === "home" ? "/" : `/${slug}`;
    case "experiences":
    case "sessions":
      return `/events/${slug}`;
    case "programmes":
      return `/private-events/${slug}`;
    case "policies":
      return `/policies/${slug}`;
    case "posts":
      return `/journal/${slug}`;
    case "post-categories":
      return `/journal/category/${slug}`;
    default:
      return "/";
  }
}

/**
 * `/preview?path=…&collection=…&id=…` on the public origin — the draft-mode
 * entry point (app/(site)/preview/route.ts, Phase 2), which checks the
 * admin's same-origin `payload-token` cookie, enables draft mode and
 * redirects to `path`. Globals have no document route, so they preview the
 * homepage.
 */
export async function previewUrl(
  args: { collectionSlug?: string; globalSlug?: string; id?: number | string; doc?: { slug?: string } },
  req?: PayloadRequest,
): Promise<string> {
  const base = await publicUrl(req);
  const path = args.collectionSlug ? routeFor(args.collectionSlug, args.doc) : "/";
  const params = new URLSearchParams({ path });
  if (args.collectionSlug) params.set("collection", args.collectionSlug);
  if (args.globalSlug) params.set("global", args.globalSlug);
  if (args.id !== undefined) params.set("id", String(args.id));
  return `${base}/preview?${params.toString()}`;
}

/** Shape expected by `admin.livePreview.url` (SPEC §A.4, added to the config by 2A in Phase 2). */
export const livePreviewUrl: NonNullable<LivePreviewConfig["url"]> = ({ collectionConfig, data, globalConfig, req }) =>
  previewUrl(
    {
      collectionSlug: collectionConfig?.slug,
      globalSlug: globalConfig?.slug,
      id: (data as { id?: number | string })?.id,
      doc: data as { slug?: string },
    },
    req,
  );
