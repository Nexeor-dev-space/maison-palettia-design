import { BOOKING_CONFIGURED, PAYMENT_CONFIGURED } from "@/lib/bookingFlags";
import { TAGS } from "@/lib/cms/cache";
import { hrefOf, lexicalToText, sizedImageOf, toNavItem } from "@/lib/cms/mappers";
import { contentReader, findDocs, getGlobal } from "@/lib/cms/query";
import {
  BOOKING_REQUEST_TERMS,
  BOOKING_TERMS,
  BRAND_LOGO,
  CONTACT,
  DARK_HERO_ROUTES,
  FAQ_GROUPS,
  FOOTER_NAV,
  HOMEPAGE_FAQ,
  LEGAL_NAV,
  LIGHT_HERO_ROUTES,
  MAIN_NAV,
  NEWSLETTER,
  PRIMARY_CTA,
  SITE,
  SOCIAL_LINKS,
  type FaqGroup,
} from "@/lib/constants";
import { whatsappOf } from "@/lib/contact";
import { ENQUIRY_CONFIGURED } from "@/lib/enquiry";
import { groupFaqsBySection } from "@/lib/faqSections";
import type { ContactDetails, FaqItem, NavGroup, NavItem, SocialLink } from "@/types";

/**
 * ==========================================================================
 * lib/constants.ts, from the CMS — the async getters (SPEC §G.1, §L row 2C)
 * ==========================================================================
 *
 * One getter per content constant in lib/constants.ts, same shape as the
 * constant, read from the admin: `site-settings` (identity, logo, contact,
 * socials, newsletter, header colour routes), `navigation` (menus, footer,
 * legal row, the primary action), `booking-settings` (the booking-terms
 * sentence) and the `faqs` collection. Each is cached under its global's or
 * collection's tag and is draft-aware (lib/cms/query.ts).
 *
 * SERVER ONLY, which is why this is a separate module: lib/constants.ts is
 * imported by client components and must not reach the Local API. A client
 * component gets these values as props from the server component above it.
 *
 * FALLBACKS. Every getter returns the constant from lib/constants.ts only
 * when the CMS cannot answer at all (no database, a build without one). An
 * empty list read from the CMS is kept as it is — the seed (2B) has filled
 * every list, so an empty footer is now a choice, not a gap.
 * Single strings need no such rule: the globals were created with the
 * site's current wording as their defaults (cms/globals/copyFields.ts).
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Site identity — site-settings                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/** `SITE`, widened: the values are the admin's now, not literals. */
export interface SiteIdentity {
  name: string;
  legalName: string;
  /** Site details → Commercial licence number, or null when not set. */
  licenceNumber: string | null;
  /** Site details → Registered in ("Dubai, UAE"), or null when cleared. */
  registeredIn: string | null;
  tagline: string;
  locale: string;
  /** Absolute origin, no trailing slash — `metadataBase`, sitemap and robots. */
  url: string;
}

/**
 * `url` is the origin search engines keep — canonicals, `og:url`, the
 * sitemap, robots, JSON-LD — and it is always the production origin
 * (lib/siteOrigin.ts), on every deployment.
 *
 * It used to be Site details → `publicUrl` once confirmed, then an https
 * `NEXT_PUBLIC_SERVER_URL`. Live and staging share one database, so the
 * confirmed `publicUrl` was staging's, and the live site sent every crawler
 * to staging (DECISIONS.md #9). Emails, payment returns and preview links
 * still follow `publicUrl` (cms/lib/publicUrl.ts): those must reach the
 * deployment that sent them, which a canonical must not.
 */
export async function getSite(): Promise<SiteIdentity> {
  const settings = await getGlobal("site-settings", 0);
  return {
    name: settings?.name || SITE.name,
    legalName: settings?.legalName || SITE.legalName,
    licenceNumber: settings?.licenceNumber?.trim() || null,
    registeredIn: settings ? settings.registeredIn?.trim() || null : "Dubai, UAE",
    tagline: settings?.tagline || SITE.tagline,
    locale: settings?.locale || SITE.locale,
    url: SITE.url,
  };
}

type Ink = { left: number; top: number; width: number; height: number };

/** `BRAND_LOGO`, widened. */
export interface BrandLogo {
  src: string;
  width: number;
  height: number;
  ink: Ink;
  onLight: { src: string; width: number; height: number; ink: Ink };
}

/** The whole file is ink — the only honest box for a logo whose lettering has not been measured. */
const WHOLE_BOX: Ink = { left: 0, top: 0, width: 1, height: 1 };

