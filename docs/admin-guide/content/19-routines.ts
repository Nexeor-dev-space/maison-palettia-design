import type { Chapter } from "./types";

export const routines: Chapter = {
  slug: "routines",
  number: 18,
  title: "Routines",
  lede: "A few minutes a day keeps the website and your bookings in good order. Here is a rhythm that works.",
  blurb: "Daily, weekly and monthly habits, and a walkthrough of booking day.",
  summary: [
    "**Daily**: dashboard notes, new enquiries, refunds to approve, tomorrow's sessions.",
    "**Weekly**: publish next week's sessions, check failed emails and drafts.",
    "**Monthly**: next month's theme and dates, a Journal story, numbers, VAT files for your accountant, tidy staff and photos.",
  ],
  roles: [],
  keywords: "routine habits daily weekly monthly booking day studio door",
  sections: [
    {
      id: "rhythm",
      title: "Daily, weekly, monthly",
      keywords: "daily weekly monthly checklist habits",
      blocks: [
        {
          type: "routine",
          columns: [
            {
              title: "Daily",
              when: "10 minutes, morning",
              items: [
                {
                  text: "Open the dashboard. Clear anything red first.",
                  note: "Red means customers are affected now.",
                },
                { text: "Reply to new enquiries and assign them.", note: "Inbox › Enquiries, filter New." },
                {
                  text: "Approve waiting refunds.",
                  note: "Owner only. Dashboard › Approve →, or Bookings › Refunds. Not refunding? Tell the customer and add a note to the order.",
                },
                {
                  text: "Check Coming up: tomorrow's sessions and seats.",
                  note: "Print attendee lists for the day.",
                },
                { text: "Look at Recent orders for anything marked Needs attention." },
              ],
            },
            {
              title: "Weekly",
              when: "30 minutes, same day each week",
              items: [
                { text: "Publish next week's sessions.", note: "Repeat weekly…, set the workshop type on each copy, then publish." },
                { text: "Close sales or switch to waitlist where you need to." },
                {
                  text: "Check Drafts & scheduled on the dashboard.",
                  note: "Publish or revert anything forgotten. Delete empty Untitled drafts left by Create New.",
                },
                { text: "Sent emails: filter Failed and fix each one." },
                { text: "Move answered enquiries to Closed." },
                { text: "Glance at Analytics, last 7 days." },
              ],
            },
            {
              title: "Monthly",
              when: "1 hour, first week of the month",
              items: [
                { text: "Analytics for last month: sales, best sellers, how full sessions were." },
                {
                  text: "Add next month's candle theme and its sessions.",
                  note: "Content › Workshop types, then Content › Sessions. See [Add next month's candle theme](#new-theme).",
                },
                { text: "Post a Journal story (optional).", note: "A new theme, a workshop moment, a gift idea." },
                {
                  text: "Download the VAT summary and invoices CSV for your accountant.",
                  note: "Quarterly for your VAT return.",
                },
                { text: "Staff: untick Can sign in for anyone who has left." },
                {
                  text: "Refresh seasonal photos and the homepage.",
                  note: "Swap a photo once, every page updates.",
                },
                { text: "Check FAQs, policies and promo codes are still right." },
                { text: "Ask Nexeor to confirm this month's backup restore test." },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "booking-day",
      title: "Booking day at the studio",
      keywords: "check-in door walkthrough event day walk-in",
      blocks: [
        {
          type: "paragraph",
          text: "A calm session starts well before the first guest arrives. Here is the day, from the morning to the last tidy-up.",
        },
        {
          type: "timeline",
          items: [
            {
              when: "Morning",
              title: "Know who is coming",
              text: "On the dashboard, **Coming up** shows today's sessions and seats sold. Open the session's [[Attendees]] tab and print the list. Check customers' notes for allergies or requests.",
            },
            {
              when: "1 hour before",
              title: "Set up the door",
              text: "Charge the phone. Open {{Front desk > Check-in}}, turn [[Sound on]], and make sure today's session is listed. Pictures of each step are in [Open check-in on your phone](#open-checkin).",
            },
            {
              when: "Doors open",
              title: "Scan each ticket",
              text: "[[Start camera]] and hold each QR inside the frame. **Green**: welcome them. **Amber**: read the message and ask. **Red**: don't admit; ask for their email and look up the booking with [[⌘K]]. See [Scan a ticket](#scan) and [What the colours mean](#verdicts).",
            },
            {
              when: "Walk-ins",
              title: "Sell spare seats",
              text: "{{Bookings > Orders > Create desk booking}}. Pick the session, seats and how they paid, and add their email so they get a ticket. Their ticket is valid straight away.",
            },
            {
              when: "No phone?",
              title: "Type the code",
              text: "If a guest has a printed ticket that won't scan, type the code under the QR (it starts `MPT-`). If they have nothing, find them on the attendee list and press [[Mark as arrived]].",
            },
            {
              when: "After",
              title: "Close the day",
              text: "Check arrived against sold on the check-in page. Add anything worth remembering to the order's internal notes, such as “left her apron, collecting Thursday”.",
            },
          ],
        },
        {
          type: "tip",
          text: [
            "Busy door? Two people can scan at once on two phones. Each scan is recorded with who did it, and a ticket can't be used twice.",
          ],
        },
      ],
    },
  ],
};
