import type { Chapter } from "./types";

export const settings: Chapter = {
  slug: "settings",
  number: 16,
  title: "Settings",
  lede: "The things you set once and rarely touch. Settings save straight to the live site: there are no drafts here.",
  blurb: "Site details, Events page wording, opening bookings, email sending and invoices.",
  summary: [
    "**Settings** are for Admin and Editor. **Settings (admin)** is for the owner only: payments, email, invoices, alerts and tracking.",
    "[[Save]] on a settings page goes live straight away.",
    "The site address must stay exactly `https://maisonpalettia.com`, and is changed only from the live admin.",
    "Bookings only open once email, the site address and payments are ready. The panel tells you what is missing.",
  ],
  roles: ["admin", "editor"],
  keywords: "settings site details contact address email smtp invoices vat trn bookings open",
  intro: [
    {
      type: "mock",
      label: "The two settings groups",
      html: "<div class=\"split\"><div class=\"panel\"><h4>Settings</h4><span class=\"muted\">Admin · Editor</span><ul><li>Site details</li><li>Menus &amp; footer</li><li>Brand wording</li><li>Booking &amp; checkout wording</li><li>Page labels</li><li>Search &amp; sharing defaults</li><li>Music</li><li>Staff</li></ul></div><div class=\"panel\"><h4>Settings (admin)</h4><span class=\"muted\">Owner only</span><ul><li>Payments (Mamo Pay)</li><li>Email sending</li><li>Invoices &amp; VAT</li><li>Who gets notified</li><li>Analytics &amp; tracking</li></ul></div></div>",
    },
  ],
  sections: [
    {
      id: "site-details",
      title: "Site details",
      path: "Settings > Site details",
      who: "Admin · Editor",
      keywords: "logo name contact phone whatsapp social instagram address",
      blocks: [
        {
          type: "paragraph",
          text: "Four tabs ((1)): Identity (the studio's name and logos), Contact, Newsletter and Advanced. [[Save]] ((2)) after changes.",
        },
        {
          type: "screenshot",
          file: "26-site-details-identity.webp",
          width: 1200,
          height: 833.5,
          caption: "Settings → Site details. Identity: the studio's name and logos. Contact: public email, phone, WhatsApp, social links and address. Newsletter: the sign-up box.",
          title: "Settings — Site details",
          callouts: [
            { n: 1, label: "Tabs: Identity, Contact, Newsletter, Advanced" },
            { n: 2, label: "Save" },
          ],
        },
        {
          type: "paragraph",
          text: "The **Contact** tab ((1)) holds the email, phone and WhatsApp number shown on the website, your social profiles and your address.",
        },
        {
          type: "screenshot",
          file: "26-site-details-contact.webp",
          width: 1200,
          height: 833.5,
          caption: "Contact tab: the email, phone and WhatsApp number shown on the website, your social links and your address.",
          title: "Settings — Site details",
          callouts: [
            { n: 1, label: "Contact tab" },
            { n: 2, label: "Save" },
          ],
        },
      ],
    },
    {
      id: "social-profiles",
      title: "Social profiles",
      path: "Settings > Site details > Contact",
      who: "Admin · Editor",
      keywords: "instagram facebook tiktok pinterest linkedin social icons follow",
      blocks: [
        {
          type: "steps",
          items: [
            "Scroll down the **Contact** tab to **Social profiles**.",
            "For each one, pick the **Platform** ((1)) and paste the full address of your profile ((2)).",
            "Add up to seven with [[Add Social]]. **Pinterest** ((3)) is one of the choices now.",
            "[[Save]]. Only rows with an address are shown.",
          ],
        },
        {
          type: "screenshot",
          file: "26-site-details-social.webp",
          width: 1200,
          height: 833,
          caption: "Social profiles, on the Contact tab: today Instagram, Facebook, TikTok, Pinterest and LinkedIn. Each shows with its own icon in the footer's Follow column and on the Contact page.",
          title: "Settings — Site details",
          callouts: [
            { n: 1, label: "Platform — pick from the list" },
            { n: 2, label: "The full address of your profile" },
            { n: 3, label: "Pinterest — new; every platform gets its own icon" },
          ],
        },
      ],
    },
    {
      id: "site-advanced",
      title: "Advanced: site address and switches",
      who: "Admin only",
      keywords: "site address url https background tasks ai imagery",
      blocks: [
        {
          type: "steps",
          items: [
            "**Site address** ((1)): it must say `https://maisonpalettia.com`. Emails, payment returns and the webhook all use it. (Google is always pointed at maisonpalettia.com, whatever this says.)",
            "**Accept enquiries** ((2)) switches the contact forms on or off.",
            "**Run background tasks** ((3)): leave it on unless Nexeor asks. While off, emails and payments are not processed.",
            "**Allow AI-generated imagery** ((4)) in the big hero and card spaces.",
            "**Header colour per route** ((5)): leave it as it is. It sets the header's colour on pages with a dark or light hero.",
          ],
        },
        {
          type: "screenshot",
          file: "26-site-details-advanced.webp",
          width: 1100,
          height: 1026,
          caption: "Advanced tab (owner only): the Site address that emails, payment returns and the webhook use. Type it exactly, starting https:// with no / at the end. Further down are the switches for enquiries, background tasks and AI imagery. Leave Header colour per route as it is.",
          title: "Settings — Site details",
          callouts: [
            { n: 1, label: "Site address — e.g. https://maisonpalettia.com" },
            { n: 2, label: "Accept enquiries — the contact forms" },
            { n: 3, label: "Run background tasks — leave on unless Nexeor asks" },
            { n: 4, label: "Allow AI-generated imagery in hero and card slots" },
            { n: 5, label: "Header colour per route — leave as it is" },
          ],
        },
        {
          type: "warning",
          title: "Careful",
          text: [
            "The live site and Nexeor's test copy share one database, so Site details is **one** setting for both. Change it only from `maisonpalettia.com/admin`; anything saved in the test copy's admin changes the live site. See [Always work in maisonpalettia.com/admin](#one-database).",
          ],
        },
      ],
    },
    {
      id: "mode-labels",
      title: "Events page wording: Mode labels",
      path: "Settings > Booking & checkout wording > Event page",
      who: "Admin · Editor",
      keywords: "create anytime create together walk-in scheduled chip product names events browser doors",
      blocks: [
        {
          type: "paragraph",
          text: "The two ways to take part, **Create Anytime** (walk in, no booking) and **Create Together** (booked for a date), are named in about twenty places. **Mode labels** is the one place for those words, including the doors on the Events page.",
        },
        {
          type: "steps",
          items: [
            "Open {{Settings > Booking & checkout wording}} and choose the **Event page** tab.",
            "Scroll to **Mode labels**. Change the two product names ((1)), their short labels ((2)), the chips and card eyebrow ((3)), or the two one-liners ((4)).",
            "Press [[Save]]. It goes live straight away, everywhere the words appear.",
          ],
        },
        {
          type: "screenshot",
          file: "37-event-page-mode-labels.webp",
          width: 1200,
          height: 633,
          caption: "Mode labels: the product names, short labels, chips and one-liners used across the site, including the Events page doors.",
          title: "Settings — Event page wording",
          callouts: [
            { n: 1, label: "The two product names" },
            { n: 2, label: "Short labels" },
            { n: 3, label: "Chips" },
            { n: 4, label: "The two one-liners" },
          ],
        },
      ],
    },
    {
      id: "create-anytime-section",
      title: "The Create Anytime part of the Events page",
      path: "Settings > Booking & checkout wording > Event page",
      who: "Admin · Editor",
      keywords: "walk-in drop in how it works steps coming soon view details events page",
      blocks: [
        {
          type: "paragraph",
          text: "Just below Mode labels, **Create Anytime section (/events)** holds the words of the walk-in half of the Events page.",
        },
        {
          type: "list",
          items: [
            "The **“How it works” heading** ((1)) and up to four numbered **Steps** ((2)). Leave the steps empty to show the original three.",
            "The two group headings ((3)): “Open for drop-ins” and “Coming soon”.",
            "The card buttons ((4)): “View details”, and “Take a look” for one that is coming soon.",
            "The note shown when nothing matches the visitor's filter ((5)).",
          ],
        },
        {
          type: "screenshot",
          file: "37-create-anytime-section.webp",
          width: 1200,
          height: 633,
          caption: "The Create Anytime section: the walk-in half of the Events page, from its heading and steps to the card buttons.",
          title: "Settings — Event page wording",
          callouts: [
            { n: 1, label: "“How it works” heading" },
            { n: 2, label: "Up to four numbered steps" },
            { n: 3, label: "Group headings: Open for drop-ins, Coming soon" },
            { n: 4, label: "Card buttons" },
            { n: 5, label: "Shown when nothing matches the filter" },
          ],
        },
        {
          type: "info",
          title: "Good to know",
          text: [
            "The booked half of the Events page is a calendar that draws each session as a ticket and filters by date, event, theme (workshop type), vibe and venue. There is nothing to set for it: it is built from your sessions, workshop types and vibes.",
          ],
        },
      ],
    },
    {
      id: "bookings-open",
      title: "Open or close online bookings",
      path: "Settings > Booking & checkout wording > Bookings",
      who: "Admin only",
      keywords: "open close bookings closed message",
      blocks: [
        {
          type: "steps",
          items: [
            "Tick **Bookings open** ((1)).",
            "Check the message shown on Book buttons while bookings are closed ((2)).",
            "[[Save]] ((3)). Until everything is ready, the panel refuses and says exactly what is missing.",
          ],
        },
        {
          type: "screenshot",
          file: "27-bookings-open.webp",
          width: 1200,
          height: 833.5,
          caption: "Settings → Booking & checkout wording → Bookings tab. Tick Bookings open and Save to let customers book online. Until everything is ready the panel refuses and says exactly what is missing. While closed, every Book button shows your “closed” message.",
          title: "Settings — Bookings open/closed",
          callouts: [
            { n: 1, label: "Bookings open — tick, then Save" },
            { n: 2, label: "The message shown on Book buttons while closed" },
            { n: 3, label: "Save" },
          ],
        },
      ],
    },
    {
      id: "email-sending",
      title: "Email sending",
      path: "Settings (admin) > Email sending",
      who: "Admin only",
      keywords: "smtp resend from address verify test",
      blocks: [
        {
          type: "paragraph",
          text: "Without this, customers get no confirmations, tickets or invoices, and your team can't reset passwords. Your email provider (or Nexeor) gives you the details.",
        },
        {
          type: "steps",
          items: [
            "Choose the provider ((1)). Out of the box it says **Log only**, which sends nothing. Change it to **SMTP** (your email provider's sending details) or **Resend** (a key from resend.com).",
            "Fill in the server details ((2)) and the From address customers see.",
            "For the password (or the Resend key): next to **Not set**, click the [[Enter]] button ((3)), paste it into the box that opens, then press [[Save]]. It is never shown again.",
            "[[Verify connection]] ((4)). Wait for the green confirmation.",
            "[[Send test…]] ((5)) to yourself.",
          ],
        },
        {
          type: "screenshot",
          file: "28-email-sending.webp",
          width: 1200,
          height: 833.5,
          caption: "Settings (admin) → Email sending. Out of the box the provider says “Log only”, which sends nothing. Choose SMTP (your email provider's details) or Resend (an API key), fill in the From address, then Verify connection and Send test. Passwords and keys are stored locked and only ever shown as “Set” or “Not set”.",
          title: "Settings — Email sending",
          callouts: [
            { n: 1, label: "Provider — change Log only to SMTP or Resend" },
            { n: 2, label: "Server details from your email provider" },
            { n: 3, label: "Enter button — click it, paste the password, then Save" },
            { n: 4, label: "Verify connection — wait for the green confirmation" },
            { n: 5, label: "Send test… — one to yourself" },
          ],
        },
        {
          type: "paragraph",
          text: "[[Send test…]] fills in your own address ((1)) and shows the answer from your provider. Check your inbox, and the spam folder.",
        },
        {
          type: "screenshot",
          file: "28-email-send-test.webp",
          width: 800,
          height: 380,
          caption: "Send test… asks where to send it (your own address is filled in) and shows the answer from your provider. Check your inbox — and the spam folder.",
          title: "Settings — Email sending",
          callouts: [
            { n: 1, label: "Send the test to this address" },
          ],
        },
      ],
    },
    {
      id: "invoices-vat",
      title: "Invoices & VAT",
      path: "Settings (admin) > Invoices & VAT",
      who: "Admin only",
      keywords: "trn vat invoice receipt legal name licence",
      blocks: [
        {
          type: "steps",
          items: [
            "Legal name on invoices ((1)) and trade licence number ((2)).",
            "**TRN** ((3)): your VAT registration number. Until it is filled in, documents print as receipts rather than tax invoices.",
            "Registered address, invoice email and phone ((4)).",
            "[[Save]] ((5)).",
          ],
        },
        {
          type: "screenshot",
          file: "29-invoices-vat.webp",
          width: 1200,
          height: 833.5,
          caption: "Settings (admin) → Invoices & VAT: the legal details printed on every invoice. Until the TRN is filled in, documents print as receipts rather than tax invoices.",
          title: "Settings — Invoices & VAT",
          callouts: [
            { n: 1, label: "Legal name on invoices" },
            { n: 2, label: "Trade licence number" },
            { n: 3, label: "TRN — your VAT registration number" },
            { n: 4, label: "Registered address, invoice email and phone" },
            { n: 5, label: "Save" },
          ],
        },
        {
          type: "info",
          title: "In plain words",
          text: [
            "Invoice numbers run in order with no gaps, as UAE VAT rules require, and refunds create credit notes automatically. You never number anything by hand.",
          ],
        },
      ],
    },
  ],
};
