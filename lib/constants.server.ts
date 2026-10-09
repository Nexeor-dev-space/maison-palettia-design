import { envPublicUrl, isAcceptablePublicUrl, PUBLIC_URL_RE } from "@/cms/lib/publicUrl";
import { BOOKING_CONFIGURED, PAYMENT_CONFIGURED } from "@/lib/bookingFlags";
import { TAGS } from "@/lib/cms/cache";
import { hrefOf, lexicalToText, sizedImageOf, toNavItem } from "@/lib/cms/mappers";
import { getCms } from "@/lib/cms/payload";
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
import { ENQUIRY_CONFIGURED } from "@/lib/enquiry";
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
  tagline: string;
  locale: string;
  /** Absolute origin, no trailing slash — `metadataBase`, sitemap and robots. */
  url: string;
}

/**
 * The public origin for canonicals, `og:url`, the sitemap and robots — the
 * addresses search engines keep.
 *
 *   1. Site details → `publicUrl`, but only once an admin has CONFIRMED it
 *      (`system-state.publicUrlConfirmedAt`, the same stamp
 *      `isPlaceholderPublicUrl()` reads). Until then the stored value is the
 *      seed's copy of whichever `.env` ran it — on the shared database
 *      (DECISIONS.md #1) that is the dev machine's `http://localhost:3200`,
 *      and a production deploy would otherwise print localhost canonicals
 *      until somebody re-saved Site details.
 *   2. `NEXT_PUBLIC_SERVER_URL`, when it is a real https address (the
 *      production build's). A local http value is a dev convenience for
 *      links that must work on this machine (emails, payment returns —
 *      cms/lib/publicUrl.ts keeps using it there); it is never an address
 *      to hand a crawler.
 *   3. The old constant, `SITE.url` — what every page printed before the CMS.
 *
 * system-state is staff-only, so this reads both globals with the server's
 * own access and caches the answer under the site-settings tag: the save
 * that confirms the address (cms/globals/SiteSettings.ts) purges that tag.
 */
const readConfirmedOrigin = contentReader("site-origin", [TAGS.site], async () => {
  const payload = await getCms();
  const [settings, state] = await Promise.all([
    payload.findGlobal({ slug: "site-settings", depth: 0, overrideAccess: true, select: { publicUrl: true } }),
    payload.findGlobal({ slug: "system-state", depth: 0, overrideAccess: true, select: { publicUrlConfirmedAt: true } }),
  ]);
  const saved = typeof settings?.publicUrl === "string" ? settings.publicUrl : "";
  return state?.publicUrlConfirmedAt && isAcceptablePublicUrl(saved) ? saved : "";
});

const stripSlash = (url: string) => url.trim().replace(/\/+$/, "");

async function siteOrigin(): Promise<string> {
  const confirmed = await readConfirmedOrigin();
  if (confirmed) return stripSlash(confirmed);
  const env = envPublicUrl();
  return PUBLIC_URL_RE.test(env) ? env : stripSlash(SITE.url);
}

export async function getSite(): Promise<SiteIdentity> {
  const [settings, url] = await Promise.all([getGlobal("site-settings", 0), siteOrigin()]);
  return {
    name: settings?.name || SITE.name,
    legalName: settings?.legalName || SITE.legalName,
    tagline: settings?.tagline || SITE.tagline,
    locale: settings?.locale || SITE.locale,
    url,
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

/** `CONTACT`: the address lines, public email and phone from Site details. */
export async function getContact(): Promise<ContactDetails> {
  const contact = (await getGlobal("site-settings", 0))?.contact;
  if (!contact) return { ...CONTACT, addressLines: [...CONTACT.addressLines] };
  const lines = (contact.addressLines ?? []).map((row) => row.line).filter(Boolean);
  return {
    addressLines: lines,
    email: contact.email || null,
    phone: contact.phone || null,
  };
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
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
  return Boolean(contact.email || contact.phone || ENQUIRY_CONFIGURED);
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

type FaqRow = { group: FaqGroupKey; showOnHomepage: boolean; question: string; answerSource: "text" | "bookingTerms"; answer: string };

/**
 * Every published FAQ in `order`, with its rich-text answer already flattened
 * (the accordion prints text). A "booking terms" answer is resolved per read
 * by {@link getBookingTerms}, not cached here, so switching the booking mode
 * changes the FAQ without touching a question.
 */
const readFaqs = contentReader("faqs", [TAGS.faqs], async (draft) => {
  const docs = await findDocs("faqs", draft, { drafts: true, sort: "order", depth: 0 });
  return docs.map(
    (doc): FaqRow => ({
      group: doc.group,
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
