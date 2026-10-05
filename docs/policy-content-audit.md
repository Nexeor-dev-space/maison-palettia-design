# Policy integration — content audit

**Source** `client-feedback/Maison Palettia - Policy.docx`, supplied 2026-10-05.
**Scope** every route under `app/`, the shared content in `lib/constants.ts`,
`lib/experiences.ts`, `lib/workshops.ts`, `lib/privateEvents.ts`, and the
rendered `<main>` of all 20 public pages.
**Method** rendered-text scan, not source grep — a claim that only exists in a
component's props is still a claim a customer reads.

This file is the internal record. The content decisions it describes are
enforced in `lib/policies.ts`, which carries the reasoning inline.

---

## 1. Conflicts that need the client to decide

### 1.1 — "Everything is provided" vs. materials that may cost extra
**Severity: high. Nothing changed; both wordings are still live.**

The site makes an unqualified promise in five places:

| Where | Wording |
|---|---|
| `lib/constants.ts:921` | "Everything is provided. Bring nothing but yourself." |
| `lib/constants.ts:977` | "Everything is provided, and no experience is needed." |
| `app/events/[slug]/page.tsx:241` | "Everything is provided, and no experience is needed." |
| `app/events/[slug]/page.tsx:1177` | "Everything is laid out before you arrive. You bring nothing but yourself." |
| `app/events/page.tsx:250` | "…booked online. Everything is provided." |

The policy document qualifies it twice:

> Standard materials required for the selected project are included **unless
> specifically stated otherwise**.
> Additional materials, upgrades or premium items may be available for **an
> additional charge**.

A customer who reads "bring nothing but yourself" and is then charged for a
premium blank has a fair complaint. The site line already carried a
`TODO(client): confirm` at `lib/constants.ts:918`, so it was never signed off.

**Decision needed:** keep the absolute promise and drop the upgrade clause, or
soften the site line to something like "Everything you need is provided".
Five strings, one edit each — but it is approved marketing copy, so it is not
ours to soften.

### 1.2 — A booking cannot become "confirmed" on this site
**Severity: high. Nothing changed; booking logic untouched, per the brief.**

Policy: "A booking is considered confirmed once the required **payment or
deposit has been received** and the customer has received a booking
confirmation."

The site takes no payment — `PAYMENT_CONFIGURED` is false — and says so:

- `app/checkout/page.tsx:70` — "Nothing is charged through this site yet."
- `/events/[slug]/book` — "Nothing is charged here."
- `BookingSummaryCard` — "This booking is waiting on confirmation from the Maison."

So under the policy as written, no online booking is ever confirmed. The site's
own "waiting on confirmation" wording is nearly consistent with that, but the
definition is unreachable online and the Cancellation policy hangs off it
(what exactly is being cancelled, if nothing was confirmed?).

**Decision needed:** either the policy admits a reservation state before
payment, or online booking is described as a request until the studio
confirms. This is a policy question, not a code one.

### 1.3 — Two different notice periods inside the policy document itself
**Severity: medium. Resolved conservatively; see §2.1.**

Section 4 says both:

- bullets: "More than **24-48 hours** before the session" / "Less than **24
  hours** / No-show"
- prose: "We kindly ask customers to provide at least **48 hours'** notice"

48 asked for, 24 enforced, and the gap written as a range rather than a rule.

**Decision needed:** one number for free rescheduling. The published page does
not invent one — see §2.1.

### 1.4 — Charm bracelet making is in the policy and not on the website
**Severity: medium. Not added.**

Document section 2 lists "Charm bracelet making – Age 5 Plus" among the DIY
activities. It is not in `lib/experiences.ts`, has no description, no image and
no price, and the brief is explicit that a policy document is not how an
activity joins the catalogue.

**Decision needed:** is it a current activity? If yes it needs a catalogue
entry, not a line in a policy.

### 1.5 — 14+ workshops offered on pages aimed at children
**Severity: medium. Nothing changed.**

`/private-events/birthday-parties` and `/private-events/school-programs` both
print the full activity list under "The studio's activities, **any of which** a
session can be shaped around", and that list includes Candle Making and
Crocheting — both **14 and over** under the new policy.

