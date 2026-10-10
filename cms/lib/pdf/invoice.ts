import { promises as fs } from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";
import { APIError, type PayloadRequest } from "payload";

import { lexicalToEmailText } from "@/cms/email/render";
import type { Attachment } from "@/cms/lib/contracts";
import { formatAed } from "@/cms/lib/money";
import { PRIVATE_DIR } from "@/cms/lib/paths";
import type { Invoice, InvoiceFile, InvoiceSetting, Order, Payment, Refund } from "@/payload-types";

import { collect, COLORS, dubaiDate, loadBrand, type PdfBrand } from "./brand";
import { type FontSources, type PdfFontSet, registerFonts, resolveFontSources, safeText } from "./fonts";

/**
 * ==========================================================================
 * Invoice / receipt / credit note PDF (SPEC §H.7)
 * ==========================================================================
 *
 * Drawn with pdfkit from the INVOICE ROW, never from the live order or the
 * live settings: the seller block, buyer, lines and totals were snapshotted
 * when the number was issued (3A-1 `issueInvoice`), so re-rendering a 2026
 * invoice in 2028 prints what was true in 2026 even if the legal name, the
 * VAT rate or the price has changed since. Only the footer note and the
 * logo/fonts — presentation, not tax content — come from today's
 * Settings → Invoices & VAT.
 *
 * TITLE. "Tax Invoice" when the snapshot carries a TRN (UAE simplified tax
 * invoice for B2C ≤ AED 10,000: seller name, address, TRN, number, date,
 * description, net, VAT rate and amount, gross); without a TRN the studio
 * is not VAT-registered yet and the document is a "Receipt" with no VAT
 * columns (SPEC §C.3). Credit notes are titled "Tax Credit Note" / "Credit
 * Note" and name the invoice they correct.
 *
 * `drawInvoice` is pure (data + fonts in, bytes out) so the unit tests can
 * render one without a database; `renderInvoicePdf` is the §O contract that
 * loads the row and calls it.
 */

export interface InvoiceView {
  kind: "invoice" | "credit_note";
  number: string;
  issuedAt: string | null;
  orderReference: string;
  /** "Mamo Pay · card ****1157", "Paid at venue (cash)", "Complimentary" (+ the Mamo payment id when online). */
  paymentLabel: string;
  seller: { legalName: string; trn: string; tradeLicenceNumber: string; addressLines: string[]; email: string; phone: string };
  buyer: { name: string; email: string };
  lines: Array<{ description: string; qty: number; unitNetFils: number; netFils: number; vatFils: number; grossFils: number }>;
  totals: { netFils: number; vatFils: number; grossFils: number; discountFils: number };
  vatRateBps: number;
  /** Credit notes: the invoice being credited, and why. */
  originalNumber?: string;
  refundReason?: string;
  footerNote?: string;
}

const PAGE = { size: "A4" as const, margin: 48 };

export function invoiceTitle(view: Pick<InvoiceView, "kind" | "seller">): string {
  const taxed = Boolean(view.seller.trn);
  if (view.kind === "credit_note") return taxed ? "Tax Credit Note" : "Credit Note";
  return taxed ? "Tax Invoice" : "Receipt";
}

const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;

