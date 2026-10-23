import type { Chapter } from "./types";

export const welcome: Chapter = {
  slug: "welcome",
  number: 1,
  title: "Welcome & tour",
  lede: "Everything about the website lives in one place: your admin. Here is how to get in and find your way around.",
  blurb: "Log in, read the dashboard, and learn what the coloured notes mean.",
  summary: [
    "Your admin is `maisonpalettia.com/admin`. Always use that address (see [one database](#one-database)).",
    "The first page after you log in is the **dashboard**: what needs you today, this week's numbers, and buttons for everyday jobs.",
    "Coloured notes tell you what needs attention. **Red** means customers are affected right now. **Amber** means finish this before launch.",
    "When you save, the website changes within a second or two. You never need a developer to update it.",
  ],
  roles: [],
  keywords: "start login dashboard home",
  sections: [
    {
      id: "login",
      title: "Log in",
      path: "maisonpalettia.com/admin",
      who: "Everyone",
      keywords: "sign in password",
      blocks: [
        {
          type: "steps",
          items: [
            "Open `maisonpalettia.com/admin`. Bookmark it.",
            "Type the email you were invited with ((1)) and your password ((2)).",
            "Press [[Login]] ((4)). The dashboard opens.",
          ],
        },
        {
          type: "screenshot",
          file: "01-login.webp",
          width: 760,
          height: 460,
          caption: "The login page. Type the email and password you chose, then press Login.",
          title: "Log in",
          callouts: [
            { n: 1, label: "Your email address" },
            { n: 2, label: "Your password" },
            { n: 3, label: "Forgot password? — sends you a reset link by email" },
            { n: 4, label: "Login" },
          ],
        },
        {
          type: "tip",
          text: [
            "Save your password in your phone's or browser's password manager. Then you never have to type it at the studio door.",
          ],
        },
      ],
    },
    {
      id: "forgot-password",
      title: "Forgot your password",
      keywords: "reset locked out",
      blocks: [
        {
          type: "steps",
          items: [
            "On the login page press [[Forgot password?]].",
            "Type the email you log in with ((1)) and press the button to send the link ((2)).",
            "Open the email, click the link, and choose a new password.",
          ],
        },
        {
          type: "screenshot",
          file: "01-forgot-password.webp",
          width: 760,
          height: 520,
          caption: "Forgot your password? Type your email and we send you a link to choose a new one.",
          title: "Forgot password",
          callouts: [
            { n: 1, label: "The email you log in with" },
            { n: 2, label: "Send the reset link" },
            { n: 3, label: "Back to the login page" },
          ],
        },
        {
          type: "warning",
          text: [
            "The reset link arrives by email, so [email sending](#email-sending) must be set up first. If you are the owner and email is not working yet, Nexeor can reset your password on the server in a minute.",
          ],
        },
      ],
    },
    {
      id: "dashboard",
      title: "Your dashboard, top to bottom",
      keywords: "home overview kpi quick actions",
      blocks: [
        {
          type: "paragraph",
          text: "The dashboard is home. Come back to it any time by clicking the logo at the top left.",
        },
        {
          type: "screenshot",
          file: "02-dashboard-overview.webp",
          width: 1200,
          height: 1033,
          caption: "The dashboard is the first page you see. The left menu reaches everything; the coloured list at the top is your to-do list. Docs, at the top of the menu, opens this guide.",
          title: "Dashboard tour",
          callouts: [
            { n: 1, label: "The menu — Content, Bookings, Inbox, Emails, Settings" },
            { n: 2, label: "Search or jump to… (⌘K / Ctrl K)" },
            { n: 3, label: "Needs attention now — something affecting customers" },
            { n: 4, label: "Things to finish setting up — each line has a button to the fix" },
            { n: 5, label: "Payment mode and whether online bookings are open" },
            { n: 6, label: "Quick actions for everyday jobs" },
            { n: 7, label: "Docs — this guide" },
          ],
        },
        {
          type: "paragraph",
          text: "The menu on the left ((1)) is grouped the same way you think about the studio: **Front desk**, **Reports**, **Content** (what visitors see), **Bookings**, **Inbox**, **Emails** and **Settings**. Collapse a group you do not use by clicking its name. **Docs** ((7)), at the very top, opens this guide.",
        },
        {
          type: "list",
          items: [
            "**Content** holds Media, Pages, Experiences, Workshop types, Sessions, Venues, Programmes, Policies, FAQ, Passes, Testimonials, Vibes, Music, Journal, Journal categories and Redirects.",
            "**Settings** holds Staff, Site details, Menus & footer, Brand wording, Booking & checkout wording, Page labels, Search & sharing defaults and Music.",
            "The quick actions ((6)) are: Add a session · Desk booking · Check-in · Edit homepage · Write a journal post · Swap a photo · Refund an order · Resend tickets · Invite staff · Mamo Pay mode · Analytics. “Write a journal post” shows for Admin and Editor only.",
          ],
        },
        {
          type: "tip",
          text: [
            "Don't see the menu? Press [[☰]] at the top left to open it. The admin remembers your choice next time.",
          ],
        },
        { type: "paragraph", text: "Scroll down for the week at a glance. Everything is clickable." },
        {
          type: "screenshot",
          file: "02-dashboard-today.webp",
          width: 1200,
          height: 995,
          caption: "Further down: this week's numbers, the next sessions, the newest orders and enquiries, drafts waiting to be published, and refunds to approve.",
          title: "Dashboard tour",
          callouts: [
            { n: 1, label: "This week at a glance — bookings, revenue, enquiries, visitors" },
            { n: 2, label: "Coming up — the next sessions and seats sold" },
            { n: 3, label: "Recent orders — click one to open it" },
            { n: 4, label: "Newest enquiries — click to open the Inbox" },
            { n: 5, label: "Drafts & scheduled — pages, experiences, sessions and journal posts not on the website yet" },
            { n: 6, label: "Refunds waiting for your approval" },
          ],
        },
        {
          type: "paragraph",
          text: "Further down, **Drafts & scheduled** ((5)) lists every page, experience, session and journal post that is not on the website yet. At the very bottom, **Everything in the admin** shows every area as a tile. The [[+]] on a tile creates a new one straight away.",
        },
        {
          type: "screenshot",
          file: "02-dashboard-everything.webp",
          width: 1200,
          height: 871,
          caption: "At the bottom, “Everything in the admin” lists every area as a tile, including Workshop types, Music, Journal and Journal categories under Content, and Music under Settings. The + on a tile creates a new one straight away.",
          title: "Dashboard tour",
          callouts: [
            { n: 1, label: "Content — what visitors see" },
            { n: 2, label: "Bookings — orders, customers, tickets, refunds" },
            { n: 3, label: "Settings — the things you set once" },
            { n: 4, label: "Settings (admin) — payments, email, invoices: owner only" },
          ],
        },
      ],
    },
    {
      id: "warnings",
      title: "The coloured notes",
      keywords: "banner alert red amber warning strip",
      blocks: [
        {
          type: "paragraph",
          text: "While something needs you, a slim strip sits at the top of *every* admin page. The dashboard spells each one out with a button that takes you to the fix. When everything is done, the notes disappear.",
        },
        {
          type: "screenshot",
          file: "32-warnings-strip.webp",
          width: 1200,
          height: 96,
          caption: "The warnings strip sits at the top of every admin page while something needs you. Red means customers are affected; the link takes you straight to the fix. (The orange MOCK bar and the “Payments: MOCK” badge only appear on the developer's copy, never on the live site.)",
          title: "Warnings strip",
          callouts: [
            { n: 1, label: "What needs attention, in one line" },
            { n: 2, label: "The link goes to the fix (here Re-register →)" },
          ],
        },
        {
          type: "screenshot",
          file: "32-warnings-dashboard.webp",
          width: 1200,
          height: 236,
          caption: "On the dashboard the same warnings are spelled out, each with a button to the place it is fixed. Red = customers are affected now (here the Mamo Pay webhook, see [the fix](#fix-red-banner)); amber = finish before launch. When everything is done, the list disappears.",
          title: "Warnings strip",
          callouts: [
            { n: 1, label: "Needs attention now (red)" },
            { n: 2, label: "Things to finish setting up (amber)" },
            { n: 3, label: "Each line says what is wrong and why it matters" },
            { n: 4, label: "The button takes you to the fix" },
          ],
        },
        {
          type: "mock",
          label: "What the colours mean",
          html: "<div class=\"panel\"><div class=\"row\"><span class=\"chip r\">Red</span><span>Customers are affected <b>now</b>. Deal with it today. Examples: <em>\"Background tasks are paused — emails and payments will not be processed.\"</em> or <em>\"The Mamo Pay webhook points at an old address (https://…). Register it again so payments are confirmed.\"</em> with a <b>Re-register →</b> button.</span></div><div class=\"row\"><span class=\"chip a\">Amber</span><span>Finish this before launch, or soon. Example: <em>\"Email is not set up.\"</em></span></div><div class=\"row\"><span class=\"chip\">Badge</span><span>Information only, such as <b>Payments: TEST</b> or <b>Online bookings closed</b>.</span></div></div>",
        },
        {
          type: "tip",
          text: [
            "Something looks wrong and you are not sure why? Take a screenshot of the dashboard and send it to Nexeor. The notes usually say exactly what happened.",
          ],
        },
      ],
    },
    {
      id: "where-things-live",
      title: "Where things live",
      keywords: "menu map navigation",
      blocks: [
        {
          type: "table",
          head: ["You want to…", "Go to"],
          rows: [
            ["See today's sessions and new bookings", "The dashboard (the first page)"],
            [
              "Find a booking, refund it, move it, resend a ticket",
              "{{Bookings > Orders}} then open the order and use [[Actions]]",
            ],
            [
              "Approve a refund your team asked for (owner)",
              "[[Approve →]] on the dashboard, or {{Bookings > Refunds}}",
            ],
            ["Check people in at the door", "{{Front desk > Check-in}}"],
            ["Answer an enquiry", "{{Inbox > Enquiries}}"],
            ["Change wording on a page", "{{Content > Pages}}, or click [[Edit]] on the page preview"],
            ["Add or change a class date", "{{Content > Sessions}}"],
            ["Add a candle theme or a crochet level", "{{Content > Workshop types}} (see [Workshop types](#workshop-types))"],
            ["Write a journal post", "{{Content > Journal}}, or [[Write a journal post]] on the dashboard"],
            ["Background music", "{{Content > Music}} for tracks, {{Settings > Music}} to switch it on or off"],
            ["Swap a photo", "{{Content > Media}}"],
            ["See visitors and sales", "{{Reports > Analytics}}"],
            ["See which emails went out", "{{Emails > Sent emails}}"],
            ["Payments, email, invoices (owner only)", "{{Settings (admin)}}"],
            ["Read this guide", "**Docs** at the top of the menu"],
          ],
        },
        {
          type: "never",
          text: [
            "Never share one login between people. Invite each person with their own account (see [Staff & roles](#staff)). The history on every booking and page then shows who did what.",
          ],
        },
      ],
    },
    {
      id: "one-database",
      title: "Always work in maisonpalettia.com/admin",
      who: "Everyone",
      keywords: "staging test copy shared database live site address",
      blocks: [
        {
          type: "paragraph",
          text: "Nexeor keeps a second, test copy of the website for trying out changes. It looks the same, but it reads and writes the **same database** as the live site. Anything you change in the test copy's admin changes the live website too.",
        },
        {
          type: "warning",
          title: "Careful",
          text: [
            "Always sign in at `maisonpalettia.com/admin`. Never press [[Register/Update webhook]] or change **Site details** from the test copy: those settings are shared, and the live site would start sending payment messages and emails to the test address.",
          ],
        },
        {
          type: "info",
          title: "Good to know",
          text: [
            "The test copy is hidden from Google automatically, and Google is always told your site is `https://maisonpalettia.com`. You don't need to set anything for that.",
          ],
        },
      ],
    },
    {
      id: "docs-tab",
      title: "This guide, inside the admin",
      path: "Docs",
      who: "Everyone",
      keywords: "help guide handbook manual docs pdf search",
      blocks: [
        {
          type: "steps",
          items: [
            "Press **Docs** ((1)) at the top of the menu. Only signed-in staff can open it.",
            "Search ((2)) for any word, such as *refund* or *webhook*. Press <</>> anywhere in the guide to jump to the search box.",
            "Pick a chapter from the list ((3)), or press [[Start reading]] ((4)).",
            "Click any screenshot to see it larger. The arrow keys move to the next one.",
            "Want paper? [[Download the PDF]] ((5)) is the same guide, ready to print.",
          ],
        },
        {
          type: "screenshot",
          file: "01-docs-tab.webp",
          width: 1200,
          height: 750,
          caption: "Docs opens this guide inside the admin: search, every chapter, and the PDF to download.",
          title: "The guide",
          callouts: [
            { n: 1, label: "Docs — in the menu, at the top" },
            { n: 2, label: "Search the guide — press / to jump here" },
            { n: 3, label: "Every chapter" },
            { n: 4, label: "Start reading" },
            { n: 5, label: "Download the PDF" },
          ],
        },
        {
          type: "tip",
          text: [
            "In [⌘K](#cmdk), type “guide” to open the guide, or the name of a chapter, such as “Guide: Settings”.",
          ],
        },
      ],
    },
  ],
};
