import PDFDocument from "pdfkit";
import { APIError, type PayloadRequest } from "payload";
import QRCode from "qrcode";

import type { Experience, Order, Session, Ticket, Venue } from "@/payload-types";

import { collect, COLORS, dubaiWhen, loadBrand, type PdfBrand } from "./brand";
import { displayText, type FontSources, registerFonts, resolveFontSources, safeText } from "./fonts";

/**
 * ==========================================================================
 * Ticket PDF — one A5 page per seat, with its QR code (SPEC §H.7)
 * ==========================================================================
 *
 * Generated on demand and never stored: a ticket's content can change
 * (reschedule, holder name) and the QR it carries is in the database
 * anyway. The QR encodes `tickets.qr` — `mp1.<code>.<qrSig>`, minted once by
 * 3E when the ticket is issued and verified at the door by lookup, so this
 * file never computes a signature itself. A ticket that is void or refunded
 * still renders (staff may need to see it) but carries a red "NOT VALID"
 * band, and the customer download route refuses it before it gets here.
 *
 * Printed: the session (title in the brand script), the date and time in
 * Dubai, the venue and its address, the holder, "Seat n of qty", the code in
 * large tabular capitals for manual check-in, and the two lines from
 * Booking & checkout wording → Tickets (`ticket.heading`,
 * `ticket.instructions`).
 */

export interface TicketView {
  code: string;
  qr: string;
  status: Ticket["status"] | "sample";
  holderName: string;
  sessionTitle: string;
  when: string;
  venueName: string;
  venueAddress: string[];
  seatNo: number;
  qty: number;
  orderReference: string;
  heading: string;
  instructions: string;
}

const A5: [number, number] = [419.53, 595.28];
const MARGIN = 36;

async function qrPng(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { type: "png", errorCorrectionLevel: "M", margin: 1, width: 512, color: { dark: COLORS.charcoal, light: "#ffffff" } });
}

