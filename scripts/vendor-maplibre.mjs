/**
 * Copies MapLibre's browser build into public/vendor/, where <BrandMap>
 * imports it at runtime. Runs on `postinstall`, so every `npm ci` (dev,
 * deploy.sh, Nixpacks) refreshes it from the version in package.json.
 *
 * WHY NOT LET THE BUNDLER HAVE IT. MapLibre 6 is three ES modules — the map,
 * a worker, and a chunk both share — and it finds its worker by resolving
 * `./maplibre-gl-worker.mjs` against its own `import.meta.url` at runtime.
 * Bundled, that URL is a chunk name with no worker beside it and the map
 * never draws a tile. Served as plain files, the three sit side by side as
 * the library expects, and the shared chunk is fetched once for both.
 *
 * The folder carries the version, so a new release is a new URL and nothing
 * is served stale from a cache. public/vendor/ is gitignored.
 */
import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = join(root, "node_modules", "maplibre-gl");

let version;
try {
  version = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8")).version;
} catch {
  console.warn("vendor-maplibre: maplibre-gl is not installed; skipping.");
  process.exit(0);
}

const out = join(root, "public", "vendor", "maplibre-gl");
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, version), { recursive: true });

for (const file of ["maplibre-gl.mjs", "maplibre-gl-shared.mjs", "maplibre-gl-worker.mjs", "maplibre-gl.css"]) {
  cpSync(join(pkg, "dist", file), join(out, version, file));
}

console.log(`vendor-maplibre: copied maplibre-gl ${version} to public/vendor/maplibre-gl/${version}/`);
