import type { Chapter } from "./types";

export const orders: Chapter = {
  slug: "orders",
  number: 10,
  title: "Bookings & orders",
  lede: "Every booking is an order with a reference that starts MP-. Open it, and everything you can do with it is under Actions.",
  blurb: "Find, refund, move and take bookings; customers and promo codes.",
  summary: [
    "{{Bookings > Orders}}: search by reference (`MP-…`) or email. Coloured chips filter by status.",
    "Open an order. [[Actions]] holds refund, move to another date, resend tickets and more.",
    "Front desk can **request** a refund; only the owner (Admin) **approves** it, from {{Bookings > Refunds}} or the dashboard.",
    "All prices include 5% VAT. Walk-ins and phone bookings use [[Create desk booking]].",
  ],
  roles: ["admin", "front-desk"],
  keywords: "bookings orders customers refunds desk walk-in phone booking promo discount",
  intro: [
    {
      type: "mock",
      label: "An order's status changes by itself",
      html: "<div class=\"panel\"><div class=\"flow\"><span class=\"chip n\">Pending payment</span><span class=\"arrow\">→</span><span class=\"chip a\">Awaiting payment</span><span class=\"arrow\">→</span><span class=\"chip\">Confirming</span><span class=\"arrow\">→</span><span class=\"chip g\">Confirmed</span><span class=\"arrow\">→</span><span class=\"chip g\">Completed</span></div><p class=\"muted\">Other endings: <span class=\"chip r\">Failed</span> payment declined, the customer may try again · <span class=\"chip n\">Expired</span> the seat hold (15 minutes unless changed) ran out without payment · <span class=\"chip n\">Cancelled</span> · <span class=\"chip\">Refunded in full</span></p></div>",
    },
  ],
  sections: [
    {
      id: "find-orders",
      title: "Find an order",
      path: "Bookings > Orders",
      who: "Admin · Front desk",
      keywords: "search booking reference",
      blocks: [
        {
          type: "steps",
          items: [
            "Type a booking reference or an email ((1)).",
            "Or use the quick filters ((2)): Needs attention, Confirmed, Refunded…",
            "Click the reference ((4)) to open the order. [[Create desk booking]] ((3)) is up here too.",
          ],
        },
        {
          type: "screenshot",
          file: "19-orders-find.webp",
          width: 1200,
          height: 300,
          caption: "Bookings → Orders. Type a booking reference (MP-…) or an email into the search box. The coloured chips filter by status.",
          title: "Orders — find an order",
          callouts: [
            { n: 1, label: "Search by reference or email" },
            { n: 2, label: "Quick filters: Needs attention, Confirmed, Refunded…" },
            { n: 3, label: "Create desk booking" },
            { n: 4, label: "Click the reference to open the order" },
          ],
        },
      ],
    },
    {
      id: "view-order",
      title: "Read an order",
      keywords: "details history timeline notes contact",
      blocks: [
        {
          type: "paragraph",
          text: "At the top: the booking reference ((1)), its status ((2)) (which changes by itself), the [[Actions]] button ((3)), and the customer's contact details ((4)). You may correct a mistyped email or phone number here.",
        },
        {
          type: "screenshot",
          file: "19-order-view.webp",
          width: 1060,
          height: 900,
          caption: "An order shows its reference, its status, the Actions button and the customer's details. Everything you can do with it is under Actions.",
          title: "Orders — view an order",
          callouts: [
            { n: 1, label: "Booking reference" },
            { n: 2, label: "Status (changes by itself)" },
            { n: 3, label: "Actions — refund, move, resend…" },
            { n: 4, label: "Contact details — you may correct email or phone" },
          ],
        },
        {
          type: "paragraph",
          text: "Further down: what was booked ((1)) and the totals with VAT ((2)), then the invoice, each ticket and its check-in.",
        },
        {
          type: "screenshot",
          file: "19-order-details.webp",
          width: 1200,
          height: 833.5,
          caption: "Further down: what was booked, the totals with VAT, the invoice, each ticket and its check-in, and the full history of the booking.",
          title: "Orders — view an order",
          callouts: [
            { n: 1, label: "What was booked" },
            { n: 2, label: "Totals — prices include VAT" },
          ],
        },
        {
          type: "paragraph",
          text: "At the bottom, the history lists everything that happened to the booking, oldest first, and who did it ((2)). Internal notes ((1)) are for staff only. Customers never see them.",
        },
        {
          type: "screenshot",
          file: "19-order-tickets-history.webp",
          width: 685,
          height: 597,
          caption: "The History lists everything that happened to the booking, oldest first, and who did it. Internal notes are for staff only.",
          title: "Orders — view an order",
          callouts: [
            { n: 1, label: "Internal notes — staff only" },
            { n: 2, label: "History — every step, with who did it" },
          ],
          maxWidth: 685,
        },
      ],
    },
    {
      id: "order-actions",
      title: "Order actions",
      keywords: "resend tickets confirmation",
      blocks: [
        {
          type: "paragraph",
          text: "Open [[Actions]] ((1)). Items ending in [[…]] open a window first, such as [[Refund…]] ((2)) and [[Move to another date…]] ((3)). [[Resend tickets]] ((4)) and [[Resend confirmation]] email the customer again; each asks you to confirm first.",
        },
        {
          type: "screenshot",
          file: "19-order-actions.webp",
          width: 800,
          height: 520,
          caption: "Actions on an order. Items ending in … open a window first. Resend confirmation and Resend tickets ask you to confirm before the email goes. The owner also sees Regenerate invoice PDF and Cancel with full refund…",
          title: "Orders — actions (refund, resend tickets, move)",
          callouts: [
            { n: 1, label: "Actions" },
            { n: 2, label: "Refund… — full or part" },
            { n: 3, label: "Move to another date…" },
            { n: 4, label: "Resend tickets — emails them again" },
          ],
        },
        { type: "paragraph", text: "The owner (Admin) also sees these, when they apply:" },
        {
          type: "list",
          items: [
            "[[Cancel with full refund…]]: the whole order is cancelled and all the money goes back to the customer.",
            "[[Regenerate invoice PDF]]: a fresh file for the invoice, with the same invoice number.",
            "[[Mark review resolved]]: clears the **Needs review** label on an order once you have checked it.",
            "[[Approve refund of AED …]] or [[Mark AED … repaid]]: for a refund that is waiting. See below.",
          ],
        },
      ],
    },
    {
      id: "refund",
      title: "Refund an order",
      who: "Request: Admin · Front desk",
      keywords: "money back return cancel desk refund record refund",
      blocks: [
        {
          type: "steps",
          items: [
            "[[Actions]] › [[Refund…]]. The full amount is filled in; lower it for a part refund ((1)).",
            "Pick a reason from the list ((2)). Add a note if it helps.",
            "Tick **Give the seats back** ((3)) to make them bookable again.",
            "Owner: tick **Approve now** ((4)). Front desk: you don't see this box. Your button says [[Request refund]], and the owner approves it (see below).",
            "Press [[Refund now]] ((5)). The money goes back to the customer's card through Mamo Pay and they get an email.",
          ],
        },
        {
          type: "screenshot",
          file: "19-order-refund.webp",
          width: 640,
          height: 635,
          caption: "Refund…: the full amount is filled in; lower it for a part refund. Pick a reason, add a note if it helps, and confirm. The money goes back through Mamo Pay to the customer's card, and they get an email.",
          title: "Orders — refund",
          callouts: [
            { n: 1, label: "Amount — the full amount, or less for a part refund" },
            { n: 2, label: "Reason — pick one from the list" },
            { n: 3, label: "Give the seats back — makes them bookable again" },
            { n: 4, label: "Approve now — or leave it to approve later from Bookings › Refunds" },
            { n: 5, label: "Refund now" },
          ],
          maxWidth: 640,
        },
        {
          type: "info",
          title: "In plain words",
          text: [
            "**Paid at the desk?** The window is called “Record a desk refund” and the button says [[Record refund]]. Hand the money back in person, then the owner opens the order and presses [[Actions]] › [[Mark AED … repaid]].",
            "Card refunds can take several working days to show on the customer's statement, depending on their bank.",
          ],
        },
      ],
    },
    {
      id: "approve-refund",
      title: "Approve a refund your team asked for",
      path: "Bookings > Refunds",
      who: "Admin only",
      keywords: "approve refund request refunds list requested waiting decline",
      blocks: [
        {
          type: "paragraph",
          text: "When front desk asks for a refund, nothing is paid back until you approve it.",
        },
        {
          type: "steps",
          items: [
            "On the dashboard, press [[Approve →]] next to the waiting refund. Or open {{Bookings > Refunds}}: it shows the refunds that are waiting.",
            "Open the order.",
            "Press [[Actions]] › [[Approve refund of AED …]] (it shows the amount). Mamo Pay returns the money within a few minutes, and the customer is emailed.",
          ],
        },
        {
          type: "tip",
          text: [
            "There is no decline button. If you don't want to refund, tell the customer yourself and write why in the order's internal notes, so your team knows.",
          ],
        },
      ],
    },
    {
      id: "move-booking",
      title: "Move a booking to another date",
      keywords: "change date transfer swap",
      blocks: [
        {
          type: "steps",
          items: [
            "[[Actions]] › [[Move to another date…]]. Pick a different session of the same experience ((1)).",
            "If the price is different, choose what happens to the difference ((2)): no charge, collect at the studio, or refund it.",
            "Press [[Move booking]] ((3)). The old tickets stop working and the customer is emailed new ones.",
          ],
        },
        {
          type: "screenshot",
          file: "19-order-move.webp",
          width: 640,
          height: 748,
          caption: "Move to another date…: pick a different session of the same experience. The tickets move with the booking and the customer is emailed the new date.",
          title: "Orders — move a booking",
          callouts: [
            { n: 1, label: "The new date" },
            { n: 2, label: "If the price is different — what happens to the difference" },
            { n: 3, label: "Move booking — the customer is emailed new tickets" },
          ],
          maxWidth: 640,
        },
      ],
    },
    {
      id: "desk-booking",
      title: "Take a walk-in or phone booking",
      path: "Bookings > Orders > Create desk booking",
      who: "Admin · Front desk",
      keywords: "walk-in cash card terminal phone booking manual",
      blocks: [
        {
          type: "steps",
          items: [
            "Choose the session ((1)). Each line shows the date, the workshop type (such as *Sculptural Forms*), the venue and the seats left.",
            "Set the number of seats and how they paid ((2)): cash, card terminal, bank transfer or complimentary. Leave **Amount taken** empty to charge the normal price.",
            "Type the customer's **First name** and **Last name** ((3)). Both are required (marked *); if one is missing, the box turns red and says, for example, “Enter the customer's last name.”",
            "Add their email ((4)) so they receive their confirmation, tickets and invoice. A phone number, codes and a note for the team are optional.",
            "[[Preview total]] to check the price, then [[Create booking]] ((5)). It stays greyed out until the session, seats, payment and both names are filled in.",
          ],
        },
        {
          type: "screenshot",
          file: "19-desk-booking.webp",
          width: 1200,
          height: 1127,
          caption: "Create a desk booking — for walk-ins and phone bookings paid at the studio. Pick the session, seats and how they paid, and the customer's first and last name; add an email so they get their tickets. Here the last name is still missing, so Create booking stays greyed out.",
          title: "Orders — desk booking",
          callouts: [
            { n: 1, label: "Which session" },
            { n: 2, label: "Seats and how they paid" },
            { n: 3, label: "First and last name — both required (*)" },
            { n: 4, label: "Email, so they receive their tickets" },
            { n: 5, label: "Preview total, then Create booking" },
          ],
          maxWidth: 840,
        },
        {
          type: "tip",
          text: [
            "Desk bookings work even while online bookings are closed, so you can take bookings in person from day one.",
          ],
        },
      ],
    },
    {
      id: "customers",
      title: "Customers",
      path: "Bookings > Customers",
      who: "Admin · Front desk (view)",
      keywords: "guests people notes allergies my bookings",
      blocks: [
        {
          type: "paragraph",
          text: "Everyone who has booked, one row per email address. Search by name or email ((1)) and click to open ((2)).",
        },
        {
          type: "screenshot",
          file: "20-customers-list.webp",
          width: 1200,
          height: 627.5,
          caption: "Bookings → Customers: everyone who has booked, one row per email address.",
          title: "Customers",
          callouts: [
            { n: 1, label: "Search by name or email" },
            { n: 2, label: "Click a customer to open them" },
          ],
        },
        {
          type: "paragraph",
          text: "A customer shows their contact details ((1)), staff-only notes ((2)) such as allergies or preferences, totals ((4)), and their orders. Under [[Actions]] ((3)), **Sign out everywhere** logs them out of “My bookings” on every device, which is useful if they lose their phone.",
        },
        {
          type: "screenshot",
          file: "20-customer-view.webp",
          width: 1060,
          height: 1000,
          caption: "A customer: contact details, staff-only notes (allergies, preferences), totals and their orders. Actions → Sign out everywhere logs them out of “My bookings” on every device.",
          title: "Customers",
          callouts: [
            { n: 1, label: "Contact details" },
            { n: 2, label: "Notes (staff only) — never shown to the customer" },
            { n: 3, label: "Actions: See their bookings, or Sign out everywhere" },
            { n: 4, label: "Totals — orders, tickets, lifetime spend" },
          ],
        },
        {
          type: "info",
          title: "In plain words",
          text: [
            "Customers don't have passwords. They see their bookings with their reference and email, or with a one-time link sent to their inbox from the website's “My bookings” page.",
          ],
        },
      ],
    },
    {
      id: "promo-codes",
      title: "Promo codes",
      path: "Bookings > Promo codes",
      who: "Admin",
      keywords: "discount coupon voucher code offer",
      blocks: [
        {
          type: "paragraph",
          text: "A code gives a percentage or a fixed amount off at checkout: for everything, for chosen experiences, or only certain dates. One code per order.",
        },
        {
          type: "mock",
          label: "Bookings › Promo codes › New (example)",
          html: "<div class=\"panel\"><div class=\"row\"><label class=\"field\"><span>Code</span><span class=\"input mono\">SUMMER10</span></label><label class=\"field\"><span>Label</span><span class=\"input\">Summer newsletter 10 %</span><em>For the team and the analytics view.</em></label></div><div class=\"row\"><label class=\"field\"><span>Discount type</span><span class=\"input\">Percentage off</span></label><label class=\"field\"><span>Value</span><span class=\"input\">10</span></label><label class=\"field\"><span>Applies to</span><span class=\"input\">Everything</span></label></div><div class=\"row\"><label class=\"field\"><span>Valid from</span><span class=\"input\">1 Jul 2026, 00:00</span><em>Blank: immediately.</em></label><label class=\"field\"><span>Valid until</span><span class=\"input\">31 Aug 2026, 23:59</span><em>Blank: no end date.</em></label></div><div class=\"row\"><label class=\"field\"><span>Maximum uses</span><span class=\"input\">100</span><em>Blank: unlimited.</em></label><label class=\"field\"><span>Minimum spend</span><span class=\"input\">AED 150</span></label></div><div class=\"row\"><span class=\"check\"><i class=\"on\"></i>Active</span><span class=\"btn primary\">Save</span></div></div>",
        },
        {
          type: "tip",
          text: [
            "To stop a code early, untick **Active**. It is then refused at checkout, whatever its dates. How often each code was used shows in Analytics.",
          ],
        },
      ],
    },
  ],
};
