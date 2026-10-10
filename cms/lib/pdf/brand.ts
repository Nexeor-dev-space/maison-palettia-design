import { existsSync, promises as fs } from "node:fs";
import path from "node:path";

import type { PayloadRequest } from "payload";
import sharp from "sharp";

import { MEDIA_DIR, PROJECT_ROOT } from "@/cms/lib/paths";
import type { InvoiceSetting, Media, SiteSetting } from "@/payload-types";

/**
 * ==========================================================================
 * Shared pieces of the PDFs: the logo, Site details, dates, the byte sink
 * ==========================================================================
 *
 * The logo is Settings → Invoices & VAT → Logo, else Site details → Logo
 * (on light), else the static /images/logo.png the admin falls back to.
 * pdfkit embeds only PNG and JPEG, so anything else (SVG, WebP) is
 * rasterised with sharp at 600 px wide — enough for 300 dpi at the size it
 * prints — and the result is cached by media id + update time.
 */

export interface PdfBrand {
  name: string;
  logo: Buffer | null;
  contactLines: string[];
  url: string;
}

const logoCache = new Map<string, Buffer | null>();

async function mediaDoc(req: PayloadRequest, value: unknown): Promise<Media | null> {
  if (value && typeof value === "object" && "filename" in value) return value as Media;
  const id = typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? String((value as Media).id) : null;
  if (!id) return null;
  return (await req.payload.findByID({ collection: "media", id, depth: 0, overrideAccess: true, req }).catch(() => null)) as Media | null;
}

async function toPdfImage(file: string, mimeType: string | null | undefined): Promise<Buffer | null> {
  try {
    const raw = await fs.readFile(file);
    if (mimeType === "image/png" || mimeType === "image/jpeg") return raw;
    return await sharp(raw, { density: 300 }).resize({ width: 600, withoutEnlargement: false }).png().toBuffer();
  } catch {
    return null;
  }
}

export async function loadBrand(req: PayloadRequest): Promise<PdfBrand> {
  const [invoice, site] = await Promise.all([
    req.payload.findGlobal({ slug: "invoice-settings", depth: 0, overrideAccess: true, req }).catch(() => null) as Promise<InvoiceSetting | null>,
    req.payload.findGlobal({ slug: "site-settings", depth: 0, overrideAccess: true, req }).catch(() => null) as Promise<SiteSetting | null>,
  ]);

  let logo: Buffer | null = null;
  const media = (await mediaDoc(req, invoice?.logo)) ?? (await mediaDoc(req, site?.logoOnLight));
  if (media?.filename) {
    const cacheKey = `${media.id}:${media.updatedAt}`;
    if (logoCache.has(cacheKey)) logo = logoCache.get(cacheKey) ?? null;
    else {
      logo = await toPdfImage(path.join(MEDIA_DIR, path.basename(media.filename)), media.mimeType);
      logoCache.set(cacheKey, logo);
    }
  }
  if (!logo) {
    const fallback = path.join(PROJECT_ROOT, "public/images/logo.png");
    if (existsSync(fallback)) logo = await fs.readFile(fallback).catch(() => null);
  }

  const contact = site?.contact;
  return {
    name: site?.name || "Maison Palettia",
    logo,
    contactLines: [contact?.email, contact?.phone].filter((line): line is string => Boolean(line)),
    url: site?.publicUrl ?? "",
  };
}

/** Collects a pdfkit document into one Buffer; rejects if pdfkit errors while finishing. */
export function collect(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

const DATE = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "long", year: "numeric" });
const WEEKDAY_DATE = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", weekday: "long", day: "numeric", month: "long", year: "numeric" });
const TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hour12: false });

/** "10 October 2026" in Dubai. */
export const dubaiDate = (iso: string | Date | null | undefined): string => (iso ? DATE.format(new Date(iso)) : "");

/** "Saturday 11 October 2026 · 10:00–12:00" in Dubai. */
export function dubaiWhen(startsAt: string | null | undefined, durationMinutes?: number | null): string {
  if (!startsAt) return "";
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return "";
  const end = durationMinutes ? new Date(start.getTime() + durationMinutes * 60_000) : null;
  return `${WEEKDAY_DATE.format(start).replace(",", "")} · ${TIME.format(start)}${end ? `–${TIME.format(end)}` : ""}`;
}

/** Brand colours, as on the site (app/(site)/globals.css). */
export const COLORS = {
  lilac: "#9059a4",
  charcoal: "#2d3748",
  muted: "#6b6f7b",
  line: "#d9d3e3",
  cream: "#efe2ca",
  sage: "#d1e7be",
} as const;
