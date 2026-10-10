import { beforeAll, describe, expect, it } from "vitest";

import type { InvoiceView } from "@/cms/lib/pdf/invoice";
import type { TicketView } from "@/cms/lib/pdf/ticket";

/**
 * SPEC §K unit rows for the PDFs: the invoice/ticket `sig` tokens (expiry,
 * tamper, scope), the "Tax Invoice" vs "Receipt" rule, and that both
 * renderers produce a real PDF from plain data — fonts falling back to the
 * built-ins when nothing is uploaded, non-Latin text made safe for them.
 */

process.env.PAYLOAD_SECRET ||= "unit-test-secret-not-used-anywhere-else-0123456789";

let links: typeof import("@/cms/lib/pdf/links");
let invoice: typeof import("@/cms/lib/pdf/invoice");
let ticket: typeof import("@/cms/lib/pdf/ticket");
let fonts: typeof import("@/cms/lib/pdf/fonts");

beforeAll(async () => {
  links = await import("@/cms/lib/pdf/links");
  invoice = await import("@/cms/lib/pdf/invoice");
  ticket = await import("@/cms/lib/pdf/ticket");
  fonts = await import("@/cms/lib/pdf/fonts");
});

const standardFonts = { regular: null, bold: null, display: null };
const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type \/Page\b(?!s)/g) ?? []).length;