/**
 * The two logo cuts from Site details. Unset uploads keep the committed
 * files (`BRAND_LOGO`).
 *
 * THE INK BOX. The intro flies the vector mark onto the lettering inside the
 * file, so it needs to know where the lettering sits (see `BRAND_LOGO.ink`).
 * The light-background cut's box is `logoOnDarkInk` when an admin (or the
 * alpha-measuring hook) has filled it; a replaced file with no box measured
 * gets the whole frame rather than the old file's box, which would land the
 * letters on another image's margins. The dark-background cut has no box
 * field yet, so the same rule applies to it.
 */
export async function getBrandLogo(): Promise<BrandLogo> {
  const settings = await getGlobal("site-settings", 1);
  const dark = sizedImageOf(settings?.logoOnDark);
  const light = sizedImageOf(settings?.logoOnLight);
  const box = settings?.logoOnDarkInk;
  const measured =
    box && [box.left, box.top, box.width, box.height].every((n) => typeof n === "number")
      ? ({ left: box.left, top: box.top, width: box.width, height: box.height } as Ink)
      : undefined;
  return {
    src: dark?.src ?? BRAND_LOGO.src,
    width: dark?.width ?? BRAND_LOGO.width,
    height: dark?.height ?? BRAND_LOGO.height,
    ink: dark ? (measured ?? WHOLE_BOX) : { ...BRAND_LOGO.ink },
    onLight: {
      src: light?.src ?? BRAND_LOGO.onLight.src,
      width: light?.width ?? BRAND_LOGO.onLight.width,
      height: light?.height ?? BRAND_LOGO.onLight.height,
      ink: light ? WHOLE_BOX : { ...BRAND_LOGO.onLight.ink },
    },
  };
}

/** `CONTACT`: the address lines, public email, Call number and WhatsApp number from Site details. */
export async function getContact(): Promise<ContactDetails> {
  const contact = (await getGlobal("site-settings", 0))?.contact;
  if (!contact) return { ...CONTACT, addressLines: [...CONTACT.addressLines] };
  const lines = (contact.addressLines ?? []).map((row) => row.line).filter(Boolean);
  return {
    addressLines: lines,
    email: contact.email || null,
    phone: contact.phone?.trim() || null,
    whatsapp: whatsappOf(contact.whatsappNumber),
  };
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
};

/** `SOCIAL_LINKS`: one row per platform; a row without a URL is kept with `href: null`, as before. */
export async function getSocialLinks(): Promise<SocialLink[]> {
  const rows = (await getGlobal("site-settings", 0))?.socials;
  if (!rows) return SOCIAL_LINKS.map((link) => ({ ...link }));
  return rows.map((row) => ({ label: PLATFORM_LABEL[row.platform] ?? row.platform, href: row.url || null }));
}

/** `NEWSLETTER`. `actionUrl` is null unless the sign-up is switched on AND has a provider address. */
export async function getNewsletter(): Promise<typeof NEWSLETTER> {
  const newsletter = (await getGlobal("site-settings", 0))?.newsletter;
  if (!newsletter) return { ...NEWSLETTER };
  return {
    actionUrl: newsletter.enabled && newsletter.actionUrl ? newsletter.actionUrl : null,
    fieldName: newsletter.fieldName || NEWSLETTER.fieldName,
    heading: newsletter.heading || NEWSLETTER.heading,
    description: newsletter.description || NEWSLETTER.description,
    cta: newsletter.cta || NEWSLETTER.cta,
  };
}

/**
 * `DARK_HERO_ROUTES` / `LIGHT_HERO_ROUTES`. Empty is meaningful here (no dark
 * hero today), so the CMS lists are used as they are whenever the global
 * can be read.
 */