The candle policy does leave a door open ("children should participate only
where the specific session is designed for their age group"), which may be
exactly what a bespoke private session is. It is genuinely ambiguous.

**Decision needed:** do the 14+ ages apply to private bookings, or only to the
public programme?

### 1.6 — Retail refunds are undecided
**Severity: low while nothing is sold. Not published.**

Section 14's "Products" half opens "For retail products, **establish whether**:"
and then lists four unresolved options (7-day exchange, final sale on
discounted items, non-returnable personalised items, damaged goods separately).
These are decisions still to take. Nothing on the site sells a retail product.

**Decision needed:** before any shop ships.

### 1.7 — Passes are live and no policy covers them
**Severity: medium.**

`/loyalty` sells three passes (AED 320 / 1,400 / 2,600) with validity terms —
"Valid for 3 months from purchase", "Valid for 12 months". Every membership
section of the policy document is marked **Coming Soon**, so nothing governs
expiry, transfer, refund or what happens to unused sessions.

The page is already `noindex` while `PASSES_CONFIGURED` is false, and the page
itself says the figures are placeholders.

**Decision needed:** are passes a membership for policy purposes? If they ship,
they need terms.

---

## 2. Conflicts resolved, and how

### 2.1 — The cancellation notice period
The page publishes the **prose** paragraph verbatim (ask for 48 hours; under 24
hours and no-shows may be non-refundable; exceptions at management discretion),
because it is the half written in the studio's voice to a customer and it is
coherent on its own terms.

The two outcomes that only appear in the bullets — free rescheduling subject to
availability, and a store credit note as the alternative — are published
**without a number**: "Where notice is given in good time…". Writing 24 there,
or 48, would have resolved the client's ambiguity by typing. Flagged at §1.3.

### 2.2 — "Walk-in"
**No change needed.** The term was already retired from every rendered page
before this work started; `app/events/[slug]/page.tsx:595` records the client
instruction. A rendered-text scan of all 20 pages returns zero occurrences. The
identifiers (`kind: "diy"`, `WalkInFacts`, `walkIn`) are code, not copy.

### 2.3 — DIY vs Create Anytime
**No change needed; both are used, in a fixed order.** The FAQ already says
"Create Anytime activities are DIY", so the two vocabularies were already
reconciled. The policy pages lead with the client's name and gloss it with the
document's word — "Create Anytime activities are DIY sessions" — so a reader of
either vocabulary lands in the right place.

### 2.4 — Ages
**No conflict existed.** The site carried no numeric age anywhere: a scan for
age patterns across all 20 rendered pages returned nothing. The policy ages are
therefore additive, not contradictory. They are defined once, in
`DIY_AGE_GUIDANCE` and `WORKSHOP_AGE_GUIDANCE`, and read by two pages.

### 2.5 — Collection, firing, photography, safety, conduct, complaints
**No conflict existed.** The site said nothing about any of them. All are new.

### 2.6 — Glass painting
Listed with its age (12+) because it **is** in the catalogue, carrying the
site's own "Coming soon". The policy page states an age, not an availability,
so the two do not disagree. Contrast §1.4.

---

## 3. Published with edits, and what the edits were

| Document section | On the site as | Changed how |
|---|---|---|
| 1 General Customer Policy | General Customer Policy | Verbatim. "Retail store" lower-cased. |
| 2 DIY Sessions | DIY Experience Policy | Ages reformatted to a list; charm bracelets removed (§1.4). |
| 3 Scheduled/Booked | Scheduled Workshop Policy | "The confirmation should include" → "Your confirmation will set out". |
| 4 Cancellation | Cancellation & Rescheduling | See §2.1. |
| 6 Candle-making | Scheduled Workshop Policy | Verbatim. |
| 7 Crochet | Scheduled Workshop Policy | Verbatim. |
| 8 Finished projects | Your Finished Projects | Verbatim. |
| 9 Damage & breakage | Your Finished Projects | Prose verbatim; the three remedies replaced with the document's own "case-by-case" sentence (§4). |
| 10 Materials & belongings | General Customer Policy | Verbatim. |
| 11 Children | Safety & Children | Verbatim. |
| 12 Safety | Safety & Children | Verbatim. |
| 13 Food & drinks | General Customer Policy | Verbatim. |
| 14 Refund — sessions | Refund & Exchange | Verbatim. Products half withheld (§1.6). |
| 21 Photography | Photography & Media | The one customer-facing paragraph only (§4). |
| 22 Conduct | General Customer Policy | Verbatim. |
| 23 Complaints | General Customer Policy | Verbatim. |
| 24 Results may vary | DIY Experience Policy | Verbatim. |

---

## 4. Deliberately not published

| What | Why |
|---|---|
| Sections 15–20, all membership | Every one is headed "Coming Soon". A benefit published as current is a benefit owed. |
| "Privacy Policy", "Terms & Conditions" | Named in the proposed structure; never drafted. No page stubbed — see `LEGAL_NAV` in `lib/constants.ts`. |
| "I would recommend…", "I particularly like…", "Suggested principles:", "I'd recommend excluding…", "I would have a lawyer review this wording" | Adviser writing to the owner. |
| "This protects you without sounding unnecessarily harsh", "This prevents one late customer from delaying everyone else", "This is one of the most important policies for protecting the business" | Justifications addressed to the business. |
| "For retail products, establish whether:" + its four bullets | Open questions, not policy (§1.6). |
| "Also clarify whether discounts apply to:" + its list | Open questions, and membership. |
| Section 9's three remedies (recreate / replacement blank / credit note) | The document's own instruction is that the customer-facing version "can simply say that remedies are handled on a case-by-case basis". Printing the three turns the studio's discretion into the customer's entitlement. |
| Section 21's consent-process advice | It tells the studio to build a process that does not exist yet. A consent statement is a claim about what happens to a photograph of a child. |
| Section 20, booking & membership abuse | Membership. |
| An effective date | The document carries none, and section 1 makes the date operative. |
| Checkout consent checkbox (section 25) | Changes booking validation, which the brief rules out. Recommended as a follow-up. |

---

## 5. Recommended follow-ups (not done, not asked for)

1. **FAQ.** `lib/constants.ts:938` lists five questions the project could not
   answer — minimum age, whether children can attend, accessibility, what
   happens if you cannot make it, whether pieces are fired and collected later.
   The policy document now answers **four of the five**. Adding them is a
   content decision, so it was left alone.
2. **Checkout consent.** Document section 25 proposes "☐ I have read and agree
   to the Maison Palettia Booking & Studio Policies". It changes form
   validation and needs client sign-off on the wording.
3. **Age on the activity pages.** The ages live only on the policy pages today.
   A line on each activity page would stop someone travelling to a mall with a
   7-year-old for a 14+ workshop.
