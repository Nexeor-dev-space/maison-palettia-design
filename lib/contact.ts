/**
 * The studio's phone numbers, as links. Client-safe (no CMS import), so the
 * footer, the Contact page, emails, PDFs and JSON-LD all print a number the
 * same way.
 *
 * TWO NUMBERS, TWO FIELDS. Site details → Contact already had `phone` (typed
 * as it should print, "+971 50 474 7762") and `whatsappNumber` (digits only,
 * the form wa.me needs). The owner's numbers are exactly that pair, a Call
 * line and a WhatsApp line, so they stay two fields rather than becoming a
 * list: a list would need a label, a "this one is WhatsApp" tick and an
 * order to say what the two named fields already say.
 */

/** `tel:` link for a number printed as typed: everything but digits and a leading + goes. */
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

/** The phone in E.164 (`+97150…`), for structured data. */
export function e164(phone: string): string {
  return telHref(phone).slice("tel:".length);
}

/**
 * A WhatsApp number (digits, country code first) as people read it.
 *
 * UAE numbers get the local grouping — "+971 55 496 6116" for a mobile,
 * "+971 4 000 0000" for a landline — and anything else is "+" and the
 * digits, which is always correct if not always pretty.
 */
export function formatWhatsApp(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("971")) {
    const rest = d.slice(3);
    if (rest.length === 9) return `+971 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
    if (rest.length === 8) return `+971 ${rest.slice(0, 1)} ${rest.slice(1, 4)} ${rest.slice(4)}`;
  }
  return `+${d}`;
}

/** The chat link — `https://wa.me/<digits>`, the form WhatsApp documents. */
export function whatsappHref(digits: string): string {
  return `https://wa.me/${digits.replace(/\D/g, "")}`;
}

/** The WhatsApp line every surface prints, or null when the field is empty or not a number. */
export function whatsappOf(raw: string | null | undefined): { display: string; href: string } | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return { display: formatWhatsApp(digits), href: whatsappHref(digits) };
}

/**
 * "Maison Palettia Events L.L.C. · Commercial Licence No. 1626148 · Dubai, UAE"
 * — the footer's © line and the policy pages' issuer line. Missing parts are
 * left out rather than printed empty.
 */
export function legalEntityParts(site: { legalName: string; licenceNumber?: string | null; registeredIn?: string | null }): string[] {
  return [
    site.legalName,
    site.licenceNumber ? `Commercial Licence No. ${site.licenceNumber}` : null,
    site.registeredIn || null,
  ].filter((part): part is string => Boolean(part));
}
