# The admin guide

The owner's guide to the admin: how to edit the website, run sessions, take bookings, check people in, and look after payments, email and staff. It is written for the studio owner and team — plain words, short numbered steps, real screenshots with numbered circles.

Staff read it in three places, all from the same files in this folder:

| Where | What |
| --- | --- |
| **Docs** in the admin sidebar → `/admin/docs` | The guide as web pages, with search (press `/`), a contents list, and click-to-enlarge screenshots. Signed-in staff only. |
| `⌘K` → "Open the guide", or "Guide: …" | Any chapter from the command palette. |
| **Download the PDF** on `/admin/docs` | `dist/Maison-Palettia-Admin-Guide.pdf`, printed from `/admin/docs/print`. |

Nothing here is stored in the database. Screenshots and the PDF are served by `app/(payload)/admin-docs/[...path]/route.ts`, which refuses anyone who is not signed in.

## What is where

```
docs/admin-guide/
  content/          one TypeScript file per chapter, in reading order
    types.ts        the content model (read this first)
    index.ts        the chapter list — order here is the order in the guide
    front.ts        welcome text, "how to read", colophon, edition
    01-welcome.ts … 21-glossary.ts
  images/           the screenshots (.webp), with the numbered circles drawn on
  dist/             the built PDF (committed, so the admin can offer it)
  scripts/
    shoot.mjs       takes screenshots and draws the numbered circles
    convert-legacy.mjs   one-off record: how the October 2026 page became these files (its input has since been removed)
```

The pages are rendered by `cms/views/docs.tsx` and `cms/components/docs/*` (styles in `docs.scss`); lookups, checks and the search index are in `cms/lib/docs/`.

## Edit a chapter

1. Open the chapter file in `content/` (for example `09-orders.ts`). Each chapter has a `title`, a one-line `lede`, a `blurb` for the contents cards, a `summary` ("In 30 seconds"), the `roles` it is written for, and `sections`.
2. A section has an `id` (its link anchor — unique across the whole guide), a `title`, optionally the menu `path` (`"Bookings > Orders"`) and `who` can do it, and a list of `blocks`: `paragraph`, `steps`, `list`, `screenshot`, `phones`, `tip`, `warning`, `never`, `info`, `table`, `checklist`, `roleMatrix`, `mock`, `routine`, `timeline`, `faq`, `glossary`, `legend`. `types.ts` documents each one.
3. Text uses a little markup:

   | Write | You get |
   | --- | --- |
   | `**Confirmed**` | bold |
   | `*optional*` | italic |
   | `` `MP-` `` | something typed literally |
   | `[[Publish changes]]` | a button, drawn like the admin's |
   | `{{Settings > Staff}}` | the route through the left menu |
   | `((3))` | lilac circle number 3 — must match a callout on a screenshot in the same section |
   | `<<⌘>>` | a keyboard key |
   | `[refund it](#refund)` | a link to another section (any chapter) |

4. New chapter: create the file, import it in `content/index.ts` and put it in the `chapters` list where it belongs. The slug becomes `/admin/docs/<slug>`.
5. Check it: `npx vitest run tests/unit/adminGuide.test.ts` (duplicate anchors, broken links, missing images, callout numbers with no matching screenshot), then `npx tsc --noEmit`. Open `/admin/docs/<slug>` on the dev server to read it.

Keep the voice: second person, warm and plain, short steps that start with a verb, one idea per step, and the callout number right after the thing it points at.

## Add or re-take a screenshot

Screenshots are taken from a running admin with `scripts/shoot.mjs`, which signs in, opens the page, draws the numbered circles on the elements you name, and writes `images/<name>.webp`.

1. Write a small `shots.json` (outside the repo is fine):

   ```json
   [
     {
       "name": "08-sessions-list",
       "url": "/admin/collections/sessions",
       "waitFor": ".collection-list",
       "callouts": [
         { "n": 1, "target": "a:has-text('Create New')", "place": "left", "label": "Add a session" },
         { "n": 2, "target": ".search-filter", "place": "bottom", "label": "Search by name or date" }
       ]
     }
   ]
   ```

   `target` is a CSS selector (the circles are placed in the page, so Playwright-only selectors such as `:has-text()` do not work there), or `{ "x": 640, "y": 220 }`. `place` is `left` (default), `right`, `top`, `bottom`, `center` or `top-left`; add `"ring": true` to outline the element too. `"phone": true` shoots at 390×844. `"clip": ".selector"` shoots one element (add `"clipPad": 32` to leave room for circles outside it); `"full": true` the whole page. `actions` can `click`, `fill`, `press`, `type`, `hover`, `scroll`, `eval` (a line of script, e.g. to tag an element with an id) and `wait` first. `"replace": [["zz-docs ", ""]]` swaps text on the page just before the shot, so example records and the capture account never show; nothing is saved.

2. Run it against a dev server with a staff login given on the command line (never in `.env`):

   ```bash
   DOCS_BOT_EMAIL=you@example.com DOCS_BOT_PASSWORD='…' \
     node docs/admin-guide/scripts/shoot.mjs shots.json --base http://localhost:3200
   ```

   Against a port other than 3200 (whose origin is not in the admin's CSRF list), the script sends the admin's own requests (previews, dialogs) with the sign-in token, so they still work. It prints a `screenshot` block with the real width and height. Paste it into the chapter, write the caption, and fill the callout labels.

The dev server uses the **live** database. Only open pages and menus; never press Save, Publish, Refund, Send or Delete while shooting. If a screenshot needs example data, create it as a draft named `zz-docs-…` and delete it afterwards.

## Rebuild the PDF

With the dev server (or a production build) running:

```bash
DOCS_BOT_EMAIL=you@example.com DOCS_BOT_PASSWORD='…' DOCS_BASE_URL=http://localhost:3200 npm run docs:pdf
```

The script opens `/admin/docs/print` in Chrome, prints it once to find the page each chapter and section lands on, writes those numbers into the contents and the cross-references, prints again, and saves `dist/Maison-Palettia-Admin-Guide.pdf` (A4, backgrounds, running header and footer). Commit the PDF with the content change. Change the edition date in `content/front.ts` when the screenshots are re-taken.

## Shipping

`next.config.ts` (`outputFileTracingIncludes`) copies `images/` and `dist/*.pdf` into the standalone build; `scripts/prune-standalone.sh`, `scripts/deploy.sh` and `Dockerfile.runtime.dockerignore` drop the rest of `docs/` but keep those two folders. Everything else in this folder is source and is bundled into the build or not needed at runtime.
