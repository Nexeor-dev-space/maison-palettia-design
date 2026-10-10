import { closeDb, q, revalidate } from "./support/db";
import { apiJson, expect, requireAdmin, test } from "./support/test";

/**
 * Content edit → live page, no rebuild (SPEC §K E2E "edit
 * brand-copy.tagline → /about updated", §G.4).
 *
 * The owner's own path: open Brand wording in the admin, change the script
 * tagline, Save, then load /about as a visitor. The save's afterChange hook
 * purges the brand tag and the layout, so the very next request renders the
 * new words. The original tagline is put back through the same REST API the
 * admin form uses, in `finally`, and the live page is checked again. If
 * that call is refused, the tagline is put back by SQL and the brand tag
 * purged anyway — the owner's site never keeps the test wording — and the
 * spec still fails on the refusal.
 */

test.afterAll(async () => {
  await closeDb();
});

test("changing the tagline in Brand wording shows on /about on the next request", async ({ admin, adminApi, page }) => {
  requireAdmin();
  const original = (await apiJson<{ tagline: string }>(adminApi, "/globals/brand-copy?depth=0")).tagline;
  const marker = `E2E tagline ${Date.now().toString(36)}`;
  expect(marker.length).toBeLessThanOrEqual(40);

  try {
    await admin.goto("/admin/globals/brand-copy");
    const field = admin.locator("#field-tagline");
    await expect(field).toBeVisible();
    await field.fill(marker);
    await admin.getByRole("button", { name: /^save/i }).first().click();
    await expect(admin.getByText(/updated successfully|saved/i).first()).toBeVisible();

    await page.goto("/about");
    await expect(page.getByText(marker).first()).toBeVisible();
  } finally {
    const restore = await adminApi.post("/api/globals/brand-copy", { data: { tagline: original } });
    if (!restore.ok()) {
      await q(`UPDATE brand_copy SET tagline = $1`, [original]);
      await revalidate({ tags: ["global:brand-copy"], layout: true });
    }
    expect(restore.ok(), `restore tagline → ${restore.status()}`).toBeTruthy();
  }

  await page.goto("/about");
  await expect(page.getByText(marker)).toHaveCount(0);
  await expect(page.getByText(original).first()).toBeVisible();
});
