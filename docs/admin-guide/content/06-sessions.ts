import type { Chapter } from "./types";

export const sessions: Chapter = {
  slug: "sessions",
  number: 5,
  title: "Experiences, workshop types & sessions",
  lede: "An experience is the class itself, such as Candle Making. A workshop type is one theme or level of it, such as Sculptural Forms. A session is one date and time, with its own price and number of seats.",
  blurb: "Your classes, their themes and levels, their dates, prices, seats and the bigger session jobs.",
  summary: [
    "{{Content > Experiences}} describes each class: name, one line, About paragraphs and photos.",
    "{{Content > Workshop types}} holds the themes and levels a class runs in. A customer picks the type, then a date.",
    "{{Content > Sessions}} holds every dated class. [[Save Draft]] keeps a new session hidden; [[Publish changes]] puts it on sale.",
    "The [[Actions]] button on a session holds the bigger jobs: repeat weekly, desk booking, reschedule, cancel and refund everyone.",
    "All times are Dubai time. Seats can never drop below what is already sold.",
    "After [[Repeat weekly…]], open each copy and set its **Workshop type** before you publish it.",
  ],
  roles: ["admin", "editor"],
  keywords: "classes workshops dates calendar schedule seats price workshop type theme level",
  intro: [
    {
      type: "mock",
      label: "Experience, workshop types and sessions (today's)",
      html: "<div class=\"flowline\"><div class=\"stage\"><span class=\"tag\">Experience</span><b>Candle Making</b><p>The class: its name, description and photos. Written once.</p></div><div class=\"stage\"><span class=\"tag\">Workshop types</span><b>Sculptural Forms · The Cheesecake Collection</b><p>The themes it runs in. Each has its own page listing its dates.</p></div><div class=\"stage live\"><span class=\"tag\">Sessions</span><b>Thu 19 Nov · 11:00 and 18:30</b><p>One dated sitting of a type, with its own price (AED 240) and seats (6).</p></div></div><div class=\"side-paths\"><div><b>Crocheting</b> works the same way, with levels instead of themes: Crochet — Beginners, Beginner Basics, Returning Learners, Beginner Project.</div><div>An experience with no types still works: its sessions hang straight off it.</div></div>",
    },
  ],
  sections: [
    {
      id: "experience-text",
      title: "Edit an experience's words",
      path: "Content > Experiences",
      who: "Admin · Editor",
      keywords: "about description name",
      blocks: [
        {
          type: "steps",
          items: [
            "Open an experience. The name ((1)) is printed in the script font, so keep it to 24 characters.",
            "The one-line description ((2)) shows under the name in menus and cards.",
            "**About** ((3)) has one box per paragraph. [[Add Paragraph]] for another.",
            "[[Publish changes]] ((4)) when you are happy.",
          ],
        },
        {
          type: "screenshot",
          file: "07-experience-text.webp",
          width: 1100,
          height: 1000,
          caption: "Content → Experiences → pick one. The name, the one-line description and the About paragraphs are all here. Changes save as a draft until you publish.",
          title: "Experiences — edit text",
          callouts: [
            { n: 1, label: "Name (up to 24 characters — it is printed in the script font)" },
            { n: 2, label: "One-line description — under the name in menus and cards" },
            { n: 3, label: "About — one box per paragraph; Add Paragraph for another" },
            { n: 4, label: "Publish changes when you are happy" },
          ],
        },
        {
          type: "info",
          title: "Good to know",
          text: [
            "An experience can't be deleted while workshop types belong to it. The message says, for example, “2 workshop types belong to this experience…”. Unpublish it instead, or move the types first.",
          ],
        },
      ],
    },
    {
      id: "experience-photos",
      title: "An experience's photos",
      keywords: "gallery cards images",
      blocks: [
        {
          type: "steps",
          items: [
            "Further down, set the main photograph ((1)). Square works best.",
            "The pencil ((2)) edits the photo's alt text and focal point. The [[×]] ((3)) removes it from here only; it stays in Media.",
            "Add up to three gallery photos ((4)) and drag the dots to change their order.",
          ],
        },
        {
          type: "screenshot",
          file: "07-experience-photos.webp",
          width: 1000,
          height: 480,
          caption: "Further down: the main photograph and up to three gallery photos — the cards fanned beside the About text on the experience page.",
          title: "Experiences — photos and gallery cards",
          callouts: [
            { n: 1, label: "Main photograph — square works best" },
            { n: 2, label: "Pencil: edit this photo (alt text, focal point)" },
            { n: 3, label: "×: remove it from here (the photo stays in Media)" },
            { n: 4, label: "Gallery cards — drag the dots to reorder" },
          ],
        },
        {
          type: "paragraph",
          text: "On the website, the gallery photos appear as fanned cards ((2)) beside the About text ((1)), in the same order.",
        },
        {
          type: "screenshot",
          file: "07-experience-gallery-cards-site.webp",
          width: 1200,
          height: 385,
          caption: "On the website, the gallery photos appear as fanned cards beside the About text. The order in the admin is the order of the cards.",
          title: "Experiences — photos and gallery cards",
          callouts: [
            { n: 1, label: "About paragraphs" },
            { n: 2, label: "Gallery cards (up to three)" },
          ],
        },
      ],
    },
    {
      id: "workshop-types",
      title: "Workshop types: themes and levels",
      path: "Content > Workshop types",
      who: "Admin · Editor (Front desk can look)",
      keywords: "theme level format candle theme crochet level monthly",
      blocks: [
        {
          type: "paragraph",
          text: "A workshop type is the format a booked (Create Together) experience runs in: a monthly candle theme such as *Sculptural Forms*, or a crochet level such as *Crochet — Beginners*. On the website a customer first picks the type, then a date. Each type has its own page at `/events/…` listing its dates, and the experience's page lists every published type that has dates ahead.",
        },
        {
          type: "screenshot",
          file: "34-workshop-types-list.webp",
          width: 1200,
          height: 500,
          caption: "Content → Workshop types: every theme and level, with the experience it belongs to, its level and its order.",
          title: "Workshop types",
          callouts: [
            { n: 1, label: "Create New — add a theme or level" },
            { n: 2, label: "Click a type to open it" },
            { n: 3, label: "The experience it belongs to" },
          ],
        },
        {
          type: "paragraph",
          text: "Today there are six: **Sculptural Forms** and **The Cheesecake Collection** (Candle Making), and **Crochet — Beginners**, **Beginner Basics**, **Returning Learners** and **Beginner Project** (Crocheting). Press [[Create New]] ((1)) to add one, or click a name ((2)) to change it.",
        },
      ],
    },
    {
      id: "workshop-type-edit",
      title: "What a workshop type holds",
      keywords: "name level description about photograph progression web address status flag",
      blocks: [
        {
          type: "list",
          items: [
            "**Experience** ((1)): the class it belongs to. Required; only booked (Create Together) experiences are offered.",
            "**Name** ((2)): up to 40 characters. It becomes the title of every session of this type, unless a session has its own.",
            "**Level** ((3)): a small chip such as *Beginner* or *Returning*. Leave it empty for a theme.",
            "**One-line description** ((4)) and **About** ((5)), one box per paragraph: what customers make and how the session runs. Price, length and dates stay on the sessions.",
            "**Photograph** ((6)): optional. Without one, the experience's photo is used.",
            "**Learning progression** ((7)): for levels taken in order. *Recommended after* picks the type that comes before (Beginner Basics after Beginners), and *Progression note* prints beside the name, such as “Start here”. Leave both empty for a theme.",
            "**Web address** ((8)): `/events/…`. It must differ from every experience and session address; if it clashes, the admin refuses and suggests one, such as `sculptural-forms-theme`.",
            "**Status flag** ((9)): a few words shown as they are, such as “New this month”. **Display order**: its place on the experience page.",
            "Press [[Publish changes]] ((10)). Workshop types have drafts, Schedule Publish, versions and an [[SEO]] tab, just like pages.",
          ],
        },
        {
          type: "screenshot",
          file: "34-workshop-type-edit.webp",
          width: 1200,
          height: 1083,
          caption: "A workshop type: which experience it belongs to, its name and level, its words and photo, and (for levels) what comes before it.",
          title: "Workshop types",
          callouts: [
            { n: 1, label: "Experience — the Create Together class it belongs to" },
            { n: 2, label: "Name — the title of every session of this type" },
            { n: 3, label: "Level — a chip such as Beginner; empty for a theme" },
            { n: 4, label: "One-line description" },
            { n: 5, label: "About — one box per paragraph" },
            { n: 6, label: "Photograph (optional — else the experience's)" },
            { n: 7, label: "Learning progression — for levels taken in order" },
            { n: 8, label: "Web address — /events/…" },
            { n: 9, label: "Status flag, e.g. New this month" },
            { n: 10, label: "Publish changes" },
          ],
        },
      ],
    },
    {
      id: "new-theme",
      title: "Add next month's candle theme",
      who: "Admin · Editor",
      keywords: "monthly theme new candle recipe",
      blocks: [
        {
          type: "steps",
          items: [
            "{{Content > Workshop types}} › [[Create New]].",
            "**Experience**: choose Candle Making.",
            "Name the theme, for example *Winter Botanicals*.",
            "Write the one line and the About paragraphs.",
            "Add a photograph of the finished candles.",
            "Press [[Publish changes]] (or [[Schedule Publish]] for the first of the month).",
            "Now the dates: {{Content > Sessions}} › [[Create New]].",
            "Choose **Candle Making**, then the new **Workshop type**.",
            "Set the date, price and seats, then [[Publish changes]]. For more dates, see [Add a session](#add-session) and [Repeat weekly](#repeat-weekly).",
          ],
        },
        {
          type: "tip",
          text: [
            "Retiring a theme? Unpublish it from the [[⋮]] menu. A type can't be deleted while sessions belong to it, and that is a good thing: past bookings keep their history.",
          ],
        },
        {
          type: "warning",
          title: "Careful",
          text: [
            "[[Create New]] on Workshop types saves an empty draft straight away. If you leave without filling it in, delete the empty row (shown as *<No Name>*) from the list.",
          ],
        },
      ],
    },
    {
      id: "sessions-list",
      title: "All your sessions",
      path: "Content > Sessions",
      who: "Admin · Editor",
      blocks: [
        {
          type: "steps",
          items: [
            "[[Create New]] ((1)) adds a session.",
            "Search and filter ((2)) to find a date. The **Workshop type** column ((6)) shows the theme or level of each date.",
            "**Status** ((3)): **Draft** is not on the website, **Published** is. “Draft (has published version)” means it is live, with unpublished changes waiting.",
            "**Booking status** ((5)): Open, Waitlist, Closed or Cancelled. This says whether it can be booked.",
            "Click a session ((4)) to open it.",
          ],
        },
        {
          type: "screenshot",
          file: "08-sessions-list.webp",
          width: 1200,
          height: 533,
          caption: "Content → Sessions lists every dated class with its workshop type, start, venue and seats. Status says whether it is on the website (Draft or Published); Booking status says whether it can be booked.",
          title: "Sessions — list and add",
          callouts: [
            { n: 1, label: "Create New — add a session" },
            { n: 2, label: "Search and filters" },
            { n: 3, label: "Status — Draft or Published (on the website or not)" },
            { n: 4, label: "Click a session to open it" },
            { n: 5, label: "Booking status — Open, Waitlist, Closed or Cancelled: whether it can be booked" },
            { n: 6, label: "Workshop type — the theme or level this date belongs to" },
          ],
        },
      ],
    },
    {
      id: "add-session",
      title: "Add a session",
      keywords: "new date create",
      blocks: [
        {
          type: "steps",
          items: [
            "Choose which experience this is a date of ((1)).",
            "Choose its **Workshop type** ((2)). Only that experience's types are offered; leave it empty for an experience with none. The session then takes the type's name and photo, and its web address becomes type-date-time, such as `sculptural-forms-2026-12-05-1830`.",
            "Leave **Title** empty to use the type's name. Type **Craft** in **Category** ((3)): it is required, and only shows as a small label on the homepage.",
            "Pick the date and start time ((4)), in Dubai time.",
            "Choose where it runs ((5)).",
            "Set the price per person and number of seats ((6)).",
            "Optional: choose this date's **Vibes** ((8)) in the right-hand column. Leave it empty to use the experience's vibes.",
            "Press [[Publish changes]] ((7)) to put it on sale, or [[Save Draft]] to finish later.",
          ],
        },
        {
          type: "screenshot",
          file: "08-session-add.webp",
          width: 1200,
          height: 917,
          caption: "A new session: choose the experience and its workshop type, type Craft as the category, then the date and time (Dubai time), the venue, the price and the number of seats. Publish changes puts it on sale; Save Draft keeps it for later.",
          title: "Sessions — list and add",
          callouts: [
            { n: 1, label: "Which experience this is a date of" },
            { n: 2, label: "Workshop type — the theme or level (only this experience's types)" },
            { n: 3, label: "Category — required; type Craft (a small label)" },
            { n: 4, label: "Date and start time (Dubai time)" },
            { n: 5, label: "Where it runs" },
            { n: 6, label: "Price per person and number of seats" },
            { n: 7, label: "Publish changes puts it on sale (Save Draft finishes later)" },
            { n: 8, label: "Vibes — the mood of this date (optional)" },
          ],
        },
        {
          type: "tip",
          text: [
            "For a regular weekly class, set up one session perfectly, then use [Repeat weekly](#repeat-weekly). It saves a lot of typing.",
          ],
        },
        {
          type: "info",
          title: "Good to know",
          text: [
            "The hint under Category still says it “becomes a filter option on the Experiences page”. It no longer does: the Events page filters by date, event, theme (workshop type), vibe and venue. Category is only a small label on the homepage's session cards, shown when it differs from the title.",
            "Picking a workshop type from another experience is refused: “This workshop type belongs to a different experience…”. Choose the experience first.",
          ],
        },
      ],
    },
    {
      id: "price-seats",
      title: "Change the price or number of seats",
      keywords: "price cost capacity",
      blocks: [
        {
          type: "steps",
          items: [
            "Open the session. The live counts at the top ((1)) show seats sold, held (someone is paying right now) and left.",
            "Change the price per person ((2)). Prices include VAT.",
            "Change the total seats ((3)). It can't go below what is already sold.",
            "Press [[Publish changes]] ((4)).",
          ],
        },
        {
          type: "screenshot",
          file: "08-session-price-seats.webp",
          width: 1200,
          height: 917,
          caption: "A Sculptural Forms session. To change the price or the number of seats, change the numbers and press Publish changes. Seats can never go below what is already sold. The workshop type gives the session its name and photo.",
          title: "Sessions — change price or seats",
          callouts: [
            { n: 1, label: "Sold / Held / Left — live seat counts" },
            { n: 2, label: "Price per person (AED, VAT included)" },
            { n: 3, label: "Seats — the total for this date" },
            { n: 4, label: "Publish changes" },
            { n: 5, label: "Workshop type — gives the session its name and photo" },
          ],
        },
        {
          type: "warning",
          text: ["A new price applies to new bookings only. People who already booked keep the price they paid."],
        },
      ],
    },
    {
      id: "booking-status",
      title: "Open, close or waitlist a session",
      keywords: "close sales cut-off check-in window waitlist",
      blocks: [
        {
          type: "paragraph",
          text: "On the session's **Booking** tab, **Booking status** ((1)) switches online sales on or off for this date. **Sales close** ((2)) stops online booking earlier than the start time, for example two hours before. The **Check-in window** ((3)) sets how early and late tickets will scan.",
        },
        {
          type: "screenshot",
          file: "08-session-sales-close.webp",
          width: 960,
          height: 640,
          caption: "Booking tab: Booking status switches online sales on or off for this date. Sales close stops online booking at an earlier time than the start.",
          title: "Sessions — close sales",
          callouts: [
            { n: 1, label: "Booking status" },
            { n: 2, label: "Sales close — optional earlier cut-off (Dubai time)" },
            { n: 3, label: "Check-in window — how early and late tickets scan" },
          ],
        },
        {
          type: "steps",
          items: [
            "To close sales by hand, open **Booking status** ((1)).",
            "Pick [[Closed — no bookings, no waitlist]] or [[Waitlist only]] ((2)). [[Open — seats can be booked]] puts it back on sale.",
            "Press [[Publish changes]].",
          ],
        },
        {
          type: "screenshot",
          file: "08-session-close-sales.webp",
          width: 960,
          height: 400,
          caption: "To close sales by hand, pick “Closed — no bookings, no waitlist” or “Waitlist only”, then Publish changes. “Open — seats can be booked” puts it back on sale. A full session switches to the waitlist by itself.",
          title: "Sessions — close sales",
          callouts: [
            { n: 1, label: "Booking status — Open, Waitlist only or Closed" },
            { n: 2, label: "Choose one of these" },
          ],
        },
        {
          type: "tip",
          text: ["A full session switches to the waitlist by itself. You don't need to do anything."],
        },
      ],
    },
    {
      id: "session-actions",
      title: "The Actions menu",
      blocks: [
        {
          type: "paragraph",
          text: "Bigger jobs live under [[Actions]] ((1)) on a session ((2)): repeat it weekly, take a desk booking, open check-in, reschedule, or cancel and refund everyone.",
        },
        {
          type: "screenshot",
          file: "08-session-actions.webp",
          width: 880,
          height: 480,
          caption: "The Actions button on a session holds the bigger jobs: repeat it weekly, take a desk booking, reschedule, or cancel and refund everyone.",
          title: "Sessions — actions menu",
          callouts: [
            { n: 1, label: "Actions" },
            { n: 2, label: "Repeat weekly · Desk booking · Check-in · Reschedule · Cancel & refund all" },
          ],
        },
      ],
    },
    {
      id: "repeat-weekly",
      title: "Repeat a session weekly",
      who: "Admin · Editor",
      keywords: "recurring series copy duplicate",
      blocks: [
        {
          type: "steps",
          items: [
            "Open a session you are happy with. [[Actions]] › [[Repeat weekly…]].",
            "Tick the weekdays ((1)) and choose the last date ((2)).",
            "Check the list of dates it will create ((3)).",
            "Press the button to create them ((4)). The copies are **drafts**.",
            "Open each copy, set its **Workshop type** (and **Vibes**, if the original had them), then [[Publish changes]].",
          ],
        },
        {
          type: "screenshot",
          file: "08-session-repeat-weekly.webp",
          width: 640,
          height: 462,
          caption: "Repeat weekly… makes copies of this session on the same weekday and time for as many weeks as you choose. The copies are drafts — publish the ones you want.",
          title: "Sessions — repeat weekly",
          callouts: [
            { n: 1, label: "Tick the weekdays" },
            { n: 2, label: "Until — the last date" },
            { n: 3, label: "The dates it will create" },
            { n: 4, label: "Create the drafts" },
          ],
          maxWidth: 640,
        },
        {
          type: "warning",
          title: "Careful",
          text: [
            "Repeat weekly doesn't copy the **Workshop type** or the **Vibes** yet. A copy left as it is becomes a plain Candle Making date: it doesn't show on the theme's page or under the Theme filter. Set the workshop type on every copy before you publish it. (Nexeor has been told.)",
          ],
        },
      ],
    },
    {
      id: "reschedule",
      title: "Reschedule a session",
      who: "Admin only",
      keywords: "move date change time",
      blocks: [
        {
          type: "paragraph",
          text: "Once seats are sold, the date can only be changed this way, so that everyone holding a ticket hears about it.",
        },
        {
          type: "steps",
          items: [
            "[[Actions]] › [[Reschedule…]].",
            "Choose the new date and time ((1)), and the venue ((2)) if it moves too.",
            "Add an optional line for the email ((3)), such as “Sorry for the change — see you there!”",
            "Press the button ((4)). Every ticket holder is emailed the new date.",
          ],
        },
        {
          type: "screenshot",
          file: "08-session-reschedule.webp",
          width: 640,
          height: 491,
          caption: "Reschedule… moves the session to a new date and time and emails everyone holding a ticket. (Once seats are sold the date can only be changed this way.)",
          title: "Sessions — reschedule",
          callouts: [
            { n: 1, label: "The new date and time" },
            { n: 2, label: "Venue (change it if it moves)" },
            { n: 3, label: "Optional line for the email to customers" },
            { n: 4, label: "Reschedule and email the ticket holders" },
          ],
          maxWidth: 640,
        },
        {
          type: "never",
          text: [
            "Never tell customers about a new date only by phone or WhatsApp. Use Reschedule, so their tickets, reminders and the website all show the right time.",
          ],
        },
      ],
    },
    {
      id: "cancel-session",
      title: "Cancel a session and refund everyone",
      who: "Admin only",
      keywords: "cancel refund all illness",
      blocks: [
        {
          type: "paragraph",
          text: "This takes the session off sale, refunds every paid booking through Mamo Pay, and emails each customer. You see exactly who is affected before you confirm.",
        },
        {
          type: "steps",
          items: [
            "[[Actions]] › [[Cancel session & refund all…]]. Check how many seats are affected ((1)).",
            "Write the reason ((2)). It is required, and customers see it.",
            "Add an optional extra line for the email ((3)).",
            "Press [[Cancel session & refund all]] ((4)). It unlocks once the reason is filled in.",
          ],
        },
        {
          type: "screenshot",
          file: "08-session-cancel-refund-all.webp",
          width: 640,
          height: 577,
          caption: "Cancel session & refund all… takes the session off sale, refunds every paid booking through Mamo Pay and emails each customer. You are shown exactly who is affected before you confirm.",
          title: "Sessions — cancel and refund all",
          callouts: [
            { n: 1, label: "How many seats are affected" },
            { n: 2, label: "Reason — required; customers see it" },
            { n: 3, label: "Optional extra line for the email" },
            { n: 4, label: "Cancel session & refund all — unlocks once the reason is filled in" },
          ],
          maxWidth: 640,
        },
        {
          type: "warning",
          text: [
            "This can't be undone. Refunds go back to customers' cards straight away. People who paid at the desk are listed for you to repay in person.",
          ],
        },
      ],
    },
    {
      id: "attendees",
      title: "The attendee list",
      who: "Admin · Front desk",
      keywords: "guest list print csv arrived",
      blocks: [
        {
          type: "steps",
          items: [
            "Open the session's [[Attendees]] tab ((1)) and press [[Show attendee list]].",
            "[[Print]] it or download it as a spreadsheet ((2)).",
            "Press [[Mark as arrived]] ((3)) as each guest comes in, if you are not scanning.",
          ],
        },
        {
          type: "screenshot",
          file: "08-session-attendees.webp",
          width: 960,
          height: 700,
          caption: "Attendees tab → Show attendee list: everyone booked on this date, with Print and CSV buttons and a Mark as arrived button on each line.",
          title: "Sessions — attendee list",
          callouts: [
            { n: 1, label: "Attendees tab" },
            { n: 2, label: "Print or download the list" },
            { n: 3, label: "Mark as arrived — press it as each guest comes in" },
          ],
        },
      ],
    },
    {
      id: "waitlist",
      title: "The waitlist",
      path: "Bookings > Waitlist",
      who: "Admin · Front desk",
      keywords: "full sold out wait list",
      blocks: [
        {
          type: "paragraph",
          text: "When a session is full (or set to **Waitlist only**), the website offers a “join the waitlist” form instead of Book. If seats free up, for example after a refund, the people waiting are emailed in the order they joined. Seats aren't reserved for them: the first to book gets the seat, and the email says so.",
        },
        {
          type: "mock",
          label: "A waitlist entry's journey",
          html: "<div class=\"panel\"><div class=\"flow\"><span class=\"chip\">Waiting</span><span class=\"arrow\">→</span><span class=\"chip a\">Notified — seat offered</span><span class=\"arrow\">→</span><span class=\"chip g\">Converted — booked</span></div><p class=\"muted\">Or: <span class=\"chip n\">Expired — did not book in time</span> after 24 hours, and the next person is offered the seat. <span class=\"chip n\">Cancelled</span> if the session is cancelled.</p></div>",
        },
        {
          type: "tip",
          text: [
            "Someone rings to join the waitlist? Front desk can add them directly in {{Bookings > Waitlist}}.",
          ],
        },
      ],
    },
  ],
};
