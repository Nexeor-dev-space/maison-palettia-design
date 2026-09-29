# Fonts

Nothing here is fetched at runtime or at build time. Both faces are files in
this folder, loaded through `next/font/local` in `lib/fonts.ts`.

## Montserrat (interface, body, deck headings)

`Montserrat-Variable-latin.woff2` — the variable face, weight axis 100–900,
latin subset. 35KB, and it is the only file needed: the five weights the site
sets (300/400/500/600/700) are all positions on that one axis.

**It used to come from `next/font/google`, and that broke the deploy.** That
loader contacts Google during `next build`, so the production image could only
build if the build container could reach fonts.gstatic.com. On the deploy host
it could not, and Turbopack reported it as twenty-five `Module not found:
'@vercel/turbopack-next/internal/font/google/font'` errors that mention neither
fonts nor the network — while the same build passed on every developer machine,
because those can reach Google. Do not put it back.

To update it: take the `latin` `@font-face` from

    https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap

requested with a current browser User-Agent (that is what makes Google serve
woff2 rather than ttf), download the `src` URL, and replace the file. Keep the
name, or change it in `lib/fonts.ts` too.

Licensed under the SIL Open Font License 1.1, which permits redistribution, so
the file is committed with the project.

## Hapsha Sophia Script (display / wordmark)

`HapshaSophiaScript_01.otf`, supplied by the client. This is the brand's own
script and it is what every `--font-display` on the site resolves to.

A .woff2 would be roughly half the bytes over the wire and is worth generating
before launch — about 20KB on a face only used at display size.

## Unused files

`Qarine.otf` and `HapshaSophiaScript_01.ttf` sit here but nothing loads them —
neither is referenced by `lib/fonts.ts` or by any stylesheet. Qarine's
registration was removed from globals.css deliberately; see the note there.
