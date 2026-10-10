import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";

import { ADMIN_STATE, adminUser, BASE_URL, hasAdmin } from "./env";

/**
 * The suite's `test`: Playwright's, plus
 *
 *   · every page answers the first-party analytics beacon itself, so
 *     browsing the site during a test never adds a visit to the owner's
 *     dashboard (the beacon would write `analytics-events` rows);
 *   · `admin` — a page signed in as the run's throwaway admin (storage
 *     state from globalSetup), and `adminApi` — the same account for REST
 *     calls.
 *
 * RE-SIGN-IN, ONCE. Both fixtures check the session before the spec gets
 * them and sign in again if it is gone, and `adminApi` retries a request
 * that answered 401/403 once after signing in again. A refused session
 * then costs one login, not every admin spec after it. A genuine 403 (a
 * rule refusing the admin) still fails: the retry is refused the same way.
 *
 * Specs that need the admin call `requireAdmin()` first: without
 * credentials they skip with a reason rather than fail.
 */

type Fixtures = { admin: Page; adminApi: APIRequestContext };

/** Signs the context in as the run's admin; false when there is no admin or the login is refused. */
async function signIn(api: APIRequestContext): Promise<boolean> {
  const user = adminUser();
  if (!user) return false;
  const login = await api.post("/api/users/login", { data: { email: user.email, password: user.password }, headers: { origin: BASE_URL } });
  return login.ok();
}

/** Makes sure the context's cookie is a live admin session before a spec uses it. */
async function ensureSignedIn(api: APIRequestContext): Promise<void> {
  const me = await api.get("/api/users/me");
  const user = me.ok() ? ((await me.json()) as { user?: unknown }).user : null;
  if (!user && !(await signIn(api))) throw new Error("e2e: the throwaway admin could not sign in again");
}

const RETRIED = new Set(["fetch", "get", "post", "put", "patch", "delete", "head"]);

/** `api`, with every request retried once after a fresh sign-in when it answers 401 or 403. */
function withReSignIn(api: APIRequestContext): APIRequestContext {
  return new Proxy(api, {
    get(target, prop, receiver) {
      const value: unknown = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      const method = value as (...args: unknown[]) => unknown;
      if (typeof prop !== "string" || !RETRIED.has(prop)) return method.bind(target);
      return async (...args: unknown[]) => {
        const first = (await method.apply(target, args)) as Awaited<ReturnType<APIRequestContext["get"]>>;
        if (first.status() !== 401 && first.status() !== 403) return first;
        // A 401/403 changed nothing on the server, so sending it again is safe.
        if (!(await signIn(target))) return first;
        return method.apply(target, args);
      };
    },
  });
}

export const test = base.extend<Fixtures>({
  context: async ({ context }, provide) => {
    await context.route("**/api/site/analytics/collect", (route) => route.fulfill({ status: 204, body: "" }));
    await provide(context);
  },
  admin: async ({ browser }, provide) => {
    const context = await browser.newContext({ storageState: hasAdmin() ? ADMIN_STATE : undefined, baseURL: BASE_URL, viewport: { width: 1440, height: 900 } });
    await context.route("**/api/site/analytics/collect", (route) => route.fulfill({ status: 204, body: "" }));
    // `context.request` shares the browser's cookie jar, so a re-sign-in here signs the page in too.
    if (hasAdmin()) await ensureSignedIn(context.request);
    const page = await context.newPage();
    await provide(page);
    await context.close();
  },
  adminApi: async ({ playwright }, provide) => {
    const api = await playwright.request.newContext({ baseURL: BASE_URL, storageState: hasAdmin() ? ADMIN_STATE : undefined, extraHTTPHeaders: { origin: BASE_URL } });
    if (hasAdmin()) await ensureSignedIn(api);
    await provide(withReSignIn(api));
    await api.dispose();
  },
});

export function requireAdmin(): void {
  test.skip(!hasAdmin(), "no throwaway admin: globalSetup needs DATABASE_URL (environment or .env) to create one");
}

/** GET /api/<path> as the admin and return the JSON (fails the test on a non-2xx). */
export async function apiJson<T = Record<string, unknown>>(api: APIRequestContext, pathAndQuery: string): Promise<T> {
  const response = await api.get(`/api${pathAndQuery}`);
  expect(response.ok(), `GET /api${pathAndQuery} → ${response.status()}`).toBeTruthy();
  return (await response.json()) as T;
}

export { expect };
