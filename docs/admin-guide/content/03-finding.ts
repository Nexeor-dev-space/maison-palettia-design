import type { Chapter } from "./types";

export const finding: Chapter = {
  slug: "finding",
  number: 2,
  title: "Finding anything",
  lede: "You never need to remember where something lives. One keyboard shortcut finds it.",
  blurb: "⌘K jumps to any page, order, email address or sentence.",
  summary: [
    "Press <<⌘>> <<K>> on a Mac, or <<Ctrl>> <<K>> on Windows, anywhere in the admin. Or click **Search or jump to…** at the top of the menu.",
    "Type a page name, an experience, a journal post, a booking reference (`MP-…`), a customer's email, or a setting such as “TRN”.",
    "To find where a sentence on the website is kept, start with a quote mark <<\">> and type a few of its words. Give it a few seconds.",
    "Arrow keys move, <<Enter>> opens, <<Esc>> closes.",
  ],
  roles: [],
  keywords: "search command palette cmd k ctrl k find text",
  sections: [
    {
      id: "cmdk",
      title: "Open the search box",
      who: "Everyone",
      keywords: "shortcut keyboard",
      blocks: [
        {
          type: "steps",
          items: [
            "Press <<⌘>> <<K>> (Mac) or <<Ctrl>> <<K>> (Windows).",
            "Start typing in the box ((1)). Before you type, it shows shortcuts to common jobs ((2)), such as [[Write a journal post]] ((4)) and [[Open the guide]] ((5)).",
            "Press <<Enter>> to open the highlighted line, or click any line. The keys are listed at the bottom ((3)).",
          ],
        },
        {
          type: "screenshot",
          file: "03-cmdk-open.webp",
          width: 1200,
          height: 837,
          caption: "Press ⌘K on a Mac (Ctrl K on Windows) anywhere in the admin. The search box opens with shortcuts to common jobs, including Write a journal post and Open the guide.",
          title: "Command palette (⌘K)",
          callouts: [
            { n: 1, label: "Type here — a page, an order number, an email, a sentence" },
            { n: 2, label: "Shortcuts — press Enter to open the highlighted one" },
            { n: 3, label: "Keyboard help: arrows to move, Enter to open, Esc to close" },
            { n: 4, label: "Write a journal post" },
            { n: 5, label: "Open the guide — this handbook" },
          ],
          maxWidth: 760,
        },
      ],
    },
    {
      id: "find-page",
      title: "Find a page or an experience",
      blocks: [
        {
          type: "steps",
          items: [
            "Type part of its name ((1)).",
            "Results are grouped: pages, experiences, sessions, journal posts and more. Open the one you want ((2)).",
          ],
        },
        {
          type: "screenshot",
          file: "03-cmdk-find-page.webp",
          width: 748,
          height: 678,
          caption: "Find a page: type part of its name. Results are grouped — pages, experiences, sessions and more.",
          title: "Command palette (⌘K)",
          callouts: [
            { n: 1, label: "What you typed" },
            { n: 2, label: "The matching page — press Enter or click to open it" },
          ],
          maxWidth: 748,
        },
        {
          type: "tip",
          text: [
            "Journal posts show under **Journal**, with their address (`/journal/…`). Type “journal” to jump straight to {{Content > Journal}} or {{Content > Journal categories}}, and “guide” for this handbook.",
          ],
        },
      ],
    },
    {
      id: "find-order",
      title: "Find a booking",
      keywords: "order reference email customer",
      blocks: [
        {
          type: "steps",
          items: [
            "Type the booking reference (it starts `MP-`) or the customer's email ((1)).",
            "Click the order ((2)). It opens straight onto that booking.",
          ],
        },
        {
          type: "screenshot",
          file: "03-cmdk-find-order.webp",
          width: 748,
          height: 344,
          caption: "Find an order: type the booking reference (it starts MP-) or the customer's email.",
          title: "Command palette (⌘K)",
          callouts: [
            { n: 1, label: "Booking reference or email" },
            { n: 2, label: "The order — opens straight onto it" },
          ],
          maxWidth: 748,
        },
        {
          type: "tip",
          text: [
            "On the phone with a customer? Ask for the email they booked with. It is quicker to spell than a reference.",
          ],
        },
      ],
    },
    {
      id: "find-text",
      title: "Where does this sentence live?",
      keywords: "find text wording sentence quote",
      blocks: [
        {
          type: "paragraph",
          text: "You can see a sentence on the website and want to change it, but which page holds it? Some wording is shared across several pages, so this saves a lot of hunting. It looks through pages, settings, journal posts and journal categories.",
        },
        {
          type: "steps",
          items: [
            "Type a quote mark, then a few words exactly as they appear on the website ((1)). The ordinary <<\">> key on your keyboard works; you don't need a curly one.",
            "The search shows where that wording is kept ((2)). Click to open it there and edit.",
          ],
        },
        {
          type: "screenshot",
          file: "03-cmdk-find-sentence.webp",
          width: 748,
          height: 272,
          caption: "Where does this sentence live? Start with a quote mark (“) and type a few words you can see on the website. The palette shows which page or setting holds them.",
          title: "Command palette (⌘K)",
          callouts: [
            { n: 1, label: "Start with “ then type words from the website" },
            { n: 2, label: "Where that wording is kept — click to edit it there" },
          ],
          maxWidth: 748,
        },
        {
          type: "tip",
          text: [
            "It searches every page and setting, so give it a few seconds. While it works it says **Searching…**.",
          ],
        },
      ],
    },
  ],
};
