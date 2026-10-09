import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

import { ImageResponse } from "next/og";

import { INK } from "@/components/sections/hero/composition";
import { BRAND_LOGO } from "@/lib/constants";
import { PRIVATE_EVENT_AUDIENCES } from "@/lib/privateEvents";

/**
 * ==========================================================================
 * /private-events/[slug] — the share card, from the programme's photograph
 * ==========================================================================
 *
 * The same card as app/events/[slug]/opengraph-image.tsx — photograph square
 * on the left, the name in the brand script on Charcoal Slate, the logo under
 * it, at 684x360 — and the reasons for every one of those choices are written
 * there. KEPT IN STEP WITH IT: change one, change both.
 *
 * WHAT IS DIFFERENT HERE, AND WHY THIS FILE EXISTS AT ALL. These four pages
 * already had a share image: the page passed `audience.image.src` to
 * buildMetadata. But that is the full-size original — 1.4 to 2.4MB, four
 * times over WhatsApp's 600KB preview limit — and for Mall & Community
 * Activations a 4000x6000 PORTRAIT, which every platform's landscape card
 * crops to whatever happens to be in the middle. This draws the same
 * photograph at the share frame instead, cropped where the data says the
 * subject is (`image.position` — for the mall frame that is the hands and the
 * mug, 55% down, which the note on it in lib/privateEvents.ts explains).
 * Measured: 306–374KB for all four.
 *
 * The page no longer passes an `image`, and lib/seo.ts would leave
 * `openGraph.images` unset for every /private-events/<slug> path if it did —
 * see ROUTES_WITH_OWN_SHARE_IMAGE there — because Next only lets a file
 * supply the image when the page's metadata has not.
 */

export const alt = "A Maison Palettia private event: its photograph beside its name";
export const size = { width: 684, height: 360 };
export const contentType = "image/png";

export function generateStaticParams() {
  return PRIVATE_EVENT_AUDIENCES.map((audience) => ({ slug: audience.slug }));
}

/* Request-independent, so read once. Both are the client's own files. */
const scriptFont = await readFile(
  join(process.cwd(), "public", "fonts", "HapshaSophiaScript_01.otf"),
);
const logo = await readFile(join(process.cwd(), "public", BRAND_LOGO.src));
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/** A /public path as a data URI, or null when it cannot be drawn. */
async function publicImage(src: string): Promise<string | null> {
  const mime = MIME[extname(src).toLowerCase()];
  if (!mime) return null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", src));
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Scale from the 1200x630 the card was composed at to the size it ships at. */
const U = size.height / 630;
const SIDE = size.height;
const LOGO_HEIGHT = Math.round(92 * U);
const LOGO_WIDTH = Math.round((LOGO_HEIGHT * BRAND_LOGO.width) / BRAND_LOGO.height);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const audience = PRIVATE_EVENT_AUDIENCES.find((a) => a.slug === slug);

  /* The page 404s for an unknown slug; its card does the same. */
  if (!audience) return new Response("Not found", { status: 404 });

  const title = audience.name;
  const photo = audience.image;
  /* `image` is optional on a programme; without one the name takes the card. */
  const photoSrc = photo ? await publicImage(photo.src) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: INK.charcoal }}>
        {photo && photoSrc ? (
          <img
            src={photoSrc}
            width={SIDE}
            height={SIDE}
            alt=""
            style={{ objectFit: "cover", objectPosition: photo.position ?? "50% 50%" }}
          />
        ) : null}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: `${72 * U}px ${56 * U}px ${60 * U}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Hapsha",
              fontSize: (title.length > 16 ? 76 : 92) * U,
              lineHeight: 1.15,
              color: INK.whiteRock,
            }}
          >
            {title}
          </div>
          <img src={logoSrc} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="" />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Hapsha", data: scriptFont, weight: 400, style: "normal" }],
    },
  );
}
