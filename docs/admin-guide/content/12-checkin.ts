import type { Chapter } from "./types";

export const checkin: Chapter = {
  slug: "checkin",
  number: 11,
  title: "Tickets & check-in",
  lede: "Every seat gets its own ticket with a QR code. At the door, your phone becomes the scanner.",
  blurb: "One ticket per seat, scanned at the door with a phone.",
  summary: [
    "Each seat has its own ticket. The code under the QR starts `MPT-`.",
    "On a phone or tablet open {{Front desk > Check-in}} and press [[Start camera]].",
    "**Green**: welcome them in. **Amber**: stop and read. **Red**: don't let them in; look up the booking.",
    "No camera or the QR won't scan? Type the code instead.",
    "Sessions are listed by their workshop type, such as *Crochet — Beginners*.",
  ],
  roles: ["admin", "front-desk"],
  keywords: "tickets qr scan door front desk check in arrive",
  sections: [
    {
      id: "tickets-list",
      title: "All tickets",
      path: "Bookings > Tickets",
      who: "Admin · Front desk",
      keywords: "ticket code mpt",
      blocks: [
        {
          type: "steps",
          items: [
            "Search by ticket code or holder ((1)).",
            "Each ticket's status ((2)): Valid, Checked in, Refunded or Void.",
            "[[Check-in]] ((3)) opens the door scanner.",
          ],
        },
        {
          type: "screenshot",
          file: "22-tickets-list.webp",
          width: 1200,
          height: 750,
          caption: "Bookings → Tickets: one ticket per seat, with its code, holder and status (Valid, Checked in, Refunded, Void). Search by code or name.",
          title: "Tickets",
          callouts: [
            { n: 1, label: "Search by ticket code or holder" },
            { n: 2, label: "Status of each ticket" },
            { n: 3, label: "Check-in — open the door scanner" },
          ],
        },
      ],
    },
    {
      id: "open-checkin",
      title: "Open check-in on your phone",
      keywords: "phone tablet camera",
      blocks: [
        {
          type: "steps",
          items: [
            "On your phone, log in to the admin and open {{Front desk > Check-in}}.",
            "Turn [[Sound on]] ((5)) for a beep on each scan.",
            "Today's sessions are listed ((3)) with how many have arrived. [[Previous]] / [[Next]] ((4)) look at other days.",
            "Press [[Start camera]] ((1)), or type a ticket code ((2)).",
          ],
        },
        {
          type: "screenshot",
          file: "21-checkin-phone.webp",
          width: 390,
          height: 844,
          caption: "Front desk → Check-in, on a phone. Start the camera to scan tickets, or type the code printed under the QR. The day's sessions and arrivals are listed below.",
          title: "Check-in on a phone",
          callouts: [
            { n: 1, label: "Start camera" },
            { n: 2, label: "Or type the ticket code (MPT-…) and press Check in" },
            { n: 3, label: "Today's sessions — arrived so far, and the attendee list" },
            { n: 4, label: "Look at another day" },
            { n: 5, label: "Sound on — a beep for each scan" },
          ],
          phone: true,
        },
        {
          type: "tip",
          text: [
            "The first time, your phone asks to use the camera. Press **Allow**. Add the check-in page to your home screen so it opens like an app.",
          ],
        },
      ],
    },
    {
      id: "scan",
      title: "Scan a ticket",
      keywords: "scan qr code camera manual",
      blocks: [
        {
          type: "phones",
          shots: [
            {
              type: "screenshot",
              file: "21-checkin-scan.webp",
              width: 390,
              height: 844,
              caption: "Scanning: hold the customer's ticket QR code (on their phone or printed) inside the frame. Each scan gives a big green, amber or red answer straight away. (This picture uses a test camera image.)",
              title: "Check-in on a phone",
              callouts: [
                { n: 1, label: "Hold the QR code inside the frame" },
                { n: 2, label: "Stop the camera when you are done" },
              ],
              phone: true,
            },
            {
              type: "screenshot",
              file: "21-checkin-manual-code.webp",
              width: 390,
              height: 844,
              caption: "No camera, or a QR that will not scan? Type the code printed under it (it starts MPT-) and press Check in.",
              title: "Check-in on a phone",
              callouts: [
                { n: 1, label: "The ticket code" },
                { n: 2, label: "Check in" },
              ],
              phone: true,
            },
          ],
        },
        { type: "paragraph", text: "**Left picture, scanning:**" },
        {
          type: "steps",
          items: [
            "Hold the customer's QR code inside the frame ((1)), on their phone or on paper.",
            "The answer appears straight away in large type.",
            "[[Stop camera]] ((2)) when the session has started.",
          ],
        },
        { type: "paragraph", text: "**Right picture, no camera or a QR that won't scan:**" },
        {
          type: "steps",
          items: ["Type the code printed under the QR ((1)). It starts `MPT-`.", "Press [[Check in]] ((2))."],
        },
      ],
    },
    {
      id: "verdicts",
      title: "What the colours mean",
      keywords: "green amber red already checked wrong day refunded void let in anyway",
      blocks: [
        {
          type: "mock",
          label: "The answer after a scan",
          html: "<div class=\"verdicts\"><div class=\"verdict ok\"><strong>Welcome — checked in</strong><span>Layla Haddad · seat 1 of 2</span><span class=\"means\">Let them in.</span></div><div class=\"verdict warn\"><strong>Already checked in</strong><span>Arrived at 15:21, checked in by Sara.</span><span class=\"means\">Stop and read. Ask, then decide.</span></div><div class=\"verdict stop\"><strong>Ticket refunded — do not admit</strong><span>This seat was refunded.</span><span class=\"means\">Don't let in. Look up the booking.</span></div></div>",
        },
        {
          type: "paragraph",
          text: "Amber answers are “already checked in” and “not this session's time”. Red answers are “ticket cancelled”, “ticket refunded” and “no ticket with this code”. Red can never be overridden.",
        },
        {
          type: "phones",
          shots: [
            {
              type: "screenshot",
              file: "21-checkin-verdict-already.webp",
              width: 390,
              height: 844,
              caption: "Already checked in: the ticket was scanned before — the screen shows when and by whom, so a shared screenshot of a ticket cannot be used twice.",
              title: "Check-in on a phone",
              callouts: [
                { n: 1, label: "Who this ticket belongs to and when it was first used" },
              ],
              phone: true,
            },
            {
              type: "screenshot",
              file: "21-checkin-verdict-wrong-day.webp",
              width: 390,
              height: 844,
              caption: "A coloured box means “stop and look” — here the ticket is for a different time. You can still let them in on purpose with Let in anyway; that choice is written on the booking. A valid ticket shows a green welcome instead.",
              title: "Check-in on a phone",
              callouts: [
                { n: 1, label: "The answer, in large type" },
                { n: 2, label: "Let in anyway — only if you are sure" },
              ],
              phone: true,
            },
          ],
        },
        {
          type: "warning",
          text: [
            "**Let in anyway** appears only on amber answers. Use it when you are sure, for example a guest who came on the wrong day and you have space. Your choice is written on the booking with your name.",
          ],
        },
        {
          type: "never",
          text: [
            "Never let someone in on a red answer without looking up their booking first. Ask for their booking reference or email and search for it with [[⌘K]].",
          ],
        },
      ],
    },
  ],
};
