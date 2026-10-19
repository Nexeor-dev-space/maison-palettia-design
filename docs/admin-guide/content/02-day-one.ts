import type { Chapter } from "./types";

export const dayOne: Chapter = {
  slug: "day-one",
  number: null,
  eyebrow: "Start here",
  title: "Day one checklist",
  lede: "Work through this in order. A few steps only work once the one before is done, and the admin tells you so in plain words if you jump ahead. Your ticks are remembered on this device.",
  blurb: "Ten steps from a fresh admin to taking real bookings.",
  summary: [],
  roles: ["admin"],
  keywords: "launch go live setup onboarding first",
  feature: true,
  intro: [
    {
      type: "info",
      title: "Before you start",
      text: [
        "**Before you start, Nexeor does this part:** the server, the secure https address, nightly backups, a fresh empty database, and the first installation with today's wording and photos. When Nexeor says “it's live”, start at step 1.",
      ],
    },
  ],
  sections: [
    {
      id: "day-one-list",
      title: "The ten steps",
      blocks: [
        {
          type: "checklist",
          id: "day-one",
          steps: [
            {
              title: "Create your account",
              time: "2 minutes",
              where: "maisonpalettia.com/admin",
              items: [
                {
                  id: "d1-1-1",
                  text: "Open maisonpalettia.com/admin and create the first account: your name, email and a password. This is the owner account and can do everything.",
                },
                {
                  id: "d1-1-2",
                  text: "Use a password of at least 12 characters that you use nowhere else, and save it in your password manager.",
                },
              ],
            },
            {
              title: "Confirm your site address and contact details",
              time: "10 minutes",
              where: "Settings > Site details",
              items: [
                {
                  id: "d1-2-1",
                  text: "Advanced tab → Site address: it must say exactly https://maisonpalettia.com (no / at the end). It does today; check it, and only Save if you had to change it. Emails, payment returns and the webhook all use it.",
                },
                {
                  id: "d1-2-4",
                  text: "Careful: the live site and Nexeor's test copy share ONE database, so Site details is one setting for both. Always work in maisonpalettia.com/admin; a change made in the test copy's admin changes the live site too.",
                },
                {
                  id: "d1-2-2",
                  text: "Contact tab: public email, public phone, WhatsApp business number, address, and your social profiles (up to seven: Instagram, Facebook, TikTok, Pinterest, LinkedIn and more, each with its own icon). Save.",
                },
                {
                  id: "d1-2-3",
                  text: "Photos: replace the launch photos marked AI-generated or unknown origin (the dashboard's “See photos” lists them), or tick “Allow AI-generated imagery in hero and card slots” on the Advanced tab.",
                },
              ],
            },
            {
              title: "Set up email — everything after this depends on it",
              time: "15 minutes",
              where: "Settings (admin) > Email sending",
              items: [
                {
                  id: "d1-3-1",
                  text: "Provider: out of the box this says Log only, which sends nothing. Change it to SMTP (your email provider's details) or Resend (a key from resend.com). Your email provider or Nexeor can give you these.",
                },
                {
                  id: "d1-3-2",
                  text: "For the password or key: next to Not set, click the Enter button, paste it into the box that opens, then press Save.",
                },
                { id: "d1-3-3", text: "Fill in the From address: the name and address customers see." },
                { id: "d1-3-4", text: "Press Verify connection and wait for the green confirmation." },
                {
                  id: "d1-3-5",
                  text: "Press Send test…, send one to yourself, and check it arrived (look in spam too).",
                },
              ],
            },
            {
              title: "Invite your team",
              time: "5 minutes",
              where: "Settings > Staff > Invite staff",
              items: [
                {
                  id: "d1-4-1",
                  text: "Invite each person with the right role: Editor (content), Front desk (bookings and check-in) or Admin (everything — keep this to yourself).",
                },
                {
                  id: "d1-4-2",
                  text: "Check each person received the invitation and chose their own password.",
                },
              ],
            },
            {
              title: "Your invoice details",
              time: "10 minutes",
              where: "Settings (admin) > Invoices & VAT",
              items: [
                {
                  id: "d1-5-1",
                  text: "Legal name on invoices, registered address and trade licence number.",
                },
                {
                  id: "d1-5-2",
                  text: "TRN (VAT registration number). Until it is filled in, documents print as receipts, not tax invoices.",
                },
                {
                  id: "d1-5-3",
                  text: "Invoice email and phone; open PDF appearance and choose your logo (or leave it empty to use the Site details logo). Save.",
                },
              ],
            },
            {
              title: "Who gets told about what",
              time: "5 minutes",
              where: "Settings (admin) > Who gets notified",
              items: [
                {
                  id: "d1-6-1",
                  text: "Add a row per person and tick at least: New order, Failed payment, Refund requested, New enquiry.",
                },
                {
                  id: "d1-6-2",
                  text: "Tick Background task failed for yourself and add Nexeor's address for it too. Save.",
                },
              ],
            },
            {
              title: "Payments with Mamo Pay",
              time: "about an hour, over a day or two",
              where: "Settings (admin) > Payments (Mamo Pay)",
              items: [
                {
                  id: "d1-7-1",
                  text: "Ask Mamo for your sandbox (test) key. Next to Sandbox API key, click the Enter button, paste the key into the box that opens, then press Save.",
                },
                { id: "d1-7-2", text: "Test connection → wait for the green confirmation." },
                { id: "d1-7-3", text: "Register/Update webhook → confirm the address it shows. Press it only from maisonpalettia.com/admin, never from the test copy." },
                {
                  id: "d1-7-4",
                  text: "Place test bookings with Mamo's test cards: one that succeeds, one with the security step, one that is declined.",
                },
                {
                  id: "d1-7-5",
                  text: "Check Bookings → Orders: paid ones show a ticket and invoice, the declined one shows Failed. The confirmation email arrived.",
                },
                {
                  id: "d1-7-6",
                  text: "Ask Mamo for your live key. Next to Live API key, click Enter, paste it and press Save.",
                },
                {
                  id: "d1-7-7",
                  text: "Under Mamo Pay actions switch to Live, then Test connection → Register/Update webhook (again, only from maisonpalettia.com/admin).",
                },
                {
                  id: "d1-7-8",
                  text: "Set Mode to Live. When every line of the checklist passes, press Switch to Live, then press Save at the top right. Payments are only live after Save.",
                },
                {
                  id: "d1-7-9",
                  text: "Make one real AED 2 payment with your own card, then refund it from the order. Money can now go both ways.",
                },
              ],
            },
            {
              title: "Your real content",
              time: "as long as it takes",
              where: "Content",
              items: [
                {
                  id: "d1-8-0",
                  text: "Workshop types: one per candle theme or crochet level (Content › Workshop types). Publish each one.",
                },
                {
                  id: "d1-8-1",
                  text: "Sessions: your real dates, prices and seats, each pointing at its experience and workshop type. Publish them (Repeat weekly… helps for regular classes; set the workshop type on every copy).",
                },
                {
                  id: "d1-8-2",
                  text: "Passes: publish the passes you sell, or leave them as drafts (the loyalty page then says “coming soon”).",
                },
                {
                  id: "d1-8-3",
                  text: "Testimonials: only real quotes, with “Written permission to publish” ticked.",
                },
                {
                  id: "d1-8-4",
                  text: "Policies: your Privacy and Terms pages, each with “Show in footer legal row” ticked.",
                },
                {
                  id: "d1-8-5",
                  text: "Settings › Booking & checkout wording › Event page tab › “Ready for you” body: read it and make sure it matches your DIY policy about materials.",
                },
                {
                  id: "d1-8-6",
                  text: "Photos of children: tick “Model/parent consent on file” only if you have it; otherwise replace the photo.",
                },
                { id: "d1-8-7", text: "Bookings → Promo codes: any discount codes you want to launch with." },
                {
                  id: "d1-8-8",
                  text: "Journal (optional): create your categories, then your first post (Content › Journal categories, then Content › Journal).",
                },
                {
                  id: "d1-8-9",
                  text: "Music: switch the player on or off (Settings › Music) and check each track's credit under Content › Music.",
                },
              ],
            },
            {
              title: "Open bookings",
              time: "1 minute",
              where: "Settings > Booking & checkout wording > Bookings",
              items: [
                {
                  id: "d1-9-1",
                  text: "Tick Bookings open and Save. If something is still missing, the panel tells you exactly what.",
                },
              ],
            },
            {
              title: "Final look",
              time: "10 minutes",
              where: "Dashboard",
              items: [
                {
                  id: "d1-10-1",
                  text: "The dashboard shows no red or amber notes, and the badge says Payments: LIVE.",
                },
                {
                  id: "d1-10-2",
                  text: "In a private browser window, book a session as a customer would. Check the email, the ticket and the invoice.",
                },
                {
                  id: "d1-10-3",
                  text: "Your front desk has opened Front desk → Check-in on a phone and knows how to scan.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
