import localFont from "next/font/local";

/**
 * Primary UI + editorial face. Used for navigation, headings, body copy,
 * buttons, forms and all interface text.
 *
 * ==========================================================================
 * SELF-HOSTED, AND IT HAS TO BE — THE DEPLOY DEPENDED ON IT
 * ==========================================================================
 *
 * This was `Montserrat` from `next/font/google`, which reads well and is what
 * the guideline names, but it is not a build-time-free choice: that loader
 * contacts fonts.googleapis.com for the stylesheet and fonts.gstatic.com for
 * every file, DURING `next build`. So the production build could only succeed
 * if the build container could reach Google, and on the deploy host it could
 * not. Turbopack does not say so. It reports twenty-five copies of
 *
 *   Module not found: Can't resolve
 *   '@vercel/turbopack-next/internal/font/google/font'
 *   next/font/google queries have exactly one entry
 *
 * — one per weight and subset — which names neither fonts nor the network, and
 * which reproduces on no developer machine, because a machine that can reach
 * Google builds fine. The same build passes locally and fails in the image.
 *
 * The file below removes the dependency rather than working around it. There
 * is no fetch in the build any more, so the deploy cannot fail on somebody
 * else's uptime, and no visitor's browser is handed to Google either.
 *
 * WHAT IS IN THE FILE, AND WHY ONE FILE IS ENOUGH.
 *
 *   It is the VARIABLE face, wght 100-900, so the five weights this site used
 *   to request separately (300/400/500/600/700) all come out of one 35KB
 *   download instead of five. `weight: "100 900"` is what tells next/font it
 *   is an axis and not a single cut.
 *
 *   It is the LATIN subset, which is the subset this file already asked for.
 *   Measured against every non-ASCII character in the project, exactly three
 *   fall outside it — the Greek delta and the two arrows — and none of those
 *   are in latin-ext, cyrillic or vietnamese either, so they were already
 *   being drawn by the fallback face before this change and still are. That
 *   is also why this is one `src` and not several: next/font/local writes no
 *   `unicode-range`, so a second subset declared here would not narrow itself
 *   to its own characters — it would be a second @font-face with the same
 *   family, weight and style, and one of the two would simply win.
 *
 * Montserrat is licensed under the SIL Open Font License 1.1, which permits
 * redistribution, so the file is committed with the project. See
 * public/fonts/README.md.
 */
export const montserrat = localFont({
  src: [
    {
      path: "../public/fonts/Montserrat-Variable-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-montserrat",
});


/**
 * Display face: "Hapsha Sophia Script" — the brand's own script.
 *
 * The `--font-display` token in globals.css has always pointed here, falling
 * back to Snell Roundhand while the licensed file was missing; supplying it
 * switches every `font-display` on the site from the stand-in to the real
 * face at once. That was the documented intent — see public/fonts/README.md,
 * which says in as many words not to ship the fallback.
 *
 * Loaded from the .otf as supplied. A .woff2 would be roughly half the bytes
 * over the wire and is worth generating before launch, but the difference is
 * about 20KB on a face that is only used at display size.
 */
export const hapsha = localFont({
  src: [{ path: "../public/fonts/HapshaSophiaScript_01.otf", weight: "400", style: "normal" }],
  display: "swap",
  variable: "--font-hapsha",
});


/*
 * THE DECK FACE IS GONE, AND THE SITE HAS TWO FACES AGAIN.
 *
 * There was a third here: Bebas Neue, a stand-in for the very narrow uppercase
 * grotesque every heading in "Maison Palettia — General" is set in. It was
 * always explicitly a guess — the note that stood here said so, and said it
 * was a one-line swap if the client ever named the real one. The client has
 * now named it, and it is Montserrat: the face "MP Brand Guidelines" gives for
 * text, which is what the guideline said in the first place.
 *
 * So `--font-deck` in globals.css now resolves to Montserrat and nothing loads
 * a third family. The token stays, because the ROLE is still real — these are
 * the deck's headings and they are set differently from body copy — and
 * because if a licensed condensed face ever arrives it is one line again.
 *
 * WHAT HAD TO CHANGE WITH IT. Montserrat is not condensed: measured on the
 * page, it sets the same uppercase string 1.8x as wide as Bebas at the same
 * size. "BOOK A SEAT" at 88px went from 343px to 619px in a column holding
 * 519px. Every display use of the token was therefore resized, not just
 * re-pointed — see <TwoWaysToCreate>.
 */
