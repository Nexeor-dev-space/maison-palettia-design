import type { Chapter } from "./types";

export const music: Chapter = {
  slug: "music",
  number: 8,
  title: "Background music",
  lede: "A small music player sits in the corner of every page. You choose the tracks, give each one its proper credit, and switch the player on or off.",
  blurb: "Add a track with its credit, switch the player on or off, and keep it off the checkout.",
  summary: [
    "{{Content > Music}} holds the tracks. {{Settings > Music}} switches the player on or off and sets the volume.",
    "Music starts by itself when a visitor arrives (or on their first tap, where the browser insists). Visitors can pause it, and it stays off for them.",
    "Every track must be credited. Fill in the title, creator, where it came from and its licence; the site prints the credit for you.",
    "Never use a track whose licence says **NC** (non-commercial). This is a business website.",
  ],
  roles: ["admin", "editor"],
  keywords: "music audio sound player track song playlist credit licence attribution",
  intro: [
    {
      type: "mock",
      label: "What visitors see",
      html: "<div class=\"panel\"><div class=\"row\"><span class=\"chip g\">♪ Studio sounds</span><span>A small round button in the corner of every page. Music starts when the visitor arrives, at the volume you chose.</span></div><div class=\"row\"><span class=\"chip\">Pause</span><span>One press stops it, and it stays off for that visitor until they press play again.</span></div><div class=\"row\"><span class=\"chip\">Credits</span><span>The playing track is credited beside the player, and every track is listed on <b>/music-credits</b>.</span></div><div class=\"row\"><span class=\"chip n\">Off</span><span>Never on checkout and payment pages.</span></div></div>",
    },
  ],
  sections: [
    {
      id: "music-add",
      title: "Add a track",
      path: "Content > Music",
      who: "Admin · Editor",
      keywords: "upload mp3 add song track",
      blocks: [
        {
          type: "steps",
          items: [
            "Open {{Content > Music}} and press [[Create New]] ((1)). [[Bulk Upload]] ((2)) takes several files at once; you then fill in each one.",
            "Drop in the audio file: MP3, M4A, AAC or OGG.",
          ],
        },
        {
          type: "screenshot",
          file: "36-music-list.webp",
          width: 1200,
          height: 467,
          caption: "Content → Music lists your tracks with their creator, licence and whether they are in the playlist.",
          title: "Music",
          callouts: [
            { n: 1, label: "Create New — add one track" },
            { n: 2, label: "Bulk Upload — several tracks at once" },
            { n: 3, label: "Click a track to open it" },
          ],
        },
      ],
    },
    {
      id: "music-credit",
      title: "Fill in the credit",
      keywords: "credit attribution licence creative commons cc by pixabay source creator",
      blocks: [
        {
          type: "paragraph",
          text: "“Copyright-free” music almost always comes with a licence that asks you to say who made it. These fields build that credit for you.",
        },
        {
          type: "steps",
          items: [
            "Check the file ((1)) is the one you meant.",
            "Type the **Track title** and the **Creator** ((2)), exactly as the source names them. Add the creator's page if they have one.",
            "Say **Where it came from** and paste the **Link to the track** ((3)).",
            "Choose the **Licence** ((4)) from the download page. Tick **I edited this track** if you trimmed, looped or faded it.",
            "If the source gives you exact words to copy, paste them into **Exact credit line** ((5)). Otherwise leave it empty.",
            "Read **Credit shown on the site** ((6)). This is exactly what visitors see; make sure it reads well.",
            "Leave **In the playlist** ((7)) ticked, and press [[Save]] ((8)). There are no drafts: it plays on the site straight away if the player is on.",
          ],
        },
        {
          type: "screenshot",
          file: "36-music-track.webp",
          width: 1200,
          height: 1083,
          caption: "A track: the file, its title and creator, where it came from, its licence, and the credit the site prints. In the playlist (right) takes it off the site without deleting it.",
          title: "Music track",
          callouts: [
            { n: 1, label: "The audio file (MP3, M4A, AAC or OGG)" },
            { n: 2, label: "Track title and Creator — required" },
            { n: 3, label: "Where it came from, and a link to the track" },
            { n: 4, label: "Licence" },
            { n: 5, label: "Exact credit line (optional)" },
            { n: 6, label: "Credit shown on the site — check it reads well" },
            { n: 7, label: "In the playlist — untick to take it off the site" },
            { n: 8, label: "Save" },
          ],
        },
        {
          type: "table",
          head: ["Licence in the list", "What it means for you"],
          rows: [
            ["Creative Commons Attribution 4.0 or 3.0 (CC BY)", "Free to use; the credit must be shown. The site does this."],
            ["Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA)", "The same, and an edited version must keep the same licence."],
            ["Public domain (CC0)", "No credit needed, though the site still lists it."],
            ["Pixabay Content License", "Free to use from Pixabay; no credit needed."],
            ["Other", "Give the licence's link, or paste the exact credit line the source asks for."],
          ],
        },
        {
          type: "never",
          text: [
            "Never use a track marked **NC** (non-commercial) or one you found without a licence. NC licences are left out of the list on purpose: the studio's website is a business.",
          ],
        },
      ],
    },
    {
      id: "music-settings",
      title: "Switch the player on or off",
      path: "Settings > Music",
      who: "Admin · Editor",
      keywords: "volume shuffle off on hide player pages",
      blocks: [
        {
          type: "steps",
          items: [
            "Tick **Show the music player** ((1)). The player appears only while this is ticked *and* at least one track is in the playlist.",
            "Set the **Starting volume** ((2)), from 5 to 100%. 40% is a gentle background. Visitors can change it.",
            "Tick **Shuffle the playlist** ((3)), or leave it to play tracks in their display order.",
            "The **Button label** ((4)) is read aloud to blind visitors and shown when the player opens.",
            "**Pages without the player** ((5)) keeps it off where it would distract. Checkout and payment pages are already listed. End an address with `*` to cover every page beneath it, for example `/journal/*`.",
            "Press [[Save]] ((6)). It goes live straight away.",
          ],
        },
        {
          type: "screenshot",
          file: "36-music-settings.webp",
          width: 1200,
          height: 717,
          caption: "Settings → Music: whether the player shows, its starting volume, shuffle, its label, and the pages it stays off.",
          title: "Settings — Music",
          callouts: [
            { n: 1, label: "Show the music player" },
            { n: 2, label: "Starting volume (5–100%)" },
            { n: 3, label: "Shuffle the playlist" },
            { n: 4, label: "Button label" },
            { n: 5, label: "Pages without the player" },
            { n: 6, label: "Save" },
          ],
        },
        {
          type: "info",
          title: "Today",
          text: [
            "The player is on at 40%, not shuffled, labelled “Studio sounds”, and off on checkout, payment and booking-status pages. There is one track in the playlist.",
          ],
        },
        {
          type: "tip",
          text: [
            "Want silence for a while? Untick **Show the music player** and Save. To drop a single track, untick **In the playlist** on that track instead of deleting it.",
          ],
        },
      ],
    },
  ],
};
