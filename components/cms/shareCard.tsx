/* eslint-disable @next/next/no-img-element -- Satori draws plain <img>; next/image has no meaning inside an ImageResponse. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import PDFDocument from "pdfkit";
import type { ReactNode } from "react";

import { imageDataUri, tintedImageDataUri, type TintedImage } from "@/components/cms/ogImage";
import { INK } from "@/components/sections/hero/composition";
import { BRAND_LOGO } from "@/lib/constants";
import { getBrandLogo } from "@/lib/constants.server";
import { SHARE_CARD_SIZE } from "@/lib/seo";

/**
 * ==========================================================================
 * THE SITE'S SHARE CARDS — one look, drawn here, used by every card route
 * ==========================================================================
 *
 * The four generated link previews — the brand card (app/(site)/
 * opengraph-image.tsx), an activity's (events/[slug]), a programme's
 * (private-events/[slug]) and a journal story's (journal/[slug]) — are the
 * same card with different words and a different photograph. Each route reads
 * its own record and hands this module a {@link ShareCardContent}; the
 * composition, the fonts, the logo and the palette live here, once.
 *
 * THE LOOK is the admin's share card (public/images/brand/admin-og.png), the
 * brand's light ground: White Rock, a large Light Sage blob and a smaller Soft
 * Lavender one, a Warm Terracotta brush stroke under the headline, Deep Lilac
 * accents and Charcoal Slate type. The headline is the brand script; every
 * small line is Montserrat. The photograph sits on the right as a tilted,
 * white-bordered print over the blobs.
 *
 * COMPOSED AT 1200x630, SHIPPED AT 684x360. Every measurement below is a
 * 1200x630 number passed through `u()`, which scales by `U`. The reason for
 * the smaller frame is WhatsApp's 600KB ceiling on an og:image and PNG's way
 * with photographs — see SHARE_CARD_SIZE in lib/seo.ts.
 *
 * WHY THE HEADLINE IS MEASURED HERE AND NOT LEFT TO SATORI. Satori wraps text
 * but cannot say whether it fitted, and a card has nowhere for an overflow to
 * go. So each headline is measured against the real font files (pdfkit, a
 * dependency already, through the same fontkit Satori's metrics agree with),
 * stepped down a size at a time until it fits its lines, balanced so two
 * lines are near the same length, and clamped with an ellipsis only when even
 * the smallest size will not hold it. The lines are then drawn exactly as
 * measured, one per row.
 *
 * WHICH FACE. The script (Hapsha Sophia) only when the headline has no digit
 * and no character outside the face's ASCII: its 7, 8 and 9 are placeholder
 * marks, and a glyph neither supplied font carries would send Satori to the
 * network for one at render time, which a share card must never do. Anything
 * else is Montserrat SemiBold. Every small line is filtered to the latin
 * subset the Montserrat files carry, for the same reason.
 *
 * WHY .woff FILES. The site's own Montserrat is a variable .woff2, and
 * ImageResponse reads only ttf, otf and woff — so the three static weights
 * the cards set (500, 600, 700) are committed beside it as .woff (see
 * public/fonts/README.md). The SVG arrow and icons are drawn rather than
 * typed for the same reason: the latin subset has no →.
 */

/** The frame the cards ship at, and the scale from the 1200x630 they are composed at. */
export const SHARE_SIZE = SHARE_CARD_SIZE;
const U = SHARE_SIZE.height / 630;
const u = (n: number) => Math.round(n * U * 100) / 100;

/*
  THE PALETTE. INK holds four of the five brand colours as hex for exactly this
  kind of renderer (Satori reads no CSS variables); Light Sage, the warm Ink
  and the lilac chip's near-white are the values app/(site)/globals.css
  resolves --color-brand-sage, --color-brand-ink and --color-on-primary to.
*/
const SAGE = "#D1E7BE";
const BRAND_INK = "#231F20";
const ON_LILAC = "#FDFBF8";
const WHITE = "#FFFFFF";
const MUTED = "#5A6070";
const SHADOW = "0 18px 44px rgba(45, 55, 72, 0.20)";

/** A chip's colour: the brand inks a chip may be drawn in, as the journal's category chips are. */
export type ShareTone = "lilac" | "sage" | "lavender" | "terracotta" | "cream";

