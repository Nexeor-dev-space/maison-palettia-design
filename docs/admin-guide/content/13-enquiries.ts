import type { Chapter } from "./types";

export const enquiries: Chapter = {
  slug: "enquiries",
  number: 12,
  title: "Enquiries",
  lede: "Every message sent through the website lands in one inbox, so nothing gets lost in someone's personal email.",
  blurb: "Messages from the contact and private-events forms.",
  summary: [
    "{{Inbox > Enquiries}} holds every message from the contact and private-events forms.",
    "Statuses: **New → In progress → Closed**. **Possible spam** is set by the website itself for suspicious messages.",
    "[[Reply by email]] opens your own mail app with the reference in the subject.",
    "Assign each enquiry to a colleague so everyone knows who is answering.",
    "The website checks the name, email and phone before a form is sent, so enquiries arrive with contact details you can use.",
  ],
  roles: [],
  keywords: "inbox messages contact form reply private event requests",
  sections: [
    {
      id: "enquiries-inbox",
      title: "The inbox",
      path: "Inbox > Enquiries",
      who: "Everyone",
      keywords: "board columns filter",
      blocks: [
        {
          type: "steps",
          items: [
            "Filter with the chips ((1)): New, In progress, Closed and Possible spam.",
            "See who is looking after each one ((4)).",
            "Click the date ((3)) to open an enquiry.",
            "Prefer columns? Press [[Board]] ((2)).",
          ],
        },
        {
          type: "info",
          title: "Spam",
          text: [
            "**Possible spam** is set automatically for suspicious messages; you can't choose it yourself. Check that chip now and then in case a real message landed there. For junk that got through, set it to **Closed**.",
          ],
        },
        {
          type: "screenshot",
          file: "23-enquiries-inbox.webp",
          width: 1200,
          height: 455,
          caption: "Inbox → Enquiries: every message from the contact and private-events forms. The chips filter by status; Possible spam is set by itself for suspicious messages. Board shows them as columns.",
          title: "Enquiries inbox",
          callouts: [
            { n: 1, label: "Filter chips: New, In progress, Closed, Possible spam" },
            { n: 2, label: "Board view" },
            { n: 3, label: "Click the date to open an enquiry" },
            { n: 4, label: "Who is looking after it" },
          ],
        },
        {
          type: "paragraph",
          text: "The board groups enquiries by status ((1)), a quick way to see what still needs a reply. Click [[Board]] again to switch back.",
        },
        {
          type: "screenshot",
          file: "23-enquiries-board.webp",
          width: 1200,
          height: 466.5,
          caption: "Board groups the enquiries by status — a quick way to see what still needs a reply. Click Board again to switch back.",
          title: "Enquiries inbox",
          callouts: [
            { n: 1, label: "Board is on" },
          ],
        },
      ],
    },
    {
      id: "reply-enquiry",
      title: "Read and reply",
      keywords: "reply answer assign status spam",
      blocks: [
        {
          type: "steps",
          items: [
            "Read the message ((6)).",
            "Press [[Reply by email]] ((1)). Your mail app opens with the address and reference filled in, and the reply date ((5)) is noted here.",
            "If your mail app doesn't open, press [[Copy address]] ((2)) and paste it into a new email.",
            "Set the status ((3)) and who is looking after it ((4)), then [[Save]] ((7)).",
          ],
        },
        {
          type: "screenshot",
          file: "23-enquiry-view.webp",
          width: 1200,
          height: 833.5,
          caption: "An enquiry. Reply by email opens your own mail app with the reference in the subject, and notes the reply date here. Set the status and who is looking after it, then Save.",
          title: "Enquiries — reply, status, assign",
          callouts: [
            { n: 1, label: "Reply by email — opens your mail app" },
            { n: 2, label: "Copy address — if you prefer to paste it" },
            { n: 3, label: "Status — New, In progress, Closed" },
            { n: 4, label: "Assigned to — a colleague" },
            { n: 5, label: "Replied — filled in when you press Reply by email" },
            { n: 6, label: "The message" },
            { n: 7, label: "Save" },
          ],
        },
        {
          type: "screenshot",
          file: "23-enquiry-status.webp",
          width: 532,
          height: 260,
          caption: "Status: New → In progress → Closed. Possible spam is set by the website itself, never by hand; for junk that got through, choose Closed.",
          title: "Enquiries — reply, status, assign",
          callouts: [
            { n: 1, label: "Pick the status, then Save" },
          ],
          maxWidth: 532,
        },
        {
          type: "screenshot",
          file: "23-enquiry-assign.webp",
          width: 477,
          height: 260,
          caption: "Assigning: pick a colleague from the list (only active staff are shown). Assigning a new enquiry moves it to In progress.",
          title: "Enquiries — reply, status, assign",
          callouts: [
            { n: 1, label: "Choose who looks after it" },
          ],
          maxWidth: 477,
        },
        {
          type: "tip",
          text: [
            "Assigning a **New** enquiry moves it to **In progress** by itself. Aim to reply to new enquiries within one working day.",
          ],
        },
      ],
    },
  ],
};
