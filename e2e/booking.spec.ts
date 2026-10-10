import { closeDb, purgeSession, q, revalidate, setBookingsOpen } from "./support/db";
import { apiJson, expect, requireAdmin, test } from "./support/test";

/**
 * ==========================================================================
 * Booking in mock mode → paid → PDFs → email logged → check-in
 * ==========================================================================
 *
 * SPEC §K E2E "Commerce (mock)": book 2 seats on the public site → the
 * Mamo mock's hosted page → Pay → /payment-success confirms → ticket and
 * invoice PDFs download through their signed links → the confirmation email
 * is in the notification log → the door scans one ticket in (ok), then
 * again (already checked in).
 *
 * The session is created for the run (starting ~45 minutes from now, so
 * the door's check-in window is open) through the admin's REST API, and
 * everything the booking produces is deleted in `afterAll` by id
 * (e2e/support/db.ts `purgeSession` → `purgeOrder`), including the invoice
 * PDF on disk and the invoice number when nothing was issued after it.
 *
 * Two switches are borrowed and put back, by SQL so no audit row or staff
 * email is produced: payments → `mock` (no card, no money, no network —
 * the dev server refuses mock only in production), and online bookings →
 * open (the admin's own switch refuses until email and Mamo are set up,
 * SPEC §M step 9).
 */

/** Written into the session's internal notes, so cleanup can find it by SQL even if the create response was lost. */
const RUN = `e2e-${Date.now().toString(36)}-${process.pid}`;
let sessionId: string | undefined;
let previous: { bookingsOpen: boolean; mode: string } | undefined;

test.afterAll(async () => {
  try {
    const ids = (await q<{ id: string }>(`SELECT id FROM sessions WHERE internal_notes LIKE '%' || $1 || '%'`, [RUN])).map((r) => r.id);
    for (const id of new Set([...ids, ...(sessionId ? [sessionId] : [])])) await purgeSession(id);
    if (previous) {
      await q(`UPDATE payment_settings SET mode = $1`, [previous.mode]);
      await setBookingsOpen(previous.bookingsOpen);
      await revalidate({ tags: ["global:booking-settings"], layout: true });
    }
  } finally {
    await closeDb();
  }
});

