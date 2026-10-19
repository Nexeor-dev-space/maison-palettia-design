import type { Chapter } from "./types";

export const analytics: Chapter = {
  slug: "analytics",
  number: 14,
  title: "Analytics & exports",
  lede: "See how the studio is doing, and give your accountant exactly what they need, in a couple of clicks.",
  blurb: "Sales, visitors, VAT summary and spreadsheets for your accountant.",
  summary: [
    "{{Reports > Analytics}}: sales and website visits for the dates you choose.",
    "Pick 7, 30 or 90 days, or [[Choose dates]] for a month, quarter or VAT period.",
    "The VAT summary and invoice spreadsheet are ready for your accountant.",
    "Editors see visitor numbers only. Sales and downloads are for the owner.",
  ],
  roles: ["admin", "editor"],
  keywords: "reports numbers revenue sales visitors vat accountant csv spreadsheet export",
  sections: [
    {
      id: "analytics-overview",
      title: "The overview",
      path: "Reports > Analytics",
      who: "Admin · Editor (visitors only)",
      keywords: "dates period visitors",
      blocks: [
        {
          type: "steps",
          items: [
            "Pick the last 7, 30 or 90 days ((1)), or [[Choose dates]] ((2)).",
            "Read the headline numbers ((4)), compared with the period before.",
            "[[Download CSV]] ((3)) for a spreadsheet of these figures.",
          ],
        },
        {
          type: "screenshot",
          file: "25-analytics-overview.webp",
          width: 1200,
          height: 833.5,
          caption: "Reports → Analytics: sales and website visits for the dates you choose. The top row is the headline numbers.",
          title: "Analytics",
          callouts: [
            { n: 1, label: "Last 7, 30 or 90 days" },
            { n: 2, label: "Choose dates — any from/to" },
            { n: 3, label: "Download CSV of these figures" },
            { n: 4, label: "Headline numbers vs the period before" },
            { n: 5, label: "Shown while Payments is not Live — test orders are included" },
          ],
        },
        {
          type: "warning",
          text: [
            "While payments are not **Live**, a note ((5)) reminds you that test orders are included in these numbers.",
          ],
        },
        {
          type: "paragraph",
          text: "[[Choose dates]] opens a from/to picker ((1)). The shortcuts ((2)) fill in **This month**, **Last month**, **This year** or **Last year** for you, which is handy for VAT periods. Press [[Show these dates]] ((3)).",
        },
        {
          type: "screenshot",
          file: "25-analytics-custom-dates.webp",
          width: 820,
          height: 377,
          caption: "Choose dates opens a from/to picker — for a month, a quarter, or the dates of your VAT return. The shortcuts fill in This month, Last month, This year or Last year for you.",
          title: "Analytics",
          callouts: [
            { n: 1, label: "From and To dates" },
            { n: 2, label: "Shortcuts: This month, Last month, This year, Last year" },
            { n: 3, label: "Show these dates" },
          ],
        },
      ],
    },
    {
      id: "analytics-sales",
      title: "Sales",
      keywords: "revenue best sellers fill rate",
      blocks: [
        {
          type: "paragraph",
          text: "Money taken per day ((1)) (press **Show as a table** for the numbers), online versus desk ((2)), refunds and discounts ((3)), best-selling experiences ((4)), and how full each session was.",
        },
        {
          type: "screenshot",
          file: "25-analytics-sales.webp",
          width: 1200,
          height: 833.5,
          caption: "Sales: money taken per day, online versus desk, refunds and discounts, best-selling experiences and how full each session was.",
          title: "Analytics",
          callouts: [
            { n: 1, label: "Sales per day — Show as a table for the numbers" },
            { n: 2, label: "Online or at the desk" },
            { n: 3, label: "Refunds & discounts" },
            { n: 4, label: "Best-selling experiences" },
          ],
        },
      ],
    },
    {
      id: "vat-exports",
      title: "VAT summary and exports for your accountant",
      who: "Admin only",
      keywords: "vat tax return fta accountant csv download invoices",
      blocks: [
        {
          type: "steps",
          items: [
            "[[Choose dates]] for your VAT period, such as a quarter, then [[Show these dates]].",
            "Read the VAT summary ((1)): sales including VAT, the net amount, and the VAT. Credit notes from refunds are already taken off.",
            "[[Download invoices (CSV)]] ((3)), or any other spreadsheet ((4)): orders, tickets, customers, enquiries.",
            "Send the files to your accountant.",
          ],
        },
        {
          type: "screenshot",
          file: "25-analytics-vat-exports.webp",
          width: 1200,
          height: 833.5,
          caption: "For the accountant: the VAT summary for the chosen dates (invoices minus credit notes) and one-click spreadsheet downloads of orders, invoices, tickets, customers and enquiries.",
          title: "Analytics — VAT and exports",
          callouts: [
            { n: 1, label: "VAT summary — sales incl. VAT, net, VAT" },
            { n: 2, label: "Warning while test orders are included — do not file these" },
            { n: 3, label: "Download invoices (CSV)" },
            { n: 4, label: "Download a spreadsheet of anything" },
          ],
        },
        {
          type: "never",
          text: [
            "Never file a VAT return while the warning ((2)) is showing. It means test orders are mixed into the figures.",
          ],
        },
      ],
    },
    {
      id: "tracking",
      title: "Visitor counting and tracking",
      blocks: [
        {
          type: "info",
          title: "Tracking",
          text: [
            "**Visitor counting** is built in and needs no cookies. If you also use Google Analytics, Plausible, Umami or a Meta pixel, the owner can add its ID under {{Settings (admin) > Analytics & tracking}}. Those load only after a visitor accepts the cookie banner.",
          ],
        },
      ],
    },
  ],
};
