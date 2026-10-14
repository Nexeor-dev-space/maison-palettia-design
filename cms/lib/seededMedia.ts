import { MEDIA } from "@/cms/seed/strings/media";

function storedFilename(publicPath: string): string {
  const parts = publicPath.split("/");
  if (parts[0] === "images") parts.shift();
  return parts.join("-");
}

const SOURCES = new Map(MEDIA.map((seed) => [storedFilename(seed.path), seed.path]));
const SOURCES_BY_STEM = new Map(
  [...SOURCES].map(([filename, source]) => [filename.slice(0, filename.lastIndexOf(".")), source]),
);

export function seededMediaSource(filename: string): string | undefined {
  const exact = SOURCES.get(filename);
  if (exact) return exact;

  const match = filename.match(/^(.*)-\d+x\d+\.[a-z0-9]+$/i);
  return match ? SOURCES_BY_STEM.get(match[1]) : undefined;
}
