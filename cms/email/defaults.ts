import type { EmailTemplateKey } from "./variables";

/**
 * ==========================================================================
 * House copy for every email the system sends (SPEC §F.8, §H.8)
 * ==========================================================================
 *
 * Two jobs:
 *
 *   · `cms/seed/emailTemplates.ts` creates one `email-templates` document
 *     per key from this list when that key is missing (never overwriting an
 *     edited one), from `onInit` and from the full seed;
 *   · the mailer falls back to the same copy when a key has no document at
 *     all (a fresh database before the seed ran) — a lost confirmation email
 *     is worse than one in the default wording.
 *
 * The bodies are written in a tiny markup and turned into Lexical by
 * `toLexical` below: one string per paragraph, "\n" for a line break,
 * `**bold**`, and `[label]({{links.x}})` for a link. A paragraph that is
 * only a link renders as a button (cms/email/render.ts). Every `{{name}}`
 * used here must be on the template's list in cms/email/variables.ts — the
 * seed goes through the same `beforeValidate` that editors' saves do.
 */

export interface DefaultTemplate {
  key: EmailTemplateKey;
  label: string;
  subject: string;
  preheader?: string;
  paragraphs: string[];
  attachInvoice?: boolean;
  attachTickets?: boolean;
  /** Off by default: optional emails the owner switches on. */
  enabled?: boolean;
}

