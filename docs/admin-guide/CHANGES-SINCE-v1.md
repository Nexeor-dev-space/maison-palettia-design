# Admin guide: what changed since v1 (October 2026 edition)

Audit of `docs/admin-guide/legacy/index.html` (18 chapters, day-one checklist, 100 screenshots; the folder was removed once its content moved into `content/` and `images/`) against `origin/main` @ `6fa70dd`. The branch was later fast-forwarded to `ba59b6d`, which adds the music autoplay (#118) the Music chapter describes.

- **Code range:** the guide matches the admin as of `3b8a8da` ("Phases 4–5 — branded admin, dashboard, ⌘K", 10 Oct). Nothing in the guide mentions the Journal, which landed next (`1660918`), so 3b8a8da is the baseline. 114 commits sit on main after it. The admin-facing ones are listed in section D.
- **How each finding was verified:**
  - by reading the code diff `git diff 3b8a8da HEAD -- cms 'app/(payload)' payload.config.ts lib`;
  - on screen, through a dev server on :3210 against the live database, signed in as the temporary admin `docs-bot@nexeor.local`;
  - with read-only API queries.
- **Confirmed on screen:** the dashboard, the menu, Journal, Journal categories, Workshop types, a session, Music, Settings › Music, Booking & checkout wording › Event page, Site details › Contact, Menus & footer › Mega menus, a venue, an email template preview, the desk-booking dialog, Payments (Mamo Pay) and ⌘K.
- **Nothing was saved, published or deleted.**

---

## A. Chapter by chapter

### Cover / "What's inside" / how-to-read page
- **Text:** "18 chapters … and 100 annotated screenshots" needs updating to the new counts. Add the new chapters from section B to the contents.
- **Screenshots:** the cover reuses `02-dashboard-overview.webp`, which is stale (see Ch 01).

### Ch 01 Welcome & tour
- **Log in / Forgot password:** still accurate. `01-login.webp` and `01-forgot-password.webp` still match.
- **Your dashboard, top to bottom:** needs text changes.
  - The left menu's **Content** group now reads: Media, Pages, Experiences, **Workshop types**, Sessions, Venues, Programmes, Policies, FAQ, Passes, Testimonials, Vibes, **Music**, **Journal**, **Journal categories**, Redirects.
  - The **Settings** group gains **Music**, placed after Search & sharing defaults.
  - Quick actions now read: Add a session · Desk booking · Check-in · Edit homepage · **Write a journal post** · Swap a photo · Refund an order · Resend tickets · Invite staff · Mamo Pay mode · Analytics. "Write a journal post" is Admin and Editor only.
  - "Drafts & scheduled" now also lists **Journal post** drafts. The Editor's KPI hint reads "Unpublished pages, sessions, experiences and journal posts".
- **"Everything in the admin" tiles:** need text changes.
  - Content gains Workshop types, Music, Journal and Journal categories.
  - Settings gains Music.
- **The coloured notes:** still accurate.
  - The red webhook note now prints the address it found, for example "The Mamo Pay webhook points at an old address (https://…). Register it again…". Its button is **Re-register →**, which goes to Settings (admin) › Payments.
- **Where things live table:** add rows for:
  - "Write a journal post" → Content › Journal;
  - "Add a candle theme / crochet level" → Content › Workshop types;
  - "Background music" → Content › Music and Settings › Music.
- **Stale screenshots:**
  - `02-dashboard-overview.webp`: the menu has no Workshop types, Music, Journal or Journal categories, and the quick actions have no "Write a journal post". The example data (MOCK badge, 8 setup lines) also no longer reflects the admin.
  - `02-dashboard-everything.webp`: the tiles have no Workshop types, Music, Journal, Journal categories or Settings › Music.
  - `02-dashboard-today.webp`: the layout is unchanged. Optional refresh only.
  - `32-warnings-strip.webp` and `32-warnings-dashboard.webp`: the layout is unchanged. The example data shows the developer MOCK bar. Optional refresh.

### Day one checklist
- **Mostly accurate.** Changes:
  - **Step 2 (site address):** add a Careful note. The live site and the staging (test) copy share ONE database, so Site details is one setting for both. It must stay `https://maisonpalettia.com`. Today it is. Always work in `maisonpalettia.com/admin`, because any change made in the staging admin is a change to the live site. Google is now always pointed at maisonpalettia.com whatever this field says (commit 69c05ec, DECISIONS.md #9). The field still drives emails, payment returns and the webhook.
  - **Step 7 (Mamo Pay):** add "Press Register/Update webhook only from maisonpalettia.com/admin". Verified today: the sandbox webhook is registered at `https://staging-maison-palettia-design.client2.nexeor.com/api/site/webhooks/mamo`, so the dashboard shows the red "old address" note.
  - **Step 8 (your real content):**
    - Add "Workshop types: one per candle theme / crochet level, then sessions that point at them".
    - Add "Journal: create your categories, then your first post (optional)".
    - Add "Music: switch the player on or off (Settings › Music) and check each track's credit".

### Ch 02 Finding anything
- **Text change.** ⌘K now also searches Journal posts (group "Journal", shows `/journal/{slug}`). It has new "Go to" entries: Journal and Journal categories. It has a new action, **Write a journal post**, second in the Actions list.
- **Where does this sentence live?** It now also finds wording in Journal posts and Journal categories.
- **Stale screenshot:** `03-cmdk-open.webp`. The Actions list now has "Write a journal post" between "Add a session" and "Create a desk booking".
- **Still fine:** `03-cmdk-find-page.webp`, `03-cmdk-find-order.webp` and `03-cmdk-find-sentence.webp` (unchanged UI).

### Ch 03 Editing the website
- **Mostly accurate.**
- **Text additions:**
  - **New page section "Latest from the Journal"** (Page sections group). It shows the newest Journal stories as cards on any page, with optional heading, lead, how many stories (1–6), "Only this category" and a button (default "Read the Journal" → /journal). It is not on any page yet; an editor adds it.
  - **Events page "Events browser" section:** its door titles, door chips and the two group lead lines are no longer edited in the section. They are hidden there and now come from **Settings › Booking & checkout wording › Event page › Mode labels** (commits 00b3d65, 87c1f1a).
  - **Menus and footer:** the main menu now has 7 items (Journal added), which is the "three to seven" maximum. The **Mega menus › About panel** list (was "Four links") is now "Links", up to **five**: About the Maison, Locations, Gallery, **Journal**, Contact. The footer's second column also has Journal.
  - The "Good to know" list of collections with drafts should add **Workshop types** and **Journal posts**. Music, Journal categories and Settings pages have a plain Save.
- **Careful (new tip, verified):** opening **Create New** on Pages, Experiences, Workshop types, Journal, Programmes, Policies, FAQ, Passes or Testimonials saves an empty "Untitled" draft immediately. Payload autosave creates the document on load; Sessions are the exception. Today the dashboard's Drafts list shows such leftovers: an Untitled page, four Untitled experiences and an Untitled journal post. Workshop types has two "<No Name>" drafts and a draft type named "Candle Making". Tell owners: an abandoned Untitled draft is harmless and never public; delete it from the list's checkbox › Delete (Admin) to keep the dashboard tidy.
- **Stale screenshot:** `11-navigation-main-menu.webp` shows 6 Primary rows; there are now 7 (Primary 07 = Journal).
- **Still fine:**
  - `11-navigation-item.webp`, `11-footer.webp` and `12-brand-wording.webp`;
  - all `04-*`, `05-*`, `06-*` and `33-*` (UI unchanged).

### Ch 04 Photos & media
- **Accurate.**
- **Small text addition:** "Used on" (and the "can't delete" message) now also lists Journal post cover photographs, author photos and photographs placed inside a post's text. Music files are not in Media; they live in Content › Music.
- **Screenshots:** all `09-*` still current.

### Ch 05 Experiences & sessions
This chapter needs the most rewriting.
- **Intro / "Experience and sessions (example)":** add the middle layer.
  - Experience (Candle Making) → **Workshop type** (a theme such as "The Cheesecake Collection", "Sculptural Forms"; or a crochet level such as "Crochet — Beginners", "Beginner Basics", "Returning Learners", "Beginner Project") → Session (one dated sitting with its own price and seats).
  - The example "Candle Making · Sun 11 Oct" dates no longer exist. Live sessions run from mid-Nov to Dec under workshop types.
- **Edit an experience's words / photos:** accurate.
  - An experience can no longer be deleted while workshop types belong to it ("N workshop types belong to this experience…").
- **All your sessions:** text change. The list has a new **Workshop type** column (Title, Workshop type, Starts, Venue, Seats sold, Seats available, Booking status, Status).
- **Add a session:** text change.
  - New step 2: **Workshop type**, chosen after the Experience. Only that experience's types are offered. It is optional for an experience with no types.
  - The session then takes the type's name and photograph unless overridden. Title hint: "Leave empty to use the workshop type's name, or the experience's".
  - The web address becomes type-date-time, for example `sculptural-forms-2026-12-05-1830`.
  - Picking a type from another experience is refused: "This workshop type belongs to a different experience…".
  - **Category:** still required free text. It is **no longer a filter on the Experiences/Events page** (the Events filters are now Date, Event, Theme, Vibe and Venue). It is printed only as a small label on the homepage session showcase, and only when it differs from the title. The admin hint still says "Becomes a filter option on the Experiences page", which is now wrong. Tell the guide to say "type Craft; it is a small label".
  - **Vibes (new, sidebar):** the mood of this date. Leave empty to inherit the experience's vibes. The Events page's Vibe filter reads it.
- **Change price/seats; Open, close or waitlist; Actions; Reschedule; Cancel & refund all; Attendee list; Waitlist:** accurate (code unchanged).
- **Repeat weekly: BUG (verified in code), tell Nexeor.** `repeatSession` (cms/lib/orders.ts, the `payload.create` data around lines 1529–1554) copies experience, title, category, time, venue, price, seats and so on, but **not `workshopType` and not `vibes`**. Copies of a "Sculptural Forms" session become plain Candle Making dates: their address is `candle-making-…`, they do not appear on the type's page or under the Theme filter, and they have no vibes.
  - Until it is fixed, the guide must say: after Repeat weekly, open each draft, set **Workshop type** (and Vibes) and then publish.
  - Better: fix the code before the guide ships, then drop the workaround.
- **Stale screenshots:**
  - `08-session-add.webp`: no Workshop type field under Experience; old Title hint; sidebar has no Vibes. Callout numbers 2–6 shift.
  - `08-sessions-list.webp`: no Workshop type column.
  - `08-session-price-seats.webp`: no Workshop type field; old Title hint; no Vibes in sidebar; example data is the retired "Candle Making 11 Oct" session.
  - `08-session-actions.webp`, `08-session-sales-close.webp`, `08-session-close-sales.webp`, `08-session-attendees.webp`, `08-session-repeat-weekly.webp`, `08-session-reschedule.webp`, `08-session-cancel-refund-all.webp`: UI unchanged, but all show the retired "Candle Making · 11 Oct" example. Optional refresh for consistency.
- **Still fine:** `07-experience-text.webp`, `07-experience-photos.webp` and `07-experience-gallery-cards-site.webp`.

### Ch 06 Private events, venues, FAQs, policies, passes
- **Programmes, FAQs, Policies, Passes, Testimonials:** accurate.
- **Venues:** text change.
  - The **Pin (latitude / longitude)** now matters: "Paste the centre's Google Maps link. With a pin the site draws its own map in the Maison's colours; without one it shows a plain Google map found by search."
  - Steps: paste the Google Maps link into the box under Pin → **Use these** → check with **Check on Google Maps →** → Save. **Clear pin** removes it.
  - "Map search override" is now "Only used when no pin is set". Times Square Center already has a pin.
- **Other things in the menu:** text changes.
  - **Vibes:** can now also be set per session (sidebar). The Events page has a **Vibe** filter as well as "Find your vibe".
  - Add rows for **Workshop types**, **Music**, **Journal**, **Journal categories** (Content) and **Settings › Music**, each pointing to its new chapter.
  - The System group list is unchanged.
- **Stale screenshot:** `16-venue-edit.webp`. The Pin and Map-search descriptions changed. The live venue now has a pin filled in, with "Clear pin" and "Check on Google Maps →". Add a callout for the pin.
- **Still fine:** `13-*`, `14-*`, `15-*`, `17-*` and `18-*`.

### Ch 07 SEO & sharing
- **Text change.** The SEO tab now exists on pages, experiences, **workshop types**, sessions, programmes, policies and **Journal posts**. The v1 text omits programmes too.
- Add a "Good to know":
  - Google is always told the site is `https://maisonpalettia.com`. `www.` redirects there, and the staging copy is hidden from search engines automatically. Nothing to set.
  - A dated session's page now tells Google its workshop type page is the main one, and dated sessions are left out of the sitemap. So write the SEO title and description on the **workshop type** and the **experience**. A session's SEO tab mainly affects how its link looks when shared.
  - Journal posts get their own share image automatically (`/journal/{slug}/opengraph-image`).
- **Redirects:** accurate. Renaming a published workshop type, journal post or journal category also adds a redirect.
- **Screenshots:** `10-seo-panel.webp` and `18-redirect-edit.webp` still current.

### Ch 08 Bookings & orders
- **Find / Read / Actions / Refund / Approve / Move / Customers / Promo codes:** accurate (code unchanged).
- **Take a walk-in or phone booking:** text change. Session, Seats, Paid by, **First name and Last name** are marked with a red `*` (required). Leaving Last name empty shows "Enter the customer's last name." under it. Create booking stays disabled until they are filled. The session list now shows workshop-type names (for example "Sculptural Forms").
- **Stale screenshot:** `19-desk-booking.webp`. It lacks the `*` marks, and the label/input rows were misaligned in v1 (fixed: labels now sit directly above their inputs).
- **Still fine:** all other `19-*` and `20-*`. Note that there are no orders in the live database yet, so a refresh needs demo data.

### Ch 09 Tickets & check-in
- **Accurate.** Session names in the day list now show the workshop type, for example "Crochet — Beginners".
- **Screenshots:** `21-*` and `22-*` still current.

### Ch 10 Enquiries
- **Accurate.** The site's contact and private-events forms now check the name, email and phone before sending (252110a / 1eb4d88). Enquiries arrive with valid contact details, and nothing changed in the admin.
- **Screenshots:** `23-*` still current.

### Ch 11 Emails & notifications
- **Text change.** Every email now has a new branded look: a cream background, the logo, a **soft green card** with a lilac border, small hand-drawn doodles in the corners, a lilac pill button and the footer with contact details. The preview below each template shows it exactly. Words and variables are unchanged.
- **Stale screenshot:** `24-email-template-preview.webp` shows the old white card with a lilac top border and no doodles.
- **Still fine:** `24-email-templates-list.webp`, `24-email-template-edit.webp`, `24-sent-emails.webp`, `24-sent-email-resend.webp` and `29-who-gets-notified.webp`.

### Ch 12 Analytics & exports
- **Accurate** (code unchanged).
- **Screenshots:** `25-*` still current.

### Ch 13 Payments (Mamo Pay)
- **Accurate as written. Three fixes make it true on the live site:**
  - **Register/Update webhook works now.** Mamo first sends a test "ping" to the site, which was being refused, so every registration failed (f502d3d).
  - **Refusals now show the real reason.** Messages such as "Mamo answered 422: …" or "Save the key first" appear instead of "An unknown error occurred." (944d3d9).
  - **The Switch to Live checklist** no longer opens as a blank blurred screen (e1a5908, issue #104).
- Add a Careful note: register the webhook only from `maisonpalettia.com/admin`, never from the staging admin (same database, see Day one).
- **Current state (not a guide change):** Mode is Test. Sandbox key and webhook header set 14 Oct; live key and live webhook header set 19 Oct. The sandbox webhook currently points at the staging address.
- **Screenshots:** `31-*` still current (the developer copy also shows "Mock", which v1 already explains).

### Ch 14 Settings
- **Text changes:**
  - The "two settings groups" box: add **Music** to Settings (Admin · Editor).
  - **Site details › Contact › Social profiles:** now up to **7** rows. **Pinterest** was added, and every platform has its own icon in the footer's Follow column and on the Contact page (v1 implied only Instagram/Facebook had icons). The live data has Instagram, Facebook, TikTok, Pinterest and LinkedIn.
  - **Booking & checkout wording › Event page:**
    - **Mode labels** is now the one place for the product names, short labels, chips and one-liners used across the site, including the Events page doors.
    - A new section, **Create Anytime section (/events)**, has the "How it works" heading, up to 4 numbered steps, "Open for drop-ins" / "Coming soon" group headings, the card buttons ("View details" / "Take a look") and the "Nothing matches the filter" note.
  - **Site address:** see the Careful note under Day one (shared database).
- **Still fine:** `26-*`, `27-bookings-open.webp`, `28-*` and `29-invoices-vat.webp`. In `26-site-details-contact.webp` the social rows are below the crop.

### Ch 15 Staff & roles
- **Invite someone:** small text change. The email box removes spaces as you type. Leaving it with an incomplete address shows "Enter a full email address, like name@example.com." and Send invitation stays disabled.
- **Who can do what table:** add rows:
  - **Journal posts and categories:** Admin ✓, Editor ✓, Front desk ◐ view. Only Admin can delete a category, and only once no post uses it.
  - **Workshop types:** Admin ✓, Editor ✓, Front desk ◐ view.
  - **Music (tracks and Settings › Music):** Admin ✓, Editor ✓, Front desk ◐ view (read is open to everyone; create, edit and delete are Admin and Editor).
- **Screenshots:** `30-*` still current. The Staff list on the live database now shows the temporary "Docs Bot" row; crop or retake after it is deleted.

### Ch 16 Routines
- **Text additions:**
  - Monthly: "Add next month's candle theme (Workshop types) and its sessions", and optionally "Post a Journal story".
  - Weekly: "Check Drafts & scheduled for Untitled drafts and delete them".

### Ch 17 When something goes wrong
- **Text change.** "Webhook points at an old address": the red note now has **Re-register →**. Open it from `maisonpalettia.com/admin`, choose Sandbox or Live to match the Mode, then press **Register/Update webhook**. Call Nexeor only if it refuses; the message now says why. Keep "Encrypted settings cannot be read → call Nexeor".
- **New entries:**
  - "The music won't play / I want it off" → Settings › Music.
  - "A journal post isn't on the Journal page" → it must be Published and have a cover photo.
  - "A category won't delete" → posts still use it.
  - "A workshop type won't delete" → sessions still belong to it; unpublish it instead.
- **"I can't change a session's date" and the others:** accurate.

### Ch 18 Glossary & questions
- **Add terms:**
  - **Workshop type** (theme / level);
  - **Journal / Journal post / Journal category**;
  - **Featured post**;
  - **Music track / Credit line / Licence (CC BY)**;
  - **Pin (map)**;
  - **Mode labels**.
- **Change:** Session ("one dated sitting of an experience, usually within a workshop type"); Version ("…pages, experiences, workshop types, sessions and journal posts keep their last 25").
- **New Questions:**
  - "How do I add next month's candle theme?"
  - "How do I write a blog post?"
  - "Can music play automatically?" (No. Visitors press play; it is off on checkout pages.)

---

## B. NEW topics to add (verified on screen)

### B1. Workshop types: themes and levels
- **Where:** Content › Workshop types (`/admin/collections/workshop-types`). Admin and Editor; Front desk can view. Drafts, autosave, Schedule Publish, versions and an SEO tab.
- **What it is:** the format a Create Together experience runs in. A customer picks the format, then a date. Each type has its own page at `/events/{slug}` listing its dates. The experience page lists every published type with dates ahead.
- **Live data:** Sculptural Forms, The Cheesecake Collection (Candle Making), and Crochet — Beginners, Beginner Basics, Returning Learners, Beginner Project (Crocheting).
- **Fields:**
  - **Experience** (required; Create Together only).
  - **Name** (required, 40 characters; "the title of every session of this type unless a session overrides it").
  - **Level** (optional chip, e.g. "Beginner"; leave empty for a theme).
  - **One-line description**.
  - **About (long)** (one row per paragraph; price, duration and dates stay on sessions).
  - **Photograph** (optional; falls back to the experience's).
  - **Learning progression:** "Recommended after" (another type of the same experience) and "Progression note" (e.g. "Start here").
  - Sidebar: **Web address** (`/events/{slug}`; must differ from any experience or session address, or it is refused with a suggestion like `{slug}-theme`), **Status flag** (e.g. "New this month") and **Display order**.
- **Steps (new monthly candle theme):**
  1. Content › Workshop types › Create New.
  2. Experience = Candle Making.
  3. Name the theme.
  4. Write the one line and About.
  5. Add a photo.
  6. Publish changes.
  7. Content › Sessions › Create New.
  8. Choose Candle Making, then the new Workshop type.
  9. Set the date, price and seats, then Publish. If you use Repeat weekly, set the Workshop type on every copy before publishing (bug above, Ch 05).
- **Retire a theme:** unpublish it. It can't be deleted while sessions belong to it.
- **Screens to shoot:** the list (`wt-list`) and the edit view of "Sculptural Forms" (published, id `c962d837-…`). Avoid Create New (it creates a draft row).

### B2. Journal (blog)
- **Where:** Content › Journal (`/admin/collections/posts`) and Content › Journal categories (`/admin/collections/post-categories`). Also the dashboard quick action and ⌘K "Write a journal post".
- **On the site:** `/journal` (featured post large at the top, then cards newest first, a category filter row), `/journal/{slug}`, `/journal/category/{slug}` and an RSS feed. It is linked under About in the header panel, the main menu and the footer.
- **Live data:** no published posts, no categories, and one empty Untitled draft from 14 Oct.
- **Post fields:**
  - Content tab:
    - **Title** (required, 90).
    - **Short summary** (220; empty = the opening lines of the post).
    - **Cover photograph** (required; landscape, at least 1600 px).
    - **Post**: rich text with Heading 2–4, lists, quote, links, a divider, and photos via + or "/upload", each with a caption and Text width / Wide.
    - **Read next** (up to 3; empty = newest in the same category).
  - Sidebar:
    - **Web address** (`/journal/{slug}`, from the title).
    - **Publish date** (stamped on first publish; editable to backdate).
    - **Category** (one).
    - **Feature at the top of the Journal** (the newest featured one wins).
    - **Tags** (press Enter after each).
    - **Written by** (Name, default "Maison Palettia"; Role; round Photo).
    - **Reading time** (worked out on save).
  - **SEO** tab and live preview (eye icon).
  - The cover photo obeys the AI/unknown-origin imagery rule on publish.
- **Category fields:** **Name** (32), **Label colour** (Deep Lilac, Light Sage, Warm Terracotta, White Rock (cream), Soft Lavender), **Description** (one sentence at the top of the category page), Web address, Display order. Plain Save, no drafts. A category with no published posts is not shown. Only Admin can delete one, and only when no post uses it ("N journal posts use this category. Move them to another category first.").
- **Steps:**
  1. Create 2–4 categories.
  2. Write a journal post.
  3. Add the title, cover, text and category.
  4. Optionally tick Feature.
  5. Check the preview.
  6. Publish changes (or Schedule Publish).
- **Also:** the page section **Latest from the Journal** (see Ch 03).
- **Screens to shoot:** the posts list, the post edit view (use a zz-docs- demo post, then delete it), the categories list and the category create view (no drafts, so it is safe until Save).

### B3. Background music and credits
- **Where:** Content › **Music** (`/admin/collections/music-tracks`, an upload list with Bulk Upload) and Settings › **Music** (`/admin/globals/music-settings`). Admin and Editor.
- **On the site:** a small play button in the corner of every page. It never plays by itself, and visitors set the volume. Every active track is credited beside the player and on `/music-credits`.
- **Live data:** the player is **on**, at 40% volume, not shuffled, labelled "Studio sounds", and hidden on /checkout, /payment-success, /booking-status and /dev. One track: "Pink aesthetic background with lofi / chill beats…", licence CC BY 4.0, Creator = a YouTube URL. That creator value may need tidying, but it is content, not a guide change.
- **Track fields:**
  - the MP3/M4A/AAC/OGG file;
  - **Track title** and **Creator** (required);
  - Creator's page;
  - Where it came from and Link to the track;
  - **Licence**: CC BY 4.0, CC BY-SA 4.0, CC BY 3.0, Public domain (CC0), Pixabay Content License, or Other (then a licence name and link, or an exact credit line). NC licences are deliberately absent;
  - "I edited this track";
  - **Exact credit line** (optional, replaces the built credit);
  - read-only **Credit shown on the site**;
  - sidebar: **In the playlist** (untick to remove without deleting), **Attribution required** (read-only), **Display order**.
- **Settings › Music:** **Show the music player**, **Starting volume (%)** 5–100, **Shuffle the playlist**, **Button label**, and **Pages without the player** (paths; a trailing * covers everything beneath).
- **Steps:**
  1. Content › Music › Create New.
  2. Upload the file.
  3. Fill in the title, creator, source and licence.
  4. Check "Credit shown on the site".
  5. Save.
  6. Then go to Settings › Music, tick Show the music player, and Save.
- **Careful:** never use tracks marked NC; this is a business site.

### B4. Branded location maps (Venues pin)
- See Ch 06. Steps: Content › Venues › open the venue › paste the Google Maps link under Pin › **Use these** › **Check on Google Maps →** › Save.

### B5. Events page wording (Mode labels and the Create Anytime section)
- **Where:** Settings › Booking & checkout wording › **Event page** tab. **Mode labels** holds the product names (Create Anytime / Create Together), the short labels, the chips ("No booking", "Booked online"), the card eyebrow and the two one-liners. The new **Create Anytime section (/events)** is described in Ch 14.
- **The visitor's Events page now has** a calendar that draws sessions as tickets and filters by date, Event, Theme (workshop type), Vibe and venue. There is nothing to configure for it beyond sessions, types and vibes.

---

## C. REMOVED or replaced: drop from the guide

1. **Session "Category" as a filter.** Drop "it becomes a filter on the Experiences page" (v1 Ch 05 Add a session, step 2, and the screenshot callout 2). The Events filters are now Date / Event / Theme / Vibe / Venue. Category is still required, but it is only a small label.
2. **Events browser section's own door titles, "Mode label" chips and "Group heads" leads.** These are hidden in the page section and replaced by Settings › Booking & checkout wording › Event page › Mode labels. Do not tell anyone to edit them on the Events page.
3. **"Instagram and Facebook have icons; the others render as text links."** Every platform has an icon now (relevant to Ch 14 Contact, if the writer mentions it).
4. **"Four links" in the About mega-menu.** It is now up to five.
5. **v1's example data:** "Candle Making · Sun 11/18/25 Oct · 15:30", the "Payments: MOCK" badge on the dashboard and the "8 things to finish setting up" list. Those sessions were replaced by workshop-type sessions (Nov–Dec). Re-shoot with current or zz-docs- data.
6. **Nothing else was removed from the admin.**
   - The "background music" removed in 02835e1 was an earlier hard-coded player, never in the admin. It was replaced by the CMS Music feature above.
   - The commerce, check-in, analytics, enquiries, refunds, waitlist, settings (admin) and staff code paths are unchanged since 3b8a8da, apart from the dialog validation noted above.

---

## D. Admin-facing commits since the v1 baseline

| Commit | Change |
|---|---|
| 1660918 | Journal: posts, categories, Latest-from-Journal block, ⌘K, dashboard |
| ca79fdc | Pinterest and social icons |
| 23f78f0, 6076b11 | Workshop types |
| 2903ea7 | Session vibes |
| 2aec7d7 | Journal in nav, About doors up to 5 |
| 9cf1e90, 6102c8e | Media file fallback (no UI change) |
| f502d3d | Mamo webhook ping |
| 944d3d9 | Real error messages in production |
| 2ad8894 | Branded maps / venue pin wording |
| c77a771 | Calendar tickets (site) |
| c64d073 | Email layout and doodles |
| 62fb70e | Music tracks and Settings › Music |
| 69c05ec | Production origin, www redirect, noindex staging |
| f4bc281 | Session canonical to type, Dubai times |
| a920d8a | Invite email validation |
| 654bf4b, 41bf6a1 | Desk-booking required fields |
| 00b3d65 | Booking event labels, Create Anytime section |
| 252110a, 1eb4d88 | Site form validation |
| 87c1f1a | Events browser fields hidden |
| e1a5908 | Live-mode white screen (#104) |

---

## E. Notes for the screenshot and writer agents

- **Temp admin:** `docs-bot@nexeor.local`, password in the scratchpad's `docs/bot.txt` (600). Script: `docs/admin-guide/capture/bot-user.ts`.
  - `npx payload run docs/admin-guide/capture/bot-user.ts create <pwfile>`
  - **Delete when done:** `npx payload run docs/admin-guide/capture/bot-user.ts delete`. The script uses top-level await; `payload run` exits before an un-awaited `main()` finishes.
  - The bot shows in Settings › Staff and in the dashboard greeting ("Good evening, Docs"). Crop it out or set the display name per shot.
- **Login on :3210:**
  - Use `POST /api/users/login` through Playwright's `ctx.request`; that sets the cookie.
  - **The csrf allowlist only contains :3200.** Any in-page POST from :3210 (email preview, Send me this, Register webhook, dialogs' Preview total) answers "You need to be signed in to do this."
  - Workaround (no code change): `ctx.route('**/api/**', r => { const h = {...r.request().headers()}; delete h.origin; h.authorization = 'JWT ' + token; r.continue({headers: h}); })`. This was verified to render the email preview.
  - Capture script: scratchpad `docs/audit/shoot.mjs`. Audit captures: scratchpad `docs/audit/*.png|txt`.
- **Never open Create New on drafted collections** (Pages, Experiences, Workshop types, Journal, Programmes, Policies, FAQ, Passes, Testimonials): it immediately inserts an Untitled draft in the LIVE database. Use existing documents, or name any demo `zz-docs-…` and delete it after. Sessions, Journal categories and Music create views are safe until Save.
- **The dev server is very slow against the remote DB.** Pages take 1–4 minutes on first compile; use a 300 s navigation timeout.
- **Live dashboard right now:**
  - a red note: the Mamo webhook is at the staging address;
  - amber notes: the TRN is missing, and 49 AI/unknown photos;
  - Payments: TEST;
  - no orders and no enquiries;
  - sessions only from mid-Nov.
  - Shots of orders, tickets, check-in verdicts, refunds and analytics need zz-docs- demo data or the existing v1 images.
- **Work in progress from another agent:** the uncommitted "Docs" menu link and the "Open the guide" ⌘K action are in the tree. They will appear in fresh menu and ⌘K screenshots. Decide whether the new guide should show them.
