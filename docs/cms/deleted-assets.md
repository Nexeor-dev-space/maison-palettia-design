# Deleted assets (Phase 5 cleanup, agent 5C)

49 files, **73.58 MB** (77,149,112 bytes) removed from `public/images` and `public/videos`. The tree went from 130 MB + 27 MB to 80 MB + 2.5 MB.

## How each file was proven unused

1. The full repo-relative path (`images/…` / `videos/…`) appears in **no** file under `app/`, `components/`, `lib/`, `cms/` (including `cms/seed/**`, whose `strings/media.ts` is the import list for the 72 seeded media files), `tests/`, `scripts/`, `types/`, config files, CSS or JSON. No template-literal or directory-based path construction exists either (grepped for `/images/${…}`, `readdir`, `publicDir`).
2. None of the files' stored names (`storedFilename()` in `cms/seed/media.ts`: folder joined to file name with a hyphen) is in the `media` table of the dev database (72 rows), and none of the paths, stored names or long file names occurs in any text, varchar, json or jsonb column of any of the 1,387 columns in the database.
3. The `.gitkeep` placeholders in `public/images/{blog,brand,gallery,hero,workshops}` are kept (zero bytes; they hold empty folders open).

Comments in a few files still mention some of these file names as history (for example `components/sections/Hero.tsx` on `banner-img.jpg`, `lib/experiences.ts` on `HAND_BUILDING.jpg`); they describe why a file was *not* used and need no change.

## Restoring one

Every file below is in git history at commit `3fcb989` (and earlier):

```sh
git show 3fcb989:public/images/tile/crochet-rainbow.jpg > public/images/tile/crochet-rainbow.jpg
```

## images (top level) — 10 files, 14.94 MB

| File | Size |
|---|---:|
| `public/images/about-img.png` | 2,618,932 B |
| `public/images/about-section-img.jpg` | 2,370,152 B |
| `public/images/banner-img.jpg` | 683,387 B |
| `public/images/banner-section-img.jpg` | 1,878,722 B |
| `public/images/fav-new-log.png` | 884,442 B |
| `public/images/favicon-logo.png` | 709,215 B |
| `public/images/mobile-banner-bg.png` | 2,815,015 B |
| `public/images/mobile-banner.png` | 1,906,462 B |
| `public/images/new-fav-logo.jpg` | 137,109 B |
| `public/images/orporate-events.jpg` | 1,659,557 B |

## images/creative — 4 files, 1.54 MB

unused craft stills; no code, seed or media record points at them.

| File | Size |
|---|---:|
| `public/images/creative/carved-glaze.jpg` | 130,907 B |
| `public/images/creative/create.jpg` | 211,268 B |
| `public/images/creative/glass-painting.jpg` | 260,856 B |
| `public/images/creative/mandala-painting.jpg` | 1,012,319 B |

## images/doodles — 10 files, 0.82 MB

the client's ten brand-icon PNGs; the site draws them as vectors in components/sections/hero/doodles.ts, so the PNGs are not loaded at runtime.

| File | Size |
|---|---:|
| `public/images/doodles/d-7.png` | 105,501 B |
| `public/images/doodles/d-8.png` | 83,593 B |
| `public/images/doodles/d1.png` | 82,532 B |
| `public/images/doodles/d10.png` | 74,222 B |
| `public/images/doodles/d2.png` | 96,800 B |
| `public/images/doodles/d3.png` | 81,370 B |
| `public/images/doodles/d4.png` | 66,717 B |
| `public/images/doodles/d5.png` | 92,327 B |
| `public/images/doodles/d6.png` | 91,347 B |
| `public/images/doodles/d7.png` | 81,218 B |

## images/editorial — 2 files, 1.07 MB

unused editorial plates.

| File | Size |
|---|---:|
| `public/images/editorial/mood-bg.jpg` | 993,483 B |
| `public/images/editorial/vases-on-lilac.jpg` | 128,516 B |

## images/hero — 3 files, 2.33 MB

unused hero poster / background plates.

| File | Size |
|---|---:|
| `public/images/hero/banner-poster.jpg` | 92,911 B |
| `public/images/hero/bg-bg.png` | 2,078,100 B |
| `public/images/hero/studio-laughter.jpg` | 269,383 B |

## images/hero-carousel — 6 files, 13.10 MB

frames of the retired hero carousel; the hero is a single photograph now.

| File | Size |
|---|---:|
| `public/images/hero-carousel/1-tote.png` | 2,190,583 B |
| `public/images/hero-carousel/1.jpg` | 955,100 B |
| `public/images/hero-carousel/2.png` | 2,274,634 B |
| `public/images/hero-carousel/3-crochet.jpg` | 3,174,962 B |
| `public/images/hero-carousel/4.jpg` | 2,870,803 B |
| `public/images/hero-carousel/h-3.jpg` | 2,274,488 B |

## images/tile — 8 files, 14.71 MB

stock/inspiration photographs from the first gallery mosaic (GALLERY_TILES, removed); never imported into the CMS.

| File | Size |
|---|---:|
| `public/images/tile/chloe-martin-GiIZKZGF3Z0-unsplash.jpg` | 4,946,874 B |
| `public/images/tile/crochet-rainbow.jpg` | 1,003,246 B |
| `public/images/tile/granny-square-blanket.jpg` | 599,378 B |
| `public/images/tile/guido-coppa-uli6LsaENfk-unsplash.jpg` | 2,219,687 B |
| `public/images/tile/kiy-turk-mbGZsV328Cg-unsplash.jpg` | 2,274,488 B |
| `public/images/tile/mj-Iz_qPW75I5U-unsplash.jpg` | 3,174,962 B |
| `public/images/tile/printed-tote-copenhagen.jpg` | 510,929 B |
| `public/images/tile/tote-rack-new-york.jpg` | 697,831 B |

## images/workshops — 1 files, 0.14 MB

| File | Size |
|---|---:|
| `public/images/workshops/glazed-vessel.jpg` | 144,811 B |

## images/experiences — 1 files, 0.59 MB

| File | Size |
|---|---:|
| `public/images/experiences/HAND_BUILDING.jpg` | 616,052 B |

## images/studio — 1 files, 0.10 MB

| File | Size |
|---|---:|
| `public/images/studio/tote-table.jpg` | 100,443 B |

## videos — 3 files, 24.25 MB

banner and background loops that no component loads (the only film in use is videos/maison-film.mp4).

| File | Size |
|---|---:|
| `public/videos/maison-banner-bg-1.mp4` | 6,074,424 B |
| `public/videos/maison-banner.mp4` | 16,687,894 B |
| `public/videos/video-bg.mp4` | 2,661,160 B |
