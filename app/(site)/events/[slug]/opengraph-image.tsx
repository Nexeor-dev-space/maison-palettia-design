import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

import { ImageResponse } from "next/og";

import { INK } from "@/components/sections/hero/composition";
import { BRAND_LOGO } from "@/lib/constants";
import { eventImage, eventTitle, getEventDetail, getEventSlugs } from "@/lib/eventDetail";

/**
 * ==========================================================================
 * /events/[slug] — the share card, from the event's own photograph
 * ==========================================================================
 *
 * A link to an activity used to unfurl with no picture at all: the page's
 * metadata passed no image, and the site default was null. This draws one per
 * slug from the photograph at the top of that page — `eventImage`, the same
 * accessor the page's header reads — so when the client's new hero for an
 * activity lands in lib/experiences.ts, its share card follows with no other
 * change.
 *
 * THE CARD. The photograph as a square on the left, the activity's name in
 * the brand script on Charcoal Slate on the right, the logo under it. Square
 * because every activity photograph is supplied square (1024x1024), so the
 * whole frame shows uncropped. Charcoal Slate because it is the ground the
 * Light Sage logo was cut for. No other type: the brand's text face ships only
 * as .woff2, which ImageResponse cannot read, and the platform prints the
 * page's title and description beside the card anyway.
 *
 * ==========================================================================
 * WHY 684x360 AND NOT 1200x630 — WHATSAPP
 * ==========================================================================
 *
 * ImageResponse writes PNG and nothing else, and a photograph does not
 * compress as PNG. At 1200x630 these cards measured 0.98–1.22MB. Meta's
 * WhatsApp link-preview documentation asks for an og:image under 600KB (and
 * at least 300px wide), and WhatsApp is how most of this studio's links will
 * travel. So the card is drawn at
 * the same 1.9:1 proportion, smaller: 684x360 measured 339–448KB across all
 * seven activities (bedazzling, the busiest photograph, is the 448). That is
 * above every platform's floor for a LARGE card (Facebook's is 600x315, X's
 * 300x157, WhatsApp's 300px wide) and leaves a quarter of WhatsApp's limit
 * spare for a busier photograph than any supplied so far.
 *
 * Every measurement on the card is drawn at 1200x630 and scaled by `U`, so
 * the composition can go back up with one edit if a JPEG pipeline ever makes
 * the bytes stop mattering.
 *
 * KEPT IN STEP WITH app/private-events/[slug]/opengraph-image.tsx, which
 * draws the same card for the four programmes. Change one, change both.
 *
 * WHY THE PAGE ITSELF SAYS NOTHING ABOUT IMAGES. A file here only wins if the
 * page's metadata leaves `openGraph.images` unset, and lib/seo.ts does that
 * for every /events/<slug> path — see ROUTES_WITH_OWN_SHARE_IMAGE there.
 */

/*
  One alt for every slug: the `alt` export is static, and a per-slug one
  would need generateImageMetadata, which moves the URL under an id segment.
  The activity's name is on the card and in og:title beside it.
*/
export const alt = "A Maison Palettia activity: its photograph beside its name";
export const size = { width: 684, height: 360 };
export const contentType = "image/png";

/*
  Prerender a card for every slug the page prerenders, from the same list.
  Without this the cards are drawn on first request instead of at build.
*/
export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  return slugs.map((slug) => ({ slug }));
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

/**
 * A /public path as a data URI, or null when it cannot be drawn. Satori takes
 * only what it is handed — it cannot fetch a root-relative path from a server
 * that, at build time, is not running.
 */
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
  const detail = await getEventDetail(slug);

  /* The page 404s for an unknown slug; its card does the same. */
  if (!detail) return new Response("Not found", { status: 404 });

  const title = eventTitle(detail);
  const photo = eventImage(detail);
  /*
    An activity without a photograph gets the same card with the square left
    out and the name given the width — still its own, still on brand, and it
    fills in by itself once a photograph is added to its entry.
  */
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
