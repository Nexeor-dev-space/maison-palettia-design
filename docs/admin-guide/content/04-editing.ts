import type { Chapter } from "./types";

export const editing: Chapter = {
  slug: "editing",
  number: 3,
  title: "Editing the website",
  lede: "Pages are built from sections stacked top to bottom. You change the words and photos; the design stays beautiful by itself.",
  blurb: "Sections, live preview, drafts, publishing, scheduling and history.",
  summary: [
    "Open {{Content > Pages}}, pick a page, and open a section to change its words or photo.",
    "Everything you type saves itself as a **draft**. Visitors see nothing until you press [[Publish changes]].",
    "In the live preview, point at any part of the page and press [[Edit]] to jump straight to it.",
    "Changed your mind? [[Revert to published]], or restore any of the last 25 versions.",
  ],
  roles: ["admin", "editor"],
  keywords: "pages content edit wording homepage publish draft",
  intro: [
    {
      type: "mock",
      label: "How a change reaches the website",
      html: "<div class=\"flowline\"><div class=\"stage\"><span class=\"tag\">1 · You type</span><b>Edit a field</b><p>Change any words, photo or order of sections.</p></div><div class=\"stage\"><span class=\"tag\">2 · Automatic</span><b>Draft saved</b><p>Every second or so. Status shows <span class=\"chip a\">Changed</span></p></div><div class=\"stage\"><span class=\"tag\">3 · You check</span><b>Preview</b><p>The preview shows your draft. The public site does not change yet.</p></div><div class=\"stage live\"><span class=\"tag\">4 · You decide</span><b>Publish changes</b><p>Live on the website within a second or two. Status: <span class=\"chip g\">Published</span></p></div></div><div class=\"side-paths\"><div><b>Schedule Publish</b>: instead of step 4, pick a date and time and it goes live by itself.</div><div><b>Revert to published</b>: throw the draft away and go back to what is live.</div></div>",
    },
    {
      type: "warning",
      text: [
        "**Settings work differently.** Pages, experiences, workshop types, sessions, journal posts, programmes, FAQs, policies, passes and testimonials have drafts and [[Publish changes]]. Music tracks, journal categories, venues and the pages under **Settings** (Site details, Menus & footer, Brand wording and the rest) have a plain [[Save]], and a save goes live straight away. Read twice, then save.",
      ],
    },
  ],
  sections: [
    {
      id: "edit-section",
      title: "Change the words or photo in a section",
      path: "Content > Pages > Home",
      who: "Admin · Editor",
      keywords: "section block",
      blocks: [
        {
          type: "steps",
          items: [
            "Open the page. Its sections are listed top to bottom, in the same order as on the website.",
            "Click a section's bar ((1)) to open it.",
            "Some sections can use shared [Brand wording](#brand-wording) or their own words. Choose which ((2)).",
            "Change any words ((3)). The preview on the right updates as you type ((4)).",
            "Press [[Publish changes]] when you are happy.",
          ],
        },
        {
          type: "screenshot",
          file: "05-homepage-section-open.webp",
          width: 1200,
          height: 1041.5,
          caption: "Content → Pages → Home. The page is a list of sections, top to bottom. Click a section's name to open it and change its words or photo.",
          title: "Edit a homepage section",
          callouts: [
            { n: 1, label: "The section's bar — click to open or close it" },
            { n: 2, label: "Choose: use the shared Brand wording, or write this section's own words" },
            { n: 3, label: "Change any words here" },
            { n: 4, label: "The preview updates as you type" },
          ],
        },
        {
          type: "info",
          title: "Good to know",
          text: [
            "On the Events page, the **Events browser** section no longer holds its own door titles, chips or group lines. Those words now live in one place for the whole site: [Mode labels](#mode-labels) under {{Settings > Booking & checkout wording}}, Event page tab.",
          ],
        },
      ],
    },
    {
      id: "click-to-edit",
      title: "Click to edit, straight from the preview",
      keywords: "live preview edit pill",
      blocks: [
        { type: "paragraph", text: "This is the quickest way to change something you can see." },
        {
          type: "steps",
          items: [
            "Open any page. The live preview sits on the right.",
            "Point at a section ((1)). A dashed outline and purple buttons appear.",
            "Press [[Edit]] ((2)). If the words are shared across the site, a second button ((3)) takes you to Brand wording instead.",
          ],
        },
        {
          type: "screenshot",
          file: "04-click-to-edit-hover.webp",
          width: 904,
          height: 900,
          caption: "On the right is a live preview of the page. Point at any section: it gets a dashed outline and purple Edit buttons appear.",
          title: "Live site click-to-edit",
          callouts: [
            { n: 1, label: "The section you are pointing at" },
            { n: 2, label: "Edit this section (its photo, buttons and layout)" },
            {
              n: 3,
              label: "Edit Brand wording — this section's words are shared across the site and kept there",
            },
            { n: 4, label: "Hide or show the preview" },
            { n: 5, label: "Open the preview in its own tab" },
          ],
        },
        {
          type: "paragraph",
          text: "The form on the left scrolls to the section you clicked, opens it and flashes it ((1)), ready for your changes.",
        },
        {
          type: "screenshot",
          file: "04-click-to-edit-jump.webp",
          width: 1100,
          height: 900,
          caption: "After you click Edit, the form on the left scrolls to that section, opens it and flashes it, ready for your changes.",
          title: "Live site click-to-edit",
          callouts: [
            {
              n: 1,
              label: "The section you clicked (here 03 Experience carousel), opened and highlighted in the form",
            },
          ],
        },
        {
          type: "paragraph",
          text: "Want more room? Open the preview in its own tab with the button at the top of the preview. The website then looks exactly as visitors see it, with [[Edit]] pills on every section ((1)) and a small badge ((2)) that reminds you that you are previewing.",
        },
        {
          type: "screenshot",
          file: "04-preview-tab-edit.webp",
          width: 1200,
          height: 750,
          caption: "In a preview tab the website looks exactly as visitors see it, with Edit pills on every section and a small badge reminding you that you are previewing.",
          title: "Live site click-to-edit",
          callouts: [
            { n: 1, label: "Edit pill — opens this section in the admin" },
            { n: 2, label: "Preview badge — click to leave preview" },
          ],
        },
      ],
    },
    {
      id: "reorder",
      title: "Move, copy or remove a section",
      keywords: "drag order duplicate delete",
      blocks: [
        {
          type: "steps",
          items: [
            "Hold the dotted handle ((1)) on a section's bar and drag it up or down.",
            "Or open its [[…]] menu ((2)) and choose [[Move Up]], [[Move Down]], [[Duplicate]] or [[Remove]] ((3)).",
            "Check the preview, then [[Publish changes]].",
          ],
        },
        {
          type: "screenshot",
          file: "05-homepage-reorder.webp",
          width: 1200,
          height: 508.5,
          caption: "To change the order, drag a section by its dotted handle — or open its … menu and choose Move Up or Move Down.",
          title: "Reorder homepage sections",
          callouts: [
            { n: 1, label: "Drag handle — hold and drag up or down" },
            { n: 2, label: "The … menu for this section" },
            { n: 3, label: "Move up / Move down, Duplicate, Remove" },
          ],
        },
        {
          type: "never",
          text: [
            "Don't remove a section just to rewrite it. Open it and edit instead. A removed section loses its photo and settings. If it happens by accident, press [[Revert to published]] before you publish.",
          ],
        },
      ],
    },
    {
      id: "add-section",
      title: "Add a new section to a page",
      keywords: "add block new section drawer",
      blocks: [
        {
          type: "steps",
          items: [
            "Open the page and scroll to the end of its sections.",
            "Press [[Add Section]]. A panel opens with every kind of section, in groups.",
            "Type a word to search, or open a group such as **Page sections**, and click the one you want.",
            "It is added at the bottom. Drag it into place by its dotted handle (see [Move, copy or remove a section](#reorder)).",
            "Fill in its words, check the preview, and press [[Publish changes]].",
          ],
        },
      ],
    },
    {
      id: "latest-journal-block",
      title: "Latest from the Journal",
      path: "Content > Pages > (a page) > Add Section > Page sections",
      who: "Admin · Editor",
      keywords: "journal blog block section newest stories cards homepage",
      blocks: [
        {
          type: "paragraph",
          text: "This section shows your newest [Journal](#journal-write) stories as a row of cards, with a button to the Journal. It isn't on any page yet; add it where you would like it, for example on the homepage or the About page.",
        },
        {
          type: "steps",
          items: [
            "Open the page and press [[Add Section]] under its sections. Type “journal” in the search box ((1)); it is in the **Page sections** group ((2)). Click **Latest from the Journal** ((3)).",
            "Leave the heading empty to use “Latest from the Journal”, or write your own (two short lines at most). Add a lead sentence if you like.",
            "**How many stories**: 1 to 6. Three fills a row on a computer.",
            "**Only this category**: leave empty for the newest stories from every category, or pick one, such as *New themes*.",
            "**Button**: leave empty for “Read the Journal”, which goes to the Journal page.",
            "Drag it into place, check the preview, and [[Publish changes]].",
          ],
        },
        {
          type: "screenshot",
          file: "38-add-section-journal.webp",
          width: 1200,
          height: 583,
          caption: "Add Section opens every kind of section. Type “journal” to find Latest from the Journal, in the Page sections group, and click it.",
          title: "Add a section",
          callouts: [
            { n: 1, label: "Search the sections" },
            { n: 2, label: "The group it is in: Page sections" },
            { n: 3, label: "Latest from the Journal — click to add it" },
          ],
        },
        {
          type: "tip",
          text: [
            "The cards fill themselves in. When you publish a new journal post, every page with this section shows it within a second or two.",
          ],
        },
      ],
    },
    {
      id: "publish",
      title: "Drafts and publishing",
      keywords: "autosave status changed",
      blocks: [
        {
          type: "steps",
          items: [
            "Make your change ((2)). It is saved as a draft automatically, and the status changes to **Changed** ((1)).",
            "Check the preview ((3)). Only you and your team can see it.",
            "Press [[Publish changes]] ((4)). The website updates within a second or two.",
          ],
        },
        {
          type: "screenshot",
          file: "06-draft-autosaved.webp",
          width: 1200,
          height: 833.5,
          caption: "As you type, your change is saved as a draft every second or so. The preview shows the draft; the public website still shows the published version until you press Publish changes.",
          title: "Draft vs published + live preview",
          callouts: [
            { n: 1, label: "Status — “Changed” means there is an unpublished draft" },
            { n: 2, label: "Your edit (saved automatically as a draft)" },
            { n: 3, label: "The preview shows your draft" },
            { n: 4, label: "Publish changes — puts the draft on the public website" },
          ],
        },
        {
          type: "tip",
          text: [
            "You can close the browser half-way through an edit. The draft waits for you, and the dashboard lists it under **Drafts & scheduled** so nothing is forgotten.",
          ],
        },
        {
          type: "warning",
          title: "Careful",
          text: [
            "Pressing [[Create New]] on Pages, Experiences, Workshop types, Journal, Programmes, Policies, FAQ, Passes or Testimonials saves an empty **Untitled** draft straight away, before you type anything. (Sessions are the exception: nothing is saved until you press a button.)",
            "An abandoned Untitled draft is harmless and never public. To keep the dashboard tidy, the owner can delete it: in the list, tick its box, then press [[Delete]].",
          ],
        },
      ],
    },
    {
      id: "schedule",
      title: "Schedule a change for later",
      keywords: "later timer date time",
      blocks: [
        {
          type: "paragraph",
          text: "Perfect for a new season's prices or a holiday notice that should appear at midnight.",
        },
        {
          type: "steps",
          items: [
            "Make your change as normal, but don't publish.",
            "Click the small arrow next to [[Publish changes]] ((2)) and choose [[Schedule Publish]] ((3)).",
          ],
        },
        {
          type: "screenshot",
          file: "06-publish-menu.webp",
          width: 900,
          height: 200,
          caption: "The small arrow next to Publish changes holds Schedule Publish — choose a date and time and the page goes live by itself.",
          title: "Publish / schedule publish",
          callouts: [
            { n: 1, label: "Publish changes — live now" },
            { n: 2, label: "The arrow opens more options" },
            { n: 3, label: "Schedule Publish — pick a date and time" },
          ],
        },
        {
          type: "steps",
          items: [
            "Choose [[Publish]] (or [[Unpublish]]) ((1)).",
            "Pick the date and time ((2)). Times are Dubai time.",
            "Save the schedule ((3)). Upcoming schedules are listed below ((4)), where you can also cancel them.",
          ],
        },
        {
          type: "screenshot",
          file: "06-schedule-publish.webp",
          width: 900,
          height: 457,
          caption: "Schedule Publish: choose when this draft should go live (Dubai time). You can see and cancel upcoming schedules in the same panel.",
          title: "Publish / schedule publish",
          callouts: [
            { n: 1, label: "Publish or Unpublish" },
            { n: 2, label: "Date and time it should happen" },
            { n: 3, label: "Save the schedule" },
            { n: 4, label: "Upcoming schedules for this page" },
          ],
        },
      ],
    },
    {
      id: "brand-wording",
      title: "Brand wording: shared sentences",
      path: "Settings > Brand wording",
      who: "Admin · Editor",
      keywords: "tagline mission vision shared lines",
      blocks: [
        {
          type: "paragraph",
          text: "Your tagline, mission, vision and a few other lines appear in several places. They are kept once, here. Change them once and every page that uses them updates.",
        },
        {
          type: "steps",
          items: [
            "Pick a tab ((1)): Core, Purpose & community, or Shared lines.",
            "Change the sentence in its box ((2)).",
            "Press [[Save]] ((3)). This goes live straight away.",
          ],
        },
        {
          type: "screenshot",
          file: "12-brand-wording.webp",
          width: 1200,
          height: 958.5,
          caption: "Settings → Brand wording holds the sentences used in several places — the tagline, mission, vision and shared lines. Change them once here and every page that uses them updates.",
          title: "Brand wording",
          callouts: [
            { n: 1, label: "Tabs: Core, Purpose & community, Shared lines" },
            { n: 2, label: "Each box is one shared sentence or paragraph" },
            { n: 3, label: "Save" },
          ],
        },
      ],
    },
    {
      id: "menus",
      title: "Menus and footer",
      path: "Settings > Menus & footer",
      who: "Admin · Editor",
      keywords: "navigation nav footer links",
      blocks: [
        {
          type: "paragraph",
          text: "One list feeds the desktop menu, the phone's bottom bar, the phone menu and the footer. The order here is the order everywhere.",
        },
        {
          type: "steps",
          items: [
            "Choose a tab ((1)): Main menu, Mega menus, Footer or Search.",
            "Drag the dots to reorder items ((2)). Three to seven items fit; there are seven now, the last being **Journal** ((4)), so remove one before you add another.",
            "Press [[Save]] ((3)).",
          ],
        },
        {
          type: "screenshot",
          file: "11-navigation-main-menu.webp",
          width: 1200,
          height: 833,
          caption: "Settings → Menus & footer. One list feeds the desktop bar, the phone bar, the phone menu and the footer — the order here is the order everywhere. Seven items is the most it takes.",
          title: "Navigation and footer",
          callouts: [
            { n: 1, label: "Tabs: Main menu, Mega menus, Footer, Search" },
            { n: 2, label: "Menu items — drag the dots to reorder" },
            { n: 3, label: "Save — the site updates within a moment" },
            { n: 4, label: "Journal — the seventh item" },
          ],
        },
        {
          type: "paragraph",
          text: "Open an item to change its label ((1)), whether it goes to a page on your site or another website ((2)), its address ((3)), and how it shows on phones ((4)).",
        },
        {
          type: "screenshot",
          file: "11-navigation-item.webp",
          width: 1200,
          height: 958.5,
          caption: "Open an item to change its label, where it goes, and how it shows on phones.",
          title: "Navigation and footer",
          callouts: [
            { n: 1, label: "Label shown in the menu" },
            { n: 2, label: "Goes to a page on this site, or another website" },
            { n: 3, label: "The address, e.g. /events" },
            { n: 4, label: "On phones: bottom bar or the menu sheet" },
          ],
        },
        {
          type: "paragraph",
          text: "The **Mega menus** tab holds the panels that open from the menu. The **About** panel's **Links** list takes up to five: today About the Maison, Locations, Gallery, Journal and Contact.",
        },
        {
          type: "paragraph",
          text: "The **Footer** tab ((1)) holds the footer's own wording and link columns ((2)); the second column now includes Journal. Open a column ((3)) to edit its title and links. Policies join the footer's legal row by themselves when “Show in footer legal row” is ticked on the policy.",
        },
        {
          type: "screenshot",
          file: "11-footer.webp",
          width: 1200,
          height: 958.5,
          caption: "The Footer tab holds the footer's own wording and link columns. Policies appear in the footer's legal row when “Show in footer legal row” is ticked on the policy.",
          title: "Navigation and footer",
          callouts: [
            { n: 1, label: "Footer tab" },
            { n: 2, label: "Link columns — one group per column (three look best)" },
            { n: 3, label: "Each column — open it to edit its title and links" },
          ],
        },
      ],
    },
    {
      id: "revert",
      title: "Undo: revert to published",
      keywords: "undo discard draft",
      blocks: [
        {
          type: "paragraph",
          text: "Made a mess of a draft? Throw it away and go back to exactly what is live.",
        },
        {
          type: "steps",
          items: ["Next to the status **Changed** ((1)), press [[Revert to published]] ((2))."],
        },
        {
          type: "screenshot",
          file: "33-revert-to-published.webp",
          width: 960,
          height: 130,
          caption: "Changed your mind before publishing? Next to the status there is Revert to published — the draft is thrown away and the page goes back to what is live.",
          title: "Version history / restore",
          callouts: [
            { n: 1, label: "Status: Changed — there is a draft" },
            { n: 2, label: "Revert to published — discard the draft" },
          ],
        },
        {
          type: "steps",
          items: [
            "Confirm ((1)). The draft is thrown away. The website never changed.",
            "If the page still shows your old draft, reload the page (<<⌘>> <<R>> on a Mac, <<F5>> on Windows). The published version comes back.",
          ],
        },
        {
          type: "screenshot",
          file: "33-revert-confirm.webp",
          width: 1200,
          height: 833.5,
          caption: "You are asked to confirm before anything is thrown away.",
          title: "Version history / restore",
          callouts: [
            { n: 1, label: "Confirm to go back to the published version" },
          ],
        },
      ],
    },
    {
      id: "versions",
      title: "History: see and restore older versions",
      keywords: "history restore rollback undo older version compare",
      blocks: [
        {
          type: "paragraph",
          text: "Every page, experience, workshop type, session and journal post keeps its last 25 versions, with who changed what and when.",
        },
        {
          type: "steps",
          items: [
            "Open the [[Versions]] tab ((1)). The number shows how many are kept.",
            "Each row is a saved version ((2)) with its status ((3)). Click a date to open it.",
          ],
        },
        {
          type: "screenshot",
          file: "33-version-history-list.webp",
          width: 1200,
          height: 466.5,
          caption: "Every page keeps its last 25 versions. Open the Versions tab to see who changed what, and when.",
          title: "Version history / restore",
          callouts: [
            { n: 1, label: "Versions tab — the number is how many are kept" },
            { n: 2, label: "Each row is a saved version — click its date to open it" },
            { n: 3, label: "Status: Published, Draft or Autosave" },
          ],
        },
        {
          type: "steps",
          items: [
            "The changes are highlighted ((2)): red was removed, green was added, compared with ((1)).",
            "Press [[Restore this version]] ((3)). It comes back as a draft, so you can check it first.",
            "Press [[Publish changes]].",
          ],
        },
        {
          type: "screenshot",
          file: "33-version-compare-restore.webp",
          width: 1200,
          height: 566.5,
          caption: "Opening a version shows exactly what changed compared with the current one. Restore this version brings it back (as a draft you can check before publishing).",
          title: "Version history / restore",
          callouts: [
            { n: 1, label: "Which version you are comparing against" },
            { n: 2, label: "Changes are highlighted — red removed, green added" },
            { n: 3, label: "Restore this version" },
          ],
        },
      ],
    },
  ],
};
