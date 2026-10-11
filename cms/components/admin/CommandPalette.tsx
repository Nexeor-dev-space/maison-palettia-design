"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Icon, type IconName } from "./icons";

/**
 * ==========================================================================
 * CommandPalette — ⌘K: search everything, jump anywhere (SPEC §I, 4B)
 * ==========================================================================
 *
 * Mounted through `admin.components.beforeNavLinks`, so the search box is
 * the first thing in the sidebar; ⌘K / Ctrl-K opens it from any page. The
 * overlay portals to <body> because the sidebar clips its overflow (and is
 * `inert` while closed on a phone).
 *
 * WHAT IT SEARCHES. Typing runs, in parallel and debounced, one REST query
 * per collection the signed-in role may read — pages, experiences,
 * sessions, journal posts, orders (reference, name, email, phone), customers, enquiries,
 * media, promo codes, staff, email templates — through Payload's own
 * `?where[or][…][like]=` so access control is Payload's, not a copy kept
 * here; a 403 is simply an empty group. Settings pages and the actions
 * ("Add a session", "Desk booking", "Check-in"…) are static entries matched
 * on their label and keywords.
 *
 * FIND TEXT. "Where is this sentence used?" is a different question: a
 * query that starts with a quote (or the Find-text chip) posts to
 * `/api/actions/find-text`, which walks every content document and global
 * for the phrase and answers with the document AND the field. Each hit
 * links to `…#field-<path>` — the hash the FocusListener (Phase 2) turns
 * into "scroll to that field, open its tab, highlight it".
 *
 * Nobody should have to know about the quote. For admins and editors the
 * list always ends with "Find “…” on the website" (switches to find-text
 * with the same words), and a query of three or more words also runs
 * find-text on its own in the background, so `reason to pause, connect`
 * lands on Brand wording without any syntax. "Nothing matches" is only
 * said once a search for exactly those words has answered — until then
 * the box says "Searching…".
 *
 * Recent picks are remembered per browser (localStorage) and shown while
 * the box is empty, so the second visit to an order is one keystroke.
 */

type Role = "admin" | "editor" | "front-desk";

type Item = {
  id: string;
  group: string;
  label: string;
  sub?: string;
  hint?: string;
  href: string;
  icon: IconName;
  /** Switches the palette into find-text mode instead of navigating ("text-keep": with the words already typed). */
  mode?: "text" | "text-keep";
};

type Source = {
  slug: string;
  group: string;
  icon: IconName;
  roles: Role[];
  fields: string[];
  draft?: boolean;
  depth?: number;
  label: (doc: Record<string, unknown>) => string;
  sub?: (doc: Record<string, unknown>) => string | undefined;
};

const str = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const pick = (doc: Record<string, unknown>, path: string): string => {
  const value = path.split(".").reduce<unknown>((cur, key) => (cur && typeof cur === "object" ? (cur as Record<string, unknown>)[key] : undefined), doc);
  return str(value);
};

