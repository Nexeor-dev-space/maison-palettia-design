import { describe, expect, it } from "vitest";

import { TEMPLATE_KEYS } from "@/cms/collections/comms/EmailTemplates";

import { normalizeVars } from "@/cms/email/aliases";
import { DEFAULT_TEMPLATES, toLexical } from "@/cms/email/defaults";
import { renderEmailLayout } from "@/cms/email/layout";
import {
  findVariables,
  findVariablesInString,
  interpolate,
  interpolateLexical,
  lexicalToEmailHtml,
  lexicalToEmailText,
  REDACTED,
  redactVariables,
} from "@/cms/email/render";
import { COMMON_VARIABLES, isStaffTemplate, sampleVariables, TEMPLATE_VARIABLES, variableNamesFor } from "@/cms/email/variables";

/**
 * SPEC §K unit row: "`templates` interpolation escaping", plus the
 * redaction rule of §D.5 and the invariants that keep the code-owned key
 * list, the variable map and the house copy in step.
 */

/** Normalised variables as the assertions read them. */
type Nested = Record<string, Record<string, unknown>>;

const render = (paragraphs: string[], vars: Record<string, unknown>) => {
  const state = interpolateLexical(toLexical(paragraphs) as never, vars);
  return { html: lexicalToEmailHtml(state), text: lexicalToEmailText(state) };
};

describe("interpolate", () => {
  it("reads nested and flat names, trims inner spaces, blanks missing ones", () => {
    expect(interpolate("Hi {{ customer.firstName }}, ref {{order.reference}}", { customer: { firstName: "Layla" }, "order.reference": "MP-1" })).toBe("Hi Layla, ref MP-1");
    expect(interpolate("[{{nope}}]", {})).toBe("[]");
  });

  it("understands the URI-encoded form Payload's link field stores", () => {
    expect(interpolate("%7B%7Blinks.tickets%7D%7D", { links: { tickets: "https://x.test/t" } })).toBe("https://x.test/t");
  });

  it("formats arrays one per line and ignores plain objects", () => {
    expect(interpolate("{{a}}|{{b}}", { a: ["x", "y"], b: { c: 1 } })).toBe("x\ny|");
  });
});

