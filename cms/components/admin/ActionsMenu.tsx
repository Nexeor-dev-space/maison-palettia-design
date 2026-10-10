"use client";

import { Popup, PopupList } from "@payloadcms/ui";
import React from "react";

import { Icon, type IconName } from "./icons";

/**
 * ==========================================================================
 * ActionsMenu — "Actions ▾" in the document bar (orders, sessions, people)
 * ==========================================================================
 *
 * The document bar beside Save is narrow, so every action a record offers
 * sits behind one round button with a menu (Payload's own Popup, so it
 * portals and positions itself). Items are plain `{ label, onClick }`;
 * `danger` tints the destructive ones, `href` makes a link, `divider`
 * separates groups. The actions themselves live with their collection:
 * cms/components/orders/OrderActions.tsx, cms/components/sessions/
 * SessionActions.tsx.
 */

export type MenuItem =
  | { divider: true }
  | {
      label: string;
      hint?: string;
      icon?: IconName;
      onClick?: () => void;
      href?: string;
      danger?: boolean;
      disabled?: boolean;
    };

export function ActionsMenu({ items, label = "Actions", primary }: { items: MenuItem[]; label?: string; primary?: { label: string; icon?: IconName; onClick: () => void } }) {
  const visible = items.filter((item, i, all) => !("divider" in item) || (i > 0 && i < all.length - 1 && !("divider" in all[i - 1])));
  return (
    <span className="mp-actions">
      {primary ? (
        <button type="button" className="mp-actions__btn mp-actions__btn--primary" onClick={primary.onClick}>
          {primary.icon ? <Icon name={primary.icon} size={14} /> : null}
          {primary.label}
        </button>
      ) : null}
      {visible.length ? (
        <Popup
          buttonType="custom"
          horizontalAlign="right"
          size="medium"
          portalClassName="mp-actions__popup"
          button={
            <span className="mp-actions__btn">
              {label}
              <Icon name="arrow" size={12} className="mp-actions__chev" />
            </span>
          }
          render={({ close }) => (
            <PopupList.ButtonGroup>
              {visible.map((item, i) =>
                "divider" in item ? (
                  <div key={`d${i}`} className="mp-actions__sep" />
                ) : (
                  <PopupList.Button
                    key={item.label}
                    href={item.href}
                    disabled={item.disabled}
                    className={item.danger ? "mp-actions__danger" : undefined}
                    onClick={() => {
                      close();
                      item.onClick?.();
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {item.icon ? <Icon name={item.icon} size={14} /> : null}
                      <span>
                        {item.label}
                        {item.hint ? <span style={{ display: "block", fontSize: 11, opacity: 0.7, fontWeight: 400 }}>{item.hint}</span> : null}
                      </span>
                    </span>
                  </PopupList.Button>
                ),
              )}
            </PopupList.ButtonGroup>
          )}
        />
      ) : null}
    </span>
  );
}