/** Pure renderer. */
export async function drawInvoice(view: InvoiceView, sources: FontSources, brand: Pick<PdfBrand, "logo" | "name">): Promise<Buffer> {
  const doc = new PDFDocument({ size: PAGE.size, margin: PAGE.margin, info: { Title: `${invoiceTitle(view)} ${view.number}`, Author: view.seller.legalName || brand.name } });
  const done = collect(doc);
  const fonts = registerFonts(doc, sources);
  const t = (value: unknown) => safeText(fonts, value);
  const left = PAGE.margin;
  const right = doc.page.width - PAGE.margin;
  const width = right - left;
  const taxed = Boolean(view.seller.trn);
  const money = (fils: number) => formatAed(fils);

  // ── header: logo left, title + number right ──
  let top = PAGE.margin;
  if (brand.logo) {
    try {
      doc.image(brand.logo, left, top, { fit: [150, 56] });
    } catch {
      doc.font(fonts.bold).fontSize(18).fillColor(COLORS.charcoal).text(t(brand.name), left, top);
    }
  } else {
    doc.font(fonts.bold).fontSize(18).fillColor(COLORS.charcoal).text(t(brand.name), left, top);
  }
  doc.font(fonts.bold).fontSize(22).fillColor(COLORS.lilac).text(t(invoiceTitle(view)), left, top, { width, align: "right" });
  doc.font(fonts.body).fontSize(10).fillColor(COLORS.charcoal);
  const meta: Array<[string, string]> = [
    [view.kind === "credit_note" ? "Credit note no." : taxed ? "Invoice no." : "Receipt no.", view.number],
    ["Date", dubaiDate(view.issuedAt)],
    ["Booking", view.orderReference],
  ];
  if (view.originalNumber) meta.push(["Credits invoice", view.originalNumber]);
  let metaY = top + 30;
  for (const [label, value] of meta) {
    doc.font(fonts.body).fillColor(COLORS.muted).text(t(`${label}  `), left, metaY, { width: width - 140, align: "right", continued: false });
    doc.font(fonts.bold).fillColor(COLORS.charcoal).text(t(value), right - 140, metaY, { width: 140, align: "right" });
    metaY += 14;
  }

  // ── seller and buyer ──
  top = Math.max(metaY, top + 70) + 18;
  doc.moveTo(left, top).lineTo(right, top).lineWidth(0.6).strokeColor(COLORS.line).stroke();
  top += 14;
  const colW = (width - 24) / 2;
  const sellerLines = [
    ...view.seller.addressLines,
    view.seller.trn ? `TRN ${view.seller.trn}` : "",
    view.seller.tradeLicenceNumber ? `Trade licence ${view.seller.tradeLicenceNumber}` : "",
    view.seller.email,
    view.seller.phone,
  ].filter(Boolean);
  doc.font(fonts.body).fontSize(8).fillColor(COLORS.muted).text("FROM", left, top, { characterSpacing: 1 });
  doc.font(fonts.bold).fontSize(11).fillColor(COLORS.charcoal).text(t(view.seller.legalName || brand.name), left, top + 12, { width: colW });
  doc.font(fonts.body).fontSize(9.5).fillColor(COLORS.charcoal).text(t(sellerLines.join("\n")), { width: colW, lineGap: 1.5 });
  const sellerBottom = doc.y;
  const bx = left + colW + 24;
  doc.font(fonts.body).fontSize(8).fillColor(COLORS.muted).text("BILLED TO", bx, top, { characterSpacing: 1 });
  doc.font(fonts.bold).fontSize(11).fillColor(COLORS.charcoal).text(t(view.buyer.name || "Customer"), bx, top + 12, { width: colW });
  doc.font(fonts.body).fontSize(9.5).text(t(view.buyer.email), { width: colW });
  top = Math.max(sellerBottom, doc.y) + 22;

  // ── lines ──
  const cols = taxed
    ? [
        { key: "description", label: "Description", w: 0, align: "left" as const },
        { key: "qty", label: "Qty", w: 34, align: "right" as const },
        { key: "unit", label: "Unit (net)", w: 70, align: "right" as const },
        { key: "net", label: "Net", w: 70, align: "right" as const },
        { key: "vat", label: `VAT ${pct(view.vatRateBps)}`, w: 64, align: "right" as const },
        { key: "gross", label: "Total", w: 74, align: "right" as const },
      ]
    : [
        { key: "description", label: "Description", w: 0, align: "left" as const },
        { key: "qty", label: "Qty", w: 40, align: "right" as const },
        { key: "unitGross", label: "Unit price", w: 90, align: "right" as const },
        { key: "gross", label: "Amount", w: 90, align: "right" as const },
      ];
  cols[0].w = width - cols.slice(1).reduce((sum, col) => sum + col.w, 0);

  const header = (y: number) => {
    doc.rect(left, y, width, 20).fill(COLORS.cream);
    let x = left;
    doc.font(fonts.bold).fontSize(8.5).fillColor(COLORS.charcoal);
    for (const col of cols) {
      doc.text(t(col.label), x + 6, y + 6, { width: col.w - 12, align: col.align });
      x += col.w;
    }
    return y + 26;
  };

  let y = header(top);
  doc.font(fonts.body).fontSize(9.5).fillColor(COLORS.charcoal);
  for (const line of view.lines) {
    const unitGross = line.qty ? Math.round(line.grossFils / line.qty) : line.grossFils;
    const cells: Record<string, string> = {
      description: line.description,
      qty: String(line.qty),
      unit: money(line.unitNetFils),
      net: money(line.netFils),
      vat: money(line.vatFils),
      gross: money(line.grossFils),
      unitGross: money(unitGross),
    };
    const rowH = Math.max(14, doc.heightOfString(t(cells.description), { width: cols[0].w - 12 })) + 8;
    if (y + rowH > doc.page.height - 200) {
      doc.addPage();
      y = header(PAGE.margin);
      doc.font(fonts.body).fontSize(9.5).fillColor(COLORS.charcoal);
    }
    let x = left;
    for (const col of cols) {
      doc.text(t(cells[col.key]), x + 6, y, { width: col.w - 12, align: col.align });
      x += col.w;
    }
    y += rowH;
    doc.moveTo(left, y - 4).lineTo(right, y - 4).lineWidth(0.4).strokeColor(COLORS.line).stroke();
  }

  // ── totals ──
  y += 8;
  const totals: Array<[string, string, boolean]> = [];
  if (view.totals.discountFils) totals.push(["Discount (included above)", `– ${money(Math.abs(view.totals.discountFils))}`, false]);
  if (taxed) {
    totals.push(["Total excluding VAT", money(view.totals.netFils), false]);
    totals.push([`VAT ${pct(view.vatRateBps)}`, money(view.totals.vatFils), false]);
  }
  totals.push([view.kind === "credit_note" ? "Total credited" : "Total paid", money(view.totals.grossFils), true]);
  const labelW = 170;
  const valueW = 100;
  for (const [label, value, strong] of totals) {
    doc.font(strong ? fonts.bold : fonts.body).fontSize(strong ? 11.5 : 9.5).fillColor(strong ? COLORS.lilac : COLORS.charcoal);
    doc.text(t(label), right - labelW - valueW, y, { width: labelW, align: "right" });
    doc.text(t(value), right - valueW, y, { width: valueW, align: "right" });
    y += strong ? 18 : 14;
  }

  // ── payment and notes ──
  y += 14;
  doc.font(fonts.body).fontSize(9).fillColor(COLORS.charcoal);
  const notes = [
    view.paymentLabel ? `Payment: ${view.paymentLabel}` : "",
    view.refundReason ? `Reason: ${view.refundReason}` : "",
    taxed && view.vatRateBps > 0 ? `Prices include ${pct(view.vatRateBps)} VAT.` : "",
    "Amounts in UAE dirhams (AED).",
  ].filter(Boolean);
  doc.text(t(notes.join("\n")), left, y, { width, lineGap: 2 });
  if (view.footerNote) {
    doc.moveDown(1.2);
    doc.font(fonts.body).fontSize(8.5).fillColor(COLORS.muted).text(t(view.footerNote), { width, lineGap: 1.5 });
  }

  doc.end();
  return done;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Loading                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const relId = (value: unknown): string | undefined =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : undefined;

const REFUND_REASONS: Record<string, string> = {
  customer_request: "Customer request",
  session_cancelled: "Session cancelled",
  post_expiry_payment: "Payment received after the booking expired",
  duplicate: "Duplicate payment",
  goodwill: "Goodwill",
  other: "Other",
};

/** Builds the view from the invoice row and its order/payment/refund. */
export async function loadInvoiceView(req: PayloadRequest, invoiceId: string): Promise<{ view: InvoiceView; invoice: Invoice }> {
  const invoice = (await req.payload.findByID({ collection: "invoices", id: invoiceId, depth: 0, overrideAccess: true, req }).catch(() => null)) as Invoice | null;
  if (!invoice) throw new APIError("Invoice not found.", 404, undefined, true);

  const orderId = relId(invoice.order);
  const order = orderId ? ((await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req }).catch(() => null)) as Order | null) : null;

  let paymentLabel = invoice.paymentLabel ?? "";
  const paymentId = relId(order?.payment);
  if (paymentId) {
    const payment = (await req.payload.findByID({ collection: "payments", id: paymentId, depth: 0, overrideAccess: true, req }).catch(() => null)) as Payment | null;
    if (payment?.provider === "mamo" && payment.providerPaymentId && !paymentLabel.includes(payment.providerPaymentId)) {
      paymentLabel = `${paymentLabel || "Mamo Pay"} · payment ${payment.providerPaymentId}`;
    }
  }

  let originalNumber: string | undefined;
  let refundReason: string | undefined;
  if (invoice.kind === "credit_note") {
    const originalId = relId(order?.invoice);
    if (originalId && originalId !== invoice.id) {
      const original = (await req.payload.findByID({ collection: "invoices", id: originalId, depth: 0, overrideAccess: true, req }).catch(() => null)) as Invoice | null;
      originalNumber = original?.number;
    }
    const refundId = relId(invoice.refund);
    if (refundId) {
      const refund = (await req.payload.findByID({ collection: "refunds", id: refundId, depth: 0, overrideAccess: true, req }).catch(() => null)) as Refund | null;
      refundReason = refund?.reason ? (REFUND_REASONS[refund.reason] ?? refund.reason) : undefined;
    }
  }

  const settings = (await req.payload.findGlobal({ slug: "invoice-settings", depth: 0, overrideAccess: true, req }).catch(() => null)) as InvoiceSetting | null;
  const footerNote = settings?.footerNote ? lexicalToEmailText(settings.footerNote) : "";

  const seller = invoice.seller ?? {};
  const view: InvoiceView = {
    kind: invoice.kind,
    number: invoice.number,
    issuedAt: invoice.issuedAt ?? invoice.createdAt,
    orderReference: order?.reference ?? "",
    paymentLabel,
    seller: {
      legalName: seller.legalName ?? "",
      trn: seller.trn ?? "",
      tradeLicenceNumber: seller.tradeLicenceNumber ?? "",
      addressLines: (seller.addressLines ?? []).map((row) => row.line).filter(Boolean),
      email: seller.email ?? "",
      phone: seller.phone ?? "",
    },
    buyer: { name: invoice.buyer?.name ?? "", email: invoice.buyer?.email ?? "" },
    lines: (invoice.lines ?? []).map((line) => ({
      description: line.description,
      qty: line.qty,
      unitNetFils: line.unitNetFils,
      netFils: line.netFils,
      vatFils: line.vatFils,
      grossFils: line.grossFils,
    })),
    totals: {
      netFils: invoice.totals?.netFils ?? 0,
      vatFils: invoice.totals?.vatFils ?? 0,
      grossFils: invoice.totals?.grossFils ?? 0,
      discountFils: invoice.totals?.discountFils ?? 0,
    },
    vatRateBps: seller.vatRateBps ?? 500,
    originalNumber,
    refundReason,
    footerNote,
  };
  return { view, invoice };
}