const SOURCES: Source[] = [
  { slug: "pages", group: "Pages", icon: "page", roles: ["admin", "editor", "front-desk"], fields: ["title", "slug"], draft: true, label: (d) => str(d.title) || str(d.slug), sub: (d) => (d.slug === "home" ? "/" : `/${str(d.slug)}`) },
  { slug: "experiences", group: "Experiences", icon: "star", roles: ["admin", "editor", "front-desk"], fields: ["name", "slug", "description"], draft: true, label: (d) => str(d.name), sub: (d) => str(d.description).slice(0, 80) },
  {
    slug: "sessions",
    group: "Sessions",
    icon: "calendar",
    roles: ["admin", "editor", "front-desk"],
    fields: ["title", "slug", "category"],
    draft: true,
    depth: 1,
    label: (d) => str(d.title) || str((d.experience as Record<string, unknown> | undefined)?.name) || str(d.slug),
    sub: (d) => (typeof d.startsAt === "string" ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d.startsAt)) : undefined),
  },
  {
    slug: "posts",
    group: "Journal",
    icon: "pen",
    roles: ["admin", "editor", "front-desk"],
    fields: ["title", "slug", "excerpt"],
    draft: true,
    label: (d) => str(d.title) || str(d.slug),
    sub: (d) => `/journal/${str(d.slug)}`,
  },
  {
    slug: "orders",
    group: "Orders",
    icon: "bag",
    roles: ["admin", "front-desk"],
    fields: ["reference", "contact.email", "contact.lastName", "contact.firstName", "contact.phone"],
    label: (d) => `${pick(d, "reference")} · ${[pick(d, "contact.firstName"), pick(d, "contact.lastName")].filter(Boolean).join(" ") || pick(d, "contact.email")}`,
    sub: (d) => [str(d.status).replace(/_/g, " "), pick(d, "contact.email")].filter(Boolean).join(" · "),
  },
  { slug: "customers", group: "Customers", icon: "person", roles: ["admin", "front-desk"], fields: ["email", "firstName", "lastName", "phone"], label: (d) => [str(d.firstName), str(d.lastName)].filter(Boolean).join(" ") || str(d.email), sub: (d) => str(d.email) },
  { slug: "enquiries", group: "Enquiries", icon: "mail", roles: ["admin", "editor", "front-desk"], fields: ["name", "email", "message"], label: (d) => str(d.name), sub: (d) => `${str(d.status).replace(/_/g, " ")} · ${str(d.message).replace(/\s+/g, " ").slice(0, 70)}` },
  { slug: "media", group: "Media", icon: "image", roles: ["admin", "editor", "front-desk"], fields: ["filename", "alt", "caption"], label: (d) => str(d.alt) || str(d.filename), sub: (d) => str(d.filename) },
  { slug: "promo-codes", group: "Promo codes", icon: "ticket", roles: ["admin", "front-desk"], fields: ["code", "label"], label: (d) => str(d.code), sub: (d) => str(d.label) },
  { slug: "users", group: "Staff", icon: "users", roles: ["admin"], fields: ["name", "email"], label: (d) => str(d.name), sub: (d) => `${str(d.role)} · ${str(d.email)}` },
  { slug: "email-templates", group: "Email templates", icon: "mail", roles: ["admin", "editor"], fields: ["label", "subject"], label: (d) => str(d.label), sub: (d) => str(d.subject) },
];

type Static = { label: string; href: string; icon: IconName; group: string; roles: Role[]; keywords?: string; hint?: string; mode?: "text" };

