/**
 * Stops a build that would ship without MapLibre's browser files.
 *
 *   node scripts/check-vendor.mjs     (before `next build`: `npm run build`,
 *                                      deploy.sh and ci.sh all call it)
 *
 * WHY A BUILD MUST NOT GO OUT WITHOUT THEM. public/vendor/maplibre-gl/ is not
 * in git; `postinstall` copies it from node_modules (scripts/vendor-maplibre.mjs).
 * next.config.ts caches /vendor in browsers for a year, and Next sends that
 * header on a 404 too. So one release missing these files (an install run
 * with --ignore-scripts, a changed build image) would have every visitor in
 * that window keep the 404 for a year: their maps would fall back to the
 * Google embed long after the next release put the files back.
 *
 * It repairs before it fails: if the files are missing it runs the copy once
 * and checks again. It fails only when that cannot produce them (maplibre-gl
 * not installed), which is a build that must not ship.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
/** The same four files scripts/vendor-maplibre.mjs copies — keep the two lists together. */
const FILES = ["maplibre-gl.mjs", "maplibre-gl-shared.mjs", "maplibre-gl-worker.mjs", "maplibre-gl.css"];

function version() {
  try {
    return JSON.parse(readFileSync(join(root, "node_modules", "maplibre-gl", "package.json"), "utf8")).version;
  } catch {
    return null;
  }
}

/** The files missing (or empty) from public/vendor/maplibre-gl/<version>/. */
function missing(v) {
  return FILES.filter((file) => {
    try {
      return statSync(join(root, "public", "vendor", "maplibre-gl", v, file)).size === 0;
    } catch {
      return true;
    }
  });
}

const v = version();
if (!v) {
  console.error("check-vendor: maplibre-gl is not installed (node_modules/maplibre-gl). Run `npm ci` before building.");
  process.exit(1);
}

if (missing(v).length) {
  console.warn(`check-vendor: public/vendor/maplibre-gl/${v}/ is incomplete; copying it again.`);
  execFileSync(process.execPath, [join(root, "scripts", "vendor-maplibre.mjs")], { stdio: "inherit" });
}

const still = missing(v);
if (still.length) {
  console.error(
    `check-vendor: public/vendor/maplibre-gl/${v}/ is missing ${still.join(", ")}. ` +
      "Refusing to build: browsers would cache the 404s for a year (see the note in this script).",
  );
  process.exit(1);
}

console.log(`check-vendor: maplibre-gl ${v} browser files present.`);
