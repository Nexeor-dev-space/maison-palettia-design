import type { Chapter } from "./types";

export const payments: Chapter = {
  slug: "payments",
  number: 15,
  title: "Payments (Mamo Pay): test, then live",
  lede: "Mamo Pay takes card payments for you. You practise first with pretend money, then switch to real cards when everything works.",
  blurb: "Practise with test cards, then switch on real payments safely.",
  summary: [
    "**Mode** says where card payments go: **Test** (practice cards, no money moves) or **Live** (real cards). Start in Test.",
    "Mamo gives you two keys: a sandbox (test) key and a live key. A key is like a long password that lets your site talk to Mamo.",
    "The **webhook** is how Mamo tells your site “this payment went through”. [[Register/Update webhook]] sets it up for you.",
    "Keys are stored locked and only ever shown as **Set** or **Not set**.",
  ],
  roles: ["admin"],
  keywords: "mamo pay card payments sandbox live test keys webhook go live",
  intro: [
    {
      type: "mock",
      label: "The road to live payments",
      html: "<ol class=\"track\"><li class=\"test\"><b>Sandbox key</b><span>Paste, Save, Test connection.</span></li><li class=\"test\"><b>Webhook</b><span>Register/Update webhook in Sandbox.</span></li><li class=\"test\"><b>Practise</b><span>Book with test cards. Check orders and emails.</span></li><li class=\"live\"><b>Live key</b><span>Paste, switch actions to Live, test, register webhook.</span></li><li class=\"live\"><b>Mode: Live</b><span>Checklist passes. Pay AED 2, then refund it.</span></li></ol>",
    },
  ],
  sections: [
    {
      id: "payments-mode",
      title: "Mode: Test or Live",
      path: "Settings (admin) > Payments (Mamo Pay)",
      who: "Admin only",
      keywords: "mode test live mock",
      blocks: [
        {
          type: "steps",
          items: [
            "Under **Mamo Pay actions** ((1)), choose Sandbox or Live, then use the buttons.",
            "**Mode** ((2)) is Test or Live.",
            "[[Save]] ((3)).",
          ],
        },
        {
          type: "screenshot",
          file: "31-payments-overview.webp",
          width: 1200,
          height: 633.5,
          caption: "Settings (admin) → Payments (Mamo Pay). Mode says where card payments go: Test (Mamo's sandbox — practice cards, no money moves) or Live (real cards). Start in Test. (“Mock” is a developer setting and does not appear on the live site.)",
          title: "Settings — Payments (Mamo Pay)",
          callouts: [
            { n: 1, label: "Mamo Pay actions — Sandbox or Live, then the buttons" },
            { n: 2, label: "Mode — Test or Live" },
            { n: 3, label: "Save" },
          ],
        },
        {
          type: "info",
          title: "In plain words",
          text: [
            "On the developer's copy you may see **Mock**. It is a built-in pretend gateway for testing the website and never appears on the live site.",
          ],
        },
      ],
    },
    {
      id: "payments-keys",
      title: "Add your keys",
      keywords: "api key sandbox live credentials",
      blocks: [
        {
          type: "steps",
          items: [
            "Under **Sandbox API key**, next to **Not set**, click the [[Enter]] button ((1)). Paste the key from Mamo into the box that opens, then press [[Save]] at the top right.",
            "[[Test connection]] ((2)) and wait for the green confirmation.",
            "Later, when Mamo gives it to you, add the live key the same way: [[Enter]] under **Live API key** ((3)), paste, [[Save]].",
            "The webhook header ((4)) is made for you by [[Register/Update webhook]]. Leave its Enter button alone.",
          ],
        },
        {
          type: "screenshot",
          file: "31-payments-keys.webp",
          width: 1000,
          height: 535,
          caption: "Keys: next to Not set, click the Enter button, paste the key into the box that opens, then press Save. The sandbox key goes under Sandbox credentials; the live key, later, under Live credentials. Keys are stored locked and only ever shown as Set or Not set.",
          title: "Settings — Payments (Mamo Pay)",
          callouts: [
            { n: 1, label: "Enter button — click it, paste the sandbox key, then Save" },
            { n: 2, label: "Test connection for this key" },
            { n: 3, label: "Live API key — the same way, when Mamo gives it to you" },
            { n: 4, label: "Webhook header — made for you by Register/Update webhook; leave it" },
          ],
        },
        {
          type: "never",
          text: [
            "Never send keys by email or WhatsApp, and never paste the live key into the sandbox box. If a key may have leaked, ask Mamo for a new one and replace it here.",
          ],
        },
      ],
    },
    {
      id: "payments-webhook",
      title: "Register the webhook",
      keywords: "webhook register",
      blocks: [
        {
          type: "steps",
          items: [
            "Choose Sandbox or Live first ((1)).",
            "Press [[Register/Update webhook]] ((2)). It shows the exact address and asks you to confirm.",
            "Read the answer ((3)). Mamo first checks that it can reach your site, then saves the address. If it refuses, the message says exactly why, for example “Save the key first” or “Mamo answered 422: …”. Usually the key isn't saved yet, or the site address isn't a real `https://` address.",
          ],
        },
        {
          type: "warning",
          title: "Careful",
          text: [
            "Register the webhook only from `maisonpalettia.com/admin`, never from Nexeor's test copy. Both share one database (see [Always work in maisonpalettia.com/admin](#one-database)), and a webhook registered from the test copy sends Mamo's payment messages to the test address. The dashboard then shows a red note: “The Mamo Pay webhook points at an old address (https://…)”. Press [[Re-register →]] on it from the live admin to put it right.",
          ],
        },
        {
          type: "screenshot",
          file: "31-payments-register-webhook.webp",
          width: 1062,
          height: 190,
          caption: "Register/Update webhook tells Mamo where to report payments. It first shows the exact address and asks you to confirm. It refuses, with a plain message, until the key is saved and the site address is a real https:// address. Rotate webhook secret and List Mamo webhooks are for Nexeor.",
          title: "Settings — Payments (Mamo Pay)",
          callouts: [
            { n: 1, label: "Choose Sandbox or Live first" },
            { n: 2, label: "Register/Update webhook" },
            { n: 3, label: "The answer appears here" },
            { n: 4, label: "Rotate webhook secret, List Mamo webhooks — for Nexeor; leave them alone" },
          ],
        },
        {
          type: "warning",
          text: [
            "[[Rotate webhook secret]] and [[List Mamo webhooks]] ((4)) are for Nexeor. Leave them alone. [[Send AED 2 test order]] (it says [[Send mock test payment]] on the developer's copy) is for practising, below.",
          ],
        },
      ],
    },
    {
      id: "test-cards",
      title: "Practise with test cards",
      keywords: "test cards practice sandbox",
      blocks: [
        {
          type: "paragraph",
          text: "In Test mode, book a session on your own website (or press [[Send AED 2 test order]]) and pay with Mamo's test cards. Expiry **01/28**, CVV **123**.",
        },
        {
          type: "table",
          head: ["Card number", "What happens"],
          rows: [
            ["4659 1055 6905 1157", "Payment succeeds"],
            ["4242 4242 4242 4242", "Succeeds after a security step (password `Checkout1!`)"],
            ["4567 3613 2598 1788", "Payment is declined"],
          ],
        },
        {
          type: "paragraph",
          text: "Then check {{Bookings > Orders}}: the paid ones show a ticket and an invoice, the declined one shows Failed, and the confirmation email arrived.",
        },
        {
          type: "warning",
          text: [
            "Test cards work only in Test mode. Real cards work only in Live mode. If customers say every card is declined, check the Mode first.",
          ],
        },
      ],
    },
    {
      id: "go-live",
      title: "Switch to Live",
      keywords: "go live switch checklist real payments",
      blocks: [
        {
          type: "steps",
          items: [
            "Paste and save the live key. Under Mamo Pay actions switch to **Live**, [[Test connection]], then [[Register/Update webhook]].",
            "Set **Mode** to **Live**. A checklist opens ((1)). Each line passes or says what is missing. [[Stay in Test]] closes it and changes nothing.",
            "When every line passes, [[Switch to Live]] ((2)) unlocks. Press it.",
            "Press [[Save]] at the top right. Payments are only live after Save; until then nothing has changed.",
            "Make one real AED 2 payment with your own card. Open that order and refund it. Money can now go both ways.",
          ],
        },
        {
          type: "screenshot",
          file: "31-payments-go-live-checklist.webp",
          width: 1200,
          height: 833.5,
          caption: "Switching Mode to Live opens a checklist. Every line must pass — live key saved and tested, webhook registered, email working — before Switch to Live unlocks. Switching only selects Live in the form: press Save at the top right to make it real.",
          title: "Settings — Payments (Mamo Pay)",
          callouts: [
            { n: 1, label: "The checklist — each line passes or says what is missing" },
            { n: 2, label: "Switch to Live — unlocks when every line passes; then press Save" },
          ],
        },
      ],
    },
  ],
};
