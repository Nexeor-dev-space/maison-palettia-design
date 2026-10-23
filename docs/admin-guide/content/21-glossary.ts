import type { Chapter } from "./types";

export const glossary: Chapter = {
  slug: "glossary",
  number: 20,
  title: "Glossary & questions",
  lede: "Every word in the admin you might not use every day, in plain language.",
  blurb: "Plain meanings for every term, and quick answers to common questions.",
  summary: [],
  roles: [],
  keywords: "words meaning definitions faq questions answers",
  sections: [
    {
      id: "glossary-list",
      title: "Glossary",
      blocks: [
        {
          type: "glossary",
          items: [
            {
              term: "Admin (role)",
              definition: "The role that can do everything, including payments and staff. Usually just the owner.",
            },
            {
              term: "Alt text",
              definition: "A short sentence describing a photo, read aloud to blind visitors and used by Google.",
            },
            {
              term: "API key",
              definition: "A long password Mamo Pay gives you so your website can talk to it. Kept locked; shown only as Set or Not set.",
            },
            {
              term: "Booking reference",
              definition: "The order's name, starting MP-. Use it to find a booking.",
            },
            {
              term: "Brand wording",
              definition: "Sentences used in several places, kept once under Settings › Brand wording.",
            },
            {
              term: "Check-in window",
              definition: "How early and how late before a session a ticket will scan as valid.",
            },
            {
              term: "Credit line",
              definition: "The words that say who made a music track and under which licence. The site builds it from the track's details and shows it beside the player and on /music-credits.",
            },
            {
              term: "Credit note",
              definition: "The document created automatically when money is refunded. It cancels part or all of an invoice for VAT.",
            },
            {
              term: "Desk booking",
              definition: "A booking taken by staff for a walk-in or phone customer, paid in person.",
            },
            {
              term: "Draft",
              definition: "A saved change that visitors can't see yet. It goes live when you publish.",
            },
            {
              term: "Editor (role)",
              definition: "Looks after the website's content. No bookings or settings.",
            },
            {
              term: "Experience",
              definition: "A class you offer, such as Candle Making. It can have workshop types (themes or levels) and many sessions.",
            },
            {
              term: "Featured post",
              definition: "The journal post shown large at the top of the Journal page. Tick “Feature at the top of the Journal”; the newest featured post wins.",
            },
            {
              term: "Focal point",
              definition: "The spot in a photo that always stays in view when the site crops it.",
            },
            {
              term: "Front desk (role)",
              definition: "Looks after customers: bookings, tickets, check-in and the inbox.",
            },
            {
              term: "Hold",
              definition: "Seats kept aside while a customer pays (15 minutes unless the owner changes it). Shown as Held on a session.",
            },
            {
              term: "Journal",
              definition: "The studio's blog at /journal. Its stories are journal posts, sorted into journal categories.",
            },
            {
              term: "Journal category",
              definition: "A section of the Journal, such as Studio notes. Each post sits in one; its colour is the label on the card.",
            },
            {
              term: "Journal post",
              definition: "One story in the Journal, with a title, a cover photo and text. A draft until you publish it.",
            },
            {
              term: "Licence (CC BY)",
              definition: "The terms a piece of music comes with. CC BY means free to use as long as the creator is credited. Never use one marked NC (non-commercial).",
            },
            {
              term: "Live preview",
              definition: "The copy of the page beside the form that shows your draft as you type.",
            },
            { term: "Mamo Pay", definition: "The company that takes card payments for you." },
            {
              term: "Mode (Test / Live)",
              definition: "Whether card payments use pretend money (Test) or real cards (Live).",
            },
            {
              term: "Mode labels",
              definition: "The names Create Anytime and Create Together, and their short labels and chips, kept once under Settings › Booking & checkout wording › Event page.",
            },
            {
              term: "Music track",
              definition: "One piece of background music under Content › Music, with its creator and licence.",
            },
            {
              term: "Pin (map)",
              definition: "A venue's latitude and longitude. With a pin, the site draws its own map of the venue in the Maison's colours.",
            },
            {
              term: "Programme",
              definition: "A private-event offer: birthdays, corporate events, schools and more.",
            },
            { term: "Publish", definition: "Put a draft on the public website." },
            {
              term: "Redirect",
              definition: "Sends visitors from an old or short address to the right page.",
            },
            { term: "Sandbox", definition: "Mamo's practice area. Test cards work here; no money moves." },
            {
              term: "Schedule Publish",
              definition: "Choose a date and time for a draft to go live by itself.",
            },
            {
              term: "SEO",
              definition: "Search engine optimisation: the title, description and picture Google and WhatsApp show for a page.",
            },
            {
              term: "Session",
              definition: "One dated sitting of an experience, usually within a workshop type, with its own price and seats.",
            },
            {
              term: "Site address",
              definition: "Your website's exact address, starting https://. Emails and payments rely on it.",
            },
            {
              term: "SMTP",
              definition: "Your email provider's sending details: server, port, username and password.",
            },
            { term: "Ticket code", definition: "The code under each QR, starting MPT-. One per seat." },
            {
              term: "TRN",
              definition: "Tax Registration Number. Without it, documents print as receipts, not tax invoices.",
            },
            {
              term: "Variable",
              definition: "A word in \\{{double braces}} in an email that is replaced with real details for each customer.",
            },
            { term: "VAT", definition: "Value added tax, 5% in the UAE. All your prices include it." },
            {
              term: "Version",
              definition: "A saved copy from the past. Pages, experiences, workshop types, sessions and journal posts keep their last 25, and any can be restored.",
            },
            {
              term: "Waitlist",
              definition: "A queue for a full session. People are emailed in order if seats free up.",
            },
            {
              term: "Webhook",
              definition: "How Mamo tells your website “this payment went through”. Set up with one button.",
            },
            {
              term: "Workshop type",
              definition: "A theme (such as Sculptural Forms) or a level (such as Crochet — Beginners) of a booked experience. Customers pick the type, then a date.",
            },
            {
              term: "⌘K / Ctrl K",
              definition: "The shortcut that opens the admin's search box from anywhere.",
            },
          ],
        },
      ],
    },
    {
      id: "faq",
      title: "Questions",
      blocks: [
        {
          type: "faq",
          items: [
            {
              q: "Can I break the website by making a mistake?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Very hard to. Changes are drafts until you publish, and every page keeps its last 25 versions. If something goes wrong, revert or restore an older version.",
                },
              ],
            },
            {
              q: "How quickly do changes appear?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Within a second or two after you press Publish changes (or Save on a settings page).",
                },
              ],
            },
            {
              q: "What's the difference between Save and Publish changes?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Pages, experiences, workshop types, sessions, journal posts, FAQs, policies and the like have drafts, and Publish changes puts them live. Settings pages, music tracks, journal categories and venues have a plain Save, and it goes live straight away.",
                },
              ],
            },
            {
              q: "Can I use the admin on my phone?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Yes. Check-in is designed for phones. Editing pages works on a phone too, but is far more comfortable on a laptop.",
                },
              ],
            },
            {
              q: "Do customers need an account?",
              blocks: [
                {
                  type: "paragraph",
                  text: "No. They book with their email. They find their bookings with their reference and email, or a one-time link from the website's My bookings page.",
                },
              ],
            },
            {
              q: "Are prices shown with VAT?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Yes. Every price includes 5% VAT, and invoices show the VAT separately.",
                },
              ],
            },
            {
              q: "Can I delete a session that has bookings?",
              blocks: [
                {
                  type: "paragraph",
                  text: "No. Reschedule it, or cancel it and refund everyone, so customers are told.",
                },
              ],
            },
            {
              q: "What happens to tickets when I move a booking?",
              blocks: [
                {
                  type: "paragraph",
                  text: "The old tickets stop working and the customer is emailed new ones for the new date.",
                },
              ],
            },
            {
              q: "Who can see internal notes?",
              blocks: [
                { type: "paragraph", text: "Only your staff. Customers never see order or customer notes." },
              ],
            },
            {
              q: "How do I give a discount?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Create a promo code under Bookings › Promo codes, or for one person, take a desk booking with an adjusted price.",
                },
              ],
            },
            {
              q: "How do I stop a single email from being sent?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Open it under Emails › Email templates and untick Enabled. Be careful with confirmations and tickets.",
                },
              ],
            },
            {
              q: "Why was I logged out?",
              blocks: [
                {
                  type: "paragraph",
                  text: "For safety, the admin logs you out after 8 hours. Log in again; drafts you were working on are kept.",
                },
              ],
            },
            {
              q: "How do I add next month's candle theme?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Add a workshop type for the theme under Content › Workshop types, publish it, then add its sessions under Content › Sessions. Step by step in [Add next month's candle theme](#new-theme).",
                },
              ],
            },
            {
              q: "How do I write a blog post?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Content › Journal › Create New (or Write a journal post on the dashboard). Give it a title, a cover photo, some text and a category, then Publish changes. See [Write a journal post](#journal-write).",
                },
              ],
            },
            {
              q: "Does the music play by itself?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Yes, when the player is switched on: it starts when a visitor arrives, or on their first tap where the browser insists. One press pauses it, and it stays off for that visitor. It never plays on checkout and payment pages. See [Background music](#music-settings).",
                },
              ],
            },
            {
              q: "Where is this guide?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Docs, at the top of the admin's menu, or “Open the guide” in ⌘K. It has a search box and a PDF to download.",
                },
              ],
            },
            {
              q: "Who do I ask for help?",
              blocks: [
                {
                  type: "paragraph",
                  text: "Nexeor. Send a screenshot of the dashboard and of the page you are on. The coloured notes usually explain the problem.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
