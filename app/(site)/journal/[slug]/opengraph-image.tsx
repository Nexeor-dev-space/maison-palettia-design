import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { imageDataUri } from "@/components/cms/ogImage";
import { INK } from "@/components/sections/hero/composition";
import { getPostBySlug, listPostSlugs } from "@/lib/cms/journal";
import { BRAND_LOGO } from "@/lib/constants";
import { getBrandLogo } from "@/lib/constants.server";

/**
 * ==========================================================================
 * /journal/[slug] — the share card, from the story's cover
 * ==========================================================================
 *
 * The event page's card (app/(site)/events/[slug]/opengraph-image.tsx),
 * drawn for a story: the cover as a square on the left, the title on
 * Charcoal Slate on the right, the logo under it. Same 684x360 for the
 * same reason — WhatsApp's 600KB ceiling on a PNG photograph.
 *
 * THE TITLE'S FACE IS DECIDED PER STORY. A headline with no digit is set
 * in the script, as an event's name is; one that carries a number ("5
 * things…") is set in a plain sans, because Hapsha's 7, 8 and 9 are
 * placeholder marks. The brand's text face ships only as .woff2, which
 * Satori cannot read, so the sans is the one the renderer bundles
 * (Geist, next/dist/compiled/@vercel/og); it is read once, and if it
 * ever moves the card is drawn without its title rather than with the
 * wrong glyphs. Every glyph on the card is covered by a font handed to
 * Satori explicitly — a glyph no supplied font has makes it reach out to
 * Google Fonts at render time, which is a network call a share card must
 * never make. A long title steps down a size and is clamped so the logo
 * keeps its place.
 */

export const alt = "A Maison Palettia journal story: its cover photograph beside its title";
export const size = { width: 684, height: 360 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const rows = await listPostSlugs();
  return rows.map(({ slug }) => ({ slug }));
}

const scriptFont = await readFile(join(process.cwd(), "public", "fonts", "HapshaSophiaScript_01.otf"));
const sansFont = await readFile(join(process.cwd(), "node_modules", "next", "dist", "compiled", "@vercel", "og", "Geist-Regular.ttf")).catch(() => null);
const logo = await readFile(join(process.cwd(), "public", BRAND_LOGO.src));
const committedLogoSrc = `data:image/png;base64,${logo.toString("base64")}`;

const U = size.height / 630;
const SIDE = size.height;
const LOGO_HEIGHT = Math.round(92 * U);

async function brandLogo(): Promise<{ src: string; width: number }> {
  const cut = await getBrandLogo();
  const src = (await imageDataUri(cut.src, { width: 1200, keepAlpha: true })) ?? committedLogoSrc;
  return { src, width: Math.round((LOGO_HEIGHT * cut.width) / cut.height) };
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return new Response("Not found", { status: 404 });

  // ASCII-ish titles only on the card: a glyph neither font carries would send Satori to the network.
  const title = post.title.replace(/[^\x20-\x7E\u00A0-\u024F\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/g, "").trim();
  const script = !/\d/.test(title);
  const showTitle = title.length > 0 && (script || sansFont !== null);
  const photo = post.seo.image ?? post.coverImage;
  const photoSrc = await imageDataUri(photo.src);
  const logoCut = await brandLogo();

  const fontSize = (script ? (title.length > 28 ? 60 : title.length > 16 ? 72 : 88) : title.length > 40 ? 40 : 48) * U;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: INK.charcoal }}>
        {photoSrc ? (
          <img src={photoSrc} width={SIDE} height={SIDE} alt="" style={{ objectFit: "cover", objectPosition: photo.position ?? "50% 50%" }} />
        ) : null}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: `${64 * U}px ${56 * U}px ${60 * U}px`,
          }}
        >
          {showTitle ? (
            <div
              style={{
                display: "flex",
                fontFamily: script ? "Hapsha" : "Geist",
                fontSize,
                fontWeight: 400,
                lineHeight: script ? 1.12 : 1.18,
                color: INK.whiteRock,
                overflow: "hidden",
                maxHeight: 230 * U,
              }}
            >
              {script ? title.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"') : title}
            </div>
          ) : (
            <div />
          )}
          <img src={logoCut.src} width={logoCut.width} height={LOGO_HEIGHT} alt="" />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Hapsha", data: scriptFont, weight: 400, style: "normal" },
        ...(sansFont ? [{ name: "Geist", data: sansFont, weight: 400 as const, style: "normal" as const }] : []),
      ],
    },
  );
}