/** SPEC §O `renderInvoicePdf`. */
export async function renderInvoicePdf(req: PayloadRequest, invoiceId: string): Promise<Buffer> {
  const [{ view }, sources, brand] = await Promise.all([loadInvoiceView(req, invoiceId), resolveFontSources(req), loadBrand(req)]);
  return drawInvoice(view, sources, brand);
}

export const INVOICE_DIR = path.join(PRIVATE_DIR, "invoices");

/** The stored PDF for an invoice, if 3D's `generate-invoice-pdf` has written one and the file is on disk. */
export async function readStoredInvoicePdf(req: PayloadRequest, invoice: Pick<Invoice, "file">): Promise<Buffer | null> {
  const fileId = relId(invoice.file);
  if (!fileId) return null;
  const file = (await req.payload.findByID({ collection: "invoice-files", id: fileId, depth: 0, overrideAccess: true, req }).catch(() => null)) as InvoiceFile | null;
  if (!file?.filename) return null;
  return fs.readFile(path.join(INVOICE_DIR, path.basename(file.filename))).catch(() => null);
}

/** The PDF as an email attachment: the stored file when there is one, else rendered now. */
export async function invoiceAttachment(req: PayloadRequest, invoiceId: string): Promise<Attachment> {
  const invoice = (await req.payload.findByID({ collection: "invoices", id: invoiceId, depth: 0, overrideAccess: true, req })) as Invoice;
  const content = (await readStoredInvoicePdf(req, invoice)) ?? (await renderInvoicePdf(req, invoiceId));
  return { filename: `${invoice.number}.pdf`, content, contentType: "application/pdf" };
}

