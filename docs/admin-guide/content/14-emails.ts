import type { Chapter } from "./types";

export const emails: Chapter = {
  slug: "emails",
  number: 13,
  title: "Emails & notifications",
  lede: "The website sends booking confirmations, tickets, refunds, reminders and notes to your team. You choose the words, and you can always see what went out.",
  blurb: "The wording of every email, what was sent, and who gets alerts.",
  summary: [
    "{{Emails > Email templates}}: the wording of every email the site sends.",
    "Words in `{{double braces}}` are filled in for each customer. Move them, but don't change them.",
    "{{Emails > Sent emails}} shows every email and whether it was delivered. Resend from there.",
    "{{Settings (admin) > Who gets notified}} decides who on your team is emailed about what.",
  ],
  roles: ["admin", "editor"],
  keywords: "email templates confirmation reminder sent log resend notifications alerts",
  sections: [
    {
      id: "templates",
      title: "Change an email's wording",
      path: "Emails > Email templates",
      who: "Admin · Editor",
      keywords: "template wording subject variables braces",
      blocks: [
        { type: "steps", items: ["Search for an email by name ((1)) and click it ((2))."] },
        {
          type: "screenshot",
          file: "24-email-templates-list.webp",
          width: 1200,
          height: 750,
          caption: "Emails → Email templates: the wording of every email the site sends — booking confirmations, refunds, reminders, and the notes to your team.",
          title: "Emails — templates",
          callouts: [
            { n: 1, label: "Search for an email by name" },
            { n: 2, label: "Click one to change its wording" },
          ],
        },
        {
          type: "steps",
          items: [
            "Write the subject line ((1)) and the preview text ((2)), the grey line under the subject in an inbox.",
            "Write the message ((3)) as you would to one customer.",
            "The list on the right ((4)) shows the `{{variables}}` you can use and what each becomes.",
            "**Enabled** ((5)): untick to stop sending this email.",
          ],
        },
        {
          type: "screenshot",
          file: "24-email-template-edit.webp",
          width: 1200,
          height: 916.5,
          caption: "An email template: the subject, the preview line, and the message. Words in \\{{double braces}} are filled in for each customer — the list on the right says what each one becomes.",
          title: "Emails — templates",
          callouts: [
            { n: 1, label: "Subject line" },
            { n: 2, label: "Preview text — the grey line under the subject in inboxes" },
            { n: 3, label: "The message — write as you would to one customer" },
            { n: 4, label: "Variables you can use, and what they become" },
            { n: 5, label: "Enabled — untick to stop sending this email" },
          ],
        },
        {
          type: "mock",
          label: "What the customer receives",
          html: "<div class=\"split\"><div class=\"panel\"><span class=\"muted\">You write</span><p>Hi <code>{{customer.firstName}}</code>, you're booked for <code>{{session.title}}</code> on <code>{{session.when}}</code>. Your reference is <code>{{order.reference}}</code>.</p></div><div class=\"panel\"><span class=\"muted\">Layla receives</span><p>Hi Layla, you're booked for Sculptural Forms on Thursday 19 November at 18:30. Your reference is MP-7K2QX.</p></div></div>",
        },
        {
          type: "never",
          text: [
            "Never retype or rename the words inside `{{double braces}}`. A misspelt one prints as a blank. Copy them from the list on the right.",
          ],
        },
      ],
    },
    {
      id: "template-preview",
      title: "Preview and send yourself a test",
      keywords: "test preview",
      blocks: [
        {
          type: "steps",
          items: [
            "Below the message, check the live preview with sample values ((1)) and the plain text version ((2)).",
            "Press [[Send me this]] ((3)) for a test copy in your own inbox.",
          ],
        },
        {
          type: "info",
          title: "Good to know",
          text: [
            "Every email now wears the studio's look: a cream background with the logo, a soft green card with a lilac border, small hand-drawn doodles in the corners, a lilac pill button and a footer with your contact details. You only write the words; the design is added for you.",
          ],
        },
        {
          type: "screenshot",
          file: "24-email-template-preview.webp",
          width: 1200,
          height: 833,
          caption: "Below the message, a live preview with sample values shows exactly what the customer will receive: the cream background, the logo, the soft green card with a lilac border, small hand-drawn doodles and a lilac button. Send me this emails the preview to you.",
          title: "Emails — templates",
          callouts: [
            { n: 1, label: "Preview with sample values" },
            { n: 2, label: "Plain text version" },
            { n: 3, label: "Send me this — a test copy to your own inbox" },
          ],
        },
      ],
    },
    {
      id: "sent-emails",
      title: "See what was sent",
      path: "Emails > Sent emails",
      who: "Admin · Front desk (view)",
      keywords: "log delivered failed skipped",
      blocks: [
        {
          type: "steps",
          items: [
            "Search by email address or subject ((1)).",
            "Check the status ((2)): **Sent**, **Failed** or **Skipped**.",
            "Click a subject ((3)) to open it.",
          ],
        },
        {
          type: "screenshot",
          file: "24-sent-emails.webp",
          width: 1200,
          height: 750,
          caption: "Emails → Sent emails: every email the site has sent or tried to send, with its outcome. Search by address or booking reference.",
          title: "Emails — notification log",
          callouts: [
            { n: 1, label: "Search by email address or subject" },
            { n: 2, label: "Status — Sent, Failed or Skipped" },
            { n: 3, label: "Click a subject to open it" },
          ],
        },
      ],
    },
    {
      id: "resend-email",
      title: "Resend an email",
      who: "Admin",
      keywords: "resend never arrived",
      blocks: [
        {
          type: "paragraph",
          text: "One email shows who it went to and what happened ((1)), and why it wasn't sent if it wasn't ((2)). [[Resend this email]] ((3)) sends the same message again.",
        },
        {
          type: "screenshot",
          file: "24-sent-email-resend.webp",
          width: 1200,
          height: 700,
          caption: "One sent email: who it went to, which template, and what happened. Resend this email sends the same message again — useful when a customer says it never arrived.",
          title: "Emails — resend",
          callouts: [
            { n: 1, label: "To, and the outcome" },
            { n: 2, label: "Why it was not sent (if it wasn't)" },
            { n: 3, label: "Resend this email" },
          ],
        },
        {
          type: "tip",
          text: [
            "For tickets, the quickest way is the order itself: [[Actions]] › [[Resend tickets]]. Front desk can do that too. Emails older than 30 days can only be resent from the order.",
          ],
        },
      ],
    },
    {
      id: "who-gets-notified",
      title: "Who gets notified",
      path: "Settings (admin) > Who gets notified",
      who: "Admin only",
      keywords: "alerts staff notifications recipients",
      blocks: [
        {
          type: "steps",
          items: [
            "[[Add Recipient]] ((1)): one row per person.",
            "Their name and email ((2)).",
            "Tick what they should be emailed about ((4)). At least: New order, Failed payment, Refund requested, New enquiry and Background task failed.",
            "[[Save]] ((3)).",
          ],
        },
        {
          type: "screenshot",
          file: "29-who-gets-notified.webp",
          width: 1200,
          height: 833.5,
          caption: "Settings (admin) → Who gets notified. Add a row per person and tick what they should be emailed about — at least New order, Failed payment, Refund requested, New enquiry and Background task failed.",
          title: "Settings — Who gets notified",
          callouts: [
            { n: 1, label: "Add Recipient — one row per person" },
            { n: 2, label: "Their name and email" },
            { n: 3, label: "Save" },
            { n: 4, label: "Alerts — everything ticked here is emailed to them" },
          ],
        },
      ],
    },
  ],
};