const STATIC: Static[] = [
  { label: "Add a session", href: "/collections/sessions/create", icon: "plus", group: "Actions", roles: ["admin", "editor"], keywords: "new create date event workshop" },
  { label: "Write a journal post", href: "/collections/posts/create", icon: "pen", group: "Actions", roles: ["admin", "editor"], keywords: "new blog article story news journal write" },
  { label: "Create a desk booking", href: "/collections/orders?desk=1", icon: "bag", group: "Actions", roles: ["admin", "front-desk"], keywords: "manual order walk-in cash card" },
  { label: "Open check-in", href: "/check-in", icon: "check", group: "Actions", roles: ["admin", "front-desk"], keywords: "scan door tickets arrive attendees" },
  { label: "Invite a staff member", href: "/collections/users?invite=1", icon: "users", group: "Actions", roles: ["admin"], keywords: "user colleague editor front desk login" },
  { label: "Find this wording on the site…", href: "", icon: "text", group: "Actions", roles: ["admin", "editor"], keywords: "text sentence copy where phrase search wording", hint: "type “ then the words", mode: "text" },
  { label: "Analytics", href: "/analytics", icon: "chart", group: "Actions", roles: ["admin", "editor"], keywords: "visitors traffic sales stats report" },
  { label: "Pages", href: "/collections/pages", icon: "page", group: "Go to", roles: ["admin", "editor", "front-desk"] },
  { label: "Experiences", href: "/collections/experiences", icon: "star", group: "Go to", roles: ["admin", "editor", "front-desk"], keywords: "workshops activities" },
  { label: "Sessions", href: "/collections/sessions", icon: "calendar", group: "Go to", roles: ["admin", "editor", "front-desk"], keywords: "dates calendar events" },
  { label: "Journal", href: "/collections/posts", icon: "pen", group: "Go to", roles: ["admin", "editor", "front-desk"], keywords: "blog posts articles stories news" },
  { label: "Journal categories", href: "/collections/post-categories", icon: "pen", group: "Go to", roles: ["admin", "editor", "front-desk"], keywords: "blog sections topics" },
  { label: "Media", href: "/collections/media", icon: "image", group: "Go to", roles: ["admin", "editor", "front-desk"], keywords: "photos images pictures upload swap" },
  { label: "Orders", href: "/collections/orders", icon: "bag", group: "Go to", roles: ["admin", "front-desk"], keywords: "bookings refunds" },
  { label: "Customers", href: "/collections/customers", icon: "person", group: "Go to", roles: ["admin", "front-desk"] },
  { label: "Tickets", href: "/collections/tickets", icon: "ticket", group: "Go to", roles: ["admin", "front-desk"] },
  { label: "Refunds", href: "/collections/refunds", icon: "refund", group: "Go to", roles: ["admin", "front-desk"] },
  { label: "Invoices", href: "/collections/invoices", icon: "page", group: "Go to", roles: ["admin", "front-desk"], keywords: "vat tax credit note" },
  { label: "Enquiries", href: "/collections/enquiries", icon: "mail", group: "Go to", roles: ["admin", "editor", "front-desk"], keywords: "inbox messages contact" },
  { label: "Sent emails", href: "/collections/notification-log", icon: "send", group: "Go to", roles: ["admin", "front-desk"], keywords: "log notifications" },
  { label: "Email templates", href: "/collections/email-templates", icon: "mail", group: "Go to", roles: ["admin", "editor"] },
  { label: "Staff", href: "/collections/users", icon: "users", group: "Go to", roles: ["admin"], keywords: "users accounts" },
  { label: "Background tasks", href: "/collections/payload-jobs", icon: "bolt", group: "Go to", roles: ["admin"], keywords: "jobs queue failed retry" },
  { label: "Site details", href: "/globals/site-settings", icon: "settings", group: "Settings", roles: ["admin", "editor", "front-desk"], keywords: "name logo contact address socials public url" },
  { label: "Menus & footer", href: "/globals/navigation", icon: "settings", group: "Settings", roles: ["admin", "editor", "front-desk"], keywords: "navigation links" },
  { label: "Brand wording", href: "/globals/brand-copy", icon: "text", group: "Settings", roles: ["admin", "editor", "front-desk"], keywords: "tagline copy mission vision" },
  { label: "Booking & checkout wording", href: "/globals/booking-settings", icon: "settings", group: "Settings", roles: ["admin", "editor", "front-desk"], keywords: "bookings open closed message terms tickets" },
  { label: "Page labels", href: "/globals/template-copy", icon: "settings", group: "Settings", roles: ["admin", "editor", "front-desk"], keywords: "events policies 404" },
  { label: "Search & sharing defaults", href: "/globals/seo-defaults", icon: "search", group: "Settings", roles: ["admin", "editor", "front-desk"], keywords: "seo meta robots share image" },
  { label: "Payments (Mamo Pay)", href: "/globals/payment-settings", icon: "card", group: "Settings", roles: ["admin"], keywords: "mode live test mock webhook api key" },
  { label: "Email sending", href: "/globals/email-settings", icon: "mail", group: "Settings", roles: ["admin"], keywords: "smtp resend verify from address" },
  { label: "Invoices & VAT", href: "/globals/invoice-settings", icon: "page", group: "Settings", roles: ["admin"], keywords: "trn legal name tax" },
  { label: "Who gets notified", href: "/globals/notification-settings", icon: "send", group: "Settings", roles: ["admin"], keywords: "alerts recipients staff emails" },
  { label: "Analytics & tracking", href: "/globals/analytics-settings", icon: "chart", group: "Settings", roles: ["admin"], keywords: "ga4 consent cookies" },
];

const RECENT_KEY = "mp-cmdk-recent";
const MAX_RECENT = 8;

type Recent = Pick<Item, "label" | "sub" | "href" | "icon">;