export async function getHeroRoutes(): Promise<{ dark: string[]; light: string[] }> {
  const theme = (await getGlobal("site-settings", 0))?.heroTheme;
  if (!theme) return { dark: [...DARK_HERO_ROUTES], light: [...LIGHT_HERO_ROUTES] };
  return {
    dark: (theme.darkRoutes ?? []).map((row) => row.path),
    light: (theme.lightRoutes ?? []).map((row) => row.path),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Menus — navigation                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * `MAIN_NAV`: one list, four surfaces (desktop bar, bottom bar, About sheet,
 * footer) through per-row flags, exactly as the constant works.
 *
 * NOT CARRIED BY `NavItem`: the row's `mobileShortLabel` (the bottom bar's
 * "Private"). <BottomNav> keeps its own short-label map until it reads the
 * row — see the 2D notes; the getter for the raw rows is
 * `getGlobal("navigation")`.
 */
export async function getMainNav(): Promise<NavItem[]> {
  const rows = (await getGlobal("navigation", 0))?.primary;
  return rows ? rows.map(toNavItem) : MAIN_NAV.map((item) => ({ ...item }));
}

/** `PRIMARY_CTA`: the one booking action in the header and the phone's Book tab. */
export async function getPrimaryCta(): Promise<{ label: string; href: string }> {
  const cta = (await getGlobal("navigation", 0))?.primaryCta;
  return {
    label: cta?.label || PRIMARY_CTA.label,
    // The global's default carries a label but no address; until one is
    // saved, the constant's address stands.
    href: hrefOf(cta?.link, PRIMARY_CTA.href),
  };
}

/** `FOOTER_NAV`: the footer's link columns. */
export async function getFooterNav(): Promise<NavGroup[]> {
  const groups = (await getGlobal("navigation", 0))?.footer?.groups;
  if (!groups) return FOOTER_NAV.map((group) => ({ ...group, items: group.items.map((item) => ({ ...item })) }));
  return groups.map((group) => ({
    title: group.title,
    items: (group.items ?? []).map((item) => toNavItem({ label: item.label, link: item.link })),
  }));
}

/** Policies flagged "Show in footer legal row", for {@link getLegalNav}. */
const readLegalPolicies = contentReader("policies:legal-row", [TAGS.policies], async (draft) => {
  const docs = await findDocs("policies", draft, {
    drafts: true,
    sort: "order",
    depth: 0,
    where: { showInLegalRow: { equals: true } },
  });
  return docs.map((doc): NavItem => ({ label: doc.navLabel, href: `/policies/${doc.slug}` }));
});

/**
 * `LEGAL_NAV`: the footer's bottom row — the links typed into Menus →
 * Legal, then every policy ticked "Show in footer legal row" (Privacy and
 * Terms, once written). Empty today, as the constant is.
 */
export async function getLegalNav(): Promise<NavItem[]> {
  const [navigation, policies] = await Promise.all([getGlobal("navigation", 0), readLegalPolicies()]);
  const typed = (navigation?.legal ?? []).map((row) => toNavItem({ label: row.label, link: row.link }));
  const items = [...typed, ...(policies ?? [])];
  const seen = new Set<string>();
  const unique = items.filter((item) => (seen.has(item.href) ? false : (seen.add(item.href), true)));
  return unique.length ? unique : LEGAL_NAV.map((item) => ({ ...item }));
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Booking terms — booking-settings                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Somewhere a customer can actually send a reference (`REFERENCE_CHANNEL_SET`),
 * judged from the contact details in the admin rather than the constant.
 */
export async function getReferenceChannelSet(): Promise<boolean> {
  const contact = await getContact();
  return Boolean(contact.email || contact.phone || contact.whatsapp || ENQUIRY_CONFIGURED);
}

/**
 * `bookingTerms()`: the one sentence printed under Confirm, on the
 * confirmation and as the FAQ answer to "Am I charged when I book?".
 *
 * WHICH SENTENCE, AND WHY THE ADMIN'S IS NOT ALWAYS IT. Booking & checkout →
 * "What a booking is" describes the PAID flow (it is seeded with
 * `BOOKING_TERMS.paid`, SPEC §F.6), and it is only true once the site takes
 * paid bookings — `bookingsOpen` in the same global. Until then the sentence
 * is the one the flags in lib/bookingFlags.ts select, exactly as
 * `bookingTerms()` picks it, with the request wording following the admin's
 * contact details. Printing the paid sentence over a flow that takes no
 * payment is the exact disagreement the note on `BOOKING_TERMS` was written
 * to end.
 */
export async function getBookingTerms(): Promise<string> {
  const settings = await getGlobal("booking-settings", 0);
  if (settings?.bookingsOpen && settings.bookingTerms) return settings.bookingTerms;
  if (PAYMENT_CONFIGURED) return BOOKING_TERMS.paid;
  if (BOOKING_CONFIGURED) return BOOKING_TERMS.recorded;
  return (await getReferenceChannelSet()) ? BOOKING_REQUEST_TERMS.withChannel : BOOKING_REQUEST_TERMS.withoutChannel;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* FAQs — the faqs collection                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export type FaqGroupKey = "coming" | "booking" | "groups";

/** The three sections, in page order, with the titles /faq has always used. */
const FAQ_GROUP_ORDER: readonly FaqGroupKey[] = ["coming", "booking", "groups"];
const DEFAULT_GROUP_TITLES: Record<FaqGroupKey, string> = {
  coming: FAQ_GROUPS[0]?.title ?? "Coming to an event",
  booking: FAQ_GROUPS[1]?.title ?? "Booking a place",
  groups: FAQ_GROUPS[2]?.title ?? "Groups and passes",
};

type FaqRow = {
  /** The FAQ section's id — for a question not saved since sections became editable, the section that replaced its `group`. */
  section: string | null;
  /** The old fixed section; empty for a question added since sections became editable. */
  group: FaqGroupKey | null;
  showOnHomepage: boolean;
  question: string;
  answerSource: "text" | "bookingTerms";
  answer: string;
};

const idOf = (value: unknown): string | null => {
  if (value && typeof value === "object" && "id" in value) return String((value as { id: unknown }).id);
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
};

/**
 * Every published FAQ in `order`, with its rich-text answer already flattened
 * (the accordion prints text). A "booking terms" answer is resolved per read
 * by {@link getBookingTerms}, not cached here, so switching the booking mode
 * changes the FAQ without touching a question.
 */
/**
 * Every field the site reads except `section`. Asked for on its own when the
 * full read fails because the database has no `section` column yet: Coolify
 * builds (and prerenders /faq) before `start:prod` runs the migration, and
 * without this the build would print the in-file copy instead of the CMS's
 * wording. Without a section, every question is filed by its `group`.
 */
const FAQ_FIELDS_BEFORE_SECTIONS = { question: true, answerSource: true, answer: true, group: true, showOnHomepage: true, order: true } as const;

const readFaqs = contentReader("faqs", [TAGS.faqs, TAGS.faqSections], async (draft) => {
  const options = { drafts: true, sort: "order", depth: 0 } as const;
  const docs = await findDocs("faqs", draft, options).catch(() =>
    findDocs("faqs", draft, { ...options, select: FAQ_FIELDS_BEFORE_SECTIONS }),
  );
  return docs.map(
    (doc): FaqRow => ({
      section: idOf(doc.section),
      group: doc.group ?? null,
      showOnHomepage: Boolean(doc.showOnHomepage),
      question: doc.question,
      answerSource: doc.answerSource,
      answer: doc.answerSource === "text" ? lexicalToText(doc.answer) : "",
    }),
  );
});

const itemOf = (row: FaqRow, terms: string): FaqItem => ({
  question: row.question,
  answer: row.answerSource === "bookingTerms" ? terms : row.answer,
});

/**
 * `FAQ_GROUPS`: the questions in their three sections. `titles` are the
 * section headings, which belong to the page (the `faqList` block's
 * `groups[]{key, title}`); omitted ones keep the headings /faq has always
 * printed. A section with no questions is left out.
 */
export async function getFaqGroups(titles: Partial<Record<FaqGroupKey, string>> = {}): Promise<FaqGroup[]> {
  const [rows, terms] = await Promise.all([readFaqs(), getBookingTerms()]);
  if (!rows) return FAQ_GROUPS.map((group) => ({ ...group, items: group.items.map((item) => fallbackItem(item, terms)) }));
  return FAQ_GROUP_ORDER.map((key) => ({
    title: titles[key] || DEFAULT_GROUP_TITLES[key],
    items: rows.filter((row) => row.group === key).map((row) => itemOf(row, terms)),
  })).filter((group) => group.items.length > 0);
}

/** The FAQ sections editors manage (Content → FAQ sections), in page order. */
const readFaqSections = contentReader("faq-sections", [TAGS.faqSections], async (draft) => {
  const docs = await findDocs("faq-sections", draft, { drafts: false, sort: "order", depth: 0 });
  // Equal order numbers (a new section keeps the default 0) fall back to the older first, so the page never reshuffles them.
  const time = (doc: (typeof docs)[number]) => Date.parse(doc.createdAt);
  return [...docs]
    .sort((a, b) => a.order - b.order || time(a) - time(b))
    .map((doc) => ({ id: String(doc.id), title: doc.title, legacyKey: doc.legacyKey ?? null }));
});

/**
 * The FAQ page's sections as editors set them up, or `null` while there are
 * none yet (the one-time move, cms/lib/faqSections.ts, has not run against
 * this database) or the CMS cannot be read — the caller then prints the
 * sections the old way, so the page is the same either side of the move.
 */
export async function getFaqSectionGroups(): Promise<FaqGroup[] | null> {
  const [sections, rows, terms] = await Promise.all([readFaqSections(), readFaqs(), getBookingTerms()]);
  if (!sections?.length || !rows) return null;
  return groupFaqsBySection(sections, rows, (row) => itemOf(row, terms));
}

/** `HOMEPAGE_FAQ`: the questions ticked "Also show on homepage". */
export async function getHomepageFaq(): Promise<FaqItem[]> {
  const [rows, terms] = await Promise.all([readFaqs(), getBookingTerms()]);
  if (!rows) return HOMEPAGE_FAQ.map((item) => ({ ...item }));
  return rows.filter((row) => row.showOnHomepage).map((row) => itemOf(row, terms));
}

/**
 * The in-file "Am I charged" answer was computed by `bookingTerms()` when the
 * module loaded; the fallback re-answers it with the live sentence so the
 * fallback and the CMS path can never print two different terms.
 */
const TERMS_SENTENCES = new Set<string>([...Object.values(BOOKING_TERMS), ...Object.values(BOOKING_REQUEST_TERMS)]);
const fallbackItem = (item: FaqItem, terms: string): FaqItem =>
  TERMS_SENTENCES.has(item.answer) ? { ...item, answer: terms } : { ...item };
