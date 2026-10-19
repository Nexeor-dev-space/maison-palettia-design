import type { Chapter } from "./types";

export const moreContent: Chapter = {
  slug: "more-content",
  number: 6,
  title: "Private events, venues, FAQs, policies, passes",
  lede: "These all work like experiences: open, change, publish. Here is what each one is for.",
  blurb: "The rest of the site's content, from birthday parties to your terms.",
  summary: [
    "**Programmes** are your private-event offers: birthdays, corporate, schools and more.",
    "**Venues** are the places sessions happen; a map pin gives each one a map in the Maison's colours. **FAQs** fill the FAQ page.",
    "**Policies** are your terms and privacy pages. Tick where each should appear.",
    "**Passes** are multi-session bundles. **Testimonials** only appear with written permission.",
  ],
  roles: ["admin", "editor"],
  keywords: "programmes birthday corporate schools venues faq policies terms privacy passes loyalty testimonials",
  sections: [
    {
      id: "programmes",
      title: "Programmes (private events)",
      path: "Content > Programmes",
      who: "Admin · Editor",
      keywords: "birthday corporate school private event",
      blocks: [
        {
          type: "steps",
          items: [
            "Name the programme ((1)).",
            "Write the short line for cards and the longer line for its own page ((2)).",
            "Choose a photograph ((3)) and whether it shows in the Private events menu ((4)).",
            "[[Publish changes]] ((5)).",
          ],
        },
        {
          type: "screenshot",
          file: "17-programme-edit.webp",
          width: 1200,
          height: 833.5,
          caption: "Content → Programmes: birthday parties, corporate events, schools and more — each with a short card line, a longer line and a photograph.",
          title: "Programmes",
          callouts: [
            { n: 1, label: "Programme name" },
            { n: 2, label: "Short line (cards) and longer line (its page)" },
            { n: 3, label: "Photograph" },
            { n: 4, label: "Show in the Private events menu" },
            { n: 5, label: "Publish changes" },
          ],
        },
      ],
    },
    {
      id: "venues",
      title: "Venues",
      path: "Content > Venues",
      who: "Admin · Editor",
      keywords: "location address map directions",
      blocks: [
        {
          type: "steps",
          items: [
            "The venue name and area ((1)) print on session pages.",
            "Descriptions ((2)) appear on the venue and event pages.",
            "The directions link ((3)) opens maps on the customer's phone. Paste a Google Maps link.",
            "Set the **Pin** ((4)) so the site draws its own map in the Maison's colours: paste the centre's Google Maps link into the box under Latitude and Longitude, and press [[Use these]] ((5)). Check it with **Check on Google Maps →**. [[Clear pin]] removes it.",
            "Partnership status ((6)): current or past. Then [[Save]] ((7)).",
          ],
        },
        {
          type: "screenshot",
          file: "16-venue-edit.webp",
          width: 1200,
          height: 833,
          caption: "Content → Venues: where sessions take place. The name and area print on session pages; the directions link opens maps on the customer's phone; the pin draws the site's own map.",
          title: "Venues",
          callouts: [
            { n: 1, label: "Venue name and city / district" },
            { n: 2, label: "Descriptions for the venue and event pages" },
            { n: 3, label: "Directions link" },
            { n: 4, label: "Pin — paste the Google Maps link in the box under it" },
            { n: 5, label: "Use these · Clear pin · Check on Google Maps →" },
            { n: 6, label: "Partnership status — current or past" },
            { n: 7, label: "Save" },
          ],
        },
        {
          type: "info",
          title: "Good to know",
          text: [
            "With a pin, the site draws its own map in the Maison's colours. Without one it shows a plain Google map found by searching the name. **Map search override** is only used when there is no pin. Times Square Center already has its pin.",
          ],
        },
      ],
    },
    {
      id: "faqs",
      title: "FAQs",
      path: "Content > FAQ",
      who: "Admin · Editor",
      keywords: "questions answers",
      blocks: [
        {
          type: "steps",
          items: ["[[Create New]] ((1)) adds a question. Click a question ((2)) to edit it."],
        },
        {
          type: "screenshot",
          file: "13-faqs-list.webp",
          width: 1200,
          height: 833.5,
          caption: "Content → FAQ lists every question. Create New adds one; click a question to edit it.",
          title: "FAQs",
          callouts: [
            { n: 1, label: "Create New — add a question" },
            { n: 2, label: "Click a question to edit it" },
          ],
        },
        {
          type: "steps",
          items: [
            "Write the question ((1)).",
            "Choose where the answer comes from ((2)): written here, or shared wording. Then type the answer ((6)).",
            "Pick its section of the FAQ page ((3)) and its position ((4)). Lower numbers come first.",
            "[[Publish changes]] ((5)).",
          ],
        },
        {
          type: "screenshot",
          file: "13-faq-edit.webp",
          width: 1200,
          height: 466.5,
          caption: "An FAQ: the question, its answer, which section of the FAQ page it sits in, and its position. Publish changes to update the site.",
          title: "FAQs",
          callouts: [
            { n: 1, label: "The question" },
            { n: 2, label: "Where the answer comes from — written here, or shared wording" },
            { n: 3, label: "Section of the FAQ page" },
            { n: 4, label: "Display order — lower numbers first" },
            { n: 5, label: "Publish changes" },
            { n: 6, label: "The answer — type it here" },
          ],
        },
      ],
    },
    {
      id: "policies",
      title: "Policies",
      path: "Content > Policies",
      who: "Admin · Editor",
      keywords: "terms privacy refund cancellation legal",
      blocks: [
        {
          type: "steps",
          items: [
            "Each policy has a title and a short label for the footer ((1)), and a summary ((2)).",
            "Open a section ((3)) to edit its paragraphs.",
            "Tick **Show in footer legal row** ((4)) for Privacy and Terms.",
            "Tick **Require agreement at checkout** ((5)) if customers must accept it before paying.",
          ],
        },
        {
          type: "screenshot",
          file: "14-policy-edit.webp",
          width: 1200,
          height: 833.5,
          caption: "Content → Policies: each policy has a title, a short footer label, a summary and sections of paragraphs. The tick boxes on the right decide where it appears.",
          title: "Policies",
          callouts: [
            { n: 1, label: "Title and short footer label" },
            { n: 2, label: "Summary" },
            { n: 3, label: "Sections — open one to edit its paragraphs" },
            { n: 4, label: "Show in footer legal row" },
            { n: 5, label: "Require agreement at checkout" },
          ],
        },
        {
          type: "warning",
          text: [
            "Policies are legal promises. Ask your adviser before changing refund or cancellation terms, and make sure the “Ready for you” wording matches what your DIY policy says about materials. You find it under {{Settings > Booking & checkout wording > Event page tab}}, in the “Ready for you” body.",
          ],
        },
      ],
    },
    {
      id: "passes",
      title: "Passes",
      path: "Content > Passes",
      who: "Admin · Editor",
      keywords: "loyalty bundle package credits",
      blocks: [
        {
          type: "steps",
          items: [
            "Name the pass and describe it in one sentence ((1)).",
            "Set the price ((2)), how many sessions it includes and how long it is valid ((3)).",
            "Untick **On sale online** ((4)) to show a pass without selling it.",
            "[[Publish changes]] ((5)). Drafts stay hidden, and the loyalty page shows a friendly “coming soon”.",
          ],
        },
        {
          type: "screenshot",
          file: "15-pass-edit.webp",
          width: 1200,
          height: 833.5,
          caption: "Content → Passes: name, one sentence, price, how many sessions it includes and how long it is valid. Untick “On sale online” to show it without selling it.",
          title: "Passes",
          callouts: [
            { n: 1, label: "Pass name and one-sentence description" },
            { n: 2, label: "Price (AED)" },
            { n: 3, label: "Sessions included and validity" },
            { n: 4, label: "On sale online" },
            { n: 5, label: "Publish changes" },
          ],
        },
      ],
    },
    {
      id: "testimonials",
      title: "Testimonials",
      path: "Content > Testimonials",
      who: "Admin · Editor",
      keywords: "reviews quotes permission",
      blocks: [
        {
          type: "paragraph",
          text: "Short quotes from guests, shown wherever a page asks for them. Only quotes with permission ticked are published.",
        },
        {
          type: "mock",
          label: "Content › Testimonials › New",
          html: "<div class=\"panel\"><label class=\"field\"><span>Quote</span><span class=\"input\">“The calmest Sunday afternoon I've had in months. I left with a candle I actually love.”</span></label><div class=\"row\"><label class=\"field\"><span>Who said it</span><span class=\"input\">Layla, Dubai Marina</span></label><label class=\"field\"><span>Experience</span><span class=\"input\">Candle Making</span></label></div><span class=\"check\"><i class=\"on\"></i>Written permission to publish</span><div class=\"row\"><span class=\"btn primary\">Publish changes</span></div></div>",
        },
        {
          type: "never",
          text: [
            "Never invent or polish a quote. Only real words from real guests, and only after they have agreed in writing (an email or message is fine).",
          ],
        },
      ],
    },
    {
      id: "menu-others",
      title: "Other things in the menu",
      keywords: "vibes find your vibe how it is sold status flag display order settings changes system background jobs see tasks seat counters payment events",
      blocks: [
        {
          type: "paragraph",
          text: "A few menu items and fields are not covered elsewhere. Here is what each is for, so you know whether to touch it.",
        },
        {
          type: "table",
          head: ["In the menu", "What it is"],
          rows: [
            [
              "{{Content > Vibes}}",
              "Moods such as “Mindful & Chill”. Tag an experience with a vibe (on the experience, in the right-hand column), or a single session (in its right-hand column; empty means it takes the experience's). The Events page then offers a **Vibe** filter and “Find your vibe”. Until something is tagged, there is nothing to filter by.",
            ],
            [
              "On an experience: **How it is sold**",
              "**Create Anytime** (walk in, no booking) or **Create Together** (booked for a date). Only Create Together experiences can have sessions.",
            ],
            [
              "On an experience: **Status flag**",
              "A short word shown instead of “Any time” or “Scheduled”, such as *Coming soon*. Leave it empty when the class is running.",
            ],
            ["{{Content > Workshop types}}", "The themes and levels of a booked experience. See [Workshop types](#workshop-types)."],
            ["{{Content > Music}} and {{Settings > Music}}", "The background music and its credits. See [Background music](#music-add)."],
            ["{{Content > Journal}} and {{Content > Journal categories}}", "The studio's blog. See [The Journal](#journal-write)."],
            ["**Display order** (many items)", "Its position in lists. Lower numbers come first."],
            [
              "{{Settings (admin) > Settings changes}}",
              "A read-only list of who changed which important setting, and when. Look here if a setting changed and nobody remembers why.",
            ],
            [
              "The **System** group (Seat counters, Payment events, Seat holds, Invoice PDFs, Background jobs and more)",
              "The machinery behind bookings and payments. It is for Nexeor: look if you are curious, but don't change anything.",
            ],
            [
              "{{System > Background jobs}}",
              "Where the dashboard's [[See tasks →]] link goes when a background task failed. Send Nexeor a screenshot; Nexeor handles the retries.",
            ],
          ],
        },
      ],
    },
  ],
};