/** Pure renderer: one page per view. */
export async function drawTickets(views: TicketView[], sources: FontSources, brand: Pick<PdfBrand, "logo" | "name" | "contactLines">): Promise<Buffer> {
  if (!views.length) throw new Error("drawTickets: no tickets");
  const doc = new PDFDocument({ size: A5, margin: MARGIN, autoFirstPage: false, info: { Title: `Tickets ${views[0].orderReference}`.trim(), Author: brand.name } });
  const done = collect(doc);
  const fonts = registerFonts(doc, sources);
  const t = (value: unknown) => safeText(fonts, value);
  const qrs = await Promise.all(views.map((view) => qrPng(view.qr || view.code)));

  views.forEach((view, index) => {
    doc.addPage();
    const width = doc.page.width - MARGIN * 2;
    const left = MARGIN;
    let y = MARGIN;

    // Top band: logo on cream.
    doc.rect(0, 0, doc.page.width, 84).fill(COLORS.cream);
    if (brand.logo) {
      try {
        doc.image(brand.logo, left, 20, { fit: [140, 44] });
      } catch {
        doc.font(fonts.bold).fontSize(16).fillColor(COLORS.charcoal).text(t(brand.name), left, 36);
      }
    } else {
      doc.font(fonts.bold).fontSize(16).fillColor(COLORS.charcoal).text(t(brand.name), left, 36);
    }
    doc.font(fonts.bold).fontSize(8).fillColor(COLORS.lilac).text(view.status === "sample" ? "SAMPLE TICKET" : "TICKET", left, 32, { width, align: "right", characterSpacing: 2 });
    doc.font(fonts.body).fontSize(9).fillColor(COLORS.charcoal).text(t(`Seat ${view.seatNo} of ${view.qty}`), left, 46, { width, align: "right" });
    y = 104;

    if (view.status === "void" || view.status === "refunded" || view.status === "sample") {
      const label = view.status === "sample" ? "SAMPLE — NOT VALID FOR ENTRY" : `NOT VALID — ${view.status.toUpperCase()}`;
      doc.rect(left, y - 8, width, 22).fill(view.status === "sample" ? COLORS.lilac : "#b42318");
      doc.font(fonts.bold).fontSize(9).fillColor("#ffffff").text(label, left, y - 2, { width, align: "center", characterSpacing: 1 });
      y += 24;
    }

    // Session title in the brand script, then the facts.
    doc.font(fonts.display).fontSize(fonts.display === "mp-display" ? 30 : 20).fillColor(COLORS.charcoal);
    doc.text(displayText(fonts, view.sessionTitle), left, y, { width });
    y = doc.y + 6;
    doc.font(fonts.bold).fontSize(11).fillColor(COLORS.charcoal).text(t(view.when), left, y, { width });
    doc.font(fonts.body).fontSize(10).fillColor(COLORS.charcoal).text(t([view.venueName, ...view.venueAddress].filter(Boolean).join("\n")), { width, lineGap: 1.5 });
    y = doc.y + 14;

    // QR centred, code beneath it.
    const qrSize = view.status === "valid" || view.status === "checked_in" ? 176 : 156;
    const qrX = left + (width - qrSize) / 2;
    doc.roundedRect(qrX - 8, y - 8, qrSize + 16, qrSize + 16, 10).lineWidth(1).strokeColor(COLORS.line).stroke();
    doc.image(qrs[index], qrX, y, { width: qrSize, height: qrSize });
    y += qrSize + 18;
    doc.font(fonts.bold).fontSize(18).fillColor(COLORS.charcoal).text(t(view.code), left, y, { width, align: "center", characterSpacing: 2 });
    y = doc.y + 2;
    doc.font(fonts.body).fontSize(8.5).fillColor(COLORS.muted).text("Code for manual check-in", left, y, { width, align: "center" });
    y = doc.y + 14;

    // Holder and booking.
    doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(COLORS.line).stroke();
    y += 10;
    const half = (width - 12) / 2;
    doc.font(fonts.body).fontSize(7.5).fillColor(COLORS.muted).text("GUEST", left, y, { characterSpacing: 1 });
    doc.font(fonts.bold).fontSize(11).fillColor(COLORS.charcoal).text(t(view.holderName || "—"), left, y + 11, { width: half });
    doc.font(fonts.body).fontSize(7.5).fillColor(COLORS.muted).text("BOOKING", left + half + 12, y, { characterSpacing: 1 });
    doc.font(fonts.bold).fontSize(11).fillColor(COLORS.charcoal).text(t(view.orderReference || "—"), left + half + 12, y + 11, { width: half });
    y += 38;

    // Wording from Booking & checkout wording → Tickets.
    if (view.heading) {
      doc.font(fonts.bold).fontSize(11).fillColor(COLORS.lilac).text(t(view.heading), left, y, { width });
      y = doc.y + 3;
    }
    if (view.instructions) doc.font(fonts.body).fontSize(9).fillColor(COLORS.charcoal).text(t(view.instructions), left, y, { width, lineGap: 1.5 });

    // Footer: contact, inside the bottom margin — which pdfkit would
    // otherwise treat as overflow and answer with a blank extra page.
    const footer = [brand.name, ...brand.contactLines].filter(Boolean).join("  ·  ");
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font(fonts.body).fontSize(7.5).fillColor(COLORS.muted).text(t(footer), left, doc.page.height - 26, { width, align: "center", lineBreak: false });
    doc.page.margins.bottom = bottomMargin;
  });

  doc.end();
  return done;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Loading                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const relId = (value: unknown): string | undefined =>
  typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as { id: unknown }).id) : undefined;

async function ticketWording(req: PayloadRequest): Promise<{ heading: string; instructions: string }> {
  const booking = (await req.payload.findGlobal({ slug: "booking-settings", depth: 0, overrideAccess: true, req }).catch(() => null)) as {
    ticket?: { heading?: string | null; instructions?: string | null };
  } | null;
  return { heading: booking?.ticket?.heading ?? "", instructions: booking?.ticket?.instructions ?? "" };
}

async function sessionFacts(req: PayloadRequest, sessionId: string | undefined, fallbackTitle: string) {
  const session = sessionId
    ? ((await req.payload.findByID({ collection: "sessions", id: sessionId, depth: 1, draft: false, overrideAccess: true, req }).catch(() => null)) as Session | null)
    : null;
  const experience = session && typeof session.experience === "object" ? (session.experience as Experience) : null;
  const venue = session && typeof session.venue === "object" ? (session.venue as Venue | null) : null;
  return {
    title: session?.title || (experience as { title?: string } | null)?.title || fallbackTitle || "Your session",
    when: dubaiWhen(session?.startsAt, session?.durationMinutes),
    venueName: venue?.name ?? "",
    venueAddress: (venue?.address ?? []).map((row) => row.line).filter(Boolean),
  };
}

