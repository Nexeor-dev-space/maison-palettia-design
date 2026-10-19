import type { Chapter } from "./types";

export const seo: Chapter = {
  slug: "seo",
  number: 9,
  title: "SEO & sharing",
  lede: "SEO means “search engine optimisation”: helping Google show the right words for each page. You only need two short sentences and a picture.",
  blurb: "How you appear on Google and when your link is shared.",
  summary: [
    "Pages, experiences, workshop types, sessions, programmes, policies and journal posts each have an [[SEO]] tab.",
    "For booked classes, write the SEO words on the **workshop type** and the **experience**: Google treats the type's page as the main one for its dates.",
    "Title: 50–60 characters. Description: 100–150 characters. [[Auto-generate]] writes a first draft for you.",
    "The share image is the picture people see when your link is sent on WhatsApp or posted on social media.",
    "Redirects send an old address to a new one, which is handy for printed flyers.",
  ],
  roles: ["admin", "editor"],
  keywords: "google search engine whatsapp social share title description redirect",
  sections: [
    {
      id: "seo-panel",
      title: "The SEO tab",
      keywords: "meta title description",
      blocks: [
        {
          type: "steps",
          items: [
            "Open the page and choose the [[SEO]] tab ((1)).",
            "Write the title ((2)), or press [[Auto-generate]] and polish it.",
            "Write the description ((3)): one inviting sentence about the page.",
            "Choose a share image ((4)). Check the preview of the search result ((5)).",
            "Leave **Hide from search engines** ((6)) unticked unless Nexeor asks.",
            "[[Publish changes]].",
          ],
        },
        {
          type: "screenshot",
          file: "10-seo-panel.webp",
          width: 580,
          height: 990,
          caption: "Pages, experiences, workshop types, sessions, programmes, policies and journal posts each have an SEO tab: the title and description Google shows, and the picture used when the link is shared on WhatsApp or social media.",
          title: "SEO panel",
          callouts: [
            { n: 1, label: "SEO tab" },
            { n: 2, label: "Title — 50–60 characters; Auto-generate writes one for you" },
            { n: 3, label: "Description — 100–150 characters" },
            { n: 4, label: "Share image — shown when the link is shared" },
            { n: 5, label: "Preview of the search result" },
            { n: 6, label: "Hide from search engines (rarely needed)" },
          ],
          maxWidth: 580,
        },
        {
          type: "info",
          title: "Good to know",
          text: [
            "Google is always told your site is `https://maisonpalettia.com`. The `www.` address sends visitors there, and Nexeor's test copy is hidden from search engines automatically. Nothing to set.",
            "A dated session tells Google that its workshop type's page is the main one, and dated sessions are left out of the list of pages Google is given. So put your best SEO title and description on the **workshop type** and the **experience**. A session's SEO tab mainly changes how its link looks when shared.",
            "Journal posts get their own share picture automatically.",
          ],
        },
      ],
    },
    {
      id: "share-preview",
      title: "What a shared link looks like",
      keywords: "whatsapp instagram facebook preview card",
      blocks: [
        {
          type: "paragraph",
          text: "When someone sends your page on WhatsApp, it shows the share image, the title and the start of the description. A good share image makes people tap.",
        },
        {
          type: "mock",
          label: "Example: your link on WhatsApp",
          html: "<div class=\"share\"><div class=\"card\"><div class=\"img\">Share image</div><div class=\"meta\"><b>Candle Making Workshop in Dubai | Maison Palettia</b><span>Pour, scent and decorate your own candle in a calm two-hour session. All materials included.</span><i>maisonpalettia.com</i></div></div><span class=\"msg\">Shall we do this on Sunday?</span></div>",
        },
        {
          type: "tip",
          text: [
            "Choose share images that are landscape, bright, and have no words on them. Set a default for the whole site under {{Settings > Search & sharing defaults}}.",
          ],
        },
      ],
    },
    {
      id: "redirects",
      title: "Redirects",
      path: "Content > Redirects",
      who: "Admin · Editor",
      keywords: "flyer short link old address url",
      blocks: [
        {
          type: "paragraph",
          text: "A redirect sends visitors from an old address to a new one. When you rename a published page, workshop type, journal post or journal category, one is added for you automatically.",
        },
        {
          type: "steps",
          items: [
            "From ((1)): the old or short address, such as `/flyer`.",
            "To ((2)): where visitors should land.",
            "Tick **Permanent** ((3)) if the old address will never come back.",
            "[[Save]] ((4)).",
          ],
        },
        {
          type: "screenshot",
          file: "18-redirect-edit.webp",
          width: 1200,
          height: 366.5,
          caption: "Content → Redirects send an old address to a new one — handy for a printed flyer. Renaming a published page adds one automatically.",
          title: "Redirects",
          callouts: [
            { n: 1, label: "From — the old address, e.g. /flyer" },
            { n: 2, label: "To — where visitors should land" },
            { n: 3, label: "Permanent — tick if the old address will never come back" },
            { n: 4, label: "Save" },
          ],
        },
      ],
    },
  ],
};
