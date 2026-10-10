import type { Page } from "@playwright/test";

import { expect, requireAdmin, test } from "./support/test";

/**
 * The admin's ⌘K palette (SPEC §I): "everything findable in seconds".
 * Read-only — it opens, finds, navigates and closes; nothing is saved.
 */

test.beforeEach(() => requireAdmin());

/** Opens the palette with the shortcut, retrying until the admin has hydrated and the listener is attached. */
async function openPalette(admin: Page) {
  await admin.goto("/admin", { waitUntil: "networkidle" });
  const dialog = admin.getByRole("dialog", { name: "Search the admin" });
  await expect(async () => {
    if (!(await dialog.isVisible())) await admin.keyboard.press("ControlOrMeta+k");
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });
  return dialog;
}

test("⌘K opens the palette, finds Sessions and opens it; Escape closes it", async ({ admin }) => {
  const dialog = await openPalette(admin);

  await dialog.getByRole("textbox", { name: "Search" }).fill("sessions");
  const results = dialog.getByRole("listbox", { name: "Results" });
  const option = results.getByRole("option").filter({ hasText: /^Sessions/ }).first();
  await expect(option).toBeVisible();
  await option.click();
  await admin.waitForURL(/\/admin\/collections\/sessions/);

  await admin.keyboard.press("ControlOrMeta+k");
  await expect(dialog).toBeVisible();
  await admin.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("a sentence from the website offers 'Find … on the website' and lands on the field", async ({ admin }) => {
  const dialog = await openPalette(admin);
  await dialog.getByRole("textbox", { name: "Search" }).fill("Palette of Creativity");
  const find = dialog.getByRole("option").filter({ hasText: /on the website/i }).first();
  await expect(find).toBeVisible();
  await find.click();
  // Text mode: the hits name where the words live (e.g. Brand wording › Script tagline).
  const hit = dialog.getByRole("option").filter({ hasText: /Brand wording/i }).first();
  await expect(hit).toBeVisible({ timeout: 30_000 });
  await hit.click();
  await admin.waitForURL(/\/admin\/globals\/brand-copy/);
});
