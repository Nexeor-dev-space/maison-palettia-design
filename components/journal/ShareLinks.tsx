"use client";

import { useEffect, useState } from "react";

import { JOURNAL_COPY } from "@/components/journal/copy";
import { cn } from "@/lib/utils";

/**
 * Share a story: copy its address, or hand it to WhatsApp, Facebook or X.
 *
 * PLAIN LINKS, NO SCRIPTS. Each network's share page takes the address as
 * a query — no SDK, no tracking pixel, nothing of theirs on this site.
 * The links open in a new tab; the copy button is the one client-side
 * piece, and it degrades to a visible address when the clipboard is not
 * available (an insecure origin, an old browser).
 *
 * The absolute address comes from the server (Site details' public URL),
 * so the link somebody pastes is the one the sitemap and the share card
 * carry, whatever host the page was read on.
 */
export function ShareLinks({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  const text = encodeURIComponent(title);
  const href = encodeURIComponent(url);
  const targets = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${text}%20${href}`,
      icon: WhatsAppIcon,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${href}`,
      icon: FacebookIcon,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${href}&text=${text}`,
      icon: XIcon,
    },
  ];

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-3", className)}
    >
      <span className="text-label font-medium uppercase tracking-eyebrow text-text/75">
        {JOURNAL_COPY.shareLabel}
      </span>
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          <button
            type="button"
            onClick={copy}
            aria-live="polite"
            className={PILL}
          >
            <LinkIcon />
            {state === "copied"
              ? JOURNAL_COPY.copied
              : state === "failed"
                ? "Copy failed"
                : JOURNAL_COPY.copyLink}
          </button>
        </li>
        {targets.map(({ label, href: to, icon: Icon }) => (
          <li key={label}>
            <a
              href={to}
              target="_blank"
              rel="noopener noreferrer"
              className={PILL}
              aria-label={`Share on ${label}`}
            >
              <Icon />
              {label}
            </a>
          </li>
        ))}
      </ul>
      {state === "failed" ? (
        <p className="w-full text-fine text-text/75">
          Copy this address instead:{" "}
          <span className="select-all break-all">{url}</span>
        </p>
      ) : null}
    </div>
  );
}

const PILL =
  "press-in plate inline-flex min-h-[2.5rem] items-center gap-2 rounded-pill bg-surface px-4 py-2 text-label font-semibold uppercase tracking-eyebrow text-text transition-colors duration-300 ease-soft hover:bg-cream focus-visible:bg-cream";

const ICON = "h-4 w-4 shrink-0";

function LinkIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={ICON}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={ICON} fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={ICON} fill="currentColor">
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4a22 22 0 0 0-2.5-.1c-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={ICON} fill="currentColor">
      <path d="M17.5 3h3l-6.8 7.8L21.8 21h-6.2l-4.9-6.4L5.1 21h-3l7.3-8.3L1.7 3H8l4.4 5.8L17.5 3Zm-1.1 16.2h1.7L7.1 4.7H5.3l11.1 14.5Z" />
    </svg>
  );
}
