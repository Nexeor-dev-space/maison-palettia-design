import type { Chapter } from "./types";

export const troubleshooting: Chapter = {
  slug: "troubleshooting",
  number: 19,
  title: "When something goes wrong",
  lede: "Most problems have a two-minute fix. Find yours below. If you are stuck, send Nexeor a screenshot of the dashboard.",
  blurb: "Payment failed, email missing, page not updating, locked out, wrong price.",
  summary: [
    "Start at the dashboard. The coloured notes usually name the problem and link to the fix.",
    "Always act from the admin, never from Mamo's website, so everything stays in step.",
    "Any mistake on a page can be undone with Versions.",
  ],
  roles: [],
  keywords: "help problem error fix broken support",
  sections: [
    {
      id: "fix-payment-failed",
      title: "A customer says their payment failed",
      hint: "Or: “I was charged but got no confirmation.”",
      severity: "red",
      blocks: [
        { type: "heading", text: "Check first" },
        {
          type: "list",
          items: [
            "Find the order with [[⌘K]] and their email. Read its status.",
            "Look at the payment badge on the dashboard. If it says **TEST**, real cards will not work.",
          ],
        },
        { type: "heading", text: "Then" },
        {
          type: "steps",
          items: [
            "**Failed**: their bank declined the card. Ask them to book again, or try another card. Nothing was taken.",
            "**Expired**: they took too long to pay (15 minutes unless changed) and the seats were released. Ask them to book again.",
            "**Confirmed**: the booking worked. Open [[Actions]] › [[Resend tickets]], and see “email not arriving” below.",
            "Charged, but the order is not Confirmed: the dashboard shows “orders need a look”. Press [[Review]] and follow what it says. Tell the customer you are on it. When it is sorted, the owner presses [[Actions]] › [[Mark review resolved]] on the order.",
          ],
        },
        {
          type: "never",
          text: [
            "Never refund from Mamo's own website. Always refund from the order here, so tickets, seats, invoices and emails all stay in step.",
          ],
        },
      ],
    },
    {
      id: "fix-email",
      title: "A customer didn't receive their email",
      hint: "Confirmation, tickets or a reminder never arrived.",
      severity: "amber",
      blocks: [
        {
          type: "steps",
          items: [
            "Open {{Emails > Sent emails}} and search for their address.",
            "**Sent**: it left your system. Ask them to check spam and promotions. Check the address for a typo on the order and correct it under contact details.",
            "**Failed**: open it to read why. If many have failed, go to {{Settings (admin) > Email sending}} and press [[Verify connection]].",
            "**Skipped**: the template is switched off, or email isn't set up. If {{Settings (admin) > Email sending}} still says **Log only**, nothing is ever sent: change it to SMTP or Resend. An amber note on the dashboard also says so.",
            "Fix the cause, then open the order and press [[Actions]] › [[Resend tickets]].",
          ],
        },
      ],
    },
    {
      id: "fix-page",
      title: "My change isn't showing on the website",
      hint: "You edited something but the site looks the same.",
      severity: "amber",
      blocks: [
        {
          type: "steps",
          items: [
            "Check the status at the top. **Changed** means it is still a draft: press [[Publish changes]].",
            "Did you schedule it? The dashboard's **Drafts & scheduled** list shows when it will go live.",
            "Are you editing the right place? Use [[⌘K]] and type <<“>> plus a few words from the website to find where they live. Shared lines live in Brand wording.",
            "Reload the website page. On a phone, close the tab and open it again.",
            "Photo cropped badly? Set its [focal point](#focal-point).",
            "Still the same after a minute? Send Nexeor a screenshot of the admin and of the website.",
          ],
        },
      ],
    },
    {
      id: "fix-locked-out",
      title: "Someone is locked out",
      hint: "Forgotten password, or too many wrong tries.",
      severity: "amber",
      blocks: [
        {
          type: "steps",
          items: [
            "They press [[Forgot password?]] on the login page and follow the email.",
            "No email? The owner opens {{Settings > Staff}}, opens the person and presses [[Send login link]].",
            "Check **Can sign in** is ticked on their account.",
            "After 5 wrong passwords in a row, the account rests for 10 minutes. Wait, then try once, carefully.",
            "Owner locked out and email not working? Nexeor can reset it on the server in a minute.",
          ],
        },
        {
          type: "info",
          title: "Customers",
          text: [
            "A **customer** who can't see their bookings uses the website's “My bookings” page to get a fresh link by email. If they lost their phone, open the customer and use [[Sign out everywhere]].",
          ],
        },
      ],
    },
    {
      id: "fix-wrong-price",
      title: "A wrong price (or wrong words) went live",
      hint: "Put it right in two minutes by restoring the version before.",
      severity: "red",
      blocks: [
        {
          type: "steps",
          items: [
            "If people might book at the wrong price right now, open the session and set **Booking status** to [[Closed — no bookings, no waitlist]]. Press [[Publish changes]].",
            "Open the [[Versions]] tab. Click the version from before the mistake.",
            "Check the highlighted changes, then press [[Restore this version]].",
            "Check the preview, set the booking status back to [[Open — seats can be booked]], and [[Publish changes]].",
            "Look in {{Bookings > Orders}} for anyone who booked in between. If they were overcharged, give a part refund for the difference. If undercharged, honour the price they paid.",
          ],
        },
        {
          type: "paragraph",
          text: "See [History: restore older versions](#versions) for pictures of each step.",
        },
      ],
    },
    {
      id: "fix-red-banner",
      title: "A red note says background tasks are paused, the webhook is at an old address, or settings can't be read",
      hint: "Emails and payments are not being processed.",
      severity: "red",
      blocks: [
        {
          type: "steps",
          items: [
            "“Background tasks are paused”: open {{Settings > Site details > Advanced}}, tick **Run background tasks**, and Save. Only leave it off if Nexeor asked you to.",
            "“The Mamo Pay webhook points at an old address (https://…)”: Mamo is sending payment messages to the wrong place, usually Nexeor's test copy. Open `maisonpalettia.com/admin` (not the test copy), press [[Re-register →]] on the note, choose Sandbox or Live to match the **Mode**, and press [[Register/Update webhook]]. The note goes away. Call Nexeor only if it refuses; the message says why.",
            "“Encrypted settings cannot be read”: call Nexeor. Don't change keys yourself.",
          ],
        },
      ],
    },
    {
      id: "fix-camera",
      title: "The check-in camera won't start",
      hint: "Black frame, or no permission prompt.",
      severity: "green",
      blocks: [
        {
          type: "steps",
          items: [
            "Allow the camera when the phone asks. If you said no before, open the browser's site settings and allow the camera for your website.",
            "Close other apps that use the camera.",
            "Meanwhile, type ticket codes by hand, or press [[Mark as arrived]] on the attendee list.",
          ],
        },
      ],
    },
    {
      id: "fix-cant-open-bookings",
      title: "Bookings won't open",
      hint: "The Bookings open box refuses to save.",
      severity: "green",
      blocks: [
        {
          type: "paragraph",
          text: "The panel tells you what is missing, for example “Set up Email first so customers receive their tickets”. Follow it, then try again. The usual three are the site address, email sending and payments. See the [Day one checklist](#day-one).",
        },
      ],
    },
    {
      id: "fix-photo-delete",
      title: "A photo won't delete",
      severity: "green",
      blocks: [
        {
          type: "paragraph",
          text: "It is still used somewhere. The message lists where. Replace it there first, or [swap the file](#swap-photo) instead. No Delete option at all? Only the owner (Admin) can delete photos.",
        },
      ],
    },
    {
      id: "fix-music",
      title: "The music won't play, or I want it off",
      severity: "green",
      keywords: "music player sound silent off",
      blocks: [
        {
          type: "list",
          items: [
            "**Want it off?** {{Settings > Music}}: untick **Show the music player** and Save. To silence one page, add its address to **Pages without the player**.",
            "**No player at all?** The player shows only while **Show the music player** is ticked *and* at least one track has **In the playlist** ticked under {{Content > Music}}.",
            "**Button there but no sound?** Some browsers (Safari always, others on a first visit) only allow sound after the visitor taps or clicks somewhere on the page. That is the browser's rule; nothing to fix. A visitor who paused it keeps it off until they press play.",
            "Still silent on every browser? Send Nexeor the track's name: the file may be missing on the server.",
          ],
        },
      ],
    },
    {
      id: "fix-journal-missing",
      title: "A journal post isn't on the Journal page",
      severity: "green",
      keywords: "journal post missing blog not showing",
      blocks: [
        {
          type: "list",
          items: [
            "Check its status: it must be **Published**, not Draft or Changed. Press [[Publish changes]].",
            "Check it has a **Cover photograph**. A post can't be published without one.",
            "Scheduled? It appears at the time you chose (the dashboard's **Drafts & scheduled** shows when).",
            "Its **Publish date** decides its place: a backdated post sits further down the list.",
            "Looking for a category's page? A category only shows once it has a published post.",
          ],
        },
      ],
    },
    {
      id: "fix-wont-delete",
      title: "A journal category or workshop type won't delete",
      severity: "green",
      keywords: "delete category workshop type refused",
      blocks: [
        {
          type: "list",
          items: [
            "**A journal category:** posts still use it. Move them to another category first (the message says how many). Only the owner (Admin) can delete a category.",
            "**A workshop type:** sessions still belong to it. Unpublish the type instead; its past bookings keep their history.",
            "**An experience:** workshop types still belong to it. Unpublish it instead.",
          ],
        },
      ],
    },
    {
      id: "fix-sold-date",
      title: "I can't change a session's date",
      severity: "green",
      blocks: [
        {
          type: "paragraph",
          text: "Once seats are sold, the date can only change with [[Actions]] › [[Reschedule…]], so every ticket holder is emailed. See [Reschedule a session](#reschedule).",
        },
      ],
    },
  ],
};
