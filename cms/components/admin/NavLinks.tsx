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
 * "Docs" (/admin/docs, the owner's guide) comes first, on its own without a
 * group heading, and is shown to every role.
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

/** One sidebar link, marked up like Payload's own (active state included). */
function ViewLink({ href, id, label, pathname }: { href: string; id: string; label: string; pathname: string | null }) {
  const active = pathname === href || pathname?.startsWith(`${href}/`);
  const inner = (
    <>
      {active ? <div className="nav__link-indicator" /> : null}
      <span className="nav__link-label">{label}</span>
    </>
  );
  return pathname === href ? (
    <div className="nav__link" id={id}>
      {inner}
    </div>
  ) : (
    <Link className="nav__link" href={href} id={id} prefetch={false}>
      {inner}
    </Link>
  );
}

export function NavLinks() {
  const { user } = useAuth();
  const { config } = useConfig();
  const pathname = usePathname();
  const role = (user as { role?: Role } | null)?.role;
  if (!role) return null;
  const visible = LINKS.filter((l) => l.roles.includes(role));
  const groups = [...new Set(visible.map((l) => l.group))];

  return (
    <>
      {/* The guide: every role, first under the search so it is always in reach. */}
      <div className="mp-nav-docs">
        <ViewLink href={`${config.routes.admin}/docs`} id="nav-docs" label="Docs" pathname={pathname} />
      </div>
      {groups.map((group) => (
        <NavGroup key={group} label={group}>
          {visible
            .filter((l) => l.group === group)
            .map((l) => (
              <ViewLink key={l.id} href={`${config.routes.admin}${l.path}`} id={l.id} label={l.label} pathname={pathname} />
            ))}
        </NavGroup>
      ))}
    </>
  );
}
