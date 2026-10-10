import React from "react";

/**
 * The handful of line icons the 4B components share (dashboard quick
 * actions, the command palette, the teaching empty states). Plain SVG at
 * 24 units, stroke 1.9, `currentColor` — the same drawing rules as the
 * sidebar icons in app/(payload)/custom.scss, so the admin has one icon
 * voice. No hooks and no "use client": the same file renders in server
 * and client trees.
 */

export type IconName =
  | "plus"
  | "home"
  | "image"
  | "refund"
  | "send"
  | "users"
  | "card"
  | "check"
  | "chart"
  | "search"
  | "page"
  | "star"
  | "calendar"
  | "bag"
  | "person"
  | "mail"
  | "settings"
  | "text"
  | "arrow"
  | "clock"
  | "alert"
  | "ticket"
  | "bolt"
  | "repeat"
  | "move"
  | "pen";

const PATHS: Record<IconName, React.ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M21 16l-5-5-8 9" />
    </>
  ),
  refund: (
    <>
      <path d="M3 10h12a4 4 0 0 1 0 8H9" />
      <path d="M7 6l-4 4 4 4" />
    </>
  ),
  send: (
    <>
      <path d="M21 4L11 14" />
      <path d="M21 4l-7 17-3-7-7-3z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 15.5a5 5 0 0 1 5.5 4.5" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" />,
  chart: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15l3-4 3 2 5-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  page: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </>
  ),
  star: <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.3 6.7 19.1l1.1-5.8L3.5 9.2l5.9-.8z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  bag: (
    <>
      <path d="M6 4h12l1 16H5z" />
      <path d="M9 8a3 3 0 0 0 6 0" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  mail: (
    <>
      <path d="M4 6h16v12H4z" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  text: <path d="M4 6h16M8 6v14M16 6v14M4 20h8M12 20h8" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v4M12 18h.01" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V4H4z" />
      <path d="M12 4v12" strokeDasharray="2 2" />
    </>
  ),
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  repeat: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  move: (
    <>
      <path d="M5 9l4-4 4 4M9 5v14" />
      <path d="M19 15l-4 4-4-4" />
    </>
  ),
  pen: (
    <>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
};

export function Icon({ name, size = 16, className, title }: { name: IconName; size?: number; className?: string; title?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