describe("signed PDF links", () => {
  it("verifies a fresh signature and refuses tampering", () => {
    const { exp, sig } = links.signPdf("ticket", "MPT-ABCD1234");
    expect(links.verifyPdf("ticket", "MPT-ABCD1234", { exp: String(exp), sig })).toBe("ok");
    expect(links.verifyPdf("ticket", "MPT-ABCD1235", { exp: String(exp), sig })).toBe("bad");
    expect(links.verifyPdf("invoice", "MPT-ABCD1234", { exp: String(exp), sig })).toBe("bad");
    expect(links.verifyPdf("ticket", "MPT-ABCD1234", { exp: String(exp + 1), sig })).toBe("bad");
    // Change the FIRST character: the last one of a 43-char base64url HMAC carries only 4 bits, so
    // swapping it for a fixed letter left the signature unchanged about one run in sixteen.
    expect(links.verifyPdf("ticket", "MPT-ABCD1234", { exp: String(exp), sig: `${sig[0] === "A" ? "B" : "A"}${sig.slice(1)}` })).toBe("bad");
    expect(links.verifyPdf("ticket", "MPT-ABCD1234", { exp: String(exp), sig: "" })).toBe("bad");
  });

  it("binds the scope: a one-seat link cannot fetch the whole order", () => {
    const { exp, sig } = links.signPdf("ticket", "MPT-ABCD1234");
    expect(links.verifyPdf("ticket", "MPT-ABCD1234", { exp: String(exp), sig, scope: "order" })).toBe("bad");
    const order = links.signPdf("ticket", "MPT-ABCD1234", { scope: "order" });
    expect(links.verifyPdf("ticket", "MPT-ABCD1234", { exp: String(order.exp), sig: order.sig, scope: "order" })).toBe("ok");
  });

  it("expires, and caps the lifetime at 30 days", () => {
    const past = Date.now() - 40 * 24 * 3600 * 1000;
    const old = links.signPdf("invoice", "id-1", { now: past, ttlSeconds: 60 });
    expect(links.verifyPdf("invoice", "id-1", { exp: String(old.exp), sig: old.sig })).toBe("expired");
    const long = links.signPdf("invoice", "id-1", { ttlSeconds: 365 * 24 * 3600 });
    expect(long.exp - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(links.MAX_PDF_LINK_SECONDS);
    // A correctly signed link further out than 30 days is still refused.
    const future = links.signPdf("invoice", "id-1", { now: Date.now() + 10 * 24 * 3600 * 1000 });
    expect(links.verifyPdf("invoice", "id-1", { exp: String(future.exp), sig: future.sig })).toBe("bad");
  });
});

const baseInvoice = (): InvoiceView => ({
  kind: "invoice",
  number: "MP-INV-2026-000123",
  issuedAt: "2026-10-10T08:00:00.000Z",
  orderReference: "MP-7KQ2XD",
  paymentLabel: "Mamo Pay · card ****1157",
  seller: { legalName: "Maison Palettia Events L.L.C.", trn: "100123456700003", tradeLicenceNumber: "1234567", addressLines: ["Times Square Center", "Dubai"], email: "hello@maison.test", phone: "+971 4 000 0000" },
  buyer: { name: "Layla Haddad", email: "layla@example.com" },
  lines: [
    { description: "Candle Making — Sat 11 Oct 2026, 10:00", qty: 2, unitNetFils: 22857, netFils: 45714, vatFils: 2286, grossFils: 48000 },
    { description: "Promo SPRING10", qty: 1, unitNetFils: -4571, netFils: -4571, vatFils: -229, grossFils: -4800 },
  ],
  totals: { netFils: 41143, vatFils: 2057, grossFils: 43200, discountFils: 4800 },
  vatRateBps: 500,
  footerNote: "Thank you for creating with us.",
});

describe("invoice PDF", () => {
  it("is a Tax Invoice with a TRN, a Receipt without, a (Tax) Credit Note for refunds", () => {
    expect(invoice.invoiceTitle(baseInvoice())).toBe("Tax Invoice");
    expect(invoice.invoiceTitle({ ...baseInvoice(), seller: { ...baseInvoice().seller, trn: "" } })).toBe("Receipt");
    expect(invoice.invoiceTitle({ ...baseInvoice(), kind: "credit_note" })).toBe("Tax Credit Note");
    expect(invoice.invoiceTitle({ ...baseInvoice(), kind: "credit_note", seller: { ...baseInvoice().seller, trn: "" } })).toBe("Credit Note");
  });

  it("renders with the built-in fonts, many lines spilling onto a second page", async () => {
    const view = baseInvoice();
    view.lines = Array.from({ length: 40 }, (_, i) => ({ ...view.lines[0], description: `Line ${i + 1} — لون` }));
    const pdf = await invoice.drawInvoice(view, standardFonts, { logo: null, name: "Maison Palettia" });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(2);
  });
});

describe("ticket PDF", () => {
  const view = (n: number): TicketView => ({
    code: `MPT-ABCD123${n}`,
    qr: `mp1.MPT-ABCD123${n}.c2lnbmF0dXJlLXNhbXBsZQ`,
    status: "valid",
    holderName: "Layla Haddad",
    sessionTitle: "Candle Making",
    when: "Saturday 11 October 2026 · 10:00–12:00",
    venueName: "Times Square Center",
    venueAddress: ["Sheikh Zayed Road", "Dubai"],
    seatNo: n,
    qty: 3,
    orderReference: "MP-7KQ2XD",
    heading: "Show this at the table.",
    instructions: "Please arrive ten minutes early.",
  });

  it("renders one page per seat", async () => {
    const pdf = await ticket.drawTickets([view(1), view(2), { ...view(3), status: "void" }], standardFonts, { logo: null, name: "Maison Palettia", contactLines: ["hello@maison.test"] });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pageCount(pdf)).toBe(3);
  });
});

describe("fonts", () => {
  it("keeps WinAnsi text for the built-in fonts and replaces what Helvetica cannot draw", () => {
    const set = { body: "Helvetica", bold: "Helvetica-Bold", display: "Helvetica-Bold", standard: true };
    expect(fonts.safeText(set, "Café “quoted” — €5 · ok")).toBe("Café “quoted” — €5 · ok");
    expect(fonts.safeText(set, "لون 🎨")).toBe("??? ?");
    expect(fonts.safeText({ ...set, standard: false }, "لون")).toBe("لون");
  });
});
