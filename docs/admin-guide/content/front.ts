import type { GuideFront } from "./types";

export const front: GuideFront = {
  title: "Admin Guide",
  kicker: "Maison Palettia · Studio handbook",
  welcome: {
    script: "Welcome,",
    headline: "everything you need to **run the studio's website**, in one place.",
    lede: "This handbook is for you and your team. It walks through every job in the admin with real screenshots, from changing a sentence on the homepage to writing a journal post and scanning tickets at the door. Read it front to back once, then come back when you need a recipe. It is always one click away: **Docs** at the top of the admin's menu.",
  },
  facts: [
    { label: "Your admin", value: "maisonpalettia.com/admin" },
    { label: "Find anything", value: "<<⌘>> <<K>> or <<Ctrl>> <<K>>" },
    { label: "Safe to try", value: "Nothing is public until you publish" },
  ],
  howToRead: [
    {
      title: "Numbered circles",
      text: "Lilac circles on a screenshot, like ((1)), match the same numbers in the steps and in the list under the picture.",
    },
    {
      title: "Where to click",
      text: "A grey pill such as {{Settings > Site details}} is the route through the admin's left menu.",
    },
    {
      title: "Who can do it",
      text: "A dashed badge such as Owner says which role can do the job. Chapter 17 explains roles.",
    },
    {
      title: "Coloured notes",
      text: "**Tip** saves time. **Careful** needs a moment's thought. **Never** protects customers' money and data.",
    },
    {
      title: "Page numbers",
      text: "When the text points elsewhere in the guide, the page number follows in brackets, for example [Brand wording](#brand-wording).",
    },
    {
      title: "Ticking off",
      text: "The day one checklist has a box beside each item. Tick them with a pen as you go.",
    },
  ],
  colophon: [
    "Stuck on something this handbook doesn't cover? Send Nexeor a screenshot of the dashboard and the page you are on. The coloured notes usually say exactly what happened.",
    "Screenshots show the admin as it was on 19 October 2026: mostly the live admin, with a few examples (the journal post, the desk booking) made up for the pictures and never saved. Earlier pictures show example data from a test copy.",
  ],
  edition: "19 October 2026",
};
