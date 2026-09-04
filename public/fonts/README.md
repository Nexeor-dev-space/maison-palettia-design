# Fonts

## Montserrat
Loaded automatically from Google Fonts via `next/font/google` in `lib/fonts.ts`.
No files required here.

## Hapsha Sophia Script (display / wordmark)
**Not yet supplied by the client.** The licensed web font files are required.

To add it:

1. Drop the web font files in this folder, e.g. `HapshaSophiaScript.woff2`.
2. Uncomment the `localFont` block in `lib/fonts.ts`.
3. Add `hapsha.variable` to the `<html>` className in `app/layout.tsx`.

Until then the `--font-display` token falls back to a generic script face so
layout and sizing can be developed. **Do not ship the fallback to production.**
