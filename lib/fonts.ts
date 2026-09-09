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
 * Display / wordmark face: "Hapsha Sophia Script".
 *
 * The licensed font file is not in the repository yet. Once it is added to
 * `public/fonts/`, uncomment the block below and add `hapsha.variable` to the
 * <html> className in app/layout.tsx. Nothing else needs to change — the
 * `--font-display` token in globals.css already points at `--font-hapsha`
 * and falls back to a generic script face until then.
 *
 * import localFont from "next/font/local";
 *
 * export const hapsha = localFont({
 *   src: [{ path: "../public/fonts/HapshaSophiaScript.woff2", weight: "400", style: "normal" }],
 *   display: "swap",
 *   variable: "--font-hapsha",
 * });
 */
