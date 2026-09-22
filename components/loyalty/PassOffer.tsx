"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { passLineSlug, toPassCartLine, useCart } from "@/lib/cart";
import { cn, formatMoney } from "@/lib/utils";
import type { Pass } from "@/types";

const TERM = "text-label font-medium uppercase tracking-eyebrow text-text/75";

/**
 * The offer: the passes, and the one action on each of them.
 *
 * AN INDEX, NOT A PRICING TABLE. Three equal columns with three prices across
 * the top is the shape every subscription page on the internet has, and it
 * turns an offer into a comparison — which is the wrong question here, because
 * these are three sizes of the same thing rather than three tiers of service.
 * So the passes run down the page as numbered entries with a hairline between
 * them, the way the events index and the creative strands already do: each one
 * is read on its own terms, and nothing is marked "best value" or "most
 * popular" because nothing here has been agreed with the studio and a badge
 * like that is an invented claim either way.
 *
 * ONE BASKET. The action writes a line into the same store the booking step
 * writes to (lib/cart.ts) and sends the visitor to the same `/checkout`. There
 * is no loyalty cart, no loyalty checkout and no account: a pass is another
 * thing in the booking, and everything downstream already knows what to do
 * with it.
 *
 * A client component because the basket lives in the browser. It is handed
 * plain {@link Pass} objects as props and imports nothing from lib/passes.ts —
 * that module holds the catalogue, and importing it here would pull the whole
 * of it into the browser bundle. Same reasoning as the note at the foot of
 * lib/utils.ts, and as <EventBookingBar>.
 */