const SIGN_OFF = "With colour,\nThe {{site.name}} team";
const STAFF_FOOTER = "This alert is sent because you are subscribed to it in Settings → Who gets notified.";

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  // ── customers ──────────────────────────────────────────────────────────
  {
    key: "order_confirmation",
    label: "Order confirmation",
    subject: "You're booked — {{order.reference}}",
    preheader: "Your tickets and receipt are attached.",
    attachInvoice: true,
    attachTickets: true,
    paragraphs: [
      "Hi {{customer.firstName}},",
      "Thank you for booking with {{site.name}} — we can't wait to create with you.",
      "**Booking {{order.reference}}**\n{{order.summary}}\nTotal paid: **{{order.total}}** (includes VAT of {{order.vat}})",
      "Your tickets and your receipt ({{invoice.number}}) are attached to this email. Show the QR code on your phone or on paper when you arrive.",
      "[Download your tickets]({{links.tickets}})",
      "You can see all your bookings at any time: [my bookings]({{links.myBookings}}). Questions? Just reply to this email.",
      SIGN_OFF,
    ],
  },
  {
    key: "payment_failed",
    label: "Payment failed",
    subject: "Your payment didn't go through — {{order.reference}}",
    preheader: "Nothing was charged. Your seats are held for a little longer.",
    paragraphs: [
      "Hi {{customer.firstName}},",
      "We couldn't complete the payment of {{order.total}} for booking {{order.reference}}, so nothing has been charged.",
      "We're still holding your seats until {{hold.until}} — try again before then and they're yours. After that they go back on sale.",
      "[Try again]({{links.retry}})",
      SIGN_OFF,
    ],
  },
  {
    key: "ticket_reminder_24h",
    label: "Reminder 24 hours before",
    subject: "See you tomorrow — {{session.title}}",
    preheader: "{{session.when}} at {{session.venue}}",
    paragraphs: [
      "Hi {{customer.firstName}},",
      "A little reminder that **{{session.title}}** is tomorrow:\n{{session.when}}\n{{session.venue}}",
      "{{session.directions}}",
      "You have {{tickets.count}} ticket(s) on booking {{order.reference}}. Please arrive ten minutes early so we can start together.",
      "[Open your tickets]({{links.tickets}})",
      SIGN_OFF,
    ],
  },
  {
    key: "order_refunded",
    label: "Order refunded",
    subject: "Your refund for {{order.reference}}",
    preheader: "{{refund.amount}} is on its way back to you.",
    attachInvoice: true,
    paragraphs: [
      "Hi {{customer.firstName}},",
      "We've refunded **{{refund.amount}}** for booking {{order.reference}} ({{refund.reason}}). Depending on your bank it can take 5–10 working days to appear.",
      "Your credit note {{creditNote.number}} is attached for your records.",
      "[See my bookings]({{links.myBookings}})",
      SIGN_OFF,
    ],
  },
  {
    key: "order_cancelled",
    label: "Order cancelled",
    subject: "Your booking {{order.reference}} has been cancelled",
    paragraphs: [
      "Hi {{customer.firstName}},",
      "Your booking {{order.reference}} has been cancelled. {{reason}}",
      "Any refund due ({{refund.amount}}) is returned {{refund.where}}; you'll receive a separate confirmation when it is processed.",
      SIGN_OFF,
    ],
  },
  {
    key: "order_moved",
    label: "Booking moved to another session",
    subject: "Your booking {{order.reference}} has moved",
    preheader: "New date: {{session.when}}",
    attachTickets: true,
    paragraphs: [
      "Hi {{customer.firstName}},",
      "Your booking {{order.reference}} has been moved from {{previous.when}} to:\n**{{session.title}}**\n{{session.when}}\n{{session.venue}}",
      "{{note}}",
      "Your new tickets are attached — the old ones no longer work.",
      "[Download your new tickets]({{links.tickets}})",
      SIGN_OFF,
    ],
  },
  {
    key: "session_rescheduled",
    label: "Session rescheduled",
    subject: "New date for {{session.title}}",
    preheader: "Now {{session.when}}",
    paragraphs: [
      "Hi {{customer.firstName}},",
      "**{{session.title}}** has moved from {{previous.when}} to **{{session.when}}** at {{session.venue}}.",
      "{{message}}",
      "Your tickets for booking {{order.reference}} stay valid for the new date. If the new time doesn't work for you, reply to this email and we'll sort it out.",
      "[Open your tickets]({{links.tickets}})",
      SIGN_OFF,
    ],
  },
  {
    key: "session_cancelled",
    label: "Session cancelled",
    subject: "{{session.title}} on {{session.when}} is cancelled",
    paragraphs: [
      "Hi {{customer.firstName}},",
      "We're sorry — **{{session.title}}** on {{session.when}} can no longer go ahead.",
      "{{message}}",
      "Your payment for booking {{order.reference}} ({{refund.amount}}) is being refunded in full {{refund.where}}. You'll receive a confirmation when it has been processed.",
      SIGN_OFF,
    ],
  },
  {
    key: "post_expiry_payment",
    label: "Paid after the hold expired",
    subject: "About your payment for {{order.reference}}",
    paragraphs: [
      "Hi {{customer.firstName}},",
      "Your payment arrived just after the seats we were holding for booking {{order.reference}} were released, and the session has since filled up.",
      "We're returning the full {{refund.amount}} to the card you paid with — no action needed. We're sorry for the disappointment and hope to see you at another session.",
      SIGN_OFF,
    ],
  },
  {
    key: "magic_link",
    label: "“My bookings” link",
    subject: "Your link to your bookings",
    preheader: "It works once, for {{expiresMinutes}} minutes.",
    paragraphs: [
      "Hi {{customer.firstName}},",
      "Here is your private link to see your bookings, tickets and receipts. It works once and expires in {{expiresMinutes}} minutes.",
      "[View my bookings]({{links.myBookings}})",
      "If you didn't ask for this, you can ignore this email — nobody can see your bookings without the link.",
      SIGN_OFF,
    ],
  },
  {
    key: "enquiry_received",
    label: "Enquiry received (auto-reply)",
    subject: "We've received your message",
    enabled: true,
    paragraphs: [
      "Hi {{enquiry.name}},",
      "Thank you for getting in touch about {{enquiry.topic}}. A member of the team will reply within two working days.",
      SIGN_OFF,
    ],
  },
  {
    key: "waitlist_joined",
    label: "Joined the waitlist",
    subject: "You're on the waitlist for {{session.title}}",
    paragraphs: [
      "Hi {{waitlist.name}},",
      "You're on the waitlist for **{{session.title}}** on {{session.when}} ({{waitlist.qty}} seat(s)). You're number {{waitlist.position}} in the queue.",
      "If seats free up we'll email you straight away with a link to book. Seats aren't reserved, so book quickly when you hear from us.",
      SIGN_OFF,
    ],
  },
  {
    key: "waitlist_seat_available",
    label: "Waitlist seat available",
    subject: "A seat has opened up — {{session.title}}",
    preheader: "Book within {{expiresHours}} hours.",
    paragraphs: [
      "Hi {{waitlist.name}},",
      "Good news: seats have opened up for **{{session.title}}** on {{session.when}} at {{session.venue}}.",
      "Your personal link below works for {{expiresHours}} hours. Seats are first come, first served, so we can't hold one for you — book soon to be sure.",
      "[Book now]({{links.book}})",
      SIGN_OFF,
    ],
  },
  // ── staff ──────────────────────────────────────────────────────────────
  {
    key: "staff_login_link",
    label: "Login / set-password link",
    subject: "Your {{site.name}} admin login",
    paragraphs: [
      "Hi {{user.name}},",
      "{{invitedBy}} has sent you a link to sign in to the {{site.name}} admin as {{user.email}}. Use it to choose your password; it works once and expires in {{expiresHours}} hours.",
      "[Set my password]({{links.login}})",
      "If you weren't expecting this, you can ignore it.",
    ],
  },
  {
    key: "admin_new_order",
    label: "New order",
    subject: "New booking {{order.reference}} — {{order.total}}",
    paragraphs: [
      "Hi {{recipient.name}},",
      "**{{customer.name}}** ({{customer.email}}) booked {{order.reference}} — {{order.channel}}:\n{{order.summary}}\nTotal: **{{order.total}}**",
      "[Open the order]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_failed_payment",
    label: "Failed payment",
    subject: "Payment failed — {{order.reference}}",
    paragraphs: [
      "Hi {{recipient.name}},",
      "A payment of {{order.total}} for {{order.reference}} by {{customer.name}} ({{customer.email}}) failed: {{failure.reason}}.",
      "The customer has been told and can try again. No action is needed unless they contact you.",
      "[Open the order]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_refund_requested",
    label: "Refund requested",
    subject: "Refund to approve — {{order.reference}} ({{refund.amount}})",
    paragraphs: [
      "Hi {{recipient.name}},",
      "{{requestedBy}} has asked for a refund of **{{refund.amount}}** on {{order.reference}} ({{refund.reason}}). It is sent to Mamo Pay only after an admin approves it.",
      "[Review the refund]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_refund",
    label: "Refund processed",
    subject: "Refund {{refund.status}} — {{order.reference}}",
    paragraphs: [
      "Hi {{recipient.name}},",
      "The refund of {{refund.amount}} on {{order.reference}} is now **{{refund.status}}**. Credit note: {{creditNote.number}}.",
      "[Open the order]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_dispute",
    label: "Dispute opened",
    subject: "Dispute on {{order.reference}} — {{dispute.status}}",
    paragraphs: [
      "Hi {{recipient.name}},",
      "Mamo Pay reported a dispute (chargeback) on {{order.reference}}, payment {{payment.id}}: **{{dispute.status}}**. Respond from the Mamo dashboard; the order is flagged in the admin.",
      "[Open the order]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_new_enquiry",
    label: "New enquiry",
    subject: "New enquiry from {{enquiry.name}} — {{enquiry.topic}}",
    paragraphs: [
      "Hi {{recipient.name}},",
      "**{{enquiry.name}}** wrote in about {{enquiry.topic}}.\nEmail: {{enquiry.email}}\nPhone: {{enquiry.phone}}",
      "{{enquiry.message}}",
      "[Open in the Inbox]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_waitlist_joined",
    label: "Someone joined a waitlist",
    subject: "Waitlist: {{session.title}} ({{waitlist.qty}})",
    paragraphs: [
      "Hi {{recipient.name}},",
      "{{waitlist.name}} ({{waitlist.email}}) joined the waitlist for **{{session.title}}** on {{session.when}} — {{waitlist.qty}} seat(s), number {{waitlist.position}} in the queue.",
      "[Open the waitlist]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_job_failed",
    label: "Background task failed",
    subject: "Background task failed: {{job.task}}",
    paragraphs: [
      "Hi {{recipient.name}},",
      "The background task **{{job.task}}** failed after {{job.attempts}} attempt(s):\n{{job.error}}",
      "You can retry it from the admin. If it keeps failing, contact Nexeor.",
      "[Open the task]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_low_seats",
    label: "Few seats left",
    subject: "Only {{session.seatsLeft}} seats left — {{session.title}}",
    paragraphs: [
      "Hi {{recipient.name}},",
      "**{{session.title}}** on {{session.when}} has {{session.seatsLeft}} of {{session.seatsTotal}} seats left.",
      "[Open the session]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_settings_changed",
    label: "A setting was changed",
    subject: "Settings changed by {{changedBy}}",
    paragraphs: ["Hi {{recipient.name}},", "{{changedBy}} changed these settings:\n{{changes}}", "[Open the admin]({{links.admin}})", STAFF_FOOTER],
  },
  {
    key: "admin_webhook_unverified_spike",
    label: "Unverified webhook spike",
    subject: "{{count}} unverified payment webhooks in {{windowMinutes}} minutes",
    paragraphs: [
      "Hi {{recipient.name}},",
      "The payment webhook received **{{count}}** calls in the last {{windowMinutes}} minutes that did not carry the right secret. They were ignored. If you did not just rotate the webhook secret, tell Nexeor.",
      "[Open payment events]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "admin_daily_digest",
    label: "Daily digest",
    subject: "{{site.name}} — {{digest.day}}",
    paragraphs: [
      "Good morning {{recipient.name}},",
      "**{{digest.day}}**\nOrders confirmed: {{digest.orders}}\nRevenue: {{digest.revenue}}\nNew enquiries: {{digest.enquiries}}",
      "**Needs attention**\n{{digest.problems}}",
      "[Open the dashboard]({{links.admin}})",
      STAFF_FOOTER,
    ],
  },
  {
    key: "test",
    label: "Test email",
    subject: "Test email from {{site.name}}",
    paragraphs: [
      "This is a test email sent by {{sentBy}} through {{provider}} on {{sentAt}}.",
      "If you can read this, email sending works. Customers will receive confirmations, tickets and invoices from this address.",
    ],
  },
];

export const DEFAULT_TEMPLATE_BY_KEY: Record<string, DefaultTemplate> = Object.fromEntries(DEFAULT_TEMPLATES.map((t) => [t.key, t]));

/* ────────────────────────────────────────────────────────────────────────── */
/* Markup → Lexical                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

const IS_BOLD = 1;

type Node = Record<string, unknown>;

const text = (value: string, format = 0): Node => ({ type: "text", version: 1, text: value, format, detail: 0, mode: "normal", style: "" });

/** `**bold**` and plain runs within one line. */
function inline(line: string): Node[] {
  const out: Node[] = [];
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) out.push(text(part.slice(2, -2), IS_BOLD));
    else out.push(text(part));
  }
  return out;
}

/** One paragraph: lines joined by `linebreak`, `[label](url)` as link nodes. */
function paragraph(source: string): Node {
  const children: Node[] = [];
  source.split("\n").forEach((line, index) => {
    if (index > 0) children.push({ type: "linebreak", version: 1 });
    let rest = line;
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/;
    for (let match = linkRe.exec(rest); match; match = linkRe.exec(rest)) {
      if (match.index > 0) children.push(...inline(rest.slice(0, match.index)));
      children.push({
        type: "link",
        version: 3,
        direction: "ltr",
        format: "",
        indent: 0,
        fields: { url: match[2], newTab: false, linkType: "custom" },
        children: inline(match[1]),
      });
      rest = rest.slice(match.index + match[0].length);
    }
    if (rest) children.push(...inline(rest));
  });
  return { type: "paragraph", version: 1, direction: "ltr", format: "", indent: 0, textFormat: 0, textStyle: "", children };
}

export function toLexical(paragraphs: string[]) {
  return {
    root: {
      type: "root",
      version: 1,
      direction: "ltr" as const,
      format: "" as const,
      indent: 0,
      children: paragraphs.map(paragraph),
    },
  };
}
