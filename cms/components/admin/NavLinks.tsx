"use client";

import { Link, NavGroup, useAuth, useConfig } from "@payloadcms/ui";
import { usePathname } from "next/navigation";
import React from "react";

/**
 * ==========================================================================
 * NavLinks — the custom views in the admin sidebar (SPEC §I)
 * ==========================================================================
 *
 * Mounted in `admin.components.beforeNavLinks`, right after the search. Payload lists collections
 * and globals by itself, but custom views (`/admin/check-in`, later
 * `/admin/analytics`) have no sidebar entry unless one is rendered here.
 * The markup copies Payload's own nav links (`nav__link`,
 * `nav__link-indicator`, `nav__link-label`) so the entries look and behave
 * like the rest of the sidebar, active state included.
 *
 * Each link is shown only to the roles that may open the view (§J) —
 * hiding is a courtesy; the view and its endpoints check the role again.
 *
 * P4 4C: "Analytics" sits in its own "Reports" group. Since the 4B review
 * both groups render BEFORE Payload's own (they used to be moved there with
 * CSS `order`, which left keyboard focus in a different order from the
 * screen): the two places the owner and the front desk go first are at the
 * top, in the DOM and on screen alike.
 */

type Role = "admin" | "editor" | "front-desk";

const LINKS: Array<{ path: `/${string}`; label: string; id: string; group: string; roles: Role[] }> = [
  { path: "/check-in", label: "Check-in", id: "nav-check-in", group: "Front desk", roles: ["admin", "front-desk"] },
  { path: "/analytics", label: "Analytics", id: "nav-analytics", group: "Reports", roles: ["admin", "editor"] },
];

export function NavLinks() {
  const { user } = useAuth();
  const { config } = useConfig();
  const pathname = usePathname();
  const role = (user as { role?: Role } | null)?.role;
  const visible = LINKS.filter((l) => role && l.roles.includes(role));
  if (visible.length === 0) return null;
  const groups = [...new Set(visible.map((l) => l.group))];

  return (
    <>
      {groups.map((group) => (
        <NavGroup key={group} label={group}>
          {visible.filter((l) => l.group === group).map((l) => {
            const href = `${config.routes.admin}${l.path}`;
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            const label = (
              <>
                {active ? <div className="nav__link-indicator" /> : null}
                <span className="nav__link-label">{l.label}</span>
              </>
            );
            return pathname === href ? (
              <div key={l.id} className="nav__link" id={l.id}>
                {label}
              </div>
            ) : (
              <Link key={l.id} className="nav__link" href={href} id={l.id} prefetch={false}>
                {label}
              </Link>
            );
          })}
        </NavGroup>
      ))}
    </>
  );
}
