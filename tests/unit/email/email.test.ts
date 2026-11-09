import { describe, expect, it } from "vitest";

import { TEMPLATE_KEYS } from "@/cms/collections/comms/EmailTemplates";

import { normalizeVars } from "@/cms/email/aliases";
import { DEFAULT_TEMPLATES, toLexical } from "@/cms/email/defaults";
import { type EmailSite, renderEmailLayout } from "@/cms/email/layout";
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
    expect(html).toMatch(/<a[^>]+style="display:inline-block;border:1\.5px solid #2d3748;color:#2d3748;/);
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

  const layout = (site: EmailSite = { name: "A", url: "https://a.test" }) => renderEmailLayout({ subject: "s", bodyHtml: "<p>body</p>", site });
  const styleBlocks = (html: string) => [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);

  it("is one colour, with no second ground for dark mode to split off", () => {
    const html = layout({ name: "A", url: "https://a.test", email: "a@b.test" });
    expect(html).toContain('<meta name="color-scheme" content="light only">');
    expect(html).not.toContain("prefers-color-scheme");
    expect(html).toContain('class="mp-bg" bgcolor="#efe2ca" style="background-color:#efe2ca;background:linear-gradient(#efe2ca,#efe2ca);"');
    expect(html).not.toContain("#9059a4");
    expect(html.match(/bgcolor="#[0-9a-f]{6}"/g)).toEqual(['bgcolor="#efe2ca"', 'bgcolor="#efe2ca"']);
    const visible = html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/;base64,[^"]*/g, "");
    expect([...new Set(visible.match(/#[0-9a-f]{6}\b/g))].sort()).toEqual(["#2d3748", "#efe2ca"]);
  });

  it("keeps Gmail's stylesheet free of anything it would drop the block for", () => {
    const blocks = styleBlocks(layout());
    expect(blocks.find((css) => css.includes(".mp-side"))).not.toMatch(/\[|:root|:hover/);
    const lock = blocks.find((css) => css.includes("linear-gradient"));
    expect(lock).toMatch(/^\s*@media screen \{/);
    expect(lock).not.toMatch(/\[|:root|:hover/);
    expect(layout()).not.toMatch(/style="[^"]*background-image:/);
  });

  it("states the Gmail lock so that it resolves to the two brand colours", () => {
    const lock = styleBlocks(layout()).find((css) => css.includes("background-blend-mode"));
    const screen = (...values: number[]) => Math.round(255 * (1 - values.reduce((left, v) => left * (1 - v / 255), 1)));
    const exclusion = (a: number, b: number) => Math.round(a + b - (2 * a * b) / 255);
    expect([screen(0x00, 0x00, 0xef), screen(0xaa, 0xa8, 0x00), screen(0x00, 0x00, 0xca)]).toEqual([0xef, 0xe2, 0xca]);
    expect([exclusion(0xef, 0xde), exclusion(0xe2, 0xdd), exclusion(0xca, 0xdf)]).toEqual([0x2d, 0x37, 0x48]);
    expect(lock).toContain("linear-gradient(#00aa00, #00aa00), linear-gradient(#00a800, #00a800), linear-gradient(#ef00ca, #ef00ca)");
    expect(lock).toContain("mix-blend-mode: exclusion !important;");
    expect(lock).toContain("color: #dedddf !important;");
    const text = layout({ name: "A", url: "https://a.test", email: "a@b.test" }).split(/<div class="mp-text"/).slice(1).map((part) => part.split("</div>")[0]);
    expect(text.join("").match(/<strong[^>]*color:/)).toBeNull();
  });

  it("uses the logo made for light grounds", () => {
    const html = layout({ name: "A", url: "https://a.test", logoUrl: "https://a.test/light.png", logoDarkUrl: "https://a.test/dark.png" });
    expect(html).toMatch(/<img class="mp-logo" src="https:\/\/a.test\/light.png"[^>]*style="display:block;/);
    expect(html).not.toContain("dark.png");
  });

  it("sets the name as a wordmark when there is no such logo", () => {
    expect(layout()).toContain('class="mp-text mp-header-fallback"');
  });
});
