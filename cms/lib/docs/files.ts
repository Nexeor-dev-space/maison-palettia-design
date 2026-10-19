import fs from "node:fs";
import path from "node:path";

import { PROJECT_ROOT } from "@/cms/lib/paths";

/**
 * ==========================================================================
 * Where the guide's screenshots and PDF are on disk
 * ==========================================================================
 *
 * docs/admin-guide/images/*.webp and docs/admin-guide/dist/*.pdf ship with
 * the build: next.config.ts `outputFileTracingIncludes` copies them into
 * `.next/standalone`, and scripts/prune-standalone.sh, scripts/deploy.sh
 * and Dockerfile.runtime.dockerignore keep exactly those two folders while
 * still dropping the rest of docs/.
 *
 * The folder is looked up under the project root (cms/lib/paths.ts — the
 * checkout in dev and under start-standalone.sh, the release directory under
 * deploy.sh, /app in the Docker image), then under the working directory.
 * Never served directly: app/(payload)/admin-docs/[...path]/route.ts checks
 * the sign-in first.
 */

let resolved: string | null = null;

export function guideDir(): string {
  if (resolved) return resolved;
  const candidates = [path.join(PROJECT_ROOT, "docs", "admin-guide"), path.join(process.cwd(), "docs", "admin-guide")];
  resolved = candidates.find((dir) => fs.existsSync(path.join(dir, "images"))) ?? candidates[0];
  return resolved;
}

export const GUIDE_PDF_NAME = "Maison-Palettia-Admin-Guide.pdf";

export const imagesDir = () => path.join(guideDir(), "images");
export const pdfPath = () => path.join(guideDir(), "dist", GUIDE_PDF_NAME);

/** The PDF's size and date, or null when it has not been built yet. */
export function pdfInfo(): { bytes: number; built: Date } | null {
  try {
    const st = fs.statSync(pdfPath());
    return st.isFile() ? { bytes: st.size, built: st.mtime } : null;
  } catch {
    return null;
  }
}

/** Screenshot file names are plain: letters, digits, dots, hyphens, underscores, and a raster image extension (no SVG: it could carry script). */
export const SAFE_IMAGE = /^[a-z0-9][a-z0-9._-]*\.(webp|png|jpe?g)$/i;

export const IMAGE_TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};
