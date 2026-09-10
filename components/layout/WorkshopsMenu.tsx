"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { Discipline } from "@/types";

interface WorkshopsMenuProps {
  label: string;
  href: string;
  disciplines: Discipline[];
  isActive: boolean;
  linkClassName: string;
}

/**
 * The Workshops entry, which opens onto the studio's four creative strands.
 *
 * The point of it is discovery, not navigation. "Workshops" on its own asks a
 * visitor to take it on faith that there is something for them behind the
 * word; four photographs and four short lines answer that before they have
 * clicked anything, which is the whole job the header was failing at.
 *
 * It is not a mega-menu. There are no prices, no dates, no counts and no
 * columns of links — four doors with a picture each, and one line out to the
 * full listing. The strands come from {@link Discipline}, the same data the
 * homepage section reads, so the menu cannot drift from the page.
 *
 * Behaviour, in the order it matters:
 *
 * - Trigger is a <button> with `aria-expanded`. It is a disclosure, not a
 *   link, so it never navigates on click and never traps someone who only
 *   wanted the listing — the listing is the last item inside.
 * - Opens on hover for a mouse and on focus for a keyboard, closes on Escape,
 *   on leaving the whole region, and on any click outside it.
 * - Escape returns focus to the trigger, so a keyboard visitor is put back
 *   where they were rather than at the top of the document.
 */
export function WorkshopsMenu({
  label,
  href,
  disciplines,
  isActive,
  linkClassName,
}: WorkshopsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const region = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      trigger.current?.focus();
    };

    // A click anywhere else dismisses it — including on the page behind, which
    // is what someone expects when they have decided against the menu.
    const onPointerDown = (event: PointerEvent) => {
      if (!region.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={region}
      className="static"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      // Fires when focus leaves the region entirely, which is how a keyboard
      // visitor tabbing past the last strand closes it.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsOpen(false);
      }}
      onFocus={() => setIsOpen(true)}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(linkClassName, "cursor-pointer", isActive && "underline")}
      >
        {label}
      </button>

      {/*
        Full-bleed rather than a floating card. A panel hanging under one word
        would be a component sitting on the page; a field that runs the width
        of the screen reads as the page opening up, which is the register the
        rest of the site is in. Hidden from the tree when closed so its links
        stay out of the tab order.
      */}
      <div
        id={menuId}
        hidden={!isOpen}
        className="absolute inset-x-0 top-full border-t border-white/10 bg-text"
      >
        <div className="mx-auto w-full px-gutter py-12 lg:py-14">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-10">
            {disciplines.map((strand) => (
              <li key={strand.slug}>
                <Link
                  href={strand.href}
                  className="group block"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="relative aspect-[5/4] w-full overflow-hidden bg-white/5">
                    <Image
                      src={strand.image.src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 22vw, 44vw"
                      className="object-cover transition-transform duration-[1200ms] ease-editorial motion-safe:group-hover:scale-[1.04]"
                    />
                  </div>

                  <p className="mt-4 text-sm font-medium uppercase tracking-eyebrow text-white transition-colors duration-300 ease-soft group-hover:text-sage">
                    {strand.name}
                  </p>
                  {/* White at 70% measures 5.9:1 on charcoal — clear of the
                      4.5:1 this size owes. */}
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-white/70">
                    {strand.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/*
            The way through to everything. Last, because the strands are the
            answer to "what could I do here" and this is the answer to "show
            me all of it" — which is the smaller question at this moment.
          */}
          <Link
            href={href}
            onClick={() => setIsOpen(false)}
            className="group mt-12 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-white"
          >
            <span className="border-b border-sage/50 pb-1.5 transition-colors duration-300 ease-soft group-hover:border-sage">
              See all workshops
            </span>
            <span
              aria-hidden
              className="text-sage transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
            >
              &#8594;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
