import { expect, test } from "./support/test";

/**
 * Read-only checks against the running server — nothing here writes.
 *
 *   · the site renders and the crawler files exist (SPEC §K build gates
 *     "/robots.txt and /sitemap.xml present");
 *   · every kind of `/api/actions/**` call is refused to an anonymous
 *     caller over real HTTP (the per-role matrix is the unit suite; this is
 *     the same rule through Next's routing and Payload's REST layer);
 *   · the generic REST API cannot create orders or read staff data
 *     anonymously, and session reads carry no staff-only fields.
 */

test("home, events and contact render without a server error", async ({ page }) => {
  for (const path of ["/", "/events", "/contact"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
    await expect(page.locator("main")).toBeVisible();
  }
});

test("robots.txt and sitemap.xml are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/User-agent/i);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");
});

test("anonymous callers get 401 from every kind of admin action", async ({ request }) => {
  const id = "00000000-0000-0000-0000-000000000000";
  const calls: Array<["GET" | "POST", string]> = [
    ["POST", "/api/actions/payments/test-connection"],
    ["POST", "/api/actions/email/test"],
    ["POST", "/api/actions/orders/manual"],
    ["POST", `/api/actions/orders/${id}/refund`],
    ["POST", `/api/actions/orders/${id}/refunds/${id}/approve`],
    ["POST", `/api/actions/sessions/${id}/cancel`],
    ["GET", `/api/actions/sessions/${id}/attendees.csv`],
    ["POST", "/api/actions/tickets/check-in"],
    ["POST", "/api/actions/users/invite"],
    ["GET", "/api/actions/exports/orders.csv"],
    ["POST", "/api/actions/find-text"],
    ["GET", "/api/actions/admin/warnings"],
    ["POST", `/api/payload-jobs/${id}/retry`],
  ];
  const wrong: string[] = [];
  for (const [method, url] of calls) {
    const response = method === "GET" ? await request.get(url) : await request.post(url, { data: {} });
    if (response.status() !== 401) wrong.push(`${method} ${url} → ${response.status()}`);
  }
  expect(wrong).toEqual([]);
});

test("the generic REST API refuses anonymous writes and staff reads", async ({ request }) => {
  expect((await request.post("/api/orders", { data: { reference: "MP-E2E" } })).status()).toBe(403);
  expect((await request.post("/api/enquiries", { data: { name: "x", email: "x@example.test", message: "hi" } })).status()).toBe(403);
  expect((await request.get("/api/orders")).status()).toBe(403);
  expect((await request.get("/api/customers")).status()).toBe(403);
  expect((await request.get("/api/globals/payment-settings")).status()).toBe(403);

  const sessions = await request.get("/api/sessions?limit=50&depth=0");
  expect(sessions.status()).toBe(200);
  const body = (await sessions.json()) as { docs: Array<Record<string, unknown>> };
  for (const doc of body.docs) {
    expect(doc._status).toBe("published");
    expect(doc).not.toHaveProperty("internalNotes");
    expect(doc).not.toHaveProperty("instructor");
  }
});
