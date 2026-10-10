/**
 * ==========================================================================
 * Inbox helpers shared by the server and the admin's client components
 * ==========================================================================
 *
 * Pure functions only — no Payload, no config, no `@/` imports — because the
 * Reply-by-email panel and the status chips (cms/components/inbox/**) run in
 * the browser and must not drag the collection config into the admin
 * bundle, and because the vitest suite exercises them without a database.
 *
 * THE REFERENCE. Enquiries have no reference column of their own (orders do;
 * §D.4 does not give enquiries one). The subject line of a reply still needs
 * something a colleague can search their mailbox for and that maps back to
 * one row, so the reference is DERIVED from the UUID: `ENQ-` + its first
 * eight hex digits. Eight hex digits are 4 billion values — collisions
 * between two enquiries of one small studio are not a practical concern,
 * and if one ever happened the admin search (`listSearchableFields`) still
 * finds both by email. Deriving it means no column, no migration, no
 * counter, and the same string in the admin, the staff alert and the
 * auto-reply without anyone storing it.
 */

export type EnquiryStatus = "new" | "in_progress" | "closed";

/** `ENQ-1A2B3C4D` from a UUID (or any id: non-hex characters are dropped first). */
export function enquiryReference(id: string | number | null | undefined): string {
  const hex = String(id ?? "")
    .toLowerCase()
    .replace(/[^0-9a-f]/g, "");
  return hex ? `ENQ-${hex.slice(0, 8).toUpperCase()}` : "ENQ-—";
}

/** Labels and chip tones for the three statuses, in board order. */
export const STATUS_CHIPS: readonly { value: EnquiryStatus; label: string; tone: "new" | "active" | "done" }[] = [
  { value: "new", label: "New", tone: "new" },
  { value: "in_progress", label: "In progress", tone: "active" },
  { value: "closed", label: "Closed", tone: "done" },
];

export const statusLabel = (value: unknown): string => STATUS_CHIPS.find((chip) => chip.value === value)?.label ?? "—";

/**
 * Where the form was sent from, as a site path.
 *
 * Only the pathname is kept: a query string can carry anything (a magic-link
 * token pasted into the wrong tab, a tracking id), and the Inbox needs to
 * know "the private-events booking page", not the visitor's whole URL. An
 * unparseable or non-http value is dropped rather than stored verbatim.
 */
export function refererPath(referer: string | null | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer, "http://placeholder.invalid");
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    // Collapse leading slashes: "//evil.example/x" would be a protocol-relative
    // link to another host when the admin renders the path as an <a href>.
    const path = url.pathname.replace(/^\/+/, "/").slice(0, 300);
    return path.startsWith("/") ? path : undefined;
  } catch {
    return undefined;
  }
}

/** mailto: URLs past ~2,000 characters are cut off or refused by some mail clients. */
const MAX_QUOTE_CHARS = 800;

export interface ReplyMailtoInput {
  email: string;
  name?: string | null;
  reference: string;
  topicLabel?: string | null;
  message?: string | null;
  receivedAt?: string | null;
}

/**
 * The `mailto:` behind **Reply by email** (SPEC §D.4).
 *
 * Replies happen in the studio's own mail client, from the studio's own
 * address — the CMS never sends a free-text reply on anyone's behalf. The
 * subject carries the reference so the thread can be found again; the body
 * opens with a greeting and quotes the original (trimmed) so the enquirer
 * sees what is being answered. `encodeURIComponent` everywhere: RFC 6068
 * wants percent-encoding, and `+` is NOT a space in a mailto query.
 */
export function buildReplyMailto({ email, name, reference, topicLabel, message, receivedAt }: ReplyMailtoInput): string {
  const firstName = (name ?? "").trim().split(/\s+/)[0] ?? "";
  const subject = `Re: ${topicLabel?.trim() || "Your enquiry"} [${reference}]`;
  const original = (message ?? "").trim();
  const quoted = original.length > MAX_QUOTE_CHARS ? `${original.slice(0, MAX_QUOTE_CHARS).trimEnd()}…` : original;
  const when = receivedAt ? formatDubai(receivedAt) : "";
  const body = [
    firstName ? `Hi ${firstName},` : "Hello,",
    "",
    "",
    "",
    when ? `On ${when}, you wrote:` : "You wrote:",
    ...quoted.split(/\r?\n/).map((line) => `> ${line}`),
  ].join("\r\n");
  return `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * "10 Oct 2026, 14:05" — the admin's display format (`admin.dateFormat`).
 * Emails and the reply quote use Dubai time (the customer's clock); the admin
 * panel passes no zone, so it reads in the viewer's own clock like every
 * Payload date field beside it.
 */
export function formatWhen(iso: string, timeZone?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export const formatDubai = (iso: string): string => formatWhen(iso, "Asia/Dubai");
