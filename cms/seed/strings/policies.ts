import type { PolicySeed } from "../types";

/**
 * The published studio policies, in order, as they stand in the CMS since the
 * legal pack and the event booking policies of 27 November 2026
 * (lib/policies.ts POLICIES holds the same wording as the code fallback).
 * Age tables carry `source` ("diy" reads DIY_AGE_GUIDANCE, "workshop"
 * WORKSHOP_AGE_GUIDANCE — SPEC §F.5) and the
 * rows as printed, so a renderer that reads the rows prints the same table.
 * The withdrawn Cancellation & Rescheduling, Refund & Exchange and Safety &
 * Children policies are not seeded: their addresses redirect to the new ones.
 */

export const POLICIES: PolicySeed[] = [
  {
    title: "Terms & Conditions",
    navLabel: "Terms & Conditions",
    slug: "terms-and-conditions",
    summary: "The agreement between you and Maison Palettia when you use our website or book an experience with us.",
    footerGroup: "legal",
    requiresCheckoutConsent: true,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "About these terms",
        blocks: [
          { blockType: "text", body: "Welcome to Maison Palettia. These Terms & Conditions govern your use of our website (maisonpalettia.com), your bookings and your participation in our creative experiences, whether you book online, through an approved booking platform or at our studio." },
          { blockType: "text", body: "By using our website or making a booking with Maison Palettia, you agree to these Terms & Conditions and to the policies they refer to. Please read them before you pay. If you do not agree with them, please do not book with us." },
          { blockType: "text", body: "In these terms, \"Maison Palettia\", \"we\", \"us\" and \"our\" mean Maison Palettia Events L.L.C., and \"you\" means the person using our website or making a booking with us." },
        ],
      },
      {
        heading: "Who we are",
        blocks: [
          { blockType: "text", body: "Maison Palettia Events L.L.C. is a Limited Liability Company licensed by the Dubai Department of Economy and Tourism under Commercial Licence No. 1626148." },
          {
            blockType: "list",
            items: [
              { text: "Address: Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates" },
              { text: "Email: info@maisonpalettia.com" },
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
          { blockType: "text", body: "Maison Palettia is a creative recreational space offering interactive creative activities, DIY experiences, guided workshops. Our experiences are designed to encourage creativity, enjoyment and personal expression for individuals, families and groups." },
        ],
      },
      {
        heading: "Who can book",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "You must be at least 18 years old, and able to enter into a binding agreement, to make a booking or a purchase of services on our website." },
              { text: "Children and young people are welcome at many of our experiences, but their places must be booked by a parent, legal guardian or another responsible adult, who accepts these terms on their behalf." },
              { text: "If you book for other people, you confirm that you are allowed to do so and that you will share these terms, and any age or safety guidance, with everyone in your booking." },
              { text: "You are responsible for giving us accurate and complete contact and booking details, and for checking the date, time, experience and number of participants in your booking confirmation." },
            ],
          },
        ],
      },
      {
        heading: "Bookings and reservations",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Bookings may be made through our website, approved booking platforms or in person at our studio, subject to availability." },
              { text: "When you go to payment, we hold your places for a short time while you pay and release them if the payment is not completed. An online booking is confirmed only once your payment has been successfully processed and we have sent you a booking confirmation." },
              { text: "Session availability, durations and what is included vary by experience and are shown on each experience's page before you book." },
              { text: "We may adjust session schedules, activities or arrangements where reasonably necessary. If a change materially affects your booking, the section \"If we cancel or change your booking\" in our Cancellation, Rescheduling & Refund Policy applies." },
              { text: "Walk-in Create Anytime (DIY) activities do not need to be booked in advance. They are paid for and enjoyed in the studio, subject to available space and materials." },
            ],
          },
        ],
      },
      {
        heading: "Prices and payment",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "All prices are shown in UAE Dirhams (AED) and include VAT where applicable, unless we clearly state otherwise." },
              { text: "Online payments are processed securely by our payment provider, Mamo Pay, on its own secure payment page. You can pay with Visa or Mastercard credit and debit cards, and with any other payment method shown on the Mamo Pay payment page." },
              { text: "Your card details are entered on Mamo Pay's page and handled by Mamo Pay. Maison Palettia never receives or stores your full card number or security code. We receive only the payment status, a transaction reference and limited details such as the type of card and its last four digits." },
              { text: "Our merchant country is the United Arab Emirates and all online transactions are processed in AED. If your card was issued outside the UAE, your bank may apply its own exchange rate or foreign transaction fees, which are outside our control." },
              { text: "Bookings and walk-in activities paid for in the studio can be paid using the payment methods available there." },
              { text: "Please keep a copy of your booking confirmation, invoice and transaction records for your own reference." },
            ],
          },
        ],
      },
      {
        heading: "Booking confirmation, e-tickets and invoices",
        blocks: [
          { blockType: "text", body: "As soon as your online payment is successful, we email you, at the address you gave at checkout:" },
          {
            blockType: "list",
            items: [
              { text: "A booking confirmation with your booking reference and the details of your experience" },
              { text: "Your e-ticket or e-tickets, each with a unique QR code that we scan when you arrive" },
              { text: "Your invoice for the payment" },
            ],
          },
          { blockType: "text", body: "You can show your e-ticket on your phone or on paper. If the email has not arrived within a few minutes, please check your spam or junk folder, then contact us and we will send it again." },
          { blockType: "text", body: "Walk-in DIY activities are paid for and enjoyed in the studio, and you receive your receipt when you pay." },
        ],
      },
      {
        heading: "Cancellation, rescheduling and refunds",
        blocks: [
          { blockType: "text", body: "Please contact us as early as possible if your plans change. In summary:" },
          {
            blockType: "list",
            items: [
              { text: "With at least 24 hours' notice before your session starts, you may reschedule to another available date or receive a credit note for the full amount you paid." },
              { text: "We do not give cash or card refunds when you cancel a booking yourself. A cancellation made with enough notice is always settled with a credit note." },
              { text: "With less than 24 hours' notice, or if you do not attend, the booking is non-refundable and no credit note is issued." },
              { text: "If we cancel or materially change your booking, we will offer you a new date or a credit note, and a refund to your original payment method if you do not accept either, or where UAE consumer protection law requires it. Where we choose, we may instead refund you in full straight away." },
              { text: "Birthday parties, private events and group bookings arranged with our team follow their own booking policies, described below. Places booked online for a scheduled public session follow the Cancellation, Rescheduling & Refund Policy, however many places are booked. Promotional offers may have their own conditions, which we will tell you before you pay." },
              { text: "Birthday parties, private events and group bookings of 6 or more arranged with our team need a 50% advance payment to confirm, with the balance paid before the event. With at least 7 days' notice (72 hours for group bookings) you receive a credit note for the value of your advance payment; with less notice, the advance payment is non-refundable and no credit note is issued." },
            ],
          },
          { blockType: "text", body: "The full rules are in our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds, which forms part of these terms." },
          { blockType: "text", body: "Our Birthday Party Booking Policy at maisonpalettia.com/policies/birthday-parties applies to every birthday party, whatever the size of the group. Our Private Events Booking Policy at maisonpalettia.com/policies/private-events applies to corporate and team events, adult and family celebrations and other private or exclusive gatherings. Our Group Booking Policy at maisonpalettia.com/policies/group-bookings applies to other groups of 6 or more arranged with our team, such as families, friends and school visits. Each forms part of these terms. Mall and community activations are quoted under a separate written agreement." },
        ],
      },
      {
        heading: "Late arrivals",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please arrive about 10 minutes before your session starts." },
              { text: "Late arrival may reduce the time you have to complete your activity, as sessions finish at their scheduled time." },
              { text: "Where scheduling, capacity or safety requires it, we may not be able to admit customers who arrive significantly late. A booking you cannot take part in because you arrived too late is treated as a no-show." },
              { text: "We will always make reasonable efforts to accommodate late arrivals where we can." },
            ],
          },
        ],
      },
      {
        heading: "Activities and creative experiences",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Our activities are intended for recreational, creative and experiential purposes." },
              { text: "Please follow the instructions given by Maison Palettia staff throughout your experience." },
              { text: "Use materials, tools and equipment responsibly and only for their intended purpose." },
              { text: "Some activities have age requirements, need additional supervision or call for specific safety precautions. These are shown on the experience's page and explained on the day." },
              { text: "Handmade and creative work varies by nature, so individual results will differ. Minor variations in colour, texture, finish or appearance are part of handmade work and are not in themselves a defect." },
            ],
          },
        ],
      },
      {
        heading: "Children and parental responsibility",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Children taking part in an activity must meet the age requirement given for that activity." },
              { text: "Parents, guardians or accompanying adults are responsible for supervising children where supervision is required." },
              { text: "Maison Palettia staff facilitate creative experiences. They are not childcare providers." },
              { text: "Please tell our staff about any safety concern or assistance a child needs before the activity starts." },
              { text: "Children must follow the safety instructions throughout their experience." },
            ],
          },
          { blockType: "text", body: "Age and supervision guidance for each activity is set out in our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines." },
        ],
      },
      {
        heading: "Safety and materials",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Some activities involve materials such as paints, wax, glass, adhesives, embellishments, tools or other creative supplies." },
              { text: "Please follow all safety instructions and use materials responsibly." },
              { text: "Do not misuse, remove or damage our equipment, tools, furniture or materials." },
              { text: "Report any incident, injury, spill or damage to a member of staff immediately." },
              { text: "Maison Palettia takes reasonable measures to provide a safe and properly managed environment." },
            ],
          },
          { blockType: "text", body: "Please read our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines before your visit." },
        ],
      },
      {
        heading: "Your creations and collection",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "You are responsible for your creation during the activity, with reasonable help from our staff." },
              { text: "Some creations need drying, curing, firing, finishing or other processing before they are ready." },
              { text: "We will tell you when and how to collect your creation where collection applies, and we ask you to follow those instructions." },
              { text: "We make reasonable efforts to look after creations awaiting collection." },
            ],
          },
          { blockType: "text", body: "Collection periods, and what happens to creations that are not collected, are set out in Your Finished Projects at maisonpalettia.com/policies/finished-projects." },
        ],
      },
      {
        heading: "Passes, vouchers and credit notes",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Passes, vouchers, promotional codes and credit notes are subject to the terms stated when they are issued, including their validity period and any restrictions." },
              { text: "They can be redeemed only against bookings and services at Maison Palettia, subject to availability, and only within their validity period." },
              { text: "A credit note is linked to the email address of the booking it was issued for, and each credit note can be used once." },
              { text: "They cannot be exchanged for cash unless UAE law requires it." },
            ],
          },
        ],
      },
      {
        heading: "Pricing and description errors",
        blocks: [
          { blockType: "text", body: "We take care to make sure that prices and descriptions on our website are accurate. If we find an obvious error in the price or description of something you have booked, we will contact you as soon as possible and let you choose between continuing at the correct price or cancelling for a full refund to your original payment method. We are not obliged to provide a booking at an obviously incorrect price." },
        ],
      },
      {
        heading: "Events beyond our control",
        blocks: [
          { blockType: "text", body: "We are not responsible for a delay or failure to provide a booking that is caused by events beyond our reasonable control, such as severe weather, power or utility failures, public health measures, instructions from the authorities or the closure of a venue." },
          { blockType: "text", body: "If this happens, we will tell you as soon as we can and treat your booking as cancelled or changed by us, so you will be offered a new date, a credit note or a refund as described in our Cancellation, Rescheduling & Refund Policy." },
        ],
      },
      {
        heading: "Photography and media",
        blocks: [
          { blockType: "text", body: "Maison Palettia may take photographs or videos of its premises, activities or events for promotional purposes." },
          { blockType: "text", body: "Identifiable images of customers are used for promotional or marketing purposes only with appropriate consent and in line with applicable privacy requirements. We always ask a parent or guardian before using an identifiable image of a child." },
          { blockType: "text", body: "Please contact us with any photography or media concern. See also our Photography & Media policy at maisonpalettia.com/policies/photography-and-media and our Privacy Policy at maisonpalettia.com/policies/privacy-policy." },
        ],
      },
      {
        heading: "Using our website",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please use our website only for lawful purposes, such as finding out about our experiences, booking and managing your bookings." },
              { text: "Do not try to gain unauthorised access to the website or its systems, introduce malicious code, or interfere with how the website works." },
              { text: "We try to keep the website available and accurate, but we cannot guarantee that it will always be uninterrupted or free from errors." },
            ],
          },
        ],
      },
      {
        heading: "Website content and intellectual property",
        blocks: [
          { blockType: "text", body: "All website content, including branding, artwork, graphics, text, images, designs and other materials, is owned by or licensed to Maison Palettia, unless stated otherwise." },
          { blockType: "text", body: "Content may not be reproduced, distributed, modified or used commercially without our prior written permission. You may share links to our pages and keep copies of your own tickets and invoices for personal use." },
        ],
      },
      {
        heading: "Limitation of liability",
        blocks: [
          { blockType: "text", body: "Maison Palettia shall take reasonable measures to provide its experiences and services in a safe and professional manner." },
          { blockType: "text", body: "Customers are expected to exercise reasonable care, follow instructions and use materials and equipment responsibly." },
          { blockType: "text", body: "Nothing in these Terms & Conditions shall exclude or limit any liability that cannot legally be excluded or limited under applicable UAE laws." },
        ],
      },
      {
        heading: "Complaints",
        blocks: [
          { blockType: "text", body: "We want every visit to be a good one. If something has not gone as expected, please tell a member of our team during your visit so that we can try to put it right straight away." },
          { blockType: "text", body: "Otherwise, email us at info@maisonpalettia.com or call +971 50 474 7762 with your booking reference or receipt and a short description of the problem. We aim to respond within 2 working days, and to resolve every complaint fairly and as quickly as we can." },
          { blockType: "text", body: "This does not affect your right to contact the relevant UAE consumer protection authority." },
        ],
      },
      {
        heading: "Sanctions",
        blocks: [
          { blockType: "text", body: "Maison Palettia will not trade with, or provide any services to, OFAC-sanctioned countries or persons, or any other person, entity or country subject to sanctions, in accordance with the laws of the United Arab Emirates and the requirements of our payment providers." },
          { blockType: "text", body: "We may refuse or cancel a booking or order, and refund any payment received, where we are required to do so." },
        ],
      },
      {
        heading: "Our other policies",
        blocks: [
          { blockType: "text", body: "These policies form part of these Terms & Conditions:" },
          {
            blockType: "list",
            items: [
              { text: "Cancellation, Rescheduling & Refund Policy: maisonpalettia.com/policies/cancellation-rescheduling-and-refunds" },
              { text: "Privacy Policy: maisonpalettia.com/policies/privacy-policy" },
              { text: "Cookie Policy: maisonpalettia.com/policies/cookie-policy" },
              { text: "Customer Safety & Activity Guidelines: maisonpalettia.com/policies/safety-guidelines" },
              { text: "Service Delivery Policy: maisonpalettia.com/policies/service-delivery" },
              { text: "Birthday Party Booking Policy: maisonpalettia.com/policies/birthday-parties" },
              { text: "Private Events Booking Policy: maisonpalettia.com/policies/private-events" },
              { text: "Group Booking Policy: maisonpalettia.com/policies/group-bookings" },
              { text: "Our house rules for visits, DIY experiences, scheduled workshops, finished projects and photography: maisonpalettia.com/policies" },
            ],
          },
          { blockType: "text", body: "If one of them conflicts with these Terms & Conditions, these Terms & Conditions apply. Nothing in any of them limits your rights under UAE consumer protection law." },
        ],
      },
      {
        heading: "Changes to these terms",
        blocks: [
          { blockType: "text", body: "We may update these Terms & Conditions from time to time. The updated version will be published on this page with its new effective date. The terms that apply to a booking are the ones in effect when you made it." },
        ],
      },
      {
        heading: "Governing law and jurisdiction",
        blocks: [
          { blockType: "text", body: "These Terms & Conditions, and any dispute arising from them or from a booking, are governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai, and are subject to the jurisdiction of the competent courts of Dubai." },
          { blockType: "text", body: "If any part of these terms is found to be invalid or unenforceable, the rest of them remains in effect." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { blockType: "text", body: "For booking or policy enquiries, please contact us:" },
          { blockType: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            blockType: "list",
            items: [
              { text: "Email: info@maisonpalettia.com" },
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
        ],
      },
    ],
    order: 1,
  },
  {
    title: "Cancellation, Rescheduling & Refund Policy",
    navLabel: "Cancellation & Refunds",
    slug: "cancellation-rescheduling-and-refunds",
    summary: "What happens if your plans change, or ours do, and how credit notes and refunds work.",
    footerGroup: "support",
    requiresCheckoutConsent: true,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "About this policy",
        blocks: [
          { blockType: "text", body: "At Maison Palettia, we prepare materials, set up creative spaces and reserve time for every experience. This policy explains what happens if you need to cancel or reschedule a booking, what happens if we have to, and how credit notes and refunds work." },
          { blockType: "text", body: "It forms part of our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions." },
        ],
      },
      {
        heading: "At a glance",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "24 hours' notice or more: reschedule to another available date, or receive a credit note for the full amount you paid." },
              { text: "Less than 24 hours' notice, or a no-show: non-refundable, and no credit note is issued." },
              { text: "Cancellations by customers are always settled with a credit note. We do not give cash or card refunds when you cancel." },
              { text: "If we cancel or materially change your booking: a new date or a credit note, or a refund to your original payment method if neither suits you or where the law requires it." },
            ],
          },
        ],
      },
      {
        heading: "Booking confirmation",
        blocks: [
          { blockType: "text", body: "Your booking is confirmed once your payment has been successfully processed and we have emailed you your booking confirmation, e-tickets and invoice. These are sent straight after your payment goes through." },
          { blockType: "text", body: "Please check the date, time, experience and number of participants as soon as you receive them, and tell us straight away if anything is wrong. These cancellation and rescheduling terms are shown before you pay, and you agree to them at checkout." },
        ],
      },
      {
        heading: "How to cancel or reschedule",
        blocks: [
          { blockType: "text", body: "Please contact us as early as possible, quoting your booking reference:" },
          {
            blockType: "list",
            items: [
              { text: "Email: info@maisonpalettia.com" },
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
            ],
          },
          { blockType: "text", body: "Notice is counted from the time we receive your message to the start time of your session shown on your booking confirmation, in Dubai time." },
        ],
      },
      {
        heading: "Rescheduling",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "With at least 24 hours' notice before your session starts, you may move your booking to another available date or time, at no extra charge." },
              { text: "Rescheduling is subject to availability. If no suitable date is available, we will issue you a credit note for the full amount you paid instead." },
              { text: "With less than 24 hours' notice, a booking cannot be rescheduled." },
            ],
          },
        ],
      },
      {
        heading: "Cancelling your booking",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "With at least 24 hours' notice before your session starts, you will receive a credit note for the full amount you paid for the cancelled booking. Contact us as described above and our team will cancel the booking and issue your credit note." },
              { text: "We do not give cash or card refunds for cancellations made by customers. A cancellation made in good time is always settled with a credit note." },
              { text: "With less than 24 hours' notice, the booking is non-refundable and no credit note is issued." },
            ],
          },
        ],
      },
      {
        heading: "Late arrivals and no-shows",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please arrive about 10 minutes before your session starts." },
              { text: "If you arrive late, your activity time may be shorter, as sessions finish at their scheduled time, and we cannot always repeat the part you missed." },
              { text: "If you do not attend without having told us at least 24 hours before the session, or arrive too late to take part, the booking is treated as a no-show." },
              { text: "No-shows are non-refundable and no credit note is issued." },
            ],
          },
          { blockType: "text", body: "If something serious and unexpected stops you from attending, please contact us. Any exception is at our discretion." },
        ],
      },
      {
        heading: "If we cancel or change your booking",
        blocks: [
          { blockType: "text", body: "Occasionally we may need to cancel or materially change a session, for example because of an instructor's illness, a problem at the venue or events beyond our control. If this happens, we will tell you as soon as we can, using the contact details in your booking, and offer you:" },
          {
            blockType: "list",
            items: [
              { text: "A new date or time, subject to availability; or" },
              { text: "A credit note for the full amount you paid." },
            ],
          },
          { blockType: "text", body: "If you do not wish to accept either option, or where UAE consumer protection law requires it, we will refund the full amount you paid to your original payment method." },
          { blockType: "text", body: "Where we choose, for example when a whole session is cancelled, we may instead refund the full amount you paid to your original payment method straight away, and we will tell you so in our message." },
        ],
      },
      {
        heading: "How credit notes work",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Our team issues your credit note for the full amount you paid for the cancelled booking and sends it to the email address on your booking, with a unique code and its validity period." },
              { text: "For a booking of more than one place, the amount is split into one credit note per place, each with its own code." },
              { text: "You can redeem a credit note against a future booking at Maison Palettia, online by entering its code at checkout or in the studio, within the validity period stated on it." },
              { text: "Each credit note can be used once, and one code can be used per booking. If the new booking costs more, you pay the difference; if it costs less, the unused balance is not carried over." },
              { text: "It is linked to the email address of the original booking." },
              { text: "It is not exchangeable for cash unless UAE law requires it. A credit note not used by the end of its validity period expires." },
            ],
          },
        ],
      },
      {
        heading: "When a refund applies",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Refunds apply where we cancel or materially change a booking and you do not accept a new date or a credit note, or we choose to refund you straight away, where we make a pricing error, or where UAE consumer protection law requires a refund." },
              { text: "Refunds are made in AED to the original payment method, through Mamo Pay for online payments. We cannot refund to a different card or account." },
              { text: "We process approved refunds as soon as possible. Depending on your bank or card issuer, a refund can take 5 to 10 working days to appear on your statement." },
              { text: "We are not responsible for exchange-rate differences or fees charged by your bank." },
              { text: "When a refund is processed, we email you a confirmation, with a document recording the refund for your records. That document is an accounting record of the refund, not store credit." },
            ],
          },
        ],
      },
      {
        heading: "Create Anytime (DIY) walk-ins",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Walk-in DIY activities are paid for in the studio." },
              { text: "Once materials have been prepared or your project has been started, a DIY activity is non-refundable." },
              { text: "Changing to a different project after you have started may be subject to an additional charge." },
            ],
          },
        ],
      },
      {
        heading: "Birthday parties, private events and group bookings",
        blocks: [
          { blockType: "text", body: "Birthday parties, private events and group bookings arranged with our team have their own booking policies, with their own advance payment, notice periods and credit note terms:" },
          {
            blockType: "list",
            items: [
              { text: "Birthday Party Booking Policy, for every birthday party, whatever the size of the group: maisonpalettia.com/policies/birthday-parties" },
              { text: "Private Events Booking Policy, for corporate and team events, adult and family celebrations and other private or exclusive gatherings: maisonpalettia.com/policies/private-events" },
              { text: "Group Booking Policy, for other groups of 6 or more arranged with our team, such as families, friends and school visits: maisonpalettia.com/policies/group-bookings" },
            ],
          },
          { blockType: "text", body: "Places booked online for a scheduled public session always follow this policy, including its 24-hour notice period, however many places are booked. Mall and community activations are quoted under a separate written agreement." },
          { blockType: "text", body: "Other special events and promotional offers may carry their own conditions, such as minimum numbers or different notice periods. We will tell you those conditions before you confirm and pay, and where they differ from this policy, the conditions given for that booking apply." },
        ],
      },
      {
        heading: "Your statutory rights",
        blocks: [
          { blockType: "text", body: "Nothing in this policy limits any right you have under UAE consumer protection law." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { blockType: "text", body: "To cancel or reschedule, or with any question about this policy, please contact us:" },
          { blockType: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            blockType: "list",
            items: [
              { text: "Email: info@maisonpalettia.com" },
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
        ],
      },
    ],
    order: 2,
  },
  {
    title: "Privacy Policy",
    navLabel: "Privacy Policy",
    slug: "privacy-policy",
    summary: "What we collect when you browse or book, why, who sees it, and how to change or delete it.",
    footerGroup: "legal",
    requiresCheckoutConsent: true,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Who we are",
        blocks: [
          { blockType: "text", body: "Maison Palettia respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, share and protect personal information when you visit our website, make a booking or otherwise deal with us." },
          { blockType: "text", body: "Maison Palettia Events L.L.C. (\"Maison Palettia\", \"we\", \"us\"), a Limited Liability Company licensed by the Dubai Department of Economy and Tourism under Commercial Licence No. 1626148, runs creative art and craft experiences in Dubai, United Arab Emirates. We are the controller responsible for the personal data described in this policy." },
          {
            blockType: "list",
            items: [
              { text: "Address: Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates" },
              { text: "Email: info@maisonpalettia.com" },
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
          { blockType: "text", body: "We follow the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021). We also offer the rights described under \"Your rights\" to every customer, wherever they live." },
        ],
      },
      {
        heading: "Information we collect",
        blocks: [
          { blockType: "text", body: "When you book an experience, buy a pass, or use a pass, voucher or credit note:" },
          {
            blockType: "list",
            items: [
              { text: "Your first and last name, email address and mobile number" },
              { text: "What you booked: the experience, the date, how many places, and the names on the tickets" },
              { text: "Your payment status, transaction references, invoices, refunds, credit notes and any pass balance" },
              { text: "Notes you add to your booking, such as allergies, accessibility needs or a celebration we should know about" },
              { text: "Whether you agreed to receive news and offers from us, and which versions of our terms and policies you agreed to at checkout" },
            ],
          },
          { blockType: "text", body: "When you send an enquiry (private events, corporate bookings, general questions) or join a waitlist: your name, email address and phone number, and anything you tell us in your message." },
          { blockType: "text", body: "When you sign in to see your bookings: your email address, and a record of the one-time sign-in link we email you." },
          { blockType: "text", body: "When you pay for a walk-in activity in the studio: the details of your payment and, if you give them to us, your name and contact details." },
          { blockType: "text", body: "When you visit the website: which pages you viewed, which website sent you here, your device type, your browser and your country. Your IP address is used only to create the anonymous daily code described under \"Cookies and website technologies\" and to protect the website from abuse, and is never stored in readable form." },
          { blockType: "text", body: "We collect only the information we reasonably need to run our studio and provide our services." },
          { blockType: "callout", title: "We never see your card", body: "Online payments are handled by Mamo Pay on its own secure payment page. Your full card number and security code never reach our systems." },
        ],
      },
      {
        heading: "How we use your information",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "To deliver your booking. This covers confirming your place, sending your e-tickets and invoice, reminding you before your session, checking you in on the day, and handling rescheduling, cancellations, credit notes and refunds. We need this information to fulfil our agreement with you." },
              { text: "To process payments and to prevent fraud." },
              { text: "To answer you. When you send an enquiry or join a waitlist, we use your details to reply and to offer you a place if one opens up." },
              { text: "To keep proper records. UAE tax law requires us to keep invoices and payment records, and we keep records of the terms you agreed to." },
              { text: "To keep the studio safe. We use the notes you give us about allergies, age or accessibility needs to plan your session, and we protect our customers, staff and premises." },
              { text: "To improve our website, services and customer experience. We use visit statistics to understand which pages help people and which don't." },
              { text: "To send news and offers, only if you said yes. We email you about new experiences and offers only if you ticked the box to receive them. Every such email has an unsubscribe link." },
              { text: "To meet our legal, regulatory, accounting and tax obligations." },
            ],
          },
          { blockType: "text", body: "We do not sell your personal data. We do not use it for automated decisions that have legal or similarly significant effects on you." },
        ],
      },
      {
        heading: "Payment information",
        blocks: [
          { blockType: "text", body: "Online payments are processed by our payment provider, Mamo Pay. You enter your card details on Mamo Pay's secure payment page, and Mamo Pay handles them under its own security and privacy practices." },
          { blockType: "text", body: "We receive the payment status, the amount, a transaction reference and limited card details, such as the type of card, the last four digits and whether it was issued in the UAE, so that we can confirm your booking, issue your invoice and process any refund. We do not store complete card details on our systems." },
        ],
      },
      {
        heading: "Who we share it with",
        blocks: [
          { blockType: "text", body: "We share personal data only with the service providers that help us run the studio, and only as much as each one needs:" },
          {
            blockType: "list",
            items: [
              { text: "Mamo Pay: processes online payments and refunds." },
              { text: "Resend: delivers our emails, including booking confirmations, e-tickets, invoices, reminders and, for those who opted in, news and offers." },
              { text: "Our website hosting and cloud storage providers: run the website and store its database and files securely on our behalf." },
              { text: "Google, Meta and Microsoft: only if you accept the cookie banner (see \"Cookies and website technologies\")." },
              { text: "WhatsApp (Meta): if you choose to contact us on WhatsApp, that conversation is handled under WhatsApp's terms." },
              { text: "Professional advisers, such as accountants, auditors and lawyers, where we need their advice." },
            ],
          },
          { blockType: "text", body: "We may also share information when the law requires it, for example with UAE tax or other authorities, or to protect our customers, staff or studio. Any sharing is limited to what is reasonably necessary and handled in line with applicable data protection requirements." },
        ],
      },
      {
        heading: "Marketing communications",
        blocks: [
          { blockType: "text", body: "We send news, offers and updates about new experiences and events only where you have agreed to receive them and the law allows. You can opt out at any time with the unsubscribe link in any marketing email, or by contacting us." },
          { blockType: "text", body: "We will still send you messages about your bookings, such as confirmations, e-tickets, reminders and changes, because they are part of the service you asked for." },
        ],
      },
      {
        heading: "Cookies and website technologies",
        blocks: [
          { blockType: "text", body: "Our own visitor statistics use no cookies. We count visits on our own server. We never store your IP address or browser details. Instead, they are turned into a one-way code that changes every day, so a visitor cannot be followed from one day to the next. If your browser sends a \"Do Not Track\" or Global Privacy Control signal, we respect it." },
          { blockType: "text", body: "Optional analytics and advertising tools load only if you accept them in the cookie banner. Depending on the tools we use at the time, these may include:" },
          {
            blockType: "list",
            items: [
              { text: "Google Analytics 4 (Google): measures how visitors use the site. Sets cookies such as _ga." },
              { text: "Meta Pixel (Meta Platforms): measures how our Instagram and Facebook adverts perform. Sets cookies such as _fbp." },
              { text: "Microsoft Clarity (Microsoft): records anonymised page interactions such as clicks and scrolling, so we can find confusing parts of the site. Sets cookies such as _clck." },
            ],
          },
          { blockType: "text", body: "These providers handle the data under their own privacy policies. If you decline, none of them load, and they never load on our checkout, payment and booking pages. To change your choice, clear this website's cookies and site data in your browser settings, and the banner will ask you again." },
          { blockType: "text", body: "Your browser also stores:" },
          {
            blockType: "list",
            items: [
              { text: "Your basket and the checkout details you've typed. These are kept only while the tab is open and cleared when you close it." },
              { text: "Your cookie banner choice, so we don't ask you again." },
              { text: "If you sign in to see your bookings, a secure sign-in cookie that keeps you signed in for up to 30 days." },
            ],
          },
          { blockType: "text", body: "Full details are in our Cookie Policy at maisonpalettia.com/policies/cookie-policy." },
        ],
      },
      {
        heading: "Keeping it safe",
        blocks: [
          { blockType: "text", body: "We use reasonable technical and organisational measures to protect your personal information. Access to customer data is limited to the staff who need it, and every account is password-protected. Tickets carry signed QR codes, so they can't be forged. IP addresses are stored only as one-way codes, never in readable form." },
          { blockType: "text", body: "No internet transmission or electronic storage system can be guaranteed to be completely secure, but if we ever learn of a breach that affects you, we'll tell you and the relevant authorities as the law requires." },
        ],
      },
      {
        heading: "How long we keep it",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Bookings, invoices and payment records: at least five years, as UAE tax law requires." },
              { text: "Copies of the emails we send you: cleared after 30 days. We keep a record that each email was sent with your booking." },
              { text: "Detailed website visit records: 90 days. After that we keep only anonymous daily totals." },
              { text: "Enquiries and waitlist requests: for as long as we need them to answer you, arrange your booking or event and deal with any follow-up." },
              { text: "Your marketing preference: until you unsubscribe or ask us to delete it." },
            ],
          },
          { blockType: "text", body: "Otherwise, we keep personal information only for as long as reasonably necessary for the purposes in this policy, including customer support, legal compliance and accounting." },
        ],
      },
      {
        heading: "Your rights",
        blocks: [
          { blockType: "text", body: "Subject to applicable law, you can ask us to:" },
          {
            blockType: "list",
            items: [
              { text: "Give you a copy of the personal data we hold about you, and information about how we use it" },
              { text: "Correct anything that's wrong or incomplete" },
              { text: "Delete your data, unless we're legally required to keep it (for example, invoices)" },
              { text: "Stop or limit how we use it, or object to a particular use" },
              { text: "Send your data to you, or to another organisation, in a common format" },
              { text: "Stop marketing emails. You can also use the unsubscribe link in any of them." },
              { text: "Withdraw consent you've given, such as for cookies or marketing. Withdrawing consent doesn't affect anything we did before." },
            ],
          },
          { blockType: "text", body: "To use any of these rights, contact us using the details below. We may ask you to confirm your identity first, and we'll reply within 30 days." },
        ],
      },
      {
        heading: "Children",
        blocks: [
          { blockType: "text", body: "Many of our experiences welcome children, subject to their age requirements and supervision by a parent or guardian, but bookings must be made by a parent, guardian or other adult. If a child's name appears on a ticket, it is because the booking adult gave it to us. We use it only to run that session." },
          { blockType: "text", body: "We do not knowingly collect personal data directly from anyone under 18, and we handle children's information in line with UAE data protection requirements. Photographs taken at our experiences are covered separately in our Photography & Media policy at maisonpalettia.com/policies/photography-and-media." },
        ],
      },
      {
        heading: "Third-party websites",
        blocks: [
          { blockType: "text", body: "Our website links to services run by others, such as Mamo Pay's payment page, WhatsApp, Instagram and other social networks, and online maps. We are not responsible for their privacy practices, so please read their own policies when you use them." },
        ],
      },
      {
        heading: "Data stored outside the UAE",
        blocks: [
          { blockType: "text", body: "Some of the providers above process or store data outside the United Arab Emirates. When that happens, we rely on the safeguards the PDPL allows, such as the provider's contractual data protection commitments, so that your data stays protected to the standard this policy describes." },
        ],
      },
      {
        heading: "Changes to this policy",
        blocks: [
          { blockType: "text", body: "We may update this policy when our services or the law change. The effective date on this page shows when it last changed. If we make a significant change, we'll show a notice on the website or email customers who have booked with us." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { blockType: "text", body: "For questions about this policy or your data, or to use any of your rights, please contact us:" },
          { blockType: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            blockType: "list",
            items: [
              { text: "Email: info@maisonpalettia.com" },
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
        ],
      },
    ],
    order: 3,
  },
  {
    title: "Cookie Policy",
    navLabel: "Cookie Policy",
    slug: "cookie-policy",
    summary: "The cookies and browser storage our website uses, why we use them, and how you can control them.",
    footerGroup: "legal",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "What cookies are",
        blocks: [
          { blockType: "text", body: "Cookies are small text files that a website saves on your device. Websites can also keep small amounts of information in your browser's own storage, known as local storage and session storage. This policy covers both, and calls them cookies and similar technologies." },
          { blockType: "text", body: "It explains what our website at maisonpalettia.com uses and how you can control it. Please read it together with our Privacy Policy at maisonpalettia.com/policies/privacy-policy." },
          { blockType: "callout", title: "Nothing optional without your say-so", body: "We use only what the website needs to work, and our own visitor statistics use no cookies at all. Optional analytics tools load only after you accept them, and never on our checkout, payment and booking pages." },
        ],
      },
      {
        heading: "Strictly necessary",
        blocks: [
          { blockType: "text", body: "These make the website work. They do not track you, and they are not affected by the cookie banner." },
          {
            blockType: "list",
            items: [
              { text: "Your booking basket and the details you type at checkout (session storage). Kept only while the tab is open and cleared when you close it." },
              { text: "The email address you used to look up a booking on the Check a booking page (session storage), for that tab only." },
              { text: "Your cookie choice (local storage, mp_consent). Remembers whether you accepted or declined optional analytics, so we do not ask on every page. Kept until you clear this website's data in your browser." },
              { text: "Booking sign-in (cookie __Host-mp_session). Set only if you sign in from an emailed link to see your bookings. Keeps you signed in for up to 30 days, is sent only over a secure connection and cannot be read by scripts on the page." },
              { text: "Staff sign-in and preview (cookies such as payload-token). Used only by Maison Palettia staff who sign in to manage the website." },
            ],
          },
        ],
      },
      {
        heading: "Preferences",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Background music (session storage). Remembers, for the current tab only, whether you paused the music and where the track had reached, so it does not restart on every page." },
            ],
          },
        ],
      },
      {
        heading: "Our own visitor statistics (no cookies)",
        blocks: [
          { blockType: "text", body: "We count visits on our own server, without cookies and without storing anything on your device. Your IP address and browser details are turned into a one-way code that changes every day, so a visitor cannot be followed from one day to the next, and they are never stored in readable form." },
          { blockType: "text", body: "We record which page was viewed, the website that sent you, your device type, browser and country. Detailed records are kept for 90 days, after which only anonymous daily totals remain. Visits to our checkout, payment and booking-status pages are never recorded. On a booking page we count only that the page was viewed, never anything you type into it. If your browser sends a \"Do Not Track\" or Global Privacy Control signal, your visit is not counted." },
        ],
      },
      {
        heading: "Optional analytics and marketing",
        blocks: [
          { blockType: "text", body: "These load only if you click Accept in the cookie banner. Depending on the tools we use at the time, they may include:" },
          {
            blockType: "list",
            items: [
              { text: "Google Analytics 4 (Google): measures how visitors use the site. Sets cookies such as _ga and _ga_ followed by an ID, kept for up to 2 years." },
              { text: "Microsoft Clarity (Microsoft): records anonymised page interactions such as clicks and scrolling, so we can find confusing parts of the site. Sets cookies such as _clck (up to 1 year) and _clsk (1 day)." },
              { text: "Meta Pixel (Meta Platforms): measures how our Instagram and Facebook adverts perform. Sets cookies such as _fbp, kept for up to 3 months." },
            ],
          },
          { blockType: "text", body: "These providers handle the data under their own privacy policies. If you click Decline, or do not answer, none of them load. They never load on our checkout, payment and booking pages, even if you accepted." },
        ],
      },
      {
        heading: "Changing your choice",
        blocks: [
          { blockType: "text", body: "When the banner first appears you can choose Accept or Decline. Both are equally easy, and the website works fully either way." },
          { blockType: "text", body: "To change your mind later, clear this website's cookies and site data in your browser settings. The banner will appear again on your next visit and you can choose afresh. Clearing site data also removes any cookies the optional tools had set on our website." },
          { blockType: "text", body: "You can also block or delete cookies through your browser settings, or use private browsing. If you block strictly necessary storage, parts of the website, such as booking and checkout, may not work." },
        ],
      },
      {
        heading: "Third-party services",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "When you pay online, you leave our website for Mamo Pay's secure payment page. Mamo Pay uses its own cookies to process your payment securely and prevent fraud, under its own policies." },
              { text: "Our location maps are drawn from map images supplied by OpenFreeMap, which your browser requests directly, so OpenFreeMap receives your IP address to deliver them." },
              { text: "Links to WhatsApp, Instagram, Facebook, TikTok, Pinterest, LinkedIn and Google Maps take you to those services, which use their own cookies under their own policies." },
            ],
          },
        ],
      },
      {
        heading: "Changes to this policy",
        blocks: [
          { blockType: "text", body: "We will update this policy if we change the cookies or tools our website uses. The effective date on this page shows when it last changed." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { blockType: "text", body: "For any question about cookies or this policy, please contact us:" },
          { blockType: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            blockType: "list",
            items: [
              { text: "Email: info@maisonpalettia.com" },
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
        ],
      },
    ],
    order: 4,
  },
  {
    title: "Customer Safety & Activity Guidelines",
    navLabel: "Safety Guidelines",
    slug: "safety-guidelines",
    summary: "How we keep the studio safe, what we ask of every participant, and the age and supervision each activity needs.",
    footerGroup: "support",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Safety comes first",
        blocks: [
          { blockType: "text", body: "Maison Palettia is committed to providing a welcoming, enjoyable and safe creative environment. Our activities are for recreational and creative enjoyment, and we ask every participant to follow staff instructions and use materials and equipment responsibly." },
          { blockType: "text", body: "Running, unsafe use of equipment, intentional misuse of materials, or behaviour that could endanger another customer or team member is not permitted. Maison Palettia reserves the right to stop participation where a customer does not follow reasonable safety instructions." },
        ],
      },
      {
        heading: "Your responsibilities as a participant",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Follow the instructions given by Maison Palettia staff." },
              { text: "Use tools, equipment and materials only for their intended purpose." },
              { text: "Help keep the environment safe and respectful for everyone." },
              { text: "Avoid interfering with other participants' activities or creations." },
              { text: "Report any accident, injury, spill or damage to a member of staff immediately." },
              { text: "Follow any safety requirements specific to your activity." },
            ],
          },
        ],
      },
      {
        heading: "Materials and equipment",
        blocks: [
          { blockType: "text", body: "Activities may involve paints, adhesives, wax, glass, embellishments, craft tools or other materials. Please follow the instructions and precautions given for each one." },
          {
            blockType: "list",
            items: [
              { text: "Materials must not be eaten, swallowed or misused, or applied to the skin or body, unless an activity specifically intends it and our staff have approved it." },
              { text: "Hot wax, heating equipment, glass and sharp tools are used only in the way our staff show you." },
              { text: "Please do not bring your own craft materials, chemicals, paints or fragrances into the studio without our prior approval." },
              { text: "Finished items such as candles should be allowed to cool and set for the time we recommend before you use them." },
            ],
          },
        ],
      },
      {
        heading: "Children and supervision",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Children must meet the age requirement for each activity. Please check the age guidance before you book or visit." },
              { text: "For activities that need adult supervision, the parent or legal guardian is responsible for supervising the child throughout the session and making sure the child follows our safety instructions." },
              { text: "Our staff are creative experience facilitators, not childcare providers." },
              { text: "Please tell our staff about any safety concern or assistance a child needs before the activity starts." },
            ],
          },
        ],
      },
      {
        heading: "Age guidance",
        blocks: [
          { blockType: "text", body: "Create Anytime activities: children below the age of 10 may take part under adult supervision only." },
          {
            blockType: "ages",
            source: "diy",
            rows: [
              { activity: "Ceramic painting", guidance: "5 years and over. Ages 5–10 under the close supervision of a parent." },
              { activity: "Bedazzling", guidance: "Ages 5–10 for Mini Bedazzling. Age 11 and over for Creative Bedazzling." },
              { activity: "Tote bag painting", guidance: "Ages 5–10 for stencils and easy painting. Age 11 and over for creative designs." },
              { activity: "Glass painting", guidance: "Age 12 and over." },
              { activity: "Mandala painting", guidance: "Age 12 and over." },
            ],
          },
          { blockType: "text", body: "Create Together workshops:" },
          {
            blockType: "ages",
            source: "workshop",
            rows: [
              { activity: "Candle making", guidance: "Age 14 and over." },
              { activity: "Crocheting", guidance: "Age 14 and over." },
            ],
          },
        ],
      },
      {
        heading: "Allergies and sensitivities",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please tell our staff about any allergy, sensitivity or medical condition that could be affected by the materials before you take part." },
              { text: "Avoid handling any material that may cause you an adverse reaction." },
              { text: "Ask our staff for help or an alternative if you are unsure about a material." },
            ],
          },
        ],
      },
      {
        heading: "Personal belongings",
        blocks: [
          { blockType: "text", body: "You are responsible for your personal belongings during your visit. We take reasonable measures to look after our space, but we cannot guarantee the security of personal belongings, so please keep valuables with you and avoid bringing fragile items into the activity area." },
        ],
      },
      {
        heading: "Respect for the space",
        blocks: [
          { blockType: "text", body: "Please treat our premises, equipment, furniture, materials, staff and other participants with care and respect." },
          { blockType: "text", body: "Maison Palettia may step in where behaviour creates a safety concern or materially disrupts an experience, including by stopping an activity or asking a customer to leave, always fairly and in line with applicable law." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { blockType: "text", body: "If you have a safety question before your visit, please contact us:" },
          { blockType: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            blockType: "list",
            items: [
              { text: "Email: info@maisonpalettia.com" },
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
        ],
      },
    ],
    order: 6,
  },
  {
    title: "Service Delivery Policy",
    navLabel: "Service Delivery",
    slug: "service-delivery",
    summary: "How and when you receive your booking confirmation, e-tickets and invoice after you pay online.",
    footerGroup: "support",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "What we deliver",
        blocks: [
          { blockType: "text", body: "Maison Palettia provides creative experiences, such as scheduled workshops and DIY sessions. We do not sell or ship products. An online booking is delivered to you electronically, as described below, and the experience itself takes place at our studio on the date and time you booked." },
        ],
      },
      {
        heading: "When you receive your booking",
        blocks: [
          { blockType: "text", body: "As soon as your online payment is successful, we email you, at the address you gave at checkout:" },
          {
            blockType: "list",
            items: [
              { text: "A booking confirmation with your booking reference and the details of your experience" },
              { text: "Your e-ticket or e-tickets, each with a unique QR code that we scan when you arrive" },
              { text: "Your invoice for the payment" },
            ],
          },
          { blockType: "text", body: "There is no delivery charge. Prices are in UAE Dirhams (AED) and online payments are processed by our payment provider, Mamo Pay." },
        ],
      },
      {
        heading: "If your email has not arrived",
        blocks: [
          { blockType: "text", body: "Please check your spam or junk folder first. If the email is not there within a few minutes of paying, contact us with your name and the email address you used, and we will send it again. You can also look up your booking on our website with your booking reference and email address." },
        ],
      },
      {
        heading: "On the day",
        blocks: [
          { blockType: "text", body: "Show your e-ticket on your phone or on paper when you arrive, and please arrive about 10 minutes before your session starts. Late arrivals are covered by our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions." },
        ],
      },
      {
        heading: "Walk-in DIY activities",
        blocks: [
          { blockType: "text", body: "Walk-in DIY activities are paid for and enjoyed in the studio, and you receive your receipt when you pay." },
        ],
      },
      {
        heading: "Changes and cancellations",
        blocks: [
          { blockType: "text", body: "If we need to change or cancel your booking, we will contact you using the details in your booking. Your options, and what happens if you need to change your plans, are set out in our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { blockType: "text", body: "If anything about the delivery of your booking is not right, please contact us:" },
          { blockType: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            blockType: "list",
            items: [
              { text: "Email: info@maisonpalettia.com" },
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
        ],
      },
    ],
    order: 7,
  },
  {
    title: "Birthday Party Booking Policy",
    navLabel: "Birthday Parties",
    slug: "birthday-parties",
    summary: "Celebrate. Create. Make Memories! How birthday parties at Maison Palettia are booked, paid for and hosted.",
    footerGroup: "support",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Birthday parties at Maison Palettia",
        blocks: [
          { blockType: "text", body: "Make your special day extra creative at Maison Palettia! From colourful activities to memorable experiences, we make birthdays fun for everyone. This policy explains how birthday parties are reserved, paid for and hosted at our studio." },
          { blockType: "text", body: "Which policy applies: this policy applies to every birthday party arranged with our team, whatever the size of the group. Corporate and team events, adult and family celebrations and other private or exclusive gatherings follow our Private Events Booking Policy at maisonpalettia.com/policies/private-events, and other groups of 6 or more follow our Group Booking Policy at maisonpalettia.com/policies/group-bookings. Places booked online for a scheduled public session always follow our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds, however many places are booked. Mall and community activations are quoted under a separate written agreement." },
        ],
      },
      {
        heading: "Reservations",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please make your birthday party booking at least 7 days in advance where possible." },
              { text: "All bookings are subject to availability and to our confirmation." },
              { text: "Your package, activity and number of participants must be agreed with our team before your booking is confirmed." },
              { text: "A reserved area or an exclusive session can be arranged on request, subject to Times Square Center and operational approval. What is reserved for you is confirmed in writing." },
            ],
          },
        ],
      },
      {
        heading: "Booking and payment",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "A 50% advance payment is required to secure your booking." },
              { text: "The advance payment and the remaining balance are paid through a secure payment link sent by our team, processed by our payment provider Mamo Pay, or at the studio. All prices are in UAE Dirhams (AED)." },
              { text: "The remaining balance must be paid at least 48 hours before the party." },
              { text: "Any additional services, participants or special requests are charged separately, as agreed with you." },
            ],
          },
        ],
      },
      {
        heading: "Guest count",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please confirm the final number of children and accompanying adults at least 48 hours before the party." },
              { text: "Additional participants are subject to space and activity availability." },
              { text: "An increase in guest numbers may involve additional charges." },
            ],
          },
        ],
      },
      {
        heading: "Cancelling your party",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "With at least 7 days' notice before the party, you will receive a credit note for the value of your advance payment." },
              { text: "We do not give cash or card refunds when you cancel. A cancellation made in good time is always settled with a credit note." },
              { text: "With less than 7 days' notice, the advance payment is non-refundable and no credit note is issued." },
              { text: "These terms are subject to your statutory rights under UAE law." },
            ],
          },
          { blockType: "text", body: "To cancel or reschedule, please contact us as early as possible, quoting your booking reference, using the details at the end of this policy. Notice is counted from the time we receive your message to the agreed start time, in Dubai time." },
        ],
      },
      {
        heading: "Rescheduling",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "You may reschedule your party once, with at least 72 hours' notice before the party, subject to availability." },
              { text: "With less than 72 hours' notice, a party cannot be rescheduled." },
            ],
          },
        ],
      },
      {
        heading: "If we cancel or cannot deliver your party",
        blocks: [
          { blockType: "text", body: "Occasionally we may need to cancel a confirmed party, or may be unable to deliver it as agreed, for example because of an instructor's illness, a problem at the venue or events beyond our control. If this happens, we will tell you as soon as we can, using the contact details in your booking, and offer you:" },
          {
            blockType: "list",
            items: [
              { text: "An alternative date, subject to availability; or" },
              { text: "A credit note for the full amount you paid." },
            ],
          },
          { blockType: "text", body: "If you do not wish to accept either option, or where UAE consumer protection law requires it, we will refund the full amount you paid to your original payment method." },
          { blockType: "text", body: "Where we choose, we may instead refund the full amount you paid to your original payment method straight away, and we will tell you so in our message." },
        ],
      },
      {
        heading: "How credit notes work",
        blocks: [
          { blockType: "text", body: "A credit note under this policy is for the amount set out above: the value of your advance payment when you cancel in good time, or the full amount you paid when we cancel. Otherwise, credit notes are issued and used as set out in our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds. In short:" },
          {
            blockType: "list",
            items: [
              { text: "Our team issues your credit note and sends it to the email address on your booking, with a unique code and its validity period." },
              { text: "You can redeem it against a future booking at Maison Palettia, online by entering its code at checkout or in the studio, within the validity period stated on it." },
              { text: "Each credit note can be used once, and one code can be used per booking. If the new booking costs more, you pay the difference; if it costs less, the unused balance is not carried over." },
              { text: "It is linked to the email address of the original booking." },
              { text: "It is not exchangeable for cash unless UAE law requires it. A credit note not used by the end of its validity period expires." },
            ],
          },
        ],
      },
      {
        heading: "Arrival and party duration",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please arrive 15 minutes before the scheduled start time." },
              { text: "The party finishes at the agreed time." },
              { text: "Additional time may be arranged, subject to availability and additional charges." },
            ],
          },
        ],
      },
      {
        heading: "Food, cake and decorations",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Food, beverages, cakes and decorations must be agreed with our team in advance." },
              { text: "Outside food is subject to our prior approval." },
              { text: "Please tell us about any special setup or decoration requirements before the party." },
              { text: "Candles on the birthday cake may be lit and put out under the supervision of our team." },
              { text: "No other open flames, sparklers, confetti cannons, glitter bombs, hazardous materials or decorations that could damage the premises are permitted." },
            ],
          },
        ],
      },
      {
        heading: "Children and supervision",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Parents or guardians are responsible for supervising children throughout the party." },
              { text: "Our creative team will guide participants through the selected activities. Our team are creative facilitators, not childcare providers." },
              { text: "Please tell us in advance about any allergies, sensitivities or special requirements." },
              { text: "Each activity has its own age and supervision guidance, set out in our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines." },
            ],
          },
        ],
      },
      {
        heading: "Creative activities and materials",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Standard materials for the selected activities are provided." },
              { text: "Special requests and customised activities may involve additional charges." },
              { text: "Participants are asked to follow the safety instructions of our team." },
            ],
          },
        ],
      },
      {
        heading: "How this policy fits with our other policies",
        blocks: [
          { blockType: "text", body: "This policy forms part of our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions, and our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines apply during every party. Where this policy differs from our Cancellation, Rescheduling & Refund Policy, this policy applies to your party. Places booked online for a scheduled public session always follow our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds, however many places are booked." },
          { blockType: "text", body: "Nothing in this policy limits your statutory rights under UAE law." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { blockType: "text", body: "Let's make your birthday a colourful celebration! For birthday packages and reservations, contact the Maison Palettia team:" },
          { blockType: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            blockType: "list",
            items: [
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Email: info@maisonpalettia.com" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
        ],
      },
    ],
    order: 8,
  },
  {
    title: "Private Events Booking Policy",
    navLabel: "Private Events",
    slug: "private-events",
    summary: "Your Gathering. Your Creativity. Your Experience. How private events at Maison Palettia are booked and hosted.",
    footerGroup: "support",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Private events at Maison Palettia",
        blocks: [
          { blockType: "text", body: "Whether it's a corporate team gathering, a private get-together, a family celebration or a special occasion, Maison Palettia offers a creative space to bring people together. This policy explains how private events are reserved, paid for and hosted at our studio." },
          { blockType: "text", body: "Which policy applies: this policy applies to corporate and team events, adult and family celebrations other than birthday parties, and other private or exclusive gatherings arranged with our team. Every birthday party, whatever the size of the group, follows our Birthday Party Booking Policy at maisonpalettia.com/policies/birthday-parties, and other groups of 6 or more, such as families, friends and school visits, follow our Group Booking Policy at maisonpalettia.com/policies/group-bookings. Places booked online for a scheduled public session always follow our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds, however many places are booked. Mall and community activations are quoted under a separate written agreement." },
        ],
      },
      {
        heading: "Reservations",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please send your private event enquiry at least 7 days in advance where possible." },
              { text: "All bookings are subject to availability and to our confirmation." },
              { text: "Your event requirements, duration, activities and setup must be agreed with our team before your booking is confirmed." },
            ],
          },
        ],
      },
      {
        heading: "Booking and payment",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "A 50% advance payment is required to confirm your booking." },
              { text: "The advance payment and the remaining balance are paid through a secure payment link sent by our team, processed by our payment provider Mamo Pay, or at the studio. All prices are in UAE Dirhams (AED)." },
              { text: "The remaining balance must be paid at least 48 hours before the event." },
              { text: "Additional services, customised activities and special arrangements are quoted separately." },
            ],
          },
        ],
      },
      {
        heading: "Guest count and space",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please confirm the agreed number of participants at least 48 hours before the event." },
              { text: "Additional participants are subject to capacity and availability." },
              { text: "Our studio is inside Times Square Center. A reserved area or an exclusive session can be arranged on request, subject to Times Square Center and operational approval. What is reserved for you is confirmed in writing." },
            ],
          },
        ],
      },
      {
        heading: "Cancelling your event",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "With at least 7 days' notice before the event, you will receive a credit note for the value of your advance payment." },
              { text: "We do not give cash or card refunds when you cancel. A cancellation made in good time is always settled with a credit note." },
              { text: "With less than 7 days' notice, the advance payment is non-refundable and no credit note is issued." },
              { text: "These terms are subject to your statutory rights under UAE law." },
            ],
          },
          { blockType: "text", body: "To cancel or reschedule, please contact us as early as possible, quoting your booking reference, using the details at the end of this policy. Notice is counted from the time we receive your message to the agreed start time, in Dubai time." },
        ],
      },
      {
        heading: "Rescheduling",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "You may reschedule your event once, with at least 72 hours' notice before the event, subject to availability." },
              { text: "With less than 72 hours' notice, an event cannot be rescheduled." },
            ],
          },
        ],
      },
      {
        heading: "If we cancel or cannot deliver your event",
        blocks: [
          { blockType: "text", body: "Occasionally we may need to cancel a confirmed event, or may be unable to deliver it as agreed, for example because of an instructor's illness, a problem at the venue or events beyond our control. If this happens, we will tell you as soon as we can, using the contact details in your booking, and offer you:" },
          {
            blockType: "list",
            items: [
              { text: "An alternative date, subject to availability; or" },
              { text: "A credit note for the full amount you paid." },
            ],
          },
          { blockType: "text", body: "If you do not wish to accept either option, or where UAE consumer protection law requires it, we will refund the full amount you paid to your original payment method." },
          { blockType: "text", body: "Where we choose, we may instead refund the full amount you paid to your original payment method straight away, and we will tell you so in our message." },
        ],
      },
      {
        heading: "How credit notes work",
        blocks: [
          { blockType: "text", body: "A credit note under this policy is for the amount set out above: the value of your advance payment when you cancel in good time, or the full amount you paid when we cancel. Otherwise, credit notes are issued and used as set out in our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds. In short:" },
          {
            blockType: "list",
            items: [
              { text: "Our team issues your credit note and sends it to the email address on your booking, with a unique code and its validity period." },
              { text: "You can redeem it against a future booking at Maison Palettia, online by entering its code at checkout or in the studio, within the validity period stated on it." },
              { text: "Each credit note can be used once, and one code can be used per booking. If the new booking costs more, you pay the difference; if it costs less, the unused balance is not carried over." },
              { text: "It is linked to the email address of the original booking." },
              { text: "It is not exchangeable for cash unless UAE law requires it. A credit note not used by the end of its validity period expires." },
            ],
          },
        ],
      },
      {
        heading: "Event timing",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please arrive 15 minutes before the scheduled start time." },
              { text: "Events must finish within the agreed booking duration." },
              { text: "Extensions may be arranged, subject to availability and additional charges." },
            ],
          },
        ],
      },
      {
        heading: "Food, beverages and decorations",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Catering, beverages, decorations and any external suppliers must be approved by our team in advance." },
              { text: "Please tell us about any special setup requirements before the event." },
              { text: "Additional setup, cleaning or external supplier charges may apply, where agreed with you." },
              { text: "Candles on a celebration cake may be lit and put out under the supervision of our team." },
              { text: "No other open flames, sparklers, confetti cannons, glitter bombs, hazardous materials or decorations that could damage the premises are permitted." },
            ],
          },
        ],
      },
      {
        heading: "Activities and materials",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Creative activities are selected and agreed with you before the event." },
              { text: "Standard materials for the selected activities are provided." },
              { text: "Special materials, customised experiences or additional activities may involve extra charges." },
            ],
          },
        ],
      },
      {
        heading: "Conduct and responsibility",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "All guests are expected to respect the premises, equipment and materials, and to follow the instructions of our team." },
              { text: "The booking organiser is responsible for sharing the agreed arrangements with all participants." },
              { text: "Any damage caused through negligence or misuse may be subject to reasonable recovery costs, in line with applicable law." },
            ],
          },
        ],
      },
      {
        heading: "Special arrangements",
        blocks: [
          { blockType: "text", body: "Corporate branding, customised creative sessions, team-building activities and special event setups can be arranged on request." },
        ],
      },
      {
        heading: "How this policy fits with our other policies",
        blocks: [
          { blockType: "text", body: "This policy forms part of our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions, and our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines apply during every event. Where this policy differs from our Cancellation, Rescheduling & Refund Policy, this policy applies to your event. Places booked online for a scheduled public session always follow our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds, however many places are booked." },
          { blockType: "text", body: "Nothing in this policy limits your statutory rights under UAE law." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { blockType: "text", body: "Let's create an experience worth remembering! For private event enquiries, contact the Maison Palettia team:" },
          { blockType: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            blockType: "list",
            items: [
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Email: info@maisonpalettia.com" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
        ],
      },
    ],
    order: 9,
  },
  {
    title: "General Customer Policy",
    navLabel: "General customer policy",
    slug: "general-customer-policy",
    summary: "What applies to every visit, whatever you have come to make.",
    footerGroup: "none",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "A space for everyone",
        blocks: [
          { blockType: "text", body: "Maison Palettia is a creative space designed for everyone to explore, create and enjoy." },
          { blockType: "text", body: "By participating in a DIY activity or booking a scheduled session, customers agree to follow Maison Palettia's policies and the instructions provided by our team." },
          { blockType: "text", body: "Customers are expected to treat the studio, equipment, materials, staff and other guests with care and respect." },
          { blockType: "text", body: "These house rules apply together with our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions and our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines." },
        ],
      },
      {
        heading: "Following the instructions",
        blocks: [
          { blockType: "text", body: "Activities must be performed according to the instructions provided by Maison Palettia." },
          { blockType: "text", body: "Some materials, tools, paints, glues, candles, glass, ceramics and other craft supplies may require additional care or supervision." },
          { blockType: "text", body: "Maison Palettia reserves the right to stop an activity if a customer's conduct creates a safety risk or causes significant disruption to others." },
          { blockType: "text", body: "Parents and guardians are responsible for supervising children where required." },
        ],
      },
      {
        heading: "Your belongings",
        blocks: [
          { blockType: "text", body: "Customers are responsible for their personal belongings while visiting Maison Palettia. We recommend that valuable or fragile personal items are not brought into the activity area." },
          { blockType: "text", body: "Customers may not bring outside craft materials, chemicals, paints, fragrances or other supplies into the studio without prior approval." },
        ],
      },
      {
        heading: "Food and drinks",
        blocks: [
          { blockType: "text", body: "Food and beverages are permitted only in designated areas. Drinks should be kept away from craft materials, equipment and customer projects." },
        ],
      },
      {
        heading: "Conduct",
        blocks: [
          { blockType: "text", body: "Maison Palettia is a welcoming creative environment. We expect customers to treat our team and fellow creators with courtesy and respect. Harassment, abusive language, threatening behaviour, intentional damage or disruptive conduct will not be tolerated." },
          { blockType: "text", body: "Maison Palettia may refuse service or ask a customer to leave where necessary to protect the safety and wellbeing of customers, staff or property." },
        ],
      },
      {
        heading: "If something has not gone as expected",
        blocks: [
          { blockType: "text", body: "We want every visit to Maison Palettia to be a positive experience. If something hasn't gone as expected, please speak with our team as soon as possible so that we have an opportunity to assist." },
          { blockType: "text", body: "Complaints relating to a session or completed project should ideally be raised at the time of the visit or within a reasonable period thereafter." },
          { blockType: "text", body: "You can also email us at info@maisonpalettia.com or call +971 50 474 7762. We aim to respond within 2 working days. Our complaints process is set out in our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions." },
        ],
      },
      {
        heading: "Changes to these policies",
        blocks: [
          { blockType: "text", body: "Maison Palettia may update its policies from time to time. The applicable policy will be the policy in effect at the time of the booking." },
        ],
      },
    ],
    order: 10,
  },
  {
    title: "Group Booking Policy",
    navLabel: "Group Bookings",
    slug: "group-bookings",
    summary: "Create Together. Enjoy Together. How group bookings of 6 or more at Maison Palettia are arranged.",
    footerGroup: "support",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Group bookings at Maison Palettia",
        blocks: [
          { blockType: "text", body: "At Maison Palettia, we love bringing people together through creativity! Whether you are planning a family gathering, a get-together with friends or a school visit, we are happy to make your experience special." },
          { blockType: "text", body: "Which policy applies: this policy applies to groups of 6 or more participants arranged with our team, such as families, friends and school visits. Every birthday party, whatever the size of the group, follows our Birthday Party Booking Policy at maisonpalettia.com/policies/birthday-parties, and corporate and team events, adult and family celebrations and other private or exclusive gatherings follow our Private Events Booking Policy at maisonpalettia.com/policies/private-events. Places booked online for a scheduled public session always follow our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds, however many places are booked. Mall and community activations are quoted under a separate written agreement." },
        ],
      },
      {
        heading: "Advance reservations",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "We recommend making your group booking at least 48 hours in advance." },
              { text: "Bookings are subject to availability and to our confirmation." },
              { text: "When you enquire, please share your preferred activity, date, time and number of participants." },
              { text: "If you would like a private or exclusive experience for your group, our team will be happy to discuss it with you. Private and exclusive gatherings follow our Private Events Booking Policy at maisonpalettia.com/policies/private-events." },
            ],
          },
        ],
      },
      {
        heading: "Group size",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Group bookings are available for groups of 6 or more participants." },
              { text: "Please confirm the final number of participants at least 24 hours before the scheduled session." },
              { text: "Any additional participants are subject to availability." },
            ],
          },
        ],
      },
      {
        heading: "Booking and payment",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "A 50% advance payment is required to confirm a group booking." },
              { text: "The advance payment and the remaining balance are paid through a secure payment link sent by our team, processed by our payment provider Mamo Pay, or at the studio. All prices are in UAE Dirhams (AED)." },
              { text: "The remaining balance must be paid before the activity begins." },
              { text: "All applicable prices and charges are communicated clearly at the time of booking." },
            ],
          },
        ],
      },
      {
        heading: "Cancelling your booking",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "With at least 72 hours' notice before the booking, you will receive a credit note for the value of your advance payment." },
              { text: "We do not give cash or card refunds when you cancel. A cancellation made in good time is always settled with a credit note." },
              { text: "With less than 72 hours' notice, the advance payment is non-refundable and no credit note is issued." },
              { text: "These terms are subject to your statutory rights under UAE law." },
            ],
          },
          { blockType: "text", body: "To cancel or reschedule, please contact us as early as possible, quoting your booking reference, using the details at the end of this policy. Notice is counted from the time we receive your message to the agreed start time, in Dubai time." },
        ],
      },
      {
        heading: "Rescheduling",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "You may reschedule your group booking once, with at least 48 hours' notice before the booking, subject to availability." },
              { text: "With less than 48 hours' notice, a group booking cannot be rescheduled." },
            ],
          },
        ],
      },
      {
        heading: "If we cancel or cannot deliver your booking",
        blocks: [
          { blockType: "text", body: "Occasionally we may need to cancel a confirmed booking, or may be unable to deliver it as agreed, for example because of an instructor's illness, a problem at the venue or events beyond our control. If this happens, we will tell you as soon as we can, using the contact details in your booking, and offer you:" },
          {
            blockType: "list",
            items: [
              { text: "An alternative date, subject to availability; or" },
              { text: "A credit note for the full amount you paid." },
            ],
          },
          { blockType: "text", body: "If you do not wish to accept either option, or where UAE consumer protection law requires it, we will refund the full amount you paid to your original payment method." },
          { blockType: "text", body: "Where we choose, we may instead refund the full amount you paid to your original payment method straight away, and we will tell you so in our message." },
        ],
      },
      {
        heading: "How credit notes work",
        blocks: [
          { blockType: "text", body: "A credit note under this policy is for the amount set out above: the value of your advance payment when you cancel in good time, or the full amount you paid when we cancel. Otherwise, credit notes are issued and used as set out in our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds. In short:" },
          {
            blockType: "list",
            items: [
              { text: "Our team issues your credit note and sends it to the email address on your booking, with a unique code and its validity period." },
              { text: "You can redeem it against a future booking at Maison Palettia, online by entering its code at checkout or in the studio, within the validity period stated on it." },
              { text: "Each credit note can be used once, and one code can be used per booking. If the new booking costs more, you pay the difference; if it costs less, the unused balance is not carried over." },
              { text: "It is linked to the email address of the original booking." },
              { text: "It is not exchangeable for cash unless UAE law requires it. A credit note not used by the end of its validity period expires." },
            ],
          },
        ],
      },
      {
        heading: "Arrival and session timing",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Please arrive 10–15 minutes before your scheduled session." },
              { text: "Late arrivals may reduce the available activity time." },
              { text: "Sessions finish at the scheduled time, unless an extension has been agreed and is available." },
            ],
          },
        ],
      },
      {
        heading: "Children and supervision",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "Children must be supervised by a parent, guardian or responsible accompanying adult, as required for the activity." },
              { text: "Please tell our team about any relevant allergies, sensitivities or special requirements before the session." },
              { text: "Each activity has its own age and supervision guidance, set out in our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines." },
            ],
          },
        ],
      },
      {
        heading: "Materials and safety",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "All standard materials required for the selected activity are provided." },
              { text: "Participants are asked to follow the instructions of our creative team and to handle all materials responsibly." },
              { text: "Any special materials or customisation requests should be discussed and agreed in advance." },
            ],
          },
        ],
      },
      {
        heading: "Special requests",
        blocks: [
          { blockType: "text", body: "School visits, celebrations and other group experiences can be tailored on request, subject to availability and applicable charges." },
        ],
      },
      {
        heading: "How this policy fits with our other policies",
        blocks: [
          { blockType: "text", body: "This policy forms part of our Terms & Conditions at maisonpalettia.com/policies/terms-and-conditions, and our Customer Safety & Activity Guidelines at maisonpalettia.com/policies/safety-guidelines apply during every group booking. Where this policy differs from our Cancellation, Rescheduling & Refund Policy, this policy applies to your group booking. Places booked online for a scheduled public session always follow our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds, however many places are booked." },
          { blockType: "text", body: "Nothing in this policy limits your statutory rights under UAE law." },
        ],
      },
      {
        heading: "Contact us",
        blocks: [
          { blockType: "text", body: "Let's make something memorable together! For group bookings and enquiries, please contact the Maison Palettia team:" },
          { blockType: "text", body: "Maison Palettia Events L.L.C., Unit F-26, First Floor (next to Picnic Square), Times Square Center, Sheikh Zayed Road, Al Quoz Industrial Area 1, Dubai, United Arab Emirates." },
          {
            blockType: "list",
            items: [
              { text: "Call: +971 50 474 7762" },
              { text: "WhatsApp: +971 55 496 6116" },
              { text: "Email: info@maisonpalettia.com" },
              { text: "Website: maisonpalettia.com" },
            ],
          },
        ],
      },
    ],
    order: 10,
  },
  {
    title: "DIY Experience Policy",
    navLabel: "DIY experience policy",
    slug: "diy-experience-policy",
    summary: "For Create Anytime activities, the ones with nothing to book.",
    footerGroup: "none",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "What a DIY session is",
        blocks: [
          { blockType: "text", body: "Create Anytime activities are DIY sessions: you choose a project when you arrive and make it at your own pace, with our team on hand. Children below the age of 10 may take part under adult supervision only." },
        ],
      },
      {
        heading: "Age guidance by activity",
        blocks: [
          { blockType: "text", body: "Age requirements and supervision requirements vary by activity. Please check the guidance for the activity you have in mind before you come." },
          {
            blockType: "ages",
            source: "diy",
            rows: [
              { activity: "Ceramic painting", guidance: "5 years and over. Ages 5–10 under the close supervision of a parent." },
              { activity: "Bedazzling", guidance: "Ages 5–10 for Mini Bedazzling. Age 11 and over for Creative Bedazzling." },
              { activity: "Tote bag painting", guidance: "Ages 5–10 for stencils and easy painting. Age 11 and over for creative designs." },
              { activity: "Glass painting", guidance: "Age 12 and over." },
              { activity: "Mandala painting", guidance: "Age 12 and over." },
            ],
          },
        ],
      },
      {
        heading: "How a DIY session runs",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "DIY sessions are subject to available space, materials and studio capacity." },
              { text: "Customers select their project from the options available at the time of their visit." },
              { text: "The price of a DIY session states what is included." },
              { text: "Standard materials required for the selected project are included unless specifically stated otherwise." },
              { text: "Additional materials, upgrades or premium items may be available for an additional charge." },
              { text: "Customers are responsible for following the instructions provided by the Maison Palettia team." },
              { text: "Once a project has been started, changing to a different project may be subject to an additional charge." },
              { text: "Completed projects should be collected within the timeframe communicated by the team, particularly where drying, curing or firing is required." },
            ],
          },
          { blockType: "text", body: "DIY activities are paid for in the studio and are non-refundable once materials have been prepared or your project has been started. See our Cancellation, Rescheduling & Refund Policy at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds." },
        ],
      },
      {
        heading: "Ceramics and glass",
        blocks: [
          { blockType: "callout", title: "Important for ceramics and glass", body: "Maison Palettia takes reasonable care when handling customer projects. However, handmade and painted items may occasionally experience minor imperfections, colour variations, breakage, cracking or other changes during drying, curing or firing. We will do our best to handle every project with care but cannot guarantee that every finished piece will be completely free from such imperfections." },
        ],
      },
      {
        heading: "Creative results may vary",
        blocks: [
          { blockType: "callout", title: "Every creation is uniquely yours", body: "Because Maison Palettia is a hands-on creative experience, finished projects may vary from examples shown in-store or online. Differences in colour, placement, technique, materials and individual skill are part of the creative process." },
        ],
      },
    ],
    order: 11,
  },
  {
    title: "Scheduled Workshop Policy",
    navLabel: "Scheduled workshop policy",
    slug: "scheduled-workshop-policy",
    summary: "For Create Together sessions, the guided ones you book onto a date.",
    footerGroup: "none",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "The workshops",
        blocks: [
          { blockType: "text", body: "Create Together sessions are guided workshops that run to a set date and time. Additional workshops will be introduced later." },
          {
            blockType: "ages",
            source: "workshop",
            rows: [
              { activity: "Candle making", guidance: "Age 14 and over." },
              { activity: "Crocheting", guidance: "Age 14 and over." },
            ],
          },
        ],
      },
      {
        heading: "Making a booking",
        blocks: [
          { blockType: "text", body: "Bookings may be made in-store, or through the Maison Palettia online booking system." },
          { blockType: "text", body: "A booking is considered confirmed once the required payment or deposit has been received and the customer has received a booking confirmation." },
          { blockType: "text", body: "Your confirmation will set out:" },
          {
            blockType: "list",
            items: [
              { text: "The activity" },
              { text: "The date" },
              { text: "The start time" },
              { text: "The duration" },
              { text: "The number of participants" },
              { text: "The price" },
              { text: "Any special requirements" },
              { text: "Cancellation and rescheduling information" },
            ],
          },
          { blockType: "text", body: "If your plans change, our Cancellation, Rescheduling & Refund Policy applies: with at least 24 hours' notice before your session you may reschedule or receive a credit note for the amount you paid. With less notice, or if you do not attend, the booking is non-refundable. Full details are at maisonpalettia.com/policies/cancellation-rescheduling-and-refunds." },
        ],
      },
      {
        heading: "Arriving",
        blocks: [
          { blockType: "text", body: "Customers are requested to arrive 10 minutes before their scheduled session. Late arrival may reduce the customer's activity time where the session must finish at the scheduled time. For safety and operational reasons, significantly late customers may not be able to participate." },
          { blockType: "text", body: "A booking you cannot take part in because you arrived too late is treated as a no-show and is non-refundable." },
        ],
      },
      {
        heading: "Candle making",
        blocks: [
          { blockType: "text", body: "Candle-making involves hot wax, fragrance oils, containers and other materials that require care. Participants must follow all safety instructions provided by Maison Palettia staff." },
          {
            blockType: "list",
            items: [
              { text: "Children should participate only where the specific session is designed for their age group." },
              { text: "Hot wax and heating equipment should be handled only by participants and staff according to the studio's safety instructions." },
              { text: "Customers should not bring their own fragrance oils, wax, containers or other materials unless specifically approved." },
              { text: "Finished candles should be allowed to cool and set for the recommended period before collection or use." },
              { text: "Customers receive appropriate candle-burning and safety instructions with their finished candle." },
            ],
          },
        ],
      },
      {
        heading: "Crochet",
        blocks: [
          {
            blockType: "list",
            items: [
              { text: "The materials included are stated in the workshop description." },
              { text: "Customers may keep the project and materials specified in the workshop description." },
              { text: "If customers miss part of the workshop because of late arrival, Maison Palettia cannot guarantee that the instructor can repeat the missed portion individually." },
              { text: "Workshop outcomes may vary according to individual skill level." },
            ],
          },
          { blockType: "callout", title: "Designed to teach and inspire", body: "Our workshops are designed to teach and inspire, not to produce identical results. Every creation is unique, and that's part of the Maison Palettia experience." },
        ],
      },
    ],
    order: 12,
  },
  {
    title: "Your Finished Projects",
    navLabel: "Finished projects",
    slug: "finished-projects",
    summary: "Collecting what you have made, and what happens if something breaks.",
    footerGroup: "none",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Collecting your project",
        blocks: [
          { blockType: "text", body: "Customers will be notified when their project is ready for collection. Finished projects should be collected within 30 days of notification. Maison Palettia may contact customers regarding projects that remain uncollected. Projects left uncollected beyond the applicable collection period may be subject to disposal or other handling in accordance with Maison Palettia's policy." },
          { blockType: "text", body: "Firing and finishing times are estimates and may vary depending on studio workload and the nature of the project." },
        ],
      },
      {
        heading: "Damage and breakage",
        blocks: [
          { blockType: "text", body: "Maison Palettia takes reasonable care of customer projects and equipment. However, craft materials and handmade items can be fragile. Maison Palettia is not responsible for damage resulting from improper handling by the customer or from the inherent nature of the materials." },
          { blockType: "text", body: "Where something has gone wrong with a project in our care, remedies are handled on a case-by-case basis. Please speak with our team." },
        ],
      },
    ],
    order: 13,
  },
  {
    title: "Photography & Media",
    navLabel: "Photography & media",
    slug: "photography-and-media",
    summary: "When we photograph what you have made, and when we ask first.",
    footerGroup: "none",
    requiresCheckoutConsent: false,
    showInLegalRow: false,
    effectiveDate: "2026-11-27T08:00:00.000Z",
    sections: [
      {
        heading: "Photography in the studio",
        blocks: [
          { blockType: "text", body: "Maison Palettia may photograph or display completed projects for promotional, educational or social media purposes. Where identifiable customers, particularly children, are included in promotional photography, Maison Palettia will obtain the appropriate consent." },
          { blockType: "text", body: "If you have any concern about photography, please tell our team or contact us at info@maisonpalettia.com. How we handle photographs and other personal data is explained in our Privacy Policy at maisonpalettia.com/policies/privacy-policy." },
        ],
      },
    ],
    order: 14,
  },
];
