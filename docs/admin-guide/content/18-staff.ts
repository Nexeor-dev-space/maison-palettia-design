import type { Chapter } from "./types";

export const staff: Chapter = {
  slug: "staff",
  number: 17,
  title: "Staff & roles",
  lede: "Everyone gets their own login and only the tools they need. Nobody ever needs to know anyone else's password.",
  blurb: "Invite your team, give each the right role, switch someone off.",
  summary: [
    "**Admin** can do everything. Keep it to yourself unless you really need a second one.",
    "**Editor** looks after the website: pages, sessions, workshop types, the Journal, music, photos and wording. No bookings, no owner settings.",
    "**Front desk** looks after customers: bookings, tickets, check-in and the inbox. No content changes.",
    "When someone leaves, untick **Can sign in**. Their history stays.",
  ],
  roles: ["admin"],
  keywords: "users team staff invite roles permissions admin editor front desk",
  sections: [
    {
      id: "staff-list",
      title: "Your team",
      path: "Settings > Staff",
      who: "Admin",
      keywords: "users team list",
      blocks: [
        {
          type: "steps",
          items: [
            "[[Invite staff]] ((1)) adds someone.",
            "Each person's role ((2)): Admin, Editor or Front desk.",
            "Click a name ((3)) to open their account.",
          ],
        },
        {
          type: "screenshot",
          file: "30-staff-list.webp",
          width: 1200,
          height: 750,
          caption: "Settings → Staff: everyone who can log in, with their role. Invite staff adds someone; they choose their own password from the email.",
          title: "Users and roles",
          callouts: [
            { n: 1, label: "Invite staff" },
            { n: 2, label: "Role — Admin, Editor or Front desk" },
            { n: 3, label: "Click a name to open their account" },
          ],
        },
      ],
    },
    {
      id: "invite-staff",
      title: "Invite someone",
      keywords: "invite new user",
      blocks: [
        {
          type: "steps",
          items: [
            "Their name and email ((1)). Spaces are removed as you type; if the address is incomplete, it says “Enter a full email address, like name@example.com.” and the button waits.",
            "What they may do ((2)): the role.",
            "[[Send invitation]] ((3)). They get an email and choose their own password.",
          ],
        },
        {
          type: "screenshot",
          file: "30-invite-staff.webp",
          width: 640,
          height: 586,
          caption: "Invite staff: their name, their email, and what they may do. They receive an email and set their own password — you never need to know it. (Email sending must be set up first.)",
          title: "Users and roles — invite staff",
          callouts: [
            { n: 1, label: "Name and email" },
            { n: 2, label: "What they may do — the role" },
            { n: 3, label: "Send invitation" },
          ],
          maxWidth: 640,
        },
        {
          type: "warning",
          text: [
            "Invitations are emails, so [email sending](#email-sending) must be set up first. The button tells you if it isn't.",
          ],
        },
      ],
    },
    {
      id: "staff-member",
      title: "Change a role, switch someone off, or help them back in",
      keywords: "leaver deactivate disable login link locked out role change",
      blocks: [
        {
          type: "steps",
          items: [
            "Open the person. Change their role ((1)) if their job changes.",
            "Untick **Can sign in** ((2)) to stop their access without deleting them. Their name stays on everything they did.",
            "Locked out? [[Send login link]] ((3)) emails them a one-time sign-in.",
          ],
        },
        {
          type: "screenshot",
          file: "30-staff-member.webp",
          width: 1200,
          height: 750,
          caption: "A staff member's page: change their role, untick “Can sign in” to stop access without deleting them, or send a login link if they are locked out.",
          title: "Users and roles — send login link",
          callouts: [
            { n: 1, label: "Role" },
            { n: 2, label: "Can sign in — untick to switch them off" },
            { n: 3, label: "Send login link — a one-time sign-in by email" },
          ],
        },
        {
          type: "never",
          text: [
            "Never delete a staff account when someone leaves. Switch it off instead, so the history on bookings still shows who did what.",
          ],
        },
      ],
    },
    {
      id: "role-matrix",
      title: "Who can do what",
      keywords: "permissions matrix role table access",
      blocks: [
        {
          type: "roleMatrix",
          roles: ["Admin", "Editor", "Front desk"],
          groups: [
            {
              title: "The website",
              rows: [
                { job: "Edit pages, wording, menus and photos", cells: ["yes", "yes", "view"] },
                { job: "Add and change experiences and sessions", cells: ["yes", "yes", "view"] },
                { job: "Workshop types (themes and levels)", cells: ["yes", "yes", "view"] },
                {
                  job: "Journal posts and categories",
                  cells: [
                    { value: "yes", note: "Only Admin deletes a category" },
                    "yes",
                    "view",
                  ],
                },
                { job: "Music tracks and Settings › Music", cells: ["yes", "yes", "view"] },
                { job: "Repeat a session weekly", cells: ["yes", "yes", "no"] },
                { job: "Reschedule or cancel a session", cells: ["yes", "no", "no"] },
                {
                  job: "Change email wording",
                  cells: [
                    "yes",
                    { value: "yes", note: "Words only" },
                    "no",
                  ],
                },
              ],
            },
            {
              title: "Bookings",
              rows: [
                { job: "Find orders and customers", cells: ["yes", "no", "yes"] },
                { job: "Create a desk booking", cells: ["yes", "no", "yes"] },
                { job: "Move a booking, resend tickets", cells: ["yes", "no", "yes"] },
                { job: "Ask for a refund", cells: ["yes", "no", "yes"] },
                { job: "Approve a refund", cells: ["yes", "no", "no"] },
                { job: "Check people in", cells: ["yes", "no", "yes"] },
                { job: "Promo codes", cells: ["yes", "no", "view"] },
              ],
            },
            {
              title: "Inbox & reports",
              rows: [
                { job: "Answer enquiries", cells: ["yes", "yes", "yes"] },
                {
                  job: "See analytics",
                  cells: [
                    "yes",
                    { value: "yes", note: "Visitors only" },
                    "no",
                  ],
                },
                { job: "VAT summary and downloads", cells: ["yes", "no", "no"] },
              ],
            },
            {
              title: "Settings",
              rows: [
                {
                  job: "Site details, menus, brand wording",
                  cells: [
                    "yes",
                    { value: "yes", note: "Not the locked switches" },
                    "view",
                  ],
                },
                { job: "Open or close bookings", cells: ["yes", "no", "no"] },
                { job: "Payments, email, invoices, alerts", cells: ["yes", "no", "no"] },
                { job: "Invite staff, change roles", cells: ["yes", "no", "no"] },
              ],
            },
          ],
        },
        { type: "legend", items: ["✓ Can do it", "◐ Can look, not change", "— Not shown to them"] },
      ],
    },
  ],
};
