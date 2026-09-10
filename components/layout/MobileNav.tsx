"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { BookAction } from "@/components/layout/BookAction";
import { cn } from "@/lib/utils";
import type { Discipline, NavItem } from "@/types";

interface MobileNavProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  disciplines: Discipline[];
  isActive: (href: string) => boolean;
}

/**
 * The mobile navigation, as a full-height editorial overlay.
 *
 * It was a drawer: a short white panel under the bar holding six links at body
 * size and the action last, which told a visitor nothing about what the studio
 * does and buried the one thing most of them came to do. This is the same
 * information given the whole screen — the four strands first, as pictures,
 * then the action, then the rest of the site in small type underneath.
 *
 * Order is the argument. Someone opening this menu on a phone is deciding
 * whether to spend a Saturday here, so what they see first is what a Saturday
 * here looks like, and the second thing is how to book one.
 *
 * The panel takes the charcoal ground so the bar above it does not change
 * colour when it opens; the two read as one field. Scroll locking and the
 * Escape key are owned by the bar, which is where the open state lives.
 */
export function MobileNav({
  id,
  isOpen,
  onClose,
  items,
  disciplines,
  isActive,
}: MobileNavProps) {
  // A route change from inside the overlay should close it. The links call
  // `onClose` directly, but a browser back/forward while it is open would
  // otherwise leave it covering the page it returned to.
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("popstate", onClose);
    return () => window.removeEventListener("popstate", onClose);
  }, [isOpen, onClose]);

  return (
    <div
      id={id}
      hidden={!isOpen}
      className="fixed inset-x-0 bottom-0 top-header overflow-y-auto bg-text md:top-header-lg lg:hidden"
    >
      <div className="px-gutter pb-16 pt-10">
        {/* 01 — what you could do here. */}
        <nav aria-label="Creative strands">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8">
            {disciplines.map((strand) => (
              <li key={strand.slug}>
                <Link href={strand.href} onClick={onClose} className="group block">
                  <div className="relative aspect-[5/4] w-full overflow-hidden bg-white/5">
                    <Image
                      src={strand.image.src}
                      alt=""
                      fill
                      sizes="46vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-3 text-[0.8rem] font-medium uppercase tracking-eyebrow text-white">
                    {strand.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 02 — the action, given a rule of its own so it is not one of a list. */}
        <div className="mt-12 border-y border-white/15 py-7">
          <BookAction size="panel" onNavigate={onClose} />
        </div>

        {/* 03 — the rest of the site. */}
        <nav aria-label="Primary" className="mt-10">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "block py-3.5 text-[1.35rem] font-light uppercase tracking-[0.02em]",
                    "transition-colors duration-300 ease-soft hover:text-sage",
                    isActive(item.href) ? "text-sage" : "text-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