describe("rendering escapes what customers type", () => {
  it("escapes HTML in a variable", () => {
    const { html } = render(["Hi {{customer.firstName}}"], { customer: { firstName: '<img src=x onerror="alert(1)">' } });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("neutralises a javascript: URL arriving through a link variable", () => {
    const { html } = render(["[Open]({{links.tickets}})"], { links: { tickets: "javascript:alert(1)" } });
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="#"');
  });

  it("keeps a real link, styles a lone link as a button, and keeps the URL in plain text", () => {
    const { html, text } = render(["Before", "[Download your tickets]({{links.tickets}})"], { links: { tickets: "https://maison.test/t?sig=a&exp=1" } });
    expect(html).toContain('href="https://maison.test/t?sig=a&amp;exp=1"');
    expect(html).toMatch(/<a[^>]+style="display:inline-block;background-color:#efe2ca;background:linear-gradient\(#efe2ca,#efe2ca\);/);
    expect(text).toContain("Download your tickets: https://maison.test/t?sig=a&exp=1");
  });

  it("turns line breaks in a value into <br> and drops a paragraph left empty by an absent optional value", () => {
    const { html } = render(["Lines:\n{{order.summary}}", "{{note}}", "End"], { order: { summary: "One\nTwo" } });
    expect(html).toMatch(/One<br\s*\/?>Two/);
    expect(html.match(/<p/g)?.length).toBe(2);
  });
});

describe("aliases: callers' spellings reach the documented names", () => {
  it("maps the orders/waitlist/reminder/enquiry shapes", () => {
    const order = normalizeVars("payment_failed", { reference: "MP-1", firstName: "Layla", total: "AED 1.00", retryUrl: "https://x/checkout" }) as Nested;
    expect(order.order.reference).toBe("MP-1");
    expect(order.customer.firstName).toBe("Layla");
    expect(order.links.retry).toBe("https://x/checkout");
    const wait = normalizeVars("waitlist_seat_available", { name: "Sam", sessionTitle: "Candles", startsAt: "2026-10-11T06:00:00.000Z", qty: 2, bookUrl: "https://x/b?w=t" }) as Nested;
    expect(wait.waitlist).toMatchObject({ name: "Sam", qty: 2 });
    expect(wait.session).toMatchObject({ title: "Candles", when: "Sun 11 Oct 2026, 10:00" });
    expect(wait.links.book).toBe("https://x/b?w=t");
    expect(wait.expiresHours).toBe("24");
    const reminder = normalizeVars("ticket_reminder_24h", { event: { title: "Candles", when: "Sun 11 Oct, 10:00", venue: "TSC" } }) as Nested;
    expect(reminder.session).toMatchObject({ title: "Candles", when: "Sun 11 Oct, 10:00", venue: "TSC" });
    const confirmation = normalizeVars("order_confirmation", { lines: [{ title: "Candles", when: "Sun 11 Oct", venue: "TSC", qty: 2 }], totals: { gross: "AED 2.00", vat: "AED 0.10" } }) as Nested;
    expect(confirmation.order).toMatchObject({ summary: "Candles — Sun 11 Oct — TSC — 2 seats", total: "AED 2.00", vat: "AED 0.10" });
    const documented = normalizeVars("order_confirmation", { order: { reference: "KEEP" }, reference: "IGNORED" }) as Nested;
    expect(documented.order.reference).toBe("KEEP");
  });
});

describe("layout", () => {
  it("escapes subject, preheader and site details", () => {
    const html = renderEmailLayout({
      subject: "<b>x</b>",
      preheader: "<i>y</i>",
      bodyHtml: "<p>body</p>",
      site: { name: "A & B", url: "https://a.test", email: "a@b.test", addressLines: ["<script>"] },
    });
    expect(html).toContain("<title>&lt;b&gt;x&lt;/b&gt;</title>");
    expect(html).toContain("&lt;i&gt;y&lt;/i&gt;");
    expect(html).toContain("A &amp; B");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<p>body</p>");
  });

  it("keeps the light design and only darkens the page in a dark theme", () => {
    const html = renderEmailLayout({ subject: "s", bodyHtml: "<p>body</p>", site: { name: "A", url: "https://a.test" } });
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    const dark = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).find((css) => css.includes("prefers-color-scheme: dark"));
    expect(dark).toContain("body, .mp-body, .mp-bg { background: #9059a4 !important; }");
    expect(dark).toContain(".mp-card { background-color: #2d3748 !important;");
    expect(dark).not.toMatch(/\[|:root|:hover/);
    expect(html).toContain('class="mp-bg" bgcolor="#efe2ca" style="background-color:#efe2ca;background:linear-gradient(#efe2ca,#efe2ca);"');
    expect(html).toContain('class="mp-card" bgcolor="#9059a4" style="background-color:#9059a4;background:linear-gradient(#9059a4,#9059a4);');
    const mobile = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).find((css) => css.includes(".mp-side"));
    expect(mobile).not.toMatch(/\[|:root|:hover/);
  });

  it("locks the brand colours where Gmail recolours them, and lets a real dark theme undo the lock", () => {
    const html = renderEmailLayout({ subject: "s", bodyHtml: "<p>body</p>", site: { name: "A", url: "https://a.test" } });
    // Gmail Android mangles an inline background-image gradient; only the shorthand survives.
    expect(html).not.toMatch(/style="[^"]*background-image:/);
    const blocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
    const lock = blocks.findIndex((css) => css.includes(".mp-bg { background-image: linear-gradient(#efe2ca, #efe2ca) !important; }"));
    const dark = blocks.findIndex((css) => css.includes("prefers-color-scheme: dark"));
    expect(lock).toBeGreaterThanOrEqual(0);
    expect(blocks[lock]).not.toMatch(/\[|:root|:hover/);
    // Same specificity, so the dark theme has to come later to win.
    expect(dark).toBeGreaterThan(lock);
    expect(blocks[dark]).toContain(".mp-card { background-color: #2d3748 !important; background-image: none !important;");
    // Text on the ground keeps an unlocked cream backing that dark modes darken with it.
    expect(html).toMatch(/<td class="mp-footer-text"[^>]*><div class="mp-on-page" style="background-color:#efe2ca;/);
    expect(blocks[dark]).toContain(".mp-on-page { background: transparent !important; }");
  });

  it("swaps to the dark logo only in a dark theme", () => {
    const site = { name: "A", url: "https://a.test", logoUrl: "https://a.test/light.png", logoDarkUrl: "https://a.test/dark.png" };
    const html = renderEmailLayout({ subject: "s", bodyHtml: "<p>body</p>", site });
    expect(html).toMatch(/<img class="mp-logo-light" src="https:\/\/a.test\/light.png"[^>]*style="display:block;/);
    expect(html).toMatch(/<img class="mp-logo-dark" src="https:\/\/a.test\/dark.png"[^>]*style="display:none;mso-hide:all;/);
    expect(renderEmailLayout({ subject: "s", bodyHtml: "<p>body</p>", site: { ...site, logoDarkUrl: null } })).not.toContain('class="mp-logo-dark"');
  });
});

describe("redaction (SPEC §D.5)", () => {
  it("redacts links/token/url/magic keys at any depth and keeps the rest", () => {
    const out = redactVariables({
      customer: { firstName: "Layla" },
      links: { tickets: "https://x", invoice: "https://y" },
      "links.myBookings": "https://z",
      token: "abc",
      urlForRetry: "https://r",
      retryUrl: "https://r2",
      magicLink: "https://m",
      nested: { link: "https://n", ok: 1 },
      list: [{ token: "t" }, "plain"],
      at: new Date("2026-01-01T00:00:00Z"),
    }) as Record<string, unknown>;
    expect(out.customer).toEqual({ firstName: "Layla" });
    expect(out.links).toBe(REDACTED);
    expect(out["links.myBookings"]).toBe(REDACTED);
    expect(out.token).toBe(REDACTED);
    expect(out.urlForRetry).toBe(REDACTED);
    expect(out.retryUrl).toBe(REDACTED);
    expect(out.magicLink).toBe(REDACTED);
    expect(out.nested).toEqual({ link: REDACTED, ok: 1 });
    expect(out.list).toEqual([{ token: REDACTED }, "plain"]);
    expect(out.at).toBe("2026-01-01T00:00:00.000Z");
  });

  it("redacts a signed URL hiding under an innocent key", () => {
    const out = redactVariables({ note: "see https://x.test/api/site/tickets/MPT-1/pdf?exp=1&sig=abc", where: "/my-bookings?t=xyz" }) as Record<string, unknown>;
    expect(out.note).toBe(REDACTED);
    expect(out.where).toBe(REDACTED);
  });
});

describe("keys, variables and house copy stay in step", () => {
  const keys = TEMPLATE_KEYS.map((option) => option.value);

  it("has a variable list and house copy for every template key", () => {
    expect(Object.keys(TEMPLATE_VARIABLES).sort()).toEqual([...keys].sort());
    expect(DEFAULT_TEMPLATES.map((t) => t.key).sort()).toEqual([...keys].sort());
  });

  it("uses only declared variables in every default template (the save check would refuse otherwise)", () => {
    for (const template of DEFAULT_TEMPLATES) {
      const used = findVariables(toLexical(template.paragraphs), findVariablesInString(`${template.subject} ${template.preheader ?? ""}`));
      const allowed = variableNamesFor(template.key);
      const unknown = [...used].filter((name) => !allowed.has(name));
      expect({ key: template.key, unknown }).toEqual({ key: template.key, unknown: [] });
    }
  });

  it("renders every default template with its samples without leaving braces behind", () => {
    for (const template of DEFAULT_TEMPLATES) {
      const vars = sampleVariables(template.key);
      const state = interpolateLexical(toLexical(template.paragraphs) as never, vars);
      const html = lexicalToEmailHtml(state);
      expect(html).not.toMatch(/\{\{|%7B%7B/);
      expect(interpolate(template.subject, vars)).not.toMatch(/\{\{/);
    }
  });

  it("knows which templates are staff alerts", () => {
    expect(isStaffTemplate("admin_new_order")).toBe(true);
    expect(isStaffTemplate("staff_login_link")).toBe(true);
    expect(isStaffTemplate("order_confirmation")).toBe(false);
    expect(COMMON_VARIABLES.every((v) => v.name.startsWith("site."))).toBe(true);
  });
});
