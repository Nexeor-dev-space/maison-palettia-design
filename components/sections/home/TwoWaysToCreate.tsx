import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { INK } from "@/components/sections/hero/composition";
import { BlobButton } from "@/components/ui/BlobButton";
import { DoodleMark } from "@/components/ui/DoodleMark";
import { WORKSHOP_JOURNEY } from "@/lib/brand";
import { getCreativeExperiences } from "@/lib/experiences";
import { getMallPartners } from "@/lib/partners";
import {
  formatPrice,
  formatSessionDate,
  getUpcomingWorkshops,
  isFullyBooked,
  sessionDateParts,
  sessionTimeRange,
  spotsLabel,
} from "@/lib/workshops";

/**
 * Walk in, or book a seat — the one decision this studio asks a visitor to
 * make, as two colour fields meeting on a hard seam.
 *
 * ==========================================================================
 * A SPLIT, NOT TWO CARDS
 * ==========================================================================
 *
 * The brief asked for these two to carry equal visual weight and not to look
 * like two ordinary cards, and the old version did exactly what it was told
 * not to: a thin vertical rule with a plate and a list either side of it, in
 * the site's old hairline-and-script language. Nothing about it said that one
 * of these needs no booking and the other needs a date.
 *
 * So the section is now two grounds that meet. White Rock on the left, where
 * you can simply turn up; Deep Lilac on the right, where there is a date and a
 * seat with your name on it. Both run to the edges of the screen, both are the
 * same width, and the seam between them is a real edge rather than a rule —
 * which is the whole point of colour blocking and the one thing a two-column
 * grid can never say.
 *
 * WHAT STRADDLES THE SEAM. One cut-out, sitting across the join. It is the
 * only thing on the page that belongs to both halves, and it is what stops
 * the split reading as two unrelated panels.
 *
 * Everything factual is the real record: the walk-in list is the DIY
 * experiences, the dates and prices are the session objects themselves through
 * the same formatters the listing and the event pages use, and the location is
 * the one partner that exists. Nothing here is written for the layout.
 */

/**
 * One fact in a half: its label, and what it says.
 *
 * ==========================================================================
 * NO RULE BETWEEN THEM, AT THE CLIENT'S ASK — AND THE SITE AGREES
 * ==========================================================================
 *
 * These were ruled rows: a hairline over every term, label in a fixed left
 * column, value beside it. globals.css already says what to do instead —
 * "Hierarchy on this site is made with space, ground colour and type — a
 * border is only ever there to state where a measure begins or ends" — and a
 * rule between two facts states nothing of the sort.
 *
 * So the grouping is done by proximity, which is what replaces a rule: the
 * label sits tight above its own value (10px) and the next fact starts a long
 * way below it (32px). Three times the gap inside a pair as between pairs is
 * enough for the eye to bundle them without a line being drawn, and it is the
 * same stacked shape the footer's address columns already use.
 *
 * The value also went from 15px to body size. It is the answer to the
 * question the label asks — the readable part of this box — and the client
 * has twice now said the copy is set too small.
 *
 * ==========================================================================
 * WHY THE INK IS SET BY THE HALF AND NOT BY THIS COMPONENT
 * ==========================================================================
 *
 * The two halves are White Rock and Deep Lilac, and Deep Lilac is the hardest
 * ground in this palette. Measured, the near-white it carries reads 4.67:1 at
 * FULL strength and 3.61:1 at the 80% this component used to apply — under
 * the 4.5:1 body copy owes. The same 80% on charcoal over White Rock is
 * 5.5:1 and perfectly safe.
 *
 * One opacity cannot serve both, so each half declares `--quiet` for itself:
 * 0.8 on the pale side where softness is free, 1 on the lilac where it is
 * not. The label is full strength on both — at 12px it owes 4.5:1 and it was
 * failing at 3.14:1 on the lilac. It stays quiet by being small and tracked,
 * which costs no contrast at all.
 */
function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="[&+div]:mt-6">
      <dt className="text-label font-bold uppercase tracking-eyebrow">{term}</dt>
      <dd className="mt-2.5 text-body leading-[1.7] opacity-[var(--quiet,1)]">{children}</dd>
    </div>
  );
}

