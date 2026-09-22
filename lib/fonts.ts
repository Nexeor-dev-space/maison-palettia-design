import { Montserrat } from "next/font/google";
import localFont from "next/font/local";

/**
 * Primary UI + editorial face. Used for navigation, headings, body copy,
 * buttons, forms and all interface text.
 */
export const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
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
