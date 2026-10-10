"use client";

import { useConfig, useListQuery } from "@payloadcms/ui";
import Link from "next/link";
import React from "react";

import { Icon, type IconName } from "./icons";

/**
 * ==========================================================================
 * ListIntro — the empty state that teaches (SPEC §I, 4B)
 * ==========================================================================
 *
 * Payload's empty list says "No Orders found" and offers "Create new",
 * which for a collection the system fills (orders, tickets, invoices) is
 * the wrong lesson. This sits above the table through
 * `admin.components.beforeListTable` with its copy in `clientProps`, and
 * shows ONLY when the list is genuinely empty — no search, no filter, zero
 * rows — so a filtered list that happens to be empty still reads as
 * "nothing matches", not "you have never had an order".
 *
 * `actions` are links; `/admin` is prepended unless the href is absolute.
 */

export type ListIntroProps = {
  heading: string;
  body: string;
  icon?: IconName;
  actions?: Array<{ label: string; href: string; primary?: boolean }>;
};

export function ListIntro({ heading, body, icon = "star", actions = [] }: ListIntroProps) {
  const { data, query } = useListQuery();
  const { config } = useConfig();
  const admin = config.routes.admin;
  const filtered = Boolean(query?.search) || Boolean(query?.where && Object.keys(query.where as object).length);
  if (!data || data.totalDocs !== 0 || filtered) return null;

  return (
    <div className="mp-intro" role="note">
      <div className="mp-intro__icon">
        <Icon name={icon} size={22} />
      </div>
      <div>
        <h3>{heading}</h3>
        <p>{body}</p>
        {actions.length ? (
          <div className="mp-intro__actions">
            {actions.map((a) => (
              <Link key={a.href} className={`mp-actions__btn${a.primary ? " mp-actions__btn--primary" : ""}`} href={a.href.startsWith("http") || a.href.startsWith(admin) ? a.href : `${admin}${a.href}`}>
                {a.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
