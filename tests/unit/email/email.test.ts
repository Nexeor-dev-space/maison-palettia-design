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
    expect(html).toMatch(/<a[^>]+style="display:inline-block;background-color:transparent;border:1px solid #2d3748;color:#2d3748;font-weight:700;/);
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

  it("includes dark-mode meta tags and root styles", () => {
    const html = layout();
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark">');
    expect(html).toContain(":root { color-scheme: light dark; supported-color-schemes: light dark; }");
  });

  it("is one colour edge to edge, with #efe2ca as the only background and no second background anywhere", () => {
    const html = layout({ name: "A", url: "https://a.test", email: "a@b.test" });
    expect(html).not.toContain("#9059a4");
    expect(html).toContain('class="mp-bg" bgcolor="#efe2ca" style="background-color:#efe2ca;background-image:linear-gradient(#efe2ca,#efe2ca);"');
    // Every bgcolor attribute is #efe2ca
    const bgcolors = html.match(/bgcolor="[^"]*"/g) ?? [];
    expect(bgcolors.length).toBeGreaterThan(0);
    expect(bgcolors.every((attr) => attr.toLowerCase() === 'bgcolor="#efe2ca"')).toBe(true);
    // Every background-color in inline styles is #efe2ca or transparent
    const bodyOnly = html.replace(/<style>[\s\S]*?<\/style>/g, "");
    const inlineBgs = [...bodyOnly.matchAll(/background-color:\s*([^;"]+)/g)].map((m) => m[1].trim().toLowerCase());
    expect(inlineBgs.length).toBeGreaterThan(0);
    expect(inlineBgs.every((c) => c === "#efe2ca" || c === "transparent")).toBe(true);
  });

  it("sets all text, links and button colours to #2d3748 inline and includes dark-mode overrides", () => {
    const html = layout({ name: "A", url: "https://a.test", email: "a@b.test" });
    // Dark-mode overrides
    expect(html).toContain("@media (prefers-color-scheme: dark)");
    expect(html).toContain("[data-ogsb]");
    expect(html).toContain("[data-ogsc]");
    // The only colours in visible HTML outside images/base64 are #2d3748 and #efe2ca
    const visible = html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/;base64,[^"]*/g, "");
    expect([...new Set(visible.match(/#[0-9a-f]{6}\b/gi))].sort()).toEqual(["#2d3748", "#efe2ca"]);
  });

  it("asserts outline button styling and that all text and link elements have #2d3748 inline", () => {
    const { html } = render(
      [
        "Hi **Layla**, click [here](https://maison.test/tickets) to view.",
        "[Download your tickets](https://maison.test/t)",
      ],
      {},
    );
    expect(html).toContain('style="font-weight:700;color:#2d3748;"');
    expect(html).toContain('style="color:#2d3748;text-decoration:underline;"');
    expect(html).toMatch(/<a[^>]+class="mp-button"[^>]*style="display:inline-block;background-color:transparent;border:1px solid #2d3748;color:#2d3748;font-weight:700;text-decoration:none;letter-spacing:0.02em;padding:13px 26px;border-radius:999px;"/);

    const headingHtml = lexicalToEmailHtml({
      root: {
        type: "root",
        children: [{ type: "heading", tag: "h1", children: [{ type: "text", text: "Your seats are booked", version: 1 }], version: 1 }],
      },
    });
    expect(headingHtml).toContain('style="margin:24px 0 12px;font-size:24px;line-height:1.3;color:#2d3748;"');
    expect(headingHtml).toContain("Your seats are booked");
  });

  it("keeps copy, links and content order completely unchanged", () => {
    const orderTemplate = DEFAULT_TEMPLATES.find((t) => t.key === "order_confirmation")!;
    const vars = {
      customer: { firstName: "Layla" },
      site: { name: "Maison Palettia" },
      order: { reference: "MP-20481", summary: "Candle Pouring on Saturday 14 November at 4:00 pm\n2 seats\nTotal AED 380.00", total: "AED 380.00", vat: "AED 18.10" },
      invoice: { number: "INV-123" },
      links: { tickets: "https://maison.test/tickets/MP-20481", myBookings: "https://maison.test/my-bookings" },
    };
    const state = interpolateLexical(toLexical(orderTemplate.paragraphs) as never, vars);
    const bodyHtml = lexicalToEmailHtml(state);
    const bodyText = lexicalToEmailText(state);
    const fullHtml = renderEmailLayout({
      subject: interpolate(orderTemplate.subject, vars),
      preheader: interpolate(orderTemplate.preheader ?? "", vars),
      bodyHtml,
      site: { name: "Maison Palettia", url: "https://maisonpalettia.com" },
    });

    expect(fullHtml).toContain("Hi Layla,");
    expect(fullHtml).toContain("Booking MP-20481");
    expect(fullHtml).toContain("Candle Pouring on Saturday 14 November at 4:00 pm");
    expect(fullHtml).toContain('href="https://maison.test/tickets/MP-20481"');
    expect(fullHtml).toContain("Download your tickets");
    expect(fullHtml).toContain('href="https://maison.test/my-bookings"');
    expect(bodyText).toContain("Download your tickets: https://maison.test/tickets/MP-20481");
    expect(bodyText).toContain("my bookings: https://maison.test/my-bookings");
  });

  it("uses the logo made for light grounds", () => {
    const html = layout({ name: "A", url: "https://a.test", logoUrl: "https://a.test/light.png", logoDarkUrl: "https://a.test/dark.png" });
    expect(html).toMatch(/<img class="mp-logo" src="https:\/\/a.test\/light.png"[^>]*style="display:block;/);
    expect(html).not.toContain("dark.png");
  });

  it("locks every text block but leaves pictures and rules out of the blend", () => {
    const text = (value: string) => ({ type: "text", text: value, version: 1 });
    const item = (children: unknown[]) => ({ type: "listitem", value: 1, children, version: 1 });
    const html = lexicalToEmailHtml({
      root: {
        type: "root",
        children: [
          { type: "paragraph", children: [text("Before")], version: 1 },
          { type: "list", listType: "bullet", tag: "ul", children: [item([text("One")]), item([{ type: "list", listType: "bullet", tag: "ul", children: [item([text("Nested")])], version: 1 }])], version: 1 },
          { type: "upload", relationTo: "media", value: { url: "https://a.test/p.png", mimeType: "image/png", width: 10, height: 10, alt: "p" }, version: 1 },
          { type: "horizontalrule", version: 1 },
          { type: "paragraph", children: [text("After")], version: 1 },
        ],
      },
    });
    expect(html.match(/class="mp-text"/g)).toHaveLength(3);
    for (const block of html.split('<div class="mp-text">').slice(1)) expect(block.split("</div>")[0]).not.toMatch(/<(img|hr|div)\b/);
    expect(html).toContain("https://a.test/p.png");
    expect(html).toContain('<hr style="border:0;border-top:1px solid #2d3748;');
  });

  it("sets the name as a wordmark when there is no such logo", () => {
    expect(layout()).toContain('class="mp-text mp-header-fallback"');
  });
});