export async function TwoWaysToCreate() {
  const [experiences, sessions, partners] = await Promise.all([
    getCreativeExperiences(),
    getUpcomingWorkshops(3),
    getMallPartners(),
  ]);

  const walkIn = experiences.filter((e) => e.kind === "diy");
  const scheduled = sessions.filter((s) => s.kind !== "diy");
  const home = partners.length === 1 ? partners[0] : undefined;
  const [diyStep, scheduledStep] = WORKSHOP_JOURNEY;
  const diyPlate = walkIn.find((e) => e.image)?.image;
  const scheduledPlate = experiences.find((e) => e.kind === "scheduled" && e.image)?.image;

  return (
    <section
      id="two-ways"
      aria-labelledby="two-ways-heading"
      className="relative isolate overflow-hidden"
    >
      <h2 id="two-ways-heading" className="sr-only">
        Walk in, or book a seat
      </h2>

      {/*
        MEASURED, THEN TIGHTENED. The two halves came to 1261px — a screen and
        a half for two columns of the same five facts, which is the "these
        cards look very lengthy" the client is describing. Nothing was cut:
        every line of copy, both pictures, all five terms and both actions are
        still here. What went was air — 7rem of padding at each end down to
        5rem, the pictures from 16:10 to 16:9, and the gaps between the fact
        rows from 8 to 6. The figure after is in the note on this file's own
        commit; the point is that it is the spacing that was long, not the
        content.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* ---------------------------------------------------- walk in ---- */}
        {/* `--quiet` is the secondary ink for this half — see <Term>. Charcoal
            at 80% on White Rock is 5.5:1, so the softness costs nothing here. */}
        <div
          className="relative bg-cream px-gutter py-[3.5rem] text-text md:py-[4.5rem] lg:py-[5rem] lg:pl-[8%] lg:pr-[6%]"
          style={{ "--quiet": 0.8 } as React.CSSProperties}
        >
          <Reveal>
            {/* The words are Charcoal, not Terracotta. At 12px this label owes
                4.5:1 and Warm Terracotta on White Rock measures 2.44:1 — it
                was unreadable. The colour keeps its job on the mark beside it,
                which is decorative and owes no ratio at all. */}
            <p className="flex items-center gap-3 text-label font-bold uppercase tracking-eyebrow text-text">
              <span aria-hidden className="block w-4 shrink-0">
                <DoodleMark name="dot" color={INK.terracotta} />
              </span>
              No booking
            </p>
          </Reveal>

          {/*
            SIZED FOR MONTSERRAT, WHICH IS NOT CONDENSED.

            This was `clamp(2.75rem, 1.4rem+5.4vw, 5.5rem)` — built for Bebas
            Neue, which sets caps about as narrow as a face can. Measured on
            the page, Montserrat sets the same string 1.8x wider: "BOOK A SEAT"
            at 88px went from 343px to 619px, and the column it sits in holds
            519px at this width. Re-pointing the token alone would have run the
            longer of the two lines straight out of its half.

            The clamp is now solved from the column rather than picked. Each
            half is 50vw less 8% and 6% of padding, so the room is 0.36vw, and
            Montserrat sets this string at 7.03x its own size — which puts the
            line at 84% of the measure at every width from 1024 up, and 78% on
            a phone where the column is the full page.

            Bold and tight, because Bebas read as emphatic by being narrow and
            Montserrat cannot; weight and negative tracking do that job here.
            `leading-[0.88]` went with it — that was a line box drawn for a
            face with almost no descender room.
          */}
          <Reveal delay={0.06}>
            <p className="mt-5 text-[clamp(2.25rem,4.3vw,4.25rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] [font-family:var(--font-deck)] [font-synthesis:none]">
              Walk in
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-5 max-w-[34ch] text-[1.0625rem] leading-[1.7] text-text/85">
              {diyStep.description}
            </p>
          </Reveal>

          {/*
            A HEIGHT AT `lg`, NOT A RATIO. These are detail shots — a flat-lay
            of painted totes, candles on a plate — so they crop horizontally
            without losing their subject, and a ratio at this width made each
            of them the tallest block in its half. `max-height` cannot do it:
            with an aspect-ratio set, capping the height takes the width down
            with it and the picture stops filling its column.
          */}
          <Reveal variant="imageReveal" delay={0.18} className="mt-7">
            <span className="plate relative block aspect-[16/9] w-full overflow-hidden rounded-[1.25rem] lg:aspect-auto lg:h-[17rem]">
              {diyPlate ? (
                <Image
                  src={diyPlate.src}
                  alt={diyPlate.alt}
                  fill
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  style={{ objectPosition: diyPlate.position ?? "50% 50%" }}
                  className="object-cover"
                />
              ) : null}
            </span>
          </Reveal>

          <dl className="mt-7">
            <Term term="Booking">Not needed. Turn up and start.</Term>
            <Term term="Make">
              {walkIn.map((e, i) => (
                <span key={e.slug}>
                  {e.name}
                  {e.status ? <span className="opacity-60"> ({e.status.toLowerCase()})</span> : null}
                  {i < walkIn.length - 1 ? <span aria-hidden> · </span> : null}
                </span>
              ))}
            </Term>
            {home ? (
              <Term term="Where">
                {home.name}, {home.locality}
              </Term>
            ) : null}
          </dl>

          <Reveal delay={0.24}>
            {/* This half is White Rock, so the button keeps the original
                Light Sage flood — measured dE 15.9 against the ground behind
                it, which is a different hue at nearly the same lightness. It
                is only on the Light Sage sheets that sage floods to nothing. */}
            <BlobButton href="/locations" tone="sage" className="mt-8 min-h-[3.25rem] px-7">
              Find the studio
            </BlobButton>
          </Reveal>
        </div>

        {/* ------------------------------------------------ book a seat ---- */}
        {/* No `--quiet` below 1 on this half. Deep Lilac is the hardest ground
            in the palette: the near-white on it is 4.67:1 at full strength and
            3.61:1 at 80%, under the 4.5:1 body copy owes. It defaults to 1. */}
        <div
          className="relative bg-primary px-gutter py-[3.5rem] text-surface md:py-[4.5rem] lg:py-[5rem] lg:pl-[6%] lg:pr-[8%]"
          style={{ "--quiet": 1 } as React.CSSProperties}
        >
          <Reveal>
            {/* Same again on the harder ground: Soft Lavender on Deep Lilac is
                2.74:1. The near-white this half reads in is 4.67:1, and the
                lavender stays on the mark. */}
            <p className="flex items-center gap-3 text-label font-bold uppercase tracking-eyebrow text-surface">
              <span aria-hidden className="block w-4 shrink-0">
                <DoodleMark name="dot" color={INK.lavender} />
              </span>
              A date and a seat
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <p className="mt-5 text-[clamp(2.25rem,4.3vw,4.25rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] [font-family:var(--font-deck)] [font-synthesis:none]">
              Book a seat
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            {/* Full strength, not /85: that measured 3.85:1 on this ground. */}
            <p className="mt-5 max-w-[34ch] text-[1.0625rem] leading-[1.7] text-surface">
              {scheduledStep.description}
            </p>
          </Reveal>

          <Reveal variant="imageReveal" delay={0.18} className="mt-7">
            <span className="plate relative block aspect-[16/9] w-full overflow-hidden rounded-[1.25rem] lg:aspect-auto lg:h-[17rem]">
              {scheduledPlate ? (
                <Image
                  src={scheduledPlate.src}
                  alt={scheduledPlate.alt}
                  fill
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  style={{ objectPosition: scheduledPlate.position ?? "50% 50%" }}
                  className="object-cover"
                />
              ) : null}
            </span>
          </Reveal>

          <dl className="mt-7">
            <Term term="Booking">Online, for a set date and time.</Term>
            <Term term="Next dates">
              {scheduled.length === 0 ? (
                "Dates are being set — the events page has them first."
              ) : (
                <ul className="flex flex-col gap-3">
                  {scheduled.map((session) => {
                    const { weekday } = sessionDateParts(session.startsAt);
                    const { start } = sessionTimeRange(session.startsAt, session.durationMinutes);
                    const full = isFullyBooked(session);
                    return (
                      <li key={session.slug}>
                        <Link
                          href={`/events/${session.slug}`}
                          className="group block transition-opacity duration-300 ease-soft hover:opacity-80"
                        >
                          <span className="block font-semibold">{session.title}</span>
                          <span className="block opacity-[var(--quiet,1)]">
                            <time dateTime={session.startsAt}>
                              {weekday} {formatSessionDate(session.startsAt)}
                            </time>
                            {" · "}
                            {start}
                            {session.venue ? ` · ${session.venue.name}` : ""}
                          </span>
                          <span className="block opacity-[var(--quiet,1)]">
                            {formatPrice(session.price)}
                            {" · "}
                            <span className={full ? "font-semibold" : undefined}>
                              {full ? "Fully booked" : spotsLabel(session)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Term>
          </dl>

          <Reveal delay={0.24}>
            {/* White Rock, because this half IS Deep Lilac — see the tone
                note in <BlobButton>. */}
            <BlobButton href="/events#scheduled" tone="cream" className="mt-8 min-h-[3.25rem] px-7">
              See the dates
            </BlobButton>
          </Reveal>
        </div>
      </div>

      {/*
        The one thing belonging to both halves, sitting across the join. On a
        phone the halves stack, so it moves to the horizontal seam instead —
        the same job, the other axis.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden w-[9rem] -translate-x-1/2 -translate-y-1/2 lg:block"
      >
        <DoodleMark name="splash" color={INK.terracotta} delay={300} />
      </span>
    </section>
  );
}
