import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { MUSIC_DIR, PROJECT_ROOT } from "@/cms/lib/paths";

const AUDIO_SOURCE_DIR = path.join(PROJECT_ROOT, "public", "audio");

const MIME_MAP: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
};

/** Clean filename suffixes like _10_120, -1, (1) to match seeded stems. */
function cleanAudioBase(name: string): string {
  return path
    .basename(name, path.extname(name))
    .replace(/(?:[_-]\d+|\s*\(\d+\))+$/, "")
    .trim()
    .toLowerCase();
}

/** Resolve target file from media/music or public/audio fallback. */
async function resolveAudioPath(requestedFilename: string): Promise<string | null> {
  // Prevent directory traversal
  const safeFilename = path.basename(requestedFilename);
  const targetInMusicDir = path.join(MUSIC_DIR, safeFilename);

  if (fs.existsSync(targetInMusicDir)) {
    return targetInMusicDir;
  }

  // Check exact in public/audio
  const targetInPublicDir = path.join(AUDIO_SOURCE_DIR, safeFilename);
  if (fs.existsSync(targetInPublicDir)) {
    // Replicate to MUSIC_DIR in background so future requests hit media/music
    try {
      await fsp.mkdir(MUSIC_DIR, { recursive: true });
      await fsp.copyFile(targetInPublicDir, targetInMusicDir);
    } catch {
      // Ignore background copy failures; still serve from public
    }
    return targetInPublicDir;
  }

  // Suffix matching in public/audio
  if (fs.existsSync(AUDIO_SOURCE_DIR)) {
    const ext = path.extname(safeFilename).toLowerCase();
    const available = await fsp.readdir(AUDIO_SOURCE_DIR);
    const targetBase = cleanAudioBase(safeFilename);

    const match = available.find((file) => {
      if (path.extname(file).toLowerCase() !== ext) return false;
      return cleanAudioBase(file) === targetBase;
    });

    if (match) {
      const matchPath = path.join(AUDIO_SOURCE_DIR, match);
      try {
        await fsp.mkdir(MUSIC_DIR, { recursive: true });
        await fsp.copyFile(matchPath, targetInMusicDir);
      } catch {
        // Ignore background copy failures
      }
      return matchPath;
    }

    const extMatches = available.filter((file) => path.extname(file).toLowerCase() === ext);
    if (extMatches.length > 0) {
      return path.join(AUDIO_SOURCE_DIR, extMatches[0]);
    }
  }

  return null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string[] }> }
) {
  const { filename } = await context.params;
  const decodedFilename = decodeURIComponent(filename.join("/"));

  const filePath = await resolveAudioPath(decodedFilename);
  if (!filePath) {
    return new NextResponse("Audio file not found", { status: 404 });
  }

  const stat = await fsp.stat(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || "audio/mpeg";

  const rangeHeader = req.headers.get("range");

  if (rangeHeader) {
    // Parse Range: bytes=start-end
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const nodeStream = fs.createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  const nodeStream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": fileSize.toString(),
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function HEAD(
  req: NextRequest,
  context: { params: Promise<{ filename: string[] }> }
) {
  const { filename } = await context.params;
  const decodedFilename = decodeURIComponent(filename.join("/"));
  const filePath = await resolveAudioPath(decodedFilename);

  if (!filePath) {
    return new NextResponse(null, { status: 404 });
  }

  const stat = await fsp.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || "audio/mpeg";

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": stat.size.toString(),
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