const TONES: Record<ShareTone, { bg: string; fg: string }> = {
  lilac: { bg: INK.lilac, fg: ON_LILAC },
  sage: { bg: SAGE, fg: INK.charcoal },
  lavender: { bg: INK.lavender, fg: INK.charcoal },
  terracotta: { bg: INK.terracotta, fg: BRAND_INK },
  // White Rock is the card's own ground, so a "cream" chip is drawn white.
  cream: { bg: WHITE, fg: INK.charcoal },
};

/** The four inks a slug's chip rotates through — cream would vanish on the ground. */
const ROTATING_TONES: readonly ShareTone[] = ["lilac", "sage", "lavender", "terracotta"];

/** A small stable number from a string (FNV-1a), so a slug always draws the same card. */
function hashOf(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** The chip colour a slug owns: one of four, by hash, so neighbouring activities differ. */
export function toneForSlug(slug: string): ShareTone {
  return ROTATING_TONES[hashOf(slug) % ROTATING_TONES.length];
}

/* ==========================================================================
   Fonts — request-independent, so read once
   ========================================================================== */

const FONT_DIR = join(process.cwd(), "public", "fonts");
const [scriptFont, sans500, sans600, sans700] = await Promise.all([
  readFile(join(FONT_DIR, "HapshaSophiaScript_01.otf")),
  readFile(join(FONT_DIR, "Montserrat-500-latin.woff")),
  readFile(join(FONT_DIR, "Montserrat-600-latin.woff")),
  readFile(join(FONT_DIR, "Montserrat-700-latin.woff")),
]);

const FONTS = [
  { name: "Hapsha", data: scriptFont, weight: 400 as const, style: "normal" as const },
  { name: "Montserrat", data: sans500, weight: 500 as const, style: "normal" as const },
  { name: "Montserrat", data: sans600, weight: 600 as const, style: "normal" as const },
  { name: "Montserrat", data: sans700, weight: 700 as const, style: "normal" as const },
];

/*
  The ruler. A pdfkit document that never gets a page and is never ended: it
  is only here for `widthOfString`, which lays a string out with the same
  font file the card draws it in.
*/
type Face = "script" | "sans500" | "sans600";
const ruler = new PDFDocument({ autoFirstPage: false });
ruler.registerFont("script", scriptFont);
ruler.registerFont("sans500", sans500);
ruler.registerFont("sans600", sans600);

/* A little slack against the two engines kerning a hair differently. */
const widthOf = (text: string, face: Face, size: number) => ruler.font(face).fontSize(size).widthOfString(text) * 1.04;

/* ==========================================================================
   Text — what each face can draw, and how a headline is fitted
   ========================================================================== */

/** Keep only what the latin Montserrat files carry; collapse the whitespace. */
export function sansText(value: string): string {
  return value
    .replace(/[^\x20-\x7E -ÿ–—‘’“”•…]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The script's spelling of a headline: Hapsha has straight quotes, not curly ones, and no ellipsis. */
function scriptSpelling(value: string): string {
  return sansText(value)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...");
}

/*
  A DASH IN A SCRIPT HEADLINE BECOMES THE LINE BREAK. Hapsha has no en or em
  dash, and a format's name is written "Crochet — Beginners": the activity,
  then the format. Set as two script lines with the dash dropped, it reads as
  name and subtitle; a hyphen standing in for the dash read as a typo.
*/
const DASH = /\s+[–—]\s+/;

/** True when the script can set this headline: no digit, nothing outside its ASCII but a dash. */
function scriptCan(value: string): boolean {
  const parts = scriptSpelling(value).split(DASH);
  return parts.length <= 2 && parts.every((part) => part.length > 0 && !/\d/.test(part) && /^[\x20-\x7E]+$/.test(part));
}

/** Greedy word wrap at `maxWidth`. A single word wider than the line stays alone on it. */
function wrap(text: string, face: Face, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && widthOf(next, face, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The same number of lines at the narrowest width that still gives that number — even lines. */
function balance(text: string, face: Face, size: number, maxWidth: number, count: number): string[] {
  if (count < 2) return [text];
  let low = maxWidth / count;
  let high = maxWidth;
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2;
    if (wrap(text, face, size, mid).length <= count) high = mid;
    else low = mid;
  }
  return wrap(text, face, size, high);
}

const TRAILING_SMALL_WORDS = new Set(["a", "an", "and", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with", "your"]);

/** Cut a line back to fit with an ellipsis after it. */
function clampLine(line: string, face: Face, size: number, maxWidth: number): string {
  const ellipsis = face === "script" ? "..." : "…";
  let words = line.split(" ");
  while (words.length > 1 && widthOf(`${words.join(" ")}${ellipsis}`, face, size) > maxWidth) words = words.slice(0, -1);
  /* "…Workshop at…" reads as a typo; end on a word that carries meaning. */
  while (words.length > 2 && TRAILING_SMALL_WORDS.has(words[words.length - 1].toLowerCase())) words = words.slice(0, -1);
  let last = words.join(" ").replace(/[\s,.;:–—-]+$/, "");
  while (last.length > 1 && widthOf(`${last}${ellipsis}`, face, size) > maxWidth) last = last.slice(0, -1);
  return `${last}${ellipsis}`;
}

export interface FittedText {
  face: Face;
  size: number;
  lineHeight: number;
  lines: string[];
}

interface Box {
  maxWidth: number;
  maxLines: number;
  /** The tallest the block may be, at 1200x630 — lines x size x lineHeight. */
  maxHeight?: number;
}

/**
 * Fit `text` into the box, trying each size in turn (largest first); clamp
 * at the smallest when none holds it. `paragraphs` are forced breaks — each
 * starts a new line.
 */
function fit(paragraphs: readonly string[], face: Face, sizes: readonly number[], lineHeight: number, box: Box): FittedText {
  const linesAt = (size: number, width: number) => paragraphs.flatMap((text) => wrap(text, face, size, width));
  const roomFor = (size: number) =>
    Math.max(1, Math.min(box.maxLines, Math.floor((box.maxHeight ?? Infinity) / (size * lineHeight))));

  for (const size of sizes) {
    const lines = linesAt(size, box.maxWidth);
    if (lines.length <= roomFor(size) && lines.every((line) => widthOf(line, face, size) <= box.maxWidth)) {
      const balanced =
        paragraphs.length === 1 ? balance(paragraphs[0], face, size, box.maxWidth, lines.length) : lines;
      return { face, size, lineHeight, lines: balanced };
    }
  }

  const size = sizes[sizes.length - 1];
  const room = roomFor(size);
  const lines = linesAt(size, box.maxWidth);
  const kept = lines.slice(0, room).map((line) => (widthOf(line, face, size) > box.maxWidth ? clampLine(line, face, size, box.maxWidth) : line));
  if (lines.length > room) kept[room - 1] = clampLine(lines.slice(room - 1).join(" "), face, size, box.maxWidth);
  return { face, size, lineHeight, lines: kept };
}

/** Line heights: the script's swashes reach well past its em box, so its rows sit close and its neighbours keep clear. */
const SCRIPT_LEADING = 1.04;
const SANS_LEADING = 1.2;
const BODY_LEADING = 1.42;

/** A headline, in the script when it can be and Montserrat SemiBold when it cannot. */
function fitHeadline(text: string, box: Box, scale: "large" | "medium"): FittedText {
  if (scriptCan(text)) {
    const sizes = scale === "large" ? [124, 112, 100, 92, 84, 76, 70] : [116, 106, 96, 88, 80, 72, 66];
    return fit(scriptSpelling(text).split(DASH), "script", sizes, SCRIPT_LEADING, box);
  }
  /* Montserrat is the denser face, so it may take a line more than the script before it shrinks. */
  const sizes = scale === "large" ? [76, 70, 64, 58, 52, 48, 44] : [68, 62, 56, 52, 48, 44, 40];
  return fit([sansText(text)], "sans600", sizes, SANS_LEADING, { ...box, maxLines: box.maxLines + 1 });
}

/** A run of Montserrat 500 clamped to `maxLines`. */
function fitBody(text: string, size: number, maxWidth: number, maxLines: number): FittedText {
  return fit([sansText(text)], "sans500", [size], BODY_LEADING, { maxWidth, maxLines });
}

/* ==========================================================================
   The logo and the photographs
   ========================================================================== */

/** The drawn height of the mark, at 1200x630. */
const LOGO_HEIGHT = 58;

/*
  THE LOGO IS SITE DETAILS' — the light-ground cut (`getBrandLogo().onLight`),
  read per render so replacing it in the admin changes every card on the next
  revalidation — filled with Deep Lilac and trimmed to its lettering
  (`tintedImageDataUri`). The committed Deep Lilac file answers when the
  upload cannot be read. Rendered at twice its drawn size so it stays crisp.
*/
async function lilacLogo(): Promise<TintedImage | null> {
  const cut = await getBrandLogo();
  const px = Math.ceil(u(LOGO_HEIGHT) * 2);
  return (
    (await tintedImageDataUri(cut.onLight.src, INK.lilac, px)) ??
    (await tintedImageDataUri(BRAND_LOGO.onLight.src, INK.lilac, px))
  );
}

export interface SharePhoto {
  src: string;
  /** CSS object-position — the subject's place in the frame, from the record. */
  position?: string;
}

/**
 * A photograph as a JPEG data URI Satori can draw, or null when it cannot be
 * read — the card then lays out without it. At twice the drawn width.
 */
async function photoUri(photo: SharePhoto | null | undefined, drawnWidth: number): Promise<string | null> {
  if (!photo?.src) return null;
  return imageDataUri(photo.src, { width: Math.ceil(u(drawnWidth) * 2) });
}

/* ==========================================================================
   Pieces
   ========================================================================== */

/** The large Light Sage field on the right and the Soft Lavender one below it, as in the admin's card. */
function Blobs({ sageLeft = 700 }: { sageLeft?: number }) {
  return (
    <>
      <svg
        width={u(620)}
        height={u(780)}
        viewBox="0 0 620 780"
        style={{ position: "absolute", left: u(sageLeft), top: u(-70) }}
      >
        <path
          d="M318 8C452 -6 586 70 612 236C638 402 600 560 520 676C440 792 268 800 160 724C52 648 6 520 2 380C-2 240 40 120 128 62C186 24 250 15 318 8Z"
          fill={SAGE}
        />
      </svg>
      <svg
        width={u(270)}
        height={u(250)}
        viewBox="0 0 270 250"
        style={{ position: "absolute", left: u(sageLeft - 70), top: u(468), opacity: 0.85 }}
      >
        <path
          d="M142 4C204 0 262 44 268 112C274 180 232 240 160 248C88 256 18 222 4 156C-10 90 40 10 142 4Z"
          fill={INK.lavender}
        />
      </svg>
    </>
  );
}

/** The terracotta brush stroke under a headline. */
function Stroke({ width }: { width: number }) {
  return (
    <svg
      width={u(width)}
      height={u(24)}
      viewBox="0 0 340 24"
      preserveAspectRatio="none"
      style={{ display: "flex", transform: "rotate(-1.5deg)", opacity: 0.92 }}
    >
      <path
        d="M6 12C70 6 190 3 330 4C338 4 340 14 332 15C230 18 110 20 12 22C2 22 0 13 6 12Z"
        fill={INK.terracotta}
      />
    </svg>
  );
}

/** A print of the photograph: white border, rounded, tilted, with a soft shadow. */
function Print({
  src,
  position,
  width,
  height,
  left,
  top,
  rotate,
  border = 12,
}: {
  src: string;
  position?: string;
  width: number;
  height: number;
  left: number;
  top: number;
  rotate: number;
  border?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: u(left),
        top: u(top),
        width: u(width),
        height: u(height),
        display: "flex",
        padding: u(border),
        background: WHITE,
        borderRadius: u(28),
        boxShadow: SHADOW,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <img
        src={src}
        width={u(width - border * 2)}
        height={u(height - border * 2)}
        alt=""
        style={{ borderRadius: u(18), objectFit: "cover", objectPosition: position ?? "50% 50%" }}
      />
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone: ShareTone }) {
  const { bg, fg } = TONES[tone];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: u(42),
        padding: `0 ${u(20)}px`,
        borderRadius: u(21),
        background: bg,
        color: fg,
        fontFamily: "Montserrat",
        fontWeight: 700,
        fontSize: u(17),
        letterSpacing: u(2.6),
        textTransform: "uppercase",
      }}
    >
      {sansText(label)}
    </div>
  );
}

function Headline({ fitted }: { fitted: FittedText }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {fitted.lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            fontFamily: fitted.face === "script" ? "Hapsha" : "Montserrat",
            fontWeight: fitted.face === "script" ? 400 : 600,
            fontSize: u(fitted.size),
            lineHeight: fitted.lineHeight,
            letterSpacing: fitted.face === "script" ? 0 : u(-0.6),
            color: INK.charcoal,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

function Body({ fitted, colour = INK.charcoal }: { fitted: FittedText; colour?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {fitted.lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            fontFamily: "Montserrat",
            fontWeight: 500,
            fontSize: u(fitted.size),
            lineHeight: fitted.lineHeight,
            color: colour,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

/** The small line icons beside a detail, drawn — the latin font subset has none of them. */
export type ShareIcon = "calendar" | "pin" | "price" | "clock" | "walk" | "book" | "people";

const ICON_PATHS: Record<ShareIcon, ReactNode> = {
  calendar: (
    <g>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </g>
  ),
  pin: (
    <g>
      <path d="M12 21s-6.5-5.8-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.2-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </g>
  ),
  price: (
    <g>
      <path d="M3.5 12.2V4.8c0-.7.6-1.3 1.3-1.3h7.4l8.3 8.3-8.7 8.7-8.3-8.3Z" />
      <circle cx="8.2" cy="8.2" r="1.5" />
    </g>
  ),
  clock: (
    <g>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </g>
  ),
  walk: <path d="M12 3.5l2.2 5.6 5.8.4-4.5 3.7 1.5 5.8L12 15.8 7 19l1.5-5.8L4 9.5l5.8-.4Z" />,
  book: (
    <g>
      <path d="M4 5.5c2.8-1.2 5.5-1 8 .8 2.5-1.8 5.2-2 8-.8v13c-2.8-1.2-5.5-1-8 .8-2.5-1.8-5.2-2-8-.8Z" />
      <path d="M12 6.3v13" />
    </g>
  ),
  people: (
    <g>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c.6-3.3 2.8-5.2 5.5-5.2s4.9 1.9 5.5 5.2" />
      <circle cx="16.8" cy="9.5" r="2.5" />
      <path d="M16.5 14.4c2.2.2 3.6 1.9 4 4.6" />
    </g>
  ),
};

function Icon({ name, size, colour }: { name: ShareIcon; size: number; colour: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colour}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export interface ShareDetail {
  icon: ShareIcon;
  text: string;
}

function Details({ rows, maxWidth }: { rows: readonly ShareDetail[]; maxWidth: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: u(DETAIL_GAP) }}>
      {rows.map((row, i) => {
        const fitted = fit([sansText(row.text)], "sans500", [26, 24, 22], 1, { maxWidth: maxWidth - 44, maxLines: 1 });
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", height: u(DETAIL_ROW), gap: u(14) }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: u(30),
                height: u(30),
              }}
            >
              <Icon name={row.icon} size={u(28)} colour={INK.lilac} />
            </div>
            <div
              style={{
                display: "flex",
                whiteSpace: "nowrap",
                fontFamily: "Montserrat",
                fontWeight: 500,
                fontSize: u(fitted.size),
                color: INK.charcoal,
              }}
            >
              {fitted.lines[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The call to action: a Deep Lilac pill, its arrow drawn. */
function Pill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: u(12),
        height: u(60),
        padding: `0 ${u(26)}px 0 ${u(30)}px`,
        borderRadius: u(30),
        background: INK.lilac,
        color: ON_LILAC,
        fontFamily: "Montserrat",
        fontWeight: 600,
        fontSize: u(23),
        boxShadow: "0 10px 24px rgba(144, 89, 164, 0.32)",
      }}
    >
      {sansText(label)}
      <svg
        width={u(24)}
        height={u(24)}
        viewBox="0 0 24 24"
        fill="none"
        stroke={ON_LILAC}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </div>
  );
}

function Logo({ logo }: { logo: TintedImage | null }) {
  if (!logo) return <div style={{ display: "flex", height: u(LOGO_HEIGHT) }} />;
  const height = u(LOGO_HEIGHT);
  return <img src={logo.src} width={Math.round((height * logo.width) / logo.height)} height={height} alt="" />;
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: INK.whiteRock,
        fontFamily: "Montserrat",
        color: INK.charcoal,
      }}
    >
      {children}
    </div>
  );
}

const render = (node: ReactNode) => new ImageResponse(<Frame>{node}</Frame>, { ...SHARE_SIZE, fonts: FONTS });

/* ==========================================================================
   THE ITEM CARD — an activity, a programme, a journal story
   ========================================================================== */

export interface ShareCardContent {
  /** The small coloured label above the headline. */
  chip: { label: string; tone: ShareTone };
  /** The name — set in the script when it can be (see the note at the top). */
  title: string;
  /** A line of description under the headline. */
  lede?: string | null;
  /** The most lines the lede may take; by default as many as the details leave room for (one to three). */
  ledeLines?: number;
  /** Up to three facts with icons. */
  details?: readonly ShareDetail[];
  /** The pill's words, without the arrow — it is drawn. */
  cta: string;
  /** The record's own photograph; the card lays out without it when absent or unreadable. */
  photo?: SharePhoto | null;
  /** The record's slug: fixes the print's tilt so each card is always drawn the same. */
  seed: string;
}

/*
  THE LEFT COLUMN, top to bottom, at 1200x630: the logo, the chip, the
  headline over its stroke, the lede, the details. Everything but the
  headline has a fixed height, so the headline gets what is left and is fitted
  to it (`fit`'s maxHeight) — a long name steps down a size rather than
  pushing the details off the card.
*/
const MARGIN_X = 80;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;
const COLUMN_HEIGHT = 630 - MARGIN_TOP - MARGIN_BOTTOM;
const GAP = { chip: 26, headline: 22, lede: 16, details: 22 };
/* The stroke tucks under the script's baseline; Montserrat's descenders sit in its line box, so it clears them. */
const strokeGap = (title: string) => (scriptCan(title) ? -2 : 16);
const CHIP_HEIGHT = 42;
const STROKE_HEIGHT = 24;
const LEDE_SIZE = 25;
const DETAIL_ROW = 30;
const DETAIL_GAP = 12;
/* The print on the right, and the pill that overlaps its foot. */
const PRINT = { width: 372, height: 432, centreX: 912, top: 66 };

const strokeUnder = (headline: FittedText, min: number, max: number) =>
  Math.min(Math.max(widthOf(headline.lines[headline.lines.length - 1], headline.face, headline.size) * 0.8, min), max);

export async function renderItemCard(content: ShareCardContent): Promise<ImageResponse> {
  const [logo, photo] = await Promise.all([lilacLogo(), photoUri(content.photo, PRINT.width)]);

  const textWidth = photo ? 600 : 840;
  const details = (content.details ?? []).filter((row) => sansText(row.text).length > 0).slice(0, 3);
  const lede = content.lede ? sansText(content.lede) : "";
  /* The lede takes the room the details leave: three lines alone, two beside one detail, one beside more. */
  const ledeRoom = [3, 2][details.length] ?? 1;
  const ledeFitted = lede ? fitBody(lede, LEDE_SIZE, textWidth, Math.min(content.ledeLines ?? ledeRoom, ledeRoom)) : null;

  const fixed =
    LOGO_HEIGHT +
    GAP.chip +
    CHIP_HEIGHT +
    GAP.headline +
    strokeGap(content.title) +
    STROKE_HEIGHT +
    (ledeFitted ? GAP.lede + ledeFitted.lines.length * LEDE_SIZE * BODY_LEADING : 0) +
    (details.length ? GAP.details + details.length * DETAIL_ROW + (details.length - 1) * DETAIL_GAP : 0);
  const headline = fitHeadline(content.title, { maxWidth: textWidth, maxLines: 2, maxHeight: COLUMN_HEIGHT - fixed }, "medium");
  const tilt = [-3.5, 3, -2.5, 3.5][hashOf(content.seed) % 4];

  return render(
    <>
      <Blobs />
      {photo ? (
        <Print
          src={photo}
          position={content.photo?.position}
          width={PRINT.width}
          height={PRINT.height}
          left={PRINT.centreX - PRINT.width / 2}
          top={PRINT.top}
          rotate={tilt}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left: u(MARGIN_X),
          top: u(MARGIN_TOP),
          width: u(textWidth),
          height: u(COLUMN_HEIGHT),
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Logo logo={logo} />
        {/* The rest is centred in what the logo leaves, so a one-line name does not leave the foot empty. */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", marginTop: u(GAP.chip) }}>
            <Chip label={content.chip.label} tone={content.chip.tone} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: u(GAP.headline) }}>
            <Headline fitted={headline} />
            <div style={{ display: "flex", marginTop: u(strokeGap(content.title)) }}>
              <Stroke width={strokeUnder(headline, 200, 380)} />
            </div>
          </div>
          {ledeFitted ? (
            <div style={{ display: "flex", marginTop: u(GAP.lede) }}>
              <Body fitted={ledeFitted} />
            </div>
          ) : null}
          {details.length ? (
            <div style={{ display: "flex", marginTop: u(GAP.details) }}>
              <Details rows={details} maxWidth={textWidth} />
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: u(photo ? PRINT.centreX - 200 : 760),
          width: u(400),
          top: u(photo ? PRINT.top + PRINT.height - 34 : 500),
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Pill label={content.cta} />
      </div>
    </>,
  );
}

/* ==========================================================================
   THE BRAND CARD — every page without a card of its own
   ========================================================================== */

export interface SiteCardContent {
  eyebrow: string;
  /** Brand wording's tagline. */
  headline: string;
  line: string;
  domain: string;
  /** Up to three of the activities' own photographs, fanned on the right. */
  photos: readonly SharePhoto[];
}

/* Back left, back right, front — at 1200x630. */
const FAN = [
  { width: 262, height: 300, left: 694, top: 100, rotate: -9 },
  { width: 262, height: 300, left: 900, top: 70, rotate: 8 },
  { width: 286, height: 328, left: 792, top: 222, rotate: -2 },
] as const;

export async function renderSiteCard(content: SiteCardContent): Promise<ImageResponse> {
  const [logo, ...photos] = await Promise.all([
    lilacLogo(),
    ...content.photos.slice(0, 3).map((photo) => photoUri(photo, 286)),
  ]);
  const drawn = photos
    .map((src, i) => (src ? { src, position: content.photos[i].position } : null))
    .filter((photo): photo is { src: string; position: string | undefined } => photo !== null);

  const textWidth = drawn.length ? 560 : 840;
  const line = fitBody(content.line, 26, textWidth, 2);
  /* The eyebrow, the stroke, the line and the domain are fixed; the headline gets the rest. */
  const fixed = LOGO_HEIGHT + 36 + 24 + 8 + strokeGap(content.headline) + STROKE_HEIGHT + 22 + line.lines.length * 26 * BODY_LEADING + 24 + 20;
  const headline = fitHeadline(content.headline, { maxWidth: textWidth, maxLines: 3, maxHeight: COLUMN_HEIGHT - fixed }, "large");
  /* With fewer than three photographs, the front slot is filled first. */
  const slots = drawn.length === 3 ? FAN : drawn.length === 2 ? [FAN[0], FAN[1]] : [FAN[2]];

  return render(
    <>
      <Blobs sageLeft={720} />
      {drawn.map((photo, i) => (
        <Print key={i} src={photo.src} position={photo.position} {...slots[i]} border={10} />
      ))}

      <div
        style={{
          position: "absolute",
          left: u(MARGIN_X),
          top: u(MARGIN_TOP),
          width: u(textWidth),
          height: u(COLUMN_HEIGHT),
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Logo logo={logo} />
        <div
          style={{
            display: "flex",
            marginTop: u(36),
            fontWeight: 600,
            fontSize: u(19),
            letterSpacing: u(5.5),
            textTransform: "uppercase",
            color: INK.lilac,
          }}
        >
          {sansText(content.eyebrow)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: u(8) }}>
          <Headline fitted={headline} />
          <div style={{ display: "flex", marginTop: u(strokeGap(content.headline)) }}>
            <Stroke width={strokeUnder(headline, 220, 400)} />
          </div>
        </div>
        <div style={{ display: "flex", marginTop: u(22) }}>
          <Body fitted={line} />
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontWeight: 600,
            fontSize: u(19),
            letterSpacing: u(1.2),
            color: MUTED,
          }}
        >
          {sansText(content.domain)}
        </div>
      </div>
    </>,
  );
}
