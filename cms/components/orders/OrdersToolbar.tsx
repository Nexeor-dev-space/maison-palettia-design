"use client";

import { useAuth, useConfig, useListQuery } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Icon } from "@/cms/components/admin/icons";
import { ListIntro } from "@/cms/components/admin/ListIntro";

import { CreateBookingDialog } from "./CreateBooking";

/**
 * ==========================================================================
 * OrdersToolbar — above the Orders list (SPEC §I "Orders UX")
 * ==========================================================================
 *
 * Three things the list itself does not give:
 *
 *   · one-click views with live counts — Needs attention (orders flagged
 *     `needsReview`), Confirmed, Awaiting payment, Desk, Refunded &
 *     cancelled, All — each a link that sets the list's own `where`, so
 *     search, columns and pagination keep working;
 *   · **Create desk booking**, which opens the dialog; `?desk=1` on the URL
 *     opens it straight away (the dashboard quick action and the ⌘K
 *     command use that);
 *   · a teaching empty state while there has never been an order.
 *
 * Counts come from `/api/orders/count?where…`, which runs the collection's
 * own read access, so they are exactly the rows the person could open.
 */

type View = { key: string; label: string; tone: "ok" | "lilac" | "warn" | "bad" | "muted"; query: string; title?: string };

const VIEWS: View[] = [
  { key: "review", label: "Needs attention", tone: "warn", query: "where[needsReview][equals]=true", title: "Something did not add up with the payment — open the order to see why and mark it resolved." },
  { key: "confirmed", label: "Confirmed", tone: "ok", query: "where[status][in]=confirmed,completed" },
  { key: "awaiting", label: "Awaiting payment", tone: "lilac", query: "where[status][in]=pending_payment,awaiting_payment,confirming", title: "Seats are held while the customer pays; the hold expires on its own." },
  { key: "desk", label: "Desk", tone: "muted", query: "where[channel][equals]=desk" },
  { key: "closed", label: "Refunded & cancelled", tone: "muted", query: "where[status][in]=refunded,cancelled" },
];

export function OrdersToolbar() {
  const { config } = useConfig();
  const { user } = useAuth();
  const { data } = useListQuery();
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = `${config.serverURL ?? ""}${config.routes.api}`;
  const listUrl = `${config.routes.admin}/collections/orders`;
  const isAdmin = (user as { role?: string } | null)?.role === "admin";
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(() => searchParams.get("desk") === "1");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        VIEWS.map(async (view) => {
          try {
            const res = await fetch(`${api}/orders/count?${view.query}`, { credentials: "include", cache: "no-store" });
            if (!res.ok) return [view.key, undefined] as const;
            const { totalDocs } = (await res.json()) as { totalDocs?: number };
            return [view.key, totalDocs] as const;
          } catch {
            return [view.key, undefined] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, number> = {};
      for (const [key, value] of entries) if (typeof value === "number") next[key] = value;
      setCounts(next);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [api, data?.totalDocs]);

  const current = searchParams.toString();
  const active = VIEWS.find((v) => current.includes(v.query.replace(/,/g, "%2C")) || current.includes(v.query))?.key ?? (current.includes("where") ? "custom" : "all");

  const closeDialog = () => {
    setOpen(false);
    if (searchParams.get("desk") === "1") router.replace(listUrl);
  };

  return (
    <>
      <div className="mp-toolbar">
        {VIEWS.map((view) =>
          view.key === "review" && !counts.review ? null : (
            <Link key={view.key} href={`${listUrl}?${view.query}`} className={`mp-chip mp-chip--${view.tone}`} aria-current={active === view.key ? "page" : undefined} title={view.title}>
              {view.label}
              {counts[view.key] !== undefined ? <strong>{counts[view.key]}</strong> : null}
            </Link>
          ),
        )}
        <Link href={listUrl} className="mp-chip mp-chip--plain" aria-current={active === "all" ? "page" : undefined}>
          All
        </Link>
        <span className="mp-toolbar__spacer" />
        <button type="button" className="mp-actions__btn mp-actions__btn--primary" onClick={() => setOpen(true)}>
          <Icon name="plus" size={14} />
          Create desk booking
        </button>
      </div>
      <ListIntro
        icon="bag"
        heading="No bookings yet"
        body="Online bookings appear here the moment a customer pays — seats, tickets and the invoice are handled for you. Walk-ins and phone bookings go in with “Create desk booking”. Nothing here is typed by hand: statuses move on their own, and refunds, moves and resends are actions on the order."
      />
      <CreateBookingDialog open={open} onClose={closeDialog} isAdmin={isAdmin} />
    </>
  );
}
