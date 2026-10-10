import { createHash } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";
import type { PayloadRequest } from "payload";

import { MEDIA_DIR, PROJECT_ROOT } from "@/cms/lib/paths";
import type { InvoiceSetting, Media } from "@/payload-types";

/**
 * ==========================================================================
 * Fonts for the invoice and ticket PDFs (SPEC §C.3 invoice-settings.pdfFonts)
 * ==========================================================================
 *
 * In order of preference, per face:
 *
 *   1. the TTF/OTF an admin uploaded to Media and picked in Settings →
 *      Invoices & VAT → PDF appearance → Fonts — no redeploy to change it;
 *   2. Inter, bundled at cms/pdf/fonts/Inter-{Regular,Bold}.ttf (SPEC §A.3),
 *      when those files are present in the checkout;
 *   3. pdfkit's built-in Helvetica / Helvetica-Bold.
 *
 * The display face (the session title on a ticket, the document title on
 * an invoice) is the brand script the site already ships,
 * public/fonts/HapshaSophiaScript_01.otf, falling back to the bold face.
 *
 * EVERY CANDIDATE IS TRIED BEFORE IT IS TRUSTED. pdfkit embeds fonts when
 * the document ends, and a font it cannot subset (a variable font, some
 * WOFF2 files — Montserrat-Variable-latin.woff2 crashes fontkit's encoder,
 * verified) throws from `doc.end()`, i.e. after the whole page was laid
 * out and with no way to recover the document. So each font is rendered
 * once into a throwaway document; one that fails is skipped with a log
 * line, and the result is cached by the SHA-256 of the file's bytes — the
 * "cached by file hash" of §C.3 — so an uploaded replacement is picked up on
 * the next render and an unchanged file is never re-tested.
 *
 * HELVETICA HAS NO ARABIC (or anything beyond Windows-1252). When the
 * standard fonts are in use, text goes through `safeText`, which keeps the
 * Latin-1 range and the handful of typographic characters WinAnsi adds
 * (curly quotes, dashes, bullet, ellipsis, €) and replaces the rest with
 * "?" — a legible receipt with a question mark beats bytes that render as
 * garbage. Uploading a font with the needed glyphs removes the limitation.
 */

export interface PdfFontSet {
  /** Font names registered on the document. */
  body: string;
  bold: string;
  display: string;
  /** True when body/bold are the built-in Helvetica (WinAnsi only). */
  standard: boolean;
}

const BUNDLED = {
  regular: path.join(PROJECT_ROOT, "cms/pdf/fonts/Inter-Regular.ttf"),
  bold: path.join(PROJECT_ROOT, "cms/pdf/fonts/Inter-Bold.ttf"),
  display: path.join(PROJECT_ROOT, "public/fonts/HapshaSophiaScript_01.otf"),
};

const verdicts = new Map<string, boolean>();
const fileCache = new Map<string, { mtimeMs: number; size: number; buffer: Buffer }>();

async function readCached(file: string): Promise<Buffer | null> {
  try {
    const stat = await fs.stat(file);
    const hit = fileCache.get(file);
    if (hit && hit.mtimeMs === stat.mtimeMs && hit.size === stat.size) return hit.buffer;
    const buffer = await fs.readFile(file);
    fileCache.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, buffer });
    return buffer;
  } catch {
    return null;
  }
}

/** Renders a line with the font into a scratch document; true if pdfkit can embed it. */
async function usable(buffer: Buffer): Promise<boolean> {
  const hash = createHash("sha256").update(buffer).digest("hex");
  const known = verdicts.get(hash);
  if (known !== undefined) return known;
  const ok = await new Promise<boolean>((resolve) => {
    try {
      const doc = new PDFDocument({ size: [200, 100], margin: 0 });
      doc.on("data", () => undefined);
      doc.on("end", () => resolve(true));
      doc.on("error", () => resolve(false));
      doc.registerFont("probe", buffer);
      doc.font("probe").fontSize(10).text("Maison Palettia AED 1,234.00 — “Tax Invoice”");
      doc.end();
    } catch {
      resolve(false);
    }
  });
  verdicts.set(hash, ok);
  return ok;
}

async function mediaFont(req: PayloadRequest, value: unknown): Promise<Buffer | null> {
  const media = (value && typeof value === "object" ? value : null) as Media | null;
  const id = typeof value === "string" ? value : media?.id;
  if (!id) return null;
  const doc = media?.filename ? media : ((await req.payload.findByID({ collection: "media", id, depth: 0, overrideAccess: true, req }).catch(() => null)) as Media | null);
  if (!doc?.filename) return null;
  const buffer = await readCached(path.join(MEDIA_DIR, path.basename(doc.filename)));
  if (!buffer) return null;
  if (await usable(buffer)) return buffer;
  req.payload.logger.warn({ media: id, filename: doc.filename }, "pdf: the uploaded font cannot be embedded (variable or WOFF2?) — using the fallback");
  return null;
}

async function bundled(file: string): Promise<Buffer | null> {
  if (!existsSync(file)) return null;
  const buffer = await readCached(file);
  return buffer && (await usable(buffer)) ? buffer : null;
}

export interface FontSources {
  regular: Buffer | null;
  bold: Buffer | null;
  display: Buffer | null;
}

/** Resolves the three faces for this render (reads invoice-settings). */
export async function resolveFontSources(req: PayloadRequest): Promise<FontSources> {
  let settings: InvoiceSetting | null = null;
  try {
    settings = (await req.payload.findGlobal({ slug: "invoice-settings", depth: 0, overrideAccess: true, req })) as InvoiceSetting;
  } catch {
    settings = null;
  }
  const regular = (await mediaFont(req, settings?.pdfFonts?.regular)) ?? (await bundled(BUNDLED.regular));
  const bold = (await mediaFont(req, settings?.pdfFonts?.bold)) ?? (await bundled(BUNDLED.bold)) ?? regular;
  const display = await bundled(BUNDLED.display);
  return { regular, bold, display };
}

/** Registers the faces on `doc` and says which names to use. */
export function registerFonts(doc: PDFKit.PDFDocument, sources: FontSources): PdfFontSet {
  if (sources.regular) {
    doc.registerFont("mp-body", sources.regular);
    doc.registerFont("mp-bold", sources.bold ?? sources.regular);
  }
  if (sources.display) doc.registerFont("mp-display", sources.display);
  const standard = !sources.regular;
  const body = standard ? "Helvetica" : "mp-body";
  const bold = standard ? "Helvetica-Bold" : "mp-bold";
  return { body, bold, display: sources.display ? "mp-display" : bold, standard };
}

// Windows-1252 additions over Latin-1 that Helvetica's AFM metrics cover.
const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ".split(""));

/** Text the font can draw: unchanged for embedded fonts, WinAnsi-only for Helvetica. */
export function safeText(fonts: PdfFontSet, value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (!fonts.standard) return text;
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code === 0x2192) out += "->";
    else if (code === 0x00b7 || (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || code === 0x0a || WIN_ANSI_EXTRA.has(char)) out += char;
    else if (code === 0x2009 || code === 0x202f || code === 0x2007) out += " ";
    else out += "?";
  }
  return out;
}

/** The display script has no digits worth reading at small sizes; titles only. */
export function displayText(fonts: PdfFontSet, value: unknown): string {
  return fonts.display === "mp-display" ? String(value ?? "") : safeText(fonts, value);
}
