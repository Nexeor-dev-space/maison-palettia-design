import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { INK } from "@/components/sections/hero/composition";
import { BRAND_LOGO } from "@/lib/constants";
import { DEFAULT_SHARE_IMAGE, SHARE_IMAGE_SIZE } from "@/lib/seo";

/**
 * ==========================================================================
 * THE DEFAULT SHARE CARD — for every page without a photograph of its own
 * ==========================================================================
 *
 * Served at /opengraph-image, 1200x630, the size every platform's large card
 * is cut from. It exists because the site had no share image at all: the
 * branded artwork lib/seo.ts asks the client for has never arrived, so 25 of
 * 29 routes went out to WhatsApp, iMessage and Slack as a bare grey link.
 *
 * WHAT IT IS. The official logo — the Light Sage cut, from BRAND_LOGO, not a
 * redrawing of it — on Charcoal Slate, which is the ground that cut was made
 * for (9.07:1 there; see the note on BRAND_LOGO). Nothing else: no tagline,
 * because the platform prints the page's own title and description under the
 * card, and no type, because the brand's text face only ships as .woff2 and
 * ImageResponse cannot read that format. A card that says one thing well is
 * the right default for a page that has not chosen its own picture.
 *
 * HOW IT REACHES EVERY PAGE — AND WHY THIS FILE ALONE WOULD NOT. Next applies
 * a root opengraph-image only to routes that do not set `openGraph`
 * themselves, and every page built with `buildMetadata` does: a child's
 * `openGraph` replaces its parent's whole object, images included. So this
 * file covers the homepage and the error pages on its own, and lib/seo.ts
 * names its URL as the default image for everything else
 * (DEFAULT_SHARE_IMAGE). Moving or renaming this file breaks that URL.
 *
 * Generated, not committed as a PNG, so it follows the logo: replace the file
 * BRAND_LOGO points at and the card changes with it. Prerendered at build —
 * nothing here reads the request.
 *
 * TODO(client): this is a stand-in for real share artwork, not a substitute
 * for it. When the client supplies a 1200x630 image, drop it in as
 * app/opengraph-image.jpg, delete this file, and point DEFAULT_SHARE_IMAGE in
 * lib/seo.ts at it — the steps are in the TODO there.
 */

export const alt = DEFAULT_SHARE_IMAGE.alt;
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

/*
  Read once, at module scope: the logo does not depend on the request. Inlined
  as a data URI because Satori draws only what it is handed — it cannot fetch
  a root-relative path from a server that is, at build time, not running.
*/
const logo = await readFile(join(process.cwd(), "public", BRAND_LOGO.src));
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

/*
  Set by height, as everywhere else the mark is drawn — the file keeps its own
  aspect. 300px of a 630px card is the logo at roughly the share it takes of
  the banner on a desktop: large enough to read in WhatsApp's small square
  crop, small enough to keep a margin in Facebook's wide one.
*/
const LOGO_HEIGHT = 300;
const LOGO_WIDTH = Math.round((LOGO_HEIGHT * BRAND_LOGO.width) / BRAND_LOGO.height);

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: INK.charcoal,
        }}
      >
        <img src={logoSrc} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="" />
      </div>
    ),
    size,
  );
}
