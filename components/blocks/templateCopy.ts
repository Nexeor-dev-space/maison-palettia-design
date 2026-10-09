import { cache } from "react";

import { resolveLink } from "@/cms/fields/link";
import { getGlobal } from "@/lib/cms/query";
import type { NavItem } from "@/types";

/**
 * ==========================================================================
 * Page labels for the fixed templates (SPEC §E.3, §C.3 `template-copy`)
 * ==========================================================================
 *
 * The event, programme and policy pages are not block pages: their shape is
 * the template's, and their fixed words — "Date", "Where It Happens", "More
 * Events", "All policies" — live in Settings → Page labels (`template-copy`)
 * and the event page's foot bar in Booking & checkout wording
 * (`booking-settings.utilityBars`). These read them, through the data layer's
 * draft-aware, cached `getGlobal` (lib/cms/query.ts, tag `global:template-copy`
 * / `global:booking-settings`).
 *
 * A label an editor clears falls back to the wording below, which is what the
 * templates printed before the CMS (and what the seed writes): a fact table
 * with a blank term is a broken page, not a choice.
 *
 * ONE READ PER REQUEST, MANY READERS. The templates are a page component and
 * a dozen small server components under it, most of them synchronous. Rather
 * than thread a `copy` prop through every one, the page reads the labels once
 * and parks them in a request-scoped holder (`React.cache`), and each
 * component reads the holder — `eventCopy()` — while it renders in the same
 * request.
 */

const EVENT_DETAIL = {
  breadcrumbRoot: "Events",
  whenTerm: "Date",
  timeTerm: "Time",
  durationTerm: "Duration",
  whereTerm: "Location",
  priceTerm: "Price",
  perPersonLabel: "per person",
  howItRunsTerm: "Experience",
  statusTerm: "Status",
  aboutHeading: "About This Experience",
  locationHeadingScheduled: "Where It Happens",
  locationHeadingDiy: "Your Next Creative Stop.",
  directionsNote: "Full directions for this centre are confirmed with your booking.",
  moreEventsHeading: "More Events",
  soloEyebrow: "Scheduled session",
  soloCta: "View this session",
};

const PROGRAMME_DETAIL = {
  eyebrow: "Who it is for",
  activitiesHeading: "Pick Your Creative",
  activitiesLead:
    "Choose from the Maison’s creative experiences, or let us help you find the one that fits your group, occasion and vibe.",
  stepsEyebrow: "How it works",
  closeHeading: "Let’s Make It Happen.",
  ctaPrimaryLabel: "Enquire about a session",
  ctaSecondaryLabel: "Start an enquiry",
};

const POLICY_DETAIL = {
  eyebrow: "Policy",
  backLabel: "All policies",
  closeHeading: "Still Wondering?",
  closeBody: "If anything here does not cover what you need, ask us before you book.",
  closeCta: "Ask the Maison",
};

export type EventDetailCopy = typeof EVENT_DETAIL;
export type ProgrammeDetailCopy = typeof PROGRAMME_DETAIL;
export type PolicyDetailCopy = typeof POLICY_DETAIL;

/** The stored labels over the defaults, key by key; an empty label keeps the default. */
function over<T extends Record<string, string>>(defaults: T, stored: Partial<Record<keyof T, string | null>> | null | undefined): T {
  const out = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = stored?.[key];
    if (typeof value === "string" && value.trim() !== "") out[key] = value as T[keyof T];
  }
  return out;
}

const holder = cache(() => ({
  event: EVENT_DETAIL,
  programme: PROGRAMME_DETAIL,
  policy: POLICY_DETAIL,
}));

/** Reads Page labels for this request; call once at the top of a template page. */
export async function loadTemplateCopy(): Promise<void> {
  const copy = await getGlobal("template-copy", 0);
  const scope = holder();
  scope.event = over(EVENT_DETAIL, copy?.eventDetail);
  scope.programme = over(PROGRAMME_DETAIL, copy?.programmeDetail);
  scope.policy = over(POLICY_DETAIL, copy?.policyDetail);
}

export const eventCopy = (): EventDetailCopy => holder().event;
export const programmeCopy = (): ProgrammeDetailCopy => holder().programme;
export const policyCopy = (): PolicyDetailCopy => holder().policy;

/** The note and links at the foot of the event page (Booking & checkout wording → "More from…" bars). */
export async function eventUtilityBar(fallback: { note: string; links: NavItem[] }): Promise<{ note?: string; links: NavItem[] }> {
  const settings = await getGlobal("booking-settings", 0);
  const bar = (settings as { utilityBars?: { eventDetail?: StoredBar } } | null)?.utilityBars?.eventDetail;
  if (!bar) return fallback;
  const links = (bar.links ?? [])
    .map((row) => {
      const href = resolveLink(row.link);
      return href && row.label ? { label: row.label, href } : null;
    })
    .filter((link): link is NavItem => link !== null);
  return { note: bar.note?.trim() || undefined, links: links.length ? links : fallback.links };
}

type StoredBar = {
  note?: string | null;
  links?: Array<{ label?: string | null; link?: { type?: "internal" | "external" | null; url?: string | null; anchor?: string | null } | null }> | null;
};

/**
 * A one-line label set as a script heading in lines: an editor's own breaks
 * (" | ", the mark Page labels uses for a line break) win; otherwise the last
 * word drops to its own line — "Still / Wondering?", "Let’s Make It / Happen."
 * — which is how the templates broke these headings by hand.
 */
export function labelLines(label: string): string[] {
  if (label.includes("|")) return label.split("|").map((line) => line.trim()).filter(Boolean);
  const words = label.trim().split(/\s+/);
  if (words.length < 2) return [label.trim()];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}
