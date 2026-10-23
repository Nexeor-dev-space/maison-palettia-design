import type { Page } from "@playwright/test";

import { expect, test } from "./support/test";

/**
 * The homepage intro, end to end (issue #135). Read-only.
 *
 * The runtime is `introRuntime.toString()` (components/sections/hero/
 * introCore.ts), so what runs in a visitor's browser is whatever the
 * production minifier made of that function — which the unit suite, running
 * Vitest's own compile of it, cannot see. Run this against a production build
 * (`npm run build`, then `npx next start -p 3201` and
 * E2E_BASE_URL=http://localhost:3201); against `next dev` it passes without
 * proving that.
 *
 *   · the head carries only the decision, on every page;
 *   · the runtime is in the homepage's HTML once — after the hero, not in the
 *     server payload too — and nowhere else;
 *   · on a real load it starts before hydration and plays through to `done`
 *     with nothing thrown;
 *   · a client-side navigation back to the homepage throws nothing either.
 */

/** The runtime's call: `(function …)(cfg,'boot');` — present only where it ships. */
const RUNTIME_CALL = ",'boot');";

/** Uncaught errors, and console errors other than a missing file (local media). */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) {
      errors.push(`console: ${message.text()}`);
    }
  });
  return errors;
}

const headScriptLength = (page: Page) =>
  page.evaluate(() => document.head.querySelector("script:not([src])")?.textContent?.length ?? 0);

test("the runtime ships once, on the homepage only", async ({ request }) => {
  const home = await (await request.get("/")).text();
  expect(home.split(RUNTIME_CALL).length - 1).toBe(1);
  // After the hero's section, not in <head>.
  expect(home.indexOf(RUNTIME_CALL)).toBeGreaterThan(home.indexOf("data-hero-intro"));

  const events = await (await request.get("/events")).text();
  expect(events.split(RUNTIME_CALL).length - 1).toBe(0);
});

test("the homepage intro plays through to done on a real load", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  expect(await headScriptLength(page)).toBeLessThan(1024);

  // The inline runtime has started the sequence on the hero.
  await expect.poll(() => page.evaluate(() => Boolean(window.__mpIntro?.hero))).toBe(true);
  // The ring was measured: the burst's shapes carry `data-ring`.
  await expect.poll(() => page.locator("[data-doodle][data-ring]").count()).toBeGreaterThan(0);
  await expect(page.locator("html")).toHaveAttribute("data-intro", "done", { timeout: 30_000 });
  await expect(page.locator("#hero-heading")).toBeVisible();

  expect(errors).toEqual([]);
});

test("any other page marks the loader and carries no runtime", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/events");
  expect(await headScriptLength(page)).toBeLessThan(1024);
  await expect(page.locator("html")).toHaveAttribute("data-loader", "write");
  expect(await page.evaluate(() => window.__mpIntro === undefined)).toBe(true);
  expect(errors).toEqual([]);
});

test("a client-side navigation back to the homepage throws nothing", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/events");
  await page.locator('a[href="/"]:visible').first().click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.locator("[data-hero-intro]")).toBeVisible();
  await expect(page.locator("#hero-heading")).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});
