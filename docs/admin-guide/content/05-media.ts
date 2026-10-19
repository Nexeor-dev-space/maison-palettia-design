import type { Chapter } from "./types";

export const media: Chapter = {
  slug: "media",
  number: 4,
  title: "Photos & media",
  lede: "Every photograph, the studio film, logos and fonts live in one library. Change a photo once and every page that uses it updates.",
  blurb: "Upload, describe, crop, swap and tidy your photographs.",
  summary: [
    "{{Content > Media}} holds every photo. Search by name or description, or browse by folder.",
    "Every photo needs a short description of what is in it (**alt text**). It helps blind visitors and Google.",
    "Replace a photo's file and every page using it updates at once.",
    "A photo that is still in use can't be deleted. The message tells you where it is used.",
    "Music files are not kept here: they have their own place, {{Content > Music}} (see [Background music](#music-add)).",
  ],
  roles: ["admin", "editor"],
  keywords: "images pictures photos upload library",
  sections: [
    {
      id: "media-library",
      title: "The media library",
      path: "Content > Media",
      who: "Admin · Editor",
      blocks: [
        {
          type: "steps",
          items: [
            "[[Create New]] ((1)) uploads one photo. [[Bulk Upload]] ((5)) takes several photos at once.",
            "Search ((2)) by name or description, or press [[By Folder]] ((4)) to browse by folder.",
            "Click a photo ((3)) to open it.",
          ],
        },
        {
          type: "screenshot",
          file: "09-media-library.webp",
          width: 1200,
          height: 748.5,
          caption: "Content → Media holds every photo, the film, logos and fonts. Create New uploads one photo; Bulk Upload takes several at once. Search by name or description, or browse by folder.",
          title: "Media library",
          callouts: [
            { n: 1, label: "Create New — upload a photo" },
            { n: 2, label: "Search" },
            { n: 3, label: "Click a photo to open it" },
            { n: 4, label: "By Folder — browse your photos by folder" },
            { n: 5, label: "Bulk Upload — several photos at once" },
          ],
        },
      ],
    },
    {
      id: "upload",
      title: "Upload a photo",
      keywords: "add new picture",
      blocks: [
        {
          type: "steps",
          items: [
            "Press [[Create New]], then drag a photo in or click to choose one ((1)). Up to 25 MB.",
            "Describe what is in the picture ((2)).",
            "Say where it came from ((3)): **Studio** for your own photos.",
            "Press [[Save]] ((4)).",
          ],
        },
        {
          type: "screenshot",
          file: "09-media-upload.webp",
          width: 1100,
          height: 900,
          caption: "Uploading: drag a photo in (or click to choose one), describe what is in it, say where it came from, then Save.",
          title: "Media library — upload",
          callouts: [
            { n: 1, label: "The photo you chose (up to 25 MB)" },
            { n: 2, label: "Alt text — describe what is in the picture" },
            { n: 3, label: "Where it came from — Studio for your own photos" },
            { n: 4, label: "Save" },
          ],
        },
        {
          type: "tip",
          text: [
            "Use photos at least 2000 pixels wide for big hero spaces. The admin warns you about anything under 1000 pixels. Square or landscape photos crop most gracefully on phones.",
          ],
        },
      ],
    },
    {
      id: "alt-text",
      title: "Describe a photo (alt text)",
      keywords: "alt text description accessibility",
      blocks: [
        {
          type: "paragraph",
          text: "Alt text is a short sentence that describes the picture. Screen readers read it aloud to blind visitors, and Google uses it to understand your site.",
        },
        {
          type: "steps",
          items: [
            "Open the photo. Write what is in the frame ((1)).",
            "Only for textures and backgrounds with no meaning, tick **Decorative only** ((2)) instead.",
            "Check where it came from ((3)). **Used on** ((4)) lists every place it appears, including journal posts (as the cover, the author's photo, or a photo inside the text).",
            "Press [[Save]] ((5)). The website updates within a moment.",
          ],
        },
        {
          type: "screenshot",
          file: "09-media-alt-text.webp",
          width: 1100,
          height: 1000,
          caption: "Open a photo to change its description (alt text). “Used on” lists every place it appears. Save, and the website updates within a moment.",
          title: "Media library — alt text",
          callouts: [
            { n: 1, label: "Alt text — what is in the frame" },
            { n: 2, label: "Decorative only — for textures with no meaning" },
            { n: 3, label: "Where it came from (Studio, Stock, AI-generated, Unknown)" },
            { n: 4, label: "Used on — every place this photo appears" },
            { n: 5, label: "Save" },
          ],
        },
        {
          type: "mock",
          label: "Alt text, good and weak",
          html: "<div class=\"split\"><div class=\"panel\"><span class=\"chip g\">Good</span><p>“Two guests painting ceramic plates with blue glaze at a long studio table.”</p><p class=\"muted\">Says who, what and where in one sentence.</p></div><div class=\"panel\"><span class=\"chip r\">Weak</span><p>“IMG_4821” or “beautiful photo of our amazing workshop”</p><p class=\"muted\">A file name, or words that describe nothing.</p></div></div>",
        },
      ],
    },
    {
      id: "focal-point",
      title: "Keep the important part in view (focal point)",
      keywords: "crop centre center",
      blocks: [
        {
          type: "paragraph",
          text: "The site crops photos differently for a wide card or a tall phone screen. The focal point tells it which part must always stay in view, such as a face or a pair of hands.",
        },
        {
          type: "steps",
          items: [
            "Open the photo and press [[Edit Image]].",
            "Drag the dot onto the most important spot ((1)), or type the position ((2)).",
            "[[Apply changes]], then [[Save]] the photo ((3)).",
          ],
        },
        {
          type: "screenshot",
          file: "09-media-focal-point.webp",
          width: 1200,
          height: 833.5,
          caption: "Edit Image → drag the focal point onto the most important part of the picture. When the site crops the photo for a card or a phone screen, it keeps that spot in view.",
          title: "Media library — focal point",
          callouts: [
            { n: 1, label: "Drag the dot to the important spot" },
            { n: 2, label: "Or type the position (X and Y, in %)" },
            { n: 3, label: "Apply changes, then Save the photo" },
          ],
        },
      ],
    },
    {
      id: "swap-photo",
      title: "Swap a photo everywhere at once",
      keywords: "replace change photo",
      blocks: [
        {
          type: "paragraph",
          text: "New photograph of the candle table? Replace the file and every page that used the old one shows the new one.",
        },
        {
          type: "steps",
          items: ["Open the photo and press the [[×]] on the file ((1)). Nothing changes until you save."],
        },
        {
          type: "screenshot",
          file: "09-media-swap-step1.webp",
          width: 1200,
          height: 250,
          caption: "Swap a photo everywhere at once, step 1: open the photo and press the × on the file.",
          title: "Media library — swap a photo",
          callouts: [
            { n: 1, label: "× — take this file out (nothing changes until you Save)" },
          ],
        },
        {
          type: "steps",
          items: [
            "Drop in the new picture ((1)).",
            "Check the alt text still describes it ((2)).",
            "Every place listed under **Used on** ((3)) gets the new photo when you press [[Save]] ((4)).",
          ],
        },
        {
          type: "screenshot",
          file: "09-media-swap-photo.webp",
          width: 1200,
          height: 833.5,
          caption: "Step 2: drop in the new picture, check the alt text still describes it, and Save. Every page that used the old photo now shows the new one.",
          title: "Media library — swap a photo",
          callouts: [
            { n: 1, label: "The new file, waiting to be saved" },
            { n: 2, label: "Check the alt text still describes it" },
            { n: 3, label: "Every place it is used gets the new photo" },
            { n: 4, label: "Save" },
          ],
        },
      ],
    },
    {
      id: "cannot-delete",
      title: "Why a photo won't delete",
      who: "Delete: Admin only",
      keywords: "delete remove used by",
      blocks: [
        {
          type: "paragraph",
          text: "A photo that is still used somewhere can't be deleted, so the website never shows a broken picture. The message lists every place it is used ((1)), journal posts included, and the same list is always on the photo's page ((2)).",
        },
        {
          type: "steps",
          items: [
            "Replace the photo on each of those pages first (or swap the file, above).",
            "Then delete it. Only the owner (Admin) can delete photos; Editors don't see the Delete option.",
          ],
        },
        {
          type: "screenshot",
          file: "09-media-cannot-delete.webp",
          width: 400,
          height: 555,
          caption: "A photo that is still used somewhere cannot be deleted — the message says exactly where. Replace it on those pages first (or swap the file instead), then delete.",
          title: "Media library — why a used photo cannot be deleted",
          callouts: [
            { n: 1, label: "The message lists every place the photo is used" },
            { n: 2, label: "The same list is always shown here" },
          ],
          maxWidth: 400,
        },
      ],
    },
    {
      id: "photo-rules",
      title: "Photos you may use",
      blocks: [
        {
          type: "never",
          text: [
            "**Never upload a photo you don't have the right to use**, and always set “Where it came from” honestly. Photos marked *AI-generated* or *Unknown* can't appear in the big hero and card spaces unless the owner allows it under {{Settings > Site details > Advanced}}.",
            "**Children:** tick **Model/parent consent on file** only when you really have it. Otherwise replace the photo.",
          ],
        },
      ],
    },
  ],
};