function viewFor(ticket: Ticket, order: Order | null, facts: Awaited<ReturnType<typeof sessionFacts>>, wording: { heading: string; instructions: string }): TicketView {
  const line = order?.lines?.[ticket.lineIndex];
  return {
    code: ticket.code,
    // `qr` is minted by 3E at issue; a ticket without one still scans by code.
    qr: ticket.qr || (ticket.qrSig ? `mp1.${ticket.code}.${ticket.qrSig}` : ticket.code),
    status: ticket.status,
    holderName: ticket.holderName || [order?.contact?.firstName, order?.contact?.lastName].filter(Boolean).join(" "),
    sessionTitle: facts.title,
    when: facts.when || dubaiWhen(line?.startsAt, line?.durationMinutes),
    venueName: facts.venueName || line?.venueName || "",
    venueAddress: facts.venueAddress,
    seatNo: ticket.seatNo,
    qty: line?.qty ?? ticket.seatNo,
    orderReference: order?.reference ?? "",
    heading: wording.heading,
    instructions: wording.instructions,
  };
}

async function viewsForTickets(req: PayloadRequest, tickets: Ticket[]): Promise<TicketView[]> {
  const wording = await ticketWording(req);
  const orders = new Map<string, Order | null>();
  const sessions = new Map<string, Awaited<ReturnType<typeof sessionFacts>>>();
  const views: TicketView[] = [];
  for (const ticket of tickets) {
    const orderId = relId(ticket.order);
    if (orderId && !orders.has(orderId)) {
      orders.set(orderId, (await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true, req }).catch(() => null)) as Order | null);
    }
    const order = orderId ? (orders.get(orderId) ?? null) : null;
    const sessionId = relId(ticket.session);
    const key = sessionId ?? `line:${ticket.lineIndex}`;
    if (!sessions.has(key)) sessions.set(key, await sessionFacts(req, sessionId, order?.lines?.[ticket.lineIndex]?.title ?? ""));
    views.push(viewFor(ticket, order, sessions.get(key)!, wording));
  }
  return views;
}

/** SPEC §O `renderTicketPdf`. Selects `qr` with overrideAccess (it is admin-read only in REST). */
export async function renderTicketPdf(req: PayloadRequest, ticketId: string): Promise<Buffer> {
  const ticket = (await req.payload.findByID({ collection: "tickets", id: ticketId, depth: 0, overrideAccess: true, req }).catch(() => null)) as Ticket | null;
  if (!ticket) throw new APIError("Ticket not found.", 404, undefined, true);
  const [views, sources, brand] = await Promise.all([viewsForTickets(req, [ticket]), resolveFontSources(req), loadBrand(req)]);
  return drawTickets(views, sources, brand);
}

/**
 * Every still-valid ticket of an order in one PDF (the confirmation
 * attachment and the "all tickets" download). `null` when the order has
 * none — a pass-only purchase, or tickets not issued yet.
 */
export async function renderOrderTicketsPdf(req: PayloadRequest, orderId: string): Promise<{ pdf: Buffer; reference: string; count: number } | null> {
  const result = await req.payload.find({
    collection: "tickets",
    where: { and: [{ order: { equals: orderId } }, { status: { in: ["valid", "checked_in"] } }] },
    sort: "lineIndex",
    limit: 200,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  });
  const tickets = (result.docs as Ticket[]).sort((a, b) => a.lineIndex - b.lineIndex || a.seatNo - b.seatNo);
  if (!tickets.length) return null;
  const [views, sources, brand] = await Promise.all([viewsForTickets(req, tickets), resolveFontSources(req), loadBrand(req)]);
  return { pdf: await drawTickets(views, sources, brand), reference: views[0].orderReference || "booking", count: tickets.length };
}

/**
 * SPEC §O `renderSampleTicketPdf` — the **Preview ticket PDF** button on
 * Booking & checkout wording: the unsaved heading and instructions on a
 * clearly marked sample (fake code, a QR that no scanner accepts).
 */
export async function renderSampleTicketPdf(req: PayloadRequest, ticketCopy: { heading: string; instructions: string }): Promise<Buffer> {
  const [sources, brand] = await Promise.all([resolveFontSources(req), loadBrand(req)]);
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 7);
  start.setUTCHours(6, 0, 0, 0); // 10:00 in Dubai
  const view: TicketView = {
    code: "MPT-SAMPLE00",
    qr: "mp1.MPT-SAMPLE00.sample-not-valid",
    status: "sample",
    holderName: "Layla Haddad",
    sessionTitle: "Candle Making",
    when: dubaiWhen(start.toISOString(), 120),
    venueName: "Times Square Center",
    venueAddress: ["Sheikh Zayed Road", "Dubai"],
    seatNo: 1,
    qty: 2,
    orderReference: "MP-SAMPLE",
    heading: String(ticketCopy.heading ?? "").slice(0, 60),
    instructions: String(ticketCopy.instructions ?? "").slice(0, 300),
  };
  return drawTickets([view], sources, brand);
}