export function PassOffer({ passes }: { passes: Pass[] }) {
  const { lines, setLine } = useCart();
  /** The pass the last successful add was for, so only its row confirms. */
  const [added, setAdded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  if (passes.length === 0) return <NoPasses />;

  function add(pass: Pass) {
    /*
      Adding one more rather than setting one, because `setLine` replaces a
      line by slug: without reading what is already held, pressing the button
      twice would leave a single pass in the basket and look broken.
    */
    const held = lines.find((line) => line.slug === passLineSlug(pass.slug));
    const line = toPassCartLine(pass, (held?.quantity ?? 0) + 1);

    if (!line) {
      // The only failure a browser can actually detect here: a pass with no
      // price on it. See `toPassCartLine` — nothing is invented to cover it.
      setAdded(null);
      setFailed(pass.slug);
      return;
    }

    setLine(line);
    setFailed(null);
    setAdded(pass.slug);
  }

  return (
    <ul className="mt-10 md:mt-12">
      {passes.map((pass, i) => (
        <PassRow
          key={pass.slug}
          pass={pass}
          numeral={String(i + 1).padStart(2, "0")}
          held={lines.find((line) => line.slug === passLineSlug(pass.slug))?.quantity ?? 0}
          added={added === pass.slug}
          failed={failed === pass.slug}
          onAdd={() => add(pass)}
        />
      ))}
    </ul>
  );
}

/**
 * One pass.
 *
 * Three columns from `lg`: the plate, then what the pass is, then what it
 * carries and what it costs. Below that they stack in the same order, which is
 * the order someone reads them in anyway — picture, name, terms, price,
 * action — so the phone gets the same argument in one column rather than a
 * rearranged one.
 */
function PassRow({
  pass,
  numeral,
  held,
  added,
  failed,
  onAdd,
}: {
  pass: Pass;
  numeral: string;
  held: number;
  added: boolean;
  failed: boolean;
  onAdd: () => void;
}) {
  const headingId = `pass-${pass.slug}`;

  return (
    <Reveal
      as="li"
      variant="fadeIn"
      className="border-t border-line py-10 first:border-t-0 first:pt-0 md:py-14 md:first:pt-0"
    >
      <div className="grid grid-cols-12 items-start gap-x-6 gap-y-8 lg:gap-x-12">
        {/* --- the plate ------------------------------------------------ */}
        {/* Optional on the data model: a pass with no photograph on file
            simply sets none, and the two text columns widen to fill it. */}
        {pass.image ? (
          <div className="col-span-12 sm:col-span-4 lg:col-span-3">
            <div className="relative aspect-[3/2] overflow-hidden rounded-sm bg-surface-alt sm:aspect-square">
              <Image
                src={pass.image.src}
                alt={pass.image.alt}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        {/* --- what it is ----------------------------------------------- */}
        <div
          className={cn(
            "col-span-12",
            pass.image ? "sm:col-span-8 lg:col-span-5" : "lg:col-span-6",
          )}
        >
          <p className={cn(TERM, "tabular-nums")}>
            {/* Decorative: the list carries the order, and reading "zero one"
                before every pass name is noise. */}
            <span aria-hidden>{numeral}</span>
          </p>

          <h3
            id={headingId}
            className="mt-3 text-[1.6rem] font-light leading-[1.15] tracking-[-0.015em] text-text md:text-[1.85rem]"
          >
            {pass.name}
          </h3>

          <p className="mt-4 max-w-[32rem] text-body leading-[1.85] text-text/80">
            {pass.description}
          </p>

          {/* Stated only where the data states it — see {@link Pass}. */}
          {pass.sessions !== undefined || pass.validity ? (
            <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5">
              {pass.sessions !== undefined ? (
                <div>
                  <dt className={TERM}>Sessions</dt>
                  <dd className="mt-2 text-body tabular-nums text-text">{pass.sessions}</dd>
                </div>
              ) : null}
              {pass.validity ? (
                <div>
                  <dt className={TERM}>Valid for</dt>
                  <dd className="mt-2 text-body text-text">{pass.validity}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>

        {/* --- what it carries, and the action -------------------------- */}
        <div className="col-span-12 lg:col-span-4">
          {pass.benefits.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {pass.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-3.5">
                  {/* A hairline rather than a tick. The tick is the badge of
                      the pricing table this page is deliberately not. */}
                  <span aria-hidden className="mt-[0.85em] h-px w-3.5 shrink-0 bg-primary" />
                  <span className="text-body leading-[1.7] text-text/85">{benefit}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <Action
            pass={pass}
            held={held}
            added={added}
            failed={failed}
            onAdd={onAdd}
          />
        </div>
      </div>
    </Reveal>
  );
}

/**
 * The price and the button, or the reason there is neither.
 *
 * A pass with no price on it is a real state of the data rather than a bug —
 * the studio can write a pass before it has decided what to charge for it —
 * and the honest thing to show is a sentence and a way to ask, not a button
 * that adds nothing to the basket.
 */
function Action({
  pass,
  held,
  added,
  failed,
  onAdd,
}: {
  pass: Pass;
  held: number;
  added: boolean;
  failed: boolean;
  onAdd: () => void;
}) {
  if (!pass.price) {
    return (
      <p className="mt-8 border-l-2 border-terracotta pl-4 text-fine leading-[1.7] text-text">
        This pass is not on sale online yet.{" "}
        <Link
          href="/contact"
          className="border-b border-text/30 pb-0.5 transition-colors duration-300 ease-soft hover:border-text"
        >
          Ask the Maison about it
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="mt-8 border-t border-line pt-7">
      <p className="text-[1.5rem] font-medium leading-none tabular-nums tracking-[-0.01em] text-text">
        {formatMoney(pass.price.amount, pass.price.currency)}
      </p>

      <button
        type="button"
        onClick={onAdd}
        /*
          Named, because "Add to booking" three times down one page says
          nothing about which of the three a screen reader has landed on. The
          visible words are kept at the front of the accessible name rather
          than replaced by it — WCAG's Label in Name asks that anyone saying
          what they can see ("add to booking") actually hits the control.
        */
        aria-label={`Add to booking: ${pass.name}`}
        className={cn(
          "group mt-6 inline-flex w-full min-h-11 items-center justify-center gap-2.5 rounded-sm",
          "bg-primary px-8 py-4 text-action font-medium uppercase leading-none tracking-eyebrow",
          "text-on-primary press-in transition-colors duration-300 ease-soft hover:bg-primary/90 sm:w-auto",
        )}
      >
        Add to booking
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </button>

      {/*
        Mounted whether or not it has anything in it, so a screen reader is
        watching the region before the confirmation arrives — a live region
        added to the page at the same moment as its own contents is announced
        by some combinations and silently by others.

        Not a modal, and not a toast that takes the page over: the answer to
        "did that work?" belongs beside the button that was pressed, and the
        way on is a link rather than a redirect, because someone buying two
        passes should not be thrown to the checkout after the first.
      */}
      <div role="status" aria-live="polite">
        {failed ? (
          <p className="mt-5 border-l-2 border-terracotta pl-4 text-fine leading-[1.7] text-text">
            We could not add this pass to your booking. Please try again, or{" "}
            <Link
              href="/contact"
              className="border-b border-text/30 pb-0.5 transition-colors duration-300 ease-soft hover:border-text"
            >
              contact the Maison
            </Link>
            .
          </p>
        ) : added ? (
          <p className="mt-5 text-fine leading-[1.7] text-text">
            Added to your booking{held > 1 ? ` — ${held} in total` : ""}.{" "}
            <Link
              href="/checkout"
              className="border-b border-text/40 pb-0.5 transition-colors duration-300 ease-soft hover:border-text"
            >
              View your booking
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Nothing on offer.
 *
 * Reachable the moment the CMS returns an empty list, which is a state the
 * studio can put the site into by unpublishing its passes. One sentence and
 * the way back into the programme — the same shape <EmptyCart> uses, because
 * it is the same situation.
 */
function NoPasses() {
  return (
    <Reveal className="mt-10 border-t border-line pt-10 md:mt-12 md:pt-12">
      <p className="max-w-[32rem] text-[1.35rem] font-light leading-[1.3] tracking-[-0.015em] text-text md:text-[1.5rem]">
        There are no passes on offer just now.
      </p>
      <p className="mt-5 max-w-[32rem] text-body leading-[1.85] text-text/75">
        The Maison is between offers. Every session in the programme can still be booked on its
        own in the meantime.
      </p>
      <Link
        href="/events"
        className={cn(
          "group mt-8 inline-flex min-h-11 items-center justify-center gap-2.5 rounded-sm",
          "bg-primary px-8 py-4 text-action font-medium uppercase leading-none tracking-eyebrow",
          "text-on-primary press-in transition-colors duration-300 ease-soft hover:bg-primary/90",
        )}
      >
        Explore events
        <span
          aria-hidden
          className="transition-transform duration-500 ease-editorial motion-safe:group-hover:translate-x-1"
        >
          &#8594;
        </span>
      </Link>
    </Reveal>
  );
}