test("book two seats, pay on the mock page, get PDFs, an email and a door check-in", async ({ page, admin, adminApi }) => {
  requireAdmin();
  test.setTimeout(600_000);

  // ── Setup: a published session ~45 minutes from now ────────────────────────
  const template = await apiJson<{ docs: Array<{ experience: string; venue: string; category: string }> }>(
    adminApi,
    "/sessions?where[_status][equals]=published&limit=1&depth=0",
  );
  test.skip(template.docs.length === 0, "no published session to borrow an experience and venue from");
  const startsAt = new Date(Math.ceil((Date.now() + 45 * 60_000) / 300_000) * 300_000);
  const created = await adminApi.post("/api/sessions?depth=0", {
    data: {
      experience: template.docs[0].experience,
      venue: template.docs[0].venue,
      category: template.docs[0].category,
      startsAt: startsAt.toISOString(),
      durationMinutes: 60,
      priceFils: 15_000,
      seatsTotal: 4,
      bookingStatus: "open",
      internalNotes: `Created by the e2e suite (${RUN}) — deleted at the end of the run.`,
      _status: "published",
    },
  });
  expect(created.ok(), `create session → ${created.status()} ${await created.text()}`).toBeTruthy();
  const session = ((await created.json()) as { doc: { id: string; slug: string } }).doc;
  sessionId = session.id;

  const [settings] = await q<{ mode: string; bookings_open: boolean }>(
    `SELECT p.mode, b.bookings_open FROM payment_settings p, booking_settings b LIMIT 1`,
  );
  previous = { mode: settings.mode, bookingsOpen: settings.bookings_open };
  await q(`UPDATE payment_settings SET mode = 'mock'`);
  await setBookingsOpen(true);

  // ── The visitor books two places ───────────────────────────────────────────
  const tag = Date.now().toString(36);
  const email = `e2e-booking-${tag}@example.test`;
  await page.goto(`/events/${session.slug}/book`);
  // Up to a few seats the picker is a native radio group under painted wells; past that, − / + buttons.
  await page.locator('label:has(input[name="places"][value="2"])').click();
  await expect(page.getByRole("radio", { name: /^2 places/ })).toBeChecked();
  await page.fill('input[name="firstName"]', "Eve");
  await page.fill('input[name="lastName"]', "Endtoend");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="phone"]', "+971 50 123 4567");
  await page.getByRole("button", { name: /continue to checkout/i }).click();
  await page.waitForURL(/\/checkout/);

  const pay = page.locator('form button[type="submit"]').last();
  await expect(pay).toHaveText(/pay/i);
  const consent = page.locator('input[name="consent"]');
  if (await consent.count()) await consent.check();
  await pay.click({ noWaitAfter: true });

  // ── Mamo's hosted page (mock) ──────────────────────────────────────────────
  await page.waitForURL(/\/dev\/mamo-mock\/pay\//, { timeout: 120_000 });
  // The mock's Pay posts the webhook to this server before redirecting back: slow on a cold dev server.
  await page.locator('button[value="pay"]').click({ noWaitAfter: true });
  await page.waitForURL(/\/payment-success/, { timeout: 150_000 });
  const reference = new URL(page.url()).searchParams.get("ref");
  expect(reference).toBeTruthy();

  // The page polls until the webhook has confirmed the order.
  const ticketLinks = page.getByRole("link", { name: "Download ticket (PDF)" });
  await expect(ticketLinks.first())
    .toBeVisible({ timeout: 240_000 })
    .catch(async (error: Error) => {
      // Say WHY the booking did not confirm: the order's state and the jobs that should have finished it.
      const [row] = await q<{ id: string; status: string }>(`SELECT id, status FROM orders WHERE reference = $1`, [reference]);
      const jobs = row
        ? await q(`SELECT coalesce(task_slug::text, workflow_slug::text) AS job, created_at, processing, has_error, total_tried, completed_at, left(error::text, 200) AS error FROM payload_jobs WHERE input::text LIKE '%' || $1 || '%'`, [row.id])
        : [];
      throw new Error(`${error.message}\norder: ${JSON.stringify(row)}\njobs: ${JSON.stringify(jobs)}`);
    });
  await expect(ticketLinks).toHaveCount(2);

  // ── The order, as the admin sees it ────────────────────────────────────────
  const orders = await apiJson<{ docs: Array<{ id: string; status: string; totals: { grossFils: number } }> }>(
    adminApi,
    `/orders?where[reference][equals]=${encodeURIComponent(String(reference))}&depth=0`,
  );
  expect(orders.docs).toHaveLength(1);
  const order = orders.docs[0];
  expect(order.status).toBe("confirmed");
  expect(order.totals.grossFils).toBe(30_000);

  // ── PDFs through their signed links ────────────────────────────────────────
  const hrefs = [
    ...(await ticketLinks.evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href))),
    ...(await page.locator('a[href*="/api/site/invoices/"]').evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href))),
  ];
  expect(hrefs.length).toBe(3);
  for (const href of hrefs) {
    const pdf = await page.request.get(href);
    expect(pdf.status(), href).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
    // The same link with its signature changed is refused.
    const forged = await page.request.get(href.replace(/sig=([^&]{4})/, "sig=AAAA"));
    expect(forged.status(), `forged ${href}`).toBeGreaterThanOrEqual(400);
  }

  // ── The confirmation email is in the notification log ─────────────────────
  await expect(async () => {
    const logs = await apiJson<{ totalDocs: number }>(
      adminApi,
      `/notification-log?where[order][equals]=${order.id}&where[templateKey][equals]=order_confirmation&depth=0&limit=1`,
    );
    expect(logs.totalDocs).toBeGreaterThanOrEqual(1);
  }).toPass({ timeout: 120_000, intervals: [2_000, 5_000] });

  // ── The order page in the admin ───────────────────────────────────────────
  await admin.goto(`/admin/collections/orders/${order.id}`, { waitUntil: "networkidle" });
  await expect(admin.getByText(String(reference)).first()).toBeVisible();

  // ── The door: scan one ticket in, then again ──────────────────────────────
  const tickets = await apiJson<{ docs: Array<{ code: string; status: string }> }>(adminApi, `/tickets?where[order][equals]=${order.id}&depth=0`);
  expect(tickets.docs.map((t) => t.status)).toEqual(["valid", "valid"]);
  await admin.goto("/admin/check-in", { waitUntil: "networkidle" });
  const code = admin.getByPlaceholder("MPT-XXXXXXXX");
  const verdict = admin.getByRole("status").filter({ has: admin.locator(".mp-ci-verdict__headline") });

  await code.fill(tickets.docs[0].code);
  await code.press("Enter");
  await expect(verdict.getByRole("heading")).toHaveText("Welcome — checked in");

  // The desk ignores the same code for 4 s after answering it (a QR held still in front of the
  // camera must give one verdict, not five) — so the deliberate second scan waits that out.
  await admin.waitForTimeout(4_500);
  await code.fill(tickets.docs[0].code);
  await code.press("Enter");
  await expect(verdict.getByRole("heading")).toHaveText("Already checked in");
});
