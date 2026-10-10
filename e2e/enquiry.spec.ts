import { closeDb, purgeEnquiry, q } from "./support/db";
import { apiJson, expect, requireAdmin, test } from "./support/test";

/**
 * Enquiry form → admin inbox → status (SPEC §K E2E "Enquiry form → admin
 * inbox → status").
 *
 * A visitor sends the contact form; the enquiry appears in the admin inbox
 * as New; "Reply by email" stamps it replied and moves it to In progress
 * (the mail client itself is not opened — the mailto navigation is
 * swallowed by the headless browser). The enquiry, the notification-log
 * rows and the jobs it triggered are deleted afterwards, by id.
 *
 * The public endpoint allows five enquiries per hour per address; a sixth
 * run inside the hour gets the form's "try again later" answer and fails
 * here, by design of the rate limit.
 */

test.afterAll(async () => {
  await closeDb();
});

test("a contact-form enquiry lands in the inbox as New and moves on when replied to", async ({ page, admin, adminApi }) => {
  requireAdmin();
  const tag = Date.now().toString(36);
  const email = `e2e-enquiry-${tag}@example.test`;
  const name = `E2E Visitor ${tag}`;
  let enquiryId: string | undefined;

  try {
    await page.goto("/contact");
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Message").fill(`Hello from the e2e suite (${tag}). Do you run candle workshops for teams?`);
    await page.getByRole("button", { name: /send enquiry/i }).click();
    await expect(page.getByText("Message received")).toBeVisible();

    const found = await apiJson<{ docs: Array<{ id: string; status: string; name: string }> }>(
      adminApi,
      `/enquiries?where[email][equals]=${encodeURIComponent(email)}&depth=0`,
    );
    expect(found.docs).toHaveLength(1);
    enquiryId = found.docs[0].id;
    expect(found.docs[0].status).toBe("new");

    await admin.goto("/admin/collections/enquiries", { waitUntil: "networkidle" });
    const row = admin.locator("tr").filter({ hasText: name });
    await expect(row).toBeVisible();
    await expect(row.getByText("New")).toBeVisible();

    await admin.goto(`/admin/collections/enquiries/${enquiryId}`, { waitUntil: "networkidle" });
    await expect(admin.getByText(name).first()).toBeVisible();
    await admin.route(/^mailto:/, (route) => route.abort());
    await admin.getByRole("link", { name: "Reply by email" }).click();
    await expect(admin.getByText("Marked as replied.")).toBeVisible();

    const after = await apiJson<{ status: string; repliedAt?: string | null }>(adminApi, `/enquiries/${enquiryId}?depth=0`);
    expect(after.status).toBe("in_progress");
    expect(after.repliedAt).toBeTruthy();
  } finally {
    // Found by SQL on the run's unique address, never through the admin API:
    // cleanup must not depend on the admin session that may be why the spec failed.
    const ids = (await q<{ id: string }>(`SELECT id FROM enquiries WHERE email = $1`, [email])).map((r) => r.id);
    for (const id of new Set([...ids, ...(enquiryId ? [enquiryId] : [])])) await purgeEnquiry(id);
  }
});
