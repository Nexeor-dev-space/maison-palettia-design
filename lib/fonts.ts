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
 * Wordmark face: "Qarine".
 *
 * Client-supplied, single Regular weight. Used only for the homepage hero's
 * "MAISON PALETTIA" — the one place the brand name is set as a headline
 * rather than as UI text (the header keeps the logo artwork; body copy stays
 * on Montserrat).
 */
export const qarine = localFont({
  src: [{ path: "../public/fonts/Qarine.otf", weight: "400", style: "normal" }],
  display: "swap",
  variable: "--font-qarine",
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
