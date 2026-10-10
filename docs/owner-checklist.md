# Going live — your checklist

Everything on this list happens in your admin panel, in your browser. Nothing
needs a developer, and nothing needs the website to be "redeployed": when you
save, the site changes within a second or two.

Work through it **in order** — a few steps only work once the one before is
done, and the panel will tell you so in plain words if you jump ahead.

> **Where things are.** The menu on the left of the admin is grouped:
> **Content** (pages, sessions, photos…), **Bookings**, **Inbox**,
> **Emails**, **Settings**, and **Settings (admin)** for the
> things only you should touch. Press **⌘K** (Mac) or **Ctrl K** (Windows)
> anywhere and type what you are looking for — "TRN", "webhook", "sessions" —
> to jump straight there.
>
> **The dashboard keeps score.** The first page you see after logging in shows
> anything still missing as a coloured note with a button that takes you to
> the fix. Red means "customers are affected", amber means "finish this before
> launch". When this list is done, the dashboard has no coloured notes left.

---

## Before you start — Nexeor does this part

You do not need to do anything here; it is listed so you know what "ready"
means. Nexeor will tell you when it is done and send you the address.

- The server, the secure (https) address, nightly backups.
- A fresh, empty database for the live site, with its own restricted login.
- The first installation of the site, with all of today's wording and photos
  loaded in.

When Nexeor says "it's live", start at step 1.

---

## 1. Create your account (2 minutes)

1. Open **`https://<your-domain>/admin`**.
2. The first screen asks for your name, email and a password. This first
   account is the **owner account** — it can do everything.
3. Use a password of at least 12 characters that you do not use anywhere else,
   and save it in your password manager.

## 2. Confirm your site address and contact details (10 minutes)

**Settings → Site details**

1. Tab **Advanced** → **Site address**: type your address exactly as visitors
   use it, starting `https://` and with no `/` at the end
   (for example `https://maisonpalettia.com`). Save.
   *Payment confirmations, emails and links all use this address — the
   dashboard shows an amber note until it is saved.*
2. Tab **Contact**: **Public email**, **Public phone**, **WhatsApp business
   number**, your social media links, your address. Save.
3. **Photos.** Some of the launch photos are marked *AI-generated* or *unknown
   origin*, and those cannot appear in the big hero and card spaces. Either:
   - replace them — the dashboard note **"See photos"** lists them; open each
     one in **Content → Media**, upload your own photograph, and set
     **Where it came from** to *Studio*; **or**
   - keep them — tick **Allow AI-generated imagery in hero and card slots**
     on the **Advanced** tab.

## 3. Set up email (15 minutes) — everything after this depends on it

**Settings (admin) → Email sending**

Without this, customers get no confirmations, tickets or invoices, and your
team cannot reset their passwords.

1. Choose **SMTP** (your email provider's details — host, port, username,
   password) or **Resend** (an API key from resend.com). Your email provider
   or Nexeor can give you these.
2. Fill in the **From address** — the name and address customers see.
3. Click **Verify connection**. Wait for the green confirmation.
4. Click **Send test…**, send one to yourself, and check it arrived (look in
   spam too).

## 4. Invite your team (5 minutes)

**Settings → Staff → Invite staff**

1. Name, email, and **What they may do**:
   - **Editor** — pages, sessions, photos and wording. No bookings, no settings.
   - **Front desk** — bookings, tickets, check-in and the inbox. No content, no settings.
   - **Admin** — everything. Keep this to yourself unless you really need a second one.
2. **Send invitation.** They receive an email and choose their own password.
   You never need to know it.

## 5. Your invoice details (10 minutes)

**Settings (admin) → Invoices & VAT**

1. **Legal name on invoices**, **Registered address**, **Trade licence number**.
2. **TRN (VAT registration)** — until this is filled in, documents print as
   *receipts*, not tax invoices.
3. **Invoice email** and **Invoice phone**. Then open **PDF appearance**
   (it starts folded) and choose your **Logo** — or leave it empty to use
   the logo from Site details. Save.

## 6. Who gets told about what (5 minutes)

**Settings (admin) → Who gets notified**

Add a row for each person and tick what they should receive by email. At the
very least, someone should get:

- **New order**
- **Failed payment**
- **Refund requested (needs approval)**
- **New enquiry**
- **Background task failed** (this one is for Nexeor too — add their address)

