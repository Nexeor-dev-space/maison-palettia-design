import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { Eyebrow, forScript } from "@/components/ui/SectionHeader";
import { COMMUNITY, EVENT_PLATES, WHAT_SETS_US_APART } from "@/lib/brand";

/**
 * Homepage 06 — the community, and the page's one immersive pause.
 *
 * THE PAUSE. After two sections of reading and choosing, a photograph gets the
 * full width. It is held still while the page moves past it — a fixed image
 * inside a clipped frame, which gives the effect `background-attachment:
 * fixed` is usually reached for, without the property iOS ignores and every
 * browser repaints expensively. Under reduced motion it is an ordinary image.
 *
 * THE WORDS ARE ON A PANEL, NOT ON THE PICTURE. The frame is a bright white
 * table, and making type legible across it would take a scrim dark enough to
 * turn it grey. So the deck's own device is used instead: a solid panel laid
 * over the imagery, overlapping the photograph's lower edge so the two read as
 * one composition.
 *
 * THEN THE PROOF, KEPT SMALL. What sets the Maison apart is the deck's list
 * (p.11). Beside it, the three photographs on this site taken at the studio's
 * own events — hands and finished pieces, no faces; see EVENT_PLATES for why.
 * They are phone photos, so they are set as small plates and never enlarged.
 */
export function CommunityMoment() {
  return (
    <section aria-labelledby="community-heading" className="relative bg-surface">
      {/* ---- the pause ---- */}
      <div className="relative h-[62svh] min-h-[24rem] overflow-hidden [clip-path:inset(0)] md:h-[78svh]">
        <div className="absolute inset-0 motion-safe:fixed motion-safe:h-screen">
          <Image
            src="/images/experience/community-table.jpg"
            alt="A long white workshop table: a hand with a fine brush over watercolour paper and an open palette, a blue fabric bag beside it, and other people's hands at work further along."
            fill
            sizes="100vw"
            style={{ objectPosition: "38% 50%" }}
            className="object-cover"
          />
        </div>
      </div>

      <Container className="relative">
        <Reveal className="-mt-24 ml-auto max-w-[44rem] bg-cream p-8 sm:p-10 md:-mt-40 md:p-14">
          <Eyebrow>The Maison experience</Eyebrow>
          <h2
            id="community-heading"
            className="mt-6 heading-script text-script-compact text-text"
          >
            {COMMUNITY.heading}.
          </h2>
          <p className="mt-6 text-lead leading-[1.7] text-text">{COMMUNITY.body}</p>
          <p className="mt-6 heading-script text-[1.9rem] leading-[1.2] text-primary md:text-[2.3rem]">
            {forScript(COMMUNITY.closer)}
          </p>
        </Reveal>
      </Container>

      {/* ---- what sets it apart, and the proof ---- */}
      <Container className="py-[5rem] md:py-section lg:pb-section-lg">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-10">
          <div className="col-span-12 lg:col-span-6">
            <Reveal>
              <h3 className="text-label font-semibold uppercase tracking-eyebrow text-text">
                What sets Maison Palettia apart
              </h3>
            </Reveal>
            <ul className="mt-8 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {WHAT_SETS_US_APART.map((point, i) => (
                <li key={point.slug} className="border-t border-text/20 py-6">
                  <Reveal delay={i * 0.06}>
                    <p className="text-lead font-semibold leading-snug text-text">{point.name}</p>
                    <p className="mt-2 text-body leading-[1.75] text-text/85">{point.description}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <Reveal>
              <h3 className="text-label font-semibold uppercase tracking-eyebrow text-text">
                From our tables
              </h3>
            </Reveal>
            {/*
              Three plates of three shapes, arranged rather than gridded: the
              tall one leads, the two others stack beside it. Each is sized so
              it is never drawn wider than the phone photo it came from.
            */}
            <div className="mt-8 grid grid-cols-5 gap-3 sm:gap-4">
              <Reveal variant="fadeIn" className="col-span-3 row-span-2">
                <Plate plate={EVENT_PLATES[0]} aspect="aspect-[3/4]" sizes="(min-width: 1024px) 22vw, 56vw" />
              </Reveal>
              <Reveal variant="fadeIn" delay={0.08} className="col-span-2">
                <Plate plate={EVENT_PLATES[1]} aspect="aspect-[3/4]" sizes="(min-width: 1024px) 14vw, 36vw" />
              </Reveal>
              <Reveal variant="fadeIn" delay={0.16} className="col-span-2">
                <Plate plate={EVENT_PLATES[2]} aspect="aspect-square" sizes="(min-width: 1024px) 14vw, 36vw" />
              </Reveal>
            </div>
            <p className="mt-4 text-fine leading-[1.6] text-text/85">
              Pieces made at Maison Palettia workshops and activations.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Plate({
  plate,
  aspect,
  sizes,
}: {
  plate: (typeof EVENT_PLATES)[number];
  aspect: string;
  sizes: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-sm bg-cream ${aspect}`}>
      <Image src={plate.src} alt={plate.alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