/**
 * Renders the PDF and stores it as an `invoice-files` upload linked from
 * the invoice (`file`, `generatedAt` — the two fields the immutability hook
 * leaves writable). Idempotent: an invoice that already has a file is left
 * alone unless `force` (the admin's "Regenerate invoice PDF"). For 3D's
 * `generate-invoice-pdf` task.
 */
export async function storeInvoicePdf(req: PayloadRequest, invoiceId: string, opts: { force?: boolean } = {}): Promise<{ fileId: string; created: boolean }> {
  const invoice = (await req.payload.findByID({ collection: "invoices", id: invoiceId, depth: 0, overrideAccess: true, req })) as Invoice;
  const existing = relId(invoice.file);
  if (existing && !opts.force) return { fileId: existing, created: false };
  const pdf = await renderInvoicePdf(req, invoiceId);
  const stored = await req.payload.create({
    collection: "invoice-files",
    data: { invoice: invoiceId },
    file: { data: pdf, mimetype: "application/pdf", name: `${invoice.number}.pdf`, size: pdf.length },
    overrideAccess: true,
    depth: 0,
    req,
    context: { system: true },
  });
  await req.payload.update({
    collection: "invoices",
    id: invoiceId,
    data: { file: String(stored.id), generatedAt: new Date().toISOString() },
    overrideAccess: true,
    depth: 0,
    req,
    context: { system: true },
  });
  return { fileId: String(stored.id), created: true };
}

export type { PdfFontSet };
