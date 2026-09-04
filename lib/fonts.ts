import { Montserrat } from "next/font/google";

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