Save.

## 7. Payments with Mamo Pay (about an hour, spread over a day or two)

**Settings (admin) → Payments (Mamo Pay)**

The **Mode** at the top says where card payments go:
**Test** (Mamo's sandbox — practice cards, no money moves) or **Live** (real
cards, real money). Start in Test.

**First, the sandbox**

1. Ask Mamo for your **sandbox API key**. Paste it into **Sandbox API key**
   and save.
2. **Test connection** → wait for the green confirmation.
3. **Register/Update webhook** → confirm. (This is how Mamo tells your site a
   payment went through.)
4. **Send AED 2 test order**, or book a session on your own site, and pay
   with Mamo's test cards (expiry **01/28**, CVV **123**):
   - `4659 1055 6905 1157` — payment succeeds
   - `4242 4242 4242 4242` — payment succeeds after a security step
     (password `Checkout1!`)
   - `4567 3613 2598 1788` — payment is declined
5. Check the result in **Bookings → Orders**: the paid ones show as paid, with
   a ticket and an invoice; the declined one shows as failed. You should also
   have received the confirmation email.

**Then, live**

6. Ask Mamo for your **live API key**. Paste it into **Live API key** and save.
7. Under **Mamo Pay actions**, switch from **Sandbox** to **Live**, then **Test connection** → **Register/Update webhook**.
8. Set **Mode** to **Live** and save. The panel runs its own safety checks
   first and tells you if anything is missing.
9. Make one real **AED 2** payment with your own card, then open that order in
   **Bookings → Orders** and refund it. This proves money can go both ways.

## 8. Your real content (as long as it takes)

The launch content is today's site. Before opening bookings:

- **Content → Sessions** — your real dates, prices and number of seats. The
  two sessions that came with the site are drafts (not visible) — edit them or
  add new ones with **Add a session**, then **Publish**. For a weekly class,
  open one session, use **Repeat weekly…** from its actions menu, and publish
  the copies you want.
- **Content → Passes** — publish the passes you sell, or leave them as drafts
  and the loyalty page shows a friendly "coming soon".
- **Content → Testimonials** — only real quotes, and tick **Written permission
  to publish** once the person has agreed.
- **Content → Policies** — your Privacy and Terms pages; tick **Show in footer
  legal row** on each.
- **Settings → Booking & checkout wording** — read the *"Ready for you"*
  paragraph (the "everything provided" promise) and make sure it matches what
  your DIY policy says about materials.
- **Photos of children** — open each in **Content → Media** and tick
  **Model/parent consent on file** only if you have it; otherwise replace the
  photo.
- **Bookings → Promo codes** — any discount codes you want to launch with.

## 9. Open bookings (1 minute)

**Settings → Booking & checkout wording → Bookings open** → tick → Save.

If something is still missing, the panel will not let you, and tells you
exactly what — for example *"Set up Email first so customers receive their
tickets"*. Until bookings are open, every **Book** button on the site shows
your "closed" message and links to your Contact page. Your front desk can
already take bookings in person with **Bookings → Orders → Create desk
booking**.

## 10. Final look (10 minutes)

- The dashboard shows **no red or amber notes**, and the payments badge says
  **Payments: LIVE**.
- Open the site in a private browser window, book a session as a customer
  would, and check the email, the ticket and the invoice.
- On the day, the front desk opens **Front desk → Check-in** on a phone or
  tablet and scans tickets with the camera.

---

## After launch — where things live

| You want to… | Go to |
|---|---|
| See today's sessions and new bookings | the dashboard (the first page) |
| Find a booking, refund, move it to another date, resend a ticket | **Bookings → Orders**, open the order, **Actions** |
| Check people in | **Front desk → Check-in** |
| Answer an enquiry | **Inbox → Enquiries** |
| Change any wording on a page | **Content → Pages**, or click **Edit** on the page preview |
| See visitors and sales | **Reports → Analytics** |
| See which emails went out | **Emails → Sent emails** |

**Locked out?** Use "Forgot password?" on the login page. If email is not
working, Nexeor can reset it for you on the server in a minute.

**Something looks wrong?** Take a screenshot of the dashboard and send it to
Nexeor — the coloured notes usually say exactly what happened.
