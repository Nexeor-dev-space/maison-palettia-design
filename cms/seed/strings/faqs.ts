import type { FaqSeed } from "../types";

/**
 * The ten questions, from lib/constants.ts FAQ_GROUPS (group 0 → "coming",
 * 1 → "booking", 2 → "groups"), in the page's order. "Am I Charged When I
 * Book?" prints Booking settings → booking terms, as it called
 * `bookingTerms()` before (SPEC §F.5). `showOnHomepage` marks the four
 * HOMEPAGE_FAQ items. `answer` is plain text; the seed wraps each answer in
 * one Lexical paragraph.
 */

export const FAQS: FaqSeed[] = [
  {
    question: "Where Do the Events Happen?", // lib/constants.ts:910
    group: "coming", // lib/constants.ts:1118
    answerSource: "text",
    answer: "Find Maison Palettia in the places you already love to visit — and come make something while you’re there. Every event on the programme names its mall and the area it is in, so you know where you are going before you book.", // lib/constants.ts:917
    showOnHomepage: true,
    order: 1,
  },
  {
    question: "How Long Does an Event Run?", // lib/constants.ts:920
    group: "coming", // lib/constants.ts:1118
    answerSource: "text",
    answer: "Each one runs to a fixed start and finish time rather than a drop-in window. Both times, and the length of the event, are on its page.", // lib/constants.ts:922
    showOnHomepage: true,
    order: 2,
  },
  {
    question: "Do I Need to Bring Anything?", // lib/constants.ts:925
    group: "coming", // lib/constants.ts:1118
    answerSource: "text",
    answer: "Everything you need is waiting for you. Just bring yourself, pick a project and start creating.", // lib/constants.ts:932
    showOnHomepage: true,
    order: 3,
  },
  {
    question: "Do I Need Any Experience?", // lib/constants.ts:1078
    group: "coming", // lib/constants.ts:1118
    answerSource: "text",
    answer: "No experience needed, just pick a project and make it yours.", // lib/constants.ts:1079
    showOnHomepage: false,
    order: 4,
  },
  {
    question: "What Is the Difference Between Create Anytime and Create Together?", // lib/constants.ts:1087
    group: "booking", // lib/constants.ts:1101
    answerSource: "text",
    answer: "Drop in and create, or book a seat for a scheduled session. Create Anytime activities are DIY: come in and make something at your own pace, any time we are set up, with nothing to book. Create Together sessions are guided, each runs on a set date, and those are the ones you book online.", // lib/constants.ts:1089
    showOnHomepage: false,
    order: 5,
  },
  {
    question: "How Do I Book a Place?", // lib/constants.ts:935
    group: "booking", // lib/constants.ts:1101
    answerSource: "text",
    answer: "Choose a date from the programme, open it, and keep your place from that page. Each event shows how many places are left before you start.", // lib/constants.ts:937
    showOnHomepage: true,
    order: 6,
  },
  {
    question: "Am I Charged When I Book?", // lib/constants.ts:1093
    group: "booking", // lib/constants.ts:1101
    answerSource: "bookingTerms", // lib/constants.ts:1104
    showOnHomepage: false,
    order: 7,
  },
  {
    question: "Do I Need an Account?", // lib/constants.ts:1107
    group: "booking", // lib/constants.ts:1104
    answerSource: "text",
    answer: "No. You check out as a guest. There is no account to create.", // lib/constants.ts:1108
    showOnHomepage: false,
    order: 8,
  },
  {
    question: "Can You Run Something for My Group?", // lib/constants.ts:1116
    group: "groups", // lib/constants.ts:1118
    answerSource: "text",
    answer: "Yes. Maison Palettia creates hands-on experiences for all kinds of groups. Tell us when, who’s coming and what you’d like to make. We’ll help turn the idea into an experience made for your group.", // lib/constants.ts:1118
    showOnHomepage: false,
    order: 9,
  },
  {
    question: "What Is a Pass?", // lib/constants.ts:1121
    group: "groups", // lib/constants.ts:1118
    answerSource: "text",
    answer: "A pass holds your sessions in advance, so when a date comes round the only decision left is what to make. Choose one, add it to your booking, and check out as a guest.", // lib/constants.ts:1123
    showOnHomepage: false,
    order: 10,
  },
];