function readRecent(): Recent[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as Recent[]) : [];
    return Array.isArray(list) ? list.filter((r) => r && typeof r.href === "string" && typeof r.label === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function pushRecent(item: Recent) {
  try {
    const next = [item, ...readRecent().filter((r) => r.href !== item.href)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private mode: not remembered */
  }
}

/** The matched words in bold lilac. */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (!words.length || !text) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return <>{text.split(re).map((part, i) => (words.includes(part.toLowerCase()) ? <mark key={i}>{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>))}</>;
}

type TextHit = { href: string; title: string; where: string; snippet: string; kind: string };

export function CommandPalette() {
  const { user } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const role = (user as { role?: Role } | null)?.role;
  const admin = `${config.serverURL ?? ""}${config.routes.admin}`;
  const api = `${config.serverURL ?? ""}${config.routes.api}`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [textMode, setTextMode] = useState(false);
  const [remote, setRemote] = useState<Item[]>([]);
  const [hits, setHits] = useState<TextHit[]>([]);
  const [busy, setBusy] = useState(false);
  // Which words the last finished searches answered for: "Nothing matches"
  // waits for these, and hits from an older query are never shown.
  const [answeredFor, setAnsweredFor] = useState("");
  const [hitsFor, setHitsFor] = useState("");
  const [textBusy, setTextBusy] = useState(false);
  const textSeq = useRef(0);
  const [selected, setSelected] = useState(0);
  const [recent, setRecent] = useState<Recent[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setTextMode(false);
    setRemote([]);
    setHits([]);
    setHitsFor("");
    setAnsweredFor("");
    setSelected(0);
  }, []);

  const openPalette = useCallback(() => {
    setRecent(readRecent());
    setOpen(true);
  }, []);

  // ⌘K / Ctrl-K anywhere in the admin; Esc closes.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else openPalette();
      } else if (event.key === "Escape" && open) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, openPalette]);

  // Focus the box once the overlay exists (a tick later: it portals in on this render).
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  /** Typing: new query, selection back to the top, stale results dropped as soon as the box is near-empty. */
  const onQueryChange = (value: string) => {
    setQuery(value);
    setSelected(0);
    if (value.trim().replace(/^[“"]/, "").trim().length < 2) {
      setRemote([]);
      setHits([]);
    }
  };

  const effectiveText = textMode || query.trim().startsWith("“") || query.trim().startsWith('"');
  const needle = query.trim().replace(/^[“"]/, "").replace(/[”"]$/, "").trim();
  const canFindText = role === "admin" || role === "editor";
  // Three or more words reads like a sentence from the site: look for it there too.
  const autoText = !effectiveText && canFindText && needle.split(/\s+/).filter(Boolean).length >= 3;

  // Search, debounced; the sequence number drops answers that arrive late.
  // State is only touched inside the timer callback, never in the effect body.
  useEffect(() => {
    if (!open || !role || needle.length < 2) return;
    const id = ++seq.current;
    const timer = window.setTimeout(async () => {
      setBusy(true);
      if (effectiveText) {
        try {
          const res = await fetch(`${api}/actions/find-text`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: needle }) });
          const data = (await res.json().catch(() => ({}))) as { hits?: TextHit[] };
          if (seq.current === id) setHits(res.ok ? (data.hits ?? []) : []);
        } catch {
          if (seq.current === id) setHits([]);
        } finally {
          if (seq.current === id) {
            setHitsFor(needle);
            setAnsweredFor(`text:${needle}`);
            setBusy(false);
          }
        }
        return;
      }
      const sources = SOURCES.filter((s) => s.roles.includes(role));
      const results = await Promise.all(
        sources.map(async (source) => {
          const params = new URLSearchParams({ limit: "5", depth: String(source.depth ?? 0) });
          if (source.draft) params.set("draft", "true");
          source.fields.forEach((field, i) => params.set(`where[or][${i}][${field}][like]`, needle));
          try {
            const res = await fetch(`${api}/${source.slug}?${params.toString()}`, { credentials: "include", cache: "no-store" });
            if (!res.ok) return [] as Item[];
            const data = (await res.json()) as { docs?: Array<Record<string, unknown>> };
            return (data.docs ?? []).map<Item>((doc) => ({
              id: `${source.slug}:${String(doc.id)}`,
              group: source.group,
              label: source.label(doc) || "Untitled",
              sub: source.sub?.(doc),
              href: `/collections/${source.slug}/${String(doc.id)}`,
              icon: source.icon,
            }));
          } catch {
            return [] as Item[];
          }
        }),
      );
      if (seq.current === id) {
        setRemote(results.flat());
        setAnsweredFor(`all:${needle}`);
        setBusy(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [open, role, needle, effectiveText, api]);

  // The background sentence search (3+ words, admins and editors). Slower to
  // answer (it reads every page), so a longer pause before it starts and its
  // own sequence number; its hits join the list under "Found on the site".
  useEffect(() => {
    if (!open || !autoText) return;
    const id = ++textSeq.current;
    const timer = window.setTimeout(async () => {
      setTextBusy(true);
      try {
        const res = await fetch(`${api}/actions/find-text`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: needle }) });
        const data = (await res.json().catch(() => ({}))) as { hits?: TextHit[] };
        if (textSeq.current === id) {
          setHits(res.ok ? (data.hits ?? []) : []);
          setHitsFor(needle);
        }
      } catch {
        /* the "Find … on the website" row is still there to try again */
      } finally {
        if (textSeq.current === id) setTextBusy(false);
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [open, autoText, needle, api]);

  const items = useMemo<Item[]>(() => {
    if (!role) return [];
    const textHits = hitsFor === needle ? hits.map<Item>((hit, i) => ({ id: `text:${i}`, group: "Found on the site", label: hit.title, sub: `${hit.where} — “${hit.snippet}”`, hint: hit.kind, href: hit.href, icon: "text" })) : [];
    if (effectiveText) return textHits;
    const words = needle.toLowerCase().split(/\s+/).filter(Boolean);
    const statics = STATIC.filter((s) => s.roles.includes(role))
      .filter((s) => !words.length || words.every((w) => `${s.label} ${s.keywords ?? ""} ${s.group}`.toLowerCase().includes(w)))
      .map<Item>((s) => ({ id: `static:${s.href || s.label}`, group: s.group, label: s.label, hint: s.hint, href: s.href, icon: s.icon, mode: s.mode }));
    if (!words.length) {
      const recents = recent.map<Item>((r, i) => ({ id: `recent:${i}`, group: "Recent", label: r.label, sub: r.sub, href: r.href, icon: r.icon }));
      return [...recents, ...statics.filter((s) => s.group === "Actions")];
    }
    const order = ["Found on the site", "Actions", "Pages", "Experiences", "Sessions", "Orders", "Customers", "Enquiries", "Media", "Promo codes", "Settings", "Go to", "Staff", "Email templates"];
    const found = [...statics, ...remote, ...(autoText ? textHits : [])].sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
    // Always the last row for content staff: the same words, searched as website wording.
    if (canFindText && needle.length >= 3) {
      found.push({
        id: "find-text-fallback",
        group: "Website wording",
        label: `Find “${needle.length > 48 ? `${needle.slice(0, 48)}…` : needle}” on the website`,
        hint: autoText && textBusy ? "Searching…" : "every page and setting",
        href: "",
        icon: "text",
        mode: "text-keep",
      });
    }
    return found;
  }, [role, effectiveText, hits, hitsFor, needle, recent, remote, autoText, canFindText, textBusy]);

  const current = Math.min(selected, Math.max(0, items.length - 1));

  const choose = useCallback(
    (item: Item) => {
      if (item.mode === "text" || item.mode === "text-keep") {
        setTextMode(true);
        // "text-keep": search the words already typed (the search effect runs at once).
        setQuery(item.mode === "text-keep" ? needle : "");
        setRemote([]);
        setSelected(0);
        inputRef.current?.focus();
        return;
      }
      // Find-text hits arrive with the admin route already on them; everything else is relative to it.
      const href = item.href.startsWith("http") || item.href.startsWith(`${config.routes.admin}/`) ? item.href : `${admin}${item.href}`;
      pushRecent({ label: item.label, sub: item.sub, href: item.href, icon: item.icon });
      close();
      router.push(href);
    },
    [admin, close, router, config.routes.admin, needle],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected(Math.min(items.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected(Math.max(0, current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[current];
      if (item) choose(item);
    } else if (event.key === "Backspace" && !query && textMode) {
      setTextMode(false);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${current}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [current]);

  if (!role) return null;

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  let lastGroup = "";
  return (
    <>
      <button type="button" className="mp-cmdk-trigger" onClick={openPalette} aria-label="Search the admin (Command K)">
        <Icon name="search" />
        <span>Search or jump to…</span>
        <kbd>{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      {open
        ? createPortal(
            <div className="mp-cmdk" role="dialog" aria-modal="true" aria-label="Search the admin" onMouseDown={(e) => e.target === e.currentTarget && close()}>
              <div className="mp-cmdk__panel">
                <div className="mp-cmdk__search">
                  <Icon name={effectiveText ? "text" : "search"} size={18} />
                  {textMode ? (
                    <button
                      type="button"
                      className="mp-chip mp-chip--lilac mp-chip--plain"
                      onClick={() => {
                        setTextMode(false);
                        setHits([]);
                      }}
                      title="Back to searching everything"
                    >
                      Find text ×
                    </button>
                  ) : null}
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={effectiveText ? "Type a few words as they appear on the site…" : "Search orders, sessions, pages, people… or type a command"}
                    aria-label="Search"
                    aria-activedescendant={items[current] ? `mp-cmdk-${items[current].id}` : undefined}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {busy ? <span className="mp-cmdk__hint">Searching…</span> : null}
                </div>
                <div className="mp-cmdk__list" ref={listRef} role="listbox" aria-label="Results" tabIndex={-1}>
                  {items.length === 0 ? (
                    <div className="mp-cmdk__empty">
                      {needle.length < 2 ? (
                        <>
                          <strong>{effectiveText ? "Find a sentence" : "Start typing"}</strong>
                          {effectiveText ? "Paste or type a few words exactly as they appear on the site; each match shows the page and the field it lives in." : "A booking reference, a customer's email, a session, a page, a setting — or an action like “desk booking”."}
                        </>
                      ) : busy || answeredFor !== `${effectiveText ? "text" : "all"}:${needle}` ? (
                        <>Searching…</>
                      ) : (
                        <>
                          <strong>Nothing matches “{needle}”</strong>
                          {effectiveText ? "Try fewer words — the search looks for the exact run of words." : "Try an order reference (MP-…), a name, an email, or a page title."}
                        </>
                      )}
                    </div>
                  ) : (
                    items.map((item, index) => {
                      const heading = item.group !== lastGroup ? <div className="mp-cmdk__group" key={`g-${item.group}-${index}`}>{item.group}</div> : null;
                      lastGroup = item.group;
                      return (
                        <React.Fragment key={item.id}>
                          {heading}
                          <button
                            type="button"
                            id={`mp-cmdk-${item.id}`}
                            className="mp-cmdk__item"
                            role="option"
                            aria-selected={index === current}
                            data-index={index}
                            onMouseEnter={() => setSelected(index)}
                            onClick={() => choose(item)}
                          >
                            <Icon name={item.icon} />
                            <span className="mp-cmdk__label">
                              <Highlight text={item.label} query={effectiveText ? "" : needle} />
                              {item.sub ? (
                                <small>
                                  <Highlight text={item.sub} query={needle} />
                                </small>
                              ) : null}
                            </span>
                            {item.hint ? <span className="mp-cmdk__hint">{item.hint}</span> : <span className="mp-cmdk__hint">{index === current ? "↵" : ""}</span>}
                          </button>
                        </React.Fragment>
                      );
                    })
                  )}
                </div>
                <div className="mp-cmdk__foot">
                  <span>
                    <kbd>↑↓</kbd>move
                  </span>
                  <span>
                    <kbd>↵</kbd>open
                  </span>
                  <span>
                    <kbd>esc</kbd>close
                  </span>
                  {role !== "front-desk" ? (
                    <span>
                      <kbd>“</kbd>find wording on the site
                    </span>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
